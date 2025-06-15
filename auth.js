<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Application Complète</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        // Configuration Tailwind pour le thème
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#5D5CDE',
                        'primary-600': '#4C4BC9',
                        'primary-700': '#3D3CB4'
                    }
                }
            }
        }
        
        // Détection du mode sombre
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
</head>
<body class="bg-gray-50 dark:bg-gray-900 min-h-screen">

    <!-- APPLICATION STATE -->
    <script>
        // État global de l'application
        window.app = {
            isAuthenticated: false,
            currentUser: null,
            currentProfile: null,
            currentCompany: null,
            companyLogo: null,
            companies: [
                { id: '1', name: 'SARL TECH INNOVATION', system: 'SYSCOHADA Révisé', status: 'Actif' },
                { id: '2', name: 'SA COMMERCE PLUS', system: 'SYSCOHADA Révisé', status: 'Actif' },
                { id: '3', name: 'EURL DIGITAL SERVICES', system: 'SYSCOHADA Révisé', status: 'En cours' }
            ]
        };
    </script>

    <!-- ÉCRAN DE CONNEXION -->
    <div id="loginInterface" class="min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full">
            <!-- Logo et titre -->
            <div class="text-center mb-8">
                <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-calculator text-3xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Solution de comptabilité SYSCOHADA</p>
            </div>

            <!-- Formulaire de connexion -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <form id="loginForm" class="space-y-6">
                    <div>
                        <label for="loginEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Adresse email
                        </label>
                        <input type="email" id="loginEmail" name="email" required 
                               class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                               placeholder="votre@email.com">
                        <div id="email-error" class="text-sm text-red-500 mt-1 hidden"></div>
                    </div>

                    <div>
                        <label for="loginPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mot de passe
                        </label>
                        <div class="relative">
                            <input type="password" id="loginPassword" name="password" required 
                                   class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                                   placeholder="••••••••">
                            <button type="button" id="togglePassword" 
                                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div id="password-error" class="text-sm text-red-500 mt-1 hidden"></div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input type="checkbox" id="rememberMe" name="rememberMe" 
                                   class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
                            <label for="rememberMe" class="ml-2 text-sm text-gray-900 dark:text-white">
                                Se souvenir de moi
                            </label>
                        </div>
                        <button type="button" onclick="auth.showForgotPassword()" 
                                class="text-sm text-primary hover:text-primary-700 font-medium">
                            Mot de passe oublié ?
                        </button>
                    </div>

                    <button type="submit" id="loginButton" 
                            class="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        <span id="loginButtonText">
                            <i class="fas fa-sign-in-alt mr-2"></i>Se connecter
                        </span>
                        <span id="loginButtonLoading" class="hidden">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Connexion...
                        </span>
                    </button>
                </form>

                <!-- Liens d'action -->
                <div class="mt-6 space-y-4">
                    <div class="text-center">
                        <span class="text-gray-600 dark:text-gray-400">Pas encore de compte ?</span>
                        <button onclick="auth.showRegisterForm()" 
                                class="text-primary hover:text-primary-700 font-medium ml-1">
                            S'inscrire gratuitement
                        </button>
                    </div>

                    <!-- Connexions rapides pour démonstration -->
                    <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">Connexion rapide (démonstration)</p>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <button onclick="auth.loginAs('admin')" 
                                    class="bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-md transition-colors">
                                👨‍💼 Admin
                            </button>
                            <button onclick="auth.loginAs('collaborateur-senior')" 
                                    class="bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-md transition-colors">
                                👩‍💼 Collab. Senior
                            </button>
                            <button onclick="auth.loginAs('collaborateur')" 
                                    class="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-3 rounded-md transition-colors">
                                🧑‍💼 Collaborateur
                            </button>
                            <button onclick="auth.loginAs('user')" 
                                    class="bg-orange-100 hover:bg-orange-200 text-orange-800 py-2 px-3 rounded-md transition-colors">
                                👤 Utilisateur
                            </button>
                            <button onclick="auth.loginAs('caissier')" 
                                    class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-md transition-colors col-span-2">
                                💰 Caissier
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- APPLICATION PRINCIPALE -->
    <div id="mainApp" class="hidden min-h-screen flex">
        <!-- Sidebar -->
        <div class="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
            <!-- Logo et info utilisateur -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center space-x-3 mb-4">
                    <div id="appLogo" class="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <h1 class="text-lg font-bold text-gray-900 dark:text-white">DOUKÈ Compta</h1>
                </div>
                
                <div class="text-sm">
                    <p class="font-medium text-gray-900 dark:text-white" id="sidebarUserName">Utilisateur</p>
                    <p class="text-gray-600 dark:text-gray-400" id="sidebarUserRole">Rôle</p>
                </div>
            </div>

            <!-- Menu de navigation -->
            <nav id="navigationMenu" class="mt-6">
                <!-- Menu généré dynamiquement par navigation.js -->
            </nav>

            <!-- Sélecteur d'entreprise (visible selon le profil) -->
            <div id="companySelector" class="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entreprise active
                </label>
                <select id="activeCompanySelect" 
                        class="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">-- Sélectionner --</option>
                </select>
                <div id="selectedCompanyInfo" class="text-xs text-gray-500 dark:text-gray-400 mt-1"></div>
            </div>
        </div>

        <!-- Contenu principal -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tableau de Bord</h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400" id="currentCompany">Entreprise sélectionnée</p>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <!-- Notifications -->
                        <button onclick="toggleNotificationsPanel()" 
                                class="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <i class="fas fa-bell"></i>
                            <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                        </button>
                        
                        <!-- Menu utilisateur -->
                        <div class="relative">
                            <button onclick="auth.confirmLogout()" 
                                    class="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <span id="currentUser" class="text-sm font-medium">Utilisateur</span>
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Zone de contenu principal -->
            <main class="flex-1 p-6 overflow-y-auto">
                <div id="mainContent">
                    <!-- Contenu chargé dynamiquement -->
                    <div class="flex items-center justify-center h-64">
                        <div class="text-center">
                            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                            <p class="text-gray-600 dark:text-gray-400">Chargement en cours...</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Container pour les modals -->
    <div id="modalContainer"></div>

    <!-- Panel de notifications (masqué par défaut) -->
    <div id="notificationsPanel" class="hidden fixed top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <div class="p-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">Aucune nouvelle notification</p>
        </div>
    </div>

    <!-- SCRIPTS -->
    
    <!-- Navigation.js (votre fichier existant) -->
    <script>
