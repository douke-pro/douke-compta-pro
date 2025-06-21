<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Gestionnaire Comptable Avancé</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Configuration Tailwind personnalisée -->
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#5D5CDE',
                        'primary-light': '#8B7EDE',
                        'primary-dark': '#4338CA',
                        secondary: '#64748B',
                        success: '#10B981',
                        warning: '#F59E0B',
                        danger: '#EF4444',
                        info: '#3B82F6'
                    }
                }
            }
        }
    </script>

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        
        .app-loading {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .logo-text {
            background: linear-gradient(135deg, #5D5CDE, #8B7EDE);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    </style>
</head>

<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

<!-- ============================================================================ -->
<!-- PAGE DE CONNEXION -->
<!-- ============================================================================ -->
<div id="loginPage" class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <!-- En-tête de connexion -->
        <div class="text-center">
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <i class="fas fa-calculator text-white text-2xl"></i>
                </div>
            </div>
            <h2 class="text-3xl font-bold logo-text">DOUKÈ Compta Pro</h2>
            <p class="mt-2 text-gray-600 dark:text-gray-400">Gestionnaire Comptable Professionnel</p>
        </div>

        <!-- Formulaire de connexion -->
        <form class="mt-8 space-y-6" onsubmit="handleLogin(); return false;">
            <div class="space-y-4">
                <div>
                    <label for="loginEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Adresse e-mail
                    </label>
                    <input id="loginEmail" 
                           name="email" 
                           type="email" 
                           required 
                           class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                           placeholder="Votre adresse e-mail">
                </div>
                
                <div>
                    <label for="loginPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mot de passe
                    </label>
                    <input id="loginPassword" 
                           name="password" 
                           type="password" 
                           required 
                           class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                           placeholder="Votre mot de passe">
                </div>
            </div>

            <div>
                <button type="submit" 
                        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Se connecter
                </button>
            </div>
        </form>

        <!-- Comptes de test -->
        <div class="mt-6">
            <div class="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                Comptes de démonstration disponibles :
            </div>
            <div class="grid grid-cols-1 gap-2">
                <button onclick="fillCredentials('admin')" 
                        class="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 transition-colors">
                    👑 Admin : admin@doukecompta.ci / admin123
                </button>
                <button onclick="fillCredentials('collaborateur_senior')" 
                        class="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 transition-colors">
                    🎯 Senior : marie.kouassi@cabinet.com / marie123
                </button>
                <button onclick="fillCredentials('collaborateur')" 
                        class="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 transition-colors">
                    👤 Collaborateur : jean.diabate@cabinet.com / jean123
                </button>
                <button onclick="fillCredentials('user')" 
                        class="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 transition-colors">
                    🏢 Utilisateur : atraore@sarltech.ci / amadou123
                </button>
                <button onclick="fillCredentials('caissier')" 
                        class="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded text-gray-700 dark:text-gray-300 transition-colors">
                    💰 Caissier : ikone@caisse.ci / ibrahim123
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================================ -->
<!-- INTERFACE PRINCIPALE -->
<!-- ============================================================================ -->
<div id="mainApp" style="display: none;" class="flex h-screen bg-gray-50 dark:bg-gray-900">
    
    <!-- Sidebar Navigation -->
    <div class="w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-calculator text-white"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg logo-text">DOUKÈ</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Compta Pro</p>
                </div>
            </div>
        </div>
        
        <nav id="navigationMenu" class="mt-6 space-y-1">
            <!-- Le menu sera généré dynamiquement -->
        </nav>
    </div>

    <!-- Contenu Principal -->
    <div class="flex-1 flex flex-col overflow-hidden">
        
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-6 py-4">
                <div class="flex items-center space-x-4">
                    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                        <span id="currentCompany">Tableau de Bord</span>
                    </h1>
                    <span id="selectedCompanyInfo" class="text-sm text-gray-500 dark:text-gray-400"></span>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <div id="userName" class="text-sm font-medium text-gray-900 dark:text-white">Utilisateur</div>
                        <div id="userRole" class="text-xs text-gray-500 dark:text-gray-400">Rôle</div>
                    </div>
                    <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-sm"></i>
                    </div>
                </div>
            </div>
        </header>

        <!-- Zone de contenu principal -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div class="container mx-auto px-6 py-8">
                <div id="mainContent">
                    <!-- Le contenu sera chargé dynamiquement -->
                </div>
            </div>
        </main>
    </div>
</div>

<!-- ============================================================================ -->
<!-- Scripts JavaScript -->
<!-- ============================================================================ -->

<!-- Chargement du gestionnaire unifié en premier -->
<script>
// =============================================================================
// DOUKÈ Compta Pro - Application Principale (Version Intégrée)
// Fonctionne avec UnifiedDataManager
// =============================================================================

class DoukèComptaPro {
    constructor() {
        this.version = "2.0.0";
        this.uiManager = new UIManager(this);
        this.waitForUnifiedManager();
        console.log(`🚀 DOUKÈ Compta Pro v${this.version} - En attente de UnifiedManager...`);
    }

    waitForUnifiedManager() {
        if (window.UnifiedManager) {
            console.log('✅ UnifiedManager détecté, initialisation complète...');
            this.initializeWithUnifiedManager();
        } else {
            console.log('⏳ En attente de UnifiedManager...');
            setTimeout(() => this.waitForUnifiedManager(), 100);
        }
    }

    initializeWithUnifiedManager() {
        console.log('🔗 Intégration avec UnifiedManager réussie');
        console.log('📊 Statistiques système:', window.UnifiedManager.getAppStatistics());
    }

    // Utilise l'authentification du UnifiedManager
    async authenticate(email, password) {
        try {
            console.log('🔄 Tentative d\'authentification via UnifiedManager...');
            
            if (!window.UnifiedManager) {
                throw new Error('UnifiedManager non disponible');
            }

            const result = window.UnifiedManager.authenticateUser(email, password);
            
            if (result.success) {
                console.log('✅ Authentification réussie:', result);
                
                // Synchroniser l'état local
                this.state = {
                    currentUser: result.user,
                    currentProfile: window.app.currentProfile,
                    currentCompany: window.app.currentCompanyId,
                    isAuthenticated: true
                };

                return result;
            } else {
                throw new Error(result.message || 'Échec de l\'authentification');
            }

        } catch (error) {
            console.error('❌ Erreur authentification:', error);
            throw error;
        }
    }

    getCompanyName() {
        if (!window.app?.currentCompanyId) return 'Aucune entreprise sélectionnée';
        const company = window.app.companies.find(c => c.id === window.app.currentCompanyId);
        return company ? company.name : 'Entreprise inconnue';
    }
}

// =============================================================================
// GESTIONNAIRE UI
// =============================================================================

class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeTheme();
    }

    initializeTheme() {
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    showNotification(type, message) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        alert(`${icons[type] || 'ℹ️'} ${message}`);
    }

    updateCompanySelector() {
        const selector = document.getElementById('activeCompanySelect');
        if (!selector) return;

        const companies = window.app?.companies || [];
        selector.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === window.app?.currentCompanyId) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    updateCompanyInfo() {
        const infoElement = document.getElementById('selectedCompanyInfo');
        const currentCompanyElement = document.getElementById('currentCompany');

        if (window.app?.currentCompanyId) {
            const company = window.app.companies.find(c => c.id === window.app.currentCompanyId);
            if (company) {
                if (infoElement) infoElement.innerHTML = `${company.type} • ${company.status}`;
                if (currentCompanyElement) currentCompanyElement.textContent = company.name;
            }
        } else {
            if (infoElement) infoElement.innerHTML = '';
            if (currentCompanyElement) currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
        }
    }
}

// =============================================================================
// FONCTION DE CONNEXION CORRIGÉE
// =============================================================================

async function handleLogin() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            app.uiManager.showNotification('error', 'Veuillez saisir email et mot de passe');
            return;
        }

        console.log('🔄 Tentative de connexion pour:', email);

        const result = await app.authenticate(email, password);

        if (result.success) {
            console.log('✅ Connexion réussie');
            
            // Masquer la page de connexion
            document.getElementById('loginPage').style.display = 'none';
            
            // Afficher l'interface principale
            document.getElementById('mainApp').style.display = 'block';
            
            // Initialiser l'interface principale
            initializeMainApp();
            
            app.uiManager.showNotification('success', `Bienvenue ${result.user.name} !`);
        }

    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        app.uiManager.showNotification('error', error.message);
    }
}

