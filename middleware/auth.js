// =============================================================================
// FICHIER : middleware/auth.js (MIS À JOUR AVEC checkWritePermission)
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
            
            // NOTE IMPORTANTE : L'injection de singleCompanyId et allowedCompanyIds 
            // est CRITIQUE ici pour que checkWritePermission fonctionne.
            req.user = {
                odooUid: decoded.odooUid, // Utilisé pour authenticate & execute_kw
                email: decoded.email,
                role: decoded.role || 'USER',
                // NOUVEAUX CHAMPS REQUIS POUR checkWritePermission :
                singleCompanyId: decoded.singleCompanyId,
                allowedCompanyIds: decoded.allowedCompanyIds,
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
 * Middleware CRITIQUE pour l'isolation. Vérifie si l'utilisateur a le droit d'écrire/modifier 
 * pour la companyId demandée (Mono ou Multi-entreprise).
 */
const checkWritePermission = (req, res, next) => {
    // Les champs req.user (role, singleCompanyId, allowedCompanyIds) sont injectés par le middleware 'protect'.
    const { role, singleCompanyId, allowedCompanyIds } = req.user; 
    // La companyId peut venir soit du corps (POST/PUT), soit de la requête (GET/DELETE avec query)
    const companyId = req.body.companyId || req.query.companyId; 

    // Vérification de base
    if (!companyId) {
        return res.status(400).json({ error: "L'ID de compagnie est requis pour l'opération d'écriture." });
    }
    
    // 1. Autorité Absolue
    if (role === 'ADMIN') {
        return next(); // ADMIN a l'autorité complète.
    }
    
    // 2. Restriction CAISSIER (Rôle de saisie limitée)
    // Le CAISSIER ne devrait pas faire d'opérations complexes (ex: création de plan comptable)
    // Nous supposons que cette restriction est faite pour certaines routes spécifiques qui ne sont pas des opérations de caisse.
    if (role === 'CAISSIER') {
        // Cette restriction pourrait être affinée selon les routes
        // Pour l'instant, on bloque les opérations de haut niveau (comme la création de comptes).
        // NOTE: Si vous utilisez ce middleware pour les opérations de caisse, IL FAUDRA L'ADAPTER.
        return res.status(403).json({ error: "Accès refusé. Rôle CAISSIER ne peut pas effectuer cette opération." });
    }

    const targetCompanyId = companyId.toString();

    // 3. Logique pour USER (Mono-entreprise)
    if (role === 'USER') {
        if (singleCompanyId && singleCompanyId.toString() === targetCompanyId) {
             return next();
        }
    }
    
    // 4. Logique pour COLLABORATEUR (Multi-entreprises affectées)
    if (role === 'COLLABORATEUR') {
        // Recherche de l'ID demandé dans la liste des ID autorisés de l'utilisateur.
        if (allowedCompanyIds && allowedCompanyIds.map(id => id.toString()).includes(targetCompanyId)) {
             return next();
        }
    }

    // 5. Cas par défaut : Accès refusé
    return res.status(403).json({ 
        error: "Accès refusé. Vous n'êtes pas autorisé à modifier les données de ce dossier client." 
    });
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

module.exports = { protect, restrictTo, checkWritePermission }; // EXPORTATION AJOUTÉE
