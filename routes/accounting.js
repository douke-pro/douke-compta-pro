const express = require('express');
const router = express.Router();
// 💡 IMPORTANT : On importe maintenant checkWritePermission
const { protect, checkWritePermission } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController'); // Assurez-vous que ce fichier existe

// -------------------------------------------------------------
// ROUTES DE LECTURE (Nécessite uniquement 'protect')
// -------------------------------------------------------------

// 1. CORRECTION: Route pour obtenir les données du tableau de bord et les KPIs (GET /api/accounting/dashboard/kpis?companyId=X)
router.get('/dashboard/kpis', protect, accountingController.getDashboardData);

// 2. Route pour obtenir le rapport SYSCOHADA (Bilan/Résultat) (GET /api/accounting/report/123?companyId=X)
router.get('/report/:analyticId', protect, accountingController.getFinancialReport);

// 3. NOUVELLE ROUTE : Route de Drill-Down pour les détails d'une écriture (GET /api/accounting/details/123?companyId=X)
router.get('/details/:entryId', protect, accountingController.getEntryDetails);

// 4. Lecture du Plan Comptable (Ouvert aux rôles avec droit de vue)
// GET /api/accounting/chart-of-accounts?companyId=X
router.get('/chart-of-accounts', protect, accountingController.getChartOfAccounts); 

// 5. Lecture du Grand Livre (Ledger)
// GET /api/accounting/ledger?companyId=X
router.get('/ledger', protect, accountingController.getGeneralLedger);


// 🔑 NOUVEL AJOUT CRITIQUE : Lecture de la Balance de Vérification (6 colonnes)
// La fonction getSyscohadaTrialBalance est désormais disponible dans le contrôleur.
// GET /api/accounting/trial-balance?companyId=X&date_from=Y&date_to=Z
router.get('/trial-balance', protect, accountingController.getSyscohadaTrialBalance);


// 7. Lecture de la Balance Générale (Stubs)
// La Balance Générale est souvent un autre rapport que la Balance de Vérification.
// GET /api/accounting/balance?companyId=X
router.get('/balance', protect, accountingController.getBalanceSheet);

// 8. Lecture des Journaux (Stubs)
// GET /api/accounting/journals?companyId=X
router.get('/journals', protect, accountingController.getJournals);

// -------------------------------------------------------------
// ROUTES DE MODIFICATION (Nécessite 'protect' ET 'checkWritePermission')
// -------------------------------------------------------------

// 9. NOUVELLE ROUTE : Enregistrement d'une opération de caisse simplifiée (POST /api/accounting/caisse-entry)
router.post('/caisse-entry', protect, checkWritePermission, accountingController.handleCaisseEntry);

// 10. Création d'un compte
// POST /api/accounting/chart-of-accounts
router.post('/chart-of-accounts', protect, checkWritePermission, accountingController.createAccount);

// 11. Modification d'un compte
// PUT /api/accounting/chart-of-accounts
router.put('/chart-of-accounts', protect, checkWritePermission, accountingController.updateAccount);

// 12. NOUVELLE ROUTE CRITIQUE : Création et Validation d'une Écriture Comptable (Journal Entry)
// POST /api/accounting/move
router.post('/move', protect, checkWritePermission, accountingController.createJournalEntry);

module.exports = router;
