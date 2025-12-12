// =================================================================================
// FICHIER DE MOCK SERVER (Node.js / Express)
// Simule l'API backend pour l'application K-Compta SYSCOHADA.
// VERSION FINALE PRODUCTION (RENDER Optimized avec FIX JWT/CORS)
// =================================================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// Utilisation de process.env.PORT pour Render
const PORT = process.env.PORT || 3000;

// =================================================================================
// 1. CONFIGURATION DES MIDDLEWARES ET CORRECTION CORS CRITIQUE
// =================================================================================

// URL du Web Service sur Render (utilisée comme Frontend)
const FRONTEND_URL = 'https://douke-compta-pro.onrender.com';

const corsOptions = {
    // Autoriser l'origine de notre frontend, ainsi que les environnements de dev
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:10000', /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/],
    
    // CRITIQUE : Permet l'envoi de l'en-tête Authorization (pour le jeton JWT)
    credentials: true, 
    
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // Autoriser l'en-tête Authorization
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Application de la configuration CORS robuste
app.use(cors(corsOptions)); 
app.use(bodyParser.json()); // Pour analyser les corps de requêtes JSON


// =================================================================================
// 2. DONNÉES DE MOCK (Cohérentes avec script.js)
// =================================================================================

const MOCK_USERS = {
    'admin@app.com': {
        utilisateurId: 'ADM_001',
        utilisateurNom: 'Jean Dupont (Admin)',
        utilisateurRole: 'ADMIN',
        token: 'jwt.admin.token',
        entrepriseContextId: 'ENT_1',
        entrepriseContextName: 'Doukè Holdings',
        multiEntreprise: true,
    },
    'collaborateur@app.com': {
        utilisateurId: 'COL_002',
        utilisateurNom: 'Marie Leroy (Collab)',
        utilisateurRole: 'COLLABORATEUR',
        token: 'jwt.collab.token',
        entrepriseContextId: 'ENT_2',
        entrepriseContextName: 'MonEntrepriseSarl',
        multiEntreprise: true,
    },
    'user@app.com': {
        utilisateurId: 'USR_003',
        utilisateurNom: 'Koffi Adama (User)',
        utilisateurRole: 'USER',
        token: 'jwt.user.token',
        entrepriseContextId: 'ENT_2',
        entrepriseContextName: 'MonEntrepriseSarl',
        multiEntreprise: false,
    },
    'caissier@app.com': {
        utilisateurId: 'CAI_004',
        utilisateurNom: 'Fatou Diallo (Caissier)',
        utilisateurRole: 'CAISSIER',
        token: 'jwt.caissier.token',
        entrepriseContextId: 'ENT_3',
        entrepriseContextName: 'CaisseTest',
        multiEntreprise: false,
    },
};

const MOCK_COMPANIES = {
    'ADM_001': [
        { id: 'ENT_1', name: 'Doukè Holdings', stats: { transactions: 150, result: 3500000, pending: 1, cash: 2500000 } },
        { id: 'ENT_2', name: 'MonEntrepriseSarl', stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 } },
        { id: 'ENT_3', name: 'CaisseTest', stats: { transactions: 20, result: 50000, pending: 0, cash: 100000 } },
    ],
    'COL_002': [
        { id: 'ENT_1', name: 'Doukè Holdings', stats: { transactions: 150, result: 3500000, pending: 1, cash: 2500000 } },
        { id: 'ENT_2', name: 'MonEntrepriseSarl', stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 } },
    ],
    'USR_003': [
        { id: 'ENT_2', name: 'MonEntrepriseSarl', stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 } },
    ],
    'CAI_004': [
        { id: 'ENT_3', name: 'CaisseTest', stats: { transactions: 20, result: 50000, pending: 0, cash: 100000 } },
    ],
};

// =================================================================================
// 3. MIDDLEWARE D'AUTHENTIFICATION (Simulée)
// =================================================================================

/**
 * Middleware de vérification du Token (Mockée)
 * Vérifie la présence de l'en-tête Authorization que le Frontend envoie après connexion.
 */
const checkAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[API MOCK] Tentative d'accès non autorisé à ${req.url}. Jeton manquant.`);
        return res.status(401).json({ error: 'Accès non autorisé. Jeton manquant ou invalide.' });
    }
    // Si le jeton est présent, on simule le succès de la vérification JWT
    next();
};

/**
 * Middleware d'Autorisation pour la saisie (Simulé - basé sur l'ID dans le body, pas le JWT)
 */
const authorize = (req, res, next) => {
    const userId = req.body.utilisateurId; 
    if (!userId || !Object.values(MOCK_USERS).find(u => u.utilisateurId === userId)) {
        return res.status(403).json({ error: 'Accès non autorisé ou utilisateur inconnu.' });
    }
    next();
};


