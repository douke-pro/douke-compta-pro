// services/odooService.js
const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;

const ODOO_CONFIG = {
    url: process.env.ODOO_URL,
    db: process.env.ODOO_DB,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_API_KEY,
    adminUid: parseInt(process.env.ODOO_ADMIN_UID, 10) || 2
};

exports.ADMIN_UID_INT = ODOO_CONFIG.adminUid;

async function executeJsonRpc(endpoint, payload) {
    const response = await fetch(`${ODOO_CONFIG.url}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (json.error) throw new Error(json.error.data ? json.error.data.message : json.error.message);
    return json.result;
}

exports.odooExecuteKw = async ({ uid, model, method, args = [], kwargs = {} }) => {
    const finalUid = parseInt(uid || ODOO_CONFIG.adminUid, 10);
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            // Ordre Odoo strict : [db, uid, password, model, method, args]
            args: [ODOO_CONFIG.db, finalUid, ODOO_CONFIG.password, model, method, args],
            kwargs: kwargs // Les options vont ICI
        },
        id: Date.now(),
    };
    return await executeJsonRpc('/jsonrpc', payload);
};

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
