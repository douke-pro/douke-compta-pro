// ==============================================================================
// FICHIER : server.js
// Description : Serveur API Express pour Doukè Compta Pro
// VERSION : FINALE ET DÉFENSIVEMENT SÉCURISÉE (try/catch intégral)
// ==============================================================================

// 1. DÉPENDANCES ET CONFIGURATION INITIALE
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken'); 

const app = express();
const PORT = process.env.PORT || 3000;
// 🚨 Utiliser une clé secrète forte pour le JWT. La valeur par défaut est un fallback.
const SECRET_KEY = process.env.JWT_SECRET || 'votre_cle_secrete_tres_forte_a_changer'; 

// 2. MIDDLEWARES
app.use(cors()); 
app.use(express.json()); 
app.use(express.static('assets')); 

// ==============================================================================
// 3. BASES DE DONNÉES SIMULÉES (MOCKS)
// ==============================================================================

let MOCK_USERS_DB = [
    { id: 'USER_1', username: 'admin', password: 'password', email: 'admin@douke.com', role: 'ADMIN', entrepriseId: 'ENT_1', entrepriseName: 'Doukè Siège' },
    { id: 'USER_2', username: 'collaborateur', password: 'password', email: 'collab@douke.com', role: 'COLLABORATEUR', entrepriseId: null, entrepriseName: null },
    { id: 'USER_3', username: 'utilisateur', password: 'password', email: 'user@douke.com', role: 'USER', entrepriseId: 'ENT_2', entrepriseName: 'MonEntrepriseSarl' },
    { id: 'USER_4', username: 'caissier', password: 'password', email: 'caisse@douke.com', role: 'CAISSIER', entrepriseId: 'ENT_3', entrepriseName: 'CaisseTest' },
];

let MOCK_COMPANIES_DB = [
    { id: 'ENT_1', name: 'Doukè Siège', nif: '100000000', status: 'SA' },
    { id: 'ENT_2', name: 'MonEntrepriseSarl', nif: '200000000', status: 'SARL' },
    { id: 'ENT_3', name: 'CaisseTest', nif: '300000000', status: 'Ets' },
];

let DB_ATTRIBUTION_MOCK = {
    'ENT_1': { collaborateurId: null, userId: 'USER_1', name: 'Doukè Siège' },
    'ENT_2': { collaborateurId: 'USER_2', userId: 'USER_3', name: 'MonEntrepriseSarl' },
    'ENT_3': { collaborateurId: 'USER_2', userId: 'USER_4', name: 'CaisseTest' },
};


// ==============================================================================
// 4. ROUTES D'AUTHENTIFICATION (/api/auth)
// ==============================================================================

// ROUTE DE DIAGNOSTIC - Pour vérifier que la bonne version est déployée
app.get('/api/test/json', (req, res) => {
    return res.status(200).json({
        testSuccess: true,
        message: "Serveur Express opérationnel et capable de renvoyer du JSON.",
        version: "FINALE_V1.1",
        time: new Date().toISOString()
    });
});


// Route de Connexion (Login)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = MOCK_USERS_DB.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    const tokenPayload = {
        utilisateurId: user.id,
        utilisateurRole: user.role,
        entrepriseContextId: user.entrepriseId,
        entrepriseContextName: user.entrepriseName,
    };

    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '1d' });

    return res.status(200).json({
        success: true,
        token: token,
        user: { 
            id: user.id, 
            role: user.role, 
            entrepriseId: user.entrepriseId,
            entrepriseName: user.entrepriseName
        },
        message: "Connexion réussie."
    });
});


