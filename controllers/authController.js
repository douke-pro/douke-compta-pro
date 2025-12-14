// Dossier : controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Génère un JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // 30 jours de validité
    });
};

// Logique POST /api/auth/register
const registerUser = async (req, res) => {
    const { username, email, password, companyName } = req.body; 

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }
    
    // Création d'un ID MOCK temporaire et d'un rôle ADMIN pour le créateur d'entreprise
    const mockCompanyId = 'ENT_NEW_MOCK_' + new Date().getTime(); 
    
    const user = await User.create({
        utilisateurNom: username,
        email,
        password, // Le hachage est géré par le modèle User
        utilisateurRole: 'ADMIN', 
        entrepriseContextId: mockCompanyId,
        entreprisesAccessibles: [mockCompanyId],
        multiEntreprise: true, // Le créateur est un administrateur multi-entreprise par défaut
    });

    if (user) {
        res.status(201).json({
            utilisateurId: user._id,
            utilisateurNom: user.utilisateurNom,
            utilisateurRole: user.utilisateurRole,
            entrepriseContextId: user.entrepriseContextId,
            entrepriseContextName: companyName, 
            multiEntreprise: user.multiEntreprise,
            token: generateToken(user._id), // Jeton sécurisé
        });
    } else {
        res.status(400).json({ error: 'Données utilisateur invalides.' });
    }
};

// Logique POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        // Succès: Générer le token et retourner le contexte
        res.json({
            utilisateurId: user._id,
            utilisateurNom: user.utilisateurNom,
            utilisateurRole: user.utilisateurRole,
            // Ces deux champs devront être récupérés de la base 'Company' en Phase 2
            entrepriseContextId: user.entrepriseContextId, 
            entrepriseContextName: 'Alpha Solutions (Placeholder)', 
            multiEntreprise: user.multiEntreprise,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ error: 'Identifiants invalides.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
