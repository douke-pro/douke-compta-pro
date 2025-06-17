<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Système de Gestion Comptable SYSCOHADA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            DEFAULT: '#5D5CDE',
                            light: '#8B8AE8',
                            dark: '#4A49C4'
                        },
                        success: '#10B981',
                        warning: '#F59E0B', 
                        danger: '#EF4444',
                        info: '#3B82F6'
                    }
                }
            }
        }
    </script>
</head>

<body class="h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
    <!-- Interface de connexion -->
    <div id="loginInterface" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div class="text-center mb-8">
                <div id="appLogo" class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i class="fas fa-calculator text-2xl"></i>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Système SYSCOHADA Révisé</p>
            </div>

            <form id="loginForm" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input type="email" id="loginEmail" required 
                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
                    <input type="password" id="loginPassword" required
                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-md">
                    <i class="fas fa-sign-in-alt mr-2"></i>Se connecter
                </button>
            </form>

            <!-- Comptes de démonstration -->
            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Comptes de démonstration :</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button onclick="loginAs('admin')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                        <i class="fas fa-user-shield"></i> Admin
                    </button>
                    <button onclick="loginAs('collaborateur-senior')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                        <i class="fas fa-user-tie"></i> Senior
                    </button>
                    <button onclick="loginAs('collaborateur')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                        <i class="fas fa-user"></i> Collaborateur
                    </button>
                    <button onclick="loginAs('user')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                        <i class="fas fa-user-circle"></i> Utilisateur
                    </button>
                    <button onclick="loginAs('caissier')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors col-span-2">
                        <i class="fas fa-cash-register"></i> Caissier
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Interface principale -->
    <div id="mainApp" class="hidden min-h-screen bg-gray-100 dark:bg-gray-900">
        <!-- Barre de navigation -->
        <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div class="px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo et titre -->
                    <div class="flex items-center">
                        <button id="sidebarToggle" class="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                        <div class="flex items-center space-x-3 ml-4 lg:ml-0">
                            <div id="appLogo" class="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
                                <i class="fas fa-calculator text-sm"></i>
                            </div>
                            <div>
                                <h1 class="text-lg font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                                <p class="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">SYSCOHADA Révisé</p>
                            </div>
                        </div>
                    </div>

                    <!-- Informations utilisateur et actions -->
                    <div class="flex items-center space-x-4">
                        <!-- Sélection d'entreprise (Admin/Collaborateurs) -->
                        <div id="companySelector" class="hidden lg:block">
                            <select id="activeCompanySelect" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                                <option value="">-- Sélectionner une entreprise --</option>
                            </select>
                            <div id="selectedCompanyInfo" class="text-xs text-gray-500 dark:text-gray-400 mt-1"></div>
                        </div>

                        <!-- Profil utilisateur -->
                        <div class="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div class="text-right hidden sm:block">
                                <div id="currentUser" class="text-sm font-medium text-gray-900 dark:text-white"></div>
                                <div id="currentCompany" class="text-xs text-gray-500 dark:text-gray-400"></div>
                            </div>
                            <button onclick="confirmLogout()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <i class="fas fa-sign-out-alt text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Layout principal -->
        <div class="flex">
            <!-- Sidebar -->
            <aside id="sidebar" class="w-64 bg-white dark:bg-gray-800 shadow-lg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative h-full lg:h-auto z-30 border-r border-gray-200 dark:border-gray-700">
                <!-- Profil utilisateur dans sidebar -->
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                            <span id="userInitials"></span>
                        </div>
                        <div>
                            <div id="sidebarUserName" class="font-medium text-gray-900 dark:text-white"></div>
                            <div id="sidebarUserRole" class="text-sm text-gray-500 dark:text-gray-400"></div>
                        </div>
                    </div>
                </div>

                <!-- Menu de navigation -->
                <nav id="navigationMenu" class="mt-6 flex-1 space-y-1 px-3">
                    <!-- Contenu généré dynamiquement -->
                </nav>
            </aside>

            <!-- Contenu principal -->
            <main class="flex-1 lg:ml-0 p-6 max-w-full overflow-x-hidden">
                <div id="mainContent">
                    <!-- Contenu généré dynamiquement -->
                </div>
            </main>
        </div>
    </div>

    <!-- Container pour les modales -->
    <div id="modalContainer"></div>

    <script>
// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT INTÉGRALE
// Système de gestion comptable SYSCOHADA Révisé - VERSION COMPLÈTE CORRIGÉE
// =============================================================================

// =============================================================================
// APPLICATION STATE - ÉTAT GLOBAL DE L'APPLICATION
// =============================================================================
const app = {
    currentProfile: null,
    currentCompany: null,
    currentUser: null,
    isAuthenticated: false,
    accounts: [],
    entries: [],
    companies: [],
    users: [],
    cashRegisters: [],
    companyLogo: null,
    notifications: [],
    deadlines: [],
    statistics: {
        lastUpdate: null,
        totals: {},
        trends: {}
    }
};

// =============================================================================
// THEME MANAGEMENT - GESTION DU THÈME
// =============================================================================
const themeManager = {
    current: 'system',

    init() {
        if (localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            this.current = 'dark';
        } else if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.remove('dark');
            this.current = 'light';
        } else {
            this.current = 'system';
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (this.current === 'system') {
                if (event.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    }
};

// =============================================================================
// DATA INITIALIZATION - INITIALISATION DES DONNÉES
// =============================================================================
function initializeData() {
    // Entreprises avec restriction d'accès
    app.companies = [
        {
            id: 1,
            name: 'SARL TECH INNOVATION',
            type: 'SARL',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 07 12 34 56 78',
            address: 'Abidjan, Cocody',
            cashRegisters: 3
        },
        {
            id: 2,
            name: 'SA COMMERCE PLUS',
            type: 'SA',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 05 98 76 54 32',
            address: 'Abidjan, Plateau',
            cashRegisters: 5
        },
        {
            id: 3,
            name: 'EURL SERVICES PRO',
            type: 'EURL',
            status: 'Période d\'essai',
            system: 'Minimal',
            phone: '+225 01 23 45 67 89',
            address: 'Bouaké Centre',
            cashRegisters: 2
        }
    ];

    // Utilisateurs avec restrictions d'entreprises
    app.users = [
        {
            id: 1,
            name: 'Admin Système',
            email: 'admin@doukecompta.ci',
            role: 'Administrateur',
            profile: 'admin',
            phone: '+225 07 00 00 00 00',
            companies: [1, 2, 3], // Admin accède à toutes
            status: 'Actif'
        },
        {
            id: 2,
            name: 'Marie Kouassi',
            email: 'marie.kouassi@cabinet.com',
            role: 'Collaborateur Senior',
            profile: 'collaborateur-senior',
            phone: '+225 07 11 11 11 11',
            companies: [1, 2, 3], // Entreprises assignées
            status: 'Actif'
        },
        {
            id: 3,
            name: 'Jean Diabaté',
            email: 'jean.diabate@cabinet.com',
            role: 'Collaborateur',
            profile: 'collaborateur',
            phone: '+225 07 22 22 22 22',
            companies: [2, 3], // Entreprises assignées
            status: 'Actif'
        },
        {
            id: 4,
            name: 'Amadou Traoré',
            email: 'atraore@sarltech.ci',
            role: 'Utilisateur',
            profile: 'user',
            phone: '+225 07 33 33 33 33',
            companies: [1], // Une seule entreprise
            status: 'Actif'
        },
        {
            id: 5,
            name: 'Ibrahim Koné',
            email: 'ikone@caisse.ci',
            role: 'Caissier',
            profile: 'caissier',
            phone: '+225 07 44 44 44 44',
            companies: [2], // Une seule entreprise
            status: 'Actif'
        }
    ];

    // Écritures exemple
    app.entries = [
        {
            id: 1,
            date: '2024-12-15',
            journal: 'JV',
            piece: 'JV-2024-001-0156',
            libelle: 'Vente marchandises Client ABC',
            companyId: 1,
            lines: [
                { account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 }
            ],
            status: 'Validé',
            userId: 2
        },
        {
            id: 2,
            date: '2024-12-14',
            journal: 'JA',
            piece: 'JA-2024-001-0157',
            libelle: 'Achat marchandises Fournisseur XYZ',
            companyId: 2,
            lines: [
                { account: '601000', accountName: 'Achats de marchandises', libelle: 'Achat marchandises', debit: 850000, credit: 0 }
            ],
            status: 'En attente',
            userId: 2
        }
    ];

    console.log('✅ Données initialisées avec succès');
}

// =============================================================================
// AUTHENTICATION & USER MANAGEMENT - AUTHENTIFICATION COMPLÈTE
// =============================================================================
function loginAs(profile) {
    const credentials = {
        'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
        'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
        'user': { email: 'atraore@sarltech.ci', password: 'user123' },
        'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
        handleLogin();
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('❌ Veuillez saisir votre email et mot de passe.');
        return;
    }

    const users = {
        'admin@doukecompta.ci': {
            password: 'admin123',
            profile: 'admin',
            name: 'Admin Système',
            role: 'Administrateur',
            id: 1
        },
        'marie.kouassi@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur-senior',
            name: 'Marie Kouassi',
            role: 'Collaborateur Senior',
            id: 2
        },
        'jean.diabate@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur',
            name: 'Jean Diabaté',
            role: 'Collaborateur',
            id: 3
        },
        'atraore@sarltech.ci': {
            password: 'user123',
            profile: 'user',
            name: 'Amadou Traoré',
            role: 'Utilisateur',
            id: 4
        },
        'ikone@caisse.ci': {
            password: 'caisse123',
            profile: 'caissier',
            name: 'Ibrahim Koné',
            role: 'Caissier',
            id: 5
        }
    };

    const user = users[email];
    if (user && user.password === password) {
        app.isAuthenticated = true;
        app.currentProfile = user.profile;
        app.currentUser = {
            id: user.id,
            name: user.name,
            email: email,
            role: user.role
        };

        // Auto-sélection d'entreprise pour utilisateur et caissier
        if (user.profile === 'user') {
            app.currentCompany = '1'; // SARL TECH INNOVATION uniquement
        } else if (user.profile === 'caissier') {
            app.currentCompany = '2'; // SA COMMERCE PLUS uniquement
        }

        showMainApp();
        console.log('✅ Connexion réussie:', user.name);
    } else {
        alert('❌ Identifiants incorrects. Utilisez les comptes de démonstration.');
    }
}

