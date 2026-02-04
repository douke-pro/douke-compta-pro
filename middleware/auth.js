javascript// =============================================================================
// FICHIER : middleware/auth.js (VERSION V16 - FINALE ROBUSTE)
// Description : Protection avec validation temps réel Odoo
// Correction : Support de req.params.companyId pour les routes settings
// =============================================================================

const jwt = require('jsonwebtoken');
const { odooExecuteKw } = require('../services/odooService');

const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);

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
                odooUid: decoded.odooUid,
                email: decoded.email,
                role: decoded.role || 'USER',
                profile: decoded.profile || decoded.role || 'USER',
                selectedCompanyId: decoded.selectedCompanyId,
            };

            next();
            
        } catch (error) {
            let message = 'Non autorisé, jeton invalide.';
            if (error.name === 'TokenExpiredError') {
                message = 'Session expirée, veuillez vous reconnecter.';
            }
            
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
 * MIDDLEWARE 2 : Vérification Accès Entreprise (TEMPS RÉEL ODOO)
 * 🔧 V16 : Support de req.params.companyId, req.query.companyId et req.body.companyId
 */
const checkCompanyAccess = async (req, res, next) => {
    const { role, odooUid, email } = req.user;
    
    // 1️⃣ Extraction du company_id depuis TOUTES les sources possibles
    const rawCompanyId = req.params.companyId || req.query.companyId || req.body.company_id || req.body.companyId;
    
    if (!rawCompanyId) {
        console.error(`❌ checkCompanyAccess: Aucun companyId fourni par ${email}`);
        return res.status(400).json({ 
            status: 'error',
            error: 'L\'ID de compagnie est requis pour cette opération.' 
        });
    }

    const requestedCompanyId = parseInt(rawCompanyId, 10);
    
    if (isNaN(requestedCompanyId) || requestedCompanyId <= 0) {
        console.error(`🚨 INJECTION ATTEMPT: company_id="${rawCompanyId}" par ${email} (IP: ${req.ip})`);
        return res.status(400).json({ 
            status: 'error',
            error: 'L\'ID de compagnie doit être un nombre entier positif.' 
        });
    }

    // 2️⃣ ADMIN : Accès total
    if (role === 'ADMIN') {
        req.validatedCompanyId = requestedCompanyId;
        console.log(`✅ [ADMIN] ${email} → Company ${requestedCompanyId}`);
        return next();
    }

    // 3️⃣ 🔒 VÉRIFICATION TEMPS RÉEL ODOO (CRITIQUE)
    try {
        console.log(`🔍 [VERIFY] ${email} (UID: ${odooUid}) → Company ${requestedCompanyId}...`);

        // Query Odoo pour récupérer les company_ids autorisés
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
                status: 'error',
                error: 'Utilisateur Odoo introuvable ou désactivé.'
            });
        }

        const allowedCompanyIds = userData[0].company_ids || [];

        if (allowedCompanyIds.length === 0) {
            console.error(`🚨 NO COMPANIES: UID ${odooUid} (${email})`);
            return res.status(403).json({
                status: 'error',
                error: 'Aucune entreprise assignée à cet utilisateur.'
            });
        }

        // Vérification de l'appartenance
        const hasAccess = allowedCompanyIds.includes(requestedCompanyId);

        if (!hasAccess) {
            // 🚨 LOG DE SÉCURITÉ CRITIQUE
            console.error(`🚨 UNAUTHORIZED ACCESS ATTEMPT:
                - User: ${email} (UID: ${odooUid}, Role: ${role})
                - Requested: ${requestedCompanyId}
                - Allowed: ${allowedCompanyIds.join(', ')}
                - Route: ${req.method} ${req.originalUrl}
                - IP: ${req.ip}
                - Timestamp: ${new Date().toISOString()}
            `);

            return res.status(403).json({
                status: 'error',
                error: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette entreprise.'
            });
        }

        // ✅ ACCÈS VALIDÉ
        req.validatedCompanyId = requestedCompanyId;
        console.log(`✅ [ACCESS GRANTED] ${email} (${role}) → Company ${requestedCompanyId}`);
        next();

    } catch (error) {
        console.error('🚨 checkCompanyAccess Odoo Error:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
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
            status: 'error',
            error: 'Accès refusé. Rôle CAISSIER limité aux opérations de caisse.'
        });
    }

    console.error(`🚨 UNKNOWN ROLE: ${email} (Role: ${role})`);
    return res.status(403).json({
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
                error: 'Accès refusé. Permissions insuffisantes.' 
            });
        }
        next();
    };
};

module.exports = { protect, checkCompanyAccess, checkWritePermission, restrictTo };
