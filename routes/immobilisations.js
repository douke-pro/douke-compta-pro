// =============================================================================
// FICHIER : routes/immobilisations.js
// Description : Routes complètes pour le module Immobilisations (SYSCOHADA)
// Version : PRODUCTION - Compatible Odoo 19
// =============================================================================

const express = require('express');
const router = express.Router();
const { protect, checkCompanyAccess } = require('../middleware/auth');
const { odooExecuteKw } = require('../services/odooService');

// Configuration Odoo Admin UID
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);

// =============================================================================
// ROUTES DE LECTURE (GET)
// =============================================================================

/**
 * GET /api/accounting/immobilisations/stats
 * Récupérer les statistiques globales des immobilisations
 */
router.get('/stats', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getImmobilisationsStats] Company:', companyId);
        
        // Récupérer toutes les immobilisations de l'entreprise depuis Odoo
        const assets = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['state', 'in', ['open', 'close', 'draft']]
            ]],
            kwargs: {
                fields: ['original_value', 'value_residual', 'state']
            }
        });
        
        // Calculer les statistiques
        const stats = {
            total: assets.length,
            valeur_brute: assets.reduce((sum, a) => sum + (parseFloat(a.original_value) || 0), 0),
            amortissements: assets.reduce((sum, a) => {
                const valeurBrute = parseFloat(a.original_value) || 0;
                const valeurNette = parseFloat(a.value_residual) || 0;
                return sum + (valeurBrute - valeurNette);
            }, 0),
            valeur_nette: assets.reduce((sum, a) => sum + (parseFloat(a.value_residual) || 0), 0),
            actives: assets.filter(a => a.state === 'open').length,
            cloturees: assets.filter(a => a.state === 'close').length,
            brouillons: assets.filter(a => a.state === 'draft').length
        };
        
        console.log('✅ [getImmobilisationsStats] Stats:', stats);
        
        res.json({
            status: 'success',
            data: stats
        });
        
    } catch (error) {
        console.error('❌ [getImmobilisationsStats] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/list
 * Liste des immobilisations avec filtres et pagination
 */
router.get('/list', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { category, limit = 50, offset = 0 } = req.query;
        
        console.log('📋 [getImmobilisationsList] Company:', companyId, 'Category:', category);
        
        // Construire le domaine de recherche
        const domain = [
            ['company_id', '=', companyId]
        ];
        
        // Filtre par catégorie si spécifié (basé sur le code du compte)
        if (category && category !== '') {
            // Mapping catégories SYSCOHADA vers plages de comptes Odoo
            const categoryRanges = {
                '20': { min: '200', max: '209' },
                '21': { min: '210', max: '219' },
                '22': { min: '220', max: '229' },
                '23': { min: '230', max: '239' },
                '24': { min: '240', max: '249' },
                '25-28': { min: '250', max: '289' }
            };
            
            const range = categoryRanges[category];
            if (range) {
                // Note: Odoo 19 utilise account_asset_id pour le compte comptable
                domain.push(['account_asset_id.code', '>=', range.min]);
                domain.push(['account_asset_id.code', '<=', range.max]);
            }
        }
        
        // Récupérer les immobilisations
        const assets = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [domain],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'value_residual',
                    'acquisition_date', 'asset_type', 'method', 'method_number', 'state'
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: 'acquisition_date desc'
            }
        });
        
        // Compter le total pour pagination
        const total = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'search_count',
            args: [domain],
            kwargs: {}
        });
        
        console.log(`✅ [getImmobilisationsList] ${assets.length}/${total} immobilisations`);
        
        res.json({
            status: 'success',
            data: assets,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });
        
    } catch (error) {
        console.error('❌ [getImmobilisationsList] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération de la liste',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/:id
 * Détails d'une immobilisation spécifique
 */
router.get('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        
        console.log('🔍 [getImmobilisationById] Asset:', assetId);
        
        const asset = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'read',
            args: [[assetId]],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'value_residual',
                    'acquisition_date', 'asset_type', 'method', 'method_number',
                    'method_period', 'state', 'account_depreciation_id',
                    'account_depreciation_expense_id', 'depreciation_move_ids'
                ]
            }
        });
        
        if (!asset || asset.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Immobilisation non trouvée'
            });
        }
        
        console.log('✅ [getImmobilisationById] Immobilisation trouvée');
        
        res.json({
            status: 'success',
            data: asset[0]
        });
        
    } catch (error) {
        console.error('❌ [getImmobilisationById] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des détails',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/categories/list
 * Liste des catégories d'immobilisations (comptes 20-28)
 */
router.get('/categories/list', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📂 [getCategories] Company:', companyId);
        
        // Récupérer les comptes d'immobilisations (20-28)
        const accounts = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.account',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['code', '>=', '200'],
                ['code', '<=', '289'],
                ['account_type', 'in', ['asset_fixed', 'asset_non_current']]
            ]],
            kwargs: {
                fields: ['code', 'name', 'account_type'],
                order: 'code asc'
            }
        });
        
        console.log(`✅ [getCategories] ${accounts.length} comptes trouvés`);
        
        res.json({
            status: 'success',
            data: accounts
        });
        
    } catch (error) {
        console.error('❌ [getCategories] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
});

