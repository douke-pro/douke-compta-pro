// =============================================================================
// audit-odoo-groups.js — Vérification des groupes Odoo réels (JSON-RPC direct)
// =============================================================================
const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);
const ADMIN_PASSWORD = process.env.ODOO_API_KEY;

const TEST_UID = parseInt(process.argv[2] || '18', 10);

if (!ODOO_URL || !ODOO_DB || !ADMIN_UID || !ADMIN_PASSWORD) {
    console.error('❌ Variables ODOO_URL / ODOO_DB / ODOO_ADMIN_UID / ODOO_API_KEY manquantes.');
    process.exit(1);
}

async function executeKw(model, method, args, kwargs = {}) {
    const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
            service: 'object',
            method: 'execute_kw',
            args: [ODOO_DB, ADMIN_UID, ADMIN_PASSWORD, model, method, args, kwargs],
        },
        id: Date.now(),
    };
    const res = await fetch(`${ODOO_URL}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.error) {
        throw new Error(json.error.data?.message || json.error.message);
    }
    return json.result;
}

async function main() {
    console.log(`🔍 Audit groupes Odoo — UID cible: ${TEST_UID}\n`);

    // 1. Tous les groupes existants (id + nom)
    const allGroups = await executeKw('res.groups', 'search_read', [[]], {
        fields: ['id', 'name'],
        limit: 300,
        order: 'id ASC',
    });
    console.log(`=== ${allGroups.length} groupes Odoo trouvés (id → nom) ===`);
    allGroups.forEach(g => console.log(`  ${g.id} → ${g.name}`));

    // 2. Groupe id=5 spécifiquement (celui supposé dans le patch)
    console.log('\n=== Groupe ID 5 (valeur supposée dans le patch) ===');
    const group5 = allGroups.find(g => g.id === 5);
    if (group5) {
        console.log(`  ✅ Existe : "${group5.name}"`);
    } else {
        console.log('  ❌ Aucun groupe avec ID=5 dans cette instance Odoo.');
    }

    // 3. Groupes réellement assignés à l'utilisateur testé
    console.log(`\n=== Groupes assignés à UID ${TEST_UID} ===`);
    const userGroups = await executeKw('res.groups', 'search_read',
        [[['user_ids', 'in', [TEST_UID]]]],
        { fields: ['id', 'name'], limit: 50 }
    );
    if (userGroups.length === 0) {
        console.log('  ⚠️ AUCUN groupe assigné à cet utilisateur.');
    } else {
        userGroups.forEach(g => console.log(`  ${g.id} → ${g.name}`));
    }
}

main().catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
