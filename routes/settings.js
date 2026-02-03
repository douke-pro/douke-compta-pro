const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// Routes Entreprise
router.get('/company/:companyId', protect, checkCompanyAccess, settingsController.getCompanySettings);
router.put('/company/:companyId', protect, checkCompanyAccess, settingsController.updateCompanySettings);

// Routes Système Comptable
router.get('/accounting/:companyId', protect, checkCompanyAccess, settingsController.getAccountingSettings);
router.put('/accounting/:companyId', protect, checkCompanyAccess, settingsController.updateAccountingSettings);

// Routes Abonnement (Admin uniquement)
router.get('/subscription/:companyId', protect, checkCompanyAccess, settingsController.getSubscriptionSettings);
router.put('/subscription/:companyId', protect, checkCompanyAccess, settingsController.updateSubscriptionSettings);

// Route Profil Utilisateur
router.put('/user', protect, settingsController.updateUserProfile);

module.exports = router;
