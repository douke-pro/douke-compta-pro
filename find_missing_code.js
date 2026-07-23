require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1;

async function main() {
    console.log('🔍 Recherche du code de compte manquant\n');

    // 1. Comptes réels actuels de DOUKE (code + id)
    const realAccounts = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_read',
        args: [[['company_ids', 'in', [TEST_COMPANY_ID]]], ['code', 'name']],
        kwargs: { context: { active_test: false } }
    });
    console.log(`Comptes réels actuels : ${realAccounts.length}`);
    const realCodes = new Set(realAccounts.map(a => a.code));

    // 2. Trouver le chart template 'bj'
    const templates = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.chart.template',
        method: 'search_read',
        args: [[['name', 'ilike', 'bj']]], // ajuster si besoin
        kwargs: { fields: ['id', 'name'] }
    });
    console.log('\nChart templates trouvés contenant "bj":');
    templates.forEach(t => console.log(`   - id=${t.id} name=${t.name}`));

    if (templates.length === 0) {
        console.log('\n⚠️  Aucun chart template trouvé avec "bj" dans le nom. Vérifier manuellement le nom exact.');
        return;
    }

    // 3. Comptes théoriques du template (prendre le premier match, ajuster si plusieurs)
    const templateId = templates[0].id;
    const templateAccounts = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account.template',
        method: 'search_read',
        args: [[['chart_template_id', '=', templateId]]],
        kwargs: { fields: ['code', 'name'] }
    });
    console.log(`\nComptes théoriques du template "${templates[0].name}" : ${templateAccounts.length}`);
    const templateCodes = new Set(templateAccounts.map(a => a.code));

    // 4. Diff : codes présents dans le template mais absents des comptes réels
    const missingCodes = [...templateCodes].filter(c => !realCodes.has(c));
    console.log(`\n📋 Codes présents dans le template mais ABSENTS des comptes réels : ${missingCodes.length}`);
    missingCodes.slice(0, 20).forEach(c => {
        const acc = templateAccounts.find(a => a.code === c);
        console.log(`   - [${c}] ${acc ? acc.name : '?'}`);
    });
    if (missingCodes.length > 20) console.log(`   ... et ${missingCodes.length - 20} autres`);
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
