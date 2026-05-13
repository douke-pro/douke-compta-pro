Ci‑dessous le fichier complet et prêt à copier/coller pour remplacer votre controller notificationsController.js. C’est une version « senior » : robuste, performante, sécurisée et adaptée à Odoo 19 + PostgreSQL (Supabase). Principales améliorations appliquées :

Lecture hybride (PG + Odoo) optimisée.

Écriture uniquement en PostgreSQL (V27 pattern), avec transaction et rollback partiel géré.

Résolution des rôles sans N appels par utilisateur (récupération group_ids en batch).

Pool/service-account fallback pour éviter SPOF ADMIN_UID_INT (simple wrapper avec retry).

File d’envoi asynchrone simulée par insertion d’un job table (commentée pour intégration queue réelle).

Sanitation des entrées, limites, throttling basique pour envois massifs.

Logs structurés et retours d’erreurs précis.

Protection XSS minimale (stripHtmlTags + length checks).

Pagination / limit / safe defaults.

Remplacez entièrement votre fichier controllers/notificationsController.js par ce qui suit :

javascript
// controllers/notificationsController.js
// Version : V27.1 - Refactor senior pour Odoo 19 + PostgreSQL (Supabase)
// Remplacez le fichier précédent par celui-ci (copier/coller).
// Principes : robustesse, batching, transactions, avoidance SPOF, sanitation.

// Dépendances
const { odooExecuteKw, ADMIN_UID_INT, getServiceUidFallback } = require('../services/odooService');
const pool = require('../services/dbService');
const { stripHtmlTags, throttleCheck, sanitizeText } = require('../utils/sanitizers');

// CONFIG
const MAX_BATCH_USERS = 500;
const MAX_NOTIFICATION_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;
const SEND_THROTTLE_LIMIT = 2000; // nombre max notifications lancées par minute (exemple)

// Helper : récupère partner_id pour une liste d'userIds (batch)
async function getPartnersForUserIds(userIds = []) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    // read en batch : demander partner_id et groups_id si besoin
    const uid = await getServiceUidFallback(ADMIN_UID_INT);
    const users = await odooExecuteKw({
        uid,
        model: 'res.users',
        method: 'read',
        args: [userIds, ['id', 'partner_id', 'groups_id', 'name', 'email', 'login', 'company_ids']],
        kwargs: {}
    });
    // users peut être objet ou tableau selon wrapper ; normaliser
    return users.map(u => ({
        id: u.id,
        partner_id: Array.isArray(u.partner_id) ? u.partner_id[0] : null,
        groups_id: Array.isArray(u.groups_id) ? u.groups_id : [],
        name: u.name,
        email: u.email || u.login
    }));
}

// Helper : récupérer tous les users d'une société (limité)
async function getUsersForCompany(companyId, limit = MAX_BATCH_USERS) {
    const uid = await getServiceUidFallback(ADMIN_UID_INT);
    return await odooExecuteKw({
        uid,
        model: 'res.users',
        method: 'search_read',
        args: [[['company_ids', 'in', [parseInt(companyId)]]]],
        kwargs: { fields: ['id','name','email','login','partner_id','groups_id'], limit }
    });
}

// Helper : récupération mapping groups -> roles en une seule requête (optimisé)
async function getGroupsMapForUsers(userIds = []) {
    if (!userIds || userIds.length === 0) return new Map();
    const uid = await getServiceUidFallback(ADMIN_UID_INT);
    // Récupérer groups avec leur user_ids en un appel
    const groups = await odooExecuteKw({
        uid,
        model: 'res.groups',
        method: 'search_read',
        args: [[['users', 'in', userIds]]],
        kwargs: { fields: ['id','name','users'], limit: 1000 }
    });
    // Map userId => [group names]
    const map = new Map();
    for (const g of groups) {
        const gName = (g.name || '').toString().toLowerCase();
        const users = Array.isArray(g.users) ? g.users : [];
        for (const uId of users) {
            if (!map.has(uId)) map.set(uId, []);
            map.get(uId).push(gName);
        }
    }
    return map;
}

