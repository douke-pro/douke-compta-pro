/**
 * sycebnlReportAdapter.js
 * =============================================================================
 * Transforme la sortie de sycebnlMapper.calculerEtatsFinanciers() dans le
 * format `reportData` attendu par pdfGenerator.js (même format que pour
 * SYSCOHADA : {ref, libelle, note, brut, amort, net, net_n1, isTotal} pour
 * l'actif ; {ref, libelle, note, net, net_n1, isTotal} pour le passif ;
 * {ref, sens, libelle, note, montant_n, montant_n1, isTotal} pour le compte
 * de résultat et le TFT).
 *
 * Ordre d'affichage et libellés des lignes de TOTAL vérifiés directement sur
 * les feuilles BILAN / RESULTAT / TFT du classeur officiel
 * LIASSE_MSG-SYCEBNL-AOP-Pro_V1.xlsm (les libellés des postes "leaf" sont
 * repris tels quels de la table de correspondance, déjà fidèle à la source).
 * =============================================================================
 */

'use strict';

const { calculerEtatsFinanciers, loadMapping } = require('./sycebnlMapper');

// Libellés des lignes de TOTAL / sous-total (absentes de la table de correspondance
// car ce sont des rollups, pas des postes pilotés par des comptes) :
const LIBELLES_ROLLUP = {
  AA: 'Immobilisations destinées à la vente provenant de dons et legs non reçus et usufruit temporaire',
  AD: 'Immobilisations incorporelles',
  AH: 'Immobilisations corporelles',
  AO: 'Immobilisations financières',
  AZ: 'TOTAL ACTIF IMMOBILISE',
  BT: 'TOTAL ACTIF CIRCULANT',
  BX: 'TOTAL TRESORERIE ACTIF',
  BZ: 'TOTAL GENERAL',
  CK: 'TOTAL FONDS PROPRES ET ASSIMILES',
  CY: 'TOTAL FONDS AFFECTES ET REPORTES',
  DV: 'TOTAL PASSIF CIRCULANT',
  DX: 'TOTAL TRESORERIE PASSIF',
  DZ: 'TOTAL GENERAL',
  XA: 'REVENUS DES ACTIVITES ORDINAIRES (Somme RA à RH)',
  XB: 'CHARGES DES ACTIVITES ORDINAIRES (Somme TA à TL)',
  XC: 'RESULTAT DES ACTIVITES ORDINAIRES (XA - XB)',
  XD: 'RESULTAT H.A.O. (TM - TN)',
  XE: "RÉSULTAT NET DE L'EXERCICE (excédent + ou déficit -)",
  ZA: 'Trésorerie nette au 1er janvier',
  ZB: 'Flux net de trésorerie provenant des activités opérationnelles',
  ZC: "Flux net de trésorerie provenant des activités d'investissement",
  ZD: 'Flux net de trésorerie provenant des activités de financement',
  ZE: 'Flux net de trésorerie provenant des activités de financement (2)',
  ZF: 'Flux net total de trésorerie',
  ZG: 'Trésorerie nette de clôture',
};

// Ordre d'affichage exact des lignes ACTIF / PASSIF (vérifié sur la feuille BILAN) :
const ORDRE_ACTIF = ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AX', 'AY', 'AZ', 'BA', 'BB', 'BC', 'BD', 'BE', 'BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ'];
const TOTAUX_ACTIF = new Set(['AA', 'AD', 'AH', 'AO', 'AZ', 'BT', 'BX', 'BZ']);

const ORDRE_PASSIF = ['CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CW', 'CX', 'CY', 'DA', 'DB', 'DC', 'DF', 'DG', 'DH', 'DI', 'DV', 'DW', 'DX', 'DY', 'DZ'];
const TOTAUX_PASSIF = new Set(['CK', 'CY', 'DV', 'DX', 'DZ']);

const ORDRE_RESULTAT = ['RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH', 'XA', 'TA', 'TB', 'TC', 'TD', 'TE', 'TF', 'TG', 'TH', 'TI', 'TJ', 'TK', 'TL', 'XB', 'XC', 'TM', 'TN', 'XD', 'XE'];
const TOTAUX_RESULTAT = new Set(['XA', 'XB', 'XC', 'XD', 'XE']);
const SENS_RESULTAT = new Set(['TA', 'TB', 'TC', 'TD', 'TE', 'TF', 'TG', 'TH', 'TI', 'TJ', 'TK', 'TL', 'TN']); // lignes de charge (affichées en négatif)

const ORDRE_TFT = ['ZA', 'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG', 'FH', 'ZB', 'FI', 'FJ', 'FK', 'FL', 'ZC', 'FM', 'FN', 'FO', 'ZD', 'FP', 'FQ', 'ZE', 'ZF', 'ZG'];
const TOTAUX_TFT = new Set(['ZA', 'ZB', 'ZC', 'ZD', 'ZE', 'ZF', 'ZG']);