function showMainApp() {
    document.getElementById('loginInterface').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initializeApp();
}

function confirmLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        logout();
    }
}

function logout() {
    showLoginInterface();
    alert('✅ Déconnexion réussie. À bientôt !');
}

function showLoginInterface() {
    document.getElementById('loginInterface').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    app.isAuthenticated = false;
    app.currentProfile = null;
    app.currentUser = null;
    app.currentCompany = null;
}

// =============================================================================
// NAVIGATION & INTERFACE MANAGEMENT - NAVIGATION COMPLÈTE
// =============================================================================
function loadNavigationMenu() {
    const menuItems = {
        admin: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord Admin', active: true },
            { id: 'users', icon: 'fas fa-users', text: 'Gestion Collaborateurs' },
            { id: 'companies', icon: 'fas fa-building', text: 'Gestion Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Paramètres' }
        ],
        'collaborateur-senior': [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        collaborateur: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        user: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Mon Entreprise', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Mes Écritures' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Mes Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Mes Rapports' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        caissier: [
            { id: 'dashboard', icon: 'fas fa-cash-register', text: 'Ma Caisse', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Opérations Caisse' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Comptes Disponibles' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'État de Caisse' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ]
    };

    const items = menuItems[app.currentProfile] || menuItems.user;
    const menuHtml = items.map(item => `
        <a href="#" onclick="navigateTo('${item.id}'); return false;" class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
            <i class="${item.icon} w-5 h-5 mr-3"></i>
            <span>${item.text}</span>
        </a>
    `).join('');

    document.getElementById('navigationMenu').innerHTML = menuHtml;
}

