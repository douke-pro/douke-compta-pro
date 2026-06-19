'use strict';

const ACTIF_MAPPING = [
    { ref: 'AD', libelle: 'IMMOBILISATIONS INCORPORELLES', note: '3', isTotalLine: true,
      comptes_brut: ['201','202','203','204','205','206','207','208'], comptes_amort: ['2801','2802','2803','2804','2805','2806','2807','2808'] },
    { ref: 'AE', libelle: 'Frais de développement et de prospection', note: '',
      comptes_brut: ['2011','2012'], comptes_amort: ['28011','28012'] },
    { ref: 'AF', libelle: 'Brevets, licences, logiciels et droits similaires', note: '',
      comptes_brut: ['202','203'], comptes_amort: ['2802','2803'] },
    { ref: 'AG', libelle: 'Fonds commercial et droit au bail', note: '',
      comptes_brut: ['206','207'], comptes_amort: ['2806','2807'] },
    { ref: 'AH', libelle: 'Autres immobilisations incorporelles', note: '',
      comptes_brut: ['204','205','208'], comptes_amort: ['2804','2805','2808'] },
    { ref: 'AI', libelle: 'IMMOBILISATIONS CORPORELLES', note: '3', isTotalLine: true,
      comptes_brut: ['211','212','213','214','215','218'], comptes_amort: ['2811','2812','2813','2814','2815','2818'] },
    { ref: 'AJ', libelle: 'Terrains', note: '', comptes_brut: ['211'], comptes_amort: ['2811'] },
    { ref: 'AK', libelle: 'Bâtiments', note: '', comptes_brut: ['212'], comptes_amort: ['2812'] },
    { ref: 'AL', libelle: 'Aménagements, agencements et installations', note: '', comptes_brut: ['213'], comptes_amort: ['2813'] },
    { ref: 'AM', libelle: 'Matériel, mobilier et actifs biologiques', note: '', comptes_brut: ['214','215'], comptes_amort: ['2814','2815'] },
    { ref: 'AN', libelle: 'Matériel de transport', note: '', comptes_brut: ['218'], comptes_amort: ['2818'] },
    { ref: 'AP', libelle: 'AVANCES ET ACOMPTES VERSÉS SUR IMMOBILISATIONS', note: '', comptes_brut: ['231','232'], comptes_amort: [] },
    { ref: 'AQ', libelle: 'IMMOBILISATIONS FINANCIÈRES', note: '4', isTotalLine: true,
      comptes_brut: ['261','262','265','266','267','271','272','273','274','275','276'],
      comptes_amort: ['2961','2962','2965','2966','2967','2971','2972','2973','2974','2975','2976'] },
    { ref: 'AR', libelle: 'Titres de participation', note: '', comptes_brut: ['261','262','265','266','267'], comptes_amort: ['2961','2962','2965','2966','2967'] },
    { ref: 'AS', libelle: 'Autres immobilisations financières', note: '', comptes_brut: ['271','272','273','274','275','276'], comptes_amort: ['2971','2972','2973','2974','2975','2976'] },
    { ref: 'AZ', libelle: 'TOTAL ACTIF IMMOBILISÉ', note: '', isGrandTotal: true, refs_sum: ['AD','AI','AP','AQ'] },
    { ref: 'BA', libelle: 'ACTIF CIRCULANT HAO', note: '5', comptes_brut: ['481','485','488'], comptes_amort: ['4981','4985','4988'] },
    { ref: 'BB', libelle: 'STOCKS ET ENCOURS', note: '6', isTotalLine: true,
      comptes_brut: ['31','32','33','34','35','36','37','38'], comptes_amort: ['391','392','393','394','395','396','397','398'] },
    { ref: 'BG', libelle: 'CRÉANCES ET EMPLOIS ASSIMILÉS', note: '', isTotalLine: true,
      comptes_brut: ['401','408','409','411','412','416','418','419','421','422','423','424','425','426','427','428','431','437','441','444','445','446','447','448','451','452','453','454','455','456','457','458','461','464','465','467','468'],
      comptes_amort: ['491','496','497','499'] },
    { ref: 'BH', libelle: 'Fournisseurs avances versées', note: '17', comptes_brut: ['409'], comptes_amort: [] },
    { ref: 'BI', libelle: 'Clients', note: '7', comptes_brut: ['411','412','416','418','419'], comptes_amort: ['491'] },
    { ref: 'BJ', libelle: 'Autres créances', note: '8',
      comptes_brut: ['421','422','423','424','425','426','427','428','431','437','441','444','445','446','447','448','451','452','453','454','455','456','457','458','461','464','465','467','468'],
      comptes_amort: ['496','497','499'] },
    { ref: 'BK', libelle: 'TOTAL ACTIF CIRCULANT', note: '', isGrandTotal: true, refs_sum: ['BA','BB','BG'] },
    { ref: 'BQ', libelle: 'Titres de placement', note: '9', comptes_brut: ['50'], comptes_amort: ['590'] },
    { ref: 'BR', libelle: 'Valeurs à encaisser', note: '10', comptes_brut: ['511','512','514'], comptes_amort: [] },
    { ref: 'BS', libelle: 'Banques, chèques postaux, caisse et assimilés', note: '11', comptes_brut: ['521','522','531','532','541','551','561','571'], comptes_amort: [] },
    { ref: 'BT', libelle: 'TOTAL TRÉSORERIE-ACTIF', note: '', isGrandTotal: true, refs_sum: ['BQ','BR','BS'] },
    { ref: 'BU', libelle: 'Écart de conversion-Actif', note: '12', comptes_brut: ['476'], comptes_amort: [] },
    { ref: 'BZ', libelle: 'TOTAL GÉNÉRAL', note: '', isGrandTotal: true, refs_sum: ['AZ','BK','BT','BU'] },
];

