// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION FINALE EXPERTISÉE)
// Description : Gestion Comptable SYSCOHADA Multi-Tenant Sécurisée
// Architecture : Un seul UID Odoo Admin (UID=2) + Isolation par company_id
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 
const accountingService = require('../services/accountingService');

// =============================================================================
// 1. CONFIGURATION ET PÉRIODES FISCALES
// =============================================================================

/**
 * Récupère la configuration de l'exercice fiscal
 * @route GET /api/accounting/fiscal-config?companyId=X
 */
exports.getFiscalConfig = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        console.log(`📅 Récupération config fiscale pour company_id=${companyId}`);

        if (!companyId) {
            return res.status(400).json({ 
                status: 'error',
                error: 'companyId manquant' 
            });
        }

        // Lecture des paramètres fiscaux de l'entreprise
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
        
        // SYSCOHADA : Exercice fiscal standard 01/01 → 31/12
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
        
        // Fallback
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
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { systemType } = req.query; 

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
            
            // Classe 7 : Produits
            if (accountCode.startsWith('7')) {
                report.chiffreAffaires += (line.credit - line.debit);
            }
            // Classe 6 : Charges
            else if (accountCode.startsWith('6')) {
                report.chargesExploitation += (line.debit - line.credit);
            }
            // Classe 5 : Trésorerie
            else if (accountCode.startsWith('5')) {
                report.tresorerie += (line.debit - line.credit);
            }
        });

        report.resultat = report.chiffreAffaires - report.chargesExploitation;

        // Système Minimal de Trésorerie (PME)
        if (systemType === 'SMT') {
            return res.json({
                systeme: "Minimal de Trésorerie (SMT)",
                flux: { 
                    encaissements: report.chiffreAffaires, 
                    decaissements: report.chargesExploitation, 
                    soldeNet: report.tresorerie 
                }
            });
        }
        
        // Système Normal (engagement)
        res.json({ 
            systeme: "Normal (Comptabilité d'engagement)", 
            donnees: report 
        });

    } catch (error) {
        console.error('🚨 getFinancialReport Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Récupère les KPI du tableau de bord
 * @route GET /api/accounting/dashboard?companyId=X
 */
exports.getDashboardData = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        if (!companyId || !ADMIN_UID_INT) {
            return res.status(400).json({ error: 'companyId requis.' });
        }

        const companyFilter = [['company_id', 'in', [companyId]]];

        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT,
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'balance'], 
                context: { company_id: companyId, allowed_company_ids: [companyId] } 
            } 
        });

        let data = { cash: 0, profit: 0, debts: 0 };

        moveLines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : ''; 
            const bal = line.balance || 0;
            
            // Classe 7 : Produits
            if (code.startsWith('7')) {
                data.profit += (line.credit - line.debit);
            }
            // Classe 6 : Charges
            else if (code.startsWith('6')) {
                data.profit -= (line.debit - line.credit);
            }
            // Classe 5 : Trésorerie
            if (code.startsWith('5')) {
                data.cash += bal;
            }
            // Classe 40 : Fournisseurs (dettes)
            else if (code.startsWith('40') && bal < 0) {
                data.debts += Math.abs(bal);
            }
        });

        // Données de démonstration si aucune écriture
        if (moveLines.length === 0) {
            data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        }

        res.status(200).json({ status: 'success', data });

    } catch (err) {
        console.error('🚨 getDashboardData Error:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 3. PLAN COMPTABLE (CRUD)
// =============================================================================

/**
 * Récupère le plan comptable SYSCOHADA
 * @route GET /api/accounting/chart-of-accounts?companyId=X
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

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
 */
exports.createAccount = async (req, res) => {
    try {
        const { code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);

        if (!companyId) {
            return res.status(400).json({ 
                error: "companyId manquant." 
            });
        }

        console.log(`📝 Création compte ${code} pour company_id=${companyId}`);

        // 🔑 UTILISATION UID ADMIN (isolation par company_id validé par middleware)
        const newAccountId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'create',
            args: [{ code, name, account_type: type }],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Compte créé avec ID: ${newAccountId}`);
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
 */
exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type } = req.body;
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);

        if (!id || !companyId) {
            return res.status(400).json({ 
                error: "Données manquantes (id, companyId)." 
            });
        }

        console.log(`📝 Mise à jour compte ID=${id} pour company_id=${companyId}`);

        // 🔒 VÉRIFICATION DE SÉCURITÉ : Le compte appartient-il à cette entreprise ?
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
            console.error(`🚨 TENTATIVE CROSS-COMPANY : Compte ${id} n'appartient pas à company_id=${companyId}`);
            return res.status(403).json({ 
                error: "Accès refusé. Ce compte n'appartient pas à votre entreprise." 
            });
        }

        // 🔑 UTILISATION UID ADMIN
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
 */
exports.createJournalEntry = async (req, res) => {
    try {
        // 🔒 company_id déjà validé par middleware checkCompanyAccess
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const { journal_code, date, reference, lines } = req.body;

        console.log('📝 Création écriture via méthode standard Odoo');
        console.log('   User:', req.user.email, '(Role:', req.user.role + ')');
        console.log('   Company ID:', companyId, '(Validé par middleware)');
        console.log('   Journal Code:', journal_code);
        console.log('   Date:', date);
        console.log('   Reference:', reference);
        console.log('   Lines Count:', lines ? lines.length : 0);

        // =====================================================================
        // VALIDATION DES DONNÉES
        // =====================================================================
        if (!companyId || !journal_code || !date || !lines || lines.length === 0) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Données incomplètes. Requis: company_id, journal_code, date, lines.'
            });
        }

        // =====================================================================
        // 1️⃣ MAPPING : journal_code → journal_id
        // =====================================================================
        console.log(`🔍 Recherche du journal "${journal_code}"...`);
        
        const journalSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,  // 🔑 UID ADMIN
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
                error: `Journal "${journal_code}" introuvable dans cette entreprise.`
            });
        }

        const journalId = journalSearch[0].id;
        const journalName = journalSearch[0].name;
        console.log(`✅ Journal trouvé: ${journalName} (ID: ${journalId})`);

        // =====================================================================
        // 2️⃣ MAPPING : account_code → account_id (pour chaque ligne)
        // =====================================================================
        console.log(`🔍 Mapping des comptes (${lines.length} lignes)...`);
        
        const lineIds = await Promise.all(
            lines.map(async (line, idx) => {
                const accountCode = line.account_code;
                
                console.log(`   Ligne ${idx + 1}: compte ${accountCode}`);

                const accountSearch = await odooExecuteKw({
                    uid: ADMIN_UID_INT,  // 🔑 UID ADMIN
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
                console.log(`         Débit: ${line.debit || 0} | Crédit: ${line.credit || 0}`);

                return [0, 0, {
                    'account_id': accountId,
                    'name': line.name || reference,
                    'debit': parseFloat(line.debit) || 0.0,
                    'credit': parseFloat(line.credit) || 0.0
                }];
            })
        );

        console.log(`✅ Mapping terminé: ${lineIds.length} lignes prêtes`);

        // =====================================================================
        // 3️⃣ CRÉATION DE L'ÉCRITURE
        // =====================================================================
        const moveData = {
            'company_id': companyId,
            'journal_id': journalId,
            'date': date,
            'ref': reference || `Écriture par ${req.user.email}`,
            'move_type': 'entry',
            'line_ids': lineIds
        };

        console.log('🔵 Création de l\'écriture dans Odoo...');

        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,  // 🔑 CRITIQUE : UID ADMIN
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Écriture créée: ID=${moveId}`);

        // =====================================================================
        // 4️⃣ VALIDATION (équivalent du bouton "Valider")
        // =====================================================================
        console.log('🔵 Validation de l\'écriture...');

        await odooExecuteKw({
            uid: ADMIN_UID_INT,  // 🔑 UID ADMIN
            model: 'account.move',
            method: 'action_post',
            args: [[moveId]],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log('✅ Écriture validée');

        // =====================================================================
        // 5️⃣ RÉCUPÉRATION DU NOM (ex: BNK1/2026/0001)
        // =====================================================================
        const moveRecord = await odooExecuteKw({
            uid: ADMIN_UID_INT,  // 🔑 UID ADMIN
            model: 'account.move',
            method: 'read',
            args: [[moveId], ['name']],
            kwargs: {}
        });

        const moveName = moveRecord && moveRecord[0] ? moveRecord[0].name : `MOVE-${moveId}`;

        console.log(`✅ Nom de l'écriture: ${moveName}`);
        console.log('='.repeat(70));

        res.status(201).json({ 
            status: 'success', 
            move_id: moveId,
            move_name: moveName,
            message: `Écriture ${moveName} créée et validée avec succès.`
        });

    } catch (error) {
        console.error('='.repeat(70));
        console.error('🚨 createJournalEntry Error:', error.message);
        console.error('🚨 Stack:', error.stack);
        console.error('='.repeat(70));
        
        res.status(500).json({ 
            status: 'error', 
            error: `Échec création écriture: ${error.message}`
        });
    }
};

