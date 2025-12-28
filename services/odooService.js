// =============================================================================
// FICHIER : services/odooService.js (Version Robuste)
// Objectif : Gérer l'interface XML-RPC avec Odoo en HTTPS
// =============================================================================

// NOUVEAU CODE (Le plus compatible) :
const URL = require('url').URL; 
const odooXmlrpc = require('odoo-xmlrpc');

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

// --- Vérification de Base ---
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    // Empêcher le serveur de démarrer si la configuration est incomplète
    throw new Error("Configuration Odoo Manquante. Vérifiez .env et Render Environment.");
}

// -----------------------------------------------------------------------------
// Configuration des Clients XML-RPC
// -----------------------------------------------------------------------------

const urlParts = new URL(ODOO_URL);

// Configuration de base pour la connexion Odoo
const baseConfig = {
    host: urlParts.hostname,
    // Détermine le port : utilise le port spécifié, sinon 443 pour HTTPS ou 80 pour HTTP
    port: urlParts.port || (urlParts.protocol === 'https:' ? 443 : 80),
    // CRITIQUE: Active le SSL/TLS si le protocole est HTTPS
    secure: urlParts.protocol === 'https:', 
    allowUnsafeSSL: true, // Peut être nécessaire si vous utilisez un certificat auto-signé
};

// Client pour les requêtes communes (authentification)
const configCommon = {
    ...baseConfig,
    path: '/xmlrpc/2/common',
};

// Client pour les requêtes d'objets (lecture/écriture de données)
const configObject = {
    ...baseConfig,
    path: '/xmlrpc/2/object',
};

// Initialisation des clients
const clientCommon = odooXmlrpc.createClient(configCommon);
const clientObject = odooXmlrpc.createClient(configObject);

// -----------------------------------------------------------------------------
// Fonctions d'Interface
// -----------------------------------------------------------------------------

/**
 * Gère l'authentification de l'utilisateur sur Odoo.
 * (Service 'common', Méthode 'authenticate')
 */
exports.odooAuthenticate = (email, password) => {
    return new Promise((resolve, reject) => {
        
        clientCommon.methodCall('authenticate', [
            ODOO_DB, 
            email, 
            password, 
            {} // kwargs est nécessaire pour la compatibilité avec certaines versions
        ], (error, value) => {
            if (error) {
                // Erreur réseau pure (connexion refusée, timeout, etc.)
                console.error('Erreur authentification Odoo:', error.message || error);
                return reject(new Error('Erreur de connexion au serveur Odoo. Vérifiez ODOO_URL et ODOO_DB.'));
            }

            // Vérification de l'UID (0 = échec d'authentification)
            if (!value || typeof value.uid !== 'number' || value.uid === 0) {
                 return reject(new Error('Identifiants Odoo invalides.'));
            }

            // Le 'value' contient l'UID et d'autres infos de session Odoo
            resolve(value); 
        });
    });
};


/**
 * Exécute une méthode de modèle Odoo (search_read, create, write, etc.)
 * (Service 'object', Méthode 'execute_kw')
 */
exports.odooExecuteKw = (options) => {
    const { uid, model, method, args = [], kwargs = {} } = options;
    
    return new Promise((resolve, reject) => {
        // Le mot de passe (ou token de session) est passé ici, mais après l'authentification
        // le mot de passe n'est pas utilisé, l'UID et la DB suffisent souvent.
        // Odoo-xmlrpc attend ce slot (rempli par un 'password' ou un token de session si besoin)
        const dummyPassword = 'SESSION_TOKEN_IGNORED'; 
        
        clientObject.methodCall('execute_kw', [
            ODOO_DB, 
            uid, 
            dummyPassword, 
            model, 
            method, 
            args, 
            kwargs
        ], (error, value) => {
            if (error) {
                 // Gérer les erreurs de permission ou de modèle
                 console.error(`Erreur Odoo execute_kw (${model}.${method}):`, error.message || error);
                 let errorMessage = error.faultString || 'Requête Odoo échouée.';
                 
                 return reject(new Error(`Erreur API Odoo: ${errorMessage}`));
            }
            resolve(value);
        });
    });
};

// =============================================================================
