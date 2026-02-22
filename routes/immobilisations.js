// =============================================================================
// FICHIER : routes/immobilisations.js
// Description : Routes pour le module Immobilisations (SYSCOHADA)
// Version : PRODUCTION - ADMIN_UID forcé (fix Access Denied pour USER)
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
 */
router.get('/stats', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getImmobilisationsStats] Company:', companyId);
        
        // ✅ ADMIN_UID forcé - Les USER n'ont pas accès direct à account.asset
        const assets = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['state', 'in', ['open', 'close', 'draft', 'paused']]
            ]],
            kwargs: {
                fields: ['original_value', 'book_value', 'state']
            }
        });
        
        const stats = {
            total: assets.length,
            valeur_brute: assets.reduce((sum, a) => sum + (parseFloat(a.original_value) || 0), 0),
            amortissements: assets.reduce((sum, a) => {
                const valeurBrute = parseFloat(a.original_value) || 0;
                const valeurNette = parseFloat(a.book_value) || 0;
                return sum + (valeurBrute - valeurNette);
            }, 0),
            valeur_nette: assets.reduce((sum, a) => sum + (parseFloat(a.book_value) || 0), 0),
            actives: assets.filter(a => a.state === 'open').length,
            cloturees: assets.filter(a => a.state === 'close').length,
            brouillons: assets.filter(a => a.state === 'draft').length,
            pausees: assets.filter(a => a.state === 'paused').length
        };
        
        console.log('✅ [getImmobilisationsStats] Stats:', stats);
        
        res.json({ status: 'success', data: stats });
        
    } catch (error) {
        console.error('❌ [getImmobilisationsStats] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/list
 */
router.get('/list', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { category, limit = 50, offset = 0 } = req.query;
        
        console.log('📋 [getImmobilisationsList] Company:', companyId, 'Category:', category);
        
        const domain = [['company_id', '=', companyId]];
        
        if (category && category !== '') {
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
                domain.push(['account_asset_id.code', '>=', range.min]);
                domain.push(['account_asset_id.code', '<=', range.max]);
            }
        }
        
        const assets = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [domain],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'book_value',
                    'acquisition_date', 'method', 'method_number', 'state'
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: 'acquisition_date desc'
            }
        });
        
        const total = await odooExecuteKw({
            uid: ADMIN_UID,
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
        console.error('❌ [getImmobilisationsList] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération de la liste',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/:id
 */
router.get('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        
        console.log('🔍 [getImmobilisationById] Asset:', assetId);
        
        const asset = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'read',
            args: [[assetId]],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'book_value',
                    'salvage_value', 'acquisition_date', 'first_depreciation_date',
                    'method', 'method_number', 'method_period', 'state',
                    'account_depreciation_id', 'account_depreciation_expense_id',
                    'depreciation_move_ids'
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
        
        res.json({ status: 'success', data: asset[0] });
        
    } catch (error) {
        console.error('❌ [getImmobilisationById] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des détails',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/categories/list
 */
router.get('/categories/list', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📂 [getCategories] Company:', companyId);
        
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.account',
            method: 'search_read',
            args: [[
                ['company_ids', 'in', [companyId]],
                ['code', '>=', '200'],
                ['code', '<=', '289']
            ]],
            kwargs: {
                fields: ['id', 'code', 'name'],
                order: 'code asc'
            }
        });
        
        console.log(`✅ [getCategories] ${accounts.length} comptes trouvés`);
        
        res.json({ status: 'success', data: accounts });
        
    } catch (error) {
        console.error('❌ [getCategories] Erreur:', error.message);
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
 */
router.post('/create', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { name, original_value, account_asset_id, acquisition_date, method, method_number, salvage_value } = req.body;
        
        console.log('➕ [createImmobilisation] Création:', name);
        
        if (!name || !original_value || !account_asset_id || !acquisition_date) {
            return res.status(400).json({
                status: 'error',
                message: 'Champs requis : name, original_value, account_asset_id, acquisition_date'
            });
        }
        
        const assetData = {
            name,
            original_value: parseFloat(original_value),
            account_asset_id: parseInt(account_asset_id),
            acquisition_date,
            first_depreciation_date: acquisition_date,
            company_id: companyId,
            method: method || 'linear',
            method_number: parseInt(method_number) || 5,
            method_period: 'month',
            state: 'draft'
        };
        
        if (salvage_value !== undefined) {
            assetData.salvage_value = parseFloat(salvage_value);
        }
        
        const assetId = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'create',
            args: [assetData],
            kwargs: {}
        });
        
        console.log('✅ [createImmobilisation] Créée avec ID:', assetId);
        
        res.json({
            status: 'success',
            message: 'Immobilisation créée avec succès',
            data: { id: assetId }
        });
        
    } catch (error) {
        console.error('❌ [createImmobilisation] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la création',
            error: error.message
        });
    }
});

