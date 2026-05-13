// =============================================================================
// FICHIER : controllers/notificationsController.js
// Version : V27 — Hybride Odoo (lecture) + PostgreSQL (écriture)
// Architecture :
//   ✅ getNotifications  → Odoo (lecture) + PostgreSQL (complément)
//   ✅ sendNotification  → PostgreSQL uniquement (écriture Odoo bloquée SaaS)
//   ✅ markAsRead        → PostgreSQL uniquement
//   ✅ deleteNotification→ PostgreSQL uniquement
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

// =============================================================================
// 1. RÉCUPÉRER LES NOTIFICATIONS
// Lecture hybride : Odoo (notifications système) + PostgreSQL (notifications app)
// =============================================================================

exports.getNotifications = async (req, res) => {
    try {
        const userId    = req.user.odooUid;
        const companyId = req.validatedCompanyId
                       || parseInt(req.query.companyId)
                       || req.user.selectedCompanyId;

        console.log('🔔 [getNotifications] User:', userId);

        // ── 1. Notifications depuis PostgreSQL (envoyées via l'app) ──────────
        let pgNotifications = [];
        try {
            const pgResult = await pool.query(
                `SELECT id, type, priority, title, message,
                        is_read, created_at, sender_name, sender_email
                 FROM app_notifications
                 WHERE recipient_uid = $1
                   AND company_id    = $2
                 ORDER BY created_at DESC
                 LIMIT 50`,
                [userId, companyId]
            );
            pgNotifications = pgResult.rows.map(row => ({
                id:         `pg_${row.id}`,
                source:     'app',
                type:       row.type       || 'info',
                priority:   row.priority   || 'normal',
                title:      row.title,
                message:    row.message,
                created_at: row.created_at,
                read:       row.is_read,
                sender_id:  row.sender_name || 'Système'
            }));
        } catch (pgErr) {
            console.warn('⚠️ [getNotifications] Erreur PostgreSQL (non bloquant):', pgErr.message);
        }

        // ── 2. Notifications depuis Odoo (lecture autorisée) ─────────────────
        let odooNotifications = [];
        try {
            const userData = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'read',
                args:   [[userId], ['partner_id']],
                kwargs: {}
            });

            if (userData && userData[0]?.partner_id) {
                const partnerId = userData[0].partner_id[0];
                console.log(`👤 [getNotifications] Partner ID: ${partnerId}`);

                const notifications = await odooExecuteKw({
                    uid:    ADMIN_UID_INT,
                    model:  'mail.notification',
                    method: 'search_read',
                    args:   [[['res_partner_id', '=', partnerId]]],
                    kwargs: {
                        fields: ['id', 'mail_message_id', 'is_read',
                                 'notification_type', 'notification_status'],
                        order:  'id DESC',
                        limit:  30
                    }
                });

                console.log(`📬 [getNotifications] ${notifications.length} notifications trouvées`);

                const messageIds = notifications
                    .map(n => n.mail_message_id?.[0])
                    .filter(Boolean);

                let messages = [];
                if (messageIds.length > 0) {
                    messages = await odooExecuteKw({
                        uid:    ADMIN_UID_INT,
                        model:  'mail.message',
                        method: 'search_read',
                        args:   [[['id', 'in', messageIds]]],
                        kwargs: {
                            fields: ['id', 'subject', 'body', 'date', 'author_id'],
                            order:  'date DESC'
                        }
                    });
                }

                odooNotifications = notifications.map(notif => {
                    const msg = messages.find(
                        m => m.id === notif.mail_message_id?.[0]
                    ) || {};
                    return {
                        id:         `odoo_${notif.id}`,
                        source:     'odoo',
                        type:       'info',
                        priority:   'normal',
                        title:      msg.subject || 'Notification',
                        message:    stripHtmlTags(msg.body || '').substring(0, 200),
                        created_at: msg.date || new Date().toISOString(),
                        read:       notif.is_read,
                        sender_id:  msg.author_id ? msg.author_id[1] : 'Système'
                    };
                });
            }
        } catch (odooErr) {
            console.warn('⚠️ [getNotifications] Erreur Odoo (non bloquant):', odooErr.message);
        }

        // ── 3. Fusionner et trier par date ───────────────────────────────────
        const allNotifications = [...pgNotifications, ...odooNotifications]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50);

        console.log(`✅ [getNotifications] ${allNotifications.length} notifications formatées`);

        res.json({ status: 'success', data: allNotifications });

    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error:  'Erreur lors de la récupération des notifications'
        });
    }
};

