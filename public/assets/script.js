// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète et unifiée de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.7 - INTÉGRATION COMPLÈTE DU SYSTÈME UNIFIÉ
// =================================================================================

// =================================================================================
// 0. CONFIGURATION GLOBALE ET GESTIONNAIRES UNIFIÉS
// (La logique de connexion handleLogin/handleLogout est préservée et enrichie)
// =================================================================================

// Définition de l'URL de base de l'API Odoo (Render Backend)
const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD
    ? 'https://douke-compta-pro.onrender.com' // TODO: Remplacer par l'URL finale de votre backend
    : 'http://localhost:3000';

// État global de l'application
window.app = {
    userContext: null, // Contient { token, profile, name, accessible_companies }
    currentProfile: null,
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL', // 'NORMAL' ou 'MINIMAL'
    filteredData: { entries: [], accounts: [] }, // Données comptables du dossier actif
    companiesList: [], // Liste complète des entreprises accessibles
    UI_LOADED: false,
    // Mock pour les données utilisateur (utilisé dans handleLogin)
MOCK_USERS: [
    { email: 'admin@douke.com', profile: 'ADMIN', name: 'Admin DOUKÈ' },
    { email: 'collab@douke.com', profile: 'COLLABORATEUR', name: 'Collab Senior' },
    { email: 'user@douke.com', profile: 'USER', name: 'User Standard', total_caisses: 3, active_caisses: 2 }, // <-- AJOUTÉ
    { email: 'caisse@douke.com', profile: 'CAISSIER', name: 'Patrice Caisse', total_caisses: 1, active_caisses: 1 }, // <-- AJOUTÉ
]
};

// ------------------- GESTIONNAIRES D'INTERFACE UTILISATEUR (Adaptés à votre HTML) -------------------

const NotificationManager = {
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
    // Les fonctions de cache sont laissées minimales pour ne pas complexifier le front-end avec des dépendances non requises ici.
    get: (key) => { return null; }, 
    set: (key, data, ttl) => { /* console.log(`[CACHE] Mise en cache de ${key}`); */ },
    clearCache: () => { /* console.log('[CACHE] Cache nettoyé.'); */ }
};

// =================================================================================
// 1. SERVICES D'API & AUTHENTIFICATION (Logique de Mock Odoo)
// =================================================================================

// Cette fonction simule un appel API vers le backend Odoo/Render
async function apiFetch(endpoint, options = {}) {
    // Simuler le délai de l'API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simuler un échec si l'email ou le mot de passe est 'fail' (pour les tests)
    if (options.body && JSON.parse(options.body).email.includes('fail')) {
         throw new Error('Erreur de connexion simulée. Veuillez vérifier vos identifiants.');
    }

    // MOCK pour la connexion
    if (endpoint.startsWith('/login')) {
         const email = JSON.parse(options.body).email.toLowerCase();
         const mockUser = window.app.MOCK_USERS.find(u => email.includes(u.email.split('@')[0])) || window.app.MOCK_USERS.find(u => u.profile === 'USER');
         
         if (!mockUser) throw new Error('Identifiants non reconnus.');

         return {
            token: 'valid_jwt_token_' + Date.now(),
            name: mockUser.name,
            profile: mockUser.profile,
            accessible_companies: [
                { id: 1, name: 'Alpha Solutions SA', systeme: 'NORMAL' },
                { id: 2, name: 'Beta Consulting SARL', systeme: 'MINIMAL' },
                // Plus d'options pour l'admin
                ...(mockUser.profile === 'ADMIN' ? [{ id: 3, name: 'Gamma Holding S.A.', systeme: 'NORMAL' }] : []),
                ...(mockUser.profile === 'COLLABORATEUR' ? [{ id: 4, name: 'Delta Projet', systeme: 'MINIMAL' }] : []),
            ]
        };
    }

    return {}; 
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.innerHTML = `<div class="loading-spinner w-5 h-5 border-white"></div>`;
    submitBtn.disabled = true;

    try {
        const response = await apiFetch('/login', {
             method: 'POST',
             body: JSON.stringify({ email, password })
        });

        window.app.userContext = response;
        window.app.currentProfile = response.profile;
        window.app.companiesList = response.accessible_companies;

        if (window.app.companiesList.length > 0) {
            // Sélectionne automatiquement la première entreprise disponible
            switchCompany(window.app.companiesList[0].id, true);
        }

        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${window.app.userContext.name} (${window.app.currentProfile})!`, 3000);
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        
        renderDashboardView(); // Affiche la vue appropriée au profil

    } catch (error) {
        // Afficher le message d'erreur dans le conteneur du formulaire
        const messageEl = document.getElementById('login-message');
        messageEl.textContent = error.message.includes('Identifiants') ? error.message : "Erreur de connexion au service. Réessayez.";
        messageEl.className = 'p-4 rounded-xl text-center text-sm font-bold bg-danger/10 text-danger border border-danger';
        messageEl.classList.remove('hidden');
    } finally {
        submitBtn.innerHTML = `<span>ACCÉDER AU SYSTÈME</span><i class="fas fa-arrow-right ml-3 text-sm opacity-50"></i>`;
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    window.app.userContext = null;
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.currentCompanyName = null;
    window.app.filteredData.entries = [];
    window.app.companiesList = [];
    CacheManager.clearCache();

    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-message').classList.add('hidden'); // Cacher le message d'erreur
    
    NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}

// =================================================================================
// 2. LOGIQUE DE RENDU DU DASHBOARD ET NAVIGATION
// =================================================================================

function updateSecureUserInfo() {
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
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'], // <-- AJOUTÉ
            ['États Financiers SYSCOHADA', 'fa-balance-scale', 'financial_statements'],
            ['Journal & Grand Livre', 'fa-book-open', 'grand_livre'],
            ['Audit & Sécurité', 'fa-shield-alt', 'audit_logs'],
        ],
        'USER': [ // Pilotage Stratégique / Manager
            ['Pilotage & Synthèse', 'fa-tachometer-alt', 'user_dashboard'],
            ['Saisie et Validation', 'fa-keyboard', 'quick_entry'],
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
         if (contentArea) contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-handshake fa-4x text-info mb-4"></i><p class="text-xl font-bold">Bienvenue chez DOUKÈ PRO !</p><p>Votre espace est en cours de configuration. Contactez le support pour affecter votre première entreprise.</p></div>`;
    } else {
         loadModule(defaultModule, true);
    }
}


