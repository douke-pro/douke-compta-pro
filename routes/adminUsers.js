// =============================================================================
// FICHIER : routes/adminUsers.js
// Description : Routes pour la gestion des utilisateurs (ADMIN uniquement)
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const adminUsersController = require('../controllers/adminUsersController');

// =============================================================================
// PROTECTION : Authentification + Rôle ADMIN
// =============================================================================

router.use(protect);               // JWT obligatoire
router.use(restrictTo('ADMIN'));   // ADMIN uniquement

// =============================================================================
// ROUTES GESTION DES UTILISATEURS
// =============================================================================

/**
 * @route   GET /api/admin/users
 * @desc    Liste tous les utilisateurs
 * @access  ADMIN uniquement
 */
router.get('/users', adminUsersController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Détails d'un utilisateur
 * @access  ADMIN uniquement
 */
router.get('/users/:id', adminUsersController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Créer un utilisateur
 * @access  ADMIN uniquement
 */
router.post('/users', adminUsersController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Modifier un utilisateur
 * @access  ADMIN uniquement
 */
router.put('/users/:id', adminUsersController.updateUser);

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    Activer/Désactiver un utilisateur
 * @access  ADMIN uniquement
 */
router.patch('/users/:id/toggle-status', adminUsersController.toggleUserStatus);

/**
 * @route   PATCH /api/admin/users/:id/reset-password
 * @desc    Réinitialiser mot de passe
 * @access  ADMIN uniquement
 */
router.patch('/users/:id/reset-password', adminUsersController.resetUserPassword);

/**
 * @route   PUT /api/admin/users/:id/companies
 * @desc    Assigner entreprises
 * @access  ADMIN uniquement
 */
router.put('/users/:id/companies', adminUsersController.updateUserCompanies);

// =============================================================================
// EXPORT
// =============================================================================

module.exports = router;
