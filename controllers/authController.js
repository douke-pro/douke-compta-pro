const jwt = require('jsonwebtoken');
const xmlrpc = require('xmlrpc');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
    try {
        const { username, email, companyName } = req.body;
        res.status(201).json({ 
            utilisateurId: "temp_id",
            utilisateurNom: username,
            entrepriseContextName: companyName,
            token: generateToken("temp_id"),
            message: "Utilisateur enregistré" 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email } = req.body;
        const mockId = "user_" + Date.now();
        res.json({ 
            utilisateurId: mockId,
            utilisateurNom: email.split('@')[0],
            utilisateurRole: 'ADMIN',
            token: generateToken(mockId),
            message: "Connexion réussie"
        });
    } catch (error) {
        res.status(401).json({ error: "Identifiants invalides" });
    }
};

exports.assignCompany = async (req, res) => {
    res.json({ message: "Affectation effectuée" });
};

exports.forceLogout = async (req, res) => {
    res.json({ message: "Déconnexion forcée" });
};
