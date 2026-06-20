'use strict';

const express           = require('express');
const router            = express.Router();
const closingController = require('../controllers/closingController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// GET  /api/closing/status?companyId=X&year=Y
router.get('/status',          protect, checkCompanyAccess, closingController.getClosingStatus);

// POST /api/closing/finalize
router.post('/finalize',       protect, checkCompanyAccess, closingController.finalizeClosing);

// POST /api/closing/unlock
router.post('/unlock',         protect, checkCompanyAccess, closingController.unlockFiscalYear);

// POST /api/closing/snapshot/retry
router.post('/snapshot/retry', protect, checkCompanyAccess, closingController.retrySnapshot);

// GET  /api/closing/opening-balances?companyId=X&year=Y
router.get('/opening-balances',protect, checkCompanyAccess, closingController.getOpeningBalances);

module.exports = router;
