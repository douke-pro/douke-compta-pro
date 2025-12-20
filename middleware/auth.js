// =============================================================================
// FICHIER : middleware/auth.js
// Description : Protection des routes et extraction sécurisée des IDs Odoo
// =============================================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';

/**
 * PROTECTION DES ROUTES
 * Vérifie le JWT et injecte les identifiants Odoo dans la requête
 */
const protect = async (req, res, next) => {
    let token;

    // 1. Vérifier si le header Authorization est présent et correct
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Extraire le token
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: 'Format du jeton invalide.' });
            }

            // 3. Vérifier et décoder le token
            const decoded = jwt.verify(token, JWT_SECRET);

            // 4. Injection critique pour la compta isolée :
            // On s'assure que odooUid est présent pour les appels XML-RPC futurs
            if (!decoded.odooUid) {
                throw new Error('Jeton mal formé : odooUid manquant.');
            }

            req.user = {
                odooUid: decoded.odooUid, // Utilisé pour authenticate & execute_kw
                email: decoded.email,
                role: decoded.role || 'USER'
            };

            next();
            
        } catch (error) {
            let message = 'Non autorisé, jeton invalide.';
            if (error.name === 'TokenExpiredError') message = 'Session expirée, veuillez vous reconnecter.';
            
            console.error('[JWT AUTH ERROR]', error.message);
            return res.status(401).json({ error: message });
        }
    } else {
        return res.status(401).json({ 
            error: 'Accès refusé. Token de sécurité manquant.' 
        });
    }
};

/**
 * RESTRICTION PAR RÔLE
 * Utilisé pour protéger les fonctions Admin (ex: création d'entreprises)
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Accès refusé. Vous n\'avez pas les permissions pour cette action.' 
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