// =================================================================================
// 4. ENDPOINTS D'AUTHENTIFICATION ET DE CONTEXTE
// =================================================================================

/**
 * POST /api/auth/login
 * Simule le processus de connexion.
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const user = MOCK_USERS[email];
    if (user && password === 'password123') { 
        console.log(`[API MOCK] Connexion réussie pour ${email}.`);
        return res.status(200).json(user);
    } else {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
});

/**
 * GET /api/companies/:userId
 * Retourne la liste des entreprises accessibles par l'utilisateur.
 * Utilise checkAuth pour s'assurer que le jeton a été envoyé par le Frontend.
 */
app.get('/api/companies/:userId', checkAuth, (req, res) => { // <-- checkAuth APPLIQUÉ
    const userId = req.params.userId;
    console.log(`[API MOCK] Requête /api/companies/${userId} reçue avec autorisation.`);
    const companies = MOCK_COMPANIES[userId];
    
    if (companies) {
        // Retourne les données immédiatement pour débloquer le chargement
        return res.status(200).json(companies);
    } else {
        return res.status(404).json({ error: 'Aucune entreprise trouvée pour cet utilisateur.' });
    }
});

// =================================================================================
// 5. ENDPOINTS DE SAISIE COMPTABLE (COHÉRENCE FRONT-END)
// =================================================================================

/**
 * POST /api/saisie/flux
 */
app.post('/api/saisie/flux', authorize, (req, res) => {
    const { entrepriseId, compteMouvement, date, flux, utilisateurId } = req.body;
    if (!entrepriseId || !flux || flux.length === 0) {
        return res.status(400).json({ error: 'Données de flux incomplètes.' });
    }
    console.log(`\n--- SAISIE FLUX REÇUE ---`);
    console.log(`Entreprise: ${entrepriseId}, Compte Mvt: ${compteMouvement}, Date: ${date}, Soumis par: ${utilisateurId}`);
    // ... (Logique d'imputation SYSCOHADA simulée conservée)
    let totalMouvement = 0;
    const journalEntries = [];
    flux.forEach(f => {
        totalMouvement += f.montant;
        // ... (Autres calculs mockés)
        journalEntries.push({ /* ... */ });
        journalEntries.push({ /* ... */ });
    });
    console.log(`Total des flux: ${totalMouvement}. Opération(s) soumise(s) pour validation.`);
    return res.status(202).json({ 
        message: `${flux.length} flux soumis pour validation. Total: ${totalMouvement} XOF.`,
        operationId: 'FLUX-20250101-005',
        details: journalEntries.slice(0, 2) 
    });
});

/**
 * POST /api/saisie/journal
 */
app.post('/api/saisie/journal', authorize, (req, res) => {
    const { journal, date, pieceRef, libelleGeneral, lignes, utilisateurId } = req.body;
    if (!journal || !date || !lignes || lignes.length < 2) {
        return res.status(400).json({ error: 'Écriture journal incomplète ou manque de lignes.' });
    }
    const totalDebit = lignes.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lignes.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.error(`Déséquilibre détecté: Débit=${totalDebit}, Crédit=${totalCredit}`);
        return res.status(400).json({ error: `Déséquilibre comptable. Débit (${totalDebit.toFixed(2)}) ≠ Crédit (${totalCredit.toFixed(2)}). Rejet de l'écriture.` });
    }
    console.log(`\n--- SAISIE JOURNAL REÇUE ---`);
    console.log(`Journal: ${journal}, Pièce: ${pieceRef}, Libellé: ${libelleGeneral}`);
    console.log(`Équilibrée: ${totalDebit.toFixed(2)} XOF.`);
    console.log(`Soumise par: ${utilisateurId}.`);
    return res.status(202).json({ 
        message: `Écriture Journal ${journal} soumise avec succès pour validation.`,
        operationId: `${journal}-${new Date().getFullYear()}-007`,
        total: totalDebit.toFixed(2)
    });
});

// =================================================================================
// 6. SERVEUR DE FICHIERS STATIQUES (pour servir le frontend)
// =================================================================================

// Servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(__dirname));

// Servir index.html à la racine
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`  K-Compta Mock Server démarré.`);
    console.log(`  Accès frontend via: http://localhost:${PORT}/index.html`);
    console.log(`  API Mock à: http://localhost:${PORT}/api/*`);
    console.log(`=================================================\n`);
    console.log(`Endpoints actifs: /api/auth/login, /api/companies/:userId, /api/saisie/flux, /api/saisie/journal`);
});
