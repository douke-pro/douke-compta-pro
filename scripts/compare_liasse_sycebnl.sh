#!/usr/bin/env bash
# Extrait une liasse SYCEBNL et la compare au MODELE initial (gabarit utilise par l'export).
# Usage : bash scripts/compare_liasse_sycebnl.sh [liasse.xlsx] [modele.xlsx]
#   sans argument : genere une liasse avec le pipeline reel (balance de test equilibree) puis compare.
#   avec liasse.xlsx : compare une liasse deja telechargee depuis l'application.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
TPL="${2:-backups/EF_SYSCEBNL_Juin (1).xlsx}"
OUT="${OUT:-/tmp/liasse_compare}"; mkdir -p "$OUT"
[ -f "$TPL" ] || { echo "Modele introuvable : $TPL"; exit 2; }

if [ -n "${1:-}" ]; then
  EXP="$1"; [ -f "$EXP" ] || { echo "Liasse introuvable : $EXP"; exit 2; }
else
  EXP="$OUT/liasse_generee.xlsx"
  echo "== Generation de la liasse par le pipeline reel (balance de test equilibree) =="
  EXP="$EXP" node - << 'GEN_EOF' || { echo "Generation KO"; exit 2; }
const path = require('path'), fs = require('fs');
const { buildReportData } = require(path.resolve('services/sycebnlReportAdapter'));
const { buildSycebnlExcel } = require(path.resolve('services/sycebnlExcelExport'));
const L = (compte, sfd, sfc) => ({ compte, sid: 0, sic: 0, md: sfd, mc: sfc, sfd, sfc });
const balanceN = [L('201', 2000000, 0), L('2801', 0, 400000), L('521', 8000000, 0), L('411', 1500000, 0), L('401', 0, 900000),
  L('444', 0, 300000), L('1011', 0, 5000000), L('701', 0, 6000000), L('661', 1200000, 0), L('431', 0, 100000)];
const balanceN1 = [L('521', 3000000, 0), L('1011', 0, 3000000)];
const sum = (a, k) => a.reduce((s, l) => s + l[k], 0);
if (sum(balanceN, 'sfd') !== sum(balanceN, 'sfc') || sum(balanceN1, 'sfd') !== sum(balanceN1, 'sfc')) { console.error('balance de test desequilibree'); process.exit(1); }
const rd = buildReportData(balanceN, balanceN1, {
  company: { name: 'ENTITE TEST EQUILIBREE', street: '10 Rue Test', city: 'Cotonou', vat: '3202600000099' },
  period: { start: '2026-01-01', end: '2026-12-31' },
});
buildSycebnlExcel(rd).then(b => { fs.writeFileSync(process.env.EXP, b); console.log('liasse generee :', process.env.EXP); })
  .catch(e => { console.error('ECHEC :', e.stack); process.exit(1); });
GEN_EOF
fi

echo; echo "== Extraction + comparaison =="
node scripts/compare_liasse_sycebnl.js "$TPL" "$EXP" "$OUT" 2>&1 | tee "$OUT/rapport.txt"
RC=${PIPESTATUS[0]}
echo; echo "Fichiers : $OUT/rapport.txt | liasse_ecarts.csv | liasse_modele_dump.txt | liasse_export_dump.txt"
echo "Lecture rapide d'un ecart : grep -v donnee $OUT/liasse_ecarts.csv | head -40   |   diff modele/liasse : diff $OUT/liasse_modele_dump.txt $OUT/liasse_export_dump.txt | head -50"
exit $RC
