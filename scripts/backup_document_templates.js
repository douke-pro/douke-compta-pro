'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../services/dbService.js');

async function run() {
    const result = await pool.query(
        `SELECT id, company_id, template_type, template_name, template_html, created_at, updated_at
         FROM document_templates ORDER BY template_type, company_id`
    );
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outFile = path.join(outDir, `document_templates_backup_${ts}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result.rows, null, 2), 'utf-8');
    console.log(`✅ Backup terminé : ${result.rows.length} templates exportés → ${outFile}`);
    process.exit(0);
}
run().catch(err => { console.error('🚨 Erreur backup:', err.message); process.exit(1); });
