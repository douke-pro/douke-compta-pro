// =============================================================================
// FICHIER : routes/accounting.js (VERSION COMPLÈTE — CORRIGÉE)
// Description : Routes pour la gestion comptable SYSCOHADA
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// -------------------------------------------------------------
// ROUTES DE LECTURE
// Middlewares : protect + checkCompanyAccess
// -------------------------------------------------------------

// 🔑 Configuration fiscale (Fiscal Year)
router.get('/fiscal-config', protect, checkCompanyAccess, accountingController.getFiscalConfig);

// 🔑 Dashboard
router.get('/dashboard', protect, checkCompanyAccess, accountingController.getDashboardData);
router.get('/dashboard/kpis', protect, checkCompanyAccess, accountingController.getDashboardData);

// Rapports SYSCOHADA
router.get('/report/:analyticId', protect, checkCompanyAccess, accountingController.getFinancialReport);
router.get('/syscohada-trial-balance', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);
router.get('/general-ledger', protect, checkCompanyAccess, accountingController.getGeneralLedger);
router.get('/balance-sheet', protect, checkCompanyAccess, accountingController.getBalanceSheet);

// Journaux
router.get('/journals', protect, checkCompanyAccess, accountingController.getJournals);
router.get('/journal', protect, checkCompanyAccess, accountingController.getJournalEntries);

// Détails d'une écriture
router.get('/entry/:id', protect, checkCompanyAccess, accountingController.getEntryDetails);

// Plan Comptable (Lecture)
router.get('/chart-of-accounts', protect, checkCompanyAccess, accountingController.getChartOfAccounts);

// -------------------------------------------------------------
// ROUTES DE MODIFICATION
// Middlewares : protect + checkCompanyAccess + checkWritePermission
// -------------------------------------------------------------

// Écriture comptable
router.post('/move/create', protect, checkCompanyAccess, checkWritePermission, accountingController.createJournalEntry);

// Opération de caisse
router.post('/caisse-entry', protect, checkCompanyAccess, checkWritePermission, accountingController.handleCaisseEntry);

// CRUD Plan Comptable
router.post('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.createAccount);
router.put('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.updateAccount);

module.exports = router;
