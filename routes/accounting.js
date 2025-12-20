const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// Route pour obtenir le rapport SYSCOHADA d'une entreprise
// Usage: /api/accounting/report/123?systemType=NORMAL
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);

module.exports = router;
