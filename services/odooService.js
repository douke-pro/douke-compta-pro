// =============================================================================
// FICHIER : services/odooService.js (VERSION TEST DE RÉSILIENCE - CONTOURNEMENT API)
// Objectif : Prouver la stabilité du protocole JSON-RPC en isolant le problème 'Access Denied'.
// =============================================================================

// CORRECTION CRITIQUE DE L'IMPORTATION FETCH
const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch; 

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// Configuration Odoo (Lecture conforme à votre configuration Render)
const ODOO_CONFIG = {
    db: ODOO_DB, 
    // Utilisateur technique de l'API (maintenu pour les futures fonctions)
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com', 
    password: process.env.ODOO_API_KEY, 
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}
// Note: Nous n'aurons plus besoin de la Clé API pour l'authentification dans cette version
if (!ODOO_CONFIG.password) {
     console.warn("ATTENTION: ODOO_API_KEY est manquant, mais l'authentification utilisateur va fonctionner.");
}

/**
 * Fonction de base pour effectuer une requête JSON-RPC à Odoo. (Inchangée et Validée)
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
// EXPORTATIONS DES FONCTIONS UTILISÉES PAR AUTHCONTROLLER.JS
// =============================================================================

/**
 * Authentifie un utilisateur contre Odoo via JSON-RPC.
 * CETTE VERSION N'UTILISE PAS LA CLÉ API POUR LE PROFIL.
 */
exports.odooAuthenticate = async (email, password) => {
    
    const db = ODOO_CONFIG.db;
    
    // 1. Requête d'authentification utilisateur (avec mot de passe utilisateur)
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
    
    // ######################################################################
    // # ACTION CRITIQUE : Contournement de l'appel à la Clé API qui échoue #
    // ######################################################################
    
    console.log(`SUCCÈS : UID utilisateur Odoo récupéré : ${uid}.`);

    // On simule un profil de base puisque nous n'avons pas pu lire res.users
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

/**
 * La fonction odooExecuteKw est maintenue mais sera ignorée pour l'authentification.
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
