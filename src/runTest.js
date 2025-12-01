// runTest.js
const { genererEtatsFinanciers } = require('./src/exports/syscohadaExports');
const { CONFIG_TEST, DATA_COMPTABLE_MOCK } = require('./testData');

// 1. Tester le Système NORMAL
console.log("==========================================");
console.log("   TEST SYSTÈME NORMAL (ENT001_SA)");
console.log("==========================================");
try {
    const etatsNormal = genererEtatsFinanciers(DATA_COMPTABLE_MOCK, CONFIG_TEST.NORMAL);
    console.log("✅ États générés avec succès.");
    console.log("--- Bilan Actif Immobilisé (Normal) ---");
    console.log(etatsNormal.bilan.ACTIF.immobilisationsCorporelles); // Devrait être 15000000
    console.log("--- Ratios Financiers (Normal) ---");
    console.log(etatsNormal.ratiosFinanciers.ratios);

} catch (error) {
    console.error("❌ Échec du test NORMAL:", error.message);
}

// 2. Tester le Système MINIMAL
console.log("\n==========================================");
console.log("   TEST SYSTÈME MINIMAL (ENT002_EURL)");
console.log("==========================================");
try {
    const etatsMinimal = genererEtatsFinanciers(DATA_COMPTABLE_MOCK, CONFIG_TEST.MINIMAL);
    console.log("✅ États générés avec succès.");
    console.log("--- Bilan Actif (Minimal) ---");
    // Le Bilan Minimal a moins de rubriques que le Bilan Normal
    console.log(etatsMinimal.bilan.ACTIF.immobilisations); // Devrait être 16000000 (500k+15M+500k)

} catch (error) {
    console.error("❌ Échec du test MINIMAL:", error.message);
}
