// =============================================================================
// FICHIER : controllers/authController.js
// Version : V20 — Nom réel de l'émetteur dans le token JWT
// Corrections appliquées :
//   ✅ C1   : JWT_SECRET sans fallback dangereux
//   ✅ FIX1 : Récupération du vrai nom Odoo de l'utilisateur connecté
//   ✅ FIX2 : name ajouté dans le token JWT (loginUser)
//   ✅ FIX3 : name ajouté dans le token JWT (registerUser)
//   ✅ E5   : assignCompany ne renvoie plus req.body
//   ✅ M1   : ADMIN_UID converti en entier
//   ✅ M3   : Import emailService commenté (service désactivé)
// =============================================================================

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { odooAuthenticate, odooExecuteKw } = require('../services/odooService');
const emailService = require('../services/emailService');
// ✅ M3 : Import commenté jusqu'à configuration SMTP complète
// const { sendWelcomeEmail } = require('../services/emailService');

// =============================================================================
// CONFIGURATION
// =============================================================================

// ✅ C1 : Plus de fallback dangereux — le serveur refuse de démarrer sans JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET manquant dans les variables d\'environnement.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ✅ M1 : ADMIN_UID converti en entier dès le chargement du module
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);
if (isNaN(ADMIN_UID)) {
    throw new Error('❌ FATAL: ODOO_ADMIN_UID manquant ou invalide dans les variables d\'environnement.');
}

// =============================================================================
// HELPER : Génère un token JWT
// =============================================================================

const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// =============================================================================
// HELPER : Récupère le vrai nom de l'utilisateur depuis Odoo
// ✅ FIX1 : Remplace le nom générique "Utilisateur Odoo (ID: X)"
// =============================================================================

const getRealUserName = async (uid, fallback) => {
    try {
        const userInfo = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'read',
            args:   [[uid], ['name']],
            kwargs: {}
        });
        if (userInfo && userInfo[0]?.name) {
            return userInfo[0].name;
        }
    } catch (e) {
        console.warn('⚠️ [getRealUserName] Impossible de récupérer le nom réel:', e.message);
    }
    return fallback || 'Utilisateur';
};

// =============================================================================
// CONNEXION
// =============================================================================

