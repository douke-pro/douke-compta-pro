const express = require('express');
const router = express.Router();
// 💡 IMPORTANT : On importe maintenant checkWritePermission
const { protect, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController'); // Assurez-vous que ce fichier existe

// -------------------------------------------------------------
// ROUTES DE LECTURE (Nécessite uniquement 'protect')
// -------------------------------------------------------------

// 1. CORRECTION: Route pour obtenir les données du tableau de bord et les KPIs (GET /api/accounting/dashboard/kpis?companyId=X)
// Le Front-End V9/V10 appelle '/dashboard/kpis', nous adaptons le Backend.
router.get('/dashboard/kpis', protect, accountingController.getDashboardData);

// 2. Route pour obtenir le rapport SYSCOHADA (GET /api/accounting/report/bilan?companyId=X)
// Votre définition actuelle est correcte après la correction Front-End du singulier 'report'.
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);

// 3. NOUVELLE ROUTE : Route de Drill-Down pour les détails d'une écriture (GET /api/accounting/details/123?companyId=X)
router.get('/details/:entryId', protect, accountingController.getEntryDetails);

// 4. Lecture du Plan Comptable (Ouvert aux rôles avec droit de vue)
// GET /api/accounting/chart-of-accounts?companyId=X
router.get('/chart-of-accounts', protect, accountingController.getChartOfAccounts); 


// -------------------------------------------------------------
// ROUTES DE MODIFICATION (Nécessite 'protect' ET 'checkWritePermission')
// -------------------------------------------------------------

// 5. NOUVELLE ROUTE : Enregistrement d'une opération de caisse simplifiée (POST /api/accounting/caisse-entry)
router.post('/caisse-entry', protect, checkWritePermission, accountingController.handleCaisseEntry);

// 6. Création d'un compte
// POST /api/accounting/chart-of-accounts
router.post('/chart-of-accounts', protect, checkWritePermission, accountingController.createAccount);

// 7. Modification d'un compte
// PUT /api/accounting/chart-of-accounts
router.put('/chart-of-accounts', protect, checkWritePermission, accountingController.updateAccount);

module.exports = router;
