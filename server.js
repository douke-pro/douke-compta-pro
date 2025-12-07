// =================================================================================
// FICHIER DE MOCK SERVER (Node.js / Express)
// Simule l'API backend pour l'application K-Compta SYSCOHADA.
//
// Pour démarrer:
// 1. Assurez-vous d'avoir Node.js installé.
// 2. Initialisez votre projet: npm init -y
// 3. Installez les dépendances: npm install express cors body-parser
// 4. Exécutez: node server.js
// =================================================================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Configuration des Middlewares
app.use(cors()); // Permet les requêtes depuis le frontend (port 80 ou fichier)
app.use(bodyParser.json()); // Pour analyser les corps de requêtes JSON

// =================================================================================
// 1. DONNÉES DE MOCK (Cohérentes avec script.js)
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
// 2. ENDPOINTS D'AUTHENTIFICATION ET DE CONTEXTE
// =================================================================================

/**
 * POST /api/auth/login
 * Simule le processus de connexion.
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Validation basique (simulée)
    if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    
    // Vérification de l'utilisateur mocké
    const user = MOCK_USERS[email];
    
    if (user && password === 'password123') { // On vérifie le mot de passe simple mocké
        // Retourne le contexte utilisateur pour initialiser le frontend
        return res.status(200).json(user);
    } else {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
});

/**
 * GET /api/companies/:userId
 * Retourne la liste des entreprises accessibles par l'utilisateur.
 */
app.get('/api/companies/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const companies = MOCK_COMPANIES[userId];
    
    if (companies) {
        return res.status(200).json(companies);
    } else {
        return res.status(404).json({ error: 'Aucune entreprise trouvée pour cet utilisateur.' });
    }
});

// =================================================================================
// 3. ENDPOINTS DE SAISIE COMPTABLE (COHÉRENCE FRONT-END)
// =================================================================================

/**
 * Middleware d'Autorisation (Simulé)
 * Vérifie l'existence de l'utilisateur (base sur l'ID dans le body pour ce mock)
 */
const authorize = (req, res, next) => {
    const userId = req.body.utilisateurId;
    if (!userId || !Object.values(MOCK_USERS).find(u => u.utilisateurId === userId)) {
        return res.status(403).json({ error: 'Accès non autorisé ou utilisateur inconnu.' });
    }
    next();
};

/**
 * POST /api/saisie/flux
 * Traite les saisies simplifiées du caissier/utilisateur (Formulaire Caissier).
 */
app.post('/api/saisie/flux', authorize, (req, res) => {
    const { entrepriseId, compteMouvement, date, flux, utilisateurId } = req.body;

    if (!entrepriseId || !flux || flux.length === 0) {
        return res.status(400).json({ error: 'Données de flux incomplètes.' });
    }

    console.log(`\n--- SAISIE FLUX REÇUE ---`);
    console.log(`Entreprise: ${entrepriseId}, Compte Mvt: ${compteMouvement}, Date: ${date}, Soumis par: ${utilisateurId}`);
    
    // Logique d'imputation SYSCOHADA simulée (la plus importante)
    let totalMouvement = 0;
    const journalEntries = [];

    flux.forEach(f => {
        totalMouvement += f.montant;
        let debitAccount = '';
        let creditAccount = '';
        let libelle = `${f.designation_code} - ${f.tiers || 'Divers'}`;

        // MOCK: Détermination de la contrepartie (Classe 6 ou 7)
        if (f.type === 'depense') {
            // Dépense: Compte de Charge (ex: 60x) au Débit, Compte de Trésorerie (571/521) au Crédit
            debitAccount = '609'; // Exemple générique de Compte de Charge
            creditAccount = compteMouvement;
        } else if (f.type === 'recette') {
            // Recette: Compte de Trésorerie (571/521) au Débit, Compte de Produit (ex: 70x) au Crédit
            debitAccount = compteMouvement;
            creditAccount = '709'; // Exemple générique de Compte de Produit
        }

        journalEntries.push({
            debit: f.type === 'recette' ? f.montant : 0,
            credit: f.type === 'depense' ? f.montant : 0,
            compte: compteMouvement,
            libelle: `MVT ${f.type.toUpperCase()}`
        });
        
        journalEntries.push({
            debit: f.type === 'depense' ? f.montant : 0,
            credit: f.type === 'recette' ? f.montant : 0,
            compte: f.type === 'depense' ? debitAccount : creditAccount,
            libelle: libelle
        });
    });

    console.log(`Total des flux: ${totalMouvement}. Opération(s) soumise(s) pour validation.`);
    // Enregistrement en base de données (non implémenté)

    return res.status(202).json({ 
        message: `${flux.length} flux soumis pour validation. Total: ${totalMouvement} XOF.`,
        operationId: 'FLUX-20250101-005',
        details: journalEntries.slice(0, 2) // Afficher un exemple
    });
});

/**
 * POST /api/saisie/journal
 * Traite les saisies professionnelles à double-entrée (Formulaire Journal Entry).
 */
app.post('/api/saisie/journal', authorize, (req, res) => {
    const { journal, date, pieceRef, libelleGeneral, lignes, utilisateurId } = req.body;

    if (!journal || !date || !lignes || lignes.length < 2) {
        return res.status(400).json({ error: 'Écriture journal incomplète ou manque de lignes.' });
    }

    // 1. Vérification d'équilibre côté serveur (Critique pour le SYSCOHADA)
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

    // Enregistrement en base de données (non implémenté)
    
    return res.status(202).json({ 
        message: `Écriture Journal ${journal} soumise avec succès pour validation.`,
        operationId: `${journal}-${new Date().getFullYear()}-007`,
        total: totalDebit.toFixed(2)
    });
});

// =================================================================================
// 4. SERVEUR DE FICHIERS STATIQUES (pour servir le frontend)
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
