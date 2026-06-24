// =============================================================================
// FICHIER : server.js
// Description : Serveur principal Doukè Compta Pro
// Version : V27 — Ajout module RH + GED
// Corrections V27 :
//   ✅ Import + montage /api/hr
//   ✅ Tables employees, payslips, document_templates, company_documents
// =============================================================================

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const nodeFetch = require('node-fetch');
const fetch     = nodeFetch.default || nodeFetch;

require('dotenv').config();

// =============================================================================
// IMPORT DES ROUTES
// =============================================================================
const authRoutes            = require('./routes/auth');
const companyRoutes         = require('./routes/company');
const accountingRoutes      = require('./routes/accounting');
const userRoutes            = require('./routes/user');
const settingsRoutes        = require('./routes/settings');
const adminUsersRoutes      = require('./routes/adminUsers');
const notificationsRoutes   = require('./routes/notifications');
const ocrRoutes             = require('./routes/ocr');
const immobilisationsRoutes = require('./routes/immobilisations');
const reportsRoutes         = require('./routes/reports');
const syscohadaRoutes       = require('./routes/syscohada');
const hrRoutes              = require('./routes/hr');              // ✅ V27
const closingRoutes         = require('./routes/closing');          // ✅ Chirurgie étape 1

const app  = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// CRÉATION AUTOMATIQUE DES DOSSIERS UPLOADS
// =============================================================================
const uploadDirs = ['uploads','uploads/temp','uploads/invoices','uploads/documents'];
console.log('📁 [Init] Vérification des dossiers uploads...');
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`   ✅ Dossier créé: ${dir}`); }
    else { console.log(`   ✓ Dossier existe: ${dir}`); }
});
console.log('✅ [Init] Dossiers uploads vérifiés');

