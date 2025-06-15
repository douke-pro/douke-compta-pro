// =============================================================================
// NAVIGATION.JS - GESTION COMPLÈTE DE LA NAVIGATION
// =============================================================================

// =============================================================================
// CONFIGURATION DES MENUS PAR PROFIL
// =============================================================================

const navigationMenus = {
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

// =============================================================================
// ÉTAT DE NAVIGATION ACTUEL
// =============================================================================

let currentActivePage = 'dashboard';
let navigationHistory = ['dashboard'];

// =============================================================================
// CHARGEMENT DU MENU DE NAVIGATION
// =============================================================================

function loadNavigationMenu() {
    if (!app || !app.currentProfile) {
        console.warn('⚠️ Profil utilisateur non défini pour le menu de navigation');
        return;
    }

    const menuItems = navigationMenus[app.currentProfile] || navigationMenus.user;
    
    const menuHtml = menuItems.map(item => `
        <a href="#" onclick="navigateTo('${item.id}'); return false;" 
           class="nav-item flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}"
           data-page="${item.id}">
            <i class="${item.icon} w-5 h-5 mr-3"></i>
            <span>${item.text}</span>
        </a>
    `).join('');

    const navigationMenuElement = document.getElementById('navigationMenu');
    if (navigationMenuElement) {
        navigationMenuElement.innerHTML = menuHtml;
        console.log('✅ Menu de navigation chargé pour le profil:', app.currentProfile);
    } else {
        console.error('❌ Élément navigationMenu non trouvé');
    }
}

// =============================================================================
// FONCTION DE NAVIGATION PRINCIPALE
// =============================================================================

function navigateTo(page, element = null) {
    if (!page) {
        console.error('❌ Page de navigation non spécifiée');
        return;
    }

    // Vérifier l'authentification
    if (typeof checkAuthentication === 'function' && !checkAuthentication()) {
        console.warn('⚠️ Tentative de navigation sans authentification');
        if (typeof showLoginInterface === 'function') {
            showLoginInterface();
        }
        return;
    }

    console.log('🔄 Navigation vers:', page);

    // Mettre à jour l'état de navigation
    updateNavigationState(page);

    // Mettre à jour les classes actives du menu
    updateActiveMenuItem(page, element);

    // Charger le contenu de la page avec gestion d'erreur
    try {
        loadPageContent(page);
        
        // Ajouter à l'historique
        if (navigationHistory[navigationHistory.length - 1] !== page) {
            navigationHistory.push(page);
            
            // Limiter l'historique à 10 éléments
            if (navigationHistory.length > 10) {
                navigationHistory = navigationHistory.slice(-10);
            }
        }
        
        currentActivePage = page;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page:', error);
        showErrorMessage('Erreur lors du chargement de la page: ' + page);
        
        // Revenir à la page précédente en cas d'erreur
        if (navigationHistory.length > 1) {
            const previousPage = navigationHistory[navigationHistory.length - 2];
            setTimeout(() => navigateTo(previousPage), 100);
        }
    }
}

// =============================================================================
// MISE À JOUR DE L'ÉTAT DU MENU
// =============================================================================

function updateActiveMenuItem(page, clickedElement = null) {
    // Supprimer les classes actives de tous les éléments de menu
    const menuItems = document.querySelectorAll('#navigationMenu .nav-item');
    menuItems.forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Ajouter la classe active à l'élément cliqué ou trouvé
    let activeElement = clickedElement;
    
    if (!activeElement) {
        // Trouver l'élément correspondant à la page
        activeElement = document.querySelector(`#navigationMenu .nav-item[data-page="${page}"]`);
    }
    
    if (activeElement) {
        activeElement.classList.add('bg-primary', 'text-white');
        activeElement.classList.remove('text-gray-700', 'dark:text-gray-300');
    }
}

function updateNavigationState(page) {
    // Mettre à jour le titre de la page si nécessaire
    const pageTitles = {
        'dashboard': 'Tableau de Bord',
        'users': 'Gestion des Collaborateurs',
        'companies': 'Gestion des Entreprises',
        'entries': 'Écritures Comptables',
        'accounts': 'Plan Comptable',
        'caisse': 'Gestion des Caisses',
        'reports': 'Rapports & États',
        'import': 'Import de Balances',
        'settings': 'Mon Profil'
    };

    const pageTitle = pageTitles[page];
    if (pageTitle && document.title) {
        document.title = `DOUKÈ Compta Pro - ${pageTitle}`;
    }
    
    // Mettre à jour l'URL si history API est disponible
    if (window.history && window.history.pushState) {
        try {
            window.history.pushState({ page: page }, pageTitle, `#${page}`);
        } catch (error) {
            console.warn('⚠️ Impossible de mettre à jour l\'URL:', error);
        }
    }
}

// =============================================================================
// CHARGEMENT DU CONTENU DES PAGES
// =============================================================================

function loadPageContent(page) {
    const pageLoaders = {
        'dashboard': loadDashboard,
        'users': loadUsersManagement,
        'companies': loadCompanies,
        'entries': loadEntries,
        'accounts': loadAccounts,
        'caisse': loadCaisse,
        'reports': loadReports,
        'import': loadImport,
        'settings': loadSettings
    };

    const loader = pageLoaders[page];
    
    if (typeof loader === 'function') {
        // Afficher un indicateur de chargement
        showLoadingIndicator();
        
        // Charger la page avec un petit délai pour l'animation
        setTimeout(() => {
            try {
                loader();
                hideLoadingIndicator();
            } catch (error) {
                hideLoadingIndicator();
                console.error(`❌ Erreur lors du chargement de ${page}:`, error);
                showPageLoadError(page);
            }
        }, 50);
        
    } else {
        console.warn(`⚠️ Chargeur non trouvé pour la page: ${page}`);
        showPageNotFound(page);
    }
}

// =============================================================================
// GESTION DES ERREURS DE NAVIGATION
// =============================================================================

function showPageLoadError(page) {
    const content = `
        <div class="flex items-center justify-center min-h-96">
            <div class="text-center bg-danger/10 p-8 rounded-xl max-w-md">
                <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Erreur de chargement</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Une erreur s'est produite lors du chargement de la page "${page}".
                </p>
                <div class="space-x-4">
                    <button onclick="navigateTo('dashboard')" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-home mr-2"></i>Retour au tableau de bord
                    </button>
                    <button onclick="location.reload()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-sync mr-2"></i>Recharger
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
    }
}

function showPageNotFound(page) {
    const content = `
        <div class="flex items-center justify-center min-h-96">
            <div class="text-center bg-warning/10 p-8 rounded-xl max-w-md">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-question-circle text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Page non trouvée</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    La page "${page}" n'existe pas ou n'est pas accessible avec votre profil.
                </p>
                <button onclick="navigateTo('dashboard')" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-home mr-2"></i>Retour au tableau de bord
                </button>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
    }
}

