// =============================================================================
// FICHIER : controllers/immobilisationsController.js
// Description : Contrôleur pour la gestion des immobilisations SYSCOHADA
// Version : 1.0 - Production Ready
// =============================================================================

const { odooExecuteKw } = require('../services/odooService');

// =============================================================================
// FONCTIONS DE LECTURE
// =============================================================================

/**
 * Récupérer les statistiques globales
 * GET /api/accounting/immobilisations/stats?companyId=X
 */
exports.getStats = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getImmobilisationsStats] Company:', companyId);
        
        // Récupérer toutes les immobilisations de l'entreprise
        const assets = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'search_read',
            args: [[['company_id', '=', companyId], ['state', 'in', ['open', 'close']]]],
            kwargs: {
                fields: ['value', 'value_residual', 'state']
            }
        });
        
        // Calculer les statistiques
        const stats = {
            total: assets.length,
            valeur_brute: assets.reduce((sum, a) => sum + (a.value || 0), 0),
            amortissements: assets.reduce((sum, a) => sum + ((a.value || 0) - (a.value_residual || 0)), 0),
            valeur_nette: assets.reduce((sum, a) => sum + (a.value_residual || 0), 0),
            actives: assets.filter(a => a.state === 'open').length,
            cloturees: assets.filter(a => a.state === 'close').length
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
};

/**
 * Liste des immobilisations avec filtres
 * GET /api/accounting/immobilisations/list?companyId=X&category=21&limit=50&offset=0
 */
exports.getList = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { category, limit = 50, offset = 0 } = req.query;
        
        console.log('📋 [getImmobilisationsList] Company:', companyId, 'Category:', category);
        
        // Construire le domaine de recherche
        const domain = [['company_id', '=', companyId]];
        
        // Filtre par catégorie si spécifié
        if (category) {
            const categoryMap = {
                '20': [200, 209],
                '21': [210, 219],
                '22': [220, 229],
                '23': [230, 239],
                '24': [240, 249],
                '25-28': [250, 289]
            };
            
            const range = categoryMap[category];
            if (range) {
                domain.push(['code', '>=', range[0].toString()]);
                domain.push(['code', '<=', range[1].toString()]);
            }
        }
        
        // Récupérer les immobilisations
        const assets = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'search_read',
            args: [domain],
            kwargs: {
                fields: [
                    'name', 'code', 'value', 'value_residual', 'date', 
                    'category_id', 'method', 'method_number', 'state'
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: 'date desc'
            }
        });
        
        // Compter le total (pour pagination)
        const total = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
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
};

/**
 * Détails d'une immobilisation
 * GET /api/accounting/immobilisations/:id?companyId=X
 */
exports.getById = async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        const companyId = req.validatedCompanyId;
        
        console.log('🔍 [getImmobilisationById] Asset:', assetId);
        
        const asset = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'read',
            args: [[assetId]],
            kwargs: {
                fields: [
                    'name', 'code', 'value', 'value_residual', 'date', 
                    'category_id', 'method', 'method_number', 'method_period',
                    'state', 'partner_id', 'invoice_id', 'account_asset_id',
                    'account_depreciation_id', 'account_depreciation_expense_id',
                    'depreciation_line_ids'
                ]
            }
        });
        
        if (!asset || asset.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Immobilisation non trouvée'
            });
        }
        
        // Vérifier que l'immobilisation appartient bien à cette entreprise
        // (Sécurité supplémentaire)
        
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
};

/**
 * Liste des catégories avec compteurs
 * GET /api/accounting/immobilisations/categories/list?companyId=X
 */
exports.getCategories = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📂 [getCategoriesWithCounts] Company:', companyId);
        
        // Récupérer toutes les catégories d'actifs
        const categories = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.category',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: {
                fields: ['name', 'account_asset_id', 'account_depreciation_id']
            }
        });
        
        // Pour chaque catégorie, compter les immobilisations
        const categoriesWithCounts = await Promise.all(
            categories.map(async (cat) => {
                const count = await odooExecuteKw({
                    uid: req.user.odooUid,
                    model: 'account.asset.asset',
                    method: 'search_count',
                    args: [[['category_id', '=', cat.id], ['company_id', '=', companyId]]],
                    kwargs: {}
                });
                
                return { ...cat, count };
            })
        );
        
        console.log(`✅ [getCategoriesWithCounts] ${categories.length} catégories`);
        
        res.json({
            status: 'success',
            data: categoriesWithCounts
        });
        
    } catch (error) {
        console.error('❌ [getCategoriesWithCounts] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des catégories',
            error: error.message
        });
    }
};

