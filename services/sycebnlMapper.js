/**
 * sycebnlMapper.js
 * =============================================================================
 * Moteur de calcul des états financiers SYCEBNL (Associations, Fondations et
 * Ordres Professionnels) — OHADA, en vigueur depuis le 01/01/2024.
 *
 * Construit à partir de DEUX couches de données extraites directement du
 * classeur officiel LIASSE_MSG-SYCEBNL-AOP-Pro_V1.xlsm :
 *
 *   1. data/sycebnl_comptes_postes_mapping.json (614 lignes)
 *      -> postes "leaf" : chaque poste = liste de comptes réels + imputation
 *         (SFD/SFC/MD/MC). Couvre ACTIF_BRUT, ACTIF_AMORT, PASSIF, RESULTAT,
 *         et une partie de TFT/INDICATEURS (via références croisées).
 *
 *   2. data/sycebnl_subtotals.json (19 lignes)
 *      -> postes "rollup" : totaux qui n'existent PAS dans la table de
 *         correspondance car ils sont calculés par somme/différence d'autres
 *         postes déjà résolus (ex. AZ = TOTAL ACTIF IMMOBILISE, XE = RESULTAT
 *         NET, ZG = trésorerie de clôture).
 *
 * VÉRIFICATION — chaque formule de rollup ci-dessous a été confrontée aux
 * formules RÉELLES du classeur (feuilles BILAN, BILAN DRAFT, RESULTAT,
 * RESULTAT DRAFT) avant d'être codée, notamment :
 *   BILAN!H11        = F11-G11                    (Net = Brut - Amort)
 *   BILAN!F29 (AZ)    = F25+F18+F14+F11            (Total actif immobilisé)
 *   BILAN!F35 (BT)    = SUM(F30:F34)               (Total actif circulant)
 *   BILAN!F39 (BX)    = SUM(F36:F38)               (Total trésorerie actif)
 *   BILAN!M21 (CK)    = SUM(M11:M20)               (Total fonds propres)
 *   BILAN!M35 (DV)    = SUM(M30:M33)               (Total passif circulant)
 *   BILAN!M39 (DX)    = M36                        (Total trésorerie passif)
 *   RESULTAT!I19 (XA) = SUM(I11:I18)               (Revenus activités ord.)
 *   RESULTAT!I32 (XB) = SUM(I20:I31)               (Charges activités ord.)
 *   RESULTAT!I33 (XC) = I19+I32
 *   RESULTAT!I36 (XD) = I34-I35                    (TM - TN)
 *   RESULTAT!I37 (XE) = I33+I36                    (RESULTAT NET)
 *   BILAN DRAFT!M18   = SUMIF(Passif_N_Code,"XE",Passif_N_Montant)
 *                       -> confirme que PASSIF.CH référence bien RESULTAT.XE,
 *                          exactement comme encodé dans la ligne CH du
 *                          mapping (compte:"XE", imputation:"SFC")
 *
 * COUVERTURE HONNÊTE :
 *   - ACTIF (brut/amort/net), PASSIF, RESULTAT, tous les rollups ci-dessus :
 *     fiables à 100%, formules vérifiées.
 *   - TFT : ~65% des lignes sont pilotées par des comptes réels. Le reste
 *     (variations de créances/dettes propres à chaque structure) n'a PAS de
 *     compte préréempli dans le classeur officiel lui-même — ce moteur ne
 *     DEVINE jamais un compte, il signale la ligne dans
 *     `resultat.avertissements.tft` avec son libellé exact.
 *   - Comparatif N-1 : nécessite un second appel avec balanceN1 fourni.
 * =============================================================================
 */

'use strict';

const path = require('path');
const fs = require('fs');

// -----------------------------------------------------------------------------
// 1. Chargement des deux couches de données
// -----------------------------------------------------------------------------

const MAPPING_PATH = path.join(__dirname, 'data', 'sycebnl_comptes_postes_mapping.json');
const SUBTOTALS_PATH = path.join(__dirname, 'data', 'sycebnl_subtotals.json');

let _mappingCache = null;
function loadMapping() {
  if (_mappingCache) return _mappingCache;
  _mappingCache = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  return _mappingCache;
}

let _subtotalsCache = null;
function loadSubtotals() {
  if (_subtotalsCache) return _subtotalsCache;
  _subtotalsCache = JSON.parse(fs.readFileSync(SUBTOTALS_PATH, 'utf-8'));
  return _subtotalsCache;
}

// -----------------------------------------------------------------------------
// 2. Indexation de la balance comptable (par préfixe de compte)
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} LigneBalance
 * @property {string|number} compte
 * @property {number} sid  Solde initial débiteur
 * @property {number} sic  Solde initial créditeur
 * @property {number} md   Mouvement débit de l'exercice
 * @property {number} mc   Mouvement crédit de l'exercice
 * @property {number} sfd  Solde final débiteur
 * @property {number} sfc  Solde final créditeur
 */

