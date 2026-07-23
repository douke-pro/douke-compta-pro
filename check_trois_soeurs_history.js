require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    // Date de création de la société
    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'read',
        args: [[23], ['name', 'create_date', 'write_date', 'chart_template']],
        kwargs: {}
    });
    console.log('Société :', JSON.stringify(companies[0], null, 2));

    // Date de la 1ère écriture
    const firstMove = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move',
        method: 'search_read',
        args: [[['company_id', '=', 23]], ['id', 'name', 'date', 'create_date']],
        kwargs: { order: 'create_date asc', limit: 3 }
    });
    console.log('\n3 premières écritures (par create_date) :', JSON.stringify(firstMove, null, 2));

    // Vérifier s'il existe un journal de log Odoo (mail.message / ir.logging) mentionnant un changement de chart_template
    const logs = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'mail.message',
        method: 'search_read',
        args: [[['res_id', '=', 23], ['model', '=', 'res.company']], ['id', 'date', 'body', 'subject']],
        kwargs: { order: 'date asc', limit: 20 }
    });
    console.log('\nMessages/logs sur la société :', JSON.stringify(logs, null, 2));
}
main();
