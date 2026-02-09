/**
 * Envoie une notification à un ou plusieurs utilisateurs
 * @route POST /api/notifications/send
 * @access ADMIN + COLLABORATEUR uniquement
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipients, type, priority, title, message } = req.body;
        const senderId = req.user.odooUid;
        const senderRole = req.user.role;
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

        if (recipients.includes('all')) {
            // Tous les utilisateurs de l'entreprise
            const users = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [companyId]]]],
                kwargs: { fields: ['id'] }
            });
            userIds = users.map(u => u.id);
            
        } else if (recipients.includes('admins')) {
            // Uniquement admins
            const admins = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[
                    ['company_ids', 'in', [companyId]],
                    ['groups_id', 'in', [/* ID du groupe Admin */]]
                ]],
                kwargs: { fields: ['id'] }
            });
            userIds = admins.map(u => u.id);
            
        } else {
            // IDs spécifiques fournis
            userIds = recipients.map(id => parseInt(id));
        }

        console.log(`📬 [sendNotification] Envoi à ${userIds.length} utilisateur(s)`);

        // Créer une notification pour chaque destinataire
        const notificationIds = [];

        for (const userId of userIds) {
            const notifId = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'x_notifications',
                method: 'create',
                args: [{
                    x_user_id: userId,
                    x_company_id: companyId,
                    x_sender_id: senderId,
                    x_type: type,
                    x_priority: priority,
                    x_title: title,
                    x_message: message,
                    x_read: false,
                    x_timestamp: new Date().toISOString()
                }],
                kwargs: {}
            });

            notificationIds.push(notifId);
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