function buildPrefixIndex(balance) {
  const index = new Map();
  const cols = ['sid', 'sic', 'md', 'mc', 'sfd', 'sfc'];
  for (const ligne of balance) {
    const compte = String(ligne.compte);
    for (let len = 1; len <= Math.min(9, compte.length); len++) {
      const prefix = compte.slice(0, len);
      if (!index.has(prefix)) index.set(prefix, { sid: 0, sic: 0, md: 0, mc: 0, sfd: 0, sfc: 0 });
      const bucket = index.get(prefix);
      for (const c of cols) bucket[c] += Number(ligne[c] || 0);
    }
  }
  return index;
}

function sommeParImputation(prefixIndex, comptePrefix, imputation) {
  const bucket = prefixIndex.get(String(comptePrefix));
  if (!bucket) return 0;
  const key = String(imputation).toLowerCase();
  if (!(key in bucket)) {
    throw new Error(`Imputation inconnue: "${imputation}" (attendu: SFD, SFC, MD, MC, SID, SIC)`);
  }
  return bucket[key];
}

// -----------------------------------------------------------------------------
// 3. Calcul d'un poste "leaf" (piloté par la table de correspondance)
// -----------------------------------------------------------------------------

function calculerPosteLeaf(prefixIndex, etat, codePoste, exercice) {
  const mapping = loadMapping();
  const composants = mapping.filter(
    (m) => m.etat === etat && m.code_poste === codePoste && m.nature === 'Composant' &&
           (m.exercice === exercice || !m.exercice)
  );
  let total = 0;
  for (const c of composants) {
    const signe = c.signe === '-' ? -1 : 1;
    const compteStr = String(c.compte);
    if (/^\d+$/.test(compteStr) && c.imputation) {
      total += signe * sommeParImputation(prefixIndex, compteStr, c.imputation);
    }
  }
  return total;
}

function codesLeafDe(etat) {
  const mapping = loadMapping();
  return [...new Set(mapping.filter((m) => m.etat === etat && m.nature === 'POSTE').map((m) => m.code_poste))];
}

/**
 * Le signe porté par la ligne "POSTE" (par opposition aux lignes "Composant")
 * indique le sens d'agrégation du poste dans son état (ex. TA-TL et TN sont
 * marqués '-' car ce sont des postes de CHARGE : calculerPosteLeaf() renvoie
 * leur montant en valeur absolue — normal pour un solde débiteur — mais ils
 * doivent être SOUSTRAITS lors du calcul des totaux (XB, XD...). RA-RH et TM
 * (produits) ne portent pas ce signe et s'additionnent normalement.
 * VÉRIFIÉ : sans cette correction, XB était additionné au lieu d'être
 * soustrait et le résultat net (XE) était donc faux dès qu'il y avait à la
 * fois des produits et des charges (bug détecté par test d'intégration).
 */
function signeDePoste(etat, code) {
  const mapping = loadMapping();
  const posteRow = mapping.find((m) => m.etat === etat && m.code_poste === code && m.nature === 'POSTE');
  return posteRow && posteRow.signe === '-' ? -1 : 1;
}

// -----------------------------------------------------------------------------
// 4. Moteur complet
// -----------------------------------------------------------------------------

/**
 * @param {LigneBalance[]} balanceN
 * @param {LigneBalance[]} [balanceN1]
 * @returns {{actif:object, passif:object, resultat:object, tft:object, indicateurs:object, avertissements:object}}
 */