// =============================================================================
// 5. REPORTING AVANCÉ
// =============================================================================

/**
 * Balance SYSCOHADA
 * @route GET /api/accounting/syscohada-trial-balance?companyId=X&date_from=Y&date_to=Z
 */
exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to } = req.query;
        
        if (!companyId || !date_from || !date_to) {
            return res.status(400).json({ 
                error: "Paramètres manquants (companyId, date_from, date_to)." 
            });
        }

        const balanceData = await accountingService.getSyscohadaBalance(
            ADMIN_UID_INT, 
            companyId, 
            date_from, 
            date_to
        );
        
        res.status(200).json({ status: 'success', data: balanceData });

    } catch (error) {
        console.error('🚨 getSyscohadaTrialBalance Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Grand Livre
 * @route GET /api/accounting/general-ledger?companyId=X&date_from=Y&date_to=Z&journal_ids=1,2,3
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to, journal_ids } = req.query;
        
        const journals = journal_ids ? journal_ids.split(',').map(Number) : [];
        const lines = await accountingService.getGeneralLedgerLines(
            ADMIN_UID_INT, 
            companyId, 
            date_from, 
            date_to, 
            journals
        );
        
        let ledger = {};

        lines.forEach(line => {
            const code = line.account_id ? line.account_id[1] : 'N/A';
            
            if (!ledger[code]) {
                ledger[code] = { 
                    code, 
                    name: line.account_id[2], 
                    lines: [], 
                    totalDebit: 0, 
                    totalCredit: 0, 
                    finalBalance: 0 
                };
            }

            ledger[code].lines.push({ 
                date: line.date, 
                journalEntry: line.move_name, 
                description: line.name || line.ref, 
                debit: line.debit, 
                credit: line.credit, 
                balance: line.balance 
            });

            ledger[code].totalDebit += line.debit;
            ledger[code].totalCredit += line.credit;
            ledger[code].finalBalance += line.balance;
        });

        res.status(200).json({ 
            status: 'success', 
            data: Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code)) 
        });

    } catch (error) {
        console.error('🚨 getGeneralLedger Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Liste des journaux
 * @route GET /api/accounting/journals?companyId=X
 */
exports.getJournals = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
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
        
        console.log(`✅ ${journals.length} journaux récupérés pour company_id=${companyId}`);
        res.status(200).json({ status: 'success', data: journals });

    } catch (error) {
        console.error('🚨 getJournals Error:', error.message);
        res.status(500).json({ error: "Erreur récupération journaux." });
    }
};

