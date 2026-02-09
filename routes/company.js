const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    createCompanyWithIsolation, 
    listUserCompanies 
} = require('../controllers/companyController');

// Vérification du module
router.get('/status', (req, res) => {
    res.json({ 
        status: "success", 
        message: "Module Company opérationnel",
        logic: "Analytic Isolation (Partner-based)"
    });
});

// Créer une nouvelle entreprise (Partenaire + Compte Analytique dédié)
router.post('/create', protect, createCompanyWithIsolation);

// Lister les entreprises (Partenaires) liées au compte de l'utilisateur
router.get('/list', protect, listUserCompanies);

module.exports = router;

router.get('/', protect, companyController.getCompanies);

module.exports = router;
