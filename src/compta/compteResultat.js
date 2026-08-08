'use strict';

/**
 * ================================================================
 * COMPTE DE RÉSULTAT SYSCOHADA — VERSION CORRIGÉE / UNIFIÉE
 * ================================================================
 * Comme pour le Bilan, l'ancienne version simulait des champs
 * inventés (dataComptable.ventes_marchandises, .charges_personnel...)
 * sans lien avec la balance comptable réelle, et ne respectait pas
 * la nomenclature officielle (refs TA...XI).
 *
 * Cette version délègue le calcul à `services/syscohadaMapper.js`,
 * qui applique les formules officielles (Marge commerciale, CA,
 * Valeur Ajoutée, EBE, Résultat d'exploitation, financier, HAO,
 * Résultat net) vérifiées ligne à ligne contre le modèle DGI.
 * ================================================================
 */

const { computeResultat } = require('../../services/syscohadaMapper');

/**
 * Génère le Compte de Résultat SYSCOHADA (présentation en Liste,
 * seule présentation officielle du modèle DGI/SYSCOHADA révisé —
 * la présentation "par fonction" n'existe pas dans le modèle
 * réglementaire et a été retirée pour éviter toute confusion avec
 * un état non conforme).
 *
 * @param {Array} balanceAccounts - Balance générale de l'exercice N
 * @param {Array} prevYearBalances - Balance de clôture de l'exercice N-1
 * @param {Object} config - { systeme: 'NORMAL' | 'MINIMAL', exercice, entrepriseId }
 * @returns {Object} { systeme, lignes: [...], resultatNet, benefice }
 */
function genererCR(balanceAccounts, prevYearBalances, config) {
    if (!config || !config.systeme) {
        throw new Error("Compte de Résultat: configuration manquante (systeme requis).");
    }
    if (config.systeme !== 'NORMAL' && config.systeme !== 'MINIMAL') {
        throw new Error(`Compte de Résultat: le système '${config.systeme}' n'est pas pris en charge.`);
    }

    const lignes = computeResultat(balanceAccounts, prevYearBalances);
    const resultatNet = lignes.find(l => l.ref === 'XI')?.montant_n || 0;

    if (config.systeme === 'MINIMAL') {
        return {
            systeme: 'MINIMAL',
            lignes: lignes.filter(l => l.isTotal),
            detailComplet: lignes,
            resultatNet,
            benefice: resultatNet >= 0,
        };
    }

    return {
        systeme: 'NORMAL',
        lignes,
        resultatNet,
        benefice: resultatNet >= 0,
    };
}

module.exports = { genererCR };