// =============================================================================
// DOUKÈ Compta Pro - NAVIGATION.JS
// Version: 2.1.1 - Navigation et gestion d'interface
// =============================================================================

// Fonction de navigation principale (renommée pour éviter les conflits)
function navigateToPage(page, element = null) {
    // Remove active class from all menu items
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active class to clicked item
    if (element) {
        element.classList.add('bg-primary', 'text-white');
        element.classList.remove('text-gray-700', 'dark:text-gray-300');
    } else {
        // Find the clicked element from event if available
        try {
            const clickedElement = event.target.closest('a');
            if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
                clickedElement.classList.add('bg-primary', 'text-white');
                clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
            }
        } catch (e) {
            // Ignore error if event is not available
        }
    }

    console.log('🔄 Navigation vers:', page);

    // Load page content with error handling
    try {
        switch(page) {
            case 'dashboard':
                // Le dashboard est géré par le module auth
                if (typeof auth !== 'undefined' && typeof auth.loadDashboard === 'function') {
                    auth.loadDashboard();
                } else {
                    showPlaceholder('Dashboard', 'fas fa-chart-pie', 'Tableau de bord principal');
                }
                break;
            case 'users':
                showPlaceholder('Gestion des Collaborateurs', 'fas fa-users', 'Module de gestion des collaborateurs du cabinet');
                break;
            case 'companies':
                showPlaceholder('Gestion des Entreprises', 'fas fa-building', 'Module de gestion du portefeuille d\'entreprises clientes');
                break;
            case 'entries':
                showPlaceholder('Écritures Comptables', 'fas fa-edit', 'Module de saisie et validation des écritures comptables SYSCOHADA');
                break;
            case 'accounts':
                showPlaceholder('Plan Comptable SYSCOHADA', 'fas fa-list', 'Consultation et gestion du plan comptable SYSCOHADA Révisé');
                break;
            case 'caisse':
                showPlaceholder('Gestion des Caisses', 'fas fa-cash-register', 'Module de suivi et gestion des opérations de caisse');
                break;
            case 'reports':
                showPlaceholder('Rapports & États Financiers', 'fas fa-chart-bar', 'Module de génération des états financiers et rapports comptables');
                break;
            case 'import':
                showPlaceholder('Import de Balances', 'fas fa-upload', 'Module d\'import de balances et données comptables depuis Excel ou CSV');
                break;
            case 'settings':
                showPlaceholder('Mon Profil', 'fas fa-user-cog', 'Gestion de votre profil utilisateur et paramètres de compte');
                break;
            default:
                console.log('⚠️ Page inconnue, affichage d\'un placeholder');
                showPlaceholder('Page Inconnue', 'fas fa-question-circle', 'Cette page n\'existe pas encore');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page:', error);
        showErrorMessage('Erreur lors du chargement de la page: ' + page);
        showPlaceholder('Erreur', 'fas fa-exclamation-triangle', 'Une erreur est survenue lors du chargement de cette page');
    }
}

// Fonction pour afficher un placeholder
function showPlaceholder(title, icon, description) {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${title}</h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <i class="${icon} text-4xl text-primary mb-4"></i>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
                <p class="text-gray-600 dark:text-gray-400">${description}</p>
                <div class="mt-6">
                    <button onclick="navigateToPage('dashboard')" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour au tableau de bord
                    </button>
                </div>
            </div>
        </div>
    `;
    updateMainContent(content);
}

// Helper function to update main content
function updateMainContent(content) {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
    }
}

// FONCTIONS DE GESTION D'INTERFACE SUPPLÉMENTAIRES

function updateUserInfo() {
    const profiles = {
        'admin': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur-senior': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
        'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
    };

    const profile = profiles[app.currentProfile];

    const currentUserElement = document.getElementById('currentUser');
    const currentCompanyElement = document.getElementById('currentCompany');
    const sidebarUserNameElement = document.getElementById('sidebarUserName');
    const sidebarUserRoleElement = document.getElementById('sidebarUserRole');

    if (currentUserElement) currentUserElement.textContent = app.currentUser.name;
    if (currentCompanyElement) currentCompanyElement.textContent = app.currentCompany ? getCompanyName() : profile.defaultCompany;
    if (sidebarUserNameElement) sidebarUserNameElement.textContent = app.currentUser.name;
    if (sidebarUserRoleElement) sidebarUserRoleElement.textContent = app.currentUser.role;

    // Gestion de l'affichage du sélecteur d'entreprise
    const companySelector = document.getElementById('companySelector');

    if (companySelector) {
        companySelector.style.display = profile.showSelector ? 'block' : 'none';

        // Peupler le sélecteur
        if (profile.showSelector) {
            populateCompanySelector();
        }
    }

    // Appliquer le logo s'il existe
    updateLogoGlobally();
}

function populateCompanySelector() {
    const select = document.getElementById('activeCompanySelect');
    if (select && app.companies) {
        select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        app.companies.forEach(company => {
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

function getCompanyName() {
    if (!app.currentCompany || !app.companies) return 'Aucune entreprise sélectionnée';

    const company = app.companies.find(c => c.id == app.currentCompany);
    return company ? company.name : 'Entreprise inconnue';
}

function updateSelectedCompanyInfo() {
    const company = app.companies.find(c => c.id == app.currentCompany);
    const infoElement = document.getElementById('selectedCompanyInfo');
    const currentCompanyElement = document.getElementById('currentCompany');

    if (company) {
        if (infoElement) {
            infoElement.innerHTML = `${company.system} • ${company.status}`;
        }
        if (currentCompanyElement) {
            currentCompanyElement.textContent = company.name;
        }
    } else {
        if (infoElement) {
            infoElement.innerHTML = '';
        }
        if (currentCompanyElement) {
            currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
        }
    }
}

// GESTION DU LOGO
function uploadLogo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('❌ Le fichier est trop volumineux. Taille maximum: 2 MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                app.companyLogo = e.target.result;

                // Update logo display everywhere in the application
                updateLogoGlobally();
                showSuccessMessage('✅ Logo uploadé et appliqué à toute l\'application !');
                console.log('✅ Logo uploadé');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function updateLogoGlobally() {
    if (!app.companyLogo) return;

    // Update main logo in sidebar
    const logoElement = document.getElementById('appLogo');
    if (logoElement) {
        logoElement.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
    }

    // Update all company logos
    const logoElements = document.querySelectorAll('.company-logo');
    logoElements.forEach(element => {
        if (element.classList.contains('w-20')) {
            element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-20 h-20 rounded-full object-cover shadow-lg">`;
        } else {
            element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
        }
    });

    // Update logo in settings page if visible
    const settingsLogo = document.querySelector('.w-16.h-16.bg-gray-100, .w-16.h-16.bg-gray-700');
    if (settingsLogo) {
        settingsLogo.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-full h-full object-cover rounded-lg">`;
    }
}

