require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const TEST_COMPANY_ID = 1; // DOUKE Growth and Funding
const ORIGINAL_TEMPLATE = 'bj';
const TEST_TEMPLATE = 'bj_syscebnl';

async function countAccounts(companyId) {
    return odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.account',
        method: 'search_count',
        args: [[['company_ids', 'in', [companyId]]]],
        kwargs: {}
    });
}

async function readCompany(companyId) {
    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'read',
        args: [[companyId], ['name', 'chart_template', 'write_date']],
        kwargs: {}
    });
    return companies[0];
}

async function switchChartTemplate(companyId, newTemplate) {
    const settingsId = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.config.settings',
        method: 'create',
        args: [{ company_id: companyId, chart_template: newTemplate }],
        kwargs: {}
    });
    const result = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.config.settings',
        method: 'execute',
        args: [[settingsId]],
        kwargs: {}
    });
    return result;
}

async function main() {
    console.log(`🧪 TEST COMPLET — changement réel de chart_template sur company_id=${TEST_COMPANY_ID}\n`);

    try {
        console.log('0/5 — Vérifications de sécurité...');
        const postedCount = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'search_count',
            args: [[['company_id', '=', TEST_COMPANY_ID], ['state', '=', 'posted']]],
            kwargs: {}
        });
        if (postedCount > 0) {
            console.error(`❌ ARRÊT : ${postedCount} écriture(s) postée(s). Test annulé.`);
            process.exit(1);
        }
        console.log('   ✅ 0 écriture postée.\n');

        console.log('1/5 — État initial...');
        const before = await readCompany(TEST_COMPANY_ID);
        const accountsBefore = await countAccounts(TEST_COMPANY_ID);
        console.log(`   chart_template : ${before.chart_template}`);
        console.log(`   Nombre de comptes : ${accountsBefore}`);

        if (before.chart_template !== ORIGINAL_TEMPLATE) {
            console.error(`❌ ARRÊT : chart_template actuel ("${before.chart_template}") différent de l'attendu ("${ORIGINAL_TEMPLATE}"). Vérifie manuellement avant de continuer.`);
            process.exit(1);
        }

        console.log(`\n2/5 — Changement RÉEL : ${ORIGINAL_TEMPLATE} → ${TEST_TEMPLATE}...`);
        const switchResult = await switchChartTemplate(TEST_COMPANY_ID, TEST_TEMPLATE);
        console.log(`   Résultat execute() : ${JSON.stringify(switchResult)}`);

        const afterSwitch = await readCompany(TEST_COMPANY_ID);
        const accountsAfterSwitch = await countAccounts(TEST_COMPANY_ID);
        console.log(`   chart_template APRÈS changement : ${afterSwitch.chart_template}`);
        console.log(`   Nombre de comptes APRÈS changement : ${accountsAfterSwitch}`);

        const switchWorked = afterSwitch.chart_template === TEST_TEMPLATE;
        const accountsChanged = accountsAfterSwitch !== accountsBefore;
        console.log(`   ➡️  chart_template a changé : ${switchWorked ? '✅ OUI' : '❌ NON'}`);
        console.log(`   ➡️  Nombre de comptes a changé : ${accountsChanged ? '✅ OUI (' + accountsBefore + ' → ' + accountsAfterSwitch + ')' : '⚠️  NON (identique)'}`);

        console.log(`\n3/5 — Retour à l'état initial : ${TEST_TEMPLATE} → ${ORIGINAL_TEMPLATE}...`);
        const revertResult = await switchChartTemplate(TEST_COMPANY_ID, ORIGINAL_TEMPLATE);
        console.log(`   Résultat execute() : ${JSON.stringify(revertResult)}`);

        const afterRevert = await readCompany(TEST_COMPANY_ID);
        const accountsAfterRevert = await countAccounts(TEST_COMPANY_ID);
        console.log(`   chart_template APRÈS retour : ${afterRevert.chart_template}`);
        console.log(`   Nombre de comptes APRÈS retour : ${accountsAfterRevert}`);

        console.log('\n============================================================');
        console.log('4/5 — VERDICT');
        console.log('============================================================');
        console.log(`chart_template restauré à "${ORIGINAL_TEMPLATE}" : ${afterRevert.chart_template === ORIGINAL_TEMPLATE ? '✅ OUI' : '❌ NON — VÉRIFICATION MANUELLE REQUISE'}`);
        console.log(`Nombre de comptes restauré (${accountsBefore}) : ${accountsAfterRevert === accountsBefore ? '✅ IDENTIQUE' : '⚠️  DIFFÉRENT (' + accountsBefore + ' → ' + accountsAfterRevert + ') — à examiner'}`);

        console.log('\n5/5 — CONCLUSION');
        console.log('============================================================');
        if (switchWorked && accountsChanged && afterRevert.chart_template === ORIGINAL_TEMPLATE) {
            console.log('✅ Le mécanisme fonctionne : changement réel + régénération du plan comptable + retour possible.');
            console.log('   ➡️  On peut construire la fonctionnalité complète sur cette base.');
        } else if (switchWorked && !accountsChanged) {
            console.log('⚠️  Le champ change mais le plan comptable ne semble PAS se régénérer (même nombre de comptes).');
            console.log('   ➡️  Risque : changer juste l\'étiquette sans vraie migration. À investiguer avant de construire la fonctionnalité.');
        } else {
            console.log('❌ Le mécanisme ne fonctionne pas comme attendu. Ne pas construire la fonctionnalité sur cette base pour l\'instant.');
        }

        if (afterRevert.chart_template !== ORIGINAL_TEMPLATE) {
            console.log('\n🚨 ATTENTION : la société N\'A PAS été restaurée à son état initial. Vérifie manuellement dans Odoo immédiatement.');
        }

    } catch (error) {
        console.error('\n🚨 ERREUR PENDANT LE TEST:', error.message);
        console.error('\n🚨 Vérifie manuellement l\'état de chart_template pour company_id=' + TEST_COMPANY_ID + ' dans Odoo — le test a peut-être été interrompu en cours de route.');
        process.exit(1);
    }
}

main();
