'use strict';

const express           = require('express');
const router            = express.Router();
const closingController = require('../controllers/closingController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// Workflow de clôture, dans l'ordre :
router.get ('/status',           protect, checkCompanyAccess, closingController.getClosingStatus);
router.post('/pre-checks',       protect, checkCompanyAccess, closingController.runPreChecks);
router.post('/result-entry',     protect, checkCompanyAccess, closingController.postResultEntry);
router.post('/lock',             protect, checkCompanyAccess, closingController.lockFiscalYear);
router.post('/finalize',         protect, checkCompanyAccess, closingController.finalizeClosing);
router.post('/unlock',           protect, checkCompanyAccess, closingController.unlockFiscalYear);
router.post('/relock',           protect, checkCompanyAccess, closingController.relockFiscalYear);
router.post('/snapshot/retry',   protect, checkCompanyAccess, closingController.retrySnapshot);
router.get ('/opening-balances', protect, checkCompanyAccess, closingController.getOpeningBalances);
router.get ('/audit-log',        protect, checkCompanyAccess, closingController.getAuditLog);
router.get ('/available-years',  protect, checkCompanyAccess, closingController.getAvailableYears);

module.exports = router;
