const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// 🔧 IMPORTER LE CONTRÔLEUR
const companyController = require('../controllers/companyController');

// Routes existantes
router.post('/create', protect, companyController.createCompanyWithIsolation);
router.get('/list', protect, companyController.listUserCompanies);

// 🆕 NOUVELLE ROUTE (pour la liste des entreprises)
router.get('/', protect, companyController.getCompanies);

module.exports = router;
