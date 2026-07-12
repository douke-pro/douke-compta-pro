require('dotenv').config();
const pool = require('../../services/dbService.js');

pool.query('SELECT id, company_id, template_type, template_name FROM document_templates ORDER BY id')
  .then(r => {
    console.log('✅ Connexion réussie —', r.rows.length, 'templates trouvés :');
    r.rows.forEach(row => console.log(`   id=${row.id} company_id=${row.company_id} type=${row.template_type}`));
    process.exit(0);
  })
  .catch(e => {
    console.error('🚨 ERREUR:', e.message);
    process.exit(1);
  });
