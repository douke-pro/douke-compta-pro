const express = require('express');
const router = express.Router();
// Importation des fonctions du contrôleur
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout 
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Inscription (Création Société + Utilisateur dans Odoo)
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Connexion (Authentification via Odoo XML-RPC)
router.post('/login', loginUser);

// @route   POST /api/auth/assign-company
// @desc    Gouvernance : Affecter une société à un utilisateur
router.post('/assign-company', assignCompany);

// @route   POST /api/auth/force-logout
// @desc    Gouvernance : Déconnexion forcée
router.post('/force-logout', forceLogout);

module.exports = router;
