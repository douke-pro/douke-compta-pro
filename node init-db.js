# 1. Créer le script d'initialisation
cat > init-db.js << 'EOF'
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    try {
        console.log('🔍 Test de connexion PostgreSQL...');
        
        const test = await pool.query('SELECT NOW()');
        console.log('✅ Connexion OK:', test.rows[0].now);
        
        console.log('🔄 Création de la table app_notifications...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                company_id INTEGER NOT NULL,
                sender_id INTEGER,
                sender_name VARCHAR(255),
                type VARCHAR(50) DEFAULT 'info',
                priority VARCHAR(50) DEFAULT 'normal',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                read_at TIMESTAMP NULL
            );
        `);
        
        console.log('✅ Table créée');
        
        console.log('🔄 Création des index...');
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_user ON app_notifications(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_company ON app_notifications(company_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_read ON app_notifications(read)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_created ON app_notifications(created_at DESC)`);
        
        console.log('✅ Index créés');
        
        const count = await pool.query('SELECT COUNT(*) FROM app_notifications');
        console.log(`📊 Notifications dans la table: ${count.rows[0].count}`);
        
        await pool.end();
        console.log('✅ Initialisation terminée avec succès');
        
    } catch (error) {
        console.error('🚨 ERREUR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

init();

