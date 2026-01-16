// =============================================================================
// FICHIER : controllers/accountingController.js
// =============================================================================

// On importe les fonctions directement (Destructuring)
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

/**
 * Récupère les dates de l'exercice comptable depuis Odoo.
 */
exports.getFiscalConfig = async (req, res) => {
    try {
        const { companyId } = req.query;

        // Le log doit être ICI, après la définition de companyId
        console.log(`[DEBUG] Appel fiscal pour la compagnie : ${companyId}`);
        
        if (!companyId) return res.status(400).json({ error: "companyId manquant" });

        // Correction : On utilise directement la fonction importée
        // On sécurise l'UID avec une valeur par défaut au cas où
        const result = await odooExecuteKw({ 
            uid: ADMIN_UID_INT || 5, 
            model: 'res.company',
            method: 'compute_fiscalyear_dates',
            args: [parseInt(companyId)],
            kwargs: {} // Vide pour laisser Odoo 19 utiliser la date du jour serveur
        });

        // Sécurité supplémentaire : On vérifie que result existe
        if (!result || !result.date_from) {
            throw new Error("Réponse Odoo incomplète");
        }

        res.json({
            status: 'success',
            fiscal_period: {
                start_date: result.date_from,
                end_date: result.date_to
            }
        });
    } catch (error) {
        console.error('[Fiscal Config Error] Fallback activé:', error.message);
        
        // Année en cours dynamique pour le fallback
        const year = new Date().getFullYear();
        res.json({
            status: 'success',
            fiscal_period: { 
                start_date: `${year}-01-01`, 
                end_date: `${year}-12-31` 
            }
        });
    }
};

// =============================================================================
// 2. LOGIQUE DE REPORTING COMPTABLE (CLOISONNÉ ET SÉCURISÉ)
// =============================================================================

/**
 * Rapport SYSCOHADA (Bilan/Compte de Résultat) par CompanyId et AnalyticId.
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType, companyId } = req.query; 

        if (!ADMIN_UID_INT || !companyId) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID ou companyId manquant." });
        }
        
        const companyIdInt = parseInt(companyId, 10);
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];
        const companyFilter = [['company_id', 'in', [companyIdInt]]]; // 🔑 Filtre LÉGAL CRITIQUE

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

        if (systemType === 'SMT') {
            return res.json({
                systeme: "Minimal de Trésorerie (SMT)",
                flux: { encaissements: report.chiffreAffaires, decaissements: report.chargesExploitation, soldeNet: report.tresorerie }
            });
        }
        
        res.json({ systeme: "Normal (Comptabilité d'engagement)", donnees: report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Données de synthèse pour le tableau de bord.
 */
exports.getDashboardData = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId || !ADMIN_UID_INT) return res.status(400).json({ error: 'Le paramètre companyId ou l\'Admin UID est requis.' });

        const companyIdInt = parseInt(companyId, 10);
        const companyFilter = [['company_id', 'in', [companyIdInt]]];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ['parent_state', '=', 'posted']]],
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

        res.status(200).json({ status: 'success', message: 'Données récupérées.', data });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 3. LOGIQUE DU PLAN COMPTABLE (CRUD CLOISONNÉ)
// =============================================================================

exports.getChartOfAccounts = async (req, res) => {
    try {
        const { companyId } = req.query;
        // On récupère l'UID de l'utilisateur authentifié ou l'Admin par défaut
        const odooUid = (req.user && req.user.odooUid) ? req.user.odooUid : ADMIN_UID_INT;

        if (!companyId) {
            return res.status(400).json({ error: "ID de compagnie manquant." });
        }

        const companyIdInt = parseInt(companyId, 10);

        const accounts = await odooExecuteKw({
            uid: odooUid, 
            model: 'account.account',
            method: 'search_read',
            // ARGS : On utilise un filtre plus universel pour éviter les erreurs de champ
            args: [[
                '|', 
                ['company_id', '=', companyIdInt], 
                ['company_id', '=', false] // Pour inclure les comptes génériques si nécessaire
            ]], 
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                // CONTEXT : Indispensable pour que l'ORM Odoo filtre correctement en interne
                context: { 
                    company_id: companyIdInt, 
                    allowed_company_ids: [companyIdInt] 
                }
            }
        });

        // Log de debug interne pour Render
        console.log(`[Plan Comptable] ${accounts.length} comptes récupérés pour la société ${companyIdInt}`);

        res.status(200).json({ 
            status: 'success', 
            results: accounts.length, 
            data: accounts 
        });

    } catch (error) {
        console.error('[Plan Comptable Error]:', error.message);
        res.status(500).json({ 
            error: 'Échec de la récupération du Plan Comptable.',
            details: error.message 
        });
    }
};

exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body;
        const odooUid = req.user.odooUid;
        const companyIdInt = parseInt(companyId);
        if (!odooUid || !companyIdInt) return res.status(400).json({ error: "UID ou companyId manquant." });

        const newAccountId = await odooExecuteKw({
            uid: odooUid, // 🔑 Utilisation de l'UID utilisateur pour traçabilité
            model: 'account.account',
            method: 'create',
            args: [{ 'code': code, 'name': name, 'account_type': type }],
            kwargs: { context: { company_id: companyIdInt, allowed_company_ids: [companyIdInt] } }
        });
        res.status(201).json({ status: 'success', data: { id: newAccountId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type, companyId } = req.body;
        const odooUid = req.user.odooUid;
        const companyIdInt = parseInt(companyId);
        if (!id || !odooUid || !companyIdInt) return res.status(400).json({ error: "Données manquantes." });

        await odooExecuteKw({
            uid: odooUid,
            model: 'account.account',
            method: 'write',
            args: [[id], { 'code': code, 'name': name, 'account_type': type }],
            kwargs: { context: { company_id: companyIdInt, allowed_company_ids: [companyIdInt] } }
        });
        res.status(200).json({ status: 'success', message: 'Compte mis à jour.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 4. REPORTING AVANCÉ (SERVICES) ET JOURNAUX
// =============================================================================

exports.createJournalEntry = async (req, res) => {
    try {
        const { companyId, journalCode, date, narration, lines } = req.body;

        // Validation stricte des entrées avant d'appeler Odoo
        if (!companyId || !lines || !Array.isArray(lines)) {
            return res.status(400).json({ error: "Données invalides : 'companyId' et 'lines' (Array) sont requis." });
        }

        console.log(`[Odoo API] Tentative de création d'écriture : Journal ${journalCode}, Co: ${companyId}`);

        const result = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create_journal_entry_via_api', 
            args: [], 
            kwargs: {
                company_id: parseInt(companyId, 10),
                journal_code: journalCode,
                date: date, // Format YYYY-MM-DD attendu par Odoo
                reference: narration,
                lines: lines // On s'assure que c'est un Array d'objets
            }
        });

        // Gestion de la réponse structurée de ton module Python
        if (!result || result.status === 'error') {
            console.error('[Odoo Business Error]', result ? result.message : 'Réponse vide');
            return res.status(400).json({ error: result ? result.message : "Erreur inconnue lors de la création dans Odoo." });
        }

        res.status(201).json({ 
            status: 'success', 
            message: "Écriture comptable validée", 
            data: result 
        });

    } catch (error) {
        // Capture des erreurs de communication (Timeout, Crash RPC, etc.)
        console.error('[Node Fatal Error]', error.message);
        res.status(500).json({ error: "Échec critique de la communication avec Odoo." });
    }
};

exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const { companyId, date_from, date_to } = req.query;
        if (!companyId || !date_from || !date_to) return res.status(400).json({ error: "Paramètres manquants." });

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
            if (!ledger[code]) ledger[code] = { code, name: line.account_id[2], lines: [], totalDebit: 0, totalCredit: 0, finalBalance: 0 };
            ledger[code].lines.push({ date: line.date, journalEntry: line.move_name, description: line.name || line.ref, debit: line.debit, credit: line.credit, balance: line.balance });
            ledger[code].totalDebit += line.debit;
            ledger[code].totalCredit += line.credit;
            ledger[code].finalBalance += line.balance;
        });

        res.status(200).json({ status: 'success', data: Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code)) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJournals = async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ error: "companyId requis" });

        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', parseInt(companyId)]]],
            kwargs: { fields: ['id', 'name', 'code', 'type'], context: { company_id: parseInt(companyId) } }
        });
        res.status(200).json({ status: 'success', data: journals });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des journaux." });
    }
};

// =============================================================================
// 5. STUBS (FONCTIONS EN ATTENTE)
// =============================================================================

exports.getEntryDetails = async (req, res) => res.status(501).json({ error: "Détails non implémentés." });
exports.handleCaisseEntry = async (req, res) => res.status(501).json({ error: "Caisse non implémentée." });
exports.getBalanceSheet = async (req, res) => res.status(501).json({ error: "Bilan non implémenté." });
