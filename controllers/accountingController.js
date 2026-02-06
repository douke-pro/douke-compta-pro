// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION V17 - DASHBOARD CORRIGÉ)
// Description : Gestion Comptable SYSCOHADA Multi-Tenant Sécurisée
// Architecture : UID Admin Unique + Isolation stricte par company_id
// Auteur : Doukè Compta Pro Team
// Date : Février 2026
// Corrections V17 : getDashboardData avec récupération correcte des écritures
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

// =============================================================================
// 1. CONFIGURATION ET PÉRIODES FISCALES
// =============================================================================

/**
 * Récupère la configuration de l'exercice fiscal
 * @route GET /api/accounting/fiscal-config?companyId=X
 * @access Private (protect + checkCompanyAccess)
 */
exports.getFiscalConfig = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        console.log(`📅 [getFiscalConfig] Company ID: ${companyId}`);

        if (!companyId) {
            return res.status(400).json({ 
                status: 'error',
                error: 'companyId manquant' 
            });
        }

        const companyData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], ['fiscalyear_last_day', 'fiscalyear_last_month']],
            kwargs: {}
        });

        if (!companyData || companyData.length === 0) {
            console.warn(`⚠️ Entreprise ${companyId} introuvable, utilisation dates par défaut`);
            const currentYear = new Date().getFullYear();
            return res.json({
                status: 'success',
                fiscal_period: {
                    start_date: `${currentYear}-01-01`,
                    end_date: `${currentYear}-12-31`
                }
            });
        }

        const currentYear = new Date().getFullYear();
        const fiscalPeriod = {
            start_date: `${currentYear}-01-01`,
            end_date: `${currentYear}-12-31`
        };

        console.log(`✅ Période fiscale: ${fiscalPeriod.start_date} → ${fiscalPeriod.end_date}`);

        res.json({
            status: 'success',
            fiscal_period: fiscalPeriod
        });

    } catch (error) {
        console.error('🚨 getFiscalConfig Error:', error.message);
        
        const currentYear = new Date().getFullYear();
        res.json({
            status: 'success',
            fiscal_period: {
                start_date: `${currentYear}-01-01`,
                end_date: `${currentYear}-12-31`
            }
        });
    }
};

// =============================================================================
// 2. REPORTING SYSCOHADA
// =============================================================================

/**
 * Génère un rapport financier par centre analytique
 * @route GET /api/accounting/report/:analyticId?companyId=X&systemType=NORMAL
 * @access Private
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { systemType } = req.query; 

        console.log(`📊 [getFinancialReport] Analytic: ${analyticId}, Company: ${companyId}, Type: ${systemType}`);

        if (!ADMIN_UID_INT || !companyId) {
            return res.status(500).json({ 
                error: "Erreur de configuration: ODOO_ADMIN_UID ou companyId manquant." 
            });
        }
        
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];
        const companyFilter = [['company_id', 'in', [companyId]]];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ...analyticFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'date', 'name'],
                context: { company_id: companyId, allowed_company_ids: [companyId] }
            }
        });

        let report = { 
            chiffreAffaires: 0, 
            chargesExploitation: 0, 
            tresorerie: 0, 
            resultat: 0 
        };

        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : ''; 
            
            if (accountCode.startsWith('7')) {
                report.chiffreAffaires += (line.credit - line.debit);
            } else if (accountCode.startsWith('6')) {
                report.chargesExploitation += (line.debit - line.credit);
            } else if (accountCode.startsWith('5')) {
                report.tresorerie += (line.debit - line.credit);
            }
        });

        report.resultat = report.chiffreAffaires - report.chargesExploitation;

        if (systemType === 'SMT') {
            console.log(`✅ Rapport SMT généré: ${moveLines.length} lignes`);
            return res.json({
                systeme: "Minimal de Trésorerie (SMT)",
                flux: { 
                    encaissements: report.chiffreAffaires, 
                    decaissements: report.chargesExploitation, 
                    soldeNet: report.tresorerie 
                }
            });
        }
        
        console.log(`✅ Rapport Normal généré: ${moveLines.length} lignes`);
        res.json({ 
            systeme: "Normal (Comptabilité d'engagement)", 
            donnees: report 
        });

    } catch (error) {
        console.error('🚨 getFinancialReport Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// ✅ FONCTION CORRIGÉE : TABLEAU DE BORD AVEC KPIs ET ÉCRITURES
// =============================================================================

/**
 * Récupère les KPI du tableau de bord
 * @route GET /api/accounting/dashboard/kpis?companyId=X
 * @access Private
 * ✅ VERSION V17 : Corrigée pour afficher les écritures récentes
 */