async function switchCompany(companyId, isInitialLoad = false) {
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
    
    await loadModule(activeModule, true);
}

// =================================================================================
// 3. LOGIQUE DE CHARGEMENT DES MODULES ET RENDU SPÉCIFIQUE
// =================================================================================

async function fetchAccountingData() {
    const companyId = window.app.currentCompanyId;
    if (!companyId) return { entries: [], accounts: [] };

    // MOCK du chargement des données
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock de données (enrichi pour les tests)
    const mockData = {
        entries: [
            { id: 101, date: '2025-10-01', journal: 'JA', compte: 411000, libelle: 'Facture Vente Alpha', debit: 500000, credit: 0, status: 'Validé' },
            { id: 102, date: '2025-10-01', journal: 'JA', compte: 701000, libelle: 'Vente Marchandises', debit: 0, credit: 500000, status: 'Validé' },
            { id: 103, date: '2025-10-02', journal: 'CA', compte: 571000, libelle: 'Encaissement Client', debit: 100000, credit: 0, status: 'Validé' },
            { id: 104, date: '2025-10-02', journal: 'CA', compte: 411000, libelle: 'Règlement Facture 101', debit: 0, credit: 100000, status: 'Validé' },
            { id: 105, date: '2025-10-03', journal: 'BQ', compte: 601000, libelle: 'Achat Fournitures', debit: 50000, credit: 0, status: 'En attente' }, // Écriture en attente
            { id: 106, date: '2025-10-03', journal: 'BQ', compte: 512000, libelle: 'Paiement Fournisseur', debit: 0, credit: 50000, status: 'En attente' }, // Écriture en attente
            { id: 107, date: '2025-10-04', journal: 'BQ', compte: 621000, libelle: 'Frais de Bureau', debit: 15000, credit: 0, status: 'Validé' },
            { id: 108, date: '2025-10-04', journal: 'BQ', compte: 512000, libelle: 'Règlement Frais', debit: 0, credit: 15000, status: 'Validé' },
        ],
        accounts: [
            { code: 411000, name: 'Clients' }, { code: 701000, name: 'Ventes de marchandises' },
            { code: 571000, name: 'Caisse' }, { code: 601000, name: 'Achats de marchandises' },
            { code: 512000, name: 'Banque' }, { code: 621000, name: 'Frais postaux et de télécommunications' },
        ]
    };
    
    return mockData;
}

