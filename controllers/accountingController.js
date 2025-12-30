// =============================================================================
// FICHIER : controllers/accountingController.js (À VÉRIFIER)
// Assurez-vous que ce fichier n'a aucune référence à 'xmlrpc' ou 'odooClient'.
// =============================================================================

const { odooExecuteKw } = require('../services/odooService'); // ⬅️ Doit être présent et pointer vers le bon fichier
const ADMIN_UID = process.env.ODOO_ADMIN_UID; // ⬅️ UID Admin doit être disponible dans .env

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; 
        const { systemType } = req.query; 
        // Utilisateur connecté provient du JWT
        const { odooUid } = req.user;
        
        if (!ADMIN_UID) throw new Error("Erreur de configuration: ODOO_ADMIN_UID manquant.");
        
        // 1. Définition du filtre
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Requête Odoo via odooExecuteKw (JSON-RPC)
        const moveLines = await odooExecuteKw({
            uid: ADMIN_UID, // ⬅️ Utilisation des droits Admin pour contourner l'accès refusé
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
        let report = { chiffreAffaires: 0, chargesExploitation: 0, tresorerie: 0, resultat: 0 };
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

        // 4. Retour
        if (systemType === 'SMT') {
            return res.json({ systeme: "Minimal de Trésorerie (SMT)", flux: { encaissements: report.chiffreAffaires, decaissements: report.chargesExploitation, soldeNet: report.tresorerie } });
        }

        res.json({ systeme: "Normal (Comptabilité d'engagement)", donnees: report });

    } catch (error) {
        console.error('[Accounting Report Error]', error.message);
        res.status(500).json({ error: error.message });
    }
};