// =============================================================================
// INDICATEURS DE CHARGEMENT
// =============================================================================

function showLoadingIndicator() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        const loadingHtml = `
            <div class="flex items-center justify-center min-h-96">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                    <p class="text-gray-600 dark:text-gray-400">Chargement en cours...</p>
                </div>
            </div>
        `;
        mainContent.innerHTML = loadingHtml;
    }
}

function hideLoadingIndicator() {
    // L'indicateur sera remplacé par le contenu de la page
    // Cette fonction peut être utilisée pour des actions supplémentaires si nécessaire
}

// =============================================================================
// NAVIGATION PAR HISTORIQUE
// =============================================================================

function goBack() {
    if (navigationHistory.length > 1) {
        // Supprimer la page actuelle de l'historique
        navigationHistory.pop();
        
        // Naviguer vers la page précédente
        const previousPage = navigationHistory[navigationHistory.length - 1];
        navigateTo(previousPage);
    } else {
        // Retour par défaut au dashboard
        navigateTo('dashboard');
    }
}

function getCurrentPage() {
    return currentActivePage;
}

function getNavigationHistory() {
    return [...navigationHistory]; // Retourner une copie de l'historique
}

// =============================================================================
// GESTION DES PERMISSIONS DE NAVIGATION
// =============================================================================

function canAccessPage(page) {
    if (!app || !app.currentProfile) {
        return false;
    }

    const pagePermissions = {
        'dashboard': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier'],
        'users': ['admin'],
        'companies': ['admin', 'collaborateur-senior', 'collaborateur'],
        'entries': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier'],
        'accounts': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier'],
        'caisse': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier'],
        'reports': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier'],
        'import': ['admin', 'collaborateur-senior', 'collaborateur', 'user'],
        'settings': ['admin', 'collaborateur-senior', 'collaborateur', 'user', 'caissier']
    };

    const allowedProfiles = pagePermissions[page];
    return allowedProfiles ? allowedProfiles.includes(app.currentProfile) : false;
}

function enforcePagePermissions(page) {
    if (!canAccessPage(page)) {
        console.warn(`⚠️ Accès refusé à la page "${page}" pour le profil "${app.currentProfile}"`);
        
        // Rediriger vers une page autorisée
        if (canAccessPage('dashboard')) {
            navigateTo('dashboard');
        } else {
            showAccessDenied();
        }
        
        return false;
    }
    return true;
}

// =============================================================================
// GESTION DU SIDEBAR MOBILE
// =============================================================================

