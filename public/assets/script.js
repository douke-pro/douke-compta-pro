// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète et unifiée de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.8 - INTÉGRATION DASHBOARD V2 & PLAN COMPTABLE
// =================================================================================
// =================================================================================
// 0. CONFIGURATION GLOBALE ET GESTIONNAIRES UNIFIÉS
// =================================================================================
// Définition de l'URL de base de l'API Odoo (Render Backend)
const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD
    ? 'https://douke-compta-pro.onrender.com' // TODO: Remplacer par l'URL finale de votre backend
    : 'http://localhost:3000';

// État global de l'application
window.app = {
    // CORRECTION ICI: Initialisation avec la structure des données réelles
    userContext: {
        token: null,     // Le JWT récupéré après login
        profile: null,
        name: null,
        email: null,
    },
    currentProfile: null,
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL', // 'NORMAL' ou 'MINIMAL'
    filteredData: {
        entries: [],
        accounts: [], // Données du Plan Comptable
        financialReport: null, // Données du rapport SYSCOHADA (pour graphiques/SMT) // 💡 NOUVEAU
    },
    companiesList: [], // Liste complète des entreprises accessibles
    UI_LOADED: false,

    // =========================================================================
    // 💡 NOUVEAU : STRUCTURE POUR LES INDICATEURS CLÉS DU DASHBOARD (KPIs)
    // =========================================================================
    dashboardKPIs: {
        cash: 0,
        profit: 0,
        debts: 0,
        grossMargin: 0, // Marge Brute
        liquidityRatio: 0, // Ratio de liquidité (Actif Courant / Passif Courant)
        pendingEntries: 0, // Écritures à valider
    },
    
    // Mock pour les données utilisateur (à des fins de démonstration ou de tests non-API)
    MOCK_USERS: [
        { email: 'admin@douke.com', profile: 'ADMIN', name: 'Admin DOUKÈ' },
        { email: 'collab@douke.com', profile: 'COLLABORATEUR', name: 'Collab Senior' },
        { email: 'user@douke.com', profile: 'USER', name: 'User Standard', total_caisses: 3, active_caisses: 2 },
        { email: 'caisse@douke.com', profile: 'CAISSIER', name: 'Patrice Caisse', total_caisses: 1, active_caisses: 1 },
    ]
};
// ------------------- GESTIONNAIRES D'INTERFACE UTILISATEUR (Adaptés à votre HTML) -------------------
const NotificationManager = {
// ... (Logique NotificationManager conservée) ...
    show: (type, title, message, duration = 5000) => {
        const zone = document.getElementById('notification-zone');
        if (!zone) {
            console.warn(`[NOTIF] ${title} (${type}): ${message}`);
            return;
        }
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
            // Démarrer l'animation de disparition
            notificationElement.classList.remove('opacity-100');
            notificationElement.classList.add('opacity-0', 'scale-95');
            setTimeout(() => notificationElement.remove(), 300); // Supprimer après la fin de la transition
        }, duration);
    }
};
window.unifiedManager = { notificationManager: NotificationManager };
const ModalManager = {
// ... (Logique ModalManager conservée) ...
    open: (title, subtitle, contentHTML) => {
        // Ces IDs sont confirmés par le fichier index.html
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-subtitle').textContent = subtitle;
        document.getElementById('modal-body').innerHTML = contentHTML;
        document.body.classList.add('modal-open');
    },
    close: () => {
        document.body.classList.remove('modal-open');
        // Nettoyer le contenu pour la prochaine ouverture
        document.getElementById('modal-body').innerHTML = `<div class="p-8 text-center text-gray-500">Contenu chargé dynamiquement...</div>`;
    }
};
document.getElementById('modal-close-btn')?.addEventListener('click', ModalManager.close);
const CacheManager = {
// ... (Logique CacheManager conservée) ...
    get: (key) => { return null; },
    set: (key, data, ttl) => { /* console.log(`[CACHE] Mise en cache de ${key}`); */ },
    clearCache: () => { /* console.log('[CACHE] Cache nettoyé.'); */ }
};
// =================================================================================
// 1. SERVICES D'API & AUTHENTIFICATION
// =================================================================================
/**
 * Fonction centrale pour toutes les communications sécurisées avec le backend Express.
 */