function navigateTo(page) {
    // Remove active class from all menu items
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active class to clicked item
    try {
        const clickedElement = event.target.closest('a');
        if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
            clickedElement.classList.add('bg-primary', 'text-white');
            clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
        }
    } catch (e) {
        // Ignore error if event is not available
    }

    console.log('🔄 Navigation vers:', page);

    // Load page content
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            if (app.currentProfile === 'admin') {
                loadUsersManagement();
            } else {
                showAccessDenied();
            }
            break;
        case 'companies':
            loadCompanies();
            break;
        case 'entries':
            loadEntries();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'caisse':
            loadCaisse();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
        default:
            console.log('⚠️ Page inconnue, chargement du dashboard');
            loadDashboard();
    }
}

function updateUserInfo() {
    const profiles = {
        'admin': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur-senior': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
        'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
    };

    const profile = profiles[app.currentProfile];

    document.getElementById('currentUser').textContent = app.currentUser.name;
    document.getElementById('currentCompany').textContent = app.currentCompany ? getCompanyName() : profile.defaultCompany;
    document.getElementById('sidebarUserName').textContent = app.currentUser.name;
    document.getElementById('sidebarUserRole').textContent = app.currentUser.role;
    
    // User initials
    const initials = app.currentUser.name.split(' ').map(n => n[0]).join('');
    document.getElementById('userInitials').textContent = initials;

    // Gestion de l'affichage du sélecteur d'entreprise
    const companySelector = document.getElementById('companySelector');
    if (companySelector) {
        companySelector.style.display = profile.showSelector ? 'block' : 'none';

        if (profile.showSelector) {
            populateCompanySelector();
        }
    }
}

function populateCompanySelector() {
    const select = document.getElementById('activeCompanySelect');
    if (select) {
        select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        // Filtrer les entreprises selon les droits d'accès
        const userCompanies = getUserCompanies(app.currentUser.id);
        const availableCompanies = app.companies.filter(company => 
            userCompanies.includes(company.id)
        );

        availableCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id == app.currentCompany) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

function getUserCompanies(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) return [];
    
    // Utilisateur et Caissier : une seule entreprise prédéfinie
    if (user.profile === 'user') return [1]; // SARL TECH INNOVATION
    if (user.profile === 'caissier') return [2]; // SA COMMERCE PLUS
    
    return user.companies || [];
}

function getCompanyName() {
    if (!app.currentCompany) return 'Aucune entreprise sélectionnée';
    const company = app.companies.find(c => c.id == app.currentCompany);
    return company ? company.name : 'Entreprise inconnue';
}