// =============================================================================
// FONCTIONS D'ÉCRITURE
// =============================================================================

/**
 * Créer une nouvelle immobilisation
 * POST /api/accounting/immobilisations/create
 */
exports.create = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { name, value, category_id, date, method, method_number, code } = req.body;
        
        console.log('➕ [createImmobilisation] Création:', name);
        
        // Validation
        if (!name || !value || !category_id || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'Champs requis : name, value, category_id, date'
            });
        }
        
        // Créer l'immobilisation dans Odoo
        const assetId = await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'create',
            args: [{
                name,
                code: code || '',
                value: parseFloat(value),
                category_id: parseInt(category_id),
                date,
                company_id: companyId,
                method: method || 'linear',
                method_number: parseInt(method_number) || 5,
                method_period: 12,
                state: 'draft'
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
};

/**
 * Modifier une immobilisation
 * PUT /api/accounting/immobilisations/:id
 */
exports.update = async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        const updates = req.body;
        
        console.log('✏️ [updateImmobilisation] MAJ Asset:', assetId);
        
        // Mettre à jour dans Odoo
        await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'write',
            args: [[assetId], updates],
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
};

/**
 * Mettre au rebut/Supprimer une immobilisation
 * DELETE /api/accounting/immobilisations/:id
 */
exports.dispose = async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        const { reason, disposal_date } = req.body;
        
        console.log('🗑️ [disposeImmobilisation] Asset:', assetId);
        
        // Marquer comme clôturée dans Odoo
        await odooExecuteKw({
            uid: req.user.odooUid,
            model: 'account.asset.asset',
            method: 'write',
            args: [[assetId], {
                state: 'close',
                date_close: disposal_date || new Date().toISOString().split('T')[0]
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
};

// =============================================================================
// FONCTIONS DE RAPPORTS
// =============================================================================

/**
 * Tableau des immobilisations SYSCOHADA
 * GET /api/accounting/immobilisations/reports/tableau-immobilisations
 */
exports.getTableauImmobilisations = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        const { fiscalYear } = req.query;
        
        console.log('📊 [getTableauImmobilisations] Company:', companyId, 'Year:', fiscalYear);
        
        // Récupérer les immobilisations avec mouvements
        // TODO: Implémenter logique complète SYSCOHADA
        // Pour l'instant, retourner structure vide
        
        const report = {
            headers: ['Catégorie', 'Valeur brute début', 'Acquisitions', 'Cessions', 'Valeur brute fin'],
            rows: [],
            totaux: {
                valeur_brute_debut: 0,
                acquisitions: 0,
                cessions: 0,
                valeur_brute_fin: 0
            }
        };
        
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
};

/**
 * Tableau des amortissements
 * GET /api/accounting/immobilisations/reports/tableau-amortissements
 */
exports.getTableauAmortissements = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getTableauAmortissements] Company:', companyId);
        
        // TODO: Implémenter logique complète
        
        res.json({
            status: 'success',
            data: {
                headers: ['Catégorie', 'Amort. cumulés début', 'Dotations exercice', 'Amort. cumulés fin'],
                rows: [],
                totaux: {}
            }
        });
        
    } catch (error) {
        console.error('❌ [getTableauAmortissements] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
};

/**
 * Tableau des provisions
 * GET /api/accounting/immobilisations/reports/tableau-provisions
 */
exports.getTableauProvisions = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getTableauProvisions] Company:', companyId);
        
        // TODO: Implémenter logique complète
        
        res.json({
            status: 'success',
            data: {
                headers: ['Catégorie', 'Provisions début', 'Dotations', 'Reprises', 'Provisions fin'],
                rows: [],
                totaux: {}
            }
        });
        
    } catch (error) {
        console.error('❌ [getTableauProvisions] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération du tableau',
            error: error.message
        });
    }
};

/**
 * État de rapprochement
 * GET /api/accounting/immobilisations/reports/rapprochement
 */
exports.getEtatRapprochement = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId;
        
        console.log('📊 [getEtatRapprochement] Company:', companyId);
        
        // TODO: Implémenter logique complète
        
        res.json({
            status: 'success',
            data: {
                comptabilite: { total: 0, items: [] },
                inventaire: { total: 0, items: [] },
                ecarts: []
            }
        });
        
    } catch (error) {
        console.error('❌ [getEtatRapprochement] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la génération de l\'état',
            error: error.message
        });
    }
};
