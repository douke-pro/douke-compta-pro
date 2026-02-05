// =============================================================================
// FICHIER : controllers/adminUsersController.js
// Description : Gestion des utilisateurs (CRUD complet) - ADMIN uniquement
// Version : V17 - FINALE ODOO 19 (Sans groups_id à la création)
// Corrections : user_ids au lieu de users + Création sans groups_id
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère la liste de tous les utilisateurs
 * @route GET /api/admin/users
 * @access ADMIN uniquement
 */
exports.getAllUsers = async (req, res) => {
    try {
        console.log('📥 [getAllUsers] Récupération de la liste des utilisateurs...');

        // Récupérer tous les utilisateurs d'Odoo
        const users = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'search_read',
            args: [[]],
            kwargs: {
                fields: [
                    'id',
                    'name',
                    'login',
                    'email',
                    'phone',
                    'active',
                    'company_ids',
                    'create_date',
                    'write_date',
                    'login_date'
                ],
                order: 'name ASC'
            }
        });

        // Récupérer les groupes/rôles de chaque utilisateur
        const usersWithRoles = await Promise.all(users.map(async (user) => {
            // ✅ CORRECTION ODOO 19 : user_ids au lieu de users
            const groups = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.groups',
                method: 'search_read',
                args: [[['user_ids', 'in', [user.id]]]], // ✅ CORRIGÉ
                kwargs: {
                    fields: ['name', 'category_id'],
                    limit: 10
                }
            });

            // Déterminer le profil (rôle principal)
            let profile = 'USER'; // Par défaut
            
            // Logique de détermination du rôle basée sur les groupes Odoo
            const groupNames = groups.map(g => g.name.toLowerCase());
            
            if (groupNames.some(name => name.includes('admin') || name.includes('settings'))) {
                profile = 'ADMIN';
            } else if (groupNames.some(name => name.includes('manager') || name.includes('accountant'))) {
                profile = 'COLLABORATEUR';
            } else if (groupNames.some(name => name.includes('user'))) {
                profile = 'USER';
            } else if (groupNames.some(name => name.includes('cash') || name.includes('caisse'))) {
                profile = 'CAISSIER';
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email || user.login,
                phone: user.phone || null,
                profile: profile,
                active: user.active,
                companies: user.company_ids || [],
                created_at: user.create_date,
                updated_at: user.write_date,
                last_login: user.login_date || null
            };
        }));

        console.log(`✅ [getAllUsers] ${usersWithRoles.length} utilisateurs récupérés`);

        res.json({
            status: 'success',
            data: usersWithRoles
        });

    } catch (error) {
        console.error('🚨 [getAllUsers] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des utilisateurs',
            details: error.message
        });
    }
};

/**
 * Récupère les détails d'un utilisateur spécifique
 * @route GET /api/admin/users/:id
 * @access ADMIN uniquement
 */
exports.getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        console.log(`📋 [getUserById] User ID: ${userId}`);

        const users = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[userId], [
                'id',
                'name',
                'login',
                'email',
                'phone',
                'active',
                'company_ids'
            ]],
            kwargs: {}
        });

        if (!users || users.length === 0) {
            return res.status(404).json({
                status: 'error',
                error: 'Utilisateur introuvable'
            });
        }

        const user = users[0];

        // ✅ CORRECTION ODOO 19 : user_ids au lieu de users
        const groups = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.groups',
            method: 'search_read',
            args: [[['user_ids', 'in', [userId]]]], // ✅ CORRIGÉ
            kwargs: {
                fields: ['name'],
                limit: 10
            }
        });

        const groupNames = groups.map(g => g.name.toLowerCase());
        let profile = 'USER';
        
        if (groupNames.some(name => name.includes('admin'))) {
            profile = 'ADMIN';
        } else if (groupNames.some(name => name.includes('manager') || name.includes('accountant'))) {
            profile = 'COLLABORATEUR';
        } else if (groupNames.some(name => name.includes('cash'))) {
            profile = 'CAISSIER';
        }

        console.log(`✅ [getUserById] Utilisateur ${user.name} récupéré`);

        res.json({
            status: 'success',
            data: {
                id: user.id,
                name: user.name,
                email: user.email || user.login,
                phone: user.phone || null,
                profile: profile,
                active: user.active,
                companies: user.company_ids || []
            }
        });

    } catch (error) {
        console.error('🚨 [getUserById] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération de l\'utilisateur',
            details: error.message
        });
    }
};

/**
 * Crée un nouvel utilisateur
 * @route POST /api/admin/users
 * @access ADMIN uniquement
 * ✅ ODOO 19 : Création SANS groups_id (à assigner manuellement après)
 */
exports.createUser = async (req, res) => {
    try {
        const { name, email, phone, profile, password, companies } = req.body;

        console.log('➕ [createUser] Création utilisateur:', { name, email, profile });

        // Validation
        if (!name || !email || !profile || !password) {
            return res.status(400).json({
                status: 'error',
                error: 'Nom, email, profil et mot de passe requis'
            });
        }

        if (!companies || companies.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Au moins une entreprise doit être assignée'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                status: 'error',
                error: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Vérifier si l'email existe déjà
        const existingUsers = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'search_read',
            args: [[['login', '=', email]]],
            kwargs: { fields: ['id'], limit: 1 }
        });

        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({
                status: 'error',
                error: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // ✅ CORRECTION ODOO 19 : Créer SANS groups_id
        console.log(`📋 [createUser] Création sans groupes (à assigner manuellement dans Odoo)`);
        
        const newUserId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'create',
            args: [{
                name: name,
                login: email,
                email: email,
                phone: phone || false,
                password: password,
                active: true,
                company_ids: [[6, 0, companies]],
                company_id: companies[0]
                // ✅ PAS DE groups_id - À assigner manuellement dans Odoo
            }],
            kwargs: {}
        });

        console.log(`✅ [createUser] Utilisateur créé avec ID: ${newUserId}`);
        console.log(`⚠️ IMPORTANT: Assigner le rôle "${profile}" manuellement dans Odoo (Paramètres → Utilisateurs → ID ${newUserId})`);

        res.status(201).json({
            status: 'success',
            message: `Utilisateur créé avec succès. IMPORTANT: Assigner le rôle "${profile}" manuellement dans Odoo.`,
            data: {
                id: newUserId,
                name,
                email,
                profile,
                note: 'Les permissions doivent être configurées dans Odoo : Paramètres → Utilisateurs'
            }
        });

    } catch (error) {
        console.error('🚨 [createUser] Erreur:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la création de l\'utilisateur',
            details: error.message
        });
    }
};

