'use strict';
const express             = require('express');
const router              = express.Router();
const syscohadaController = require('../controllers/syscohadaController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

router.get('/bilan',           protect, checkCompanyAccess, syscohadaController.getBilan);
router.get('/compte-resultat', protect, checkCompanyAccess, syscohadaController.getCompteResultat);
router.get('/tft',             protect, checkCompanyAccess, syscohadaController.getTFT);
router.get('/etats-complets',  protect, checkCompanyAccess, syscohadaController.getEtatsComplets);

module.exports = router;
