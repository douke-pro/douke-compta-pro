// =============================================================================
// FICHIER : routes/user.js
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Route pour le tableau de bord ou les données de session initiales
router.get('/session-data', protect, userController.getSessionData);

module.exports = router;
