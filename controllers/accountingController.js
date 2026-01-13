// =============================================================================
// FICHIER : controllers/accountingController.js
// OBJECTIF : Gestion Comptable SYSCOHADA, Cloisonnement Légal et Sécurité Odoo
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

// =============================================================================
// 1. CONFIGURATION ET PÉRIODES
// =============================================================================

exports.getFiscalConfig = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId manquant" });

        const result = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'compute_fiscalyear_dates',
            args: [parseInt(companyId)],
            kwargs: { date: new Date().toISOString().split('T')[0] }
        });

        res.json({
            status: 'success',
            fiscal_period: {
                start_date: result.date_from,
                end_date: result.date_to
            }
        });
    } catch (error) {
        console.error('[Fiscal Config Error]', error.message);
        res.json({
            status: 'success',
            fiscal_period: {
                start_date: `${new Date().getFullYear()}-01-01`,
                end_date: `${new Date().getFullYear()}-12-31`
            }
        });
    }
};

// =============================================================================
// 2. LOGIQUE DE REPORTING COMPTABLE
// =============================================================================

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType, companyId } = req.query; 

        if (!companyId) return res.status(400).json({ error: "companyId manquant." });
        
        const companyIdInt = parseInt(companyId, 10);
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];
        const companyFilter = [['company_id', '=', companyIdInt]]; 

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ...analyticFilter, ['parent_state', '=', 'posted']]],
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

        res.json({ 
            status: 'success',
            systeme: systemType === 'SMT' ? "Minimal de Trésorerie" : "Normal",
            data: report 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 3. LOGIQUE DU PLAN COMPTABLE (CRUD)
// =============================================================================

exports.getChartOfAccounts = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "ID de compagnie manquant." });

        const cid = parseInt(companyId, 10);
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_id', '=', cid]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                context: { company_id: cid } 
            }
        });
        res.status(200).json({ status: 'success', data: accounts });
    } catch (error) {
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable.' });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body;
        const odooUid = req.user.odooUid;
        
        const newId = await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'create',
            args: [{ code, name, account_type: type, company_id: parseInt(companyId) }],
            kwargs: { context: { company_id: parseInt(companyId) } }
        });
        res.status(201).json({ status: 'success', data: { id: newId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type, companyId } = req.body;
        await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.account',
            method: 'write',
            args: [[parseInt(id)], { code, name, account_type: type }],
            kwargs: { context: { company_id: parseInt(companyId) } }
        });
        res.status(200).json({ status: 'success', message: 'Compte mis à jour.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 4. VALIDATION ÉCRITURES ET JOURNAUX (ROBUSTESSE)
// =============================================================================

/**
 * VALIDER UNE ÉCRITURE (Le bouton "Valider" appelle cette route)
 */
exports.createJournalEntry = async (req, res) => {
    try {
        const { companyId, journalCode, date, narration, lines } = req.body;

        if (!companyId || !lines || lines.length < 2) {
            return res.status(400).json({ error: "L'écriture doit comporter au moins deux lignes (Débit/Crédit)." });
        }

        // Création via Odoo standard account.move
        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [{
                company_id: parseInt(companyId),
                journal_id: parseInt(journalCode), // Assurez-vous que c'est un ID numérique
                date: date,
                ref: narration,
                move_type: 'entry',
                line_ids: lines.map(line => [0, 0, {
                    account_id: parseInt(line.accountId),
                    name: line.name || narration,
                    debit: parseFloat(line.debit) || 0,
                    credit: parseFloat(line.credit) || 0
                }])
            }],
            kwargs: { context: { company_id: parseInt(companyId) } }
        });

        res.status(201).json({ status: 'success', data: { id: moveId } });
    } catch (error) {
        console.error('[Create Move Error]', error.message);
        res.status(500).json({ error: "Erreur Odoo : " + error.message });
    }
};

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
            if (!ledger[code]) ledger[code] = { code, name: line.account_id[1] + " " + (line.account_id[2] || ""), lines: [], totalDebit: 0, totalCredit: 0 };
            ledger[code].lines.push(line);
            ledger[code].totalDebit += line.debit;
            ledger[code].totalCredit += line.credit;
        });

        res.status(200).json({ status: 'success', data: Object.values(ledger) });
    } catch (error) {
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
            kwargs: { fields: ['id', 'name', 'code', 'type'] }
        });
        res.json({ status: 'success', data: journals });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération journaux." });
    }
};

// =============================================================================
// 5. STUBS & DETAILS
// =============================================================================

exports.getEntryDetails = async (req, res) => {
    try {
        const { entryId } = req.params;
        const entry = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [[parseInt(entryId)]],
            kwargs: { fields: ['name', 'date', 'ref', 'line_ids'] }
        });
        res.json({ status: 'success', data: entry[0] });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.handleCaisseEntry = async (req, res) => res.status(501).json({ error: "Module Caisse en attente." });
exports.getBalanceSheet = async (req, res) => res.status(501).json({ error: "Bilan SYSCOHADA détaillé en attente." });
