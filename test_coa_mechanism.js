require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1; // DOUKE Growth and Funding

async function main() {
    console.log(`🧪 TEST MÉCANIQUE — res.config.settings.execute() sur company_id=${TEST_COMPANY_ID}\n`);
    console.log('⚠️  Valeur identique utilisée (bj -> bj) : test du mécanisme, pas un vrai changement métier.\n');

    try {
        console.log('0/4 — Vérifications préalables...');
        const companiesBefore = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[TEST_COMPANY_ID], ['name', 'chart_template']],
            kwargs: {}
        });
        const companyBefore = companiesBefore[0];
        console.log(`   Société : ${companyBefore.name}`);
        console.log(`   chart_template AVANT : ${companyBefore.chart_template}`);

        const postedCount = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'search_count',
            args: [[['company_id', '=', TEST_COMPANY_ID], ['state', '=', 'posted']]],
            kwargs: {}
        });
        console.log(`   Écritures POSTÉES : ${postedCount}`);

        if (postedCount > 0) {
            console.error('\n❌ ARRÊT : cette société a des écritures postées. Test annulé par sécurité.');
            process.exit(1);
        }
        console.log('   ✅ 0 écriture postée, test possible.\n');

        console.log('1/4 — Création du wizard res.config.settings...');
        const settingsId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.config.settings',
            method: 'create',
            args: [{
                company_id: TEST_COMPANY_ID,
                chart_template: companyBefore.chart_template
            }],
            kwargs: {}
        });
        console.log(`   ✅ Wizard créé, id=${settingsId}`);

        console.log('\n2/4 — Appel de execute()...');
        const executeResult = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.config.settings',
            method: 'execute',
            args: [[settingsId]],
            kwargs: {}
        });
        console.log(`   ✅ execute() a répondu sans exception. Résultat brut :`, JSON.stringify(executeResult));

        console.log('\n3/4 — Relecture de la société après execute()...');
        const companiesAfter = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[TEST_COMPANY_ID], ['name', 'chart_template', 'write_date']],
            kwargs: {}
        });
        const companyAfter = companiesAfter[0];
        console.log(`   chart_template APRÈS : ${companyAfter.chart_template}`);
        console.log(`   write_date APRÈS     : ${companyAfter.write_date}`);

        console.log('\n4/4 — VERDICT');
        console.log('============================================================');
        if (companyAfter.chart_template === companyBefore.chart_template) {
            console.log('✅ Mécanisme execute() fonctionne SANS erreur d\'accès.');
            console.log('   Le champ est resté identique (attendu, car on a testé avec la même valeur).');
            console.log('   ➡️  On peut maintenant tester un VRAI changement de valeur en confiance.');
        } else {
            console.log('⚠️  Le chart_template a changé alors qu\'on avait mis la même valeur. À investiguer.');
        }

    } catch (error) {
        console.error('\n🚨 ÉCHEC DU MÉCANISME :', error.message);
        console.error('\nCeci confirme probablement une restriction Odoo SaaS sur ce type d\'opération via API.');
        process.exit(1);
    }
}

main();
