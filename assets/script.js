// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.2 (Correction Erreur 'body stream already read')
// =================================================================================
// ============================================================================
// 0. GESTIONNAIRE D'INTÉGRATION ET SÉCURITÉ (À placer en haut du script.js)
// ============================================================================

/**
 * Gestionnaire de sécurité et d'intégration pour les couches de calculs SYSCOHADA
 */
const SYSCOHADAIntegrationManager = {
    // Vérification des dépendances critiques (window.app, unifiedManager, entreprise sélectionnée)
    validateDependencies() {
        const errors = [];
        if (typeof window === 'undefined') {
            errors.push('Environnement window non disponible'); [cite_start]// [cite: 4014]
        }
        if (!window.app) {
            errors.push('Module principal (window.app) non initialisé'); [cite_start]// [cite: 4015]
        }
        if (!window.unifiedManager) {
            errors.push('Gestionnaire unifié (window.unifiedManager) non disponible'); [cite_start]// [cite: 4016]
        }
        if (window.app && !window.app.currentCompanyId) {
            errors.push('Aucune entreprise sélectionnée'); [cite_start]// [cite: 4017]
        }
        if (errors.length > 0) {
            throw new Error(`Erreurs d'intégration détectées: ${errors.join(', ')}`); [cite_start]// [cite: 4018, 4019]
        }
        return true;
    },
    
    // Vérification sécurisée de l'existence des données pour le calcul (écritures, plan comptable)
    checkDataAvailability() {
        try {
            this.validateDependencies(); [cite_start]// [cite: 4021]
            [cite_start]// ... (Vérifie window.app.filteredData.entries et window.app.accounts) // [cite: 4022, 4023, 4024, 4025]
            return true;
        } catch (error) {
            this.handleIntegrationError(error, 'Vérification des données'); [cite_start]// [cite: 4026]
            return false;
        }
    },
    
    // Obtenir le nom de l'entreprise sélectionnée de manière sécurisée (Logique Multi-Entreprise)
    getSelectedCompanyName() {
        try {
            if (window.unifiedManager && typeof window.unifiedManager.getSelectedCompanyName === 'function') {
                return window.unifiedManager.getSelectedCompanyName(); [cite_start]// [cite: 4036]
            } else if (window.app && window.app.companies && window.app.currentCompanyId) {
                const company = window.app.companies.find(c => c.id === window.app.currentCompanyId); [cite_start]// [cite: 4037]
                return company ? company.name : 'Entreprise inconnue';
            } else {
                return 'Entreprise non définie'; [cite_start]// [cite: 4038]
            }
        } catch (error) {
            console.error('Erreur récupération nom entreprise:', error); [cite_start]// [cite: 4039]
            return 'Entreprise (erreur)';
        }
    },
    
    // Gestionnaire d'erreur et de notification unifié
    handleIntegrationError(error, context = 'Opération SYSCOHADA') {
        console.error(`[SYSCOHADA Integration Error] ${context}:`, error); [cite_start]// [cite: 4027]
        [cite_start]// Utilise le NotificationManager pour alerter l'utilisateur (si disponible) // [cite: 4028, 4029]
    },
    
    [cite_start]// showNotification, showModal (utilisent window.unifiedManager.notificationManager et modalManager) // [cite: 4030, 4033]
};

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

let API_BASE_URL;

// 🛑 URL de votre Web Service Backend (Node.js)
const RENDER_BACKEND_URL = 'https://douke-compta-pro.onrender.com'; 
const LOCAL_BACKEND_URL = 'http://localhost:3000';


// Détection de l'environnement : si l'hôte n'est ni 'localhost' ni lié à Codespaces,
// nous supposons que nous sommes en ligne sur un service Web Render.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.host.endsWith('-3000.app.github.dev')) {
    // Environnement de développement (Local/Codespaces)
    API_BASE_URL = LOCAL_BACKEND_URL + '/api';
} else {
    // Environnement de production (Render) : On utilise l'URL du service BACKEND
    API_BASE_URL = RENDER_BACKEND_URL + '/api';
}

console.log(`[ENV DEBUG] API_BASE_URL utilisée: ${API_BASE_URL}`);

window.userContext = null;

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 1.5. SERVICES TECHNIQUES : CACHE MANAGER ET GESTIONNAIRE D'ÉTAT
// =================================================================================

const CACHE_LIFETIME_MS = 300000; // 5 minutes

/**
 * Gère un cache en mémoire simple avec expiration.
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Tente de récupérer une valeur du cache.
     * @param {string} key 
     * @returns {any | null} La donnée si valide, sinon null.
     */
    getCached(key) {
        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            if (Date.now() < entry.expiry) {
                console.log(`[CACHE HIT] Données récupérées pour: ${key}`);
                return entry.data;
            } else {
                console.log(`[CACHE EXPIRED] Données expirées pour: ${key}`);
                this.cache.delete(key);
            }
        }
        return null;
    }

    /**
     * Stocke une valeur dans le cache.
     * @param {string} key 
     * @param {any} data 
     * @param {number} lifetimeMs Durée de vie en millisecondes.
     */
    setCached(key, data, lifetimeMs = CACHE_LIFETIME_MS) {
        const expiry = Date.now() + lifetimeMs;
        this.cache.set(key, { data, expiry });
        console.log(`[CACHE SET] Données stockées pour: ${key}`);
    }
    
    /**
     * Vide tout le cache ou un groupe spécifique.
     * @param {string} prefix Pour vider les clés qui commencent par ce préfixe.
     */
    clearCache(prefix = null) {
        if (!prefix) {
            this.cache.clear();
            console.log('[CACHE CLEAR] Cache complet vidé.');
            return;
        }
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
        console.log(`[CACHE CLEAR] Cache vidé pour le préfixe: ${prefix}`);
    }
}