// =============================================================================
// DASHBOARD FUNCTIONS - TABLEAUX DE BORD
// =============================================================================
function loadDashboard() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Bienvenue ${app.currentUser.name} !
                </h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-user mr-1"></i>Profil: ${app.currentUser.role}
                </div>
            </div>

            <!-- Message de bienvenue personnalisé -->
            <div class="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-semibold">Interface DOUKÈ Compta Pro</h3>
                        <p class="mt-2 opacity-90">
                            ${getWelcomeMessage()}
                        </p>
                    </div>
                    <div class="text-6xl opacity-20">
                        <i class="fas ${getProfileIcon()}"></i>
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Entreprises</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${getUserCompanies(app.currentUser.id).length}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas fa-building text-primary text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Accessibles</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries.length}</p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-edit text-success text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Modules Disponibles</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${getAvailableModulesCount()}</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-cubes text-info text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Statut Système</p>
                            <p class="text-lg font-bold text-gray-900 dark:text-white">Opérationnel</p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-check-circle text-warning text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions rapides -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Actions Rapides</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${generateQuickActions()}
                </div>
            </div>

            <!-- Activités récentes -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Activités Récentes</h3>
                <div class="space-y-3">
                    ${generateRecentActivities()}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function getWelcomeMessage() {
    const messages = {
        'admin': 'Vous avez accès à tous les modules d\'administration du système. Gérez les utilisateurs, les entreprises et supervisez l\'ensemble des opérations comptables.',
        'collaborateur-senior': 'Votre profil vous permet de gérer plusieurs entreprises clientes. Vous pouvez valider les écritures et générer des rapports avancés.',
        'collaborateur': 'Vous pouvez gérer les entreprises qui vous sont assignées et effectuer les opérations comptables courantes.',
        'user': 'Bienvenue dans votre espace comptable. Gérez les écritures et consultez les rapports de votre entreprise.',
        'caissier': 'Gérez efficacement votre caisse et effectuez les opérations de recettes et dépenses en toute sécurité.'
    };
    
    return messages[app.currentProfile] || 'Bienvenue dans DOUKÈ Compta Pro.';
}

function getProfileIcon() {
    const icons = {
        'admin': 'fa-user-shield',
        'collaborateur-senior': 'fa-user-tie',
        'collaborateur': 'fa-user-cog',
        'user': 'fa-user-circle',
        'caissier': 'fa-cash-register'
    };
    
    return icons[app.currentProfile] || 'fa-user';
}

function getAvailableModulesCount() {
    const moduleCounts = {
        'admin': 8,
        'collaborateur-senior': 7,
        'collaborateur': 7,
        'user': 6,
        'caissier': 5
    };
    
    return moduleCounts[app.currentProfile] || 5;
}

function generateQuickActions() {
    const actions = {
        'admin': [
            { id: 'users', icon: 'fa-users', text: 'Gestion Utilisateurs', color: 'primary' },
            { id: 'companies', icon: 'fa-building', text: 'Gestion Entreprises', color: 'success' },
            { id: 'entries', icon: 'fa-edit', text: 'Écritures', color: 'info' },
            { id: 'reports', icon: 'fa-chart-bar', text: 'Rapports', color: 'warning' }
        ],
        'collaborateur-senior': [
            { id: 'companies', icon: 'fa-building', text: 'Mes Entreprises', color: 'primary' },
            { id: 'entries', icon: 'fa-edit', text: 'Écritures', color: 'success' },
            { id: 'reports', icon: 'fa-chart-bar', text: 'Rapports', color: 'info' },
            { id: 'caisse', icon: 'fa-cash-register', text: 'Caisses', color: 'warning' }
        ],
        'collaborateur': [
            { id: 'companies', icon: 'fa-building', text: 'Mes Entreprises', color: 'primary' },
            { id: 'entries', icon: 'fa-edit', text: 'Écritures', color: 'success' },
            { id: 'reports', icon: 'fa-chart-bar', text: 'Rapports', color: 'info' },
            { id: 'accounts', icon: 'fa-list', text: 'Plan Comptable', color: 'warning' }
        ],
        'user': [
            { id: 'entries', icon: 'fa-edit', text: 'Mes Écritures', color: 'primary' },
            { id: 'reports', icon: 'fa-chart-bar', text: 'Mes Rapports', color: 'success' },
            { id: 'accounts', icon: 'fa-list', text: 'Plan Comptable', color: 'info' },
            { id: 'caisse', icon: 'fa-cash-register', text: 'Mes Caisses', color: 'warning' }
        ],
        'caissier': [
            { id: 'entries', icon: 'fa-edit', text: 'Opérations Caisse', color: 'primary' },
            { id: 'caisse', icon: 'fa-cash-register', text: 'Ma Caisse', color: 'success' },
            { id: 'reports', icon: 'fa-print', text: 'État de Caisse', color: 'info' },
            { id: 'accounts', icon: 'fa-list', text: 'Comptes', color: 'warning' }
        ]
    };

    const userActions = actions[app.currentProfile] || actions.user;
    
    return userActions.map(action => `
        <button onclick="navigateTo('${action.id}')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <i class="fas ${action.icon} text-2xl text-${action.color} mb-2"></i>
            <div class="font-medium text-gray-900 dark:text-white text-sm">${action.text}</div>
        </button>
    `).join('');
}

