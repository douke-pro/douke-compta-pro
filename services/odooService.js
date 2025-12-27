// =============================================================================
// FICHIER : services/odooService.js
// Description : Service d'interface avec l'API XML-RPC d'Odoo
// =============================================================================

const odoo = require('odoo-xmlrpc');

// Configuration Odoo (Récupérée des variables d'environnement)
const ODOO_CONFIG = {
    // URL du backend Odoo (doit être définie dans .env)
    url: process.env.ODOO_URL || 'http://localhost:8069', 
    // Base de données Odoo
    db: process.env.ODOO_DB || 'douke_prod_db', 
    // Utilisateur technique Odoo (avec droits d'API ou Admin pour les services)
    username: process.env.ODOO_USERNAME_API || 'api_user@douke.com', 
    // Mot de passe technique
    password: process.env.ODOO_PASSWORD_API || 'Douke@2024Api', 
};

// Initialisation de la connexion Odoo
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
        odooApi.connect(function (err) {
            if (err) {
                console.error('[Odoo Connect Error]', err.message);
                return reject(new Error('Erreur de connexion au serveur Odoo. Vérifiez ODOO_URL et ODOO_DB.'));
            }

            this.execute(service, method, args, function (err, result) {
                if (err) {
                    // Les erreurs Odoo (404, permissions, etc.) sont souvent renvoyées ici
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
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{uid: number, db: string, profile: string, name: string, company_ids: number[]}>}
 */
exports.odooAuthenticate = async (email, password) => {
    // Utiliser l'utilisateur technique pour la connexion temporaire, 
    // puis appeler 'authenticate' pour l'utilisateur final.
    
    const db = ODOO_CONFIG.db;

    // 1. Appel de la méthode 'authenticate' qui retourne l'UID de l'utilisateur Odoo
    const authResult = await callOdoo('common', 'authenticate', [db, email, password, {}]);

    if (!authResult || typeof authResult !== 'number' || authResult === false) {
        throw new Error("Authentification échouée. Identifiant ou mot de passe Odoo incorrect.");
    }
    const uid = authResult;

    // 2. Récupérer les informations supplémentaires de l'utilisateur (nom, rôle, entreprises)
    const userFields = await exports.odooExecuteKw({
        uid,
        db, // Passer la DB si nécessaire
        model: 'res.users',
        method: 'read',
        args: [[uid], ['name', 'email', 'company_ids']], // On récupère les IDs d'entreprise
    });

    if (!userFields || userFields.length === 0) {
        throw new Error("Profil utilisateur Odoo introuvable.");
    }

    const user = userFields[0];
    
    // NOTE: Simuler le champ 'profile' (rôle Doukè) qui n'existe pas dans Odoo par défaut.
    // Dans une application professionnelle, ceci est mappé à un groupe de sécurité Odoo.
    // Ici, nous faisons une supposition simple basée sur le nom (pour la démo)
    let profile = 'USER';
    if (user.email === 'admin@douke.com' || user.email.includes('admin')) {
        profile = 'ADMIN';
    } else if (user.name.includes('Collab')) {
        profile = 'COLLABORATEUR';
    } else if (user.name.includes('Caisse')) {
        profile = 'CAISSIER';
    }
    
    // Le controller attend: uid, db, profile, name, company_ids
    return {
        uid,
        db,
        profile, 
        name: user.name,
        company_ids: user.company_ids || [], // Liste des IDs d'entreprises liées
    };
};

/**
 * Exécute une méthode de modèle Odoo (utilisé pour les requêtes de données)
 * @param {object} params
 * @param {number} params.uid - L'ID de l'utilisateur Odoo (récupéré du JWT ou de l'authentification)
 * @param {string} params.model - Le modèle Odoo à interroger (e.g., 'account.move')
 * @param {string} params.method - La méthode du modèle (e.g., 'search_read', 'create')
 * @param {Array} params.args - Les arguments positionnels (e.g., filtres [[id, '=', 1]])
 * @param {object} params.kwargs - Les arguments par mot-clé (e.g., {fields: ['name']})
 * @returns {Promise<any>}
 */
exports.odooExecuteKw = async (params) => {
    const { uid, model, method, args = [], kwargs = {} } = params;
    const db = ODOO_CONFIG.db;
    const password = ODOO_CONFIG.password; // Mot de passe technique

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
                 // Tenter de rendre l'erreur plus lisible si elle vient d'Odoo
                let errorMessage = err.faultString || 'Échec de la requête de données Odoo.';
                if (err.faultString && err.faultString.includes('AccessError')) {
                    errorMessage = "Accès refusé. Vérifiez les droits de l'utilisateur Odoo.";
                }
                return reject(new Error(errorMessage));
            }
            resolve(result);
        });
    });
};
