// =============================================================================
// FICHIER : src/scripts/initPushSubscriptions.js
// Migration : table push_subscriptions (Phase 1 - Notifications Push)
// =============================================================================
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL1 || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initPushSubscriptions() {
    try {
        console.log('🔄 Création de la table push_subscriptions...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_odoo_uid INTEGER NOT NULL,
                company_id INTEGER,
                endpoint TEXT NOT NULL UNIQUE,
                keys_p256dh TEXT NOT NULL,
                keys_auth TEXT NOT NULL,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Table créée');

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_odoo_uid)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_company ON push_subscriptions(company_id)`);

        console.log('✅ Index créés');

        const result = await pool.query(`SELECT COUNT(*) FROM push_subscriptions`);
        console.log(`📊 Souscriptions existantes: ${result.rows[0].count}`);

        await pool.end();
        console.log('✅ Migration terminée');

    } catch (error) {
        console.error('🚨 Erreur:', error.message);
        process.exit(1);
    }
}

initPushSubscriptions();
