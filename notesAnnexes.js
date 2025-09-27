// src/modules/syscohada/normal/notesAnnexes.js

/**
 * Génère les notes annexes selon le système normal du SYSCOHADA révisé.
 * @param {Array} ecritures - Liste des écritures comptables avec { compte, montant, libellé }
 * @param {Object} options - Informations qualitatives fournies par l'utilisateur
 * @returns {String} - Contenu Markdown des notes annexes
 */
export function genererNotesAnnexes(ecritures, options = {}) {
  const tableaux = {
    immobilisations: filtrerParClasse(ecritures, [20, 21, 22]),
    amortissements: filtrerParClasse(ecritures, [28, 29]),
    provisions: filtrerParClasse(ecritures, [15, 16, 17]),
    dettes: filtrerParClasse(ecritures, [60, 61, 62, 63, 64, 65]),
    échéances: filtrerParClasse(ecritures, [41, 42, 43, 44, 45])
  };

  const markdown = [];

  markdown.push(`# Notes annexes`);
  markdown.push(`## Méthodes comptables`);
  markdown.push(options.methodes || "_À compléter par l'utilisateur._");

  markdown.push(`\n## Immobilisations`);
  markdown.push(formatTable(tableaux.immobilisations));

  markdown.push(`\n## Amortissements`);
  markdown.push(formatTable(tableaux.amortissements));

  markdown.push(`\n## Provisions`);
  markdown.push(formatTable(tableaux.provisions));

  markdown.push(`\n## Dettes et échéances`);
  markdown.push(formatTable(tableaux.dettes));
  markdown.push(`\n### Échéances à court et long terme`);
  markdown.push(formatTable(tableaux.échéances));

  markdown.push(`\n## Engagements hors bilan`);
  markdown.push(options.engagements || "_À compléter par l'utilisateur._");

  markdown.push(`\n## Événements postérieurs à la clôture`);
  markdown.push(options.evenements || "_À compléter par l'utilisateur._");

  return markdown.join('\n');
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
 * Formate un tableau Markdown à partir d'une liste d'écritures.
 * @param {Array} lignes
 * @returns {String}
 */
function formatTable(lignes) {
  if (!lignes.length) return "_Aucune donnée disponible._";

  const header = `| Compte | Libellé | Montant |\n|--------|---------|--------|`;
  const rows = lignes.map(e => `| ${e.compte} | ${e.libellé || ''} | ${e.montant.toFixed(2)} |`);
  return [header, ...rows].join('\n');
}