async function loadModule(moduleName, forceReload = false) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-10 flex items-center justify-center"><div class="loading-spinner"></div><span class="ml-4 text-primary font-bold">Chargement du module ${moduleName}...</span></div>`;

    // 1. Mise à jour de la classe active dans le menu
    document.querySelectorAll('#role-navigation-menu button').forEach(btn => {
        const isActive = btn.dataset.module === moduleName;
        btn.dataset.active = isActive.toString();
        btn.classList.toggle('bg-primary', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow-lg', isActive);
        btn.classList.toggle('shadow-primary/30', isActive);
        btn.classList.toggle('text-gray-600', !isActive);
        btn.classList.toggle('dark:text-gray-300', !isActive);
        btn.classList.toggle('hover:bg-gray-100', !isActive);
        btn.classList.toggle('dark:hover:bg-gray-700', !isActive);
    });

    // 2. VÉRIFICATION du contexte et CHARGEMENT des données
    if (window.app.currentCompanyId) {
        // Liste des modules nécessitant des données comptables
        const requiresData = ['global_dashboard', 'user_dashboard', 'cashier_dashboard', 'collab_dashboard', 'financial_statements', 'grand_livre', 'reports_syscohada', 'entries_validation'];
        
        if (requiresData.includes(moduleName) || forceReload) {
             window.app.filteredData = await fetchAccountingData();
        }

        if (window.app.filteredData.entries.length === 0 && requiresData.includes(moduleName)) {
             contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Aucune donnée comptable trouvée pour ce dossier.</p><p>Veuillez importer des écritures pour commencer.</p></div>`;
             return;
        }
    } else {
        // Pas d'entreprise sélectionnée
        if (!['user_management', 'audit_logs', 'global_dashboard'].includes(moduleName)) { // Ces modules peuvent être consultés sans entreprise
            contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-building fa-3x text-info mb-4"></i><p class="text-xl font-bold">Veuillez sélectionner une entreprise pour accéder au module.</p></div>`;
            return;
        }
    }


    // 3. Rendu spécifique du module
    switch (moduleName) {
        case 'global_dashboard':
        case 'user_dashboard':
            renderDashboard(contentArea, window.app.currentProfile);
            break;
        case 'collab_dashboard':
            renderCollaboratorDashboard(contentArea);
            break;
        case 'cashier_dashboard':
            renderCashierDashboard(contentArea);
            break;
        case 'user_management':
            renderUserManagementModule(contentArea); // GESTION UTILISATEUR ADMIN
            break;
        case 'financial_statements':
        case 'reports_syscohada':
            renderFinancialStatementsModule(contentArea); // ÉTATS FINANCIERS SYSCOHADA (NORMAL/MINIMAL)
            break;
        case 'entries_validation':
            renderEntriesValidationModule(contentArea); // Validation des écritures pour COLLAB
            break;
        // Tous les autres modules sont rendus par défaut
        default:
            renderStubModule(contentArea, moduleName);
            break;
    }
}


// ------------------- RENDU SPÉCIFIQUE 1 : DASHBOARDS (Tous les profils) -------------------

