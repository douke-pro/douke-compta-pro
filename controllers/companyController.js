// Contrôleur temporaire pour débloquer le déploiement
exports.listUserCompanies = async (req, res) => {
    res.json({ status: "success", companies: [], message: "Mode récupération activé" });
};

exports.createCompanyWithIsolation = async (req, res) => {
    res.json({ status: "success", message: "Fonctionnalité en cours de rétablissement" });
};

// Contrôleur temporaire pour débloquer le déploiement
exports.listUserCompanies = async (req, res) => {
    res.json({ status: "success", companies: [], message: "Mode récupération activé" });
};

exports.createCompanyWithIsolation = async (req, res) => {
    res.json({ status: "success", message: "Fonctionnalité en cours de rétablissement" });
};

// 🆕 AJOUTER CETTE FONCTION
exports.getCompanies = async (req, res) => {
    try {
        const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
        
        console.log('🏢 [getCompanies] Récupération des entreprises');

        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'search_read',
            args: [[]],
            kwargs: {
                fields: ['id', 'name', 'email', 'phone'],
                order: 'name ASC'
            }
        });

        console.log(`✅ [getCompanies] ${companies.length} entreprises trouvées`);

        res.json({
            status: 'success',
            data: companies
        });

    } catch (error) {
        console.error('🚨 [getCompanies] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des entreprises'
        });
    }
};
