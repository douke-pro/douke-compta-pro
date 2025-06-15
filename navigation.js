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
                if (typeof auth !== 'undefined' && typeof loadDashboard === 'function') {
                    loadDashboard();
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
    const adminActions = document.getElementById('adminActions');

    if (companySelector) {
        companySelector.style.display = profile.showSelector ? 'block' : 'none';

        // Peupler le sélecteur
        if (profile.showSelector) {
            populateCompanySelector();
        }
    }

    // Affichage des actions admin uniquement pour les administrateurs
    if (adminActions) {
        adminActions.style.display = app.currentProfile === 'admin' ? 'block' : 'none';
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
    alert('✅ ' + message);
}

function showErrorMessage(message) {
    alert('❌ ' + message);
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
