// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V2 - NOTIFICATIONS FONCTIONNELLES
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère les notifications de l'utilisateur connecté
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const companyId = req.query.companyId || req.user.selectedCompanyId;
        
        console.log('🔔 [getNotifications] User ID:', userId, '| Company:', companyId);
        
        // ✅ ÉTAPE 1 : Récupérer le partner_id de l'utilisateur
        const users = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'search_read',
            args: [[['id', '=', userId]]],
            kwargs: { fields: ['partner_id'], limit: 1 }
        });
        
        if (!users || users.length === 0) {
            console.error('❌ [getNotifications] Utilisateur introuvable');
            return res.status(404).json({
                status: 'error',
                error: 'Utilisateur introuvable'
            });
        }
        
        const partnerId = users[0].partner_id[0];
        console.log('👤 [getNotifications] Partner ID:', partnerId);
        
        // ✅ ÉTAPE 2 : Récupérer les notifications destinées à CE partner
        const odooMessages = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'search_read',
            args: [[
                ['model', '=', false],  // Messages système (pas liés à un document)
                ['res_id', '=', 0],
                ['partner_ids', 'in', [partnerId]],  // ✅ FILTRÉ PAR DESTINATAIRE
                ['date', '>=', getThirtyDaysAgo()]
            ]],
            kwargs: {
                fields: ['id', 'subject', 'body', 'date', 'needaction', 'author_id', 'record_name'],
                order: 'date DESC',
                limit: 50
            }
        });
        
        console.log(`📬 [getNotifications] ${odooMessages.length} messages bruts trouvés`);
        
        // ✅ ÉTAPE 3 : Formater pour le frontend
        const formattedNotifications = odooMessages.map(n => {
            // Extraire le type depuis record_name (ex: "Notification - alert")
            const recordName = n.record_name || '';
            let type = 'info';
            let priority = 'normal';
            
            if (recordName.includes('alert')) type = 'alert';
            else if (recordName.includes('reminder')) type = 'reminder';
            else if (recordName.includes('invoice')) type = 'invoice';
            else if (recordName.includes('report')) type = 'report';
            
            // Extraire la priorité depuis le body HTML
            const bodyText = stripHtmlTags(n.body || '');
            if (bodyText.includes('🔴 Urgente')) priority = 'urgent';
            else if (bodyText.includes('🟠 Haute')) priority = 'high';
            else if (bodyText.includes('🟢 Basse')) priority = 'low';
            
            return {
                id: n.id,
                type: type,
                priority: priority,
                title: n.subject || 'Notification',
                message: bodyText.substring(0, 200),
                created_at: n.date,
                read: !n.needaction,
                sender_id: n.author_id ? n.author_id[1] : 'Système'
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
 * @route POST /api/notifications/send
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

        if (!title || !message) {
            return res.status(400).json({
                status: 'error',
                error: 'Titre et message requis'
            });
        }

        // ✅ ÉTAPE 1 : Récupérer les utilisateurs cibles AVEC leur partner_id
        let targetUsers = [];

        if (recipientType === 'all' || (Array.isArray(recipients) && recipients.includes('all'))) {
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { fields: ['id', 'name', 'email', 'login', 'partner_id'] }  // ✅ AJOUTER partner_id
            });
        } else if (recipientType === 'specific' && Array.isArray(recipients)) {
            const userIds = recipients.map(id => parseInt(id));
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['id', 'in', userIds]]],
                kwargs: { fields: ['id', 'name', 'email', 'login', 'partner_id'] }  // ✅ AJOUTER partner_id
            });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${targetUsers.length} utilisateur(s)`);

        // ✅ ÉTAPE 2 : Créer les notifications avec partner_ids
        const notificationIds = [];
        const successfulRecipients = [];

        for (const user of targetUsers) {
            try {
                // Vérifier que le partner_id existe
                if (!user.partner_id || user.partner_id.length === 0) {
                    console.warn(`⚠️ User ${user.id} n'a pas de partner_id, skip`);
                    continue;
                }

                const partnerId = user.partner_id[0];

                const messageId = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.message',
                    method: 'create',
                    args: [{
                        message_type: 'notification',
                        subtype_id: 1,
                        model: false,  // ✅ Pas de modèle = message système
                        res_id: 0,     // ✅ Pas de ressource = message système
                        body: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                                <h3 style="color: #2563eb; margin-bottom: 15px;">${title}</h3>
                                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">${message}</p>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px;">
                                    <strong>Priorité:</strong> ${getPriorityLabel(priority)} | 
                                    <strong>Type:</strong> ${getTypeLabel(type)} | 
                                    <strong>De:</strong> ${senderEmail}
                                </p>
                               </div>`,
                        subject: title,
                        author_id: senderId,
                        partner_ids: [[6, 0, [partnerId]]],  // ✅ CRITIQUE : Assigner au partner
                        needaction: true,  // ✅ Marquer comme "à faire"
                        record_name: `Notification - ${type}`  // ✅ Pour identifier le type
                    }],
                    kwargs: {}
                });

                console.log(`✅ Message ${messageId} créé pour user ${user.id} (partner ${partnerId})`);

                notificationIds.push(messageId);
                successfulRecipients.push({
                    id: user.id,
                    name: user.name,
                    email: user.email || user.login,
                    channel: 'notification',
                    status: 'sent'
                });

            } catch (userError) {
                console.error(`❌ Erreur user ${user.id}:`, userError.message);
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
        console.error('Stack:', error.stack);
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
        const userId = req.user.odooUid;

        console.log(`✅ [markAsRead] Notification ${notificationId} pour user ${userId}`);

        // Récupérer le partner_id
        const users = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'search_read',
            args: [[['id', '=', userId]]],
            kwargs: { fields: ['partner_id'], limit: 1 }
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ status: 'error', error: 'Utilisateur introuvable' });
        }

        const partnerId = users[0].partner_id[0];

        // Marquer comme lu via mail.notification
        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.notification',
            method: 'search_read',
            args: [[
                ['mail_message_id', '=', notificationId],
                ['res_partner_id', '=', partnerId]
            ]],
            kwargs: { fields: ['id'], limit: 1 }
        }).then(async (notifications) => {
            if (notifications && notifications.length > 0) {
                await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.notification',
                    method: 'write',
                    args: [[notifications[0].id], { is_read: true }],
                    kwargs: {}
                });
            }
        });

        // Aussi marquer le message comme lu
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
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
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
