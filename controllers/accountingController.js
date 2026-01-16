const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

/**
 * 1. CONFIGURATION ET PÉRIODES
 */
exports.getFiscalConfig = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId manquant" });

        const result = await odooExecuteKw({ 
            uid: ADMIN_UID_INT, 
            model: 'res.company',
            method: 'compute_fiscalyear_dates',
            args: [parseInt(companyId)],
            kwargs: {} 
        });

        res.json({
            status: 'success',
            fiscal_period: { start_date: result.date_from, end_date: result.date_to }
        });
    } catch (error) {
        const year = new Date().getFullYear();
        res.json({
            status: 'success',
            fiscal_period: { start_date: `${year}-01-01`, end_date: `${year}-12-31` }
        });
    }
};

/**
 * 2. TABLEAU DE BORD (LOGIQUE SÉCURISÉE)
 */
exports.getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: 'companyId requis.' });

        const companyIdInt = parseInt(companyId, 10);
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[['company_id', '=', companyIdInt], ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'balance'], 
                context: { company_id: companyIdInt } 
            } 
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

        if (moveLines.length === 0) data = { cash: 0, profit: 0, debts: 0 };
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 3. PLAN COMPTABLE (FILTRES ROBUSTES)
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const { companyId } = req.query;
        const odooUid = (req.user && req.user.odooUid) ? req.user.odooUid : ADMIN_UID_INT;
        if (!companyId) return res.status(400).json({ error: "ID de compagnie manquant." });

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

        res.status(200).json({ status: 'success', data: accounts });
    } catch (error) {
        res.status(500).json({ error: 'Échec du Plan Comptable.' });
    }
};

/**
 * 4. CRÉATION D'ÉCRITURE (VERSION FINALE)
 */
exports.createJournalEntry = async (req, res) => {
    try {
        const { companyId, journalCode, date, narration, lines } = req.body;
        if (!companyId || !lines) return res.status(400).json({ error: "Données incomplètes." });

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
        res.status(500).json({ error: error.message });
    }
};

/**
 * 5. JOURNAUX ET REPORTS
 */
exports.getJournals = async (req, res) => {
    try {
        const { companyId } = req.query;
        const cid = parseInt(companyId);
        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', cid]]],
            kwargs: { 
                fields: ['id', 'name', 'code', 'type'],
                context: { company_id: cid } 
            }
        });
        res.status(200).json({ status: 'success', data: journals });
    } catch (error) {
        res.status(500).json({ error: "Erreur journaux." });
    }
};

exports.getGeneralLedger = async (req, res) => {
    try {
        const { companyId, date_from, date_to } = req.query;
        const lines = await accountingService.getGeneralLedgerLines(ADMIN_UID_INT, parseInt(companyId), date_from, date_to);
        
        let ledger = {};
        lines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : 'N/A';
            if (!ledger[code]) {
                ledger[code] = { code, name: line.account_id[2], lines: [], totalDebit: 0, totalCredit: 0 };
            }
            ledger[code].lines.push(line);
            ledger[code].totalDebit += line.debit;
            ledger[code].totalCredit += line.credit;
        });
        res.status(200).json({ status: 'success', data: Object.values(ledger) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fonctions CRUD manquantes ou stubs
exports.createAccount = async (req, res) => { /* Logique create simple */ };
exports.updateAccount = async (req, res) => { /* Logique write simple */ };
exports.getFinancialReport = async (req, res) => { /* Logique SYSCOHADA simple */ };
exports.getSyscohadaTrialBalance = async (req, res) => { /* Appel service balance */ };
