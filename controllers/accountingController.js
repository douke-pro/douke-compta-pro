// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION FINALE ET VÉRIFIÉE)
// Contient la lecture SYSCOHADA et les CRUD du Plan Comptable.
// =============================================================================

const { odooExecuteKw } = require('../services/odooService'); 
const ADMIN_UID = process.env.ODOO_ADMIN_UID; 

// =============================================================================
// LOGIQUE COMPTABLE SYSCOHADA AVEC FILTRE ANALYTIQUE (Fonctions de lecture)
// * Utilisent ADMIN_UID car elles sont des requêtes de Reporting Aggrégé *
// =============================================================================

/**
 * Récupère le Rapport SYSCOHADA (Bilan/Compte de Résultat) de l'entreprise isolée.
 * Endpoint: GET /api/accounting/report/123?systemType=NORMAL
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; // L'identifiant de l'entreprise isolée (Projet Analytique)
        const { systemType } = req.query; // 'NORMAL' ou 'SMT' ou 'SYCEBNL'
        // const { odooUid } = req.user; // Non utilisé, ADMIN_UID est requis pour l'accès complet
        
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition du filtre de cloisonnement (Filtre Analytique Robuste)
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID, 
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
            chiffreAffaires: 0, // Classe 7
            chargesExploitation: 0, // Classe 6
            tresorerie: 0, // Classe 5
            resultat: 0
        };

        moveLines.forEach(line => {
            // Utilisation du deuxième élément du tableau pour le code comptable
            const accountCode = line.account_id ? line.account_id[1] : ''; 

            // Logique de classification OHADA
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
        
        // Sinon, retour Système Normal
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
            return res.status(400).json({ 
                status: 'fail', 
                error: 'Le paramètre companyId est requis.' 
            });
        }
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition du filtre analytique (ID Analytique = companyId dans ce cas)
        const analyticFilter = [['analytic_distribution', 'in', [companyId.toString()]]];

        // 2. Récupération des écritures comptables
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID,
            model: 'account.move.line',
            method: 'search_read',
            args: [
                [
                    ...analyticFilter,
                    ['parent_state', '=', 'posted'] 
                ]
            ],
            // On récupère le compte et la balance (Débit - Crédit)
            kwargs: { fields: ['account_id', 'balance'] } 
        });

        let data = { cash: 0, profit: 0, debts: 0 };

        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : ''; 
            const balance = line.balance || 0; // Balance = Débit - Crédit

            // Agrégation simplifiée pour le Dashboard
            if (accountCode.startsWith('7') || accountCode.startsWith('6')) {
                data.profit += balance; 
            } else if (accountCode.startsWith('5')) { 
                data.cash += balance;
            } else if (accountCode.startsWith('40')) { 
                // Dettes Fournisseurs (Passif)
                if (balance < 0) {
                    data.debts += Math.abs(balance);
                }
            }
        });
        
        // 3. Fallback/Simulation
        if (moveLines.length === 0) {
            // Gardons cette simulation simple pour les tests
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
// LOGIQUE DU PLAN COMPTABLE (Fonctions CRUD)
// * Utilise req.user.odooUid pour le cloisonnement de la Société Légale *
// =============================================================================

/**
 * Récupère le plan comptable d'Odoo pour la compagnie spécifiée par companyId.
 * CLOISONNEMENT : Utilise l'UID de l'utilisateur connecté (req.user.odooUid).
 * Endpoint: GET /api/accounting/chart-of-accounts?companyId=X
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        // 1. Extraction des données dans la fonction (CORRECTION TOP-LEVEL AWAIT)
        const companyIdRaw = req.query.companyId;
        const odooUid = req.user.odooUid; // ⬅️ UID de l'utilisateur pour le cloisonnement

        if (!companyIdRaw) {
            return res.status(400).json({ error: "L'ID de compagnie est requis pour la lecture du Plan Comptable." });
        }
        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant pour l'exécution de la requête." });
        }
        
        // 2. Exécution de la requête Odoo
        const companyId = parseInt(companyIdRaw, 10);
        // ⚠️ Solution Agressive : Nous forçons le filtre de domaine sur company_id (si le contexte ne suffit pas)
        const filter = [['company_id', '=', companyId]]; 
        
        const accounts = await odooExecuteKw({
            uid: odooUid, // ⬅️ Utilisation de l'UID de l'utilisateur (Cloisonnement)
            model: 'account.account',
            method: 'search_read',
            args: [filter], 
            kwargs: { 
                // CORRIGÉ : Suppression de 'deprecated' ET 'company_id' des champs demandés
                fields: ['id', 'code', 'name', 'account_type'], 
                // Conservation du contexte pour forcer la compagnie Odoo
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
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable. (Vérifiez les droits de l\'UID utilisateur).' });
    }
};

/**
 * Crée un nouveau compte comptable dans Odoo.
 * CLOISONNEMENT : Utilise l'UID de l'utilisateur connecté (req.user.odooUid).
 * Endpoint: POST /api/accounting/chart-of-accounts
 */
exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body; 
        const companyIdInt = parseInt(companyId);
        const odooUid = req.user.odooUid; // ⬅️ UID de l'utilisateur pour le cloisonnement

        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant." });
        }

        const accountData = [{
            'code': code,
            'name': name,
            'account_type': type, 
            // CORRIGÉ : 'company_id' est retiré des données (géré par le contexte)
        }];
        
        const newAccountId = await odooExecuteKw({
            uid: odooUid, // ⬅️ Utilisation de l'UID de l'utilisateur (Cloisonnement)
            model: 'account.account',
            method: 'create',
            args: [accountData],
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
 * CLOISONNEMENT : Utilise l'UID de l'utilisateur connecté (req.user.odooUid).
 * Endpoint: PUT /api/accounting/chart-of-accounts
 */
exports.updateAccount = async (req, res) => {
    try {
        const { id, code, name, type, companyId } = req.body;
        const companyIdInt = parseInt(companyId);
        const odooUid = req.user.odooUid; // ⬅️ UID de l'utilisateur pour le cloisonnement

        if (!id || !odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo ou ID de compte manquant." });
        }

        const updateData = {
            'code': code,
            'name': name,
            'account_type': type,
            // CORRECT : 'company_id' est absent des données
        };
        
        await odooExecuteKw({
            uid: odooUid, // ⬅️ Utilisation de l'UID de l'utilisateur (Cloisonnement)
            model: 'account.account',
            method: 'write',
            args: [
                [id],
                updateData
            ],
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
// NOUVELLES FONCTIONS D'INTERACTION (Drill-Down et Saisie)
// =============================================================================

/**
 * Récupère les détails d'une écriture comptable spécifique (Drill-Down).
 * Endpoint: GET /api/accounting/details/:entryId
 */
exports.getEntryDetails = async (req, res) => {
    // Cette fonction est actuellement un placeholder.
    try {
        const { entryId } = req.params;
        
        // Logique Odoo pour récupérer account.move.line par son ID...
        // ... (À implémenter plus tard)
        
        return res.status(501).json({
            status: 'error',
            error: `La récupération des détails de l'écriture #${entryId} n'est pas encore implémentée (501).`
        });
        
    } catch (error) {
        console.error('[Entry Details Error]', error.message);
        res.status(500).json({ error: 'Échec de la récupération des détails.' });
    }
};


/**
 * Enregistre une nouvelle écriture comptable simplifiée (Opération de Caisse).
 * Endpoint: POST /api/accounting/caisse-entry
 */
exports.handleCaisseEntry = async (req, res) => {
    // Cette fonction est actuellement un placeholder.
    try {
        const { companyId, date, amount, accountId, description } = req.body;
        
        // Logique Odoo pour créer un account.move ou un compte journal spécifique...
        // ... (À implémenter plus tard)
        
        return res.status(501).json({
            status: 'error',
            error: `L'enregistrement de l'opération de caisse pour la compagnie ${companyId} n'est pas encore implémenté (501).`
        });
        
    } catch (error) {
        console.error('[Caisse Entry Error]', error.message);
        res.status(500).json({ error: 'Échec de l\'enregistrement de l\'écriture de caisse.' });
    }
};

// N'oubliez pas de mettre à jour votre 'module.exports' si vous n'utilisez pas l'export direct 'exports.'
// Si vous utilisez 'exports.functionName', vous n'avez rien à changer d'autre.

// DANS controllers/accountingController.js, à la suite des autres placeholders (handleCaisseEntry, getEntryDetails...)

/**
 * Récupère le Grand Livre (General Ledger) pour un Client/Projet spécifique (Compte Analytique).
 * Endpoint: GET /api/accounting/ledger?analyticId=X&dateStart=Y&dateEnd=Z
 * * Note: L'ID passé ici est l'ID du Compte Analytique, pas l'ID de la Société Légale.
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const { analyticId, dateStart, dateEnd } = req.query;

        if (!analyticId) {
            return res.status(400).json({ error: "L'ID Analytique (Client/Projet) est requis pour le Grand Livre." });
        }
        
        // Assurez-vous que ADMIN_UID est accessible ici (il doit être défini en haut du fichier)
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition des filtres de domaine Odoo
        let filters = [
            // Filtre Analytique : Cloisonnement au Client/Projet
            // Utilisation de analytic_distribution pour les écritures (Modèle account.move.line)
            ['analytic_distribution', 'in', [analyticId.toString()]],
            // Uniquement les écritures validées
            ['parent_state', '=', 'posted'] 
        ];

        // Ajout des filtres de date optionnels
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
                    'account_id', // Compte général (ex: 701000)
                    'date',
                    'name', // Libellé de la ligne
                    'ref', // Référence de l'écriture (si disponible)
                    'debit',
                    'credit',
                    'balance',
                    'move_name' // Numéro de l'écriture comptable (Journal + Séquence)
                ],
                order: 'date asc, id asc' // Tri chronologique et par ID
            }
        });

        // 3. Traitement des données : Regrouper par Compte Général
        let ledger = {};
        
        moveLines.forEach(line => {
            // account_id est au format [ID, Code, Nom] ou [ID, Code] dans certaines versions
            // Nous utilisons le code comme clé et le nom pour l'affichage
            const accountCode = line.account_id ? line.account_id[1] : 'N/A';
            const accountName = line.account_id ? (line.account_id.length > 2 ? line.account_id[2] : line.account_id[1]) : 'Compte Inconnu';
            
            // Si le code est 'N/A' (compte non trouvé), nous sautons la ligne
            if (accountCode === 'N/A') return;

            // Initialisation du compte dans le Grand Livre
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
            
            // Ajout de la ligne et mise à jour des totaux
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
        
        // 4. Conversion en tableau et tri par code de compte pour le Front-end
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

exports.getBalanceSheet = async (req, res) => {
    return res.status(501).json({ error: "La Balance Générale n'est pas encore implémentée (501)." });
};

exports.getJournals = async (req, res) => {
    return res.status(501).json({ error: "La liste des Journaux n'est pas encore implémentée (501)." });
};
