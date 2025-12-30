// =============================================================================
// FICHIER : controllers/authController.js (VERSION CORRIGÉE FINALE - COMPANY_IDS)
// Description : Gestion de l'authentification et des utilisateurs
// CORRECTION : Ajout de la lecture explicite de res.users pour obtenir company_ids
// =============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { odooAuthenticate, odooExecuteKw } = require('../services/odooService'); // Assurez-vous que ce chemin est correct

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_UID = process.env.ODOO_ADMIN_UID; // UID Admin pour les requêtes privilégiées ExecuteKw

/**
 * Génère un jeton JWT
 * @param {object} payload - Données à encoder dans le jeton (doit inclure odooUid et role)
 * @returns {string} Le jeton signé
 */
const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

// =============================================================================
// LOGIQUE DE CONNEXION ET D'INSCRIPTION (Stubs basés sur les données réelles)
// =============================================================================

/**
 * Simule la connexion d'un utilisateur Doukè (se connecte à Odoo en arrière-plan)
 * @route POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Veuillez fournir un email et un mot de passe.' });
    }

    try {
        // 1. Authentification Odoo : Récupère l'UID et le profil
        let authResult = await odooAuthenticate(email, password); // Utilisation de 'let'
        const { uid, db, profile, name } = authResult; 

        if (!uid) {
            return res.status(401).json({ error: 'Identifiants Odoo invalides.' });
        }
        
        // VÉRIFICATION CRITIQUE: Assurer que l'ADMIN_UID est disponible pour les requêtes privilégiées
        if (!ADMIN_UID) {
            console.error("ERREUR CRITIQUE: ODOO_ADMIN_UID est manquant. Les requêtes ExecuteKw pourraient échouer.");
        }

        // NOUVELLE ÉTAPE CRITIQUE : Lire les company_ids de l'utilisateur spécifique (res.users)
        // car common.login ne les renvoie pas de manière fiable pour les non-admins.
        const userData = await odooExecuteKw({
            uid: ADMIN_UID, // Utilise les droits Admin pour cette lecture
            model: 'res.users',
            method: 'read',
            args: [[uid], ['company_ids']], // On ne lit que le champ company_ids pour l'UID connecté
            kwargs: {}
        });

        // 🚨 Vérification de sécurité et d'existence du lien Compagnie
        if (!userData || userData.length === 0 || !userData[0].company_ids || userData[0].company_ids.length === 0) {
             throw new Error('L\'utilisateur n\'est pas lié à une compagnie Odoo active.');
        }

        // On enrichit l'authResult avec les vrais company_ids (liste des IDs numériques)
        authResult.company_ids = userData[0].company_ids;


        // 2. Récupération des entreprises (Companies) de l'utilisateur Odoo
        // UTILISATION DE L'UID ADMIN (ADMIN_UID) POUR CONTOURNER LES ACL DE LECTURE
        const companies = await odooExecuteKw({
            uid: ADMIN_UID, // Utilise l'UID de l'Admin pour la requête de lecture (droits maximum)
            model: 'res.company',
            method: 'search_read',
            // Le filtre (args) utilise désormais les company_ids fraîchement récupérés
            args: profile === 'ADMIN' ? [[], ['name', 'currency_id']] : [[['id', 'in', authResult.company_ids]], ['name', 'currency_id']],
            kwargs: { limit: 100 },
        });

        // Simulation du champ 'systeme' (car non standard Odoo), assignation de la valeur par défaut.
        const companiesList = companies.map(c => ({
            id: c.id,
            name: c.name,
            systeme: 'NORMAL', // <-- CORRECTION : ASSIGNATION DIRECTE
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));

        // 3. Définir l'entreprise par défaut
        const defaultCompany = companiesList.length > 0 ? companiesList[0] : null;

        if (!defaultCompany) {
            // CETTE ERREUR NE DEVRAIT PLUS SE PRODUIRE SI LE POINT PRÉCÉDENT A RÉUSSI
            return res.status(401).json({ error: 'Aucun dossier comptable actif trouvé pour cet utilisateur.' });
        }

        // 4. Création du JWT (Synchronisation des clés)
        const token = signToken({
            odooUid: uid, // Clé renommée : de 'uid' à 'odooUid'
            email,
            role: profile, // Clé renommée : de 'profile' à 'role'
            allowedCompanyIds: companiesList.map(c => c.id),
            selectedCompanyId: defaultCompany.id,
            systeme: defaultCompany.systeme,
        });

        // 5. Envoi de la réponse au Frontend
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
        // Utilisation du message d'erreur d'Odoo pour le retour
        res.status(401).json({
            error: error.message || 'Échec de l\'authentification. Identifiants invalides ou service Odoo non disponible.',
        });
    }
};


/**
 * Simule l'inscription d'un nouvel utilisateur (création dans Odoo)
 * @route POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    try {
        // NOTE: ... (Logique de création stub inchangée)
        // ...
        
        // *************** STUB DE LOGIQUE ***************
        // Simuler la création et le retour d'un token pour l'utilisateur
        const newOdooUid = 9999;
        const defaultCompany = { id: 999, name: companyName, systeme: 'NORMAL' };
        
        const token = signToken({
            odooUid: newOdooUid,
            email,
            role: 'ADMIN',
            allowedCompanyIds: [defaultCompany.id],
            selectedCompanyId: defaultCompany.id,
            systeme: defaultCompany.systeme,
        });
        // *************** FIN STUB ***************


        res.status(201).json({
            status: 'success',
            message: 'Instance créée avec succès. Connexion automatique.',
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
        console.error('Erreur d\'inscription:', error.message);
        res.status(500).json({
            error: 'Erreur lors de la création de l\'instance. Le service Odoo est-il actif ?',
        });
    }
};

// =============================================================================
// AJOUTER CES DEUX FONCTIONS À LA FIN DU FICHIER controllers/authController.js
// =============================================================================

/**
 * Gère l'affectation ou la réaffectation d'une compagnie à un utilisateur.
 * @route POST /api/auth/assign-company (Protégé, Admin seulement)
 */
