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

async function countLines(companyId) {
    return odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move.line',
        method: 'search_count',
        args: [[['company_id', '=', companyId]]],
        kwargs: {}
    });
}

async function backupCompany(companyId, companyName) {
    console.log(`\n============================================================`);
    console.log(`💾 Sauvegarde — ${companyName} (id=${companyId})`);
    console.log(`============================================================`);
    const startTime = Date.now();

    try {
        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], []],
            kwargs: {}
        });
        const company = companies[0];
        console.log(`   chart_template actuel = "${company.chart_template}"`);

        const moves = await fetchAll('account.move', [['company_id', '=', companyId]], []);
        console.log(`   Écritures : ${moves.length}`);

        const moveIds = moves.map(m => m.id);
        let moveLines = [];
        if (moveIds.length > 0) {
            const BATCH_SIZE = 500;
            for (let i = 0; i < moveIds.length; i += BATCH_SIZE) {
                const batch = moveIds.slice(i, i + BATCH_SIZE);
                const lines = await fetchAll('account.move.line', [['move_id', 'in', batch]], []);
                moveLines = moveLines.concat(lines);
            }
        }
        console.log(`   Lignes    : ${moveLines.length}`);

        const accounts = await fetchAll('account.account', [['company_ids', 'in', [companyId]]], []);
        console.log(`   Comptes   : ${accounts.length}`);

        const journals = await fetchAll('account.journal', [['company_id', '=', companyId]], []);
        console.log(`   Journaux  : ${journals.length}`);

        const taxes = await fetchAll('account.tax', [['company_id', '=', companyId]], []);
        console.log(`   Taxes     : ${taxes.length}`);

        const snapshot = {
            backup_version: '1.0',
            backup_date: new Date().toISOString(),
            company, moves, move_lines: moveLines, accounts, journals, taxes
        };

        const snapshotSizeKB = Math.round(Buffer.byteLength(JSON.stringify(snapshot)) / 1024);
        console.log(`   Taille    : ${snapshotSizeKB} Ko`);

        const insertResult = await pool.queryWithRetry(
            `INSERT INTO accounting_system_backups
                (company_id, company_name, chart_template_before, fiscal_country_before,
                 moves_count, move_lines_count, accounts_count, journals_count, taxes_count,
                 snapshot, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id`,
            [
                companyId, company.name, company.chart_template || null,
                company.account_fiscal_country_id ? company.account_fiscal_country_id[1] : null,
                moves.length, moveLines.length, accounts.length, journals.length, taxes.length,
                JSON.stringify(snapshot), 'completed', 'backup_all_companies_with_entries.js'
            ]
        );

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   ✅ Backup ID ${insertResult.rows[0].id} (${durationSec}s)`);

        return {
            companyId, companyName: company.name, backupId: insertResult.rows[0].id,
            movesCount: moves.length, linesCount: moveLines.length, status: 'ok'
        };

    } catch (error) {
        console.error(`   🚨 ÉCHEC : ${error.message}`);
        try {
            await pool.queryWithRetry(
                `INSERT INTO accounting_system_backups (company_id, company_name, snapshot, status, error_message, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [companyId, companyName, JSON.stringify({ error: error.message }), 'failed', error.message, 'backup_all_companies_with_entries.js']
            );
        } catch (logError) {
            console.error(`   🚨 Impossible de logger l'échec : ${logError.message}`);
        }
        return { companyId, companyName, backupId: null, status: 'failed', error: error.message };
    }
}

async function main() {
    console.log('🔍 Recherche des sociétés ayant des écritures réelles (account.move.line)...\n');

    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'search_read',
        args: [[], ['id', 'name']],
        kwargs: {}
    });
    console.log(`${companies.length} société(s) au total dans Odoo`);

    const companiesWithEntries = [];
    for (const c of companies) {
        const count = await countLines(c.id);
        console.log(`   ${c.name} (id=${c.id}) : ${count} ligne(s) d'écriture`);
        if (count > 0) {
            companiesWithEntries.push(c);
        }
    }

    if (companiesWithEntries.length === 0) {
        console.log('\n⚠️  Aucune société avec des écritures réelles trouvée. Rien à sauvegarder.');
        process.exit(0);
    }

    console.log(`\n➡️  ${companiesWithEntries.length} société(s) à sauvegarder : ${companiesWithEntries.map(c => c.name).join(', ')}`);

    const results = [];
    for (const c of companiesWithEntries) {
        const result = await backupCompany(c.id, c.name);
        results.push(result);
    }

    console.log(`\n============================================================`);
    console.log('📋 RÉSUMÉ FINAL');
    console.log(`============================================================`);
    results.forEach(r => {
        if (r.status === 'ok') {
            console.log(`✅ ${r.companyName} (id=${r.companyId}) — Backup ID ${r.backupId} — ${r.movesCount} écriture(s), ${r.linesCount} ligne(s)`);
        } else {
            console.log(`❌ ${r.companyName} (id=${r.companyId}) — ÉCHEC : ${r.error}`);
        }
    });

    const failedCount = results.filter(r => r.status === 'failed').length;
    if (failedCount > 0) {
        console.log(`\n⚠️  ${failedCount} sauvegarde(s) ont échoué — à traiter avant de continuer.`);
        process.exit(1);
    }

    console.log('\n✅ Toutes les sauvegardes ont réussi.');
}

main();