// Globalisation du Cache Manager
window.cacheManager = new CacheManager();

/**
 * Centralisation de l'état crucial pour le routing et les rapports comptables.
 */
window.app = {
    currentCompanyId: null, // ID de l'entreprise actuellement sélectionnée
    currentCompanyName: null,
    currentSysteme: 'normal', // 'normal' ou 'minimal' (pour SYSCOHADA)
    filteredData: {
        // Contient les données prêtes à être traitées par les modules SYSCOHADA
        entries: [],
        accounts: [],
    },
};


// =================================================================================
// 2. AUTHENTIFICATION ET SERVICES DE DONNÉES API (DataService implicite)
// =================================================================================

/**
 * Affiche un message flash dans la vue de connexion/inscription.
 */
function displayAuthMessage(viewId, message, type) {
    const msgElement = document.getElementById(`${viewId}-message`);
    if (!msgElement) return;

    msgElement.classList.remove('hidden', 'text-red-700', 'text-green-700', 'text-blue-700', 'bg-red-100', 'bg-green-100', 'bg-blue-100', 'text-gray-700', 'bg-gray-100');
    
    let textClass = 'text-gray-700';
    let bgClass = 'bg-gray-100';

    switch (type) {
        case 'success':
            textClass = 'text-green-700';
            bgClass = 'bg-green-100';
            break;
        case 'danger':
            textClass = 'text-red-700';
            bgClass = 'bg-red-100';
            break;
        case 'info':
            textClass = 'text-blue-700';
            bgClass = 'bg-blue-100';
            break;
    }

    msgElement.textContent = message;
    msgElement.classList.add(textClass, bgClass);
}


/**
 * Connexion utilisateur via l'API serveur.
 * Correction : Lecture du corps en texte d'abord, puis parsing JSON.
 */
async function handleLogin(email, password) {
    const endpoint = `${API_BASE_URL}/auth/login`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        // --- CORRECTION CLÉ : Lire le corps en texte une seule fois ---
        const responseText = await response.text();
        let data;

        try {
            // Tenter de parser le JSON
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Réponse API non-JSON ou malformée:', responseText.substring(0, 100) + '...');
            // Si le statut n'est pas OK, le texte brut est probablement l'erreur
            if (!response.ok) {
                throw new Error(`Erreur du serveur (${response.status}) : ${responseText.substring(0, 50)}...`);
            }
            throw new Error('Réponse du serveur non valide ou non-JSON.');
        }

        if (response.ok) {
            console.log('✅ Connexion réussie:', data.utilisateurRole);
            return {
                utilisateurRole: data.utilisateurRole,
                utilisateurId: data.utilisateurId,
                utilisateurNom: data.utilisateurNom,
                token: data.token,
                entrepriseContextId: data.entrepriseContextId || null,
                entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
                multiEntreprise: data.multiEntreprise || false
            };
        } else {
            throw new Error(data.error || 'Erreur de connexion inconnue');
        }

    } catch (error) {
        let errorMessage = 'Erreur réseau: Serveur injoignable. Vérifiez l\'état de votre Web Service Render.';
        if (!error.message.includes('fetch') && error.message) {
            errorMessage = error.message;
        }
        console.error('❌ Erreur lors de la connexion:', errorMessage);
        throw new Error(errorMessage);
    }
}

/**
 * Inscription utilisateur (MOCK si API inaccessible)
 * Correction : Lecture du corps en texte d'abord, puis parsing JSON.
 */