exports.getDashboardData = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        console.log('📈 [getDashboardData] DÉBUT');
        console.log(`   Company ID: ${companyId}`);
        console.log(`   User: ${req.user ? req.user.email : 'N/A'}`);

        if (!companyId || !ADMIN_UID_INT) {
            console.error('❌ Paramètres manquants');
            return res.status(400).json({ 
                status: 'error',
                error: 'companyId requis.' 
            });
        }

        // 1️⃣ RÉCUPÉRATION DES COMPTES POUR LES KPIs
        console.log('🔍 Récupération des comptes...');
        
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'current_balance'],
                context: { 
                    company_id: companyId, 
                    allowed_company_ids: [companyId] 
                } 
            }
        });

        console.log(`✅ ${accounts.length} comptes récupérés`);

        // 2️⃣ CALCUL DES KPIs
        let cashBalance = 0;
        let totalIncome = 0;
        let totalExpenses = 0;
        let shortTermDebt = 0;

        accounts.forEach(account => {
            const code = account.code || '';
            const balance = account.current_balance || 0;
            
            if (code.startsWith('5')) {
                cashBalance += balance;
            } else if (code.startsWith('7')) {
                totalIncome += Math.abs(balance);
            } else if (code.startsWith('6')) {
                totalExpenses += Math.abs(balance);
            } else if (code.startsWith('4')) {
                shortTermDebt += Math.abs(balance);
            }
        });

        const netProfit = totalIncome - totalExpenses;
        const grossMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;

        console.log('📊 KPIs calculés :');
        console.log(`   💰 Trésorerie: ${cashBalance.toFixed(2)} XOF`);
        console.log(`   📈 Résultat Net: ${netProfit.toFixed(2)} XOF`);
        console.log(`   💳 Dettes CT: ${shortTermDebt.toFixed(2)} XOF`);
        console.log(`   📊 Marge: ${grossMargin.toFixed(2)} %`);

        // 3️⃣ ✅ RÉCUPÉRATION DES ÉCRITURES RÉCENTES (CORRIGÉE)
        console.log('🔍 Récupération des écritures récentes...');
        
        let recentLines = [];
        
        try {
            recentLines = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'account.move.line',
                method: 'search_read',
                args: [[
                    ['company_id', '=', companyId],
                    ['parent_state', '=', 'posted'],
                    ['account_id', '!=', false],
                    '|',
                    ['debit', '>', 0],
                    ['credit', '>', 0]
                ]],
                kwargs: { 
                    fields: [
                        'id',
                        'date',
                        'name',
                        'ref',
                        'move_id',
                        'journal_id',
                        'debit',
                        'credit'
                    ],
                    order: 'date DESC, id DESC',
                    limit: 6,
                    context: { 
                        company_id: companyId, 
                        allowed_company_ids: [companyId] 
                    } 
                }
            });
            
            console.log(`✅ ${recentLines.length} lignes récupérées`);
            
            if (recentLines.length > 0) {
                console.log('📋 Exemple ligne:', {
                    date: recentLines[0].date,
                    name: recentLines[0].name,
                    journal: recentLines[0].journal_id ? recentLines[0].journal_id[1] : 'N/A',
                    debit: recentLines[0].debit,
                    credit: recentLines[0].credit
                });
            } else {
                console.warn('⚠️ Aucune ligne trouvée');
            }
            
        } catch (lineError) {
            console.error('⚠️ Erreur récupération lignes:', lineError.message);
            recentLines = [];
        }

        // 4️⃣ FORMATAGE DES ÉCRITURES
        const recentEntries = recentLines.map(line => {
            return {
                id: line.id,
                date: line.date,
                libelle: line.name || line.ref || `Ligne #${line.id}`,
                journal: line.journal_id ? line.journal_id[1] : 'N/A',
                debit: line.debit || 0,
                credit: line.credit || 0,
                status: 'Validé'
            };
        });

        console.log(`✅ Dashboard: ${accounts.length} comptes, ${recentEntries.length} écritures`);
        console.log('✅ [getDashboardData] FIN - SUCCÈS');

        // 5️⃣ RÉPONSE FINALE
        const data = {
            cashBalance: Math.round(cashBalance),
            netProfit: Math.round(netProfit),
            shortTermDebt: Math.round(shortTermDebt),
            grossMargin: Math.round(grossMargin * 10) / 10,
            cashTrend: null,
            profitTrend: null,
            debtTrend: null,
            marginTrend: null,
            recentEntries: recentEntries
        };

        res.status(200).json({ 
            status: 'success', 
            data: data
        });

    } catch (err) {
        console.error('🚨 [getDashboardData] ERREUR:', err.message);
        console.error('Stack:', err.stack);
        
        // ⚠️ Fallback en cas d'erreur totale
        res.status(500).json({ 
            status: 'error',
            error: err.message,
            data: {
                cashBalance: 0,
                netProfit: 0,
                shortTermDebt: 0,
                grossMargin: 0,
                cashTrend: null,
                profitTrend: null,
                debtTrend: null,
                marginTrend: null,
                recentEntries: []
            }
        });
    }
};

