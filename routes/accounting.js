const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// Route pour obtenir les données du tableau de bord (GET /api/accounting/dashboard?companyId=X)
router.get('/dashboard', protect, accountingController.getDashboardData);

// Route pour obtenir le rapport SYSCOHADA d'une entreprise
// Usage: /api/accounting/report/123?systemType=NORMAL
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);

module.exports = router;