async function apiFetch(endpoint, options = {}) {
// ... (Logique apiFetch conservée) ...
    // Construction de l'URL (ex: http://localhost:3000 + /api/auth/login)
    const url = `${API_BASE_URL}${endpoint}`;
    const token = window.app.userContext?.token;

    // 1. Définir les en-têtes (Headers)
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers // Permet d'ajouter des headers spécifiques
    };
    // 2. Injecter le token Bearer si l'utilisateur est connecté et si ce n'est pas l'appel de login
    // Le header 'Authorization': null est la convention pour désactiver l'injection (pour /auth/login)
    if (token && headers['Authorization'] !== null) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // 3. Exécuter la requête
    try {
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body,
        });
        // 4. Gérer les erreurs HTTP (4xx ou 5xx)
        if (!response.ok) {
            let errorData;
            try {
                // Tenter de lire le corps JSON pour un message d'erreur détaillé du backend
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
            }

            // Si c'est une 401 (Non autorisé/Session expirée), notifier l'utilisateur
            if (response.status === 401) {
                NotificationManager.show('danger', 'Session Expirée', errorData.error || 'Veuillez vous reconnecter.', 8000);
            }
            throw new Error(errorData.error || errorData.message || 'Erreur inconnue du serveur.');
        }
        // 5. Retourner le JSON
        return await response.json();
    } catch (error) {
        console.error(`[API FETCH ERROR] Endpoint: ${endpoint}`, error.message);
        throw new Error(`Problème de connexion au serveur : ${error.message}`);
    }
}
/**
 * Récupère la liste des entreprises (analytic IDs) liées à l'utilisateur connecté
 * via la route réelle /api/company/list.
 */
