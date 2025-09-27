// src/modules/syscohada/normal/fluxTresorerie.js

/**
 * Génère le tableau des flux de trésorerie selon le système normal SYSCOHADA.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant }
 * @returns {Object} - Flux par activité + variation nette de trésorerie
 */
export function genererFluxTresorerie(ecritures) {
  const flux = {
    operationnels: filtrerParClasse(ecritures, [60, 61, 62, 63, 64, 65, 70]),
    investissement: filtrerParClasse(ecritures, [20, 21, 22, 23, 24, 25, 26, 27]),
    financement: filtrerParClasse(ecritures, [10, 11, 12, 13, 14, 16, 17, 60, 61])
  };

  const totalOp = somme(flux.operationnels);
  const totalInv = somme(flux.investissement);
  const totalFin = somme(flux.financement);
  const variation = totalOp + totalFin - totalInv;

  return {
    flux: enrichir(flux),
    totalOperationnels: totalOp,
    totalInvestissement: totalInv,
    totalFinancement: totalFin,
    variationTresorerie: variation
  };
}

function filtrerParClasse(data, classes) {
  return data.filter(e => classes.includes(parseInt(e.compte.toString().substring(0, 2))));
}

function somme(lignes) {
  return lignes.reduce((s, e) => s + e.montant, 0);
}

function enrichir(rubriques) {
  const result = {};
  for (const [cle, lignes] of Object.entries(rubriques)) {
    result[cle] = {
      lignes,
      total: somme(lignes)
    };
  }
  return result;
}
