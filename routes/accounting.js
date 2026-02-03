// =============================================================================
// FICHIER : routes/accounting.js (VERSION V15 - FINALE ROBUSTE)
// Description : Routes pour la gestion comptable SYSCOHADA
// Endpoints harmonisés frontend/backend
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// =============================================================================
// ROUTES DE CONFIGURATION
// =============================================================================

/**
 * Configuration fiscale (période de l'exercice)
 * GET /api/accounting/fiscal-config?companyId=X
 */
router.get('/fiscal-config', protect, checkCompanyAccess, accountingController.getFiscalConfig);

// =============================================================================
// ROUTES DE LECTURE (DASHBOARD ET RAPPORTS)
// =============================================================================

/**
 * Tableau de bord (KPIs)
 * GET /api/accounting/dashboard?companyId=X
 * GET /api/accounting/dashboard/kpis?companyId=X
 */
router.get('/dashboard', protect, checkCompanyAccess, accountingController.getDashboardData);
router.get('/dashboard/kpis', protect, checkCompanyAccess, accountingController.getDashboardData);

/**
 * Rapport financier par centre analytique
 * GET /api/accounting/report/:analyticId?companyId=X&systemType=NORMAL
 */
router.get('/report/:analyticId', protect, checkCompanyAccess, accountingController.getFinancialReport);

/**
 * 🔑 BALANCE SYSCOHADA 6 COLONNES
 * GET /api/accounting/trial-balance-syscohada?companyId=X&date_from=Y&date_to=Z
 * OU
 * GET /api/accounting/syscohada-trial-balance?companyId=X&date_from=Y&date_to=Z
 * 
 * Les deux routes pointent vers la même fonction pour compatibilité frontend/backend
 */
router.get('/trial-balance-syscohada', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);
router.get('/syscohada-trial-balance', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);

/**
 * Grand Livre
 * GET /api/accounting/general-ledger?companyId=X&date_from=Y&date_to=Z&journal_ids=1,2,3
 */
router.get('/general-ledger', protect, checkCompanyAccess, accountingController.getGeneralLedger);

/**
 * Bilan SYSCOHADA
 * GET /api/accounting/balance-sheet?companyId=X&date=Y
 */
router.get('/balance-sheet', protect, checkCompanyAccess, accountingController.getBalanceSheet);

/**
 * Liste des journaux
 * GET /api/accounting/journals?companyId=X
 */
router.get('/journals', protect, checkCompanyAccess, accountingController.getJournals);

/**
 * Journal des écritures (Liste des mouvements)
 * GET /api/accounting/journal?companyId=X&journal_id=Y&date_from=Z&date_to=W
 */
router.get('/journal', protect, checkCompanyAccess, accountingController.getJournalEntries);

/**
 * Détails d'une écriture spécifique
 * GET /api/accounting/entry/:id?companyId=X
 */
router.get('/entry/:id', protect, checkCompanyAccess, accountingController.getEntryDetails);

/**
 * Plan comptable SYSCOHADA
 * GET /api/accounting/chart-of-accounts?companyId=X
 */
router.get('/chart-of-accounts', protect, checkCompanyAccess, accountingController.getChartOfAccounts);

// =============================================================================
// ROUTES D'ÉCRITURE (CRÉATION/MODIFICATION)
// =============================================================================

/**
 * Créer une écriture comptable
 * POST /api/accounting/move/create
 */
router.post('/move/create', protect, checkCompanyAccess, checkWritePermission, accountingController.createJournalEntry);

/**
 * Opération de caisse (recette/dépense)
 * POST /api/accounting/caisse-entry
 */
router.post('/caisse-entry', protect, checkCompanyAccess, checkWritePermission, accountingController.handleCaisseEntry);

/**
 * Créer un compte
 * POST /api/accounting/chart-of-accounts
 */
router.post('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.createAccount);

/**
 * Modifier un compte
 * PUT /api/accounting/chart-of-accounts
 */
router.put('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.updateAccount);

module.exports = router;
