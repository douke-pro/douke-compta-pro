require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('🔍 Étape 0 — Recherche de LANDRINA LTD...\n');

    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'search_read',
        args: [[['name', 'ilike', 'LANDRINA']]],
        kwargs: { fields: ['id', 'name', 'chart_template'] }
    });

    if (companies.length === 0) {
        console.log('❌ Aucune société trouvée avec "LANDRINA" dans le nom.');
        return;
    }

    console.log(`✅ ${companies.length} société(s) trouvée(s) :`);
    companies.forEach(c => console.log(`   - id=${c.id} | name="${c.name}" | chart_template=${c.chart_template}`));

    const target = companies[0];
    if (companies.length > 1) {
        console.log('\n⚠️  Plusieurs sociétés correspondent — utilisation de la première (id=' + target.id + '). Vérifie si c\'est la bonne.');
    }
    if (target.chart_template !== 'bj') {
        console.log(`\n⚠️  ATTENTION : cette société utilise le template "${target.chart_template}", pas "bj". La comparaison pourrait ne pas être pertinente.`);
    }

    console.log(`\n➡️  company_id retenu pour comparaison : ${target.id} (${target.name})\n`);
    console.log('Pour lancer la vérification d\'intégrité complète dessus, relance check_integrity_v2.js en changeant TEST_COMPANY_ID à ' + target.id + '.');
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
