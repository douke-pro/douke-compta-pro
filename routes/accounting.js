// =============================================================================
// FICHIER : routes/accounting.js (VERSION V17 - CLÔTURE FISCALE CORRIGÉE)
// Description : Routes pour la gestion comptable SYSCOHADA
// ✅ CORRECTION : authMiddleware → protect dans les routes de clôture
// =============================================================================

const express = require('express');
const router  = express.Router();
const {
    protect,
    checkCompanyAccess,
    checkWritePermission,
    authenticateToken
} = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// =============================================================================
// ROUTES DE CONFIGURATION
// =============================================================================

router.get('/fiscal-config', protect, checkCompanyAccess, accountingController.getFiscalConfig);

// =============================================================================
// ROUTES DE LECTURE (DASHBOARD ET RAPPORTS)
// =============================================================================

router.get('/dashboard',        protect, checkCompanyAccess, accountingController.getDashboardData);
router.get('/dashboard/kpis',   protect, checkCompanyAccess, accountingController.getDashboardData);
router.get('/report/:analyticId', protect, checkCompanyAccess, accountingController.getFinancialReport);

router.get('/trial-balance-syscohada', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);
router.get('/syscohada-trial-balance', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);

router.get('/general-ledger',   protect, checkCompanyAccess, accountingController.getGeneralLedger);
router.get('/balance-sheet',    protect, checkCompanyAccess, accountingController.getBalanceSheet);
router.get('/journals',         protect, checkCompanyAccess, accountingController.getJournals);
router.get('/journal',          protect, checkCompanyAccess, accountingController.getJournalEntries);
router.get('/entry/:id',        protect, checkCompanyAccess, accountingController.getEntryDetails);
router.get('/chart-of-accounts',protect, checkCompanyAccess, accountingController.getChartOfAccounts);

// =============================================================================
// ROUTES D'ÉCRITURE (CRÉATION/MODIFICATION)
// =============================================================================

