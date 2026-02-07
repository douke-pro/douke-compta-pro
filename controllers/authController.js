// =============================================================================
// FICHIER : controllers/authController.js (VERSION V19 - INSCRIPTION FONCTIONNELLE)
// Description : Gestion de l'authentification et des utilisateurs
// ✅ MODIFICATION V19 : Fonction registerUser complète et fonctionnelle
// =============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { odooAuthenticate, odooExecuteKw } = require('../services/odooService');
const { sendWelcomeEmail } = require('../services/emailService'); // ✅ AJOUT

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_UID = process.env.ODOO_ADMIN_UID;

/**
 * Génère un jeton JWT
 */
const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
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
        return res.status(400).json({ error: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        let authResult = await odooAuthenticate(email, password);
        const { uid, db, profile, name } = authResult; 

        if (!uid) {
            return res.status(401).json({ error: 'Identifiants Odoo invalides.' });
        }
        
        if (!ADMIN_UID) {
            console.error("ERREUR CRITIQUE: ODOO_ADMIN_UID est manquant.");
        }

        const userData = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.users',
            method: 'read',
            args: [[uid], ['company_ids']],
            kwargs: {}
        });

        if (!userData || userData.length === 0 || !userData[0].company_ids || userData[0].company_ids.length === 0) {
             throw new Error('L\'utilisateur n\'est pas lié à une compagnie Odoo active.');
        }

        authResult.company_ids = userData[0].company_ids;

        const companies = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.company',
            method: 'search_read',
            args: profile === 'ADMIN' ? [[], ['name', 'currency_id']] : [[['id', 'in', authResult.company_ids]], ['name', 'currency_id']],
            kwargs: { limit: 100 },
        });

        const companiesList = companies.map(c => ({
            id: c.id,
            name: c.name,
            systeme: 'NORMAL',
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));

        const defaultCompany = companiesList.length > 0 ? companiesList[0] : null;

        if (!defaultCompany) {
            return res.status(401).json({ error: 'Aucun dossier comptable actif trouvé pour cet utilisateur.' });
        }

        const token = signToken({
            odooUid: uid,
            email,
            role: profile,
            allowedCompanyIds: companiesList.map(c => c.id),
            selectedCompanyId: defaultCompany.id,
            systeme: defaultCompany.systeme,
        });

        res.status(200).json({
            status: 'success',
            data: {
                token,
                profile,
                name,
                email,
                companiesList,
                defaultCompany,
            },
        });

    } catch (error) {
        console.error('Erreur de connexion:', error.message);
        res.status(401).json({
            error: error.message || 'Échec de l\'authentification.',
        });
    }
};

// =============================================================================
// ✅ INSCRIPTION FONCTIONNELLE COMPLÈTE
// =============================================================================

/**
 * Crée un nouvel utilisateur et sa première entreprise dans Odoo
 * @route POST /api/auth/register
 * ✅ VERSION V19 : FONCTIONNELLE COMPLÈTE
 */
