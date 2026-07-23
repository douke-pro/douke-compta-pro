require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    // Test 1 : lire les 2 écritures en détail (id, name, line_ids)
    const moves = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move',
        method: 'search_read',
        args: [[['company_id', '=', 1]], ['id', 'name', 'state', 'line_ids', 'move_type']],
        kwargs: {}
    });
    console.log('Écritures trouvées :', JSON.stringify(moves, null, 2));

    // Test 2 : lire account.move.line directement avec domaine company_id (pas move_id)
    const lines = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'account.move.line',
        method: 'search_read',
        args: [[['company_id', '=', 1]], ['id', 'move_id', 'account_id', 'debit', 'credit']],
        kwargs: {}
    });
    console.log(`\nLignes trouvées via company_id : ${lines.length}`);
    console.log(JSON.stringify(lines.slice(0, 5), null, 2));
}
main();