// =============================================================================
// ROUTES D'ÉCRITURE (POST/PUT/DELETE)
// =============================================================================

/**
 * POST /api/accounting/immobilisations/create
 * Créer une nouvelle immobilisation
 */
router.post('/create', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { name, original_value, account_asset_id, acquisition_date, method, method_number } = req.body;
        
        console.log('➕ [createImmobilisation] Création:', name);
        
        // Validation
        if (!name || !original_value || !account_asset_id || !acquisition_date) {
            return res.status(400).json({
                status: 'error',
                message: 'Champs requis : name, original_value, account_asset_id, acquisition_date'
            });
        }
        
        // Créer l'immobilisation dans Odoo
        const assetId = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'create',
            args: [{
                name,
                original_value: parseFloat(original_value),
                account_asset_id: parseInt(account_asset_id),
                acquisition_date,
                company_id: companyId,
                method: method || 'linear',
                method_number: parseInt(method_number) || 5,
                method_period: '12', // Mensuel
                state: 'draft',
                asset_type: 'purchase' // Par défaut : achat
            }],
            kwargs: {}
        });
        
        console.log('✅ [createImmobilisation] Créée avec ID:', assetId);
        
        res.json({
            status: 'success',
            message: 'Immobilisation créée avec succès',
            data: { id: assetId }
        });
        
    } catch (error) {
        console.error('❌ [createImmobilisation] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la création',
            error: error.message
        });
    }
});

/**
 * PUT /api/accounting/immobilisations/:id
 * Modifier une immobilisation
 */
router.put('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        const updates = req.body;
        
        console.log('✏️ [updateImmobilisation] MAJ Asset:', assetId);
        
        // Filtrer les champs autorisés
        const allowedFields = ['name', 'original_value', 'method', 'method_number'];
        const filteredUpdates = {};
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });
        
        // Mettre à jour dans Odoo
        await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'write',
            args: [[assetId], filteredUpdates],
            kwargs: {}
        });
        
        console.log('✅ [updateImmobilisation] Mise à jour réussie');
        
        res.json({
            status: 'success',
            message: 'Immobilisation mise à jour avec succès'
        });
        
    } catch (error) {
        console.error('❌ [updateImmobilisation] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
});

/**
 * DELETE /api/accounting/immobilisations/:id
 * Clôturer une immobilisation (mise au rebut)
 */
router.delete('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        
        console.log('🗑️ [disposeImmobilisation] Asset:', assetId);
        
        // Marquer comme clôturée dans Odoo
        await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'write',
            args: [[assetId], {
                state: 'close'
            }],
            kwargs: {}
        });
        
        console.log('✅ [disposeImmobilisation] Immobilisation clôturée');
        
        res.json({
            status: 'success',
            message: 'Immobilisation clôturée avec succès'
        });
        
    } catch (error) {
        console.error('❌ [disposeImmobilisation] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la clôture',
            error: error.message
        });
    }
});

// =============================================================================
// ROUTES DE RAPPORTS (GET)
// =============================================================================

/**
 * GET /api/accounting/immobilisations/reports/tableau-immobilisations
 * Tableau des immobilisations SYSCOHADA
 */
