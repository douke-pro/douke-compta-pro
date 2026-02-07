// =============================================================================
// FICHIER : routes/authRoutes.js
// Description : Routes d'authentification et gestion des utilisateurs
// Architecture : JWT + XML-RPC Odoo + Multi-tenant
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { 
    registerUser, 
    loginUser, 
    assignCompany, 
    forceLogout,
    getMe
} = require('../controllers/authController');

// =============================================================================
// ROUTES PUBLIQUES (Sans authentification)
// =============================================================================

/**
 * POST /api/auth/register
 * Inscription : Création Utilisateur + Entreprise + Instance Odoo
 */
router.post('/register', registerUser);

/**
 * POST /api/auth/login
 * Connexion : Authentification JWT + Validation Odoo XML-RPC
 */
router.post('/login', loginUser);

// =============================================================================
// ROUTES PROTÉGÉES (Authentification JWT requise)
// =============================================================================

/**
 * GET /api/auth/me
 * Récupération du profil utilisateur authentifié
 * ✅ CRITIQUE : Utilisé par checkAuthAndRender() côté frontend
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/force-logout
 * Déconnexion forcée (invalidation du token côté serveur si implémenté)
 */
router.post('/force-logout', protect, forceLogout);

// =============================================================================
// ROUTES ADMIN (Permissions élevées)
// =============================================================================

/**
 * POST /api/auth/assign-company
 * Réaffectation d'un utilisateur à une autre entreprise
 * Permissions : ADMIN uniquement
 */
router.post('/assign-company', protect, restrictTo('ADMIN'), assignCompany);

module.exports = router;