// =============================================================================
// 2. ENVOYER UNE NOTIFICATION
// Écriture dans PostgreSQL uniquement (Odoo SaaS bloque mail.notification)
// =============================================================================

exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId    = req.user.odooUid;
        const senderEmail = req.user.email;
        const senderName  = req.user.name || senderEmail;
        const senderRole  = req.user.profile || req.user.role;
        const companyId   = req.body.companyId
                         || req.validatedCompanyId
                         || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);

        // Vérification permissions
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error:  'Seuls les Administrateurs et Collaborateurs peuvent envoyer des notifications'
            });
        }

        // Validation
        if (!title || !message) {
            return res.status(400).json({
                status: 'error',
                error:  'Titre et message requis'
            });
        }

        if (!recipientType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                status: 'error',
                error:  'Type de destinataire et liste de destinataires requis'
            });
        }

        // ── Récupérer les utilisateurs destinataires depuis Odoo (lecture OK) ─
        let targetUsers = [];

        if (recipientType === 'all' || recipients.includes('all')) {
            console.log('📋 [sendNotification] Type: Tous les utilisateurs');

            targetUsers = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { fields: ['id', 'name', 'email', 'login'], limit: 500 }
            });

        } else if (recipientType === 'role') {
            console.log('📋 [sendNotification] Type: Par rôle -', recipients[0]);

            const targetRole = recipients[0];
            const allUsers   = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { fields: ['id', 'name', 'email', 'login'], limit: 500 }
            });

            for (const user of allUsers) {
                const groups = await odooExecuteKw({
                    uid:    ADMIN_UID_INT,
                    model:  'res.groups',
                    method: 'search_read',
                    args:   [[['user_ids', 'in', [user.id]]]],
                    kwargs: { fields: ['name'], limit: 10 }
                });

                const groupNames = groups.map(g => g.name.toLowerCase());
                let userRole = 'USER';

                if (groupNames.some(n => n.includes('admin') || n.includes('settings'))) {
                    userRole = 'ADMIN';
                } else if (groupNames.some(n => n.includes('manager') || n.includes('accountant'))) {
                    userRole = 'COLLABORATEUR';
                } else if (groupNames.some(n => n.includes('cash') || n.includes('caisse'))) {
                    userRole = 'CAISSIER';
                }

                if (userRole === targetRole) targetUsers.push(user);
            }

        } else if (recipientType === 'specific') {
            console.log('📋 [sendNotification] Type: Utilisateurs spécifiques');

            const userIds = recipients.map(id => parseInt(id));
            targetUsers   = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.users',
                method: 'search_read',
                args:   [[['id', 'in', userIds]]],
                kwargs: { fields: ['id', 'name', 'email', 'login'], limit: 500 }
            });
        }

        if (targetUsers.length === 0) {
            return res.status(400).json({
                status: 'error',
                error:  'Aucun destinataire trouvé'
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${targetUsers.length} utilisateur(s)`);

        // ── Insérer une notification PostgreSQL par destinataire ──────────────
        const createdIds = [];
        const notifType  = type     || 'info';
        const notifPrio  = priority || 'normal';

        for (const user of targetUsers) {
            try {
                const result = await pool.query(
                    `INSERT INTO app_notifications
                        (company_id, recipient_uid, sender_uid, sender_name,
                         sender_email, type, priority, title, message, is_read)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
                     RETURNING id`,
                    [
                        parseInt(companyId),
                        user.id,
                        senderId,
                        senderName,
                        senderEmail,
                        notifType,
                        notifPrio,
                        title,
                        message
                    ]
                );
                createdIds.push(result.rows[0].id);
                console.log(`✅ Notification pg_${result.rows[0].id} créée pour user ${user.id}`);
            } catch (insertErr) {
                console.warn(`⚠️ Échec insertion pour user ${user.id}:`, insertErr.message);
            }
        }

        console.log(`✅ [sendNotification] ${createdIds.length} notifications créées`);

        const successfulRecipients = targetUsers.map(user => ({
            id:      user.id,
            name:    user.name,
            email:   user.email || user.login,
            channel: 'app_notification',
            status:  'sent'
        }));

        res.json({
            status:  'success',
            message: `Notifications envoyées à ${successfulRecipients.length} utilisateur(s)`,
            data: {
                count:             successfulRecipients.length,
                sent_count:        createdIds.length,
                failed_count:      targetUsers.length - createdIds.length,
                total_recipients:  targetUsers.length,
                recipients:        successfulRecipients,
                notification_ids:  createdIds
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        res.status(500).json({
            status:  'error',
            error:   'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

// =============================================================================
// 3. MARQUER COMME LUE
// PostgreSQL uniquement — gère les deux sources (pg_ et odoo_)
// =============================================================================

exports.markAsRead = async (req, res) => {
    try {
        const rawId         = req.params.id;
        const userId        = req.user.odooUid;

        console.log(`✅ [markAsRead] Notification ${rawId}`);

        // Notifications PostgreSQL (préfixe pg_)
        if (String(rawId).startsWith('pg_')) {
            const pgId = parseInt(rawId.replace('pg_', ''));
            await pool.query(
                `UPDATE app_notifications
                 SET is_read = TRUE, read_at = NOW()
                 WHERE id = $1 AND recipient_uid = $2`,
                [pgId, userId]
            );
            return res.json({ status: 'success', message: 'Notification marquée comme lue' });
        }

        // Notifications Odoo (préfixe odoo_ ou ID numérique direct)
        // La lecture seule fonctionne sur Odoo SaaS — on tente l'écriture
        // mais on ne fait pas échouer si c'est bloqué
        try {
            const odooId = parseInt(String(rawId).replace('odoo_', ''));
            await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'mail.notification',
                method: 'write',
                args:   [[odooId], { is_read: true }],
                kwargs: {}
            });
        } catch (odooErr) {
            console.warn('⚠️ [markAsRead] Écriture Odoo bloquée (SaaS) — ignoré:', odooErr.message);
        }

        res.json({ status: 'success', message: 'Notification marquée comme lue' });

    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error:  'Erreur lors de la mise à jour'
        });
    }
};

// =============================================================================
// 4. SUPPRIMER UNE NOTIFICATION
// PostgreSQL uniquement — les notifications Odoo ne sont pas supprimées
// =============================================================================

exports.deleteNotification = async (req, res) => {
    try {
        const rawId  = req.params.id;
        const userId = req.user.odooUid;

        console.log(`🗑️ [deleteNotification] Notification ${rawId}`);

        if (String(rawId).startsWith('pg_')) {
            const pgId = parseInt(rawId.replace('pg_', ''));
            await pool.query(
                `DELETE FROM app_notifications
                 WHERE id = $1 AND recipient_uid = $2`,
                [pgId, userId]
            );
            return res.json({ status: 'success', message: 'Notification supprimée' });
        }

        // Notifications Odoo — tentative non bloquante
        try {
            const odooId = parseInt(String(rawId).replace('odoo_', ''));
            await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'mail.notification',
                method: 'unlink',
                args:   [[odooId]],
                kwargs: {}
            });
        } catch (odooErr) {
            console.warn('⚠️ [deleteNotification] Suppression Odoo bloquée (SaaS) — ignoré:', odooErr.message);
        }

        res.json({ status: 'success', message: 'Notification supprimée' });

    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error:  'Erreur lors de la suppression'
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
        low:    '🟢 Basse',
        normal: '🔵 Normale',
        high:   '🟠 Haute',
        urgent: '🔴 Urgente'
    };
    return labels[priority] || '🔵 Normale';
}

function getTypeLabel(type) {
    const labels = {
        info:     'ℹ️ Information',
        alert:    '⚠️ Alerte',
        reminder: '📅 Rappel',
        invoice:  '📄 Facture',
        report:   '📊 Rapport'
    };
    return labels[type] || 'ℹ️ Information';
}
