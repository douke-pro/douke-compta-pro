// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète et unifiée de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.8 - INTÉGRATION COMPLÈTE DU SYSTÈME UNIFIÉ & PCA
// =================================================================================

// =================================================================================
// 0. CONFIGURATION GLOBALE ET GESTIONNAIRES UNIFIÉS
// =================================================================================

// Définition de l'URL de base de l'API Odoo (Render Backend)
const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD
    ? 'https://douke-compta-pro.onrender.com/api' // URL de votre backend Express avec /api
    : 'http://localhost:3000/api'; // URL de votre backend local avec /api

console.log(`[ENV DEBUG] API_BASE_URL utilisée: ${API_BASE_URL}`);

// État global de l'application
window.app = {
    userContext: {
        token: null,     // Le JWT récupéré après login
        profile: null,   // Rôle de l'utilisateur (ADMIN, COLLABORATEUR, etc.)
        name: null,      // Nom de l'utilisateur
        email: null,     // Email
    }, 
    currentProfile: null,
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL', // 'NORMAL' ou 'MINIMAL'

    // Données comptables du dossier actif
    filteredData: { entries: [], accounts: [] }, 
    companiesList: [], // Liste complète des entreprises accessibles
    UI_LOADED: false,

    // NOUVEAUX CHAMPS POUR LE DASHBOARD & PLAN COMPTABLE (V1.8)
    dashboardKPIs: {
        margeBrute: 'N/A',
        ratioLiquidite: 'N/A',
        pendingEntries: 0,
        caAncien: 'N/A', // CA de l'année précédente
        caActuel: 'N/A', // CA de l'année en cours
    },
    chartOfAccounts: [], // Le plan comptable complet de l'entreprise active

    // Mock pour les données utilisateur (à des fins de démonstration ou de tests non-API)
    MOCK_USERS: [
        { email: 'admin@douke.com', profile: 'ADMIN', name: 'Admin DOUKÈ' },
        { email: 'collab@douke.com', profile: 'COLLABORATEUR', name: 'Collab Senior' },
        { email: 'user@douke.com', profile: 'USER', name: 'User Standard', total_caisses: 3, active_caisses: 2 },
        { email: 'caisse@douke.com', profile: 'CAISSIER', name: 'Patrice Caisse', total_caisses: 1, active_caisses: 1 },
    ]
};


// ------------------- GESTIONNAIRES D'INTERFACE UTILISATEUR -------------------

const NotificationManager = {
    show: (type, title, message, duration = 5000) => {
        const zone = document.getElementById('notification-zone');
        if (!zone) {
            console.warn(`[NOTIF] ${title} (${type}): ${message}`);
            return;
        }
        // Utilisation des classes CSS pour les notifications
        const typeClasses = {
            success: 'border-success text-success',
            danger: 'border-danger text-danger',
            warning: 'border-warning text-warning',
            info: 'border-info text-info'
        };

        const iconClasses = {
            success: 'fas fa-check-circle', danger: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle'
        };
        const html = `
            <div class="notification p-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border-l-4 ${typeClasses[type]} transition-all duration-300 transform translate-x-0 opacity-100">
                <div class="flex items-center">
                    <i class="${iconClasses[type]} mr-3"></i>
                    <div>
                        <p class="font-bold text-gray-900 dark:text-white">${title}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-300">${message}</p>
                    </div>
                </div>
            </div>`;

        const el = document.createElement('div');
        el.innerHTML = html.trim();
        const notificationElement = el.firstChild;
        zone.prepend(notificationElement);
        setTimeout(() => {
            notificationElement.classList.remove('opacity-100');
            notificationElement.classList.add('opacity-0', 'scale-95');
            setTimeout(() => notificationElement.remove(), 300); 
        }, duration);
    }
};

const ModalManager = {
    open: (title, subtitle, contentHTML) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-subtitle').textContent = subtitle;
        document.getElementById('modal-body').innerHTML = contentHTML;
        document.body.classList.add('modal-open');
    },
    close: () => {
        document.body.classList.remove('modal-open');
        document.getElementById('modal-body').innerHTML = `<div class="p-8 text-center text-gray-500">Contenu chargé dynamiquement...</div>`;
    }
};
document.getElementById('modal-close-btn')?.addEventListener('click', ModalManager.close);


