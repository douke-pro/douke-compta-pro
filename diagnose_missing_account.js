require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1;

async function listAccounts(companyId, activeTest) {
    return odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_read',
        args: [[['company_ids', 'in', [companyId]]], ['id', 'code', 'name', 'active']],
        kwargs: { context: { active_test: activeTest } }
    });
}

async function main() {
    console.log('🔍 DIAGNOSTIC — recherche du compte manquant (1143 vs 1142)\n');

    // Comptes actifs actuellement
    const activeAccounts = await listAccounts(TEST_COMPANY_ID, true);
    console.log(`Comptes actifs actuels : ${activeAccounts.length}`);

    // Comptes actifs + inactifs (pour voir si le compte a juste été désactivé)
    const allAccounts = await listAccounts(TEST_COMPANY_ID, false);
    console.log(`Comptes actifs + inactifs (active_test=false) : ${allAccounts.length}`);

    const inactiveOnly = allAccounts.filter(a => !a.active);
    console.log(`\nComptes INACTIFS trouvés : ${inactiveOnly.length}`);
    if (inactiveOnly.length > 0) {
        console.log('Liste des comptes inactifs (candidats au "compte manquant") :');
        inactiveOnly.forEach(a => console.log(`   - [${a.code}] ${a.name} (id=${a.id})`));
    }

    if (allAccounts.length === 1143) {
        console.log('\n✅ Le compte n\'a PAS été supprimé, seulement désactivé (active=False).');
        console.log('   ➡️  Aucune perte de données réelle, mais le compte est masqué par défaut dans Odoo.');
    } else {
        console.log(`\n⚠️  Total avec inactifs = ${allAccounts.length}, différent de 1143 attendu.`);
        console.log('   ➡️  Cela suggère une suppression réelle ou une fusion, pas juste une désactivation.');
    }
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
