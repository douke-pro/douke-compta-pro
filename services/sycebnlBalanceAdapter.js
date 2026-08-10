/**
 * sycebnlBalanceAdapter.js
 * =============================================================================
 * Convertit les lignes Odoo enrichies (enrichedLines / move_lines) au format
 * de balance attendu par sycebnlMapper.calculerEtatsFinanciers() :
 *   { compte, sid, sic, md, mc, sfd, sfc }
 *
 * IMPORTANT — limite héritée, pas introduite ici :
 * L'extraction Odoo actuelle (odooReportsService.extractFinancialData) ne
 * remonte PAS de solde d'ouverture (sid/sic) — exactement comme pour
 * toBalanceAccounts() côté SYSCOHADA, où opening_debit/opening_credit sont
 * déjà codés en dur à 0. sid/sic valent donc 0 ici aussi, par cohérence
 * avec le comportement existant, pas par choix nouveau.
 *
 * md/mc = mouvements débit/crédit cumulés de la période (somme des lignes).
 * sfd/sfc = solde net de la période, ventilé sur la bonne colonne :
 *   solde = md - mc
 *   si solde >= 0 -> sfd = solde, sfc = 0   (solde débiteur)
 *   si solde <  0 -> sfd = 0,     sfc = -solde (solde créditeur)
 * C'est la balance générale standard (partie double) : la ventilation
 * sfd/sfc ne dépend pas du type de compte, seulement du sens net du solde.
 * Le mapper SYCEBNL choisit lui-même SFD ou SFC selon la règle du poste.
 * =============================================================================
 */

'use strict';

function toBalanceSycebnl(lines) {
  const map = {};
  for (const line of (lines || [])) {
    const code = line.account_code;
    if (!code || code === 'UNKNOWN') continue;
    if (!map[code]) map[code] = { compte: code, sid: 0, sic: 0, md: 0, mc: 0, sfd: 0, sfc: 0 };
    map[code].md += line.debit  || 0;
    map[code].mc += line.credit || 0;
  }
  for (const compte of Object.values(map)) {
    const solde = compte.md - compte.mc;
    if (solde >= 0) { compte.sfd = solde; compte.sfc = 0; }
    else            { compte.sfd = 0;     compte.sfc = -solde; }
  }
  return Object.values(map);
}

module.exports = { toBalanceSycebnl };