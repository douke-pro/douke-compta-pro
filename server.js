// =============================================================================
// FICHIER : server.js (VERSION V20 - INIT DB AUTOMATIQUE)
// =============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// =============================================================================
// IMPORTS DES ROUTES
// =============================================================================
const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 
const accountingRoutes = require('./routes/accounting');
const userRoutes = require('./routes/user');
const settingsRoutes = require('./routes/settings');
const adminUsersRoutes = require('./routes/adminUsers');
const notificationsRoutes = require('./routes/notifications');
const ocrRoutes = require('./routes/ocr');
const immobilisationsRoutes = require('./routes/immobilisations');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// INITIALISATION DES TABLES (AUTO-MIGRATION)
// =============================================================================
const initDB = async () => {
    const pool = require('./services/dbService');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS financial_reports_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                company_id INTEGER,
                accounting_system VARCHAR(50),
                period_start DATE,
                period_end DATE,
                fiscal_year VARCHAR(20),
                requested_by INTEGER,
                processed_by INTEGER,
                validated_by INTEGER,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                pdf_files JSONB,
                odoo_data JSONB,
                error_message TEXT,
                requested_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP,
                validated_at TIMESTAMP,
                sent_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS financial_reports_notifications (
                id SERIAL PRIMARY KEY,
                report_request_id INTEGER REFERENCES financial_reports_requests(id),
                recipient_user_id INTEGER,
                notification_type VARCHAR(50),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                read_at TIMESTAMP
            );
        `);
        console.log('✅ Tables financial_reports initialisées avec succès');
    } catch (error) {
        console.error('🚨 Erreur initialisation tables:', error.message);
        // Ne pas bloquer le démarrage du serveur
    }
};

// =============================================================================
// MIDDLEWARES
// =============================================================================
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// MONTAGE DES ROUTES API
// =============================================================================
console.log('🔵 Montage des routes API...');

app.use('/api/auth', authRoutes);
console.log('✅ Route /api/auth montée');

app.use('/api/companies', companyRoutes);
console.log('✅ Route /api/companies montée');

app.use('/api/accounting', accountingRoutes);
console.log('✅ Route /api/accounting montée');

app.use('/api/user', userRoutes);
console.log('✅ Route /api/user montée');

app.use('/api/settings', settingsRoutes);
console.log('✅ Route /api/settings montée');

app.use('/api/admin', adminUsersRoutes);
console.log('✅ Route /api/admin montée');

app.use('/api/notifications', notificationsRoutes);
console.log('✅ Route /api/notifications montée');

app.use('/api/ocr', ocrRoutes);
console.log('✅ Route /api/ocr montée');

app.use('/api/accounting/immobilisations', immobilisationsRoutes);
console.log('✅ Route /api/accounting/immobilisations montée');

app.use('/api/reports', reportsRoutes);
console.log('✅ Route /api/reports montée');

console.log('✅ Toutes les routes montées avec succès');

// =============================================================================
// ROUTE DE SANTÉ
// =============================================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        routes: [
            'auth', 'companies', 'accounting', 'user',
            'settings', 'admin', 'notifications', 'ocr', 'reports'
        ]
    });
});

// =============================================================================
// MIDDLEWARE DE FALLBACK
// =============================================================================
app.use((req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        console.log(`❌ 404 API: ${req.method} ${req.url}`);
        res.status(404).json({ 
            error: "Route API non trouvée",
            path: req.url,
            method: req.method,
            availableRoutes: [
                '/api/auth', '/api/companies', '/api/accounting',
                '/api/user', '/api/settings', '/api/admin',
                '/api/notifications', '/api/ocr', '/api/reports'
            ]
        });
    }
});

// =============================================================================
// GESTIONNAIRE D'ERREURS GLOBAL
// =============================================================================
app.use((err, req, res, next) => {
    console.error('🚨 Erreur serveur:', err.message);
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erreur serveur interne',
        message: err.message
    });
});

// =============================================================================
// DÉMARRAGE DU SERVEUR
// =============================================================================
app.listen(PORT, async () => {
    console.log("=".repeat(60));
    console.log("🚀 DOUKÈ COMPTA PRO - SERVEUR DÉMARRÉ");
    console.log("=".repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    // Initialiser les tables après démarrage
    await initDB();
});
```

Après redéploiement tu verras dans les logs :
```
✅ Tables financial_reports initialisées avec succès
