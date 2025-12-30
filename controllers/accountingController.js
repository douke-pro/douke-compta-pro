// =============================================================================
// FICHIER : controllers/accountingController.js (VERSION FINALE ET SANS ERREUR DE DÉPENDANCE)
// =============================================================================

// ⬅️ Remplace l'intégralité du bloc XML-RPC par cet import stable :
const { odooExecuteKw } = require('../services/odooService'); 
const ADMIN_UID = process.env.ODOO_ADMIN_UID; 

// =============================================================================
// LOGIQUE COMPTABLE SYSCOHADA AVEC FILTRE ANALYTIQUE
// =============================================================================

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; // L'identifiant de l'entreprise isolée
        const { systemType } = req.query; // 'NORMAL' ou 'SMT'
        const { odooUid } = req.user;
        // const password = req.headers['x-odoo-password']; // ⬅️ Plus nécessaire

        if (!ADMIN_UID) {
             return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID manquant." });
        }

        // 1. Définition du filtre de cloisonnement (Filtre Analytique Robuste)
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await odooExecuteKw({ // ⬅️ Remplacement de l'appel executeKw local
            uid: ADMIN_UID, // ⬅️ Utilisation de l'UID Admin pour la requête
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

        // 3. Traitement selon le référentiel SYSCOHADA (Logique inchangée)
        let report = {
            chiffreAffaires: 0, // Classe 7
            chargesExploitation: 0, // Classe 6
            tresorerie: 0, // Classe 5
            resultat: 0
        };

        moveLines.forEach(line => {
            const accountCode = line.account_id[1]; // Ex: "701000 Ventes"

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