// =============================================================================
// 3. PLAN COMPTABLE (CRUD)
// =============================================================================

/**
 * Récupère le plan comptable SYSCOHADA
 * @route GET /api/accounting/chart-of-accounts?companyId=X
 * @access Private
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

        console.log(`📚 [getChartOfAccounts] Company ID: ${companyId}`);

        if (!companyId) {
            return res.status(400).json({ 
                error: "ID de compagnie manquant." 
            });
        }

        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`✅ ${accounts.length} comptes récupérés`);

        res.status(200).json({ 
            status: 'success', 
            results: accounts.length, 
            data: accounts 
        });

    } catch (error) {
        console.error('🚨 getChartOfAccounts Error:', error.message);
        res.status(500).json({ 
            error: 'Échec de la récupération du Plan Comptable.' 
        });
    }
};

/**
 * Crée un nouveau compte
 * @route POST /api/accounting/chart-of-accounts
 * @access Private
 */
exports.createAccount = async (req, res) => {
    try {
        const { code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);

        console.log(`📝 [createAccount] Code: ${code}, Company: ${companyId}`);

        if (!companyId) {
            return res.status(400).json({ 
                error: "companyId manquant." 
            });
        }

        const newAccountId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'create',
            args: [{ code, name, account_type: type }],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Compte créé: ID=${newAccountId}`);

        res.status(201).json({ 
            status: 'success', 
            data: { id: newAccountId } 
        });

    } catch (err) {
        console.error('🚨 createAccount Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Modifie un compte existant
 * @route PUT /api/accounting/chart-of-accounts
 * @access Private
 */
exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);

        console.log(`✏️ [updateAccount] ID: ${id}, Company: ${companyId}`);

        if (!id || !companyId) {
            return res.status(400).json({ 
                error: "Données manquantes (id, companyId)." 
            });
        }

        // Vérification de sécurité cross-company
        const accountCheck = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['id', '=', id], ['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id'], 
                limit: 1, 
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!accountCheck || accountCheck.length === 0) {
            console.error(`🚨 CROSS-COMPANY ATTEMPT: Account ${id} not in company ${companyId}`);
            return res.status(403).json({ 
                error: "Accès refusé. Ce compte n'appartient pas à votre entreprise." 
            });
        }

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'write',
            args: [[id], { code, name, account_type: type }],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Compte ${id} mis à jour`);

        res.status(200).json({ 
            status: 'success', 
            message: 'Compte mis à jour.' 
        });

    } catch (err) {
        console.error('🚨 updateAccount Error:', err.message);
        
        if (err.message.includes('Access Denied')) {
            return res.status(403).json({ 
                error: "Accès refusé. Vérifiez les permissions Odoo." 
            });
        }

        res.status(500).json({ error: err.message });
    }
};

// =============================================================================
// 4. CRÉATION D'ÉCRITURE COMPTABLE (MÉTHODE STANDARD ODOO)
// =============================================================================

/**
 * Crée et valide une écriture comptable
 * @route POST /api/accounting/move/create
 * @access Private
 */