const PASSIF_MAPPING = [
    { ref: 'CA', libelle: 'Capital', note: '13', comptes: ['101','102','103','104','105','106','109'], sens: 'credit' },
    { ref: 'CB', libelle: 'Apporteurs capital non appelé (-)', note: '13', comptes: ['1094'], sens: 'debit', negatif: true },
    { ref: 'CD', libelle: 'Primes liées au capital social', note: '14', comptes: ['111','112','113','114'], sens: 'credit' },
    { ref: 'CE', libelle: 'Écarts de réévaluation', note: '3e', comptes: ['121'], sens: 'credit' },
    { ref: 'CF', libelle: 'Réserves indisponibles', note: '14', comptes: ['1311','1312','1313','1318'], sens: 'credit' },
    { ref: 'CG', libelle: 'Réserves libres', note: '14', comptes: ['132','133','134','138'], sens: 'credit' },
    { ref: 'CH', libelle: 'Report à nouveau (+ ou -)', note: '14', comptes: ['141','142'], sens: 'solde' },
    { ref: 'CJ', libelle: "Résultat net de l'exercice", note: '', comptes: ['131','139'], sens: 'solde', fromResultat: true },
    { ref: 'CL', libelle: "Subventions d'investissement", note: '15', comptes: ['141'], sens: 'credit' },
    { ref: 'CM', libelle: 'Provisions réglementées', note: '15', comptes: ['151','152','153','154','155','156','158'], sens: 'credit' },
    { ref: 'CP', libelle: 'TOTAL CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES', note: '', isGrandTotal: true, refs_sum: ['CA','CB','CD','CE','CF','CG','CH','CJ','CL','CM'] },
    { ref: 'DA', libelle: 'Emprunts et dettes financières diverses', note: '16', comptes: ['161','162','163','164','165','166','167','168'], sens: 'credit' },
    { ref: 'DB', libelle: 'Dettes de location-acquisition', note: '16', comptes: ['172','174'], sens: 'credit' },
    { ref: 'DC', libelle: 'Provisions pour risques et charges', note: '16', comptes: ['191','194','195','196','197','198'], sens: 'credit' },
    { ref: 'DD', libelle: 'TOTAL DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES', note: '', isGrandTotal: true, refs_sum: ['DA','DB','DC'] },
    { ref: 'DF', libelle: 'TOTAL RESSOURCES STABLES', note: '', isGrandTotal: true, refs_sum: ['CP','DD'] },
    { ref: 'DH', libelle: 'Dettes circulantes HAO', note: '5', comptes: ['481','485','488'], sens: 'credit' },
    { ref: 'DI', libelle: 'Clients, avances reçues', note: '7', comptes: ['4191'], sens: 'credit' },
    { ref: 'DJ', libelle: "Fournisseurs d'exploitation", note: '17', comptes: ['401','402','404','405','408'], sens: 'credit' },
    { ref: 'DK', libelle: 'Dettes fiscales et sociales', note: '18', comptes: ['431','432','433','434','435','436','437','438','441','442','443','444','445','446','447','448'], sens: 'credit' },
    { ref: 'DM', libelle: 'Autres dettes', note: '19', comptes: ['461','462','463','464','465','466','467','468'], sens: 'credit' },
    { ref: 'DN', libelle: 'Provisions pour risques et charges à court terme', note: '19', comptes: ['499'], sens: 'credit' },
    { ref: 'DP', libelle: 'TOTAL PASSIF CIRCULANT', note: '', isGrandTotal: true, refs_sum: ['DH','DI','DJ','DK','DM','DN'] },
    { ref: 'DQ', libelle: "Banques, crédits d'escompte", note: '20', comptes: ['564','565'], sens: 'credit' },
    { ref: 'DR', libelle: 'Banques, établissements financiers et crédits de trésorerie', note: '20', comptes: ['561','562','563','566','567'], sens: 'credit' },
    { ref: 'DT', libelle: 'TOTAL TRÉSORERIE-PASSIF', note: '', isGrandTotal: true, refs_sum: ['DQ','DR'] },
    { ref: 'DV', libelle: 'Écart de conversion-Passif', note: '12', comptes: ['477'], sens: 'credit' },
    { ref: 'DZ', libelle: 'TOTAL GÉNÉRAL', note: '', isGrandTotal: true, refs_sum: ['DF','DP','DT','DV'] },
];

