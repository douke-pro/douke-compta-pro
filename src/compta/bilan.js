/**
 * Logique de génération du Bilan pour le système SYSCOHADA NORMAL.
 * Intègre toutes les rubriques détaillées de l'Actif et du Passif.
 * * NOTE: Les formules de calcul ci-dessous sont SIMULÉES (ex: dataComptable.Stocks)
 * et doivent être remplacées par votre logique d'agrégation précise des comptes (Classes 1, 2, 3, 4, 5).
 * * @param {Object} dataComptable - Les données brutes des comptes de l'entreprise.
 * @returns {Object} Le Bilan structuré au format Normal.
 */
function genererBilanNormal(dataComptable) {
    const ACTIF = {
        // --- ACTIF IMMOBILISÉ ---
        immobilisationsIncorporelles: dataComptable.immobilisations_incorporelles, // Rubrique
        immobilisationsCorporelles: dataComptable.immobilisations_corporelles,     // Rubrique
        immobilisationsFinancieres: dataComptable.immobilisations_financieres,     // Rubrique
        totalActifImmobilise: dataComptable.immobilisations_incorporelles + dataComptable.immobilisations_corporelles + dataComptable.immobilisations_financieres,

        // --- ACTIF CIRCULANT ---
        stocks: dataComptable.stocks,                                              // Rubrique (Classes 3)
        creancesClients: dataComptable.creances_clients,                           // Rubrique
        autresCreances: dataComptable.autres_creances_circulantes,                 // Rubrique
        tresorerieActif: dataComptable.banques_caisses,                            // Rubrique (Classes 5)
        totalActifCirculant: dataComptable.stocks + dataComptable.creances_clients + dataComptable.autres_creances_circulantes + dataComptable.banques_caisses,

        // --- TOTAL GÉNÉRAL ---
        totalGeneralActif: (dataComptable.immobilisations_incorporelles + dataComptable.immobilisations_corporelles + dataComptable.immobilisations_financieres) +
                           (dataComptable.stocks + dataComptable.creances_clients + dataComptable.autres_creances_circulantes + dataComptable.banques_caisses),
    };

    const PASSIF = {
        // --- CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES ---
        capitauxPropriete: dataComptable.capital_social,                           // Rubrique (Classe 1)
        reserves: dataComptable.reserves,                                          // Rubrique
        resultatNetExercice: dataComptable.resultat_net,                           // Résultat du CR
        totalCapitauxPropres: dataComptable.capital_social + dataComptable.reserves + dataComptable.resultat_net,

        // --- DETTES ET RESSOURCES ASSIMILÉES ---
        amortissementsProvisions: dataComptable.amortissements_provisions,
        dettesFinancieres: dataComptable.emprunts,                                 // Rubrique
        dettesFournisseurs: dataComptable.dettes_fournisseurs,                     // Rubrique (Classe 4)
        autresDettes: dataComptable.autres_dettes,                                 // Rubrique
        totalDettes: dataComptable.amortissements_provisions + dataComptable.emprunts + dataComptable.dettes_fournisseurs + dataComptable.autres_dettes,

        // --- TOTAL GÉNÉRAL ---
        totalGeneralPassif: ACTIF.totalGeneralActif, // L'actif doit toujours être égal au passif
    };

    return { ACTIF, PASSIF };
}

/**
 * Logique de génération du Bilan pour le système SYSCOHADA MINIMAL.
 * Rubriques beaucoup plus agrégées pour une présentation simplifiée.
 * * @param {Object} dataComptable - Les données brutes des comptes de l'entreprise.
 * @returns {Object} Le Bilan structuré au format Minimal.
 */
function genererBilanMinimal(dataComptable) {
    const ACTIF = {
        immobilisations: dataComptable.totalActifImmobilise,
        stocksCreances: dataComptable.stocks + dataComptable.creances_clients + dataComptable.autres_creances_circulantes,
        tresorerie: dataComptable.banques_caisses,
        totalGeneralActif: dataComptable.totalActifImmobilise + dataComptable.stocks + dataComptable.creances_clients + dataComptable.autres_creances_circulantes + dataComptable.banques_caisses,
    };

    const PASSIF = {
        capitauxPropres: dataComptable.totalCapitauxPropres,
        dettes: dataComptable.totalDettes,
        totalGeneralPassif: ACTIF.totalGeneralActif,
    };

    return { ACTIF, PASSIF };
}


/**
 * Point d'entrée unique du module Bilan. Gère l'aiguillage en fonction de la configuration.
 * * @param {Object} dataComptable - Les comptes (Classes 1 à 5) et leurs montants.
 * @param {Object} config - La configuration (doit contenir config.systeme, exercice, etc.).
 * @returns {Object} Le Bilan structuré selon le format SYSCOHADA requis.
 */
function genererBilan(dataComptable, config) {
    if (config.systeme === 'NORMAL') {
        return genererBilanNormal(dataComptable);
    } else if (config.systeme === 'MINIMAL') {
        return genererBilanMinimal(dataComptable);
    } else {
        throw new Error(`Bilan: Le système '${config.systeme}' n'est pas pris en charge pour l'exercice ${config.exercice}.`);
    }
}

module.exports = { genererBilan };
