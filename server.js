// =============================================================================
// FICHIER : server.js (VERSION CORRIGÉE ET COMPLÉTÉE)
// =============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Imports des routes (Vérifiez que ces fichiers existent bien dans /routes)
const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 
const accountingRoutes = require('./routes/accounting'); // ⬅️ NOUVEL IMPORT (Rapports SYSCOHADA)
const userRoutes = require('./routes/user');        // ⬅️ NOUVEL IMPORT (Session Data/Tableau de Bord)


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// 1. Servir les fichiers statiques en priorité
app.use(express.static(path.join(__dirname, 'public')));

// 2. Routes API (Le montage de toutes les routes)
app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);
app.use('/api/accounting', accountingRoutes); // ⬅️ MONTAGE DES ROUTES COMPTABLES (Fichier 5/6)
app.use('/api/user', userRoutes);            // ⬅️ MONTAGE DES NOUVELLES ROUTES UTILISATEUR/SESSION


// 3. LE FIX RADICAL : Middleware de secours au lieu d'une route '*'
// Le reste de la logique est conservé
app.use((req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // Retourne un message 404 plus informatif pour les routes API non trouvées
        res.status(404).json({ error: "Route API non trouvée. Veuillez vérifier les endpoints montés (auth, companies, accounting, user)." });
    }
});

app.listen(PORT, () => {
    console.log("=================================================");
    console.log("🚀 DOUKÈ SYSTEM ONLINE - MODE COMPATIBILITÉ V5");
    console.log("=================================================");
});
