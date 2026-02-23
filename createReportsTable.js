// ============================================
// SCRIPT : Création table financial_reports_requests
// Usage : node scripts/createReportsTable.js
// ============================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createTable() {
    console.log('🔍 Connexion à PostgreSQL...');
    
    try {
        // Test de connexion
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Connexion OK:', testResult.rows[0].now);
        
        console.log('\n📋 Vérification si la table existe...');
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'financial_reports_requests'
            );
        `);
        
        if (checkTable.rows[0].exists) {
            console.log('⚠️  La table existe déjà !');
            console.log('\nVoulez-vous la supprimer et recréer ? (Ctrl+C pour annuler)');
            
            // Attendre 5 secondes
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('🗑️  Suppression de l\'ancienne table...');
            await pool.query('DROP TABLE IF EXISTS financial_reports_requests CASCADE');
            console.log('✅ Ancienne table supprimée');
        }
        
        console.log('\n🔨 Création de la table...');
        await pool.query(`
            CREATE TABLE financial_reports_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                company_id INTEGER NOT NULL,
                accounting_system VARCHAR(50) NOT NULL,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                fiscal_year INTEGER,
                requested_by INTEGER NOT NULL,
                requested_at TIMESTAMP DEFAULT NOW(),
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                processed_by INTEGER,
                processed_at TIMESTAMP,
                validated_by INTEGER,
                validated_at TIMESTAMP,
                sent_at TIMESTAMP,
                odoo_data JSONB,
                pdf_files JSONB,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                deleted_at TIMESTAMP
            );
        `);
        console.log('✅ Table créée avec succès !');
        
        console.log('\n📊 Création des index...');
        
        await pool.query('CREATE INDEX idx_reports_requests_user_id ON financial_reports_requests(user_id)');
        console.log('✅ Index user_id créé');
        
        await pool.query('CREATE INDEX idx_reports_requests_company_id ON financial_reports_requests(company_id)');
        console.log('✅ Index company_id créé');
        
        await pool.query('CREATE INDEX idx_reports_requests_status ON financial_reports_requests(status)');
        console.log('✅ Index status créé');
        
        await pool.query('CREATE INDEX idx_reports_requests_requested_at ON financial_reports_requests(requested_at DESC)');
        console.log('✅ Index requested_at créé');
        
        console.log('\n🔍 Vérification finale...');
        const verification = await pool.query(`
            SELECT 
                table_name, 
                column_name, 
                data_type
            FROM information_schema.columns
            WHERE table_name = 'financial_reports_requests'
            ORDER BY ordinal_position
        `);
        
        console.log(`\n✅ Table créée avec ${verification.rows.length} colonnes :`);
        verification.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        const count = await pool.query('SELECT COUNT(*) FROM financial_reports_requests');
        console.log(`\n📊 Nombre de lignes : ${count.rows[0].count}`);
        
        console.log('\n🎉 SUCCÈS ! La table est prête à être utilisée.');
        console.log('💡 Vous pouvez maintenant redémarrer votre serveur Node.js');
        
    } catch (error) {
        console.error('\n❌ ERREUR :', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n👋 Connexion fermée');
    }
}

// Exécuter
createTable();