// NOTIFICATIONS
function toggleNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

function showNotificationSettings() {
    alert('🔔 Paramètres de notifications\n\nFonctionnalité en cours de développement.');
}

// UTILITAIRES
function showSuccessMessage(message) {
    if (typeof auth !== 'undefined' && typeof auth.showToast === 'function') {
        auth.showToast(message, 'success');
    } else {
        alert('✅ ' + message);
    }
}

function showErrorMessage(message) {
    if (typeof auth !== 'undefined' && typeof auth.showToast === 'function') {
        auth.showToast(message, 'error');
    } else {
        alert('❌ ' + message);
    }
}

// Export the function globally
window.navigateToPage = navigateToPage;

// Initialize navigation menu generation
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
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        'collaborateur-senior': [
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

    const items = menuItems[app.currentProfile] || menuItems.user;
    const menuHtml = items.map(item => `
    <a href="#" onclick="navigateToPage('${item.id}'); return false;" class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
    <i class="${item.icon} w-5 h-5 mr-3"></i>
    <span>${item.text}</span>
    </a>
    `).join('');

    const navigationMenu = document.getElementById('navigationMenu');
    if (navigationMenu) {
        navigationMenu.innerHTML = menuHtml;
    }
}

console.log('📁 Navigation.js chargé avec succès');
    </script>

    <!-- Auth.js (version optimisée) -->
    <script>
/**
 * DOUKÈ Compta Pro - Authentication Module
 * Version: 2.2.0
 * Production-ready authentication system with enhanced security and dashboard integration
 */

