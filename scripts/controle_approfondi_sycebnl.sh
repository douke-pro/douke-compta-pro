#!/usr/bin/env bash
# === CONTROLE APPROFONDI SYCEBNL — 7 points non couverts ===
# Lecture seule : n'écrit que dans /tmp, ne touche ni au dépôt ni à git.
set -uo pipefail

REPO="/workspaces/douke-compta-pro"
cd "$REPO" || { echo "ERREUR: dépôt introuvable à $REPO"; exit 1; }

REPORT="/tmp/controle_sycebnl_$(date +%Y%m%d-%H%M%S).txt"
echo "=== CONTROLE APPROFONDI SYCEBNL — $(date) ===" > "$REPORT"

section() { echo -e "\n== $1 ==" | tee -a "$REPORT"; }

# -----------------------------------------------------------------------
# ETAPE 0 : construire une balance REALISTE (multi-classes de comptes),
# au lieu du cas jouet a 2 lignes utilise precedemment.
# -----------------------------------------------------------------------
section "0. Construction d'une balance de test realiste (N et N-1)"

cat > /tmp/generer_export_complet.js << 'JS_EOF'
const { buildReportData } = require('/workspaces/douke-compta-pro/services/sycebnlReportAdapter');
const { buildSycebnlExcel } = require('/workspaces/douke-compta-pro/services/sycebnlExcelExport');
const fs = require('fs');

// Balance N : plusieurs classes de comptes reelles (immobilisations,
// tresorerie, dettes fiscales, fonds propres, produits, charges de personnel)
// pour exercer un maximum de codes du mapping, pas juste 2 lignes.
const balanceN = [
  { compte: '201',  sid: 0, sic: 0, md: 2000000, mc: 0, sfd: 2000000, sfc: 0 },       // immo incorporelle brute
  { compte: '2801', sid: 0, sic: 0, md: 0, mc: 400000, sfd: 0, sfc: 400000 },          // amort correspondant
  { compte: '521',  sid: 0, sic: 0, md: 8000000, mc: 0, sfd: 8000000, sfc: 0 },        // banque
  { compte: '411',  sid: 0, sic: 0, md: 1500000, mc: 0, sfd: 1500000, sfc: 0 },        // clients
  { compte: '401',  sid: 0, sic: 0, md: 0, mc: 900000, sfd: 0, sfc: 900000 },          // fournisseurs
  { compte: '444',  sid: 0, sic: 0, md: 0, mc: 300000, sfd: 0, sfc: 300000 },          // dettes fiscales
  { compte: '1011', sid: 0, sic: 5000000, md: 0, mc: 5000000, sfd: 0, sfc: 5000000 },  // dotation initiale
  { compte: '701',  sid: 0, sic: 6000000, md: 0, mc: 6000000, sfd: 0, sfc: 6000000 },  // cotisations
  { compte: '661',  sid: 0, sic: 0, md: 1200000, mc: 0, sfd: 1200000, sfc: 0 },        // charges de personnel
];

// Balance N-1 : version simplifiee pour tester la colonne comparative.
const balanceN1 = [
  { compte: '521',  sid: 0, sic: 0, md: 3000000, mc: 0, sfd: 3000000, sfc: 0 },
  { compte: '1011', sid: 0, sic: 3000000, md: 0, mc: 3000000, sfd: 0, sfc: 3000000 },
  { compte: '701',  sid: 0, sic: 2500000, md: 0, mc: 2500000, sfd: 0, sfc: 2500000 },
];

const reportData = buildReportData(balanceN, balanceN1, {
  company: { name: 'ENTITE TEST CONTROLE APPROFONDI', street: '45 Avenue de la Rigueur', city: 'Porto-Novo', vat: '3202600000099' },
  period: { end: '2026-12-31' },
});

fs.writeFileSync('/tmp/reportData_debug.json', JSON.stringify(reportData, null, 2));