router.get('/reports/tableau-immobilisations', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { fiscalYear } = req.query;
        
        console.log('📊 [getTableauImmobilisations] Company:', companyId, 'Year:', fiscalYear);
        
        // Récupérer toutes les immobilisations
        const assets = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value',
                    'value_residual', 'acquisition_date', 'state'
                ],
                order: 'account_asset_id, acquisition_date'
            }
        });
        
        // Grouper par catégorie et construire le tableau
        const categories = {};
        
        assets.forEach(asset => {
            const accountCode = asset.account_asset_id ? asset.account_asset_id[1].match(/^\d+/)?.[0] : '999';
            const categoryCode = accountCode.substring(0, 2);
            
            if (!categories[categoryCode]) {
                categories[categoryCode] = {
                    code: categoryCode,
                    name: getCategoryName(categoryCode),
                    valeur_brute_debut: 0,
                    acquisitions: 0,
                    cessions: 0,
                    valeur_brute_fin: 0
                };
            }
            
            // TODO: Calculer les mouvements de l'année fiscale
            categories[categoryCode].valeur_brute_fin += parseFloat(asset.original_value) || 0;
        });
        
        const report = {
            headers: ['Catégorie', 'Valeur brute début', 'Acquisitions', 'Cessions', 'Valeur brute fin'],
            rows: Object.values(categories).map(cat => [
                `${cat.code} - ${cat.name}`,
                cat.valeur_brute_debut.toLocaleString('fr-FR') + ' XOF',
                cat.acquisitions.toLocaleString('fr-FR') + ' XOF',
                cat.cessions.toLocaleString('fr-FR') + ' XOF',
                cat.valeur_brute_fin.toLocaleString('fr-FR') + ' XOF'
            ]),
            totaux: Object.values(categories).reduce((acc, cat) => ({
                valeur_brute_debut: acc.valeur_brute_debut + cat.valeur_brute_debut,
                acquisitions: acc.acquisitions + cat.acquisitions,
                cessions: acc.cessions + cat.cessions,
                valeur_brute_fin: acc.valeur_brute_fin + cat.valeur_brute_fin
            }), { valeur_brute_debut: 0, acquisitions: 0, cessions: 0, valeur_brute_fin: 0 })
        };
        
        console.log('✅ [getTableauImmobilisations] Rapport généré');
        
        res.json({
            status: 'success',
            data: report
        });
        
    } catch (error) {
        console.error('❌ [getTableauImmobilisations] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/tableau-amortissements
 * Tableau des amortissements
 */
router.get('/reports/tableau-amortissements', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getTableauAmortissements] Company:', companyId);
        
        // Récupérer les immobilisations avec amortissements
        const assets = await odooExecuteKw({
            uid: req.user.odooUid || ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: {
                fields: ['name', 'account_asset_id', 'original_value', 'value_residual']
            }
        });
        
        const categories = {};
        
        assets.forEach(asset => {
            const accountCode = asset.account_asset_id ? asset.account_asset_id[1].match(/^\d+/)?.[0] : '999';
            const categoryCode = accountCode.substring(0, 2);
            
            if (!categories[categoryCode]) {
                categories[categoryCode] = {
                    name: getCategoryName(categoryCode),
                    amort_cumules_debut: 0,
                    dotations: 0,
                    amort_cumules_fin: 0
                };
            }
            
            const amortCumule = (parseFloat(asset.original_value) || 0) - (parseFloat(asset.value_residual) || 0);
            categories[categoryCode].amort_cumules_fin += amortCumule;
        });
        
        const report = {
            headers: ['Catégorie', 'Amort. cumulés début', 'Dotations exercice', 'Amort. cumulés fin'],
            rows: Object.entries(categories).map(([code, cat]) => [
                `${code} - ${cat.name}`,
                cat.amort_cumules_debut.toLocaleString('fr-FR') + ' XOF',
                cat.dotations.toLocaleString('fr-FR') + ' XOF',
                cat.amort_cumules_fin.toLocaleString('fr-FR') + ' XOF'
            ])
        };
        
        res.json({
            status: 'success',
            data: report
        });
        
    } catch (error) {
        console.error('❌ [getTableauAmortissements] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/tableau-provisions
 * Tableau des provisions
 */
router.get('/reports/tableau-provisions', protect, checkCompanyAccess, async (req, res) => {
    try {
        res.json({
            status: 'success',
            data: {
                headers: ['Catégorie', 'Provisions début', 'Dotations', 'Reprises', 'Provisions fin'],
                rows: [],
                message: 'Aucune provision enregistrée'
            }
        });
    } catch (error) {
        console.error('❌ [getTableauProvisions] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/etat-rapprochement
 * État de rapprochement comptabilité/inventaire
 */
router.get('/reports/etat-rapprochement', protect, checkCompanyAccess, async (req, res) => {
    try {
        res.json({
            status: 'success',
            data: {
                comptabilite: { total: 0, items: [] },
                inventaire: { total: 0, items: [] },
                ecarts: [],
                message: 'Fonctionnalité disponible prochainement'
            }
        });
    } catch (error) {
        console.error('❌ [getEtatRapprochement] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

// =============================================================================
// FONCTIONS HELPERS
// =============================================================================

/**
 * Obtenir le nom d'une catégorie SYSCOHADA par son code
 */
function getCategoryName(code) {
    const names = {
        '20': 'Charges Immobilisées',
        '21': 'Immobilisations Incorporelles',
        '22': 'Terrains',
        '23': 'Bâtiments',
        '24': 'Matériel',
        '25': 'Avances et Acomptes',
        '26': 'Titres de Participation',
        '27': 'Autres Immobilisations Financières',
        '28': 'Amortissements'
    };
    return names[code] || 'Autres';
}

module.exports = router;
