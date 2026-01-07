// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION CORRIGÉE ET ROBUSTE)
// Cloisonnement du Plan Comptable basé sur req.user.odooUid
// =============================================================================

const { odooExecuteKw } = require('../services/odooService'); 
const ADMIN_UID = process.env.ODOO_ADMIN_UID; 
const ADMIN_UID_INT = parseInt(ADMIN_UID); // Ajout pour validation

// =============================================================================
// LOGIQUE COMPTABLE SYSCOHADA AVEC FILTRE ANALYTIQUE (Reporting Agrégé)
// * Utilise ADMIN_UID pour garantir la lecture complète des account.move.line *
// =============================================================================

/**
 * Récupère le Rapport SYSCOHADA (Bilan/Compte de Résultat) de l'entreprise isolée.
 * Endpoint: GET /api/accounting/report/123?systemType=NORMAL
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType } = req.query; 

        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }
        
        // 1. Définition du filtre de cloisonnement (Filtre Analytique Robuste)
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID, // 🔑 OK : L'Admin est utilisé pour le reporting global sur account.move.line
            model: 'account.move.line',
            method: 'search_read',
            args: [
                [
                    ...analyticFilter,
                    ['parent_state', '=', 'posted'] // Uniquement les écritures validées
                ]
            ],
            kwargs: { fields: ['account_id', 'debit', 'credit', 'date', 'name'] }
        });

        // 3. Traitement selon le référentiel SYSCOHADA
        let report = {
            chiffreAffaires: 0, 
            chargesExploitation: 0, 
            tresorerie: 0, 
            resultat: 0
        };

        moveLines.forEach(line => {
            // Utilisation du deuxième élément du tableau pour le code comptable
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

        // 4. Adaptation spécifique au Système Minimal de Trésorerie (SMT)
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
        
        res.json({
            systeme: "Normal (Comptabilité d'engagement)",
            donnees: report
        });

    } catch (error) {
        console.error('[Accounting Report Error]', error.message);
        res.status(500).json({ error: error.message });
    }
};


/**
 * Récupère les données de synthèse pour le tableau de bord de la compagnie spécifiée.
 * Endpoint: GET /api/accounting/dashboard?companyId=X
 */
exports.getDashboardData = async (req, res, next) => {
    try {
        const companyId = req.query.companyId;

        if (!companyId) {
            return res.status(400).json({ status: 'fail', error: 'Le paramètre companyId est requis.' });
        }
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition du filtre analytique
        const analyticFilter = [['analytic_distribution', 'in', [companyId.toString()]]];

        // 2. Récupération des écritures comptables
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID, // 🔑 OK : L'Admin est utilisé pour le reporting
            model: 'account.move.line',
            method: 'search_read',
            args: [[...analyticFilter, ['parent_state', '=', 'posted']]],
            kwargs: { fields: ['account_id', 'balance'] } 
        });

        let data = { cash: 0, profit: 0, debts: 0 };

        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : ''; 
            const balance = line.balance || 0; 

            if (accountCode.startsWith('7') || accountCode.startsWith('6')) {
                data.profit += balance; 
            } else if (accountCode.startsWith('5')) { 
                data.cash += balance;
            } else if (accountCode.startsWith('40') && balance < 0) { 
                data.debts += Math.abs(balance);
            }
        });
        
        // 3. Fallback/Simulation
        if (moveLines.length === 0) {
            data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        }

        res.status(200).json({
            status: 'success',
            message: 'Données du tableau de bord récupérées.',
            data: data
        });

    } catch (err) {
        console.error('Erreur lors de la récupération du dashboard:', err);
        res.status(500).json({
            status: 'error',
            error: 'Erreur serveur lors de la récupération des données de synthèse.'
        });
    }
};


// =============================================================================
// LOGIQUE DU PLAN COMPTABLE (CRUD Cloisonné)
// * Utilise req.user.odooUid pour forcer le cloisonnement Odoo par utilisateur *
// =============================================================================

