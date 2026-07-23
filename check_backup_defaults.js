require('dotenv').config();
const pool = require('./services/dbService');
pool.queryWithRetry(
  `SELECT column_name, is_nullable, column_default FROM information_schema.columns
   WHERE table_name = 'accounting_system_backups' ORDER BY ordinal_position`, []
).then(r => { console.table(r.rows); process.exit(0); }).catch(e => { console.error('Erreur:', e.message); process.exit(1); });