exports.createJournalEntry = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const { journal_code, date, reference, lines } = req.body;

        console.log('='.repeat(70));
        console.log('📝 [createJournalEntry] DÉBUT');
        console.log('   User:', req.user ? req.user.email : 'N/A', req.user ? `(${req.user.role})` : '');
        console.log('   Company ID:', companyId);
        console.log('   Journal:', journal_code);
        console.log('   Date:', date);
        console.log('   Reference:', reference);
        console.log('   Lines:', lines ? lines.length : 0);

        // Validation
        if (!companyId || !journal_code || !date || !lines || lines.length === 0) {
            console.error('❌ Données incomplètes');
            return res.status(400).json({ 
                status: 'error', 
                error: 'Données incomplètes. Requis: company_id, journal_code, date, lines.'
            });
        }

        // 1️⃣ MAPPING: journal_code → journal_id
        console.log(`🔍 Recherche journal "${journal_code}"...`);
        
        const journalSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['code', '=', journal_code], ['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id', 'name'], 
                limit: 1, 
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!journalSearch || journalSearch.length === 0) {
            console.error(`❌ Journal "${journal_code}" introuvable`);
            return res.status(400).json({ 
                status: 'error',
                error: `Journal "${journal_code}" introuvable.`
            });
        }

        const journalId = journalSearch[0].id;
        const journalName = journalSearch[0].name;
        console.log(`✅ Journal: ${journalName} (ID: ${journalId})`);

        // 2️⃣ MAPPING: account_code → account_id
        console.log(`🔍 Mapping comptes (${lines.length} lignes)...`);
        
        const lineIds = await Promise.all(
            lines.map(async (line, idx) => {
                const accountCode = line.account_code;
                
                console.log(`   [${idx + 1}/${lines.length}] Compte: ${accountCode}`);

                const accountSearch = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'account.account',
                    method: 'search_read',
                    args: [[['code', '=', accountCode], ['company_ids', 'in', [companyId]]]],
                    kwargs: { 
                        fields: ['id', 'name'], 
                        limit: 1, 
                        context: { allowed_company_ids: [companyId] } 
                    }
                });

                if (!accountSearch || accountSearch.length === 0) {
                    throw new Error(`Compte "${accountCode}" introuvable (ligne ${idx + 1}).`);
                }

                const accountId = accountSearch[0].id;
                const accountName = accountSearch[0].name;
                
                console.log(`      ✅ ${accountCode} - ${accountName}`);
                console.log(`         D: ${line.debit || 0} | C: ${line.credit || 0}`);

                return [0, 0, {
                    'account_id': accountId,
                    'name': line.name || reference,
                    'debit': parseFloat(line.debit) || 0.0,
                    'credit': parseFloat(line.credit) || 0.0
                }];
            })
        );

        console.log(`✅ Mapping terminé`);

        // 3️⃣ CRÉATION
        const moveData = {
            'company_id': companyId,
            'journal_id': journalId,
            'date': date,
            'ref': reference || `Écriture ${req.user ? req.user.email : 'API'}`,
            'move_type': 'entry',
            'line_ids': lineIds
        };

        console.log('🔵 Création écriture...');

        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Écriture créée: ID=${moveId}`);

        // 4️⃣ VALIDATION
        console.log('🔵 Validation...');

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'action_post',
            args: [[moveId]],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log('✅ Écriture validée');

        // 5️⃣ RÉCUPÉRATION NOM
        const moveRecord = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [[moveId], ['name']],
            kwargs: {}
        });

        const moveName = moveRecord && moveRecord[0] ? moveRecord[0].name : `MOVE-${moveId}`;

        console.log(`✅ Nom: ${moveName}`);
        console.log('📝 [createJournalEntry] FIN - SUCCÈS');
        console.log('='.repeat(70));

        res.status(201).json({ 
            status: 'success', 
            move_id: moveId,
            move_name: moveName,
            message: `Écriture ${moveName} créée et validée.`
        });

    } catch (error) {
        console.log('='.repeat(70));
        console.error('🚨 [createJournalEntry] ERREUR:', error.message);
        console.error('Stack:', error.stack);
        console.log('='.repeat(70));
        
        res.status(500).json({ 
            status: 'error', 
            error: `Échec: ${error.message}`
        });
    }
};

// =============================================================================
// 5. JOURNAUX ET ÉCRITURES
// =============================================================================

/**
 * Liste des journaux
 * @route GET /api/accounting/journals?companyId=X
 * @access Private
 */
exports.getJournals = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        console.log(`📖 [getJournals] Company ID: ${companyId}`);

        if (!companyId) {
            return res.status(400).json({ error: "companyId requis" });
        }

        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id', 'name', 'code', 'type'], 
                context: { allowed_company_ids: [companyId] } 
            }
        });
        
        console.log(`✅ ${journals.length} journaux récupérés`);

        res.status(200).json({ 
            status: 'success', 
            data: journals 
        });

    } catch (error) {
        console.error('🚨 getJournals Error:', error.message);
        res.status(500).json({ 
            error: "Erreur récupération journaux." 
        });
    }
};

/**
 * Écritures d'un journal
 * @route GET /api/accounting/journal?companyId=X&journal_id=Y&date_from=Z&date_to=W
 * @access Private
 */
exports.getJournalEntries = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { journal_id, date_from, date_to } = req.query;

        console.log('📋 [getJournalEntries]');
        console.log('   Company:', companyId);
        console.log('   Journal:', journal_id || 'Tous');
        console.log('   Période:', date_from || 'Début', '→', date_to || 'Fin');

        if (!companyId) {
            return res.status(400).json({ 
                status: 'error',
                error: "companyId requis" 
            });
        }

        // Construction du domaine de recherche
        let domain = [
            ['company_id', '=', companyId],
            ['state', '=', 'posted']
        ];

        if (journal_id) {
            domain.push(['journal_id', '=', parseInt(journal_id)]);
        }

        if (date_from) {
            domain.push(['date', '>=', date_from]);
        }

        if (date_to) {
            domain.push(['date', '<=', date_to]);
        }

        // Récupération des écritures
        const moves = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'search_read',
            args: [domain],
            kwargs: { 
                fields: [
                    'id', 
                    'name', 
                    'date', 
                    'ref', 
                    'journal_id', 
                    'amount_total',
                    'state'
                ],
                order: 'date desc, id desc',
                limit: 100,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        console.log(`✅ ${moves.length} écritures récupérées`);

        // Formatage pour le frontend
        const entries = moves.map(move => ({
            id: move.id,
            name: move.name,
            date: move.date,
            libelle: move.ref || move.name,
            journal: move.journal_id ? move.journal_id[1] : 'N/A',
            debit: move.amount_total && move.amount_total > 0 ? move.amount_total : 0,
            credit: move.amount_total && move.amount_total < 0 ? Math.abs(move.amount_total) : 0,
            status: move.state === 'posted' ? 'Validé' : 'Brouillon'
        }));

        res.status(200).json({ 
            status: 'success',
            results: entries.length,
            data: {
                entries: entries
            }
        });

    } catch (error) {
        console.error('🚨 getJournalEntries Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: "Erreur récupération écritures." 
        });
    }
};

// =============================================================================
// 6. BALANCE SYSCOHADA 6 COLONNES
// =============================================================================

/**
 * Balance SYSCOHADA 6 colonnes
 * @route GET /api/accounting/trial-balance-syscohada?companyId=X&date_from=Y&date_to=Z
 * @access Private
 */
exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to } = req.query;
        
        console.log('📊 [getSyscohadaTrialBalance] Balance 6 colonnes SYSCOHADA');
        console.log(`   Company: ${companyId}`);
        console.log(`   Période: ${date_from} → ${date_to}`);

        if (!companyId || !date_from || !date_to) {
            return res.status(400).json({ 
                status: 'error',
                error: "Paramètres manquants (companyId, date_from, date_to)." 
            });
        }

        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'],
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`📋 ${accounts.length} comptes trouvés`);

        const openingLines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['parent_state', '=', 'posted'],
                ['date', '<', date_from]
            ]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit'],
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`📋 ${openingLines.length} lignes d'ouverture`);

        const periodLines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['parent_state', '=', 'posted'],
                ['date', '>=', date_from],
                ['date', '<=', date_to]
            ]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit'],
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`📋 ${periodLines.length} lignes de période`);

        const accountsData = {};

        accounts.forEach(account => {
            accountsData[account.id] = {
                code: account.code,
                name: account.name,
                account_type: account.account_type,
                opening_debit: 0,
                opening_credit: 0,
                debit: 0,
                credit: 0
            };
        });

        openingLines.forEach(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            if (!accountId || !accountsData[accountId]) return;

            accountsData[accountId].opening_debit += line.debit || 0;
            accountsData[accountId].opening_credit += line.credit || 0;
        });

        periodLines.forEach(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            if (!accountId || !accountsData[accountId]) return;

            accountsData[accountId].debit += line.debit || 0;
            accountsData[accountId].credit += line.credit || 0;
        });

        const balanceAccounts = Object.values(accountsData)
            .filter(acc => 
                acc.opening_debit > 0 || 
                acc.opening_credit > 0 || 
                acc.debit > 0 || 
                acc.credit > 0
            )
            .sort((a, b) => a.code.localeCompare(b.code));

        const totals = {
            opening_debit: 0,
            opening_credit: 0,
            total_debit: 0,
            total_credit: 0,
            closing_debit: 0,
            closing_credit: 0
        };

        balanceAccounts.forEach(acc => {
            totals.opening_debit += acc.opening_debit;
            totals.opening_credit += acc.opening_credit;
            totals.total_debit += acc.debit;
            totals.total_credit += acc.credit;
        });

        const closingBalance = (totals.opening_debit + totals.total_debit) - (totals.opening_credit + totals.total_credit);
        totals.closing_debit = closingBalance > 0 ? closingBalance : 0;
        totals.closing_credit = closingBalance < 0 ? Math.abs(closingBalance) : 0;

        console.log(`✅ Balance générée: ${balanceAccounts.length} comptes`);

        res.status(200).json({ 
            status: 'success',
            data: {
                date_from: date_from,
                date_to: date_to,
                accounts: balanceAccounts,
                totals: totals
            }
        });

    } catch (error) {
        console.error('🚨 getSyscohadaTrialBalance Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: `Erreur génération balance : ${error.message}` 
        });
    }
};

