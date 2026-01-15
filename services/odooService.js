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

/**
 * FIX 1: Exportation sécurisée de l'UID Admin. 
 * Si ODOO_ADMIN_UID est vide sur Render, on utilise '1' ou '2' par défaut (IDs standards Odoo).
 */
exports.ADMIN_UID_INT = parseInt(ODOO_CONFIG.adminUid, 10) || 2;

if (!ODOO_URL || !ODOO_DB) {
    throw new Error("Configuration Odoo Manquante.");
}

async function executeJsonRpc(endpoint, payload) {
    const url = `${ODOO_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const jsonResponse = await response.json();

        if (jsonResponse.error) {
            const error = jsonResponse.error;
            const errorMessage = error.data && error.data.message ? error.data.message : error.message;
            console.error('[Odoo JSON-RPC Error]', errorMessage);
            throw new Error(`Erreur Odoo: ${errorMessage}`);
        }
        return jsonResponse.result;
    } catch (error) {
        console.error('[Execution Fatal Error]', error.message);
        throw new Error(`Échec de la communication Odoo : ${error.message}`);
    }
}

exports.odooAuthenticate = async (email, password) => {
    const db = ODOO_CONFIG.db;
    const adminPassword = ODOO_CONFIG.password; 
    const passwordToUse = (email === ODOO_CONFIG.username) ? adminPassword : password;
    
    const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
        service: "object",
        method: "execute_kw",
        // L'ordre Odoo est strict : [db, uid, password, model, method, args, kwargs]
        args: [ODOO_CONFIG.db, finalUid, ODOO_CONFIG.password, model, method, args, kwargs],
        kwargs: {} // Toujours vide ici
    },
    id: new Date().getTime(),
};

    const uid = await executeJsonRpc('/jsonrpc', payload);
    if (!uid) throw new Error("Identifiants Odoo invalides.");
    
    // FIX 2: On force le retour en nombre entier
    return {
        uid: parseInt(uid, 10),
        db,
        profile: (email === ODOO_CONFIG.username) ? 'ADMIN' : 'USER',
        name: `Utilisateur Odoo (ID: ${uid})`,
        email: email,
    };
};

/**
 * FIX 3: odooExecuteKw avec sécurité anti-NoneType
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    
    // On s'assure d'avoir un UID valide. Si 'uid' est passé nul, on prend l'ADMIN_UID_INT
    const finalUid = parseInt(uid || exports.ADMIN_UID_INT, 10);
    
    if (isNaN(finalUid)) {
        throw new Error("Impossible d'exécuter la requête : UID Odoo non défini.");
    }

    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            // L'ordre est vital pour Odoo : db, uid, password, model, method, args, kwargs
            args: [ODOO_CONFIG.db, finalUid, ODOO_CONFIG.password, model, method, args, kwargs],
            kwargs: {} 
        },
        id: new Date().getTime(),
    };

   return executeJsonRpc('/jsonrpc', payload);
};

// =============================================================================
// EXPORT ADDITIONNEL : UID de l'Administrateur Technique
// =============================================================================

/**
 * Exporte l'UID de l'administrateur technique Odoo sous forme de nombre entier.
 * Utilisé pour les opérations critiques de lecture (rapports, configuration) qui 
 * nécessitent des droits élevés, le cloisonnement étant assuré par le 'context'.
 */
exports.ADMIN_UID_INT = parseInt(ODOO_CONFIG.adminUid, 10);
