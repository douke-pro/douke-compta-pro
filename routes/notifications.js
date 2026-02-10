const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

/**
 * GET /api/notifications?companyId=X
 * Récupère les notifications de l'entreprise
 */
router.get(
    '/',
    protect,
    checkCompanyAccess,
    notificationsController.getNotifications
);

/**
 * POST /api/notifications/send
 * Envoie une notification à des utilisateurs
 */
router.post(
    '/send',
    protect,
    checkCompanyAccess,
    notificationsController.sendNotification
);

/**
 * PATCH /api/notifications/:id/read
 * Marque une notification comme lue
 */
router.patch(
    '/:id/read',
    protect,
    notificationsController.markAsRead
);

/**
 * DELETE /api/notifications/:id
 * Supprime une notification
 */
router.delete(
    '/:id',
    protect,
    notificationsController.deleteNotification
);

module.exports = router;
