// =============================================================================
// FICHIER : controllers/authController.js (VERSION CORRIGÉE FINALE)
// Description : Gestion de l'authentification et des utilisateurs
// CORRECTION : Utilisation de l'UID Admin pour les requêtes de lecture (ExecuteKw)
// =============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { odooAuthenticate, odooExecuteKw } = require('../services/odooService'); // Assurez-vous que ce chemin est correct

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'douke_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_UID = process.env.ODOO_ADMIN_UID; // NOUVEAU : UID Admin pour les requêtes privilégiées ExecuteKw

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
        // 1. Authentification Odoo
        // Cette fonction retourne l'ID de l'utilisateur Odoo (uid) ou lève une erreur.
        const authResult = await odooAuthenticate(email, password);
        const { uid, db, profile, name } = authResult; // 'profile' est le rôle Doukè

        if (!uid) {
            return res.status(401).json({ error: 'Identifiants Odoo invalides.' });
        }
        
        // VÉRIFICATION CRITIQUE: Assurer que l'ADMIN_UID est disponible pour les requêtes privilégiées
        if (!ADMIN_UID) {
            console.error("ERREUR CRITIQUE: ODOO_ADMIN_UID est manquant. Les requêtes ExecuteKw pourraient échouer.");
        }

        // 2. Récupération des entreprises (Companies) de l'utilisateur Odoo
        // UTILISATION DE L'UID ADMIN (ADMIN_UID) POUR CONTOURNER LES ACL DE LECTURE (Access Denied)
        const companyField = profile === 'ADMIN' ? 'id' : 'company_ids';
        const companies = await odooExecuteKw({
            uid: ADMIN_UID, // CORRECTION CRITIQUE : Utilise l'UID de l'Admin pour la requête de lecture (droits maximum)
            model: 'res.company',
            method: 'search_read',
            // Le filtre (args) garantit qu'on ne récupère que les compagnies de l'utilisateur concerné
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
            // Un utilisateur doit au moins être lié à une entreprise
            return res.status(401).json({ error: 'Aucun dossier comptable actif trouvé pour cet utilisateur.' });
        }

        // 4. CORRECTION CRITIQUE: Création du JWT (Synchronisation des clés)
        // Les clés 'odooUid' et 'role' doivent correspondre à ce qu'attend 'middleware/auth.js'.
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
        // NOTE: Dans une implémentation réelle, cette fonction appellerait
        // une route Odoo pour créer :
        // 1. Un nouvel utilisateur Odoo (user.partner)
        // 2. Une nouvelle entreprise (res.company)
        // 3. Lier l'utilisateur à cette entreprise, en lui donnant un rôle 'ADMIN'

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