const RESULTAT_MAPPING = [
    { ref: 'TA', libelle: 'Ventes de marchandises', sens: '+', note: '21', comptes: ['701'], type: 'produit' },
    { ref: 'RA', libelle: 'Achats de marchandises', sens: '-', note: '22', comptes: ['601'], type: 'charge' },
    { ref: 'RB', libelle: 'Variation de stocks de marchandises', sens: '-/+', note: '6', comptes: ['6031'], type: 'variation' },
    { ref: 'XA', libelle: 'MARGE COMMERCIALE', sens: '', note: '', isTotal: true, refs_sum: ['TA','RA','RB'] },
    { ref: 'TB', libelle: 'Ventes de produits fabriqués', sens: '+', note: '21', comptes: ['702'], type: 'produit' },
    { ref: 'TC', libelle: 'Travaux, services vendus', sens: '+', note: '21', comptes: ['703','704','705'], type: 'produit' },
    { ref: 'TD', libelle: 'Produits accessoires', sens: '+', note: '21', comptes: ['706','707','708'], type: 'produit' },
    { ref: 'XB', libelle: "CHIFFRE D'AFFAIRES", sens: '', note: '', isTotal: true, refs_sum: ['TA','TB','TC','TD'] },
    { ref: 'TE', libelle: 'Production stockée (ou déstockage)', sens: '-/+', note: '6', comptes: ['7031','7032','7033'], type: 'variation' },
    { ref: 'TF', libelle: 'Production immobilisée', sens: '+', note: '21', comptes: ['72'], type: 'produit' },
    { ref: 'TG', libelle: "Subventions d'exploitation", sens: '+', note: '21', comptes: ['71'], type: 'produit' },
    { ref: 'TH', libelle: 'Autres produits', sens: '+', note: '21', comptes: ['75'], type: 'produit' },
    { ref: 'TI', libelle: "Transferts de charges d'exploitation", sens: '+', note: '12', comptes: ['781','791'], type: 'produit' },
    { ref: 'RC', libelle: 'Achats de matières premières et fournitures liées', sens: '-', note: '22', comptes: ['602'], type: 'charge' },
    { ref: 'RD', libelle: 'Variation de stocks matières premières', sens: '-/+', note: '6', comptes: ['6032'], type: 'variation' },
    { ref: 'RE', libelle: 'Autres achats', sens: '-', note: '22', comptes: ['604','605','608'], type: 'charge' },
    { ref: 'RF', libelle: "Variation de stocks d'autres approvisionnements", sens: '-/+', note: '6', comptes: ['6033'], type: 'variation' },
    { ref: 'RG', libelle: 'Transports', sens: '-', note: '23', comptes: ['61'], type: 'charge' },
    { ref: 'RH', libelle: 'Services extérieurs', sens: '-', note: '24', comptes: ['62','63'], type: 'charge' },
    { ref: 'RI', libelle: 'Impôts et taxes', sens: '-', note: '25', comptes: ['64'], type: 'charge' },
    { ref: 'RJ', libelle: 'Autres charges', sens: '-', note: '26', comptes: ['65'], type: 'charge' },
    { ref: 'XC', libelle: 'VALEUR AJOUTÉE', sens: '', note: '', isTotal: true, refs_sum: ['XA','TB','TC','TD','TE','TF','TG','TH','TI','RC','RD','RE','RF','RG','RH','RI','RJ'] },
    { ref: 'RK', libelle: 'Charges de personnel', sens: '-', note: '27', comptes: ['661','662','663','664','665','666','667','668'], type: 'charge' },
    { ref: 'XD', libelle: "EXCÉDENT BRUT D'EXPLOITATION", sens: '', note: '', isTotal: true, refs_sum: ['XC','RK'] },
    { ref: 'TJ', libelle: "Reprises d'amortissements, provisions et dépréciations", sens: '+', note: '28', comptes: ['781','791'], type: 'produit' },
    { ref: 'RL', libelle: "Dotations aux amortissements, aux provisions et dépréciations", sens: '-', note: '28', comptes: ['681','691'], type: 'charge' },
    { ref: 'XE', libelle: "RÉSULTAT D'EXPLOITATION", sens: '', note: '', isTotal: true, refs_sum: ['XD','TJ','RL'] },
    { ref: 'TK', libelle: 'Revenus financiers et assimilés', sens: '+', note: '29', comptes: ['77'], type: 'produit' },
    { ref: 'TL', libelle: 'Reprises de provisions et dépréciations financières', sens: '+', note: '28', comptes: ['797'], type: 'produit' },
    { ref: 'TM', libelle: 'Transferts de charges financières', sens: '+', note: '12', comptes: ['787'], type: 'produit' },
    { ref: 'RM', libelle: 'Frais financiers et charges assimilées', sens: '-', note: '29', comptes: ['67'], type: 'charge' },
    { ref: 'RN', libelle: 'Dotations aux provisions et aux dépréciations financières', sens: '-', note: '28', comptes: ['697'], type: 'charge' },
    { ref: 'XF', libelle: 'RÉSULTAT FINANCIER', sens: '', note: '', isTotal: true, refs_sum: ['TK','TL','TM','RM','RN'] },
    { ref: 'XG', libelle: 'RÉSULTAT DES ACTIVITÉS ORDINAIRES', sens: '', note: '', isTotal: true, refs_sum: ['XE','XF'] },
    { ref: 'TN', libelle: "Produits des cessions d'immobilisations", sens: '+', note: '3D', comptes: ['82'], type: 'produit' },
    { ref: 'TO', libelle: 'Autres Produits HAO', sens: '+', note: '30', comptes: ['88'], type: 'produit' },
    { ref: 'RO', libelle: "Valeurs comptables des cessions d'immobilisations", sens: '-', note: '3D', comptes: ['81'], type: 'charge' },
    { ref: 'RP', libelle: 'Autres Charges HAO', sens: '-', note: '30', comptes: ['83'], type: 'charge' },
    { ref: 'XH', libelle: 'RÉSULTAT HORS ACTIVITÉS ORDINAIRES', sens: '', note: '', isTotal: true, refs_sum: ['TN','TO','RO','RP'] },
    { ref: 'RQ', libelle: 'Participation des travailleurs', sens: '-', note: '30', comptes: ['661'], type: 'charge' },
    { ref: 'RS', libelle: 'Impôts sur le résultat', sens: '-', note: '37', comptes: ['891'], type: 'charge' },
    { ref: 'XI', libelle: 'RÉSULTAT NET', sens: '', note: '', isTotal: true, refs_sum: ['XG','XH','RQ','RS'] },
];

