// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V3 - POSTGRESQL DIRECT (100% ROBUSTE)
// =============================================================================

const pool = require('../services/dbService');

/**
 * Récupère les notifications de l'utilisateur connecté
 * @route GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const companyId = req.query.companyId || req.user.selectedCompanyId;
        
        console.log('🔔 [getNotifications] User:', userId, '| Company:', companyId);
        
        // Requête SQL simple et directe
        const result = await pool.query(
            `SELECT 
                id,
                type,
                priority,
                title,
                message,
                sender_name,
                read,
                created_at,
                read_at
             FROM app_notifications
             WHERE user_id = $1 AND company_id = $2
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId, companyId]
        );
        
        const notifications = result.rows;
        
        console.log(`✅ [getNotifications] ${notifications.length} notifications trouvées`);
        
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
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId = req.user.odooUid;
        const senderName = req.user.name || req.user.email;
        const senderRole = req.user.profile;
        const companyId = req.body.companyId || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Par:', senderName, '| Type:', recipientType);

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

        // Récupérer les IDs utilisateurs depuis Odoo
        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
        let targetUsers = [];

        if (recipientType === 'all' || (Array.isArray(recipients) && recipients.includes('all'))) {
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { fields: ['id', 'name', 'email'] }
            });
        } else if (recipientType === 'specific' && Array.isArray(recipients)) {
            const userIds = recipients.map(id => parseInt(id));
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['id', 'in', userIds]]],
                kwargs: { fields: ['id', 'name', 'email'] }
            });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${targetUsers.length} utilisateur(s)`);

        // Insérer les notifications en batch (plus rapide)
        const values = targetUsers.map(user => 
            `(${user.id}, ${companyId}, ${senderId}, '${senderName.replace(/'/g, "''")}', '${type}', '${priority}', '${title.replace(/'/g, "''")}', '${message.replace(/'/g, "''")}')`
        ).join(',');

        const insertQuery = `
            INSERT INTO app_notifications (user_id, company_id, sender_id, sender_name, type, priority, title, message)
            VALUES ${values}
            RETURNING id
        `;

        const result = await pool.query(insertQuery);
        const notificationIds = result.rows.map(r => r.id);

        console.log(`✅ [sendNotification] ${notificationIds.length} notifications créées`);

        // Formater les destinataires pour la réponse
        const successfulRecipients = targetUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            channel: 'notification',
            status: 'sent'
        }));

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

        await pool.query(
            `UPDATE app_notifications 
             SET read = TRUE, read_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );

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
        const userId = req.user.odooUid;

        console.log(`🗑️ [deleteNotification] Notification ${notificationId} pour user ${userId}`);

        await pool.query(
            `DELETE FROM app_notifications 
             WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );

        res.json({ status: 'success', message: 'Supprimée' });
    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur' });
    }
};
