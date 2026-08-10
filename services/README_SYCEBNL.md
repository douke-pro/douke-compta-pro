# sycebnlMapper.js — Moteur de calcul des états financiers SYCEBNL (Associations/ONG)

## Statut
Construit et testé dans cette session à partir du classeur officiel réel
(`LIASSE MSG-SYCEBNL-AOP-Pro V1.xlsm`). Chaque formule de rollup (AA, AD, AH,
AO, AZ, BT, BX, BZ, CK, DV, DX, DZ, XA-XE, ZB-ZG) a été vérifiée directement
contre les formules Excel du classeur avant d'être codée.
16/16 tests unitaires passés + 1 test d'intégration bout-en-bout (balance →
mapper → adaptateur → vrais PDF via pdfGenerator.js inchangé, bilan équilibré
confirmé, PDF rendu et inspecté visuellement).

## Deux bugs réels trouvés et corrigés avant livraison
1. **TOTAL ACTIF IMMOBILISE (AZ) incomplet** : la formule oubliait la
   catégorie AA (« Immobilisations destinées à la vente provenant de dons et
   legs non reçus, usufruit temporaire »). AZ = AA + AD + AH + AO, pas
   AD + AH + AX + AY. Trouvé en comparant les formules réelles des feuilles
   `BILAN` / `BILAN DRAFT` ligne à ligne.
2. **Résultat net faux dès qu'il y a des charges** : les postes de charge
   (TA-TL, TN) sont stockés en valeur absolue (solde débiteur net) dans la
   table de correspondance ; seule la ligne "POSTE" porte le signe `-` qui
   indique qu'il faut les SOUSTRAIRE du total. Ce signe n'était pas appliqué
   → XB (charges) s'additionnait au lieu de se soustraire, gonflant le
   résultat net. Trouvé par le test d'intégration bout-en-bout (produits +
   charges combinés), pas par les tests unitaires initiaux qui ne testaient
   jamais les deux à la fois.

## sycebnlReportAdapter.js
Nouveau fichier : transforme `calculerEtatsFinanciers()` dans le format exact
attendu par `pdfGenerator.js` (vérifié sur le vrai fichier, format identique
à SYSCOHADA : `{ref, libelle, note, brut, amort, net, net_n1, isTotal}` pour
l'actif, etc.). Usage :

```js
const { buildReportData } = require('./sycebnlReportAdapter');
const reportData = buildReportData(balanceN, balanceN1, {
  company: { name, street, city, zip },
  period: { start, end },
});
const pdfs = await require('./pdfGenerator').generateAllReports(reportData, 'SYCEBNL_NORMAL', requestId);
```

`pdfGenerator.js` n'a besoin d'AUCUNE modification — testé tel quel.

## Ce qui est fiable à 100%
- ACTIF (brut, amortissement, net) — tous postes leaf + rollups AD, AH, AZ, BT, BX
- PASSIF — tous postes leaf + rollups CK, DV, DX (dont CH, qui référence le résultat net)
- RESULTAT — tous postes leaf + rollups XA, XB, XC, XD, XE
- INDICATEURS — calculés à partir des états ci-dessus

## Limite documentée : TFT
65 des 173 lignes de composants du TFT (~38%) n'ont pas de compte préréempli
dans le classeur officiel lui-même (variations de créances/dettes propres au
plan comptable de chaque structure). Le moteur ne devine jamais un compte :
ces lignes sont signalées dans `resultat.avertissements.tft` avec leur
libellé exact, contribution 0. Les rollups ZB→ZG s'enchaînent normalement
avec les lignes disponibles.

## Comparatif N-1
`ZA` (trésorerie nette au 1er janvier) nécessite `balanceN1`. Sans elle,
`ZA=0` et un avertissement est ajouté.

## Usage

```js
const { calculerEtatsFinanciers } = require('./sycebnlMapper');

const balanceN = [
  { compte: '701', sid: 0, sic: 2500000, md: 0, mc: 2500000, sfd: 0, sfc: 2500000 },
];

const etats = calculerEtatsFinanciers(balanceN, balanceN1 /* optionnel */);
// etats.actif.AZ.net   -> TOTAL ACTIF IMMOBILISE
// etats.passif.CK      -> TOTAL FONDS PROPRES ET ASSIMILES
// etats.resultat.XE    -> RESULTAT NET DE L'EXERCICE
// etats.tft.ZG         -> Trésorerie nette de clôture
// etats.avertissements.tft -> lignes TFT non résolues, à vérifier manuellement
```

## Tester
```bash
node test_sycebnlMapper.js
```

