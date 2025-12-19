const xmlrpc = require('xmlrpc');
require('dotenv').config();

const config = {
    url: process.env.ODOO_URL,
    db: process.env.ODOO_DB,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_API_KEY
};

if (!config.url || config.url === "undefined") {
    console.error("❌ ERREUR : ODOO_URL n'est pas défini dans le fichier .env");
    process.exit(1);
}

console.log("🚀 Test de connexion vers Odoo...");
console.log(`Cible : ${config.url}`);

const common = xmlrpc.createSecureClient(`${config.url}/xmlrpc/2/common`);

common.methodCall('version', [], (error, version) => {
    if (error) {
        console.error("❌ ÉCHEC de la connexion (Vérifiez l'URL) :", error.message);
    } else {
        console.log("✅ SUCCÈS ! Odoo répond.");
        
        common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authError, uid) => {
            if (authError || !uid) {
                console.error("❌ ÉCHEC d'authentification : Vérifiez DB, Email et Clé API.");
            } else {
                console.log(`🔑 AUTHENTIFICATION RÉUSSIE ! ID : ${uid}`);
                console.log("Votre backend est 100% opérationnel.");
            }
        });
    }
});
