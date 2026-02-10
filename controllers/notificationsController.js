// =============================================================================
// FICHIER : controllers/notificationsController.js
// Description : Gestion des notifications (ODOO UNIQUEMENT)
// Version : V1 - Compatible avec ton architecture
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
        const companyId = req.query.companyId || req.user.selectedCompanyId;
        
        console.log('🔔 [getNotifications] User:', userId, '| Company:', companyId);
        
        // Charger les notifications Odoo des 30 derniers jours
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
        
        // Formater pour le frontend
        const formattedNotifications = odooMessages.map(n => ({
            id: n.id,
            type: 'info',
            priority: 'normal',
            title: n.subject || 'Notification',
            message: stripHtmlTags(n.body || '').substring(0, 200),
            created_at: n.date,
            read: !n.needaction,
            sender_id: n.author_id ? n.author_id[1] : 'Système'
        }));
        
        console.log(`✅ [getNotifications] ${formattedNotifications.length} notifications trouvées`);
        
        res.json({
            status: 'success',
            data: formattedNotifications
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

        console.log('📤 [sendNotification] Par:', senderEmail, '| Type:', recipientType);

        // Vérification permissions
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error: 'Permission refusée'
            });
        }

        // Validation
        if (!title || !message) {
            return res.status(400).json({
                status: 'error',
                error: 'Titre et message requis'
            });
        }

        // Récupérer les utilisateurs cibles
        let targetUsers = [];

        if (recipientType === 'all' || (Array.isArray(recipients) && recipients.includes('all'))) {
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { fields: ['id', 'name', 'email', 'login'] }
            });
        } else if (recipientType === 'specific' && Array.isArray(recipients)) {
            const userIds = recipients.map(id => parseInt(id));
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['id', 'in', userIds]]],
                kwargs: { fields: ['id', 'name', 'email', 'login'] }
            });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${targetUsers.length} utilisateur(s)`);

        // Créer les notifications
        const notificationIds = [];
        const successfulRecipients = [];

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
                                <h3 style="color: #2563eb;">${title}</h3>
                                <p>${message}</p>
                                <hr style="margin: 20px 0;">
                                <p style="color: #6b7280; font-size: 12px;">
                                    <strong>Priorité:</strong> ${getPriorityLabel(priority)} | 
                                    <strong>Type:</strong> ${getTypeLabel(type)} | 
                                    <strong>De:</strong> ${senderEmail}
                                </p>
                               </div>`,
                        subject: title,
                        author_id: senderId,
                        needaction: true
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
                console.warn(`⚠️ Erreur user ${user.id}:`, userError.message);
            }
        }

        console.log(`✅ [sendNotification] ${notificationIds.length} notifications créées`);

        res.json({
            status: 'success',
            message: `Notifications envoyées à ${successfulRecipients.length} utilisateur(s)`,
            data: {
                count: successfulRecipients.length,
                recipients: successfulRecipients,
                notification_ids: notificationIds
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de l\'envoi'
        });
    }
};

/**
 * Marque une notification comme lue
 * @route PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'write',
            args: [[notificationId], { needaction: false }],
            kwargs: {}
        });

        res.json({ status: 'success', message: 'Marquée comme lue' });
    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur' });
    }
};

/**
 * Supprime une notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'unlink',
            args: [[notificationId]],
            kwargs: {}
        });

        res.json({ status: 'success', message: 'Supprimée' });
    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur' });
    }
};

// Fonctions utilitaires
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