async function fetchUserCompanies() {
// ... (Logique fetchUserCompanies conservée) ...
    try {
        // Route du Company Controller (Fichier 8)
        const response = await apiFetch('/api/company/list');

        if (!response.companies || response.companies.length === 0) {
            window.app.companiesList = [];
            NotificationManager.show('warning', 'Aucun Dossier', 'Aucune entreprise n\'est affectée à votre compte.', 5000);
            return;
        }

        // Le backend doit renvoyer un tableau de { id: analyticId, name: nomEntreprise, systeme: 'NORMAL'|'SMT' }
        window.app.companiesList = response.companies;

        // Initialiser l'entreprise par défaut
        if (window.app.companiesList.length > 0) {
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
 * Gère le processus de connexion en appelant l'API backend Express (/api/auth/login).
 */
async function handleLogin(e) {
// ... (Logique handleLogin conservée) ...
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = e.target.querySelector('button[type="submit"]');
    const originalText = loginButton.innerHTML;
    const messageEl = document.getElementById('login-message');
    // Désactiver le bouton
    loginButton.innerHTML = `<div class="loading-spinner w-5 h-5 border-white"></div><span class="ml-3">Connexion...</span>`;
    loginButton.disabled = true;
    messageEl.classList.add('hidden'); // Cacher l'ancien message d'erreur
    try {
        // 1. Appel à la route /api/auth/login (Fichier 7)
        const response = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': null // IMPORTANT: Pas de token pour l'appel de login
            }
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
        // 4. Passer à l'affichage principal
        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${window.app.userContext.name}.`, 3000);

        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        renderDashboardView();

    } catch (error) {
        // Afficher l'erreur de connexion dans le conteneur du formulaire
        messageEl.textContent = error.message.includes('Identifiants') || error.message.includes('token')
            ? error.message
            : "Erreur de connexion au service. Vérifiez le statut du backend.";
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
// ... (Logique handleLogout conservée) ...
    window.app.userContext = { token: null, profile: null, name: null, email: null };
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.currentCompanyName = null;
    window.app.filteredData.entries = [];
    window.app.companiesList = [];
    CacheManager.clearCache();
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-message').classList.add('hidden');

    NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}
// =================================================================================
// 2. LOGIQUE DE RENDU DU DASHBOARD ET NAVIGATION
// =================================================================================
function updateSecureUserInfo() {
// ... (Logique updateSecureUserInfo conservée) ...
    const user = window.app.userContext;
    const companyName = window.app.currentCompanyName || "-- Global / Non sélectionné --";
    // Mise à jour des infos utilisateur dans la sidebar
    document.getElementById('current-role').textContent = user?.profile || 'N/A';
    document.getElementById('welcome-message').textContent = user ? `Hello, ${user.name.split(' ')[0]}!` : 'Chargement...';
    document.getElementById('current-company-name').textContent = companyName;

    // Mise à jour du header de contenu
    const contextMessageEl = document.getElementById('context-message');
    if (contextMessageEl) {
        // Affichage du système comptable à côté du nom de l'entreprise si sélectionné
        const systemeInfo = window.app.currentCompanyId ? ` (${window.app.currentSysteme})` : '';
        contextMessageEl.innerHTML = `Dossier Actif : <span class="text-primary font-bold">${companyName}</span>${systemeInfo}`;
    }

    // Mise à jour de l'avatar (première lettre du nom)
    const avatarEl = document.getElementById('user-avatar-text');
    if (avatarEl) {
        avatarEl.textContent = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
    }
    renderHeaderSelectors(); // Mise à jour du sélecteur
}
function createNavItem(text, icon, action, active = false) {
// ... (Logique createNavItem conservée) ...
    const baseClasses = "flex items-center p-4 rounded-xl transition-all font-bold group";
    const activeClasses = "bg-primary text-white shadow-lg shadow-primary/30";
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
    const iconBase = "fas mr-4 w-5 text-center";
    return `
        <button onclick="loadModule('${action}')" class="${baseClasses} ${active ? activeClasses : inactiveClasses}" data-module="${action}" data-active="${active}">
            <i class="${iconBase} ${icon}"></i>
            <span>${text}</span>
        </button>
    `;
}
/**
 * Configure le menu de navigation selon le profil utilisateur (Intégration complète).
 * 💡 MISE À JOUR : Ajout du module Plan Comptable
 */
function renderRoleNavigation() {
    const menu = document.getElementById('role-navigation-menu');
    if (!menu) return; // Sécurité
    menu.innerHTML = '';
    const profile = window.app.currentProfile;
    const navItems = {
        'ADMIN': [
            ['Vue Globale (KPI)', 'fa-layer-group', 'global_dashboard'],
            ['Gestion Utilisateurs', 'fa-users-cog', 'user_management'],
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'],
            ['Plan Comptable', 'fa-folder-open', 'chart_of_accounts'], // 💡 NOUVEAU
            ['États Financiers SYSCOHADA', 'fa-balance-scale', 'financial_statements'],
            ['Journal & Grand Livre', 'fa-book-open', 'grand_livre'],
            ['Audit & Sécurité', 'fa-shield-alt', 'audit_logs'],
        ],
        'USER': [ // Pilotage Stratégique / Manager
            ['Pilotage & Synthèse', 'fa-tachometer-alt', 'user_dashboard'],
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'],
            ['Plan Comptable', 'fa-folder-open', 'chart_of_accounts'], // 💡 NOUVEAU
            ['États Financiers SYSCOHADA', 'fa-balance-scale', 'financial_statements'],
            ['Trésorerie & Cash Flow', 'fa-wallet', 'cash_flow'],
        ],
        'CAISSIER': [ // Saisie Rapide / Trésorerie
            ['Synthèse Caisse', 'fa-chart-line', 'cashier_dashboard'],
            ['Saisie Mouvements', 'fa-keyboard', 'quick_entry'],
            ['Rapports de Caisse', 'fa-file-invoice', 'cash_reports'],
        ],
        'COLLABORATEUR': [ // Portefeuille Client et Validation
            ['Portefeuille & Suivi', 'fa-briefcase', 'collab_dashboard'],
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'], // <-- AJOUTÉ
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
// ... (Logique renderHeaderSelectors conservée) ...
    const quickActions = document.getElementById('quick-actions');
    const user = window.app.userContext;
    // Supprimer l'ancien sélecteur s'il existe
    document.getElementById('company-selector-container')?.remove();
    // Afficher le sélecteur seulement s'il y a plus d'une entreprise accessible
    if (user && window.app.companiesList.length > 1) {
        const selectHTML = `
            <div id="company-selector-container" class="relative">
                <select id="company-selector" onchange="switchCompany(this.value)"
                    class="p-2 border border-primary dark:border-primary-light bg-primary text-white dark:bg-primary-dark rounded-xl text-sm font-bold shadow-lg shadow-primary/30 outline-none appearance-none pr-8 cursor-pointer">
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
        const darkModeButton = quickActions?.querySelector('.fa-moon')?.closest('button');
        if (quickActions && darkModeButton) {
            quickActions.insertBefore(tempDiv.firstChild, darkModeButton);
        }
    }
}
function renderDashboardView() {
// ... (Logique renderDashboardView conservée) ...
    updateSecureUserInfo();
    renderRoleNavigation();

    // Déterminer le module par défaut à charger au login
    const defaultModule = {
        'ADMIN': 'global_dashboard',
        'USER': 'user_dashboard',
        'CAISSIER': 'cashier_dashboard',
        'COLLABORATEUR': 'collab_dashboard',
    }[window.app.currentProfile] || 'user_dashboard';
    // Si aucune entreprise n'est sélectionnée (cas rare, sauf nouvel admin)
    if (!window.app.currentCompanyId && window.app.companiesList.length > 0) {
        switchCompany(window.app.companiesList[0].id, true);
    } else if (!window.app.currentCompanyId && window.app.companiesList.length === 0) {
        // Vue par défaut si aucun dossier disponible
        const contentArea = document.getElementById('dashboard-content-area');
        if (contentArea) contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-handshake fa-4x text-info mb-4"></i><p class="text-xl font-bold">Bienvenue chez DOUKÈ PRO !</p><p>Votre espace est en cours de configuration.
Contactez le support pour affecter votre première entreprise.</p></div>`;
    } else {
        // 💡 NOUVEL APPEL : Charger les KPIs de synthèse pour le tableau de bord
        fetchDashboardKPIs(); 
        loadModule(defaultModule, true);
    }
}
async function switchCompany(companyId, isInitialLoad = false) {
// ... (Logique switchCompany conservée) ...
    const company = window.app.companiesList.find(c => c.id == companyId);
    if (!company) {
        NotificationManager.show('danger', 'Erreur de Contexte', 'Entreprise non trouvée dans votre liste d\'accès.', 3000);
        return;
    }
    if (company.id == window.app.currentCompanyId && !isInitialLoad) {
        return;
    }
    window.app.currentCompanyId = company.id;
    window.app.currentCompanyName = company.name;
    window.app.currentSysteme = company.systeme;
    updateSecureUserInfo();
    if (!isInitialLoad) {
        NotificationManager.show('info', 'Contexte mis à jour', `Dossier actif: ${company.name} (SYSCOHADA ${company.systeme})`, 3000);
    }
    // Recharger le module actif pour rafraîchir les données
    const activeModuleButton = document.querySelector('#role-navigation-menu button[data-active="true"]');
    const activeModule = activeModuleButton ? activeModuleButton.dataset.module :
        ({ 'ADMIN': 'global_dashboard', 'USER': 'user_dashboard', 'CAISSIER': 'cashier_dashboard', 'COLLABORATEUR': 'collab_dashboard' }[window.app.currentProfile] || 'user_dashboard');
    
    // 💡 NOUVEL APPEL : Assurez-vous que les KPIs sont mis à jour après le switch
    fetchDashboardKPIs(); 
    
    await loadModule(activeModule, true);
}
// =================================================================================
// 3. LOGIQUE DE CHARGEMENT DES DONNÉES ET DES MODULES SPÉCIFIQUES
// =================================================================================

/**
 * 💡 NOUVELLE FONCTION : Récupère les données de synthèse pour le dashboard.
 * Met à jour window.app.dashboardKPIs.
 */
async function fetchDashboardKPIs() {
    if (!window.app.currentCompanyId) {
        console.warn("Tentative de chargement des KPIs sans Company ID.");
        return;
    }

    try {
        // 1. Appel à la route de Dashboard (Retourne { cash, profit, debts, ... })
        const response = await apiFetch(`/api/accounting/dashboard?companyId=${window.app.currentCompanyId}`, { method: 'GET' });

        // 2. MOCK d'enrichissement : Calculs Front-end pour les NOUVEAUX KPIs
        // (En attendant que le backend les fournisse. Nous utilisons la structure de données attendue)
        const data = response.data || { cash: 0, profit: 0, debts: 0 };
        const profit = data.profit || 0;
        
        // Simulation d'enrichissement pour la Marge Brute et le Ratio de Liquidité (meilleur de moi)
        const revenue = 15000000; // Mock de CA pour calcul
        const costOfSales = 5000000; // Mock de Charges pour calcul
        const grossMargin = revenue - costOfSales; 
        
        const currentAssets = (data.cash || 0) + 10000000; // Ex: Trésorerie + Créances Clients MOCK
        const currentLiabilities = (data.debts || 0) + 5000000; // Ex: Dettes Fournisseurs + autres Dettes CT MOCK
        const liquidityRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 99.99;

        // Mise à jour de l'état global
        window.app.dashboardKPIs = {
            cash: data.cash || 0,
            profit: profit,
            debts: data.debts || 0,
            grossMargin: grossMargin,
            liquidityRatio: parseFloat(liquidityRatio), 
            pendingEntries: 3, // Mock en attendant le champ du backend
        };

    } catch (error) {
        // En cas d'échec du chargement des KPIs, afficher le message mais ne pas bloquer
        // NotificationManager.show('danger', 'Erreur KPI', `Impossible de charger les KPIs : ${error.message}`, 5000);
        window.app.dashboardKPIs = { cash: 0, profit: 0, debts: 0, grossMargin: 0, liquidityRatio: 0, pendingEntries: 0 };
    }
}


/**
 * 💡 MISE À JOUR : Récupère les données comptables brutes (Rapport et Plan Comptable).
 * Utilisée par les modules 'financial_statements', 'chart_of_accounts', etc.
 */
async function fetchAccountingData() {
    if (!window.app.currentCompanyId) {
        console.warn("Tentative de chargement des données sans Company ID sélectionné.");
        return { report: null, accounts: [], entries: [] };
    }

    // Indiquer le chargement dans l'interface (Logique conservée)
    const dashboardContent = document.getElementById('dashboard-content-area');
    if(dashboardContent) {
        dashboardContent.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Chargement des données comptables...</p></div>`;
    }

    try {
        const companyId = window.app.currentCompanyId;
        const systemType = window.app.currentSysteme === 'NORMAL' ? 'NORMAL' : 'SMT';

        // 1. Appel à la route de Rapport Financier
        const reportEndpoint = `/api/accounting/report/${companyId}?systemType=${systemType}`;
        const reportData = await apiFetch(reportEndpoint, { method: 'GET' });

        // 2. 🚀 APPEL RÉEL au Plan Comptable (Route désormais disponible dans le backend)
        const accountsEndpoint = `/api/accounting/chart-of-accounts?companyId=${companyId}`;
        const accountsResponse = await apiFetch(accountsEndpoint, { method: 'GET' });
        
        // 3. MOCK d'enrichissement du solde pour le Plan Comptable (Normalement fait côté backend)
        // Ajout d'une propriété 'balance' pour l'affichage du solde (Crucial pour la nouvelle table)
        const enrichedAccounts = (accountsResponse.data || []).map(acc => ({
            ...acc,
            balance: Math.random() * 10000000 * (acc.code.toString().startsWith('7') ? 1 : -1) // Solde MOCK
        }));

        // 4. Mise à jour de l'état global
        window.app.filteredData = {
            report: reportData, 
            accounts: enrichedAccounts, // Les comptes réels enrichis d'Odoo
            entries: [], // La route /report ne renvoie pas le détail des écritures
        };
        return window.app.filteredData;

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Chargement', `Impossible de charger les données : ${error.message}`, 8000);
        // Réinitialiser les données en cas d'échec
        window.app.filteredData = { report: null, accounts: [], entries: [] };
        // Afficher un message d'erreur clair dans le dashboard
        if(dashboardContent) {
             dashboardContent.innerHTML = `<div class="text-center p-20 text-danger"><i class="fas fa-exclamation-triangle fa-3x mb-4"></i><p class="text-xl font-bold">Échec de la connexion aux données comptables.</p><p>Vérifiez l'état de votre backend Express et si le service Odoo est accessible.</p></div>`;
        }
        throw error;
    }
}

// ------------------- RENDU SPÉCIFIQUE 1 : DASHBOARDS (Tous les profils) -------------------

/**
 * 💡 MISE À JOUR : Rendu du Dashboard utilisant les KPIs (plus précis et enrichis).
 */
function renderDashboard(contentArea, profile) {
    const data = window.app.dashboardKPIs;
    const isNormalSystem = window.app.currentSysteme === 'NORMAL';

    // Formattage de la devise
    const formatCurrency = (amount) => amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 });
    
    // Variables pour l'affichage
    const cash = data.cash || 0;
    const profit = data.profit || 0;
    const debts = data.debts || 0;
    const grossMargin = data.grossMargin || 0; // NOUVEAU
    const liquidityRatio = data.liquidityRatio || 0; // NOUVEAU
    const pendingEntries = data.pendingEntries || 0;

    // --- Calculs Spécifiques ---
    let specificKPIs = '';
    
    if (profile === 'ADMIN') {
        // Mocks pour les stats ADMIN (basé sur le mock de user_management)
        const totalCollaborators = 3;
        const totalCompanies = window.app.companiesList.length;
        const avgCompanyPerCollab = (totalCompanies / totalCollaborators).toFixed(1);

        specificKPIs = `
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-info">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-users mr-2"></i> Collaborateurs Actifs</p>
                <h3 class="text-2xl font-black text-info mt-2">${totalCollaborators}</h3>
            </div>
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-briefcase mr-2"></i> Dossiers / Collab (Moyenne)</p>
                <h3 class="text-2xl font-black text-secondary mt-2">${avgCompanyPerCollab}</h3>
            </div>
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-warning">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-percent mr-2"></i> Marge Brute</p>
                <h3 class="text-2xl font-black ${grossMargin > 0 ? 'text-success' : 'text-danger'} mt-2">${formatCurrency(grossMargin)}</h3>
            </div>
        `;
    } else if (profile === 'USER' || profile === 'CAISSIER') {
        const userMocks = window.app.MOCK_USERS.find(u => u.profile === profile);
        const totalCaisses = userMocks?.total_caisses || 0;
        const activeCaisses = userMocks?.active_caisses || 0;

        specificKPIs = `
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-info">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-cash-register mr-2"></i> Caisses (Comptes 571) Crées</p>
                <h3 class="text-2xl font-black text-info mt-2">${totalCaisses}</h3>
            </div>
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-check-circle mr-2"></i> Caisses Actives / Actuelles</p>
                <h3 class="text-2xl font-black ${activeCaisses > 0 ? 'text-success' : 'text-danger'} mt-2">${activeCaisses}</h3>
            </div>
            <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 ${liquidityRatio >= 1.5 ? 'border-success' : 'border-danger'}">
                <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-balance-scale-left mr-2"></i> Ratio de Liquidité G. (Ideal > 1.5)</p>
                <h3 class="text-2xl font-black text-warning mt-2">${liquidityRatio}</h3>
            </div>
        `;
    }

    // --- Rendu Final ---
    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Tableau de Bord ${profile === 'ADMIN' ?
                'Global' : (profile === 'USER' ? 'Stratégique' : 'Opérationnel')}</h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">Synthèse du dossier <strong class="text-primary">${window.app.currentCompanyName}</strong></p>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">

                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-primary">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-coins mr-2"></i> Trésorerie Actuelle (512/571)</p>
                    <h3 class="text-2xl font-black text-primary mt-2">${formatCurrency(cash)}</h3>
                </div>

                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-success">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-chart-line mr-2"></i> Résultat Net YTD</p>
                    <h3 class="text-2xl font-black ${profit >= 0 ? 'text-success' : 'text-danger'} mt-2">${formatCurrency(profit)}</h3>
                </div>

                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-danger">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-money-bill-wave mr-2"></i> Dettes Fournisseurs (40x)</p>
                    <h3 class="text-2xl font-black text-danger mt-2">${formatCurrency(debts)}</h3>
                </div>

                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-warning">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-check-circle mr-2"></i> Écritures à Valider</p>
                    <h3 class="text-2xl font-black ${pendingEntries > 0 ? 'text-danger' : 'text-success'} mt-2">${pendingEntries}</h3>
                </div>

                ${specificKPIs}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="mt-4 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h3 class="font-black text-lg mb-4">Évolution Mensuelle des Flux (Revenus vs Dépenses)</h3>
                    <canvas id="mainChart" height="100"></canvas>
                </div>
                <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h3 class="font-black text-lg mb-4 text-warning"><i class="fas fa-bell mr-2"></i> Alertes et Tâches Prioritaires</h3>
                    <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        ${profile !== 'ADMIN' && liquidityRatio < 1.5 ?
                            `<li><i class="fas fa-exclamation-triangle text-danger mr-2"></i> Ratio de liquidité (${liquidityRatio}) trop faible (cible 1.5).</li>` : ''}

                        <li><i class="fas fa-arrow-up text-success mr-2"></i> Forte croissance du CA (+12% ce mois)</li>
                        ${pendingEntries > 0 ?
                            `<li><i class="fas fa-exclamation-circle text-danger mr-2"></i> ${pendingEntries} écritures nécessitent une validation.</li>` : `<li><i class="fas fa-check text-success mr-2"></i> Aucune écriture en attente.</li>`}
                        <li><i class="fas fa-calendar-alt text-info mr-2"></i> Date limite de clôture mensuelle (J+5).</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
// ... (Logique Chart.js conservée) ...
    // Dessin du graphique (Déchargé pour la performance)
    setTimeout(() => { 
        if (typeof Chart !== 'undefined' && document.getElementById('mainChart')) { 
            const ctx = document.getElementById('mainChart').getContext('2d'); 
            new Chart(ctx, { 
                type: 'bar', 
                data: { 
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], 
                    datasets: [{ 
                        label: 'Revenus', 
                        data: [5000000, 7500000, 15000000, 12500000, 10000000, 20000000], // Données mock basées sur le CA
                        backgroundColor: 'rgba(93, 92, 222, 0.7)', 
                        borderColor: '#5D5CDE', 
                        borderWidth: 1, 
                    }, { 
                        label: 'Dépenses', 
                        data: [2500000, 3000000, 5000000, 6250000, 8250000, 12500000], // Données mock basées sur les charges
                        backgroundColor: 'rgba(239, 68, 68, 0.7)', 
                        borderColor: '#EF4444', 
                        borderWidth: 1, 
                    }] 
                }, 
                options: { 
                    responsive: true, 
                    scales: { y: { beginAtZero: true } } 
                } 
            }); 
        } 
    }, 100);
} 
function renderCollaboratorDashboard(contentArea) { 
// ... (Logique renderCollaboratorDashboard conservée) ...
    const data = window.app.filteredData.entries; 
    const pendingValidation = data.filter(e => e.status === 'En attente').length;
    const clientsCount = window.app.companiesList.length; // Nombre d'entreprises accessibles par le collaborateur 
    const totalFees = 8000000;
    // Mock pour l'exemple 
    contentArea.innerHTML = ` 
        <div class="space-y-8 fade-in"> 
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Portefeuille et Suivi Collaborateur</h2> 
            <p class="text-lg text-gray-700 dark:text-gray-300">Gestion de l'intégrité et de la validation des écritures pour votre portefeuille.</p> 
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6"> 
            </div>
        </div>
    `;
}

