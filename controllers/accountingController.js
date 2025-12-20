const xmlrpc = require('xmlrpc');

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;

const getOdooClient = (endpoint) => {
    const url = new URL(ODOO_URL);
    return (url.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient)({
        host: url.hostname, port: 443, path: endpoint
    });
};

const executeKw = (uid, password, model, method, args, kwargs = {}) => {
    return new Promise((resolve, reject) => {
        const client = getOdooClient('/xmlrpc/2/object');
        client.methodCall('execute_kw', [ODOO_DB, uid, password, model, method, args, kwargs], (err, res) => {
            if (err) reject(err); else resolve(res);
        });
    });
};

// =============================================================================
// LOGIQUE COMPTABLE SYSCOHADA AVEC FILTRE ANALYTIQUE
// =============================================================================

exports.getFinancialReport = async (req, res) => {
    try {
        const { analyticId } = req.params; // L'identifiant de l'entreprise isolée
        const { systemType } = req.query; // 'NORMAL' ou 'SMT'
        const { odooUid } = req.user;
        const password = req.headers['x-odoo-password'];

        // 1. Définition du filtre de cloisonnement (Filtre Analytique Robuste)
        // Note: Selon la version d'Odoo, on utilise 'analytic_distribution' ou 'analytic_account_id'
        const analyticFilter = [['analytic_distribution', 'in', [analyticId.toString()]]];

        // 2. Récupération des écritures comptables (account.move.line)
        const moveLines = await executeKw(odooUid, password, 'account.move.line', 'search_read', [
            [
                ...analyticFilter,
                ['parent_state', '=', 'posted'] // Uniquement les écritures validées
            ]
        ], { fields: ['account_id', 'debit', 'credit', 'date', 'name'] });

        // 3. Traitement selon le référentiel SYSCOHADA
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
            // Le SMT se concentre sur les flux de caisse/banque (Recettes/Dépenses)
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
        res.status(500).json({ error: error.message });
    }
};