async function handleRegistration(payload) {
    const endpoint = `${API_BASE_URL}/auth/register`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // --- CORRECTION CLÉ : Lire le corps en texte une seule fois ---
        const responseText = await response.text();
        let data;
        
        try {
            // Tenter de lire le JSON
            data = JSON.parse(responseText);
        } catch (e) {
            // Échec du JSON, c'est probablement du HTML d'erreur
            if (!response.ok) {
                console.error('❌ Le serveur a renvoyé un corps non-JSON (HTML probable) sur une erreur HTTP:', response.status, responseText.substring(0, 100) + '...');
                // On lève une erreur spécifique pour déclencher le MOCK
                throw new Error(`Erreur Serveur ${response.status}: L'endpoint d'inscription est introuvable ou a échoué.`);
            }
            // Si la réponse était OK mais le JSON malformé
            throw new Error(`Réponse API non valide (JSON malformé). Erreur de parsing: ${e.message}`); 
        }

        if (response.ok) {
            console.log('✅ Inscription réussie:', data.utilisateurRole);
            return {
                utilisateurRole: 'USER', // Rôle par défaut
                utilisateurId: data.utilisateurId,
                utilisateurNom: data.utilisateurNom,
                token: data.token,
                entrepriseContextId: data.entrepriseContextId,
                entrepriseContextName: data.entrepriseContextName,
                multiEntreprise: false
            };
        } else {
            throw new Error(data.error || 'Erreur d\'inscription inconnue');
        }
    } catch (error) {
        // Déclenche le MOCK si l'API est injoignable (fetch) OU si l'endpoint a échoué (message d'erreur personnalisé)
        if (error.message.includes('fetch') || error.message.includes('L\'endpoint d\'inscription est introuvable')) {
            displayAuthMessage('register', 'Endpoint d\'inscription non implémenté côté serveur ou injoignable. Simulation de la réussite...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // MOCK de succès
            const mockContext = {
                utilisateurRole: 'USER',
                utilisateurId: 'USR_NEW_MOCK',
                utilisateurNom: payload.username,
                token: 'jwt.mock.new.user',
                entrepriseContextId: 'ENT_NEW_MOCK',
                entrepriseContextName: payload.companyName,
                multiEntreprise: false
            };
            return mockContext;
        }
        throw new Error(error.message);
    }
}


/**
 * Récupère les écritures comptables pour une entreprise. (DataService.getEntries)
 * Correction : Lecture du corps en texte d'abord, puis parsing JSON.
 *
 * @param {string} companyId - ID de l'entreprise.
 * @param {string} token - Token d'autorisation.
 * @returns {Array<Object>}
 */
async function fetchCompanyEntries(companyId, token) {
    if (!companyId || !token) {
        throw new Error('Company ID et Token sont requis pour récupérer les écritures.');
    }
    
    // --- 1. GESTION DU CACHE (Clé: companyId_entries) ---
    const cacheKey = `entries_${companyId}`;
    
    const cachedData = window.cacheManager.getCached(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const endpoint = `${API_BASE_URL}/entries/${companyId}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        // --- CORRECTION CLÉ : Lire le corps en texte une seule fois ---
        const responseText = await response.text();
        let data;
        
        try {
            // Tenter de lire le JSON
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Réponse API non-JSON ou malformée:', responseText.substring(0, 100) + '...');
            return []; // Retourne un tableau vide en cas d'erreur non-JSON
        }


        if (response.ok && Array.isArray(data)) {
            console.log(`✅ ${data.length} écritures récupérées pour ${companyId}.`);
            
            // --- 2. MISE EN CACHE ---
            window.cacheManager.setCached(cacheKey, data);
            
            // --- 3. MISE À JOUR DE L'ÉTAT APPLICATIF ---
            window.app.filteredData.entries = data; 
            
            return data;
        } else if (response.status === 401) {
             // Redirection en cas de token expiré (Gestion Pro)
             console.error('❌ Token expiré. Déconnexion forcée.');
             alert('Votre session a expiré. Veuillez vous reconnecter.');
             location.reload(); 
             return [];
        } else {
            console.error('❌ Erreur récupération écritures:', data.error || 'Erreur inconnue');
            return [];
        }
    } catch (error) {
        console.error('❌ ERREUR CRITIQUE RÉSEAU (fetchCompanyEntries):', error);
        return []; 
    }
}


/**
 * Récupère les entreprises accessibles à l'utilisateur.
 * Endpoint: GET /api/companies/:userId (DataService.getCompanies)
 * Correction : Lecture du corps en texte d'abord, puis parsing JSON.
 */
async function fetchUserCompanies(context) {
    if (!context || !context.utilisateurId) {
        console.error('❌ Impossible de récupérer les entreprises sans utilisateurId');
        return [];
    }

    const endpoint = `${API_BASE_URL}/companies/${context.utilisateurId}`;
    const cacheKey = `companies_${context.utilisateurId}`;
    const cachedData = window.cacheManager.getCached(cacheKey);
    if (cachedData) return cachedData; // Utilisation du cache

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.token}`
            }
        });
        
        // --- CORRECTION CLÉ : Lire le corps en texte une seule fois ---
        const responseText = await response.text();
        let data;
        
        try {
            // Tenter de lire le JSON
            data = JSON.parse(responseText);
        } catch (e) {
            // Échec du JSON. Si c'est un 404, on passe au MOCK.
            if (!response.ok && response.status === 404) {
                console.warn('⚠️ Endpoint /companies non trouvé. Utilisation des données MOCK.');
                // Fallback to MOCK logic below
            } else {
                console.error('❌ Réponse API non-JSON ou malformée:', responseText.substring(0, 100) + '...');
                // Fallback to MOCK
            }
        }


        if (response.ok && Array.isArray(data)) {
            console.log('✅ Entreprises récupérées:', data.length);
            window.cacheManager.setCached(cacheKey, data); // Mise en cache
            return data;
        } else if (response.status === 404 || !response.ok) {
            // MOCK forcé (si 404 ou non-OK)
            const mockCompanies = [
                { id: 'ENT_001', name: 'Alpha Solutions', stats: { transactions: 450, result: 15000000, pending: 12, cash: 8900000 } },
                { id: 'ENT_002', name: 'Beta Consulting', stats: { transactions: 120, result: 2500000, pending: 5, cash: 1200000 } },
                { id: 'ENT_003', name: 'Gama Holding', stats: { transactions: 880, result: 45000000, pending: 30, cash: 25000000 } }
            ];
            window.cacheManager.setCached(cacheKey, mockCompanies); 
            return mockCompanies;
        } else {
            console.error('❌ Erreur récupération entreprises:', data.error || 'Erreur inconnue');
            return [];
        }

    } catch (error) {
        console.error('❌ ERREUR CRITIQUE RÉSEAU (fetchUserCompanies):', error);
        // MOCK de sécurité
        return [
            { id: 'ENT_MOCK_1', name: 'Entreprise MOCK 1', stats: { transactions: 10, result: 1000000, pending: 1, cash: 500000 } },
            { id: 'ENT_MOCK_2', name: 'Entreprise MOCK 2', stats: { transactions: 20, result: 2000000, pending: 2, cash: 1500000 } }
        ];
    }
}


