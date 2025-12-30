// =============================================================================
// FICHIER : controllers/cashflowController.js (CORRIGÉ FINAL)
// Description : Génération du rapport de flux de trésorerie SYSCOHADA SMT.
// CORRECTION : Migration vers odooExecuteKw (JSON-RPC) avec UID Admin.
// =============================================================================

const { odooExecuteKw } = require('../services/odooService'); // Import du service JSON-RPC stable
const ADMIN_UID = process.env.ODOO_ADMIN_UID; // UID Admin pour les requêtes privilégiées

exports.getMonthlyCashflowSMT = async (req, res) => {
    try {
        const { analyticId } = req.params; // L'identifiant de la compagnie (compte analytique)
        // L'UID de l'utilisateur connecté (nécessaire pour le contexte, même si nous utilisons l'UID Admin pour l'exécution)
        const { odooUid } = req.user; 
        // const password = req.headers['x-odoo-password']; // ⬅️ SUPPRIMÉ : Utilisation de la Clé API Admin dans odooService.js

        if (!ADMIN_UID) {
             return res.status(500).json({ error: "Erreur de configuration: ODOO_ADMIN_UID est manquant. Vérifiez vos variables d'environnement." });
        }

        // 1. Définition de la période (12 derniers mois)
        const dateLimit = new Date();
        dateLimit.setFullYear(dateLimit.getFullYear() - 1);
        const dateString = dateLimit.toISOString().split('T')[0];

        // 2. Requête Odoo : On cible les comptes de trésorerie (Classe 5) avec filtre analytique
        // Utilisation de odooExecuteKw avec l'UID Admin
        const moves = await odooExecuteKw({
            uid: ADMIN_UID, // ⬅️ UID Admin pour la lecture des données (Access Control List)
            model: 'account.move.line',
            method: 'search_read',
            args: [
                [
                    // Le filtre d'isolation analytique
                    ['analytic_distribution', 'in', [analyticId.toString()]], 
                    ['account_id.code', '=like', '5%'], // Uniquement la Classe 5 (Trésorerie)
                    ['date', '>=', dateString],
                    ['parent_state', '=', 'posted'] // Seulement les écritures validées
                ]
            ], 
            kwargs: { 
                fields: ['date', 'debit', 'credit', 'name'],
                sort: 'date asc'
            }
        });


        // 3. Agrégation par mois (Logique SYSCOHADA SMT)
        const monthlyData = {};

        moves.forEach(move => {
            const monthKey = move.date.substring(0, 7); // Format "YYYY-MM"
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { mois: monthKey, entrees: 0, sorties: 0, solde: 0 };
            }

            // En Classe 5 : Débit = Entrée d'argent, Crédit = Sortie d'argent
            monthlyData[monthKey].entrees += move.debit;
            monthlyData[monthKey].sorties += move.credit;
            monthlyData[monthKey].solde += (move.debit - move.credit);
        });

        // Convertir l'objet en tableau trié pour le frontend
        const report = Object.values(monthlyData);
        // 

[Image of cash flow chart]

        
        res.json({
            entrepriseId: analyticId,
            referentiel: "SYSCOHADA SMT (Trésorerie)",
            unite: "XOF",
            fluxMensuels: report
        });

    } catch (error) {
        console.error('[Cashflow SMT Error]', error.message);
        res.status(500).json({ 
            error: error.message,
            message: 'Erreur lors de la récupération des flux de trésorerie. Vérifiez la connexion Odoo et les droits analytiques.' 
        });
    }
};