// Route d'Inscription (Register) - DÉFENSIVEMENT SÉCURISÉE
app.post('/api/auth/register', async (req, res) => {
    const { username, password, email, companyName, companyNif, companyStatus } = req.body;

    try {
        // --- 1. SIMULATION DB : VÉRIFICATION ET CRÉATION ---
        if (MOCK_USERS_DB.some(u => u.username === username || u.email === email)) {
            return res.status(400).json({ success: false, message: "Ce nom d'utilisateur ou cet email est déjà utilisé." });
        }

        // Utilisation d'un ID basé sur le temps pour être unique (plus robuste qu'un Random simple)
        const timestamp = Date.now();
        const newCompanyId = `ENT_${timestamp}`;
        const newUserId = `USER_${timestamp}`;

        const newUser = { 
            id: newUserId, 
            username, 
            password, 
            email, 
            role: 'USER', 
            entrepriseId: newCompanyId, 
            entrepriseName: companyName 
        };
        
        MOCK_USERS_DB.push(newUser);
        MOCK_COMPANIES_DB.push({ id: newCompanyId, name: companyName, nif: companyNif, status: companyStatus });
        DB_ATTRIBUTION_MOCK[newCompanyId] = { 
            collaborateurId: null, 
            userId: newUserId, 
            name: companyName 
        };

        // --- 2. CRÉATION ET SIGNATURE DU TOKEN ---
        const tokenPayload = {
            utilisateurId: newUser.id,
            utilisateurRole: newUser.role,
            entrepriseContextId: newUser.entrepriseId,
            entrepriseContextName: newUser.entrepriseName,
        };
        
        const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '1d' });

        // --- 3. RÉPONSE FINALE (Succès) ---
        return res.status(201).json({ // 🚨 Statut 201 (Created) pour une inscription
            success: true,
            token: token, // ⬅️ Le jeton est ici
            user: { 
                id: newUser.id, 
                role: newUser.role, 
                entrepriseId: newUser.entrepriseId,
                entrepriseName: newUser.entrepriseName,
            },
            company: {
                id: newCompanyId,
                name: companyName,
                status: companyStatus,
                nif: companyNif
            },
            message: "Inscription réussie. Bienvenue sur Doukè Compta Pro !"
        });

    } catch (error) {
        // --- 4. GESTION DES ERREURS INTERNES (Empêche la réponse 200 vide) ---
        console.error("Erreur interne critique lors de l'inscription:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Échec de l'inscription en raison d'une erreur interne du serveur. Le code 'res.json' n'a pas pu s'exécuter."
        });
    }
});


// ==============================================================================
// 5. ROUTES D'APPLICATION ET MIDDLEWARE JWT
// ==============================================================================

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Accès refusé. Jeton manquant.' });

    const token = authHeader.split(' ')[1]; 

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Jeton invalide ou expiré.' });
        req.userContext = decoded; 
        next();
    });
}

app.get('/api/user/companies', verifyToken, (req, res) => {
    const role = req.userContext.utilisateurRole;
    const userId = req.userContext.utilisateurId;
    
    let userCompanies = [];

    // Logique de tri des entreprises (USER/CAISSIER, ADMIN, COLLABORATEUR)
    if (role === 'USER' || role === 'CAISSIER') {
        const company = MOCK_COMPANIES_DB.find(c => c.id === req.userContext.entrepriseContextId);
        if (company) userCompanies.push(company);

    } else if (role === 'ADMIN') {
        userCompanies = [...MOCK_COMPANIES_DB];

    } else if (role === 'COLLABORATEUR') {
        userCompanies = MOCK_COMPANIES_DB.filter(company => 
            DB_ATTRIBUTION_MOCK[company.id] && DB_ATTRIBUTION_MOCK[company.id].collaborateurId === userId
        );
    }
    
    // Ajout de stats simulées
    userCompanies = userCompanies.map(c => ({
        ...c,
        stats: {
            transactions: Math.floor(Math.random() * 50) + 10,
            active_users: Math.floor(Math.random() * 5) + 1,
        }
    }));

    return res.status(200).json(userCompanies);
});


// ==============================================================================
// 6. ROUTE D'ACCUEIL ET DÉMARRAGE
// ==============================================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
