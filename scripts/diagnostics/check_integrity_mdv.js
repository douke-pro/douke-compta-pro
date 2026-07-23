require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 4; // MDV INGENIERIES

async function main() {
    console.log('🔍 VÉRIFICATION D\'INTÉGRITÉ — TÉMOIN MDV INGENIERIES (company_id=' + TEST_COMPANY_ID + ')\n');
    let issues = 0;

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

    console.log('\n2/4 — Comptes par défaut des journaux (account.journal)...');
    const journals = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.journal',
        method: 'search_read',
        args: [[['company_id', '=', TEST_COMPANY_ID]]],
        kwargs: { fields: ['name', 'type', 'default_account_id'], context: { active_test: false } }
    });
    console.log(`   Journaux trouvés : ${journals.length}`);
    for (const j of journals) {
        if (!j.default_account_id) {
            console.log(`   ⚠️  [${j.type}] ${j.name} — default_account_id VIDE`);
            issues++;
        } else {
            console.log(`   ✅ [${j.type}] ${j.name} — default_account_id OK`);
        }
    }

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
                console.log(`   ⚠️  Ligne sans compte — tax_id=${line.tax_id[0]} (${line.tax_id[1]})`);
                taxIssues++;
                issues++;
            }
        }
        if (taxIssues === 0) console.log('   ✅ Toutes les lignes de répartition "tax" ont un compte.');
    }

    console.log('\n4/4 — Nombre total de comptes (rappel) :');
    const accountCount = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_count',
        args: [[['company_ids', 'in', [TEST_COMPANY_ID]]]],
        kwargs: {}
    });
    console.log(`   ${accountCount} comptes`);

    console.log('\n============================================================');
    console.log(`VERDICT TÉMOIN — ${issues} anomalie(s) sur une société JAMAIS testée`);
    console.log('============================================================');
    console.log(issues > 0
        ? '   ➡️  Si ce nombre est proche de celui de DOUKE (22), ce sont des faux positifs structurels du template bj.'
        : '   ➡️  Aucune anomalie ici — à comparer avec le résultat de DOUKE.');
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