function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
        });

        // Fermer le sidebar en cliquant à l'extérieur (mobile uniquement)
        document.addEventListener('click', function(e) {
            if (window.innerWidth < 1024 && 
                sidebar && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target) &&
                !sidebar.classList.contains('-translate-x-full')) {
                
                sidebar.classList.add('-translate-x-full');
            }
        });
        
        console.log('✅ Toggle sidebar initialisé');
    }
}

// =============================================================================
// GESTION DE L'URL ET NAVIGATION DIRECTE
// =============================================================================

function handleURLNavigation() {
    // Vérifier s'il y a un hash dans l'URL
    const hash = window.location.hash.substring(1);
    
    if (hash && canAccessPage(hash)) {
        navigateTo(hash);
    } else if (hash && !canAccessPage(hash)) {
        // Hash présent mais pas d'autorisation
        console.warn('⚠️ Tentative d\'accès non autorisé via URL:', hash);
        navigateTo('dashboard');
    }
    // Sinon, rester sur la page par défaut (dashboard)
}

// Écouter les changements d'historique du navigateur
function initializeHistoryNavigation() {
    if (window.addEventListener) {
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.page) {
                const page = event.state.page;
                if (canAccessPage(page)) {
                    // Naviguer sans ajouter à l'historique (car c'est déjà fait)
                    loadPageContent(page);
                    updateActiveMenuItem(page);
                    currentActivePage = page;
                }
            }
        });
        
        console.log('✅ Navigation par historique initialisée');
    }
}

// =============================================================================
// RACCOURCIS CLAVIER POUR LA NAVIGATION
// =============================================================================

function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Vérifier si l'utilisateur est dans un champ de saisie
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        // Raccourcis avec Ctrl+Alt
        if (e.ctrlKey && e.altKey) {
            switch(e.key) {
                case 'd':
                    e.preventDefault();
                    if (canAccessPage('dashboard')) navigateTo('dashboard');
                    break;
                case 'e':
                    e.preventDefault();
                    if (canAccessPage('entries')) navigateTo('entries');
                    break;
                case 'c':
                    e.preventDefault();
                    if (canAccessPage('companies')) navigateTo('companies');
                    break;
                case 'r':
                    e.preventDefault();
                    if (canAccessPage('reports')) navigateTo('reports');
                    break;
                case 's':
                    e.preventDefault();
                    if (canAccessPage('settings')) navigateTo('settings');
                    break;
            }
        }
        
        // Échap pour fermer les modals
        if (e.key === 'Escape') {
            if (typeof closeModal === 'function') {
                closeModal();
            }
        }
    });
    
    console.log('✅ Raccourcis clavier initialisés');
}

// =============================================================================
// INITIALISATION COMPLÈTE DE LA NAVIGATION
// =============================================================================

function initializeNavigation() {
    try {
        // Charger le menu de navigation
        loadNavigationMenu();
        
        // Initialiser les événements
        initializeSidebarToggle();
        initializeHistoryNavigation();
        initializeKeyboardShortcuts();
        
        // Gérer la navigation par URL
        handleURLNavigation();
        
        console.log('✅ Navigation initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la navigation:', error);
    }
}

// =============================================================================
// UTILITAIRES DE NAVIGATION
// =============================================================================

function refreshCurrentPage() {
    if (currentActivePage) {
        loadPageContent(currentActivePage);
    }
}

function isCurrentPage(page) {
    return currentActivePage === page;
}

function setDefaultPage(page) {
    if (canAccessPage(page)) {
        currentActivePage = page;
        navigationHistory = [page];
    }
}

// =============================================================================
// GESTION DES ENTREPRISES DANS LA NAVIGATION
// =============================================================================

function populateCompanySelector() {
    const select = document.getElementById('activeCompanySelect');
    if (select && app && app.companies) {
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
        
        console.log('✅ Sélecteur d\'entreprise peuplé');
    }
}

function getCompanyName() {
    if (!app || !app.currentCompany || !app.companies) {
        return 'Aucune entreprise sélectionnée';
    }

    const company = app.companies.find(c => c.id == app.currentCompany);
    return company ? company.name : 'Entreprise inconnue';
}

function updateSelectedCompanyInfo() {
    const company = app && app.companies ? app.companies.find(c => c.id == app.currentCompany) : null;
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

// =============================================================================
// EXPORTATION DES FONCTIONS (si utilisé avec des modules)
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadNavigationMenu,
        navigateTo,
        updateActiveMenuItem,
        updateNavigationState,
        loadPageContent,
        goBack,
        getCurrentPage,
        getNavigationHistory,
        canAccessPage,
        enforcePagePermissions,
        initializeNavigation,
        refreshCurrentPage,
        isCurrentPage,
        setDefaultPage,
        populateCompanySelector,
        getCompanyName,
        updateSelectedCompanyInfo
    };
}

console.log('✅ Navigation.js chargé avec succès - Toutes les fonctions de navigation disponibles');