// =============================================================================
// INITIALISATION DES TABLES POSTGRESQL AVEC RETRY
// =============================================================================
const initDB = async (retries = 5, delay = 3000) => {
    const pool = require('./services/dbService');
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[DB] Tentative d'initialisation ${attempt}/${retries}...`);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS financial_reports_requests (
                    id                 SERIAL PRIMARY KEY,
                    user_id            INTEGER,
                    company_id         INTEGER,
                    accounting_system  VARCHAR(50),
                    period_start       DATE,
                    period_end         DATE,
                    fiscal_year        VARCHAR(20),
                    requested_by       INTEGER,
                    requested_by_name  VARCHAR(150),
                    processed_by       INTEGER,
                    validated_by       INTEGER,
                    notes              TEXT,
                    status             VARCHAR(50) DEFAULT 'pending',
                    pdf_files          JSONB,
                    odoo_data          JSONB,
                    error_message      TEXT,
                    requested_at       TIMESTAMP DEFAULT NOW(),
                    processed_at       TIMESTAMP,
                    validated_at       TIMESTAMP,
                    sent_at            TIMESTAMP,
                    updated_at         TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS financial_reports_notifications (
                    id                  SERIAL PRIMARY KEY,
                    report_request_id   INTEGER REFERENCES financial_reports_requests(id),
                    recipient_user_id   INTEGER,
                    notification_type   VARCHAR(50),
                    metadata            JSONB,
                    created_at          TIMESTAMP DEFAULT NOW(),
                    read_at             TIMESTAMP
                );
            `);

            await pool.query(`
                ALTER TABLE financial_reports_requests
                    ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(150);
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS revoked_tokens (
                    token_hash   VARCHAR(64) PRIMARY KEY,
                    revoked_at   TIMESTAMP DEFAULT NOW(),
                    expires_at   TIMESTAMP NOT NULL
                );
                CREATE TABLE IF NOT EXISTS notification_state (
                    id              SERIAL PRIMARY KEY,
                    user_odoo_uid   INTEGER NOT NULL,
                    notification_id TEXT NOT NULL,
                    is_read         BOOLEAN DEFAULT FALSE,
                    is_deleted      BOOLEAN DEFAULT FALSE,
                    read_at         TIMESTAMP,
                    deleted_at      TIMESTAMP,
                    created_at      TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_odoo_uid, notification_id)
                );
                CREATE TABLE IF NOT EXISTS fiscal_year_balances (
                    id              SERIAL PRIMARY KEY,
                    company_id      INTEGER NOT NULL,
                    fiscal_year     INTEGER NOT NULL,
                    account_code    VARCHAR(10) NOT NULL,
                    account_name    TEXT,
                    balance_debit   NUMERIC(15,2) DEFAULT 0,
                    balance_credit  NUMERIC(15,2) DEFAULT 0,
                    net_balance     NUMERIC(15,2) DEFAULT 0,
                    account_class   INTEGER,
                    snapshot_valid  BOOLEAN DEFAULT TRUE,
                    created_at      TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(company_id, fiscal_year, account_code)
                );
            `);

            // ✅ V27 — Tables Module RH + GED
            await pool.query(`
                CREATE TABLE IF NOT EXISTS employees (
                    id              SERIAL PRIMARY KEY,
                    company_id      INTEGER NOT NULL,
                    employee_code   VARCHAR(20) UNIQUE,
                    full_name       TEXT NOT NULL,
                    job_title       TEXT,
                    hire_date       DATE,
                    contract_type   VARCHAR(50) DEFAULT 'CDI',
                    base_salary     NUMERIC(12,2) DEFAULT 0,
                    status          VARCHAR(20) DEFAULT 'actif',
                    email           VARCHAR(150),
                    phone           VARCHAR(30),
                    address         TEXT,
                    id_number       VARCHAR(50),
                    id_type         VARCHAR(30),
                    cnss_number     VARCHAR(50),
                    notes                  TEXT,
                    ifu_number             VARCHAR(50),
                    date_naissance         DATE,
                    nationalite            VARCHAR(50),
                    situation_matrimoniale VARCHAR(50),
                    contact_urgence        TEXT,
                    created_by             INTEGER,
                    created_at             TIMESTAMPTZ DEFAULT NOW(),
                    updated_at             TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS payslips (
                    id              SERIAL PRIMARY KEY,
                    employee_id     INTEGER REFERENCES employees(id) ON DELETE CASCADE,
                    company_id      INTEGER NOT NULL,
                    period_month    INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
                    period_year     INTEGER NOT NULL,
                    gross_salary    NUMERIC(12,2) DEFAULT 0,
                    deductions      JSONB,
                    net_salary      NUMERIC(12,2) DEFAULT 0,
                    status          VARCHAR(20) DEFAULT 'brouillon',
                    pdf_base64      TEXT,
                    generated_at    TIMESTAMPTZ,
                    created_by      INTEGER,
                    created_at      TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(employee_id, period_month, period_year)
                );
                CREATE TABLE IF NOT EXISTS document_templates (
                    id              SERIAL PRIMARY KEY,
                    company_id      INTEGER NOT NULL,
                    template_type   VARCHAR(50) NOT NULL,
                    template_name   TEXT,
                    template_html   TEXT NOT NULL,
                    created_by      INTEGER,
                    created_at      TIMESTAMPTZ DEFAULT NOW(),
                    updated_at      TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(company_id, template_type)
                );
                CREATE TABLE IF NOT EXISTS company_documents (
                    id              SERIAL PRIMARY KEY,
                    company_id      INTEGER NOT NULL,
                    employee_id     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
                    doc_type        VARCHAR(50) NOT NULL,
                    doc_name        TEXT NOT NULL,
                    file_base64     TEXT NOT NULL,
                    file_mime       VARCHAR(100) DEFAULT 'application/pdf',
                    file_size_kb    INTEGER DEFAULT 0,
                    uploaded_by     INTEGER,
                    created_at      TIMESTAMPTZ DEFAULT NOW()
                );
            `);

            console.log('✅ [DB] Tables initialisées avec succès');
            // Migration douce colonnes employees
            await pool.query(`
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS ifu_number             VARCHAR(50);
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_naissance         DATE;
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationalite            VARCHAR(50);
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS situation_matrimoniale VARCHAR(50);
                ALTER TABLE employees ADD COLUMN IF NOT EXISTS contact_urgence        TEXT;
            `);
            console.log('   ✓ financial_reports_requests + notifications');
            console.log('   ✓ revoked_tokens + notification_state');
            console.log('   ✓ fiscal_year_balances');
            console.log('   ✓ employees + payslips + document_templates + company_documents');

            // ✅ V27 — Insertion modèles par défaut (Option A — company_id = 0)
            // Supprimer les anciens modèles globaux et réinsérer (idempotent)
            await pool.query('DELETE FROM document_templates WHERE company_id = 0');
            await pool.query(`
                INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
                VALUES
                (0, 'contrat_cdi', 'Contrat CDI — Modèle par défaut (Bénin/OHADA)', $tmpl_cdi$
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;font-size:12pt;color:#1a1a1a;margin:0;padding:20px}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #1a3a5c;padding-bottom:15px}
.header h1{font-size:16pt;color:#1a3a5c;margin:0 0 5px 0;text-transform:uppercase}
.header h2{font-size:13pt;color:#1a3a5c;margin:0}
.block{background:#f5f7fa;border-left:4px solid #1a3a5c;padding:12px 16px;margin:16px 0;border-radius:4px}
.block h3{font-size:11pt;color:#1a3a5c;margin:0 0 8px 0;text-transform:uppercase}
.row{display:flex;gap:20px;margin:6px 0}.field{flex:1}
.field label{font-size:9pt;color:#666;display:block;margin-bottom:2px}
.field span{font-weight:bold;font-size:11pt}
.article{margin:18px 0}
.article h4{font-size:11pt;color:#1a3a5c;text-transform:uppercase;border-bottom:1px solid #dde;padding-bottom:4px;margin-bottom:8px}
.article p{margin:6px 0;line-height:1.6;text-align:justify}
.hl{background:#fff3cd;padding:2px 6px;border-radius:3px;font-weight:bold}
.signatures{display:flex;justify-content:space-between;margin-top:50px}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:8px;font-size:10pt}
.legal-ref{font-size:9pt;color:#888;text-align:center;margin-top:30px;border-top:1px solid #eee;padding-top:10px}
</style></head><body>
<div class="header"><h1>{{nom_entreprise}}</h1><h2>CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)</h2>
<p style="font-size:10pt;color:#555">Ref : {{reference_contrat}} | Date : {{date_signature}}</p></div>
<div class="block"><h3>L'Employeur</h3>
<div class="row"><div class="field"><label>Raison sociale</label><span>{{nom_entreprise}}</span></div><div class="field"><label>Forme juridique</label><span>{{forme_juridique}}</span></div></div>
<div class="row"><div class="field"><label>Siège social</label><span>{{adresse_entreprise}}</span></div><div class="field"><label>RCCM / IFU</label><span>{{rccm_ifu}}</span></div></div>
<div class="row"><div class="field"><label>Représenté par</label><span>{{representant_entreprise}}</span></div><div class="field"><label>Qualité</label><span>{{qualite_representant}}</span></div></div></div>
<div class="block"><h3>Le Salarié</h3>
<div class="row"><div class="field"><label>Nom et Prénoms</label><span>{{nom}}</span></div><div class="field"><label>Date de naissance</label><span>{{date_naissance}}</span></div></div>
<div class="row"><div class="field"><label>Nationalité</label><span>{{nationalite}}</span></div><div class="field"><label>N° Pièce d'identité</label><span>{{numero_piece}}</span></div></div>
<div class="row"><div class="field"><label>Adresse</label><span>{{adresse_salarie}}</span></div><div class="field"><label>N° CNSS</label><span>{{cnss}}</span></div></div></div>
<div class="article"><h4>Article 1 — Engagement et Poste</h4>
<p>L'employeur engage <span class="hl">{{nom}}</span> à compter du <span class="hl">{{date_debut}}</span> en qualité de <span class="hl">{{poste}}</span>, département <strong>{{departement}}</strong>.</p>
<p>Contrat conclu conformément à la <strong>Loi n° 98-004 du 27 janvier 1998</strong> portant Code du Travail en République du Bénin, pour une durée indéterminée.</p></div>
<div class="article"><h4>Article 2 — Période d'Essai</h4>
<p>Période d'essai de <span class="hl">{{duree_essai}}</span>, renouvelable une fois par accord des parties. Rupture possible sans préavis ni indemnité durant cette période.</p></div>
<div class="article"><h4>Article 3 — Rémunération</h4>
<p>Salaire brut mensuel : <span class="hl">{{salaire}} FCFA</span>, payable le dernier jour ouvré du mois. Supérieur au SMIG (52 000 FCFA — Décret 2023-015). CNSS : 3,6% salarié / 15,4% patronal. ITS progressif appliqué conformément au CGI.</p></div>
<div class="article"><h4>Article 4 — Durée et Lieu de Travail</h4>
<p>Durée hebdomadaire : <strong>40 heures</strong> (art. 142 CT). Lieu : <span class="hl">{{lieu_travail}}</span>.</p></div>
<div class="article"><h4>Article 5 — Congés Payés</h4>
<p>2,2 jours ouvrables par mois de travail effectif (26,4 jours/an) — art. 179 CT.</p></div>
<div class="article"><h4>Article 6 — Obligations du Salarié</h4>
<p>Le salarié s'engage à exercer ses fonctions avec diligence, loyauté et confidentialité, et à respecter le règlement intérieur de l'entreprise.</p></div>
<div class="article"><h4>Article 7 — Rupture du Contrat</h4>
<p>Régie par les articles 49 à 84 du Code du Travail. Préavis : <span class="hl">{{duree_preavis}}</span> sauf faute lourde. Indemnités calculées conformément aux dispositions légales.</p></div>
<div class="article"><h4>Article 8 — Litiges</h4>
<p>Tout litige sera soumis à la juridiction compétente du lieu d'exécution du travail — Code du Travail béninois et Actes Uniformes OHADA.</p></div>
<div class="signatures">
<div class="sig-block"><p><strong>Pour l'Employeur</strong></p><p style="font-size:10pt">{{representant_entreprise}}<br>{{qualite_representant}}</p><div class="sig-line">Signature et cachet</div></div>
<div class="sig-block"><p><strong>Le Salarié</strong></p><p style="font-size:10pt">{{nom}}<br>Lu et approuvé</p><div class="sig-line">Signature manuscrite</div></div>
</div>
<div class="legal-ref">Loi n° 98-004 du 27/01/1998 — Code du Travail Bénin | SMIG : 52 000 FCFA | CNSS : 3,6% salarié / 15,4% patronal | OHADA</div>
</body></html>
$tmpl_cdi$, NULL),
                (0, 'contrat_cdd', 'Contrat CDD — Modèle par défaut (Bénin/OHADA)', $tmpl_cdd$
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;font-size:12pt;color:#1a1a1a;margin:0;padding:20px}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #7b2d00;padding-bottom:15px}
.header h1{font-size:16pt;color:#7b2d00;margin:0 0 5px 0;text-transform:uppercase}
.header h2{font-size:13pt;color:#7b2d00;margin:0}
.block{background:#fdf5f0;border-left:4px solid #7b2d00;padding:12px 16px;margin:16px 0;border-radius:4px}
.block h3{font-size:11pt;color:#7b2d00;margin:0 0 8px 0;text-transform:uppercase}
.row{display:flex;gap:20px;margin:6px 0}.field{flex:1}
.field label{font-size:9pt;color:#666;display:block;margin-bottom:2px}
.field span{font-weight:bold;font-size:11pt}
.alert-box{background:#fff3cd;border-left:4px solid #ffc107;padding:10px 14px;border-radius:4px;margin:12px 0;font-size:10pt}
.article{margin:18px 0}
.article h4{font-size:11pt;color:#7b2d00;text-transform:uppercase;border-bottom:1px solid #f0d0c0;padding-bottom:4px;margin-bottom:8px}
.article p{margin:6px 0;line-height:1.6;text-align:justify}
.hl{background:#fff3cd;padding:2px 6px;border-radius:3px;font-weight:bold}
.signatures{display:flex;justify-content:space-between;margin-top:50px}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:8px;font-size:10pt}
.legal-ref{font-size:9pt;color:#888;text-align:center;margin-top:30px;border-top:1px solid #eee;padding-top:10px}
</style></head><body>
<div class="header"><h1>{{nom_entreprise}}</h1><h2>CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)</h2>
<p style="font-size:10pt;color:#555">Ref : {{reference_contrat}} | Date : {{date_signature}}</p></div>
<div class="alert-box">⚠️ <strong>Motif de recours au CDD :</strong> {{motif_cdd}} — art. 33 Code du Travail béninois.</div>
<div class="block"><h3>L'Employeur</h3>
<div class="row"><div class="field"><label>Raison sociale</label><span>{{nom_entreprise}}</span></div><div class="field"><label>Forme juridique</label><span>{{forme_juridique}}</span></div></div>
<div class="row"><div class="field"><label>Siège social</label><span>{{adresse_entreprise}}</span></div><div class="field"><label>RCCM / IFU</label><span>{{rccm_ifu}}</span></div></div>
<div class="row"><div class="field"><label>Représenté par</label><span>{{representant_entreprise}}</span></div><div class="field"><label>Qualité</label><span>{{qualite_representant}}</span></div></div></div>
<div class="block"><h3>Le Salarié</h3>
<div class="row"><div class="field"><label>Nom et Prénoms</label><span>{{nom}}</span></div><div class="field"><label>Date de naissance</label><span>{{date_naissance}}</span></div></div>
<div class="row"><div class="field"><label>Nationalité</label><span>{{nationalite}}</span></div><div class="field"><label>N° Pièce d'identité</label><span>{{numero_piece}}</span></div></div>
<div class="row"><div class="field"><label>Adresse</label><span>{{adresse_salarie}}</span></div><div class="field"><label>N° CNSS</label><span>{{cnss}}</span></div></div></div>
<div class="article"><h4>Article 1 — Objet et Durée</h4>
<p>Engagement de <span class="hl">{{nom}}</span> du <span class="hl">{{date_debut}}</span> au <span class="hl">{{date_fin}}</span> en qualité de <span class="hl">{{poste}}</span>.</p>
<p>Conformément à l'art. 33 CT, ce contrat ne peut être renouvelé qu'une seule fois. Toute poursuite au-delà du terme entraîne transformation automatique en CDI.</p></div>
<div class="article"><h4>Article 2 — Période d'Essai</h4>
<p>Période d'essai de <span class="hl">{{duree_essai}}</span>. Rupture possible sans préavis ni indemnité durant cette période, hors abus de droit.</p></div>
<div class="article"><h4>Article 3 — Rémunération</h4>
<p>Salaire brut mensuel : <span class="hl">{{salaire}} FCFA</span>, supérieur au SMIG (52 000 FCFA). CNSS : 3,6% salarié / 15,4% patronal. ITS progressif CGI art. 119-125.</p>
<p>Le salarié sous CDD bénéficie des mêmes droits que le salarié sous CDI pour un travail équivalent (art. 10 CT).</p></div>
<div class="article"><h4>Article 4 — Durée et Lieu de Travail</h4>
<p>40 heures/semaine (art. 142 CT). Lieu : <span class="hl">{{lieu_travail}}</span>.</p></div>
<div class="article"><h4>Article 5 — Congés et Droits Sociaux</h4>
<p>Congés payés au prorata (2,2 jours/mois). Prestations CNSS complètes : accidents du travail, maternité, allocations familiales.</p></div>
<div class="article"><h4>Article 6 — Rupture Anticipée</h4>
<p>Uniquement en cas de faute lourde, force majeure, accord mutuel ou décision judiciaire. Toute rupture unilatérale injustifiée engage la partie fautive à indemniser les rémunérations restant à courir.</p></div>
<div class="article"><h4>Article 7 — Litiges</h4>
<p>Juridiction compétente du lieu d'exécution — Code du Travail béninois et Actes Uniformes OHADA.</p></div>
<div class="signatures">
<div class="sig-block"><p><strong>Pour l'Employeur</strong></p><p style="font-size:10pt">{{representant_entreprise}}<br>{{qualite_representant}}</p><div class="sig-line">Signature et cachet</div></div>
<div class="sig-block"><p><strong>Le Salarié</strong></p><p style="font-size:10pt">{{nom}}<br>Lu et approuvé</p><div class="sig-line">Signature manuscrite</div></div>
</div>
<div class="legal-ref">Loi n° 98-004 — Art. 33-42 CDD | SMIG 52 000 FCFA | CNSS 3,6%/15,4% | ITS CGI art.119-125 | OHADA</div>
</body></html>
$tmpl_cdd$, NULL),
                (0, 'fiche_paie', 'Bulletin de Paie — Modèle par défaut (Bénin 2026)', $tmpl_fp$
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;font-size:11pt;color:#1a1a1a;margin:0;padding:16px}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a3a5c;padding-bottom:12px;margin-bottom:16px}
.header-left h1{font-size:15pt;color:#1a3a5c;margin:0 0 4px 0}
.header-left p{margin:2px 0;font-size:10pt;color:#555}
.header-right{text-align:right}
.header-right h2{font-size:13pt;color:#1a3a5c;margin:0 0 4px 0;text-transform:uppercase}
.periode-badge{display:inline-block;background:#1a3a5c;color:white;padding:4px 14px;border-radius:20px;font-size:11pt;font-weight:bold;margin:6px 0}
.ei{display:flex;gap:12px;background:#f5f7fa;border-radius:6px;padding:10px 14px;margin:12px 0;flex-wrap:wrap}
.ei-b{min-width:120px}
.ei-b label{font-size:9pt;color:#888;display:block}
.ei-b span{font-weight:bold;font-size:10pt}
table.paie{width:100%;border-collapse:collapse;margin:14px 0;font-size:10pt}
table.paie thead th{background:#1a3a5c;color:white;padding:7px 10px;text-align:left}
table.paie thead th:nth-child(n+4){text-align:right}
table.paie tbody tr:nth-child(even){background:#f5f7fa}
table.paie tbody td{padding:6px 10px;border-bottom:1px solid #eee}
table.paie tbody td.amt{text-align:right;font-weight:bold}
table.paie tbody td.dbt{text-align:right;font-weight:bold;color:#c0392b}
table.paie tr.sh td{background:#e8edf5;font-weight:bold;color:#1a3a5c;padding:5px 10px}
.totaux-box{background:#1a3a5c;color:white;padding:12px 20px;border-radius:8px;min-width:260px;margin-left:auto;margin-top:8px}
.tr{display:flex;justify-content:space-between;margin:3px 0;font-size:11pt}
.tr.net{font-size:14pt;font-weight:bold;border-top:1px solid rgba(255,255,255,0.4);padding-top:7px;margin-top:7px}
.info-box{background:#f0f9ff;border:1px solid #b3d9f0;border-radius:6px;padding:8px 14px;margin:10px 0;font-size:10pt}
.pat-box{background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:8px 14px;margin:10px 0;font-size:10pt}
.signatures{display:flex;justify-content:space-between;margin-top:28px}
.sig-block{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:40px;padding-top:6px;font-size:10pt}
.legal-ref{font-size:8pt;color:#aaa;text-align:center;margin-top:18px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<div class="header">
<div class="header-left"><h1>{{nom_entreprise}}</h1><p>{{adresse_entreprise}}</p><p>RCCM : {{rccm}} | IFU : {{ifu}}</p><p>N° Employeur CNSS : {{numero_employeur_cnss}}</p></div>
<div class="header-right"><h2>Bulletin de Paie</h2><div class="periode-badge">{{periode}}</div><p>Date de paiement : <strong>{{date_paiement}}</strong></p></div>
</div>
<div class="ei">
<div class="ei-b"><label>Nom et Prénoms</label><span>{{nom}}</span></div>
<div class="ei-b"><label>Poste</label><span>{{poste}}</span></div>
<div class="ei-b"><label>Matricule</label><span>{{matricule}}</span></div>
<div class="ei-b"><label>N° CNSS</label><span>{{cnss}}</span></div>
<div class="ei-b"><label>Contrat</label><span>{{type_contrat}}</span></div>
<div class="ei-b"><label>Embauche</label><span>{{date_embauche}}</span></div>
</div>
<table class="paie">
<thead><tr><th>Libellé</th><th>Base</th><th>Taux</th><th>Gains (FCFA)</th><th>Retenues (FCFA)</th></tr></thead>
<tbody>
<tr class="sh"><td colspan="5">RÉMUNÉRATION</td></tr>
<tr><td>Salaire de Base</td><td>{{heures_travaillees}}h</td><td>—</td><td class="amt">{{salaire_base}}</td><td></td></tr>
<tr><td>Prime de Transport</td><td>—</td><td>—</td><td class="amt">{{prime_transport}}</td><td></td></tr>
<tr><td>Autres Primes</td><td>—</td><td>—</td><td class="amt">{{autres_primes}}</td><td></td></tr>
<tr class="sh"><td colspan="5">COTISATIONS CNSS — PART SALARIALE</td></tr>
<tr><td>CNSS — Vieillesse / Prestations familiales</td><td>{{salaire_brut}}</td><td>3,6 %</td><td></td><td class="dbt">{{cnss_salarie}}</td></tr>
<tr class="sh"><td colspan="5">IMPÔT SUR TRAITEMENTS ET SALAIRES (ITS) — CGI art. 119-125</td></tr>
<tr><td>Base imposable (Brut − CNSS)</td><td>{{base_imposable}}</td><td>Progressif 0%→30%</td><td></td><td></td></tr>
<tr><td>Exonération tranche 0→60 000 FCFA</td><td>60 000</td><td>0 %</td><td></td><td class="dbt">0</td></tr>
<tr><td>ITS calculé sur tranches supérieures</td><td>{{base_imposable}}</td><td>Barème CGI</td><td></td><td class="dbt">{{its}}</td></tr>
<tr class="sh"><td colspan="5">AUTRES DÉDUCTIONS</td></tr>
<tr><td>Avance sur salaire</td><td>—</td><td>—</td><td></td><td class="dbt">{{avance_salaire}}</td></tr>
<tr><td>Autres retenues</td><td>—</td><td>—</td><td></td><td class="dbt">{{autres_retenues}}</td></tr>
</tbody>
</table>
<div class="info-box">📅 <strong>Congés Payés</strong> — Acquis ce mois : <strong>{{conges_acquis}} j</strong> | Pris : <strong>{{conges_pris}} j</strong> | Solde : <strong>{{conges_solde}} j</strong></div>
<div class="pat-box">📊 <strong>Charges Patronales</strong> (info — non déduites du net) — CNSS Patronal 15,4% : <strong>{{cnss_patronal}} FCFA</strong> | VPS 3% : <strong>{{vps}} FCFA</strong></div>
<div class="totaux-box">
<div class="tr"><span>Total Gains</span><span>{{total_gains}} FCFA</span></div>
<div class="tr"><span>Total Retenues</span><span>{{total_retenues}} FCFA</span></div>
<div class="tr net"><span>NET À PAYER</span><span>{{net_a_payer}} FCFA</span></div>
</div>
<div class="signatures">
<div class="sig-block"><p><strong>L'Employeur</strong></p><div class="sig-line">Signature et cachet</div></div>
<div class="sig-block"><p><strong>Le Salarié</strong><br><small>Reçu la somme de {{net_a_payer}} FCFA</small></p><div class="sig-line">Signature</div></div>
</div>
<div class="legal-ref">Bulletin conforme — Code du Travail Bénin Loi 98-004 | CNSS 3,6%/15,4% | ITS CGI art.119-125 | Exonération 60 000 FCFA | SMIG 52 000 FCFA | VPS art.191-195 CGI</div>
</body></html>
$tmpl_fp$, NULL)
;
            `);
            console.log('   ✓ Modèles par défaut CDI/CDD/Fiche de paie insérés (Option A)');

            // ✅ V27 — Modèles personnalisés CCI PARTNERS (company_id = 12)
            // Supprimer et réinsérer pour forcer la mise à jour
            await pool.query('DELETE FROM document_templates WHERE company_id = 12');
            await pool.query(`
                INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
                VALUES (12, 'contrat_cdd', 'Contrat CDD — CCI PARTNERS', $cci_cdd$<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11.5pt;color:#1a1a1a;margin:0;padding:20px 25px}
@media print{@page{margin:15mm 20mm;size:A4}.pb{page-break-before:always}.no-break{page-break-inside:avoid}}
.header{display:flex;align-items:stretch;margin-bottom:18px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c}
.header-logo{background:#1a3a5c;color:#fff;padding:8px 12px;display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:160px}
.header-logo .logo-wrap{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.header-logo .brand-top{font-size:14pt;font-weight:900;color:#fff;letter-spacing:1px}
.header-logo .brand-sub{font-size:7pt;color:#a8c4e0;letter-spacing:2px;text-transform:uppercase;font-weight:600}
.header-content{flex:1;padding:14px 18px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.header-content h1{font-size:14pt;color:#1a3a5c;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px}
.header-content h2{font-size:12pt;color:#1a3a5c;margin:0}
.header-content p{font-size:10pt;color:#555;margin:4px 0}
.pblock{background:#f5f7fa;border-left:4px solid #1a3a5c;padding:8px 14px;margin:8px 0;border-radius:4px}
.pblock h3{font-size:10pt;color:#1a3a5c;margin:0 0 5px 0;text-transform:uppercase}
.pblock p{margin:3px 0;font-size:11pt;line-height:1.5}
.sep{text-align:center;font-weight:bold;color:#1a3a5c;margin:6px 0;font-size:11pt}
.intro{text-align:center;margin:8px 0;font-size:11pt}
.art{margin:10px 0}
.art h4{font-size:11pt;color:#1a3a5c;text-transform:uppercase;border-bottom:1px solid #dde;padding-bottom:3px;margin:0 0 5px 0}
.art p{margin:4px 0;line-height:1.6;text-align:justify;font-size:11pt}
.art ul{margin:4px 0;padding-left:18px}
.art ul li{margin:3px 0;line-height:1.5;font-size:11pt}
.hl{background:#fff3cd;padding:1px 4px;border-radius:3px;font-weight:bold}
.sigs{display:flex;justify-content:space-between;margin-top:40px}
.sig{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:6px;font-size:10pt}
.legal{font-size:8pt;color:#aaa;text-align:center;margin-top:14px;border-top:1px solid #eee;padding-top:6px}</style></head><body>

<!-- ========== PAGE 1 : En-tête + Parties + Art.1-3 ========== -->
<div class="header no-break">
  <div class="header-logo">
    <div class="logo-wrap"><img src="/assets/LOGO_CCI.png" style="width:130px;height:auto;display:block;mix-blend-mode:screen"></div>
  </div>
  <div class="header-content">
    <h1>CONTRAT DE TRAVAIL</h1>
    <h2>À DURÉE DÉTERMINÉE (CDD)</h2>
    <p>Ref : {{reference_contrat}} &nbsp;|&nbsp; Fait à {{lieu_signature}}, le {{date_signature}}</p>
  </div>
</div>

<p class="intro no-break"><strong>ENTRE</strong></p>

<div class="pblock no-break">
  <h3>L'Employeur</h3>
  <p>Raison Sociale : <strong>{{nom_entreprise}}</strong></p>
  <p>Représentée par : <strong>{{representant_entreprise}}</strong> &nbsp; Siège Social / Adresse : <strong>{{adresse_entreprise}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employeur »</strong></p>
</div>

<p class="sep">D'UNE PART,<br>Et</p>

<div class="pblock no-break">
  <h3>L'Employé(e)</h3>
  <p>Madame / Monsieur : <strong>{{nom}}</strong></p>
  <p>Date et lieu de Naissance : <strong>{{date_naissance}}</strong> &nbsp;&nbsp; Nationalité : <strong>{{nationalite}}</strong></p>
  <p>Résident(e) habituellement à : <strong>{{adresse_salarie}}</strong></p>
  <p>Situation Matrimoniale : <strong>{{situation_matrimoniale}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employé »</strong></p>
</div>

<p class="sep">D'AUTRE PART</p>
<p class="intro">L'employeur et l'employé sont collectivement appelés les <strong>« Parties »</strong> et individuellement une <strong>« Partie »</strong>.</p>
<p class="intro"><strong>Il a été convenu de ce qui suit :</strong></p>

<div class="art no-break">
  <h4>Article 1 : Objet du contrat</h4>
  <p>Le présent contrat de travail à durée déterminée a pour objet de déterminer les conditions et modalités selon lesquelles l'employé accepte de mettre à la disposition de <strong>{{nom_entreprise}}</strong>, son savoir-faire, son temps, et sa loyauté en tant que <span class="hl">{{poste}}</span> pour atteindre des objectifs moyennant une rémunération convenue.</p>
</div>

<div class="art no-break">
  <h4>Article 2 : Durée du Contrat</h4>
  <p>Le présent contrat est conclu pour une durée déterminée de <span class="hl">{{duree_contrat}}</span> allant du <span class="hl">{{date_debut}}</span> au <span class="hl">{{date_fin}}</span>, sous réserve de son interruption anticipée selon les conditions prévues à l'article 13 ci-dessous.</p>
  <p>Il prend fin de plein droit à l'échéance du terme ci-dessus indiqué et peut être transformé en contrat à durée indéterminée sur accord des parties.</p>
</div>

<div class="art no-break">
  <h4>Article 3 : Fonctions de l'Employé</h4>
  <p>L'employé se met à la disposition de l'entreprise en qualité de <span class="hl">{{poste}}</span>.</p>
  <p>Toutefois, en cas de nécessité, l'employé pourra être amené à exercer toutes autres attributions à lui confiées par l'entreprise dans la mesure de ses qualifications.</p>
</div>

<!-- ========== PAGE 2 : Art.4-8 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 4 : Engagement de l'Employé</h4>
  <p>L'employé déclare être libre de tous engagements professionnels et s'engage à :</p>
  <ul>
    <li>Exercer ses attributions sous l'autorité de ses supérieurs hiérarchiques et à se soumettre aux règles applicables dans l'entreprise et notamment aux règles de discipline, s'acquitter avec loyauté, responsabilité et fidélité des travaux ou missions qui lui seront confiés ;</li>
    <li>Effectuer les déplacements nécessaires et se rendre en tous lieux où l'entreprise aura besoin de ses services dans les limites des accords ;</li>
    <li>Informer son employeur sans délai de tout changement qui interviendrait dans sa situation professionnelle comme personnelle, notamment en cas de changement d'adresse ou de situation matrimoniale ;</li>
    <li>S'abstenir de toute attitude de nature à jeter le discrédit sur l'activité de l'entreprise ou les supérieurs hiérarchiques dont il relève ;</li>
    <li>Assister aux formations organisées par les partenaires avec un accord de son supérieur ;</li>
    <li>Aviser son employeur de tout incident affectant l'exécution de son travail, dans un délai de 24h maximum, en vue de la prise des dispositions auprès la Caisse Nationale de Sécurité Sociale (CNSS) ;</li>
    <li>Restituer à l'expiration du contrat quel qu'en soit la cause, tout matériel à lui confié par l'employeur.</li>
  </ul>
</div>

<div class="art no-break">
  <h4>Article 5 : Actions d'accompagnement et de formation, tuteur et référent</h4>
  <p>L'employé s'engage à suivre toutes les actions d'accompagnement, de formation, de tutorat et de validation des acquis prévues et concourant à son évolution professionnelle.</p>
  <p>À ce titre, il bénéficie d'un accompagnement par les référents désignés par <strong>{{nom_entreprise}}</strong> et chargés d'assurer le suivi de son parcours professionnel.</p>
</div>

<div class="art no-break">
  <h4>Article 6 : Lieu et horaire de travail</h4>
  <p>Les horaires de travail de l'employé sont ceux de l'entreprise, non contraires aux dispositions légales en vigueur en République du Bénin.</p>
  <p>Les horaires de <strong>{{nom_entreprise}}</strong> sont de <span class="hl">{{heures_mensuelles}}</span> heures par mois réparties suivant le calendrier des rotations mensuelles.</p>
  <p>Le lieu de travail est le siège de <strong>{{nom_entreprise}}</strong> et tout autre endroit désigné par l'employeur.</p>
</div>

<div class="art no-break">
  <h4>Article 7 : Rémunération</h4>
  <p>L'employé percevra une rémunération nette mensuelle de <span class="hl">{{salaire_net}} FCFA</span>.</p>
  <p>Cette rémunération sera versée mensuellement à l'employé par virement bancaire, chèque ou tout autre moyen de paiement légal. Il est versé au plus tard le <span class="hl">{{jour_paiement}}</span> du mois suivant. En cas de difficulté financière, l'employeur doit informer l'employé et convenir avec lui d'une prochaine échéance.</p>
</div>

<div class="art no-break">
  <h4>Article 8 : Frais de mission</h4>
  <p>En cas de mission hors du lieu d'exercice habituel de ses fonctions, des frais de missions relatifs à l'hébergement, la restauration et au déplacement sont accordés à l'employé conformément aux règles applicables au sein de l'entreprise.</p>
</div>

<!-- ========== PAGE 3 : Art.9-12 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 9 : Avantages sociaux</h4>
  <p>L'affiliation de l'employé à la Caisse Nationale de Sécurité Sociale (CNSS) en vue de lui permettre de bénéficier des avantages sociaux reconnus par la réglementation en vigueur au Bénin, sera faite par l'entreprise dès confirmation de sa période d'essai.</p>
</div>

<div class="art no-break">
  <h4>Article 10 : Congés</h4>
  <p>L'employé a droit à deux (02) jours ouvrables de congés par mois de service effectif soit vingt-quatre (24) jours de travail ouvrables par an. La jouissance de ses congés sera planifiée en accord avec l'employeur et est valable dès la fin de la première année.</p>
  <p>En cas d'arrêt pour cause de maladie, l'employé devra présenter à l'entreprise sans délai un certificat émis par un médecin agréé.</p>
</div>

<div class="art no-break">
  <h4>Article 11 : Clause d'exclusivité</h4>
  <p>L'employé s'interdit d'exercer pendant la durée de son contrat même en dehors des heures de travail, une activité à caractère professionnel susceptible de concurrencer son employeur dans ses activités professionnelles ou de nuire à l'exécution normale des services convenus.</p>
  <p>L'employé s'interdit d'utiliser les outils de travail (ordinateur ; téléphone ; imprimante ; connexion et tout autre outil) à des fins personnelles.</p>
</div>

<div class="art no-break">
  <h4>Article 12 : Clause de confidentialité</h4>
  <p>L'employé s'interdit totalement de divulguer, pendant ou après son emploi, tous renseignements de nature confidentielle qu'il aurait pu recueillir.</p>
  <p>L'employé considérera comme strictement confidentiel et s'interdit de divulguer toutes informations, documents, données dont il pourra avoir connaissance à l'occasion de l'exécution du présent contrat. En conséquence, il s'interdit notamment de :</p>
  <ul>
    <li>Divulguer tout renseignement de nature confidentielle qu'il aurait pu recueillir dans le cadre de l'exercice de ses fonctions ou lié à celle-ci ;</li>
    <li>Utiliser les informations confidentielles dont il a eu connaissance au cours de ses missions et à l'occasion des travaux réalisés.</li>
  </ul>
  <p>Toutefois, l'employé ne serait tenu pour responsable d'aucune divulgation si les éléments étaient dans le domaine public à date de la divulgation, ou s'il en avait connaissance ou les obtient de tiers par des moyens légitimes.</p>
  <p>L'employé ne doit pas prendre de position qui altérerait l'exercice indépendant et impartial de ses fonctions. Ce devoir de réserve se prolonge au-delà de l'exercice des fonctions. Il doit également éviter tout conflit d'intérêt.</p>
  <p>Il est entendu par conflit d'intérêts toute situation d'interférence entre un intérêt public ou privé qui peut perturber l'exécution indépendante, impartiale et objective des services convenus.</p>
</div>

<!-- ========== PAGE 4 : Art.13-16 + Signatures ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 13 : Résiliation</h4>
  <p>Ce contrat de travail cesse de plein droit au terme des <span class="hl">{{duree_contrat}}</span> prévus au contrat et peut être systématiquement renouvelé. À la fin de ce contrat de travail, s'il n'est pas renouvelé, l'employé perd la qualité d'employé de l'Entreprise.</p>
  <p>Ce contrat de travail peut prendre fin avant son terme :</p>
  <ul>
    <li>Sur accord écrit des deux Parties ;</li>
    <li>À tout moment, hors période d'essai, par la volonté de l'une des Parties sous réserve d'un préavis d'<strong>un (1) mois</strong> ;</li>
    <li>Sur démission, abandon de poste ou absence injustifiée de l'employé à son poste pendant une durée de quarante-huit (48) heures ;</li>
    <li>En cas de mauvaise performance de l'employé rendant impossible son maintien au sein de la structure ;</li>
    <li>En cas de décès de l'employé ;</li>
    <li>En cas de force majeure dûment justifiée par écrit dans les sept (07) jours suivant sa constatation par la Partie qui s'en prévaut ;</li>
    <li>Sans préavis en cas de faute lourde de l'employé dûment notifiée à celui-ci, sous réserve de l'appréciation de la juridiction compétente en ce qui concerne la gravité de la faute ;</li>
    <li>En cas de violation délibérée dûment constatée des clauses du présent contrat par l'une des Parties.</li>
  </ul>
  <p>Il est notamment précisé qu'est considérée comme faute lourde, toute fausse déclaration constatée dans le curriculum vitae ou autre document produit par l'employé ou toute rétention d'informations utiles et déterminantes pour la conclusion du présent contrat.</p>
  <p>En cas de résiliation du présent contrat, l'ensemble des matériels et toutes autres pièces confiés ou remis à l'employé, ou tout document ou somme d'argent qu'il détiendrait par devers lui, doit être restitué à l'entreprise sans délai.</p>
</div>

<div class="art no-break">
  <h4>Article 14 : Attribution de juridiction</h4>
  <p>Tout litige relatif à la conclusion, à l'exécution du présent contrat, à défaut de règlement amiable dans un délai de trente (30) jours à compter de la notification du litige par une partie, sera porté devant les juridictions sociales compétentes.</p>
</div>

<div class="art no-break">
  <h4>Article 15 : Dispositions diverses</h4>
  <p>Pour ce qui n'est pas précisé au présent contrat, les Parties s'en remettent aux dispositions du Code du Travail fixant les modalités de sa mise en œuvre, des accords du travail ainsi que toutes autres dispositions législatives et réglementaires en République du Bénin.</p>
</div>

<div class="art no-break">
  <h4>Article 16 : Enregistrement</h4>
  <p>Le présent contrat est enregistré dès sa signature pour servir et valoir ce que de droit.</p>
</div>

<p class="intro no-break" style="margin-top:16px"><strong>Fait à <span class="hl">{{lieu_signature}}</span> en trois exemplaires, le <span class="hl">{{date_signature}}</span></strong></p>

<div class="sigs no-break">
  <div class="sig">
    <p><strong>Le Manager</strong></p>
    <p style="font-size:10pt">{{representant_entreprise}}</p>
    <div class="sig-line">Signature et cachet</div>
  </div>
  <div class="sig">
    <p><strong>L'Employé(e)</strong></p>
    <p style="font-size:10pt">{{nom}}</p>
    <div class="sig-line">Signature</div>
  </div>
</div>

<div class="legal">Contrat conforme — Code du Travail Bénin Loi n° 98-004 | CNSS affiliée dès confirmation période d'essai | OHADA</div>
</body></html>$cci_cdd$, NULL)
            `);
            await pool.query(`
                INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
                VALUES (12, 'contrat_cdi', 'Contrat CDI — CCI PARTNERS', $cci_cdi$<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11.5pt;color:#1a1a1a;margin:0;padding:20px 25px}
@media print{@page{margin:15mm 20mm;size:A4}.pb{page-break-before:always}.no-break{page-break-inside:avoid}}
.header{display:flex;align-items:stretch;margin-bottom:18px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c}
.header-logo{background:#1a3a5c;color:#fff;padding:8px 12px;display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:160px}
.header-logo .logo-wrap{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.header-logo .brand-top{font-size:14pt;font-weight:900;color:#fff;letter-spacing:1px}
.header-logo .brand-sub{font-size:7pt;color:#a8c4e0;letter-spacing:2px;text-transform:uppercase;font-weight:600}
.header-content{flex:1;padding:14px 18px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.header-content h1{font-size:14pt;color:#1a3a5c;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px}
.header-content h2{font-size:12pt;color:#1a3a5c;margin:0}
.header-content p{font-size:10pt;color:#555;margin:4px 0}
.pblock{background:#f5f7fa;border-left:4px solid #1a3a5c;padding:8px 14px;margin:8px 0;border-radius:4px}
.pblock h3{font-size:10pt;color:#1a3a5c;margin:0 0 5px 0;text-transform:uppercase}
.pblock p{margin:3px 0;font-size:11pt;line-height:1.5}
.sep{text-align:center;font-weight:bold;color:#1a3a5c;margin:6px 0;font-size:11pt}
.intro{text-align:center;margin:8px 0;font-size:11pt}
.art{margin:10px 0}
.art h4{font-size:11pt;color:#1a3a5c;text-transform:uppercase;border-bottom:1px solid #dde;padding-bottom:3px;margin:0 0 5px 0}
.art p{margin:4px 0;line-height:1.6;text-align:justify;font-size:11pt}
.art ul{margin:4px 0;padding-left:18px}
.art ul li{margin:3px 0;line-height:1.5;font-size:11pt}
.hl{background:#fff3cd;padding:1px 4px;border-radius:3px;font-weight:bold}
.sigs{display:flex;justify-content:space-between;margin-top:40px}
.sig{text-align:center;width:45%}
.sig-line{border-top:1px solid #333;margin-top:50px;padding-top:6px;font-size:10pt}
.legal{font-size:8pt;color:#aaa;text-align:center;margin-top:14px;border-top:1px solid #eee;padding-top:6px}</style></head><body>

<!-- ========== PAGE 1 : En-tête + Parties + Art.1-3 ========== -->
<div class="header no-break">
  <div class="header-logo">
    <div class="logo-wrap"><img src="/assets/LOGO_CCI.png" style="width:130px;height:auto;display:block;mix-blend-mode:screen"></div>
  </div>
  <div class="header-content">
    <h1>CONTRAT DE TRAVAIL</h1>
    <h2>À DURÉE INDÉTERMINÉE (CDI)</h2>
    <p>Ref : {{reference_contrat}} &nbsp;|&nbsp; Fait à {{lieu_signature}}, le {{date_signature}}</p>
  </div>
</div>

<p class="intro no-break"><strong>ENTRE</strong></p>

<div class="pblock no-break">
  <h3>L'Employeur</h3>
  <p>Raison Sociale : <strong>{{nom_entreprise}}</strong></p>
  <p>Représentée par : <strong>{{representant_entreprise}}</strong> &nbsp; Siège Social / Adresse : <strong>{{adresse_entreprise}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employeur »</strong></p>
</div>

<p class="sep">D'UNE PART,<br>Et</p>

<div class="pblock no-break">
  <h3>L'Employé(e)</h3>
  <p>Madame / Monsieur : <strong>{{nom}}</strong></p>
  <p>Date et lieu de Naissance : <strong>{{date_naissance}}</strong> &nbsp;&nbsp; Nationalité : <strong>{{nationalite}}</strong></p>
  <p>Résident(e) habituellement à : <strong>{{adresse_salarie}}</strong></p>
  <p>Situation Matrimoniale : <strong>{{situation_matrimoniale}}</strong></p>
  <p style="margin-top:5px;font-style:italic">Ci-après désigné <strong>« Employé »</strong></p>
</div>

<p class="sep">D'AUTRE PART</p>
<p class="intro">L'employeur et l'employé sont collectivement appelés les <strong>« Parties »</strong> et individuellement une <strong>« Partie »</strong>.</p>
<p class="intro"><strong>Il a été convenu de ce qui suit :</strong></p>

<div class="art no-break">
  <h4>Article 1 : Objet du contrat</h4>
  <p>Le présent contrat de travail à durée indéterminée a pour objet de déterminer les conditions et modalités selon lesquelles l'employé accepte de mettre à la disposition de <strong>{{nom_entreprise}}</strong>, son savoir-faire, son temps, et sa loyauté en tant que <span class="hl">{{poste}}</span> pour atteindre des objectifs moyennant une rémunération convenue.</p>
</div>

<div class="art no-break">
  <h4>Article 2 : Prise d'Effet et Période d'Essai</h4>
  <p>Le présent contrat est conclu pour une durée déterminée de <span class="hl">{{duree_contrat}}</span> allant du <span class="hl">{{date_debut}}</span> au <span class="hl">{{date_fin}}</span>, sous réserve de son interruption anticipée selon les conditions prévues à l'article 13 ci-dessous.</p>
  <p>Il prend fin de plein droit à l'échéance du terme ci-dessus indiqué et peut être transformé en contrat à durée indéterminée sur accord des parties.</p>
</div>

<div class="art no-break">
  <h4>Article 3 : Fonctions de l'Employé</h4>
  <p>L'employé se met à la disposition de l'entreprise en qualité de <span class="hl">{{poste}}</span>.</p>
  <p>Toutefois, en cas de nécessité, l'employé pourra être amené à exercer toutes autres attributions à lui confiées par l'entreprise dans la mesure de ses qualifications.</p>
</div>

<!-- ========== PAGE 2 : Art.4-8 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 4 : Engagement de l'Employé</h4>
  <p>L'employé déclare être libre de tous engagements professionnels et s'engage à :</p>
  <ul>
    <li>Exercer ses attributions sous l'autorité de ses supérieurs hiérarchiques et à se soumettre aux règles applicables dans l'entreprise et notamment aux règles de discipline, s'acquitter avec loyauté, responsabilité et fidélité des travaux ou missions qui lui seront confiés ;</li>
    <li>Effectuer les déplacements nécessaires et se rendre en tous lieux où l'entreprise aura besoin de ses services dans les limites des accords ;</li>
    <li>Informer son employeur sans délai de tout changement qui interviendrait dans sa situation professionnelle comme personnelle, notamment en cas de changement d'adresse ou de situation matrimoniale ;</li>
    <li>S'abstenir de toute attitude de nature à jeter le discrédit sur l'activité de l'entreprise ou les supérieurs hiérarchiques dont il relève ;</li>
    <li>Assister aux formations organisées par les partenaires avec un accord de son supérieur ;</li>
    <li>Aviser son employeur de tout incident affectant l'exécution de son travail, dans un délai de 24h maximum, en vue de la prise des dispositions auprès la Caisse Nationale de Sécurité Sociale (CNSS) ;</li>
    <li>Restituer à l'expiration du contrat quel qu'en soit la cause, tout matériel à lui confié par l'employeur.</li>
  </ul>
</div>

<div class="art no-break">
  <h4>Article 5 : Actions d'accompagnement et de formation, tuteur et référent</h4>
  <p>L'employé s'engage à suivre toutes les actions d'accompagnement, de formation, de tutorat et de validation des acquis prévues et concourant à son évolution professionnelle.</p>
  <p>À ce titre, il bénéficie d'un accompagnement par les référents désignés par <strong>{{nom_entreprise}}</strong> et chargés d'assurer le suivi de son parcours professionnel.</p>
</div>

<div class="art no-break">
  <h4>Article 6 : Lieu et horaire de travail</h4>
  <p>Les horaires de travail de l'employé sont ceux de l'entreprise, non contraires aux dispositions légales en vigueur en République du Bénin.</p>
  <p>Les horaires de <strong>{{nom_entreprise}}</strong> sont de <span class="hl">{{heures_mensuelles}}</span> heures par mois réparties suivant le calendrier des rotations mensuelles.</p>
  <p>Le lieu de travail est le siège de <strong>{{nom_entreprise}}</strong> et tout autre endroit désigné par l'employeur.</p>
</div>

<div class="art no-break">
  <h4>Article 7 : Rémunération</h4>
  <p>L'employé percevra une rémunération nette mensuelle de <span class="hl">{{salaire_net}} FCFA</span>.</p>
  <p>Cette rémunération sera versée mensuellement à l'employé par virement bancaire, chèque ou tout autre moyen de paiement légal. Il est versé au plus tard le <span class="hl">{{jour_paiement}}</span> du mois suivant. En cas de difficulté financière, l'employeur doit informer l'employé et convenir avec lui d'une prochaine échéance.</p>
</div>

<div class="art no-break">
  <h4>Article 8 : Frais de mission</h4>
  <p>En cas de mission hors du lieu d'exercice habituel de ses fonctions, des frais de missions relatifs à l'hébergement, la restauration et au déplacement sont accordés à l'employé conformément aux règles applicables au sein de l'entreprise.</p>
</div>

<!-- ========== PAGE 3 : Art.9-12 ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 9 : Avantages sociaux</h4>
  <p>L'affiliation de l'employé à la Caisse Nationale de Sécurité Sociale (CNSS) en vue de lui permettre de bénéficier des avantages sociaux reconnus par la réglementation en vigueur au Bénin, sera faite par l'entreprise dès confirmation de sa période d'essai.</p>
</div>

<div class="art no-break">
  <h4>Article 10 : Congés</h4>
  <p>L'employé a droit à deux (02) jours ouvrables de congés par mois de service effectif soit vingt-quatre (24) jours de travail ouvrables par an. La jouissance de ses congés sera planifiée en accord avec l'employeur et est valable dès la fin de la première année.</p>
  <p>En cas d'arrêt pour cause de maladie, l'employé devra présenter à l'entreprise sans délai un certificat émis par un médecin agréé.</p>
</div>

<div class="art no-break">
  <h4>Article 11 : Clause d'exclusivité</h4>
  <p>L'employé s'interdit d'exercer pendant la durée de son contrat même en dehors des heures de travail, une activité à caractère professionnel susceptible de concurrencer son employeur dans ses activités professionnelles ou de nuire à l'exécution normale des services convenus.</p>
  <p>L'employé s'interdit d'utiliser les outils de travail (ordinateur ; téléphone ; imprimante ; connexion et tout autre outil) à des fins personnelles.</p>
</div>

<div class="art no-break">
  <h4>Article 12 : Clause de confidentialité</h4>
  <p>L'employé s'interdit totalement de divulguer, pendant ou après son emploi, tous renseignements de nature confidentielle qu'il aurait pu recueillir.</p>
  <p>L'employé considérera comme strictement confidentiel et s'interdit de divulguer toutes informations, documents, données dont il pourra avoir connaissance à l'occasion de l'exécution du présent contrat. En conséquence, il s'interdit notamment de :</p>
  <ul>
    <li>Divulguer tout renseignement de nature confidentielle qu'il aurait pu recueillir dans le cadre de l'exercice de ses fonctions ou lié à celle-ci ;</li>
    <li>Utiliser les informations confidentielles dont il a eu connaissance au cours de ses missions et à l'occasion des travaux réalisés.</li>
  </ul>
  <p>Toutefois, l'employé ne serait tenu pour responsable d'aucune divulgation si les éléments étaient dans le domaine public à date de la divulgation, ou s'il en avait connaissance ou les obtient de tiers par des moyens légitimes.</p>
  <p>L'employé ne doit pas prendre de position qui altérerait l'exercice indépendant et impartial de ses fonctions. Ce devoir de réserve se prolonge au-delà de l'exercice des fonctions. Il doit également éviter tout conflit d'intérêt.</p>
  <p>Il est entendu par conflit d'intérêts toute situation d'interférence entre un intérêt public ou privé qui peut perturber l'exécution indépendante, impartiale et objective des services convenus.</p>
</div>

<!-- ========== PAGE 4 : Art.13-16 + Signatures ========== -->
<div class="pb"></div>

<div class="art no-break">
  <h4>Article 13 : Rupture du Contrat</h4>
  <p>Ce contrat de travail cesse de plein droit au terme des <span class="hl">{{duree_contrat}}</span> prévus au contrat et peut être systématiquement renouvelé. À la fin de ce contrat de travail, s'il n'est pas renouvelé, l'employé perd la qualité d'employé de l'Entreprise.</p>
  <p>Ce contrat de travail peut prendre fin avant son terme :</p>
  <ul>
    <li>Par démission de l'employé avec respect du préavis ;</li>
    <li>Par licenciement prononcé par l'employeur pour motif réel et sérieux ;</li>
    <li>Par rupture conventionnelle sur accord écrit des deux Parties ;</li>
    <li>À tout moment, hors période d'essai, par la volonté de l'une des Parties sous réserve d'un préavis de <span class="hl">{{{{duree_preavis}}}}</span> ;</li>
    <li>Sur démission, abandon de poste ou absence injustifiée de l'employé à son poste pendant une durée de quarante-huit (48) heures ;</li>
    <li>En cas de mauvaise performance de l'employé rendant impossible son maintien au sein de la structure ;</li>
    <li>En cas de décès de l'employé ;</li>
    <li>En cas de force majeure dûment justifiée par écrit dans les sept (07) jours suivant sa constatation par la Partie qui s'en prévaut ;</li>
    <li>Sans préavis en cas de faute lourde de l'employé dûment notifiée à celui-ci, sous réserve de l'appréciation de la juridiction compétente en ce qui concerne la gravité de la faute ;</li>
    <li>En cas de violation délibérée dûment constatée des clauses du présent contrat par l'une des Parties.</li>
  </ul>
  <p>Il est notamment précisé qu'est considérée comme faute lourde, toute fausse déclaration constatée dans le curriculum vitae ou autre document produit par l'employé ou toute rétention d'informations utiles et déterminantes pour la conclusion du présent contrat.</p>
  <p>En cas de résiliation du présent contrat, l'ensemble des matériels et toutes autres pièces confiés ou remis à l'employé, ou tout document ou somme d'argent qu'il détiendrait par devers lui, doit être restitué à l'entreprise sans délai.</p>
</div>

<div class="art no-break">
  <h4>Article 14 : Attribution de juridiction</h4>
  <p>Tout litige relatif à la conclusion, à l'exécution du présent contrat, à défaut de règlement amiable dans un délai de trente (30) jours à compter de la notification du litige par une partie, sera porté devant les juridictions sociales compétentes.</p>
</div>

<div class="art no-break">
  <h4>Article 15 : Dispositions diverses</h4>
  <p>Pour ce qui n'est pas précisé au présent contrat, les Parties s'en remettent aux dispositions du Code du Travail fixant les modalités de sa mise en œuvre, des accords du travail ainsi que toutes autres dispositions législatives et réglementaires en République du Bénin.</p>
</div>

<div class="art no-break">
  <h4>Article 16 : Enregistrement</h4>
  <p>Le présent contrat est enregistré dès sa signature pour servir et valoir ce que de droit.</p>
</div>

<p class="intro no-break" style="margin-top:16px"><strong>Fait à <span class="hl">{{lieu_signature}}</span> en trois exemplaires, le <span class="hl">{{date_signature}}</span></strong></p>

<div class="sigs no-break">
  <div class="sig">
    <p><strong>Le Manager</strong></p>
    <p style="font-size:10pt">{{representant_entreprise}}</p>
    <div class="sig-line">Signature et cachet</div>
  </div>
  <div class="sig">
    <p><strong>L'Employé(e)</strong></p>
    <p style="font-size:10pt">{{nom}}</p>
    <div class="sig-line">Signature</div>
  </div>
</div>

<div class="legal">Contrat conforme — Code du Travail Bénin Loi n° 98-004 | CNSS affiliée dès confirmation période d'essai | OHADA</div>
</body></html>$cci_cdi$, NULL)
            `);
            await pool.query(`
                INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
                VALUES (12, 'fiche_paie', 'Bulletin de Paie — CCI PARTNERS', $cci_fp$<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bulletin de Paie</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:10.5pt;color:#2d3748;line-height:1.5;margin:0;padding:24px;background-color:#ffffff}
.header{display:flex;justify-content:space-between;align-items:stretch;margin-bottom:20px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(26,58,92,0.13)}
.header-left{background:#1a3a5c;color:#fff;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;min-width:220px;max-width:260px}
.header-left .logo-wrap{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.header-left .logo-icon{width:44px;height:44px;flex-shrink:0}
.header-left .logo-text{display:flex;flex-direction:column;line-height:1.1}
.header-left .logo-text .brand-top{font-size:13pt;font-weight:900;color:#fff;letter-spacing:1px}
.header-left .logo-text .brand-sub{font-size:7pt;color:#a8c4e0;letter-spacing:2px;text-transform:uppercase;font-weight:600}
.header-left p{margin:2px 0;font-size:8.5pt;color:#c8dff0}
.header-left .ref-fiche{font-size:8pt;color:#7fb3d3;margin-top:6px;font-style:italic}
.header-right{flex:1;background:#fff;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;border:1px solid #e2e8f0;border-left:none;border-radius:0 8px 8px 0}
.header-right h2{font-size:18pt;color:#1a3a5c;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1.5px;font-weight:900}
.periode-badge{display:inline-block;background:#1a3a5c;color:#fff;padding:5px 18px;border-radius:6px;font-size:10.5pt;font-weight:700;margin:4px 0 10px 0;letter-spacing:0.5px}
.header-right p{margin:0;font-size:9.5pt;color:#4a5568}
.ref-fiche{font-size:9pt;color:#718096;margin-top:4px;font-style:italic}
.ei{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px}
.ei-b{display:flex;flex-direction:column}
.ei-b label{font-size:8.5pt;color:#718096;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px}
.ei-b span{font-weight:600;font-size:10pt;color:#1a202c}
table.paie{width:100%;border-collapse:collapse;margin:20px 0;font-size:9.5pt}
table.paie thead th{background:#1a3a5c;color:#ffffff;padding:8px 12px;text-align:left;font-weight:600;text-transform:uppercase;font-size:8.5pt;letter-spacing:0.5px}
table.paie thead th:nth-child(n+4){text-align:right}
table.paie tbody tr{border-bottom:1px solid #edf2f7}
table.paie tbody tr:nth-child(even){background:#f8fafc}
table.paie tbody td{padding:8px 12px;vertical-align:middle}
table.paie tbody td.amt{text-align:right;font-weight:600;color:#2d3748}
table.paie tbody td.dbt{text-align:right;font-weight:600;color:#e53e3e}
table.paie tr.sh td{background:#edf2f7;font-weight:700;color:#2b6cb0;padding:6px 12px;font-size:8.5pt;letter-spacing:0.3px;border-bottom:1px solid #cbd5e0}
.info-box,.pat-box{border-radius:6px;padding:10px 14px;margin:12px 0;font-size:9.5pt;display:flex;align-items:center;gap:6px}
.info-box{background:#ebf8ff;border:1px solid #bee3f8;color:#2b6cb0}
.pat-box{background:#fffaf0;border:1px solid #feebc8;color:#dd6b20}
.totaux-container{display:flex;justify-content:flex-end;margin-top:16px}
.totaux-box{background:#1a3a5c;color:#ffffff;padding:16px;border-radius:8px;width:300px}
.tr{display:flex;justify-content:space-between;margin:4px 0;font-size:10pt;opacity:0.9}
.tr.net{font-size:13pt;font-weight:700;border-top:1px solid rgba(255,255,255,0.25);padding-top:10px;margin-top:10px;opacity:1}
.mention{text-align:center;font-size:9pt;color:#4a5568;margin-top:16px;font-style:italic}
.signatures{display:flex;justify-content:space-between;margin-top:40px;page-break-inside:avoid}
.sig-block{text-align:center;width:42%}
.sig-block p{margin:0 0 4px 0}
.sig-line{border-top:1px solid #a0aec0;margin-top:50px;padding-top:6px;font-size:9pt;color:#718096;font-style:italic}
.legal-ref{font-size:7.5pt;color:#a0aec0;text-align:center;margin-top:35px;border-top:1px solid #e2e8f0;padding-top:10px;line-height:1.4}
@media print{
  body{padding:0;background:white}
  .totaux-box{background:#1a3a5c !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  table.paie thead th{background:#1a3a5c !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  table.paie tr.sh td{background:#edf2f7 !important;-webkit-print-color-adjust:exact}
  .ei{background:#f8fafc !important;-webkit-print-color-adjust:exact}
  .info-box{background:#ebf8ff !important;-webkit-print-color-adjust:exact}
  .pat-box{background:#fffaf0 !important;-webkit-print-color-adjust:exact}
}
</style></head><body>

<div class="header">
  <div class="header-left">
    <div class="logo-wrap">
      <svg class="logo-icon" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <rect width="44" height="44" rx="6" fill="#fff" opacity="0.12"/>
        <rect x="4" y="10" width="6" height="24" rx="2" fill="#fff"/>
        <rect x="13" y="10" width="6" height="24" rx="2" fill="#fff"/>
        <rect x="4" y="10" width="15" height="6" rx="2" fill="#fff"/>
        <rect x="26" y="10" width="14" height="6" rx="2" fill="#4a9fd4"/>
        <rect x="26" y="10" width="5" height="24" rx="2" fill="#4a9fd4"/>
        <rect x="26" y="28" width="14" height="6" rx="2" fill="#4a9fd4"/>
        <rect x="26" y="19" width="14" height="5" rx="2" fill="#4a9fd4" opacity="0.6"/>
      </svg>
      <div class="logo-text">
        <span class="brand-top">CCI</span>
        <span class="brand-sub">Partners</span>
      </div>
    </div>
    <p>{{adresse_entreprise}}</p>
    <p>IFU : {{ifu}}</p>
    <p>N° Employeur CNSS : {{numero_employeur_cnss}}</p>
    <p class="ref-fiche">Fiche N° {{reference_fiche}}</p>
  </div>
  <div class="header-right">
    <h2>Bulletin de Paie</h2>
    <div class="periode-badge">{{periode}}</div>
    <p>{{nom_entreprise}}</p>
    <p>Date de paiement : <strong>{{date_paiement}}</strong></p>
  </div>
</div>

<div class="ei">
  <div class="ei-b"><label>Nom et Prénom</label><span>{{nom}}</span></div>
  <div class="ei-b"><label>Adresse</label><span>{{adresse_salarie}}</span></div>
  <div class="ei-b"><label>Numéro Employé</label><span>{{matricule}}</span></div>
  <div class="ei-b"><label>Téléphone</label><span>{{telephone}}</span></div>
  <div class="ei-b"><label>Nature du Contrat</label><span>{{type_contrat}}</span></div>
  <div class="ei-b"><label>Emploi / Poste</label><span>{{poste}}</span></div>
</div>

<table class="paie">
  <thead>
    <tr>
      <th>Libellé</th>
      <th>Heures</th>
      <th>Taux Horaire</th>
      <th>Gains (FCFA)</th>
      <th>Retenues (FCFA)</th>
    </tr>
  </thead>
  <tbody>
    <tr class="sh"><td colspan="5">RÉMUNÉRATION</td></tr>
    <tr><td>Salaire de Base</td><td>{{heures_travaillees}}</td><td>{{taux_horaire}}</td><td class="amt">{{salaire_base}}</td><td></td></tr>
    <tr><td>Heures Supplémentaires à 25%</td><td>{{hs_25_heures}}</td><td>{{hs_25_taux}}</td><td class="amt">{{hs_25_montant}}</td><td></td></tr>
    <tr><td>Heures Supplémentaires à 50%</td><td>{{hs_50_heures}}</td><td>{{hs_50_taux}}</td><td class="amt">{{hs_50_montant}}</td><td></td></tr>

    <tr class="sh"><td colspan="5">COTISATIONS SOCIALES — PART PATRONALE</td></tr>
    <tr><td>CNSS — Assurance maladie / Cotisation familiale / Risque professionnel</td><td>{{salaire_brut}}</td><td>15,4 %</td><td></td><td class="dbt">{{cnss_patronal}}</td></tr>

    <tr class="sh"><td colspan="5">COTISATIONS SOCIALES — PART SALARIALE</td></tr>
    <tr><td>CNSS — Assurance vieillesse (Part ouvrière)</td><td>{{salaire_brut}}</td><td>3,6 %</td><td></td><td class="dbt">{{cnss_salarie}}</td></tr>

    <tr class="sh"><td colspan="5">IMPÔT SUR TRAITEMENTS ET SALAIRES (ITS) — CGI art. 119-125</td></tr>
    <tr><td>Base imposable (Brut − CNSS salarié)</td><td>{{base_imposable}}</td><td>Progressif 0%→30%</td><td></td><td></td></tr>
    <tr><td>ITS calculé sur tranches (exonération 0→60 000 FCFA)</td><td>{{base_imposable}}</td><td>Barème CGI</td><td></td><td class="dbt">{{its}}</td></tr>

    <tr class="sh"><td colspan="5">AUTRES DÉDUCTIONS</td></tr>
    <tr><td>Avance sur salaire</td><td>—</td><td>—</td><td></td><td class="dbt">{{avance_salaire}}</td></tr>
    <tr><td>Autres retenues</td><td>—</td><td>—</td><td></td><td class="dbt">{{autres_retenues}}</td></tr>
  </tbody>
</table>

<div class="info-box">📅 Congés — Acquis ce mois : <strong>{{conges_acquis}} j</strong> &nbsp;|&nbsp; Pris : <strong>{{conges_pris}} j</strong> &nbsp;|&nbsp; Solde : <strong>{{conges_solde}} j</strong></div>
<div class="pat-box">📊 Charges Patronales CNSS 15,4% : <strong>{{cnss_patronal}} FCFA</strong> &nbsp;|&nbsp; VPS 3% : <strong>{{vps}} FCFA</strong></div>

<div class="totaux-container">
  <div class="totaux-box">
    <div class="tr"><span>SALAIRE BRUT</span><span>{{salaire_brut}} FCFA</span></div>
    <div class="tr"><span>Total Cotisations</span><span>{{total_retenues}} FCFA</span></div>
    <div class="tr net"><span>NET À PAYER</span><span>{{net_a_payer}} FCFA</span></div>
  </div>
</div>

<p class="mention">Payé par virement bancaire / chèque N° ………………………………… le : ………………………………</p>
<p class="mention" style="margin-top:4px;font-size:8pt;color:#a0aec0">Salaire net imposable : <strong>{{net_a_payer}} FCFA</strong> &nbsp;|&nbsp; A CONSERVER SANS LIMITATION DE DURÉE</p>

<div class="signatures">
  <div class="sig-block">
    <p><strong>L'Employeur</strong></p>
    <p style="font-size:9.5pt;color:#4a5568">{{representant_entreprise}}</p>
    <div class="sig-line">Signature et cachet</div>
  </div>
  <div class="sig-block">
    <p><strong>L'Employé(e)</strong></p>
    <p style="font-size:9pt;color:#718096">Reçu la somme de <strong>{{net_a_payer}} FCFA</strong></p>
    <div class="sig-line">Signature</div>
  </div>
</div>

<div class="legal-ref">
  Bulletin conforme — Code du Travail Bénin Loi n° 98-004 | CNSS 3,6% salarié / 15,4% patronal | ITS CGI art.119-125 | Exonération 60 000 FCFA | SMIG 52 000 FCFA | VPS art.191-195 CGI
</div>
</body></html>$cci_fp$, NULL)
            `);
            console.log('   ✓ Modèles CDI/CDD/Fiche de paie personnalisés CCI PARTNERS (company_id=12) vérifiés');

            return;

        } catch (error) {
            console.warn(`⚠️ [DB] Tentative ${attempt}/${retries} échouée: ${error.message}`);
            if (attempt < retries) {
                console.log(`   ↻ Nouvelle tentative dans ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('❌ [DB] Toutes les tentatives ont échoué.');
            }
        }
    }
};

// =============================================================================
// MIDDLEWARES GLOBAUX
// =============================================================================
const allowedOrigins = ['https://douke-compta-pro.onrender.com'];
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:3000');
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`⚠️ [CORS] Origine bloquée : ${origin}`);
        callback(new Error(`Origine non autorisée par CORS : ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));        // ✅ V27 — limite augmentée pour fichiers base64
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// MONTAGE DES ROUTES API
// =============================================================================
console.log('🔵 Montage des routes API...');

app.use('/api/auth',                       authRoutes);
console.log('✅ Route /api/auth montee');
app.use('/api/companies',                  companyRoutes);
console.log('✅ Route /api/companies montee');
app.use('/api/accounting',                 accountingRoutes);
console.log('✅ Route /api/accounting montee');
app.use('/api/user',                       userRoutes);
console.log('✅ Route /api/user montee');
app.use('/api/settings',                   settingsRoutes);
console.log('✅ Route /api/settings montee');
app.use('/api/admin',                      adminUsersRoutes);
console.log('✅ Route /api/admin montee');
app.use('/api/notifications',              notificationsRoutes);
console.log('✅ Route /api/notifications montee');
app.use('/api/ocr',                        ocrRoutes);
console.log('✅ Route /api/ocr montee');
app.use('/api/accounting/immobilisations', immobilisationsRoutes);
console.log('✅ Route /api/accounting/immobilisations montee');
app.use('/api/reports',                    reportsRoutes);
console.log('✅ Route /api/reports montee');
app.use('/api/syscohada',                  syscohadaRoutes);
console.log('✅ Route /api/syscohada montee');
app.use('/api/hr',                         hrRoutes);             // ✅ V27
app.use('/api/closing',                    closingRoutes);            // ✅ Chirurgie étape 1
console.log('✅ Route /api/hr montee');

console.log('✅ Toutes les routes montees avec succes');

// =============================================================================
// ROUTE DE SANTÉ
// =============================================================================
app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    try { const pool = require('./services/dbService'); await pool.query('SELECT 1'); dbStatus = 'ok'; }
    catch (e) { dbStatus = 'error: ' + e.message; }
    res.json({
        status: 'OK', version: 'V27', timestamp: new Date().toISOString(), db: dbStatus,
        routes: ['auth','companies','accounting','user','settings','admin',
                 'notifications','ocr','immobilisations','reports','syscohada','hr']
    });
});

// =============================================================================
// FALLBACK SPA
// =============================================================================
app.use((req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        console.log(`[404] API non trouvée: ${req.method} ${req.url}`);
        res.status(404).json({
            error: 'Route API non trouvée', path: req.url, method: req.method,
            availableRoutes: ['/api/auth','/api/companies','/api/accounting','/api/user',
                '/api/settings','/api/admin','/api/notifications','/api/ocr',
                '/api/accounting/immobilisations','/api/reports','/api/syscohada','/api/hr']
        });
    }
});

// =============================================================================
// GESTIONNAIRE D'ERREURS GLOBAL
// =============================================================================
app.use((err, req, res, next) => {
    console.error('[ERREUR SERVEUR]', err.message);
    if (process.env.NODE_ENV === 'production')
        return res.status(500).json({ error: 'Erreur serveur interne. Veuillez réessayer.' });
    res.status(500).json({ error: 'Erreur serveur interne', message: err.message, stack: err.stack });
});

// =============================================================================
// DÉMARRAGE DU SERVEUR
// =============================================================================
app.listen(PORT, async () => {
    console.log('='.repeat(60));
    console.log('  DOUKE COMPTA PRO - SERVEUR DEMARRE');
    console.log('='.repeat(60));
    console.log(`  Port      : ${PORT}`);
    console.log(`  URL       : http://localhost:${PORT}`);
    console.log(`  Timestamp : ${new Date().toISOString()}`);
    console.log(`  Env       : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  CORS      : ${allowedOrigins.join(', ')}`);
    console.log('='.repeat(60));

    await initDB();

    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        const KEEP_ALIVE_INTERVAL = 9 * 60 * 1000;
        setInterval(async () => {
            try { await fetch('https://douke-compta-pro.onrender.com/api/health'); console.log('🔄 [Keep-alive] Ping HTTP OK'); }
            catch (e) { console.warn('⚠️ [Keep-alive] Ping HTTP échoué:', e.message); }
            try { const pool = require('./services/dbService'); await pool.query('SELECT 1'); console.log('🔄 [Keep-alive] Ping PostgreSQL OK'); }
            catch (e) { console.warn('⚠️ [Keep-alive] Ping PostgreSQL échoué:', e.message); }
            try {
                const pool = require('./services/dbService');
                const result = await pool.query('DELETE FROM revoked_tokens WHERE expires_at < NOW()');
                if (result.rowCount > 0) console.log(`🧹 [Keep-alive] ${result.rowCount} token(s) nettoyé(s)`);
            } catch (e) { /* silencieux */ }
        }, KEEP_ALIVE_INTERVAL);
        console.log('✅ [Keep-alive] Activé');
    }
});
// redeploy Sat Jun 20 20:17:16 UTC 2026
