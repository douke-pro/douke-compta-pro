// ============================================
// SERVICE : Extraction Données Odoo
// Version : V2.1 PRODUCTION
// Date : 2026-03-31
//
// ✅ FIX 1 : parseInt(ODOO_ADMIN_UID, 2) → parseInt(ODOO_ADMIN_UID, 10)
//            (base 2 = binaire donnait NaN — corrigé en base 10)
// ✅ FIX 2 : odoo.execute_kw() → odooExecuteKw() partout
//            (odoo n'était jamais défini = ReferenceError fatal)
// ✅ FIX 3 : Tous les appels Odoo utilisent le bon format odooExecuteKw({uid, model, method, args, kwargs})
// ✅ FIX 4 : formatDateForOdoo() — supprime timezone ISO avant envoi à Odoo
//            Odoo exige 'YYYY-MM-DD', refusait '2026-03-06T00:00:00.000Z'
// ============================================

const { odooExecuteKw, ADMIN_UID_INT } = require('./odooService');

// =============================================================================
// UTILITAIRE DATES
// =============================================================================

/**
 * Formate une date pour Odoo — supprime timezone si présente
 * Odoo exige 'YYYY-MM-DD' sans timezone
 * Entrée acceptée : '2026-03-06', '2026-03-06T00:00:00.000Z', Date object
 */
