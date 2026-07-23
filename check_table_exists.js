require('dotenv').config();
const pool = require('./services/dbService');

async function main() {
    try {
        const result = await pool.queryWithRetry(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'company_accounting_preferences'
             ORDER BY ordinal_position`,
            []
        );
        if (result.rows.length === 0) {
            console.log('❌ La table company_accounting_preferences N\'EXISTE PAS.');
        } else {
            console.log('✅ La table existe. Colonnes :');
            console.table(result.rows);
        }

        // Vérifie aussi s'il y a une contrainte UNIQUE sur company_id (nécessaire pour ON CONFLICT)
        const constraints = await pool.queryWithRetry(
            `SELECT conname, contype, pg_get_constraintdef(oid) AS definition
             FROM pg_constraint
             WHERE conrelid = 'company_accounting_preferences'::regclass`,
            []
        ).catch(() => ({ rows: [] }));
        if (constraints.rows.length > 0) {
            console.log('\nContraintes :');
            console.table(constraints.rows);
        }
    } catch (error) {
        console.error('Erreur:', error.message);
    }
    process.exit(0);
}
main();
