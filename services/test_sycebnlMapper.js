const { calculerEtatsFinanciers, loadMapping, loadSubtotals } = require('./sycebnlMapper');

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} — attendu ${expected}, obtenu ${actual}`);
  if (!ok) failures++;
}

console.log('=== TEST 1 : chargement des données ===');
const mapping = loadMapping();
const subtotals = loadSubtotals();
check('lignes mapping', mapping.length, 614);
check('lignes subtotals', Object.keys(subtotals).length, 19);

console.log('\n=== TEST 2 : structure vide -> pas de crash ===');
const vide = calculerEtatsFinanciers([], []);
check('ACTIF.AB vide', vide.actif.AB.net, 0);
check('RESULTAT.XE vide', vide.resultat.XE, 0);

console.log('\n=== TEST 3 : cotisations (Application 13 du guide) ===');
const balanceCotis = [{ compte: '701', sid: 0, sic: 2500000, md: 0, mc: 2500000, sfd: 0, sfc: 2500000 }];
const t3 = calculerEtatsFinanciers(balanceCotis, []);
check('RESULTAT.RA', t3.resultat.RA, 2500000);
check('RESULTAT.XA', t3.resultat.XA, 2500000);
check('RESULTAT.XE (aucune charge)', t3.resultat.XE, 2500000);

console.log('\n=== TEST 4 : dotation non consomptible (Application 1 du guide) ===');
const balanceDotation = [{ compte: '1015', sid: 0, sic: 33000000, md: 0, mc: 33000000, sfd: 0, sfc: 33000000 }];
const t4 = calculerEtatsFinanciers(balanceDotation, []);
check('PASSIF.CA', t4.passif.CA, 33000000);
check('PASSIF.CK (rollup fonds propres)', t4.passif.CK, 33000000);

console.log('\n=== TEST 5 : PASSIF.CH intègre le résultat net (référence croisée) ===');
const balanceMixte = [{ compte: '701', sid: 0, sic: 5000000, md: 0, mc: 5000000, sfd: 0, sfc: 5000000 }];
const t5 = calculerEtatsFinanciers(balanceMixte, []);
check('RESULTAT.XE', t5.resultat.XE, 5000000);
check('PASSIF.CH = XE', t5.passif.CH, t5.resultat.XE);
check('PASSIF.CK inclut CH', t5.passif.CK, 5000000);

console.log('\n=== TEST 6 : trésorerie (BX, DX) et rollup ACTIF ===');
const balanceTreso = [
  { compte: '521', sid: 0, sic: 0, md: 0, mc: 0, sfd: 10000000, sfc: 0 }, // banque (52 -> BW)
  { compte: '561', sid: 0, sic: 0, md: 0, mc: 0, sfd: 0, sfc: 3000000 },  // découvert (56 -> DW)
];
const t6 = calculerEtatsFinanciers(balanceTreso, []);
check('ACTIF.BX (trésorerie actif)', t6.actif.BX.net, 10000000);
check('PASSIF.DX (trésorerie passif)', t6.passif.DX, 3000000);

console.log('\n=== TEST 7 : TFT — ZB à ZG s\'enchaînent sans crash ===');
const t7 = calculerEtatsFinanciers(balanceCotis, balanceCotis);
check('TFT.ZG est un nombre', typeof t7.tft.ZG === 'number', true);
console.log('    (avertissements TFT signalés:', t7.avertissements.tft.length, '— attendu, comptes propres à chaque entité)');

console.log(failures === 0 ? '\nTOUS LES TESTS SONT PASSÉS.' : `\n${failures} TEST(S) EN ÉCHEC.`);
process.exit(failures === 0 ? 0 : 1);

