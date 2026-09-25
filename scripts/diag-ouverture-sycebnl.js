// LECTURE SEULE : aucune écriture Odoo
'use strict';
require('dotenv').config();

const companyId = parseInt(process.argv[2], 10);
const start = process.argv[3] || '2024-01-01';
const end   = process.argv[4] || '2024-12-31';
if (!Number.isInteger(companyId)) {
  console.error('Usage: node scripts/diag-ouverture-sycebnl.js <companyId> [debut] [fin]');
  process.exit(1);
}

const mod = require('../services/odooReportsService');
const svc = typeof mod === 'function' ? new mod()
  : (mod && typeof mod.extractFinancialData === 'function') ? mod
  : (mod && typeof mod.OdooReportsService === 'function') ? new mod.OdooReportsService()
  : null;
if (!svc) { console.error('Export inattendu :', Object.keys(mod || {})); process.exit(1); }

(async () => {
  const data = await svc.extractFinancialData(companyId, '2000-01-01', end, 'SYCEBNL');
  const lines = (data.raw_data && data.raw_data.move_lines) || [];
  if (!lines.length) { console.error('Aucune ligne remontée.'); process.exit(1); }

  const agg = {};
  let nAvant = 0, nExo = 0, minDate = '9999';
  for (const l of lines) {
    const code = String(l.account_code || '');
    if (!code || code === 'UNKNOWN') continue;
    const d = String(l.date).slice(0, 10);
    if (d < minDate) minDate = d;
    const phase = d < start ? 'avant' : 'exercice';
    if (phase === 'avant') nAvant++; else nExo++;
    agg[code] = agg[code] || { avant: { d: 0, c: 0 }, exercice: { d: 0, c: 0 } };
    agg[code][phase].d += l.debit || 0;
    agg[code][phase].c += l.credit || 0;
  }

  console.log(`Lignes avant ${start}: ${nAvant} | dans l'exercice: ${nExo} | plus ancienne date: ${minDate}`);

  const rows = Object.keys(agg).sort()
    .filter(c => /^(1|2|3|4|5)/.test(c))
    .map(c => ({
      compte: c,
      avant_net: Math.round(agg[c].avant.d - agg[c].avant.c),
      exercice_D: Math.round(agg[c].exercice.d),
      exercice_C: Math.round(agg[c].exercice.c),
    }));
  console.table(rows);
})().catch(e => { console.error('Erreur:', e.message); process.exit(1); });
