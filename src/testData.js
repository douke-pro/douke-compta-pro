/**
 * ==============================================================================
 * 1. SIMULATION DE CONFIGURATION (CONFIG_TEST)
 * Cette structure simule l'objet 'config' que le Back-end sécurisé enverrait.
 * Elle permet de tester la gestion multi-système et multi-entreprise.
 * ==============================================================================
 */
const CONFIG_TEST = {
    // Cas 1 : Pour tester le système NORMAL (plus de rubriques et de notes)
    NORMAL: {
        entrepriseId: "ENT001_SA", // ID de l'entreprise
        systeme: "NORMAL",         // Le système comptable à utiliser
        exercice: 2024,            // L'exercice comptable
        utilisateurRole: "ADMIN",  // Rôle de l'utilisateur (pour une future gestion de hiérarchie)
    },
    
    // Cas 2 : Pour tester le système MINIMAL (agrégations et moins de détails)
    MINIMAL: {
        entrepriseId: "ENT002_EURL",
        systeme: "MINIMAL",
        exercice: 2024,
        utilisateurRole: "COMPTABLE",
    }
};


/**
 * ==============================================================================
 * 2. SIMULATION DES DONNÉES COMPTABLES (DATA_COMPTABLE_MOCK)
 * Ces données sont AGRÉGÉES PAR RUBRIQUE SYSCOHADA, comme requis par nos modules JS.
 * * NOTE : Pour que le Bilan s'équilibre (Actif = Passif), les totaux doivent être égaux.
 * ==============================================================================
 */
const DATA_COMPTABLE_MOCK = {
    // --- BILAN - ACTIF (Classes 1, 2, 3, 4, 5) ---
    // Rubriques d'Actif Immobilisé (AI)
    immobilisations_incorporelles: 500000,
    immobilisations_corporelles: 15000000,
    immobilisations_financieres: 500000,

    // Rubriques d'Actif Circulant (AC)
    stocks: 3000000,
    creances_clients: 4000000,
    autres_creances_circulantes: 500000,
    banques_caisses: 1500000, // Trésorerie Actif

    // --- BILAN - PASSIF (Classes 1, 4, 5) ---
    // Rubriques de Capitaux Propres (CP)
    capital_social: 8000000,
    reserves: 5000000,
    resultat_net: 4000000, // Doit correspondre au Résultat Net du CR ci-dessous
    
    // Rubriques de Dettes
    amortissements_provisions: 3000000,
    emprunts: 5000000,
    dettes_fournisseurs: 5000000,
    autres_dettes: 1000000,
    
    // TOTAL ACTIF SIMULÉ = 25.000.000
    // TOTAL PASSIF SIMULÉ = 25.000.000 (8+5+4 + 3+5+5+1)

    // --- COMPTE DE RÉSULTAT (Classes 6, 7, 8) ---
    // Rubriques Par Nature (Liste)
    ventes_marchandises: 60000000, // CA HT
    achats_marchandises: 30000000,
    production_exercice: 15000000,
    consommations_externes: 8000000,
    charges_personnel: 10000000,
    impots_taxes: 2000000,
    
    produits_financiers: 1000000,
    charges_financieres: 500000,
    produits_hors_ao: 0,
    charges_hors_ao: 0,
    impots_sur_resultat: 1500000, // Impôt sur le Résultat (Résultat Net = 4.000.000)

    // Rubriques Par Fonction (pour l'analytique)
    chiffre_affaires_net: 60000000,
    cout_achats_revendus: 30000000,
    cout_production_vendue: 15000000,
    frais_commerciaux: 5000000,
    frais_administratifs: 5000000,
    autres_frais_fonctionnels: 1000000,

    // --- FLUX DE TRÉSORERIE (Mouvements de Trésorerie) ---
    tresorerie_ouverture: 500000,
    encaissements_clients: 55000000,
    decaissements_fournisseurs: 35000000,
    decaissements_personnel: 9000000,
    net_taxes_divers: 1000000, // Flux Opérationnel Net = 12.000.000
    
    acquisitions_immobilisations: 5000000,
    cessions_immobilisations: 1000000, // Flux Investissement Net = -4.000.000

    emission_actions: 3000000,
    nouveaux_emprunts: 1000000,
    remboursement_emprunts: 2000000,
    dividendes_verses: 1000000, // Flux Financement Net = 1.000.000
};

module.exports = {
    CONFIG_TEST,
    DATA_COMPTABLE_MOCK
};
