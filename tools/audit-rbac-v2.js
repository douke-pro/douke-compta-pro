// =============================================================================
// audit-rbac-v2.js — Audit autonome RBAC via pg brut (aucune dépendance Sequelize)
// =============================================================================
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL1 || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Aucune variable DATABASE_URL1 ni DATABASE_URL trouvée dans l\'environnement.');
    console.error('   Assure-toi que ton .env est chargé dans ce terminal (ex: export $(cat .env | xargs) ou dotenv).');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('🔍 Audit RBAC v2 — démarrage');
    console.log('📡 Connexion via:', process.env.DATABASE_URL1 ? 'DATABASE_URL1 (fallback)' : 'DATABASE_URL');

    const client = await pool.connect();
    try {
        // 1. Colonnes réelles de la table users
        const colsRes = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);

        if (colsRes.rows.length === 0) {
            console.error('❌ Aucune table "users" trouvée dans ce schéma.');
            return;
        }

        console.log('\n=== Colonnes de la table users ===');
        colsRes.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

        const colNames = colsRes.rows.map(r => r.column_name);
        const hasRole = colNames.includes('role');
        const hasProfile = colNames.includes('profile');

        console.log('\n=== Détection ===');
        console.log(`  role présent ?    ${hasRole ? '✅' : '❌'}`);
        console.log(`  profile présent ? ${hasProfile ? '✅' : '❌'}`);

        // 2. Construction dynamique du SELECT selon colonnes disponibles
        const selectCols = ['id', 'email'];
        if (hasRole) selectCols.push('role');
        if (hasProfile) selectCols.push('profile');
        if (colNames.includes('name')) selectCols.push('name');

        const usersRes = await client.query(`SELECT ${selectCols.join(', ')} FROM users ORDER BY id;`);

        console.log(`\n=== Contenu table users (${usersRes.rows.length} lignes) ===`);
        usersRes.rows.forEach(u => {
            const roleVal = hasRole ? u.role : 'N/A';
            const profileVal = hasProfile ? u.profile : 'N/A';
            const mismatch = (hasRole && hasProfile && u.role !== u.profile) ? '  ⚠️ MISMATCH role≠profile' : '';
            console.log(`  id=${u.id} email=${u.email} role=${roleVal} profile=${profileVal}${mismatch}`);
        });

        // 3. Focus spécifique COLLABORATEUR
        console.log('\n=== Comptes COLLABORATEUR détectés ===');
        const collabRows = usersRes.rows.filter(u =>
            (hasRole && String(u.role).toUpperCase() === 'COLLABORATEUR') ||
            (hasProfile && String(u.profile).toUpperCase() === 'COLLABORATEUR')
        );
        if (collabRows.length === 0) {
            console.log('  Aucun compte avec role/profile = COLLABORATEUR trouvé.');
        } else {
            collabRows.forEach(u => console.log(`  id=${u.id} email=${u.email} role=${hasRole ? u.role : 'N/A'} profile=${hasProfile ? u.profile : 'N/A'}`));
        }

    } catch (err) {
        console.error('❌ Erreur pendant l\'audit:', err.message);
    } finally {
        client.release();
        await pool.end();
        console.log('\n✅ Connexion fermée proprement.');
    }
}

main();