// Gestionnaires unifiés (Pour compatibilité)
window.unifiedManager = { 
    notificationManager: NotificationManager,
    modalManager: ModalManager,
    showNotification: NotificationManager.show,
    showModal: ModalManager.open
};

// Cache Manager (Minimal)
const CacheManager = {
    get: (key) => { return null; },
    set: (key, data, ttl) => { /* Pas d'implémentation complète pour le moment */ },
    clearCache: () => { console.log('[CACHE] Cache nettoyé.'); }
};


// =================================================================================
// 1. SERVICES D'API & AUTHENTIFICATION
// =================================================================================

/**
 * Fonction centrale pour toutes les communications sécurisées avec le backend Express.
 * Injecte automatiquement le token JWT (Bearer Token).
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = window.app.userContext?.token;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers 
    };
    
    // Injecter le token Bearer (sauf pour l'appel de login)
    if (token && headers['Authorization'] !== null) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body, // Le body doit être un JSON.stringify(data)
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
            }

            if (response.status === 401) {
                NotificationManager.show('danger', 'Session Expirée', errorData.error || 'Veuillez vous reconnecter.', 8000);
            }
            throw new Error(errorData.error || errorData.message || 'Erreur inconnue du serveur.');
        }

        return await response.json();
    } catch (error) {
        console.error(`[API FETCH ERROR] Endpoint: ${endpoint}`, error.message);
        // Rendre l'erreur plus claire pour l'utilisateur
        let userMessage = error.message.includes('fetch') ? 
            "Problème réseau: Le serveur backend Doukè Compta Pro est injoignable." : 
            error.message;
        throw new Error(userMessage);
    }
}

/**
 * Récupère la liste des entreprises (analytic IDs) liées à l'utilisateur connecté.
 */
async function fetchUserCompanies() {
    try {
        // Route du Company Controller
        const response = await apiFetch('/company/list');

        if (!response.companies || response.companies.length === 0) {
            window.app.companiesList = [];
            NotificationManager.show('warning', 'Aucun Dossier', 'Aucune entreprise n\'est affectée à votre compte.', 5000);
            return;
        }

        window.app.companiesList = response.companies;

        // Initialiser l'entreprise par défaut si aucune sélectionnée
        if (!window.app.currentCompanyId && window.app.companiesList.length > 0) {
            const defaultCompany = window.app.companiesList[0];
            window.app.currentCompanyId = defaultCompany.id; // L'analyticId
            window.app.currentCompanyName = defaultCompany.name;
            window.app.currentSysteme = defaultCompany.systeme || 'NORMAL';
        }

        // Mettre à jour l'interface avec les nouvelles entreprises
        renderHeaderSelectors();
        
    } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        NotificationManager.show('danger', 'Erreur de Données', 'Impossible de charger la liste des entreprises.', 8000);
        window.app.companiesList = [];
        window.app.currentCompanyId = null;
    }
}

/**
 * Gère le processus de connexion en appelant l'API backend Express (/auth/login).
 */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = e.target.querySelector('button[type="submit"]');
    const originalText = loginButton.innerHTML;
    const messageEl = document.getElementById('login-message');

    loginButton.innerHTML = `<div class="loading-spinner w-5 h-5 border-white"></div><span class="ml-3">Connexion...</span>`;
    loginButton.disabled = true;
    messageEl.classList.add('hidden'); 

    // MOCK pour le développement rapide
    if (email === 'test@douke.com' && password === 'password') {
        NotificationManager.show('info', 'Mode MOCK', 'Connexion ADMIN simulée pour le développement.', 3000);
        window.app.userContext = { token: 'jwt.mock.token', email: email, name: 'Admin Test', profile: 'ADMIN' };
        window.app.currentProfile = 'ADMIN';
        await fetchUserCompanies();
        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, Admin Test.`, 3000);
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        await fetchCompanyAccountingData(); // Charger les données MOCK/Réelles
        loadModule('global_dashboard'); // Lancer le dashboard
        loginButton.innerHTML = originalText;
        loginButton.disabled = false;
        return;
    }


    try {
        // 1. Appel à la route /api/auth/login
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: { 'Authorization': null }
        });

        if (response.error || !response.token) {
            throw new Error(response.error || 'Identifiants invalides ou serveur indisponible.');
        }

        // --- AUTHENTIFICATION RÉUSSIE ---

        // 2. Stocker le token et les infos utilisateur
        window.app.userContext = {
            token: response.token,
            email: response.email,
            name: response.name || email,
            profile: response.role || 'USER'
        };

        // 3. Mettre à jour l'état et charger les entreprises
        window.app.currentProfile = window.app.userContext.profile;
        await fetchUserCompanies();

        // 4. Charger les données comptables du dossier sélectionné (par défaut)
        if (window.app.currentCompanyId) {
            await fetchCompanyAccountingData();
        }

        // 5. Passer à l'affichage principal
        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${window.app.userContext.name}.`, 3000);

        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        // Rediriger vers le dashboard par défaut
        loadModule(window.app.currentProfile === 'ADMIN' ? 'global_dashboard' : 'user_dashboard');


    } catch (error) {
        messageEl.textContent = error.message;
        messageEl.className = 'p-4 rounded-xl text-center text-sm font-bold bg-danger/10 text-danger border border-danger';
        messageEl.classList.remove('hidden');

    } finally {
        // Rétablir le bouton
        loginButton.innerHTML = originalText;
        loginButton.disabled = false;
    }
}

