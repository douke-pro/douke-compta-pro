// Contrôleur temporaire pour débloquer le déploiement
exports.listUserCompanies = async (req, res) => {
    res.json({ status: "success", companies: [], message: "Mode récupération activé" });
};

exports.createCompanyWithIsolation = async (req, res) => {
    res.json({ status: "success", message: "Fonctionnalité en cours de rétablissement" });
};