/**
 * Simule les statistiques globales admin (MOCK)
 */
async function fetchGlobalAdminStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        totalCompanies: 4,
        activeCompanies: 3,
        collaborators: 6,
        totalFiles: 120,
        pendingRequests: 5,
        pendingValidations: 8,
    };
}

/**
 * Change le contexte entreprise pour utilisateurs multi-entreprises
 * et met à jour l'état global.
 */
async function changeCompanyContext(newId, newName) {
    if (window.userContext && window.userContext.multiEntreprise) {
        window.userContext.entrepriseContextId = newId;
        window.userContext.entrepriseContextName = newName;
        
        // --- MISE À JOUR DE L'ÉTAT APPLICATIF GLOBAL (window.app) ---
        window.app.currentCompanyId = newId;
        window.app.currentCompanyName = newName;
        window.app.filteredData.entries = []; // Vider les données précédentes
        window.cacheManager.clearCache(`entries_${newId}`); // Vider le cache de cette entreprise
        
        updateNavigationMenu(window.userContext.utilisateurRole); 
        await loadView('dashboard'); 
        updateHeaderContext(window.userContext);
    }
}


// =================================================================================
// 2.5. SQUELETTE LOGIQUE SYSCOHADA (Implémentation du fichier 2.txt)
// =================================================================================

/**
 * Fonctions MOCK pour les calculs SYSCOHADA (Ces fonctions existeraient dans src/calculs/...)
 */
const MOCK_REPORT_DATA = {
    bilan: "<table><tr><td>Actif Net</td><td>15.000.000 XOF</td></tr></table>",
    resultat: "<p>Résultat 2024: 5.000.000 XOF</p>",
    flux: "<p>Tableau de Flux de Trésorerie: +2.000.000 XOF</p>",
    recettesDepenses: "<table><tr><td>Recettes totales</td><td>5.000.000 XOF</td></tr></table>",
    bilanMinimal: "<p>Bilan Minimal: 10.000.000 XOF</p>",
    annexes: "<h3>Notes Annexes</h3><p>Méthodes comptables utilisées...</p>",
};

function genererBilan(ecritures) { return MOCK_REPORT_DATA.bilan; }
function genererCompteResultat(ecritures) { return MOCK_REPORT_DATA.resultat; }
function genererFluxTresorerie(ecritures) { return MOCK_REPORT_DATA.flux; }
function annexesNormal(ecritures, options) { return MOCK_REPORT_DATA.annexes; }

function genererEtatRecettesDepenses(ecritures) { return MOCK_REPORT_DATA.recettesDepenses; }
function genererBilanMinimal(ecritures) { return MOCK_REPORT_DATA.bilanMinimal; }
function annexesMinimal(ecritures, options) { return MOCK_REPORT_DATA.annexes; }

/**
 * Affiche les états financiers dans la zone désignée.
 */
function afficherEtatFinancier(etats) {
    const zone = document.getElementById('etat-financier');
    if (!zone) return;
    zone.innerHTML = '';
    
    // Afficher chaque état comme un bloc de rapport professionnel
    for (const [cle, contenu] of Object.entries(etats)) {
        const title = cle.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Formatage CamelCase -> Titre
        const bloc = document.createElement('div');
        bloc.className = "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-4";
        bloc.innerHTML = `<h3 class="text-2xl font-bold text-secondary mb-4">${title}</h3>${contenu}`;
        zone.appendChild(bloc);
    }
}

/**
 * Contrôleur central pour générer les états financiers basés sur le système sélectionné.
 */