// =============================================================================
// 7. GRAND LIVRE
// =============================================================================

/**
 * Grand Livre
 * @route GET /api/accounting/general-ledger?companyId=X&date_from=Y&date_to=Z
 * @access Private
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to, journal_ids } = req.query;
        
        console.log('📗 [getGeneralLedger]');
        console.log(`   Company: ${companyId}`);
        console.log(`   Période: ${date_from || 'Début'} → ${date_to || 'Fin'}`);

        if (!companyId) {
            return res.status(400).json({ 
                status: 'error',
                error: "companyId requis" 
            });
        }

        let domain = [
            ['company_id', '=', companyId],
            ['parent_state', '=', 'posted']
        ];

        if (date_from) {
            domain.push(['date', '>=', date_from]);
        }

        if (date_to) {
            domain.push(['date', '<=', date_to]);
        }

        if (journal_ids) {
            const journalIdsList = journal_ids.split(',').map(Number);
            domain.push(['journal_id', 'in', journalIdsList]);
        }

        const lines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [domain],
            kwargs: { 
                fields: [
                    'id',
                    'account_id',
                    'date',
                    'move_id',
                    'name',
                    'ref',
                    'journal_id',
                    'debit',
                    'credit',
                    'balance'
                ],
                order: 'account_id, date, id',
                context: { allowed_company_ids: [companyId] }
            }
        });

        console.log(`📋 ${lines.length} lignes récupérées`);

        const accountIds = [...new Set(lines.map(l => l.account_id ? l.account_id[0] : null).filter(Boolean))];
        
        const accountsInfo = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'read',
            args: [accountIds, ['id', 'code', 'name', 'account_type']],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        const accountsMap = {};
        accountsInfo.forEach(acc => {
            accountsMap[acc.id] = {
                code: acc.code,
                name: acc.name,
                account_type: acc.account_type
            };
        });

        const moveIds = [...new Set(lines.map(l => l.move_id ? l.move_id[0] : null).filter(Boolean))];
        
        const movesInfo = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [moveIds, ['id', 'name']],
            kwargs: {}
        });

        const movesMap = {};
        movesInfo.forEach(move => {
            movesMap[move.id] = move.name;
        });

        const ledger = {};

        lines.forEach(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            if (!accountId) return;

            const accountInfo = accountsMap[accountId];
            if (!accountInfo) return;

            const code = accountInfo.code;

            if (!ledger[code]) {
                ledger[code] = { 
                    code: code,
                    name: accountInfo.name,
                    account_type: accountInfo.account_type,
                    opening_balance: 0,
                    lines: [], 
                    totalDebit: 0, 
                    totalCredit: 0, 
                    finalBalance: 0 
                };
            }

            const moveId = line.move_id ? line.move_id[0] : null;
            const moveName = moveId ? movesMap[moveId] : 'N/A';

            ledger[code].lines.push({ 
                date: line.date,
                move_name: moveName,
                journal_code: line.journal_id ? line.journal_id[1].split(' ')[0] : '',
                name: line.name || line.ref || '',
                debit: line.debit || 0,
                credit: line.credit || 0
            });

            ledger[code].totalDebit += line.debit || 0;
            ledger[code].totalCredit += line.credit || 0;
            ledger[code].finalBalance += (line.debit || 0) - (line.credit || 0);
        });

        const ledgerArray = Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code));

        console.log(`✅ Grand Livre: ${ledgerArray.length} comptes`);

        res.status(200).json({ 
            status: 'success', 
            data: ledgerArray
        });

    } catch (error) {
        console.error('🚨 getGeneralLedger Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: `Erreur génération Grand Livre : ${error.message}` 
        });
    }
};

// =============================================================================
// 8. DÉTAILS D'UNE ÉCRITURE
// =============================================================================

/**
 * Détails d'une écriture
 * @route GET /api/accounting/entry/:id?companyId=X
 */
