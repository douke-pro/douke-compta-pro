const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;

// 1. Variables d'environnement
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

const ODOO_CONFIG = {
    db: ODOO_DB,
    adminUid: process.env.ODOO_ADMIN_UID,
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com',
    password: process.env.ODOO_API_KEY,
};

// 2. Exportation immédiate de l'UID Admin (pour éviter les NoneType/Undefined)
const ADMIN_UID_INT = parseInt(ODOO_CONFIG.adminUid, 10) || 2;
exports.ADMIN_UID_INT = ADMIN_UID_INT;

/**
 * Fonction interne de communication JSON-RPC
 */
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

/**
 * AUTHENTIFICATION (Reprise de votre logique initiale qui marchait)
 */
exports.odooAuthenticate = async (email, password) => {
    const db = ODOO_CONFIG.db;
    const adminPassword = ODOO_CONFIG.password; 
    
    if (!adminPassword) throw new Error("Clé API Administrateur manquante.");
    
    const passwordToUse = (email === ODOO_CONFIG.username) ? adminPassword : password;
    if (!passwordToUse) throw new Error("Mot de passe ou Clé API manquant.");

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

    if (!uid || typeof uid !== 'number') {
        throw new Error("Échec de l'authentification. Identifiants Odoo invalides.");
    }
    
    console.log(`SUCCÈS : UID utilisateur Odoo récupéré : ${uid}.`);

    return {
        uid: parseInt(uid, 10),
        db,
        profile: (email === ODOO_CONFIG.username) ? 'ADMIN' : 'USER',
        name: `Utilisateur Odoo (ID: ${uid})`,
        email: email,
    };
};

/**
 * EXECUTE_KW (Version corrigée avec finalUid et kwargs pour Odoo 19)
 */
/**
 * EXECUTE_KW (Version finale blindée)
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    
    const finalUid = parseInt(uid || exports.ADMIN_UID_INT || 5, 10);
    const db = process.env.ODOO_DB;
    const password = process.env.ODOO_API_KEY;

    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            // STRUCTURE EXPERTE : args contient les identifiants + le domaine de recherche
            // kwargs contient les options (fields, context, limit)
            args: [db, finalUid, password, model, method, args],
            kwargs: kwargs 
        },
        id: Date.now(),
    };

    return await executeJsonRpc('/jsonrpc', payload);
};
/**
 * CRÉATION UTILISATEUR
 */
exports.odooRegisterUser = async (name, email, password) => {
    const userValues = { name, login: email, email, password };

    try {
        const newUid = await exports.odooExecuteKw({
            uid: ADMIN_UID_INT, 
            model: 'res.users',
            method: 'create',
            args: [userValues],
        });
        console.log(`Utilisateur Odoo créé avec succès. UID: ${newUid}`);
        return newUid;
    } catch (error) {
        throw new Error(`Erreur d'inscription Odoo : ${error.message}`);
    }
};
