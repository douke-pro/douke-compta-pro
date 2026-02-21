#!/usr/bin/env node

/**
 * Script de nettoyage automatique des doublons
 * Usage: node clean-duplicates.js
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'public', 'assets', 'script.js');
const BACKUP_PATH = SCRIPT_PATH + '.backup';

console.log('🧹 Nettoyage des doublons dans script.js...\n');

// 1. Créer une sauvegarde
console.log('📦 Création de la sauvegarde...');
try {
    fs.copyFileSync(SCRIPT_PATH, BACKUP_PATH);
    console.log(`✅ Sauvegarde créée : ${BACKUP_PATH}\n`);
} catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
}

// 2. Lire le fichier
console.log('📖 Lecture du fichier...');
let lines;
try {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    lines = content.split('\n');
    console.log(`✅ ${lines.length} lignes lues\n`);
} catch (error) {
    console.error('❌ Erreur lecture fichier:', error.message);
    process.exit(1);
}

// 3. Définir les blocs à supprimer
const blocksToRemove = [
    {
        name: 'Module Immobilisations (doublon)',
        start: 2814, // Ligne 2815 (index 2814)
        end: 3178,   // Ligne 3179 (index 3178)
        description: 'Deuxième copie complète du module'
    }
    // Note: Les autres suppressions nécessitent une analyse plus fine
    // car les numéros de ligne changent après chaque suppression
];

// 4. Supprimer les blocs (en commençant par la fin pour garder les indices valides)
let totalRemoved = 0;

blocksToRemove.reverse().forEach(block => {
    console.log(`🗑️  Suppression: ${block.name}`);
    console.log(`   Lignes ${block.start + 1} à ${block.end + 1}`);
    
    const removed = lines.splice(block.start, block.end - block.start + 1);
    totalRemoved += removed.length;
    
    console.log(`   ✅ ${removed.length} lignes supprimées\n`);
});

// 5. Sauvegarder le fichier nettoyé
console.log('💾 Sauvegarde du fichier nettoyé...');
try {
    fs.writeFileSync(SCRIPT_PATH, lines.join('\n'), 'utf-8');
    console.log(`✅ Fichier nettoyé sauvegardé\n`);
} catch (error) {
    console.error('❌ Erreur sauvegarde:', error.message);
    console.log('🔄 Restauration de la sauvegarde...');
    fs.copyFileSync(BACKUP_PATH, SCRIPT_PATH);
    process.exit(1);
}

// 6. Statistiques finales
console.log('📊 RÉSUMÉ:');
console.log(`   Lignes avant : ${lines.length + totalRemoved}`);
console.log(`   Lignes après : ${lines.length}`);
console.log(`   Supprimées   : ${totalRemoved}`);
console.log(`   Gain         : ${((totalRemoved / (lines.length + totalRemoved)) * 100).toFixed(1)}%\n`);

console.log('✅ NETTOYAGE TERMINÉ !');
console.log('\n⚠️  IMPORTANT: Testez votre application maintenant !');
console.log('   Si quelque chose ne marche pas:');
console.log(`   cp ${BACKUP_PATH} ${SCRIPT_PATH}\n`);
