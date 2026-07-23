require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('🔍 Liste des valeurs possibles du champ chart_template (res.config.settings)\n');

    const fieldsMeta = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.config.settings',
        method: 'fields_get',
        args: [['chart_template']],
        kwargs: { attributes: ['string', 'selection', 'type'] }
    });

    const field = fieldsMeta.chart_template;
    if (!field) {
        console.log('❌ Champ chart_template introuvable sur res.config.settings.');
        return;
    }

    console.log(`Type : ${field.type}`);
    console.log(`Label : ${field.string}\n`);

    if (field.selection) {
        console.log(`Nombre d'options : ${field.selection.length}\n`);
        // Filtrer sur les pays/contextes probables (Bénin, France, OHADA) pour lisibilité
        const relevant = field.selection.filter(([code, label]) =>
            /benin|bj|syscohada|syscebnl|france|pcg|fr\b/i.test(code + ' ' + label)
        );
        console.log('Options pertinentes (filtrées) :');
        relevant.forEach(([code, label]) => console.log(`   - code="${code}" | label="${label}"`));

        console.log(`\n(Sur ${field.selection.length} options totales, ${relevant.length} correspondent au filtre. Liste complète disponible si besoin.)`);
    } else {
        console.log('⚠️  Pas de liste "selection" — le champ est peut-être calculé dynamiquement autrement.');
    }
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