/**
 * Gère la déconnexion en réinitialisant l'état global et en revenant à la vue de connexion.
 */
function handleLogout() {
    window.app.userContext = { token: null, profile: null, name: null, email: null };
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.currentCompanyName = null;
    window.app.filteredData.entries = [];
    window.app.chartOfAccounts = []; // Nettoyage
    window.app.companiesList = [];
    CacheManager.clearCache();
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-message').classList.add('hidden');
    NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}


// =================================================================================
// 1.5. UTILS & FORMATTEURS
// =================================================================================

/**
 * Formate un nombre en devise XOF (ou équivalent) ou N/A s'il n'est pas valide.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // F CFA
        minimumFractionDigits: 0 
    }).format(amount);
}

/**
 * Formate un nombre en ratio (avec deux décimales).
 */
function formatRatio(ratio) {
    if (typeof ratio !== 'number' || isNaN(ratio)) {
        return 'N/A';
    }
    return ratio.toFixed(2);
}


// =================================================================================
// 2. DATA FETCHING (V1.8)
// =================================================================================

/**
 * Récupère les indicateurs clés de performance du Dashboard pour l'entreprise active.
 */
async function fetchDashboardKPIs() {
    if (!window.app.currentCompanyId) return;

    try {
        // Nouvelle route API pour les KPIs (ex: /api/accounting/dashboard-kpis/ENT_001)
        const data = await apiFetch(`/accounting/dashboard-kpis/${window.app.currentCompanyId}`);
        
        // Mise à jour de l'état global avec les nouveaux KPIs
        window.app.dashboardKPIs.margeBrute = formatCurrency(data.margeBrute || 0);
        window.app.dashboardKPIs.ratioLiquidite = formatRatio(data.ratioLiquidite || 0);
        window.app.dashboardKPIs.pendingEntries = data.pendingEntries || 0;
        window.app.dashboardKPIs.caActuel = formatCurrency(data.caActuel || 0); 
        window.app.dashboardKPIs.caAncien = formatCurrency(data.caAncien || 0); 

        console.log('[KPIs] Dashboard KPIs mis à jour.', window.app.dashboardKPIs);

        // Si l'utilisateur est sur le dashboard, on le rafraîchit
        const currentModule = document.getElementById('content-area').dataset.module;
        if (currentModule === 'user_dashboard' || currentModule === 'global_dashboard') {
            renderDashboard(); 
        }

    } catch (error) {
        NotificationManager.show('warning', 'KPIs', 'Impossible de charger les indicateurs de performance.', 3000);
        console.error('Erreur de chargement des KPIs:', error);
    }
}


/**
 * Fonction maîtresse de récupération des données comptables de l'entreprise active.
 * Inclut le Plan Comptable et les Écritures.
 */
