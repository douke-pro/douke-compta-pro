'use strict';

/**
 * ================================================================
 * BILAN SYSCOHADA — VERSION CORRIGÉE / UNIFIÉE
 * ================================================================
 * L'ancienne version de ce fichier était une SIMULATION : elle
 * attendait des champs inventés (dataComptable.immobilisations_*,
 * dataComptable.stocks, etc.) qui ne correspondent à aucune donnée
 * réelle de l'application, et ne respectait pas la nomenclature
 * officielle (refs AD, AI, AZ, BZ, CA...DZ).
 *
 * Cette version délègue entièrement le calcul au moteur unique et
 * validé `services/syscohadaMapper.js`, qui travaille directement
 * à partir de la balance générale (comptes réels) et produit une
 * structure conforme à 99%+ au modèle officiel DGI (refs, libellés,
 * notes, totaux).
 *
 * Il n'y a donc plus qu'UNE SEULE source de vérité pour le Bilan
 * dans toute l'application (que ce soit via l'API /api/syscohada/bilan
 * ou via l'export global genererEtatsFinanciers).
 * ================================================================
 */

const { computeActif, computePassif } = require('../../services/syscohadaMapper');

/**
 * Génère le Bilan SYSCOHADA (Système Normal ou Minimal).
 *
 * @param {Array} balanceAccounts - Balance générale de l'exercice N
 *        (format attendu par syscohadaMapper : [{ code, opening_debit, opening_credit, debit, credit }])
 * @param {Array} prevYearBalances - Balance de clôture de l'exercice N-1 (mêmes champs)
 * @param {number} resultatNet - Résultat net de l'exercice (calculé par compteResultat.js)
 * @param {Object} config - { systeme: 'NORMAL' | 'MINIMAL', exercice, entrepriseId }
 * @returns {Object} { ACTIF: [...], PASSIF: [...], equilibre, ecart }
 */
function genererBilan(balanceAccounts, prevYearBalances, resultatNet, config) {
    if (!config || !config.systeme) {
        throw new Error("Bilan: configuration manquante (systeme requis).");
    }
    if (config.systeme !== 'NORMAL' && config.systeme !== 'MINIMAL') {
        throw new Error(`Bilan: le système '${config.systeme}' n'est pas pris en charge pour l'exercice ${config.exercice}.`);
    }

    const actif  = computeActif(balanceAccounts, prevYearBalances);
    const passif = computePassif(balanceAccounts, prevYearBalances, resultatNet);

    const totalActif  = actif.find(l  => l.ref === 'BZ')?.net || 0;
    const totalPassif = passif.find(l => l.ref === 'DZ')?.net || 0;
    const ecart = Math.abs(totalActif - totalPassif);

    // Le système MINIMAL affiche une présentation agrégée des mêmes
    // données (les rubriques détaillées restent disponibles pour audit).
    if (config.systeme === 'MINIMAL') {
        return {
            systeme: 'MINIMAL',
            ACTIF: actif.filter(l => l.isTotal),
            PASSIF: passif.filter(l => l.isTotal),
            detailComplet: { actif, passif },
            totaux: { total_actif: totalActif, total_passif: totalPassif, ecart, equilibre: ecart <= 1 },
        };
    }

    return {
        systeme: 'NORMAL',
        ACTIF: actif,
        PASSIF: passif,
        totaux: { total_actif: totalActif, total_passif: totalPassif, ecart, equilibre: ecart <= 1 },
    };
}

module.exports = { genererBilan };

