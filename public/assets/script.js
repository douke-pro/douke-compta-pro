// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète et unifiée de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.7 - INTÉGRATION COMPLÈTE DU SYSTÈME UNIFIÉ
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
        profile: null,   // Rôle de l'utilisateur (ADMIN, COLLABORATEUR, etc.)
        name: null,      // Nom de l'utilisateur
        email: null,     // Email
    }, 
    currentProfile: null,
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL', // 'NORMAL' ou 'MINIMAL'
    filteredData: { 
        entries: [], 
        accounts: [], 
        report: null // Nouveauté pour les KPIs
    }, 
    companiesList: [], // Liste des entreprises chargées pour l'utilisateur
};

// =================================================================================
// GESTIONNAIRE DE NOTIFICATIONS (MANAGER)
// =================================================================================
const NotificationManager = {
    show: (type, title, message, duration = 5000) => {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const colors = {
            success: 'bg-success border-success/50',
            danger: 'bg-danger border-danger/50',
            warning: 'bg-warning border-warning/50',
            info: 'bg-info border-info/50',
            primary: 'bg-primary border-primary/50',
        };
        const icons = {
            success: 'fa-check-circle',
            danger: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            primary: 'fa-bell',
        };

        const notification = document.createElement('div');
        notification.className = `notification fixed right-4 bottom-4 w-80 p-4 rounded-xl text-white shadow-2xl transition-all duration-500 ease-in-out transform translate-x-full opacity-0 ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-start">
                <i class="fas ${icons[type]} mr-3 mt-1"></i>
                <div>
                    <strong class="text-lg">${title}</strong>
                    <p class="text-sm mt-1">${message}</p>
                </div>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Afficher l'alerte
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
            notification.classList.add('translate-x-0', 'opacity-100');
        }, 50);

        // Masquer l'alerte après la durée
        setTimeout(() => {
            notification.classList.remove('translate-x-0', 'opacity-100');
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    },
};

// =================================================================================
// GESTIONNAIRE DE MODALES (MANAGER)
// =================================================================================
const ModalManager = {
    open: (title, subtitle, bodyHTML) => {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="modal-overlay fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-40 transition-opacity duration-300 backdrop-blur-sm" onclick="ModalManager.close()"></div>
            <div class="modal-content fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 p-8 transition-all duration-300 scale-90 opacity-0">
                <div class="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                    <div>
                        <h2 class="text-2xl font-black text-primary dark:text-white">${title}</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${subtitle}</p>
                    </div>
                    <button onclick="ModalManager.close()" class="text-gray-400 hover:text-danger dark:text-gray-500 dark:hover:text-danger transition-colors p-2 rounded-full">
                        <i class="fas fa-times fa-lg"></i>
                    </button>
                </div>
                <div class="modal-body max-h-[70vh] overflow-y-auto pr-2">
                    ${bodyHTML}
                </div>
            </div>
        `;

        // Afficher la modale avec transition
        setTimeout(() => {
            modalContainer.querySelector('.modal-content').classList.remove('scale-90', 'opacity-0');
            modalContainer.querySelector('.modal-content').classList.add('scale-100', 'opacity-100');
        }, 50);
        
        // Cacher le scroll du body
        document.body.classList.add('overflow-hidden');
    },

    close: () => {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const modalContent = modalContainer.querySelector('.modal-content');
        
        // Masquer la modale avec transition
        if (modalContent) {
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-90', 'opacity-0');
        }

        setTimeout(() => {
            modalContainer.innerHTML = '';
            document.body.classList.remove('overflow-hidden');
        }, 300);
    },
};

// =================================================================================
// MOCK DE DONNÉES ET FONCTIONS D'UTILITÉS API
// =================================================================================

