// src/modules/syscohada/normal/bilan.js

/**
 * Génère le bilan comptable selon le système normal du SYSCOHADA révisé.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant }
 * @returns {Object} - Structure complète du bilan avec totaux et équilibre
 */
export function genererBilan(ecritures) {
  const actif = {
    immobilisationsIncorporelles: filtrerParClasse(ecritures, [20]),
    immobilisationsCorporelles: filtrerParClasse(ecritures, [21]),
    immobilisationsFinancières: filtrerParClasse(ecritures, [22]),
    stocks: filtrerParClasse(ecritures, [30, 31, 32, 33, 34, 35]),
    créancesClients: filtrerParClasse(ecritures, [41]),
    autresCréances: filtrerParClasse(ecritures, [42, 43, 44, 45]),
    trésorerieActif: filtrerParClasse(ecritures, [50, 51, 52])
  };

  const passif = {
    capitauxPropres: filtrerParClasse(ecritures, [10, 11, 12, 13, 14]),
    provisions: filtrerParClasse(ecritures, [15, 16, 17]),
    empruntsEtDettesFinancières: filtrerParClasse(ecritures, [60, 61]),
    dettesFournisseurs: filtrerParClasse(ecritures, [40]),
    autresDettes: filtrerParClasse(ecritures, [62, 63, 64, 65]),
    trésoreriePassif: filtrerParClasse(ecritures, [53, 54])
  };

  const totalActif = sommeRubriques(actif);
  const totalPassif = sommeRubriques(passif);

  return {
    actif: enrichirRubriques(actif),
    passif: enrichirRubriques(passif),
    totalActif,
    totalPassif,
    equilibre: totalActif === totalPassif
  };
}

/**
 * Filtre les écritures selon les classes de comptes spécifiées.
 * @param {Array} ecritures
 * @param {Array} classes
 * @returns {Array}
 */
function filtrerParClasse(ecritures, classes) {
  return ecritures.filter(e => {
    const classe = parseInt(e.compte.toString().substring(0, 2));
    return classes.includes(classe);
  });
}

/**
 * Calcule la somme totale des montants pour chaque rubrique.
 * @param {Object} rubriques
 * @returns {Number}
 */
function sommeRubriques(rubriques) {
  return Object.values(rubriques).reduce((total, rubrique) => {
    return total + rubrique.reduce((s, e) => s + e.montant, 0);
  }, 0);
}

/**
 * Enrichit chaque rubrique avec son total individuel.
 * @param {Object} rubriques
 * @returns {Object}
 */
function enrichirRubriques(rubriques) {
  const enrichi = {};
  for (const [cle, liste] of Object.entries(rubriques)) {
    enrichi[cle] = {
      lignes: liste,
      total: liste.reduce((s, e) => s + e.montant, 0)
    };
  }
  return enrichi;
}
