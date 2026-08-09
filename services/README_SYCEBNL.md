# sycebnlMapper.js — Moteur de calcul des états financiers SYCEBNL (Associations/ONG)

## Statut
Construit et testé dans cette session à partir du classeur officiel réel
(`LIASSE MSG-SYCEBNL-AOP-Pro V1.xlsm`). Chaque formule de rollup (AZ, BT, BX,
CK, DV, DX, XA-XE, ZB-ZG) a été vérifiée directement contre les formules
Excel du classeur avant d'être codée — pas de formule devinée.
12/12 tests passés (`node test_sycebnlMapper.js`).

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

## Intégration avec pdfGenerator.js / scriptEtatsFinanciers.js
Ce module n'a pas pu être calqué sur la convention exacte de
`syscohadaMapper.js` (le fichier n'a pas pu être transmis dans cette
session). L'export suit une convention CommonJS standard
(`module.exports = { calculerEtatsFinanciers, ... }`). Si le format attendu
par `pdfGenerator.js` diffère (ex. `{ref, libelle, note, brut, amort, net,
net_n1, isTotal}` comme pour SYSCOHADA), il faudra écrire une petite couche
d'adaptation entre `calculerEtatsFinanciers()` et le générateur PDF —
n'hésite pas à revenir avec cette couche à écrire si besoin, une fois que tu
vois comment `pdfGenerator.js` consomme `syscohadaMapper.js`.

## Tester
```bash
node test_sycebnlMapper.js
```

