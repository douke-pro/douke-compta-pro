'use strict';

const express       = require('express');
const router        = express.Router();
const hrCtrl        = require('../controllers/hrController');
const gedCtrl       = require('../controllers/gedController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// =============================================================================
// MIDDLEWARE RBAC — Matrice d'accès validée
// ADMIN        : accès total
// COLLABORATEUR: tout sauf supprimer employé
// USER         : lecture + création employé + GED complète
// CAISSIER     : zéro accès (non listé = bloqué par checkRole implicite)
// =============================================================================

const allowAll     = (req, res, next) => {
    const role = (req.user?.profile || req.user?.role || '').toUpperCase();
    if (['ADMIN','COLLABORATEUR','USER'].includes(role)) return next();
    return res.status(403).json({ status: 'error', error: 'Accès refusé au module RH.' });
};

const allowEditOnly = (req, res, next) => {
    const role = (req.user?.profile || req.user?.role || '').toUpperCase();
    if (['ADMIN','COLLABORATEUR'].includes(role)) return next();
    return res.status(403).json({ status: 'error', error: 'Modification réservée à ADMIN et COLLABORATEUR.' });
};

const adminOnly = (req, res, next) => {
    const role = (req.user?.profile || req.user?.role || '').toUpperCase();
    if (role === 'ADMIN') return next();
    return res.status(403).json({ status: 'error', error: 'Action réservée à l\'administrateur.' });
};

// =============================================================================
// ROUTES EMPLOYÉS
// =============================================================================

// Lecture — ADMIN, COLLABORATEUR, USER
router.get ('/employees',     protect, checkCompanyAccess, allowAll,      hrCtrl.listEmployees);
router.get ('/employees/:id', protect, checkCompanyAccess, allowAll,      hrCtrl.getEmployee);

// Création — ADMIN, COLLABORATEUR, USER
router.post('/employees',     protect, checkCompanyAccess, allowAll,      hrCtrl.createEmployee);

// Modification — ADMIN, COLLABORATEUR
router.put ('/employees/:id', protect, checkCompanyAccess, allowEditOnly, hrCtrl.updateEmployee);

// Suppression (archive) — ADMIN uniquement
router.delete('/employees/:id', protect, checkCompanyAccess, adminOnly,   hrCtrl.deleteEmployee);

// =============================================================================
// ROUTES FICHES DE PAIE
// =============================================================================

// Lecture + téléchargement — ADMIN, COLLABORATEUR, USER
router.get('/payslips',              protect, checkCompanyAccess, allowAll,      hrCtrl.listPayslips);
router.get('/payslips/:id',          protect, checkCompanyAccess, allowAll,      hrCtrl.getPayslip);
router.get('/payslips/:id/download', protect, checkCompanyAccess, allowAll,      hrCtrl.downloadPayslip);

// Création — ADMIN, COLLABORATEUR
router.post('/payslips',             protect, checkCompanyAccess, allowEditOnly, hrCtrl.createPayslip);
router.put('/payslips/:id',           protect, checkCompanyAccess, allowEditOnly, hrCtrl.updatePayslip);
router.delete('/payslips/:id',        protect, checkCompanyAccess, allowEditOnly, hrCtrl.deletePayslip);

// =============================================================================
// ROUTES MODÈLES DE DOCUMENTS (contrat, fiche de paie)
// =============================================================================

// Lecture — ADMIN, COLLABORATEUR
router.get ('/templates',  protect, checkCompanyAccess, allowEditOnly, hrCtrl.listTemplates);

// Création/Mise à jour — ADMIN, COLLABORATEUR
router.post('/templates',  protect, checkCompanyAccess, allowEditOnly, hrCtrl.saveTemplate);

// =============================================================================
// ROUTES GED (Documents entreprise)
// =============================================================================

// Lecture — ADMIN, COLLABORATEUR, USER
router.get('/documents',                protect, checkCompanyAccess, allowAll, gedCtrl.listDocuments);
router.get('/documents/:id/preview',    protect, checkCompanyAccess, allowAll, gedCtrl.previewDocument);

// Upload — ADMIN, COLLABORATEUR, USER
router.post('/documents/upload',        protect, checkCompanyAccess, allowAll, gedCtrl.uploadDocument);

// Téléchargement — ADMIN, COLLABORATEUR, USER
router.get('/documents/:id/download',   protect, checkCompanyAccess, allowAll, gedCtrl.downloadDocument);

// Suppression — ADMIN, COLLABORATEUR, USER
router.delete('/documents/:id',         protect, checkCompanyAccess, allowAll, gedCtrl.deleteDocument);

module.exports = router;
