// =============================================================================
// FICHIER : controllers/authController.js
// Version : V22 — Notification admin email fixe Resend
// Corrections appliquées :
//   ✅ C1   : JWT_SECRET sans fallback dangereux
//   ✅ FIX1 : Récupération du vrai nom Odoo de l'utilisateur connecté
//   ✅ FIX2 : name ajouté dans le token JWT (loginUser)
//   ✅ FIX3 : name ajouté dans le token JWT (registerUser)
//   ✅ E5   : assignCompany ne renvoie plus req.body
//   ✅ M1   : ADMIN_UID converti en entier
//   ✅ V21  : no_reset_password:true — bloque l'email Odoo natif
//   ✅ V21  : sendWelcomeEmail activé — email DOUKÈ envoyé à l'inscription
//   ✅ V21  : Toute nouvelle inscription = rôle USER (jamais ADMIN)
//   ✅ V22  : ADMIN_NOTIFICATION_EMAIL fixe — indépendant de l'identifiant Odoo
//             → notification admin à chaque connexion ET à chaque inscription
//             → getCompanyAdmin conservée mais remplacée par email fixe
// =============================================================================

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { odooAuthenticate, odooExecuteKw } = require('../services/odooService');
const emailService = require('../services/emailService');

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

// ✅ V22 : Email fixe pour les notifications admin
// Complètement indépendant de l'identifiant de connexion Odoo de l'admin
// Modifiable via variable d'environnement Render sans toucher au code
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'contact@doukegf.bj';
const ADMIN_NOTIFICATION_NAME  = process.env.ADMIN_NOTIFICATION_NAME  || 'Administrateur DOUKÈ';

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
// HELPER : Récupère l'admin de la company pour notification
// ✅ V22 : Conservé mais non appelé — remplacé par email fixe ADMIN_NOTIFICATION_EMAIL
// Retourne null si introuvable ou si c'est l'utilisateur lui-même
// =============================================================================

