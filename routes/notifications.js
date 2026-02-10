const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', protect, checkCompanyAccess, notificationsController.getNotifications);
router.post('/send', protect, checkCompanyAccess, notificationsController.sendNotification);
router.patch('/:id/read', protect, notificationsController.markAsRead);
router.delete('/:id', protect, notificationsController.deleteNotification);
router.patch('/:id/read', authenticateToken, notificationsController.markNotificationAsRead);

module.exports = router;
