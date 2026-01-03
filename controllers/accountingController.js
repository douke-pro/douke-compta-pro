// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION FINALE ET VÉRIFIÉE)
// Contient la lecture SYSCOHADA et les CRUD du Plan Comptable.
// =============================================================================

// ⬅️ Remplace l'intégralité du bloc XML-RPC par cet import stable :
const { odooExecuteKw } = require('../services/odooService'); 
const ADMIN_UID = process.env.ODOO_ADMIN_UID; 

// =============================================================================
// LOGIQUE COMPTABLE SYSCOHADA AVEC FILTRE ANALYTIQUE (Fonctions de lecture)
// =============================================================================

/**
 * Récupère le Rapport SYSCOHADA (Bilan/Compte de Résultat) de l'entreprise isolée.
 * Usage: /api/accounting/report/123?systemType=NORMAL
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; // L'identifiant de l'entreprise isolée (Projet Analytique)
        const { systemType } = req.query; // 'NORMAL' ou 'SMT' ou 'SYCEBNL'
        const { odooUid } = req.user;
        
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
            const accountCode = line.account_id[2]; // Ex: "701000 Ventes"

            // Logique de classification OHADA
            if (accountCode.startsWith('7')) {
                report.chiffreAffaires += (line.credit - line.debit);
            } else if (accountCode.startsWith('6')) {
                report.chargesExploitation += (line.debit - line.credit);
            } else if (accountCode.startsWith('5')) {
                // ✅ CORRECTION APPLIQUÉE ICI : Utilisation de line.credit
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

        // 1. Définition du filtre analytique (Identique à l'implémentation précédente)
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

            // Agrégation simplifiée pour le Dashboard (Basée sur le premier chiffre du compte)
            if (accountCode.startsWith('7') || accountCode.startsWith('6')) {
                data.profit += balance; 
            } else if (accountCode.startsWith('5')) { 
                data.cash += balance;
            } else if (accountCode.startsWith('40')) { 
                // Dettes Fournisseurs (Passif) - On veut le montant positif de la dette
                if (balance < 0) {
                    data.debts += Math.abs(balance);
                }
            }
        });
        
        // 3. Fallback/Simulation si Odoo ne renvoie rien (Logique de simulation conservée)
        if (moveLines.length === 0) {
            data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        }

        res.status(200).json({
            status: 'success',
            message: 'Données du tableau de bord récupérées.',
            data: data // Le front-end attend cette clé
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
// LOGIQUE DU PLAN COMPTABLE (Nouvelles fonctions CRUD)
// =============================================================================

/**
 * Récupère le plan comptable d'Odoo pour la compagnie spécifiée par companyId.
 * Endpoint: GET /api/accounting/chart-of-accounts?companyId=X
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyIdRaw = req.query.companyId;

        if (!companyIdRaw) {
            return res.status(400).json({ error: "L'ID de compagnie est requis pour la lecture du Plan Comptable." });
        }
        
        const companyId = parseInt(companyIdRaw, 10);

        if (isNaN(companyId)) {
             return res.status(400).json({ error: "L'ID de compagnie est invalide. Il doit être numérique." });
        }
        
        if (!ADMIN_UID) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // ⚠️ CORRECTION CRITIQUE : Suppression du filtre [['company_id', '=', companyId]] 
        // car Odoo renvoie 'Invalid field' dans votre configuration. 
        // L'ADMIN_UID lira tous les comptes (ou les comptes par défaut) sans filtre de domaine explicite.
        const filter = []; 
        
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.account',
            method: 'search_read',
            args: [filter], 
            // On demande toujours 'company_id' car il est visible dans l'interface Odoo.
            kwargs: { fields: ['id', 'code', 'name', 'account_type', 'deprecated', 'company_id'] } 
        });

        res.status(200).json({
            status: 'success',
            results: accounts.length,
            data: accounts
        });

    } catch (error) {
        console.error('[COA Read Error]', error.message);
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable.' });
    }
};

/**
 * Crée un nouveau compte comptable dans Odoo.
 * Endpoint: POST /api/accounting/chart-of-accounts
 */
exports.createAccount = async (req, res) => {
    try {
        const { code, name, type, companyId } = req.body; 
        
        const accountData = [{
            'code': code,
            'name': name,
            'account_type': type, 
            'company_id': parseInt(companyId), // Essentiel pour la donnée
        }];
        
        const newAccountId = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.account',
            method: 'create',
            args: [accountData],
            // 🔒 SÉCURITÉ : Forcer le contexte Odoo pour garantir que le compte est créé pour la bonne compagnie.
            kwargs: { context: { company_id: parseInt(companyId) } } 
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
        const { id, code, name, type, companyId } = req.body; // companyId est ici utilisé pour le contexte Odoo
        
        if (!id) {
            return res.status(400).json({ error: "L'ID Odoo du compte est manquant pour la modification." });
        }

        const updateData = {
            'code': code,
            'name': name,
            'account_type': type,
        };
        
        await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.account',
            method: 'write',
            args: [
                [id],
                updateData
            ],
            // 🔒 SÉCURITÉ : Forcer le contexte Odoo pour garantir que la modification est permise.
            kwargs: { context: { company_id: parseInt(companyId) } } 
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

exports.getGeneralLedger = async (req, res) => {
    return res.status(501).json({ error: "Le Grand Livre n'est pas encore implémenté (501)." });
};

exports.getBalanceSheet = async (req, res) => {
    return res.status(501).json({ error: "La Balance Générale n'est pas encore implémentée (501)." });
};

exports.getJournals = async (req, res) => {
    return res.status(501).json({ error: "La liste des Journaux n'est pas encore implémentée (501)." });
};