router.post('/move/create',       protect, checkCompanyAccess, checkWritePermission, accountingController.createJournalEntry);
router.post('/caisse-entry',      protect, checkCompanyAccess, checkWritePermission, accountingController.handleCaisseEntry);
router.post('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.createAccount);
router.put ('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.updateAccount);

// =============================================================================
// ROUTE COMPTES — ODOO 19 COMPATIBLE
// =============================================================================

router.get('/accounts', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.currentCompanyId ||
                          req.user.companyId ||
                          parseInt(req.query.companyId);

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'Company ID manquant' });
        }

        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

        console.log('🔍 [getAccounts] Récupération comptes pour company:', companyId);

        const accounts = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.account',
            method: 'search_read',
            args:   [[]],
            kwargs: {
                fields:  ['id', 'code', 'name', 'account_type'],
                order:   'code ASC',
                limit:   2000,
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`✅ [getAccounts] ${accounts.length} comptes récupérés pour company ${companyId}`);

        res.json({ status: 'success', data: accounts });

    } catch (error) {
        console.error('🚨 [getAccounts] Erreur:', error.message);
        res.status(500).json({
            status:  'error',
            error:   'Erreur récupération comptes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// =============================================================================
// EXERCICES FISCAUX — Odoo account.fiscal.year
// =============================================================================

router.get('/fiscal-years', authenticateToken, async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId) ||
                          req.user.currentCompanyId ||
                          req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'companyId requis' });
        }

        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

        console.log(`📅 [fiscal-years] Récupération exercices pour company ${companyId}`);

        const fiscalYears = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.fiscal.year',
            method: 'search_read',
            args:   [[['company_id', '=', companyId]]],
            kwargs: {
                fields:  ['id', 'name', 'date_from', 'date_to', 'company_id'],
                order:   'date_from DESC',
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`✅ [fiscal-years] ${fiscalYears.length} exercices trouvés`);

        res.json({ success: true, data: fiscalYears });

    } catch (error) {
        console.error('❌ [fiscal-years] Erreur:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/fiscal-years', authenticateToken, async (req, res) => {
    try {
        const { companyId, name, date_from, date_to } = req.body;

        if (!companyId || !name || !date_from || !date_to) {
            return res.status(400).json({
                success: false,
                error:   'companyId, name, date_from et date_to sont requis'
            });
        }

        if (new Date(date_from) >= new Date(date_to)) {
            return res.status(400).json({
                success: false,
                error:   'date_from doit être antérieure à date_to'
            });
        }

        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

        console.log(`📅 [fiscal-years/create] Création exercice ${name} pour company ${companyId}`);

        const newId = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'account.fiscal.year',
            method: 'create',
            args:   [{
                name:       name,
                date_from:  date_from,
                date_to:    date_to,
                company_id: parseInt(companyId)
            }],
            kwargs: {
                context: { allowed_company_ids: [parseInt(companyId)] }
            }
        });

        console.log(`✅ [fiscal-years/create] Exercice créé ID: ${newId}`);

        res.status(201).json({
            success: true,
            data:    { id: newId, name, date_from, date_to }
        });

    } catch (error) {
        console.error('❌ [fiscal-years/create] Erreur:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// ROUTES CLÔTURE FISCALE
// Version : 1.3
// Corrections :
//   ✅ Route /available-years ajoutée
//   ✅ Middleware isAdmin sur unlock/relock
//   ✅ Validation des paramètres
//   ✅ Rate limiting sur actions sensibles
//   ✅ Documentation JSDoc
// =============================================================================

const express = require('express');
const router = express.Router();
const closingController = require('../controllers/closingController');
const { protect, isAdmin } = require('../middlewares/auth');
const { 
    validateClosingStatus, 
    validatePreChecks,
    validatePostResult,
    validateLock,
    validateUnlock,
    validateFinalize,
    validateAuditLog
} = require('../middlewares/validateClosing');
const rateLimit = require('express-rate-limit');

// Rate limiter pour actions critiques
const unlockLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: {
        status: 'error',
        error: 'Trop de tentatives. Réessayez dans 15 minutes.'
    }
});

// =============================================================================
// ROUTES DE CONSULTATION
// =============================================================================

/**
 * @route   GET /api/accounting/closing/available-years
 * @desc    Liste des exercices fiscaux disponibles pour l'entreprise
 * @access  Privé
 * @query   {number} companyId - ID de l'entreprise
 * @returns {object} status, data: [{ year, start_date, end_date, status, is_default }]
 */
router.get(
    '/closing/available-years', 
    protect, 
    query('companyId').isInt({ min: 1 }),
    closingController.getAvailableYears
);

/**
 * @route   GET /api/accounting/closing/status
 * @desc    État de clôture d'un exercice fiscal
 * @access  Privé
 * @query   {number} companyId - ID de l'entreprise
 * @query   {number} year - Année fiscale
 * @returns {object} status, data: { status, result_amount, lock_date, ... }
 */
router.get(
    '/closing/status', 
    protect, 
    validateClosingStatus, 
    closingController.getClosingStatus
);

/**
 * @route   GET /api/accounting/closing/pre-checks
 * @desc    Pré-vérifications avant clôture
 * @access  Privé
 * @query   {number} companyId - ID de l'entreprise
 * @query   {number} year - Année fiscale
 * @returns {object} status, data: { blocking, warnings, result, can_proceed }
 */
router.get(
    '/closing/pre-checks', 
    protect, 
    validatePreChecks, 
    closingController.runPreChecks
);

/**
 * @route   GET /api/accounting/closing/audit-log
 * @desc    Journal d'audit des actions de clôture
 * @access  Privé
 * @query   {number} companyId - ID de l'entreprise
 * @query   {number} year - Année fiscale
 * @returns {object} status, data: [{ action, performed_by, performed_at, ... }], count
 */
router.get(
    '/closing/audit-log', 
    protect, 
    validateAuditLog, 
    closingController.getAuditLog
);

// =============================================================================
// FLUX NORMAL DE CLÔTURE (dans l'ordre)
// =============================================================================

/**
 * @route   POST /api/accounting/closing/post-result
 * @desc    Crée et valide l'écriture d'affectation du résultat dans Odoo
 * @access  Privé
 * @body    {number} companyId - ID de l'entreprise
 * @body    {number} fiscal_year - Année fiscale
 * @body    {number} result_amount - Montant du résultat
 * @body    {string} result_type - 'profit' ou 'loss'
 * @returns {object} status, move_name, move_id
 */
router.post(
    '/closing/post-result', 
    protect, 
    validatePostResult, 
    closingController.postResultEntry
);

/**
 * @route   POST /api/accounting/closing/lock
 * @desc    Verrouille l'exercice fiscal dans Odoo (fiscalyear_lock_date)
 * @access  Privé
 * @body    {number} companyId - ID de l'entreprise
 * @body    {number} fiscal_year - Année fiscale
 * @returns {object} status, lock_date
 */
router.post(
    '/closing/lock', 
    protect, 
    validateLock, 
    closingController.lockFiscalYear
);

/**
 * @route   POST /api/accounting/closing/finalize
 * @desc    Finalise la clôture (statut → 'closed')
 * @access  Privé
 * @body    {number} companyId - ID de l'entreprise
 * @body    {number} fiscal_year - Année fiscale
 * @body    {string} notes - Notes de clôture (optionnel)
 * @returns {object} status, message
 */
router.post(
    '/closing/finalize', 
    protect, 
    validateFinalize, 
    closingController.finalizeClosing
);

// =============================================================================
// FLUX CORRECTION (ADMIN UNIQUEMENT)
// =============================================================================

/**
 * @route   POST /api/accounting/closing/unlock
 * @desc    Déverrouille un exercice fiscal (ADMIN ONLY - tracé dans l'audit)
 * @access  Privé (admin uniquement)
 * @body    {number} companyId - ID de l'entreprise
 * @body    {number} fiscal_year - Année fiscale
 * @body    {string} reason - Motif obligatoire (min 10 caractères)
 * @returns {object} status, message
 */
router.post(
    '/closing/unlock', 
    protect, 
    isAdmin, 
    unlockLimiter, 
    validateUnlock, 
    closingController.unlockFiscalYear
);

/**
 * @route   POST /api/accounting/closing/relock
 * @desc    Re-verrouille un exercice après correction (ADMIN ONLY)
 * @access  Privé (admin uniquement)
 * @body    {number} companyId - ID de l'entreprise
 * @body    {number} fiscal_year - Année fiscale
 * @body    {string} notes - Notes de re-verrouillage (optionnel)
 * @returns {object} status, lock_date
 */
router.post(
    '/closing/relock', 
    protect, 
    isAdmin, 
    validateLock, 
    closingController.relockFiscalYear
);

module.exports = router;