exports.getEntryDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

        console.log(`📄 Détails écriture ID=${id} pour company_id=${companyId}`);

        if (!id || !companyId) {
            return res.status(400).json({ 
                error: "ID d'écriture et companyId requis." 
            });
        }

        const moveId = parseInt(id);

        const moveCheck = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'search_read',
            args: [[['id', '=', moveId], ['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id'], 
                limit: 1,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!moveCheck || moveCheck.length === 0) {
            return res.status(403).json({ 
                error: "Accès refusé." 
            });
        }

        const moveData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [[moveId], [
                'name', 
                'date', 
                'ref', 
                'journal_id', 
                'state', 
                'amount_total',
                'line_ids',
                'create_date',
                'write_date',
                'create_uid',
                'write_uid'
            ]],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        if (!moveData || moveData.length === 0) {
            return res.status(404).json({ 
                error: "Écriture introuvable." 
            });
        }

        const move = moveData[0];
        const lineIds = move.line_ids || [];
        
        let lines = [];
        if (lineIds.length > 0) {
            lines = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'account.move.line',
                method: 'read',
                args: [lineIds, [
                    'id',
                    'account_id',
                    'name',
                    'debit',
                    'credit',
                    'balance',
                    'date',
                    'partner_id'
                ]],
                kwargs: { context: { allowed_company_ids: [companyId] } }
            });
        }

        const formattedLines = lines.map(line => ({
            id: line.id,
            account_code: line.account_id ? line.account_id[1].split(' ')[0] : 'N/A',
            account_name: line.account_id ? line.account_id[1] : 'Compte inconnu',
            label: line.name || move.ref || 'Sans libellé',
            debit: line.debit || 0,
            credit: line.credit || 0,
            balance: line.balance || 0,
            partner: line.partner_id ? line.partner_id[1] : null
        }));

        const totalDebit = formattedLines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = formattedLines.reduce((sum, l) => sum + l.credit, 0);

        res.status(200).json({
            status: 'success',
            data: {
                id: move.id,
                name: move.name,
                date: move.date,
                reference: move.ref || '',
                journal: move.journal_id ? move.journal_id[1] : 'N/A',
                journal_id: move.journal_id ? move.journal_id[0] : null,
                state: move.state,
                state_label: move.state === 'posted' ? 'Validé' : 'Brouillon',
                amount_total: move.amount_total || 0,
                lines: formattedLines,
                totals: {
                    debit: totalDebit,
                    credit: totalCredit,
                    difference: Math.abs(totalDebit - totalCredit)
                },
                metadata: {
                    created_at: move.create_date,
                    updated_at: move.write_date,
                    created_by: move.create_uid ? move.create_uid[1] : 'N/A',
                    updated_by: move.write_uid ? move.write_uid[1] : 'N/A'
                }
            }
        });

    } catch (error) {
        console.error('🚨 getEntryDetails Error:', error.message);
        res.status(500).json({ 
            error: `Erreur : ${error.message}` 
        });
    }
};