function renderDashboard(contentArea, profile) {
    const data = window.app.filteredData.entries;
    const isNormalSystem = window.app.currentSysteme === 'NORMAL';
    // Calculs basés sur le mock data
    const totalRevenue = data.filter(e => e.compte >= 700000 && e.compte < 800000).reduce((sum, e) => sum + e.credit, 0); 
    const pendingEntries = data.filter(e => e.status === 'En attente').length; 
    const totalCash = data.filter(e => e.compte === 571000).reduce((sum, e) => sum + (e.debit - e.credit), 0) + 1000000; // Mock de solde initial

    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Tableau de Bord ${profile === 'ADMIN' ? 'Global' : 'Opérationnel'}</h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">Synthèse du dossier <strong class="text-primary">${window.app.currentCompanyName}</strong></p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-primary">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-coins mr-2"></i> Trésorerie Actuelle (512/571)</p>
                    <h3 class="text-2xl font-black text-primary mt-2">${totalCash.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-success">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-hand-holding-usd mr-2"></i> Chiffre d'Affaires YTD (7xx)</p>
                    <h3 class="text-2xl font-black text-success mt-2">${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-warning">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-check-circle mr-2"></i> Écritures à Valider</p>
                    <h3 class="text-2xl font-black ${pendingEntries > 0 ? 'text-danger' : 'text-success'} mt-2">${pendingEntries}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-chart-pie mr-2"></i> Système Comptable</p>
                    <h3 class="text-2xl font-black text-secondary mt-2">${isNormalSystem ? 'NORMAL' : 'MINIMAL'}</h3>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="mt-4 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h3 class="font-black text-lg mb-4">Évolution Mensuelle des Flux (Revenus vs Dépenses)</h3>
                    <canvas id="mainChart" height="100"></canvas>
                </div>
                <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                     <h3 class="font-black text-lg mb-4 text-warning"><i class="fas fa-bell mr-2"></i> Alertes et Tâches Prioritaires</h3>
                     <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <li><i class="fas fa-arrow-up text-success mr-2"></i> Forte croissance du CA (+12% ce mois)</li>
                        ${pendingEntries > 0 ? `<li><i class="fas fa-exclamation-circle text-danger mr-2"></i> ${pendingEntries} écritures nécessitent une validation.</li>` : `<li><i class="fas fa-check text-success mr-2"></i> Aucune écriture en attente.</li>`}
                        <li><i class="fas fa-calendar-alt text-info mr-2"></i> Date limite de clôture mensuelle (J+5).</li>
                     </ul>
                </div>
            </div>
        </div>
    `;

    // Dessin du graphique (Déchargé pour la performance)
    setTimeout(() => {
        if (typeof Chart !== 'undefined' && document.getElementById('mainChart')) {
            const ctx = document.getElementById('mainChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{ label: 'Revenus', data: [totalRevenue * 0.1, totalRevenue * 0.15, totalRevenue * 0.3, totalRevenue * 0.25, totalRevenue * 0.2, totalRevenue * 0.4], backgroundColor: 'rgba(93, 92, 222, 0.7)', borderColor: '#5D5CDE', borderWidth: 1, },
                               { label: 'Dépenses', data: [totalCash * 0.1, totalCash * 0.12, totalCash * 0.2, totalCash * 0.25, totalCash * 0.33, totalCash * 0.5], backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#EF4444', borderWidth: 1, }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }, 100);
}

function renderCollaboratorDashboard(contentArea) {
    const data = window.app.filteredData.entries;
    const pendingValidation = data.filter(e => e.status === 'En attente').length;
    const clientsCount = window.app.companiesList.length; // Nombre d'entreprises accessibles par le collaborateur
    const totalFees = 8000000; // Mock pour l'exemple

    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Portefeuille et Suivi Collaborateur</h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">Gestion de l'intégrité et de la validation des écritures pour votre portefeuille.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-info">
                    <p class="text-gray-400 text-xs font-black uppercase">Entreprises Managées</p>
                    <h3 class="text-2xl font-black text-info mt-2">${clientsCount}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-warning">
                    <p class="text-gray-400 text-xs font-black uppercase">Écritures à Valider</p>
                    <h3 class="text-2xl font-black ${pendingValidation > 0 ? 'text-danger' : 'text-success'} mt-2">${pendingValidation}</h3>
                </div>
                 <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-primary">
                    <p class="text-gray-400 text-xs font-black uppercase">Total Honoraires YTD</p>
                    <h3 class="text-2xl font-black text-primary mt-2">${totalFees.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
            </div>
            
            <div class="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 class="font-black text-xl mb-4 text-primary">Tableau de Bord de Validation</h3>
                <p class="text-gray-500 mb-4">Concentrez-vous sur les actions nécessitant votre approbation.</p>
                <button onclick="loadModule('entries_validation')" class="mt-2 px-5 py-2 bg-success text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                    <i class="fas fa-check-circle mr-2"></i> Accéder à la Validation (${pendingValidation} en attente)
                </button>
            </div>
        </div>
    `;
}

function renderCashierDashboard(contentArea) {
    const data = window.app.filteredData.entries;
    const totalCash = data.filter(e => e.compte === 571000).reduce((sum, e) => sum + (e.debit - e.credit), 0) + 10000; // Solde de Caisse Mock
    const todayTransactions = data.filter(e => e.journal === 'CA').length;
    
    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Synthèse et Opérations de Caisse</h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">Gestion des flux de trésorerie en espèces (Compte 571000).</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-success">
                    <p class="text-gray-400 text-xs font-black uppercase">Solde Actuel de Caisse</p>
                    <h3 class="text-2xl font-black text-success mt-2">${totalCash.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-primary">
                    <p class="text-gray-400 text-xs font-black uppercase">Transactions Caisse du Jour</p>
                    <h3 class="text-2xl font-black text-primary mt-2">${todayTransactions}</h3>
                </div>
                <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-danger">
                    <p class="text-gray-400 text-xs font-black uppercase">Opérations en Attente (Rapprochement)</p>
                    <h3 class="text-2xl font-black text-warning mt-2">0</h3>
                </div>
            </div>
            
            <div class="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex justify-start space-x-4">
                <h3 class="font-black text-lg mr-4">Accès Rapide:</h3>
                <button onclick="loadModule('quick_entry')" class="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors">
                    <i class="fas fa-plus-circle mr-2"></i> Nouvelle Opération
                </button>
                <button onclick="loadModule('cash_reports')" class="px-5 py-2 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/80 transition-colors">
                    <i class="fas fa-file-invoice mr-2"></i> Clôturer Caisse
                </button>
            </div>
        </div>
    `;
}

// ------------------- RENDU SPÉCIFIQUE 2 : GESTION DES UTILISATEURS (ADMIN) -------------------

function renderUserManagementModule(contentArea) {
    if (window.app.currentProfile !== 'ADMIN') {
         contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-lock fa-3x text-danger mb-4"></i><p class="text-xl font-bold text-danger">Accès Refusé</p><p>Seul un administrateur peut gérer les utilisateurs du système.</p></div>`;
         return;
    }

    // Mock des utilisateurs avec les nouveaux profils
    const mockUsers = [
        { id: 1, name: 'Jean Dupont (Admin)', email: 'jean@admin.com', profile: 'ADMIN', companies: 3, status: 'Actif' },
        { id: 2, name: 'Marie Collab', email: 'marie@collab.com', profile: 'COLLABORATEUR', companies: 2, status: 'Actif' },
        { id: 3, name: 'Patrice Caisse', email: 'patrice@caissier.com', profile: 'CAISSIER', companies: 1, status: 'Actif' },
        { id: 4, name: 'Standard User', email: 'std@user.com', profile: 'USER', companies: 1, status: 'Inactif' },
    ];

    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Gestion des Utilisateurs & Affectation des Dossiers</h2>
        <div class="space-y-8 fade-in">
            <div class="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 class="text-xl font-black">Liste des Utilisateurs (${mockUsers.length})</h3>
                <button onclick="showCreateUserModal()" class="mt-4 sm:mt-0 px-5 py-2 bg-success text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                    <i class="fas fa-user-plus mr-2"></i> Créer un Nouvel Utilisateur
                </button>
            </div>

            <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <table class="report-table w-full">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Profil</th>
                            <th>Email</th>
                            <th>Statut</th>
                            <th>Dossiers Gérés</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockUsers.map(user => `
                            <tr>
                                <td class="font-bold">${user.name}</td>
                                <td><span class="font-black text-xs p-1 rounded-md text-white ${user.profile === 'ADMIN' ? 'bg-danger' : (user.profile === 'COLLABORATEUR' ? 'bg-info' : (user.profile === 'CAISSIER' ? 'bg-secondary' : 'bg-primary'))}">${user.profile}</span></td>
                                <td>${user.email}</td>
                                <td><span class="text-xs p-1 px-2 rounded-full text-white ${user.status === 'Actif' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
                                <td>${user.companies} / ${window.app.companiesList.length}</td>
                                <td class="whitespace-nowrap">
                                    <button onclick="showAssignmentModal(${user.id}, '${user.name}')" class="text-primary hover:text-primary-dark mr-3 text-sm"><i class="fas fa-link mr-1"></i> Affecter</button>
                                    <button onclick="showEditUserModal(${user.id})" class="text-warning hover:text-orange-600 text-sm"><i class="fas fa-edit mr-1"></i> Modifier</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAssignmentModal(userId, userName) {
    const companyOptions = window.app.companiesList.map(c => `
        <label class="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <input type="checkbox" name="company" value="${c.id}" class="rounded text-primary focus:ring-primary h-5 w-5">
            <span class="font-medium text-gray-900 dark:text-gray-100">${c.name}</span>
            <span class="text-xs text-gray-500 ml-auto">(${c.systeme})</span>
        </label>
    `).join('');
    
    ModalManager.open(
        `Affecter Dossiers à ${userName}`,
        `Définir le portefeuille d'entreprises que ${userName} peut gérer.`,
        `
        <form id="assignment-form" class="space-y-6">
            <div class="space-y-3 max-h-96 overflow-y-auto p-2 border rounded-lg border-gray-200 dark:border-gray-700">${companyOptions}</div>
            <button type="submit" onclick="event.preventDefault(); NotificationManager.show('info', 'Affectation', 'Fonctionnalité d\'affectation en cours de raccordement.', 3000); ModalManager.close();" class="w-full bg-primary text-white font-black py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                <i class="fas fa-save mr-2"></i> Sauvegarder les Affectations
            </button>
        </form>
        `
    );
}

function showCreateUserModal() { NotificationManager.show('warning', 'En cours', 'Modal de création d\'utilisateur en cours de développement.'); }
function showEditUserModal() { NotificationManager.show('warning', 'En cours', 'Modal de modification d\'utilisateur en cours de développement.'); }


// ------------------- RENDU SPÉCIFIQUE 3 : ÉTATS FINANCIERS SYSCOHADA (Tous) -------------------

function renderFinancialStatementsModule(contentArea) {
    if (!window.app.currentCompanyId) {
        contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-building fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Sélectionnez d'abord une entreprise.</p></div>`;
        return;
    }
    
    const currentSystem = window.app.currentSysteme || 'NORMAL';
    
    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">États Financiers (SYSCOHADA Révisé)</h2>
        
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 fade-in">
            <h3 class="font-black text-lg mb-4">Options de Génération - Dossier : ${window.app.currentCompanyName}</h3>
            
            <div class="mb-4 max-w-sm">
                <label for="systeme-report" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Système Comptable Appliqué :</label>
                <select id="systeme-report" onchange="generateFinancialStatements()" class="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary cursor-pointer">
                    <option value="NORMAL" ${currentSystem === 'NORMAL' ? 'selected' : ''}>Système Normal (Grandes entités)</option>
                    <option value="MINIMAL" ${currentSystem === 'MINIMAL' ? 'selected' : ''}>Système Minimal de Trésorerie (Petites entités)</option>
                </select>
            </div>
            
            <button onclick="generateFinancialStatements(document.getElementById('systeme-report').value)" class="px-6 py-3 bg-primary text-white rounded-xl font-bold transition-all hover:shadow-lg hover:bg-primary-dark">
                <i class="fas fa-chart-bar mr-2"></i> Générer les Rapports
            </button>
        </div>
        
        <div id="financial-reports-area" class="mt-6 space-y-4">
             </div>
    `;
    // Lancement de la génération initiale
    generateFinancialStatements(currentSystem); 
}

function generateFinancialStatements(systeme = null) {
    const area = document.getElementById('financial-reports-area');
    if (!area) return;

    const selectedSystem = systeme || window.app.currentSysteme;
    const entriesCount = window.app.filteredData.entries.length;

    area.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto mb-4"></div><p class="text-primary font-bold">Génération en cours des états financiers SYSCOHADA (${selectedSystem})...</p></div>`;

    setTimeout(() => {
        let reportsHTML = '';
        if (selectedSystem === 'NORMAL') {
            reportsHTML += generateReportBlock('Bilan Actif/Passif', `Montant Total Actif: ${(entriesCount * 500000).toLocaleString('fr-FR')} XOF - Équilibré (conforme SYSCOHADA NORMAL).`, 'fa-file-alt', `Détail du Bilan SYSCOHADA NORMAL ${window.app.currentCompanyName}`);
            reportsHTML += generateReportBlock('Compte de Résultat (CPC)', `Résultat Net: ${(entriesCount * 50000).toLocaleString('fr-FR')} XOF. (Intégration Odoo) - Rapport complet.`, 'fa-chart-pie', `Détail du Compte de Résultat SYSCOHADA NORMAL`);
            reportsHTML += generateReportBlock('Tableau de Flux de Trésorerie', `Flux d'exploitation: Calculé. Permet l'analyse des mouvements financiers.`, 'fa-exchange-alt', `Détail du Tableau de Flux de Trésorerie`);
        } else { // MINIMAL
            reportsHTML += generateReportBlock('État des Recettes et Dépenses', `Solde de Trésorerie Final: ${(entriesCount * 100000).toLocaleString('fr-FR')} XOF. Simplifié pour les PME.`, 'fa-list-alt', `Détail de l'État Recettes/Dépenses SYSCOHADA MINIMAL`);
            reportsHTML += generateReportBlock('Bilan Minimal', `Synthèse de l'Actif et du Passif simplifié. Format allégé.`, 'fa-file-invoice-dollar', `Détail du Bilan SYSCOHADA MINIMAL`);
        }
        
        reportsHTML += generateReportBlock('Notes Annexes (NA)', `Synthèse des méthodes comptables, basée sur les règles SYSCOHADA.`, 'fa-file-medical-alt', `Notes Annexes (NA)`);

        area.innerHTML = reportsHTML;
        NotificationManager.show('success', 'Rapports Générés', `Rapports affichés pour le système ${selectedSystem}.`, 3000);
    }, 1200);
}

// ------------------- RENDU SPÉCIFIQUE 4 : VALIDATION DES ÉCRITURES (COLLABORATEUR) -------------------

function renderEntriesValidationModule(contentArea) {
    const data = window.app.filteredData.entries;
    const pendingEntries = data.filter(e => e.status === 'En attente');

    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Validation des Écritures Comptables</h2>
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Liste des écritures en attente d'approbation pour ${window.app.currentCompanyName}.</p>
        
        <div class="space-y-4 fade-in">
            ${pendingEntries.length > 0 ? `
                <div class="flex justify-between items-center p-4 bg-warning/10 border border-warning rounded-xl">
                    <p class="font-bold text-warning"><i class="fas fa-exclamation-triangle mr-2"></i> ${pendingEntries.length} écritures nécessitent votre attention.</p>
                    <button onclick="validateAllPending()" class="px-4 py-2 bg-success text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                        <i class="fas fa-check-double mr-2"></i> Valider Tout
                    </button>
                </div>
                
                <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <table class="report-table w-full">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Journal</th>
                                <th>Compte</th>
                                <th>Libellé</th>
                                <th>Débit</th>
                                <th>Crédit</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingEntries.map(e => `
                                <tr id="entry-${e.id}">
                                    <td>#${e.id}</td>
                                    <td>${e.date}</td>
                                    <td>${e.journal}</td>
                                    <td>${e.compte}</td>
                                    <td class="max-w-[200px] truncate">${e.libelle}</td>
                                    <td class="${e.debit > 0 ? 'font-bold text-danger' : 'text-gray-500'}">${e.debit.toLocaleString('fr-FR')}</td>
                                    <td class="${e.credit > 0 ? 'font-bold text-success' : 'text-gray-500'}">${e.credit.toLocaleString('fr-FR')}</td>
                                    <td class="whitespace-nowrap">
                                        <button onclick="validateEntry(${e.id})" class="text-success hover:text-green-600 mr-2 text-sm"><i class="fas fa-check mr-1"></i> Valider</button>
                                        <button onclick="rejectEntry(${e.id})" class="text-danger hover:text-red-600 text-sm"><i class="fas fa-times mr-1"></i> Rejeter</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="text-center p-20 bg-success/10 rounded-2xl border border-success/50">
                    <i class="fas fa-thumbs-up fa-4x text-success mb-4"></i>
                    <p class="text-xl font-bold text-success">Aucune écriture en attente de validation.</p>
                    <p class="text-gray-700 dark:text-gray-300">Tout votre portefeuille est à jour. Bon travail !</p>
                </div>
            `}
        </div>
    `;
}

function validateEntry(entryId) {
    document.getElementById(`entry-${entryId}`).classList.add('bg-success/20', 'animate-pulse');
    NotificationManager.show('success', 'Écriture Validée', `L'écriture #${entryId} a été approuvée.`, 3000);
    // Simulation d'une suppression (pour le mock)
    setTimeout(() => loadModule('entries_validation', true), 500);
}

function rejectEntry(entryId) {
    document.getElementById(`entry-${entryId}`).classList.add('bg-danger/20', 'animate-pulse');
    NotificationManager.show('danger', 'Écriture Rejetée', `L'écriture #${entryId} a été rejetée. Un motif sera demandé dans la version finale.`, 5000);
    // Simulation d'une suppression (pour le mock)
    setTimeout(() => loadModule('entries_validation', true), 500);
}

function validateAllPending() {
    NotificationManager.show('info', 'Validation en masse', `Validation de toutes les écritures en cours...`, 3000);
    // Simulation d'un délai de traitement et rechargement
    setTimeout(() => {
        window.app.filteredData.entries = window.app.filteredData.entries.filter(e => e.status !== 'En attente');
        loadModule('entries_validation', true);
        NotificationManager.show('success', 'Opération Complète', `Toutes les écritures ont été validées avec succès.`, 5000);
    }, 1500);
}


// ------------------- RENDU UTILITAIRES et STUBS -------------------

function generateReportBlock(title, content, icon, modalTitle) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-secondary fade-in">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold text-secondary mb-2"><i class="fas ${icon} mr-2"></i> ${title}</h3>
                    <p class="text-gray-700 dark:text-gray-300 text-sm">${content}</p>
                </div>
                <button onclick="showDetailedReport('${modalTitle}', '${title}')" class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary/10 text-gray-500 hover:text-primary transition-all">
                    <i class="fas fa-file-pdf fa-lg"></i>
                </button>
            </div>
        </div>
    `;
}

function showDetailedReport(modalTitle, reportType) {
    ModalManager.open(
        modalTitle,
        `Rapport ${reportType} - Période: Année Fiscale 2025`,
        `
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 class="text-lg font-bold text-primary dark:text-white mb-4">${reportType} (Tableau Détaillé)</h4>
            <div class="h-64 flex items-center justify-center text-center text-gray-500">
                <i class="fas fa-table fa-2x mr-2"></i>
                <p>Le tableau de données réel du rapport (Bilan, CPC) sera injecté ici depuis l'API.</p>
            </div>
        </div>
        `
    );
}

function renderStubModule(contentArea, moduleName) {
    const moduleTitles = {
        'grand_livre': 'Grand Livre Général',
        'cash_flow': 'Tableau de Flux de Trésorerie (Détail)',
        'quick_entry': 'Saisie Rapide d\'Écritures',
        'audit_logs': 'Journal d\'Audit et Sécurité',
        'cash_movements': 'Liste des Mouvements de Caisse',
        'cash_reports': 'Rapports de Clôture de Caisse',
    };
    const title = moduleTitles[moduleName] || `Module ${moduleName}`;
    contentArea.innerHTML = `
        <div class="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl space-y-4 fade-in min-h-[400px] flex flex-col items-center justify-center text-center">
            <i class="fas fa-tools fa-4x text-warning/50 mb-4"></i>
            <h1 class="text-3xl font-bold text-secondary">${title}</h1>
            <p class="text-gray-700 dark:text-gray-300 max-w-xl">Cette interface est prête. Raccordement direct à l'API Odoo pour charger le contenu dynamique (tableaux de données, formulaires de saisie, filtres) de ce module.</p>
            <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-warning font-semibold">
                ⚠️ Interface de module prête. En attente de données du Backend.
            </div>
        </div>
    `;
}

// ------------------- RENDU DES VUES COMPLÈTES (Conservées de l'index) -------------------

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('register-view').classList.add('hidden');
}

function toggleAuthView(showRegister) {
    document.getElementById('login-form-container').classList.toggle('hidden', showRegister);
    document.getElementById('register-view').classList.toggle('hidden', !showRegister);
}

// =================================================================================
// 4. ÉCOUTEURS D'ÉVÉNEMENTS ET INITIALISATION
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    
    // Écouteur de déconnexion avec modale de confirmation
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        ModalManager.open(
            'Confirmation de Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter du système DOUKÈ PRO ?',
            `
            <p class="text-gray-700 dark:text-gray-300">Vos données de session locales seront effacées. Vous devrez vous reconnecter.</p>
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="ModalManager.close()" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">Annuler</button>
                <button onclick="handleLogout(); ModalManager.close();" class="px-4 py-2 bg-danger text-white rounded-xl hover:bg-red-600 font-bold transition-colors shadow-lg shadow-danger/30">Confirmer la Déconnexion</button>
            </div>
            `
        );
    });

    document.getElementById('show-register-btn')?.addEventListener('click', () => toggleAuthView(true));
    document.getElementById('show-login-btn')?.addEventListener('click', () => toggleAuthView(false));
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        NotificationManager.show('warning', 'Enregistrement', 'Fonctionnalité d\'enregistrement non raccordée pour le moment. Utilisez les comptes de démonstration pour le login.', 8000);
    });

    renderLoginView(); // Affichage initial de la vue de connexion

    // Synchronisation du Dark/Light Mode
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
