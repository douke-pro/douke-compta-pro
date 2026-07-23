require('dotenv').config();
const pool = require('./services/dbService');
pool.queryWithRetry(
  `SELECT id, company_id, company_name, chart_template_before, fiscal_country_before,
          moves_count, accounts_count, journals_count, taxes_count, status, backup_date
   FROM accounting_system_backups ORDER BY id DESC LIMIT 1`, []
).then(r => { console.table(r.rows); process.exit(0); }).catch(e => { console.error('Erreur:', e.message); process.exit(1); });
