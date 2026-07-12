'use strict';
require('dotenv').config();
const fs = require('fs');
const pool = require('../../services/dbService.js');

pool.query(`SELECT template_html FROM document_templates WHERE company_id = 0 AND template_type = 'fiche_paie'`)
  .then(r => {
    if (r.rows.length !== 1) {
        console.error('❌ ABORT : attendu exactement 1 ligne, trouvé ' + r.rows.length);
        process.exit(1);
    }
    fs.writeFileSync('scripts/payslip_patch/current.html', r.rows[0].template_html, 'utf-8');
    console.log('✅ Export DB frais → scripts/payslip_patch/current.html');
    process.exit(0);
  })
  .catch(e => { console.error('🚨', e.message); process.exit(1); });