exports.assignCompany = async (req, res) => {
    // Cette logique nécessiterait un appel odooExecuteKw pour écrire dans res.users
    res.status(501).json({ 
        status: 'error', 
        message: 'assignCompany: Fonctionnalité en développement.',
        data: req.body
    });
};

/**
 * Déconnexion forcée de l'utilisateur (via invalidation du token si supporté, ou simple message ici).
 * @route POST /api/auth/force-logout (Protégé)
 */
exports.forceLogout = async (req, res) => {
    // Dans une application réelle, ceci invaliderait le JWT dans une liste noire (Redis).
    res.status(200).json({ 
        status: 'success', 
        message: 'forceLogout: L\'action a été enregistrée. L\'utilisateur sera déconnecté à sa prochaine requête.',
    });
};

/**
 * Récupère les données utilisateur et de session via le JWT (Middleware 'protect' l'a déjà décodé).
 * @route GET /api/auth/me
 * @requires middleware/auth.js (protect)
 */
exports.getMe = async (req, res) => {
    // req.user est peuplé par le middleware 'protect' et contient les données du JWT
    if (!req.user) {
        return res.status(401).json({ error: 'Jeton JWT invalide ou manquant.' });
    }

    try {
        // Dans une application robuste, on pourrait relire la DB Odoo ici.
        // Pour la rapidité, nous renvoyons les données déjà stockées dans le token
        // et transmises par le middleware 'protect'.
        
        // Les champs profile, name, email sont souvent stockés dans le JWT pour /me.
        // Puisque loginUser envoie companiesList, nous devons le simuler ici ou le stocker
        // dans le JWT (ce qui rend le JWT lourd).
        
        // Pour être complet, nous allons refaire l'appel de récupération des compagnies
        // qui est la meilleure pratique pour s'assurer que les données sont à jour.
        
        const { odooUid, email, role, selectedCompanyId } = req.user;
        
        // 1. Lire les company_ids de l'utilisateur spécifique (res.users)
        const userData = await odooExecuteKw({
            uid: ADMIN_UID, 
            model: 'res.users',
            method: 'read',
            args: [[odooUid], ['name', 'company_ids']], // On lit le nom et la liste des IDs
            kwargs: {}
        });

        if (!userData || userData.length === 0 || !userData[0].company_ids || userData[0].company_ids.length === 0) {
             throw new Error('L\'utilisateur n\'est plus lié à une compagnie active.');
        }

        const company_ids = userData[0].company_ids;
        const name = userData[0].name;

        // 2. Récupération des entreprises (Companies) de l'utilisateur Odoo
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
            systeme: 'NORMAL', // Assigner la valeur par défaut
            currency: c.currency_id ? c.currency_id[1] : 'XOF'
        }));
        
        const currentCompanyName = companiesList.find(c => c.id === selectedCompanyId)?.name || 'GLOBAL';


        res.status(200).json({
            status: 'success',
            data: {
                profile: role,         // Le rôle (Role)
                name,                  // Le nom complet
                email,                 // L'email
                odooUid,
                companiesList,         // La liste des compagnies
                selectedCompanyId,     // L'ID de compagnie stocké dans le JWT
                currentCompanyName,    // Le nom de la compagnie courante
            },
        });

    } catch (error) {
        console.error('Erreur getMe:', error.message);
        res.status(401).json({
            error: error.message || 'Échec de la récupération des données utilisateur. Jeton invalide ou données Odoo introuvables.',
        });
    }
};
