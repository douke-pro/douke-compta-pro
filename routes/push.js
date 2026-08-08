// =============================================================================
// FICHIER : routes/push.js
// =============================================================================
const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// Publique (nécessaire avant même la souscription, pour connaître la clé publique)
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Protégées
router.post('/subscribe',   protect, checkCompanyAccess, pushController.subscribe);
router.post('/unsubscribe', protect, pushController.unsubscribe);

module.exports = router;
