// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION PRINCIPALE MODIFIÉE
// =============================================================================

// Application State - ÉTAT ORIGINAL COMPLET
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
deadlines: []
};

// Theme management - FONCTION ORIGINALE COMPLÈTE
const themeManager = {
current: 'system',

scheme

Copier
init() {
// Detect initial theme
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

scheme
Copier
// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (this.current === 'system') {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
});
},

setTheme(theme) {
this.current = theme;
if (theme === 'dark') {
document.documentElement.classList.add('dark');
localStorage.setItem('theme', 'dark');
} else if (theme === 'light') {
document.documentElement.classList.remove('dark');
localStorage.setItem('theme', 'light');
} else {
localStorage.removeItem('theme');
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
document.documentElement.classList.add('dark');
} else {
document.documentElement.classList.remove('dark');
}
}
}
};

// =============================================================================
// GESTIONNAIRE DE MODULES - NOUVEAU
// =============================================================================
class ModuleManager {
constructor() {
this.requiredFunctions = [
'initializeData',
'loadNavigationMenu',
'updateUserInfo',
'loadDashboard',
'loadEntries',
'loadAccounts',
'loadCaisse',
'loadReports',
'loadImport',
'loadSettings',
'loadUsersManagement',
'loadCompanies',
'updateSelectedCompanyInfo'
];
}

javascript

Copier
// Vérifier et créer les fonctions manquantes
ensureFunctionsExist() {
this.requiredFunctions.forEach(funcName => {
if (typeof window[funcName] !== 'function') {
console.warn(⚠️ Fonction ${funcName} manquante, création d'un fallback);
window[funcName] = this.createFallback(funcName);
}
});
}

// Créer une fonction de fallback
createFallback(funcName) {
const self = this;
return function() {
console.log(📄 Chargement fallback pour ${funcName});
self.showModuleFallback(funcName);
};
}

// Afficher un contenu de fallback
showModuleFallback(funcName) {
const moduleInfo = this.getModuleInfo(funcName);
const mainContent = document.getElementById('mainContent');

angelscript
Copier
if (mainContent && moduleInfo.isPageLoader) {
    mainContent.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${moduleInfo.title}</h2>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <div class="text-center">
                    <div class="w-16 h-16 bg-info text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-code text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Module en développement</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        La fonction <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${funcName}</code> 
                        n'est pas encore implémentée dans <strong>${moduleInfo.file}</strong>.
                    </p>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
                        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3">
                            <i class="fas fa-lightbulb mr-2"></i>Template de base :
                        </h4>
                        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-left overflow-x-auto">
                            <pre class="text-sm"><code>${moduleInfo.template}</code></pre>
                        </div>
                    </div>

                    <div class="flex justify-center space-x-4">
                        <button onclick="location.reload()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sync mr-2"></i>Recharger
                        </button>
                        <button onclick="showModuleStatus()" class="bg-info hover:bg-info/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-info mr-2"></i>État des modules
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
}

// Obtenir les informations d'un module
getModuleInfo(funcName) {
const moduleMap = {
'initializeData': {
title: 'Initialisation',
file: 'data.js',
isPageLoader: false,
template: function initializeData() {\n    // Initialiser les données de l'app\n    app.accounts = [...]; // Plan comptable\n    app.companies = [...]; // Entreprises\n    app.users = [...]; // Utilisateurs\n    console.log('✅ Données initialisées');\n}
},
'loadNavigationMenu': {
title: 'Navigation',
file: 'navigation.js',
isPageLoader: false,
template: function loadNavigationMenu() {\n    // Charger le menu selon le profil\n    const menuElement = document.getElementById('navigationMenu');\n    menuElement.innerHTML = '...';\n}
},
'updateUserInfo': {
title: 'Information Utilisateur',
file: 'auth.js',
isPageLoader: false,
template: function updateUserInfo() {\n    // Mettre à jour les infos utilisateur\n    document.getElementById('currentUser').textContent = app.currentUser.name;\n}
},
'loadDashboard': {
title: 'Tableau de Bord',
file: 'dashboard.js',
isPageLoader: true,
template: function loadDashboard() {\n    const content = \\n <h2>Tableau de Bord</h2>\n <div class="grid grid-cols-3 gap-4">\n <!-- KPI Cards -->\n </div>\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadEntries': {              title: 'Écritures Comptables',              file: 'entries.js',              isPageLoader: true,             template:function loadEntries() {\n const content = `\n <h2>Écritures Comptables</h2>\n <!-- Formulaires et listes -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadAccounts': {              title: 'Plan Comptable',              file: 'accounts.js',              isPageLoader: true,             template:function loadAccounts() {\n const content = `\n <h2>Plan Comptable SYSCOHADA</h2>\n <!-- Liste des comptes -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadCaisse': {              title: 'Gestion des Caisses',              file: 'caisse.js',              isPageLoader: true,             template:function loadCaisse() {\n const content = `\n <h2>Gestion des Caisses</h2>\n <!-- Interface caisse -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadReports': {              title: 'Rapports & États',              file: 'reports.js',              isPageLoader: true,             template:function loadReports() {\n const content = `\n <h2>Rapports & États</h2>\n <!-- Génération rapports -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadImport': {              title: 'Import de Balances',              file: 'import.js',              isPageLoader: true,             template:function loadImport() {\n const content = `\n <h2>Import de Balances</h2>\n <!-- Interface import -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadSettings': {              title: 'Mon Profil',              file: 'settings.js',              isPageLoader: true,             template:function loadSettings() {\n const content = `\n <h2>Mon Profil</h2>\n <!-- Paramètres utilisateur -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadUsersManagement': {              title: 'Gestion Collaborateurs',              file: 'settings.js',              isPageLoader: true,             template:function loadUsersManagement() {\n const content = `\n <h2>Gestion des Collaborateurs</h2>\n <!-- Interface admin utilisateurs -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'loadCompanies': {              title: 'Gestion Entreprises',              file: 'settings.js',              isPageLoader: true,             template:function loadCompanies() {\n const content = `\n <h2>Gestion des Entreprises</h2>\n <!-- Interface admin entreprises -->\n `;\n document.getElementById('mainContent').innerHTML = content;\n}        },         'updateSelectedCompanyInfo': {              title: 'Info Entreprise',              file: 'navigation.js',              isPageLoader: false,             template:function updateSelectedCompanyInfo() {\n // Mettre à jour les infos entreprise\n const company = app.companies.find(c => c.id == app.currentCompany);\n if (company) {\n document.getElementById('selectedCompanyInfo').innerHTML = company.name;\n }\n}`
}
};

Copier
return moduleMap[funcName] || { 
    title: 'Module Inconnu', 
    file: 'unknown.js', 
    isPageLoader: true,
    template: `function ${funcName}() {\n    // À implémenter\n}`
};
}
}

// Créer l'instance du gestionnaire de modules
const moduleManager = new ModuleManager();

// =============================================================================
// THEME MANAGEMENT - FONCTION ORIGINALE COMPLÈTE
// =============================================================================
function toggleThemeMenu() {
const menu = document.getElementById('themeMenu');
if (menu) {
menu.classList.toggle('hidden');
}
}

function setTheme(theme) {
try {
themeManager.setTheme(theme);
const themeMenu = document.getElementById('themeMenu');
if (themeMenu) {
themeMenu.classList.add('hidden');
}
showSuccessMessage('✅ Thème modifié : ' + theme);
} catch (error) {
console.error('Erreur changement thème:', error);
}
}

// =============================================================================
// FONCTION DE VÉRIFICATION DES MODULES
// =============================================================================
function showModuleStatus() {
const status = moduleManager.requiredFunctions.map(func => {
const exists = typeof window[func] === 'function';
const info = moduleManager.getModuleInfo(func);
return ${info.file}: ${func} ${exists ? '✅' : '❌'};
}).join('\n');

Copier
alert(État des modules :\n\n${status}\n\n✅ = Fonction disponible\n❌ = Utilise un fallback);
}

// Rendre la fonction globale
window.showModuleStatus = showModuleStatus;

// =============================================================================
// EVENT LISTENERS & INITIALIZATION - MODIFIÉ
// =============================================================================
function bindEventListeners() {
try {
// Company selector
setTimeout(() => {
const companySelect = document.getElementById('activeCompanySelect');
if (companySelect) {
companySelect.addEventListener('change', function(e) {
app.currentCompany = e.target.value;
updateSelectedCompanyInfo(); // Cette fonction sera créée par le moduleManager si nécessaire
console.log('✅ Entreprise sélectionnée:', app.currentCompany);
});
}
}, 100);

scheme

Copier
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

scheme
Copier
// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (typeof handleLogin === 'function') {
            handleLogin();
        } else {
            console.warn('⚠️ handleLogin non disponible');
        }
    });
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (window.innerWidth < 1024 && sidebar && sidebarToggle && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add('-translate-x-full');
    }
});
} catch (error) {
console.error('Erreur bindEventListeners:', error);
}
}

function initializeApp() {
try {
console.log('🔄 Initialisation de l'application...');

scheme

Copier
// D'abord, s'assurer que toutes les fonctions existent
moduleManager.ensureFunctionsExist();

stylus
Copier
// Puis les appeler en toute sécurité
initializeData();
loadNavigationMenu();
updateUserInfo();
loadDashboard();
bindEventListeners();

console.log('✅ DOUKÈ Compta Pro initialisé avec succès !');
} catch (error) {
console.error('❌ Erreur lors de l'initialisation:', error);
showErrorMessage('Erreur lors de l'initialisation de l'application');
}
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================
function showSuccessMessage(message) {
alert(message);
}

function showErrorMessage(message) {
alert('❌ ' + message);
}

// Close theme menu when clicking outside
document.addEventListener('click', function(e) {
const menu = document.getElementById('themeMenu');
const button = e.target.closest('[onclick="toggleThemeMenu()"]');
if (menu && !menu.contains(e.target) && !button) {
menu.classList.add('hidden');
}

scheme

Copier
// Close notifications panel when clicking outside
const notifPanel = document.getElementById('notificationsPanel');
const notifButton = e.target.closest('[onclick="toggleNotificationsPanel()"]');
if (notifPanel && !notifPanel.contains(e.target) && !notifButton) {
notifPanel.classList.add('hidden');
}
});

// APPLICATION START
document.addEventListener('DOMContentLoaded', function() {
try {
themeManager.init();
setTimeout(() => {
bindEventListeners();
console.log('🚀 DOUKÈ Compta Pro - Application démarrée avec gestion des modules');
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