const TFT_MAPPING = [
    { ref: 'ZA', libelle: 'Trésorerie nette au 1er janvier', sens: 'A', fromBilan: true },
    { ref: 'FA', libelle: "Capacité d'Autofinancement Globale (CAFG)", sens: '+', comptes: [], fromResultat: 'XD' },
    { ref: 'FB', libelle: "Variation d'actif circulant HAO", sens: '-', comptes: ['481','485','488'] },
    { ref: 'FC', libelle: 'Variation des stocks', sens: '-', comptes: ['31','32','33','34','35','36','37','38'] },
    { ref: 'FD', libelle: 'Variation des créances', sens: '-', comptes: ['411','412','416','418','419','421','431','441','451','461'] },
    { ref: 'FE', libelle: 'Variation du passif circulant', sens: '+', comptes: ['401','431','441','461','481'] },
    { ref: 'ZB', libelle: 'Flux de trésorerie activités opérationnelles', sens: 'B', isTotal: true, refs_sum: ['FA','FB','FC','FD','FE'] },
    { ref: 'FF', libelle: "Acquisitions d'immos incorporelles", sens: '-', comptes: ['201','202','203','204','205','206','207','208'] },
    { ref: 'FG', libelle: "Acquisitions d'immos corporelles", sens: '-', comptes: ['211','212','213','214','215','218'] },
    { ref: 'FH', libelle: "Acquisitions d'immos financières", sens: '-', comptes: ['261','262','265','266','267','271','272','273','274','275','276'] },
    { ref: 'FI', libelle: 'Cessions immos incorporelles et corporelles', sens: '+', comptes: ['82'] },
    { ref: 'FJ', libelle: 'Cessions immos financières', sens: '+', comptes: ['77'] },
    { ref: 'ZC', libelle: "Flux de trésorerie activités d'investissement", sens: 'C', isTotal: true, refs_sum: ['FF','FG','FH','FI','FJ'] },
    { ref: 'FK', libelle: 'Augmentations de capital', sens: '+', comptes: ['101','102','103','104','105'] },
    { ref: 'FL', libelle: "Subventions d'investissement reçues", sens: '+', comptes: ['141'] },
    { ref: 'FM', libelle: 'Prélèvements sur le capital', sens: '-', comptes: ['1094'] },
    { ref: 'FN', libelle: 'Dividendes versés', sens: '-', comptes: ['465'] },
    { ref: 'ZD', libelle: 'Flux capitaux propres', sens: 'D', isTotal: true, refs_sum: ['FK','FL','FM','FN'] },
    { ref: 'FO', libelle: 'Emprunts', sens: '+', comptes: ['161','162','1661','1662'] },
    { ref: 'FP', libelle: 'Autres dettes financières', sens: '+', comptes: ['163','164','165','166','167','168','18'] },
    { ref: 'FQ', libelle: 'Remboursements emprunts', sens: '-', comptes: ['161','162','163','164','165','166','167','168'] },
    { ref: 'ZE', libelle: 'Flux capitaux étrangers', sens: 'E', isTotal: true, refs_sum: ['FO','FP','FQ'] },
    { ref: 'ZF', libelle: 'Flux activités de financement (D+E)', sens: 'F', isTotal: true, refs_sum: ['ZD','ZE'] },
    { ref: 'ZG', libelle: 'VARIATION DE LA TRÉSORERIE NETTE (B+C+F)', sens: 'G', isTotal: true, refs_sum: ['ZB','ZC','ZF'] },
    { ref: 'ZH', libelle: 'Trésorerie nette au 31 Décembre (G+A)', sens: 'H', isTotal: true, refs_sum: ['ZG','ZA'] },
];

