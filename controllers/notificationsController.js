// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V25 - FINALE SANS POSTGRESQL - 100% ODOO
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère les notifications de l'utilisateur connecté
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        
        console.log('🔔 [getNotifications] User:', userId);
        
        // Récupérer le partner_id de l'utilisateur
        const userData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[userId], ['partner_id']],
            kwargs: {}
        });
        
        if (!userData || userData.length === 0 || !userData[0].partner_id) {
            console.warn(`⚠️ [getNotifications] Partner non trouvé pour user ${userId}`);
            return res.json({ status: 'success', data: [] });
        }
        
        const partnerId = userData[0].partner_id[0];
        
        console.log(`👤 [getNotifications] Partner ID: ${partnerId}`);
        
        // Récupérer les notifications depuis mail.notification
        const notifications = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.notification',
            method: 'search_read',
            args: [[
                ['res_partner_id', '=', partnerId]
            ]],
            kwargs: {
                fields: ['id', 'mail_message_id', 'is_read', 'notification_type', 'notification_status'],
                order: 'id DESC',
                limit: 50
            }
        });
        
        console.log(`📬 [getNotifications] ${notifications.length} notifications trouvées`);
        
        // Récupérer les détails des messages
        const messageIds = notifications
            .map(n => n.mail_message_id ? n.mail_message_id[0] : null)
            .filter(Boolean);
        
        let messages = [];
        if (messageIds.length > 0) {
            messages = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'mail.message',
                method: 'search_read',
                args: [[['id', 'in', messageIds]]],
                kwargs: {
                    fields: ['id', 'subject', 'body', 'date', 'author_id'],
                    order: 'date DESC'
                }
            });
        }
        
        // Combiner notifications + messages
        const formattedNotifications = notifications.map(notif => {
            const message = messages.find(m => m.id === (notif.mail_message_id ? notif.mail_message_id[0] : null)) || {};
            
            return {
                id: notif.id,
                type: 'info',
                priority: 'normal',
                title: message.subject || 'Notification',
                message: stripHtmlTags(message.body || '').substring(0, 200),
                created_at: message.date || new Date().toISOString(),
                read: notif.is_read,
                sender_id: message.author_id ? message.author_id[1] : 'Système'
            };
        });
        
        console.log(`✅ [getNotifications] ${formattedNotifications.length} notifications formatées`);
        
        res.json({
            status: 'success',
            data: formattedNotifications
        });
        
    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des notifications'
        });
    }
};

/**
 * Envoie une notification à un ou plusieurs utilisateurs
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId = req.user.odooUid;
        const senderEmail = req.user.email;
        const senderRole = req.user.profile;
        const companyId = req.body.companyId || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);

        // Vérification permissions
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error: 'Seuls les Administrateurs et Collaborateurs peuvent envoyer des notifications'
            });
        }

        // Validation
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

        // Récupérer les utilisateurs destinataires
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
                    fields: ['id', 'name', 'email', 'login', 'partner_id'],
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
                    fields: ['id', 'name', 'email', 'login', 'partner_id'],
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
                    fields: ['id', 'name', 'email', 'login', 'partner_id'],
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

        // Récupérer les partner_ids
        const partnerIds = targetUsers
            .map(u => u.partner_id ? u.partner_id[0] : null)
            .filter(Boolean);

        if (partnerIds.length === 0) {
            console.error('🚨 [sendNotification] Aucun partner_id trouvé !');
            return res.status(400).json({
                status: 'error',
                error: 'Impossible de récupérer les destinataires'
            });
        }

        console.log(`👥 [sendNotification] Partner IDs:`, partnerIds);

        // ✅ CRÉER LE MESSAGE AVEC NOTIFICATION AUTOMATIQUE
        const messageId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'create',
            args: [{
                message_type: 'notification',
                subtype_id: 1,
                body: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; border-radius: 8px;">
                        <h3 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px;">${title}</h3>
                        <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">${message}</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                            <strong>Priorité:</strong> ${getPriorityLabel(priority)} | 
                            <strong>Type:</strong> ${getTypeLabel(type)} | 
                            <strong>Envoyé par:</strong> ${senderEmail}
                        </p>
                       </div>`,
                subject: title,
                author_id: senderId,
                needaction: true,
                record_name: `Notification - ${type}`,
                // ✅ CRUCIAL : Associer aux destinataires
                partner_ids: [[6, 0, partnerIds]],
                // ✅ FORCER LA CRÉATION DES NOTIFICATIONS
                notification_ids: [[0, 0, {
                    'notification_type': 'inbox',
                    'notification_status': 'sent'
                }]]
            }],
            kwargs: {}
        });

        console.log(`✅ [sendNotification] Message ${messageId} créé`);

        // Forcer la création des notifications pour chaque partner
        for (const partnerId of partnerIds) {
            try {
                await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.notification',
                    method: 'create',
                    args: [{
                        mail_message_id: messageId,
                        res_partner_id: partnerId,
                        notification_type: 'inbox',
                        is_read: false,
                        notification_status: 'sent'
                    }],
                    kwargs: {}
                });
                console.log(`✅ Notification créée pour partner ${partnerId}`);
            } catch (notifError) {
                console.warn(`⚠️ Erreur création notification pour partner ${partnerId}:`, notifError.message);
            }
        }

        // Récupérer les détails des destinataires pour le récapitulatif
        const successfulRecipients = targetUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email || user.login,
            channel: 'notification',
            status: 'sent'
        }));

        res.json({
            status: 'success',
            message: `Notifications envoyées à ${successfulRecipients.length} utilisateur(s)`,
            data: {
                count: successfulRecipients.length,
                sent_count: successfulRecipients.length,
                failed_count: 0,
                total_recipients: targetUsers.length,
                recipients: successfulRecipients,
                notification_ids: [messageId]
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.json({
            status: 'error',
            error: 'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

/**
 * Marque une notification comme lue
 */
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        console.log(`✅ [markAsRead] Notification ${notificationId}`);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.notification',
            method: 'write',
            args: [[notificationId], { is_read: true }],
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
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        console.log(`🗑️ [deleteNotification] Notification ${notificationId}`);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.notification',
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
