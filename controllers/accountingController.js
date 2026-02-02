// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION PRODUCTION FINALE)
// Description : Gestion Comptable SYSCOHADA Multi-Tenant Sécurisée
// Architecture : UID Admin Unique + Isolation stricte par company_id
// Auteur : Doukè Compta Pro Team
// Date : Février 2026
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

/**
 * Récupère les KPI du tableau de bord
 * @route GET /api/accounting/dashboard?companyId=X
 * @access Private
 */
exports.getDashboardData = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        
        console.log(`📈 [getDashboardData] Company ID: ${companyId}`);

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
            
            if (code.startsWith('7')) {
                data.profit += (line.credit - line.debit);
            } else if (code.startsWith('6')) {
                data.profit -= (line.debit - line.credit);
            }
            
            if (code.startsWith('5')) {
                data.cash += bal;
            } else if (code.startsWith('40') && bal < 0) {
                data.debts += Math.abs(bal);
            }
        });

        if (moveLines.length === 0) {
            console.log('⚠️ Aucune donnée, utilisation valeurs de démonstration');
            data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        }

        console.log(`✅ Dashboard: ${moveLines.length} lignes analysées`);
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
        console.log('   User:', req.user.email, `(${req.user.role})`);
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
            'ref': reference || `Écriture ${req.user.email}`,
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
            ['state', '=', 'posted']  // Uniquement les écritures validées
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

        // 🔑 FORMATAGE POUR LE FRONTEND (format compatible avec generateJournalHTML)
        const entries = moves.map(move => ({
            id: move.id,
            date: move.date,
            libelle: move.ref || move.name,  // ← 🔑 "libelle" au lieu de "reference"
            journal: move.journal_id ? move.journal_id[1] : 'N/A',
            debit: move.amount_total && move.amount_total > 0 ? move.amount_total : 0,
            credit: move.amount_total && move.amount_total < 0 ? Math.abs(move.amount_total) : 0,
            status: move.state === 'posted' ? 'Validé' : 'Brouillon'  // ← 🔑 "status" avec majuscule
        }));

        // 🔑 FORMAT ATTENDU PAR LE FRONTEND
        res.status(200).json({ 
            status: 'success',
            results: entries.length,  // ← Nombre de résultats
            data: {
                entries: entries  // ← 🔑 Clé "entries" importante
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
// 6. REPORTING AVANCÉ
// =============================================================================

/**
 * Balance SYSCOHADA
 * @route GET /api/accounting/trial-balance?companyId=X&date_from=Y&date_to=Z
 * @access Private
 */
exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to } = req.query;
        
        console.log(`⚖️ [getSyscohadaTrialBalance] Company: ${companyId}, Période: ${date_from} → ${date_to}`);

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
        
        console.log(`✅ Balance générée`);

        res.status(200).json({ 
            status: 'success', 
            data: balanceData 
        });

    } catch (error) {
        console.error('🚨 getSyscohadaTrialBalance Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Grand Livre
 * @route GET /api/accounting/ledger?companyId=X&date_from=Y&date_to=Z&journal_ids=1,2,3
 * @access Private
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date_from, date_to, journal_ids } = req.query;
        
        console.log(`📗 [getGeneralLedger] Company: ${companyId}, Journaux: ${journal_ids || 'Tous'}`);

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

        console.log(`✅ Grand livre: ${Object.keys(ledger).length} comptes`);

        res.status(200).json({ 
            status: 'success', 
            data: Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code)) 
        });

    } catch (error) {
        console.error('🚨 getGeneralLedger Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// =============================================================================
// 7. DÉTAILS D'UNE ÉCRITURE COMPTABLE
// =============================================================================

/**
 * Récupère les détails complets d'une écriture avec ses lignes
 * @route GET /api/accounting/entry/:id?companyId=X
 */
exports.getEntryDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

        console.log(`📄 Récupération détails écriture ID=${id} pour company_id=${companyId}`);

        if (!id || !companyId) {
            return res.status(400).json({ 
                error: "ID d'écriture et companyId requis." 
            });
        }

        const moveId = parseInt(id);

        // 1️⃣ Vérification de sécurité : L'écriture appartient-elle à cette entreprise ?
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
            console.error(`🚨 TENTATIVE CROSS-COMPANY : Écriture ${moveId} n'appartient pas à company_id=${companyId}`);
            return res.status(403).json({ 
                error: "Accès refusé. Cette écriture n'appartient pas à votre entreprise." 
            });
        }

        // 2️⃣ Récupération des informations principales de l'écriture
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

        // 3️⃣ Récupération des lignes d'écriture (account.move.line)
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

        // 4️⃣ Formatage des lignes
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

        // 5️⃣ Calcul des totaux
        const totalDebit = formattedLines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = formattedLines.reduce((sum, l) => sum + l.credit, 0);

        // 6️⃣ Réponse finale
        const response = {
            status: 'success',
            data: {
                id: move.id,
                name: move.name,
                date: move.date,
                reference: move.ref || '',
                journal: move.journal_id ? move.journal_id[1] : 'N/A',
                journal_id: move.journal_id ? move.journal_id[0] : null,
                state: move.state,
                state_label: move.state === 'posted' ? 'Validé' : move.state === 'draft' ? 'Brouillon' : 'Autre',
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
        };

        console.log(`✅ Écriture ${move.name} récupérée avec ${formattedLines.length} lignes`);

        res.status(200).json(response);

    } catch (error) {
        console.error('🚨 getEntryDetails Error:', error.message);
        res.status(500).json({ 
            error: `Erreur récupération détails : ${error.message}` 
        });
    }
};