/**
 * Connexion utilisateur
 * @route POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'Veuillez fournir un email et un mot de passe.'
        });
    }

    try {
        // ── 1. Authentification Odoo ─────────────────────────────────────────
        const authResult = await odooAuthenticate(email, password);
        const { uid, db, profile } = authResult;

        if (!uid) {
            return res.status(401).json({ error: 'Identifiants Odoo invalides.' });
        }

        // ── 2. Récupération du vrai nom + entreprises ────────────────────────
        // ✅ FIX1 : On lit le vrai nom ET les company_ids en un seul appel
        const userData = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'read',
            args:   [[uid], ['name', 'company_ids']],
            kwargs: {}
        });

        if (!userData || userData.length === 0) {
            throw new Error('Utilisateur Odoo introuvable.');
        }

        if (!userData[0].company_ids || userData[0].company_ids.length === 0) {
            throw new Error('L\'utilisateur n\'est pas lié à une compagnie Odoo active.');
        }

        // ✅ FIX1 : Vrai nom Odoo de l'utilisateur connecté
        const realName   = userData[0].name || email;
        const companyIds = userData[0].company_ids;

        // ── 3. Récupération des entreprises accessibles ──────────────────────
        const companies = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.company',
            method: 'search_read',
            args:   profile === 'ADMIN'
                ? [[], ['name', 'currency_id']]
                : [[['id', 'in', companyIds]], ['name', 'currency_id']],
            kwargs: { limit: 100 },
        });

        const companiesList = companies.map(c => ({
            id:       c.id,
            name:     c.name,
            systeme:  'NORMAL',
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));

        const defaultCompany = companiesList.length > 0 ? companiesList[0] : null;

        if (!defaultCompany) {
            return res.status(401).json({
                error: 'Aucun dossier comptable actif trouvé pour cet utilisateur.'
            });
        }

        // ── 4. Génération du token JWT ───────────────────────────────────────
        // ✅ FIX2 : name inclus dans le token pour être disponible dans req.user
        const token = signToken({
            odooUid:           uid,
            email,
            role:              profile,
            name:              realName,      // ✅ vrai nom de l'utilisateur
            allowedCompanyIds: companiesList.map(c => c.id),
            selectedCompanyId: defaultCompany.id,
            systeme:           defaultCompany.systeme,
        });

        console.log(`✅ [loginUser] Connexion réussie: ${realName} (${email}) — ${profile}`);

        // ── 5. Réponse ───────────────────────────────────────────────────────
        res.status(200).json({
            status: 'success',
            data: {
                token,
                profile,
                name:           realName,     // ✅ vrai nom dans la réponse
                email,
                companiesList,
                defaultCompany,
            },
        });

    } catch (error) {
        console.error('❌ [loginUser] Erreur:', error.message);
        res.status(401).json({
            error: error.message || 'Échec de l\'authentification.',
        });
    }
};

// =============================================================================
// INSCRIPTION
// =============================================================================

/**
 * Crée un nouvel utilisateur et sa première entreprise dans Odoo
 * @route POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
    const { name, email, password, companyName } = req.body;

    console.log('='.repeat(70));
    console.log('📝 [registerUser] DÉBUT');
    console.log('   Nom:', name);
    console.log('   Email:', email);
    console.log('   Entreprise:', companyName);

    // ── Validation des champs ────────────────────────────────────────────────
    if (!name || !email || !password || !companyName) {
        return res.status(400).json({
            error: 'Tous les champs sont requis (nom, email, mot de passe, entreprise).'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'Le mot de passe doit contenir au moins 8 caractères.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Format d\'email invalide.'
        });
    }

    try {
        // ── 1. Vérifier si l'email existe déjà ──────────────────────────────
        console.log('🔍 Vérification de l\'existence de l\'email...');

        const existingUsers = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'search_read',
            args:   [[['login', '=', email]]],
            kwargs: { fields: ['id', 'login'], limit: 1 }
        });

        if (existingUsers && existingUsers.length > 0) {
            console.error(`❌ Email déjà utilisé: ${email}`);
            return res.status(409).json({
                error: 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.'
            });
        }

        console.log('✅ Email disponible');

        // ── 2. Créer l'entreprise ────────────────────────────────────────────
        console.log(`🏢 Création de l'entreprise "${companyName}"...`);

        const companyId = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.company',
            method: 'create',
            args:   [{ name: companyName, currency_id: 1 }],
            kwargs: {}
        });

        if (!companyId || typeof companyId !== 'number') {
            throw new Error('Échec de la création de l\'entreprise.');
        }

        console.log(`✅ Entreprise créée: ID=${companyId}`);

        // ── 3. Créer l'utilisateur ───────────────────────────────────────────
        console.log(`👤 Création de l'utilisateur "${name}"...`);

        const newUserId = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'create',
            args:   [{
                name:        name,
                login:       email,
                email:       email,
                password:    password,
                active:      true,
                company_ids: [[6, 0, [companyId]]],
                company_id:  companyId,
            }],
            kwargs: {}
        });

        if (!newUserId || typeof newUserId !== 'number') {
            throw new Error('Échec de la création de l\'utilisateur.');
        }

        console.log(`✅ Utilisateur créé: ID=${newUserId}`);

        // ── 4. Assigner les groupes de base ──────────────────────────────────
        console.log('🔐 Assignation des groupes de base...');

        try {
            const userGroups = await odooExecuteKw({
                uid:    ADMIN_UID,
                model:  'res.groups',
                method: 'search_read',
                args:   [[['name', '=', 'User']]],
                kwargs: { fields: ['id'], limit: 1 }
            });

            if (userGroups && userGroups.length > 0) {
                await odooExecuteKw({
                    uid:    ADMIN_UID,
                    model:  'res.groups',
                    method: 'write',
                    args:   [[userGroups[0].id], { users: [[4, newUserId]] }],
                    kwargs: {}
                });
                console.log('✅ Utilisateur ajouté au groupe "User"');
            } else {
                console.warn('⚠️ Groupe "User" non trouvé, utilisateur créé sans groupes');
            }
        } catch (groupError) {
            console.warn('⚠️ Erreur assignation groupes (non bloquant):', groupError.message);
        }

        // ── 5. Générer le JWT ────────────────────────────────────────────────
        console.log('🔑 Génération du JWT...');

        const defaultCompany = {
            id:       companyId,
            name:     companyName,
            systeme:  'NORMAL',
            currency: 'XOF'
        };

        // ✅ FIX3 : name inclus dans le token dès l'inscription
        const token = signToken({
            odooUid:           newUserId,
            email,
            role:              'ADMIN',
            name:              name,          // ✅ vrai nom de l'inscrit
            allowedCompanyIds: [companyId],
            selectedCompanyId: companyId,
            systeme:           'NORMAL',
        });

        console.log('✅ [registerUser] FIN - SUCCÈS');
        console.log('='.repeat(70));

        // ── 6. Email de bienvenue (désactivé — TODO: configurer SMTP) ────────
        // sendWelcomeEmail(email, name, password).catch(err => {
        //     console.warn('⚠️ Email bienvenue échoué:', err.message);
        // });

        // ── 7. Réponse succès ────────────────────────────────────────────────
        res.status(201).json({
            status:  'success',
            message: `Instance "${companyName}" créée avec succès ! Connexion automatique en cours...`,
            data: {
                token,
                profile:       'ADMIN',
                name,
                email,
                companiesList: [defaultCompany],
                defaultCompany,
            },
        });

    } catch (error) {
        console.log('='.repeat(70));
        console.error('🚨 [registerUser] ERREUR:', error.message);
        console.error('Stack:', error.stack);
        console.log('='.repeat(70));

        res.status(500).json({
            error: `Erreur lors de la création du compte : ${error.message}`,
        });
    }
};

// =============================================================================
// ASSIGNER UNE ENTREPRISE
// =============================================================================

/**
 * Assigner une compagnie à un utilisateur
 * @route POST /api/auth/assign-company
 * ✅ E5 : Ne renvoie plus req.body dans la réponse
 */
