'use strict';
/**
 * sycebnlOfficialParts.js — reinjecte dans la liasse produite par exceljs les elements du classeur OFFICIEL
 * qu'exceljs ne sait pas conserver : bannieres de titre (formes de dessin) et noms definis d'identite/periode.
 * Les cellules, formules, styles, fusions et zones d'impression restent ceux produits par exceljs.
 * Non restaure : reglages d'imprimante (donnees binaires de pilote ; papier et orientation restent dans pageSetup).
 *
 * API : await restoreOfficialParts(buffer, { originalPath, identite, exercice }) -> Buffer
 *   identite : { nom, sigle, adresse, ifu, centreImpots, ville, tel, rccm }   exercice : { debut:'YYYY-MM-DD', fin:'YYYY-MM-DD' }
 */
const JSZip = require('jszip');
const fs = require('fs');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const T_DRAWING = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing';
const CT_DRAWING = 'application/vnd.openxmlformats-officedocument.drawing+xml';

async function sheetIndex(zip) {           // nom de feuille -> chemin du XML de la feuille
  const wb = await zip.file('xl/workbook.xml').async('string');
  const rels = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  const rid = {};
  for (const m of rels.matchAll(/<Relationship\s[^>]*>/g)) rid[/\sId="([^"]+)"/.exec(m[0])[1]] = /\sTarget="([^"]+)"/.exec(m[0])[1];
  const out = {};
  for (const m of wb.matchAll(/<sheet\s[^>]*>/g)) {
    const name = unesc(/\sname="([^"]*)"/.exec(m[0])[1]), id = /\sr:id="([^"]+)"/.exec(m[0])[1];
    let t = rid[id]; t = t.startsWith('/') ? t.slice(1) : 'xl/' + t; out[name] = t;
  }
  return out;
}
const relsPathOf = p => p.replace(/([^/]+)$/, '_rels/$1.rels');

function parseIso(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; }
const fr = ({ y, m, d }) => `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;

// Valeurs des noms definis pour l'entite (memes formats que le classeur officiel)
function namesFor(id = {}, ex = {}) {
  const v = x => (x && String(x).trim()) ? String(x).trim() : ' ', bare = x => (x && String(x).trim()) ? String(x).trim() : '';
  const nom = v(id.nom), sigle = v(id.sigle), adr = v(id.adresse), ifu = v(id.ifu), ville = bare(id.ville).toUpperCase();
  const S = {
    _soNom: nom, _nSo: nom, _soNom1: `Désignation entité : ${nom}`, _nSo1: `Désignation entité : ${nom}`,
    _soNom2: `DENOMINATION SOCIALE : ${nom}`, _nSo2: `DENOMINATION SOCIALE : ${nom}`,
    _soSigle: sigle, _sigle: sigle, _soSigle2: `SIGLE USUEL :  ${bare(id.sigle)}`,
    _soAdr: adr, _soAdr1: `Adresse de l'entité :  ${bare(id.adresse)}`, _soAdr2: `ADRESSE COMPLETE :  ${bare(id.adresse)}`,
    _soNumFisc: ifu, numFisc: ifu, _soNumFisc1: `Numéro IFU : ${bare(id.ifu)}`, _soNumFisc2: `N° D'IDENTIFICATION FISCALE : ${bare(id.ifu)}`,
    _soNumFisc4: `Numéro d’identification :  ${bare(id.ifu)}`, _soTel: v(id.tel), _regCom: v(id.rccm), _soregCm: v(id.rccm),
    _centreImpot: bare(id.centreImpots) || (ville ? 'CENTRE DES IMPOTS DE ' + ville : ' '), _Ville: ville ? `CENTRE DES IMPÔTS DE ${ville}` : ' ',
  };
  const N = {};
  const fin = parseIso(ex.fin), deb = parseIso(ex.debut);
  if (fin) {
    const fin1 = { y: fin.y - 1, m: fin.m, d: (fin.m === 2 && fin.d === 29) ? 28 : fin.d }, dFin = fr(fin), dFin1 = fr(fin1);
    Object.assign(S, { _ExerClos: `Exercice clos le ${dFin}`, _ExerClosMaj: `EXERCICE CLOS LE ${dFin}`, _ExerFin: ` ${dFin}`, _ExerFin1: ` ${dFin1}`,
      _dFin: ` ${dFin}`, _dAn: ` ${fin.y}`, _dBilan: `BILAN AU ${dFin}`, _dResTax: `RESULTAT TAXABLE AU ${dFin}`, _sTabExer: `Tableau financiers au ${dFin}` });
    if (deb) {
      const dDeb = fr(deb), mois = (fin.y * 12 + fin.m) - (deb.y * 12 + deb.m) + 1;
      Object.assign(S, { _dDeb: ` ${dDeb}`, _ExerPer: `Exercice clos le ${dFin}   Période du ${dDeb} Au ${dFin}`, _Period: `Période du ${dDeb} Au ${dFin}`, _Duree: `Durée (en mois) ${mois}` });
      if (mois >= 1 && mois <= 24) { N._Mois = mois; N._nbMois = mois; }
    }
  }
  return { S, N };
}

