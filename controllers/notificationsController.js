// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V23 - TOUT DANS ODOO (SANS POSTGRESQL)
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère les notifications de l'utilisateur connecté
 * @route GET /api/notifications
 * @access Authentifié
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        
        console.log('🔔 [getNotifications] User:', userId);
        
        // ✅ CHARGER UNIQUEMENT DEPUIS ODOO (pas de PostgreSQL)
        const odooMessages = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'search_read',
            args: [[
                ['message_type', '=', 'notification'],
                ['date', '>=', getThirtyDaysAgo()]
            ]],
            kwargs: {
                fields: ['id', 'subject', 'body', 'date', 'needaction', 'author_id'],
                order: 'date DESC',
                limit: 50
            }
        });
        
        // Formater les notifications
        const notifications = odooMessages.map(n => ({
            id: n.id,
            type: 'info',
            priority: 'normal',
            title: n.subject || 'Notification',
            message: stripHtmlTags(n.body || '').substring(0, 200),
            created_at: n.date,
            read: !n.needaction,
            sender_id: n.author_id ? n.author_id[1] : 'Système'
        }));
        
        console.log(`✅ [getNotifications] ${notifications.length} notifications Odoo trouvées`);
        
        res.json({
            status: 'success',
            data: notifications
        });
        
    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des notifications'
        });
    }
};

/**
 * Envoie une notification à un ou plusieurs utilisateurs
 * @route POST /api/notifications/send
 * @access ADMIN + COLLABORATEUR uniquement
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId = req.user.odooUid;
        const senderEmail = req.user.email;
        const senderRole = req.user.profile;
        const companyId = req.body.companyId || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);

        // ✅ VÉRIFICATION PERMISSIONS
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error: 'Seuls les Administrateurs et Collaborateurs peuvent envoyer des notifications'
            });
        }

        // ✅ VALIDATION
        if (!title || !message) {
            return res.status(400).json({
                status: 'error',
                error: 'Titre et message requis'
            });
        }

        if (!recipientType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Type de destinataire et liste de destinataires requis'
            });
        }

        // ✅ RÉCUPÉRER LES IDS DES UTILISATEURS DESTINATAIRES
        let userIds = [];
        let targetUsers = [];

        if (recipientType === 'all' || (recipients && recipients.includes('all'))) {
            console.log('📋 [sendNotification] Type: Tous les utilisateurs');
            
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });
            
            userIds = targetUsers.map(u => u.id);

        } else if (recipientType === 'role') {
            console.log('📋 [sendNotification] Type: Par rôle -', recipients[0]);
            
            const targetRole = recipients[0];
            
            const allUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });

            for (const user of allUsers) {
                const groups = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'res.groups',
                    method: 'search_read',
                    args: [[['user_ids', 'in', [user.id]]]],
                    kwargs: { fields: ['name'], limit: 10 }
                });

                const groupNames = groups.map(g => g.name.toLowerCase());
                let userRole = 'USER';

                if (groupNames.some(name => name.includes('admin') || name.includes('settings'))) {
                    userRole = 'ADMIN';
                } else if (groupNames.some(name => name.includes('manager') || name.includes('accountant'))) {
                    userRole = 'COLLABORATEUR';
                } else if (groupNames.some(name => name.includes('cash') || name.includes('caisse'))) {
                    userRole = 'CAISSIER';
                }

                if (userRole === targetRole) {
                    targetUsers.push(user);
                    userIds.push(user.id);
                }
            }

        } else if (recipientType === 'specific') {
            console.log('📋 [sendNotification] Type: Utilisateurs spécifiques');
            
            userIds = recipients.map(id => parseInt(id));

            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['id', 'in', userIds]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${userIds.length} utilisateur(s)`);

        if (userIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        // ✅ CRÉER LES NOTIFICATIONS UNIQUEMENT DANS ODOO
        const notificationIds = [];
        const successfulRecipients = [];
        const failedRecipients = [];

        for (const user of targetUsers) {
            try {
                const messageId = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.message',
                    method: 'create',
                    args: [{
                        message_type: 'notification',
                        subtype_id: 1,
                        body: `<div style="font-family: Arial, sans-serif;">
                                <h3 style="color: #2563eb; margin-bottom: 10px;">${title}</h3>
                                <p style="color: #374151; line-height: 1.6;">${message}</p>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px;">
                                    <strong>Priorité:</strong> ${getPriorityLabel(priority)} | 
                                    <strong>Type:</strong> ${getTypeLabel(type)} | 
                                    <strong>Envoyé par:</strong> ${senderEmail}
                                </p>
                               </div>`,
                        subject: title,
                        author_id: senderId,
                        needaction: true,
                        record_name: `Notification - ${type}`
                    }],
                    kwargs: {}
                });

                notificationIds.push(messageId);
                
                successfulRecipients.push({
                    id: user.id,
                    name: user.name,
                    email: user.email || user.login,
                    channel: 'notification',
                    status: 'sent'
                });

            } catch (userError) {
                console.warn(`⚠️ [sendNotification] Erreur envoi à user ${user.id}:`, userError.message);
                
                failedRecipients.push({
                    id: user.id,
                    name: user.name,
                    email: user.email || user.login,
                    channel: 'notification',
                    status: 'failed'
                });
            }
        }

        console.log(`✅ [sendNotification] ${notificationIds.length} notifications créées`);

        res.json({
            status: 'success',
            message: `Notifications envoyées à ${successfulRecipients.length} utilisateur(s)`,
            data: {
                count: successfulRecipients.length,
                sent_count: successfulRecipients.length,
                failed_count: failedRecipients.length,
                total_recipients: targetUsers.length,
                recipients: [...successfulRecipients, ...failedRecipients],
                notification_ids: notificationIds
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

/**
 * Marque une notification comme lue
 * @route PATCH /api/notifications/:id/read
 * @access Authentifié
 */
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.user.odooUid;

        console.log(`✅ [markAsRead] Notification ${notificationId} pour user ${userId}`);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'write',
            args: [[notificationId], { needaction: false }],
            kwargs: {}
        });

        res.json({
            status: 'success',
            message: 'Notification marquée comme lue'
        });

    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la mise à jour'
        });
    }
};

/**
 * Supprime une notification
 * @route DELETE /api/notifications/:id
 * @access Authentifié
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.user.odooUid;

        console.log(`🗑️ [deleteNotification] Notification ${notificationId} pour user ${userId}`);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'unlink',
            args: [[notificationId]],
            kwargs: {}
        });

        res.json({
            status: 'success',
            message: 'Notification supprimée'
        });

    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la suppression'
        });
    }
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getThirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0] + ' 00:00:00';
}

function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

function getPriorityLabel(priority) {
    const labels = {
        'low': '🟢 Basse',
        'normal': '🔵 Normale',
        'high': '🟠 Haute',
        'urgent': '🔴 Urgente'
    };
    return labels[priority] || '🔵 Normale';
}

function getTypeLabel(type) {
    const labels = {
        'info': 'ℹ️ Information',
        'alert': '⚠️ Alerte',
        'reminder': '📅 Rappel',
        'invoice': '📄 Facture',
        'report': '📊 Rapport'
    };
    return labels[type] || 'ℹ️ Information';
}
