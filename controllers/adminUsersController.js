// =============================================================================
// FICHIER : controllers/adminUsersController.js
// Description : Gestion des utilisateurs (CRUD complet) - ADMIN uniquement
// Version : V19 - FINALE CERTIFIÉE ODOO 19
// Corrections : 
//   - Commentaires corrigés (categ_id est correct, pas category_id)
//   - Gestion d'erreurs renforcée
//   - Logs détaillés pour debugging
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

/**
 * Récupère la liste de tous les utilisateurs
 * @route GET /api/admin/users
 * @access ADMIN uniquement
 */
// ============================================================
// UTILITAIRE : Pause entre requêtes
// ============================================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// UTILITAIRE : Exécution séquentielle par batch avec délai
// ============================================================
const batchSequential = async (items, asyncFn, batchSize = 3, delayMs = 300) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(asyncFn));
        results.push(...batchResults);
        if (i + batchSize < items.length) {
            await sleep(delayMs); // ✅ Pause entre chaque batch
        }
    }
    return results;
};

// ============================================================
// CONTROLLER : getAllUsers — Version Odoo 19 SaaS Anti-429
// ============================================================
exports.getAllUsers = async (req, res) => {
    try {
        console.log('📥 [getAllUsers] Récupération de la liste des utilisateurs...');

        // ── ÉTAPE 1 : Tous les users en 1 seule requête ──────────────
       const users = await odooExecuteKw({
    uid: ADMIN_UID_INT,
    model: 'res.users',
    method: 'search_read',
    args: [[
        ['share', '=', false]
    ]],
            kwargs: {
                fields: [
                    'id', 'name', 'login', 'email',
                    'phone', 'active', 'company_ids',
                    'create_date', 'write_date', 'login_date',
                    'groups_id'   // ✅ Natif Odoo 19 — IDs des groupes
                ],
                order: 'name ASC'
            }
        });

        console.log(`📊 [getAllUsers] ${users.length} utilisateurs trouvés dans Odoo`);

        // ── ÉTAPE 2 : LOG DE VÉRIFICATION (à retirer après validation) ─
        if (users.length > 0) {
            console.log('🧪 [TEST] groups_id sample user[0]:', {
                id: users[0].id,
                name: users[0].name,
                groups_id: users[0].groups_id
            });
        }

        // ── ÉTAPE 3 : Collecter tous les group IDs uniques ────────────
        const allGroupIds = [...new Set(users.flatMap(u => u.groups_id || []))];
        console.log(`🔍 [getAllUsers] ${allGroupIds.length} group IDs uniques à résoudre`);

        // ── ÉTAPE 4 : UNE seule requête pour TOUS les groupes ─────────
        let groupsMap = {}; // { id → name_lowercase }

        if (allGroupIds.length > 0) {
            try {
                const allGroups = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'res.groups',
                    method: 'search_read',
                    args: [[['id', 'in', allGroupIds]]],
                    kwargs: {
                        fields: ['id', 'name'],
                        limit: 500
                    }
                });

                allGroups.forEach(g => {
                    groupsMap[g.id] = g.name.toLowerCase();
                });

                console.log(`📦 [getAllUsers] ${allGroups.length} groupes résolus en 1 requête`);

            } catch (groupFetchError) {
                // ✅ Si la requête groupes échoue → on continue sans profil enrichi
                console.error('⚠️ [getAllUsers] Impossible de charger les groupes:', groupFetchError.message);
            }
        }

        // ── ÉTAPE 5 : Enrichir les users LOCALEMENT (zéro requête) ───
        const usersWithRoles = users.map(user => {
            const userGroupNames = (user.groups_id || []).map(gid => groupsMap[gid] || '');

            let profile = 'USER'; // défaut

            if (userGroupNames.some(n =>
                n.includes('admin') ||
                n.includes('settings') ||
                n.includes('administration')
            )) {
                profile = 'ADMIN';
            } else if (userGroupNames.some(n =>
                n.includes('manager') ||
                n.includes('accountant') ||
                n.includes('comptable') ||
                n.includes('gestionnaire')
            )) {
                profile = 'COLLABORATEUR';
            } else if (userGroupNames.some(n =>
                n.includes('cash') ||
                n.includes('caisse') ||
                n.includes('cashier')
            )) {
                profile = 'CAISSIER';
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email || user.login,
                phone: user.phone || null,
                profile,
                active: user.active,
                companies: user.company_ids || [],
                created_at: user.create_date,
                updated_at: user.write_date,
                last_login: user.login_date || null
            };
        });

        console.log(`✅ [getAllUsers] ${usersWithRoles.length} utilisateurs enrichis avec succès`);

        res.json({
            status: 'success',
            count: usersWithRoles.length,
            data: usersWithRoles
        });

    } catch (error) {
        console.error('🚨 [getAllUsers] Erreur critique:', error.message);
        console.error('Stack:', error.stack);

        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des utilisateurs',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

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

        // ✅ ODOO 19 : user_ids au lieu de users
        const groups = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.groups',
            method: 'search_read',
            args: [[['user_ids', 'in', [userId]]]],
            kwargs: {
                fields: ['name'], // Pas besoin de categ_id ici
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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        // ✅ VALIDATION STRICTE
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

        // ✅ Validation email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                error: 'Format d\'email invalide'
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

        // ✅ ODOO 19 : Créer SANS groups_id
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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

        console.log(`✏️ [updateUser] User ID: ${userId}`);

        // Construire l'objet de mise à jour
        const updateData = {};
        if (name) updateData.name = name;
        if (email) {
            // ✅ Validation email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Format d\'email invalide'
                });
            }
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

        // Vérifier que l'objet n'est pas vide
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucune donnée à mettre à jour'
            });
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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

        if (typeof active !== 'boolean') {
            return res.status(400).json({
                status: 'error',
                error: 'Le paramètre "active" doit être un booléen'
            });
        }

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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

        console.log(`🏢 [updateUserCompanies] User ID: ${userId}, Companies: ${company_ids}`);

        if (!company_ids || company_ids.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Au moins une entreprise doit être assignée'
            });
        }

        // ✅ Validation que company_ids est un tableau d'entiers
        if (!Array.isArray(company_ids) || !company_ids.every(id => Number.isInteger(id) && id > 0)) {
            return res.status(400).json({
                status: 'error',
                error: 'Les IDs d\'entreprises doivent être des entiers positifs'
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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'ID utilisateur invalide'
            });
        }

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
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};