const auth = (function() {
    'use strict';

    // Private variables
    let sessionTimer = null;
    let loginAttempts = 0;
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    // Enhanced user database with security
    const userDatabase = {
        'admin@doukecompta.ci': {
            password: 'admin123', // In production, this would be hashed
            profile: 'admin',
            name: 'Admin Système',
            role: 'Administrateur',
            id: 1,
            permissions: ['*'], // Full access
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'marie.kouassi@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur-senior',
            name: 'Marie Kouassi',
            role: 'Collaborateur Senior',
            id: 2,
            permissions: ['companies.manage', 'entries.manage', 'reports.view'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'jean.diabate@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur',
            name: 'Jean Diabaté',
            role: 'Collaborateur',
            id: 3,
            permissions: ['entries.manage', 'reports.view'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'atraore@sarltech.ci': {
            password: 'user123',
            profile: 'user',
            name: 'Amadou Traoré',
            role: 'Utilisateur',
            id: 4,
            permissions: ['entries.create', 'reports.own'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'ikone@caisse.ci': {
            password: 'caisse123',
            profile: 'caissier',
            name: 'Ibrahim Koné',
            role: 'Caissier',
            id: 5,
            permissions: ['cash.manage'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        }
    };

    // Validation functions
    const validators = {
        email: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        password: (password) => {
            return password && password.length >= 6;
        },
        
        phone: (phone) => {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
            return phoneRegex.test(phone);
        }
    };

    // Security utilities
    const security = {
        // Simple password hashing (in production, use bcrypt or similar)
        hashPassword: (password) => {
            // This is a simple hash for demo purposes
            // In production, use proper password hashing
            return btoa(password + 'douke_salt');
        },
        
        // Check if user is locked out
        isLockedOut: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user || !user.lockedUntil) return false;
            
            const now = Date.now();
            if (now < user.lockedUntil) {
                return true;
            } else {
                // Reset lockout if time has passed
                user.lockedUntil = null;
                user.failedAttempts = 0;
                return false;
            }
        },
        
        // Record failed login attempt
        recordFailedAttempt: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user) return;
            
            user.failedAttempts = (user.failedAttempts || 0) + 1;
            
            if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockedUntil = Date.now() + LOCKOUT_DURATION;
                auth.showToast(`Compte verrouillé pour ${LOCKOUT_DURATION / 60000} minutes`, 'error');
            }
        },
        
        // Reset failed attempts on successful login
        resetFailedAttempts: (userEmail) => {
            const user = userDatabase[userEmail];
            if (user) {
                user.failedAttempts = 0;
                user.lockedUntil = null;
                user.lastLogin = new Date().toISOString();
            }
        },
        
        // Generate session token
        generateSessionToken: () => {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // Session management
    const session = {
        set: (user, rememberMe = false) => {
            try {
                const sessionData = {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        profile: user.profile,
                        permissions: user.permissions
                    },
                    token: security.generateSessionToken(),
                    expiresAt: Date.now() + SESSION_DURATION,
                    rememberMe: rememberMe
                };

                // Store session
                if (rememberMe) {
                    localStorage.setItem('douke_session', JSON.stringify(sessionData));
                } else {
                    sessionStorage.setItem('douke_session', JSON.stringify(sessionData));
                }

                // Set auto-logout timer
                auth.setSessionTimer();
                
                return sessionData;
            } catch (error) {
                console.error('Session creation error:', error);
                return null;
            }
        },
        
        get: () => {
            try {
                let sessionData = sessionStorage.getItem('douke_session');
                if (!sessionData) {
                    sessionData = localStorage.getItem('douke_session');
                }
                
                if (!sessionData) return null;
                
                const session = JSON.parse(sessionData);
                
                // Check if session is expired
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    auth.logout();
                    return null;
                }
                
                return session;
            } catch (error) {
                console.error('Session retrieval error:', error);
                auth.clearSession();
                return null;
            }
        },
        
        clear: () => {
            try {
                sessionStorage.removeItem('douke_session');
                localStorage.removeItem('douke_session');
                
                if (sessionTimer) {
                    clearTimeout(sessionTimer);
                    sessionTimer = null;
                }
            } catch (error) {
                console.error('Session clear error:', error);
            }
        },
        
        extend: () => {
            const currentSession = session.get();
            if (currentSession) {
                currentSession.expiresAt = Date.now() + SESSION_DURATION;
                
                if (currentSession.rememberMe) {
                    localStorage.setItem('douke_session', JSON.stringify(currentSession));
                } else {
                    sessionStorage.setItem('douke_session', JSON.stringify(currentSession));
                }
                
                auth.setSessionTimer();
            }
        }
    };

    // UI utilities for forms only (interface management delegated to navigation.js)
    const ui = {
        setFieldError: (fieldId, message) => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(fieldId.replace('login', '').toLowerCase() + '-error');
            
            if (field) {
                field.classList.add('border-red-500', 'focus:ring-red-500');
                field.classList.remove('border-gray-300', 'focus:ring-primary');
            }
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            }
        },
        
        clearFieldError: (fieldId) => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(fieldId.replace('login', '').toLowerCase() + '-error');
            
            if (field) {
                field.classList.remove('border-red-500', 'focus:ring-red-500');
                field.classList.add('border-gray-300', 'focus:ring-primary');
            }
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
        },
        
        clearAllErrors: () => {
            ui.clearFieldError('loginEmail');
            ui.clearFieldError('loginPassword');
        },
        
        setLoadingState: (loading) => {
            const loginButton = document.getElementById('loginButton');
            const loginButtonText = document.getElementById('loginButtonText');
            const loginButtonLoading = document.getElementById('loginButtonLoading');
            
            if (loginButton && loginButtonText && loginButtonLoading) {
                loginButton.disabled = loading;
                
                if (loading) {
                    loginButtonText.classList.add('hidden');
                    loginButtonLoading.classList.remove('hidden');
                } else {
                    loginButtonText.classList.remove('hidden');
                    loginButtonLoading.classList.add('hidden');
                }
            }
        }
    };

    // OHADA Countries data
    const ohadaCountries = [
        { code: '+229', country: 'Bénin', flag: '🇧🇯' },
        { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
        { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
        { code: '+236', country: 'Centrafrique', flag: '🇨🇫' },
        { code: '+269', country: 'Comores', flag: '🇰🇲' },
        { code: '+242', country: 'Congo', flag: '🇨🇬' },
        { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
        { code: '+241', country: 'Gabon', flag: '🇬🇦' },
        { code: '+224', country: 'Guinée', flag: '🇬🇳' },
        { code: '+245', country: 'Guinée-Bissau', flag: '🇬🇼' },
        { code: '+240', country: 'Guinée Équatoriale', flag: '🇬🇶' },
        { code: '+223', country: 'Mali', flag: '🇲🇱' },
        { code: '+227', country: 'Niger', flag: '🇳🇪' },
        { code: '+243', country: 'RD Congo', flag: '🇨🇩' },
        { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
        { code: '+235', country: 'Tchad', flag: '🇹🇩' },
        { code: '+228', country: 'Togo', flag: '🇹🇬' }
    ];

    // Dashboard data and configurations for all profiles
    const dashboardConfigs = {
        admin: {
            title: 'Tableau de Bord Administrateur',
            subtitle: 'Vue d\'ensemble de toute l\'activité du système',
            widgets: [
                { type: 'stats', title: 'Utilisateurs Actifs', value: '47', icon: 'fas fa-users', color: 'blue' },
                { type: 'stats', title: 'Entreprises Gérées', value: '23', icon: 'fas fa-building', color: 'green' },
                { type: 'stats', title: 'Écritures ce Mois', value: '1,247', icon: 'fas fa-edit', color: 'purple' },
                { type: 'stats', title: 'Revenus Générés', value: '2.4M FCFA', icon: 'fas fa-chart-line', color: 'yellow' }
            ],
            charts: [
                { type: 'line', title: 'Évolution du Chiffre d\'Affaires', data: 'monthly_revenue' },
                { type: 'pie', title: 'Répartition par Type d\'Entreprise', data: 'company_types' }
            ]
        },
        'collaborateur-senior': {
            title: 'Tableau de Bord Collaborateur Senior',
            subtitle: 'Gestion de votre portefeuille d\'entreprises',
            widgets: [
                { type: 'stats', title: 'Mes Entreprises', value: '12', icon: 'fas fa-building', color: 'blue' },
                { type: 'stats', title: 'Écritures en Attente', value: '34', icon: 'fas fa-clock', color: 'orange' },
                { type: 'stats', title: 'Validées ce Mois', value: '127', icon: 'fas fa-check-circle', color: 'green' },
                { type: 'stats', title: 'Chiffre d\'Affaires', value: '850K FCFA', icon: 'fas fa-coins', color: 'purple' }
            ],
            charts: [
                { type: 'bar', title: 'Activité par Entreprise', data: 'company_activity' },
                { type: 'doughnut', title: 'Statut des Écritures', data: 'entry_status' }
            ]
        },
        collaborateur: {
            title: 'Tableau de Bord Collaborateur',
            subtitle: 'Suivi de votre activité comptable',
            widgets: [
                { type: 'stats', title: 'Mes Entreprises', value: '8', icon: 'fas fa-building', color: 'blue' },
                { type: 'stats', title: 'Écritures en Cours', value: '23', icon: 'fas fa-edit', color: 'orange' },
                { type: 'stats', title: 'Validées Aujourd\'hui', value: '15', icon: 'fas fa-check', color: 'green' },
                { type: 'stats', title: 'Taux de Validation', value: '94%', icon: 'fas fa-percent', color: 'purple' }
            ],
            charts: [
                { type: 'line', title: 'Évolution des Validations', data: 'validation_trend' },
                { type: 'bar', title: 'Répartition par Compte', data: 'account_distribution' }
            ]
        },
        user: {
            title: 'Mon Entreprise - SARL TECH INNOVATION',
            subtitle: 'Tableau de bord de votre entreprise',
            widgets: [
                { type: 'stats', title: 'Solde de Caisse', value: '450,000 FCFA', icon: 'fas fa-cash-register', color: 'green' },
                { type: 'stats', title: 'Créances Clients', value: '1,200,000 FCFA', icon: 'fas fa-user-tie', color: 'blue' },
                { type: 'stats', title: 'Dettes Fournisseurs', value: '800,000 FCFA', icon: 'fas fa-truck', color: 'orange' },
                { type: 'stats', title: 'Résultat du Mois', value: '+125,000 FCFA', icon: 'fas fa-chart-line', color: 'purple' }
            ],
            charts: [
                { type: 'line', title: 'Évolution du Chiffre d\'Affaires', data: 'monthly_sales' },
                { type: 'pie', title: 'Répartition des Charges', data: 'expense_breakdown' }
            ]
        },
        caissier: {
            title: 'Gestion de Caisse - SA COMMERCE PLUS',
            subtitle: 'Suivi des opérations de caisse en temps réel',
            widgets: [
                { type: 'stats', title: 'Solde Actuel', value: '247,500 FCFA', icon: 'fas fa-wallet', color: 'green' },
                { type: 'stats', title: 'Encaissements Jour', value: '85,000 FCFA', icon: 'fas fa-arrow-down', color: 'blue' },
                { type: 'stats', title: 'Décaissements Jour', value: '42,000 FCFA', icon: 'fas fa-arrow-up', color: 'red' },
                { type: 'stats', title: 'Opérations Jour', value: '27', icon: 'fas fa-exchange-alt', color: 'purple' }
            ],
            charts: [
                { type: 'line', title: 'Évolution du Solde', data: 'cash_balance' },
                { type: 'bar', title: 'Opérations par Heure', data: 'hourly_operations' }
            ]
        }
    };

    // Public API
    return {
        // Initialize authentication system
        init: () => {
            try {
                // Check for existing session
                const existingSession = session.get();
                if (existingSession) {
                    auth.restoreSession(existingSession);
                }
                
                // Setup form handlers
                auth.setupFormHandlers();
                
                // Setup password toggle
                auth.setupPasswordToggle();
                
                console.log('🔐 Authentication system initialized');
            } catch (error) {
                console.error('Auth initialization error:', error);
            }
        },

        // Setup form event handlers
        setupFormHandlers: () => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', auth.handleLogin);
                
                // Real-time validation
                const emailField = document.getElementById('loginEmail');
                const passwordField = document.getElementById('loginPassword');
                
                if (emailField) {
                    emailField.addEventListener('input', () => {
                        ui.clearFieldError('loginEmail');
                    });
                    
                    emailField.addEventListener('blur', () => {
                        if (emailField.value && !validators.email(emailField.value)) {
                            ui.setFieldError('loginEmail', 'Format d\'email invalide');
                        }
                    });
                }
                
                if (passwordField) {
                    passwordField.addEventListener('input', () => {
                        ui.clearFieldError('loginPassword');
                    });
                }
            }
        },

        // Setup password visibility toggle
        setupPasswordToggle: () => {
            const toggleButton = document.getElementById('togglePassword');
            const passwordField = document.getElementById('loginPassword');
            
            if (toggleButton && passwordField) {
                toggleButton.addEventListener('click', () => {
                    const isPassword = passwordField.type === 'password';
                    passwordField.type = isPassword ? 'text' : 'password';
                    
                    const icon = toggleButton.querySelector('i');
                    if (icon) {
                        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                    }
                });
            }
        },

        // Handle login form submission
        handleLogin: async (event) => {
            event.preventDefault();
            
            ui.clearAllErrors();
            ui.setLoadingState(true);
            
            try {
                const formData = new FormData(event.target);
                const email = formData.get('email').trim().toLowerCase();
                const password = formData.get('password');
                const rememberMe = document.getElementById('rememberMe')?.checked || false;
                
                // Validate input
                if (!email || !password) {
                    if (!email) ui.setFieldError('loginEmail', 'Email requis');
                    if (!password) ui.setFieldError('loginPassword', 'Mot de passe requis');
                    return;
                }
                
                if (!validators.email(email)) {
                    ui.setFieldError('loginEmail', 'Format d\'email invalide');
                    return;
                }
                
                // Check if user is locked out
                if (security.isLockedOut(email)) {
                    ui.setFieldError('loginEmail', 'Compte temporairement verrouillé');
                    return;
                }
                
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Authenticate user
                const user = userDatabase[email];
                if (!user || user.password !== password) {
                    security.recordFailedAttempt(email);
                    ui.setFieldError('loginPassword', 'Email ou mot de passe incorrect');
                    return;
                }
                
                // Success - create session
                security.resetFailedAttempts(email);
                const sessionData = session.set(user, rememberMe);
                
                if (sessionData) {
                    // Update app state
                    app.isAuthenticated = true;
                    app.currentProfile = user.profile;
                    app.currentUser = sessionData.user;
                    
                    // Auto-select company for specific profiles
                    if (user.profile === 'user') {
                        app.currentCompany = '1';
                    } else if (user.profile === 'caissier') {
                        app.currentCompany = '2';
                    }
                    
                    // Show success and redirect
                    auth.showToast(`Bienvenue ${user.name} !`, 'success');
                    auth.showMainApp();
                    
                    console.log('✅ Login successful:', user.name);
                } else {
                    throw new Error('Session creation failed');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                auth.showToast('Erreur lors de la connexion', 'error');
            } finally {
                ui.setLoadingState(false);
            }
        },

        // Quick login with predefined credentials
        loginAs: (profile) => {
            const credentials = {
                'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
                'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
                'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
                'user': { email: 'atraore@sarltech.ci', password: 'user123' },
                'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
            };

            const cred = credentials[profile];
            if (cred) {
                const emailField = document.getElementById('loginEmail');
                const passwordField = document.getElementById('loginPassword');
                
                if (emailField && passwordField) {
                    emailField.value = cred.email;
                    passwordField.value = cred.password;
                    
                    // Trigger login
                    const loginForm = document.getElementById('loginForm');
                    if (loginForm) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        loginForm.dispatchEvent(submitEvent);
                    }
                }
            }
        },

        // Load dashboard based on user profile
        loadDashboard: () => {
            try {
                const currentSession = session.get();
                if (!currentSession) {
                    auth.showLoginInterface();
                    return;
                }

                const profile = currentSession.user.profile;
                const config = dashboardConfigs[profile];
                
                if (!config) {
                    console.error('No dashboard configuration for profile:', profile);
                    return;
                }

                const dashboardHtml = auth.generateDashboard(config, currentSession.user);
                
                // Update main content using navigation.js function if available
                if (typeof updateMainContent === 'function') {
                    updateMainContent(dashboardHtml);
                } else {
                    // Fallback if navigation.js not loaded
                    const mainContent = document.getElementById('mainContent');
                    if (mainContent) {
                        mainContent.innerHTML = dashboardHtml;
                    }
                }
                
                console.log('📊 Dashboard loaded for profile:', profile);
                
            } catch (error) {
                console.error('Dashboard loading error:', error);
                auth.showToast('Erreur lors du chargement du tableau de bord', 'error');
            }
        },

        // Generate dashboard HTML
        generateDashboard: (config, user) => {
            const statsHtml = config.widgets.map(widget => `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${widget.title}</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${widget.value}</p>
                        </div>
                        <div class="bg-${widget.color}-100 dark:bg-${widget.color}-900 p-3 rounded-full">
                            <i class="${widget.icon} text-${widget.color}-600 dark:text-${widget.color}-300 text-xl"></i>
                        </div>
                    </div>
                </div>
            `).join('');

            const chartsHtml = config.charts ? config.charts.map(chart => `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${chart.title}</h3>
                    <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div class="text-center">
                            <i class="fas fa-chart-${chart.type} text-4xl mb-2"></i>
                            <p>Graphique ${chart.type} - ${chart.data}</p>
                            <p class="text-sm">Intégration Chart.js en cours</p>
                        </div>
                    </div>
                </div>
            `).join('') : '';

            return `
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-2xl font-bold">${config.title}</h1>
                                <p class="text-blue-100 mt-1">${config.subtitle}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-blue-100">Connecté en tant que</p>
                                <p class="font-semibold">${user.name}</p>
                                <p class="text-sm text-blue-200">${user.role}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${statsHtml}
                    </div>

                    <!-- Charts -->
                    ${chartsHtml ? `
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            ${chartsHtml}
                        </div>
                    ` : ''}

                    <!-- Quick Actions -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions Rapides</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${auth.generateQuickActions(user.profile)}
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
                        <div class="space-y-3">
                            ${auth.generateRecentActivity(user.profile)}
                        </div>
                    </div>
                </div>
            `;
        },

        // Generate quick actions based on profile
        generateQuickActions: (profile) => {
            const actions = {
                admin: [
                    { icon: 'fas fa-user-plus', text: 'Ajouter Collaborateur', action: 'navigateToPage("users")' },
                    { icon: 'fas fa-building', text: 'Nouvelle Entreprise', action: 'navigateToPage("companies")' },
                    { icon: 'fas fa-chart-bar', text: 'Voir Rapports', action: 'navigateToPage("reports")' },
                    { icon: 'fas fa-cog', text: 'Paramètres', action: 'navigateToPage("settings")' }
                ],
                'collaborateur-senior': [
                    { icon: 'fas fa-edit', text: 'Nouvelle Écriture', action: 'navigateToPage("entries")' },
                    { icon: 'fas fa-building', text: 'Mes Entreprises', action: 'navigateToPage("companies")' },
                    { icon: 'fas fa-upload', text: 'Importer Balance', action: 'navigateToPage("import")' },
                    { icon: 'fas fa-chart-bar', text: 'Générer Rapport', action: 'navigateToPage("reports")' }
                ],
                collaborateur: [
                    { icon: 'fas fa-edit', text: 'Saisir Écriture', action: 'navigateToPage("entries")' },
                    { icon: 'fas fa-list', text: 'Plan Comptable', action: 'navigateToPage("accounts")' },
                    { icon: 'fas fa-check', text: 'Valider Écritures', action: 'navigateToPage("entries")' },
                    { icon: 'fas fa-chart-line', text: 'Mes Rapports', action: 'navigateToPage("reports")' }
                ],
                user: [
                    { icon: 'fas fa-plus', text: 'Nouvelle Écriture', action: 'navigateToPage("entries")' },
                    { icon: 'fas fa-cash-register', text: 'Gérer Caisse', action: 'navigateToPage("caisse")' },
                    { icon: 'fas fa-chart-bar', text: 'Mes Rapports', action: 'navigateToPage("reports")' },
                    { icon: 'fas fa-upload', text: 'Importer Données', action: 'navigateToPage("import")' }
                ],
                caissier: [
                    { icon: 'fas fa-plus', text: 'Nouvelle Opération', action: 'navigateToPage("entries")' },
                    { icon: 'fas fa-print', text: 'Imprimer État', action: 'navigateToPage("reports")' },
                    { icon: 'fas fa-calculator', text: 'Calculatrice', action: 'alert("Calculatrice intégrée")' },
                    { icon: 'fas fa-history', text: 'Historique', action: 'navigateToPage("entries")' }
                ]
            };

            const profileActions = actions[profile] || actions.user;
            
            return profileActions.map(action => `
                <button onclick="${action.action}" class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <i class="${action.icon} text-2xl text-blue-600 dark:text-blue-400 mb-2"></i>
                    <span class="text-sm text-gray-700 dark:text-gray-300 text-center">${action.text}</span>
                </button>
            `).join('');
        },

        // Generate recent activity
        generateRecentActivity: (profile) => {
            const activities = {
                admin: [
                    { icon: 'fas fa-user-check', text: 'Marie Kouassi a validé 15 écritures', time: 'Il y a 2h' },
                    { icon: 'fas fa-building', text: 'Nouvelle entreprise ajoutée: SARL DIGITAL', time: 'Il y a 4h' },
                    { icon: 'fas fa-chart-bar', text: 'Rapport mensuel généré pour 5 entreprises', time: 'Il y a 6h' }
                ],
                'collaborateur-senior': [
                    { icon: 'fas fa-check', text: 'Validation de 12 écritures pour SARL TECH', time: 'Il y a 1h' },
                    { icon: 'fas fa-upload', text: 'Import de balance pour SA COMMERCE', time: 'Il y a 3h' },
                    { icon: 'fas fa-edit', text: 'Saisie de 8 nouvelles écritures', time: 'Il y a 5h' }
                ],
                collaborateur: [
                    { icon: 'fas fa-edit', text: 'Saisie de 6 écritures comptables', time: 'Il y a 30min' },
                    { icon: 'fas fa-check', text: '15 écritures validées', time: 'Il y a 2h' },
                    { icon: 'fas fa-list', text: 'Consultation du plan comptable', time: 'Il y a 4h' }
                ],
                user: [
                    { icon: 'fas fa-cash-register', text: 'Opération de caisse: +50,000 FCFA', time: 'Il y a 15min' },
                    { icon: 'fas fa-edit', text: 'Nouvelle facture client enregistrée', time: 'Il y a 1h' },
                    { icon: 'fas fa-chart-bar', text: 'Consultation du rapport mensuel', time: 'Il y a 3h' }
                ],
                caissier: [
                    { icon: 'fas fa-money-bill', text: 'Encaissement: 25,000 FCFA', time: 'Il y a 5min' },
                    { icon: 'fas fa-exchange-alt', text: 'Décaissement: 15,000 FCFA', time: 'Il y a 20min' },
                    { icon: 'fas fa-print', text: 'État de caisse imprimé', time: 'Il y a 1h' }
                ]
            };

            const profileActivities = activities[profile] || activities.user;
            
            return profileActivities.map(activity => `
                <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <i class="${activity.icon} text-blue-600 dark:text-blue-300"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm text-gray-900 dark:text-white">${activity.text}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${activity.time}</p>
                    </div>
                </div>
            `).join('');
        },

        // Show registration form
        showRegisterForm: () => {
            auth.showModal(auth.generateRegistrationModal());
        },

        // Generate registration modal HTML
        generateRegistrationModal: () => {
            return `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="auth.closeModalOnBackground(event)">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-user-plus text-2xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Inscription</h2>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Créer votre compte DOUKÈ Compta Pro</p>
                        </div>

                        <form id="registerForm" class="space-y-4" novalidate>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prénom <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" id="regFirstName" name="firstName" required maxlength="50" 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nom <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" id="regLastName" name="lastName" required maxlength="50"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email <span class="text-red-500">*</span>
                                </label>
                                <input type="email" id="regEmail" name="email" required 
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Utilisez votre email professionnel
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Numéro de téléphone <span class="text-red-500">*</span>
                                </label>
                                ${auth.generateCountryPhoneSelector('regPhone')}
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nom de l'entreprise <span class="text-red-500">*</span>
                                </label>
                                <input type="text" id="regCompanyName" name="companyName" required maxlength="100"
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type d'entreprise <span class="text-red-500">*</span>
                                </label>
                                <select id="regCompanyType" name="companyType" required 
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="">-- Sélectionner le type --</option>
                                    <option value="SARL">SARL - Société à Responsabilité Limitée</option>
                                    <option value="SA">SA - Société Anonyme</option>
                                    <option value="EURL">EURL - Entreprise Unipersonnelle à Responsabilité Limitée</option>
                                    <option value="SAS">SAS - Société par Actions Simplifiée</option>
                                    <option value="SNC">SNC - Société en Nom Collectif</option>
                                    <option value="EI">EI - Entreprise Individuelle</option>
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mot de passe <span class="text-red-500">*</span>
                                    </label>
                                    <input type="password" id="regPassword" name="password" required minlength="6"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Minimum 6 caractères
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirmer <span class="text-red-500">*</span>
                                    </label>
                                    <input type="password" id="regConfirmPassword" name="confirmPassword" required 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                <p class="text-sm text-blue-700 dark:text-blue-300">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    Votre compte sera créé avec le profil <strong>"Utilisateur"</strong>.
                                    Vous pourrez gérer uniquement votre entreprise. Période d'essai de 30 jours incluse.
                                </p>
                            </div>

                            <div class="flex items-center">
                                <input type="checkbox" id="agreeTerms" name="agreeTerms" required class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
                                <label for="agreeTerms" class="ml-2 text-sm text-gray-900 dark:text-white">
                                    J'accepte les <a href="#" class="text-primary hover:underline">conditions d'utilisation</a> et la <a href="#" class="text-primary hover:underline">politique de confidentialité</a>
                                </label>
                            </div>

                            <button type="submit" 
                                    class="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                <i class="fas fa-user-plus mr-2"></i>Créer mon compte
                            </button>
                        </form>

                        <div class="mt-6 flex justify-between items-center">
                            <button onclick="auth.showLoginInterface()" 
                                    class="text-primary hover:text-primary-700 font-medium transition-colors focus:outline-none focus:underline">
                                ← Retour à la connexion
                            </button>
                            <button onclick="auth.closeModal()" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:underline">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        // Generate country phone selector
        generateCountryPhoneSelector: (fieldId, selectedCountry = '+225') => {
            return `
                <div class="flex">
                    <select id="${fieldId}_country" 
                            class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base border-r-0 focus:ring-2 focus:ring-primary focus:border-transparent">
                        ${ohadaCountries.map(country => `
                            <option value="${country.code}" ${country.code === selectedCountry ? 'selected' : ''}>
                                ${country.flag} ${country.code}
                            </option>
                        `).join('')}
                    </select>
                    <input type="tel" id="${fieldId}" name="phone" required
                           class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent" 
                           placeholder="XX XX XX XX XX"
                           pattern="[0-9\\s\\-]{8,}">
                </div>
            `;
        },

        // Handle registration
        handleRegister: async (event) => {
            event.preventDefault();
            
            try {
                const formData = new FormData(event.target);
                const data = {
                    firstName: formData.get('firstName')?.trim(),
                    lastName: formData.get('lastName')?.trim(),
                    email: formData.get('email')?.trim().toLowerCase(),
                    phone: formData.get('phone')?.trim(),
                    companyName: formData.get('companyName')?.trim(),
                    companyType: formData.get('companyType'),
                    password: formData.get('password'),
                    confirmPassword: formData.get('confirmPassword'),
                    agreeTerms: formData.get('agreeTerms')
                };
                
                // Validation
                const errors = [];
                
                if (!data.firstName) errors.push('Le prénom est requis');
                if (!data.lastName) errors.push('Le nom est requis');
                if (!data.email || !validators.email(data.email)) errors.push('Email valide requis');
                if (!data.phone || !validators.phone(data.phone)) errors.push('Numéro de téléphone valide requis');
                if (!data.companyName) errors.push('Le nom de l\'entreprise est requis');
                if (!data.companyType) errors.push('Le type d\'entreprise est requis');
                if (!data.password || !validators.password(data.password)) errors.push('Mot de passe de 6 caractères minimum requis');
                if (data.password !== data.confirmPassword) errors.push('Les mots de passe ne correspondent pas');
                if (!data.agreeTerms) errors.push('Vous devez accepter les conditions d\'utilisation');
                
                // Check if email already exists
                if (userDatabase[data.email]) {
                    errors.push('Cette adresse email est déjà utilisée');
                }
                
                if (errors.length > 0) {
                    auth.showToast(errors.join('<br>'), 'error');
                    return;
                }
                
                // Simulate registration process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Create new user (in production, this would be sent to backend)
                const newUser = {
                    id: Object.keys(userDatabase).length + 1,
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    phone: data.phone,
                    role: 'Utilisateur',
                    profile: 'user',
                    password: data.password, // Would be hashed in production
                    permissions: ['entries.create', 'reports.own'],
                    lastLogin: null,
                    failedAttempts: 0,
                    lockedUntil: null,
                    company: {
                        name: data.companyName,
                        type: data.companyType
                    }
                };
                
                // Add to database (in production, this would be sent to backend)
                userDatabase[data.email] = newUser;
                
                auth.closeModal();
                auth.showToast('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
                
                // Pre-fill login form
                const emailField = document.getElementById('loginEmail');
                if (emailField) {
                    emailField.value = data.email;
                    emailField.focus();
                }
                
                console.log('✅ Registration successful:', newUser.name);
                
            } catch (error) {
                console.error('Registration error:', error);
                auth.showToast('Erreur lors de l\'inscription', 'error');
            }
        },

        // Show forgot password modal
        showForgotPassword: () => {
            const modal = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="auth.closeModalOnBackground(event)">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md" onclick="event.stopPropagation()">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-key text-2xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mot de passe oublié</h2>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Entrez votre email pour recevoir un lien de réinitialisation</p>
                        </div>

                        <form id="forgotPasswordForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input type="email" id="forgotEmail" required 
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                                       placeholder="votre@email.com">
                            </div>

                            <button type="submit" 
                                    class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors">
                                <i class="fas fa-paper-plane mr-2"></i>Envoyer le lien
                            </button>
                        </form>

                        <div class="mt-6 text-center">
                            <button onclick="auth.closeModal()" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors">
                                Retour à la connexion
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            auth.showModal(modal);
            
            // Setup form handler
            setTimeout(() => {
                const form = document.getElementById('forgotPasswordForm');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const email = document.getElementById('forgotEmail')?.value;
                        
                        if (email && validators.email(email)) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            auth.closeModal();
                            auth.showToast('Instructions envoyées par email (fonctionnalité de démonstration)', 'success');
                        } else {
                            auth.showToast('Veuillez entrer un email valide', 'error');
                        }
                    });
                }
            }, 100);
        },

        // Logout confirmation
        confirmLogout: () => {
            const modal = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-sign-out-alt text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Confirmer la déconnexion</h3>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                        </div>
                        
                        <div class="flex justify-center space-x-4">
                            <button onclick="auth.closeModal()" 
                                    class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Annuler
                            </button>
                            <button onclick="auth.logout()" 
                                    class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            auth.showModal(modal);
        },

        // Logout user
        logout: () => {
            try {
                // Clear session
                session.clear();
                
                // Reset app state
                app.isAuthenticated = false;
                app.currentProfile = null;
                app.currentUser = null;
                app.currentCompany = null;
                
                // Close modal and show login
                auth.closeModal();
                auth.showLoginInterface();
                
                auth.showToast('Déconnexion réussie. À bientôt !', 'success');
                console.log('✅ Logout successful');
                
            } catch (error) {
                console.error('Logout error:', error);
                auth.showToast('Erreur lors de la déconnexion', 'error');
            }
        },

        // Show login interface
        showLoginInterface: () => {
            const loginInterface = document.getElementById('loginInterface');
            const mainApp = document.getElementById('mainApp');
            
            if (loginInterface && mainApp) {
                loginInterface.classList.remove('hidden');
                mainApp.classList.add('hidden');
                
                // Focus email field
                setTimeout(() => {
                    const emailField = document.getElementById('loginEmail');
                    if (emailField) {
                        emailField.focus();
                    }
                }, 100);
            }
        },

        // Show main application
        showMainApp: () => {
            const loginInterface = document.getElementById('loginInterface');
            const mainApp = document.getElementById('mainApp');
            
            if (loginInterface && mainApp) {
                loginInterface.classList.add('hidden');
                mainApp.classList.remove('hidden');
                
                // Initialize main app interface using navigation.js functions
                try {
                    // Update user interface
                    if (typeof updateUserInfo === 'function') {
                        updateUserInfo();
                    }
                    
                    // Load navigation menu
                    if (typeof loadNavigationMenu === 'function') {
                        loadNavigationMenu();
                    }
                    
                    // Load dashboard
                    auth.loadDashboard();
                    
                } catch (error) {
                    console.error('Main app initialization error:', error);
                }
            }
        },

        // Restore session
        restoreSession: (sessionData) => {
            try {
                app.isAuthenticated = true;
                app.currentProfile = sessionData.user.profile;
                app.currentUser = sessionData.user;
                
                // Auto-select company for specific profiles
                if (sessionData.user.profile === 'user') {
                    app.currentCompany = '1';
                } else if (sessionData.user.profile === 'caissier') {
                    app.currentCompany = '2';
                }
                
                auth.showMainApp();
                auth.setSessionTimer();
                
                console.log('✅ Session restored:', sessionData.user.name);
                
            } catch (error) {
                console.error('Session restore error:', error);
                auth.logout();
            }
        },

        // Set session timer for auto-logout
        setSessionTimer: () => {
            if (sessionTimer) {
                clearTimeout(sessionTimer);
            }
            
            sessionTimer = setTimeout(() => {
                auth.showToast('Session expirée. Reconnexion requise.', 'error');
                auth.logout();
            }, SESSION_DURATION);
        },

        // Extend session (call this on user activity)
        extendSession: () => {
            if (app.isAuthenticated) {
                session.extend();
                auth.setSessionTimer();
            }
        },

        // Check permissions
        hasPermission: (permission) => {
            if (!app.currentUser || !app.currentUser.permissions) {
                return false;
            }
            
            return app.currentUser.permissions.includes('*') || 
                   app.currentUser.permissions.includes(permission);
        },

        // Modal utilities
        showModal: (html) => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = html;
                
                // Setup form handlers if register form
                setTimeout(() => {
                    const registerForm = document.getElementById('registerForm');
                    if (registerForm) {
                        registerForm.addEventListener('submit', auth.handleRegister);
                    }
                }, 100);
            }
        },

        closeModal: () => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
        },

        closeModalOnBackground: (event) => {
            if (event.target === event.currentTarget) {
                auth.closeModal();
            }
        },

        // Toast notification system
        showToast: (message, type = 'info') => {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-yellow-500',
                info: 'bg-blue-500'
            };

            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };

            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 transform translate-x-full transition-transform duration-300`;
            
            toast.innerHTML = `
                <i class="${icons[type]}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            `;

            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);

            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }, 5000);
        },

        // Clear session data
        clearSession: () => {
            session.clear();
        },

        // Get current session
        getCurrentSession: () => {
            return session.get();
        },

        // Get dashboard configuration for profile
        getDashboardConfig: (profile) => {
            return dashboardConfigs[profile] || dashboardConfigs.user;
        }
    };
})();

// Auto-extend session on user activity
document.addEventListener('click', auth.extendSession);
document.addEventListener('keypress', auth.extendSession);

// Make loadDashboard globally accessible for navigation.js
window.loadDashboard = auth.loadDashboard;

// Export for global access
window.auth = auth;

console.log('🔐 Auth.js v2.2.0 chargé avec succès - Intégration complète avec navigation.js');
    </script>

    <!-- INITIALIZE APP -->
    <script>
        // Initialize the application when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            auth.init();
            console.log('🚀 DOUKÈ Compta Pro - Application initialisée');
        });
    </script>

</body>
</html>
