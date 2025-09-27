// src/modules/syscohada/minimal/bilanMinimal.js

/**
 * Génère le bilan minimal selon le système minimal SYSCOHADA.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant }
 * @returns {Object} - Structure simplifiée du bilan
 */
export function genererBilanMinimal(ecritures) {
  const actif = {
    immobilisations: filtrerParClasse(ecritures, [20, 21, 22]),
    créances: filtrerParClasse(ecritures, [41, 42, 43, 44, 45]),
    trésorerie: filtrerParClasse(ecritures, [50, 51, 52])
  };

  const passif = {
    dettes: filtrerParClasse(ecritures, [60, 61, 62, 63, 64, 65]),
    capitauxPropres: filtrerParClasse(ecritures, [10, 11, 12, 13, 14])
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

function filtrerParClasse(ecritures, classes) {
  return ecritures.filter(e => classes.includes(parseInt(e.compte.toString().substring(0, 2))));
}

function sommeRubriques(rubriques) {
  return Object.values(rubriques).reduce((total, liste) => {
    return total + liste.reduce((s, e) => s + e.montant, 0);
  }, 0);
}

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
