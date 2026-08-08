// =============================================================================
// FICHIER : controllers/pushController.js
// Gestion des souscriptions push + envoi ciblé (par utilisateur ou par société)
// =============================================================================
const pool = require('../services/dbService');
const { sendPushToSubscription } = require('../services/pushService');

/**
 * @route GET /api/push/vapid-public-key
 */
exports.getVapidPublicKey = (req, res) => {
    res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
};

/**
 * @route POST /api/push/subscribe?companyId=X
 */
exports.subscribe = async (req, res) => {
    try {
        const userOdooUid = req.user.odooUid;
        const companyId   = req.validatedCompanyId || parseInt(req.body.companyId) || null;
        const subscription = req.body.subscription;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ status: 'error', error: 'Souscription invalide.' });
        }

        await pool.query(
            `INSERT INTO push_subscriptions (user_odoo_uid, company_id, endpoint, keys_p256dh, keys_auth, user_agent, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (endpoint) DO UPDATE SET
                user_odoo_uid = $1, company_id = $2, keys_p256dh = $4, keys_auth = $5, user_agent = $6, updated_at = NOW()`,
            [userOdooUid, companyId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, req.headers['user-agent'] || null]
        );

        console.log(`✅ [push/subscribe] User ${userOdooUid} — Company ${companyId}`);
        res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error('🚨 [push/subscribe]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

/**
 * @route POST /api/push/unsubscribe
 */
exports.unsubscribe = async (req, res) => {
    try {
        const endpoint = req.body.endpoint;
        if (!endpoint) {
            return res.status(400).json({ status: 'error', error: 'endpoint requis.' });
        }
        await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
        res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error('🚨 [push/unsubscribe]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// Fonctions internes réutilisables par le reste du backend (Phase 2)
// Non exposées en route — appelées directement depuis d'autres controllers.
// =============================================================================

/**
 * Envoie un push à TOUTES les souscriptions d'un utilisateur précis.
 */
exports.sendPushToUser = async (userOdooUid, payload) => {
    const { rows } = await pool.query(`SELECT * FROM push_subscriptions WHERE user_odoo_uid = $1`, [userOdooUid]);
    const results = await Promise.all(rows.map(row => sendPushToSubscription({
        endpoint: row.endpoint,
        keys: { p256dh: row.keys_p256dh, auth: row.keys_auth }
    }, payload)));
    await cleanupExpiredSubscriptions(rows, results);
    return results;
};

/**
 * Envoie un push à TOUS les abonnés d'une société (tous utilisateurs confondus).
 */
exports.sendPushToCompany = async (companyId, payload) => {
    const { rows } = await pool.query(`SELECT * FROM push_subscriptions WHERE company_id = $1`, [companyId]);
    const results = await Promise.all(rows.map(row => sendPushToSubscription({
        endpoint: row.endpoint,
        keys: { p256dh: row.keys_p256dh, auth: row.keys_auth }
    }, payload)));
    await cleanupExpiredSubscriptions(rows, results);
    return results;
};

/**
 * Nettoyage silencieux : une souscription expirée/révoquée renvoie 404/410 —
 * on la supprime pour ne pas la re-tenter indéfiniment.
 */
async function cleanupExpiredSubscriptions(rows, results) {
    const toDelete = rows.filter((_, i) => {
        const r = results[i];
        return r && !r.success && (r.statusCode === 404 || r.statusCode === 410);
    });
    for (const row of toDelete) {
        await pool.query(`DELETE FROM push_subscriptions WHERE id = $1`, [row.id]).catch(() => {});
    }
    if (toDelete.length > 0) {
        console.log(`🧹 [push] ${toDelete.length} souscription(s) expirée(s) nettoyée(s)`);
    }
}
