const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout,
    getMe // <-- Déplacer le commentaire ou s'assurer qu'il est après la virgule
} = require('../controllers/authController'); 
// OU MIEUX, supprimer le commentaire pour cette ligne si le déploiement est sensible au formatage
// Vous pouvez aussi simplement l'écrire ainsi :
/*
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout,
    getMe
} = require('../controllers/authController');
*/
// Inscription : Création Utilisateur + Partenaire + Coffre Analytique
router.post('/register', registerUser);
// Connexion : Authentification XML-RPC
router.post('/login', loginUser);
// 🚀 NOUVELLE ROUTE CRITIQUE : Récupération du profil utilisateur via JWT
router.get('/me', protect, getMe); // La ligne d'ajout de la route est correcte
// Gouvernance (Sécurisée) : Seul un ADMIN peut réaffecter des droits
router.post('/assign-company', protect, restrictTo('ADMIN'), assignCompany);
// Sécurité : Déconnexion forcée
router.post('/force-logout', protect, forceLogout);
module.exports = router;

