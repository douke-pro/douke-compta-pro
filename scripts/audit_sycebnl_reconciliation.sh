#!/usr/bin/env bash
set -Eeuo pipefail

XLSX="${1:-backups/EF_SYSCEBNL_Juin (1).xlsx}"
PDF="${2:-}"

if [[ ! -f "$XLSX" ]]; then
  printf 'FAIL: classeur introuvable: %s\n' "$XLSX" >&2
  exit 2
fi
if [[ -n "$PDF" && ! -f "$PDF" ]]; then
  printf 'FAIL: PDF introuvable: %s\n' "$PDF" >&2
  exit 2
fi

export AUDIT_XLSX="$XLSX"
export AUDIT_PDF="$PDF"

node - <<'NODE'
const cp = require('child_process');
const ExcelJS = require('exceljs');

const xlsx = process.env.AUDIT_XLSX;
const pdf = process.env.AUDIT_PDF;
const failures = [];
const warnings = [];
const pass = [];

function ok(message) { pass.push(message); }
function warn(message) { warnings.push(message); }
function fail(message) { failures.push(message); }
function formula(cell) {
  if (!cell || !cell.value || typeof cell.value !== 'object') return cell?.value;
  return cell.value.formula || cell.value.sharedFormula || null;
}
function result(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return null;
  if (typeof cell.value === 'object') return cell.value.result ?? null;
  return cell.value;
}
function getCell(workbook, sheet, address) {
  const ws = workbook.getWorksheet(sheet);
  if (!ws) { fail(`Feuille absente: ${sheet}`); return null; }
  return ws.getCell(address);
}
function expectFormula(workbook, sheet, address, expected) {
  const actual = formula(getCell(workbook, sheet, address));
  if (actual === expected) ok(`${sheet}!${address} = ${expected}`);
  else fail(`${sheet}!${address}: formule lue [${actual}] ; attendue [${expected}]`);
}
function numberValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const clean = value.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}
function fmt(value) {
  return typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value);
}
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

(async () => {
  const zipCheck = cp.spawnSync('unzip', ['-t', xlsx], { stdio: 'ignore' });
  if (zipCheck.status === 0) ok('Archive XLSX lisible.');
  else fail('Le fichier XLSX ne passe pas le test ZIP.');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsx);
  const expectedSheets = ['BILAN', 'COMPTE_DE_RESULTAT', 'TFT', 'NOTE 1', 'NOTE 5D', 'NOTE 24', 'NOTE 33', 'CORRESPONDANCE-BILAN', 'CORRESPONDANCE-RESULTAT'];
  for (const name of expectedSheets) {
    if (workbook.getWorksheet(name)) ok(`Feuille presente: ${name}`);
    else fail(`Feuille absente: ${name}`);
  }
  if (workbook.worksheets.length === 53) ok('Nombre de feuilles: 53');
  else warn(`Nombre de feuilles: ${workbook.worksheets.length}, 53 attendu pour ce gabarit.`);

  expectFormula(workbook, 'BILAN', 'L16', 'SUM(L6:L15)');
  expectFormula(workbook, 'NOTE 5D', 'G14', 'B14+C14-D14-E14-F14');
  expectFormula(workbook, 'NOTE 24', 'D9', 'B9-C9');
  expectFormula(workbook, 'NOTE 24', 'E9', 'IF(C9=0,0,(B9-C9)/C9)*100');
  expectFormula(workbook, 'NOTE 1', 'C19', 'SUM(C14:C18)');
  for (let row = 9; row <= 15; row += 1) {
    expectFormula(workbook, 'NOTE 33', `E${row}`, `IF(C${row}=0,0,(B${row}-C${row})/C${row})*100`);
  }

  const bilanNet = result(getCell(workbook, 'BILAN', 'K13'));
  const resultatNet = result(getCell(workbook, 'COMPTE_DE_RESULTAT', 'D33'));
  if (numberValue(bilanNet) !== null && numberValue(resultatNet) !== null) {
    if (Number(bilanNet) === Number(resultatNet)) ok(`Resultat net coherent: ${fmt(bilanNet)} XOF`);
    else fail(`Resultat net incoherent: BILAN!K13=${fmt(bilanNet)} ; COMPTE_DE_RESULTAT!D33=${fmt(resultatNet)}.`);
  } else warn('Resultat net non exploitable: valeur calculee absente du cache Excel.');

  const actifTotal = result(getCell(workbook, 'BILAN', 'F37'));
  const passifTotal = result(getCell(workbook, 'BILAN', 'K37'));
  if (numberValue(actifTotal) !== null && numberValue(passifTotal) !== null) {
    if (Number(actifTotal) === Number(passifTotal)) ok(`Bilan equilibre: ${fmt(actifTotal)} XOF`);
    else fail(`Bilan desequilibre: actif=${fmt(actifTotal)} ; passif=${fmt(passifTotal)}.`);
  } else warn('Equilibre du bilan non exploitable: cache Excel incomplet.');

  const workbookXml = cp.execFileSync('unzip', ['-p', xlsx, 'xl/workbook.xml'], { encoding: 'utf8' });
  const names = [...workbookXml.matchAll(/<definedName\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/definedName>/g)]
    .map(match => ({ name: match[1], value: match[2] }));
  const businessNames = names.filter(item => !item.name.startsWith('_xlnm.'));
  if (businessNames.length === 0) warn('Aucun nom defini metier trouve; identite/exercice impossibles a controler dans ce fichier.');
  else {
    ok(`${businessNames.length} noms definis metier trouves.`);
    const identity = businessNames.filter(item => /nom|soc|ent|exer|period|date/i.test(item.name));
    const values = [...new Set(identity.map(item => item.value.trim()).filter(Boolean))];
    if (values.length > 1) warn(`Valeurs d'identite/periode distinctes detectees: ${values.join(' | ')}`);
  }

  if (pdf) {
    const pdftotext = cp.spawnSync('which', ['pdftotext'], { stdio: 'ignore' });
    if (pdftotext.status !== 0) warn('pdftotext absent: PDF non analyse.');
    else {
      const extracted = cp.execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
      const lines = extracted.split(/\r?\n/).map(normalize);
      const totalLines = lines.filter(line => /TOTAUX? GENERAUX|TOTAL GENERAL/.test(line));
      if (totalLines.length) {
        ok(`PDF: ${totalLines.length} ligne(s) de totaux detectee(s), a verifier visuellement.`);
        totalLines.slice(0, 5).forEach(line => console.log(`PDF_TOTAL: ${line.trim()}`));
      } else warn('PDF fourni mais aucun libelle de total general reconnu; aucun rapprochement chiffre affirme.');
      warn('Le test charges > total balance reste conditionnel: balance complete, meme exercice et meme perimetre requis.');
    }
  } else warn('Aucun PDF fourni: rapprochement balance non execute.');

  console.log('\n=== AUDIT SYCEBNL ===');
  pass.forEach(item => console.log(`PASS  ${item}`));
  warnings.forEach(item => console.log(`WARN  ${item}`));
  failures.forEach(item => console.log(`FAIL  ${item}`));
  console.log(`\nResume: ${pass.length} PASS, ${warnings.length} WARN, ${failures.length} FAIL`);
  process.exitCode = failures.length ? 2 : 0;
})().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 2; });
NODE