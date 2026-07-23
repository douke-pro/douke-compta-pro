require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('🔍 Recherche des champs liés au plan comptable sur res.config.settings...\n');

    // 1. Lister tous les champs de res.config.settings contenant "chart" ou "template" ou "coa"
    const fields = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.config.settings',
        method: 'fields_get',
        args: [],
        kwargs: { attributes: ['string', 'type', 'help', 'selection'] }
    });

    const relevant = Object.entries(fields).filter(([name]) =>
        /chart|coa|template|fiscal_country|localization/i.test(name)
    );

    console.log(`--- Champs pertinents trouvés (${relevant.length}) ---`);
    relevant.forEach(([name, def]) => {
        console.log(`\n${name} (${def.type})`);
        console.log(`  Label : ${def.string}`);
        if (def.help) console.log(`  Aide  : ${def.help}`);
        if (def.selection) console.log(`  Options : ${JSON.stringify(def.selection).slice(0, 300)}`);
    });

    // 2. Vérifier si le modèle account.chart.template expose une méthode "try_loading" accessible
    console.log('\n--- Méthodes disponibles sur account.chart.template ---');
    try {
        const chartFields = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.chart.template',
            method: 'fields_get',
            args: [],
            kwargs: { attributes: ['string', 'type'] }
        });
        console.log(`✅ Modèle account.chart.template accessible, ${Object.keys(chartFields).length} champs`);
    } catch (e) {
        console.log(`❌ account.chart.template non accessible : ${e.message}`);
    }

    // 3. Lister les templates disponibles pour le Bénin (ou génériques)
    console.log('\n--- Recherche des chart templates disponibles ---');
    try {
        const templates = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.chart.template',
            method: 'search_read',
            args: [[], ['id', 'name']],
            kwargs: { limit: 20 }
        });
        console.log(JSON.stringify(templates, null, 2));
    } catch (e) {
        console.log(`❌ Impossible de lister les templates : ${e.message}`);
    }
}
main();
