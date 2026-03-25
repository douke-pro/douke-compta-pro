// =============================================================================
// FICHIER : services/dbService.js
// Description : Connexion PostgreSQL — Pool robuste avec reconnexion automatique
// Version : 2.0 — Production Render Free Plan
// =============================================================================

const { Pool } = require('pg');

// =============================================================================
// VALIDATION DE LA CONNECTION STRING
// =============================================================================
const connectionString = process.env.DATABASE_URL1 || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('🚨 [DB] DATABASE_URL manquante ! Vérifiez vos variables d\'environnement Render.');
    process.exit(1);
}

if (connectionString.startsWith('https://')) {
    console.error('🚨 [DB] DATABASE_URL invalide — commence par https:// au lieu de postgres://');
    console.error('   Valeur actuelle:', connectionString.substring(0, 30) + '...');
    process.exit(1);
}

// =============================================================================
// CONFIGURATION DU POOL
// =============================================================================
const pool = new Pool({
    connectionString,

    // SSL Supabase — rejectUnauthorized false gère le certificat auto-signé
    ssl: { rejectUnauthorized: false },

    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});

// =============================================================================
// ÉVÉNEMENTS DU POOL
// =============================================================================
pool.on('connect', () => {
    console.log('✅ [PostgreSQL] Nouvelle connexion établie dans le pool');
});

pool.on('acquire', () => {
    // Silencieux — trop verbeux si activé
});

pool.on('remove', () => {
    // Silencieux
});

pool.on('error', (err, client) => {
    console.error('🚨 [PostgreSQL] Erreur inattendue sur le pool:', err.message);
    // Ne pas faire process.exit() ici — laisser le pool se rétablir
});

// =============================================================================
// FONCTION UTILITAIRE : QUERY AVEC RETRY AUTOMATIQUE
// =============================================================================
// Utilise cette fonction à la place de pool.query() pour les requêtes critiques.
// En cas de connexion terminée, elle réessaie automatiquement.
//
// Usage : const result = await pool.queryWithRetry('SELECT * FROM table WHERE id=$1', [id]);
// =============================================================================
pool.queryWithRetry = async function(text, params, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await this.query(text, params);
        } catch (err) {
            const isConnectionError = 
                err.message.includes('Connection terminated') ||
                err.message.includes('connection timeout') ||
                err.message.includes('ECONNRESET') ||
                err.message.includes('ENOTFOUND') ||
                err.code === 'ECONNRESET' ||
                err.code === '57P01'; // admin_shutdown

            if (isConnectionError && attempt < retries) {
                console.warn(`⚠️ [PostgreSQL] Tentative ${attempt}/${retries} échouée: ${err.message}`);
                console.warn(`   Nouvelle tentative dans ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }

            throw err; // Relancer si non récupérable ou dernière tentative
        }
    }
};

// =============================================================================
// EXPORT
// =============================================================================
module.exports = pool;