// =============================================================================
// 9. OPÉRATION DE CAISSE
// =============================================================================

/**
 * Opération de caisse
 * @route POST /api/accounting/caisse-entry
 */
exports.handleCaisseEntry = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const { type, contraAccountCode, libelle, amount } = req.body;

        console.log('💰 Opération de caisse:', { type, contraAccountCode, libelle, amount, companyId });

        if (!companyId || !type || !contraAccountCode || !libelle || !amount) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Données incomplètes.' 
            });
        }

        if (!['RECETTE', 'DEPENSE'].includes(type)) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Type invalide.' 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Le montant doit être positif.' 
            });
        }

        const contraAccountSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['code', '=', contraAccountCode], ['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'name'], 
                limit: 1,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!contraAccountSearch || contraAccountSearch.length === 0) {
            return res.status(400).json({ 
                status: 'error',
                error: `Compte "${contraAccountCode}" introuvable.` 
            });
        }

        const contraAccountId = contraAccountSearch[0].id;

        const caisseAccountSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['code', '=', '571000'], ['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'name'], 
                limit: 1,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!caisseAccountSearch || caisseAccountSearch.length === 0) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Compte Caisse (571000) introuvable.' 
            });
        }

        const caisseAccountId = caisseAccountSearch[0].id;

        const journalSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['type', '=', 'cash'], ['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id', 'name'], 
                limit: 1,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!journalSearch || journalSearch.length === 0) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Journal de Caisse introuvable.' 
            });
        }

        const journalId = journalSearch[0].id;

        let lineIds;

        if (type === 'RECETTE') {
            lineIds = [
                [0, 0, { account_id: caisseAccountId, name: libelle, debit: parseFloat(amount), credit: 0 }],
                [0, 0, { account_id: contraAccountId, name: libelle, debit: 0, credit: parseFloat(amount) }]
            ];
        } else {
            lineIds = [
                [0, 0, { account_id: contraAccountId, name: libelle, debit: parseFloat(amount), credit: 0 }],
                [0, 0, { account_id: caisseAccountId, name: libelle, debit: 0, credit: parseFloat(amount) }]
            ];
        }

        const moveData = {
            company_id: companyId,
            journal_id: journalId,
            date: new Date().toISOString().split('T')[0],
            ref: `${type} - ${libelle}`,
            move_type: 'entry',
            line_ids: lineIds
        };

        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'action_post',
            args: [[moveId]],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        const moveRecord = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [[moveId], ['name']],
            kwargs: {}
        });

        const moveName = moveRecord && moveRecord[0] ? moveRecord[0].name : `CAISSE-${moveId}`;

        console.log(`✅ Opération caisse : ${moveName}`);

        res.status(201).json({ 
            status: 'success', 
            move_id: moveId,
            move_name: moveName,
            type: type,
            amount: parseFloat(amount),
            message: `${type} de ${parseFloat(amount).toLocaleString('fr-FR')} XOF enregistrée.`
        });

    } catch (error) {
        console.error('🚨 handleCaisseEntry Error:', error.message);
        res.status(500).json({ 
            status: 'error', 
            error: `Échec : ${error.message}` 
        });
    }
};

