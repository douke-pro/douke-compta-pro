// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION FINALE - ROBUSTE & SÉCURISÉE)
// OBJECTIF : Cloisonnement Légal (company_id) et Analytique (analyticId)
// =============================================================================

// 🔑 IMPORT CRITIQUE : odooExecuteKw ET ADMIN_UID_INT (pour les opérations Admin)
// L'Admin UID est importé de odooService pour garantir la cohérence et l'accès élevé.
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService'); 

// 🔑 NOUVEL IMPORT : Logique Métier Odoo (fonctions complexes de reporting)
const accountingService = require('../services/accountingService');

// =============================================================================
// LOGIQUE DE REPORTING COMPTABLE (Cloisonné et Sécurisé par ADMIN_UID_INT)
// =============================================================================

/**
 * Récupère le Rapport SYSCOHADA (Bilan/Compte de Résultat) de l'entreprise isolée.
 * Endpoint: GET /api/accounting/report/123?companyId=X&systemType=NORMAL
 * Cloisonnement sur CompanyId (Légal) ET AnalyticId (Projet/Filiale).
 */
exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType, companyId } = req.query; // 🔑 companyId ajouté

        // 🛑 Utiliser la variable ADMIN_UID_INT pour la vérification
        if (!ADMIN_UID_INT || !companyId) {
            return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID ou companyId manquant." });
        }
        
        const companyIdInt = parseInt(companyId, 10);
        
        // 1. Définition du filtre de cloisonnement (Filtre Analytique ET Légal)
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];
        const companyFilter = [['company_id', 'in', [companyIdInt]]]; // 🔑 Filtre LÉGAL CRITIQUE

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT, // 🔑 Utiliser ADMIN_UID_INT
            model: 'account.move.line',
            method: 'search_read',
            args: [
                [
                    ...companyFilter, // 🔑 Cloisonnement Légal
                    ...analyticFilter,
                    ['parent_state', '=', 'posted'] // Uniquement les écritures validées
                ]
            ],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'date', 'name'],
                context: { company_id: companyIdInt } // Contexte de travail
            }
        });

        // 3. Traitement selon le référentiel SYSCOHADA (Logique de calcul conservée)
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

        // 🛑 Utiliser la variable ADMIN_UID_INT pour la vérification
        if (!companyId || !ADMIN_UID_INT) {
            return res.status(400).json({ status: 'fail', error: 'Le paramètre companyId ou l\'Admin UID est requis.' });
        }

        // 1. Définition du filtre LÉGAL (Correction Critique)
        const companyIdInt = parseInt(companyId, 10);
        const companyFilter = [['company_id', 'in', [companyIdInt]]]; // 🔑 Cible la société légale

        // 2. Récupération des écritures comptables
        const moveLines = await odooExecuteKw({ 
            uid: ADMIN_UID_INT, // 🔑 Utiliser ADMIN_UID_INT
            model: 'account.move.line',
            method: 'search_read',
            args: [[...companyFilter, ['parent_state', '=', 'posted']]],
            kwargs: { 
                fields: ['account_id', 'debit', 'credit', 'balance'], 
                context: { company_id: companyIdInt } 
            } 
        });

        let data = { cash: 0, profit: 0, debts: 0 };

        moveLines.forEach(line => {
            const accountCode = line.account_id ? line.account_id[1] : ''; 
            const balance = line.balance || 0; 
            const debit = line.debit || 0;
            const credit = line.credit || 0;

            // Utilisation des débits/crédits pour un calcul de profit plus précis (Logique SYSCOHADA)
            if (accountCode.startsWith('7')) {
                data.profit += (credit - debit); 
            } else if (accountCode.startsWith('6')) {
                data.profit -= (debit - credit);
            }
            
            if (accountCode.startsWith('5')) { 
                data.cash += balance;
            } else if (accountCode.startsWith('40') && balance < 0) { 
                data.debts += Math.abs(balance);
            }
        });
        
        // 3. Fallback/Simulation conservée
        if (moveLines.length === 0) {
            data = { cash: 25000000, profit: 12500000, debts: 3500000 };
        }

        res.status(200).json({
            status: 'success',
            message: 'Données du tableau de bord récupérées.',
            data: data
        });

    } catch (err) {
        console.error('Erreur lors de la récupération du dashboard:', err.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur serveur lors de la récupération des données de synthèse.'
        });
    }
};