let _libelleCache = null;
function getLibelle(etat, code) {
  if (LIBELLES_ROLLUP[code]) return LIBELLES_ROLLUP[code];
  if (!_libelleCache) {
    _libelleCache = {};
    for (const row of loadMapping()) {
      if (row.nature === 'POSTE') {
        _libelleCache[`${row.etat}:${row.code_poste}`] = (row.libelle_poste || '').replace(/_x000D_\n/g, ' ').trim();
      }
    }
  }
  return _libelleCache[`${etat}:${code}`] || code;
}

/**
 * @param {Array} balanceN     Balance comptable de l'exercice N
 * @param {Array} [balanceN1]  Balance comptable de l'exercice N-1 (optionnelle)
 * @param {Object} meta        { company: {name, street, city, zip}, period: {start, end} }
 * @returns {Object} reportData au format attendu par pdfGenerator.js
 */
function buildReportData(balanceN, balanceN1, meta = {}) {
  const etatsN = calculerEtatsFinanciers(balanceN, balanceN1);
  const etatsN1 = balanceN1 && balanceN1.length ? calculerEtatsFinanciers(balanceN1, []) : null;

  // ---- BILAN ACTIF -----------------------------------------------------------
  const actifLignes = ORDRE_ACTIF.map((code) => {
    const isTotal = TOTAUX_ACTIF.has(code);
    const poste = etatsN.actif[code] || { brut: 0, amortissement: 0, net: 0 };
    const posteN1 = etatsN1 ? (etatsN1.actif[code] || { net: 0 }) : { net: undefined };
    return {
      ref: code,
      libelle: getLibelle('ACTIF_BRUT', code),
      note: '',
      brut: isTotal ? undefined : poste.brut,
      amort: isTotal ? undefined : poste.amortissement,
      net: poste.net,
      net_n1: posteN1.net,
      isTotal,
    };
  });

  // ---- BILAN PASSIF -----------------------------------------------------------
  const passifLignes = ORDRE_PASSIF.map((code) => {
    const isTotal = TOTAUX_PASSIF.has(code);
    const net = etatsN.passif[code] !== undefined ? etatsN.passif[code] : 0;
    const net_n1 = etatsN1 ? (etatsN1.passif[code] !== undefined ? etatsN1.passif[code] : 0) : undefined;
    return { ref: code, libelle: getLibelle('PASSIF', code), note: '', net, net_n1, isTotal };
  });

  const equilibre = Math.round(etatsN.actif.BZ.net) === Math.round(etatsN.passif.DZ);

  // ---- COMPTE DE RESULTAT ------------------------------------------------------
  const resultatLignes = ORDRE_RESULTAT.map((code) => {
    const isTotal = TOTAUX_RESULTAT.has(code);
    const montant_n = etatsN.resultat[code] !== undefined ? etatsN.resultat[code] : 0;
    const montant_n1 = etatsN1 ? (etatsN1.resultat[code] !== undefined ? etatsN1.resultat[code] : 0) : undefined;
    return {
      ref: code,
      sens: SENS_RESULTAT.has(code) ? '-' : (code.startsWith('R') ? '+' : ''),
      libelle: getLibelle('RESULTAT', code),
      note: '',
      montant_n,
      montant_n1,
      isTotal,
    };
  });

  // ---- TFT ---------------------------------------------------------------------
  const tftLignes = ORDRE_TFT.map((code) => {
    const isTotal = TOTAUX_TFT.has(code);
    const montant_n = etatsN.tft[code] !== undefined ? etatsN.tft[code] : 0;
    return {
      ref: code,
      sens: code.startsWith('F') && ['FF', 'FG', 'FH', 'FI', 'FJ', 'FO', 'FQ'].includes(code) ? '-' : '',
      libelle: getLibelle('TFT', code),
      montant_n,
      isTotal,
    };
  });

  return {
    company: meta.company || {},
    period: meta.period || {},
    bilan: {
      actif: actifLignes,
      passif: passifLignes,
      totaux: { equilibre },
    },
    compte_resultat: {
      lignes: resultatLignes,
      resultat_net: etatsN.resultat.XE,
    },
    tft: {
      lignes: tftLignes,
      tresorerie_finale: etatsN.tft.ZG,
    },
    // annexes : à construire séparément si besoin (structure différente, pas
    // couverte par calculerEtatsFinanciers) — omis ici, pdfGenerator.js gère
    // déjà l'absence de reportData.annexes (if (reportData.annexes) ...).
    _avertissements: etatsN.avertissements, // conservé pour affichage/log, pas utilisé par pdfGenerator
  };
}

module.exports = { buildReportData };