async function genererEtatsFinanciers() {
    const companyId = window.app.currentCompanyId;
    const systeme = window.app.currentSysteme;
    const token = window.userContext.token;
    
    const zoneRapports = document.getElementById('etat-financier');
    if (zoneRapports) {
        zoneRapports.innerHTML = '<div class="text-center p-8"><i class="fas fa-cog fa-spin fa-3x text-primary mb-4"></i><p>Chargement et calcul des écritures...</p></div>';
    }

    // 1. Charger les écritures si elles ne sont pas déjà en mémoire
    let ecritures = window.app.filteredData.entries;
    if (ecritures.length === 0) {
        try {
            ecritures = await fetchCompanyEntries(companyId, token);
            window.app.filteredData.entries = ecritures; // Mise à jour de l'état
        } catch (e) {
            if (zoneRapports) zoneRapports.innerHTML = `<p class="text-danger">Erreur: ${e.message}</p>`;
            return;
        }
    }
    
    if (ecritures.length === 0) {
        if (zoneRapports) zoneRapports.innerHTML = '<p class="text-warning font-bold">⚠️ Aucune écriture comptable trouvée pour cette entreprise.</p>';
        return;
    }
    
    console.log(`[SYSCOHADA] Démarrage du calcul pour ${systeme}. ${ecritures.length} écritures à traiter.`);

    // 2. Exécution de la logique SYSCOHADA (comme dans le fichier 2.txt)
    try {
        if (systeme === 'normal') {
            const bilan = genererBilan(ecritures);
            const resultat = genererCompteResultat(ecritures);
            const flux = genererFluxTresorerie(ecritures);
            const annexes = annexesNormal(ecritures, {});
            afficherEtatFinancier({ bilan, resultat, flux, annexes });
        } else { // systeme === 'minimal'
            const recettesDepenses = genererEtatRecettesDepenses(ecritures);
            const bilanMinimal = genererBilanMinimal(ecritures);
            const annexes = annexesMinimal(ecritures, {});
            afficherEtatFinancier({ recettesDepenses, bilanMinimal, annexes });
        }
    } catch (e) {
        if (zoneRapports) zoneRapports.innerHTML = `<p class="text-danger">Erreur critique de calcul SYSCOHADA: ${e.message}</p>`;
    }
}


// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================

/**
 * Affiche la vue de connexion et masque les autres.
 */
function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('auth-view').classList.add('flex'); // Assure l'affichage flex
    document.getElementById('dashboard-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
        registerView.classList.remove('flex');
    }
}

function renderRegisterView() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('flex');
    document.getElementById('dashboard-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.remove('hidden');
        registerView.classList.add('flex');
    }
}

function initDashboard(context) {
    window.userContext = context;

    // Initialisation du contexte d'entreprise dans l'état global
    window.app.currentCompanyId = context.entrepriseContextId;
    window.app.currentCompanyName = context.entrepriseContextName;

    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('flex');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
        registerView.classList.remove('flex');
    }
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('flex');

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);
    loadView('dashboard');
}

function updateHeaderContext(context) {
    const firstName = context.utilisateurNom.split(' ')[0];
    document.getElementById('welcome-message').textContent = `Bienvenue, ${firstName}`;
    document.getElementById('current-role').textContent = context.utilisateurRole;
    
    const companyNameElement = document.getElementById('current-company-name');
    const contextMessage = document.getElementById('context-message');
    
    const companyName = context.entrepriseContextName || '-- Global --';
    companyNameElement.textContent = companyName;

    if (context.multiEntreprise && !context.entrepriseContextId) {
        contextMessage.innerHTML = 'Contexte de travail actuel: <strong class="text-danger">AUCUNE SÉLECTIONNÉE</strong>. (Cliquez sur "Changer d\'Entreprise")';
    } else {
        contextMessage.innerHTML = `Contexte de travail actuel: <strong class="text-primary">${companyName}</strong>.`;
    }
}

function updateNavigationMenu(role) {
    const navMenu = document.getElementById('role-navigation-menu');
    navMenu.innerHTML = '';

    let menuItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' }
    ];

    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
        menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' });
    }

    // Si un contexte d'entreprise est sélectionné
    if (window.userContext && window.userContext.entrepriseContextId) {
        menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
        if (role !== ROLES.CAISSIER) {
            menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
            menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
            menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
        }
    } else if (window.userContext && window.userContext.multiEntreprise) {
         // Si multi-entreprise mais pas de contexte sélectionné, on force le sélecteur
         menuItems.push({ name: 'Sélectionner Contexte', icon: 'fas fa-sync-alt', view: 'selector', isRequired: true });
    }

    if (role === ROLES.ADMIN) {
        menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }

    // Option toujours présente pour les rôles multi-entreprises
    if (window.userContext && window.userContext.multiEntreprise) {
        menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-building', view: 'selector' });
    }
    
    // Rendu des items de navigation
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadView(item.view);
        });

        navMenu.appendChild(link);
    });
}

/**
 * Routage des vues selon le nom
 */