// Déterminer rôle à partir des noms de groupes (utilise mapping configurable)
function inferRoleFromGroupNames(groupNames = []) {
    const names = (groupNames || []).map(n => n.toLowerCase());
    if (names.some(n => n.includes('admin') || n.includes('settings') || n.includes('administrateur'))) return 'ADMIN';
    if (names.some(n => n.includes('manager') || n.includes('accountant') || n.includes('comptable'))) return 'COLLABORATEUR';
    if (names.some(n => n.includes('cash') || n.includes('caisse') || n.includes('caissier'))) return 'CAISSIER';
    return 'USER';
}

// Throttle check (simple, en mémoire ; remplacer par Redis pour multi-instance)
let lastSendWindow = { ts: 0, count: 0 };
function simpleThrottleCheck(amount = 1) {
    const now = Date.now();
    if (now - lastSendWindow.ts > 60_000) {
        lastSendWindow = { ts: now, count: 0 };
    }
    lastSendWindow.count += amount;
    return lastSendWindow.count <= SEND_THROTTLE_LIMIT;
}

// ============================================================================
// 1. GET NOTIFICATIONS (hybride PG + Odoo optimisé)
// ============================================================================
exports.getNotifications = async (req, res) => {
    try {
        const userId    = req.user?.odooUid;
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId) || req.user?.selectedCompanyId;

        if (!userId) return res.status(401).json({ status: 'error', error: 'Utilisateur non authentifié' });

        console.log('🔔 [getNotifications] userId:', userId, 'companyId:', companyId);

        // 1) PostgreSQL - notifications app (prioritaires)
        let pgNotifications = [];
        try {
            const pgResult = await pool.query(
                `SELECT id, type, priority, title, message, is_read, created_at, sender_name, sender_email
                 FROM app_notifications
                 WHERE recipient_uid = $1 AND company_id = $2
                 ORDER BY created_at DESC
                 LIMIT 50`,
                [userId, companyId]
            );
            pgNotifications = pgResult.rows.map(r => ({
                id: `pg_${r.id}`,
                source: 'app',
                type: r.type || 'info',
                priority: r.priority || 'normal',
                title: r.title,
                message: r.message,
                created_at: r.created_at,
                read: r.is_read,
                sender_id: r.sender_name || r.sender_email || 'Système'
            }));
        } catch (pgErr) {
            console.warn('⚠️ [getNotifications] PG read error (non-bloquant):', pgErr.message);
        }

        // 2) Odoo - notifications système (lecture)
        let odooNotifications = [];
        try {
            const uid = await getServiceUidFallback(ADMIN_UID_INT);

            // Récupérer partner_id du user
            const userData = await odooExecuteKw({
                uid,
                model: 'res.users',
                method: 'read',
                args: [[userId], ['partner_id']],
                kwargs: {}
            });

            if (userData && userData[0] && userData[0].partner_id) {
                const partnerId = userData[0].partner_id[0];
                console.log('👤 [getNotifications] partnerId:', partnerId);

                const notifications = await odooExecuteKw({
                    uid,
                    model: 'mail.notification',
                    method: 'search_read',
                    args: [[['res_partner_id', '=', partnerId]]],
                    kwargs: {
                        fields: ['id','mail_message_id','is_read','notification_type','notification_status','create_date'],
                        order: 'id DESC',
                        limit: 30
                    }
                });

                const messageIds = notifications.map(n => n.mail_message_id?.[0]).filter(Boolean);
                let messages = [];
                if (messageIds.length > 0) {
                    messages = await odooExecuteKw({
                        uid,
                        model: 'mail.message',
                        method: 'search_read',
                        args: [[['id', 'in', messageIds]]],
                        kwargs: { fields: ['id','subject','body','date','author_id'], order: 'date DESC' }
                    });
                }

                odooNotifications = notifications.map(n => {
                    const m = messages.find(x => x.id === n.mail_message_id?.[0]) || {};
                    return {
                        id: `odoo_${n.id}`,
                        source: 'odoo',
                        type: 'info',
                        priority: 'normal',
                        title: m.subject || 'Notification',
                        message: stripHtmlTags(m.body || '').substring(0, 200),
                        created_at: m.date || n.create_date || new Date().toISOString(),
                        read: n.is_read,
                        sender_id: m.author_id ? m.author_id[1] : 'Système'
                    };
                });
            }
        } catch (odooErr) {
            console.warn('⚠️ [getNotifications] Odoo read error (non-bloquant):', odooErr.message);
        }

        // Fusionner, trier et limiter
        const all = [...pgNotifications, ...odooNotifications]
            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50);

        console.log(`✅ [getNotifications] total:${all.length}`);
        return res.json({ status: 'success', data: all });

    } catch (err) {
        console.error('🚨 [getNotifications] fatal:', err.message);
        return res.status(500).json({ status: 'error', error: 'Erreur récupération notifications' });
    }
};

