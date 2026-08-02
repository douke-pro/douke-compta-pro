const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

// 🔧 IMPORTER LE CONTRÔLEUR
const companyController = require('../controllers/companyController');

// Routes existantes
router.post('/create', protect, companyController.createCompanyWithIsolation);
router.get('/list', protect, companyController.listUserCompanies);

// 🆕 NOUVELLE ROUTE (pour la liste des entreprises)
router.get('/', protect, restrictTo('ADMIN'), companyController.getCompanies);

module.exports = router;
