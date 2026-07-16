// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V27 - ÉTAT LOCAL PostgreSQL + ANTI-429 + ODOO 19 SaaS
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        console.log('🔔 [getNotifications] User:', userId);

        const stateResult = await pool.query(
            `SELECT notification_id, is_read, is_deleted
             FROM notification_state
             WHERE user_odoo_uid = $1`,
            [userId]
        );

        const localState = {};
        stateResult.rows.forEach(row => {
            localState[row.notification_id] = {
                is_read:    row.is_read,
                is_deleted: row.is_deleted
            };
        });

        const userData = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.users',
            method: 'read',
            args:   [[userId], ['partner_id']],
            kwargs: {}
        });

        if (!userData || !userData[0]?.partner_id) {
            console.warn(`⚠️ [getNotifications] Partner non trouvé pour user ${userId}`);
            return res.json({ status: 'success', data: [], unread_count: 0 });
        }

        const partnerId = userData[0].partner_id[0];
        console.log(`👤 [getNotifications] Partner ID: ${partnerId}`);

        const notifications = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'mail.notification',
            method: 'search_read',
            args:   [[['res_partner_id', '=', partnerId]]],
            kwargs: {
                fields: ['id', 'mail_message_id', 'is_read', 'notification_type', 'notification_status'],
                order:  'id DESC',
                limit:  50
            }
        });

        console.log(`📬 [getNotifications] ${notifications.length} notifications trouvées`);

        const messageIds = notifications
            .map(n => n.mail_message_id?.[0])
            .filter(Boolean);

        let messagesMap = {};
        if (messageIds.length > 0) {
            const messages = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'mail.message',
                method: 'search_read',
                args:   [[['id', 'in', messageIds]]],
                kwargs: {
                    fields: ['id', 'subject', 'body', 'date', 'author_id'],
                    order:  'date DESC'
                }
            });
            messages.forEach(m => { messagesMap[m.id] = m; });
        }

        const formattedNotifications = notifications
            .map(notif => {
                const notifKey = `odoo_${notif.id}`;
                const state    = localState[notifKey] || {};

                if (state.is_deleted) return null;

                const isRead  = state.is_read !== undefined ? state.is_read : notif.is_read;
                const message = messagesMap[notif.mail_message_id?.[0]] || {};

                return {
                    id:         notifKey,
                    type:       'info',
                    priority:   'normal',
                    title:      message.subject  || 'Notification',
                    message:    stripHtmlTags(message.body || '').substring(0, 200),
                    created_at: message.date     || new Date().toISOString(),
                    read:       isRead,
                    sender_id:  message.author_id ? message.author_id[1] : 'Système'
                };
            })
            .filter(Boolean);

        // ✅ FIX : fusion avec les notifications internes Postgres (app_notifications)
        const companyIdForPg = req.validatedCompanyId || parseInt(req.query.companyId) || null;

        let pgNotifications = [];
        try {
            const pgResult = await pool.query(
                companyIdForPg
                    ? `SELECT id, type, title, message, is_read, created_at, sender_name, sender_email
                       FROM app_notifications
                       WHERE recipient_uid = $1 AND company_id = $2
                       ORDER BY created_at DESC LIMIT 50`
                    : `SELECT id, type, title, message, is_read, created_at, sender_name, sender_email
                       FROM app_notifications
                       WHERE recipient_uid = $1
                       ORDER BY created_at DESC LIMIT 50`,
                companyIdForPg ? [userId, companyIdForPg] : [userId]
            );

            pgNotifications = pgResult.rows.map(row => ({
                id:         `pg_${row.id}`,
                type:       row.type || 'info',
                priority:   'normal',
                title:      row.title,
                message:    row.message,
                created_at: row.created_at,
                read:       row.is_read,
                sender_id:  row.sender_name || row.sender_email || 'Système'
            }));
        } catch (pgError) {
            console.warn('⚠️ [getNotifications] Lecture app_notifications échouée (non bloquant):', pgError.message);
        }

        const allNotifications = [...formattedNotifications, ...pgNotifications]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const unreadCount = allNotifications.filter(n => !n.read).length;

        console.log(`✅ [getNotifications] ${allNotifications.length} notifications (${formattedNotifications.length} Odoo + ${pgNotifications.length} internes) | ${unreadCount} non lues`);

        res.json({
            status:       'success',
            data:         allNotifications,
            unread_count: unreadCount
        });

    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            status: 'error',
            error:  'Erreur lors de la récupération des notifications'
        });
    }
};

exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId    = req.user.odooUid;
        const senderEmail = req.user.email;
        const senderRole  = req.user.profile;
        const companyId   = req.body.companyId || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);

        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error:  'Seuls les Administrateurs et Collaborateurs peuvent envoyer des notifications'
            });
        }

        if (!title || !message) {
            return res.status(400).json({ status: 'error', error: 'Titre et message requis' });
        }

        if (!recipientType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                status: 'error',
                error:  'Type de destinataire et liste de destinataires requis'
            });
        }

        let targetUsers = [];

        if (recipientType === 'all' || recipients.includes('all')) {
            console.log('📋 [sendNotification] Type: Tous les utilisateurs');
            targetUsers = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['company_ids', 'in', [parseInt(companyId)]], ['share', '=', false]]],
                kwargs: { fields: ['id', 'name', 'email', 'login', 'partner_id'], limit: 500 }
            });

        } else if (recipientType === 'role') {
            console.log('📋 [sendNotification] Type: Par rôle -', recipients[0]);
            const targetRole = recipients[0];

            const allUsers = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['company_ids', 'in', [parseInt(companyId)]], ['share', '=', false]]],
                kwargs: { fields: ['id', 'name', 'email', 'login', 'partner_id'], limit: 500 }
            });

            const allUserIds = allUsers.map(u => u.id);

            const groups = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.groups',
                method: 'search_read',
                args:   [[['user_ids', 'in', allUserIds]]],
                kwargs: { fields: ['id', 'name', 'user_ids'], limit: 500 }
            });

            const PRIORITY    = { ADMIN: 4, COLLABORATEUR: 3, CAISSIER: 2, USER: 1 };
            const userRoleMap = {};

            groups.forEach(group => {
                const gName = group.name.toLowerCase();
                let detectedRole = null;

                if (gName.includes('admin') || gName.includes('settings') || gName.includes('administration')) {
                    detectedRole = 'ADMIN';
                } else if (gName.includes('manager') || gName.includes('accountant') || gName.includes('comptable') || gName.includes('gestionnaire')) {
                    detectedRole = 'COLLABORATEUR';
                } else if (gName.includes('cash') || gName.includes('caisse') || gName.includes('cashier')) {
                    detectedRole = 'CAISSIER';
                }

                if (detectedRole) {
                    (group.user_ids || []).forEach(uid => {
                        const current = userRoleMap[uid];
                        if (!current || PRIORITY[detectedRole] > PRIORITY[current]) {
                            userRoleMap[uid] = detectedRole;
                        }
                    });
                }
            });

            targetUsers = allUsers.filter(u => (userRoleMap[u.id] || 'USER') === targetRole);

        } else if (recipientType === 'specific') {
            console.log('📋 [sendNotification] Type: Utilisateurs spécifiques');
            const userIds = recipients.map(id => parseInt(id));
            targetUsers = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['id', 'in', userIds]]],
                kwargs: { fields: ['id', 'name', 'email', 'login', 'partner_id'], limit: 500 }
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${targetUsers.length} utilisateur(s)`);

        if (targetUsers.length === 0) {
            return res.status(400).json({ status: 'error', error: 'Aucun destinataire trouvé' });
        }

        const senderData = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.users',
            method: 'read',
            args:   [[senderId], ['partner_id']],
            kwargs: {}
        });

        const senderPartnerId = senderData[0]?.partner_id?.[0] || null;

        if (!senderPartnerId) {
            return res.status(500).json({ status: 'error', error: 'Impossible de récupérer l\'expéditeur' });
        }

        const partnerIds = targetUsers.map(u => u.partner_id?.[0]).filter(Boolean);

        if (partnerIds.length === 0) {
            return res.status(400).json({ status: 'error', error: 'Impossible de récupérer les destinataires' });
        }

        console.log(`👥 [sendNotification] Partner IDs destinataires:`, partnerIds);
        console.log(`👤 [sendNotification] Partner ID expéditeur:`, senderPartnerId);

        const messageId = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'mail.message',
            method: 'create',
            args:   [{
                message_type: 'notification',
                subtype_id:   1,
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
                subject:     title,
                author_id:   senderPartnerId,
                needaction:  true,
                record_name: `Notification - ${type}`,
                partner_ids: [[6, 0, partnerIds]]
            }],
            kwargs: {}
        });

        console.log(`✅ [sendNotification] Message ${messageId} créé`);

        const createdNotifications = [];
        for (const pid of partnerIds) {
            try {
                const notifId = await odooExecuteKw({
                    uid:    ADMIN_UID_INT,
                    model:  'mail.notification',
                    method: 'create',
                    args:   [{
                        mail_message_id:     messageId,
                        res_partner_id:      pid,
                        notification_type:   'inbox',
                        is_read:             false,
                        notification_status: 'sent'
                    }],
                    kwargs: {}
                });
                createdNotifications.push(notifId);
                console.log(`✅ Notification ${notifId} créée pour partner ${pid}`);
            } catch (notifError) {
                console.warn(`⚠️ Erreur création notification pour partner ${pid}:`, notifError.message);
            }
        }

        console.log(`✅ [sendNotification] ${createdNotifications.length} notifications créées`);

        res.json({
            status:  'success',
            message: `Notifications envoyées à ${targetUsers.length} utilisateur(s)`,
            data: {
                count:                 targetUsers.length,
                sent_count:            targetUsers.length,
                failed_count:          0,
                total_recipients:      targetUsers.length,
                recipients:            targetUsers.map(u => ({
                    id:      u.id,
                    name:    u.name,
                    email:   u.email || u.login,
                    channel: 'notification',
                    status:  'sent'
                })),
                notification_ids:      [messageId],
                created_notifications: createdNotifications
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            status:  'error',
            error:   'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const rawId  = req.params.id;
        const userId = req.user.odooUid;

        console.log(`✅ [markAsRead] Notification ${rawId} pour user ${userId}`);

        if (String(rawId).startsWith('pg_')) {
            const pgId = parseInt(rawId.replace('pg_', ''));
            await pool.query(
                `UPDATE app_notifications
                 SET is_read = TRUE, read_at = NOW()
                 WHERE id = $1 AND recipient_uid = $2`,
                [pgId, userId]
            );
        } else {
            await pool.query(
                `INSERT INTO notification_state (user_odoo_uid, notification_id, is_read, read_at)
                 VALUES ($1, $2, TRUE, NOW())
                 ON CONFLICT (user_odoo_uid, notification_id)
                 DO UPDATE SET is_read = TRUE, read_at = NOW()`,
                [userId, rawId]
            );
        }

        console.log(`✅ [markAsRead] Marquée comme lue: ${rawId}`);
        res.json({ status: 'success', message: 'Notification marquée comme lue' });

    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur lors de la mise à jour' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const rawId  = req.params.id;
        const userId = req.user.odooUid;

        console.log(`🗑️ [deleteNotification] Notification ${rawId} pour user ${userId}`);

        if (String(rawId).startsWith('pg_')) {
            const pgId = parseInt(rawId.replace('pg_', ''));
            await pool.query(
                `DELETE FROM app_notifications
                 WHERE id = $1 AND recipient_uid = $2`,
                [pgId, userId]
            );
        } else {
            await pool.query(
                `INSERT INTO notification_state (user_odoo_uid, notification_id, is_deleted, deleted_at)
                 VALUES ($1, $2, TRUE, NOW())
                 ON CONFLICT (user_odoo_uid, notification_id)
                 DO UPDATE SET is_deleted = TRUE, deleted_at = NOW()`,
                [userId, rawId]
            );
        }

        console.log(`✅ [deleteNotification] Supprimée: ${rawId}`);
        res.json({ status: 'success', message: 'Notification supprimée' });

    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur lors de la suppression' });
    }
};

function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

function getPriorityLabel(priority) {
    const labels = { low: '🟢 Basse', normal: '🔵 Normale', high: '🟠 Haute', urgent: '🔴 Urgente' };
    return labels[priority] || '🔵 Normale';
}

function getTypeLabel(type) {
    const labels = { info: 'ℹ️ Information', alert: '⚠️ Alerte', reminder: '📅 Rappel', invoice: '📄 Facture', report: '📊 Rapport' };
    return labels[type] || 'ℹ️ Information';
}
