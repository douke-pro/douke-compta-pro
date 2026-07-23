require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    try {
        const fields = await odooExecuteKw({
            uid: ADMIN_UID_INT, model: 'res.company', method: 'fields_get',
            args: [], kwargs: { attributes: ['string', 'type'] }
        });
        console.log('country_id existe:', !!fields.country_id);
        console.log('account_fiscal_country_id existe:', !!fields.account_fiscal_country_id);

        const accFields = await odooExecuteKw({
            uid: ADMIN_UID_INT, model: 'account.account', method: 'fields_get',
            args: [], kwargs: { attributes: ['string', 'type'] }
        });
        console.log('company_id (many2one) sur account.account:', accFields.company_id?.type);
        console.log('company_ids (existe?) sur account.account:', !!accFields.company_ids);
    } catch (e) {
        console.error('Erreur:', e.message);
    }
    process.exit(0);
}
main();