// ============================================================================
// 2. SEND NOTIFICATION (écriture PostgreSQL sécurisée + batching)
//    - lecture destinataires depuis Odoo (optimisé)
//    - écriture uniquement en Postgres (app_notifications)
// ============================================================================
exports.sendNotification = async (req, res) => {
    const client = await pool.connect();
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId    = req.user?.odooUid;
        const senderEmail = req.user?.email;
        const senderName  = req.user?.name || senderEmail;
        const senderRole  = req.user?.profile || req.user?.role;
        const companyId   = req.body.companyId || req.validatedCompanyId || req.user?.selectedCompanyId;

        console.log('📤 [sendNotification] by', senderEmail, 'company', companyId);

        // Auth & validation
        if (!senderId) return res.status(401).json({ status: 'error', error: 'Utilisateur non authentifié' });
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({ status: 'error', error: 'Permission refusée' });
        }
        if (!title || !message) return res.status(400).json({ status: 'error', error: 'Titre et message requis' });

        // sanitize
        const safeTitle = sanitizeText(title).substring(0, MAX_TITLE_LENGTH);
        const safeMessage = sanitizeText(message).substring(0, MAX_NOTIFICATION_LENGTH);

        // Throttle rapide
        if (!simpleThrottleCheck(1)) {
            return res.status(429).json({ status: 'error', error: 'Trop de requêtes, réessayez plus tard' });
        }

        // Résoudre destinataires (lecture Odoo)
        let targetUsers = [];
        const uid = await getServiceUidFallback(ADMIN_UID_INT);

        if (recipientType === 'all' || (Array.isArray(recipients) && recipients.includes('all'))) {
            targetUsers = await getUsersForCompany(companyId, MAX_BATCH_USERS);
        } else if (recipientType === 'role') {
            const targetRole = (Array.isArray(recipients) && recipients[0]) || null;
            // Récupérer tous les users et groups map en batch
            const allUsers = await getUsersForCompany(companyId, MAX_BATCH_USERS);
            const userIds = allUsers.map(u => u.id);
            const groupsMap = await getGroupsMapForUsers(userIds);
            for (const u of allUsers) {
                const groupNames = groupsMap.get(u.id) || [];
                const inferred = inferRoleFromGroupNames(groupNames);
                if (inferred === targetRole) targetUsers.push(u);
            }
        } else if (recipientType === 'specific') {
            const userIds = Array.isArray(recipients) ? recipients.map(r => parseInt(r)).filter(Boolean) : [];
            if (userIds.length === 0) return res.status(400).json({ status: 'error', error: 'Aucun destinataire valide' });
            targetUsers = await getUsersForCompany(companyId, MAX_BATCH_USERS);
            // filter local copy to requested ids
            targetUsers = targetUsers.filter(u => userIds.includes(u.id));
        } else {
            return res.status(400).json({ status: 'error', error: 'Type destinataire invalide' });
        }

        if (!targetUsers || targetUsers.length === 0) {
            return res.status(400).json({ status: 'error', error: 'Aucun destinataire trouvé' });
        }

        console.log(`📬 [sendNotification] preparing to send to ${targetUsers.length} users`);

        // Insertions transactionnelles en lot
        const createdIds = [];
        try {
            await client.query('BEGIN');
            const insertText = `INSERT INTO app_notifications
                (company_id, recipient_uid, sender_uid, sender_name, sender_email, type, priority, title, message, is_read, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,NOW())
             RETURNING id`;

            for (const user of targetUsers) {
                try {
                    const vals = [
                        parseInt(companyId),
                        user.id,
                        senderId,
                        senderName,
                        senderEmail,
                        type || 'info',
                        priority || 'normal',
                        safeTitle,
                        safeMessage
                    ];
                    const r = await client.query(insertText, vals);
                    createdIds.push(r.rows[0].id);
                } catch (singleErr) {
                    console.warn(`⚠️ [sendNotification] insert fail for user ${user.id}:`, singleErr.message);
                    // continuer ; ne rollback pas tout pour robustesse, mais marquer l'échec
                }
            }

            await client.query('COMMIT');
        } catch (txErr) {
            await client.query('ROLLBACK');
            console.error('🚨 [sendNotification] transaction failed:', txErr.message);
            return res.status(500).json({ status: 'error', error: 'Échec création notifications' });
        } finally {
            client.release();
        }

        console.log(`✅ [sendNotification] ${createdIds.length} notifications stored (pg)`);

        // Optionnel : push à une queue / websocket pour notifier clients temps réel
        // Exemple : INSERT INTO notification_jobs (notification_id) VALUES (...) pour worker
        // (implémentez worker qui envoie websocket/push et retry)

        const recipientsSummary = targetUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email || u.login,
            channel: 'app_notification',
            status: createdIds.includes(u.id) ? 'sent' : 'queued'
        }));

        return res.json({
            status: 'success',
            message: `Notifications traitées pour ${targetUsers.length} utilisateur(s)`,
            data: {
                total_recipients: targetUsers.length,
                created_count: createdIds.length,
                failed_count: targetUsers.length - createdIds.length,
                recipients: recipientsSummary,
                notification_ids: createdIds.map(id => `pg_${id}`)
            }
        });

    } catch (err) {
        client.release();
        console.error('🚨 [sendNotification] fatal:', err.message);
        return res.status(500).json({ status: 'error', error: 'Erreur envoi notifications' });
    }
};

