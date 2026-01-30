// =============================================================================
// FICHIER : middleware/auth.js (VERSION CORRIGÉE & SÉCURISÉE)
// Description : Protection des routes avec isolation multi-tenant robuste
// =============================================================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';

/**
 * MIDDLEWARE 1 : Protection JWT (Authentification)
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: 'Format du jeton invalide.' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);

            if (!decoded.odooUid) {
                throw new Error('Jeton mal formé : odooUid manquant.');
            }
            
            req.user = {
                id: decoded.id,                          // ⬅️ AJOUT : ID utilisateur (pour logs)
                odooUid: decoded.odooUid,
                email: decoded.email,
                role: decoded.role || 'USER',
                singleCompanyId: decoded.singleCompanyId || null,
                allowedCompanyIds: decoded.allowedCompanyIds || [],
                companiesList: decoded.companiesList || []  // ⬅️ AJOUT : Liste complète pour validation
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
 * MIDDLEWARE 2 : Vérification d'Accès à l'Entreprise (Lecture & Écriture)
 * 🔐 CRITIQUE : Vérifie que l'utilisateur a le droit d'accéder à l'entreprise demandée
 */
const checkCompanyAccess = (req, res, next) => {
    const { role, singleCompanyId, allowedCompanyIds, companiesList, email, id } = req.user;
    
    // 1️⃣ Extraction du company_id (query pour GET, body pour POST/PUT)
    const rawCompanyId = req.query.companyId || req.body.company_id || req.body.companyId;
    
    // 2️⃣ VALIDATION STRICTE : company_id doit être un nombre valide
    if (!rawCompanyId) {
        return res.status(400).json({ 
            status: 'error',
            error: 'L\'ID de compagnie est requis pour cette opération.' 
        });
    }

    const requestedCompanyId = parseInt(rawCompanyId, 10);
    
    if (isNaN(requestedCompanyId) || requestedCompanyId <= 0) {
        console.error(`🚨 TENTATIVE D'INJECTION : company_id invalide reçu : "${rawCompanyId}" de ${email}`);
        return res.status(400).json({ 
            status: 'error',
            error: 'L\'ID de compagnie doit être un nombre entier positif.' 
        });
    }

    // 3️⃣ ADMIN : Accès total (mais on log quand même)
    if (role === 'ADMIN') {
        req.validatedCompanyId = requestedCompanyId;
        console.log(`✅ [ADMIN ACCESS] ${email} → Company ${requestedCompanyId}`);
        return next();
    }

    // 4️⃣ VÉRIFICATION DE L'APPARTENANCE
    let hasAccess = false;

    // USER : Mono-entreprise
    if (role === 'USER') {
        if (singleCompanyId && parseInt(singleCompanyId) === requestedCompanyId) {
            hasAccess = true;
        }
    }

    // COLLABORATEUR : Multi-entreprises
    if (role === 'COLLABORATEUR') {
        if (allowedCompanyIds && Array.isArray(allowedCompanyIds)) {
            hasAccess = allowedCompanyIds.map(id => parseInt(id)).includes(requestedCompanyId);
        }
    }

    // CAISSIER : Accès aux entreprises affectées (même logique que COLLABORATEUR)
    if (role === 'CAISSIER') {
        if (allowedCompanyIds && Array.isArray(allowedCompanyIds)) {
            hasAccess = allowedCompanyIds.map(id => parseInt(id)).includes(requestedCompanyId);
        }
        // Alternative : Si le CAISSIER a une seule entreprise
        if (singleCompanyId && parseInt(singleCompanyId) === requestedCompanyId) {
            hasAccess = true;
        }
    }

    // 5️⃣ DÉCISION FINALE
    if (!hasAccess) {
        // 🚨 LOG DE SÉCURITÉ CRITIQUE
        console.error(`🚨 ACCÈS NON AUTORISÉ DÉTECTÉ :
            - Utilisateur : ${email} (ID: ${id}, Rôle: ${role})
            - Compagnie demandée : ${requestedCompanyId}
            - Compagnies autorisées : ${role === 'USER' ? singleCompanyId : (allowedCompanyIds || []).join(', ')}
            - Route : ${req.method} ${req.originalUrl}
            - IP : ${req.ip}
        `);

        return res.status(403).json({
            status: 'error',
            error: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette entreprise.'
        });
    }

    // ✅ TOUT EST OK : Injecter l'ID validé pour les controllers
    req.validatedCompanyId = requestedCompanyId;
    console.log(`✅ [ACCESS GRANTED] ${email} (${role}) → Company ${requestedCompanyId}`);
    next();
};

/**
 * MIDDLEWARE 3 : Vérification des Permissions d'Écriture
 * 🔐 À utiliser EN PLUS de checkCompanyAccess pour les routes POST/PUT/DELETE
 */
const checkWritePermission = (req, res, next) => {
    const { role, email } = req.user;

    // 1️⃣ ADMIN : Accès total
    if (role === 'ADMIN') {
        return next();
    }

    // 2️⃣ COLLABORATEUR : Peut écrire dans ses entreprises (checkCompanyAccess a déjà validé)
    if (role === 'COLLABORATEUR') {
        return next();
    }

    // 3️⃣ USER : Peut écrire dans son entreprise (checkCompanyAccess a déjà validé)
    if (role === 'USER') {
        return next();
    }

    // 4️⃣ CAISSIER : Accès limité aux opérations de caisse UNIQUEMENT
    if (role === 'CAISSIER') {
        // Liste blanche des routes autorisées pour le CAISSIER
        const allowedRoutes = [
            '/api/accounting/caisse-entry',  // Enregistrer recette/dépense
            '/api/accounting/journal'        // Lire le journal (ses propres écritures)
        ];

        const isAllowed = allowedRoutes.some(route => req.originalUrl.startsWith(route));

        if (isAllowed) {
            return next();
        } else {
            console.warn(`⚠️ CAISSIER BLOQUÉ : ${email} a tenté d'accéder à ${req.originalUrl}`);
            return res.status(403).json({
                status: 'error',
                error: 'Accès refusé. Rôle CAISSIER limité aux opérations de caisse.'
            });
        }
    }

    // 5️⃣ Rôle inconnu : Bloquer
    console.error(`🚨 RÔLE INCONNU : ${email} (Rôle: ${role}) tente d'écrire`);
    return res.status(403).json({
        status: 'error',
        error: 'Accès refusé. Rôle non autorisé pour cette opération.'
    });
};

/**
 * MIDDLEWARE 4 : Restriction par Rôle (pour routes Admin)
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

module.exports = { protect, checkCompanyAccess, checkWritePermission, restrictTo };