function buildAccountIndex(balanceAccounts) {
    const index = {};
    for (const acc of (balanceAccounts || [])) {
        if (!index[acc.code]) index[acc.code] = { opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
        index[acc.code].opening_debit  += acc.opening_debit  || 0;
        index[acc.code].opening_credit += acc.opening_credit || 0;
        index[acc.code].debit          += acc.debit          || 0;
        index[acc.code].credit         += acc.credit         || 0;
    }
    return index;
}

function sumBrut(index, prefixes) {
    let total = 0;
    for (const [code, acc] of Object.entries(index)) {
        if (prefixes.some(p => code.startsWith(p))) {
            const d = acc.opening_debit + acc.debit;
            const c = acc.opening_credit + acc.credit;
            total += Math.max(0, d - c);
        }
    }
    return total;
}

function sumAmort(index, prefixes) {
    let total = 0;
    for (const [code, acc] of Object.entries(index)) {
        if (prefixes.some(p => code.startsWith(p))) {
            const d = acc.opening_debit + acc.debit;
            const c = acc.opening_credit + acc.credit;
            total += Math.max(0, c - d);
        }
    }
    return total;
}

function sumPassif(index, prefixes, negatif = false) {
    let total = 0;
    for (const [code, acc] of Object.entries(index)) {
        if (prefixes.some(p => code.startsWith(p))) {
            const d = acc.opening_debit + acc.debit;
            const c = acc.opening_credit + acc.credit;
            const solde = c - d;
            total += negatif ? Math.max(0, -solde) : solde;
        }
    }
    return total;
}

function sumResultat(index, prefixes, type) {
    let total = 0;
    for (const [code, acc] of Object.entries(index)) {
        if (prefixes.some(p => code.startsWith(p))) {
            const d = acc.opening_debit + acc.debit;
            const c = acc.opening_credit + acc.credit;
            if (type === 'produit')       total += Math.max(0, c - d);
            else if (type === 'charge')   total += Math.max(0, d - c);
            else                          total += (c - d);
        }
    }
    return total;
}

function computeActif(balanceAccounts, prevYearBalances = []) {
    const index   = buildAccountIndex(balanceAccounts);
    const indexN1 = buildAccountIndex(prevYearBalances);
    const refValues = {};
    return ACTIF_MAPPING.map(ligne => {
        let brut = 0, amort = 0, net = 0, net_n1 = 0;
        if (ligne.isGrandTotal) {
            brut   = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.brut  || 0), 0);
            amort  = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.amort || 0), 0);
            net    = brut - amort;
            net_n1 = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.net_n1 || 0), 0);
        } else {
            brut   = sumBrut(index,   ligne.comptes_brut  || []);
            amort  = sumAmort(index,  ligne.comptes_amort || []);
            net    = brut - amort;
            net_n1 = sumBrut(indexN1, ligne.comptes_brut || []) - sumAmort(indexN1, ligne.comptes_amort || []);
        }
        refValues[ligne.ref] = { brut, amort, net, net_n1 };
        return { ref: ligne.ref, libelle: ligne.libelle, note: ligne.note || '', brut: Math.round(brut), amort: Math.round(amort), net: Math.round(net), net_n1: Math.round(net_n1), isTotal: !!(ligne.isGrandTotal || ligne.isTotalLine) };
    });
}

