router.post(
    '/send',
    protect,
    checkCompanyAccess,
    restrictTo('ADMIN', 'COLLABORATEUR'), // Middleware de restriction
    notificationsController.sendNotification
);