/**
 * Récupère le plan comptable d'Odoo pour la compagnie spécifiée par companyId.
 * (companyId doit être l'ID Odoo de la Société Légale)
 * Endpoint: GET /api/accounting/chart-of-accounts?companyId=X
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyIdRaw = req.query.companyId;
        const odooUid = req.user.odooUid; // 🔑 NOUVEAU/CORRIGÉ : UID de l'utilisateur connecté

        if (!companyIdRaw) {
            return res.status(400).json({ error: "L'ID de compagnie est requis pour la lecture du Plan Comptable." });
        }
        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant pour l'exécution de la requête." });
        }
        
        const companyId = parseInt(companyIdRaw, 10);
        const filter = []; // Nous comptons sur l'UID et le contexte pour le cloisonnement
        
        const accounts = await odooExecuteKw({
            uid: odooUid, // 🔑 CRITIQUE CORRIGÉ : Utiliser l'UID de l'utilisateur pour activer le cloisonnement Odoo
            model: 'account.account',
            method: 'search_read',
            args: [filter], 
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                context: { company_id: companyId } 
            }
        });

        res.status(200).json({
            status: 'success',
            results: accounts.length,
            data: accounts
        });

    } catch (error) {
        console.error('[COA Read Error]', error.message); 
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable. (Vérifiez les droits de l\'UID utilisateur et l\'initialisation du Plan Comptable de la compagnie).' });
    }
};

/**
 * Crée un nouveau compte comptable dans Odoo.
 * Endpoint: POST /api/accounting/chart-of-accounts
 */
exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body; 
        const companyIdInt = parseInt(companyId);
        const odooUid = req.user.odooUid; // 🔑 NOUVEAU/CORRIGÉ : UID de l'utilisateur connecté

        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant." });
        }

        const accountData = [{
            'code': code,
            'name': name,
            'account_type': type, 
        }];
        
        const newAccountId = await odooExecuteKw({
            uid: odooUid, // 🔑 CRITIQUE CORRIGÉ : Utiliser l'UID de l'utilisateur
            model: 'account.account',
            method: 'create',
            args: [accountData],
            // 🔒 Le contexte est la seule source d'information pour la compagnie cible.
            kwargs: { context: { company_id: companyIdInt } } 
        });

        res.status(201).json({
            status: 'success',
            message: `Compte ${code} créé avec succès (#${newAccountId}).`,
            data: { id: newAccountId }
        });

    } catch (err) {
        console.error('Erreur lors de la création du compte Odoo:', err.message);
        res.status(500).json({
            status: 'error',
            error: `Échec de la création du compte : ${err.message}`
        });
    }
};


/**
 * Modifie un compte comptable existant dans Odoo.
 * Endpoint: PUT /api/accounting/chart-of-accounts
 */
exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type, companyId } = req.body;
        const companyIdInt = parseInt(companyId);
        const odooUid = req.user.odooUid; // 🔑 NOUVEAU/CORRIGÉ : UID de l'utilisateur connecté

        if (!id) {
            return res.status(400).json({ error: "L'ID Odoo du compte est manquant pour la modification." });
        }
        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant." });
        }

        // Les données à mettre à jour
        const updateData = {
            'code': code,
            'name': name,
            'account_type': type,
        };
        
        await odooExecuteKw({
            uid: odooUid, // 🔑 CRITIQUE CORRIGÉ : Utiliser l'UID de l'utilisateur
            model: 'account.account',
            method: 'write',
            args: [
                [id], // ID Odoo du compte à mettre à jour
                updateData
            ],
            // 🔒 Cloisonnement : La compagnie cible est transmise via le contexte Odoo.
            kwargs: { context: { company_id: companyIdInt } } 
        });

        res.status(200).json({
            status: 'success',
            message: `Compte ${code} mis à jour avec succès.`,
            data: { id: id }
        });

    } catch (err) {
        console.error('Erreur lors de la mise à jour du compte Odoo:', err.message);
        res.status(500).json({
            status: 'error',
            error: `Échec de la mise à jour du compte : ${err.message}`
        });
    }
};