// =============================================================================
// 8. OPÉRATION DE CAISSE (RECETTE/DÉPENSE)
// =============================================================================

/**
 * Enregistre une opération de caisse simplifiée (Recette ou Dépense)
 * @route POST /api/accounting/caisse-entry
 */
exports.handleCaisseEntry = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const { type, contraAccountCode, libelle, amount } = req.body;

        console.log('💰 Opération de caisse:', { 
            type, 
            contraAccountCode, 
            libelle, 
            amount, 
            companyId 
        });

        // Validation
        if (!companyId || !type || !contraAccountCode || !libelle || !amount) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Données incomplètes (type, contraAccountCode, libelle, amount, companyId requis).' 
            });
        }

        if (!['RECETTE', 'DEPENSE'].includes(type)) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Type invalide. Doit être RECETTE ou DEPENSE.' 
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ 
                status: 'error',
                error: 'Le montant doit être positif.' 
            });
        }

        // 1️⃣ MAPPING contraAccountCode → account_id
        console.log(`🔍 Recherche du compte de contrepartie "${contraAccountCode}"...`);

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
            console.error(`❌ Compte "${contraAccountCode}" introuvable`);
            return res.status(400).json({ 
                status: 'error',
                error: `Compte "${contraAccountCode}" introuvable.` 
            });
        }

        const contraAccountId = contraAccountSearch[0].id;
        const contraAccountName = contraAccountSearch[0].name;

        console.log(`✅ Compte contrepartie : ${contraAccountName} (ID: ${contraAccountId})`);

        // 2️⃣ Récupération du compte de caisse (571000 - Caisse en SYSCOHADA)
        console.log(`🔍 Recherche du compte Caisse (571000)...`);

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
            console.error(`❌ Compte Caisse (571000) introuvable`);
            return res.status(400).json({ 
                status: 'error',
                error: 'Compte Caisse (571000) introuvable. Veuillez le créer dans le plan comptable.' 
            });
        }

        const caisseAccountId = caisseAccountSearch[0].id;
        const caisseAccountName = caisseAccountSearch[0].name;

        console.log(`✅ Compte Caisse : ${caisseAccountName} (ID: ${caisseAccountId})`);

        // 3️⃣ Récupération du journal de caisse
        console.log(`🔍 Recherche du journal de Caisse...`);

        const journalSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[['type', '=', 'cash'], ['company_id', '=', companyId]]],
            kwargs: { 
                fields: ['id', 'name', 'code'], 
                limit: 1,
                context: { allowed_company_ids: [companyId] } 
            }
        });

        if (!journalSearch || journalSearch.length === 0) {
            console.error(`❌ Journal de Caisse introuvable`);
            return res.status(400).json({ 
                status: 'error',
                error: 'Journal de Caisse introuvable. Veuillez créer un journal de type "Caisse".' 
            });
        }

        const journalId = journalSearch[0].id;
        const journalName = journalSearch[0].name;

        console.log(`✅ Journal : ${journalName} (ID: ${journalId})`);

        // 4️⃣ Construction des lignes selon le type
        let lineIds;

        if (type === 'RECETTE') {
            // RECETTE : Caisse au débit, Contrepartie au crédit
            lineIds = [
                [0, 0, {
                    account_id: caisseAccountId,
                    name: libelle,
                    debit: parseFloat(amount),
                    credit: 0
                }],
                [0, 0, {
                    account_id: contraAccountId,
                    name: libelle,
                    debit: 0,
                    credit: parseFloat(amount)
                }]
            ];
        } else {
            // DÉPENSE : Contrepartie au débit, Caisse au crédit
            lineIds = [
                [0, 0, {
                    account_id: contraAccountId,
                    name: libelle,
                    debit: parseFloat(amount),
                    credit: 0
                }],
                [0, 0, {
                    account_id: caisseAccountId,
                    name: libelle,
                    debit: 0,
                    credit: parseFloat(amount)
                }]
            ];
        }

        // 5️⃣ Création de l'écriture
        const moveData = {
            company_id: companyId,
            journal_id: journalId,
            date: new Date().toISOString().split('T')[0], // Date du jour
            ref: `${type} - ${libelle}`,
            move_type: 'entry',
            line_ids: lineIds
        };

        console.log('🔵 Création de l\'écriture de caisse...');

        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log(`✅ Écriture créée : ID=${moveId}`);

        // 6️⃣ Validation automatique
        console.log('🔵 Validation de l\'écriture...');

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'action_post',
            args: [[moveId]],
            kwargs: { context: { allowed_company_ids: [companyId] } }
        });

        console.log('✅ Écriture validée');

        // 7️⃣ Récupération du nom
        const moveRecord = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'read',
            args: [[moveId], ['name']],
            kwargs: {}
        });

        const moveName = moveRecord && moveRecord[0] ? moveRecord[0].name : `CAISSE-${moveId}`;

        console.log(`✅ Opération caisse enregistrée : ${moveName}`);

        res.status(201).json({ 
            status: 'success', 
            move_id: moveId,
            move_name: moveName,
            type: type,
            amount: parseFloat(amount),
            message: `${type} de ${parseFloat(amount).toLocaleString('fr-FR')} XOF enregistrée avec succès.`
        });

    } catch (error) {
        console.error('🚨 handleCaisseEntry Error:', error.message);
        console.error('🚨 Stack:', error.stack);
        
        res.status(500).json({ 
            status: 'error', 
            error: `Échec opération caisse : ${error.message}` 
        });
    }
};

