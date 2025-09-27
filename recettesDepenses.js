// src/modules/syscohada/minimal/recettesDepenses.js

/**
 * Génère l'état des recettes et dépenses selon le système minimal de trésorerie du SYSCOHADA révisé.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant }
 * @returns {Object} - Structure complète de l'état avec totaux et solde
 */
export function genererEtatRecettesDepenses(ecritures) {
  const recettes = filtrerParClasse(ecritures, [7]); // Produits (classe 7)
  const depenses = filtrerParClasse(ecritures, [6]); // Charges (classe 6)

  const totalRecettes = recettes.reduce((s, e) => s + e.montant, 0);
  const totalDepenses = depenses.reduce((s, e) => s + e.montant, 0);
  const solde = totalRecettes - totalDepenses;

  return {
    recettes: enrichirRubrique(recettes),
    depenses: enrichirRubrique(depenses),
    totalRecettes,
    totalDepenses,
    solde,
    excédent: solde > 0,
    déficit: solde < 0
  };
}

/**
 * Filtre les écritures selon la classe de comptes spécifiée.
 * @param {Array} ecritures
 * @param {Array} classes
 * @returns {Array}
 */
function filtrerParClasse(ecritures, classes) {
  return ecritures.filter(e => {
    const classe = parseInt(e.compte.toString().substring(0, 1));
    return classes.includes(classe);
  });
}

/**
 * Regroupe les lignes et calcule le total.
 * @param {Array} lignes
 * @returns {Object}
 */
function enrichirRubrique(lignes) {
  return {
    lignes,
    total: lignes.reduce((s, e) => s + e.montant, 0)
  };
}