exports.assignCompany = async (req, res) => {
    res.status(503).json({
        status:  'error',
        message: 'Fonctionnalité temporairement indisponible.'
    });
};

// =============================================================================
// DÉCONNEXION FORCÉE
// =============================================================================

/**
 * Déconnexion forcée
 * @route POST /api/auth/force-logout
 * NOTE : La révocation complète du token (E3) sera ajoutée
 *        après création de la table revoked_tokens sur Supabase.
 */
exports.forceLogout = async (req, res) => {
    res.status(200).json({
        status:  'success',
        message: 'Session terminée. Veuillez supprimer votre token côté client.'
    });
};

// =============================================================================
// PROFIL UTILISATEUR CONNECTÉ
// =============================================================================

/**
 * Récupère les données utilisateur
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Jeton JWT invalide ou manquant.' });
    }

    try {
        const { odooUid, email, role, selectedCompanyId } = req.user;

        // ── Lecture nom + entreprises depuis Odoo ────────────────────────────
        const userData = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'read',
            args:   [[odooUid], ['name', 'company_ids']],
            kwargs: {}
        });

        if (!userData || userData.length === 0) {
            throw new Error('Utilisateur introuvable dans Odoo.');
        }

        if (!userData[0].company_ids || userData[0].company_ids.length === 0) {
            throw new Error('L\'utilisateur n\'est plus lié à une compagnie active.');
        }

        const realName   = userData[0].name || email;
        const companyIds = userData[0].company_ids;

        // ── Entreprises accessibles ──────────────────────────────────────────
        const companies = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.company',
            method: 'search_read',
            args:   role === 'ADMIN'
                ? [[], ['name', 'currency_id']]
                : [[['id', 'in', companyIds]], ['name', 'currency_id']],
            kwargs: { limit: 100 },
        });

        const companiesList = companies.map(c => ({
            id:       c.id,
            name:     c.name,
            systeme:  'NORMAL',
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));

        const currentCompanyName = companiesList.find(c => c.id === selectedCompanyId)?.name || 'GLOBAL';

        res.status(200).json({
            status: 'success',
            data: {
                profile:            role,
                name:               realName,
                email,
                odooUid,
                companiesList,
                selectedCompanyId,
                currentCompanyName,
            },
        });

    } catch (error) {
        console.error('❌ [getMe] Erreur:', error.message);
        res.status(401).json({
            error: error.message || 'Échec de la récupération des données utilisateur.',
        });
    }
};
