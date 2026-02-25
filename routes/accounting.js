// =============================================================================
// FICHIER : routes/accounting.js (VERSION V16 - ODOO 19 COMPATIBLE)
// Description : Routes pour la gestion comptable SYSCOHADA
// ✅ CORRECTION : Route /accounts utilise le contexte Odoo 19
// Date : 2026-02-25
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess, checkWritePermission, authenticateToken } = require('../middleware/auth');
const accountingController = require('../controllers/accountingController');

// =============================================================================
// ROUTES DE CONFIGURATION
// =============================================================================

/**
 * Configuration fiscale (période de l'exercice)
 * GET /api/accounting/fiscal-config?companyId=X
 */
router.get('/fiscal-config', protect, checkCompanyAccess, accountingController.getFiscalConfig);

// =============================================================================
// ROUTES DE LECTURE (DASHBOARD ET RAPPORTS)
// =============================================================================

/**
 * Tableau de bord (KPIs)
 * GET /api/accounting/dashboard?companyId=X
 * GET /api/accounting/dashboard/kpis?companyId=X
 */
router.get('/dashboard', protect, checkCompanyAccess, accountingController.getDashboardData);
router.get('/dashboard/kpis', protect, checkCompanyAccess, accountingController.getDashboardData);

/**
 * Rapport financier par centre analytique
 * GET /api/accounting/report/:analyticId?companyId=X&systemType=NORMAL
 */
router.get('/report/:analyticId', protect, checkCompanyAccess, accountingController.getFinancialReport);

/**
 * 🔑 BALANCE SYSCOHADA 6 COLONNES
 * GET /api/accounting/trial-balance-syscohada?companyId=X&date_from=Y&date_to=Z
 * OU
 * GET /api/accounting/syscohada-trial-balance?companyId=X&date_from=Y&date_to=Z
 * 
 * Les deux routes pointent vers la même fonction pour compatibilité frontend/backend
 */
router.get('/trial-balance-syscohada', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);
router.get('/syscohada-trial-balance', protect, checkCompanyAccess, accountingController.getSyscohadaTrialBalance);

/**
 * Grand Livre
 * GET /api/accounting/general-ledger?companyId=X&date_from=Y&date_to=Z&journal_ids=1,2,3
 */
router.get('/general-ledger', protect, checkCompanyAccess, accountingController.getGeneralLedger);

/**
 * Bilan SYSCOHADA
 * GET /api/accounting/balance-sheet?companyId=X&date=Y
 */
router.get('/balance-sheet', protect, checkCompanyAccess, accountingController.getBalanceSheet);

/**
 * Liste des journaux
 * GET /api/accounting/journals?companyId=X
 */
router.get('/journals', protect, checkCompanyAccess, accountingController.getJournals);

/**
 * Journal des écritures (Liste des mouvements)
 * GET /api/accounting/journal?companyId=X&journal_id=Y&date_from=Z&date_to=W
 */
router.get('/journal', protect, checkCompanyAccess, accountingController.getJournalEntries);

/**
 * Détails d'une écriture spécifique
 * GET /api/accounting/entry/:id?companyId=X
 */
router.get('/entry/:id', protect, checkCompanyAccess, accountingController.getEntryDetails);

/**
 * Plan comptable SYSCOHADA
 * GET /api/accounting/chart-of-accounts?companyId=X
 */
router.get('/chart-of-accounts', protect, checkCompanyAccess, accountingController.getChartOfAccounts);

// =============================================================================
// ROUTES D'ÉCRITURE (CRÉATION/MODIFICATION)
// =============================================================================

/**
 * Créer une écriture comptable
 * POST /api/accounting/move/create
 */
router.post('/move/create', protect, checkCompanyAccess, checkWritePermission, accountingController.createJournalEntry);

/**
 * Opération de caisse (recette/dépense)
 * POST /api/accounting/caisse-entry
 */
router.post('/caisse-entry', protect, checkCompanyAccess, checkWritePermission, accountingController.handleCaisseEntry);

/**
 * Créer un compte
 * POST /api/accounting/chart-of-accounts
 */
router.post('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.createAccount);

/**
 * Modifier un compte
 * PUT /api/accounting/chart-of-accounts
 */
router.put('/chart-of-accounts', protect, checkCompanyAccess, checkWritePermission, accountingController.updateAccount);

// =============================================================================
// ✅ ROUTE CORRIGÉE POUR ODOO 19
// =============================================================================

/**
 * GET /api/accounting/accounts
 * Récupérer les comptes pour une entreprise
 * ✅ CORRIGÉ : Utilise le contexte allowed_company_ids au lieu de company_id dans le domaine
 */
router.get('/accounts', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.currentCompanyId || 
                         req.user.companyId || 
                         parseInt(req.query.companyId);
        
        if (!companyId) {
            console.error('❌ [getAccounts] Company ID manquant');
            return res.status(400).json({
                status: 'error',
                error: 'Company ID manquant'
            });
        }

        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

        console.log('🔍 [getAccounts] Récupération comptes pour company:', companyId);

        // ✅ MÉTHODE ODOO 19 : Utiliser le contexte au lieu du domaine
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[]],  // ✅ Domaine vide - Odoo filtre via le contexte
            kwargs: {
                fields: ['id', 'code', 'name', 'account_type'],
                order: 'code ASC',
                limit: 2000,
                context: {
                    allowed_company_ids: [companyId]  // ✅ Filtrage par contexte
                }
            }
        });

        console.log(`✅ [getAccounts] ${accounts.length} comptes récupérés pour company ${companyId}`);

        res.json({
            status: 'success',
            data: accounts
        });

    } catch (error) {
        console.error('🚨 [getAccounts] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            error: 'Erreur récupération comptes',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
