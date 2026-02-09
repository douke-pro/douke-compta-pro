const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère les notifications de l'utilisateur
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        console.log('🔔 [getNotifications] User:', userId);

        const notifications = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'search_read',
            args: [[
                ['message_type', '=', 'email'],
                ['date', '>=', getThirtyDaysAgo()]
            ]],
            kwargs: {
                fields: ['id', 'subject', 'body', 'date'],
                order: 'date DESC',
                limit: 50
            }
        });

        const formattedNotifications = notifications.map(n => ({
            id: n.id,
            type: 'info',
            title: n.subject || 'Notification',
            message: (n.body || '').replace(/<[^>]*>/g, '').substring(0, 150),
            timestamp: n.date,
            read: false
        }));

        res.json({ status: 'success', data: formattedNotifications });
    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur' });
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
        const senderRole = req.user.profile;
        const companyId = req.validatedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', req.user.email, '| Type:', type);

        // ✅ VÉRIFICATION PERMISSIONS
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

        // Récupérer les IDs des utilisateurs destinataires
        let userIds = [];

        if (recipientType === 'all' || (recipients && recipients.includes('all'))) {
            // Tous les utilisateurs de l'entreprise
            const users = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [companyId]]]],
                kwargs: { fields: ['id'] }
            });
            userIds = users.map(u => u.id);
        } else if (recipientType === 'specific') {
            // IDs spécifiques fournis
            userIds = recipients.map(id => parseInt(id));
        }

        console.log(`📬 [sendNotification] Envoi à ${userIds.length} utilisateur(s)`);

        if (userIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        // Créer une notification pour chaque destinataire
        const notificationIds = [];

        for (const userId of userIds) {
            try {
                const messageId = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.message',
                    method: 'create',
                    args: [{
                        message_type: 'notification',
                        subtype_id: 1,
                        body: `<p><strong>${title}</strong></p><p>${message}</p>`,
                        subject: title,
                        author_id: senderId,
                        partner_ids: [[6, 0, [userId]]],
                        needaction: true
                    }],
                    kwargs: {}
                });

                notificationIds.push(messageId);
            } catch (userError) {
                console.warn(`⚠️ Erreur envoi à user ${userId}:`, userError.message);
            }
        }

        console.log(`✅ [sendNotification] ${notificationIds.length} notifications créées`);

        res.json({
            status: 'success',
            message: 'Notifications envoyées avec succès',
            data: {
                sent_count: notificationIds.length,
                notification_ids: notificationIds
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

        res.json({ status: 'success', message: 'Notification marquée comme lue' });
    } catch (error) {
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

        res.json({ status: 'success', message: 'Notification supprimée' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Erreur' });
    }
};

// Fonction utilitaire
function getThirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0] + ' 00:00:00';
}