// ------------------- RENDU SPÉCIFIQUE 2 : PLAN COMPTABLE (COA) -------------------

/**
 * 💡 NOUVEAU : Rendu de la vue Plan Comptable (Amélioration 3).
 * Inclut le solde et les boutons d'action (CRUD).
 */
function renderChartOfAccounts(contentArea, accounts) {
    // Création de la table
    const tableRows = accounts.map(acc => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">${acc.code}</td>
            <td class="px-4 py-3">${acc.name}</td>
            <td class="px-4 py-3 text-sm">${acc.account_type || '-'}</td>
            <td class="px-4 py-3 text-right font-bold ${acc.balance > 0 ? 'text-success' : (acc.balance < 0 ? 'text-danger' : 'text-gray-500')}">
                 ${acc.balance ? acc.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }) : '0 XOF'}
            </td>
            ${window.app.currentProfile === 'ADMIN' ? `
            <td class="px-4 py-3 text-center">
                <button onclick="showEditAccountModal(${acc.id})" class="text-info hover:text-primary-dark transition-colors mr-2" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteAccount(${acc.id})" class="text-danger hover:text-danger-dark transition-colors" title="Supprimer (Non implémenté)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
            ` : `<td class="px-4 py-3"></td>`}
        </tr>
    `).join('');
    
    // Le contenu final
    contentArea.innerHTML = `
        <div class="space-y-6 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Plan Comptable (Dossier ${window.app.currentCompanyName})</h2>
            <div class="flex justify-between items-center mb-4">
                <p class="text-lg text-gray-700 dark:text-gray-300">${accounts.length} comptes actifs chargés. (Solde MOCKé)</p>
                ${window.app.currentProfile === 'ADMIN' ? `
                <button onclick="showCreateAccountModal()" class="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-xl shadow-md transition-shadow">
                    <i class="fas fa-plus mr-2"></i> Ajouter un Compte
                </button>
                ` : ''}
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Code</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-4/12">Nom du Compte</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/12">Type</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/12">Solde Actuel</th>
                            ${window.app.currentProfile === 'ADMIN' ? `<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Actions</th>` : `<th></th>`}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * 💡 NOUVEAU : Logique de l'UI pour la création de compte (CRUD)
 */
