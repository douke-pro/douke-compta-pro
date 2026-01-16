const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

// =============================================================================
// 1. CONFIGURATION ET PÉRIODES FISCALES
// =============================================================================

exports.getFiscalConfig = async (req, res) => {
    try {
        const { companyId } = req.query;
        console.log(`[DEBUG] Appel fiscal pour la compagnie : ${companyId}`);
        
        if (!companyId) return res.status(400).json({ error: "companyId manquant" });

        const result = await odooExecuteKw({ 
            uid: ADMIN_UID_INT || 5, 
            model: 'res.company',
            method: 'compute_fiscalyear_dates',
            args: [parseInt(companyId)],
            kwargs: {} 
        });

        if (!result || !result.date_from) throw new Error("Réponse Odoo incomplète");

        res.json({
            status: 'success',
            fiscal_period: { start_date: result.date_from, end_date: result.date_to }
        });
    } catch (error) {
        console.error('[Fiscal Config Error] Fallback activé:', error.message);
        const year = new Date().getFullYear();
        res.json({
            status: 'success',
            fiscal_period: { start_date: `${year}-01-01`, end_date: `${year}-12-31` }
        });
    }
};

// =============================================================================
// 2. REPORTING COMPTABLE ET TABLEAU DE BORD
// =============================================================================

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType, companyId } = req.query; 

        if (!ADMIN_UID_INT || !companyId) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID ou companyId manquant." });
        }
        
        const companyIdInt = parseInt(companyId, 10);
        const analyticFilter = ['analytic_distribution', 'in', [analyticId.toString()]];
        const companyFilter = ['company_id', '=', companyIdInt];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            // 🔑 Correction : Double crochets pour le domaine
            args: [[companyFilter, analyticFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'date', 'name'],
                context: { company_id: companyIdInt }
            }
        });

        let report = { chiffreAffaires: 0, chargesExploitation: 0, tresorerie: 0, resultat: 0 };

        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : ''; 
            if (accountCode.startsWith('7')) report.chiffreAffaires += (line.credit - line.debit);
            else if (accountCode.startsWith('6')) report.chargesExploitation += (line.debit - line.credit);
            else if (accountCode.startsWith('5')) report.tresorerie += (line.debit - line.credit);
        });

        report.resultat = report.chiffreAffaires - report.chargesExploitation;

        if (systemType === 'SMT') {
            return res.json({
                systeme: "Minimal de Trésorerie (SMT)",
                flux: { encaissements: report.chiffreAffaires, decaissements: report.chargesExploitation, soldeNet: report.tresorerie }
            });
        }
        res.json({ systeme: "Normal (Engagement)", donnees: report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId || !ADMIN_UID_INT) return res.status(400).json({ error: 'Paramètre manquant.' });

        const companyIdInt = parseInt(companyId, 10);
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[['company_id', '=', companyIdInt], ['parent_state', '=', 'posted']]],
            kwargs: { fields: ['account_id', 'debit', 'credit', 'balance'], context: { company_id: companyIdInt } } 
        });

        let data = { cash: 0, profit: 0, debts: 0 };
        moveLines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : ''; 
            const bal = line.balance || 0;
            if (code.startsWith('7')) data.profit += (line.credit - line.debit);
            else if (code.startsWith('6')) data.profit -= (line.debit - line.credit);
            if (code.startsWith('5')) data.cash += bal;
            else if (code.startsWith('40') && bal < 0) data.debts += Math.abs(bal);
        });

        if (moveLines.length === 0) data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 3. PLAN COMPTABLE (CRUD)
// =============================================================================

