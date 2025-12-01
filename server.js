// ==============================================================================
// FICHIER : server.js
// Description : API Back-end Express pour héberger le Moteur de Calcul SYSCOHADA
// et gérer la sécurité, les rôles et l'accès multi-entreprise.
// Déploiement cible : RENDER ou autre PaaS Node.js
// ==============================================================================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Gère les requêtes Cross-Origin (Front-end)
const jwt = require('jsonwebtoken'); // Utilisation standard pour la sécurité
const { genererEtatsFinanciers } = require('./src/exports/syscohadaExports'); // Import de votre Moteur de Calcul
const { DATA_COMPTABLE_MOCK, CONFIG_TEST } = require('./testData'); // Import des données mock pour le test

const app = express();

// --- CONFIGURATION DE BASE ---
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'VOTRE_CLE_SECRETE_TRES_COMPLEXE'; // CLÉ SECRÈTE (Doit être dans les variables d'environnement de Render !)
// SIMULATION DE LA BASE DE DONNÉES D'ATTRIBUTION
const DB_ATTRIBUTION_MOCK = {
    "ENT_PROD_1": { collaborateurId: "COLLAB_A" },
    "ENT_PROD_2": { collaborateurId: "COLLAB_B" },
    "ENT_USER_3": { collaborateurId: "COLLAB_A", userId: "USER_C" }
};
const COLLABORATEUR_ATTRIBUES = {
    "COLLAB_A": ["ENT_PROD_1", "ENT_USER_3"], // Liste des entreprises gérées par ce collaborateur
};
// -----------------------------

// --- MIDDLEWARES STANDARDS ---
app.use(cors());
app.use(bodyParser.json());

// ==============================================================================
// MIDDLEWARE DE SÉCURITÉ ET HIÉRARCHIE (Le Cœur de la Sécurité)
// S'assure que l'utilisateur est bien autorisé à agir sur l'entreprise demandée.
// ==============================================================================
const verifierAutorisation = (req, res, next) => {
    // Le token viendrait de l'en-tête 'Authorization: Bearer [token]'
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send({ error: "Authentification requise. Token manquant." });
    }
    
    try {
        // --- 1. VÉRIFICATION DU TOKEN ET DE L'IDENTITÉ ---
        // SIMULATION : Le token est décodé pour obtenir l'identité et les rôles.
        // En réalité : jwt.verify(token, SECRET_KEY)
        const tokenPayload = req.body.tokenPayload || { 
            utilisateurId: "SIMULE_ID", 
            utilisateurRole: "ADMIN", // Rôle par défaut pour le test
            entrepriseContextId: req.body.entrepriseId || "ENT_PROD_1" // L'entreprise sur laquelle l'action est demandée
        };
        
        const { utilisateurRole, entrepriseContextId } = tokenPayload;
        req.userData = tokenPayload;
        
        // --- 2. VÉRIFICATION DE LA HIÉRARCHIE ET DE LA PORTÉE ---
        
        if (utilisateurRole === 'ADMIN') {
            // ADMIN : A un contrôle total, pas besoin de vérifier l'attribution.
            return next(); 
        }
        
        if (utilisateurRole === 'COLLABORATEUR') {
            // COLLABORATEUR : Doit vérifier si l'entreprise est dans sa liste d'attribution
            const listeAttribution = COLLABORATEUR_ATTRIBUES[tokenPayload.utilisateurId];
            if (!listeAttribution || !listeAttribution.includes(entrepriseContextId)) {
                return res.status(403).send({ error: "Accès refusé. Cette entreprise ne vous est pas attribuée." });
            }
            return next();
        }
        
        if (utilisateurRole === 'USER' || utilisateurRole === 'CAISSIER') {
            // USER/CAISSIER : Ne peut agir que sur sa propre entreprise.
            if (entrepriseContextId !== DB_ATTRIBUTION_MOCK[entrepriseContextId]?.userId) { // Logique simplifiée
                return res.status(403).send({ error: "Accès refusé. Action limitée à votre unique entreprise." });
            }
            return next();
        }

        // Rôle inconnu ou non géré
        return res.status(403).send({ error: "Rôle utilisateur non autorisé." });

    } catch (err) {
        return res.status(401).send({ error: "Token JWT non valide ou expiré." });
    }
};

// ==============================================================================
// ROUTES (ENDPOINTS) DE L'API
// ==============================================================================

// 1. ROUTE SÉCURISÉE POUR LE CALCUL DES ÉTATS FINANCIERS (Admin/Collaborateur)
app.post('/api/calcul/syscohada', verifierAutorisation, (req, res) => {
    const { systeme, exercice } = req.body;
    
    // Pour la démo, on utilise les données Mock, en production on chargerait la dataComptable de la DB
    const dataComptable = DATA_COMPTABLE_MOCK; 
    
    // 1. Contrôle d'accès final sur l'action (Exemple : Seul l'Admin peut faire un calcul Normal)
    if (req.userData.utilisateurRole !== 'ADMIN' && systeme === 'NORMAL') {
        // Logique métier : Un collaborateur ne peut être autorisé que pour le Minimal.
        // Ceci est un exemple de logique de hiérarchie appliquée ici.
        // return res.status(403).send({ error: "Seul l'Admin peut déclencher le système Normal." });
    }

    try {
        const config = {
            entrepriseId: req.userData.entrepriseContextId,
            systeme: systeme,
            exercice: exercice,
            utilisateurRole: req.userData.utilisateurRole,
        };
        
        // Appel au Moteur de Calcul JS
        const resultats = genererEtatsFinanciers(dataComptable, config);
        
        return res.json({ success: true, results: resultats });

    } catch (error) {
        console.error(`[ERR_CALCUL] Entreprise ${req.userData.entrepriseContextId}:`, error.message);
        return res.status(400).send({ error: "Échec du calcul: " + error.message });
    }
});

// 2. ROUTE DU WORKFLOW DE DEMANDE D'ÉTATS FINANCIERS (User)
app.post('/api/workflow/demandeEtat', verifierAutorisation, (req, res) => {
    if (req.userData.utilisateurRole !== 'USER') {
        return res.status(403).send({ error: "Seuls les utilisateurs (USER) peuvent déclencher un workflow de demande." });
    }
    
    const { periodicite } = req.body;
    
    // SIMULATION : Envoi de la notification
    console.log(`[WORKFLOW] Demande d'états financiers pour l'entreprise ${req.userData.entrepriseContextId} (Périodicité: ${periodicite})`);

    // Ici, vous auriez le code pour :
    // - Enregistrer la demande dans la DB (statut: en attente)
    // - Envoyer un email ou une notification à l'Admin et au Collaborateur en charge.
    
    return res.json({ success: true, message: "Demande d'états financiers enregistrée et notifiée au collaborateur en charge." });
});


// 3. ROUTE DE SÉCURITÉ / GESTION DE CAISSE (Caissier - en attente de validation)
app.post('/api/caisse/enregistrerOperation', verifierAutorisation, (req, res) => {
    if (req.userData.utilisateurRole !== 'CAISSIER') {
         return res.status(403).send({ error: "Seuls les caissiers peuvent effectuer des enregistrements de caisse bruts." });
    }
    
    // Enregistrement dans la DB
    const operation = { ...req.body, statut: "EN_ATTENTE_VALIDATION", caissierId: req.userData.utilisateurId };
    console.log(`[DB] Nouvelle opération de caisse enregistrée:`, operation);
    
    return res.json({ success: true, message: "Opération enregistrée. En attente de validation par un Collaborateur ou Admin." });
});


// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, () => console.log(`[API] Serveur Express/Node.js démarré sur le port ${PORT}`));