/**
 * Fonction utilitaire pour fetcher l'API.
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = window.app.userContext.token;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        // Gérer les erreurs de type 4xx ou 5xx
        const errorMessage = data.message || `Erreur ${response.status} sur ${endpoint}`;
        throw new Error(errorMessage);
    }

    return data;
}

// Mocks de données pour la démonstration
window.app.MOCK_COMPANIES = [
    { id: 101, name: 'SYSTÈME NORMAL Sarl', systeme: 'NORMAL' },
    { id: 102, name: 'MINIMAL TRESO PME', systeme: 'MINIMAL' },
    { id: 103, name: 'DOUKÈ HOLDING SA', systeme: 'NORMAL' },
];

window.app.MOCK_USERS = [
    { email: 'admin@douke.com', password: 'password', profile: 'ADMIN', name: 'Jean Dupont (Admin)', total_caisses: 3, active_caisses: 2 },
    { email: 'collab@douke.com', password: 'password', profile: 'COLLABORATEUR', name: 'Marie Collab', total_caisses: 0, active_caisses: 0 },
    { email: 'user@douke.com', password: 'password', profile: 'USER', name: 'Standard User', total_caisses: 1, active_caisses: 1 },
    { email: 'caissier@douke.com', password: 'password', profile: 'CAISSIER', name: 'Patrice Caisse', total_caisses: 2, active_caisses: 2 },
];

window.app.MOCK_ENTRIES = [
    { id: 1, date: '2025-12-01', journal: 'CA', compte: 571000, libelle: 'Vente comptant (CAISSE)', debit: 0, credit: 50000, status: 'Validé' },
    { id: 2, date: '2025-12-01', journal: 'CA', compte: 701000, libelle: 'Vente comptant (CAISSE)', debit: 50000, credit: 0, status: 'Validé' },
    { id: 3, date: '2025-12-02', journal: 'BQ', compte: 411000, libelle: 'Règlement client A', debit: 0, credit: 150000, status: 'En attente' },
    { id: 4, date: '2025-12-02', journal: 'BQ', compte: 521000, libelle: 'Règlement client A', debit: 150000, credit: 0, status: 'En attente' },
    { id: 5, date: '2025-12-03', journal: 'JA', compte: 601000, libelle: 'Achat marchandises Fourn. B', debit: 120000, credit: 0, status: 'Validé' },
    { id: 6, date: '2025-12-03', journal: 'JA', compte: 411000, libelle: 'Achat marchandises Fourn. B', debit: 0, credit: 120000, status: 'Validé' },
    { id: 7, date: '2025-12-04', journal: 'JV', compte: 611000, libelle: 'Frais de nettoyage bureau', debit: 5000, credit: 0, status: 'En attente' },
    { id: 8, date: '2025-12-04', journal: 'JV', compte: 571000, libelle: 'Frais de nettoyage bureau', debit: 0, credit: 5000, status: 'En attente' },
    { id: 9, date: '2025-12-05', journal: 'VD', compte: 701000, libelle: 'Vente de services X', debit: 0, credit: 350000, status: 'Validé' },
    { id: 10, date: '2025-12-05', journal: 'VD', compte: 411000, libelle: 'Vente de services X', debit: 350000, credit: 0, status: 'Validé' },
];


// =================================================================================
// 1. GESTION D'AUTHENTIFICATION ET DE CONTEXTE
// =================================================================================

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('login-submit-btn');
    const messageEl = document.getElementById('login-message'); 

    // Affichage de l'état de chargement
    submitBtn.innerHTML = '<div class="loading-spinner w-5 h-5 border-white"></div><span class="ml-3">Connexion en cours...</span>';
    submitBtn.disabled = true;
    messageEl.classList.add('hidden'); // Masquer les messages précédents

    try {
        // ***************************************************************
        // ***** REMPLACEMENT DE LA LOGIQUE MOCK PAR L'APPEL API RÉEL *****
        // ***************************************************************
        const response = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // Extraction des données réelles du backend (Odoo Context, Token, etc.)
        const { token, profile, name, companiesList, defaultCompany } = response.data;
        
        // 1. Mise à jour de l'état global
        window.app.userContext = { token, profile, name, email };
        window.app.currentProfile = profile;
        window.app.companiesList = companiesList;
        window.app.currentCompanyId = defaultCompany.id;
        window.app.currentCompanyName = defaultCompany.name;
        window.app.currentSysteme = defaultCompany.systeme;
        
        // 2. Chargement des données et redirection vers le dashboard
        await fetchAccountingData();
        renderAppView();
        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${name}!`, 5000);

    } catch (error) {
        // 3. Gérer les erreurs (API injoignable ou identifiants invalides)
        const errorMessage = error.message.includes('Failed to fetch') 
            ? "Erreur de connexion au service. Veuillez vérifier le statut du backend (Render)."
            : error.message || "Identifiants invalides ou erreur serveur.";

        // Afficher le message d'erreur
        messageEl.className = 'p-4 rounded-xl text-center text-sm font-bold bg-danger/10 text-danger';
        messageEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${errorMessage}`;
        messageEl.classList.remove('hidden');

        // Rétablir le bouton
        submitBtn.innerHTML = '<span>ACCÉDER AU SYSTÈME</span> <i class="fas fa-arrow-right ml-3 text-sm opacity-50"></i>';
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    // 1. Effacer l'état de l'application
    window.app.userContext = { token: null, profile: null, name: null, email: null };
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.currentCompanyName = null;
    window.app.filteredData = { entries: [], accounts: [], report: null };

    // 2. Rediriger vers la page de connexion
    renderLoginView();
    NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}

function switchCompany(companyId) {
    const newCompany = window.app.companiesList.find(c => c.id == companyId);
    if (!newCompany) {
        NotificationManager.show('danger', 'Erreur', 'Entreprise non trouvée.', 3000);
        return;
    }

    // Mise à jour de l'état
    window.app.currentCompanyId = newCompany.id;
    window.app.currentCompanyName = newCompany.name;
    window.app.currentSysteme = newCompany.systeme;

    // Affichage des informations
    document.getElementById('company-name-display').textContent = newCompany.name;
    document.getElementById('systeme-display').textContent = newCompany.systeme === 'NORMAL' ? 'NORMAL' : 'MINIMAL';
    
    // 1. Recharger les données pour la nouvelle entreprise
    fetchAccountingData().then(() => {
        // 2. Recharger le module courant pour afficher les données mises à jour
        const currentModule = document.querySelector('.sidebar-link.active')?.dataset.module || 'dashboard';
        loadModule(currentModule, true);
        NotificationManager.show('primary', 'Changement de Dossier', `Dossier basculé sur **${newCompany.name}** (${newCompany.systeme}).`, 4000);
    }).catch(error => {
        console.error("Erreur de chargement de données après switch:", error);
    });
}

// =================================================================================
// 2. RENDU DE L'INTERFACE PRINCIPALE
// =================================================================================

/**
 * Affiche la vue principale de l'application (Sidebar, Header, Content)
 */