async function restoreOfficialParts(buffer, opts) {
  const { originalPath, identite, exercice } = opts;
  const zo = await JSZip.loadAsync(fs.readFileSync(originalPath));
  const ze = await JSZip.loadAsync(buffer);
  const so = await sheetIndex(zo), se = await sheetIndex(ze);
  let ct = await ze.file('[Content_Types].xml').async('string');
  const usedDrawings = new Set(Object.keys(ze.files).filter(f => /^xl\/drawings\/drawing\d+\.xml$/.test(f)));
  let nextDrawing = 1; const freeDrawing = () => { while (usedDrawings.has(`xl/drawings/drawing${nextDrawing}.xml`)) nextDrawing++; const p = `xl/drawings/drawing${nextDrawing}.xml`; usedDrawings.add(p); return { p, n: nextDrawing }; };
  let restored = 0;

  // ---- 1. bannieres (dessins) ----
  for (const [name, pe] of Object.entries(se)) {
    const po = so[name]; if (!po) continue;
    const xo = await zo.file(po).async('string');
    const dm = /<drawing\s+r:id="([^"]+)"\s*\/>/.exec(xo); if (!dm) continue;
    const ro = zo.file(relsPathOf(po)); if (!ro) continue;
    const relsO = await ro.async('string');
    const rel = [...relsO.matchAll(/<Relationship\s[^>]*>/g)].map(m => m[0]).find(r => new RegExp(`\\sId="${dm[1]}"`).test(r));
    if (!rel) continue;
    const target = /\sTarget="([^"]+)"/.exec(rel)[1];                       // ../drawings/drawingK.xml
    const srcDrawing = 'xl/' + target.replace(/^\.\.\//, '');
    const dfile = zo.file(srcDrawing); if (!dfile) continue;
    const dest = freeDrawing();
    ze.file(dest.p, await dfile.async('nodebuffer'));
    const drel = zo.file(srcDrawing.replace(/([^/]+)$/, '_rels/$1.rels'));    // rels du dessin (images...) : copiees telles quelles
    if (drel) ze.file(dest.p.replace(/([^/]+)$/, '_rels/$1.rels'), await drel.async('nodebuffer'));
    ct = ct.replace('</Types>', `<Override PartName="/${dest.p}" ContentType="${CT_DRAWING}"/></Types>`);
    // rels de la feuille (export)
    const rp = relsPathOf(pe); const rid = 'rIdOfficialDrawing1';
    const relXml = `<Relationship Id="${rid}" Type="${T_DRAWING}" Target="../drawings/drawing${dest.n}.xml"/>`;
    const existing = ze.file(rp);
    ze.file(rp, existing ? (await existing.async('string')).replace('</Relationships>', relXml + '</Relationships>')
      : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relXml}</Relationships>`);
    // element <drawing> dans la feuille (ordre du schema : avant legacyDrawing/tableParts/extLst...)
    let xe = await ze.file(pe).async('string');
    if (/<drawing\s/.test(xe)) continue;
    if (!/<worksheet[^>]*xmlns:r=/.test(xe)) xe = xe.replace(/<worksheet\s/, '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
    const tag = `<drawing r:id="${rid}"/>`;
    const after = /<(legacyDrawing|legacyDrawingHF|drawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)[\s>/]/.exec(xe);
    xe = after ? xe.slice(0, after.index) + tag + xe.slice(after.index) : xe.replace('</worksheet>', tag + '</worksheet>');
    ze.file(pe, xe); restored++;
  }
  ze.file('[Content_Types].xml', ct);

  // ---- 2. noms definis (hors zones d'impression deja presentes) ----
  const wbO = await zo.file('xl/workbook.xml').async('string');
  let wbE = await ze.file('xl/workbook.xml').async('string');
  const { S, N } = namesFor(identite, exercice);
  const present = new Set([...wbE.matchAll(/<definedName\s+name="([^"]+)"/g)].map(m => m[1]));
  let add = '', nNames = 0;
  for (const m of wbO.matchAll(/<definedName\s+name="([^"]+)"[^>]*>[^<]*<\/definedName>/g)) {
    const n = m[1]; if (n.startsWith('_xlnm') || present.has(n)) continue;
    const body = (n in N) ? String(N[n]) : (n in S) ? '"' + esc(S[n]).replace(/"/g, '""') + '"' : m[0].replace(/^[^>]*>/, '').replace(/<\/definedName>$/, '');
    // constantes fixes du classeur officiel (pays...) conservees ; nom inconnu => valeur neutre plutot que celle de l'entite du modele
    const known = (n in N) || (n in S) || /^(_Pays|_nCompletPays)$/.test(n);
    add += `<definedName name="${n}">${known ? body : '" "'}</definedName>`; nNames++;
  }
  if (add) {
    if (/<definedNames>/.test(wbE)) wbE = wbE.replace('</definedNames>', add + '</definedNames>');
    else wbE = wbE.replace('</sheets>', '</sheets><definedNames>' + add + '</definedNames>');
    ze.file('xl/workbook.xml', wbE);
  }
  const out = await ze.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  out.stats = { bannieres: restored, noms: nNames };
  return out;
}
module.exports = { restoreOfficialParts, namesFor };
