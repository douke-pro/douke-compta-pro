'use strict';
/**
 * compare_liasse_sycebnl.js — extrait une liasse SYCEBNL (.xlsx) et la compare au MODELE initial.
 * Usage : node scripts/compare_liasse_sycebnl.js <modele.xlsx> <liasse.xlsx> [dossier_sortie=/tmp]
 * Sorties : liasse_modele_dump.txt, liasse_export_dump.txt (extraction cellule par cellule),
 *           liasse_ecarts.csv (chaque ecart classe), rapport console. Code retour 1 si ecart non attendu.
 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ExcelJS = require('exceljs');
const [, , TPL, EXP, OUT = '/tmp'] = process.argv;
if (!TPL || !EXP) { console.error('usage: node compare_liasse_sycebnl.js <modele.xlsx> <liasse.xlsx> [sortie]'); process.exit(2); }

// ---------- attendu (identite / remise a blanc voulues) ----------
const ATTENDU = [
  /^PAGE DE GARDE!(E25|G20|D30|D11|E32|B34|[F-J]25)$/,
  /^NOTE 3!A5$/, /^EXECUTION BUDGETAIRE!(A6|[AB](9|10|11|12))$/,
  /^NOTE (5A!A24|5B!A29|13![A-E]2[45]|16!A1[45]|19!A2[0-2]|23!A2[34]|25!A18|26!A29|28!A20)$/,
];
const attendu = k => ATTENDU.some(r => r.test(k));
const STRUCT_NUM = [/^BILAN![CJ]\d+$/, /^COMPTE_DE_RESULTAT!C\d+$/, /^NOTE 1!B2[1-8]$/, /^NOTE 35![C-E]11$/, /^EXECUTION BUDGETAIRE![C-E]8$/, /^CORRESPONDANCE/];
const isStruct = k => STRUCT_NUM.some(r => r.test(k));
const TOK = /TALENT|B E N I N|BTP|Meet up|6202353567270|CIPE3|BSIC|consultante|coworking|Honnoraire|comité impact|ordinateur HP|BENIN EXCELLENCE/i;

// ---------- utilitaires ----------
const sh = (cmd, args) => { try { return execFileSync(cmd, args, { maxBuffer: 1 << 28 }).toString('utf8'); } catch (e) { return ''; } };
const zipList = f => sh('unzip', ['-Z1', f]).split('\n').filter(Boolean);
const zipRead = (f, p) => sh('unzip', ['-p', f, p]);
function nameList(f) { const w = zipRead(f, 'xl/workbook.xml'); return [...w.matchAll(/<definedName name="([^"]+)"/g)].map(m => m[1]); }
const unesc = x => x.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function sheetNames(f) { return [...zipRead(f, 'xl/workbook.xml').matchAll(/<sheet\s[^>]*>/g)].map(m => unesc((/\sname="([^"]*)"/.exec(m[0]) || [, ''])[1])); }
const V = ExcelJS.ValueType;
function norm(c) {
  if (c.type === V.Merge) return null;                                // esclave de fusion : reflet du maitre
  const v = c.value; if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') {
    if (v.formula || v.sharedFormula) return { t: 'F', v: String(c.formula || '').replace(/\s+/g, '') };
    if (v.richText) return { t: 'S', v: v.richText.map(x => x.text).join('') };
    if (v instanceof Date) return { t: 'D', v: v.toISOString() };
    if (v.error) return { t: 'E', v: v.error };
    if (v.text !== undefined) return { t: 'S', v: String(v.text) };
    return { t: 'S', v: JSON.stringify(v) };
  }
  if (typeof v === 'number') return { t: 'N', v };
  return { t: 'S', v: String(v).replace(/\s+/g, ' ').trim() };
}
const styleSig = c => { const s = c.style || {}, b = s.border || {};
  return JSON.stringify([s.numFmt, s.font && [s.font.name, s.font.size, !!s.font.bold, !!s.font.italic, s.font.color && s.font.color.argb],
    s.fill && [s.fill.fgColor && (s.fill.fgColor.argb || s.fill.fgColor.theme)], s.alignment && [s.alignment.horizontal, s.alignment.vertical, !!s.alignment.wrapText],
    ['left', 'right', 'top', 'bottom'].map(k => b[k] && b[k].style)]); };
const colNum = a => [...a.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const rowNum = a => Number(a.replace(/\D+/g, ''));

async function load(f) { const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(f); return wb; }
function extract(wb) {           // sheet -> Map(addr -> {t,v,style})
  const out = new Map();
  wb.eachSheet(ws => { const m = new Map(); ws.eachRow(r => r.eachCell(c => { const n = norm(c); if (n) m.set(c.address, Object.assign(n, { st: styleSig(c) })); })); out.set(ws.name, m); });
  return out;
}
function dump(map, file) {
  const L = [];
  for (const [sn, m] of map) for (const a of [...m.keys()].sort((x, y) => rowNum(x) - rowNum(y) || colNum(x) - colNum(y))) { const c = m.get(a); L.push(`${sn}!${a}\t${c.t}\t${c.v}`); }
  fs.writeFileSync(file, L.join('\n') + '\n'); return L.length;
}

(async () => {
  const rows = [['feuille', 'cellule', 'classe', 'attendu', 'modele', 'liasse']];
  const problems = []; const P = (m) => { problems.push(m); console.log('  ✗ ' + m); };

  // ===== 1. STRUCTURE DU PAQUET =====
  console.log(`\n=== 1. STRUCTURE (modele: ${path.basename(TPL)} | liasse: ${path.basename(EXP)}) ===`);
  const zt = zipList(TPL), ze = zipList(EXP);
  const cnt = (z, rx) => z.filter(x => rx.test(x)).length;
  for (const [lab, rx] of [['bannieres (drawings)', /^xl\/drawings\/drawing\d+\.xml$/], ['reglages imprimante', /^xl\/printerSettings\//], ['feuilles', /^xl\/worksheets\/sheet\d+\.xml$/]]) {
    const a = cnt(zt, rx), b = cnt(ze, rx); console.log(`  ${lab.padEnd(22)} modele=${a}  liasse=${b}  ${a === b ? 'OK' : '<-- ECART'}`); if (a !== b) P(`${lab}: ${a} -> ${b}`);
  }
  const st = sheetNames(TPL), se = sheetNames(EXP);
  console.log(`  ordre/noms des feuilles ${JSON.stringify(st) === JSON.stringify(se) ? 'OK (' + st.length + ')' : '<-- ECART'}`);
  if (JSON.stringify(st) !== JSON.stringify(se)) P('noms/ordre des feuilles differents');
  const nt = nameList(TPL), nx = nameList(EXP), ne = new Set(nx);
  const lost = nt.filter(n => !n.startsWith('_xlnm') && !ne.has(n));
  const pa = nt.filter(n => n.startsWith('_xlnm')).length, pb = nx.filter(n => n.startsWith('_xlnm')).length;
  console.log(`  noms definis  modele=${nt.length}  liasse=${nx.length}  (dont zones d'impression: ${pa} -> ${pb})  noms d'identite/periode perdus=${lost.length}${lost.length ? '  (ex: ' + lost.slice(0, 5).join(', ') + ')' : ''}`);
  if (lost.length) P(`${lost.length} noms definis perdus`); if (pa !== pb) P(`zones d'impression: ${pa} -> ${pb}`);
  console.log(`  calcPr modele : ${(zipRead(TPL, 'xl/workbook.xml').match(/<calcPr[^>]*>/) || ['-'])[0]}`);
  console.log(`  calcPr liasse : ${(zipRead(EXP, 'xl/workbook.xml').match(/<calcPr[^>]*>/) || ['-'])[0]}`);

  // ===== 2. MISE EN PAGE PAR FEUILLE =====
  const wt = await load(TPL), we = await load(EXP);
  console.log('\n=== 2. MISE EN PAGE (fusions, largeurs de colonnes, zone d\'impression, orientation) ===');
  let nLay = 0;
  wt.eachSheet(a => { const b = we.getWorksheet(a.name); if (!b) { P(`feuille absente de la liasse: ${a.name}`); return; }
    const d = [];
    const ma = (a.model.merges || []).slice().sort().join(','), mb = (b.model.merges || []).slice().sort().join(','); if (ma !== mb) d.push('fusions');
    const wa = a.columns.slice(0, 26).map(c => c && c.width ? Math.round(c.width * 10) : 0).join(','), wb2 = b.columns.slice(0, 26).map(c => c && c.width ? Math.round(c.width * 10) : 0).join(','); if (wa !== wb2) d.push('largeurs');
    if ((a.pageSetup.printArea || '') !== (b.pageSetup.printArea || '')) d.push('zone d\'impression');
    if (a.pageSetup.orientation !== b.pageSetup.orientation) d.push('orientation');
    if (d.length) { nLay++; P(`${a.name}: ${d.join(', ')}`); } });
  if (!nLay) console.log('  OK : identique sur toutes les feuilles');

  // ===== 3. CONTENU CELLULE PAR CELLULE =====
  console.log('\n=== 3. CONTENU (extraction + comparaison) ===');
  const mt = extract(wt), me = extract(we);
  const n1 = dump(mt, path.join(OUT, 'liasse_modele_dump.txt')), n2 = dump(me, path.join(OUT, 'liasse_export_dump.txt'));
  console.log(`  cellules non vides : modele=${n1}  liasse=${n2}   (extraction : ${OUT}/liasse_modele_dump.txt , liasse_export_dump.txt)`);
  const stat = {}; const S = (sn, k) => { (stat[sn] = stat[sn] || {})[k] = (stat[sn][k] || 0) + 1; };
  const unexpected = [];
  for (const [sn, a] of mt) { const b = me.get(sn) || new Map();
    const keys = new Set([...a.keys(), ...b.keys()]);
    for (const addr of keys) {
      const t = a.get(addr), e = b.get(addr), k = `${sn}!${addr}`, ok = attendu(k);
      let cls = null;
      if (t && e) {
        if (t.t === 'F') cls = e.t === 'F' ? (t.v === e.v ? null : 'FORMULE_ALTEREE') : 'FORMULE_PERDUE';
        else if (t.t === 'S') cls = (e.t === 'S' && e.v === t.v) ? null : 'LIBELLE_MODIFIE';
        else if (t.t === 'N') cls = (e.t === 'N' && e.v === t.v) ? null : (isStruct(k) ? 'NOMBRE_STRUCTUREL_MODIFIE' : 'DONNEE');
        else cls = JSON.stringify(t.v) === JSON.stringify(e.v) ? null : 'AUTRE_MODIFIE';
        if (!cls && t.st !== e.st) cls = 'STYLE_MODIFIE';
      } else if (t && !e) cls = t.t === 'F' ? 'FORMULE_PERDUE' : t.t === 'S' ? 'LIBELLE_SUPPRIME' : (isStruct(k) ? 'NOMBRE_STRUCTUREL_MODIFIE' : 'DONNEE');
      else if (!t && e) cls = e.t === 'N' ? 'DONNEE' : e.t === 'F' ? 'FORMULE_AJOUTEE' : 'TEXTE_AJOUTE';
      if (!cls) continue;
      const info = cls === 'DONNEE';
      S(sn, cls);
      rows.push([sn, addr, cls, ok ? 'oui' : (info ? 'donnee' : 'NON'), t ? String(t.v) : '', e ? String(e.v) : '']);
      if (!ok && !info) unexpected.push(`${cls.padEnd(26)} ${k}  modele=${t ? String(t.v).slice(0, 45) : '∅'}  liasse=${e ? String(e.v).slice(0, 45) : '∅'}`);
    } }
  const classes = ['DONNEE', 'LIBELLE_MODIFIE', 'LIBELLE_SUPPRIME', 'FORMULE_ALTEREE', 'FORMULE_PERDUE', 'FORMULE_AJOUTEE', 'NOMBRE_STRUCTUREL_MODIFIE', 'TEXTE_AJOUTE', 'STYLE_MODIFIE', 'AUTRE_MODIFIE'];
  console.log('\n  ' + 'feuille'.padEnd(24) + classes.map(c => c.replace(/_/g, ' ').slice(0, 9).padStart(10)).join(''));
  let tot = {}; for (const [sn, o] of Object.entries(stat)) { console.log('  ' + sn.padEnd(24) + classes.map(c => String(o[c] || '').padStart(10)).join('')); for (const c of classes) tot[c] = (tot[c] || 0) + (o[c] || 0); }
  console.log('  ' + 'TOTAL'.padEnd(24) + classes.map(c => String(tot[c] || 0).padStart(10)).join(''));
  console.log('  (colonnes : ' + classes.join(' | ') + ')');
  console.log(`\n  Ecarts NON ATTENDUS hors donnees (libelles, formules, nombres structurels, styles) : ${unexpected.length}`);
  unexpected.slice(0, 40).forEach(x => console.log('   ✗ ' + x)); if (unexpected.length > 40) console.log(`   ... +${unexpected.length - 40} (voir liasse_ecarts.csv)`);
  if (unexpected.length) problems.push(`${unexpected.length} ecarts de contenu non attendus`);

  // ===== 4. FUITES D'ENTITE =====
  console.log('\n=== 4. FUITES de l\'entite du modele (textes + nombres >= 1000 du modele retrouves dans la liasse) ===');
  const nums = new Set(); for (const [sn, m] of mt) if (!sn.startsWith('CORRESP')) for (const c of m.values()) if (c.t === 'N' && Math.abs(c.v) >= 1000) nums.add(c.v);
  const leaks = []; for (const [sn, m] of me) { if (sn === 'PAGE DE GARDE') continue; for (const [a, c] of m) { if (c.t === 'S' && TOK.test(c.v)) leaks.push(`texte  ${sn}!${a} "${c.v.slice(0, 40)}"`); if (c.t === 'N' && nums.has(c.v) && !sn.startsWith('CORRESP')) leaks.push(`nombre ${sn}!${a}=${c.v}`); } }
  console.log(`  ${leaks.length} fuite(s)`); leaks.slice(0, 20).forEach(x => console.log('   ✗ ' + x)); if (leaks.length) problems.push(`${leaks.length} fuites d'entite`);

  const esc = s => '"' + String(s).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
  fs.writeFileSync(path.join(OUT, 'liasse_ecarts.csv'), rows.map(r => r.map(esc).join(';')).join('\n'));
  console.log(`\nDetail complet : ${OUT}/liasse_ecarts.csv (${rows.length - 1} lignes)`);
  console.log(problems.length ? `\nVERDICT : ${problems.length} POINT(S) A TRAITER :\n - ` + problems.join('\n - ') : '\nVERDICT : liasse conforme au modele (hors donnees).');
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error('ECHEC:', e.stack); process.exit(2); });