function showCreateAccountModal() {
     ModalManager.open(
        'Créer un Nouveau Compte',
        'Définissez les propriétés de ce nouveau compte Odoo.',
        `
        <form onsubmit="handleCreateAccount(event)">
            <div class="space-y-4">
                <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Code Comptable (Ex: 411000)</label>
                     <input type="number" id="new-acc-code" required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"></div>
                <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du Compte</label>
                     <input type="text" id="new-acc-name" required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"></div>
                <div><label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type de Compte</label>
                     <select id="new-acc-type" required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="receivable">Client</option>
                        <option value="payable">Fournisseur</option>
                        <option value="asset_cash">Trésorerie</option>
                        <option value="expense">Charge</option>
                        <option value="income">Produit</option>
                     </select></div>
            </div>
            <div class="mt-6 flex justify-end">
                <button type="button" onclick="ModalManager.close()" class="btn-secondary mr-3">Annuler</button>
                <button type="submit" class="btn-primary">Créer le Compte</button>
            </div>
        </form>
        `
    );
}

/**
 * 💡 NOUVEAU : Gestion de l'appel API pour la création de compte.
 */
async function handleCreateAccount(e) {
    e.preventDefault();
    const code = document.getElementById('new-acc-code').value;
    const name = document.getElementById('new-acc-name').value;
    const type = document.getElementById('new-acc-type').value;

    try {
        await apiFetch('/api/accounting/chart-of-accounts', {
            method: 'POST',
            body: JSON.stringify({ code, name, type, companyId: window.app.currentCompanyId }),
        });
        ModalManager.close();
        NotificationManager.show('success', 'Création réussie', `Compte ${code} créé dans Odoo.`, 4000);
        // Recharge le module Plan Comptable pour afficher le nouveau compte
        loadModule('chart_of_accounts', true);
    } catch (error) {
        NotificationManager.show('danger', 'Erreur de création', error.message, 8000);
    }
}

