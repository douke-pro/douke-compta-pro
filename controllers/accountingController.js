// =============================================================================
// FICHIER : controllers/accountingController.js (CORRIGÉ FINAL)
// Description : Génération du rapport SYSCOHADA (remplace reportsController.js)
// CORRECTION : Migration vers odooExecuteKw (JSON-RPC) et suppression de xmlrpc.
// =============================================================================

// const xmlrpc = require('xmlrpc'); // ⬅️ SUPPRIMÉ : N'est plus utilisé
const { odooExecuteKw } = require('../services/odooService'); // Import du service JSON-RPC stable
const ADMIN_UID = process.env.ODOO_ADMIN_UID; // UID Admin pour les requêtes privilégiées

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType } = req.query; 
        const { odooUid } = req.user;
        
        // const password = req.headers['x-odoo-password']; // ⬅️ SUPPRIMÉ

        if (!ADMIN_UID) {
             return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID est manquant. Vérifiez vos variables d'environnement." });
        }

        // 1. Définition du filtre de cloisonnement (Filtre Analytique Robuste)
        // Nous supposons que le champ 'analytic_distribution' est utilisé dans Odoo
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await odooExecuteKw({
            uid: ADMIN_UID, // ⬅️ UID Admin pour la lecture des données (Access Control List)
            model: 'account.move.line',
            method: 'search_read',
            args: [
                [
                    ...analyticFilter,
                    ['parent_state', '=', 'posted'] 
                ]
            ],
            kwargs: { fields: ['account_id', 'debit', 'credit', 'date', 'name'] }
        });

        // 3. Traitement selon le référentiel SYSCOHADA (Logique inchangée)
        let report = {
            chiffreAffaires: 0, 
            chargesExploitation: 0, 
            tresorerie: 0, 
            resultat: 0
        };

        moveLines.forEach(line => {
            // account_id est maintenant un tableau [ID, Nom/Code]
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

        // 4. Adaptation spécifique au SMT
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
