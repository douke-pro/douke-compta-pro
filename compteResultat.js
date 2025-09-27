// src/modules/syscohada/normal/compteResultat.js

/**
 * Génère le compte de résultat selon le système normal du SYSCOHADA révisé.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant }
 * @returns {Object} - Structure complète du compte de résultat avec totaux et résultat net
 */
export function genererCompteResultat(ecritures) {
  const produits = {
    exploitation: filtrerParClasse(ecritures, [70]),
    financiers: filtrerParClasse(ecritures, [76]),
    exceptionnels: filtrerParClasse(ecritures, [77])
  };

  const charges = {
    exploitation: filtrerParClasse(ecritures, [60, 61, 62, 63, 64, 65]),
    financiers: filtrerParClasse(ecritures, [66]),
    exceptionnels: filtrerParClasse(ecritures, [67]),
    impôt: filtrerParClasse(ecritures, [68])
  };

  const totalProduits = sommeRubriques(produits);
  const totalCharges = sommeRubriques(charges);
  const resultatNet = totalProduits - totalCharges;

  return {
    produits: enrichirRubriques(produits),
    charges: enrichirRubriques(charges),
    totalProduits,
    totalCharges,
    resultatNet,
    bénéfice: resultatNet > 0,
    perte: resultatNet < 0
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
