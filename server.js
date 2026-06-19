// =============================================================================
// FICHIER : server.js
// Description : Serveur principal Doukè Compta Pro
// Version : V26 — Ajout route SYSCOHADA Révisé
// Corrections V26 :
//   ✅ Ajout import syscohadaRoutes
//   ✅ Montage /api/syscohada
//   ✅ Mise à jour /api/health (routes)
//   ✅ Mise à jour handler 404 (availableRoutes)
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
const syscohadaRoutes       = require('./routes/syscohada');       // ✅ V26

const app  = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// CRÉATION AUTOMATIQUE DES DOSSIERS UPLOADS
// =============================================================================
const uploadDirs = [
    'uploads',
    'uploads/temp',
    'uploads/invoices',
    'uploads/documents'
];

console.log('📁 [Init] Vérification des dossiers uploads...');
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Dossier créé: ${dir}`);
    } else {
        console.log(`   ✓ Dossier existe: ${dir}`);
    }
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
            `);

            await pool.query(`
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
            `);

            // ✅ V26 — Table fiscal_year_balances (snapshot clôture annuelle)
            await pool.query(`
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

            console.log('✅ [DB] Tables initialisées avec succès');
            console.log('   ✓ financial_reports_requests');
            console.log('   ✓ financial_reports_notifications');
            console.log('   ✓ revoked_tokens');
            console.log('   ✓ notification_state');
            console.log('   ✓ fiscal_year_balances');
            return;

        } catch (error) {
            console.warn(`⚠️ [DB] Tentative ${attempt}/${retries} échouée: ${error.message}`);

            if (attempt < retries) {
                console.log(`   ↻ Nouvelle tentative dans ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('❌ [DB] Toutes les tentatives d\'initialisation ont échoué.');
                console.error('   L\'application fonctionne mais les tables peuvent être absentes.');
            }
        }
    }
};

// =============================================================================
// MIDDLEWARES GLOBAUX
// =============================================================================
const allowedOrigins = [
    'https://douke-compta-pro.onrender.com'
];
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use('/api/syscohada',                  syscohadaRoutes);         // ✅ V26
console.log('✅ Route /api/syscohada montee');

console.log('✅ Toutes les routes montees avec succes');

// =============================================================================
// ROUTE DE SANTÉ
// =============================================================================
app.get('/api/health', async (req, res) => {
    let dbStatus = 'unknown';
    try {
        const pool = require('./services/dbService');
        await pool.query('SELECT 1');
        dbStatus = 'ok';
    } catch (e) {
        dbStatus = 'error: ' + e.message;
    }

    res.json({
        status:    'OK',
        version:   'V26',
        timestamp: new Date().toISOString(),
        db:        dbStatus,
        routes: [
            'auth', 'companies', 'accounting', 'user',
            'settings', 'admin', 'notifications', 'ocr',
            'immobilisations', 'reports', 'syscohada'           // ✅ V26
        ]
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
            error:  'Route API non trouvée',
            path:   req.url,
            method: req.method,
            availableRoutes: [
                '/api/auth',
                '/api/companies',
                '/api/accounting',
                '/api/user',
                '/api/settings',
                '/api/admin',
                '/api/notifications',
                '/api/ocr',
                '/api/accounting/immobilisations',
                '/api/reports',
                '/api/syscohada'                                // ✅ V26
            ]
        });
    }
});

// =============================================================================
// GESTIONNAIRE D'ERREURS GLOBAL
// =============================================================================
app.use((err, req, res, next) => {
    console.error('[ERREUR SERVEUR]', err.message);
    console.error(err.stack);

    if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
            error: 'Erreur serveur interne. Veuillez réessayer.'
        });
    }

    res.status(500).json({
        error:   'Erreur serveur interne',
        message: err.message,
        stack:   err.stack
    });
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

            try {
                await fetch('https://douke-compta-pro.onrender.com/api/health');
                console.log('🔄 [Keep-alive] Ping HTTP OK');
            } catch (e) {
                console.warn('⚠️ [Keep-alive] Ping HTTP échoué:', e.message);
            }

            try {
                const pool = require('./services/dbService');
                await pool.query('SELECT 1');
                console.log('🔄 [Keep-alive] Ping PostgreSQL OK');
            } catch (e) {
                console.warn('⚠️ [Keep-alive] Ping PostgreSQL échoué:', e.message);
            }

            try {
                const pool = require('./services/dbService');
                const result = await pool.query(
                    'DELETE FROM revoked_tokens WHERE expires_at < NOW()'
                );
                if (result.rowCount > 0) {
                    console.log(`🧹 [Keep-alive] ${result.rowCount} token(s) révoqué(s) expiré(s) nettoyé(s)`);
                }
            } catch (e) {
                // Silencieux
            }

        }, KEEP_ALIVE_INTERVAL);

        console.log('✅ [Keep-alive] Activé — service et DB ne dormiront plus');
    }
});