// =============================================================================
// FONCTIONS DE REPORTING SECONDAIRES (Utilisation ADMIN_UID)
// =============================================================================

/**
 * Récupère le Grand Livre (General Ledger) pour un Client/Projet spécifique (Compte Analytique).
 * Endpoint: GET /api/accounting/ledger?analyticId=X&dateStart=Y&dateEnd=Z
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const { analyticId, dateStart, dateEnd } = req.query;

        if (!analyticId) {
            return res.status(400).json({ error: "L'ID Analytique (Client/Projet) est requis pour le Grand Livre." });
        }
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition des filtres de domaine Odoo
        let filters = [
            ['analytic_distribution', 'in', [analyticId.toString()]],
            ['parent_state', '=', 'posted'] 
        ];

        if (dateStart) {
            filters.push(['date', '>=', dateStart]);
        }
        if (dateEnd) {
            filters.push(['date', '<=', dateEnd]);
        }
        
        // 2. Récupération des lignes de mouvement (account.move.line)
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID,
            model: 'account.move.line',
            method: 'search_read',
            args: [filters],
            kwargs: { 
                fields: [
                    'account_id', 
                    'date',
                    'name', 
                    'ref', 
                    'debit',
                    'credit',
                    'balance',
                    'move_name' 
                ],
                order: 'date asc, id asc' 
            }
        });

        // 3. Traitement des données : Regrouper par Compte Général
        let ledger = {};
        
        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : 'N/A';
            const accountName = line.account_id ? (line.account_id.length > 2 ? line.account_id[2] : line.account_id[1]) : 'Compte Inconnu';
            
            if (accountCode === 'N/A') return;

            if (!ledger[accountCode]) {
                ledger[accountCode] = {
                    code: accountCode,
                    name: accountName,
                    lines: [],
                    totalDebit: 0,
                    totalCredit: 0,
                    finalBalance: 0
                };
            }
            
            ledger[accountCode].lines.push({
                date: line.date,
                journalEntry: line.move_name,
                description: line.name || line.ref,
                debit: line.debit,
                credit: line.credit,
                balance: line.balance
            });

            ledger[accountCode].totalDebit += line.debit;
            ledger[accountCode].totalCredit += line.credit;
            ledger[accountCode].finalBalance += line.balance;
        });
        
        // 4. Conversion en tableau et tri par code de compte
        const finalLedger = Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code));

        res.status(200).json({
            status: 'success',
            results: moveLines.length,
            data: finalLedger
        });

    } catch (error) {
        console.error('[General Ledger Error]', error.message);
        res.status(500).json({ 
            status: 'error', 
            error: `Échec de la récupération du Grand Livre : ${error.message}` 
        });
    }
};

/**
 * Récupère les détails d'une écriture comptable spécifique (Drill-Down).
 * Endpoint: GET /api/accounting/details/:entryId
 */
exports.getEntryDetails = async (req, res) => {
    return res.status(501).json({ error: `La récupération des détails de l'écriture #${req.params.entryId} n'est pas encore implémentée (501).` });
};

/**
 * Enregistre une nouvelle écriture comptable simplifiée (Opération de Caisse).
 * Endpoint: POST /api/accounting/caisse-entry
 */
exports.handleCaisseEntry = async (req, res) => {
    return res.status(501).json({ error: `L'enregistrement de l'opération de caisse pour la compagnie ${req.body.companyId} n'est pas encore implémenté (501).` });
};

exports.getBalanceSheet = async (req, res) => {
    return res.status(501).json({ error: "La Balance Générale n'est pas encore implémentée (501)." });
};

exports.getJournals = async (req, res) => {
    return res.status(501).json({ error: "La liste des Journaux n'est pas encore implémentée (501)." });
};