/**
 * Met à jour un utilisateur existant
 * @route PUT /api/admin/users/:id
 * @access ADMIN uniquement
 * ✅ ODOO 19 : Ne touche PAS aux groups_id (à modifier manuellement dans Odoo)
 */
exports.updateUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, phone, profile, companies } = req.body;

        console.log(`✏️ [updateUser] User ID: ${userId}`);

        // Construire l'objet de mise à jour
        const updateData = {};
        if (name) updateData.name = name;
        if (email) {
            updateData.login = email;
            updateData.email = email;
        }
        if (phone !== undefined) updateData.phone = phone || false;
        if (companies && companies.length > 0) {
            updateData.company_ids = [[6, 0, companies]];
            updateData.company_id = companies[0];
        }

        // ✅ Ne PAS mettre à jour groups_id en Odoo 19
        if (profile) {
            console.log(`⚠️ Changement de profil demandé vers "${profile}" → À faire manuellement dans Odoo`);
        }

        // Mettre à jour dans Odoo
        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'write',
            args: [[userId], updateData],
            kwargs: {}
        });

        console.log(`✅ [updateUser] Utilisateur ${userId} mis à jour`);

        const responseMessage = profile 
            ? `Utilisateur mis à jour. IMPORTANT: Modifier le rôle "${profile}" manuellement dans Odoo.`
            : 'Utilisateur mis à jour avec succès';

        res.json({
            status: 'success',
            message: responseMessage
        });

    } catch (error) {
        console.error('🚨 [updateUser] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la mise à jour de l\'utilisateur',
            details: error.message
        });
    }
};

/**
 * Active/Désactive un utilisateur
 * @route PATCH /api/admin/users/:id/toggle-status
 * @access ADMIN uniquement
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { active } = req.body;

        console.log(`🔄 [toggleUserStatus] User ID: ${userId}, Active: ${active}`);

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'write',
            args: [[userId], { active: active }],
            kwargs: {}
        });

        console.log(`✅ [toggleUserStatus] Utilisateur ${userId} ${active ? 'activé' : 'désactivé'}`);

        res.json({
            status: 'success',
            message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
        });

    } catch (error) {
        console.error('🚨 [toggleUserStatus] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors du changement de statut',
            details: error.message
        });
    }
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 * @route PATCH /api/admin/users/:id/reset-password
 * @access ADMIN uniquement
 */
exports.resetUserPassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { new_password } = req.body;

        console.log(`🔑 [resetUserPassword] User ID: ${userId}`);

        if (!new_password || new_password.length < 8) {
            return res.status(400).json({
                status: 'error',
                error: 'Le mot de passe doit contenir au moins 8 caractères'
            });
        }

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'write',
            args: [[userId], { password: new_password }],
            kwargs: {}
        });

        console.log(`✅ [resetUserPassword] Mot de passe réinitialisé pour user ${userId}`);

        res.json({
            status: 'success',
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error) {
        console.error('🚨 [resetUserPassword] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la réinitialisation du mot de passe',
            details: error.message
        });
    }
};

/**
 * Met à jour les entreprises assignées à un utilisateur
 * @route PUT /api/admin/users/:id/companies
 * @access ADMIN uniquement
 */
exports.updateUserCompanies = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { company_ids } = req.body;

        console.log(`🏢 [updateUserCompanies] User ID: ${userId}, Companies: ${company_ids}`);

        if (!company_ids || company_ids.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Au moins une entreprise doit être assignée'
            });
        }

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'write',
            args: [[userId], {
                company_ids: [[6, 0, company_ids]],
                company_id: company_ids[0]
            }],
            kwargs: {}
        });

        console.log(`✅ [updateUserCompanies] Entreprises mises à jour pour user ${userId}`);

        res.json({
            status: 'success',
            message: 'Entreprises mises à jour avec succès'
        });

    } catch (error) {
        console.error('🚨 [updateUserCompanies] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la mise à jour des entreprises',
            details: error.message
        });
    }
};

/**
 * Supprime un utilisateur (désactivation recommandée)
 * @route DELETE /api/admin/users/:id
 * @access ADMIN uniquement
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        console.log(`🗑️ [deleteUser] User ID: ${userId}`);

        // Désactiver au lieu de supprimer (bonne pratique Odoo)
        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'write',
            args: [[userId], { active: false }],
            kwargs: {}
        });

        console.log(`✅ [deleteUser] Utilisateur ${userId} désactivé`);

        res.json({
            status: 'success',
            message: 'Utilisateur désactivé avec succès'
        });

    } catch (error) {
        console.error('🚨 [deleteUser] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la suppression de l\'utilisateur',
            details: error.message
        });
    }
};
