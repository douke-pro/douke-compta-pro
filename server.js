// =================================================================================
// FICHIER : server.js (VERSION PROFESSIONNELLE COMPILÉE)
// Description : Point d'entrée de l'API Node.js/Express.
// Intègre : Connexion DB, Middleware de Sécurité, et Routage Modulaire.
// =================================================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Charge le fichier .env

// Import des composants modulaires
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth');
const { protect, restrictTo } = require('./middleware/auth'); // Middleware de sécurité
// const companyRoutes = require('./routes/company'); // <-- À CRÉER EN PHASE 2
// const entryRoutes = require('./routes/entry'); // <-- À CRÉER EN PHASE 2

// 1. Initialisation de la Base de Données
connectDB(); 

const app = express();
const PORT = process.env.PORT || 3000;

// =================================================================================
// 2. MIDDLEWARES ET CONFIGURATION DE SÉCURITÉ CORS
// =================================================================================

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const corsOptions = {
    // Autoriser l'origine de notre frontend et les environnements de dev
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:10000', /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/],
    credentials: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); 
app.use(bodyParser.json()); // Pour analyser les corps de requêtes JSON

// Log de base pour voir les requêtes
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// =================================================================================
// 3. MONTAGE DES ROUTES MODULAIRES
// =================================================================================

// Routes Publiques (Authentification)
app.use('/api/auth', authRoutes); 

// Exemple de route sécurisée (devra être implémentée dans entryRoutes)
// Ceci remplace l'ancien MOCK '/api/entries/:companyId'
app.get('/api/entries/:companyId', protect, (req, res) => {
    // Dans une version finale, on appellerait le 'entryController.getEntries' ici.
    // Pour l'instant, c'est un MOCK qui doit être derrière la protection JWT.
    console.log(`[MOCK SÉCURISÉ] Accès aux écritures de ${req.params.companyId} par ${req.user.utilisateurNom}`);
    
    // Vérification d'autorisation (simulée)
    if (!req.user.entreprisesAccessibles.includes(req.params.companyId)) {
         return res.status(403).json({ error: 'Accès refusé. Contexte entreprise non autorisé.' });
    }
    
    // Réponse MOCK pour le front-end
    const mockEntries = [{ date: '2024-12-01', montant: 100000, libelle: 'Saisie sécurisée' }];
    res.json(mockEntries);
});


// =================================================================================
// 4. SERVEUR ET DÉMARRAGE
// =================================================================================

// Servir les fichiers statiques (pour le frontend)
// Assurez-vous que tous vos fichiers frontend sont dans un dossier 'public'
app.use(express.static(__dirname + '/public')); 

// Route de base (pour le déploiement sur Render ou Vercel)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Gestionnaire d'erreurs 404
app.use((req, res, next) => {
    res.status(404).json({ error: `La route ${req.url} n'a pas été trouvée.` });
});


app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  K-Compta Server démarré sur le port ${PORT}.`);
    console.log(`  API BASE: http://localhost:${PORT}/api/`);
    console.log(`=================================================\n`);
});