// =============================================================================
// 9. BILAN SYSCOHADA
// =============================================================================

/**
 * Génère le bilan comptable SYSCOHADA (Actif/Passif)
 * @route GET /api/accounting/balance-sheet?companyId=X&date=YYYY-MM-DD
 */
exports.getBalanceSheet = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);
        const { date } = req.query;

        console.log(`📊 Génération du Bilan pour company_id=${companyId} à la date ${date || 'aujourd\'hui'}`);

        if (!companyId) {
            return res.status(400).json({ 
                error: "companyId requis." 
            });
        }

        // Date par défaut : aujourd'hui
        const balanceDate = date || new Date().toISOString().split('T')[0];

        // 1️⃣ Récupération de tous les comptes avec leurs soldes
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

        // 2️⃣ Récupération des lignes d'écriture validées jusqu'à la date
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

        console.log(`📋 ${moveLines.length} lignes d'écriture analysées`);

        // 3️⃣ Calcul des soldes par compte
        const accountBalances = {};

        moveLines.forEach(line => {
            const accountId = line.account_id ? line.account_id[0] : null;
            if (!accountId) return;

            if (!accountBalances[accountId]) {
                accountBalances[accountId] = {
                    debit: 0,
                    credit: 0,
                    balance: 0
                };
            }

            accountBalances[accountId].debit += line.debit || 0;
            accountBalances[accountId].credit += line.credit || 0;
            accountBalances[accountId].balance += line.balance || 0;
        });

        // 4️⃣ Classification SYSCOHADA
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
            const accountData = {
                code: code,
                name: account.name,
                balance: balance.balance
            };

            // Classification selon SYSCOHADA
            if (code.startsWith('2')) {
                // Classe 2 : Actif Immobilisé
                bilan.actif.immobilise.accounts.push(accountData);
                bilan.actif.immobilise.total += balance.balance;
            } else if (code.startsWith('3') || code.startsWith('4')) {
                // Classe 3/4 : Actif/Passif Circulant
                if (balance.balance > 0) {
                    bilan.actif.circulant.accounts.push(accountData);
                    bilan.actif.circulant.total += balance.balance;
                } else {
                    bilan.passif.dettes.accounts.push(accountData);
                    bilan.passif.dettes.total += Math.abs(balance.balance);
                }
            } else if (code.startsWith('5')) {
                // Classe 5 : Trésorerie
                if (balance.balance > 0) {
                    bilan.actif.tresorerie.accounts.push(accountData);
                    bilan.actif.tresorerie.total += balance.balance;
                } else {
                    bilan.passif.tresorerie.accounts.push(accountData);
                    bilan.passif.tresorerie.total += Math.abs(balance.balance);
                }
            } else if (code.startsWith('1')) {
                // Classe 1 : Capitaux Propres
                bilan.passif.capitaux.accounts.push(accountData);
                bilan.passif.capitaux.total += Math.abs(balance.balance);
            }
        });

        // 5️⃣ Calcul des totaux généraux
        const totalActif = bilan.actif.immobilise.total + 
                          bilan.actif.circulant.total + 
                          bilan.actif.tresorerie.total;

        const totalPassif = bilan.passif.capitaux.total + 
                           bilan.passif.dettes.total + 
                           bilan.passif.tresorerie.total;

        console.log(`✅ Bilan généré - Actif: ${totalActif.toLocaleString()} | Passif: ${totalPassif.toLocaleString()}`);

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
            error: `Erreur génération bilan : ${error.message}` 
        });
    }
};
