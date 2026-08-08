'use strict';

/**
 * ================================================================
 * TABLEAU DES FLUX DE TRÉSORERIE (TFT) SYSCOHADA
 * ================================================================
 * NOTE : ce fichier était importé par `src/exports/syscohadaExports.js`
 * (`require('../compta/fluxTresorerie')`) mais n'existait pas dans le
 * code fourni — ce qui aurait provoqué une erreur "Cannot find module"
 * au premier appel de `genererEtatsFinanciers`. Il est ajouté ici pour
 * que le point d'entrée unifié fonctionne, en s'appuyant sur le même
 * moteur que l'API (`services/syscohadaMapper.js`), CAFG corrigée
 * comprise (cf. commentaires dans syscohadaMapper.js).
 * ================================================================
 */

const { computeTFT } = require('../../services/syscohadaMapper');

/**
 * @param {Array} balanceAccounts - Balance générale de l'exercice N
 * @param {Object} bilanN - { actif, passif, resultat } de l'exercice N (déjà calculés)
 * @param {Object} bilanN1 - { actif, passif } de l'exercice N-1 (déjà calculés)
 * @param {Object} config - { systeme, exercice, entrepriseId }
 * @returns {Object} { lignes: [...], tresorerie_finale }
 */
function genererTFT(balanceAccounts, bilanN, bilanN1, config) {
    if (!config || !config.systeme) {
        throw new Error("TFT: configuration manquante (systeme requis).");
    }
    const lignes = computeTFT(balanceAccounts, bilanN, bilanN1);
    return {
        systeme: config.systeme,
        lignes,
        tresorerie_finale: lignes.find(l => l.ref === 'ZH')?.montant_n || 0,
    };
}

module.exports = { genererTFT };

