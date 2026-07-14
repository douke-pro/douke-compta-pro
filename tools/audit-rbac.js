// ============================================================
// AUDIT RBAC — READ ONLY — Douke Compta Pro
// Aucune écriture en base. Génère uniquement un rapport.
// Usage : node audit-rbac.js
// ============================================================

async function main() {
    console.log('🔍 Audit RBAC — démarrage\n');

    let db;
    try {
        const User = require('./models/User');
    } catch (e) {
        console.error('❌ Impossible de charger ./models. Vérifie le chemin exact de tes modèles Sequelize.');
        console.error(e.message);
        process.exit(1);
    }

    // User déjà importé directement ci-dessus

    const VALID_PROFILES = ['ADMIN', 'COLLABORATEUR', 'USER', 'CAISSIER'];
    const users = await User.findAll({ raw: true });

    console.log(`📊 Total utilisateurs en base Postgres : ${users.length}\n`);

    const issues = { profilNull: [], profilInvalide: [], emailInvalide: [], emailEspaces: [], doublonsEmail: {} };
    const emailSeen = new Map();

    for (const u of users) {
        const emailRaw = u.email || '';
        const emailLower = emailRaw.trim().toLowerCase();

        if (!u.profile || u.profile.trim() === '') {
            issues.profilNull.push({ id: u.id, email: emailRaw });
        } else if (!VALID_PROFILES.includes(u.profile)) {
            issues.profilInvalide.push({ id: u.id, email: emailRaw, profile: u.profile });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailLower)) {
            issues.emailInvalide.push({ id: u.id, email: emailRaw });
        }

        if (emailRaw !== emailRaw.trim()) {
            issues.emailEspaces.push({ id: u.id, email: JSON.stringify(emailRaw) });
        }

        if (!emailSeen.has(emailLower)) emailSeen.set(emailLower, []);
        emailSeen.get(emailLower).push(u.id);
    }

    for (const [email, ids] of emailSeen.entries()) {
        if (ids.length > 1) issues.doublonsEmail[email] = ids;
    }

    console.log('📋 Répartition par profil :');
    const counts = {};
    for (const u of users) {
        const key = u.profile || '(vide)';
        counts[key] = (counts[key] || 0) + 1;
    }
    console.table(counts);

    console.log('\n👤 Détail des comptes COLLABORATEUR et CAISSIER :');
    const critiques = users.filter(u => ['COLLABORATEUR', 'CAISSIER'].includes(u.profile));
    if (critiques.length === 0) {
        console.log('⚠️  Aucun utilisateur avec profile = COLLABORATEUR ou CAISSIER trouvé en base.');
        console.log('   => Si tu penses en avoir créé, c\'est potentiellement le vrai problème.');
    } else {
        console.table(critiques.map(u => ({ id: u.id, email: u.email, profile: u.profile, createdAt: u.createdAt })));
    }

    console.log('\n🚨 Problèmes détectés :\n');
    console.log(`- Profil NULL/vide : ${issues.profilNull.length}`);
    if (issues.profilNull.length) console.table(issues.profilNull);

    console.log(`- Profil hors ENUM valide (${VALID_PROFILES.join('/')}) : ${issues.profilInvalide.length}`);
    if (issues.profilInvalide.length) console.table(issues.profilInvalide);

    console.log(`- Email mal formé : ${issues.emailInvalide.length}`);
    if (issues.emailInvalide.length) console.table(issues.emailInvalide);

    console.log(`- Email avec espaces parasites : ${issues.emailEspaces.length}`);
    if (issues.emailEspaces.length) console.table(issues.emailEspaces);

    const doublons = Object.entries(issues.doublonsEmail);
    console.log(`- Emails en doublon : ${doublons.length}`);
    if (doublons.length) console.table(doublons.map(([email, ids]) => ({ email, ids: ids.join(', ') })));

    const totalProblemes = issues.profilNull.length + issues.profilInvalide.length + issues.emailInvalide.length + issues.emailEspaces.length + doublons.length;

    console.log('\n============================================================');
    if (totalProblemes === 0 && critiques.length > 0) {
        console.log('✅ Aucune anomalie détectée. Les comptes COLLABORATEUR/CAISSIER semblent prêts pour le fix RBAC.');
    } else if (critiques.length === 0) {
        console.log('⚠️  Aucun compte COLLABORATEUR/CAISSIER en base — à créer/vérifier AVANT de déployer le fix.');
    } else {
        console.log(`⚠️  ${totalProblemes} anomalie(s) à corriger AVANT de déployer le fix RBAC.`);
        console.log('   Le fix bloquera (403) tout login dont l\'email ne matche pas exactement entre Odoo et Postgres.');
    }
    console.log('============================================================\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Erreur pendant l\'audit :', err);
    process.exit(1);
});
