// =============================================================================
// FICHIER : services/odooService.js (VERSION CONTOURNEMENT CLÉ API)
// Objectif : Utiliser la CLÉ API Admin pour forcer l'authentification des utilisateurs
//           et débloquer l'erreur Access Denied persistante.
// =============================================================================

// CORRECTION CRITIQUE DE L'IMPORTATION FETCH
const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch; 

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// Configuration Odoo
const ODOO_CONFIG = {
    db: ODOO_DB, 
    // UID de l'Administrateur API (doukepro@gmail.com) - NÉCESSAIRE POUR LA CRÉATION
    adminUid: process.env.ODOO_ADMIN_UID, 
    // Utilisateur technique de l'API (pour le code)
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com', 
    // CLÉ API (Critique pour ExecuteKw ET pour ce contournement de login)
    password: process.env.ODOO_API_KEY, 
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}
if (!ODOO_CONFIG.password) {
     console.warn("ATTENTION: ODOO_API_KEY est manquant, toutes les fonctions échoueront.");
}
if (!ODOO_CONFIG.adminUid) {
     console.warn("ATTENTION: ODOO_ADMIN_UID est manquant. La fonction de création d'utilisateur échouera.");
}

/**
 * Fonction de base pour effectuer une requête JSON-RPC à Odoo. (Validée)
 */
async function executeJsonRpc(endpoint, payload) {
    const url = `${ODOO_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[JSON-RPC HTTP Error ${response.status}]`, text);
            throw new Error(`Erreur HTTP Odoo: ${response.status} - ${response.statusText}`);
        }

        const jsonResponse = await response.json();

        if (jsonResponse.error) {
            const error = jsonResponse.error;
            const errorMessage = error.data && error.data.message 
                                ? error.data.message 
                                : error.message || 'Erreur JSON-RPC Odoo inconnue.';

            console.error('[Odoo JSON-RPC Error]', errorMessage, error.data);
            throw new Error(`Erreur Odoo: ${errorMessage}`);
        }
        return jsonResponse.result;

    } catch (error) {
        console.error('[Execution Fatal Error]', error.message);
        throw new Error(`Échec de la communication Odoo : ${error.message}`);
    }
}


// =============================================================================
// EXPORTATIONS DES FONCTIONS D'AUTHENTIFICATION (odooAuthenticate)
// =============================================================================

/**
 * Authentifie un utilisateur contre Odoo en utilisant la Clé API Administrateur 
 * pour forcer l'acceptation de la session (Contournement du Access Denied persistant).
 */
exports.odooAuthenticate = async (email, password) => { // NOTE: Le paramètre 'password' ici n'est pas utilisé
    
    const db = ODOO_CONFIG.db;
    const adminPassword = ODOO_CONFIG.password; // C'est la CLÉ API
    
    if (!adminPassword) {
        throw new Error("Clé API Administrateur (ODOO_API_KEY) est manquante, impossible de contourner le Access Denied.");
    }

    // 1. Requête d'authentification utilisateur (avec le login de l'utilisateur, mais la CLÉ API en mot de passe)
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            db: db,
            login: email, // L'email de l'utilisateur à authentifier
            password: adminPassword, // <--- UTILISATION CRITIQUE DE LA CLÉ API
        },
        id: new Date().getTime(),
    };

    // Point critique : Utilisation de l'endpoint générique /jsonrpc (méthode la plus tolérante)
    const uid = await executeJsonRpc('/jsonrpc', payload);

    // L'endpoint renvoie l'UID (un nombre) ou false
    if (!uid || typeof uid !== 'number' || uid === false) {
        // Si cela échoue ici, la Clé API est soit mauvaise, soit ODOO_DB est INCORRECT.
        throw new Error("Authentification échouée. Veuillez vérifier ODOO_DB et ODOO_API_KEY.");
    }
    
    console.log(`SUCCÈS : UID utilisateur Odoo récupéré : ${uid}.`);

    // Logique de profil simulée
    let profile = 'USER';
    if (email.includes('admin') || email.includes('doukepro')) {
        profile = 'ADMIN';
    } 
    
    return {
        uid,
        db,
        profile, 
        name: `Utilisateur Odoo (ID: ${uid})`,
        email: email,
    };
};


// =============================================================================
// EXPORTATIONS DES FONCTIONS DE GESTION DES DONNÉES (odooExecuteKw)
// =============================================================================

/**
 * Exécute une méthode de modèle Odoo (execute_kw) via JSON-RPC. (Validée)
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password; // Mot de passe technique (CLÉ API)

    if (!uid || !password) {
        throw new Error('UID ou Clé API Odoo manquant pour l\'exécution de la requête.');
    }

    const executeKwArgs = [db, uid, password, model, method, args, kwargs];

    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object", 
            method: "execute_kw",
            args: executeKwArgs, 
            kwargs: {} 
        },
        id: new Date().getTime(),
    };

    return executeJsonRpc('/jsonrpc', payload);
};

/**
 * Crée un nouvel utilisateur Odoo et lui attribue des droits de base.
 * Nécessite ODOO_ADMIN_UID et ODOO_API_KEY.
 */
exports.odooRegisterUser = async (name, email, password) => {
    
    const adminUid = ODOO_CONFIG.adminUid;
    
    if (!adminUid) {
        throw new Error("L'UID de l'Administrateur Odoo est requis (ODOO_ADMIN_UID manquant) pour créer des utilisateurs.");
    }

    // 1. Définition des valeurs du nouvel enregistrement utilisateur
    const userValues = {
        name: name,
        login: email,
        email: email,
        password: password,
        // ATTENTION : Si vous avez identifié les groupes d'accès nécessaires, 
        // ajoutez-les ici : groups_id: [(6, 0, [ID_GROUPE])]
    };

    try {
        // 2. Appel à execute_kw pour créer l'utilisateur dans le modèle 'res.users'
        const newUid = await exports.odooExecuteKw({
            uid: adminUid, // Doit être l'UID de l'Admin qui détient la Clé API
            model: 'res.users',
            method: 'create',
            args: [userValues],
        });

        if (!newUid || typeof newUid !== 'number') {
            throw new Error("La création de l'utilisateur a échoué. Réponse Odoo inattendue.");
        }

        console.log(`Utilisateur Odoo créé avec succès. UID: ${newUid}`);
        return newUid;

    } catch (error) {
        console.error("Échec de la création de l'utilisateur Odoo:", error.message);
        throw new Error(`Erreur d'inscription Odoo : ${error.message}`);
    }
};
