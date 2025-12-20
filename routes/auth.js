const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout 
} = require('../controllers/authController');

// Inscription : Création Utilisateur + Partenaire + Coffre Analytique
router.post('/register', registerUser);

// Connexion : Authentification XML-RPC
router.post('/login', loginUser);

// Gouvernance (Sécurisée) : Seul un ADMIN peut réaffecter des droits
router.post('/assign-company', protect, restrictTo('ADMIN'), assignCompany);

// Sécurité : Déconnexion forcée
router.post('/force-logout', protect, forceLogout);

module.exports = router;
