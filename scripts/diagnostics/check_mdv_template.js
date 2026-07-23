require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('🔍 Étape 0 — Recherche de MDV INGENIERIE...\n');

    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'search_read',
        args: [[['name', 'ilike', 'MDV']]],
        kwargs: { fields: ['id', 'name', 'chart_template'] }
    });

    if (companies.length === 0) {
        console.log('❌ Aucune société trouvée avec "MDV" dans le nom.');
        return;
    }

    console.log(`✅ ${companies.length} société(s) trouvée(s) :`);
    companies.forEach(c => console.log(`   - id=${c.id} | name="${c.name}" | chart_template=${c.chart_template}`));

    const target = companies[0];
    if (companies.length > 1) {
        console.log('\n⚠️  Plusieurs sociétés correspondent — utilisation de la première (id=' + target.id + '). Vérifie si c\'est la bonne.');
    }

    if (target.chart_template === 'bj') {
        console.log(`\n✅ Bon candidat : chart_template="bj", comparaison valide possible.`);
    } else if (!target.chart_template) {
        console.log(`\n❌ chart_template vide — cette société n'a pas de plan comptable installé, comparaison NON valide (même problème que LANDRINA).`);
    } else {
        console.log(`\n⚠️  chart_template="${target.chart_template}", différent de "bj" — comparaison potentiellement non pertinente.`);
    }

    // Vérification supplémentaire : cette société a-t-elle un compte lié à un test précédent ?
    // (simple sanity check : nombre de comptes, pour comparaison ultérieure)
    const accountCount = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_count',
        args: [[['company_ids', 'in', [target.id]]]],
        kwargs: {}
    });
    console.log(`\nNombre de comptes actuels pour ${target.name} : ${accountCount}`);
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
