// ============================================
// ROUTES : Rapports Financiers
// Description : Gestion des états financiers
// ============================================

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, checkRole } = require('../middleware/auth');

// ============================================
// ROUTES USER
// ============================================

/**
 * POST /api/reports/request
 * Créer une demande d'états financiers
 * Permissions : USER, CAISSIER, COLLABORATEUR, ADMIN
 */
router.post(
    '/request',
    authenticateToken,
    checkRole(['user', 'caissier', 'collaborateur', 'admin']),
    reportsController.createRequest
);

/**
 * GET /api/reports/my-requests
 * Historique des demandes de l'utilisateur connecté
 * Permissions : USER, CAISSIER, COLLABORATEUR, ADMIN
 */
router.get(
    '/my-requests',
    authenticateToken,
    checkRole(['user', 'caissier', 'collaborateur', 'admin']),
    reportsController.getMyRequests
);

/**
 * GET /api/reports/:id
 * Détails d'une demande spécifique
 * Permissions : USER (propriétaire), COLLABORATEUR, ADMIN
 */
router.get(
    '/:id',
    authenticateToken,
    checkRole(['user', 'caissier', 'collaborateur', 'admin']),
    reportsController.getRequestDetails
);

/**
 * DELETE /api/reports/:id/cancel
 * Annuler une demande (seulement si status = pending)
 * Permissions : USER (propriétaire), ADMIN
 */
router.delete(
    '/:id/cancel',
    authenticateToken,
    checkRole(['user', 'admin']),
    reportsController.cancelRequest
);

// ============================================
// ROUTES COLLABORATEUR/ADMIN
// ============================================

/**
 * GET /api/reports/pending
 * Liste des demandes en attente de traitement
 * Permissions : COLLABORATEUR, ADMIN
 */
router.get(
    '/pending',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.getPendingRequests
);

/**
 * GET /api/reports/all
 * Toutes les demandes (avec filtres)
 * Permissions : COLLABORATEUR, ADMIN
 */
router.get(
    '/all',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.getAllRequests
);

/**
 * POST /api/reports/:id/generate
 * Générer les rapports depuis Odoo
 * Permissions : COLLABORATEUR, ADMIN
 */
router.post(
    '/:id/generate',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.generateReports
);

/**
 * 🔧 NOUVEAU : GET /api/reports/:id/preview
 * Aperçu des données extraites pour édition
 * Permet au collaborateur/admin de voir les données avant modification
 * Permissions : COLLABORATEUR, ADMIN
 */
router.get(
    '/:id/preview',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.previewReportData
);

/**
 * 🔧 NOUVEAU : POST /api/reports/:id/regenerate
 * Sauvegarder les données éditées et régénérer les PDFs
 * Body : { edited_data: { actif: {...}, passif: {...}, charges: {...}, produits: {...} } }
 * Permissions : COLLABORATEUR, ADMIN
 */
router.post(
    '/:id/regenerate',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.regenerateReportsWithEdits
);

/**
 * PATCH /api/reports/:id/validate
 * Valider les rapports générés
 * Permissions : COLLABORATEUR, ADMIN
 */
router.patch(
    '/:id/validate',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.validateReports
);

/**
 * POST /api/reports/:id/send
 * Envoyer les rapports au user
 * Permissions : COLLABORATEUR, ADMIN
 */
router.post(
    '/:id/send',
    authenticateToken,
    checkRole(['collaborateur', 'admin']),
    reportsController.sendReportsToUser
);

/**
 * GET /api/reports/:id/download/:fileType
 * Télécharger un fichier PDF spécifique
 * Permissions : USER (propriétaire), COLLABORATEUR, ADMIN
 * fileType : bilan, compte_resultat, tft, annexes
 */
router.get(
    '/:id/download/:fileType',
    authenticateToken,
    checkRole(['user', 'caissier', 'collaborateur', 'admin']),
    reportsController.downloadPDF
);

// ============================================
// ROUTES STATISTIQUES/DASHBOARD
// ============================================

/**
 * GET /api/reports/stats/summary
 * Statistiques globales des rapports
 * Permissions : ADMIN
 */
router.get(
    '/stats/summary',
    authenticateToken,
    checkRole(['admin']),
    reportsController.getReportsStats
);

module.exports = router;