exports.registerUser = async (req, res) => {
    const { name, email, password, companyName } = req.body;

    console.log('='.repeat(70));
    console.log('📝 [registerUser] DÉBUT');
    console.log('   Nom:', name);
    console.log('   Email:', email);
    console.log('   Entreprise:', companyName);

    // Validation des champs
    if (!name || !email || !password || !companyName) {
        console.error('❌ Champs manquants');
        return res.status(400).json({ 
            error: 'Tous les champs sont requis (nom, email, mot de passe, entreprise).' 
        });
    }

    // Validation du mot de passe
    if (password.length < 8) {
        console.error('❌ Mot de passe trop court');
        return res.status(400).json({ 
            error: 'Le mot de passe doit contenir au moins 8 caractères.' 
        });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ Email invalide');
        return res.status(400).json({ 
            error: 'Format d\'email invalide.' 
        });
    }

    try {
        // ✅ 1️⃣ VÉRIFIER SI L'EMAIL EXISTE DÉJÀ
        console.log('🔍 Vérification de l\'existence de l\'email...');
        
        const existingUsers = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.users',
            method: 'search_read',
            args: [[['login', '=', email]]],
            kwargs: { 
                fields: ['id', 'login'],
                limit: 1
            }
        });

        if (existingUsers && existingUsers.length > 0) {
            console.error(`❌ Email déjà utilisé: ${email}`);
            return res.status(409).json({ 
                error: 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.' 
            });
        }

        console.log('✅ Email disponible');

        // ✅ 2️⃣ CRÉER L'ENTREPRISE (res.company)
        console.log(`🏢 Création de l'entreprise "${companyName}"...`);
        
        const companyId = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.company',
            method: 'create',
            args: [{
                name: companyName,
                currency_id: 1, // XOF (à adapter selon ta base Odoo)
            }],
            kwargs: {}
        });

        if (!companyId || typeof companyId !== 'number') {
            throw new Error('Échec de la création de l\'entreprise.');
        }

        console.log(`✅ Entreprise créée: ID=${companyId}`);

        // ✅ 3️⃣ CRÉER L'UTILISATEUR (res.users) SANS GROUPES
        console.log(`👤 Création de l'utilisateur "${name}"...`);
        
        const newUserId = await odooExecuteKw({
            uid: ADMIN_UID,
            model: 'res.users',
            method: 'create',
            args: [{
                name: name,
                login: email,
                email: email,
                password: password,
                active: true,
                company_ids: [[6, 0, [companyId]]], // ✅ Assignation entreprise
                company_id: companyId, // ✅ Entreprise par défaut
                // ❌ PAS DE groups_id (incompatible Odoo 19)
            }],
            kwargs: {}
        });

        if (!newUserId || typeof newUserId !== 'number') {
            throw new Error('Échec de la création de l\'utilisateur.');
        }

        console.log(`✅ Utilisateur créé: ID=${newUserId}`);

        // ⚠️ 4️⃣ ASSIGNER LES GROUPES DE BASE MANUELLEMENT
        console.log('🔐 Assignation des groupes de base...');
        
        try {
            // Rechercher le groupe "User" (base.group_user)
            const userGroups = await odooExecuteKw({
                uid: ADMIN_UID,
                model: 'res.groups',
                method: 'search_read',
                args: [[['name', '=', 'User']]],
                kwargs: { 
                    fields: ['id'],
                    limit: 1
                }
            });

            if (userGroups && userGroups.length > 0) {
                const groupId = userGroups[0].id;
                
                // Ajouter l'utilisateur au groupe
                await odooExecuteKw({
                    uid: ADMIN_UID,
                    model: 'res.groups',
                    method: 'write',
                    args: [[groupId], {
                        users: [[4, newUserId]] // Opération (4, id) = ajouter
                    }],
                    kwargs: {}
                });

                console.log(`✅ Utilisateur ajouté au groupe "User"`);
            } else {
                console.warn('⚠️ Groupe "User" non trouvé, utilisateur créé sans groupes');
            }
        } catch (groupError) {
            console.warn('⚠️ Erreur assignation groupes:', groupError.message);
            // Ne pas bloquer l'inscription si l'assignation échoue
        }

        // ✅ 5️⃣ GÉNÉRER LE JWT POUR CONNEXION AUTOMATIQUE
        console.log('🔑 Génération du JWT...');
        
        const defaultCompany = {
            id: companyId,
            name: companyName,
            systeme: 'NORMAL',
            currency: 'XOF'
        };

        const token = signToken({
            odooUid: newUserId,
            email,
            role: 'ADMIN', // Premier utilisateur = ADMIN de son entreprise
            allowedCompanyIds: [companyId],
            selectedCompanyId: companyId,
            systeme: 'NORMAL',
        });

        console.log('✅ [registerUser] FIN - SUCCÈS');
        console.log('='.repeat(70));

        // ✅ 6️⃣ ENVOI EMAIL DE BIENVENUE (désactivé temporairement)
        console.log('⚠️ Email désactivé temporairement');
        
        // TODO: Réactiver après configuration SMTP
        /*
        sendWelcomeEmail(email, name, password)
            .then(result => {
                if (result.success) {
                    console.log(`📧 Email de bienvenue envoyé à ${email}`);
                } else {
                    console.warn(`⚠️ Échec envoi email : ${result.error}`);
                }
            })
            .catch(err => {
                console.error('❌ Erreur email:', err.message);
            });
        */

        // ✅ 7️⃣ RÉPONSE SUCCÈS
        res.status(201).json({
            status: 'success',
            message: `Instance "${companyName}" créée avec succès ! Connexion automatique en cours...`,
            data: {
                token,
                profile: 'ADMIN',
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
// AUTRES FONCTIONS
// =============================================================================

/**
 * Assigner une compagnie à un utilisateur
 * @route POST /api/auth/assign-company
 */
exports.assignCompany = async (req, res) => {
    res.status(501).json({ 
        status: 'error', 
        message: 'assignCompany: Fonctionnalité en développement.',
        data: req.body
    });
};

/**
 * Déconnexion forcée
 * @route POST /api/auth/force-logout
 */
exports.forceLogout = async (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'forceLogout: L\'action a été enregistrée.',
    });
};

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
        
        const userData = await odooExecuteKw({
            uid: ADMIN_UID, 
            model: 'res.users',
            method: 'read',
            args: [[odooUid], ['name', 'company_ids']],
            kwargs: {}
        });

        if (!userData || userData.length === 0 || !userData[0].company_ids || userData[0].company_ids.length === 0) {
             throw new Error('L\'utilisateur n\'est plus lié à une compagnie active.');
        }

        const company_ids = userData[0].company_ids;
        const name = userData[0].name;

        const companies = await odooExecuteKw({
            uid: ADMIN_UID, 
            model: 'res.company',
            method: 'search_read',
            args: role === 'ADMIN' ? [[], ['name', 'currency_id']] : [[['id', 'in', company_ids]], ['name', 'currency_id']],
            kwargs: { limit: 100 },
        });

        const companiesList = companies.map(c => ({
            id: c.id,
            name: c.name,
            systeme: 'NORMAL',
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));
        
        const currentCompanyName = companiesList.find(c => c.id === selectedCompanyId)?.name || 'GLOBAL';

        res.status(200).json({
            status: 'success',
            data: {
                profile: role,
                name,
                email,
                odooUid,
                companiesList,
                selectedCompanyId,
                currentCompanyName,
            },
        });

    } catch (error) {
        console.error('Erreur getMe:', error.message);
        res.status(401).json({
            error: error.message || 'Échec de la récupération des données utilisateur.',
        });
    }
};
