// =============================================================================
// FICHIER : services/dbService.js
// Description : Connexion PostgreSQL pour notifications
// =============================================================================
const { Pool } = require('pg');

// Prendre DATABASE_URL1 en priorité, sinon DATABASE_URL
const connectionString = process.env.DATABASE_URL1 || process.env.DATABASE_URL;

if (!connectionString || connectionString.startsWith('https://')) {
    console.error('🚨 DATABASE_URL invalide ! Vérifiez vos variables d\'environnement.');
    console.error('Valeur actuelle:', connectionString);
}

// Configuration de la connexion PostgreSQL
const pool = new Pool({
    connectionString,
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
