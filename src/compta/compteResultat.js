/**
 * Constantes pour la classification des rubriques (simulées)
 */
const RESULTAT_NET_FORMULE = (data) => data.produits_exploitation + data.produits_financiers + data.produits_hors_activite_ordinaire - 
                                          (data.charges_exploitation + data.charges_financieres + data.charges_hors_activite_ordinaire);


/**
 * 1. Présentation en Liste (Par Nature) - Standard pour le SYSCOHADA
 * * @param {Object} dataComptable - Les données brutes des comptes (Classes 6 à 8).
 * @returns {Object} Le Compte de Résultat structuré en Liste.
 */
function genererCRListe(dataComptable) {
    // Calculs Intermédiaires clés (Rubriques)
    const MARGE_COMMERCIALE = dataComptable.ventes_marchandises - dataComptable.achats_marchandises;
    const VALEUR_AJOUTEE = MARGE_COMMERCIALE + dataComptable.production_exercice - dataComptable.consommations_externes;
    const EBE = VALEUR_AJOUTEE + dataComptable.subventions_exploitation - dataComptable.charges_personnel - dataComptable.impots_taxes;
    
    // Rubriques Principales (Résultats)
    const RESULTAT_EXPLOITATION = EBE + dataComptable.autres_produits_exploitation - dataComptable.autres_charges_exploitation;
    const RESULTAT_FINANCIER = dataComptable.produits_financiers - dataComptable.charges_financieres;
    const RESULTAT_AHO = dataComptable.produits_hors_ao - dataComptable.charges_hors_ao; // AHO = Activités Hors Ordinaire
    const RESULTAT_NET = RESULTAT_EXPLOITATION + RESULTAT_FINANCIER + RESULTAT_AHO - dataComptable.impots_sur_resultat;

    return {
        type: 'Compte de Résultat (Liste - Par Nature)',
        rubriques: {
            margeCommerciale: MARGE_COMMERCIALE,
            valeurAjoutee: VALEUR_AJOUTEE,
            excedentBrutExploitation: EBE,
            resultatExploitation: RESULTAT_EXPLOITATION,
            resultatFinancier: RESULTAT_FINANCIER,
            resultatAHO: RESULTAT_AHO,
            impots: dataComptable.impots_sur_resultat,
        },
        resultatNet: RESULTAT_NET,
    };
}

/**
 * 2. Présentation Par Fonction - Complément Analytique
 * * @param {Object} dataComptable - Les données brutes des comptes (Classes 6 à 8 et 9 si disponible).
 * @returns {Object} Le Compte de Résultat structuré par Fonction.
 */
function genererCRFonction(dataComptable) {
    // Les données sont agrégées ici par les fonctions de l'entreprise (vente, administration, production)
    const COUT_VENTES = dataComptable.cout_achats_revendus + dataComptable.cout_production_vendue;
    const MARGE_BRUTE = dataComptable.chiffre_affaires_net - COUT_VENTES;
    
    const CHARGES_PAR_FONCTION = {
        coutVentes: COUT_VENTES,
        fraisCommerciaux: dataComptable.frais_commerciaux,        // Fonction (souvent Classe 9 / Analytique)
        fraisAdministratifs: dataComptable.frais_administratifs,  // Fonction
        autresChargesFonctionnelles: dataComptable.autres_frais_fonctionnels,
    };
    
    const TOTAL_CHARGES_FONCTION = CHARGES_PAR_FONCTION.coutVentes + CHARGES_PAR_FONCTION.fraisCommerciaux + CHARGES_PAR_FONCTION.fraisAdministratifs + CHARGES_PAR_FONCTION.autresChargesFonctionnelles;
    
    const RESULTAT_OPERATIONNEL = MARGE_BRUTE - TOTAL_CHARGES_FONCTION;
    const RESULTAT_NET_FINAL = RESULTAT_OPERATIONNEL + (dataComptable.produits_financiers - dataComptable.charges_financieres) - dataComptable.impots_sur_resultat;

    return {
        type: 'Compte de Résultat (Par Fonction - Analytique)',
        rubriques: {
            chiffreAffairesNet: dataComptable.chiffre_affaires_net,
            margeBrute: MARGE_BRUTE,
            charges: CHARGES_PAR_FONCTION,
            resultatOperationnel: RESULTAT_OPERATIONNEL,
        },
        resultatNet: RESULTAT_NET_FINAL,
    };
}


/**
 * Point d'entrée unique du module Compte de Résultat.
 * Génère le CR en format Liste (standard légal) pour le système NORMAL, 
 * et une version agrégée simplifiée pour le MINIMAL.
 * * @param {Object} dataComptable - Les comptes (Classes 6 à 8) et leurs montants.
 * @param {Object} config - La configuration (doit contenir config.systeme, exercice, etc.).
 * @returns {Object} Le CR structuré selon le format SYSCOHADA requis, incluant les deux présentations.
 */
function genererCR(dataComptable, config) {
    const crListe = genererCRListe(dataComptable);
    
    if (config.systeme === 'NORMAL') {
        // En mode NORMAL, on fournit les deux structures pour l'analytique.
        const crFonction = genererCRFonction(dataComptable);
        
        return {
            systeme: 'NORMAL',
            presentationListe: crListe,
            presentationFonction: crFonction,
            resultatNetFinal: crListe.resultatNet,
        };
    } else if (config.systeme === 'MINIMAL') {
        // En mode MINIMAL, on agrège simplement les résultats de la liste standard.
        return {
            systeme: 'MINIMAL',
            presentationAggregee: {
                produitsTotaux: dataComptable.produits_totaux,
                chargesTotales: dataComptable.charges_totales,
                resultatNet: crListe.resultatNet,
            },
            resultatNetFinal: crListe.resultatNet,
        };
    } else {
        throw new Error(`Compte de Résultat: Le système '${config.systeme}' n'est pas pris en charge.`);
    }
}

module.exports = { genererCR };
