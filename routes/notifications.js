router.post(
    '/send',
    protect,
    checkCompanyAccess,
    restrictTo('ADMIN', 'COLLABORATEUR'), // Middleware de restriction
    notificationsController.sendNotification
);

const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.get('/', protect, checkCompanyAccess, notificationsController.getNotifications);
router.post('/send', protect, checkCompanyAccess, notificationsController.sendNotification);
router.patch('/:id/read', protect, notificationsController.markAsRead);
router.delete('/:id', protect, notificationsController.deleteNotification);

module.exports = router;
