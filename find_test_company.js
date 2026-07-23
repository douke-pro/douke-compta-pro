require('dotenv').config();
const pool = require('./services/dbService');
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT, model: 'res.company', method: 'search_read',
        args: [[]], kwargs: { fields: ['id', 'name', 'country_id', 'chart_template'] }
    });
    for (const c of companies) {
        const moves = await odooExecuteKw({
            uid: ADMIN_UID_INT, model: 'account.move', method: 'search_count',
            args: [[['company_id', '=', c.id], ['state', '=', 'posted']]], kwargs: {}
        });
        console.log(`id=${c.id} | ${c.name} | country=${c.country_id?.[1] || 'AUCUN'} | chart=${c.chart_template} | posted_entries=${moves}`);
    }
    process.exit(0);
}
main().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