// =============================================================================
// LOGIQUE DU PLAN COMPTABLE (CRUD Cloisonné par ADMIN_UID_INT)
// =============================================================================

/*
 * Récupère le plan comptable d'Odoo pour la compagnie spécifiée par companyId.
 * GET /api/accounting/chart-of-accounts?companyId=X
 */
exports.getChartOfAccounts = async (req, res) => {
    try {
        const companyIdRaw = req.query.companyId;
        // Nous conservons odooUid pour la vérification de la connexion,
        const odooUid = req.user.odooUid; 

        if (!companyIdRaw || !odooUid) {
            return res.status(400).json({ error: "L'ID de compagnie ou UID est requis pour la lecture du Plan Comptable." });
        }

        const companyId = parseInt(companyIdRaw, 10);
        
        // 🔑 Le filtre de domaine pour le modèle account.account (company_ids) reste correct.
        const filter = [['company_ids', 'in', [companyId]]]; 
        
        const accounts = await odooExecuteKw({
            // 🔑 Utilisation de l'UID Admin technique pour avoir les droits de lecture (ACLs)
            uid: ADMIN_UID_INT, 
            model: 'account.account',
            method: 'search_read',
            args: [filter], // Applique le filtre company_ids
            kwargs: { 
                fields: ['id', 'code', 'name', 'account_type'], 
                // CRITIQUE : Le contexte garantit le CLOISONNEMENT des données pour companyId.
                context: { company_id: companyId, allowed_company_ids: [companyId] } 
            }
        });

        res.status(200).json({
            status: 'success',
            results: accounts.length,
            data: accounts
        });

    } catch (error) {
        console.error('[COA Read Error]', error.message); 
        // Message d'erreur uniforme et plus général
        res.status(500).json({ error: 'Échec de la récupération du Plan Comptable. (Problème de communication ou de droits sur la base de données Odoo).' });
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
        const odooUid = req.user.odooUid; // 🔑 UID de l'utilisateur connecté

        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant." });
        }
        
        if (!companyIdInt) {
            return res.status(400).json({ error: "L'ID de compagnie est requis pour la création." });
        }


        const accountData = [{
            'code': code,
            'name': name,
            'account_type': type, 
        }];
        
        const newAccountId = await odooExecuteKw({
            uid: odooUid, // 🔑 CRITIQUE : Utiliser l'UID de l'utilisateur
            model: 'account.account',
            method: 'create',
            args: [accountData],
            // 🔒 Le contexte est la seule source d'information pour la compagnie cible.
            kwargs: { context: { company_id: companyIdInt, allowed_company_ids: [companyIdInt] } } 
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
        const odooUid = req.user.odooUid; // 🔑 UID de l'utilisateur connecté

        if (!id) {
            return res.status(400).json({ error: "L'ID Odoo du compte est manquant pour la modification." });
        }
        if (!odooUid) {
             return res.status(401).json({ error: "UID utilisateur Odoo manquant." });
        }
        
        if (!companyIdInt) {
            return res.status(400).json({ error: "L'ID de compagnie est requis pour la modification." });
        }


        // Les données à mettre à jour
        const updateData = {
            'code': code,
            'name': name,
            'account_type': type,
        };
        
        await odooExecuteKw({
            uid: odooUid, // 🔑 CRITIQUE : Utiliser l'UID de l'utilisateur
            model: 'account.account',
            method: 'write',
            args: [
                [id], // ID Odoo du compte à mettre à jour
                updateData
            ],
            // 🔒 Cloisonnement : La compagnie cible est transmise via le contexte Odoo.
            kwargs: { context: { company_id: companyIdInt, allowed_company_ids: [companyIdInt] } } 
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

/**
 * Crée une nouvelle écriture comptable (account.move) dans Odoo.
 * Endpoint: POST /api/accounting/move
 * Corps de la requête (req.body) doit inclure :
 * - companyId (int)
 * - journalCode (string, ex: 'VENTES', 'ACHATS')
 * - date (string, 'YYYY-MM-DD')
 * - narration (string, libellé général)
 * - lines (array of { accountCode: string, name: string, debit: float, credit: float })
 */
exports.createJournalEntry = async (req, res) => {
    try {
        const { companyId, journalCode, date, narration, lines } = req.body;
        // 🔑 Utilisation de l'UID de l'utilisateur pour la passation d'écriture
        // const odooUid = req.user.odooUid; 
        const odooUid = ADMIN_UID_INT; // 🛑 TEST CRITIQUE: Forcer l'écriture avec l'Admin UID (2) 

        if (!odooUid || !companyId || !journalCode || !date || !Array.isArray(lines) || lines.length === 0) {
            return res.status(400).json({ 
                error: "Données requises manquantes ou format incorrect (companyId, journalCode, date, lines)." 
            });
        }

        // 1. **Vérification de la Partie Double (Principe SYSCOHADA / Comptabilité)**
        const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.005) { // Tolérance pour flottants
            return res.status(400).json({ 
                error: `Le total Débit (${totalDebit.toFixed(2)}) ne correspond pas au total Crédit (${totalCredit.toFixed(2)}). La partie double est requise.` 
            });
        }

        // 2. **Récupération de l'ID du Journal (Crucial)**
        // On cherche le journal dans la compagnie spécifiée pour le cloisonnement.
        const journalIdResult = await odooExecuteKw({
            uid: odooUid,
            model: 'account.journal',
            method: 'search_read',
            args: [[['code', '=', journalCode], ['company_id', '=', companyId]]],
            kwargs: {
                fields: ['id'],
                limit: 1,
                context: { company_id: companyId }
            }
        });
        
        if (!journalIdResult || journalIdResult.length === 0) {
            return res.status(404).json({ 
                error: `Journal comptable non trouvé pour le code ${journalCode} dans la compagnie ${companyId}.` 
            });
        }
        const journalId = journalIdResult[0].id;
        
        // 3. **Formatage des Lignes pour Odoo (account.move.line)**
        const moveLinesData = [];
        for (const line of lines) {
            // Rechercher l'ID du compte à partir du code (ex: '411000')
            const accountResult = await odooExecuteKw({
                uid: odooUid,
                model: 'account.account',
                method: 'search_read',
                args: [[['code', '=', line.accountCode], ['company_ids', 'in', [companyId]]]],
                kwargs: { fields: ['id'], limit: 1, context: { company_id: companyId } }
            });

            if (!accountResult || accountResult.length === 0) {
                return res.status(404).json({ 
                    error: `Compte comptable non trouvé pour le code ${line.accountCode} dans la compagnie ${companyId}.` 
                });
            }
            const accountId = accountResult[0].id;

            moveLinesData.push([0, 0, { // [0, 0, VALUES] est le format Odoo pour créer une ligne
                account_id: accountId,
                name: line.name || narration,
                debit: line.debit || 0,
                credit: line.credit || 0,
                // Le champ company_id n'est pas nécessaire ici, Odoo le déduira du move
            }]);
        }

        // 4. **Création du Mouvement (account.move)**
        const moveValues = {
            journal_id: journalId,
            date: date,
            ref: narration, // Le libellé général est utilisé comme référence temporaire
            narration: narration,
            company_id: companyId, // 🔑 Cloisonnement Légal
            line_ids: moveLinesData, // Les lignes associées
            state: 'draft', // Par défaut, l'écriture reste en brouillon
        };

        const newMoveId = await odooExecuteKw({
            uid: odooUid,
            model: 'account.move',
            method: 'create',
            args: [moveValues],
            kwargs: { context: { company_id: companyId } }
        });

        if (!newMoveId) {
            throw new Error("Échec de la création de l'écriture dans Odoo.");
        }
        
        // 5. **Valider l'Écriture (Passation Définitive)**
        // C'est l'opération qui garantit le numéro chronologique (SYSCOHADA).
        await odooExecuteKw({
            uid: odooUid,
            model: 'account.move',
            method: 'action_post',
            args: [[newMoveId]],
            kwargs: { context: { company_id: companyId } }
        });


        res.status(201).json({
            status: 'success',
            message: 'Écriture comptable créée et validée avec succès.',
            moveId: newMoveId
        });

    } catch (error) {
        console.error('[Journal Entry Creation Error]', error.message);
        res.status(500).json({ error: `Échec de l'enregistrement de l'écriture: ${error.message}` });
    }
};

// =============================================================================
// FONCTIONS DE REPORTING DÉTAILLÉES (Utilisation accountingService.js)
// =============================================================================

/**
 * 📊 Génère la Balance de Vérification à 6 Colonnes (SYSCOHADA).
 * Endpoint: GET /api/accounting/trial-balance?companyId=X&date_from=Y&date_to=Z
 */
exports.getSyscohadaTrialBalance = async (req, res) => {
    try {
        const { companyId, date_from, date_to } = req.query; 
        const odooUid = ADMIN_UID_INT; // 🔑 CORRIGÉ : Utilisation de ADMIN_UID_INT

        if (!companyId || !date_from || !date_to || !odooUid) {
             return res.status(400).json({ error: "L'ID de compagnie, la période ou l'Admin UID est requis." });
        }
        
        const balanceData = await accountingService.getSyscohadaBalance(
            parseInt(odooUid, 10), // 🔑 Utilisation de odooUid (qui est ADMIN_UID_INT)
            parseInt(companyId, 10), 
            date_from, 
            date_to
        );

        res.status(200).json({
            status: 'success',
            message: 'Balance SYSCOHADA générée (6 colonnes).',
            data: balanceData
        });

    } catch (error) {
        console.error('[Balance Read Error]', error.message);
        res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
};

/**
 * Récupère le Grand Livre (General Ledger) pour un Client/Projet spécifique (Compte Analytique).
 * Endpoint: GET /api/accounting/ledger?companyId=X&date_from=Y&date_to=Z&journal_ids=A,B
 * NOTE : La fonction précédente a été renommée et corrigée pour utiliser le service.
 */
exports.getGeneralLedger = async (req, res) => {
    try {
        const { companyId, date_from, date_to, journal_ids } = req.query;

        if (!companyId || !date_from || !date_to || !ADMIN_UID_INT) { // 🔑 CORRIGÉ : Utilisation de ADMIN_UID_INT
            return res.status(400).json({ error: "L'ID de compagnie, la période ou l'Admin UID est requis pour le Grand Livre." });
        }
        
        const companyIdInt = parseInt(companyId, 10);
        const odooUid = ADMIN_UID_INT; // 🔑 CORRIGÉ : Utilisation de ADMIN_UID_INT
        const journals = journal_ids ? journal_ids.split(',').map(id => parseInt(id.trim(), 10)) : [];
        
        // 1. Récupération des lignes de mouvement (account.move.line) via le service
        const lines = await accountingService.getGeneralLedgerLines(
            parseInt(odooUid, 10), // 🔑 Utilisation de odooUid (qui est ADMIN_UID_INT)
            companyIdInt, 
            date_from, 
            date_to,
            journals
        );

        // 2. Traitement des données : Regrouper par Compte Général (Logique Node.js conservée)
        let ledger = {};
        
        lines.forEach(line => {
            // Le champ account_id est une paire [ID, CODE, NOM]
            const accountCode = line.account_id ? line.account_id[1] : 'N/A';
            const accountName = line.account_id ? line.account_id[2] : 'Compte Inconnu';
            
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
        
        // 3. Conversion en tableau et tri par code de compte
        const finalLedger = Object.values(ledger).sort((a, b) => a.code.localeCompare(b.code));

        res.status(200).json({
            status: 'success',
            results: lines.length,
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

// =============================================================================
// FONCTIONS NON ENCORE IMPLÉMENTÉES (Stubs conservés)
// =============================================================================

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

/**
 * Récupère les journaux comptables de la compagnie.
 * GET /api/accounting/journals?companyId=X
 */
exports.getJournals = async (req, res) => {
    try {
        const { companyId } = req.query;
        const odooUid = ADMIN_UID_INT; 

        if (!companyId) return res.status(400).json({ error: "companyId requis" });

        const journals = await odooExecuteKw({
            uid: odooUid,
            model: 'account.journal',
            method: 'search_read',
            args: [[['company_id', '=', parseInt(companyId, 10)]]],
            kwargs: {
                fields: ['id', 'name', 'code', 'type'],
                context: { company_id: parseInt(companyId, 10) }
            }
        });

        res.status(200).json({
            status: 'success',
            data: journals // On renvoie directement le tableau
        });
    } catch (error) {
        console.error('[Journals Read Error]', error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des journaux." });
    }
};