function computePassif(balanceAccounts, prevYearBalances = [], resultatNet = 0) {
    const index   = buildAccountIndex(balanceAccounts);
    const indexN1 = buildAccountIndex(prevYearBalances);
    const refValues = {};
    return PASSIF_MAPPING.map(ligne => {
        let net = 0, net_n1 = 0;
        if (ligne.isGrandTotal) {
            net    = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.net   || 0), 0);
            net_n1 = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.net_n1 || 0), 0);
        } else if (ligne.fromResultat) {
            net = resultatNet; net_n1 = 0;
        } else {
            net    = sumPassif(index,   ligne.comptes || [], ligne.negatif || false);
            net_n1 = sumPassif(indexN1, ligne.comptes || [], ligne.negatif || false);
        }
        refValues[ligne.ref] = { net, net_n1 };
        return { ref: ligne.ref, libelle: ligne.libelle, note: ligne.note || '', net: Math.round(net), net_n1: Math.round(net_n1), isTotal: !!(ligne.isGrandTotal) };
    });
}

function computeResultat(balanceAccounts, prevYearBalances = []) {
    const index   = buildAccountIndex(balanceAccounts);
    const indexN1 = buildAccountIndex(prevYearBalances);
    const refValues = {};
    return RESULTAT_MAPPING.map(ligne => {
        let montant_n = 0, montant_n1 = 0;
        if (ligne.isTotal) {
            montant_n  = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.n  || 0), 0);
            montant_n1 = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.n1 || 0), 0);
        } else {
            montant_n  = sumResultat(index,   ligne.comptes || [], ligne.type);
            montant_n1 = sumResultat(indexN1, ligne.comptes || [], ligne.type);
            if (ligne.type === 'charge') { montant_n = -montant_n; montant_n1 = -montant_n1; }
        }
        refValues[ligne.ref] = { n: montant_n, n1: montant_n1 };
        return { ref: ligne.ref, libelle: ligne.libelle, sens: ligne.sens || '', note: ligne.note || '', montant_n: Math.round(montant_n), montant_n1: Math.round(montant_n1), isTotal: !!(ligne.isTotal) };
    });
}