buildSycebnlExcel(reportData)
  .then(buffer => {
    fs.writeFileSync('/tmp/test_export_complet.xlsx', buffer);
    console.log('OK -> /tmp/test_export_complet.xlsx (' + buffer.length + ' octets)');
    console.log('OK -> /tmp/reportData_debug.json (donnees calculees brutes)');
  })
  .catch(err => { console.error('ECHEC GENERATION :', err.stack); process.exit(1); });
JS_EOF

node /tmp/generer_export_complet.js 2>&1 | tee -a "$REPORT"
if [[ ! -f /tmp/test_export_complet.xlsx ]]; then
  echo "ARRET : la generation a echoue, impossible de continuer les controles." | tee -a "$REPORT"
  exit 1
fi

# -----------------------------------------------------------------------
# ETAPE 1 : audit officiel sur ce fichier plus riche
# -----------------------------------------------------------------------
section "1. Audit officiel (scripts/audit_sycebnl_reconciliation.sh)"
bash scripts/audit_sycebnl_reconciliation.sh /tmp/test_export_complet.xlsx 2>&1 | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 2 : colonnes Brut/Amortissement (D/E) des sous-totaux BILAN
# -----------------------------------------------------------------------
section "2. Colonnes D/E (Brut/Amort) des sous-totaux du BILAN"
cat > /tmp/check_bilan_de.js << 'JS_EOF'
const ExcelJS = require('exceljs');
(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/tmp/test_export_complet.xlsx');
  const ws = wb.getWorksheet('BILAN');
  function result(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return null;
    if (typeof cell.value === 'object') return cell.value.result ?? null;
    return cell.value;
  }
  function formula(cell) {
    if (!cell || !cell.value || typeof cell.value !== 'object') return null;
    return cell.value.formula || cell.value.sharedFormula || null;
  }
  console.log('Lignes de BILAN avec une formule en D ou E (sous-totaux) :');
  ws.eachRow((row, rowNumber) => {
    const dCell = row.getCell('D');
    const eCell = row.getCell('E');
    const fCell = row.getCell('F');
    if (formula(dCell) || formula(eCell)) {
      console.log(`  Ligne ${rowNumber}: D=[formule:${formula(dCell)} | cache:${result(dCell)}]  E=[formule:${formula(eCell)} | cache:${result(eCell)}]  F(net)=[${result(fCell)}]`);
    }
  });
})();
JS_EOF
node /tmp/check_bilan_de.js 2>&1 | tee -a "$REPORT"
echo "-> INTERPRETATION MANUELLE REQUISE : si le cache D/E affiche encore les montants de l'entite gabarit (BENIN TALENT POOL) plutot que ceux calcules ci-dessus, c'est le residu deja documente." | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 3 : comparaison N-1 (colonnes G, E-resultat, F-TFT)
# -----------------------------------------------------------------------
section "3. Colonnes N-1 (comparatif)"
cat > /tmp/check_n1.js << 'JS_EOF'
const ExcelJS = require('exceljs');
(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/tmp/test_export_complet.xlsx');
  function result(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return null;
    if (typeof cell.value === 'object') return cell.value.result ?? null;
    return cell.value;
  }
  const bilan = wb.getWorksheet('BILAN');
  const cr = wb.getWorksheet('COMPTE_DE_RESULTAT');
  const tft = wb.getWorksheet('TFT');
  console.log('BILAN!G13 (net_n1 exemple) =', result(bilan.getCell('G13')));
  console.log('COMPTE_DE_RESULTAT!E7 (montant_n1 exemple) =', result(cr.getCell('E7')));
  console.log('TFT!F5 (ZA, montant_n1) =', result(tft.getCell('F5')));
  console.log('TFT!F8 (montant_n1 exemple ligne FA) =', result(tft.getCell('F8')));
})();
JS_EOF
node /tmp/check_n1.js 2>&1 | tee -a "$REPORT"
echo "-> INTERPRETATION MANUELLE REQUISE : verifier que ces valeurs correspondent a la balanceN1 fournie (2 500 000 pour les cotisations N-1, etc.), pas a 0 ou undefined partout." | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 4 : TFT ZA/ZG — confirmer la limite documentee
# -----------------------------------------------------------------------
section "4. TFT ZA/ZG (limite connue : necessite balance N-2)"
node -e "
const rd = require('/tmp/reportData_debug.json');
console.log('TFT.ZA (montant_n) =', rd.tft.lignes.find(l => l.ref === 'ZA'));
console.log('TFT.ZG (montant_n) =', rd.tft.lignes.find(l => l.ref === 'ZG'));
" 2>&1 | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 5 : Notes Annexes — sont-elles alimentees par le pipeline ?
# -----------------------------------------------------------------------
section "5. Notes Annexes (NOTE 1 a NOTE 35) — alimentees ou vides ?"
cat > /tmp/check_notes.js << 'JS_EOF'
const ExcelJS = require('exceljs');
(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/tmp/test_export_complet.xlsx');
  const noteSheets = wb.worksheets.filter(ws => /^NOTE /.test(ws.name));
  console.log(`Nombre de feuilles NOTE trouvees : ${noteSheets.length}`);
  console.log('Verification : ces feuilles contiennent-elles encore les valeurs du gabarit source (non touchees par notre pipeline) ?');
  noteSheets.slice(0, 3).forEach(ws => {
    let nonEmpty = 0;
    ws.eachRow(row => { row.eachCell(() => nonEmpty++); });
    console.log(`  ${ws.name}: ${nonEmpty} cellules non vides (valeurs du gabarit d'origine, PAS calculees par sycebnlMapper.js)`);
  });
})();
JS_EOF
node /tmp/check_notes.js 2>&1 | tee -a "$REPORT"
echo "-> ATTENDU : ces feuilles contiennent les valeurs du gabarit BENIN TALENT POOL, car sycebnlMapper.js ne calcule aucune Note Annexe (confirme des le tout premier audit). Ceci n'est PAS un bug de ce fix, c'est le point 2 jamais traite." | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 6 : noms definis - confirmer la suppression et chercher tout
# consommateur externe dans le code
# -----------------------------------------------------------------------
section "6. Noms definis supprimes — recherche de tout consommateur externe"
grep -rn "_soNom\|_ExerClos\|_soAdr\|_soNumFisc\|definedNames\|getDefinedName" \
  --include="*.js" --exclude-dir=node_modules . 2>/dev/null | tee -a "$REPORT"
