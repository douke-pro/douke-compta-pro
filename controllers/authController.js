const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_123', {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, companyName } = req.body;
        const mockOdooId = "odoo_" + Date.now();
        
        res.status(201).json({
            utilisateurId: mockOdooId,
            utilisateurNom: username,
            utilisateurRole: 'ADMIN',
            entrepriseContextId: "comp_" + mockOdooId,
            entrepriseContextName: companyName,
            token: generateToken(mockOdooId),
        });
    } catch (error) {
        console.error("Erreur Register:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email } = req.body;
        const mockId = "odoo_user_login";
        res.json({
            utilisateurId: mockId,
            utilisateurNom: email.split('@')[0],
            utilisateurRole: 'ADMIN',
            token: generateToken(mockId),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.assignCompany = async (req, res) => {
    try {
        res.json({ message: "Affectation Odoo réussie" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.forceLogout = async (req, res) => {
    try {
        res.json({ message: "Utilisateur déconnecté" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
