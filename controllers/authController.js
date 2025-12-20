// =============================================================================
// FICHIER : controllers/authController.js
// Description : Authentification Odoo & Inscription avec Isolation Analytique
// =============================================================================

const jwt = require('jsonwebtoken');
const xmlrpc = require('xmlrpc');

// CONFIGURATION ODOO
const ODOO_URL = process.env.ODOO_URL || 'https://votre-instance.odoo.com';
const ODOO_DB = process.env.ODOO_DB || 'votre-database';

// Client XML-RPC optimisé
const getOdooClient = (endpoint) => {
    const url = new URL(ODOO_URL);
    const clientCreator = url.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient;
    return clientCreator({
        host: url.hostname,
        port: url.protocol === 'https:' ? 443 : 80,
        path: endpoint
    });
};

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'douke_secret_key_2024', { expiresIn: '30d' });
};

/**
 * AUTHENTIFICATION ODOO
 */
const authenticateOdoo = (email, password) => {
    return new Promise((resolve, reject) => {
        const commonClient = getOdooClient('/xmlrpc/2/common');
        commonClient.methodCall('authenticate', [ODOO_DB, email, password, {}], (error, uid) => {
            if (error) return reject(new Error('Serveur Odoo indisponible'));
            if (!uid || uid === false) return reject(new Error('Identifiants invalides'));
            resolve(uid);
        });
    });
};

/**
 * EXÉCUTION DE COMMANDES ODOO (Promisifiée)
 */
const executeKw = (uid, password, model, method, args, kwargs = {}) => {
    return new Promise((resolve, reject) => {
        const objectClient = getOdooClient('/xmlrpc/2/object');
        objectClient.methodCall('execute_kw', [ODOO_DB, uid, password, model, method, args, kwargs], (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
};

// =============================================================================
// ENDPOINT : CONNEXION (LOGIN)
// =============================================================================
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Champs manquants' });

        const uid = await authenticateOdoo(email, password);
        const userInfo = await executeKw(uid, password, 'res.users', 'read', [[uid]], { 
            fields: ['name', 'login', 'company_id'] 
        });

        const user = userInfo[0];
        const token = generateToken({ odooUid: uid, email: user.login, role: 'USER' });

        res.json({
            utilisateurId: `ODOO_${uid}`,
            utilisateurNom: user.name,
            token: token,
            entrepriseMère: user.company_id[1],
            message: 'Connexion réussie'
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

// =============================================================================
// ENDPOINT : INSCRIPTION (REGISTER) - LOGIQUE CLIENT + ISOLATION ANALYTIQUE
// =============================================================================
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, companyName } = req.body;
        const adminEmail = process.env.ODOO_ADMIN_EMAIL;
        const adminPass = process.env.ODOO_ADMIN_PASSWORD;

        // 1. Authentification Admin pour créer les accès
        const adminUid = await authenticateOdoo(adminEmail, adminPass);

        // 2. Création de l'Utilisateur Odoo
        const newUserId = await executeKw(adminUid, adminPass, 'res.users', 'create', [{
            name: username,
            login: email,
            password: password,
            groups_id: [[6, 0, [1, 7]]] // Droits basiques : Employee / Internal User
        }]);

        // 3. Création du Coffre-fort Analytique (Cloisonnement)
        const analyticId = await executeKw(adminUid, adminPass, 'account.analytic.account', 'create', [{
            name: `COMPTA - ${companyName}`,
            plan_id: 1 // Vérifier l'ID du plan analytique dans votre Odoo
        }]);

        // 4. Création de l'Entreprise en tant que PARTENAIRE (Client de l'espace)
        const partnerId = await executeKw(adminUid, adminPass, 'res.partner', 'create', [{
            name: companyName,
            is_company: true,
            email: email,
            user_id: newUserId, // L'utilisateur devient "propriétaire" de ce client
            comment: `ANALYTIC_ID:${analyticId}` // Tag de liaison pour l'API
        }]);

        const token = generateToken({ odooUid: newUserId, email: email, role: 'ADMIN' });

        res.status(201).json({
            utilisateurId: `ODOO_${newUserId}`,
            token: token,
            entrepriseId: partnerId,
            analyticId: analyticId,
            message: 'Espace créé avec isolation analytique'
        });

    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        res.status(500).json({ error: "Échec de l'inscription et du cloisonnement" });
    }
};

exports.assignCompany = async (req, res) => {
    res.json({ message: 'Fonctionnalité gérée via res.partner user_id' });
};

exports.forceLogout = async (req, res) => {
    res.json({ message: 'Session terminée' });
};
