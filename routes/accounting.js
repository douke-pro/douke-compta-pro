const express = require('express');
const router = express.Router();
// 💡 IMPORTANT : On importe maintenant checkWritePermission
const { protect, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// -------------------------------------------------------------
// ROUTES DE LECTURE (Nécessite uniquement 'protect')
// -------------------------------------------------------------

// Route pour obtenir les données du tableau de bord (GET /api/accounting/dashboard?companyId=X)
router.get('/dashboard', protect, accountingController.getDashboardData);

// Route pour obtenir le rapport SYSCOHADA (GET /api/accounting/report/123?systemType=NORMAL)
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);

// Lecture du Plan Comptable (Ouvert aux rôles avec droit de vue)
// GET /api/accounting/chart-of-accounts?companyId=X
router.get('/chart-of-accounts', protect, accountingController.getChartOfAccounts); 


// -------------------------------------------------------------
// ROUTES DE MODIFICATION (Nécessite 'protect' ET 'checkWritePermission')
// -------------------------------------------------------------

// Création d'un compte
// POST /api/accounting/chart-of-accounts
router.post('/chart-of-accounts', protect, checkWritePermission, accountingController.createAccount);

// Modification d'un compte
// PUT /api/accounting/chart-of-accounts
router.put('/chart-of-accounts', protect, checkWritePermission, accountingController.updateAccount);

module.exports = router;
