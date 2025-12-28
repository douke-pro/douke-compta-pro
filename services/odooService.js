// =============================================================================
// FICHIER : services/odooService.js (Solution d'initialisation Correcte)
// =============================================================================

const odoo = require('odoo-xmlrpc'); // Note: 'odoo' est ici le constructeur

// Variables d'environnement critiques
const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
// ... (Récupérez les autres variables d'environnement si elles sont utilisées)

// --- DÉTECTION DU PROTOCOLE ET DU HOST (Réutilisation du code précédent) ---
const isSecure = ODOO_URL && ODOO_URL.startsWith('https');

let hostName = ODOO_URL ? ODOO_URL.replace(/(^\w+:|^)\/\//, '') : 'localhost:8069';
hostName = hostName.split(':')[0]; 
const portNumber = isSecure ? 443 : 80;


// Configuration Odoo pour le constructeur 'new odoo(config)'
const ODOO_CONFIG = {
    url: ODOO_URL,
    host: hostName, 
    port: portNumber, 
    db: ODOO_DB, 
    secure: isSecure, // Activation du SSL pour HTTPS
    allowUnsafeSSL: true, 
    // Assurez-vous d'avoir ces deux variables si elles sont critiques pour votre code:
    username: process.env.ODOO_USERNAME_API || 'api_user@douke.com', 
    password: process.env.ODOO_PASSWORD_API || 'Douke@2024Api', 
};

// Vérification de base
if (!ODOO_URL || !ODOO_DB) {
    console.error("FATAL: Les variables ODOO_URL ou ODOO_DB sont manquantes.");
    throw new Error("Configuration Odoo Manquante.");
}

// ✅ INITIALISATION CORRECTE : Utilisation du constructeur de classe
const odooApi = new odoo(ODOO_CONFIG); 

// -----------------------------------------------------------------------------
// Les fonctions `callOdoo`, `odooAuthenticate`, `odooExecuteKw` doivent maintenant
// revenir à utiliser `odooApi.connect` et `odooApi.execute` comme dans votre Version 2.
// -------------
