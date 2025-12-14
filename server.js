// =================================================================================
// FICHIER : server.js (VERSION FINALE - PROFESSIONNELLE)
// Description : Point d'entrée de l'API Node.js/Express.
// Intègre : Connexion PostgreSQL (via Render/Prisma), Sécurité JWT, et Routage Modulaire.
// =================================================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge le fichier .env (pour JWT_SECRET et FRONTEND_URL)

// Import des Routes Modulaires
const authRoutes = require('./routes/auth');       // Gestion du Login/Register
const companyRoutes = require('./routes/company'); // Gestion du Contexte Multi-entreprise
// const entryRoutes = require('./routes/entry');   // <-- À CRÉER (Saisie comptable)

// ---------------------------------------------------------------------------------
// 1. INITIALISATION DE L'APPLICATION
// ---------------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------------
// 2. MIDDLEWARES ET CONFIGURATION DE SÉCURITÉ CORS (Adapté de votre MOCK)
// ---------------------------------------------------------------------------------

// Utilisation de la variable d'environnement (ou fallback local)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const corsOptions = {
    // Autoriser les origines de dev et l'URL de production Render
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:10000', /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/],
    credentials: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // CRITIQUE : Autoriser l'en-tête Authorization
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
// 3. MONTAGE DES ROUTES MODULAIRES (Remplacement des ENDPOINTS MOCK)
// ---------------------------------------------------------------------------------

// A. Routes Publiques (Authentification) : Remplacement de app.post('/api/auth/login', ...)
app.use('/api/auth', authRoutes); 


// B. Routes d'Entreprise : Remplacement de app.get('/api/companies/:userId', checkAuth, ...)
// Le :userId n'est plus nécessaire car l'ID est extrait du jeton JWT dans le middleware.
app.use('/api/companies', companyRoutes);


// C. Routes de Saisie Comptable (Simulées dans la version MOCK - Nécessitent le middleware protect)
// Nous allons adapter les anciens endpoints ici pour la compatibilité front-end, en utilisant un MOCK sécurisé.

const { protect } = require('./middleware/auth'); // Nécessaire pour les futures routes sécurisées

// POST /api/saisie/flux : Remplacement du MOCK, maintenant sécurisé par JWT
app.post('/api/saisie/flux', protect, (req, res) => {
    // L'ancienne logique de MOCK (déséquilibre, calcul) sera implémentée dans controllers/entryController.js
    // Pour l'instant, c'est un MOCK SÉCURISÉ pour la compatibilité.
    const { entrepriseId, compteMouvement, date, flux } = req.body;
    
    // Vérification minimale
    if (!entrepriseId || !flux || flux.length === 0) {
         return res.status(400).json({ error: 'Données de flux incomplètes.' });
    }

    // Affichage de l'utilisateur réel qui soumet l'entrée
    console.log(`\n--- SAISIE FLUX REÇUE (Sécurisée) ---`);
    console.log(`Entreprise: ${entrepriseId}, Soumis par: ${req.user.utilisateurNom}`); 

    // Simulation de succès (comme le MOCK original)
    return res.status(202).json({ 
        message: `${flux.length} flux soumis pour validation. (MOCK Sécurisé)`,
        operationId: 'FLUX-PROD-005',
    });
});

// POST /api/saisie/journal : Remplacement du MOCK, maintenant sécurisé par JWT
app.post('/api/saisie/journal', protect, (req, res) => {
    const { journal, date, lignes } = req.body;
    
    // La vérification Débit=Crédit devra être faite dans le contrôleur réel
    const totalDebit = lignes.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lignes.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
         return res.status(400).json({ error: `Déséquilibre comptable. Rejet de l'écriture (MOCK).` });
    }

    console.log(`\n--- SAISIE JOURNAL REÇUE (Sécurisée) ---`);
    console.log(`Journal: ${journal}, Équilibrée: ${totalDebit.toFixed(2)} XOF. Soumis par: ${req.user.utilisateurNom}`);
    
    // Simulation de succès
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


app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  K-Compta Server PRO (PostgreSQL) démarré sur le port ${PORT}.`);
    console.log(`  API BASE: http://localhost:${PORT}/api/`);
    console.log(`=================================================\n`);
    console.log(`ROUTES ACTIVES : /api/auth/* et /api/companies/*`);
    console.log(`DB : PostgreSQL via Render (Prisma)`);
});