// Fonction MOCK à implémenter pour la modification
function showEditAccountModal(accountId) {
    NotificationManager.show('info', 'Fonctionnalité', `Ouverture de la modal d'édition du compte #${accountId}.`, 3000);
}

// Fonction MOCK à implémenter pour la suppression
function deleteAccount(accountId) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte #${accountId}?`)) {
        NotificationManager.show('warning', 'Non implémenté', `La suppression du compte est désactivée pour l'instant.`, 5000);
    }
}
// -----------------------------------------------------------------------------------------
// 💡 IMPORTANT : MISE À JOUR DE loadModule
// La fonction loadModule doit être mise à jour pour inclure les nouveaux modules.
// Étant donné que sa définition n'est pas complète dans le snippet, j'ajoute
// le corps de la fonction ici, en incluant le support pour chart_of_accounts.
// VEUILLEZ VÉRIFIER QUE VOUS AVEZ UNE DÉFINITION GLOBALE DE loadModule.
// -----------------------------------------------------------------------------------------
async function loadModule(moduleName, forceReload = false) {
    const contentArea = document.getElementById('dashboard-content-area');
    const navButtons = document.querySelectorAll('#role-navigation-menu button');
    
    // 1. Gestion du bouton actif
    navButtons.forEach(btn => {
        const isActive = btn.dataset.module === moduleName;
        btn.dataset.active = isActive;
        btn.className = createNavItem(btn.querySelector('span').textContent, btn.querySelector('i').className.replace('fas mr-4 w-5 text-center ', ''), moduleName, isActive).match(/class="([^"]*)"/)[1];
    });

    // 2. Chargement du contenu
    contentArea.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Chargement du module ${moduleName}...</p></div>`;

    try {
        if (moduleName.includes('_dashboard')) {
            await fetchDashboardKPIs(); // Charger les KPIs avant le rendu
            // Nous n'appelons fetchAccountingData ici que si les données brutes sont nécessaires pour le graph (sinon elles sont chargées par le rapport)
            renderDashboard(contentArea, window.app.currentProfile);

        } else if (moduleName === 'financial_statements' || moduleName === 'reports_syscohada') {
            const data = await fetchAccountingData();
            // Assurez-vous d'avoir une fonction renderFinancialStatements définie
            // renderFinancialStatements(contentArea, data.report);
            contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><p class="text-xl font-bold">Module Rapports SYSCOHADA</p><p>Le rapport est chargé dans window.app.filteredData.financialReport.</p></div>`;


        } else if (moduleName === 'chart_of_accounts') { // 💡 NOUVEAU MODULE
            const data = await fetchAccountingData();
            if (data.accounts.length > 0) {
                renderChartOfAccounts(contentArea, data.accounts);
            } else {
                 contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><p class="text-xl font-bold text-danger">Plan Comptable vide. Ajoutez un compte en haut à droite.</p></div>`;
            }
        // ... Ajouter d'autres modules ici
        } else {
            contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><p class="text-xl font-bold">Module ${moduleName} en Construction</p></div>`;
        }
    } catch (error) {
        // Le message d'erreur est géré par fetchAccountingData et fetchDashboardKPIs
        console.error("Erreur lors du chargement du module:", error);
    }
}
// -----------------------------------------------------------------------------------------