/**
 * PUT /api/accounting/immobilisations/:id
 */
router.put('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        const updates = req.body;
        
        console.log('✏️ [updateImmobilisation] MAJ Asset:', assetId);
        
        const allowedFields = ['name', 'original_value', 'method', 'method_number', 'salvage_value'];
        const filteredUpdates = {};
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });
        
        await odooExecuteKw({
            uid: ADMIN_UID,
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
        console.error('❌ [updateImmobilisation] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
});

/**
 * DELETE /api/accounting/immobilisations/:id
 */
router.delete('/:id', protect, checkCompanyAccess, async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        
        console.log('🗑️ [disposeImmobilisation] Asset:', assetId);
        
        await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'write',
            args: [[assetId], { state: 'close' }],
            kwargs: {}
        });
        
        console.log('✅ [disposeImmobilisation] Immobilisation clôturée');
        
        res.json({
            status: 'success',
            message: 'Immobilisation clôturée avec succès'
        });
        
    } catch (error) {
        console.error('❌ [disposeImmobilisation] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la clôture',
            error: error.message
        });
    }
});

// =============================================================================
// ROUTES DE RAPPORTS
// =============================================================================

/**
 * GET /api/accounting/immobilisations/reports/tableau-immobilisations
 */
router.get('/reports/tableau-immobilisations', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getTableauImmobilisations] Company:', companyId);
        
        const assets = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: {
                fields: ['name', 'account_asset_id', 'original_value', 'book_value', 'acquisition_date', 'state'],
                order: 'account_asset_id, acquisition_date'
            }
        });
        
        const categories = {};
        
        assets.forEach(asset => {
            const accountCode = asset.account_asset_id ? asset.account_asset_id[1].match(/^\d+/)?.[0] : '999';
            const categoryCode = accountCode ? accountCode.substring(0, 2) : '99';
            
            if (!categories[categoryCode]) {
                categories[categoryCode] = {
                    code: categoryCode,
                    name: getCategoryName(categoryCode),
                    valeur_brute_fin: 0,
                    count: 0
                };
            }
            
            categories[categoryCode].valeur_brute_fin += parseFloat(asset.original_value) || 0;
            categories[categoryCode].count += 1;
        });
        
        const report = {
            headers: ['Catégorie', 'Nombre', 'Valeur brute totale'],
            rows: Object.values(categories).map(cat => [
                `${cat.code} - ${cat.name}`,
                cat.count.toString(),
                cat.valeur_brute_fin.toLocaleString('fr-FR') + ' XOF'
            ]),
            total: assets.reduce((sum, a) => sum + (parseFloat(a.original_value) || 0), 0)
        };
        
        console.log('✅ [getTableauImmobilisations] Rapport généré');
        
        res.json({ status: 'success', data: report });
        
    } catch (error) {
        console.error('❌ [getTableauImmobilisations] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/tableau-amortissements
 */
router.get('/reports/tableau-amortissements', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { fiscalYear } = req.query;
        
        console.log('📊 [getTableauAmortissements] Company:', companyId, 'Year:', fiscalYear);
        
        const assets = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['state', 'in', ['open', 'close']]
            ]],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'book_value',
                    'acquisition_date', 'method', 'method_number'
                ],
                order: 'account_asset_id, acquisition_date'
            }
        });
        
        const rows = [];
        const categories = {};
        let totaux = {
            valeur_origine: 0,
            amortissement_exercice: 0,
            cumul_amortissements: 0,
            valeur_actuelle: 0
        };
        
        assets.forEach(asset => {
            const accountCode = asset.account_asset_id ? asset.account_asset_id[1].match(/^\d+/)?.[0] : '999';
            const categoryCode = accountCode.substring(0, 2);
            
            const methodNumber = parseInt(asset.method_number) || 5;
            let tauxAmortissement = 0;
            
            if (asset.method === 'linear') {
                tauxAmortissement = (100 / methodNumber).toFixed(2);
            } else if (asset.method === 'degressive') {
                const coefficient = methodNumber <= 5 ? 2 : 2.5;
                tauxAmortissement = ((100 / methodNumber) * coefficient).toFixed(2);
            }
            
            const valeurOrigine = parseFloat(asset.original_value) || 0;
            const valeurActuelle = parseFloat(asset.book_value) || 0;
            const cumulAmortissements = valeurOrigine - valeurActuelle;
            const amortissementExercice = valeurOrigine / methodNumber;
            
            if (!categories[categoryCode]) {
                categories[categoryCode] = getCategoryName(categoryCode);
                rows.push({
                    type: 'category',
                    designation: `${categoryCode} - ${categories[categoryCode]}`,
                    isHeader: true
                });
            }
            
            rows.push({
                type: 'detail',
                designation: asset.name,
                valeur_origine: valeurOrigine,
                date_entree: asset.acquisition_date,
                taux: tauxAmortissement + '%',
                nb_annees: methodNumber + ' ans',
                amortissement_exercice: amortissementExercice,
                cumul_amortissements: cumulAmortissements,
                valeur_actuelle: valeurActuelle
            });
            
            totaux.valeur_origine += valeurOrigine;
            totaux.amortissement_exercice += amortissementExercice;
            totaux.cumul_amortissements += cumulAmortissements;
            totaux.valeur_actuelle += valeurActuelle;
        });
        
        const report = {
            headers: [
                'Désignation',
                'Valeur d\'origine',
                'Date d\'entrée',
                'Taux',
                'Nb années',
                'Amort. exercice',
                'Cumul amort.',
                'Valeur actuelle'
            ],
            rows: rows,
            totaux: totaux,
            exercice: fiscalYear || new Date().getFullYear()
        };
        
        console.log('✅ [getTableauAmortissements] Rapport généré avec', assets.length, 'immobilisations');
        
        res.json({ status: 'success', data: report });
        
    } catch (error) {
        console.error('❌ [getTableauAmortissements] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/tableau-provisions
 */
router.get('/reports/tableau-provisions', protect, checkCompanyAccess, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { fiscalYear } = req.query;
        
        console.log('📊 [getTableauProvisions] Company:', companyId, 'Year:', fiscalYear);
        
        const assets = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.asset',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['state', 'in', ['open', 'close']]
            ]],
            kwargs: {
                fields: [
                    'name', 'account_asset_id', 'original_value', 'book_value',
                    'salvage_value', 'acquisition_date', 'method_number'
                ],
                order: 'account_asset_id, acquisition_date'
            }
        });
        
        const rows = [];
        const categories = {};
        let totaux = {
            valeur_origine: 0,
            provision_exercice: 0,
            cumul_provisions: 0,
            valeur_nette: 0
        };
        
        assets.forEach(asset => {
            const accountCode = asset.account_asset_id ? asset.account_asset_id[1].match(/^\d+/)?.[0] : '999';
            const categoryCode = accountCode.substring(0, 2);
            
            const valeurOrigine = parseFloat(asset.original_value) || 0;
            const valeurActuelle = parseFloat(asset.book_value) || 0;
            const valeurResiduelle = parseFloat(asset.salvage_value) || 0;
            
            const valeurAttendue = valeurOrigine - (valeurOrigine / asset.method_number);
            const provision = valeurAttendue > valeurActuelle ? (valeurAttendue - valeurActuelle) : 0;
            
            if (provision > 0) {
                if (!categories[categoryCode]) {
                    categories[categoryCode] = getCategoryName(categoryCode);
                    rows.push({
                        type: 'category',
                        designation: `${categoryCode} - ${categories[categoryCode]}`,
                        isHeader: true
                    });
                }
                
                const cumulProvisions = provision;
                const valeurNette = valeurActuelle - provision;
                const tauxDepreciation = ((provision / valeurOrigine) * 100).toFixed(2);
                
                rows.push({
                    type: 'detail',
                    designation: asset.name,
                    valeur_origine: valeurOrigine,
                    date_entree: asset.acquisition_date,
                    taux: tauxDepreciation + '%',
                    nb_annees: asset.method_number + ' ans',
                    provision_exercice: provision,
                    cumul_provisions: cumulProvisions,
                    valeur_nette: valeurNette
                });
                
                totaux.valeur_origine += valeurOrigine;
                totaux.provision_exercice += provision;
                totaux.cumul_provisions += cumulProvisions;
                totaux.valeur_nette += valeurNette;
            }
        });
        
        const report = {
            headers: [
                'Désignation',
                'Valeur d\'origine',
                'Date d\'entrée',
                'Taux dépréc.',
                'Nb années',
                'Provision exercice',
                'Cumul provisions',
                'Valeur nette'
            ],
            rows: rows,
            totaux: totaux,
            exercice: fiscalYear || new Date().getFullYear(),
            message: rows.length === 0 ? 'Aucune provision pour dépréciation' : null
        };
        
        console.log('✅ [getTableauProvisions] Rapport généré avec', rows.filter(r => r.type === 'detail').length, 'provisions');
        
        res.json({ status: 'success', data: report });
        
    } catch (error) {
        console.error('❌ [getTableauProvisions] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/reports/etat-rapprochement
 */
router.get('/reports/etat-rapprochement', protect, checkCompanyAccess, async (req, res) => {
    try {
        res.json({
            status: 'success',
            data: {
                message: 'Fonctionnalité disponible prochainement'
            }
        });
    } catch (error) {
        console.error('❌ [getEtatRapprochement] Erreur:', error.message);
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
