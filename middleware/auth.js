// =============================================================================
// FICHIER : middleware/auth.js (VERSION V18 - CORRIGÉ POUR OCR)
// ✅ CORRECTION : Retourne TOUJOURS du JSON, jamais du HTML
// =============================================================================

const jwt = require('jsonwebtoken');
const { odooExecuteKw } = require('../services/odooService');

const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);

/**
 * MIDDLEWARE 1 : Protection JWT (Authentification)
 * ✅ CORRIGÉ : Retourne JSON même si le header est manquant
 */
const protect = async (req, res, next) => {
    try {
        // Vérifier la présence du header Authorization
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
            console.error('❌ [protect] Header Authorization manquant ou invalide');
            console.error('❌ [protect] URL:', req.url);
            console.error('❌ [protect] Headers:', JSON.stringify(req.headers, null, 2));
            
            return res.status(401).json({ 
                success: false,  // ✅ Format uniforme avec OCR
                status: 'error',
                error: 'Accès refusé. Token de sécurité manquant.',
                message: 'Authentication required'
            });
        }

        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            console.error('❌ [protect] Token vide après split');
            return res.status(401).json({ 
                success: false,
                status: 'error',
                error: 'Format du jeton invalide.',
                message: 'Invalid token format'
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.odooUid) {
            throw new Error('Jeton mal formé : odooUid manquant.');
        }
        
        // Injecter les données utilisateur dans req
        req.user = {
            odooUid: decoded.odooUid,
            email: decoded.email,
            role: decoded.role || 'USER',
            profile: decoded.profile || decoded.role || 'USER',
            selectedCompanyId: decoded.selectedCompanyId,
            companyId: decoded.companyId || decoded.selectedCompanyId,  // ✅ AJOUT
            currentCompanyId: decoded.currentCompanyId || decoded.selectedCompanyId  // ✅ AJOUT
        };

        console.log('✅ [protect] Utilisateur authentifié:', req.user.email);
        next();
        
    } catch (error) {
        let message = 'Non autorisé, jeton invalide.';
        let errorCode = 'INVALID_TOKEN';
        
        if (error.name === 'TokenExpiredError') {
            message = 'Session expirée, veuillez vous reconnecter.';
            errorCode = 'TOKEN_EXPIRED';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token malformé.';
            errorCode = 'MALFORMED_TOKEN';
        }
        
        console.error('[JWT AUTH ERROR]', error.message);
        
        return res.status(401).json({ 
            success: false,  // ✅ Format uniforme
            status: 'error',
            error: message,
            errorCode: errorCode
        });
    }
};

/**
 * MIDDLEWARE 2 : Vérification Accès Entreprise (TEMPS RÉEL ODOO)
 */
const checkCompanyAccess = async (req, res, next) => {
    const { role, odooUid, email } = req.user;
    
    const rawCompanyId = req.query.companyId || req.params.companyId || req.body.companyId || req.body.company_id;
    
    if (!rawCompanyId) {
        console.error(`❌ checkCompanyAccess: Aucun companyId fourni par ${email}`);
        return res.status(400).json({ 
            success: false,
            status: 'error',
            error: 'L\'ID de compagnie est requis pour cette opération.' 
        });
    }

    const requestedCompanyId = parseInt(rawCompanyId, 10);
    
    if (isNaN(requestedCompanyId) || requestedCompanyId <= 0) {
        console.error(`🚨 INJECTION ATTEMPT: company_id="${rawCompanyId}" par ${email} (IP: ${req.ip})`);
        return res.status(400).json({ 
            success: false,
            status: 'error',
            error: 'L\'ID de compagnie doit être un nombre entier positif.' 
        });
    }

    if (role === 'ADMIN') {
        req.validatedCompanyId = requestedCompanyId;
        console.log(`✅ [ADMIN] ${email} → Company ${requestedCompanyId}`);
        return next();
    }

    try {
        console.log(`🔍 [VERIFY] ${email} (UID: ${odooUid}) → Company ${requestedCompanyId}...`);

        const userData = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.users',
            method: 'read',
            args: [[odooUid], ['company_ids']],
            kwargs: {}
        });

        if (!userData || userData.length === 0) {
            console.error(`🚨 USER NOT FOUND: UID ${odooUid}`);
            return res.status(403).json({
                success: false,
                status: 'error',
                error: 'Utilisateur Odoo introuvable ou désactivé.'
            });
        }

        const allowedCompanyIds = userData[0].company_ids || [];

        if (allowedCompanyIds.length === 0) {
            console.error(`🚨 NO COMPANIES: UID ${odooUid} (${email})`);
            return res.status(403).json({
                success: false,
                status: 'error',
                error: 'Aucune entreprise assignée à cet utilisateur.'
            });
        }

        const hasAccess = allowedCompanyIds.includes(requestedCompanyId);

        if (!hasAccess) {
            console.error(`🚨 UNAUTHORIZED ACCESS ATTEMPT:
                - User: ${email} (UID: ${odooUid}, Role: ${role})
                - Requested: ${requestedCompanyId}
                - Allowed: ${allowedCompanyIds.join(', ')}
                - Route: ${req.method} ${req.originalUrl}
                - IP: ${req.ip}
                - Timestamp: ${new Date().toISOString()}
            `);

            return res.status(403).json({
                success: false,
                status: 'error',
                error: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette entreprise.'
            });
        }

        req.validatedCompanyId = requestedCompanyId;
        console.log(`✅ [ACCESS GRANTED] ${email} (${role}) → Company ${requestedCompanyId}`);
        next();

    } catch (error) {
        console.error('🚨 checkCompanyAccess Odoo Error:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            status: 'error',
            error: 'Erreur lors de la vérification des permissions. Veuillez réessayer.'
        });
    }
};

/**
 * MIDDLEWARE 3 : Vérification Permissions d'Écriture
 */
const checkWritePermission = (req, res, next) => {
    const { role, email } = req.user;

    if (role === 'ADMIN') return next();
    if (role === 'COLLABORATEUR') return next();
    if (role === 'USER') return next();

    if (role === 'CAISSIER') {
        const allowedRoutes = [
            '/api/accounting/caisse-entry',
            '/api/accounting/journal'
        ];

        if (allowedRoutes.some(route => req.originalUrl.startsWith(route))) {
            return next();
        }

        console.warn(`⚠️ CAISSIER BLOCKED: ${email} → ${req.originalUrl}`);
        return res.status(403).json({
            success: false,
            status: 'error',
            error: 'Accès refusé. Rôle CAISSIER limité aux opérations de caisse.'
        });
    }

    console.error(`🚨 UNKNOWN ROLE: ${email} (Role: ${role})`);
    return res.status(403).json({
        success: false,
        status: 'error',
        error: 'Accès refusé. Rôle non autorisé.'
    });
};

/**
 * MIDDLEWARE 4 : Restriction par Rôle
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                status: 'error',
                error: 'Accès refusé. Permissions insuffisantes.' 
            });
        }
        next();
    };
};

/**
 * MIDDLEWARE 5 : Vérification Rôle insensible à la casse
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                status: 'error',
                error: 'Non authentifié.' 
            });
        }

        const userRole = (req.user.role || '').toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            console.warn(`⚠️ [checkRole] Accès refusé: ${req.user.email} (role: ${userRole}) → Requis: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ 
                success: false,
                status: 'error',
                error: 'Accès refusé. Permissions insuffisantes.' 
            });
        }

        next();
    };
};

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
    protect,
    checkCompanyAccess,
    checkWritePermission,
    restrictTo,
    authenticateToken: protect,
    checkRole,
};

console.log('✅ [middleware/auth] Chargé avec succès');