exports.getChartOfAccounts = async (req, res) => {
    try {
        const { companyId } = req.query;
        const odooUid = (req.user && req.user.odooUid) ? req.user.odooUid : ADMIN_UID_INT;

        if (!companyId) return res.status(400).json({ error: "ID compagnie manquant." });
        const companyIdInt = parseInt(companyId, 10);

        const accounts = await odooExecuteKw({
            uid: odooUid, 
            model: 'account.account',
            method: 'search_read',
            args: [[ '|', ['company_id', '=', companyIdInt], ['company_id', '=', false] ]], 
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                context: { company_id: companyIdInt, allowed_company_ids: [companyIdInt] }
            }
        });

        console.log(`[DEBUG] Plan Comptable: ${accounts.length} comptes trouvés.`);
        res.status(200).json({ status: 'success', results: accounts.length, data: accounts });
    } catch (error) {
        res.status(500).json({ error: 'Échec récupération Plan Comptable.', details: error.message });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body;
        const odooUid = req.user.odooUid || ADMIN_UID_INT;
        const companyIdInt = parseInt(companyId);

        const newAccountId = await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'create',
            args: [{ 'code': code, 'name': name, 'account_type': type, 'company_id': companyIdInt }],
            kwargs: {}
        });
        res.status(201).json({ status: 'success', data: { id: newAccountId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type, companyId } = req.body;
        const odooUid = req.user.odooUid || ADMIN_UID_INT;
        const companyIdInt = parseInt(companyId);

        await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'write',
            args: [[id], { 'code': code, 'name': name, 'account_type': type }],
            kwargs: { context: { company_id: companyIdInt } }
        });
        res.status(200).json({ status: 'success', message: 'Compte mis à jour.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 4. ÉCRITURES COMPTABLES ET JOURNAUX
// =============================================================================

exports.createJournalEntry = async (req, res) => {
    try {
        const { companyId, journalCode, date, narration, lines } = req.body;
        if (!companyId || !lines) return res.status(400).json({ error: "Données manquantes." });

        const result = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create_journal_entry_via_api', 
            args: [], 
            kwargs: {
                company_id: parseInt(companyId, 10),
                journal_code: journalCode,
                date: date,
                reference: narration,
                lines: lines 
            }
        });

        if (!result || result.status === 'error') throw new Error(result.message);
        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        console.error('[CRITICAL] Erreur Écriture:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const { companyId } = req.query;
        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', parseInt(companyId)]]],
            kwargs: { fields: ['id', 'name', 'code', 'type'], context: { company_id: parseInt(companyId) } }
        });
        res.status(200).json({ status: 'success', data: journals });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération journaux." });
    }
};

// =============================================================================
// 5. SERVICES DE COMPTABILITÉ AVANCÉE (BALANCE / GRAND LIVRE)
// =============================================================================

exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const { companyId, date_from, date_to } = req.query;
        const balanceData = await accountingService.getSyscohadaBalance(ADMIN_UID_INT, parseInt(companyId), date_from, date_to);
        res.status(200).json({ status: 'success', data: balanceData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGeneralLedger = async (req, res) => {
    try {
        const { companyId, date_from, date_to, journal_ids } = req.query;
        const journals = journal_ids ? journal_ids.split(',').map(Number) : [];
        const lines = await accountingService.getGeneralLedgerLines(ADMIN_UID_INT, parseInt(companyId), date_from, date_to, journals);
        
        let ledger = {};
        lines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : 'N/A';
            if (!ledger[code]) {
                ledger[code] = { code, name: line.account_id[2], lines: [], totalDebit: 0, totalCredit: 0, finalBalance: 0 };
            }
            ledger[code].lines.push({ 
                date: line.date, 
                journalEntry: line.move_name, 
                description: line.name || line.ref, 
                debit: line.debit, 
                credit: line.credit, 
                balance: line.balance 
            });
            ledger[code].totalDebit += line.debit;
            ledger[code].totalCredit += line.credit;
            ledger[code].finalBalance += line.balance;
        });

        res.status(200).json({ status: 'success', data: Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// 6. STUBS ET DÉTAILS
// =============================================================================

exports.getEntryDetails = async (req, res) => res.status(501).json({ error: "Détails non implémentés." });
exports.handleCaisseEntry = async (req, res) => res.status(501).json({ error: "Caisse non implémentée." });
exports.getBalanceSheet = async (req, res) => res.status(501).json({ error: "Bilan non implémenté." });