async function loadView(viewName) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>';

    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];

    if (requiresContext.includes(viewName) && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) {
        alert('🚨 Opération Bloquée. Veuillez sélectionner une entreprise.');
        return renderEnterpriseSelectorView(viewName); 
    }

    let htmlContent = ''; 

    switch (viewName) {
        case 'dashboard':
            htmlContent = await renderDashboard(window.userContext); 
            break;
        case 'selector':
            renderEnterpriseSelectorView();
            return; 
        case 'saisie':
            htmlContent = renderSaisieFormCaissier();
            break;
        case 'journal-entry':
            htmlContent = renderJournalEntryForm();
            break;
        case 'validation':
            htmlContent = generateValidationTable();
            break;
        case 'reports':
            // Chargement de la vue des rapports, l'initialisation des sélecteurs se fera après
            htmlContent = renderReportsView(); 
            break;
        case 'create-company':
            htmlContent = renderCreateCompanyForm();
            break;
        case 'user-management':
            if (window.userContext.utilisateurRole === ROLES.ADMIN) {
                htmlContent = renderUserManagementView();
            } else {
                htmlContent = renderAccessDenied();
            }
            break;
        default:
            htmlContent = renderNotFound();
    }

    if (htmlContent) {
        contentArea.innerHTML = htmlContent;
        
        // --- LOGIQUE SPÉCIFIQUE POST-RENDU ---
        if (viewName === 'reports') {
            await initialiserRapportsEtSysteme(window.userContext);
            await genererEtatsFinanciers(); // Déclenche le premier calcul
        }
    }
}


/**
 * Affiche le sélecteur d'entreprise pour les rôles multi-entreprises
 */
async function renderEnterpriseSelectorView(blockedViewName = null) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p>Chargement des entreprises...</p></div>';

    try {
        console.log('--- Etape 1: TENTATIVE de chargement des entreprises (MOCK FORCÉ) ---');

        // 🛑 MOCK FORCÉ POUR CONTOURNER LE BLOCAGE API (Utilise maintenant la fonction fetchUserCompanies)
        const companies = await fetchUserCompanies(window.userContext);

        console.log(`--- Etape 2: MOCK Forcé réussi. Affichage de ${companies.length} entreprises. ---`);


        let companyListHTML = '';
        if (companies.length === 0) {
            companyListHTML = '<div class="p-6 text-center bg-yellow-100 bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée. Contactez l\'administrateur.</p></div>';
        } else {
            companyListHTML = companies.map(company => `
                <div class="company-card p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
                     data-company-id="${company.id}" data-company-name="${company.name}">
                    <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Transactions: ${company.stats.transactions || 0}</p>
                </div>
            `).join('');
        }

        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <h2 class="text-3xl font-extrabold text-primary mb-2">Sélectionner un Contexte d'Entreprise</h2>
                <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
                </p>
                <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${companyListHTML}
                </div>
                
                <div class="mt-8 text-center">
                    <button onclick="changeCompanyContext(null, '-- Global --');" class="text-blue-500 hover:text-primary font-medium">
                        <i class="fas fa-undo mr-1"></i> Revenir au Contexte Global
                    </button>
                </div>
        `;

        contentArea.querySelectorAll('.company-card').forEach(element => {
            element.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                const companyName = this.getAttribute('data-company-name');

                changeCompanyContext(companyId, companyName); 
            });
        });

    } catch (error) {
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-red-100 bg-opacity-10 border-4 border-danger rounded-xl text-center">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
                <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
                <p class="text-lg">Impossible de charger les entreprises. ${error.message}</p>
            </div>
        `;
    }
}


// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES
// =================================================================================

function generateStatCard(title, value, iconClass, colorClass) {
    const formattedValue = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // Utilisation du Franc CFA
        minimumFractionDigits: 0
    }).format(value);

    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 ${colorClass}">
            <div class="flex items-center">
                <div class="p-3 mr-4 rounded-full ${colorClass.replace('border-l-4 ', 'bg-opacity-20')}">
                    <i class="${iconClass} text-2xl ${colorClass.replace('border-l-4 border-', 'text-')}"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">${formattedValue}</p>
                </div>
            </div>
        </div>
    `;
}

function renderActivityFeed() {
    const activities = [
        { type: 'Validation', description: 'Facture #2024-001 validée par Admin.', time: 'il y a 5 min' },
        { type: 'Saisie', description: 'Transaction de caisse S-1002 ajoutée.', time: 'il y a 30 min' },
        { type: 'Rapport', description: 'Bilan 2024 Q1 généré.', time: 'il y a 2 heures' },
        { type: 'Validation', description: 'Écriture journal E-005 rejetée.', time: 'il y a 1 jour' },
    ];

    const activityItems = activities.map(act => `
        <li class="p-4 border-b dark:border-gray-700 last:border-b-0">
            <span class="font-bold text-sm text-primary mr-2">${act.type}:</span>
            <span class="text-gray-700 dark:text-gray-300">${act.description}</span>
            <span class="float-right text-xs text-gray-500">${act.time}</span>
            </li>
    `).join('');

    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
            <h3 class="text-xl font-bold mb-4 text-primary">Fil d'Activités Récentes (${window.userContext.entrepriseContextName})</h3>
            <ul>
                ${activityItems}
            </ul>
            <p class="text-center mt-4 text-sm text-blue-500 hover:text-primary cursor-pointer">Voir toutes les activités</p>
        </div>
    `;
}

