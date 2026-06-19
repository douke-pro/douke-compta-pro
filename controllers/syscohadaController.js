// =============================================================================
// FICHIER : routes/syscohada.js
// Description : Routes pour les états financiers SYSCOHADA Révisé
//               Bilan — Compte de Résultat — TFT — États complets
// Version : V1.0
// =============================================================================

'use strict';

const express            = require('express');
const router             = express.Router();
const syscohadaController = require('../controllers/syscohadaController');
const { protect, checkCompanyAccess } = require('../middleware/auth');

// Alias de compatibilité si le middleware s'appelle authenticateToken dans ton projet
const auth = protect || require('../middleware/auth').authenticateToken;

/**
 * GET /api/syscohada/bilan
 * Bilan SYSCOHADA Révisé — Actif (AD→BZ) + Passif (CA→DZ)
 * Query : companyId, date_from, date_to, fiscal_year
 * Permissions : USER, COLLABORATEUR, ADMIN
 */
router.get(
    '/bilan',
    auth,
    checkCompanyAccess,
    syscohadaController.getBilan
);

/**
 * GET /api/syscohada/compte-resultat
 * Compte de Résultat SYSCOHADA Révisé — TA→XI
 * Query : companyId, date_from, date_to, fiscal_year
 * Permissions : USER, COLLABORATEUR, ADMIN
 */
router.get(
    '/compte-resultat',
    auth,
    checkCompanyAccess,
    syscohadaController.getCompteResultat
);

/**
 * GET /api/syscohada/tft
 * Tableau des Flux de Trésorerie SYSCOHADA — ZA→ZH
 * Query : companyId, date_from, date_to, fiscal_year
 * Permissions : USER, COLLABORATEUR, ADMIN
 */
router.get(
    '/tft',
    auth,
    checkCompanyAccess,
    syscohadaController.getTFT
);

/**
 * GET /api/syscohada/etats-complets
 * Tous les états en un seul appel (pour génération PDF groupée)
 * Query : companyId, date_from, date_to, fiscal_year
 * Permissions : COLLABORATEUR, ADMIN
 */
router.get(
    '/etats-complets',
    auth,
    checkCompanyAccess,
    syscohadaController.getEtatsComplets
);

module.exports = router;