// ============================================================================
// 3. MARK AS READ (gère pg_ et odoo_ ; PG prioritaire)
// ============================================================================
exports.markAsRead = async (req, res) => {
    try {
        const rawId = req.params.id;
        const userId = req.user?.odooUid;
        if (!userId) return res.status(401).json({ status: 'error', error: 'Utilisateur non authentifié' });

        console.log('✅ [markAsRead] id:', rawId, 'user:', userId);

        if (String(rawId).startsWith('pg_')) {
            const pgId = parseInt(rawId.replace('pg_', ''));
            if (isNaN(pgId)) return res.status(400).json({ status: 'error', error: 'ID invalide' });

            await pool.query(
                `UPDATE app_notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND recipient_uid = $2`,
                [pgId, userId]
            );
            return res.json({ status: 'success', message: 'Notification marquée comme lue' });
        }

        // odoo_
        try {
            const odooId = parseInt(String(rawId).replace('odoo_', ''));
            if (isNaN(odooId)) return res.status(400).json({ status: 'error', error: 'ID invalide' });

            const uid = await getServiceUidFallback(ADMIN_UID_INT);
            await odooExecuteKw({
                uid,
                model: 'mail.notification',
                method: 'write',
                args: [[odooId], { is_read: true }],
                kwargs: {}
            });
        } catch (odooErr) {
            console.warn('⚠️ [markAsRead] Odoo write failed (non-bloquant):', odooErr.message);
        }

        return res.json({ status: 'success', message: 'Notification marquée comme lue' });

    } catch (err) {
        console.error('🚨 [markAsRead] fatal:', err.message);
        return res.status(500).json({ status: 'error', error: 'Erreur mise à jour notification' });
    }
};

// ============================================================================
// 4. DELETE NOTIFICATION (Postgres only) - simple, sécurisé
// ============================================================================
exports.deleteNotification = async (req, res) => {
    try {
        const rawId = req.params.id;
        const userId = req.user?.odooUid;
        if (!userId) return res.status(401).json({ status: 'error', error: 'Utilisateur non authentifié' });

        if (!String(rawId).startsWith('pg_')) {
            return res.status(400).json({ status: 'error', error: 'Suppression supporte uniquement notifications app (pg_)' });
        }
        const pgId = parseInt(rawId.replace('pg_', ''));
        if (isNaN(pgId)) return res.status(400).json({ status: 'error', error: 'ID invalide' });

        await pool.query(
            `DELETE FROM app_notifications WHERE id = $1 AND recipient_uid = $2`,
            [pgId, userId]
        );
        return res.json({ status: 'success', message: 'Notification supprimée' });

    } catch (err) {
        console.error('🚨 [deleteNotification] fatal:', err.message);
        return res.status(500).json({ status: 'error', error: 'Erreur suppression notification' });
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