// =============================================================================
// FONCTIONS DE NAVIGATION ET INTERFACE
// =============================================================================

function loadNavigationMenu() {
    if (!window.app) {
        console.error('❌ window.app non défini dans loadNavigationMenu');
        return;
    }

    const menuItems = {
        admin: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord Admin', active: true },
            { id: 'users', icon: 'fas fa-users', text: 'Gestion Collaborateurs' },
            { id: 'companies', icon: 'fas fa-building', text: 'Gestion Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        'collaborateur_senior': [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        collaborateur: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        user: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Mon Entreprise', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Mes Écritures' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Mes Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Mes Rapports' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balance' },
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

    const items = menuItems[window.app.currentProfile] || menuItems.user;

    const menuHtml = items.map(item => `
        <a href="#" onclick="AppRouter.navigateTo('${item.id}'); return false;" 
           class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
            <i class="${item.icon} w-5 h-5 mr-3"></i>
            <span>${item.text}</span>
        </a>
    `).join('');

    const menuElement = document.getElementById('navigationMenu');
    if (menuElement) {
        menuElement.innerHTML = menuHtml;
    }
}

// =============================================================================
// ROUTEUR PRINCIPAL CORRIGÉ
// =============================================================================

const AppRouter = {
    navigateTo(page) {
        console.log('🔄 Navigation vers:', page);

        if (!window.app) {
            console.error('❌ window.app non défini dans navigateTo');
            alert('❌ Erreur : Application non initialisée');
            return;
        }

        // Supprimer la classe active de tous les éléments de menu
        document.querySelectorAll('#navigationMenu a').forEach(item => {
            item.classList.remove('bg-primary', 'text-white');
            item.classList.add('text-gray-700', 'dark:text-gray-300');
        });

        // Ajouter la classe active à l'élément cliqué
        try {
            const clickedElement = event.target.closest('a');
            if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
                clickedElement.classList.add('bg-primary', 'text-white');
                clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
            }
        } catch (e) {
            // Ignorer si l'événement n'est pas disponible
        }

        // Router vers la bonne fonction de chargement (CORRIGÉ)
        try {
            switch(page) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'users':
                    // Utiliser le gestionnaire unifié
                    if (window.UnifiedManager) {
                        window.UnifiedManager.loadUsersPage();
                    }
                    break;
                case 'companies':
                    if (window.UnifiedManager) {
                        window.UnifiedManager.loadCompaniesPage();
                    }
                    break;
                case 'entries':
                    if (window.UnifiedManager) {
                        window.UnifiedManager.loadEntriesPage();
                    }
                    break;
                case 'accounts':
                    this.loadAccountsPage();
                    break;
                case 'caisse':
                    this.loadCaissePage();
                    break;
                case 'reports':
                    this.loadReportsPage();
                    break;
                case 'import':
                    this.loadImportPage();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
                default:
                    console.log('⚠️ Page inconnue, chargement du tableau de bord');
                    this.loadDashboard();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la page :', error);
            alert('Erreur lors du chargement de la page : ' + page + '\nDétails : ' + error.message);
        }
    },

    loadDashboard() {
        console.log('📊 Chargement du tableau de bord pour:', window.app.currentProfile);
        
        if (!window.app || !window.app.currentProfile) {
            console.error('❌ window.app ou currentProfile non défini');
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center p-8">
                    <div class="text-red-500 text-xl mb-4">⚠️ Erreur de chargement</div>
                    <p>Données d'authentification manquantes. Veuillez vous reconnecter.</p>
                </div>
            `;
            return;
        }

        if (window.app.currentProfile === 'admin') {
            this.loadAdminDashboard();
        } else {
            this.loadStandardDashboard();
        }
    },

    loadAdminDashboard() {
        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                    <div class="text-sm text-primary font-medium">
                        <i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}
                    </div>
                </div>

                <!-- KPI Cards Admin -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.companies.filter(c => c.status === 'Actif').length}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-building text-primary text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-users text-info text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entreprises</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.companies.length}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-chart-line text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs Actifs</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.users.filter(u => u.status === 'Actif').length}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-users text-success text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sélecteur d'entreprise pour Admin -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-building mr-2 text-primary"></i>Sélection d'entreprise
                    </h3>
                    <div class="flex items-center space-x-4">
                        <select id="activeCompanySelect" onchange="AppRouter.changeCompany(this.value)" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">-- Sélectionner une entreprise --</option>
                            ${window.app.companies.map(company => `
                                <option value="${company.id}" ${company.id === window.app.currentCompanyId ? 'selected' : ''}>
                                    ${company.name} (${company.status})
                                </option>
                            `).join('')}
                        </select>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            <i class="fas fa-info-circle mr-1"></i>
                            Sélectionnez une entreprise pour accéder à ses données
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-chart-bar mr-2 text-primary"></i>Vue d'ensemble du système
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center p-4 bg-primary/10 rounded-lg">
                            <div class="text-2xl font-bold text-primary">${window.app.companies.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Entreprises gérées</div>
                        </div>
                        <div class="text-center p-4 bg-success/10 rounded-lg">
                            <div class="text-2xl font-bold text-success">${window.app.users.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs actifs</div>
                        </div>
                        <div class="text-center p-4 bg-info/10 rounded-lg">
                            <div class="text-2xl font-bold text-info">98%</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Performance globale</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Tableau de bord admin chargé');
    },

    loadStandardDashboard() {
        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${window.app.currentProfile === 'user' ? 'Mon Entreprise' : 
                          window.app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Tableau de Bord'}
                    </h2>
                    <div class="text-sm text-primary font-medium">
                        <i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mon entreprise</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">${app.getCompanyName()}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-building text-primary text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</p>
                                <p class="text-xl font-bold text-success">Actif</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-check text-success text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mon rôle</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">${window.app.currentUser.role}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-user text-info text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Accès</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">Standard</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-key text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accès rapide</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="AppRouter.navigateTo('entries')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-edit text-primary text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Mes Écritures</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Gérer les opérations</div>
                                </div>
                            </div>
                        </button>
                        <button onclick="AppRouter.navigateTo('accounts')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-list text-success text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Plan Comptable</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Consulter les comptes</div>
                                </div>
                            </div>
                        </button>
                        <button onclick="AppRouter.navigateTo('reports')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-chart-bar text-info text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Rapports</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">États financiers</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Dashboard standard chargé');
    },

    loadAccountsPage() {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <p class="text-gray-600 dark:text-gray-400">Plan comptable en cours de développement...</p>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = content;
    },

    loadCaissePage() {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Caisses</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <p class="text-gray-600 dark:text-gray-400">Module caisse en cours de développement...</p>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = content;
    },

    loadReportsPage() {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports et États Financiers</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <p class="text-gray-600 dark:text-gray-400">Module rapports en cours de développement...</p>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = content;
    },

    loadImportPage() {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <p class="text-gray-600 dark:text-gray-400">Module import en cours de développement...</p>
                </div>
            </div>
        `;
        document.getElementById('mainContent').innerHTML = content;
    },

    loadSettings() {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="flex items-center space-x-6 mb-6">
                        <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                            ${window.app.currentUser.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${window.app.currentUser.name}</h3>
                            <p class="text-gray-600 dark:text-gray-400">${window.app.currentUser.email}</p>
                            <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary">${window.app.currentUser.role}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
                            <input type="text" value="${window.app.currentUser.name}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                            <input type="email" value="${window.app.currentUser.email}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                    </div>

                    <div class="mt-6 flex justify-between">
                        <button class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Sauvegarder
                        </button>
                        <button onclick="logout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page paramètres chargée');
    },

    changeCompany(companyId) {
        if (!companyId) {
            window.app.currentCompanyId = null;
        } else {
            window.app.currentCompanyId = parseInt(companyId);
        }
        
        console.log('🏢 Entreprise sélectionnée:', companyId);
        
        // Utiliser le gestionnaire unifié pour changer d'entreprise
        if (window.UnifiedManager && companyId) {
            try {
                window.UnifiedManager.selectCompany(parseInt(companyId));
            } catch (error) {
                console.error('❌ Erreur sélection entreprise:', error);
                app.uiManager.showNotification('error', error.message);
            }
        }
        
        // Rafraîchir l'affichage
        app.uiManager.updateCompanyInfo();
        const currentPage = this.getCurrentPage();
        if (currentPage) {
            this.navigateTo(currentPage);
        }
    },

    getCurrentPage() {
        const activeMenuItem = document.querySelector('#navigationMenu a.bg-primary');
        if (activeMenuItem) {
            const onclick = activeMenuItem.getAttribute('onclick');
            const match = onclick.match(/AppRouter\.navigateTo\('(.+?)'\)/);
            return match ? match[1] : 'dashboard';
        }
        return 'dashboard';
    }
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function logout() {
    // Utiliser la déconnexion du gestionnaire unifié
    if (window.UnifiedManager) {
        window.UnifiedManager.logout();
    }

    // Réinitialiser l'état local
    if (app) {
        app.state = {
            isAuthenticated: false,
            currentUser: null,
            currentProfile: null,
            currentCompany: null
        };
    }

    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';

    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';

    console.log('👋 Déconnexion réussie');
}

function initializeMainApp() {
    try {
        console.log('🔄 Initialisation de l\'interface principale...');

        if (!window.app || !window.app.currentUser || !window.app.currentProfile) {
            console.error('❌ window.app non défini ou incomplet');
            app.uiManager.showNotification('error', 'Erreur: Données d\'authentification manquantes');
            return;
        }

        loadNavigationMenu();
        updateUserInfo();
        app.uiManager.updateCompanySelector();
        app.uiManager.updateCompanyInfo();

        setTimeout(() => {
            AppRouter.loadDashboard();
        }, 100);

        console.log('✅ Interface principale initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur initialisation interface:', error);
        app.uiManager.showNotification('error', 'Erreur lors de l\'initialisation: ' + error.message);
    }
}

function updateUserInfo() {
    if (!window.app?.currentUser) return;

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (userNameElement) userNameElement.textContent = window.app.currentUser.name;
    if (userRoleElement) userRoleElement.textContent = window.app.currentUser.role;
}

function fillCredentials(profile) {
    const credentials = {
        admin: { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur_senior': { email: 'marie.kouassi@cabinet.com', password: 'marie123' },
        collaborateur: { email: 'jean.diabate@cabinet.com', password: 'jean123' },
        user: { email: 'atraore@sarltech.ci', password: 'amadou123' },
        caissier: { email: 'ikone@caisse.ci', password: 'ibrahim123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
        console.log('✅ Identifiants pré-remplis pour le profil:', profile);
    }
}

// Instance globale de l'application
let app;

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de DOUKÈ Compta Pro...');

    try {
        app = new DoukèComptaPro();
        console.log('✅ Application principale initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

console.log('🔧 Fichier app.js principal chargé avec succès');

// Support du mode sombre automatique
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
});
</script>

<!-- Chargement du gestionnaire unifié APRÈS l'interface -->
<script src="unified-data-manager.js"></script>

</body>
</html>
