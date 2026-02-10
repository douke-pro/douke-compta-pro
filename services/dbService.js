// =============================================================================
// FICHIER : services/dbService.js
// Description : Connexion PostgreSQL pour notifications
// =============================================================================

const { Pool } = require('pg');

// Configuration de la connexion PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Test de connexion au démarrage
pool.on('connect', () => {
    console.log('✅ [PostgreSQL] Connexion établie');
});

pool.on('error', (err) => {
    console.error('🚨 [PostgreSQL] Erreur:', err.message);
});

// Export du pool
module.exports = pool;
