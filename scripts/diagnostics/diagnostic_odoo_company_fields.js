require('dotenv').config();
// ============================================================
// DIAGNOSTIC — Recherche du champ "système comptable" dans Odoo (res.company)
// Script en LECTURE SEULE. N'écrit rien, ne modifie rien.
//
// Usage :
//   node diagnostic_odoo_company_fields.js <companyId>
//
// Exemple :
//   node diagnostic_odoo_company_fields.js 1
// ============================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

const KEYWORDS_IN_VALUE = ['SYSCOHADA', 'SYCEBNL', 'PCG', 'OHADA'];
const KEYWORDS_IN_FIELDNAME = ['comptable', 'accounting', 'syscohada', 'sycebnl', 'plan_comptable', 'chart', 'framework', 'referentiel'];

async function main() {
    const companyId = parseInt(process.argv[2]);
    if (!companyId) {
        console.error('❌ Usage: node diagnostic_odoo_company_fields.js <companyId>');
        process.exit(1);
    }

    console.log(`\n🔍 Recherche du champ "système comptable" sur res.company id=${companyId}\n`);

    try {
        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], []],
            kwargs: {}
        });

        if (!companies || companies.length === 0) {
            console.error(`❌ Aucune entreprise trouvée avec id=${companyId}`);
            process.exit(1);
        }

        const company = companies[0];
        const allFieldNames = Object.keys(company);
        console.log(`✅ ${allFieldNames.length} champs récupérés sur res.company\n`);

        console.log('--- Piste 1 : champs dont la valeur correspond à SYSCOHADA/SYCEBNL/PCG/OHADA ---');
        let foundByValue = false;
        for (const [field, value] of Object.entries(company)) {
            if (typeof value === 'string' && KEYWORDS_IN_VALUE.some(k => value.toUpperCase().includes(k))) {
                console.log(`  ✅ ${field} = "${value}"`);
                foundByValue = true;
            }
        }
        if (!foundByValue) console.log('  (aucun champ avec une valeur correspondante)');

        console.log('\n--- Piste 2 : champs dont le NOM évoque le système/plan comptable ---');
        let foundByName = false;
        for (const field of allFieldNames) {
            if (KEYWORDS_IN_FIELDNAME.some(k => field.toLowerCase().includes(k))) {
                console.log(`  ✅ ${field} = ${JSON.stringify(company[field])}`);
                foundByName = true;
            }
        }
        if (!foundByName) console.log('  (aucun champ avec un nom correspondant)');

        console.log('\n--- Piste 3 : champs personnalisés (préfixe x_) ---');
        const customFields = allFieldNames.filter(f => f.startsWith('x_'));
        if (customFields.length === 0) {
            console.log('  (aucun champ personnalisé x_ trouvé sur cet enregistrement)');
        } else {
            customFields.forEach(f => console.log(`  ${f} = ${JSON.stringify(company[f])}`));
        }

        console.log('\n--- Piste 4 : champs liés au plan comptable natif Odoo (chart_template, fiscal_country) ---');
        ['chart_template_id', 'chart_template', 'account_fiscal_country_id', 'fiscalcountry_id', 'anglo_saxon_accounting'].forEach(f => {
            if (f in company) {
                console.log(`  ${f} = ${JSON.stringify(company[f])}`);
            }
        });

        console.log('\n--- Dump complet (pour inspection manuelle si rien trouvé ci-dessus) ---');
        console.log(JSON.stringify(company, null, 2));

    } catch (error) {
        console.error('🚨 Erreur:', error.message);
        process.exit(1);
    }
}

main();
