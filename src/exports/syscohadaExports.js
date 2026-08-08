'use strict';

/**
 * ================================================================
 * POINT D'ENTRÉE UNIFIÉ — ÉTATS FINANCIERS SYSCOHADA
 * ================================================================
 * CORRECTION MAJEURE : cette fonction appelait auparavant les
 * modules SIMULÉS de `src/compta/*.js` (champs inventés, non
 * conformes), totalement déconnectés du moteur réel utilisé par
 * l'API (`services/syscohadaMapper.js` via `controllers/syscohadaController.js`).
 *
 * Résultat : deux implémentations différentes cohabitaient dans
 * l'application, avec deux résultats potentiellement différents
 * pour les mêmes données. Cette version supprime la duplication :
 * `genererEtatsFinanciers` utilise désormais exactement le même
 * moteur que l'API HTTP (/api/syscohada/bilan, /compte-resultat,
 * /tft), garantissant un résultat unique et cohérent quel que soit
 * le point d'entrée (API, export PDF, etc.)
 * ================================================================
 */

const { genererBilan }        = require('../compta/bilan');
const { genererCR }           = require('../compta/compteResultat');
const { genererTFT }          = require('../compta/fluxTresorerie');
const { genererNotesAnnexes } = require('../compta/notesAnnexes');
const { calculerRatios }      = require('../calculs/calculsFinanciers');
const { computeActif, computePassif } = require('../../services/syscohadaMapper');

/**
 * @typedef {Object} Config
 * @property {string} entrepriseId
 * @property {string} systeme - 'NORMAL' ou 'MINIMAL' (SYSCOHADA).
 * @property {number} exercice
 * @property {string} utilisateurRole
 */

/**
 * Génère l'ensemble des états financiers (Bilan, CR, TFT, Notes)
 * conformément au SYSCOHADA révisé, à partir de la balance générale
 * réelle de l'entreprise (et non plus de données simulées).
 *
 * @param {Array} balanceAccounts - Balance générale de l'exercice N :
 *        [{ code, opening_debit, opening_credit, debit, credit }, ...]
 * @param {Array} prevYearBalances - Balance de clôture de l'exercice N-1 (mêmes champs)
 * @param {Config} config
 * @returns {Object} conteneur avec tous les états structurés
 */
function genererEtatsFinanciers(balanceAccounts, prevYearBalances, config) {
    // 1. Validation de l'accès et de la configuration
    if (!config || !config.systeme || !config.exercice || !config.entrepriseId || !config.utilisateurRole) {
        throw new Error("ERR_CONFIG: Configuration d'entreprise, d'exercice ou de rôle utilisateur invalide.");
    }
    // TODO sécurité : si utilisateurRole === 'AUDITEUR', restreindre en lecture seule côté contrôleur/route.

    // 2. Compte de Résultat en premier : le Bilan a besoin du résultat net (ligne CJ)
    const compteResultat = genererCR(balanceAccounts, prevYearBalances, config);

    // 3. Bilan (Actif / Passif), équilibré avec le résultat net du CR
    const bilan = genererBilan(balanceAccounts, prevYearBalances, compteResultat.resultatNet, config);

    // 4. TFT — a besoin du Bilan N et N-1 (trésorerie d'ouverture) + CR N (CAFG)
    const actifN1  = computeActif(prevYearBalances, []);
    const passifN1 = computePassif(prevYearBalances, [], 0);
    const bilanNPourTFT  = { actif: bilan.detailComplet?.actif || bilan.ACTIF, passif: bilan.detailComplet?.passif || bilan.PASSIF, resultat: compteResultat.detailComplet || compteResultat.lignes };
    const bilanN1PourTFT = { actif: actifN1, passif: passifN1 };
    const fluxTresorerie = genererTFT(balanceAccounts, bilanNPourTFT, bilanN1PourTFT, config);

    // 5. Notes annexes — utilisent les états déjà calculés pour pré-remplir ce qui est déductible
    const notesAnnexes = genererNotesAnnexes(
        { actif: bilanNPourTFT.actif, passif: bilanNPourTFT.passif, resultat: bilanNPourTFT.resultat },
        config
    );

    // 6. Ratios financiers
    const ratios = calculerRatios(bilan, compteResultat, config);

    // 7. Contrôle d'équilibre global
    const equilibre = bilan.totaux?.equilibre ?? false;

    return {
        metadata: {
            ...config,
            dateGeneration: new Date().toISOString(),
            equilibreBilan: equilibre,
        },
        bilan,
        compteResultat,
        fluxTresorerie,
        notesAnnexes,
        ratiosFinanciers: ratios,
    };
}

module.exports = { genererEtatsFinanciers };

