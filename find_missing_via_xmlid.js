require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1;

async function main() {
    console.log('🔍 Recherche du compte manquant via ir.model.data (xmlid)\n');

    // 1. Récupérer tous les xmlids qui pointent vers account.account, module lié à bj
    console.log('1/3 — Recherche des xmlids account.account liés à "bj"...');
    const xmlids = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'ir.model.data',
        method: 'search_read',
        args: [[
            ['model', '=', 'account.account'],
            ['module', 'ilike', 'bj']
        ]],
        kwargs: { fields: ['id', 'name', 'module', 'res_id'] }
    });
    console.log(`   Xmlids trouvés : ${xmlids.length}`);

    if (xmlids.length === 0) {
        console.log('   ⚠️  Aucun xmlid trouvé avec ce filtre. Le module technique a peut-être un nom différent.');
        console.log('   Essai sans filtre "bj", juste sur account.account, limité à 5 pour voir le format des noms de module...');
        const sample = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'ir.model.data',
            method: 'search_read',
            args: [[['model', '=', 'account.account']]],
            kwargs: { fields: ['module', 'name'], limit: 5 }
        });
        console.log('   Échantillon :', JSON.stringify(sample, null, 2));
        return;
    }

    // 2. Vérifier lesquels de ces res_id existent encore dans account.account
    console.log('\n2/3 — Vérification de l\'existence des comptes correspondants...');
    const resIds = xmlids.map(x => x.res_id);
    const existingAccounts = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_read',
        args: [[['id', 'in', resIds]]],
        kwargs: { fields: ['id', 'code', 'name'], context: { active_test: false } }
    });
    const existingIds = new Set(existingAccounts.map(a => a.id));
    console.log(`   Comptes attendus : ${resIds.length}`);
    console.log(`   Comptes trouvés  : ${existingIds.size}`);

    // 3. Identifier le(s) xmlid(s) orphelin(s) — pointant vers un res_id qui n'existe plus
    console.log('\n3/3 — Xmlid(s) orphelin(s) (compte supprimé) :');
    const orphans = xmlids.filter(x => !existingIds.has(x.res_id));
    if (orphans.length === 0) {
        console.log('   Aucun trouvé avec ce filtre de module — le compte manquant appartient peut-être à un autre module (ex: comptes génériques Odoo, pas spécifiques à bj).');
    } else {
        orphans.forEach(o => {
            console.log(`   🚨 [${o.module}] ${o.name} — pointait vers res_id=${o.res_id} (n'existe plus)`);
        });
    }
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
