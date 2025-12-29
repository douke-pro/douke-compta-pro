// =============================================================================
// FICHIER : services/odooService.js (VERSION FINALE JSON-RPC STABLE)
// Objectif : Gérer l'interface Odoo via JSON-RPC, avec toutes les corrections appliquées.
// Dépendance : Nécessite 'node-fetch' (ajouté à package.json)
// =============================================================================

const fetch = require('node-fetch'); 

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// Configuration Odoo (Lecture conforme à votre configuration Render)
const ODOO_CONFIG = {
    db: ODOO_DB, 
    // Utilisateur technique pour les requêtes de données (ExecuteKw)
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com', // Corrigé pour correspondre à l'Admin
    // CLÉ API (Critique pour ExecuteKw)
    password: process.env.ODOO_API_KEY, 
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}
if (!ODOO_CONFIG.password) {
    console.error("FATAL: ODOO_API_KEY est manquant dans les variables d'environnement.");
    // Continue pour l'authentification utilisateur, mais ExecuteKw échouera sans Clé API.
}

/**
 * Fonction de base pour effectuer une requête JSON-RPC à Odoo.
 */
async function executeJsonRpc(endpoint, payload) {
    const url = `${ODOO_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // 1. Gérer les erreurs HTTP (404, 500, etc.)
        if (!response.ok) {
            const text = await response.text();
            console.error(`[JSON-RPC HTTP Error ${response.status}]`, text);
            throw new Error(`Erreur HTTP Odoo: ${response.status} - ${response.statusText}`);
        }

        const jsonResponse = await response.json();

        // 2. Gérer les erreurs JSON-RPC (l'erreur Odoo elle-même)
        if (jsonResponse.error) {
            const error = jsonResponse.error;
            const errorMessage = error.data && error.data.message 
                                ? error.data.message 
                                : error.message || 'Erreur JSON-RPC Odoo inconnue.';

            console.error('[Odoo JSON-RPC Error]', errorMessage, error.data);
            throw new Error(`Erreur Odoo: ${errorMessage}`);
        }

        // 3. Retourner le résultat
        return jsonResponse.result;

    } catch (error) {
        console.error('[Execution Fatal Error]', error.message);
        // Retransmettre l'erreur réseau ou de parsing
        throw new Error(`Échec de la communication Odoo : ${error.message}`);
    }
}


// =============================================================================
// EXPORTATIONS DES FONCTIONS UTILISÉES PAR AUTHCONTROLLER.JS
// =============================================================================

/**
 * Authentifie un utilisateur contre Odoo via JSON-RPC.
 */
exports.odooAuthenticate = async (email, password) => {
    
    const db = ODOO_CONFIG.db;
    
    // 1. Requête d'authentification utilisateur
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            db: db,
            login: email,
            password: password,
        },
        id: new Date().getTime(),
    };

    const authResult = await executeJsonRpc('/web/session/authenticate', payload);

    if (!authResult || typeof authResult.uid !== 'number' || authResult.uid === false) {
        throw new Error("Authentification échouée. Identifiant ou mot de passe Odoo incorrect.");
    }
    const uid = authResult.uid;
    
    // 2. Récupérer les informations supplémentaires de l'utilisateur
    // CORRECTION FINALE: Retrait de 'company_ids' pour résoudre l'erreur 'Invalid field systeme on res.company'
    const userFields = await exports.odooExecuteKw({
        uid,
        db, 
        model: 'res.users',
        method: 'read',
        args: [[uid], ['name', 'email']], // Lecture simplifiée
    });

    if (!userFields || userFields.length === 0) {
        throw new Error("Profil utilisateur Odoo introuvable.");
    }

    const user = userFields[0];
    
    // Logique de simulation de profil
    let profile = 'USER';
    if (user.email === 'admin@douke.com' || user.email.includes('admin')) {
        profile = 'ADMIN';
    } else if (user.name.includes('Collab')) {
        profile = 'COLLABORATEUR';
    } else if (user.name.includes('Caisse')) {
        profile = 'CAISSIER';
    }
    
    return {
        uid,
        db,
        profile, 
        name: user.name,
        email: user.email,
        // company_ids ne sont plus disponibles directement avec la lecture simplifiée
    };
};

/**
 * Exécute une méthode de modèle Odoo (execute_kw) via JSON-RPC.
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password; // Mot de passe technique (CLÉ API)

    if (!uid || !password) {
        throw new Error('UID ou Clé API Odoo manquant pour l\'exécution de la requête.');
    }

    // Arguments passés à execute_kw (db, uid, password, model, method, args, kwargs)
    const executeKwArgs = [db, uid, password, model, method, args, kwargs];

    // Requête d'exécution de méthode (execute_kw)
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            // Structure JSON-RPC pour execute_kw
            service: "object", 
            method: "execute_kw",
            args: executeKwArgs, 
            kwargs: {} 
        },
        id: new Date().getTime(),
    };

    // L'endpoint est l'endpoint standard pour les requêtes de données
    return executeJsonRpc('/jsonrpc', payload);
};