echo "-> Si seule sycebnlExcelExport.js (l'ancienne version, avant patch) apparait via git blame/history, aucun consommateur actif n'est affecte." | tee -a "$REPORT"

# -----------------------------------------------------------------------
# ETAPE 7 : verifier les vrais appelants de buildReportData/buildSycebnlExcel
# en production (pour confirmer les champs company/period reellement fournis)
# -----------------------------------------------------------------------
section "7. Appelants reels de buildReportData / buildSycebnlExcel dans le code"
grep -rn "buildReportData\|buildSycebnlExcel" \
  --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "services/sycebnlReportAdapter.js\|services/sycebnlExcelExport.js" | tee -a "$REPORT"
echo "-> Si cette liste est VIDE, cela signifie qu'aucun controleur/route de l'application n'appelle encore ce pipeline en production : le fix ne serait alors branche nulle part, malgre les tests reussis en isolation." | tee -a "$REPORT"

# -----------------------------------------------------------------------
# RESUME
# -----------------------------------------------------------------------
section "RESUME"
echo "Rapport complet ecrit dans : $REPORT"
echo "Fichiers generes pour inspection manuelle :"
echo "  - /tmp/test_export_complet.xlsx (a ouvrir et inspecter visuellement si possible)"
echo "  - /tmp/reportData_debug.json (donnees brutes calculees par le moteur)"
echo ""
echo "PROCHAINE ETAPE : relis ce rapport section par section, en particulier les"
echo "'INTERPRETATION MANUELLE REQUISE'. Colle-moi le contenu complet du rapport :"
echo "  cat $REPORT"
