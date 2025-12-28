// =============================================================================
// FICHIER : services/odooService.js (VERSION INTÉGRALE ET STABLE)
// Objectif : Gérer l'interface XML-RPC avec Odoo en utilisant le constructeur de classe
// =============================================================================

const odoo = require('odoo-xmlrpc');

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// --- DÉTECTION DU PROTOCOLE ET DU HOST ---
const isSecure = ODOO_URL && ODOO_URL.startsWith('https');

// Tente d'extraire le hostname
let hostName = ODOO_URL ? ODOO_URL.replace(/(^\w+:|^)\/\//, '') : 'localhost:8069';
hostName = hostName.split(':')[0]; // Isole le host
const portNumber = isSecure ? 443 : 80;


// Configuration Odoo pour le constructeur 'new odoo(config)'
const ODOO_CONFIG = {
    url: ODOO_URL,
    host: hostName, 
    port: portNumber, 
    db: ODOO_DB, 
    secure: isSecure, // CRITIQUE: Activation du SSL pour HTTPS
    allowUnsafeSSL: true, 
    username: process.env.ODOO_USERNAME_API || 'api_user@douke.com', 
    password: process.env.ODOO_PASSWORD_API || 'Douke@2024Api', 
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}

// ✅ Initialisation Correcte
const odooApi = new odoo(ODOO_CONFIG);

/**
 * Fonction utilitaire pour initialiser une connexion et effectuer une requête.
 * @param {string} service - Service Odoo (common, object, report, etc.)
 * @param {string} method - Méthode Odoo
 * @param {Array} args - Arguments de la méthode
 * @returns {Promise<any>} Le résultat de la requête Odoo
 */
function callOdoo(service, method, args) {
    return new Promise((resolve, reject) => {
        // Tente la connexion
        odooApi.connect(function (err) { 
            if (err) {
                console.error('[Odoo Connect Error]', err.message);
                return reject(new Error('Erreur de connexion au serveur Odoo. Vérifiez ODOO_URL et ODOO_DB.'));
            }

            // Exécute la méthode
            this.execute(service, method, args, function (err, result) {
                if (err) {
                    console.error(`[Odoo Execute Error - ${method}]`, err);
                    return reject(new Error(`Erreur Odoo : ${err.faultString || 'Opération échouée.'}`));
                }
                resolve(result);
            });
        });
    });
}

// =============================================================================
// EXPORTATIONS DES FONCTIONS UTILISÉES PAR AUTHCONTROLLER.JS
// =============================================================================

/**
 * Authentifie un utilisateur contre Odoo (utilisé par loginUser)
 */
exports.odooAuthenticate = async (email, password) => {
    
    const db = ODOO_CONFIG.db;

    // 1. Appel de la méthode 'authenticate'
    const authResult = await callOdoo('common', 'authenticate', [db, email, password, {}]);

    if (!authResult || typeof authResult !== 'number' || authResult === false) {
        throw new Error("Authentification échouée. Identifiant ou mot de passe Odoo incorrect.");
    }
    const uid = authResult;

    // 2. Récupérer les informations supplémentaires de l'utilisateur
    const userFields = await exports.odooExecuteKw({
        uid,
        db, 
        model: 'res.users',
        method: 'read',
        args: [[uid], ['name', 'email', 'company_ids']], 
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
        company_ids: user.company_ids || [], 
    };
};

/**
 * Exécute une méthode de modèle Odoo (utilisé pour les requêtes de données)
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password; // Mot de passe technique (pour le slot XML-RPC)

    if (!uid) {
        throw new Error('UID Odoo manquant pour l\'exécution de la requête.');
    }

    // Arguments passés à l'API Odoo: [db, uid, password, model, method, args, kwargs]
    const executeArgs = [db, uid, password, model, method, args, kwargs];

    return new Promise((resolve, reject) => {
        // Exécuter le service 'object' avec la méthode 'execute_kw'
        odooApi.execute('object', 'execute_kw', executeArgs, function (err, result) {
            if (err) {
                console.error(`[Odoo ExecuteKw Error - ${model}.${method}]`, err);
                let errorMessage = err.faultString || 'Échec de la requête de données Odoo.';
                
                return reject(new Error(errorMessage));
            }
            resolve(result);
        });
    });
};