function generateRecentActivities() {
    const activities = [
        { action: 'Connexion réussie', time: 'À l\'instant', icon: 'fa-sign-in-alt', color: 'success' },
        { action: 'Interface chargée', time: 'À l\'instant', icon: 'fa-desktop', color: 'info' },
        { action: 'Données synchronisées', time: 'À l\'instant', icon: 'fa-sync', color: 'primary' }
    ];

    return activities.map(activity => `
        <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div class="w-8 h-8 bg-${activity.color}/10 text-${activity.color} rounded-full flex items-center justify-center">
                <i class="fas ${activity.icon} text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm text-gray-900 dark:text-white font-medium">${activity.action}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// =============================================================================
// MODULE FUNCTIONS - FONCTIONS DES MODULES
// =============================================================================
function loadUsersManagement() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-users text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Gestion Utilisateurs</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface de gestion des collaborateurs en cours de développement...</p>
        </div>
    `;
}

function loadCompanies() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-success text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-building text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Gestion Entreprises</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface de gestion des entreprises en cours de développement...</p>
        </div>
    `;
}

function loadEntries() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-info text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-edit text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Écritures Comptables</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface de saisie des écritures en cours de développement...</p>
        </div>
    `;
}

function loadAccounts() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-list text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Plan Comptable</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface du plan comptable SYSCOHADA en cours de développement...</p>
        </div>
    `;
}

function loadCaisse() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-cash-register text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Gestion Caisses</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface de gestion des caisses en cours de développement...</p>
        </div>
    `;
}

function loadReports() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-chart-bar text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Rapports & États</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface de génération des rapports en cours de développement...</p>
        </div>
    `;
}

function loadSettings() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-gray-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-user-cog text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Module Paramètres</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Interface des paramètres utilisateur en cours de développement...</p>
        </div>
    `;
}

function showAccessDenied() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ban text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
    `;
}

// =============================================================================
// EVENT LISTENERS & INITIALIZATION
// =============================================================================
function bindEventListeners() {
    try {
        // Company selector
        setTimeout(() => {
            const companySelect = document.getElementById('activeCompanySelect');
            if (companySelect) {
                companySelect.addEventListener('change', function(e) {
                    const selectedCompanyId = e.target.value;
                    app.currentCompany = selectedCompanyId;
                    console.log('✅ Entreprise sélectionnée:', app.currentCompany);
                });
            }
        }, 100);

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('-translate-x-full');
                }
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleLogin();
            });
        }

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', function(e) {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (window.innerWidth < 1024 && sidebar && sidebarToggle && 
                !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.add('-translate-x-full');
            }
        });
        
    } catch (error) {
        console.error('Erreur bindEventListeners:', error);
    }
}

function initializeApp() {
    try {
        console.log('🔄 Initialisation de l\'application...');

        // Initialiser le thème
        themeManager.init();
        
        // Initialiser les données
        initializeData();
        
        // Charger l'interface
        loadNavigationMenu();
        updateUserInfo();
        loadDashboard();
        bindEventListeners();

        console.log('✅ DOUKÈ Compta Pro initialisé avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// =============================================================================
// APPLICATION START
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        setTimeout(() => {
            bindEventListeners();
            console.log('🚀 DOUKÈ Compta Pro - Application démarrée');
        }, 100);
    } catch (error) {
        console.error('❌ Erreur au démarrage:', error);
    }
});

// Protection globale contre les erreurs
window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale capturée:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
});

    </script>
</body>
</html>
