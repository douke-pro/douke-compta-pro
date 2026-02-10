const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
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
        
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON app_notifications(user_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_company ON app_notifications(company_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON app_notifications(read)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON app_notifications(created_at DESC)`);
        
        console.log('✅ Index créés');
        
        const result = await pool.query(`SELECT COUNT(*) FROM app_notifications`);
        console.log(`📊 Notifications existantes: ${result.rows[0].count}`);
        
        await pool.end();
        console.log('✅ Initialisation terminée');
        
    } catch (error) {
        console.error('🚨 Erreur:', error.message);
        process.exit(1);
    }
}

initDatabase();
