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
async function sendNotification(req, res) {
    try {
        const { companyId, recipients, recipientType, type, priority, title, message } = req.body;
        const senderUserId = req.user.odooUid;
        const senderEmail = req.user.email;
        
        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);
        
        // Déterminer les IDs des destinataires
        let recipientUserIds = [];
        
        if (recipientType === 'all' || (recipients && recipients[0] === 'all')) {
            // Tous les utilisateurs de l'entreprise
            const allUsers = await odooService.execute_kw(
                'res.users',
                'search_read',
                [[['company_ids', 'in', [companyId]]]],
                { fields: ['id', 'name', 'email'] }
            );
            recipientUserIds = allUsers.map(u => u.id);
        } else if (recipientType === 'role') {
            // Par rôle (à implémenter selon ta logique)
            // ...
        } else if (recipientType === 'specific') {
            recipientUserIds = recipients.map(id => parseInt(id));
        }
        
        console.log('📬 [sendNotification] Envoi à', recipientUserIds.length, 'utilisateur(s)');
        
        // Créer les notifications dans la DB
        const notifications = [];
        for (const userId of recipientUserIds) {
            const notif = await pool.query(
                `INSERT INTO notifications (user_id, company_id, type, priority, title, message, sender_id, created_at, read)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
                 RETURNING id, user_id`,
                [userId, companyId, type, priority, title, message, senderUserId]
            );
            notifications.push(notif.rows[0]);
        }
        
        console.log('✅ [sendNotification]', notifications.length, 'notifications créées');
        
        // ✅ RÉCUPÉRER LES INFOS DES DESTINATAIRES
        const recipientsDetails = await odooService.execute_kw(
            'res.users',
            'search_read',
            [[['id', 'in', recipientUserIds]]],
            { fields: ['id', 'name', 'email'] }
        );
        
        res.json({
            status: 'success',
            message: `Notification envoyée à ${notifications.length} utilisateur(s)`,
            data: {
                count: notifications.length,
                recipients: recipientsDetails  // ✅ AJOUT ICI
            }
        });
        
    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de l\'envoi de la notification'
        });
    }
}

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