async function fetchCompanyAccountingData() {
    const companyId = window.app.currentCompanyId;
    if (!companyId) {
        window.app.filteredData.entries = [];
        window.app.chartOfAccounts = [];
        return;
    }

    NotificationManager.show('info', 'Chargement', `Récupération des données pour ${window.app.currentCompanyName}...`, 5000);
    window.app.filteredData.entries = []; 
    window.app.chartOfAccounts = []; 

    try {
        // 1. Récupération des Écritures Comptables
        const entriesResponse = await apiFetch(`/accounting/entries/${companyId}`); 
        window.app.filteredData.entries = entriesResponse.entries || [];
        console.log(`[DATA] ${window.app.filteredData.entries.length} écritures chargées.`);
        
        // 2. Récupération du Plan Comptable (Nouveau)
        const accountsResponse = await apiFetch(`/accounting/chart-of-accounts/${companyId}`);
        window.app.chartOfAccounts = accountsResponse.accounts || [];
        window.app.filteredData.accounts = window.app.chartOfAccounts; 
        console.log(`[DATA] ${window.app.chartOfAccounts.length} comptes chargés.`);

        // 3. Récupération des KPIs
        await fetchDashboardKPIs(); 

        NotificationManager.show('success', 'Synchronisation', 'Données comptables chargées avec succès.', 3000);

        // Re-rendre le module actif si on est déjà connecté
        const currentModule = document.getElementById('content-area').dataset.module;
        if (currentModule) {
            loadModule(currentModule);
        }

    } catch (error) {
        NotificationManager.show('danger', 'Erreur Data', `Impossible de charger les données : ${error.message}`, 8000);
        console.error('[DATA FETCH ERROR]', error);
    }
}


// =================================================================================
// 3. LOGIQUE DE RENDU DU DASHBOARD ET NAVIGATION
// =================================================================================

function updateSecureUserInfo() {
    const user = window.app.userContext;
    const companyName = window.app.currentCompanyName || "-- Global / Non sélectionné --";
    
    // Sidebar
    document.getElementById('current-role').textContent = user?.profile || 'N/A';
    document.getElementById('welcome-message').textContent = user ? `Hello, ${user.name.split(' ')[0]}!` : 'Chargement...';
    document.getElementById('current-company-name').textContent = companyName; 
    
    // Header de contenu
    const contextMessageEl = document.getElementById('context-message');
    if (contextMessageEl) { 
        const systemeInfo = window.app.currentCompanyId ? ` (${window.app.currentSysteme})` : '';
        contextMessageEl.innerHTML = `Dossier Actif : <span class="text-primary font-bold">${companyName}</span>${systemeInfo}`;
    }
    
    // Avatar
    const avatarEl = document.getElementById('user-avatar-text');
    if (avatarEl) { avatarEl.textContent = user?.name ? user.name.charAt(0).toUpperCase() : 'U'; } 
    renderHeaderSelectors();
}

function createNavItem(text, icon, action, active = false) {
    const baseClasses = "flex items-center p-4 rounded-xl transition-all font-bold group";
    const activeClasses = "bg-primary text-white shadow-lg shadow-primary/30"; 
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
    const iconBase = "fas mr-4 w-5 text-center";

    // Marquer l'élément actif au chargement
    const currentModule = document.getElementById('content-area')?.dataset.module;
    active = currentModule === action;

    return `
        <button onclick="loadModule('${action}')" class="${baseClasses} ${active ? activeClasses : inactiveClasses}" data-module="${action}" data-active="${active}">
            <i class="${iconBase} ${icon} ${active ? 'text-white' : 'text-primary dark:text-primary-light group-hover:text-primary-dark'}"></i> 
            <span>${text}</span>
        </button>
    `;
}

/**
 * Configure le menu de navigation selon le profil utilisateur (Intégration complète).
 */
