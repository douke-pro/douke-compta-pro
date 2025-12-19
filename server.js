// =================================================================================
// FICHIER : server.js (VERSION FINALE - PROFESSIONNELLE)
// =================================================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge le fichier .env (pour JWT_SECRET et FRONTEND_URL)

// Import de Prisma Client pour le test de connexion
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import des Routes Modulaires
const authRoutes = require('./routes/auth');      // Gestion du Login/Register
const companyRoutes = require('./routes/company'); // Gestion du Contexte Multi-entreprise

// ---------------------------------------------------------------------------------
// 1. INITIALISATION DE L'APPLICATION
// ---------------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------------
// AJOUT CRITIQUE POUR LE DIAGNOSTIC DB
// ---------------------------------------------------------------------------------

// Fonction asynchrone pour tester la connexion DB au démarrage
async function connectToDatabase() {
    try {
        await prisma.$connect();
        console.log("✅ Connexion à PostgreSQL via Prisma réussie !");
        // NOTE: Nous laissons la connexion ouverte pour que les requêtes suivantes puissent l'utiliser
        // Si vous utilisez le client Prisma dans vos contrôleurs, vous pouvez garder cette instance
    } catch (error) {
        console.error("❌ ÉCHEC de connexion à PostgreSQL. Détails:", error.message);
        // Quitter le processus pour forcer l'affichage de l'erreur sur Render
        process.exit(1); 
    }
}

// ---------------------------------------------------------------------------------
// 2. MIDDLEWARES ET CONFIGURATION DE SÉCURITÉ CORS
// ---------------------------------------------------------------------------------

// Utilisation de la variable d'environnement (ou fallback local)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const corsOptions = {
    // Autoriser les origines de dev et l'URL de production Render
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:10000', /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/],
    credentials: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); 
app.use(bodyParser.json()); 

// Log de base pour le débogage (optionnel, mais pratique)
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ---------------------------------------------------------------------------------
// 3. MONTAGE DES ROUTES MODULAIRES
// ---------------------------------------------------------------------------------

app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);

const { protect } = require('./middleware/auth'); // Nécessaire pour les futures routes sécurisées

// POST /api/saisie/flux : MOCK SÉCURISÉ
app.post('/api/saisie/flux', protect, (req, res) => {
    const { entrepriseId, compteMouvement, date, flux } = req.body;
    
    if (!entrepriseId || !flux || flux.length === 0) {
          return res.status(400).json({ error: 'Données de flux incomplètes.' });
    }

    console.log(`\n--- SAISIE FLUX REÇUE (Sécurisée) ---`);
    console.log(`Entreprise: ${entrepriseId}, Soumis par: ${req.user.utilisateurNom}`); 

    return res.status(202).json({ 
        message: `${flux.length} flux soumis pour validation. (MOCK Sécurisé)`,
        operationId: 'FLUX-PROD-005',
    });
});

// POST /api/saisie/journal : MOCK SÉCURISÉ
app.post('/api/saisie/journal', protect, (req, res) => {
    const { journal, date, lignes } = req.body;
    
    const totalDebit = lignes.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lignes.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return res.status(400).json({ error: `Déséquilibre comptable. Rejet de l'écriture (MOCK).` });
    }

    console.log(`\n--- SAISIE JOURNAL REÇUE (Sécurisée) ---`);
    console.log(`Journal: ${journal}, Équilibrée: ${totalDebit.toFixed(2)} XOF. Soumis par: ${req.user.utilisateurNom}`);
    
    return res.status(202).json({ 
        message: `Écriture Journal ${journal} soumise avec succès. (MOCK Sécurisé)`,
        operationId: `${journal}-PROD-007`,
    });
});


// ---------------------------------------------------------------------------------
// 4. SERVEUR DE FICHIERS STATIQUES ET DÉMARRAGE
// ---------------------------------------------------------------------------------

// Servir les fichiers statiques (pour le frontend - Assurez-vous que index.html est à la racine ou dans 'public')
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Gestionnaire d'erreurs 404
app.use((req, res, next) => {
    res.status(404).json({ error: `La route ${req.url} n'a pas été trouvée.` });
});


// Démarrage du serveur APRÈS le test de connexion
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`  K-Compta Server PRO (PostgreSQL) démarré sur le port ${PORT}.`);
        console.log(`  API BASE: http://localhost:${PORT}/api/`);
        console.log(`=================================================\n`);
        console.log(`ROUTES ACTIVES : /api/auth/* et /api/companies/*`);
        console.log(`DB : PostgreSQL via Render (Prisma)`);
    });
});
// Last Update: Odoo Connection Only
