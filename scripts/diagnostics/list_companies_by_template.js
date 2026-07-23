require('dotenv').config();
const { odooExecuteKw, ADMIN_UID_INT } = require('./services/odooService');

async function main() {
    console.log('🔍 Liste de toutes les sociétés avec leur chart_template\n');

    const companies = await odooExecuteKw({
        uid: ADMIN_UID_INT,
        model: 'res.company',
        method: 'search_read',
        args: [[]],
        kwargs: { fields: ['id', 'name', 'chart_template'] }
    });

    console.log(`Total sociétés : ${companies.length}\n`);
    companies.forEach(c => {
        console.log(`   id=${c.id} | "${c.name}" | chart_template=${c.chart_template}`);
    });

    const bjCompanies = companies.filter(c => c.chart_template === 'bj' && c.id !== 1);
    console.log(`\n➡️  Candidates sur "bj" (hors DOUKE, id=1) : ${bjCompanies.length}`);
    bjCompanies.forEach(c => console.log(`   - id=${c.id} : ${c.name}`));
}

main().catch(e => { console.error('🚨 ERREUR:', e.message); process.exit(1); });
