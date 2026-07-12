'use strict';
require('dotenv').config();
const fs = require('fs');
const pool = require('../../services/dbService.js');

const html = fs.readFileSync('scripts/payslip_patch/patched.html', 'utf-8');
pool.query(
    `UPDATE document_templates SET template_html = $1, updated_at = NOW()
     WHERE company_id = 0 AND template_type = 'fiche_paie' RETURNING id`,
    [html]
  )
  .then(result => {
    if (result.rowCount !== 1) {
        console.error('❌ ABORT : ' + result.rowCount + ' ligne(s) affectée(s) au lieu de 1.');
        process.exit(1);
    }
    console.log('✅ Template DB mis à jour — id=' + result.rows[0].id);
    process.exit(0);
  })
  .catch(e => { console.error('🚨', e.message); process.exit(1); });
