const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout 
    getMe // ⬅️ NOUVEL EXPORT
} = require('../controllers/authController');

// Inscription : Création Utilisateur + Partenaire + Coffre Analytique
router.post('/register', registerUser);

// Connexion : Authentification XML-RPC
router.post('/login', loginUser);

// 🚀 NOUVELLE ROUTE CRITIQUE : Récupération du profil utilisateur via JWT
router.get('/me', protect, getMe);

// Gouvernance (Sécurisée) : Seul un ADMIN peut réaffecter des droits
router.post('/assign-company', protect, restrictTo('ADMIN'), assignCompany);

// Sécurité : Déconnexion forcée
router.post('/force-logout', protect, forceLogout);

module.exports = router;
