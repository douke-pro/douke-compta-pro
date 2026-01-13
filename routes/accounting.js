const express = require('express');
const router = express.Router();
const { protect, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// -------------------------------------------------------------
// ROUTES DE LECTURE (Nécessite uniquement 'protect')
// -------------------------------------------------------------

// 🔑 AJOUT CRITIQUE : Initialisation des dates (Fiscal Year)
router.get('/fiscal-config', protect, accountingController.getFiscalConfig);

// 🔑 ALIGNEMENT : Route Dashboard (Simple et précise)
router.get('/dashboard', protect, accountingController.getDashboardData);
router.get('/dashboard/kpis', protect, accountingController.getDashboardData); // Alias pour compatibilité

// Rapports SYSCOHADA
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);
router.get('/trial-balance', protect, accountingController.getSyscohadaTrialBalance);
router.get('/ledger', protect, accountingController.getGeneralLedger);
router.get('/balance', protect, accountingController.getBalanceSheet);
router.get('/journals', protect, accountingController.getJournals);

// Détails
router.get('/details/:entryId', protect, accountingController.getEntryDetails);

// Plan Comptable (Lecture)
router.get('/chart-of-accounts', protect, accountingController.getChartOfAccounts); 

// -------------------------------------------------------------
// ROUTES DE MODIFICATION (Nécessite 'protect' ET 'checkWritePermission')
// -------------------------------------------------------------

router.post('/caisse-entry', protect, checkWritePermission, accountingController.handleCaisseEntry);
router.post('/move', protect, checkWritePermission, accountingController.createJournalEntry);

// CRUD Plan Comptable
router.post('/chart-of-accounts', protect, checkWritePermission, accountingController.createAccount);
router.put('/chart-of-accounts', protect, checkWritePermission, accountingController.updateAccount);

module.exports = router;