// =================================================================================
// 4. INITIALISATION (Logique conservée)
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
// ... (Logique DOMContentLoaded conservée) ...
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

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
    // Auto-login de démonstration pour un test rapide (Optionnel)
    if (!IS_PROD && window.location.hash === '#dev') {
        document.getElementById('email').value = 'admin@douke.com';
        document.getElementById('password').value = 'password';
        const mockEvent = { preventDefault: () => {} };
        setTimeout(() => handleLogin(mockEvent), 500);
    }
});
// Rendre les fonctions d'action spécifiques disponibles globalement pour l'onclick
window.loadModule = loadModule;
window.switchCompany = switchCompany;
window.showAssignmentModal = showAssignmentModal;
window.showCreateUserModal = showCreateUserModal;
window.showEditUserModal = showEditUserModal;
window.generateFinancialStatements = generateFinancialStatements;
window.showDetailedReport = showDetailedReport;
window.validateEntry = validateEntry;
window.rejectEntry = rejectEntry;
window.validateAllPending = validateAllPending;
window.showCreateAccountModal = showCreateAccountModal; // 💡 NOUVEAU
window.showEditAccountModal = showEditAccountModal;     // 💡 NOUVEAU
window.deleteAccount = deleteAccount;                   // 💡 NOUVEAU
window.handleCreateAccount = handleCreateAccount;       // 💡 NOUVEAU
