// =============================================================================
// FICHIER : services/odooService.js
// Version : V19 - ODOO 19 MULTI-COMPANY - PRODUCTION READY
// Date : 2026-03-22
// ✅ FIX 4 : Vérification que ADMIN_UID_INT n'est pas NaN au démarrage
// ✅ Conservation : contexte fr_FR / Africa/Porto-Novo sur tous les appels
// ✅ Conservation : logique d'authentification admin vs utilisateur standard
// =============================================================================

const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB  = process.env.ODOO_DB;

// Configuration Odoo
const ODOO_CONFIG = {
    db:       ODOO_DB,
    adminUid: process.env.ODOO_ADMIN_UID,
    username: process.env.ODOO_USERNAME || 'doukepro@gmail.com',
    password: process.env.ODOO_API_KEY,
};

// ─── Vérifications critiques au démarrage ────────────────────────────────────

if (!ODOO_URL || !ODOO_DB) {
    console.error('FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.');
    throw new Error('Configuration Odoo Manquante.');
}

if (!ODOO_CONFIG.password) {
    console.warn("ATTENTION: ODOO_API_KEY est manquant. Toutes les fonctions d'Admin et ExecuteKw échoueront.");
}

if (!ODOO_CONFIG.adminUid) {
    console.warn('ATTENTION: ODOO_ADMIN_UID est manquant. Les opérations admin échoueront.');
}

// ✅ FIX 4 : Vérification ADMIN_UID_INT au démarrage — évite les NaN silencieux
const _parsedAdminUid = parseInt(ODOO_CONFIG.adminUid, 10);
if (isNaN(_parsedAdminUid)) {
    // On ne lève pas d'exception ici pour ne pas bloquer le démarrage du serveur
    // si d'autres modules ne dépendent pas de l'OCR, mais on avertit clairement.
    console.error('❌ FATAL [odooService] ODOO_ADMIN_UID est invalide ou manquant dans .env');
    console.error('❌ [odooService] Tous les appels odooExecuteKw avec ADMIN_UID_INT échoueront.');
} else {
    console.log(`✅ [odooService] ADMIN_UID_INT = ${_parsedAdminUid}`);
}

// =============================================================================
// FONCTION DE BASE : JSON-RPC
// =============================================================================

/**
 * Effectue une requête JSON-RPC vers Odoo.
 * Lève une erreur si la réponse HTTP ou Odoo contient une erreur.
 */
async function executeJsonRpc(endpoint, payload) {
    const url = `${ODOO_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[JSON-RPC HTTP Error ${response.status}]`, text);
            throw new Error(`Erreur HTTP Odoo: ${response.status} - ${response.statusText}`);
        }

        const jsonResponse = await response.json();

        if (jsonResponse.error) {
            const err = jsonResponse.error;
            const errorMessage = (err.data && err.data.message)
                ? err.data.message
                : (err.message || 'Erreur JSON-RPC Odoo inconnue.');

            console.error('[Odoo JSON-RPC Error]', errorMessage, err.data);
            throw new Error(`Erreur Odoo: ${errorMessage}`);
        }

        return jsonResponse.result;

    } catch (error) {
        console.error('[Execution Fatal Error]', error.message);
        throw new Error(`Échec de la communication Odoo : ${error.message}`);
    }
}

// =============================================================================
// AUTHENTIFICATION
// =============================================================================

/**
 * Authentifie un utilisateur sur Odoo.
 * - Si c'est l'admin (ODOO_USERNAME), utilise la clé API.
 * - Sinon, utilise le mot de passe fourni.
 */
exports.odooAuthenticate = async (email, password) => {
    const db            = ODOO_CONFIG.db;
    const adminPassword = ODOO_CONFIG.password;

    if (!adminPassword) {
        throw new Error("Clé API Administrateur (ODOO_API_KEY) manquante.");
    }

    const passwordToUse = (email === ODOO_CONFIG.username) ? adminPassword : password;

    if (!passwordToUse) {
        throw new Error('Mot de passe ou Clé API manquant.');
    }

    const payload = {
        jsonrpc: '2.0',
        method:  'call',
        params: {
            service: 'common',
            method:  'login',
            args:    [db, email, passwordToUse],
        },
        id: Date.now(),
    };

    const uid = await executeJsonRpc('/jsonrpc', payload);

    if (!uid || typeof uid !== 'number' || uid === false) {
        throw new Error("Échec de l'authentification. Identifiants Odoo invalides.");
    }

    console.log(`✅ [odooAuthenticate] UID récupéré : ${uid} pour ${email}`);

    return {
        uid,
        db,
        profile: email === ODOO_CONFIG.username ? 'ADMIN' : 'USER',
        name:    `Utilisateur Odoo (ID: ${uid})`,
        email:   email,
    };
};

// =============================================================================
// EXECUTE_KW — fonction principale d'appel Odoo
// =============================================================================

/**
 * Exécute une méthode de modèle Odoo (execute_kw) via JSON-RPC.
 *
 * ✅ Force automatiquement le contexte fr_FR + Africa/Porto-Novo
 * ✅ Préserve les contextes supplémentaires passés dans kwargs.context
 *    (ex : allowed_company_ids, force_company)
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db       = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password;

    // ✅ Fusion contexte : fr_FR de base + contextes spécifiques de l'appelant
    const contextWithLang = {
        lang: 'fr_FR',
        tz:   'Africa/Porto-Novo',
        ...kwargs.context   // allowed_company_ids, force_company, etc. ont la priorité
    };

    const kwargsWithLang = {
        ...kwargs,
        context: contextWithLang
    };

    const payload = {
        jsonrpc: '2.0',
        method:  'call',
        params: {
            service: 'object',
            method:  'execute_kw',
            args:    [db, uid, password, model, method, args, kwargsWithLang],
            kwargs:  {}
        },
        id: Date.now(),
    };

    return executeJsonRpc('/jsonrpc', payload);
};

// =============================================================================
// CRÉATION D'UTILISATEUR ODOO
// =============================================================================

/**
 * Crée un nouvel utilisateur Odoo avec les droits de base.
 */
exports.odooRegisterUser = async (name, email, password) => {
    const adminUid = ODOO_CONFIG.adminUid;

    if (!adminUid) {
        throw new Error("L'UID Administrateur Odoo est requis (ODOO_ADMIN_UID manquant).");
    }

    const userValues = {
        name:     name,
        login:    email,
        email:    email,
        password: password,
    };

    try {
        const newUid = await exports.odooExecuteKw({
            uid:    adminUid,
            model:  'res.users',
            method: 'create',
            args:   [userValues],
        });

        if (!newUid || typeof newUid !== 'number') {
            throw new Error("La création de l'utilisateur a échoué. Réponse Odoo inattendue.");
        }

        console.log(`✅ [odooRegisterUser] Utilisateur créé. UID: ${newUid}`);
        return newUid;

    } catch (error) {
        console.error("❌ [odooRegisterUser] Échec:", error.message);
        throw new Error(`Erreur d'inscription Odoo : ${error.message}`);
    }
};

// =============================================================================
// EXPORT : UID Administrateur Technique
// =============================================================================

/**
 * UID de l'administrateur technique Odoo (entier).
 * Utilisé pour les opérations multi-company via execute_kw.
 * Le cloisonnement des données est assuré par allowed_company_ids dans le context.
 *
 * ✅ FIX 4 : Vaut NaN si ODOO_ADMIN_UID est absent — détecté et loggué ci-dessus.
 */
exports.ADMIN_UID_INT = _parsedAdminUid;
