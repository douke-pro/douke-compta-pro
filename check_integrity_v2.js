require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1;

async function main() {
    console.log('🔍 VÉRIFICATION D\'INTÉGRITÉ v2 — company_id=' + TEST_COMPANY_ID + '\n');
    let issues = 0;

    // 0. Découvrir dynamiquement les champs *_account_id de res.company
    console.log('0/4 — Découverte des champs comptables réels sur res.company...');
    const companyFieldsMeta = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'fields_get',
        args: [],
        kwargs: { attributes: ['string', 'relation', 'type'] }
    });
    const accountFieldNames = Object.keys(companyFieldsMeta).filter(f =>
        f.endsWith('_account_id') && companyFieldsMeta[f].relation === 'account.account'
    );
    console.log(`   Champs *_account_id trouvés (relation account.account) : ${accountFieldNames.length}`);
    accountFieldNames.forEach(f => console.log(`      - ${f} (${companyFieldsMeta[f].string})`));

    // 1. Lire ces champs sur la société
    console.log('\n1/4 — Valeurs de ces champs sur company_id=' + TEST_COMPANY_ID + '...');
    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'read',
        args: [[TEST_COMPANY_ID], ['name', ...accountFieldNames]],
        kwargs: {}
    });
    const company = companies[0];
    for (const field of accountFieldNames) {
        const val = company[field];
        if (!val) {
            console.log(`   ⚠️  ${field} : VIDE`);
            issues++;
        } else {
            console.log(`   ✅ ${field} : ${JSON.stringify(val)}`);
        }
    }

    // 2. Comptes par défaut des journaux (account.journal) — découverte dynamique aussi
    console.log('\n2/4 — Comptes par défaut des journaux (account.journal)...');
    const journalFieldsMeta = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.journal',
        method: 'fields_get',
        args: [],
        kwargs: { attributes: ['string', 'relation', 'type'] }
    });
    const journalAccountFields = Object.keys(journalFieldsMeta).filter(f =>
        f.endsWith('_account_id') && journalFieldsMeta[f].relation === 'account.account'
    );
    console.log(`   Champs *_account_id trouvés sur account.journal : ${journalAccountFields.length}`);
    journalAccountFields.forEach(f => console.log(`      - ${f}`));

    const journals = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.journal',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID]]],
        kwargs: { fields: ['name', 'type', ...journalAccountFields], context: { active_test: false } }
    });
    console.log(`\n   Journaux trouvés : ${journals.length}`);
    for (const j of journals) {
        const emptyFields = journalAccountFields.filter(f => j[f] === false);
        // On ne signale que default_account_id comme critique pour tous types
        const criticalEmpty = emptyFields.includes('default_account_id');
        if (criticalEmpty) {
            console.log(`   ⚠️  [${j.type}] ${j.name} — default_account_id VIDE`);
            issues++;
        } else {
            console.log(`   ✅ [${j.type}] ${j.name} — default_account_id OK`);
        }
    }

    // 3. Lignes de répartition des taxes
    console.log('\n3/4 — Répartition des taxes (account.tax.repartition.line)...');
    const taxes = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.tax',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID]]],
        kwargs: { fields: ['name'], context: { active_test: false } }
    });
    console.log(`   Taxes trouvées : ${taxes.length}`);
    const taxIds = taxes.map(t => t.id);
    let taxIssues = 0;
    if (taxIds.length > 0) {
        const repLines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.tax.repartition.line',
            method: 'search_read',
            args: [[['tax_id', 'in', taxIds], ['repartition_type', '=', 'tax']]],
            kwargs: { fields: ['tax_id', 'account_id'] }
        });
        for (const line of repLines) {
            if (!line.account_id) {
                console.log(`   ⚠️  Ligne de répartition sans compte — tax_id=${line.tax_id[0]} (${line.tax_id[1]})`);
                taxIssues++;
                issues++;
            }
        }
        if (taxIssues === 0) console.log('   ✅ Toutes les lignes de répartition de type "tax" ont un compte assigné.');
    }

    // 4. Lignes de brouillon sans compte
    console.log('\n4/4 — Comptes référencés par des écritures en brouillon (account.move.line)...');
    const draftLines = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move.line',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID], ['move_id.state', '=', 'draft']]],
        kwargs: { fields: ['account_id', 'move_id'], limit: 1000 }
    });
    console.log(`   Lignes en brouillon trouvées : ${draftLines.length}`);
    const orphanLines = draftLines.filter(l => !l.account_id);
    if (orphanLines.length > 0) {
        console.log(`   ⚠️  ${orphanLines.length} ligne(s) SANS compte assigné :`);
        orphanLines.slice(0, 10).forEach(l => console.log(`      - move_id=${l.move_id[0]} (${l.move_id[1]})`));
        issues += orphanLines.length;
    } else if (draftLines.length > 0) {
        console.log('   ✅ Toutes les lignes en brouillon ont un compte assigné.');
    } else {
        console.log('   ℹ️  Aucune ligne en brouillon à vérifier.');
    }

    // VERDICT
    console.log('\n============================================================');
    console.log('VERDICT');
    console.log('============================================================');
    if (issues === 0) {
        console.log('✅ Aucune anomalie détectée. La configuration comptable semble intacte malgré le compte manquant.');
    } else {
        console.log(`⚠️  ${issues} anomalie(s) détectée(s) — voir détail ci-dessus.`);
        console.log('   ➡️  Ne pas construire la fonctionnalité avant d\'avoir corrigé/compris ces points.');
    }
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
