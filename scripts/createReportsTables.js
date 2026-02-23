// ============================================
// SCRIPT : Création tables Rapports Financiers
// Usage : node scripts/createReportsTables.js
// Compatible : Render (DATABASE_URL) + Local (DB_HOST, etc.)
// ============================================

const { Pool } = require('pg');
require('dotenv').config();

// Configuration : supporte DATABASE_URL (Render) ou paramètres individuels (local)
const pool = new Pool(
    process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'douke_compta_pro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
      }
);

const SQL_CREATE_TABLES = `
-- TABLE : financial_reports_requests
CREATE TABLE IF NOT EXISTS financial_reports_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    accounting_system VARCHAR(50) NOT NULL CHECK (accounting_system IN (
        'SYSCOHADA_NORMAL',
        'SYSCOHADA_MINIMAL',
        'SYCEBNL_NORMAL',
        'SYCEBNL_ALLEGE',
        'PCG_FRENCH'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'generated',
        'validated',
        'sent',
        'cancelled',
        'error'
    )),
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    validated_at TIMESTAMP,
    sent_at TIMESTAMP,
    requested_by INTEGER NOT NULL,
    processed_by INTEGER,
    validated_by INTEGER,
    pdf_files JSONB DEFAULT '{}',
    odoo_data JSONB,
    notes TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reports_user ON financial_reports_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_company ON financial_reports_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON financial_reports_requests(status);
CREATE INDEX IF NOT EXISTS idx_reports_requested_at ON financial_reports_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_accounting_system ON financial_reports_requests(accounting_system);
CREATE INDEX IF NOT EXISTS idx_reports_requested_by ON financial_reports_requests(requested_by);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_financial_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_financial_reports_timestamp ON financial_reports_requests;
CREATE TRIGGER trigger_update_financial_reports_timestamp
    BEFORE UPDATE ON financial_reports_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_reports_timestamp();

-- TABLE : financial_reports_notifications
CREATE TABLE IF NOT EXISTS financial_reports_notifications (
    id SERIAL PRIMARY KEY,
    report_request_id INTEGER REFERENCES financial_reports_requests(id) ON DELETE CASCADE,
    recipient_user_id INTEGER NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'request_created',
        'processing_started',
        'reports_generated',
        'reports_validated',
        'reports_sent',
        'request_cancelled',
        'generation_error'
    )),
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_report ON financial_reports_notifications(report_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON financial_reports_notifications(recipient_user_id);

-- Commentaires
COMMENT ON TABLE financial_reports_requests IS 'Demandes de génération d''états financiers';
COMMENT ON TABLE financial_reports_notifications IS 'Notifications liées aux rapports financiers';
`;

async function createTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Connexion à PostgreSQL...');
        
        // Test de connexion
        const testResult = await client.query('SELECT NOW()');
        console.log('✅ Connexion OK:', testResult.rows[0].now);
        
        console.log('\n🚀 Création des tables pour le module Rapports Financiers...');
        
        await client.query('BEGIN');
        await client.query(SQL_CREATE_TABLES);
        await client.query('COMMIT');
        
        console.log('✅ Tables créées avec succès !');
        console.log('   - financial_reports_requests');
        console.log('   - financial_reports_notifications');
        
        // Vérification
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'financial_reports%'
            ORDER BY table_name
        `);
        
        console.log('\n📋 Tables présentes dans la base :');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
        // Compter les colonnes
        const columnsResult = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.columns
            WHERE table_name = 'financial_reports_requests'
        `);
        console.log(`\n📊 Table financial_reports_requests : ${columnsResult.rows[0].count} colonnes`);
        
        // Compter les lignes
        const countResult = await client.query('SELECT COUNT(*) FROM financial_reports_requests');
        console.log(`📊 Nombre de demandes : ${countResult.rows[0].count}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erreur lors de la création des tables:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        client.release();
        await pool.end();
        console.log('\n👋 Connexion fermée');
    }
}

// Exécution
createTables()
    .then(() => {
        console.log('\n🎉 Migration terminée avec succès !');
        console.log('💡 Vous pouvez maintenant redémarrer votre serveur Node.js');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Migration échouée');
        process.exit(1);
    });