function computeTFT(balanceAccounts, bilanN = {}, bilanN1 = {}) {
    const index = buildAccountIndex(balanceAccounts);
    const refValues = {};
    const tresActifN1  = (bilanN1.actif  || []).find(l => l.ref === 'BT')?.net || 0;
    const tresPassifN1 = (bilanN1.passif || []).find(l => l.ref === 'DT')?.net || 0;
    const tresOuv = tresActifN1 - tresPassifN1;
    const cafg = (bilanN.resultat || []).find(l => l.ref === 'XD')?.montant_n || 0;
    return TFT_MAPPING.map(ligne => {
        let montant_n = 0;
        if (ligne.ref === 'ZA') { montant_n = tresOuv; }
        else if (ligne.fromResultat) { montant_n = cafg; }
        else if (ligne.isTotal) { montant_n = ligne.refs_sum.reduce((s, r) => s + (refValues[r]?.n || 0), 0); }
        else if (ligne.comptes?.length) {
            for (const [code, acc] of Object.entries(index)) {
                if (ligne.comptes.some(p => code.startsWith(p))) montant_n += (acc.debit - acc.credit);
            }
            if (ligne.sens === '+') montant_n = Math.abs(montant_n);
            if (ligne.sens === '-') montant_n = -Math.abs(montant_n);
        }
        refValues[ligne.ref] = { n: montant_n };
        return { ref: ligne.ref, libelle: ligne.libelle, sens: ligne.sens || '', montant_n: Math.round(montant_n), montant_n1: 0, isTotal: !!(ligne.isTotal || ligne.ref === 'ZA') };
    });
}

module.exports = { computeActif, computePassif, computeResultat, computeTFT, buildAccountIndex, ACTIF_MAPPING, PASSIF_MAPPING, RESULTAT_MAPPING, TFT_MAPPING };
