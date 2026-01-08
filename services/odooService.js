// =============================================================================
// FICHIER : services/odooService.js (VERSION FINALE & NETTOYÉE)
// OBJECTIF : Fournir les fonctions de base (Authentification, execute_kw)
// =============================================================================

const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// Configuration Odoo
const ODOO_CONFIG = {
    db: ODOO_DB,
    adminUid: process.env.ODOO_ADMIN_UID,
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com',
    password: process.env.ODOO_API_KEY,
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}
if (!ODOO_CONFIG.password) {
     console.warn("ATTENTION: ODOO_API_KEY est manquant, toutes les fonctions d'Admin et ExecuteKw échoueront.");
}
if (!ODOO_CONFIG.adminUid) {
     console.warn("ATTENTION: ODOO_ADMIN_UID est manquant. La fonction de création d'utilisateur échouera.");
}

/**
 * Fonction de base pour effectuer une requête JSON-RPC à Odoo.
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

exports.odooAuthenticate = async (email, password) => {
    
    const db = ODOO_CONFIG.db;
    const adminPassword = ODOO_CONFIG.password; 
    
    if (!adminPassword) {
        throw new Error("Clé API Administrateur (ODOO_API_KEY) est manquante, les fonctions Admin échoueront.");
    }
    
    // Logique de sélection : Clé API pour Admin, Mot de passe pour utilisateur standard
    const passwordToUse = (email === ODOO_CONFIG.username) ? adminPassword : password;
    
    if (!passwordToUse) {
        throw new Error("Mot de passe ou Clé API manquant.");
    }

    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "common",
            method: "login",
            args: [db, email, passwordToUse],
        },
        id: new Date().getTime(),
    };

    const uid = await executeJsonRpc('/jsonrpc', payload);

    if (!uid || typeof uid !== 'number' || uid === false) {
        throw new Error("Échec de l'authentification. Identifiants Odoo invalides.");
    }
    
    console.log(`SUCCÈS : UID utilisateur Odoo récupéré : ${uid}.`);

    let profile = 'USER';
    if (email === ODOO_CONFIG.username) {
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
 * Exécute une méthode de modèle Odoo (execute_kw) via JSON-RPC.
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password; 

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
 */
exports.odooRegisterUser = async (name, email, password) => {
    
    const adminUid = ODOO_CONFIG.adminUid;
    
    if (!adminUid) {
        throw new Error("L'UID de l'Administrateur Odoo est requis (ODOO_ADMIN_UID manquant) pour créer des utilisateurs.");
    }

    const userValues = {
        name: name,
        login: email,
        email: email,
        password: password,
    };

    try {
        const newUid = await exports.odooExecuteKw({
            uid: adminUid, 
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
