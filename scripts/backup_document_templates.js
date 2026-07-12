'use strict';
// Backup READ-ONLY de tous les templates (contrats + fiche de paie)
// N'écrit JAMAIS en base — lecture seule, export local horodaté.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const result = await pool.query(
        `SELECT id, company_id, template_type, template_name, template_html, created_at, updated_at
         FROM document_templates
         ORDER BY template_type, company_id`
    );

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const outFile = path.join(outDir, `document_templates_backup_${ts}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result.rows, null, 2), 'utf-8');

    console.log(`✅ Backup terminé : ${result.rows.length} templates exportés`);
    console.log(`📁 Fichier : ${outFile}`);
    result.rows.forEach(r => console.log(`   - type=${r.template_type} company_id=${r.company_id} nom="${r.template_name}"`));

    await pool.end();
}

run().catch(err => { console.error('🚨 Erreur backup:', err.message); process.exit(1); });
