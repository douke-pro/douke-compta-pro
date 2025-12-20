const xmlrpc = require('xmlrpc');
const { getOdooClient, executeKw } = require('../utils/odooClient'); // Helper mutualisé

exports.getMonthlyCashflowSMT = async (req, res) => {
    try {
        const { analyticId } = req.params;
        const { odooUid } = req.user;
        const password = req.headers['x-odoo-password'];

        // 1. Définition de la période (12 derniers mois)
        const dateLimit = new Date();
        dateLimit.setFullYear(dateLimit.getFullYear() - 1);
        const dateString = dateLimit.toISOString().split('T')[0];

        // 2. Requête Odoo : On cible les comptes de trésorerie (Classe 5) avec filtre analytique
        // Le SMT repose sur les encaissements et décaissements effectifs
        const moves = await executeKw(odooUid, password, 'account.move.line', 'search_read', [
            [
                ['analytic_distribution', 'in', [analyticId.toString()]],
                ['account_id.code', '=like', '5%'], // Uniquement la Classe 5 (Trésorerie)
                ['date', '>=', dateString],
                ['parent_state', '=', 'posted']
            ]
        ], { 
            fields: ['date', 'debit', 'credit', 'name'],
            sort: 'date asc'
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

        res.json({
            entrepriseId: analyticId,
            referentiel: "SYSCOHADA SMT (Trésorerie)",
            unite: "XOF",
            fluxMensuels: report
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
