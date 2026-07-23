require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('=== 1. res.company a-t-il un champ chart_template ? ===');
    try {
        const fields = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'fields_get',
            args: [['chart_template']],
            kwargs: { attributes: ['string', 'type', 'selection'] }
        });
        console.log(JSON.stringify(fields, null, 2));
    } catch (e) {
        console.log('❌ ERREUR fields_get chart_template:', e.message);
    }

    console.log('\n=== 2. Valeur actuelle de chart_template sur une société (test companyId=2) ===');
    try {
        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[2], ['name', 'chart_template']],
            kwargs: {}
        });
        console.log(JSON.stringify(companies, null, 2));
    } catch (e) {
        console.log('❌ ERREUR read chart_template:', e.message);
    }
}
main().catch(e => console.error('🚨 Fatal:', e.message));
