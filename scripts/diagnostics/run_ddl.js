require('dotenv').config();
const fs = require('fs');
const pool = require('./services/dbService');

async function main() {
    const sql = fs.readFileSync('001_create_accounting_system_backups.sql', 'utf8');
    try {
        await pool.queryWithRetry(sql, []);
        console.log('✅ Table accounting_system_backups créée (ou déjà existante)');
    } catch (error) {
        console.error('🚨 Erreur:', error.message);
        process.exit(1);
    }
    process.exit(0);
}
main();