// =============================================================================
// 10. BILAN SYSCOHADA
// =============================================================================

/**
 * Bilan SYSCOHADA
 * @route GET /api/accounting/balance-sheet?companyId=X&date=Y
 */
exports.getBalanceSheet = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date } = req.query;

        console.log(`📊 Bilan pour company_id=${companyId}`);

        if (!companyId) {
            return res.status(400).json({ error: "companyId requis." });
        }

        const balanceDate = date || new Date().toISOString().split('T')[0];

        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[['company_ids', 'in', [companyId]]]],
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'],
                context: { allowed_company_ids: [companyId] }
            }
        });

        const moveLines = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['parent_state', '=', 'posted'],
                ['date', '<=', balanceDate]
            ]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'balance'],
                context: { allowed_company_ids: [companyId] }
            }
        });

        const accountBalances = {};

        moveLines.forEach(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            if (!accountId) return;

            if (!accountBalances[accountId]) {
                accountBalances[accountId] = { debit: 0, credit: 0, balance: 0 };
            }

            accountBalances[accountId].debit += line.debit || 0;
            accountBalances[accountId].credit += line.credit || 0;
            accountBalances[accountId].balance += line.balance || 0;
        });

        const bilan = {
            actif: {
                immobilise: { label: 'ACTIF IMMOBILISÉ', accounts: [], total: 0 },
                circulant: { label: 'ACTIF CIRCULANT', accounts: [], total: 0 },
                tresorerie: { label: 'TRÉSORERIE-ACTIF', accounts: [], total: 0 }
            },
            passif: {
                capitaux: { label: 'CAPITAUX PROPRES', accounts: [], total: 0 },
                dettes: { label: 'DETTES FINANCIÈRES', accounts: [], total: 0 },
                tresorerie: { label: 'TRÉSORERIE-PASSIF', accounts: [], total: 0 }
            }
        };

        accounts.forEach(account => {
            const balance = accountBalances[account.id];
            if (!balance || balance.balance === 0) return;

            const code = account.code;
            const accountData = { code: code, name: account.name, balance: balance.balance };

            if (code.startsWith('2')) {
                bilan.actif.immobilise.accounts.push(accountData);
                bilan.actif.immobilise.total += balance.balance;
            } else if (code.startsWith('3') || code.startsWith('4')) {
                if (balance.balance > 0) {
                    bilan.actif.circulant.accounts.push(accountData);
                    bilan.actif.circulant.total += balance.balance;
                } else {
                    bilan.passif.dettes.accounts.push(accountData);
                    bilan.passif.dettes.total += Math.abs(balance.balance);
                }
            } else if (code.startsWith('5')) {
                if (balance.balance > 0) {
                    bilan.actif.tresorerie.accounts.push(accountData);
                    bilan.actif.tresorerie.total += balance.balance;
                } else {
                    bilan.passif.tresorerie.accounts.push(accountData);
                    bilan.passif.tresorerie.total += Math.abs(balance.balance);
                }
            } else if (code.startsWith('1')) {
                bilan.passif.capitaux.accounts.push(accountData);
                bilan.passif.capitaux.total += Math.abs(balance.balance);
            }
        });

        const totalActif = bilan.actif.immobilise.total + bilan.actif.circulant.total + bilan.actif.tresorerie.total;
        const totalPassif = bilan.passif.capitaux.total + bilan.passif.dettes.total + bilan.passif.tresorerie.total;

        console.log(`✅ Bilan généré`);

        res.status(200).json({ 
            status: 'success',
            data: {
                date: balanceDate,
                actif: bilan.actif,
                passif: bilan.passif,
                totals: {
                    actif: totalActif,
                    passif: totalPassif,
                    difference: Math.abs(totalActif - totalPassif)
                }
            }
        });

    } catch (error) {
        console.error('🚨 getBalanceSheet Error:', error.message);
        res.status(500).json({ 
            error: `Erreur : ${error.message}` 
        });
    }
};