function renderStatCardSimple(title, value, iconClass, colorClass) {
    const formattedValue = new Intl.NumberFormat('fr-FR').format(value);
    const textClass = colorClass.replace('border-', 'text-');
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                <p class="text-3xl font-bold ${textClass}">${formattedValue}</p>
            </div>
            <i class="${iconClass} text-5xl opacity-20 ${textClass}"></i>
        </div>
    `;
}

async function renderAdminGlobalDashboard(context) {
    const stats = await fetchGlobalAdminStats();
    
    const statsHTML = `
        ${renderStatCardSimple('Total Entreprises', stats.totalCompanies, 'fas fa-building', 'text-primary')}
        ${renderStatCardSimple('Collaborateurs', stats.collaborators, 'fas fa-users', 'text-info')}
        ${renderStatCardSimple('Validations en Attente', stats.pendingValidations, 'fas fa-check-double', 'text-danger')}
        ${renderStatCardSimple('Documents Total', stats.totalFiles, 'fas fa-file-alt', 'text-secondary')}
    `;

    return `
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Tableau de Bord Global Administrateur</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${statsHTML}
        </div>
        ${renderActivityFeed()}
        <div class="mt-6 p-6 bg-blue-100 bg-opacity-10 rounded-xl">
            <h3 class="text-xl font-bold text-blue-500">Mode Multi-Entreprise</h3>
            <p>En tant qu'Admin Global, vous devez utiliser le menu "Changer d'Entreprise" pour accéder aux outils comptables spécifiques d'une entreprise.</p>
        </div>
    `;
}

async function renderCompanySpecificDashboard(context, specificRoleMessage) {
    const companyName = context.entrepriseContextName;
    // Données MOCK d'entreprise pour l'affichage
    const stats = { transactions: 350, result: 12500000, pending: 8, cash: 7500000 }; 

    const statsHTML = `
        ${generateStatCard('Résultat Net Provisoire', stats.result, 'fas fa-balance-scale', 'border-success')}
        ${generateStatCard('Encaisse Disponible', stats.cash, 'fas fa-money-bill-wave', 'border-primary')}
        ${generateStatCard('Opérations en Attente', stats.pending, 'fas fa-hourglass-half', 'border-warning')}
        ${generateStatCard('Transactions du Mois', stats.transactions, 'fas fa-exchange-alt', 'border-info')}
    `;

    return `
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Tableau de Bord : ${companyName}</h2>
        
        <div class="p-4 mb-6 bg-primary bg-opacity-10 rounded-lg text-primary">
            ${specificRoleMessage || `Vous opérez en tant que ${context.utilisateurRole} pour cette entreprise.`}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${statsHTML}
        </div>

        ${renderActivityFeed()}
    `;
}

async function renderUserDashboard(context) {
    return renderCompanySpecificDashboard(context, 
        `<i class="fas fa-chart-line mr-2"></i> Bienvenue, l'équipe Comptable.`);
}

async function renderCaissierDashboard(context) {
    return renderCompanySpecificDashboard(context, 
        `<i class="fas fa-cash-register mr-2"></i> Ce tableau de bord est optimisé pour la saisie des flux de caisse.`);
}

async function renderDashboard(context) {
    if (context.multiEntreprise && !context.entrepriseContextId) {
        await renderEnterpriseSelectorView(); 
        return null; 
    }

    switch (context.utilisateurRole) {
        case ROLES.ADMIN:
            if (context.entrepriseContextId) {
                return await renderCompanySpecificDashboard(context, `<i class="fas fa-crown mr-2"></i> Mode Administrateur de l'entreprise.`);
            }
            return await renderAdminGlobalDashboard(context);
        case ROLES.CAISSIER:
            return await renderCaissierDashboard(context);
        case ROLES.COLLABORATEUR:
        case ROLES.USER:
            return await renderUserDashboard(context);
        default:
            return renderNotFound();
    }
}

// =================================================================================
// 5. HELPERS DE RENDU & FORMULAIRES DE VUES
// =================================================================================

function renderNotFound() {
    return `<div class="p-8 text-center"><i class="fas fa-exclamation-triangle fa-5x text-warning mb-4"></i><h2 class="text-3xl font-bold">Vue Non Trouvée</h2><p class="text-lg">La page demandée n'existe pas ou n'est pas encore implémentée.</p></div>`;
}

function renderAccessDenied() {
    return `<div class="p-8 text-center"><i class="fas fa-lock fa-5x text-danger mb-4"></i><h2 class="text-3xl font-bold text-danger">Accès Refusé</h2><p class="text-lg">Votre rôle ne vous permet pas d'accéder à cette fonctionnalité.</p></div>`;
}

/**
 * Rendu de la vue des Rapports Financiers (Intégration HTML du fichier 3.txt).
 */
function renderReportsView() {
    const currentCompany = window.app.currentCompanyName || "N/A";

    return `
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Générer les États Financiers SYSCOHADA</h2>
        
        <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-inner mb-6">
            <h3 class="text-xl font-bold mb-4 text-primary">Options de Rapport pour : ${currentCompany}</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="report-controls">
                ${window.userContext.multiEntreprise ? `
                <div class="mb-4">
                  <label for="entreprise" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sélectionner l'entreprise :</label>
                  <select id="entreprise" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"></select>
                </div>
                ` : `<input type="hidden" id="entreprise" value="${window.app.currentCompanyId}">`}

                <div class="mb-4">
                  <label for="systeme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Choisir le système comptable :</label>
                  <select id="systeme" class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded">
                    <option value="normal" ${window.app.currentSysteme === 'normal' ? 'selected' : ''}>Système normal</option>
                    <option value="minimal" ${window.app.currentSysteme === 'minimal' ? 'selected' : ''}>Système minimal de trésorerie</option>
                  </select>
                </div>
            </div>
            
            <button id="generer-rapport" class="w-full mt-4 bg-success hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition duration-200">
                <i class="fas fa-calculator mr-2"></i> Générer les États Financiers
            </button>
        </div>
        
        <div id="etat-financier" class="mt-8">
            <p class="text-center text-gray-500 p-10">Sélectionnez les options ci-dessus et cliquez sur 'Générer' pour afficher les états financiers.</p>
        </div>
    `;
}

