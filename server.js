// =============================================================================
// FICHIER : server.js (VERSION V18 - CORRIGÉE)
// Description : Serveur Express avec toutes les routes montées AVANT le fallback
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

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARES
// =============================================================================
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// MONTAGE DES ROUTES API (ORDRE CRITIQUE)
// Toutes les routes DOIVENT être montées AVANT le middleware de fallback
// =============================================================================

console.log('🔵 Montage des routes API...');

// Routes publiques
app.use('/api/auth', authRoutes);
console.log('✅ Route /api/auth montée');

// Routes protégées
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

console.log('✅ Toutes les routes montées avec succès');

// =============================================================================
// ROUTE DE SANTÉ (OPTIONNEL - POUR DÉBOGAGE)
// =============================================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        routes: [
            'auth', 
            'companies',
            'accounting', 
            'user', 
            'settings', 
            'admin',
            'notifications',
            'ocr'
        ]
    });
});

// =============================================================================
// MIDDLEWARE DE FALLBACK (DOIT ÊTRE EN DERNIER)
// Gère les routes non trouvées et le SPA fallback
// =============================================================================
app.use((req, res) => {
    if (!req.url.startsWith('/api')) {
        // Routes front-end : retourner index.html (SPA)
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // Routes API non trouvées : retourner 404
        console.log(`❌ 404 API: ${req.method} ${req.url}`);
        res.status(404).json({ 
            error: "Route API non trouvée",
            path: req.url,
            method: req.method,
            availableRoutes: [
                '/api/auth',
                '/api/companies',
                '/api/accounting',
                '/api/user',
                '/api/settings',
                '/api/admin',
                '/api/notifications',
                '/api/ocr'
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
app.listen(PORT, () => {
    console.log("=".repeat(60));
    console.log("🚀 DOUKÈ COMPTA PRO - SERVEUR DÉMARRÉ");
    console.log("=".repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log("=".repeat(60));
});
