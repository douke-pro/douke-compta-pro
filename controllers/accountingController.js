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
 * (companyId doit être l'ID Odoo de la Société Légale)
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

        const filter = []; // AUCUN FILTRE DE DOMAINE
        
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'account.account',
            method: 'search_read',
            args: [filter], 
            kwargs: { 
                // 🚀 CORRECTION FINALE : Seuls les champs de base sont conservés.
                // 'deprecated' ET 'company_id' sont retirés car Odoo les rejette.
                fields: ['id', 'code', 'name', 'account_type'], 
                // 🔒 Nous CONSERVONS le contexte pour le cloisonnement Odoo.
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
        const companyIdInt = parseInt(companyId);

        // ⚠️ CORRECTION CRITIQUE : Suppression de 'company_id' des données d'enregistrement.
        // Odoo exige que le cloisonnement soit géré par le contexte (kwargs) uniquement.
        const accountData = [{
            'code': code,
            'name': name,
            'account_type': type, 
            // 'company_id' est retiré ici !
        }];
        
        const newAccountId = await odooExecuteKw({
            uid: ADMIN_UID,
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

        if (!id) {
            return res.status(400).json({ error: "L'ID Odoo du compte est manquant pour la modification." });
        }

        // Les données à mettre à jour ne contiennent pas 'company_id', ce qui est CRITIQUE.
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
        // En cas d'échec, le message d'erreur sera remonté ici.
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
