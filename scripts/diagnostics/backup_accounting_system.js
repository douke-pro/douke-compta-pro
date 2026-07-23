require('dotenv').config();

const pool = require('./services/dbService');
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function fetchAll(model, domain, fields) {
    return odooExecuteKw({
        uid: ADMIN_UID_INT,
        model,
        method: 'search_read',
        args: [domain, fields],
        kwargs: { limit: 0 }
    });
}

async function main() {
    const companyId = parseInt(process.argv[2]);
    if (!companyId) {
        console.error('❌ Usage: node backup_accounting_system.js <companyId>');
        process.exit(1);
    }

    console.log(`\n💾 Démarrage sauvegarde comptable complète — company_id=${companyId}\n`);
    const startTime = Date.now();

    try {
        console.log('1/6 — Lecture configuration société...');
        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], []],
            kwargs: {}
        });
        if (!companies || companies.length === 0) {
            throw new Error(`Société introuvable : company_id=${companyId}`);
        }
        const company = companies[0];
        console.log(`   ✅ ${company.name} — chart_template actuel = "${company.chart_template}"`);

        console.log('2/6 — Lecture des écritures (account.move)...');
        const moves = await fetchAll('account.move', [['company_id', '=', companyId]], []);
        console.log(`   ✅ ${moves.length} écriture(s) trouvée(s)`);

        console.log('3/6 — Lecture des lignes d\'écritures (account.move.line)...');
        const moveIds = moves.map(m => m.id);
        let moveLines = [];
        if (moveIds.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < moveIds.length; i += BATCH_SIZE) {
                const batch = moveIds.slice(i, i + BATCH_SIZE);
                const lines = await fetchAll('account.move.line', [['move_id', 'in', batch]], []);
                moveLines = moveLines.concat(lines);
                console.log(`   ... lot ${Math.floor(i / BATCH_SIZE) + 1} : ${lines.length} ligne(s)`);
            }
        }
        console.log(`   ✅ ${moveLines.length} ligne(s) d'écriture au total`);

        console.log('4/6 — Lecture du plan comptable (account.account)...');
        const accounts = await fetchAll('account.account', [['company_ids', 'in', [companyId]]], []);
        console.log(`   ✅ ${accounts.length} compte(s)`);

        console.log('5/6 — Lecture des journaux (account.journal)...');
        const journals = await fetchAll('account.journal', [['company_id', '=', companyId]], []);
        console.log(`   ✅ ${journals.length} journal/journaux`);

        console.log('6/6 — Lecture des taxes (account.tax)...');
        const taxes = await fetchAll('account.tax', [['company_id', '=', companyId]], []);
        console.log(`   ✅ ${taxes.length} taxe(s)`);

        const snapshot = {
            backup_version: '1.0',
            backup_date: new Date().toISOString(),
            company,
            moves,
            move_lines: moveLines,
            accounts,
            journals,
            taxes
        };

        const snapshotSizeKB = Math.round(Buffer.byteLength(JSON.stringify(snapshot)) / 1024);
        console.log(`\n📦 Taille de l'instantané : ${snapshotSizeKB} Ko`);

        console.log('\n💾 Insertion dans accounting_system_backups...');
        const insertResult = await pool.queryWithRetry(
            `INSERT INTO accounting_system_backups
                (company_id, company_name, chart_template_before, fiscal_country_before,
                 moves_count, move_lines_count, accounts_count, journals_count, taxes_count,
                 snapshot, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id, backup_date`,
            [
                companyId,
                company.name,
                company.chart_template || null,
                company.account_fiscal_country_id ? company.account_fiscal_country_id[1] : null,
                moves.length,
                moveLines.length,
                accounts.length,
                journals.length,
                taxes.length,
                JSON.stringify(snapshot),
                'completed',
                'backup_accounting_system.js'
            ]
        );

        const backupRow = insertResult.rows[0];
        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n============================================================');
        console.log('✅ SAUVEGARDE TERMINÉE');
        console.log('============================================================');
        console.log(`Backup ID       : ${backupRow.id}`);
        console.log(`Date            : ${backupRow.backup_date}`);
        console.log(`Société         : ${company.name} (id=${companyId})`);
        console.log(`chart_template  : ${company.chart_template}`);
        console.log(`Écritures       : ${moves.length}`);
        console.log(`Lignes          : ${moveLines.length}`);
        console.log(`Comptes         : ${accounts.length}`);
        console.log(`Journaux        : ${journals.length}`);
        console.log(`Taxes           : ${taxes.length}`);
        console.log(`Durée           : ${durationSec}s`);
        console.log('\n⚠️  Conserve ce Backup ID — il sera nécessaire pour toute restauration.');

    } catch (error) {
        console.error('\n🚨 ÉCHEC DE LA SAUVEGARDE:', error.message);
        try {
            await pool.queryWithRetry(
                `INSERT INTO accounting_system_backups
                    (company_id, snapshot, status, error_message, created_by)
                 VALUES ($1, $2, $3, $4, $5)`,
                [companyId, JSON.stringify({ error: error.message }), 'failed', error.message, 'backup_accounting_system.js']
            );
        } catch (logError) {
            console.error('🚨 Impossible même de logger l\'échec:', logError.message);
        }
        process.exit(1);
    }
}

main();