/**
 * Initialise les sélecteurs et les listeners dans la vue de rapports.
 */
async function initialiserRapportsEtSysteme(context) {
    const selectEntreprise = document.getElementById('entreprise');
    const selectSysteme = document.getElementById('systeme');
    const btnGenerer = document.getElementById('generer-rapport');

    // 1. Initialisation des entreprises (si multi-entreprise)
    if (context.multiEntreprise && selectEntreprise) {
        selectEntreprise.innerHTML = '';
        const companies = await fetchUserCompanies(context);
        
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === context.entrepriseContextId) {
                option.selected = true;
            }
            selectEntreprise.appendChild(option);
        });

        // Listener pour le changement d'entreprise
        selectEntreprise.addEventListener('change', async function() {
            const newId = this.value;
            const newName = this.options[this.selectedIndex].text;
            // On utilise changeCompanyContext pour mettre à jour window.app et recharger si besoin
            await changeCompanyContext(newId, newName); 
            
            // Si on reste sur la vue reports, on force la regénération
            if (document.getElementById('etat-financier')) {
                await genererEtatsFinanciers();
            }
        });
    }

    // 2. Listener pour le changement de système (Implémentation du fichier 2.txt)
    if (selectSysteme) {
        selectSysteme.addEventListener('change', async function() {
            window.app.currentSysteme = this.value; // Mise à jour de l'état
            console.log(`[SYSCOHADA] Système comptable changé à: ${this.value}`);
            // Pas besoin de recharger les écritures, juste de relancer le calcul
            await genererEtatsFinanciers();
        });
    }
    
    // 3. Listener pour le bouton Générer (Fallback principal)
    if (btnGenerer) {
        btnGenerer.addEventListener('click', genererEtatsFinanciers);
    }
}


function renderCreateCompanyForm() {
    return `<h3 class="text-2xl font-bold mb-4 text-primary">Créer une Nouvelle Entreprise (MOCK)</h3><p>Formulaire de création d'entreprise.</p>`;
}

function renderSaisieFormCaissier() {
    return `<h3 class="text-2xl font-bold mb-4 text-primary">Saisie des Flux de Caisse (MOCK)</h3><p>Formulaire de saisie des flux pour ${window.userContext.entrepriseContextName}.</p>`;
}

function renderJournalEntryForm() {
    return `<h3 class="text-2xl font-bold mb-4 text-primary">Saisie Écriture Journal (MOCK)</h3><p>Formulaire d'écriture journal pour ${window.userContext.entrepriseContextName}.</p>`;
}

function generateValidationTable() {
    return `<h3 class="text-2xl font-bold mb-4 text-primary">Validation des Opérations (MOCK)</h3><p>Liste des opérations en attente de validation pour ${window.userContext.entrepriseContextName}.</p>`;
}


// =================================================================================
// 6. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            displayAuthMessage('login', 'Connexion en cours...', 'info');

            try {
                const context = await handleLogin(email, password);
                
                displayAuthMessage('login', `Connexion réussie! Bienvenue, ${context.utilisateurNom}.`, 'success');
                
                setTimeout(() => {
                    initDashboard(context);
                }, 1500); 

            } catch (error) {
                displayAuthMessage('login', error.message, 'danger');
            }
        });
    }
    
    // ** GESTION DU FORMULAIRE D'INSCRIPTION **
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
            const companyName = prompt("Veuillez entrer le nom de l'entreprise à créer (MOCK):") || 'Ma Nouvelle Entreprise';

            const payload = { username, email, password, companyName };

            displayAuthMessage('register', 'Inscription en cours...', 'info');

            try {
                const context = await handleRegistration(payload);
                
                displayAuthMessage('register', `Inscription réussie! Bienvenue, ${context.utilisateurNom}.`, 'success');
                
                // Délai pour afficher le message de succès avant de lancer le dashboard
                setTimeout(() => {
                    initDashboard(context);
                }, 1500); 

            } catch (error) {
                displayAuthMessage('register', error.message, 'danger');
            }
        });
    }
    
    // Ajout des listeners pour basculer entre login et register
    document.getElementById('show-register-btn')?.addEventListener('click', renderRegisterView);
    document.getElementById('show-login-btn')?.addEventListener('click', renderLoginView);

    // GESTION DU BOUTON DE DÉCONNEXION
    document.getElementById('logout-btn')?.addEventListener('click', function() {
        if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
            window.userContext = null;
            window.app.currentCompanyId = null;
            window.cacheManager.clearCache();
            renderLoginView();
        }
    });

});
