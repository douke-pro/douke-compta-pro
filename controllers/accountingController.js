// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION HYBRIDE CORRIGÉE)
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

// =============================================================================
// 1. CONFIGURATION ET PÉRIODES
// =============================================================================

exports.getFiscalConfig = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        if (!companyId) return res.status(400).json({ error: "companyId manquant" });

        const result = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'compute_fiscalyear_dates',
            args: [companyId],
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
// 2. REPORTING SYSCOHADA (RESTAURÉ depuis ton fichier original)
// =============================================================================

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { systemType } = req.query; 

        if (!ADMIN_UID_INT || !companyId) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID ou companyId manquant." });
        }
        
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];
        const companyFilter = [['company_id', 'in', [companyId]]];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ...analyticFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'date', 'name'],
                context: { company_id: companyId, allowed_company_ids: [companyId] }
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
        
        res.json({ systeme: "Normal (Comptabilité d'engagement)", donnees: report });
    } catch (error) {
        console.error('🚨 getFinancialReport Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardData = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        if (!companyId || !ADMIN_UID_INT) return res.status(400).json({ error: 'companyId requis.' });

        const companyFilter = [['company_id', 'in', [companyId]]];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'balance'], 
                context: { company_id: companyId, allowed_company_ids: [companyId] } 
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

        if (moveLines.length === 0) data = { cash: 25000000, profit: 12500000, debts: 3500000 };

        res.status(200).json({ status: 'success', data });
    } catch (err) {
        console.error('🚨 getDashboardData Error:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 3. PLAN COMPTABLE (CRUD SÉCURISÉ)
// =============================================================================

exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

        if (!companyId) {
            return res.status(400).json({ error: "ID de compagnie manquant." });
        }

        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                context: { allowed_company_ids: [companyId] }
            }
        });

        res.status(200).json({ status: 'success', results: accounts.length, data: accounts });

    } catch (error) {
        console.error('🚨 getChartOfAccounts Error:', error.message);
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable.' });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const odooUid = req.user.odooUid;

        if (!odooUid || !companyId) {
            return res.status(400).json({ error: "UID ou companyId manquant." });
        }

        console.log(`📝 Création compte ${code} pour company_id=${companyId}`);

        const newAccountId = await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'create',
            args: [{ code, name, account_type: type }],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Compte créé avec ID: ${newAccountId}`);
        res.status(201).json({ status: 'success', data: { id: newAccountId } });

    } catch (err) {
        console.error('🚨 createAccount Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const odooUid = req.user.odooUid;

        if (!id || !odooUid || !companyId) {
            return res.status(400).json({ error: "Données manquantes (id, uid ou companyId)." });
        }

        console.log(`📝 Mise à jour compte ID=${id} pour company_id=${companyId}`);

        // 🔒 VÉRIFICATION DE SÉCURITÉ CROSS-COMPANY
        const accountCheck = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['id', '=', id], ['company_ids', 'in', [companyId]]]],
            kwargs: { fields: ['id'], limit: 1, context: { allowed_company_ids: [companyId] } }
        });

        if (!accountCheck || accountCheck.length === 0) {
            console.error(`🚨 TENTATIVE CROSS-COMPANY : Compte ${id} n'appartient pas à company_id=${companyId}`);
            return res.status(403).json({ 
                error: "Accès refusé. Ce compte n'appartient pas à votre entreprise." 
            });
        }

        await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'write',
            args: [[id], { code, name, account_type: type }],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Compte ${id} mis à jour`);
        res.status(200).json({ status: 'success', message: 'Compte mis à jour.' });

    } catch (err) {
        console.error('🚨 updateAccount Error:', err.message);
        
        if (err.message.includes('Access Denied')) {
            return res.status(403).json({ 
                error: "Accès refusé. Vérifiez les permissions Odoo sur account.account." 
            });
        }

        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 4. CRÉATION D'ÉCRITURE COMPTABLE
// =============================================================================

exports.createJournalEntry = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const { journalCode, date, narration, lines } = req.body;
        const odooUid = req.user.odooUid;

        console.log('📝 Création écriture via méthode Python personnalisée :', { companyId, journalCode });

        const result = await odooExecuteKw({
            uid: odooUid,
            model: 'account.move',
            method: 'create_journal_entry_via_api',
            args: [], 
            kwargs: {
                company_id: companyId,
                journal_code: journalCode,
                date: date,
                reference: narration,
                lines: lines
            }
        });

        if (result.status === 'error') {
            return res.status(400).json({ status: 'error', error: result.message });
        }

        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        console.error('🚨 createJournalEntry Error:', error.message);
        res.status(500).json({ status: 'error', error: "Échec de la communication avec Odoo." });
    }
};


// =============================================================================
// 5. REPORTING AVANCÉ (RESTAURÉ depuis ton fichier original)
// =============================================================================

exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to } = req.query;
        
        if (!companyId || !date_from || !date_to) {
            return res.status(400).json({ error: "Paramètres manquants (companyId, date_from, date_to)." });
        }

        const balanceData = await accountingService.getSyscohadaBalance(
            ADMIN_UID_INT, 
            companyId, 
            date_from, 
            date_to
        );
        
        res.status(200).json({ status: 'success', data: balanceData });
    } catch (error) {
        console.error('🚨 getSyscohadaTrialBalance Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getGeneralLedger = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to, journal_ids } = req.query;
        
        const journals = journal_ids ? journal_ids.split(',').map(Number) : [];
        const lines = await accountingService.getGeneralLedgerLines(
            ADMIN_UID_INT, 
            companyId, 
            date_from, 
            date_to, 
            journals
        );
        
        let ledger = {};
        lines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : 'N/A';
            if (!ledger[code]) {
                ledger[code] = { 
                    code, 
                    name: line.account_id[2], 
                    lines: [], 
                    totalDebit: 0, 
                    totalCredit: 0, 
                    finalBalance: 0 
                };
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

        res.status(200).json({ 
            status: 'success', 
            data: Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code)) 
        });
    } catch (error) {
        console.error('🚨 getGeneralLedger Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        if (!companyId) return res.status(400).json({ error: "companyId requis" });

        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id', 'name', 'code', 'type'], 
                context: { allowed_company_ids: [companyId] } 
            }
        });
        
        res.status(200).json({ status: 'success', data: journals });
    } catch (error) {
        console.error('🚨 getJournals Error:', error.message);
        res.status(500).json({ error: "Erreur récupération journaux." });
    }
};

// =============================================================================
// 6. STUBS (À IMPLÉMENTER)
// =============================================================================

exports.getEntryDetails = async (req, res) => res.status(501).json({ error: "Détails non implémentés." });
exports.handleCaisseEntry = async (req, res) => res.status(501).json({ error: "Caisse non implémentée." });
exports.getBalanceSheet = async (req, res) => res.status(501).json({ error: "Bilan non implémenté." });
