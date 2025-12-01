// Importe les modules de calcul de la couche 'compta'
const { genererBilan } = require('../compta/bilan');
const { genererCR } = require('../compta/compteResultat');
const { genererTFT } = require('../compta/fluxTresorerie');
const { genererNotesAnnexes } = require('../compta/notesAnnexes');
const { calculerRatios } = require('../calculs/calculsFinanciers'); // Importe les utilitaires

/**
 * Interface de Configuration de l'Entreprise et de l'Exercice (inclut gestion de la hiérarchie).
 * @typedef {Object} Config
 * @property {string} entrepriseId - ID de l'entreprise gérée.
 * @property {string} systeme - 'NORMAL' ou 'MINIMAL' (SYSCOHADA).
 * @property {number} exercice - Année de l'exercice comptable.
 * @property {string} utilisateurRole - Rôle pour la sécurité et la hiérarchie (ex: 'ADMIN', 'COMPTABLE', 'AUDITEUR').
 */

/**
 * Génère l'ensemble des états financiers (Bilan, CR, TFT, Notes) conformément au SYSCOHADA révisé.
 * Ce fichier est le seul point d'entrée pour la future API sécurisée.
 * * @param {Object} dataComptable - Toutes les données brutes nécessaires, incluant potentiellement la Classe 9 (Analytique).
 * @param {Config} config - L'objet de configuration de l'entreprise et de l'exercice.
 * @returns {Object} Un conteneur incluant tous les rapports structurés.
 */
function genererEtatsFinanciers(dataComptable, config) {
    // 1. Validation de l'Accès et de la Configuration (Simulé, mais essentiel)
    if (!config || !config.systeme || !config.exercice || !config.entrepriseId || !config.utilisateurRole) {
        throw new Error("ERR_CONFIG: Configuration d'entreprise, d'exercice ou de rôle utilisateur invalide.");
    }
    // * Simuler ici la vérification des droits : si l'utilisateur est 'AUDITEUR', il ne peut que lire.

    // 2. Génération des États Primaires (Bilan et CR en premier)
    const bilan = genererBilan(dataComptable, config);
    const compteResultat = genererCR(dataComptable, config);

    // 3. Génération des États Secondaires (dépendent souvent des primaires)
    const fluxTresorerie = genererTFT(dataComptable, config);
    const notesAnnexes = genererNotesAnnexes(dataComptable, config);

    // 4. Calculs Analytiques et Utilitaires
    const ratios = calculerRatios(bilan, compteResultat, config);
    // const tafire = genererTAFIRE(dataComptable, config); // À implémenter si nécessaire

    // 5. Retour de l'ensemble des états avec les métadonnées de l'entreprise
    return {
        metadata: {
            ...config,
            dateGeneration: new Date().toISOString(),
        },
        bilan: bilan,
        compteResultat: compteResultat,
        fluxTresorerie: fluxTresorerie,
        notesAnnexes: notesAnnexes,
        ratiosFinanciers: ratios,
        // ... autres états
    };
}

// Expose la fonction maîtresse pour le reste de l'application (Front-end ou API)
module.exports = { genererEtatsFinanciers };