const getCompanyAdmin = async (companyId, excludeEmail) => {
    try {
        const adminUsers = await odooExecuteKw({
            uid:    ADMIN_UID,
            model:  'res.users',
            method: 'search_read',
            args:   [[
                ['company_id', '=', companyId],
                ['share',      '=', false]
            ]],
            kwargs: {
                fields : ['name', 'email'],
                limit  : 5,
                order  : 'id ASC'
            }
        });

        if (!adminUsers || adminUsers.length === 0) return null;

        const admin = adminUsers.find(u => u.email && u.email !== excludeEmail);
        return admin || null;

    } catch (e) {
        console.warn('⚠️ [getCompanyAdmin] Impossible de récupérer l\'admin:', e.message);
        return null;
    }
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
        const token = signToken({
            odooUid:           uid,
            email,
            role:              profile,
            name:              realName,
            allowedCompanyIds: companiesList.map(c => c.id),
            selectedCompanyId: defaultCompany.id,
            systeme:           defaultCompany.systeme,
        });

        console.log(`✅ [loginUser] Connexion réussie: ${realName} (${email}) — ${profile}`);

        // ── 5. Réponse — envoyée AVANT la notification pour ne jamais bloquer ─
        res.status(200).json({
            status: 'success',
            data: {
                token,
                profile,
                name:           realName,
                email,
                companiesList,
                defaultCompany,
            },
        });

        // ── 6. Notification admin — fire-and-forget APRÈS res.json() ─────────
        // ✅ V22 : Email fixe — plus de dépendance à getCompanyAdmin/Odoo
        // Exécuté après la réponse : ne peut jamais retarder ni crasher le login
        emailService.sendNewLoginNotification({
            adminEmail  : ADMIN_NOTIFICATION_EMAIL,
            adminName   : ADMIN_NOTIFICATION_NAME,
            userName    : realName,
            userEmail   : email,
            companyName : defaultCompany.name,
            ipAddress   : req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                          || req.socket?.remoteAddress
                          || 'unknown',
            loginAt     : new Date().toISOString()
        }).then(result => {
            if (result.success) {
                console.log(`✅ [loginUser] Notification admin envoyée à ${ADMIN_NOTIFICATION_EMAIL}`);
            } else {
                console.warn(`⚠️ [loginUser] Notification admin échouée (non bloquant): ${result.error}`);
            }
        }).catch(err => {
            console.warn('⚠️ [loginUser] Exception notification admin (non bloquant):', err.message);
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
 * ✅ V21 : Toute nouvelle inscription = rôle USER — jamais ADMIN
 * ✅ V21 : no_reset_password:true — bloque l'email d'invitation Odoo natif
 * ✅ V21 : sendWelcomeEmail activé — email de bienvenue DOUKÈ envoyé
 * ✅ V22 : Notification admin à chaque nouvelle inscription
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
        // ✅ V21 : Rôle USER systématique — jamais ADMIN par défaut
        // ✅ V21 : no_reset_password:true — bloque l'email d'invitation Odoo natif
        console.log(`👤 Création de l'utilisateur "${name}" avec rôle USER...`);

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
            kwargs: {
                context: {
                    // ✅ V21 : Supprime l'envoi automatique de l'email d'invitation Odoo
                    no_reset_password   : true,
                    allowed_company_ids : [companyId]
                }
            }
        });

        if (!newUserId || typeof newUserId !== 'number') {
            throw new Error('Échec de la création de l\'utilisateur.');
        }

        console.log(`✅ Utilisateur créé: ID=${newUserId} — Rôle: USER`);

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
        // ✅ V21 : role = 'USER' — jamais 'ADMIN' à l'inscription
        console.log('🔑 Génération du JWT avec rôle USER...');

        const defaultCompany = {
            id:       companyId,
            name:     companyName,
            systeme:  'NORMAL',
            currency: 'XOF'
        };

        const token = signToken({
            odooUid:           newUserId,
            email,
            role:              'USER',
            name:              name,
            allowedCompanyIds: [companyId],
            selectedCompanyId: companyId,
            systeme:           'NORMAL',
        });

        console.log('✅ [registerUser] FIN - SUCCÈS');
        console.log('='.repeat(70));

        // ── 6. Réponse — envoyée AVANT les emails pour ne jamais bloquer ──────
        res.status(201).json({
            status:  'success',
            message: `Instance "${companyName}" créée avec succès ! Connexion automatique en cours...`,
            data: {
                token,
                profile:       'USER',
                name,
                email,
                companiesList: [defaultCompany],
                defaultCompany,
            },
        });

        // ── 7a. Email de bienvenue DOUKÈ — fire-and-forget APRÈS res.json() ──
        // ✅ V21 : Activé — emailService.js opérationnel avec Resend
        // Ne bloque jamais la création du compte si l'email échoue
        emailService.sendWelcomeEmail({
            toEmail     : email,
            toName      : name,
            companyName : companyName,
            tempPassword: password,
            role        : 'USER'
        }).then(result => {
            if (result.success) {
                console.log(`✅ [registerUser] Email bienvenue DOUKÈ envoyé à ${email} — ID: ${result.id}`);
            } else {
                console.warn(`⚠️ [registerUser] Email bienvenue échoué (non bloquant): ${result.error}`);
            }
        }).catch(err => {
            console.warn('⚠️ [registerUser] Exception email bienvenue (non bloquant):', err.message);
        });

        // ── 7b. Notification admin — nouvelle inscription ─────────────────────
        // ✅ V22 : Email fixe — indépendant de l'identifiant Odoo de l'admin
        // Exécuté après res.json() — ne peut jamais bloquer ni crasher
        emailService.sendNewLoginNotification({
            adminEmail  : ADMIN_NOTIFICATION_EMAIL,
            adminName   : ADMIN_NOTIFICATION_NAME,
            userName    : name,
            userEmail   : email,
            companyName : companyName,
            ipAddress   : req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                          || req.socket?.remoteAddress
                          || 'unknown',
            loginAt     : new Date().toISOString()
        }).then(result => {
            if (result.success) {
                console.log(`✅ [registerUser] Notification admin envoyée à ${ADMIN_NOTIFICATION_EMAIL}`);
            } else {
                console.warn(`⚠️ [registerUser] Notification admin échouée (non bloquant): ${result.error}`);
            }
        }).catch(err => {
            console.warn('⚠️ [registerUser] Exception notification admin (non bloquant):', err.message);
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