function renderRoleNavigation() {
    const menu = document.getElementById('role-navigation-menu');
    if (!menu) return; 
    menu.innerHTML = '';
    const profile = window.app.currentProfile;

    const navItems = {
        'ADMIN': [
            ['Vue Globale (KPI)', 'fa-layer-group', 'global_dashboard'],
            ['Plan Comptable', 'fa-book', 'chart_of_accounts'], // <-- NOUVEAU
            ['Gestion Utilisateurs', 'fa-users-cog', 'user_management'],
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'], 
            ['États Financiers SYSCOHADA', 'fa-balance-scale', 'financial_statements'], 
            ['Journal & Grand Livre', 'fa-book-open', 'grand_livre'], 
            ['Audit & Sécurité', 'fa-shield-alt', 'audit_logs'],
        ],
        'USER': [ 
            ['Pilotage & Synthèse', 'fa-tachometer-alt', 'user_dashboard'],
            ['Plan Comptable', 'fa-book', 'chart_of_accounts'], // <-- NOUVEAU
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'],
            ['États Financiers SYSCOHADA', 'fa-balance-scale', 'financial_statements'],
            ['Trésorerie & Cash Flow', 'fa-wallet', 'cash_flow'],
        ],
        'CAISSIER': [
            ['Synthèse Caisse', 'fa-chart-line', 'cashier_dashboard'],
            ['Saisie Mouvements', 'fa-keyboard', 'quick_entry'],
            ['Rapports de Caisse', 'fa-file-invoice', 'cash_reports'],
        ],
        'COLLABORATEUR': [
            ['Portefeuille & Suivi', 'fa-briefcase', 'collab_dashboard'],
            ['Plan Comptable', 'fa-book', 'chart_of_accounts'], // <-- NOUVEAU
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'], 
            ['Validation d\'Écritures', 'fa-check-circle', 'entries_validation'],
            ['Balance & Pré-Rapports', 'fa-calculator', 'reports_syscohada'],
        ]
    };

    const items = navItems[profile] || navItems['USER'];
    items.forEach(([text, icon, action]) => {
        menu.innerHTML += createNavItem(text, icon, action);
    });
}

/**
 * Ajout du sélecteur d'entreprise dans l'en-tête (MAJ pour multi-entreprises). 
 */
