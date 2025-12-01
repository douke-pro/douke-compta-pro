/**
 * Logique de génération du TFT selon la Méthode Directe.
 * Elle se concentre sur les encaissements et décaissements bruts des trois activités.
 * * NOTE: Les montants agrégés (dataComptable.encaissements_clients, etc.) 
 * sont le résultat d'une analyse des mouvements de trésorerie (Classes 5) et des comptes de tiers.
 * * @param {Object} dataComptable - Les données brutes des mouvements de trésorerie.
 * @returns {Object} Le TFT structuré.
 */
function genererTFTMethodeDirecte(dataComptable) {
    // 1. FLUX DES ACTIVITÉS OPÉRATIONNELLES (Activités Courantes)
    const fluxOperationnel = {
        encaissementsClients: dataComptable.encaissements_clients,
        decaissementsFournisseurs: dataComptable.decaissements_fournisseurs,
        decaissementsPersonnel: dataComptable.decaissements_personnel,
        autresEncaissementsDecaissements: dataComptable.net_taxes_divers, // Encaissements - Décaissements pour TVA, impôts
        
        fluxNetOperationnel: dataComptable.encaissements_clients - dataComptable.decaissements_fournisseurs - 
                              dataComptable.decaissements_personnel + dataComptable.net_taxes_divers,
    };

    // 2. FLUX DES ACTIVITÉS D'INVESTISSEMENT (Acquisition/Cession d'Immobilisations)
    const fluxInvestissement = {
        decaissementsAcquisitionImmo: dataComptable.acquisitions_immobilisations,
        encaissementsCessionImmo: dataComptable.cessions_immobilisations,
        
        fluxNetInvestissement: dataComptable.cessions_immobilisations - dataComptable.acquisitions_immobilisations,
    };

    // 3. FLUX DES ACTIVITÉS DE FINANCEMENT (Capitaux Propres et Emprunts)
    const fluxFinancement = {
        encaissementsAugmentationCapital: dataComptable.emission_actions,
        encaissementsEmprunts: dataComptable.nouveaux_emprunts,
        decaissementsRemboursementEmprunts: dataComptable.remboursement_emprunts,
        decaissementsDividendes: dataComptable.dividendes_verses,

        fluxNetFinancement: dataComptable.emission_actions + dataComptable.nouveaux_emprunts - 
                              dataComptable.remboursement_emprunts - dataComptable.dividendes_verses,
    };

    // 4. Variation de Trésorerie
    const variationTresorerie = fluxOperationnel.fluxNetOperationnel + fluxInvestissement.fluxNetInvestissement + fluxFinancement.fluxNetFinancement;
    const tresorerieOuverture = dataComptable.tresorerie_ouverture; // Solde au 1er janvier
    const tresorerieCloture = tresorerieOuverture + variationTresorerie;

    return {
        methode: 'Directe',
        fluxOperationnel,
        fluxInvestissement,
        fluxFinancement,
        variationTresorerie,
        tresorerieOuverture,
        tresorerieCloture,
    };
}

/**
 * Point d'entrée unique du module Flux de Trésorerie.
 * * @param {Object} dataComptable - Les comptes de mouvements et soldes de trésorerie (Classes 5).
 * @param {Object} config - La configuration (doit contenir config.systeme, exercice, etc.).
 * @returns {Object} Le TFT structuré.
 */
function genererTFT(dataComptable, config) {
    const tftComplet = genererTFTMethodeDirecte(dataComptable);
    
    if (config.systeme === 'NORMAL') {
        // Le système NORMAL exige le TFT complet par activité.
        tftComplet.systeme = 'NORMAL';
        return tftComplet;
        
    } else if (config.systeme === 'MINIMAL') {
        // Le système MINIMAL peut exiger une présentation simplifiée/agrégée des flux.
        return {
            systeme: 'MINIMAL',
            methode: 'Directe (Agrégée)',
            fluxNetOperationnel: tftComplet.fluxOperationnel.fluxNetOperationnel,
            fluxNetInvestissement: tftComplet.fluxInvestissement.fluxNetInvestissement,
            fluxNetFinancement: tftComplet.fluxFinancement.fluxNetFinancement,
            tresorerieCloture: tftComplet.tresorerieCloture,
        };
    } else {
        throw new Error(`Flux de Trésorerie: Le système '${config.systeme}' n'est pas pris en charge.`);
    }
}

module.exports = { genererTFT };