// ✅ VERSION ROBUSTE — gère string ET objet Date
function formatDateForOdoo(dateStr) {
    if (!dateStr) return dateStr;
    
    // Si c'est déjà un objet Date JavaScript
    if (dateStr instanceof Date) {
        const year  = dateStr.getFullYear();
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const day   = String(dateStr.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Si c'est une string ISO avec timezone ex: '2026-03-06T00:00:00.000Z'
    // ou déjà propre ex: '2026-03-06'
    const str = String(dateStr);
    if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
        return str.substring(0, 10);
    }
    
    // Dernier recours — parser et reformater
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        const year  = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day   = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    console.error('[formatDateForOdoo] Format de date non reconnu:', dateStr);
    return String(dateStr);
}

// =============================================================================
// MAPPINGS COMPTABLES SYSCOHADA / SYCEBNL / PCG
// =============================================================================

const SYSCOHADA_ACCOUNTS = {
    ACTIF: {
        IMMOBILISATIONS_INCORPORELLES:    { codes: ['201','202','203','204','205','206','207','208'], label: 'Immobilisations incorporelles' },
        IMMOBILISATIONS_CORPORELLES:      { codes: ['211','212','213','214','215','218','221','222','223','224','225','226','228','231','232','233','234','235','237','238','241','244','245','246'], label: 'Immobilisations corporelles' },
        AVANCES_ACOMPTES_IMMOBILISATIONS: { codes: ['251','252','253'], label: 'Avances sur immobilisations' },
        IMMOBILISATIONS_FINANCIERES:      { codes: ['26','271','272','273','274','275','276','277'], label: 'Immobilisations financières' },
        STOCKS:                           { codes: ['31','32','33','34','35','36','37','38'], label: 'Stocks et en-cours' },
        CREANCES_CLIENTS:                 { codes: ['411','412','413','414','415','416','417','418'], label: 'Clients et comptes rattachés' },
        AUTRES_CREANCES:                  { codes: ['421','422','425','428','431','438','441','442','443','444','445','446','447','448','451','452','453','454','455','456','458'], label: 'Autres créances' },
        DISPONIBILITES:                   { codes: ['521','522','523','524','525','526','527','528','531','532','541','542','561','562','571','572'], label: 'Trésorerie-Actif' }
    },
    PASSIF: {
        CAPITAL:                      { codes: ['101','102','103','104','105','106','108','109'], label: 'Capital et primes' },
        RESERVES:                     { codes: ['111','112','113','114','115','116','117','118','119'], label: 'Réserves' },
        REPORT_A_NOUVEAU:             { codes: ['121','129'], label: 'Report à nouveau' },
        RESULTAT_NET_EXERCICE:        { codes: ['130','131'], label: "Résultat net de l'exercice" },
        SUBVENTIONS_INVESTISSEMENT:   { codes: ['141','142','143','144','145','146','148'], label: "Subventions d'investissement" },
        PROVISIONS_REGLEMENTEES:      { codes: ['151','152','153','154','155','156','157','158'], label: 'Provisions réglementées' },
        EMPRUNTS_DETTES_ASSIMILEES:   { codes: ['161','162','163','164','165','166','167','168','171','172','173','174','175','176','177','178','181','182','183','184','185','186','187','188'], label: 'Emprunts et dettes assimilées' },
        DETTES_FOURNISSEURS:          { codes: ['401','402','403','404','405','408'], label: 'Fournisseurs et comptes rattachés' },
        DETTES_FISCALES_SOCIALES:     { codes: ['421','422','423','424','425','426','427','428','431','432','433','438','441','442','443','444','445','446','447','448'], label: 'Dettes fiscales et sociales' },
        AUTRES_DETTES:                { codes: ['451','452','453','454','455','456','457','458','471','472','473','474','475','476','477','478'], label: 'Autres dettes' },
        TRESORERIE_PASSIF:            { codes: ['561','562','564','565','566'], label: 'Trésorerie-Passif' }
    },
    CHARGES: {
        ACHATS_MARCHANDISES:          { codes: ['601','602','603'], label: 'Achats de marchandises' },
        ACHATS_MATIERES:              { codes: ['604','605','608'], label: 'Achats de matières et fournitures' },
        TRANSPORTS:                   { codes: ['61'], label: 'Transports' },
        SERVICES_EXTERIEURS_A:        { codes: ['621','622','623','624','625','626','627','628'], label: 'Services extérieurs A' },
        SERVICES_EXTERIEURS_B:        { codes: ['631','632','633','634','635','636','637','638'], label: 'Services extérieurs B' },
        IMPOTS_TAXES:                 { codes: ['641','642','643','644','645','646','647','648'], label: 'Impôts et taxes' },
        AUTRES_CHARGES:               { codes: ['651','652','653','654','658'], label: 'Autres charges' },
        CHARGES_PERSONNEL:            { codes: ['661','662','663','664','665','666','667','668'], label: 'Charges de personnel' },
        DOTATIONS_AMORTISSEMENTS:     { codes: ['681'], label: 'Dotations aux amortissements' },
        DOTATIONS_PROVISIONS:         { codes: ['691'], label: 'Dotations aux provisions' },
        CHARGES_FINANCIERES:          { codes: ['671','672','673','674','675','676','677','678'], label: 'Charges financières' },
        CHARGES_HAO:                  { codes: ['81','82','83','84','85'], label: 'Charges HAO' },
        IMPOTS_BENEFICES:             { codes: ['891','892','893','899'], label: 'Impôts sur le résultat' }
    },
    PRODUITS: {
        VENTES_MARCHANDISES:          { codes: ['701','702','703','704','705','706'], label: 'Ventes de marchandises' },
        VENTES_PRODUITS_FINIS:        { codes: ['711','712','713','714','715','716'], label: 'Ventes de produits finis' },
        TRAVAUX_SERVICES_VENDUS:      { codes: ['73'], label: 'Travaux, services vendus' },
        PRODUCTION_IMMOBILISEE:       { codes: ['741','742','743','744'], label: 'Production immobilisée' },
        SUBVENTIONS_EXPLOITATION:     { codes: ['751','752','753','754','758'], label: "Subventions d'exploitation" },
        REPRISES_PROVISIONS:          { codes: ['791'], label: 'Reprises de provisions' },
        TRANSFERTS_CHARGES:           { codes: ['781','782','783','784','785','786','787','788'], label: 'Transferts de charges' },
        PRODUITS_FINANCIERS:          { codes: ['771','772','773','774','775','776','777','778'], label: 'Revenus financiers' },
        PRODUITS_HAO:                 { codes: ['84','86'], label: 'Produits HAO' }
    }
};

const SYCEBNL_ACCOUNTS = {
    ACTIF: {
        IMMOBILISATIONS_INCORPORELLES: { codes: ['201','202','203','204','205','206','207','208'], label: 'Immobilisations incorporelles' },
        IMMOBILISATIONS_CORPORELLES:   { codes: ['21','22','23','24'], label: 'Immobilisations corporelles' },
        STOCKS:                        { codes: ['31','32','33','34','35','36','37','38'], label: 'Stocks' },
        CREANCES:                      { codes: ['41','42','43','44','45','46','47'], label: 'Créances' },
        DISPONIBILITES:                { codes: ['51','52','53','54','55','56','57'], label: 'Disponibilités' }
    },
    PASSIF: {
        FONDS_ASSOCIATIFS:             { codes: ['101','102','103','104','105','106'], label: 'Fonds associatifs' },
        RESERVES:                      { codes: ['131','132','133','134','135','136'], label: 'Réserves' },
        REPORT_A_NOUVEAU:              { codes: ['141'], label: 'Report à nouveau' },
        RESULTAT_NET:                  { codes: ['151'], label: "Résultat net de l'exercice" },
        SUBVENTIONS_INVESTISSEMENT:    { codes: ['161','162','163'], label: "Subventions d'investissement" },
        DETTES_FINANCIERES:            { codes: ['16','17','18','19'], label: 'Dettes financières' },
        DETTES_FOURNISSEURS:           { codes: ['401','402','403','404','405'], label: 'Dettes fournisseurs' },
        AUTRES_DETTES:                 { codes: ['42','43','44','45','46','47'], label: 'Autres dettes' }
    },
    EMPLOIS: {
        EMPLOIS_MISSION_SOCIALE:       { codes: ['601','602','603','604','605','606','607','608','61','62','63','64','65','66'], label: 'Emplois de la mission sociale' },
        EMPLOIS_RECHERCHE_FONDS:       { codes: ['671','672','673'], label: 'Emplois de recherche de fonds' },
        EMPLOIS_FONCTIONNEMENT:        { codes: ['681','682','683','684','685'], label: 'Emplois de fonctionnement' },
        CHARGES_FINANCIERES:           { codes: ['691','692','693'], label: 'Charges financières' },
        CHARGES_EXCEPTIONNELLES:       { codes: ['81','82','83','84','85'], label: 'Charges exceptionnelles' }
    },
    RESSOURCES: {
        COTISATIONS:                   { codes: ['701','702','703'], label: 'Cotisations' },
        DONS_MANUELS:                  { codes: ['711','712','713'], label: 'Dons manuels' },
        SUBVENTIONS_FONCTIONNEMENT:    { codes: ['721','722','723','724'], label: 'Subventions de fonctionnement' },
        VENTES_PRESTATIONS:            { codes: ['731','732','733','734','735'], label: 'Ventes et prestations' },
        PRODUITS_FINANCIERS:           { codes: ['741','742','743'], label: 'Produits financiers' },
        PRODUITS_EXCEPTIONNELS:        { codes: ['81','82','83','84','85'], label: 'Produits exceptionnels' }
    }
};

const PCG_ACCOUNTS = {
    ACTIF: {
        IMMOBILISATIONS_INCORPORELLES:  { codes: ['201','203','205','206','207','208'], label: 'Immobilisations incorporelles' },
        IMMOBILISATIONS_CORPORELLES:    { codes: ['211','212','213','214','215','218'], label: 'Immobilisations corporelles' },
        IMMOBILISATIONS_FINANCIERES:    { codes: ['261','266','267','271','272','273','274','275','276','277'], label: 'Immobilisations financières' },
        STOCKS:                         { codes: ['31','32','33','34','35','37'], label: 'Stocks et en-cours' },
        CREANCES_EXPLOITATION:          { codes: ['409','411','413','416','417','418'], label: "Créances d'exploitation" },
        AUTRES_CREANCES:                { codes: ['425','427','431','441','443','444','445','446','447','448','451','455','456','458'], label: 'Autres créances' },
        DISPONIBILITES:                 { codes: ['511','512','514','515','516','517','518','519','53'], label: 'Disponibilités' }
    },
    PASSIF: {
        CAPITAL:                        { codes: ['101','1012','1013','1016','1017','1018'], label: 'Capital social' },
        PRIMES:                         { codes: ['1041','1042','1043','1044'], label: 'Primes liées au capital' },
        RESERVES:                       { codes: ['1061','1062','1063','1064','1068'], label: 'Réserves' },
        REPORT_A_NOUVEAU:               { codes: ['110','119'], label: 'Report à nouveau' },
        RESULTAT_EXERCICE:              { codes: ['120','129'], label: "Résultat de l'exercice" },
        PROVISIONS_RISQUES:             { codes: ['151','153','155','156','157','158'], label: 'Provisions pour risques et charges' },
        EMPRUNTS:                       { codes: ['161','163','164','165','166','167','168','169'], label: 'Emprunts et dettes assimilées' },
        DETTES_FOURNISSEURS:            { codes: ['401','403','404','405','408'], label: 'Dettes fournisseurs' },
        DETTES_FISCALES:                { codes: ['421','422','424','425','426','427','428','431','441','442','443','444','445','446','447','448'], label: 'Dettes fiscales et sociales' },
        AUTRES_DETTES:                  { codes: ['451','455','456','457','458','462','464','465','467','468'], label: 'Autres dettes' }
    },
    CHARGES: {
        ACHATS:                         { codes: ['601','602','603','604','605','606','607','608','609'], label: 'Achats' },
        SERVICES_EXTERIEURS:            { codes: ['61','62'], label: 'Services extérieurs' },
        IMPOTS_TAXES:                   { codes: ['63'], label: 'Impôts, taxes et versements assimilés' },
        CHARGES_PERSONNEL:              { codes: ['641','644','645','646','647','648'], label: 'Charges de personnel' },
        AUTRES_CHARGES_GESTION:         { codes: ['651','653','654','655','658'], label: 'Autres charges de gestion' },
        CHARGES_FINANCIERES:            { codes: ['661','664','665','666','667','668'], label: 'Charges financières' },
        CHARGES_EXCEPTIONNELLES:        { codes: ['671','672','675','678'], label: 'Charges exceptionnelles' },
        DOTATIONS_AMORTISSEMENTS:       { codes: ['681'], label: 'Dotations aux amortissements' },
        IMPOTS_BENEFICES:               { codes: ['695','696','697','698','699'], label: 'Impôts sur les bénéfices' }
    },
    PRODUITS: {
        VENTES:                         { codes: ['701','702','703','704','705','706','707','708','709'], label: 'Ventes' },
        PRODUCTION_STOCKEE:             { codes: ['713','714','715'], label: 'Variation des stocks' },
        PRODUCTION_IMMOBILISEE:         { codes: ['721','722'], label: 'Production immobilisée' },
        SUBVENTIONS_EXPLOITATION:       { codes: ['74'], label: "Subventions d'exploitation" },
        AUTRES_PRODUITS_GESTION:        { codes: ['751','752','753','754','755','758'], label: 'Autres produits de gestion' },
        PRODUITS_FINANCIERS:            { codes: ['761','762','763','764','765','766','767','768'], label: 'Produits financiers' },
        PRODUITS_EXCEPTIONNELS:         { codes: ['771','772','775','777','778'], label: 'Produits exceptionnels' },
        REPRISES_PROVISIONS:            { codes: ['781','786','787'], label: 'Reprises sur provisions' }
    }
};

// =============================================================================
// UTILITAIRES COMPTABLES
// =============================================================================

function getAccountsConfig(accountingSystem) {
    if (accountingSystem.startsWith('SYSCOHADA')) return SYSCOHADA_ACCOUNTS;
    if (accountingSystem.startsWith('SYCEBNL'))  return SYCEBNL_ACCOUNTS;
    if (accountingSystem === 'PCG_FRENCH')        return PCG_ACCOUNTS;
    throw new Error(`Système comptable non supporté: ${accountingSystem}`);
}

function matchesAccountCode(accountCode, categoryCodes) {
    return categoryCodes.some(code => accountCode.startsWith(code));
}

function calculateBalance(lines) {
    return lines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
}

function groupLinesByCategory(lines, categories) {
    const grouped = {};
    for (const [key, config] of Object.entries(categories)) {
        const catLines = lines.filter(l => matchesAccountCode(l.account_code, config.codes));
        grouped[key] = {
            label:   config.label,
            codes:   config.codes,
            lines:   catLines,
            balance: calculateBalance(catLines)
        };
    }
    return grouped;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

class OdooReportsService {

    /**
     * Extraire toutes les données financières depuis Odoo
     */
    async extractFinancialData(companyId, periodStart, periodEnd, accountingSystem) {
        try {
            // ✅ FIX 4 : Nettoyer les dates avant tout appel Odoo
            const periodStartClean = formatDateForOdoo(periodStart);
            const periodEndClean   = formatDateForOdoo(periodEnd);

            console.log(`[OdooReportsService] Extraction pour company ${companyId}`);
            console.log(`[OdooReportsService] Période: ${periodStartClean} → ${periodEndClean} | Système: ${accountingSystem}`);

            const companyInfo        = await this.getCompanyInfo(companyId);
            const accountMoves       = await this.getAccountMoves(companyId, periodStartClean, periodEndClean);
            const accountMoveLines   = await this.getAccountMoveLines(accountMoves);
            const chartOfAccounts    = await this.getChartOfAccounts(companyId);
            const enrichedLines      = this.enrichMoveLinesWithAccounts(accountMoveLines, chartOfAccounts);
            const bilanData          = this.calculateBilan(enrichedLines, accountingSystem);
            const compteResultatData = this.calculateCompteResultat(enrichedLines, accountingSystem);
            const tftData            = this.calculateTableauFluxTresorerie(enrichedLines);
            const annexesData        = this.prepareAnnexesData(enrichedLines, companyInfo, accountingSystem, periodStartClean, periodEndClean);

            return {
                company:                 companyInfo,
                period:                  { start: periodStartClean, end: periodEndClean },
                accounting_system:       accountingSystem,
                bilan:                   bilanData,
                compte_resultat:         compteResultatData,
                tableau_flux_tresorerie: tftData,
                annexes:                 annexesData,
                raw_data:                { moves: accountMoves, move_lines: enrichedLines, chart_of_accounts: chartOfAccounts }
            };

        } catch (error) {
            console.error('[OdooReportsService] Erreur extraction:', error.message);
            throw new Error(`Erreur extraction données Odoo: ${error.message}`);
        }
    }

    async getCompanyInfo(companyId) {
        const companies = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.company',
            method: 'search_read',
            args:   [[['id', '=', companyId]]],
            kwargs: {
                fields: ['name','street','city','zip','country_id','phone','email','website','vat','company_registry','currency_id'],
                context: { company_id: companyId, allowed_company_ids: [companyId] }
            }
        });

        if (!companies || companies.length === 0) throw new Error(`Entreprise ${companyId} introuvable`);
        return companies[0];
    }

    async getAccountMoves(companyId, periodStart, periodEnd) {
        // Les dates arrivent ici déjà nettoyées au format YYYY-MM-DD
        const moves = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.move',
            method: 'search_read',
            args:   [[
                ['company_id', '=', companyId],
                ['date', '>=', periodStart],
                ['date', '<=', periodEnd],
                ['state', '=', 'posted']
            ]],
            kwargs: {
                fields: ['id','name','date','ref','journal_id','move_type','state','amount_total','line_ids'],
                context: { company_id: companyId, allowed_company_ids: [companyId] }
            }
        });

        console.log(`[OdooReportsService] ${moves.length} écritures trouvées`);
        return moves;
    }

    async getAccountMoveLines(accountMoves) {
        const lineIds = accountMoves.flatMap(m => m.line_ids || []);
        if (lineIds.length === 0) return [];

        const lines = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.move.line',
            method: 'search_read',
            args:   [[['id', 'in', lineIds]]],
            kwargs: {
                fields: ['id','move_id','account_id','name','debit','credit','balance','date','partner_id','journal_id']
            }
        });

        console.log(`[OdooReportsService] ${lines.length} lignes d'écritures trouvées`);
        return lines;
    }

    async getChartOfAccounts(companyId) {
        const accounts = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.account',
            method: 'search_read',
            args:   [[['company_ids', 'in', [companyId]]]],
            kwargs: {
                fields: ['id','code','name','account_type'],
                context: { company_id: companyId, allowed_company_ids: [companyId] }
            }
        });

        console.log(`[OdooReportsService] ${accounts.length} comptes dans le plan comptable`);
        return accounts;
    }

    enrichMoveLinesWithAccounts(moveLines, chartOfAccounts) {
        const accountsMap = new Map(chartOfAccounts.map(a => [a.id, a]));

        return moveLines.map(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            const account   = accountId ? accountsMap.get(accountId) : null;
            return {
                ...line,
                account_code: account ? account.code : 'UNKNOWN',
                account_name: account ? account.name : 'Compte inconnu',
                account_type: account ? account.account_type : null
            };
        });
    }

    calculateBilan(enrichedLines, accountingSystem) {
        const config = getAccountsConfig(accountingSystem);
        const actif  = groupLinesByCategory(enrichedLines, config.ACTIF);
        const passif = groupLinesByCategory(enrichedLines, config.PASSIF);

        const totalActif  = Object.values(actif).reduce((s, c) => s + Math.abs(c.balance), 0);
        const totalPassif = Object.values(passif).reduce((s, c) => s + Math.abs(c.balance), 0);

        return {
            actif,
            passif,
            totaux: { actif: totalActif, passif: totalPassif, difference: totalActif - totalPassif }
        };
    }

    calculateCompteResultat(enrichedLines, accountingSystem) {
        const config     = getAccountsConfig(accountingSystem);
        const isEBNL     = accountingSystem.startsWith('SYCEBNL');
        const chargesKey = isEBNL ? 'EMPLOIS'    : 'CHARGES';
        const produitsKey= isEBNL ? 'RESSOURCES' : 'PRODUITS';

        const charges = groupLinesByCategory(enrichedLines, config[chargesKey]);
        const produits = groupLinesByCategory(enrichedLines, config[produitsKey]);

        const totalCharges  = Object.values(charges).reduce((s, c) => s + Math.abs(c.balance), 0);
        const totalProduits = Object.values(produits).reduce((s, c) => s + Math.abs(c.balance), 0);
        const resultat      = totalProduits - totalCharges;

        return {
            charges,
            produits,
            totaux: {
                charges:        totalCharges,
                produits:       totalProduits,
                resultat,
                resultat_label: resultat >= 0 ? 'Bénéfice' : 'Perte'
            }
        };
    }

    calculateTableauFluxTresorerie(enrichedLines) {
        const fluxOp  = calculateBalance(enrichedLines.filter(l => l.account_code.startsWith('6') || l.account_code.startsWith('7')));
        const fluxInv = calculateBalance(enrichedLines.filter(l => l.account_code.startsWith('2')));
        const fluxFin = calculateBalance(enrichedLines.filter(l => l.account_code.startsWith('1')));
        const variation = fluxOp + fluxInv + fluxFin;

        const tresoLines = enrichedLines.filter(l =>
            ['51','52','53','54','55','56','57'].some(c => l.account_code.startsWith(c))
        );
        const solde = calculateBalance(tresoLines);

        return {
            flux_operationnels:  fluxOp,
            flux_investissement: fluxInv,
            flux_financement:    fluxFin,
            variation_nette:     variation,
            tresorerie_initiale: 0,
            tresorerie_finale:   solde
        };
    }

    prepareAnnexesData(enrichedLines, companyInfo, accountingSystem, periodStart, periodEnd) {
        const immoLines      = enrichedLines.filter(l => l.account_code.startsWith('2'));
        const amortLines     = enrichedLines.filter(l => l.account_code.startsWith('28') || l.account_code.startsWith('68'));
        const provisionLines = enrichedLines.filter(l => ['19','29','39','49','59','69'].some(c => l.account_code.startsWith(c)));
        const creances       = enrichedLines.filter(l => l.account_code.startsWith('4') && l.balance > 0);
        const dettes         = enrichedLines.filter(l => l.account_code.startsWith('4') && l.balance < 0);
        const capitauxLines  = enrichedLines.filter(l => l.account_code.startsWith('1'));

        const immoDetails = {};
        immoLines.forEach(l => {
            const cat = l.account_code.substring(0, 2);
            if (!immoDetails[cat]) immoDetails[cat] = { code: cat, valeur_brute: 0 };
            immoDetails[cat].valeur_brute += Math.abs(l.balance);
        });

        return {
            principes_comptables: {
                systeme:                    accountingSystem,
                exercice:                   `Du ${periodStart} au ${periodEnd}`,
                devise:                     companyInfo.currency_id ? companyInfo.currency_id[1] : 'XOF',
                methode_amortissement:      'Linéaire',
                methode_evaluation_stocks:  'FIFO'
            },
            immobilisations: Object.values(immoDetails),
            amortissements: {
                dotations_exercice: calculateBalance(amortLines.filter(l => l.account_code.startsWith('68'))),
                cumul:              calculateBalance(amortLines.filter(l => l.account_code.startsWith('28')))
            },
            provisions: {
                dotations: calculateBalance(provisionLines.filter(l => l.account_code.startsWith('69'))),
                reprises:  calculateBalance(provisionLines.filter(l => l.account_code.startsWith('79'))),
                solde:     calculateBalance(provisionLines)
            },
            creances_dettes: {
                creances: { moins_1_an: calculateBalance(creances), plus_1_an: 0 },
                dettes:   { moins_1_an: Math.abs(calculateBalance(dettes)), plus_1_an: 0 }
            },
            variation_capitaux: {
                solde_debut:   0,
                augmentations: calculateBalance(capitauxLines.filter(l => l.credit > 0)),
                diminutions:   Math.abs(calculateBalance(capitauxLines.filter(l => l.debit > 0))),
                solde_fin:     calculateBalance(capitauxLines)
            }
        };
    }
}

module.exports = new OdooReportsService();