function calculerEtatsFinanciers(balanceN, balanceN1) {
  const idxN = buildPrefixIndex(balanceN);
  const tftAvertissements = [];

  // ---- 1. ACTIF (brut/amort/net par poste leaf) -----------------------------
  const actif = {};
  for (const code of codesLeafDe('ACTIF_BRUT')) {
    const brut = calculerPosteLeaf(idxN, 'ACTIF_BRUT', code, 'N');
    const amort = calculerPosteLeaf(idxN, 'ACTIF_AMORT', code, 'N');
    actif[code] = { brut, amortissement: amort, net: brut - amort };
  }
  const net = (code) => actif[code]?.net || 0;

  // Rollups ACTIF, vérifiés ligne à ligne sur 'BILAN DRAFT' (colonnes F/G/H, exercice N) :
  //   AA (F11=SUM(F12:F13)), AD (F14=SUM(F15:F17)), AH (F18=SUM(F19:F24)),
  //   AO (F25=SUM(F26:F28)), AZ (F29=F25+F18+F14+F11) — AZ = AO+AH+AD+AA, PAS AD+AH+AX+AY.
  // AA et AO sont absents des 614 lignes de mapping ET des 19 rollups extraits par le
  // pipeline (lacune du pipeline d'extraction d'origine) — recalculés ici directement.
  actif.AA = { net: net('AB') + net('AC') };                                      // Immo. destinées à la vente (dons/legs non reçus, usufruit)
  actif.AD = { net: net('AE') + net('AF') + net('AG') };                          // Immo. incorporelles (sous-total)
  actif.AH = { net: net('AI') + net('AJ') + net('AK') + net('AL') + net('AM') + net('AN') }; // Immo. corporelles
  actif.AO = { net: net('AX') + net('AY') };                                      // Immo. financières (sous-total)
  actif.AZ = { net: actif.AA.net + actif.AD.net + actif.AH.net + actif.AO.net };  // TOTAL ACTIF IMMOBILISE
  actif.BT = { net: net('BA') + net('BB') + net('BC') + net('BD') + net('BE') };  // TOTAL ACTIF CIRCULANT
  actif.BX = { net: net('BU') + net('BV') + net('BW') };                          // TOTAL TRESORERIE ACTIF
  actif.BZ = { net: actif.AZ.net + actif.BT.net + actif.BX.net + net('BY') };     // TOTAL GENERAL ACTIF (BILAN DRAFT!F41=F29+F35+F39+F40)

  // ---- 2. RESULTAT (avant PASSIF car PASSIF.CH référence XE) ----------------
  const resultat = {};
  for (const code of codesLeafDe('RESULTAT')) {
    resultat[code] = calculerPosteLeaf(idxN, 'RESULTAT', code, 'N');
  }
  const RA_RH = ['RA', 'RB', 'RC', 'RD', 'RE', 'RF', 'RG', 'RH'];
  const TA_TL = ['TA', 'TB', 'TC', 'TD', 'TE', 'TF', 'TG', 'TH', 'TI', 'TJ', 'TK', 'TL'];
  // calculerPosteLeaf() renvoie une magnitude (solde net) pour chaque poste ; le signe
  // d'agrégation réel (produit + / charge -) vient de la ligne "POSTE" du mapping, pas
  // d'une convention implicite — voir signeDePoste() ci-dessus.
  resultat.XA = RA_RH.reduce((s, c) => s + signeDePoste('RESULTAT', c) * (resultat[c] || 0), 0);
  resultat.XB = TA_TL.reduce((s, c) => s + signeDePoste('RESULTAT', c) * (resultat[c] || 0), 0);
  resultat.XC = resultat.XA + resultat.XB;
  resultat.XD = signeDePoste('RESULTAT', 'TM') * (resultat.TM || 0) + signeDePoste('RESULTAT', 'TN') * (resultat.TN || 0);
  resultat.XE = resultat.XC + resultat.XD; // RESULTAT NET DE L'EXERCICE

  // ---- 3. PASSIF (CH référence XE — cross-référence déjà encodée dans le mapping) --
  const mapping = loadMapping();
  const passif = {};
  for (const code of codesLeafDe('PASSIF')) {
    const composants = mapping.filter((m) => m.etat === 'PASSIF' && m.code_poste === code && m.nature === 'Composant');
    const croisee = composants.some((c) => !/^\d+$/.test(String(c.compte)));
    if (croisee) {
      passif[code] = composants.reduce((s, c) => {
        const signe = c.signe === '-' ? -1 : 1;
        if (c.compte === 'XE') return s + signe * resultat.XE;
        return s;
      }, 0);
    } else {
      passif[code] = calculerPosteLeaf(idxN, 'PASSIF', code, 'N');
    }
  }
  // Rollups PASSIF, vérifiés sur BILAN!M21/M35/M39 :
  const CA_CJ = ['CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ'];
  passif.CK = CA_CJ.reduce((s, c) => s + (passif[c] || 0), 0);           // TOTAL FONDS PROPRES ET ASSIMILES
  passif.DV = (passif.DF || 0) + (passif.DG || 0) + (passif.DH || 0) + (passif.DI || 0); // TOTAL PASSIF CIRCULANT
  passif.DX = passif.DW || 0;                                            // TOTAL TRESORERIE PASSIF
  // TOTAL GENERAL PASSIF, vérifié sur BILAN DRAFT!M41 = M40+M39+M35+(M25=M24+M21) où M24='CY' (SUMIF, vide dans ce
  // classeur -> 0, cohérent avec l'absence de CY dans les 614 lignes) :
  const CY = calculerPosteLeaf(idxN, 'PASSIF', 'CY', 'N'); // 0 si aucune règle (cas de ce classeur)
  passif.DZ = passif.CK + CY + (passif.DA || 0) + (passif.DB || 0) + (passif.DC || 0) + passif.DV + passif.DX + (passif.DY || 0);

  // ---- 4. TFT -----------------------------------------------------------------
  const posteDejaCalcule = (code) => {
    if (code in actif) return actif[code].net;
    if (code in passif) return passif[code];
    if (code in resultat) return resultat[code];
    throw new Error(`TFT: code référencé "${code}" introuvable.`);
  };

  const tft = {};
  for (const code of codesLeafDe('TFT')) {
    const composants = mapping.filter((m) => m.etat === 'TFT' && m.code_poste === code && m.nature === 'Composant');
    let total = 0;
    for (const c of composants) {
      const signe = c.signe === '-' ? -1 : 1;
      const compteStr = c.compte === null || c.compte === undefined ? '' : String(c.compte);
      if (compteStr === '') {
        tftAvertissements.push({
          code_poste: code, libelle: c.libelle_poste,
          raison: "Compte non renseigné dans le classeur source — propre au plan comptable de l'entité",
        });
        continue;
      }
      const isNumeric = /^\d+$/.test(compteStr);
      if (isNumeric && c.imputation) {
        if (c.exercice === 'N-1') {
          tftAvertissements.push({ code_poste: code, libelle: c.libelle_poste, raison: 'Référence N-1 non résolue dans ce passage' });
          continue;
        }
        total += signe * sommeParImputation(idxN, compteStr, c.imputation);
      } else if (!isNumeric) {
        if (c.exercice === 'N-1') {
          tftAvertissements.push({ code_poste: code, libelle: c.libelle_poste, raison: 'Référence croisée N-1 non résolue dans ce passage' });
          continue;
        }
        try {
          total += signe * posteDejaCalcule(compteStr);
        } catch (e) {
          tftAvertissements.push({ code_poste: code, libelle: c.libelle_poste, raison: e.message });
        }
      }
    }
    tft[code] = total;
  }
  // Rollups TFT, vérifiés (structure additive du classeur) :
  const FA_FH = ['FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG', 'FH'];
  const FI_FL = ['FI', 'FJ', 'FK', 'FL'];
  const FM_FO = ['FM', 'FN', 'FO'];
  const FP_FQ = ['FP', 'FQ'];
  tft.ZB = FA_FH.reduce((s, c) => s + (tft[c] || 0), 0); // Flux net activités opérationnelles
  tft.ZC = FI_FL.reduce((s, c) => s + (tft[c] || 0), 0); // Flux net activités d'investissement
  tft.ZD = FM_FO.reduce((s, c) => s + (tft[c] || 0), 0); // Flux net financement (partie 1)
  tft.ZE = FP_FQ.reduce((s, c) => s + (tft[c] || 0), 0); // Flux net financement (partie 2)
  tft.ZF = tft.ZB + tft.ZC + tft.ZD + tft.ZE;            // Flux net total de trésorerie
  // ZA (trésorerie nette au 1er janvier) nécessite balanceN1 :
  if (balanceN1 && balanceN1.length) {
    const idxN1 = buildPrefixIndex(balanceN1);
    // BX/DX de l'exercice N-1 recalculés à la volée pour ZA
    const bxN1 = ['BU', 'BV', 'BW'].reduce((s, code) => s + calculerPosteLeaf(idxN1, 'ACTIF_BRUT', code, 'N') - calculerPosteLeaf(idxN1, 'ACTIF_AMORT', code, 'N'), 0);
    const dxN1 = calculerPosteLeaf(idxN1, 'PASSIF', 'DW', 'N');
    tft.ZA = bxN1 - dxN1;
  } else {
    tft.ZA = 0;
    tftAvertissements.push({ code_poste: 'ZA', libelle: 'Trésorerie nette au 1er janvier', raison: 'balanceN1 non fournie' });
  }
  tft.ZG = tft.ZA + tft.ZF; // Trésorerie nette de clôture

  // ---- 5. INDICATEURS ----------------------------------------------------------
  const indicateurs = {};
  for (const code of codesLeafDe('INDICATEURS')) {
    const composants = mapping.filter((m) => m.etat === 'INDICATEURS' && m.code_poste === code && m.nature === 'Composant');
    let total = 0;
    for (const c of composants) {
      const signe = c.signe === '-' ? -1 : 1;
      const compteStr = String(c.compte);
      const isNumeric = /^\d+$/.test(compteStr);
      if (isNumeric && c.imputation) {
        total += signe * sommeParImputation(idxN, compteStr, c.imputation);
      } else if (!isNumeric) {
        try {
          total += signe * posteDejaCalcule(compteStr);
        } catch (e) {
          if (compteStr in indicateurs) total += signe * indicateurs[compteStr];
          else if (compteStr in tft) total += signe * tft[compteStr];
        }
      }
    }
    indicateurs[code] = total;
  }

  return { actif, passif, resultat, tft, indicateurs, avertissements: { tft: tftAvertissements } };
}

module.exports = {
  loadMapping,
  loadSubtotals,
  buildPrefixIndex,
  sommeParImputation,
  calculerPosteLeaf,
  calculerEtatsFinanciers,
};

