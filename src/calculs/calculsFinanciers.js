'use strict';

/**
 * ================================================================
 * RATIOS FINANCIERS — VERSION CORRIGÉE
 * ================================================================
 * L'ancienne version lisait des champs qui n'existaient que dans
 * la structure SIMULÉE (bilan.PASSIF.totalCapitauxPropres,
 * compteResultat.presentationListe.rubriques.ventes_marchandises...).
 * Avec le Bilan/CR réels basés sur syscohadaMapper.js, ces champs
 * n'existent plus : ce module aurait systématiquement renvoyé des
 * ratios à zéro ou une erreur silencieuse.
 *
 * Cette version lit directement les refs officiels (AZ, BK, CP, DA,
 * DD, DZ, XB, XI...) produits par computeActif/computePassif/computeResultat.
 * ================================================================
 */

function findNet(lignes, ref) {
    return lignes.find(l => l.ref === ref)?.net || 0;
}
function findMontant(lignes, ref) {
    return lignes.find(l => l.ref === ref)?.montant_n || 0;
}

/**
 * @param {Object} bilan - sortie de genererBilan (src/compta/bilan.js)
 * @param {Object} compteResultat - sortie de genererCR (src/compta/compteResultat.js)
 * @param {Object} config
 */
function calculerRatios(bilan, compteResultat, config) {
    const actif  = bilan.detailComplet?.actif  || bilan.ACTIF  || [];
    const passif = bilan.detailComplet?.passif || bilan.PASSIF || [];
    const lignesCR = compteResultat.detailComplet || compteResultat.lignes || [];

    const R_NET = compteResultat.resultatNet || 0;
    const CA_HT = findMontant(lignesCR, 'XB') || 1;           // Chiffre d'affaires (évite division par zéro)
    const CP    = findNet(passif, 'CP') || 1;                  // Total capitaux propres
    const AI    = findNet(actif, 'AZ') || 1;                   // Total actif immobilisé
    const AC    = findNet(actif, 'BK') || 1;                   // Total actif circulant
    const DT_fin = findNet(passif, 'DD') || 1;                 // Total dettes financières
    const DT_circ = findNet(passif, 'DP') || 1;                // Total passif circulant (dettes court terme)
    const totalGeneralPassif = findNet(passif, 'DZ') || 1;
    const tresorerieActif  = findNet(actif, 'BT') || 0;

    let ratios = {};

    try {
        // --- RATIOS DE RENTABILITÉ ---
        ratios.rentabiliteNette = (R_NET / CA_HT) * 100;
        ratios.rentabiliteFondsPropres = (R_NET / CP) * 100;

        // --- RATIOS DE STRUCTURE ET D'AUTONOMIE ---
        ratios.autonomieFinanciere = (CP / totalGeneralPassif) * 100;
        ratios.couvertureImmobilisations = (CP / AI);

        // --- RATIOS DE LIQUIDITÉ ---
        ratios.liquiditeGenerale = (AC / DT_circ);
        ratios.liquiditeImmediate = (tresorerieActif / DT_circ);

        // --- RATIO D'ENDETTEMENT ---
        ratios.endettementGlobal = ((DT_fin + DT_circ) / totalGeneralPassif) * 100;

        // --- FORMATAGE ---
        ratios = Object.fromEntries(
            Object.entries(ratios).map(([key, value]) => [key, Number.isFinite(value) ? parseFloat(value.toFixed(2)) : null])
        );

        return {
            systeme: config.systeme,
            ratios,
            commentaire: "Les ratios sont calculés à partir des rubriques réelles du Bilan/CR (moteur syscohadaMapper.js).",
        };

    } catch (e) {
        console.error("Erreur lors du calcul des ratios : ", e.message);
        return {
            systeme: config.systeme,
            ratios: { erreur: "Impossible de calculer les ratios (Données manquantes ou division par zéro)." },
        };
    }
}

module.exports = { calculerRatios };

