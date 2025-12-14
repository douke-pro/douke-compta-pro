// Dossier : middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // Vérifie et décode le jeton en utilisant le JWT_SECRET
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attache les données utilisateur à la requête (sans le mot de passe)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé ou jeton altéré.' });
            }

            next(); 
        } catch (error) {
            console.error('[JWT Error] Jeton invalide ou expiré:', error.message);
            return res.status(401).json({ error: 'Non autorisé, jeton invalide ou expiré.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Non autorisé, aucun jeton fourni.' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.utilisateurRole)) {
            return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant pour cette action.' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