function renderAppView() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');

    renderHeader();
    renderSidebar();
    
    // Charger le tableau de bord par défaut
    loadModule('dashboard');
}

/**
 * Rend la barre latérale avec les options de menu basées sur le profil.
 */
function renderSidebar() {
    const profile = window.app.currentProfile;
    const sidebar = document.getElementById('sidebar-menu');
    let menuHTML = '';

    // Définitions des menus par profil
    const menus = {
        ADMIN: [
            { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord Global' },
            { module: 'user_management', icon: 'fas fa-user-shield', label: 'Gestion des Utilisateurs' },
            { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
            { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre & Balances' },
            { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
            { module: 'audit_logs', icon: 'fas fa-clipboard-list', label: 'Journal d\'Audit' },
        ],
        COLLABORATEUR: [
            { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord' },
            { module: 'entries_validation', icon: 'fas fa-check-double', label: 'Validation des Écritures' },
            { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
            { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
            { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre & Balances' },
        ],
        USER: [ // Utilisateur standard
            { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord Stratégique' },
            { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
            { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
            { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre' },
        ],
        CAISSIER: [
            { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Synthèse de Caisse' },
            { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Nouvelle Opération de Caisse' },
            { module: 'cash_movements', icon: 'fas fa-exchange-alt', label: 'Mouvements de Caisse' },
            { module: 'cash_reports', icon: 'fas fa-file-invoice-dollar', label: 'Clôtures et Rapports de Caisse' },
        ],
    };

    const currentMenu = menus[profile] || menus.USER;

    menuHTML = currentMenu.map(item => `
        <li>
            <a href="#" class="sidebar-link block py-3 px-4 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20" data-module="${item.module}">
                <i class="${item.icon} w-6 mr-3"></i>
                <span class="font-medium">${item.label}</span>
            </a>
        </li>
    `).join('');

    // Rendu du menu principal
    sidebar.innerHTML = menuHTML;
    
    // Attacher les écouteurs d'événements pour le changement de module
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadModule(e.currentTarget.dataset.module);
        });
    });
}

/**
 * Charge le contenu dynamique dans la zone principale.
 */
function loadModule(moduleName, forceReload = false) {
    const contentArea = document.getElementById('dashboard-content-area');
    const profile = window.app.currentProfile;

    // Désactiver tous les liens de la barre latérale
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active', 'bg-primary', 'text-white', 'hover:bg-primary/80'));
    // Activer le lien sélectionné
    const activeLink = document.querySelector(`.sidebar-link[data-module="${moduleName}"]`);
    if (activeLink) {
        activeLink.classList.add('active', 'bg-primary', 'text-white', 'hover:bg-primary/80');
        activeLink.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-primary/10', 'dark:hover:bg-primary/20');
    }

    // Charger les données si elles sont absentes ou si un rechargement est forcé
    if (!window.app.filteredData.report || forceReload) {
        // Afficher le loader pendant le rechargement des données
        contentArea.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Synchronisation des données...</p></div>`;
        fetchAccountingData().then(() => {
            // Après le chargement, appeler le rendu spécifique
            renderSpecificModule(moduleName, contentArea, profile);
        }).catch(error => {
            console.error("Erreur critique de chargement des données:", error);
            // Le message d'erreur est géré dans fetchAccountingData
        });
        return;
    }

    // Si les données sont déjà là, charger directement le module
    renderSpecificModule(moduleName, contentArea, profile);
}

/**
 * Fonction interne pour diriger vers le rendu du module approprié.
 */
function renderSpecificModule(moduleName, contentArea, profile) {
    // Si l'entreprise n'est pas sélectionnée et ce n'est pas la gestion utilisateur, afficher un message.
    if (!window.app.currentCompanyId && moduleName !== 'user_management') {
        contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-building fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Sélectionnez d'abord un dossier comptable.</p></div>`;
        return;
    }
    
    switch (moduleName) {
        case 'dashboard':
            // Rendu spécifique au profil pour le tableau de bord
            if (profile === 'COLLABORATEUR') {
                renderCollaboratorDashboard(contentArea);
            } else if (profile === 'CAISSIER') {
                renderCashierDashboard(contentArea);
            } else {
                renderDashboard(contentArea, profile);
            }
            break;
        case 'user_management':
            renderUserManagementModule(contentArea);
            break;
        case 'financial_statements':
            renderFinancialStatementsModule(contentArea);
            break;
        case 'entries_validation':
            // Réservé aux collaborateurs
            if (profile === 'COLLABORATEUR' || profile === 'ADMIN') {
                renderEntriesValidationModule(contentArea);
            } else {
                 contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-lock fa-3x text-danger mb-4"></i><p class="text-xl font-bold text-danger">Accès Refusé</p><p>Seul un collaborateur ou un administrateur peut valider des écritures.</p></div>`;
            }
            break;
        case 'quick_entry':
            renderQuickEntryModule(contentArea);
            break;
        // Modules stubs
        case 'grand_livre':
        case 'cash_flow':
        case 'audit_logs':
        case 'cash_movements':
        case 'cash_reports':
            renderStubModule(contentArea, moduleName);
            break;
        default:
            contentArea.innerHTML = `<div class="p-8 text-center text-gray-500">Module non implémenté: ${moduleName}</div>`;
    }
}


/**
 * Rend l'en-tête de l'application (Logo, Sélecteur d'entreprise, Actions rapides).
 */
function renderHeader() {
    const header = document.getElementById('main-header');
    const profile = window.app.currentProfile;
    const companies = window.app.companiesList;
    const currentCompanyId = window.app.currentCompanyId;
    
    // Générer les options du sélecteur d'entreprise
    const companyOptionsHTML = companies.map(c => `
        <option value="${c.id}" ${c.id === currentCompanyId ? 'selected' : ''}>
            ${c.name} (${c.systeme})
        </option>
    `).join('');

    header.innerHTML = `
        <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-black text-primary dark:text-white flex-shrink-0">
                <i class="fas fa-dove mr-2"></i> DOUKÈ PRO
            </h1>
        </div>
        
        <div class="flex-1 min-w-0 mx-4 hidden md:block">
            ${currentCompanyId ? `
                <div class="flex items-center space-x-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <i class="fas fa-briefcase text-primary dark:text-white"></i>
                    <select id="company-selector" onchange="switchCompany(this.value)" class="bg-transparent text-gray-900 dark:text-white font-bold border-none p-0 focus:ring-0 w-full cursor-pointer">
                        ${companyOptionsHTML}
                    </select>
                </div>
            ` : `<span class="text-gray-500">Aucun dossier sélectionné</span>`}
        </div>

        <div id="quick-actions" class="flex items-center space-x-3">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
                <span class="font-black text-primary">${profile}</span>: ${window.app.userContext.name}
            </span>
             
            <button class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300">
                 <i class="fas fa-moon"></i>
            </button>
            
            <button id="logout-btn" class="px-4 py-2 bg-danger text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center">
                <i class="fas fa-sign-out-alt mr-2 hidden sm:inline"></i> Déconnexion
            </button>
        </div>
    `;
     // Réattacher l'écouteur de déconnexion après le rendu
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
    
     // Réattacher l'écouteur de Dark/Light Mode
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
}


// =================================================================================
// 3. LOGIQUE DE CHARGEMENT DES MODULES ET RENDU SPÉCIFIQUE
// =================================================================================

async function fetchAccountingData() {
    if (!window.app.currentCompanyId) {
        console.warn("Tentative de chargement des données sans Company ID sélectionné.");
        return { report: null, accounts: [], entries: [] };
    }
    
    // Indiquer le chargement dans l'interface
    const dashboardContent = document.getElementById('dashboard-content-area');
    if(dashboardContent) {
        dashboardContent.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Chargement des données comptables...</p></div>`;
    }

    try {
        const companyId = window.app.currentCompanyId;
        // Le système doit être 'NORMAL' ou 'SMT' (Minimal de Trésorerie)
        const systemType = window.app.currentSysteme === 'NORMAL' ? 'NORMAL' : 'SMT';
        
        // 1. Appel à la route de Rapport Financier (Fichier 6)
        // const reportEndpoint = `/api/accounting/report/${companyId}?systemType=${systemType}`;
        // const reportData = await apiFetch(reportEndpoint, { method: 'GET' });
        // MOCK de la donnée report pour la démo
        const reportData = { chiffreAffaires: 5000000, chargesExploitation: 3000000 };


        // 2. MOCK du Plan Comptable (Route de Plan Comptable manquante dans le backend)
        const accountsMock = [
            { id: 1, code: 411000, name: 'Clients' },
            { id: 2, code: 701000, name: 'Ventes de biens' },
            { id: 3, code: 601000, name: 'Achats de Marchandises' },
            { id: 4, code: 521000, name: 'Banque' },
            { id: 5, code: 571000, name: 'Caisse' },
            { id: 6, code: 611000, name: 'Services extérieurs' },
            { id: 7, code: 211000, name: 'Terrains' },
            // Ces comptes sont vitaux pour la Saisie Rapide (Quick Entry)
        ];

        // 3. Mise à jour de l'état global
        window.app.filteredData = {
            report: reportData, // Contient les KPIs réels (chiffreAffaires, chargesExploitation, etc.)
            accounts: accountsMock, // Mock temporaire
            entries: window.app.MOCK_ENTRIES, // Utilisation des mock entries
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

function renderDashboard(contentArea, profile) {
    const data = window.app.filteredData.entries;
    const isNormalSystem = window.app.currentSysteme === 'NORMAL';
    
    // --- Calculs Compta Générale (Communs à ADMIN/USER/COLLAB) ---
    const totalRevenue = data.filter(e => e.compte >= 700000 && e.compte < 800000).reduce((sum, e) => sum + e.credit, 0); 
    const pendingEntries = data.filter(e => e.status === 'En attente').length; 
    const totalCash = data.filter(e => e.compte === 571000).reduce((sum, e) => sum + (e.debit - e.credit), 0) + 1000000; 
    
    // --- Calculs Spécifiques ---
    let specificKPIs = '';
    
    if (profile === 'ADMIN') {
        // Mocks pour les stats ADMIN (basé sur le mock de user_management)
        const totalCollaborators = 3; // (Collab, User, Caissier)
        const totalCompanies = window.app.companiesList.length; // Max 3 dans le mock actuel
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
        `;
    }
    
    // --- Rendu Final ---
    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Tableau de Bord ${profile === 'ADMIN' ? 'Global' : (profile === 'USER' ? 'Stratégique' : 'Opérationnel')}</h2>
            <p class="text-lg text-gray-700 dark:text-gray-300">Synthèse du dossier <strong class="text-primary">${window.app.currentCompanyName}</strong></p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
        // J'assume que la librairie Chart.js est chargée globalement
        if (typeof Chart !== 'undefined' && document.getElementById('mainChart')) {
            const ctx = document.getElementById('mainChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{ label: 'Revenus', data: [totalRevenue * 0.1, totalRevenue * 0.15, totalRevenue * 0.3, totalRevenue * 0.25, totalRevenue * 0.2, totalRevenue * 0.4].map(v => v / 100000), backgroundColor: 'rgba(93, 92, 222, 0.7)', borderColor: '#5D5CDE', borderWidth: 1, },
                               { label: 'Dépenses', data: [totalCash * 0.1, totalCash * 0.12, totalCash * 0.2, totalCash * 0.25, totalCash * 0.33, totalCash * 0.5].map(v => v / 100000), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#EF4444', borderWidth: 1, }]
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
                <select id="systeme-report" onchange="generateFinancialStatements(this.value)" class="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary focus:border-primary cursor-pointer">
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

// =================================================================================
// RENDU SPÉCIFIQUE 5 : MODULE DE SAISIE RAPIDE (QUICK ENTRY)
// =================================================================================

// Mock des journaux disponibles
const MOCK_JOURNALS = [
    { code: 'CA', name: 'Caisse' },
    { code: 'BQ', name: 'Banque' },
    { code: 'JA', name: 'Achats' },
    { code: 'JV', name: 'Opérations Diverses' },
    { code: 'VD', name: 'Ventes' },
];

let entryLineCounter = 0; // Compteur pour les lignes d'écriture

/**
 * Génère la structure HTML du module de saisie rapide.
 */
function renderQuickEntryModule(contentArea) {
    if (!window.app.currentCompanyId) {
        contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-building fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Sélectionnez d'abord une entreprise pour enregistrer une écriture.</p></div>`;
        return;
    }

    const currentProfile = window.app.currentProfile;
    const accountOptions = window.app.filteredData.accounts || [];

    // Sélecteur d'options du plan comptable
    const getAccountOptionsHTML = (selectedCode = '') => accountOptions.map(acc => `
        <option value="${acc.code}" ${acc.code == selectedCode ? 'selected' : ''}>${acc.code} - ${acc.name}</option>
    `).join('');
    
    // Sélecteur d'options de journal
    const getJournalOptionsHTML = () => MOCK_JOURNALS.map(j => `
        <option value="${j.code}">${j.code} - ${j.name}</option>
    `).join('');

    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Saisie Rapide d'Écriture (Journal)</h2>
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Enregistrement d'une nouvelle écriture pour le dossier **${window.app.currentCompanyName}**.</p>
        
        <div class="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 fade-in">
            <form id="quick-entry-form" onsubmit="handleQuickEntrySubmit(event)">
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div>
                        <label for="entry-date" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"><i class="fas fa-calendar-alt mr-2"></i> Date de l'Opération</label>
                        <input type="date" id="entry-date" value="${new Date().toISOString().split('T')[0]}" required class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label for="entry-journal" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"><i class="fas fa-book mr-2"></i> Journal</label>
                        <select id="entry-journal" required class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white cursor-pointer">
                            ${getJournalOptionsHTML()}
                        </select>
                    </div>
                    <div>
                        <label for="entry-ref" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1"><i class="fas fa-hashtag mr-2"></i> Référence (Optionnel)</label>
                        <input type="text" id="entry-ref" placeholder="Ex: Fact. N° 2025/001" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    </div>
                </div>

                <h3 class="text-xl font-bold mb-4 text-secondary dark:text-secondary">Détail des Lignes</h3>
                
                <div id="entry-lines-container" class="space-y-4">
                    </div>
                
                <div class="flex justify-between items-center mt-6">
                    <button type="button" onclick="addEntryLine(event, '${getAccountOptionsHTML().replace(/'/g, "\\'")}')" class="px-4 py-2 bg-info text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i> Ajouter une Ligne
                    </button>

                    <div id="balance-check" class="font-black text-lg p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                        Balance : <span id="balance-amount" class="text-warning">0 XOF</span>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" id="submit-entry-btn" class="w-full py-4 bg-success text-white text-xl font-black rounded-xl hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-success/30">
                        <i class="fas fa-save mr-3"></i> Enregistrer l'Écriture
                    </button>
                </div>

            </form>
        </div>
    `;
    
    // Initialisation avec deux lignes (minimum pour la partie double)
    entryLineCounter = 0;
    // On doit passer les options HTML du compte correctement échappées si la fonction est appelée dans l'innerHTML
    const accountOptionsSafeHTML = getAccountOptionsHTML().replace(/'/g, "\\'");
    addEntryLine(null, accountOptionsSafeHTML, 411000); // Ex: Ligne Client (Débit)
    addEntryLine(null, accountOptionsSafeHTML, 701000); // Ex: Ligne Produit (Crédit)

    // Attacher les écouteurs pour le calcul de la balance
    document.getElementById('entry-lines-container').addEventListener('input', updateBalance);
    updateBalance(); // Initialiser la balance
}

/**
 * Ajoute une ligne de saisie à l'écriture.
 */
function addEntryLine(event, accountOptionsHTML, defaultAccountCode = '') {
    if (event) event.preventDefault();
    entryLineCounter++;
    const lineId = entryLineCounter;
    
    const lineHTML = `
        <div id="line-${lineId}" class="entry-line grid grid-cols-12 gap-3 items-center p-4 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div class="col-span-12 lg:col-span-3">
                <label for="compte-${lineId}" class="block text-xs font-medium text-gray-500 dark:text-gray-400">Compte (SYSCOHADA)</label>
                <select id="compte-${lineId}" name="compte" required class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                    ${accountOptionsHTML}
                </select>
            </div>
            <div class="col-span-12 lg:col-span-4">
                <label for="libelle-${lineId}" class="block text-xs font-medium text-gray-500 dark:text-gray-400">Libellé</label>
                <input type="text" id="libelle-${lineId}" name="libelle" required placeholder="Description de l'opération" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
            </div>
            <div class="col-span-6 lg:col-span-2">
                <label for="debit-${lineId}" class="block text-xs font-medium text-gray-500 dark:text-gray-400">Débit (XOF)</label>
                <input type="number" id="debit-${lineId}" name="debit" value="0" min="0" step="1" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white text-danger font-bold">
            </div>
            <div class="col-span-6 lg:col-span-2">
                <label for="credit-${lineId}" class="block text-xs font-medium text-gray-500 dark:text-gray-400">Crédit (XOF)</label>
                <input type="number" id="credit-${lineId}" name="credit" value="0" min="0" step="1" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white text-success font-bold">
            </div>
            <div class="col-span-12 lg:col-span-1 flex justify-end items-center">
                <button type="button" onclick="removeEntryLine(${lineId})" class="text-danger hover:text-red-700 transition-colors p-2 rounded-full">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    const container = document.getElementById('entry-lines-container');
    container.insertAdjacentHTML('beforeend', lineHTML);
    
    // Si un compte par défaut est spécifié, le sélectionner
    if (defaultAccountCode) {
        document.getElementById(`compte-${lineId}`).value = defaultAccountCode;
    }
}

/**
 * Supprime une ligne de saisie et met à jour la balance.
 */
function removeEntryLine(lineId) {
    document.getElementById(`line-${lineId}`)?.remove();
    updateBalance();
}

/**
 * Calcule et affiche l'écart Débit/Crédit de l'écriture en cours.
 */
function updateBalance() {
    const lines = document.querySelectorAll('.entry-line');
    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach(line => {
        const debitInput = line.querySelector('input[name="debit"]');
        const creditInput = line.querySelector('input[name="credit"]');
        
        // Assurer que les valeurs sont des nombres
        totalDebit += parseFloat(debitInput?.value || 0);
        totalCredit += parseFloat(creditInput?.value || 0);
    });

    const balance = totalDebit - totalCredit;
    const balanceEl = document.getElementById('balance-amount');
    const submitBtn = document.getElementById('submit-entry-btn');

    balanceEl.textContent = `${Math.abs(balance).toLocaleString('fr-FR')} XOF`;

    if (balance === 0 && lines.length >= 2) {
        balanceEl.classList.remove('text-warning', 'text-danger');
        balanceEl.classList.add('text-success');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle mr-3"></i> Écriture Équilibrée - Enregistrer';
    } else {
        balanceEl.classList.remove('text-success');
        if (balance !== 0) {
            balanceEl.classList.add(balance > 0 ? 'text-danger' : 'text-warning');
            submitBtn.innerHTML = `<i class="fas fa-exclamation-triangle mr-3"></i> Écart de ${balance.toLocaleString('fr-FR')} XOF`;
        } else {
             // Si la balance est 0 mais il y a moins de 2 lignes
            balanceEl.classList.add('text-warning');
            submitBtn.innerHTML = `<i class="fas fa-exclamation-triangle mr-3"></i> Minimum 2 lignes pour une écriture`;
        }
        submitBtn.disabled = true;
    }
}

/**
 * Gère la soumission du formulaire de saisie rapide.
 */
async function handleQuickEntrySubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('submit-entry-btn');
    submitBtn.innerHTML = `<div class="loading-spinner w-5 h-5 border-white"></div><span class="ml-3">Envoi en cours...</span>`;
    submitBtn.disabled = true;

    const date = document.getElementById('entry-date').value;
    const journal = document.getElementById('entry-journal').value;
    const reference = document.getElementById('entry-ref').value;
    const lines = [];

    document.querySelectorAll('.entry-line').forEach(line => {
        const compte = line.querySelector('select[name="compte"]').value;
        const libelle = line.querySelector('input[name="libelle"]').value;
        const debit = parseFloat(line.querySelector('input[name="debit"]').value || 0);
        const credit = parseFloat(line.querySelector('input[name="credit"]').value || 0);

        if (debit > 0 || credit > 0) {
            lines.push({ compte, libelle, debit, credit });
        }
    });

    const entryData = {
        companyId: window.app.currentCompanyId,
        date,
        journal,
        reference,
        lines,
        submittedBy: window.app.userContext.name,
    };
    
    try {
        // MOCK d'envoi à l'API (Remplacer par un apiFetch réel plus tard)
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        console.log("Écriture à envoyer :", entryData);
        NotificationManager.show('success', 'Écriture Enregistrée', `Écriture "${journal}/${reference || 'Saisie rapide'}" enregistrée avec succès. ${lines.length} lignes traitées.`, 5000);

        // Réinitialiser le formulaire
        document.getElementById('quick-entry-form').reset();
        document.getElementById('entry-lines-container').innerHTML = ''; // Vider les lignes
        
        // Réinitialisation avec les options du plan comptable
        const accountOptionsHTML = window.app.filteredData.accounts.map(acc => `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`).join('').replace(/'/g, "\\'");
        
        entryLineCounter = 0;
        addEntryLine(null, accountOptionsHTML, 411000); // Réinitialisation ligne 1
        addEntryLine(null, accountOptionsHTML, 701000); // Réinitialisation ligne 2
        updateBalance(); // Réinitialiser l'affichage de la balance

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Saisie', 'Échec de l\'enregistrement de l\'écriture. ' + error.message, 8000);
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-save mr-3"></i> Enregistrer l\'Écriture';
        // La désactivation sera gérée par updateBalance, sauf si une erreur se produit.
        if (document.getElementById('balance-amount').classList.contains('text-success')) {
             submitBtn.disabled = false;
        }
    }
}

function validateEntry(entryId) {
    document.getElementById(`entry-${entryId}`).classList.add('bg-success/20', 'animate-pulse');
    NotificationManager.show('success', 'Écriture Validée', `L'écriture #${entryId} a été approuvée.`, 3000);
    // Simulation d'une suppression (pour le mock)
    window.app.MOCK_ENTRIES = window.app.MOCK_ENTRIES.filter(e => e.id !== entryId);
    setTimeout(() => loadModule('entries_validation', true), 500);
}

function rejectEntry(entryId) {
    document.getElementById(`entry-${entryId}`).classList.add('bg-danger/20', 'animate-pulse');
    NotificationManager.show('danger', 'Écriture Rejetée', `L'écriture #${entryId} a été rejetée. Un motif sera demandé dans la version finale.`, 5000);
    // Simulation d'une suppression (pour le mock)
    window.app.MOCK_ENTRIES = window.app.MOCK_ENTRIES.filter(e => e.id !== entryId);
    setTimeout(() => loadModule('entries_validation', true), 500);
}

function validateAllPending() {
    NotificationManager.show('info', 'Validation en masse', `Validation de toutes les écritures en cours...`, 3000);
    // Simulation d'un délai de traitement et rechargement
    setTimeout(() => {
        // Supprimer toutes les écritures 'En attente' du mock
        window.app.MOCK_ENTRIES = window.app.MOCK_ENTRIES.filter(e => e.status !== 'En attente');
        // Mise à jour de filteredData (pour que renderEntriesValidationModule le voie)
        window.app.filteredData.entries = window.app.MOCK_ENTRIES; 

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
// 4. ÉCOUTEURS D'ÉVÉNEMENTS ET INITIALISATION (Bloc Unique et Définitif)
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. ÉCOUTEURS DE FORMULAIRES ET DÉCONNEXION
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    
    // Écouteur de déconnexion avec modale de confirmation (Logique correcte)
    // L'écouteur est maintenant géré dans renderHeader car le bouton est dynamique.

    // 2. ÉCOUTEURS DE BASCULE LOGIN/REGISTER
    document.getElementById('show-register-btn')?.addEventListener('click', () => toggleAuthView(true));
    document.getElementById('show-login-btn')?.addEventListener('click', () => toggleAuthView(false));
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        NotificationManager.show('warning', 'Enregistrement', 'Fonctionnalité d\'enregistrement non raccordée pour le moment. Utilisez les comptes de démonstration pour le login.', 8000);
    });

    // 3. AFFICHAGE INITIAL
    renderLoginView(); 

    // 4. SYNCHRONISATION ET DÉMO
    // Synchronisation du Dark/Light Mode (Logique correcte)
    // L'écouteur est maintenant géré dans renderHeader car le bouton est dynamique.

    // Auto-login de démonstration pour un test rapide (Optionnel)
    if (!IS_PROD && window.location.hash === '#dev') {
        document.getElementById('email').value = 'admin@douke.com';
        document.getElementById('password').value = 'password';
        const mockEvent = { preventDefault: () => {} };
        setTimeout(() => handleLogin(mockEvent), 500);
    }
});

// =================================================================================
// EXPORTS GLOBAUX (Placement Final)
// =================================================================================
// Rendre les fonctions d'action spécifiques disponibles globalement pour l'onclick
window.loadModule = loadModule;
window.switchCompany = switchCompany;
window.toggleAuthView = toggleAuthView; 
window.showAssignmentModal = showAssignmentModal;
window.showCreateUserModal = showCreateUserModal;
window.showEditUserModal = showEditUserModal;
window.generateFinancialStatements = generateFinancialStatements;
window.showDetailedReport = showDetailedReport;
window.validateEntry = validateEntry;
window.rejectEntry = rejectEntry;
window.validateAllPending = validateAllPending;

// Fonctions de Saisie Rapide
window.addEntryLine = addEntryLine;
window.removeEntryLine = removeEntryLine;
window.updateBalance = updateBalance;
window.handleQuickEntrySubmit = handleQuickEntrySubmit;