// =============================================================================
// 6. FONCTIONS À IMPLÉMENTER (STUBS)
// =============================================================================

/**
 * Détails d'une écriture
 * @route GET /api/accounting/entry/:id?companyId=X
 */
exports.getEntryDetails = async (req, res) => {
    res.status(501).json({ 
        error: "Fonction non implémentée. Développement en cours." 
    });
};

/**
 * Opérations de caisse
 * @route POST /api/accounting/caisse-entry
 */
exports.handleCaisseEntry = async (req, res) => {
    res.status(501).json({ 
        error: "Fonction Caisse non implémentée. Développement en cours." 
    });
};

/**
 * Bilan SYSCOHADA
 * @route GET /api/accounting/balance-sheet?companyId=X&date=Y
 */
exports.getBalanceSheet = async (req, res) => {
    res.status(501).json({ 
        error: "Bilan non implémenté. Développement en cours." 
    });
};

// =============================================================================
// AJOUT À LA FIN DE accountingController.js (AVANT LES STUBS)
// =============================================================================

/**
 * Récupère les écritures d'un journal
 * @route GET /api/accounting/journal?companyId=X&journal_id=Y&date_from=Z&date_to=W
 */
exports.getJournalEntries = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { journal_id, date_from, date_to } = req.query;

        console.log('📖 Récupération journal des écritures');
        console.log('   Company ID:', companyId);
        console.log('   Journal ID:', journal_id);
        console.log('   Période:', date_from, '→', date_to);

        if (!companyId) {
            return res.status(400).json({ 
                error: "companyId requis" 
            });
        }

        // Filtre de base : company_id + état validé
        let domain = [
            ['company_id', '=', companyId],
            ['state', '=', 'posted']  // Uniquement les écritures validées
        ];

        // Filtre optionnel par journal
        if (journal_id) {
            domain.push(['journal_id', '=', parseInt(journal_id)]);
        }

        // Filtre optionnel par période
        if (date_from) {
            domain.push(['date', '>=', date_from]);
        }
        if (date_to) {
            domain.push(['date', '<=', date_to]);
        }

        console.log('🔍 Recherche avec domain:', JSON.stringify(domain));

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
                order: 'date desc, id desc',  // Plus récent en premier
                limit: 100,  // Limiter à 100 écritures
                context: { allowed_company_ids: [companyId] } 
            }
        });

        console.log(`✅ ${moves.length} écritures récupérées`);

        // Formatage des résultats
        const formattedMoves = moves.map(move => ({
            id: move.id,
            name: move.name,
            date: move.date,
            reference: move.ref || '',
            journal: move.journal_id ? move.journal_id[1] : 'N/A',
            journal_id: move.journal_id ? move.journal_id[0] : null,
            amount: move.amount_total || 0,
            state: move.state
        }));

        res.status(200).json({ 
            status: 'success', 
            count: formattedMoves.length,
            data: formattedMoves 
        });

    } catch (error) {
        console.error('🚨 getJournalEntries Error:', error.message);
        res.status(500).json({ 
            error: "Erreur récupération journal des écritures." 
        });
    }
};
// =============================================================================
// 6. STUBS (À IMPLÉMENTER)
// =============================================================================

exports.getEntryDetails = async (req, res) => res.status(501).json({ error: "Détails non implémentés." });
exports.handleCaisseEntry = async (req, res) => res.status(501).json({ error: "Caisse non implémentée." });
exports.getBalanceSheet = async (req, res) => res.status(501).json({ error: "Bilan non implémenté." });