function renderHeaderSelectors() {
    const quickActions = document.getElementById('quick-actions');
    const user = window.app.userContext;

    // Supprimer l'ancien sélecteur s'il existe
    document.getElementById('company-selector-container')?.remove();

    // Afficher le sélecteur seulement s'il y a plus d'une entreprise accessible
    if (user && window.app.companiesList.length > 1) {
        const selectHTML = `
            <div id="company-selector-container" class="relative">
                <select id="company-selector" onchange="switchCompany(this.value)" class="p-2 border border-primary dark:border-primary-light bg-primary text-white dark:bg-primary-dark rounded-xl text-sm font-bold shadow-lg shadow-primary/30 outline-none appearance-none pr-8 cursor-pointer">
                    ${window.app.companiesList.map(c => `
                        <option value="${c.id}" ${c.id == window.app.currentCompanyId ? 'selected' : ''}>
                            ${c.name} (${c.systeme.substring(0, 3)})
                        </option>
                    `).join('')}
                </select>
                <i class="fas fa-building absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none"></i>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectHTML.trim();

        // Insérer le sélecteur avant le bouton de mode sombre
        const darkModeButton = quickActions?.querySelector('.fa-moon')?.closest('button') || quickActions?.querySelector('.fa-sun')?.closest('button');
        if (quickActions && darkModeButton) {
            quickActions.insertBefore(tempDiv.firstChild, darkModeButton);
        }
    }
}

/**
 * Change l'entreprise active et recharge toutes les données.
 */
async function switchCompany(companyId) {
    if (companyId === window.app.currentCompanyId) return;

    const newCompany = window.app.companiesList.find(c => c.id === companyId);
    if (!newCompany) {
        NotificationManager.show('danger', 'Erreur', 'Entreprise non trouvée.', 3000);
        return;
    }

    // 1. Mise à jour de l'état global
    window.app.currentCompanyId = newCompany.id;
    window.app.currentCompanyName = newCompany.name;
    window.app.currentSysteme = newCompany.systeme || 'NORMAL';
    
    // 2. Mise à jour de l'UI
    updateSecureUserInfo();
    NotificationManager.show('info', 'Changement', `Dossier actif : ${newCompany.name}`, 3000);

    // 3. Charger les nouvelles données
    await fetchCompanyAccountingData();
}

/**
 * Rend la vue du Dashboard (Pilotage ou Vue Globale). (V1.8)
 */
function renderDashboard() {
    const contentArea = document.getElementById('content-area');
    const isGlobal = contentArea.dataset.module === 'global_dashboard';
    const { margeBrute, ratioLiquidite, pendingEntries, caActuel, caAncien } = window.app.dashboardKPIs;
    
    let kpiCardsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-primary/20">
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">Marge Brute (YTD)</p>
                <h2 class="text-3xl font-bold text-primary mt-2">${margeBrute}</h2>
                <p class="text-xs text-gray-400 mt-1">Écart Y-1: [Indicateur de tendance]</p>
            </div>
            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-info/20">
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">Ratio de Liquidité (Actif/Passif)</p>
                <h2 class="text-3xl font-bold text-info mt-2">${ratioLiquidite}</h2>
                <p class="text-xs text-gray-400 mt-1">Objectif SYSCOHADA : > 1.0</p>
            </div>
            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-warning/20 cursor-pointer hover:shadow-warning/30" onclick="loadModule('entries_validation')">
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">Écritures en Attente (Validation)</p>
                <h2 class="text-3xl font-bold text-warning mt-2">${pendingEntries}</h2>
                <p class="text-xs text-gray-400 mt-1">Cliquer pour valider les brouillons</p>
            </div>
            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-success/20">
                <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">Chiffre d'Affaires (YTD)</p>
                <h2 class="text-3xl font-bold text-success mt-2">${caActuel}</h2>
                <p class="text-xs text-gray-400 mt-1">Année Précédente: ${caAncien}</p>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl mt-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Aperçu des Activités Récentes</h2>
            <p class="text-gray-500 dark:text-gray-400">Les graphiques et les tables de transactions récentes seront affichés ici. (Logique à implémenter)</p>
        </div>
    `;

    contentArea.innerHTML = `
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">${isGlobal ? 'Vue Globale' : 'Pilotage'} du Dossier : ${window.app.currentCompanyName}</h1>
        ${kpiCardsHTML}
    `;
}

/**
 * Rend la vue du Plan Comptable. (V1.8)
 */
function renderChartOfAccounts() {
    const contentArea = document.getElementById('content-area');
    contentArea.dataset.module = 'chart_of_accounts';
    
    const accounts = window.app.chartOfAccounts || [];

    let tableRows = accounts.map(account => `
        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td class="px-6 py-4 font-bold text-primary">${account.number}</td>
            <td class="px-6 py-4">${account.name}</td>
            <td class="px-6 py-4">${account.type}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="showEditAccountModal('${account.id}')" class="text-info hover:text-info-dark mr-3 transition duration-150">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button onclick="deleteAccount('${account.id}', '${account.number}')" class="text-danger hover:text-danger-dark transition duration-150">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        </tr>
    `).join('');

    const contentHTML = `
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Plan Comptable SYSCOHADA (${window.app.currentSysteme})</h1>
        <div class="flex justify-between items-center mb-6 p-4 bg-gray-50 dark:bg-gray-800/70 rounded-xl shadow-inner">
            <p class="text-gray-600 dark:text-gray-300 font-semibold">${accounts.length} comptes enregistrés.</p>
            <button onclick="showCreateAccountModal()" class="btn btn-primary bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary-dark transition duration-150 shadow-md shadow-primary/40">
                <i class="fas fa-plus mr-2"></i> Ajouter un Compte
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Numéro</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-3/6">Intitulé du Compte</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Type</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${tableRows}
                        ${accounts.length === 0 ? `<tr><td colspan="4" class="text-center py-8 text-gray-500 dark:text-gray-400">Aucun compte trouvé. Veuillez en ajouter un.</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    contentArea.innerHTML = contentHTML;
}


// =================================================================================
// 4. CRUD PLAN COMPTABLE (V1.8)
// =================================================================================

function showCreateAccountModal() {
    const modalContent = `
        <form id="create-account-form" onsubmit="handleCreateAccount(event)">
            <div class="mb-4">
                <label for="account-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de Compte (Ex: 411)</label>
                <input type="number" id="account-number" name="number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
            </div>
            <div class="mb-4">
                <label for="account-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Intitulé du Compte</label>
                <input type="text" id="account-name" name="name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
            </div>
            <div class="mb-6">
                <label for="account-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type (Classe)</label>
                <select id="account-type" name="type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
                    <option value="">Sélectionner une Classe</option>
                    <option value="CLASSE 1">CLASSE 1 (Capitaux propres)</option>
                    <option value="CLASSE 2">CLASSE 2 (Immobilisations)</option>
                    <option value="CLASSE 3">CLASSE 3 (Stocks)</option>
                    <option value="CLASSE 4">CLASSE 4 (Tiers)</option>
                    <option value="CLASSE 5">CLASSE 5 (Financier)</option>
                    <option value="CLASSE 6">CLASSE 6 (Charges)</option>
                    <option value="CLASSE 7">CLASSE 7 (Produits)</option>
                    <option value="CLASSE 8">CLASSE 8 (Résultats/Charges Hors Act.)</option>
                    <option value="CLASSE 9">CLASSE 9 (Comptabilité Analytique/Engagements)</option>
                </select>
            </div>
            <button type="submit" id="create-account-btn" class="w-full btn btn-primary bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary-dark transition duration-150 shadow-md shadow-primary/40">
                Créer le Compte
            </button>
        </form>
    `;
    ModalManager.open('Ajouter un Nouveau Compte', 'Création d\'un compte dans le Plan Comptable de ' + (window.app.currentCompanyName || '...'), modalContent);
}

async function handleCreateAccount(e) {
    e.preventDefault();
    const btn = document.getElementById('create-account-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loading-spinner w-4 h-4 border-white"></div><span class="ml-2">Création...</span>`;
    btn.disabled = true;

    const companyId = window.app.currentCompanyId;
    const formData = {
        number: parseInt(document.getElementById('account-number').value),
        name: document.getElementById('account-name').value,
        type: document.getElementById('account-type').value,
        companyId: companyId 
    };

    try {
        const result = await apiFetch(`/accounting/account`, {
            method: 'POST',
            body: JSON.stringify(formData),
        });
        
        NotificationManager.show('success', 'Succès', `Compte ${result.number} créé: ${result.name}.`, 5000);
        ModalManager.close();

        await fetchCompanyAccountingData();
        renderChartOfAccounts();

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Création', error.message, 8000);
        console.error('Erreur lors de la création du compte:', error);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showEditAccountModal(accountId) {
    const account = window.app.chartOfAccounts.find(a => a.id === accountId);
    if (!account) {
        NotificationManager.show('danger', 'Erreur', 'Compte introuvable.', 3000);
        return;
    }

    const options = ['CLASSE 1', 'CLASSE 2', 'CLASSE 3', 'CLASSE 4', 'CLASSE 5', 'CLASSE 6', 'CLASSE 7', 'CLASSE 8', 'CLASSE 9'];
    const optionsHTML = options.map(opt => 
        `<option value="${opt}" ${account.type === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');


    const modalContent = `
        <form id="edit-account-form" onsubmit="handleEditAccount(event, '${accountId}')">
            <div class="mb-4">
                <label for="edit-account-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de Compte</label>
                <input type="number" id="edit-account-number" name="number" value="${account.number}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
            </div>
            <div class="mb-4">
                <label for="edit-account-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Intitulé du Compte</label>
                <input type="text" id="edit-account-name" name="name" value="${account.name}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
            </div>
            <div class="mb-6">
                <label for="edit-account-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type (Classe)</label>
                <select id="edit-account-type" name="type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2">
                    ${optionsHTML}
                </select>
            </div>
            <button type="submit" id="edit-account-btn" class="w-full btn bg-info text-white p-3 rounded-xl font-bold hover:bg-info-dark transition duration-150 shadow-md shadow-info/40">
                Enregistrer les Modifications
            </button>
        </form>
    `;
    ModalManager.open(`Modifier Compte ${account.number}`, account.name, modalContent);
}

async function handleEditAccount(e, accountId) {
    e.preventDefault();
    const btn = document.getElementById('edit-account-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loading-spinner w-4 h-4 border-white"></div><span class="ml-2">Sauvegarde...</span>`;
    btn.disabled = true;

    const companyId = window.app.currentCompanyId;
    const formData = {
        number: parseInt(document.getElementById('edit-account-number').value),
        name: document.getElementById('edit-account-name').value,
        type: document.getElementById('edit-account-type').value,
        companyId: companyId
    };

    try {
        const result = await apiFetch(`/accounting/account/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(formData),
        });
        
        NotificationManager.show('success', 'Succès', `Compte ${result.number} mis à jour.`, 5000);
        ModalManager.close();

        await fetchCompanyAccountingData();
        renderChartOfAccounts();

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Modification', error.message, 8000);
        console.error('Erreur lors de la modification du compte:', error);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}


async function deleteAccount(accountId, accountNumber) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte ${accountNumber} ? Cette action est irréversible et peut impacter les écritures liées !`)) {
        return;
    }

    try {
        await apiFetch(`/accounting/account/${accountId}`, {
            method: 'DELETE',
        });
        
        NotificationManager.show('success', 'Succès', `Compte ${accountNumber} supprimé.`, 5000);

        await fetchCompanyAccountingData();
        renderChartOfAccounts();

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Suppression', error.message, 8000);
        console.error('Erreur lors de la suppression du compte:', error);
    }
}


// =================================================================================
// 5. ROUTAGE ET INITIALISATION
// =================================================================================

/**
 * Fonction de routage principale pour charger les modules de l'application.
 */
function loadModule(moduleName) {
    const contentArea = document.getElementById('content-area');
    const currentModule = contentArea.dataset.module;

    // Si le module est le même et qu'il est déjà chargé, on ne fait rien
    if (currentModule === moduleName) {
        console.log(`[ROUTING] Module ${moduleName} déjà chargé.`);
        return;
    }

    // Mise à jour de la classe active dans la navigation
    document.querySelectorAll('#role-navigation-menu button').forEach(btn => {
        if (btn.dataset.module === moduleName) {
            btn.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
            btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
            btn.querySelector('i').classList.remove('text-primary', 'dark:text-primary-light', 'group-hover:text-primary-dark');
            btn.querySelector('i').classList.add('text-white');
        } else {
            btn.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
            btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
            btn.querySelector('i').classList.remove('text-white');
            btn.querySelector('i').classList.add('text-primary', 'dark:text-primary-light', 'group-hover:text-primary-dark');
        }
    });
    
    // Gérer le rendu des modules
    switch (moduleName) {
        case 'global_dashboard':
        case 'user_dashboard':
            contentArea.dataset.module = moduleName;
            renderDashboard();
            break;
        case 'chart_of_accounts': // <-- NOUVEAU
            contentArea.dataset.module = moduleName;
            renderChartOfAccounts();
            break;
        case 'quick_entry':
            // Logique de rendu pour Saisie Rapide
            contentArea.innerHTML = `<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Saisie et Validation Rapide</h1><p class="text-gray-500 dark:text-gray-400">Interface de saisie rapide à implémenter.</p>`;
            break;
        case 'financial_statements':
            // Logique de rendu pour États Financiers
            contentArea.innerHTML = `<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">États Financiers SYSCOHADA</h1><p class="text-gray-500 dark:text-gray-400">Génération du Bilan et du Compte de Résultat ici.</p>`;
            break;
        case 'grand_livre':
            // Logique de rendu pour Journal & Grand Livre
            contentArea.innerHTML = `<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Journal & Grand Livre</h1><p class="text-gray-500 dark:text-gray-400">Visualisation détaillée des transactions.</p>`;
            break;
        // Ajouter d'autres cas ici (user_management, audit_logs, etc.)
        default:
            contentArea.innerHTML = `<div class="p-10 text-center text-gray-500 dark:text-gray-400">Module '${moduleName}' non implémenté.</div>`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Événements d'authentification
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Initialisation de l'UI si l'utilisateur est déjà connecté (session storage, etc.)
    // Si window.app.userContext.token est présent, on peut tenter de charger l'UI.
    // Pour l'instant, on se base sur la vue par défaut (login)
    
    // Initialisation du Dark/Light Mode
    const darkModeButton = document.querySelector('#quick-actions button');
    if (darkModeButton) {
        darkModeButton.onclick = function() {
            document.documentElement.classList.toggle('dark');
            const icon = this.querySelector('.fas');
            if (document.documentElement.classList.contains('dark')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        };
    }
});

// Rendre les fonctions d'action spécifiques disponibles globalement pour l'onclick
window.loadModule = loadModule;
window.switchCompany = switchCompany;
// Fonctions du Plan Comptable (V1.8)
window.showCreateAccountModal = showCreateAccountModal;
window.handleCreateAccount = handleCreateAccount;
window.showEditAccountModal = showEditAccountModal;
window.handleEditAccount = handleEditAccount;
window.deleteAccount = deleteAccount;
// Autres (MOCK/EXISTANT)
window.generateFinancialStatements = (e) => ModalManager.open('Rapport', 'Génération des états financiers', '<p>Le rapport est en cours de préparation...</p>');
// ... (Ajouter toutes les autres fonctions nécessaires pour les autres modules)
