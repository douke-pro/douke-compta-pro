// Les objets Bilan et Compte de Résultat générés précédemment sont les entrées de cette fonction.

/**
 * Calcule une série de ratios financiers clés basés sur les états financiers générés.
 * * @param {Object} bilan - Le Bilan généré (rubriques Actif/Passif).
 * @param {Object} compteResultat - Le Compte de Résultat généré (rubriques Par Nature/Liste).
 * @param {Object} config - La configuration de l'entreprise.
 * @returns {Object} Les ratios calculés et formatés.
 */
function calculerRatios(bilan, compteResultat, config) {
    const R_NET = compteResultat.resultatNetFinal || 0;
    const CA_HT = compteResultat.presentationListe.rubriques.ventes_marchandises || 1; // Éviter division par zéro
    const CP = bilan.PASSIF.totalCapitauxPropres || 1;
    const AI = bilan.ACTIF.totalActifImmobilise || 1;
    const AC = bilan.ACTIF.totalActifCirculant || 1;
    const DT = bilan.PASSIF.totalDettes || 1;

    let ratios = {};

    try {
        // --- RATIOS DE RENTABILITÉ ---
        ratios.rentabiliteNette = (R_NET / CA_HT) * 100;
        ratios.rentabiliteFondsPropres = (R_NET / CP) * 100;

        // --- RATIOS DE STRUCTURE ET D'AUTONOMIE ---
        ratios.autonomieFinanciere = (CP / bilan.PASSIF.totalGeneralPassif) * 100;
        ratios.couvertureImmobilisations = (CP / AI);

        // --- RATIOS DE LIQUIDITÉ ---
        ratios.liquiditeGenerale = (AC / DT);
        // ratios.liquiditeImmediate = (Trésorerie Actif / Dettes à court terme)

        // --- FORMATAGE ET MÉTADONNÉES ---
        ratios = Object.fromEntries(
            Object.entries(ratios).map(([key, value]) => [key, parseFloat(value.toFixed(2))])
        );

        return {
            systeme: config.systeme,
            ratios: ratios,
            commentaire: "Les ratios sont calculés à partir des rubriques du Bilan/CR générés.",
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
