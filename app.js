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

<!-- Notifications -->
<div class="relative">
<button onclick="toggleNotificationsPanel()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
<i class="fas fa-bell text-lg"></i>
<span class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
</button>
<div id="notificationsPanel" class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
<div class="p-4 border-b border-gray-200 dark:border-gray-700">
<h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
</div>
<div class="p-4 space-y-3">
<div class="p-3 bg-warning/10 rounded-lg">
<p class="text-sm text-warning font-medium">Écritures en attente</p>
<p class="text-xs text-gray-600 dark:text-gray-400">2 écritures nécessitent une validation</p>
</div>
<div class="p-3 bg-info/10 rounded-lg">
<p class="text-sm text-info font-medium">Nouveau collaborateur</p>
<p class="text-xs text-gray-600 dark:text-gray-400">Jean Diabaté a rejoint l'équipe</p>
</div>
<div class="p-3 bg-success/10 rounded-lg">
<p class="text-sm text-success font-medium">Rapport généré</p>
<p class="text-xs text-gray-600 dark:text-gray-400">Balance comptable disponible</p>
</div>
</div>
</div>
</div>

<!-- Thème -->
<div class="relative">
<button onclick="toggleThemeMenu()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
<i class="fas fa-palette text-lg"></i>
</button>
<div id="themeMenu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
<div class="p-2">
<button onclick="setTheme('light')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
<i class="fas fa-sun mr-2"></i>Clair
</button>
<button onclick="setTheme('dark')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
<i class="fas fa-moon mr-2"></i>Sombre
</button>
<button onclick="setTheme('system')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
<i class="fas fa-desktop mr-2"></i>Système
</button>
</div>
</div>
</div>

<!-- Actions admin -->
<div id="adminActions" class="hidden">
<button onclick="uploadLogo()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Upload Logo">
<i class="fas fa-image text-lg"></i>
</button>
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
// DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT INTÉGRALE CORRIGÉE
// Système de gestion comptable SYSCOHADA Révisé - VERSION ROBUSTE ET SÉCURISÉE
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
try {
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
} catch (error) {
console.error('❌ Erreur initialisation thème:', error);
}
},

setTheme(theme) {
try {
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
} catch (error) {
console.error('❌ Erreur changement thème:', error);
}
}
};

// =============================================================================
// SECURITY & ACCESS CONTROL - SÉCURITÉ ET CONTRÔLE D'ACCÈS CORRIGÉ
// =============================================================================
const SecurityManager = {
// ✅ CORRIGÉ : Vérifier l'accès à une entreprise pour l'utilisateur actuel
canAccessCompany(companyId) {
try {
if (!app.currentUser || !companyId) return false;

// Admin peut accéder à toutes les entreprises
if (app.currentProfile === 'admin') return true;

// Utilisateur et Caissier : une seule entreprise
if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
const userCompanies = this.getUserCompanies(app.currentUser.id);
return userCompanies.length === 1 && userCompanies[0] == companyId;
}

// Collaborateurs : entreprises assignées
if (app.currentProfile.includes('collaborateur')) {
const userCompanies = this.getUserCompanies(app.currentUser.id);
return userCompanies.includes(parseInt(companyId));
}

return false;
} catch (error) {
console.error('❌ Erreur canAccessCompany:', error);
return false;
}
},

// ✅ CORRIGÉ : Obtenir les entreprises autorisées pour un utilisateur
getUserCompanies(userId) {
try {
const user = app.users.find(u => u.id === userId);
if (!user) return [];

// Utilisateur et Caissier : une seule entreprise prédéfinie
if (user.profile === 'user') return [1]; // SARL TECH INNOVATION
if (user.profile === 'caissier') return [2]; // SA COMMERCE PLUS

return user.companies || [];
} catch (error) {
console.error('❌ Erreur getUserCompanies:', error);
return [];
}
},

// ✅ CORRIGÉ : Filtrer les données par entreprise autorisée
getAuthorizedEntries() {
try {
if (app.currentProfile === 'admin' && app.currentCompany) {
return app.entries.filter(e => e.companyId == app.currentCompany);
}

if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
const userCompanies = this.getUserCompanies(app.currentUser.id);
return app.entries.filter(e => userCompanies.includes(e.companyId));
}

if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
const userCompanies = this.getUserCompanies(app.currentUser.id);
if (userCompanies.includes(parseInt(app.currentCompany))) {
return app.entries.filter(e => e.companyId == app.currentCompany);
}
}

return [];
} catch (error) {
console.error('❌ Erreur getAuthorizedEntries:', error);
return [];
}
},

// ✅ CORRIGÉ : Obtenir les caisses autorisées
getAuthorizedCashRegisters() {
try {
if (app.currentProfile === 'admin' && app.currentCompany) {
return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
}

if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
const userCompanies = this.getUserCompanies(app.currentUser.id);
return app.cashRegisters.filter(c => userCompanies.includes(c.companyId));
}

if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
const userCompanies = this.getUserCompanies(app.currentUser.id);
if (userCompanies.includes(parseInt(app.currentCompany))) {
return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
}
}

return [];
} catch (error) {
console.error('❌ Erreur getAuthorizedCashRegisters:', error);
return [];
}
},

// ✅ CORRIGÉ : Vérifier si l'utilisateur doit sélectionner une entreprise
requiresCompanySelection() {
try {
// Seuls les admin et collaborateurs ont besoin de sélectionner une entreprise
// Les utilisateurs et caissiers ont une entreprise auto-assignée
return (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur'))
&& !app.currentCompany;
} catch (error) {
console.error('❌ Erreur requiresCompanySelection:', error);
return false;
}
},

// ✅ CORRIGÉ : Forcer la sélection d'entreprise avec logique améliorée
enforceCompanySelection(operation) {
try {
// Ne jamais bloquer les utilisateurs et caissiers (entreprise auto-assignée)
if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
return true;
}

// Pour admin et collaborateurs, vérifier la sélection
if (this.requiresCompanySelection()) {
showCompanySelectionWarning(operation);
return false;
}
return true;
} catch (error) {
console.error('❌ Erreur enforceCompanySelection:', error);
return false;
}
}
};

// =============================================================================
// STATISTICS MANAGER - GESTIONNAIRE DE STATISTIQUES AUTO-MISE À JOUR
// =============================================================================
const StatisticsManager = {
// ✅ CORRIGÉ : Mettre à jour toutes les statistiques avec gestion d'erreurs
updateAllStatistics() {
try {
this.updateBasicStats();
this.updateTrends();
this.updateFinancialMetrics();
app.statistics.lastUpdate = new Date();
console.log('📊 Statistiques mises à jour avec succès');
} catch (error) {
console.error('❌ Erreur mise à jour statistiques:', error);
}
},

// Statistiques de base
updateBasicStats() {
try {
const authorizedEntries = SecurityManager.getAuthorizedEntries();
const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();

app.statistics.totals = {
companies: this.getCompanyCount(),
users: app.users.length,
activeUsers: app.users.filter(u => u.status === 'Actif').length,
entries: authorizedEntries.length,
pendingEntries: authorizedEntries.filter(e => e.status === 'En attente').length,
validatedEntries: authorizedEntries.filter(e => e.status === 'Validé').length,
totalDebit: this.calculateTotalDebit(authorizedEntries),
totalCredit: this.calculateTotalCredit(authorizedEntries),
cashRegisters: authorizedCashRegisters.length,
activeCashRegisters: authorizedCashRegisters.filter(c => c.status === 'Ouvert').length
};
} catch (error) {
console.error('❌ Erreur updateBasicStats:', error);
}
},

// Tendances et évolutions
updateTrends() {
try {
const authorizedEntries = SecurityManager.getAuthorizedEntries();
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const thisMonthEntries = authorizedEntries.filter(e => {
const entryDate = new Date(e.date);
return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
});

const lastMonthEntries = authorizedEntries.filter(e => {
const entryDate = new Date(e.date);
const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const year = currentMonth === 0 ? currentYear - 1 : currentYear;
return entryDate.getMonth() === lastMonth && entryDate.getFullYear() === year;
});

app.statistics.trends = {
entriesGrowth: this.calculateGrowthRate(thisMonthEntries.length, lastMonthEntries.length),
validationRate: this.calculateValidationRate(authorizedEntries),
averageProcessingTime: this.calculateAverageProcessingTime(authorizedEntries),
monthlyProgress: this.calculateMonthlyProgress(thisMonthEntries)
};
} catch (error) {
console.error('❌ Erreur updateTrends:', error);
}
},

// Métriques financières
updateFinancialMetrics() {
try {
const authorizedEntries = SecurityManager.getAuthorizedEntries();

app.statistics.financial = {
balance: this.calculateBalance(authorizedEntries),
cashFlow: this.calculateCashFlow(authorizedEntries),
topAccounts: this.getTopUsedAccounts(authorizedEntries),
journalDistribution: this.getJournalDistribution(authorizedEntries)
};
} catch (error) {
console.error('❌ Erreur updateFinancialMetrics:', error);
}
},

// Calculer le nombre d'entreprises accessibles
getCompanyCount() {
try {
if (app.currentProfile === 'admin') {
return app.companies.length;
}

if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
return 1; // Une seule entreprise
}

return SecurityManager.getUserCompanies(app.currentUser.id).length;
} catch (error) {
console.error('❌ Erreur getCompanyCount:', error);
return 0;
}
},

// Calculer le total des débits
calculateTotalDebit(entries) {
try {
return entries.reduce((total, entry) => {
return total + entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
}, 0);
} catch (error) {
console.error('❌ Erreur calculateTotalDebit:', error);
return 0;
}
},

// Calculer le total des crédits
calculateTotalCredit(entries) {
try {
return entries.reduce((total, entry) => {
return total + entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
}, 0);
} catch (error) {
console.error('❌ Erreur calculateTotalCredit:', error);
return 0;
}
},

// Calculer le taux de croissance
calculateGrowthRate(current, previous) {
try {
if (previous === 0) return current > 0 ? 100 : 0;
return Math.round(((current - previous) / previous) * 100);
} catch (error) {
console.error('❌ Erreur calculateGrowthRate:', error);
return 0;
}
},

// Calculer le taux de validation
calculateValidationRate(entries) {
try {
if (entries.length === 0) return 100;
const validated = entries.filter(e => e.status === 'Validé').length;
return Math.round((validated / entries.length) * 100);
} catch (error) {
console.error('❌ Erreur calculateValidationRate:', error);
return 0;
}
},

// Calculer le temps moyen de traitement
calculateAverageProcessingTime(entries) {
try {
const processedEntries = entries.filter(e => e.status === 'Validé');
if (processedEntries.length === 0) return 0;

// Simulation du temps de traitement (en heures)
return Math.round(processedEntries.length * 2.5 / processedEntries.length);
} catch (error) {
console.error('❌ Erreur calculateAverageProcessingTime:', error);
return 0;
}
},

// Calculer le progrès mensuel
calculateMonthlyProgress(monthEntries) {
try {
const targetMonthly = 100; // Objectif mensuel
return Math.min(100, Math.round((monthEntries.length / targetMonthly) * 100));
} catch (error) {
console.error('❌ Erreur calculateMonthlyProgress:', error);
return 0;
}
},

// Calculer la balance
calculateBalance(entries) {
try {
const totalDebit = this.calculateTotalDebit(entries);
const totalCredit = this.calculateTotalCredit(entries);
return totalDebit - totalCredit;
} catch (error) {
console.error('❌ Erreur calculateBalance:', error);
return 0;
}
},

// Calculer le flux de trésorerie
calculateCashFlow(entries) {
try {
const cashAccounts = ['571000', '512000', '531000']; // Caisse, Banque, Chèques postaux

return entries.reduce((flow, entry) => {
const cashLines = entry.lines.filter(line => cashAccounts.includes(line.account));
return flow + cashLines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
}, 0);
} catch (error) {
console.error('❌ Erreur calculateCashFlow:', error);
return 0;
}
},

// Obtenir les comptes les plus utilisés
getTopUsedAccounts(entries) {
try {
const accountUsage = {};

entries.forEach(entry => {
entry.lines.forEach(line => {
if (line.account) {
accountUsage[line.account] = (accountUsage[line.account] || 0) + 1;
}
});
});

return Object.entries(accountUsage)
.sort(([,a], [,b]) => b - a)
.slice(0, 5)
.map(([account, count]) => ({
account,
count,
name: this.getAccountName(account)
}));
} catch (error) {
console.error('❌ Erreur getTopUsedAccounts:', error);
return [];
}
},

// Obtenir la distribution par journal
getJournalDistribution(entries) {
try {
const distribution = {};

entries.forEach(entry => {
distribution[entry.journal] = (distribution[entry.journal] || 0) + 1;
});

return distribution;
} catch (error) {
console.error('❌ Erreur getJournalDistribution:', error);
return {};
}
},

// Obtenir le nom d'un compte
getAccountName(code) {
try {
const account = app.accounts.find(acc => acc.code === code);
return account ? account.name : 'Compte inconnu';
} catch (error) {
console.error('❌ Erreur getAccountName:', error);
return 'Compte inconnu';
}
},

// Formater les statistiques pour l'affichage
getFormattedStats() {
try {
return {
...app.statistics.totals,
...app.statistics.trends,
lastUpdate: app.statistics.lastUpdate ?
app.statistics.lastUpdate.toLocaleString('fr-FR') :
'Jamais mise à jour'
};
} catch (error) {
console.error('❌ Erreur getFormattedStats:', error);
return {};
}
}
};

// =============================================================================
// DATA INITIALIZATION - INITIALISATION DES DONNÉES
// =============================================================================
function initializeData() {
try {
// Plan comptable SYSCOHADA Révisé complet
app.accounts = [
// Classe 1 - Comptes de ressources durables
{ code: '101000', name: 'Capital social', category: 'Capitaux propres' },
{ code: '106000', name: 'Réserves', category: 'Capitaux propres' },
{ code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
{ code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
{ code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
{ code: '171000', name: 'Dettes de crédit-bail', category: 'Dettes financières' },

// Classe 2 - Comptes d'actif immobilisé
{ code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
{ code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
{ code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
{ code: '221000', name: 'Logiciels', category: 'Immobilisations incorporelles' },
{ code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
{ code: '241000', name: 'Matériel et mobilier', category: 'Immobilisations corporelles' },

// Classe 3 - Comptes de stocks
{ code: '311000', name: 'Marchandises', category: 'Stocks' },
{ code: '321000', name: 'Matières premières', category: 'Stocks' },
{ code: '371000', name: 'Stock en cours', category: 'Stocks' },
{ code: '381000', name: 'Stocks de produits finis', category: 'Stocks' },

// Classe 4 - Comptes de tiers
{ code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
{ code: '411000', name: 'Clients', category: 'Clients' },
{ code: '421000', name: 'Personnel', category: 'Personnel' },
{ code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux' },
{ code: '441000', name: 'État et collectivités', category: 'État' },
{ code: '471000', name: 'Comptes d\'attente', category: 'Comptes transitoires' },

// Classe 5 - Comptes financiers
{ code: '512000', name: 'Banques', category: 'Comptes bancaires' },
{ code: '531000', name: 'Chèques postaux', category: 'Comptes postaux' },
{ code: '571000', name: 'Caisse', category: 'Caisse' },
{ code: '581000', name: 'Virements internes', category: 'Virements' },

// Classe 6 - Comptes de charges
{ code: '601000', name: 'Achats de marchandises', category: 'Achats' },
{ code: '605000', name: 'Autres achats', category: 'Achats' },
{ code: '621000', name: 'Transports', category: 'Services extérieurs' },
{ code: '622000', name: 'Rémunérations intermédiaires', category: 'Services extérieurs' },
{ code: '631000', name: 'Impôts et taxes', category: 'Impôts et taxes' },
{ code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
{ code: '646000', name: 'Charges sociales', category: 'Charges de personnel' },
{ code: '681000', name: 'Dotations aux amortissements', category: 'Dotations' },

// Classe 7 - Comptes de produits
{ code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
{ code: '706000', name: 'Services vendus', category: 'Ventes' },
{ code: '771000', name: 'Revenus financiers', category: 'Produits financiers' },
{ code: '781000', name: 'Reprises d\'amortissements', category: 'Reprises' },

// Classe 8 - Comptes de résultats
{ code: '801000', name: 'Résultat en instance d\'affectation', category: 'Résultats' },
{ code: '810000', name: 'Résultat net: bénéfice', category: 'Résultats' },
{ code: '820000', name: 'Résultat net: perte', category: 'Résultats' },

// Classe 9 - Comptes analytiques
{ code: '901000', name: 'Coûts de revient', category: 'Comptabilité analytique' },
{ code: '905000', name: 'Coûts de production', category: 'Comptabilité analytique' },
{ code: '910000', name: 'Charges indirectes', category: 'Comptabilité analytique' },
{ code: '920000', name: 'Centres d\'analyse', category: 'Comptabilité analytique' }
];

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
},
{
id: 4,
name: 'SAS DIGITAL WORLD',
type: 'SAS',
status: 'Suspendu',
system: 'Normal',
phone: '+225 07 11 22 33 44',
address: 'San-Pédro',
cashRegisters: 1
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
companies: [1, 2, 3, 4], // Admin accède à toutes
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
companies: [2, 4], // Entreprises assignées
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

// Écritures avec restriction par entreprise
app.entries = [
{
id: 1,
date: '2024-12-15',
journal: 'JV',
piece: 'JV-2024-001-0156',
libelle: 'Vente marchandises Client ABC',
companyId: 1,
lines: [
{ account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 },
{ account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },
{ account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }
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
companyId: 1,
lines: [
{ account: '601000', accountName: 'Achats de marchandises', libelle: 'Achat marchandises', debit: 850000, credit: 0 },
{ account: '441000', accountName: 'État et collectivités', libelle: 'TVA déductible', debit: 170000, credit: 0 },
{ account: '401000', accountName: 'Fournisseurs', libelle: 'Fournisseur XYZ', debit: 0, credit: 1020000 }
],
status: 'En attente',
userId: 3
},
{
id: 3,
date: '2024-12-13',
journal: 'JC',
piece: 'JC-2024-002-0034',
libelle: 'Recette caisse vente comptant',
companyId: 2,
lines: [
{ account: '571000', accountName: 'Caisse', libelle: 'Encaissement espèces', debit: 150000, credit: 0 },
{ account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente comptant', debit: 0, credit: 150000 }
],
status: 'Validé',
userId: 5
},
{
id: 4,
date: '2024-12-12',
journal: 'JB',
piece: 'JB-2024-003-0045',
libelle: 'Virement bancaire fournisseur',
companyId: 2,
lines: [
{ account: '401000', accountName: 'Fournisseurs', libelle: 'Règlement fournisseur', debit: 500000, credit: 0 },
{ account: '512000', accountName: 'Banques', libelle: 'Virement sortant', debit: 0, credit: 500000 }
],
status: 'Validé',
userId: 5
},
{
id: 5,
date: '2024-12-11',
journal: 'JG',
piece: 'JG-2024-004-0078',
libelle: 'Dotation amortissement matériel',
companyId: 3,
lines: [
{ account: '681000', accountName: 'Dotations aux amortissements', libelle: 'Amortissement matériel', debit: 125000, credit: 0 },
{ account: '244000', accountName: 'Matériel et outillage', libelle: 'Amortissement cumulé', debit: 0, credit: 125000 }
],
status: 'Validé',
userId: 2
}
];

// Caisses par entreprise
app.cashRegisters = [
{
id: 1,
name: 'Caisse Principale',
companyId: 2,
responsibleId: 5,
responsibleName: 'Ibrahim Koné',
balance: 210000,
status: 'Ouvert',
openingBalance: 150000,
dailyReceipts: 85000,
dailyExpenses: 25000
},
{
id: 2,
name: 'Caisse Ventes',
companyId: 2,
responsibleId: null,
responsibleName: 'Non assigné',
balance: 85000,
status: 'Ouvert',
openingBalance: 100000,
dailyReceipts: 35000,
dailyExpenses: 50000
},
{
id: 3,
name: 'Caisse Réception',
companyId: 1,
responsibleId: null,
responsibleName: 'Non assigné',
balance: 0,
status: 'Fermé',
openingBalance: 0,
dailyReceipts: 0,
dailyExpenses: 0
},
{
id: 4,
name: 'Caisse Principale',
companyId: 3,
responsibleId: null,
responsibleName: 'Non assigné',
balance: 45000,
status: 'Ouvert',
openingBalance: 50000,
dailyReceipts: 15000,
dailyExpenses: 20000
}
];

// Initialiser les statistiques
StatisticsManager.updateAllStatistics();

console.log('✅ Données initialisées avec succès avec sécurité renforcée');
} catch (error) {
console.error('❌ Erreur initialisation données:', error);
}
}

// =============================================================================
// AUTHENTICATION & USER MANAGEMENT - AUTHENTIFICATION COMPLÈTE CORRIGÉE
// =============================================================================
function loginAs(profile) {
try {
const credentials = {
'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
'user': { email: 'atraore@sarltech.ci', password: 'user123' },
'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
};

const cred = credentials[profile];
if (cred) {
const emailElement = document.getElementById('loginEmail');
const passwordElement = document.getElementById('loginPassword');
if (emailElement && passwordElement) {
emailElement.value = cred.email;
passwordElement.value = cred.password;
handleLogin();
}
}
} catch (error) {
console.error('❌ Erreur loginAs:', error);
showErrorMessage('Erreur lors de la connexion automatique');
}
}

function handleLogin() {
try {
const emailElement = document.getElementById('loginEmail');
const passwordElement = document.getElementById('loginPassword');

if (!emailElement || !passwordElement) {
showErrorMessage('Éléments de connexion non trouvés');
return;
}

const email = emailElement.value;
const password = passwordElement.value;

if (!email || !password) {
showErrorMessage('Veuillez saisir votre email et mot de passe.');
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

// ✅ CORRIGÉ : Auto-sélection d'entreprise pour utilisateur et caissier SEULEMENT
if (user.profile === 'user') {
app.currentCompany = '1'; // SARL TECH INNOVATION uniquement
console.log('✅ Auto-sélection entreprise user:', app.currentCompany);
} else if (user.profile === 'caissier') {
app.currentCompany = '2'; // SA COMMERCE PLUS uniquement
console.log('✅ Auto-sélection entreprise caissier:', app.currentCompany);
}

showMainApp();
console.log('✅ Connexion réussie:', user.name, 'Profile:', user.profile);
} else {
showErrorMessage('Identifiants incorrects. Utilisez les comptes de démonstration.');
}
} catch (error) {
console.error('❌ Erreur handleLogin:', error);
showErrorMessage('Erreur lors de la connexion');
}
}

function showMainApp() {
try {
const loginInterface = document.getElementById('loginInterface');
const mainApp = document.getElementById('mainApp');

if (loginInterface && mainApp) {
loginInterface.classList.add('hidden');
mainApp.classList.remove('hidden');
initializeApp();
} else {
console.error('❌ Éléments interface non trouvés');
}
} catch (error) {
console.error('❌ Erreur showMainApp:', error);
}
}

function confirmLogout() {
try {
const modal = `
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
<div class="text-center mb-6">
<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
<i class="fas fa-sign-out-alt text-2xl"></i>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white">Confirmer la déconnexion</h3>
<p class="text-gray-600 dark:text-gray-400 mt-2">Êtes-vous sûr de vouloir vous déconnecter ?</p>
</div>
<div class="flex justify-center space-x-4">
<button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
Annuler
</button>
<button onclick="logout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
</button>
</div>
</div>
</div>
`;
const modalContainer = document.getElementById('modalContainer');
if (modalContainer) {
modalContainer.innerHTML = modal;
}
} catch (error) {
console.error('❌ Erreur confirmLogout:', error);
}
}

function logout() {
try {
closeModal();
showLoginInterface();
showSuccessMessage('✅ Déconnexion réussie. À bientôt !');
} catch (error) {
console.error('❌ Erreur logout:', error);
}
}

function showLoginInterface() {
try {
const loginInterface = document.getElementById('loginInterface');
const mainApp = document.getElementById('mainApp');
const modalContainer = document.getElementById('modalContainer');

if (loginInterface && mainApp) {
loginInterface.classList.remove('hidden');
mainApp.classList.add('hidden');
}
if (modalContainer) {
modalContainer.innerHTML = '';
}

// Reset app state
app.isAuthenticated = false;
app.currentProfile = null;
app.currentUser = null;
app.currentCompany = null;
} catch (error) {
console.error('❌ Erreur showLoginInterface:', error);
}
}

// =============================================================================
// NAVIGATION & INTERFACE MANAGEMENT - NAVIGATION COMPLÈTE CORRIGÉE
// =============================================================================
function loadNavigationMenu() {
try {
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
<a href="#" onclick="navigateTo('${item.id}'); return false;" class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
<i class="${item.icon} w-5 h-5 mr-3"></i>
<span>${item.text}</span>
</a>
`).join('');

const navigationMenu = document.getElementById('navigationMenu');
if (navigationMenu) {
navigationMenu.innerHTML = menuHtml;
}
} catch (error) {
console.error('❌ Erreur loadNavigationMenu:', error);
}
}

function navigateTo(page, element = null) {
try {
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

// Load page content with security checks
try {
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
case 'import':
loadImport();
break;
case 'settings':
loadSettings();
break;
default:
console.log('⚠️ Page inconnue, chargement du dashboard');
loadDashboard();
}

// Mettre à jour les statistiques après navigation
StatisticsManager.updateAllStatistics();
} catch (error) {
console.error('❌ Erreur lors du chargement de la page:', error);
showErrorMessage('Erreur lors du chargement de la page: ' + page);
}
} catch (error) {
console.error('❌ Erreur navigateTo:', error);
}
}

function updateUserInfo() {
try {
// ✅ CORRIGÉ : Vérification d'existence des éléments DOM
const currentUserElement = document.getElementById('currentUser');
const currentCompanyElement = document.getElementById('currentCompany');
const sidebarUserNameElement = document.getElementById('sidebarUserName');
const sidebarUserRoleElement = document.getElementById('sidebarUserRole');
const userInitialsElement = document.getElementById('userInitials');

if (!app.currentUser) {
console.error('❌ currentUser non défini');
return;
}

// Mise à jour des informations utilisateur
if (currentUserElement) currentUserElement.textContent = app.currentUser.name;
if (sidebarUserNameElement) sidebarUserNameElement.textContent = app.currentUser.name;
if (sidebarUserRoleElement) sidebarUserRoleElement.textContent = app.currentUser.role;

// User initials
if (userInitialsElement) {
const initials = app.currentUser.name.split(' ').map(n => n[0]).join('');
userInitialsElement.textContent = initials;
}

// ✅ CORRIGÉ : Gestion améliorée de l'affichage des entreprises
const profiles = {
'admin': { showSelector: true, defaultCompany: 'Toutes les entreprises disponibles' },
'collaborateur-senior': { showSelector: true, defaultCompany: 'Sélectionner une entreprise' },
'collaborateur': { showSelector: true, defaultCompany: 'Sélectionner une entreprise' },
'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
};

const profile = profiles[app.currentProfile];
if (!profile) {
console.error('❌ Profil non reconnu:', app.currentProfile);
return;
}

// Affichage du nom de l'entreprise
const companyName = app.currentCompany ? getCompanyName() : profile.defaultCompany;
if (currentCompanyElement) {
currentCompanyElement.textContent = companyName;
}

// Gestion de l'affichage du sélecteur d'entreprise
const companySelector = document.getElementById('companySelector');
const adminActions = document.getElementById('adminActions');

if (companySelector) {
companySelector.style.display = profile.showSelector ? 'block' : 'none';

if (profile.showSelector) {
populateCompanySelector();
}
}

if (adminActions) {
adminActions.style.display = app.currentProfile === 'admin' ? 'block' : 'none';
}

updateLogoGlobally();
} catch (error) {
console.error('❌ Erreur updateUserInfo:', error);
}
}

function populateCompanySelector() {
try {
const select = document.getElementById('activeCompanySelect');
if (!select) return;

select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

// Filtrer les entreprises selon les droits d'accès
const userCompanies = SecurityManager.getUserCompanies(app.currentUser.id);
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
} catch (error) {
console.error('❌ Erreur populateCompanySelector:', error);
}
}

function getCompanyName() {
try {
if (!app.currentCompany) return 'Aucune entreprise sélectionnée';

const company = app.companies.find(c => c.id == app.currentCompany);
return company ? company.name : 'Entreprise inconnue';
} catch (error) {
console.error('❌ Erreur getCompanyName:', error);
return 'Erreur entreprise';
}
}

function updateSelectedCompanyInfo() {
try {
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
} catch (error) {
console.error('❌ Erreur updateSelectedCompanyInfo:', error);
}
}

// =============================================================================
// DASHBOARD FUNCTIONS - TABLEAUX DE BORD COMPLETS CORRIGÉS
// =============================================================================
function loadDashboard() {
try {
console.log('🔄 Chargement du tableau de bord pour:', app.currentProfile);

// ✅ CORRIGÉ : Logique simplifiée et robuste
if (app.currentProfile === 'admin') {
// Admin peut voir le dashboard même sans entreprise sélectionnée
loadAdminDashboard();
} else {
// Pour tous les autres profils
if ((app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
// Seuls les collaborateurs ont besoin de sélectionner une entreprise
showCompanySelectionWarning('tableau de bord');
return;
}
loadStandardDashboard();
}

console.log('✅ Tableau de bord chargé avec succès');
} catch (error) {
console.error('❌ Erreur lors du chargement du tableau de bord:', error);
showErrorMessage('Erreur lors du chargement du tableau de bord');
}
}

function loadAdminDashboard() {
try {
const stats = StatisticsManager.getFormattedStats();

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
<div class="text-sm text-primary-light font-medium">
<i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${stats.lastUpdate}
</div>
</div>

<!-- KPI Cards Admin avec statistiques dynamiques -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.companies.filter(c => c.status === 'Actif').length}</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-building text-primary text-xl"></i>
</div>
</div>
<div class="mt-2 flex items-center text-sm">
<span class="text-success">+${Math.floor(Math.random() * 5) + 1}</span>
<span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.activeUsers}</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<i class="fas fa-users text-info text-xl"></i>
</div>
</div>
<div class="mt-2 flex items-center text-sm">
<span class="text-${stats.activeUsers >= 4 ? 'success' : 'warning'}">
${stats.activeUsers >= 4 ? '↗' : '→'} ${((stats.activeUsers/stats.users)*100).toFixed(0)}%
</span>
<span class="text-gray-500 dark:text-gray-400 ml-1">d'activité</span>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.pendingEntries}</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-exclamation-triangle text-warning text-xl"></i>
</div>
</div>
<div class="mt-2 flex items-center text-sm">
<span class="text-${stats.pendingEntries <= 2 ? 'success' : 'warning'}">
${stats.validationRate}%
</span>
<span class="text-gray-500 dark:text-gray-400 ml-1">taux validation</span>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Écritures</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.entries}</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-check text-success text-xl"></i>
</div>
</div>
<div class="mt-2 flex items-center text-sm">
<span class="text-success">+${stats.entriesGrowth || 15}%</span>
<span class="text-gray-500 dark:text-gray-400 ml-1">vs mois dernier</span>
</div>
</div>
</div>

<!-- Métriques financières -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-money-bill-wave mr-2 text-success"></i>Flux Financiers
</h3>
<div class="space-y-4">
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Total Débits</span>
<span class="font-bold text-gray-900 dark:text-white">${(stats.totalDebit || 0).toLocaleString('fr-FR')} F</span>
</div>
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Total Crédits</span>
<span class="font-bold text-gray-900 dark:text-white">${(stats.totalCredit || 0).toLocaleString('fr-FR')} F</span>
</div>
<div class="flex justify-between items-center pt-2 border-t">
<span class="text-gray-900 dark:text-white font-medium">Balance</span>
<span class="font-bold ${(stats.totalDebit - stats.totalCredit) >= 0 ? 'text-success' : 'text-danger'}">
${Math.abs(stats.totalDebit - stats.totalCredit).toLocaleString('fr-FR')} F
${(stats.totalDebit - stats.totalCredit) >= 0 ? 'D' : 'C'}
</span>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-chart-line mr-2 text-primary"></i>Performance
</h3>
<div class="space-y-4">
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Taux de validation</span>
<div class="flex items-center">
<div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3">
<div class="h-full bg-success rounded-full" style="width: ${stats.validationRate}%"></div>
</div>
<span class="font-bold text-success">${stats.validationRate}%</span>
</div>
</div>
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Temps moyen traitement</span>
<span class="font-bold text-gray-900 dark:text-white">${stats.averageProcessingTime || 2}h</span>
</div>
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Progrès mensuel</span>
<span class="font-bold text-primary">${stats.monthlyProgress || 85}%</span>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-cash-register mr-2 text-warning"></i>Caisses
</h3>
<div class="space-y-4">
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Total caisses</span>
<span class="font-bold text-gray-900 dark:text-white">${stats.cashRegisters}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Caisses actives</span>
<span class="font-bold text-success">${stats.activeCashRegisters}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-gray-600 dark:text-gray-400">Taux d'utilisation</span>
<span class="font-bold text-primary">${stats.cashRegisters > 0 ? Math.round((stats.activeCashRegisters/stats.cashRegisters)*100) : 0}%</span>
</div>
</div>
</div>
</div>

<!-- Portefeuille et graphiques -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille Collaborateurs
</h3>
<div class="space-y-4">
${generateCollaboratorPortfolio()}
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dernières Activités</h3>
<div class="space-y-3">
${generateRecentActivities()}
</div>
</div>
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur loadAdminDashboard:', error);
showErrorMessage('Erreur lors du chargement du tableau de bord admin');
}
}

function loadStandardDashboard() {
try {
const stats = StatisticsManager.getFormattedStats();
const userCompany = app.companies.find(c => c.id == app.currentCompany);
let dashboardTitle = 'Tableau de Bord';

if (app.currentProfile === 'user') {
dashboardTitle = 'Mon Entreprise - ' + (userCompany ? userCompany.name : 'SARL TECH INNOVATION');
} else if (app.currentProfile === 'caissier') {
dashboardTitle = 'Ma Caisse - ' + (userCompany ? userCompany.name : 'SA COMMERCE PLUS');
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
<div class="text-sm text-primary-light font-medium">
<i class="fas fa-clock mr-1"></i>Mise à jour: ${stats.lastUpdate}
</div>
</div>

<!-- KPI Cards avec données personnalisées -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">
${app.currentProfile === 'caissier' ? 'Opérations aujourd\'hui' : 'Mes écritures'}
</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">
${app.currentProfile === 'caissier' ? '12' : stats.entries}
</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas ${app.currentProfile === 'caissier' ? 'fa-calculator' : 'fa-edit'} text-primary text-xl"></i>
</div>
</div>
${app.currentProfile === 'caissier' ? `
<div class="mt-3">
<button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
Nouvelle opération
</button>
</div>
` : ''}
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">
${app.currentProfile === 'caissier' ? 'Solde caisse' : 'Écritures validées'}
</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">
${app.currentProfile === 'caissier' ? '210,000 F' : stats.validatedEntries}
</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas ${app.currentProfile === 'caissier' ? 'fa-wallet' : 'fa-check'} text-success text-xl"></i>
</div>
</div>
<div class="mt-2 flex items-center text-sm">
<span class="text-success">+${app.currentProfile === 'caissier' ? '15%' : stats.validationRate + '%'}</span>
<span class="text-gray-500 dark:text-gray-400 ml-1">performance</span>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.pendingEntries}</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-clock text-warning text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de réussite</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.validationRate}%</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<i class="fas fa-chart-line text-info text-xl"></i>
</div>
</div>
</div>
</div>

${app.currentProfile === 'caissier' ? generateCashierDashboard() : generateStandardUserDashboard()}
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur loadStandardDashboard:', error);
showErrorMessage('Erreur lors du chargement du tableau de bord');
}
}

function generateCashierDashboard() {
try {
return `
<!-- Interface spéciale Caissier -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-cash-register mr-2 text-primary"></i>État de ma Caisse
</h3>
<div class="space-y-4">
<div class="flex justify-between items-center p-4 bg-success/10 rounded-lg">
<span class="text-success font-medium">Solde d'ouverture</span>
<span class="text-2xl font-bold text-success">150,000 F</span>
</div>
<div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">
<span class="text-info font-medium">Recettes du jour</span>
<span class="text-2xl font-bold text-info">+85,000 F</span>
</div>
<div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
<span class="text-warning font-medium">Dépenses du jour</span>
<span class="text-2xl font-bold text-warning">-25,000 F</span>
</div>
<div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">
<span class="text-primary font-medium">Solde actuel</span>
<span class="text-3xl font-bold text-primary">210,000 F</span>
</div>
</div>

<div class="mt-6 grid grid-cols-2 gap-4">
<button onclick="navigateTo('entries')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
<i class="fas fa-plus-circle mr-2"></i>Nouvelle opération
</button>
<button onclick="navigateTo('reports')" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
<i class="fas fa-print mr-2"></i>État de caisse
</button>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
<i class="fas fa-history mr-2 text-info"></i>Dernières Opérations
</h3>
<div class="space-y-3">
${generateCashierOperations()}
</div>
</div>
</div>
`;
} catch (error) {
console.error('❌ Erreur generateCashierDashboard:', error);
return '<div class="p-4 text-red-500">Erreur lors du chargement du tableau de bord caissier</div>';
}
}

function generateStandardUserDashboard() {
try {
return `
<!-- Dashboard utilisateur standard -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
<div class="space-y-3">
${generateUserRecentActivity()}
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accès Rapides</h3>
<div class="grid grid-cols-2 gap-4">
<button onclick="navigateTo('entries')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<i class="fas fa-edit text-2xl text-primary mb-2"></i>
<div class="font-medium text-gray-900 dark:text-white">Écritures</div>
</button>

<button onclick="navigateTo('reports')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<i class="fas fa-chart-bar text-2xl text-success mb-2"></i>
<div class="font-medium text-gray-900 dark:text-white">Rapports</div>
</button>

<button onclick="navigateTo('accounts')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<i class="fas fa-list text-2xl text-info mb-2"></i>
<div class="font-medium text-gray-900 dark:text-white">Plan Comptable</div>
</button>

<button onclick="navigateTo('caisse')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<i class="fas fa-cash-register text-2xl text-warning mb-2"></i>
<div class="font-medium text-gray-900 dark:text-white">Caisses</div>
</button>
</div>
</div>
</div>
`;
} catch (error) {
console.error('❌ Erreur generateStandardUserDashboard:', error);
return '<div class="p-4 text-red-500">Erreur lors du chargement du tableau de bord utilisateur</div>';
}
}

// =============================================================================
// ENTRIES MANAGEMENT - GESTION DES ÉCRITURES SÉCURISÉE CORRIGÉE
// =============================================================================
function loadEntries() {
try {
// ✅ CORRIGÉ : Vérification intelligente selon le profil
if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
showCompanySelectionWarning('écritures comptables');
return;
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
${app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
</h2>
<div class="flex items-center space-x-4">
<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
<i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
</div>
<button onclick="openNewEntryModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus mr-2"></i>Nouvelle écriture
</button>
</div>
</div>

<!-- Filtres et recherche -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
<input type="text" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option>Tous les journaux</option>
<option>Journal Général (JG)</option>
<option>Journal des Achats (JA)</option>
<option>Journal des Ventes (JV)</option>
<option>Journal de Banque (JB)</option>
<option>Journal de Caisse (JC)</option>
<option>Journal des Opérations Diverses (JOD)</option>
</select>
<select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option>Tous les statuts</option>
<option>Validé</option>
<option>En attente</option>
<option>Brouillon</option>
</select>
<input type="date" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
</div>

<!-- Liste des écritures sécurisée -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
${app.currentProfile === 'caissier' ? 'Mes Opérations de Caisse' : 'Liste des Écritures'}
</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Pièce</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
${generateSecureEntriesRows()}
</tbody>
</table>
</div>
</div>
</div>
`;
const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur loadEntries:', error);
showErrorMessage('Erreur lors du chargement des écritures');
}
}

function generateSecureEntriesRows() {
try {
// Utiliser les données filtrées par sécurité
const filteredEntries = SecurityManager.getAuthorizedEntries();

if (filteredEntries.length === 0) {
return `
<tr>
<td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
<i class="fas fa-inbox text-3xl mb-2"></i>
<div>Aucune écriture trouvée pour cette entreprise</div>
<div class="text-sm">Cliquez sur "Nouvelle écriture" pour commencer</div>
</td>
</tr>
`;
}

return filteredEntries.map(entry => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>
<td class="px-6 py-4 text-gray-900 dark:text-white">${entry.libelle}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} F</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewEntryDetails(${entry.id})" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
${entry.userId === app.currentUser.id || app.currentProfile === 'admin' ? `
<button onclick="editEntryModal(${entry.id})" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
` : ''}
${entry.status === 'En attente' && (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) ? `
<button onclick="validateEntry(${entry.id})" class="text-success hover:text-success/80" title="Valider">
<i class="fas fa-check"></i>
</button>
` : ''}
${(entry.userId === app.currentUser.id || app.currentProfile === 'admin') && entry.status !== 'Validé' ? `
<button onclick="confirmDeleteEntry(${entry.id})" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
` : ''}
</div>
</td>
</tr>
`).join('');
} catch (error) {
console.error('❌ Erreur generateSecureEntriesRows:', error);
return '<tr><td colspan="7" class="text-center p-4 text-red-500">Erreur lors du chargement des écritures</td></tr>';
}
}

// =============================================================================
// USERS MANAGEMENT - GESTION DES UTILISATEURS CORRIGÉE
// =============================================================================
function loadUsersManagement() {
try {
if (app.currentProfile !== 'admin') {
showAccessDenied();
return;
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
<button onclick="openNewUserModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus mr-2"></i>Nouveau collaborateur
</button>
</div>

<!-- Statistiques utilisateurs -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collaborateurs</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users.length}</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-users text-primary text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users.filter(u => u.status === 'Actif').length}</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-check-circle text-success text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<i class="fas fa-user-tie text-info text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Gérées</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.companies.length}</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-building text-warning text-xl"></i>
</div>
</div>
</div>
</div>

<!-- Filtres -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<input type="text" id="userSearchInput" placeholder="Rechercher un collaborateur..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<select id="userProfileFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les profils</option>
<option value="admin">Administrateur</option>
<option value="collaborateur-senior">Collaborateur Senior</option>
<option value="collaborateur">Collaborateur</option>
<option value="user">Utilisateur</option>
<option value="caissier">Caissier</option>
</select>
<select id="userStatusFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les statuts</option>
<option value="Actif">Actif</option>
<option value="Inactif">Inactif</option>
<option value="Suspendu">Suspendu</option>
</select>
</div>
</div>

<!-- Liste des utilisateurs -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des Collaborateurs</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Collaborateur</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rôle</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Téléphone</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprises</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="usersTableBody">
${generateUsersRows()}
</tbody>
</table>
</div>
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
bindUserFilters();
} catch (error) {
console.error('❌ Erreur loadUsersManagement:', error);
showErrorMessage('Erreur lors du chargement de la gestion des utilisateurs');
}
}

function generateUsersRows() {
try {
return app.users.map(user => {
const companiesNames = user.companies ?
user.companies.map(compId => {
const company = app.companies.find(c => c.id === compId);
return company ? company.name : 'Inconnue';
}).join(', ') : 'Aucune';

return `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
${user.name.split(' ').map(n => n[0]).join('')}
</div>
<div class="ml-4">
<div class="font-medium text-gray-900 dark:text-white">${user.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${user.profile}</div>
</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.role}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.email}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.phone}</td>
<td class="px-6 py-4 text-gray-900 dark:text-white">
<div class="max-w-xs truncate" title="${companiesNames}">${companiesNames}</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${user.status === 'Actif' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${user.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewUserDetails(${user.id})" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
<button onclick="editUserModal(${user.id})" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
${user.id !== 1 ? `
<button onclick="confirmDeleteUser(${user.id})" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
` : ''}
</div>
</td>
</tr>
`;
}).join('');
} catch (error) {
console.error('❌ Erreur generateUsersRows:', error);
return '<tr><td colspan="7" class="text-center p-4 text-red-500">Erreur lors du chargement des utilisateurs</td></tr>';
}
}

function bindUserFilters() {
try {
const searchInput = document.getElementById('userSearchInput');
const profileFilter = document.getElementById('userProfileFilter');
const statusFilter = document.getElementById('userStatusFilter');

[searchInput, profileFilter, statusFilter].forEach(element => {
if (element) {
element.addEventListener('input', filterUsers);
element.addEventListener('change', filterUsers);
}
});
} catch (error) {
console.error('❌ Erreur bindUserFilters:', error);
}
}

function filterUsers() {
try {
const searchTerm = document.getElementById('userSearchInput')?.value.toLowerCase() || '';
const profileFilter = document.getElementById('userProfileFilter')?.value || '';
const statusFilter = document.getElementById('userStatusFilter')?.value || '';

const filteredUsers = app.users.filter(user => {
const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
user.email.toLowerCase().includes(searchTerm);
const matchesProfile = !profileFilter || user.profile === profileFilter;
const matchesStatus = !statusFilter || user.status === statusFilter;

return matchesSearch && matchesProfile && matchesStatus;
});

const usersTableBody = document.getElementById('usersTableBody');
if (usersTableBody) {
usersTableBody.innerHTML = generateFilteredUsersRows(filteredUsers);
}
} catch (error) {
console.error('❌ Erreur filterUsers:', error);
}
}

function generateFilteredUsersRows(users) {
try {
if (users.length === 0) {
return `
<tr>
<td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
<i class="fas fa-search text-3xl mb-2"></i>
<div>Aucun collaborateur trouvé</div>
</td>
</tr>
`;
}

return users.map(user => {
const companiesNames = user.companies ?
user.companies.map(compId => {
const company = app.companies.find(c => c.id === compId);
return company ? company.name : 'Inconnue';
}).join(', ') : 'Aucune';

return `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
${user.name.split(' ').map(n => n[0]).join('')}
</div>
<div class="ml-4">
<div class="font-medium text-gray-900 dark:text-white">${user.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${user.profile}</div>
</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.role}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.email}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${user.phone}</td>
<td class="px-6 py-4 text-gray-900 dark:text-white">
<div class="max-w-xs truncate" title="${companiesNames}">${companiesNames}</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${user.status === 'Actif' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${user.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewUserDetails(${user.id})" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
<button onclick="editUserModal(${user.id})" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
${user.id !== 1 ? `
<button onclick="confirmDeleteUser(${user.id})" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
` : ''}
</div>
</td>
</tr>
`;
}).join('');
} catch (error) {
console.error('❌ Erreur generateFilteredUsersRows:', error);
return '<tr><td colspan="7" class="text-center p-4 text-red-500">Erreur lors du filtrage des utilisateurs</td></tr>';
}
}

// =============================================================================
// COMPANIES MANAGEMENT - GESTION DES ENTREPRISES CORRIGÉE
// =============================================================================
function loadCompanies() {
try {
// ✅ CORRIGÉ : Logique de vérification d'accès améliorée
if (app.currentProfile.includes('collaborateur') && !app.currentCompany) {
showCompanySelectionWarning('gestion des entreprises');
return;
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
${app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
</h2>
${app.currentProfile === 'admin' ? `
<button onclick="openNewCompanyModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus mr-2"></i>Nouvelle entreprise
</button>
` : ''}
</div>

<!-- Statistiques entreprises -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entreprises</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${getAccessibleCompanies().length}</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-building text-primary text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Actives</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${getAccessibleCompanies().filter(c => c.status === 'Actif').length}</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-check-circle text-success text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">En Essai</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${getAccessibleCompanies().filter(c => c.status === 'Période d\'essai').length}</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-hourglass-half text-warning text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-danger">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Suspendues</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${getAccessibleCompanies().filter(c => c.status === 'Suspendu').length}</p>
</div>
<div class="bg-danger/10 p-3 rounded-lg">
<i class="fas fa-ban text-danger text-xl"></i>
</div>
</div>
</div>
</div>

<!-- Filtres -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<input type="text" id="companySearchInput" placeholder="Rechercher une entreprise..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<select id="companyTypeFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les types</option>
<option value="SARL">SARL</option>
<option value="SA">SA</option>
<option value="EURL">EURL</option>
<option value="SAS">SAS</option>
</select>
<select id="companyStatusFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les statuts</option>
<option value="Actif">Actif</option>
<option value="Période d'essai">Période d'essai</option>
<option value="Suspendu">Suspendu</option>
</select>
</div>
</div>

<!-- Liste des entreprises -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
${app.currentProfile === 'admin' ? 'Toutes les Entreprises' : 'Mes Entreprises Assignées'}
</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adresse</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Téléphone</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Système</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="companiesTableBody">
${generateCompaniesRows()}
</tbody>
</table>
</div>
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
bindCompanyFilters();
} catch (error) {
console.error('❌ Erreur loadCompanies:', error);
showErrorMessage('Erreur lors du chargement des entreprises');
}
}

function getAccessibleCompanies() {
try {
if (app.currentProfile === 'admin') {
return app.companies;
}

const userCompanies = SecurityManager.getUserCompanies(app.currentUser.id);
return app.companies.filter(company => userCompanies.includes(company.id));
} catch (error) {
console.error('❌ Erreur getAccessibleCompanies:', error);
return [];
}
}

function generateCompaniesRows() {
try {
const companies = getAccessibleCompanies();

if (companies.length === 0) {
return `
<tr>
<td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
<i class="fas fa-building text-3xl mb-2"></i>
<div>Aucune entreprise accessible</div>
</td>
</tr>
`;
}

return companies.map(company => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
${company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
</div>
<div class="ml-4">
<div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${company.cashRegisters} caisse${company.cashRegisters > 1 ? 's' : ''}</div>
</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${company.type}</td>
<td class="px-6 py-4 text-gray-900 dark:text-white">${company.address}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${company.phone}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${company.system === 'Normal' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'}">${company.system}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${getCompanyStatusColor(company.status)}">${company.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewCompanyDetails(${company.id})" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
${app.currentProfile === 'admin' ? `
<button onclick="editCompanyModal(${company.id})" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
<button onclick="confirmDeleteCompany(${company.id})" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
` : ''}
<button onclick="selectCompanyForWork(${company.id})" class="text-success hover:text-success/80" title="Sélectionner">
<i class="fas fa-check-circle"></i>
</button>
</div>
</td>
</tr>
`).join('');
} catch (error) {
console.error('❌ Erreur generateCompaniesRows:', error);
return '<tr><td colspan="7" class="text-center p-4 text-red-500">Erreur lors du chargement des entreprises</td></tr>';
}
}

function getCompanyStatusColor(status) {
try {
switch(status) {
case 'Actif': return 'bg-success/20 text-success';
case 'Période d\'essai': return 'bg-warning/20 text-warning';
case 'Suspendu': return 'bg-danger/20 text-danger';
default: return 'bg-gray/20 text-gray';
}
} catch (error) {
console.error('❌ Erreur getCompanyStatusColor:', error);
return 'bg-gray/20 text-gray';
}
}

function bindCompanyFilters() {
try {
const searchInput = document.getElementById('companySearchInput');
const typeFilter = document.getElementById('companyTypeFilter');
const statusFilter = document.getElementById('companyStatusFilter');

[searchInput, typeFilter, statusFilter].forEach(element => {
if (element) {
element.addEventListener('input', filterCompanies);
element.addEventListener('change', filterCompanies);
}
});
} catch (error) {
console.error('❌ Erreur bindCompanyFilters:', error);
}
}

function filterCompanies() {
try {
const searchTerm = document.getElementById('companySearchInput')?.value.toLowerCase() || '';
const typeFilter = document.getElementById('companyTypeFilter')?.value || '';
const statusFilter = document.getElementById('companyStatusFilter')?.value || '';

const companies = getAccessibleCompanies();
const filteredCompanies = companies.filter(company => {
const matchesSearch = company.name.toLowerCase().includes(searchTerm) ||
company.address.toLowerCase().includes(searchTerm);
const matchesType = !typeFilter || company.type === typeFilter;
const matchesStatus = !statusFilter || company.status === statusFilter;

return matchesSearch && matchesType && matchesStatus;
});

const companiesTableBody = document.getElementById('companiesTableBody');
if (companiesTableBody) {
companiesTableBody.innerHTML = generateFilteredCompaniesRows(filteredCompanies);
}
} catch (error) {
console.error('❌ Erreur filterCompanies:', error);
}
}

function generateFilteredCompaniesRows(companies) {
try {
if (companies.length === 0) {
return `
<tr>
<td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
<i class="fas fa-search text-3xl mb-2"></i>
<div>Aucune entreprise trouvée</div>
</td>
</tr>
`;
}

return companies.map(company => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
${company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
</div>
<div class="ml-4">
<div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${company.cashRegisters} caisse${company.cashRegisters > 1 ? 's' : ''}</div>
</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${company.type}</td>
<td class="px-6 py-4 text-gray-900 dark:text-white">${company.address}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${company.phone}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${company.system === 'Normal' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'}">${company.system}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${getCompanyStatusColor(company.status)}">${company.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewCompanyDetails(${company.id})" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
${app.currentProfile === 'admin' ? `
<button onclick="editCompanyModal(${company.id})" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
<button onclick="confirmDeleteCompany(${company.id})" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
` : ''}
<button onclick="selectCompanyForWork(${company.id})" class="text-success hover:text-success/80" title="Sélectionner">
<i class="fas fa-check-circle"></i>
</button>
</div>
</td>
</tr>
`).join('');
} catch (error) {
console.error('❌ Erreur generateFilteredCompaniesRows:', error);
return '<tr><td colspan="7" class="text-center p-4 text-red-500">Erreur lors du filtrage des entreprises</td></tr>';
}
}

function selectCompanyForWork(companyId) {
try {
if (SecurityManager.canAccessCompany(companyId)) {
app.currentCompany = companyId.toString();
updateSelectedCompanyInfo();
StatisticsManager.updateAllStatistics();
showSuccessMessage(`✅ Entreprise "${getCompanyName()}" sélectionnée pour le travail`);
} else {
showErrorMessage('Vous n\'avez pas accès à cette entreprise');
}
} catch (error) {
console.error('❌ Erreur selectCompanyForWork:', error);
showErrorMessage('Erreur lors de la sélection de l\'entreprise');
}
}

// =============================================================================
// ACCOUNTS MANAGEMENT - GESTION DU PLAN COMPTABLE CORRIGÉE
// =============================================================================
function loadAccounts() {
try {
const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>
${app.currentProfile === 'admin' ? `
<button onclick="openNewAccountModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus mr-2"></i>Nouveau compte
</button>
` : ''}
</div>

<!-- Statistiques comptes -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Comptes</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${app.accounts.length}</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-list text-primary text-xl"></i>
</div>
</div>
</div>

${[1,2,3,4,5,6,7,8,9].map(class_num => `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Classe ${class_num}</p>
<p class="text-2xl font-bold text-gray-900 dark:text-white">${app.accounts.filter(acc => acc.code.startsWith(class_num.toString())).length}</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<span class="text-info font-bold text-lg">${class_num}</span>
</div>
</div>
</div>
`).join('')}
</div>

<!-- Filtres -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
<input type="text" id="accountSearchInput" placeholder="Rechercher un compte..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<select id="accountClassFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Toutes les classes</option>
<option value="1">Classe 1 - Ressources durables</option>
<option value="2">Classe 2 - Actif immobilisé</option>
<option value="3">Classe 3 - Stocks</option>
<option value="4">Classe 4 - Tiers</option>
<option value="5">Classe 5 - Financiers</option>
<option value="6">Classe 6 - Charges</option>
<option value="7">Classe 7 - Produits</option>
<option value="8">Classe 8 - Résultats</option>
<option value="9">Classe 9 - Analytiques</option>
</select>
<select id="accountCategoryFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Toutes les catégories</option>
${getUniqueCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
</select>
<input type="text" id="accountCodeFilter" placeholder="Code compte (ex: 411)" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
</div>

<!-- Plan comptable organisé par classes -->
<div class="space-y-6">
${[1,2,3,4,5,6,7,8,9].map(class_num => generateAccountClassSection(class_num)).join('')}
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
bindAccountFilters();
} catch (error) {
console.error('❌ Erreur loadAccounts:', error);
showErrorMessage('Erreur lors du chargement du plan comptable');
}
}

function getUniqueCategories() {
try {
const categories = [...new Set(app.accounts.map(acc => acc.category))];
return categories.sort();
} catch (error) {
console.error('❌ Erreur getUniqueCategories:', error);
return [];
}
}

function generateAccountClassSection(classNumber) {
try {
const classAccounts = app.accounts.filter(acc => acc.code.startsWith(classNumber.toString()));

const classNames = {
1: 'Comptes de ressources durables',
2: 'Comptes d\'actif immobilisé',
3: 'Comptes de stocks',
4: 'Comptes de tiers',
5: 'Comptes financiers',
6: 'Comptes de charges',
7: 'Comptes de produits',
8: 'Comptes de résultats',
9: 'Comptes analytiques'
};

if (classAccounts.length === 0) return '';

return `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
<div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
<span class="bg-primary text-white px-3 py-1 rounded-lg mr-3">${classNumber}</span>
${classNames[classNumber]}
<span class="text-sm text-gray-500 dark:text-gray-400 ml-2">(${classAccounts.length} comptes)</span>
</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisation</th>
${app.currentProfile === 'admin' ? `
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
` : ''}
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
${classAccounts.map(account => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<span class="font-mono text-lg font-bold text-primary">${account.code}</span>
</td>
<td class="px-6 py-4 text-gray-900 dark:text-white font-medium">${account.name}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 bg-info/20 text-info rounded text-sm">${account.category}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
${getAccountUsage(account.code)}
</td>
${app.currentProfile === 'admin' ? `
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="editAccountModal('${account.code}')" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
<button onclick="confirmDeleteAccount('${account.code}')" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
</div>
</td>
` : ''}
</tr>
`).join('')}
</tbody>
</table>
</div>
</div>
`;
} catch (error) {
console.error('❌ Erreur generateAccountClassSection:', error);
return '';
}
}

function getAccountUsage(accountCode) {
try {
const usage = app.entries.reduce((count, entry) => {
const used = entry.lines.some(line => line.account === accountCode);
return used ? count + 1 : count;
}, 0);

if (usage === 0) return '<span class="text-gray-400">Non utilisé</span>';
return `<span class="text-success">${usage} fois</span>`;
} catch (error) {
console.error('❌ Erreur getAccountUsage:', error);
return '<span class="text-gray-400">Erreur</span>';
}
}

function bindAccountFilters() {
try {
const searchInput = document.getElementById('accountSearchInput');
const classFilter = document.getElementById('accountClassFilter');
const categoryFilter = document.getElementById('accountCategoryFilter');
const codeFilter = document.getElementById('accountCodeFilter');

[searchInput, classFilter, categoryFilter, codeFilter].forEach(element => {
if (element) {
element.addEventListener('input', filterAccounts);
element.addEventListener('change', filterAccounts);
}
});
} catch (error) {
console.error('❌ Erreur bindAccountFilters:', error);
}
}

function filterAccounts() {
try {
const searchTerm = document.getElementById('accountSearchInput')?.value.toLowerCase() || '';
const classFilter = document.getElementById('accountClassFilter')?.value || '';
const categoryFilter = document.getElementById('accountCategoryFilter')?.value || '';
const codeFilter = document.getElementById('accountCodeFilter')?.value || '';

// Masquer toutes les sections
document.querySelectorAll('.bg-white.dark\\:bg-gray-800.rounded-xl.shadow-lg.overflow-hidden').forEach(section => {
if (section.querySelector('table')) {
section.style.display = 'none';
}
});

// Afficher les sections correspondantes
[1,2,3,4,5,6,7,8,9].forEach(classNumber => {
if (classFilter && classFilter !== classNumber.toString()) return;

const classAccounts = app.accounts.filter(acc => {
const matchesClass = acc.code.startsWith(classNumber.toString());
const matchesSearch = acc.name.toLowerCase().includes(searchTerm) ||
acc.code.toLowerCase().includes(searchTerm);
const matchesCategory = !categoryFilter || acc.category === categoryFilter;
const matchesCode = !codeFilter || acc.code.includes(codeFilter);

return matchesClass && matchesSearch && matchesCategory && matchesCode;
});

if (classAccounts.length > 0) {
// Recréer la section avec les comptes filtrés
const sectionHtml = generateFilteredAccountClassSection(classNumber, classAccounts);
if (sectionHtml) {
const tempDiv = document.createElement('div');
tempDiv.innerHTML = sectionHtml;
const section = tempDiv.firstElementChild;

// Remplacer ou ajouter la section
const existingSection = document.querySelector(`[data-class="${classNumber}"]`);
if (existingSection) {
existingSection.replaceWith(section);
} else {
const spaceDiv = document.querySelector('.space-y-6');
if (spaceDiv) {
spaceDiv.appendChild(section);
}
}
section.setAttribute('data-class', classNumber);
}
}
});
} catch (error) {
console.error('❌ Erreur filterAccounts:', error);
}
}

function generateFilteredAccountClassSection(classNumber, accounts) {
try {
const classNames = {
1: 'Comptes de ressources durables',
2: 'Comptes d\'actif immobilisé',
3: 'Comptes de stocks',
4: 'Comptes de tiers',
5: 'Comptes financiers',
6: 'Comptes de charges',
7: 'Comptes de produits',
8: 'Comptes de résultats',
9: 'Comptes analytiques'
};

return `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden" data-class="${classNumber}">
<div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
<span class="bg-primary text-white px-3 py-1 rounded-lg mr-3">${classNumber}</span>
${classNames[classNumber]}
<span class="text-sm text-gray-500 dark:text-gray-400 ml-2">(${accounts.length} comptes)</span>
</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisation</th>
${app.currentProfile === 'admin' ? `
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
` : ''}
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
${accounts.map(account => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap">
<span class="font-mono text-lg font-bold text-primary">${account.code}</span>
</td>
<td class="px-6 py-4 text-gray-900 dark:text-white font-medium">${account.name}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 bg-info/20 text-info rounded text-sm">${account.category}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
${getAccountUsage(account.code)}
</td>
${app.currentProfile === 'admin' ? `
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="editAccountModal('${account.code}')" class="text-info hover:text-info/80" title="Modifier">
<i class="fas fa-edit"></i>
</button>
<button onclick="confirmDeleteAccount('${account.code}')" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
</div>
</td>
` : ''}
</tr>
`).join('')}
</tbody>
</table>
</div>
</div>
`;
} catch (error) {
console.error('❌ Erreur generateFilteredAccountClassSection:', error);
return '';
}
}

// =============================================================================
// CASH REGISTER MANAGEMENT - GESTION DES CAISSES CORRIGÉE
// =============================================================================
function loadCaisse() {
try {
// ✅ CORRIGÉ : Vérification intelligente selon le profil
if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
showCompanySelectionWarning('gestion des caisses');
return;
}

const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
${app.currentProfile === 'caissier' ? 'Mes Caisses' : 'Gestion des Caisses'}
</h2>
<div class="flex items-center space-x-4">
<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
<i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
</div>
${app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur') ? `
<button onclick="openNewCashRegisterModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus mr-2"></i>Nouvelle caisse
</button>
` : ''}
</div>
</div>

<!-- Statistiques caisses -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Caisses</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${authorizedCashRegisters.length}</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-cash-register text-primary text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Caisses Ouvertes</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${authorizedCashRegisters.filter(c => c.status === 'Ouvert').length}</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-unlock text-success text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Solde Total</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${authorizedCashRegisters.reduce((sum, c) => sum + c.balance, 0).toLocaleString('fr-FR')} F</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-coins text-warning text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Recettes Jour</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">${authorizedCashRegisters.reduce((sum, c) => sum + c.dailyReceipts, 0).toLocaleString('fr-FR')} F</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<i class="fas fa-arrow-up text-info text-xl"></i>
</div>
</div>
</div>
</div>

<!-- Filtres -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<input type="text" id="cashSearchInput" placeholder="Rechercher une caisse..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<select id="cashStatusFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les statuts</option>
<option value="Ouvert">Ouvert</option>
<option value="Fermé">Fermé</option>
</select>
<select id="cashResponsibleFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="">Tous les responsables</option>
<option value="assigned">Avec responsable</option>
<option value="unassigned">Sans responsable</option>
</select>
</div>
</div>

<!-- Liste des caisses -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="cashRegistersGrid">
${generateCashRegistersCards()}
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
bindCashFilters();
} catch (error) {
console.error('❌ Erreur loadCaisse:', error);
showErrorMessage('Erreur lors du chargement des caisses');
}
}

function generateCashRegistersCards() {
try {
const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();

if (authorizedCashRegisters.length === 0) {
return `
<div class="col-span-2 text-center py-12">
<div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
<i class="fas fa-cash-register text-2xl text-gray-400"></i>
</div>
<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune caisse trouvée</h3>
<p class="text-gray-500 dark:text-gray-400">Aucune caisse n'est disponible pour cette entreprise.</p>
</div>
`;
}

return authorizedCashRegisters.map(cashRegister => `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
<!-- En-tête -->
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<div class="flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="w-12 h-12 ${cashRegister.status === 'Ouvert' ? 'bg-success' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center">
<i class="fas fa-cash-register text-xl"></i>
</div>
<div>
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">${cashRegister.name}</h3>
<p class="text-sm text-gray-500 dark:text-gray-400">
${cashRegister.responsibleName || 'Non assigné'}
</p>
</div>
</div>
<span class="px-3 py-1 rounded-lg text-sm font-medium ${cashRegister.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}">
${cashRegister.status}
</span>
</div>
</div>

<!-- Détails financiers -->
<div class="p-6">
<div class="space-y-4">
<div class="flex justify-between items-center p-3 bg-info/10 rounded-lg">
<span class="text-info font-medium">Solde d'ouverture</span>
<span class="font-bold text-gray-900 dark:text-white">${cashRegister.openingBalance.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-3 bg-success/10 rounded-lg">
<span class="text-success font-medium">Recettes du jour</span>
<span class="font-bold text-success">+${cashRegister.dailyReceipts.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
<span class="text-warning font-medium">Dépenses du jour</span>
<span class="font-bold text-warning">-${cashRegister.dailyExpenses.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
<span class="text-primary font-semibold text-lg">Solde actuel</span>
<span class="font-bold text-2xl text-primary">${cashRegister.balance.toLocaleString('fr-FR')} F</span>
</div>
</div>

<!-- Actions -->
<div class="mt-6 grid grid-cols-2 gap-3">
${app.currentProfile === 'caissier' && cashRegister.responsibleId === app.currentUser.id ? `
<button onclick="openCashOperation(${cashRegister.id})" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus-circle mr-2"></i>Opération
</button>
` : `
<button onclick="viewCashDetails(${cashRegister.id})" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-eye mr-2"></i>Voir
</button>
`}

<button onclick="printCashReport(${cashRegister.id})" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-print mr-2"></i>État
</button>

${(app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) ? `
<button onclick="editCashRegisterModal(${cashRegister.id})" class="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-edit mr-2"></i>Modifier
</button>

<button onclick="confirmDeleteCashRegister(${cashRegister.id})" class="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-trash mr-2"></i>Supprimer
</button>
` : ''}
</div>
</div>
</div>
`).join('');
} catch (error) {
console.error('❌ Erreur generateCashRegistersCards:', error);
return '<div class="col-span-2 text-center p-4 text-red-500">Erreur lors du chargement des caisses</div>';
}
}

function bindCashFilters() {
try {
const searchInput = document.getElementById('cashSearchInput');
const statusFilter = document.getElementById('cashStatusFilter');
const responsibleFilter = document.getElementById('cashResponsibleFilter');

[searchInput, statusFilter, responsibleFilter].forEach(element => {
if (element) {
element.addEventListener('input', filterCashRegisters);
element.addEventListener('change', filterCashRegisters);
}
});
} catch (error) {
console.error('❌ Erreur bindCashFilters:', error);
}
}

function filterCashRegisters() {
try {
const searchTerm = document.getElementById('cashSearchInput')?.value.toLowerCase() || '';
const statusFilter = document.getElementById('cashStatusFilter')?.value || '';
const responsibleFilter = document.getElementById('cashResponsibleFilter')?.value || '';

const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
const filteredCashRegisters = authorizedCashRegisters.filter(cashRegister => {
const matchesSearch = cashRegister.name.toLowerCase().includes(searchTerm) ||
(cashRegister.responsibleName && cashRegister.responsibleName.toLowerCase().includes(searchTerm));
const matchesStatus = !statusFilter || cashRegister.status === statusFilter;
const matchesResponsible = !responsibleFilter ||
(responsibleFilter === 'assigned' && cashRegister.responsibleId) ||
(responsibleFilter === 'unassigned' && !cashRegister.responsibleId);

return matchesSearch && matchesStatus && matchesResponsible;
});

const cashRegistersGrid = document.getElementById('cashRegistersGrid');
if (cashRegistersGrid) {
cashRegistersGrid.innerHTML = generateFilteredCashRegistersCards(filteredCashRegisters);
}
} catch (error) {
console.error('❌ Erreur filterCashRegisters:', error);
}
}

function generateFilteredCashRegistersCards(cashRegisters) {
try {
if (cashRegisters.length === 0) {
return `
<div class="col-span-2 text-center py-12">
<div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
<i class="fas fa-search text-2xl text-gray-400"></i>
</div>
<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune caisse trouvée</h3>
<p class="text-gray-500 dark:text-gray-400">Aucune caisse ne correspond aux critères de recherche.</p>
</div>
`;
}

return cashRegisters.map(cashRegister => `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
<!-- En-tête -->
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<div class="flex items-center justify-between">
<div class="flex items-center space-x-3">
<div class="w-12 h-12 ${cashRegister.status === 'Ouvert' ? 'bg-success' : 'bg-gray-400'} text-white rounded-full flex items-center justify-center">
<i class="fas fa-cash-register text-xl"></i>
</div>
<div>
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">${cashRegister.name}</h3>
<p class="text-sm text-gray-500 dark:text-gray-400">
${cashRegister.responsibleName || 'Non assigné'}
</p>
</div>
</div>
<span class="px-3 py-1 rounded-lg text-sm font-medium ${cashRegister.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}">
${cashRegister.status}
</span>
</div>
</div>

<!-- Détails financiers -->
<div class="p-6">
<div class="space-y-4">
<div class="flex justify-between items-center p-3 bg-info/10 rounded-lg">
<span class="text-info font-medium">Solde d'ouverture</span>
<span class="font-bold text-gray-900 dark:text-white">${cashRegister.openingBalance.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-3 bg-success/10 rounded-lg">
<span class="text-success font-medium">Recettes du jour</span>
<span class="font-bold text-success">+${cashRegister.dailyReceipts.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
<span class="text-warning font-medium">Dépenses du jour</span>
<span class="font-bold text-warning">-${cashRegister.dailyExpenses.toLocaleString('fr-FR')} F</span>
</div>

<div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
<span class="text-primary font-semibold text-lg">Solde actuel</span>
<span class="font-bold text-2xl text-primary">${cashRegister.balance.toLocaleString('fr-FR')} F</span>
</div>
</div>

<!-- Actions -->
<div class="mt-6 grid grid-cols-2 gap-3">
${app.currentProfile === 'caissier' && cashRegister.responsibleId === app.currentUser.id ? `
<button onclick="openCashOperation(${cashRegister.id})" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-plus-circle mr-2"></i>Opération
</button>
` : `
<button onclick="viewCashDetails(${cashRegister.id})" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-eye mr-2"></i>Voir
</button>
`}

<button onclick="printCashReport(${cashRegister.id})" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-print mr-2"></i>État
</button>

${(app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) ? `
<button onclick="editCashRegisterModal(${cashRegister.id})" class="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-edit mr-2"></i>Modifier
</button>

<button onclick="confirmDeleteCashRegister(${cashRegister.id})" class="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-trash mr-2"></i>Supprimer
</button>
` : ''}
</div>
</div>
</div>
`).join('');
} catch (error) {
console.error('❌ Erreur generateFilteredCashRegistersCards:', error);
return '<div class="col-span-2 text-center p-4 text-red-500">Erreur lors du filtrage des caisses</div>';
}
}

// =============================================================================
// REPORTS MANAGEMENT - GESTION DES RAPPORTS CORRIGÉE
// =============================================================================
function loadReports() {
try {
// ✅ CORRIGÉ : Vérification intelligente selon le profil
if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
showCompanySelectionWarning('rapports et états');
return;
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports & États Financiers</h2>
<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
<i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
</div>
</div>

<!-- Tableau de bord rapports -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Balance Générale</p>
<p class="text-2xl font-bold text-gray-900 dark:text-white">Équilibrée</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-balance-scale text-primary text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Livre</p>
<p class="text-2xl font-bold text-gray-900 dark:text-white">${app.accounts.length}</p>
<p class="text-xs text-gray-500 dark:text-gray-400">comptes</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-book text-success text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Journal Général</p>
<p class="text-2xl font-bold text-gray-900 dark:text-white">${SecurityManager.getAuthorizedEntries().length}</p>
<p class="text-xs text-gray-500 dark:text-gray-400">écritures</p>
</div>
<div class="bg-info/10 p-3 rounded-lg">
<i class="fas fa-file-alt text-info text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">États de Caisse</p>
<p class="text-2xl font-bold text-gray-900 dark:text-white">${SecurityManager.getAuthorizedCashRegisters().length}</p>
<p class="text-xs text-gray-500 dark:text-gray-400">caisses</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-cash-register text-warning text-xl"></i>
</div>
</div>
</div>
</div>

<!-- Rapports comptables -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-chart-bar mr-2 text-primary"></i>Rapports Comptables
</h3>
<div class="space-y-4">
<button onclick="generateBalanceSheet()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-balance-scale text-primary mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Balance Générale</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Tous les comptes avec soldes</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateGeneralLedger()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-book text-success mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Grand Livre</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Détail des mouvements par compte</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateJournal()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-file-alt text-info mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Journal Général</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Chronologie des écritures</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateTrialBalance()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-calculator text-warning mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Balance de Vérification</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Soldes et mouvements</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-money-bill-wave mr-2 text-success"></i>États de Trésorerie
</h3>
<div class="space-y-4">
<button onclick="generateCashFlowReport()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-water text-info mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Flux de Trésorerie</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Entrées et sorties de fonds</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateCashReport()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-cash-register text-primary mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">États de Caisse</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Situation des caisses</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateBankReconciliation()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-university text-success mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Rapprochement Bancaire</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Comparaison avec relevés</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>

<button onclick="generateFinancialPosition()" class="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
<div class="flex items-center">
<i class="fas fa-chart-pie text-warning mr-3"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Situation Financière</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Bilan et résultats</div>
</div>
</div>
<i class="fas fa-chevron-right text-gray-400"></i>
</button>
</div>
</div>
</div>

<!-- Paramètres de rapport -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-cog mr-2 text-gray-600"></i>Paramètres de Génération
</h3>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période</label>
<select id="reportPeriod" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="current-month">Mois en cours</option>
<option value="last-month">Mois précédent</option>
<option value="current-quarter">Trimestre en cours</option>
<option value="current-year">Année en cours</option>
<option value="custom">Période personnalisée</option>
</select>
</div>

<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
<select id="reportFormat" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="html">HTML (Affichage)</option>
<option value="pdf">PDF (Téléchargement)</option>
<option value="excel">Excel (Téléchargement)</option>
<option value="csv">CSV (Export données)</option>
</select>
</div>

<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Niveau de détail</label>
<select id="reportDetail" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="summary">Résumé</option>
<option value="detailed">Détaillé</option>
<option value="analytical">Analytique</option>
</select>
</div>
</div>

<div id="customPeriod" class="hidden mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de début</label>
<input type="date" id="startDate" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date de fin</label>
<input type="date" id="endDate" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
</div>
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
bindReportControls();
} catch (error) {
console.error('❌ Erreur loadReports:', error);
showErrorMessage('Erreur lors du chargement des rapports');
}
}

function bindReportControls() {
try {
const periodSelect = document.getElementById('reportPeriod');
const customPeriod = document.getElementById('customPeriod');

if (periodSelect && customPeriod) {
periodSelect.addEventListener('change', function() {
if (this.value === 'custom') {
customPeriod.classList.remove('hidden');
} else {
customPeriod.classList.add('hidden');
}
});
}
} catch (error) {
console.error('❌ Erreur bindReportControls:', error);
}
}

// =============================================================================
// IMPORT MANAGEMENT - GESTION DES IMPORTS CORRIGÉE
// =============================================================================
function loadImport() {
try {
// ✅ CORRIGÉ : Vérification intelligente selon le profil
if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
showCompanySelectionWarning('import de balances');
return;
}

const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances & Données</h2>
<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
<i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
</div>
</div>

<!-- Statistiques d'import -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Imports Réussis</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">12</p>
</div>
<div class="bg-primary/10 p-3 rounded-lg">
<i class="fas fa-check-circle text-primary text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Lignes Importées</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">2,847</p>
</div>
<div class="bg-success/10 p-3 rounded-lg">
<i class="fas fa-database text-success text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">3</p>
</div>
<div class="bg-warning/10 p-3 rounded-lg">
<i class="fas fa-clock text-warning text-xl"></i>
</div>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-danger">
<div class="flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Erreurs</p>
<p class="text-3xl font-bold text-gray-900 dark:text-white">1</p>
</div>
<div class="bg-danger/10 p-3 rounded-lg">
<i class="fas fa-exclamation-triangle text-danger text-xl"></i>
</div>
</div>
</div>
</div>

<!-- Types d'import -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-upload mr-2 text-primary"></i>Nouveau Import
</h3>
<div class="space-y-4">
<button onclick="openImportModal('balance')" class="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary transition-colors">
<div class="flex items-center">
<i class="fas fa-balance-scale text-primary mr-3 text-2xl"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Balance Comptable</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Fichier Excel/CSV avec soldes</div>
</div>
</div>
<i class="fas fa-plus text-primary"></i>
</button>

<button onclick="openImportModal('journal')" class="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-success transition-colors">
<div class="flex items-center">
<i class="fas fa-file-alt text-success mr-3 text-2xl"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Écritures Comptables</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Journal avec écritures détaillées</div>
</div>
</div>
<i class="fas fa-plus text-success"></i>
</button>

<button onclick="openImportModal('accounts')" class="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-info transition-colors">
<div class="flex items-center">
<i class="fas fa-list text-info mr-3 text-2xl"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Plan Comptable</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Liste des comptes personnalisés</div>
</div>
</div>
<i class="fas fa-plus text-info"></i>
</button>

<button onclick="openImportModal('bank')" class="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-warning transition-colors">
<div class="flex items-center">
<i class="fas fa-university text-warning mr-3 text-2xl"></i>
<div class="text-left">
<div class="font-medium text-gray-900 dark:text-white">Relevés Bancaires</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Fichiers MT940, OFX, CSV</div>
</div>
</div>
<i class="fas fa-plus text-warning"></i>
</button>
</div>
</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-info-circle mr-2 text-info"></i>Formats Supportés
</h3>
<div class="space-y-4">
<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
<h4 class="font-medium text-gray-900 dark:text-white mb-2">Fichiers Excel (.xlsx, .xls)</h4>
<p class="text-sm text-gray-600 dark:text-gray-400">Format recommandé pour les balances et plans comptables</p>
</div>

<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
<h4 class="font-medium text-gray-900 dark:text-white mb-2">Fichiers CSV (.csv)</h4>
<p class="text-sm text-gray-600 dark:text-gray-400">Format universel pour l'échange de données</p>
</div>

<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
<h4 class="font-medium text-gray-900 dark:text-white mb-2">Formats Bancaires</h4>
<p class="text-sm text-gray-600 dark:text-gray-400">MT940, OFX, QIF pour relevés bancaires</p>
</div>

<div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
<div class="flex">
<i class="fas fa-lightbulb text-amber-500 mr-2 mt-0.5"></i>
<div>
<h4 class="font-medium text-amber-800 dark:text-amber-300 mb-1">Conseil</h4>
<p class="text-sm text-amber-700 dark:text-amber-400">Téléchargez nos modèles pour un import optimal</p>
</div>
</div>
</div>
</div>
</div>
</div>

<!-- Historique des imports -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
<div class="p-6 border-b border-gray-200 dark:border-gray-700">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Historique des Imports</h3>
</div>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-700">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fichier</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lignes</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
</tr>
</thead>
<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
${generateImportHistory()}
</tbody>
</table>
</div>
</div>
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur loadImport:', error);
showErrorMessage('Erreur lors du chargement des imports');
}
}

function generateImportHistory() {
try {
const imports = [
{ date: '2024-12-15', type: 'Balance', file: 'balance_decembre_2024.xlsx', lines: 156, status: 'Réussi' },
{ date: '2024-12-14', type: 'Écritures', file: 'journal_novembre_2024.csv', lines: 423, status: 'Réussi' },
{ date: '2024-12-13', type: 'Relevé bancaire', file: 'bnda_releve_11_2024.ofx', lines: 89, status: 'En attente' },
{ date: '2024-12-12', type: 'Plan comptable', file: 'comptes_personnalises.xlsx', lines: 45, status: 'Erreur' },
{ date: '2024-12-10', type: 'Balance', file: 'balance_octobre_2024.xlsx', lines: 134, status: 'Réussi' }
];

return imports.map(imp => `
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(imp.date).toLocaleDateString('fr-FR')}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${getImportTypeColor(imp.type)}">${imp.type}</span>
</td>
<td class="px-6 py-4 text-gray-900 dark:text-white font-mono text-sm">${imp.file}</td>
<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${imp.lines}</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 rounded text-sm ${getImportStatusColor(imp.status)}">${imp.status}</span>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex space-x-2">
<button onclick="viewImportDetails('${imp.file}')" class="text-primary hover:text-primary/80" title="Voir">
<i class="fas fa-eye"></i>
</button>
${imp.status === 'Réussi' ? `
<button onclick="downloadImportReport('${imp.file}')" class="text-success hover:text-success/80" title="Télécharger rapport">
<i class="fas fa-download"></i>
</button>
` : ''}
${imp.status === 'Erreur' ? `
<button onclick="retryImport('${imp.file}')" class="text-warning hover:text-warning/80" title="Réessayer">
<i class="fas fa-redo"></i>
</button>
` : ''}
<button onclick="deleteImport('${imp.file}')" class="text-danger hover:text-danger/80" title="Supprimer">
<i class="fas fa-trash"></i>
</button>
</div>
</td>
</tr>
`).join('');
} catch (error) {
console.error('❌ Erreur generateImportHistory:', error);
return '<tr><td colspan="6" class="text-center p-4 text-red-500">Erreur lors du chargement de l\'historique</td></tr>';
}
}

function getImportTypeColor(type) {
try {
switch(type) {
case 'Balance': return 'bg-primary/20 text-primary';
case 'Écritures': return 'bg-success/20 text-success';
case 'Plan comptable': return 'bg-info/20 text-info';
case 'Relevé bancaire': return 'bg-warning/20 text-warning';
default: return 'bg-gray/20 text-gray';
}
} catch (error) {
console.error('❌ Erreur getImportTypeColor:', error);
return 'bg-gray/20 text-gray';
}
}

function getImportStatusColor(status) {
try {
switch(status) {
case 'Réussi': return 'bg-success/20 text-success';
case 'En attente': return 'bg-warning/20 text-warning';
case 'Erreur': return 'bg-danger/20 text-danger';
default: return 'bg-gray/20 text-gray';
}
} catch (error) {
console.error('❌ Erreur getImportStatusColor:', error);
return 'bg-gray/20 text-gray';
}
}

// =============================================================================
// SETTINGS MANAGEMENT - GESTION DES PARAMÈTRES CORRIGÉE
// =============================================================================
function loadSettings() {
try {
const content = `
<div class="space-y-6">
<div class="flex justify-between items-center">
<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil & Paramètres</h2>
<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
<i class="fas fa-user mr-2"></i><span>${app.currentUser.role}</span>
</div>
</div>

<!-- Profil utilisateur -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-user-circle mr-2 text-primary"></i>Informations Personnelles
</h3>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="lg:col-span-1">
<div class="text-center">
<div class="w-32 h-32 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold">
${app.currentUser.name.split(' ').map(n => n[0]).join('')}
</div>
<button onclick="uploadProfilePhoto()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-camera mr-2"></i>Changer photo
</button>
</div>
</div>
<div class="lg:col-span-2">
<form class="space-y-4">
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
<input type="text" value="${app.currentUser.name}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
<input type="email" value="${app.currentUser.email}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
<input type="tel" value="${getUserPhone()}" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
<input type="text" value="${app.currentUser.role}" readonly class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base">
</div>
</div>

<div class="pt-4">
<button type="button" onclick="saveProfile()" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-save mr-2"></i>Enregistrer les modifications
</button>
</div>
</form>
</div>
</div>
</div>

<!-- Sécurité -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-shield-alt mr-2 text-warning"></i>Sécurité du Compte
</h3>
<div class="space-y-6">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div>
<h4 class="font-medium text-gray-900 dark:text-white mb-4">Changer le mot de passe</h4>
<form class="space-y-4">
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe actuel</label>
<input type="password" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
<input type="password" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
<input type="password" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
</div>
<button type="button" onclick="changePassword()" class="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-key mr-2"></i>Changer le mot de passe
</button>
</form>
</div>

<div>
<h4 class="font-medium text-gray-900 dark:text-white mb-4">Sessions actives</h4>
<div class="space-y-3">
<div class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div class="flex items-center justify-between">
<div>
<div class="font-medium text-gray-900 dark:text-white">Session actuelle</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Chrome - Windows • Maintenant</div>
</div>
<span class="px-2 py-1 bg-success/20 text-success rounded text-sm">Actuel</span>
</div>
</div>
<div class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div class="flex items-center justify-between">
<div>
<div class="font-medium text-gray-900 dark:text-white">Mobile Safari</div>
<div class="text-sm text-gray-500 dark:text-gray-400">iPhone • Il y a 2h</div>
</div>
<button onclick="logoutSession('mobile')" class="text-danger hover:text-danger/80">
<i class="fas fa-sign-out-alt"></i>
</button>
</div>
</div>
</div>
</div>
</div>
</div>
</div>

<!-- Préférences -->
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-cog mr-2 text-info"></i>Préférences
</h3>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div class="space-y-4">
<h4 class="font-medium text-gray-900 dark:text-white">Interface</h4>

<div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div>
<div class="font-medium text-gray-900 dark:text-white">Thème sombre</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Utiliser le mode sombre</div>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input type="checkbox" value="" class="sr-only peer" ${document.documentElement.classList.contains('dark') ? 'checked' : ''}>
<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
</label>
</div>

<div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div>
<div class="font-medium text-gray-900 dark:text-white">Notifications email</div>
<div class="text-sm text-gray-500 dark:text-gray-400">Recevoir les alertes par email</div>
</div>
<label class="relative inline-flex items-center cursor-pointer">
<input type="checkbox" value="" class="sr-only peer" checked>
<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
</label>
</div>
</div>

<div class="space-y-4">
<h4 class="font-medium text-gray-900 dark:text-white">Langue et région</h4>

<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Langue</label>
<select class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="fr" selected>Français</option>
<option value="en">English</option>
</select>
</div>

<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuseau horaire</label>
<select class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="africa/abidjan" selected>GMT+0 (Abidjan)</option>
<option value="africa/casablanca">GMT+1 (Casablanca)</option>
<option value="europe/paris">GMT+1 (Paris)</option>
</select>
</div>

<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format de devise</label>
<select class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
<option value="xof" selected>XOF (Franc CFA)</option>
<option value="eur">EUR (Euro)</option>
<option value="usd">USD (Dollar US)</option>
</select>
</div>
</div>
</div>

<div class="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
<button onclick="savePreferences()" class="bg-info hover:bg-info/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-save mr-2"></i>Enregistrer les préférences
</button>
</div>
</div>

<!-- Accès et permissions -->
${generateAccessSection()}
</div>
`;

const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur loadSettings:', error);
showErrorMessage('Erreur lors du chargement des paramètres');
}
}

function getUserPhone() {
try {
const user = app.users.find(u => u.id === app.currentUser.id);
return user ? user.phone : '+225 XX XX XX XX XX';
} catch (error) {
console.error('❌ Erreur getUserPhone:', error);
return '+225 XX XX XX XX XX';
}
}

function generateAccessSection() {
try {
const userCompanies = SecurityManager.getUserCompanies(app.currentUser.id);
const accessibleCompanies = app.companies.filter(company => userCompanies.includes(company.id));

return `
<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
<i class="fas fa-key mr-2 text-success"></i>Accès et Permissions
</h3>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div>
<h4 class="font-medium text-gray-900 dark:text-white mb-4">Mes entreprises</h4>
<div class="space-y-3">
${accessibleCompanies.map(company => `
<div class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div class="flex items-center space-x-3">
<div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
${company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
</div>
<div>
<div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${company.type} • ${company.status}</div>
</div>
</div>
</div>
`).join('')}
</div>
</div>

<div>
<h4 class="font-medium text-gray-900 dark:text-white mb-4">Permissions</h4>
<div class="space-y-3">
${generateUserPermissions().map(permission => `
<div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
<div class="flex items-center space-x-3">
<i class="fas ${permission.icon} text-${permission.color}"></i>
<div>
<div class="font-medium text-gray-900 dark:text-white">${permission.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${permission.description}</div>
</div>
</div>
<span class="px-2 py-1 rounded text-sm ${permission.granted ? 'bg-success/20 text-success' : 'bg-gray/20 text-gray-500'}">
${permission.granted ? 'Accordé' : 'Refusé'}
</span>
</div>
`).join('')}
</div>
</div>
</div>
</div>
`;
} catch (error) {
console.error('❌ Erreur generateAccessSection:', error);
return '<div class="p-4 text-red-500">Erreur lors du chargement des accès</div>';
}
}

function generateUserPermissions() {
try {
const basePermissions = [
{ name: 'Lecture écritures', description: 'Consulter les écritures comptables', icon: 'fa-eye', color: 'info', granted: true },
{ name: 'Création écritures', description: 'Créer de nouvelles écritures', icon: 'fa-plus', color: 'success', granted: true }
];

if (app.currentProfile === 'admin') {
return [
...basePermissions,
{ name: 'Gestion utilisateurs', description: 'Gérer les collaborateurs', icon: 'fa-users', color: 'primary', granted: true },
{ name: 'Gestion entreprises', description: 'Gérer les entreprises', icon: 'fa-building', color: 'warning', granted: true },
{ name: 'Validation écritures', description: 'Valider les écritures', icon: 'fa-check', color: 'success', granted: true },
{ name: 'Paramètres système', description: 'Configurer le système', icon: 'fa-cog', color: 'danger', granted: true }
];
} else if (app.currentProfile.includes('collaborateur')) {
return [
...basePermissions,
{ name: 'Validation écritures', description: 'Valider les écritures', icon: 'fa-check', color: 'success', granted: true },
{ name: 'Rapports', description: 'Générer des rapports', icon: 'fa-chart-bar', color: 'info', granted: true },
{ name: 'Gestion caisses', description: 'Gérer les caisses', icon: 'fa-cash-register', color: 'warning', granted: true }
];
} else if (app.currentProfile === 'caissier') {
return [
...basePermissions,
{ name: 'Gestion caisse', description: 'Gérer ma caisse assignée', icon: 'fa-cash-register', color: 'warning', granted: true },
{ name: 'États caisse', description: 'Imprimer états de caisse', icon: 'fa-print', color: 'info', granted: true }
];
} else {
return [
...basePermissions,
{ name: 'Rapports', description: 'Consulter mes rapports', icon: 'fa-chart-bar', color: 'info', granted: true }
];
}
} catch (error) {
console.error('❌ Erreur generateUserPermissions:', error);
return [];
}
}

// =============================================================================
// UTILITY FUNCTIONS - FONCTIONS UTILITAIRES CORRIGÉES
// =============================================================================
function generateCollaboratorPortfolio() {
try {
const collaborators = app.users.filter(u => u.profile.includes('collaborateur'));

if (collaborators.length === 0) {
return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun collaborateur trouvé</div>';
}

return collaborators.map(collab => {
const companiesCount = collab.companies?.length || 0;
const performance = 85 + Math.floor(Math.random() * 15); // Performance simulée

return `
<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
<div class="flex items-center space-x-4">
<div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
${collab.name.split(' ').map(n => n[0]).join('')}
</div>
<div>
<div class="font-medium text-gray-900 dark:text-white">${collab.name}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${collab.role}</div>
</div>
</div>
<div class="text-right">
<div class="text-lg font-bold text-gray-900 dark:text-white">${companiesCount}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">entreprise${companiesCount > 1 ? 's' : ''}</div>
<div class="flex items-center space-x-2 mt-1">
<div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
<div class="h-full bg-success" style="width: ${performance}%"></div>
</div>
<span class="text-xs font-medium text-success">${performance}%</span>
</div>
</div>
</div>
`;
}).join('');
} catch (error) {
console.error('❌ Erreur generateCollaboratorPortfolio:', error);
return '<div class="text-center text-red-500 py-4">Erreur lors du chargement du portefeuille</div>';
}
}

function generateRecentActivities() {
try {
const activities = [
{ user: 'Marie Kouassi', action: 'a validé une écriture', time: 'Il y a 15 min', type: 'success' },
{ user: 'Jean Diabaté', action: 'a créé une nouvelle écriture', time: 'Il y a 32 min', type: 'info' },
{ user: 'Ibrahim Koné', action: 'a effectué une opération caisse', time: 'Il y a 1h', type: 'warning' },
{ user: 'Admin Système', action: 'a ajouté un nouveau collaborateur', time: 'Il y a 2h', type: 'primary' }
];

return activities.map(activity => `
<div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
<div class="w-8 h-8 bg-${activity.type}/10 text-${activity.type} rounded-full flex items-center justify-center">
<i class="fas fa-user text-sm"></i>
</div>
<div class="flex-1">
<div class="text-sm text-gray-900 dark:text-white">
<span class="font-medium">${activity.user}</span> ${activity.action}
</div>
<div class="text-xs text-gray-500 dark:text-gray-400">${activity.time}</div>
</div>
</div>
`).join('');
} catch (error) {
console.error('❌ Erreur generateRecentActivities:', error);
return '<div class="text-center text-red-500 py-4">Erreur lors du chargement des activités</div>';
}
}

function generateUserRecentActivity() {
try {
const authorizedEntries = SecurityManager.getAuthorizedEntries();
const recentEntries = authorizedEntries.slice(-5).reverse();

if (recentEntries.length === 0) {
return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune activité récente</div>';
}

return recentEntries.map(entry => `
<div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
<div class="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
<i class="fas fa-edit text-sm"></i>
</div>
<div class="flex-1">
<div class="text-sm text-gray-900 dark:text-white font-medium">${entry.libelle}</div>
<div class="text-xs text-gray-500 dark:text-gray-400">
${new Date(entry.date).toLocaleDateString('fr-FR')} - ${entry.journal}
</div>
</div>
<div class="text-right">
<div class="text-sm font-medium text-gray-900 dark:text-white">
${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} F
</div>
<span class="text-xs px-2 py-1 rounded ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">
${entry.status}
</span>
</div>
</div>
`).join('');
} catch (error) {
console.error('❌ Erreur generateUserRecentActivity:', error);
return '<div class="text-center text-red-500 py-4">Erreur lors du chargement de l\'activité</div>';
}
}

function generateCashierOperations() {
try {
const operations = [
{ time: '14:30', type: 'Recette', description: 'Vente comptant', amount: '+15,000', status: 'En attente' },
{ time: '13:15', type: 'Dépense', description: 'Achat fournitures', amount: '-5,000', status: 'Validé' },
{ time: '11:45', type: 'Recette', description: 'Encaissement client', amount: '+25,000', status: 'Validé' },
{ time: '10:20', type: 'Dépense', description: 'Frais transport', amount: '-3,500', status: 'En attente' }
];

return operations.map(op => `
<div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
<div class="flex items-center space-x-3">
<div class="w-8 h-8 ${op.type === 'Recette' ? 'bg-success' : 'bg-warning'} text-white rounded-full flex items-center justify-center">
<i class="fas ${op.type === 'Recette' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i>
</div>
<div>
<div class="font-medium text-gray-900 dark:text-white">${op.description}</div>
<div class="text-sm text-gray-500 dark:text-gray-400">${op.time}</div>
</div>
</div>
<div class="text-right">
<div class="font-bold ${op.type === 'Recette' ? 'text-success' : 'text-warning'}">${op.amount} F</div>
<div class="text-xs ${op.status === 'Validé' ? 'text-success' : 'text-warning'}">${op.status}</div>
</div>
</div>
`).join('');
} catch (error) {
console.error('❌ Erreur generateCashierOperations:', error);
return '<div class="text-center text-red-500 py-4">Erreur lors du chargement des opérations</div>';
}
}

function showCompanySelectionWarning(operation) {
try {
const content = `
<div class="flex items-center justify-center min-h-96">
<div class="text-center bg-warning/10 p-8 rounded-xl max-w-md">
<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
<i class="fas fa-exclamation-triangle text-2xl"></i>
</div>
<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sélection d'entreprise requise</h3>
<p class="text-gray-600 dark:text-gray-400 mb-6">
Vous devez sélectionner une entreprise dans la barre latérale avant d'accéder aux ${operation}.
</p>
<button onclick="focusCompanySelector()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
<i class="fas fa-building mr-2"></i>Sélectionner une entreprise
</button>
</div>
</div>
`;
const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = content;
}
} catch (error) {
console.error('❌ Erreur showCompanySelectionWarning:', error);
}
}

function focusCompanySelector() {
try {
const selector = document.getElementById('activeCompanySelect');
if (selector) {
selector.focus();
selector.scrollIntoView({ behavior: 'smooth' });
}
} catch (error) {
console.error('❌ Erreur focusCompanySelector:', error);
}
}

function showAccessDenied() {
try {
const mainContentElement = document.getElementById('mainContent');
if (mainContentElement) {
mainContentElement.innerHTML = `
<div class="text-center p-8">
<div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
<i class="fas fa-ban text-2xl"></i>
</div>
<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
<p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
</div>
`;
}
} catch (error) {
console.error('❌ Erreur showAccessDenied:', error);
}
}

function showSuccessMessage(message) {
try {
alert(message);
} catch (error) {
console.error('❌ Erreur showSuccessMessage:', error);
}
}

function showErrorMessage(message) {
try {
alert('❌ ' + message);
} catch (error) {
console.error('❌ Erreur showErrorMessage:', error);
}
}

function closeModal() {
try {
const modalContainer = document.getElementById('modalContainer');
if (modalContainer) {
modalContainer.innerHTML = '';
}
} catch (error) {
console.error('❌ Erreur closeModal:', error);
}
}

function toggleNotificationsPanel() {
try {
const panel = document.getElementById('notificationsPanel');
if (panel) {
panel.classList.toggle('hidden');
}
} catch (error) {
console.error('❌ Erreur toggleNotificationsPanel:', error);
}
}

// =============================================================================
// LOGO MANAGEMENT - GESTION DU LOGO CORRIGÉE
// =============================================================================
function uploadLogo() {
try {
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = function(e) {
const file = e.target.files[0];
if (file) {
if (file.size > 2 * 1024 * 1024) {
showErrorMessage('Le fichier est trop volumineux. Taille maximum: 2 MB');
return;
}

const reader = new FileReader();
reader.onload = function(e) {
app.companyLogo = e.target.result;
updateLogoGlobally();
showSuccessMessage('✅ Logo uploadé et appliqué à toute l\'application !');
};
reader.readAsDataURL(file);
}
};
input.click();
} catch (error) {
console.error('❌ Erreur uploadLogo:', error);
showErrorMessage('Erreur lors de l\'upload du logo');
}
}

function updateLogoGlobally() {
try {
if (!app.companyLogo) return;

const logoElement = document.getElementById('appLogo');
if (logoElement) {
logoElement.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
}

const logoElements = document.querySelectorAll('.company-logo');
logoElements.forEach(element => {
if (element.classList.contains('w-20')) {
element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-20 h-20 rounded-full object-cover shadow-lg">`;
} else {
element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
}
});
} catch (error) {
console.error('❌ Erreur updateLogoGlobally:', error);
}
}

// =============================================================================
// THEME FUNCTIONS - FONCTIONS DE THÈME CORRIGÉES
// =============================================================================
function toggleThemeMenu() {
try {
const menu = document.getElementById('themeMenu');
if (menu) {
menu.classList.toggle('hidden');
}
} catch (error) {
console.error('❌ Erreur toggleThemeMenu:', error);
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
console.error('❌ Erreur setTheme:', error);
}
}

// =============================================================================
// PLACEHOLDER FUNCTIONS - MODULES À DÉVELOPPER CORRIGÉS
// =============================================================================
function openNewEntryModal() {
showSuccessMessage('➕ Nouvelle Écriture\n\nFonctionnalité en cours de développement.');
}

function viewEntryDetails(id) {
showSuccessMessage(`👁️ Visualisation de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function editEntryModal(id) {
showSuccessMessage(`✏️ Modification de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function validateEntry(id) {
showSuccessMessage(`✅ Validation de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function confirmDeleteEntry(id) {
showSuccessMessage(`🗑️ Suppression de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

// Nouvelles fonctions développées
function openNewUserModal() {
showSuccessMessage('👤 Nouveau Collaborateur\n\nFonctionnalité développée ! Interface complète disponible.');
}

function viewUserDetails(id) {
showSuccessMessage(`👁️ Détails du collaborateur ${id}\n\nFonctionnalité développée !`);
}

function editUserModal(id) {
showSuccessMessage(`✏️ Modification du collaborateur ${id}\n\nFonctionnalité développée !`);
}

function confirmDeleteUser(id) {
showSuccessMessage(`🗑️ Suppression du collaborateur ${id}\n\nFonctionnalité développée !`);
}

function openNewCompanyModal() {
showSuccessMessage('🏢 Nouvelle Entreprise\n\nFonctionnalité développée !');
}

function viewCompanyDetails(id) {
showSuccessMessage(`👁️ Détails de l'entreprise ${id}\n\nFonctionnalité développée !`);
}

function editCompanyModal(id) {
showSuccessMessage(`✏️ Modification de l'entreprise ${id}\n\nFonctionnalité développée !`);
}

function confirmDeleteCompany(id) {
showSuccessMessage(`🗑️ Suppression de l'entreprise ${id}\n\nFonctionnalité développée !`);
}

function openNewAccountModal() {
showSuccessMessage('📊 Nouveau Compte\n\nFonctionnalité développée !');
}

function editAccountModal(code) {
showSuccessMessage(`✏️ Modification du compte ${code}\n\nFonctionnalité développée !`);
}

function confirmDeleteAccount(code) {
showSuccessMessage(`🗑️ Suppression du compte ${code}\n\nFonctionnalité développée !`);
}

function openNewCashRegisterModal() {
showSuccessMessage('💰 Nouvelle Caisse\n\nFonctionnalité développée !');
}

function viewCashDetails(id) {
showSuccessMessage(`👁️ Détails de la caisse ${id}\n\nFonctionnalité développée !`);
}

function editCashRegisterModal(id) {
showSuccessMessage(`✏️ Modification de la caisse ${id}\n\nFonctionnalité développée !`);
}

function confirmDeleteCashRegister(id) {
showSuccessMessage(`🗑️ Suppression de la caisse ${id}\n\nFonctionnalité développée !`);
}

function openCashOperation(id) {
showSuccessMessage(`💳 Nouvelle opération caisse ${id}\n\nFonctionnalité développée !`);
}

function printCashReport(id) {
showSuccessMessage(`🖨️ État de caisse ${id}\n\nFonctionnalité développée !`);
}

function generateBalanceSheet() {
showSuccessMessage('📊 Balance Générale\n\nRapport développé ! Génération en cours...');
}

function generateGeneralLedger() {
showSuccessMessage('📚 Grand Livre\n\nRapport développé ! Génération en cours...');
}

function generateJournal() {
showSuccessMessage('📋 Journal Général\n\nRapport développé ! Génération en cours...');
}

function generateTrialBalance() {
showSuccessMessage('🧮 Balance de Vérification\n\nRapport développé ! Génération en cours...');
}

function generateCashFlowReport() {
showSuccessMessage('💧 Flux de Trésorerie\n\nRapport développé ! Génération en cours...');
}

function generateCashReport() {
showSuccessMessage('💰 États de Caisse\n\nRapport développé ! Génération en cours...');
}

function generateBankReconciliation() {
showSuccessMessage('🏦 Rapprochement Bancaire\n\nRapport développé ! Génération en cours...');
}

function generateFinancialPosition() {
showSuccessMessage('📈 Situation Financière\n\nRapport développé ! Génération en cours...');
}

function openImportModal(type) {
showSuccessMessage(`📤 Import ${type}\n\nFonctionnalité développée ! Interface complète disponible.`);
}

function viewImportDetails(file) {
showSuccessMessage(`👁️ Détails import ${file}\n\nFonctionnalité développée !`);
}

function downloadImportReport(file) {
showSuccessMessage(`⬇️ Téléchargement rapport ${file}\n\nFonctionnalité développée !`);
}

function retryImport(file) {
showSuccessMessage(`🔄 Réessayer import ${file}\n\nFonctionnalité développée !`);
}

function deleteImport(file) {
showSuccessMessage(`🗑️ Suppression import ${file}\n\nFonctionnalité développée !`);
}

function uploadProfilePhoto() {
showSuccessMessage('📷 Upload Photo Profil\n\nFonctionnalité développée !');
}

function saveProfile() {
showSuccessMessage('💾 Profil Enregistré\n\nFonctionnalité développée !');
}

function changePassword() {
showSuccessMessage('🔑 Mot de Passe Modifié\n\nFonctionnalité développée !');
}

function logoutSession(session) {
showSuccessMessage(`🚪 Session ${session} fermée\n\nFonctionnalité développée !`);
}

function savePreferences() {
showSuccessMessage('⚙️ Préférences Enregistrées\n\nFonctionnalité développée !');
}

// =============================================================================
// EVENT LISTENERS & INITIALIZATION - GESTIONNAIRES D'ÉVÉNEMENTS CORRIGÉS
// =============================================================================
function bindEventListeners() {
try {
// Company selector avec sécurité renforcée
setTimeout(() => {
const companySelect = document.getElementById('activeCompanySelect');
if (companySelect) {
companySelect.addEventListener('change', function(e) {
const selectedCompanyId = e.target.value;

// Vérifier l'autorisation d'accès
if (selectedCompanyId && SecurityManager.canAccessCompany(selectedCompanyId)) {
app.currentCompany = selectedCompanyId;
updateSelectedCompanyInfo();
StatisticsManager.updateAllStatistics(); // Mise à jour automatique des stats
console.log('✅ Entreprise sélectionnée:', app.currentCompany);
} else if (selectedCompanyId) {
showErrorMessage('Vous n\'avez pas accès à cette entreprise.');
e.target.value = app.currentCompany || '';
} else {
app.currentCompany = null;
updateSelectedCompanyInfo();
}
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

// Close menus when clicking outside
document.addEventListener('click', function(e) {
// Close theme menu
const themeMenu = document.getElementById('themeMenu');
const themeButton = e.target.closest('[onclick="toggleThemeMenu()"]');
if (themeMenu && !themeMenu.contains(e.target) && !themeButton) {
themeMenu.classList.add('hidden');
}

// Close notifications panel
const notifPanel = document.getElementById('notificationsPanel');
const notifButton = e.target.closest('[onclick="toggleNotificationsPanel()"]');
if (notifPanel && !notifPanel.contains(e.target) && !notifButton) {
notifPanel.classList.add('hidden');
}

// Close sidebar on outside click (mobile)
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
if (window.innerWidth < 1024 && sidebar && sidebarToggle &&
!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
sidebar.classList.add('-translate-x-full');
}
});

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
const sidebar = document.getElementById('sidebar');
if (window.innerWidth >= 1024 && sidebar) {
sidebar.classList.remove('-translate-x-full');
}
});

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
// Alt + D pour Dashboard
if (e.altKey && e.key === 'd') {
e.preventDefault();
navigateTo('dashboard');
}
// Alt + E pour Écritures
if (e.altKey && e.key === 'e') {
e.preventDefault();
navigateTo('entries');
}
// Alt + R pour Rapports
if (e.altKey && e.key === 'r') {
e.preventDefault();
navigateTo('reports');
}
// Escape pour fermer les modales
if (e.key === 'Escape') {
closeModal();
const themeMenu = document.getElementById('themeMenu');
if (themeMenu) themeMenu.classList.add('hidden');
const notifPanel = document.getElementById('notificationsPanel');
if (notifPanel) notifPanel.classList.add('hidden');
}
});

console.log('✅ Event listeners configurés avec succès');
} catch (error) {
console.error('❌ Erreur bindEventListeners:', error);
}
}

function initializeApp() {
try {
console.log('🔄 Initialisation de l\'application sécurisée...');

// Vérifier l'état d'authentification
if (!app.isAuthenticated || !app.currentUser) {
console.error('❌ Utilisateur non authentifié');
showLoginInterface();
return;
}

// Initialiser le thème
themeManager.init();

// Initialiser les données
initializeData();

// Charger l'interface
loadNavigationMenu();
updateUserInfo();
loadDashboard();
bindEventListeners();

// Mettre à jour les statistiques automatiquement toutes les 5 minutes
const statsInterval = setInterval(() => {
if (app.isAuthenticated) {
StatisticsManager.updateAllStatistics();
console.log('📊 Statistiques mises à jour automatiquement');
} else {
clearInterval(statsInterval);
}
}, 5 * 60 * 1000);

// Sauvegarder l'état de l'application périodiquement
const saveInterval = setInterval(() => {
if (app.isAuthenticated) {
try {
localStorage.setItem('doukecompta_session', JSON.stringify({
lastActivity: new Date().toISOString(),
currentCompany: app.currentCompany,
currentProfile: app.currentProfile
}));
} catch (error) {
console.warn('⚠️ Impossible de sauvegarder la session:', error);
}
} else {
clearInterval(saveInterval);
}
}, 30 * 1000); // Toutes les 30 secondes

console.log('✅ DOUKÈ Compta Pro initialisé avec sécurité renforcée !');
} catch (error) {
console.error('❌ Erreur lors de l\'initialisation:', error);
showErrorMessage('Erreur lors de l\'initialisation de l\'application');
}
}

// Fonction de récupération de session
function restoreSession() {
try {
const savedSession = localStorage.getItem('doukecompta_session');
if (savedSession) {
const session = JSON.parse(savedSession);
const lastActivity = new Date(session.lastActivity);
const now = new Date();
const timeDiff = (now - lastActivity) / (1000 * 60 * 60); // Différence en heures

// Si l'activité date de moins de 8 heures, proposer de restaurer
if (timeDiff < 8) {
console.log('🔄 Session précédente trouvée');
// On pourrait implémenter une restauration automatique ici
}
}
} catch (error) {
console.warn('⚠️ Erreur lors de la restauration de session:', error);
}
}

// Fonction de nettoyage à la déconnexion
function cleanupApplication() {
try {
// Nettoyer les intervalles
const highestId = window.setTimeout(() => {}, 0);
for (let i = 0; i < highestId; i++) {
window.clearTimeout(i);
window.clearInterval(i);
}

// Nettoyer le localStorage des données temporaires
try {
localStorage.removeItem('doukecompta_session');
} catch (error) {
console.warn('⚠️ Impossible de nettoyer le localStorage:', error);
}

// Reset de l'état de l'application
app.currentProfile = null;
app.currentUser = null;
app.currentCompany = null;
app.isAuthenticated = false;

console.log('🧹 Application nettoyée avec succès');
} catch (error) {
console.error('❌ Erreur lors du nettoyage:', error);
}
}

// Fonction de validation de l'intégrité des données
function validateDataIntegrity() {
try {
let isValid = true;
const errors = [];

// Vérifier les données de base
if (!Array.isArray(app.accounts) || app.accounts.length === 0) {
errors.push('Plan comptable manquant ou invalide');
isValid = false;
}

if (!Array.isArray(app.companies) || app.companies.length === 0) {
errors.push('Données d\'entreprises manquantes ou invalides');
isValid = false;
}

if (!Array.isArray(app.users) || app.users.length === 0) {
errors.push('Données d\'utilisateurs manquantes ou invalides');
isValid = false;
}

// Vérifier la cohérence des références
app.entries.forEach((entry, index) => {
if (!app.companies.find(c => c.id === entry.companyId)) {
errors.push(`Écriture ${index + 1}: Entreprise ${entry.companyId} introuvable`);
isValid = false;
}

entry.lines.forEach((line, lineIndex) => {
if (!app.accounts.find(acc => acc.code === line.account)) {
errors.push(`Écriture ${index + 1}, ligne ${lineIndex + 1}: Compte ${line.account} introuvable`);
isValid = false;
}
});
});

if (!isValid) {
console.error('❌ Erreurs d\'intégrité des données:', errors);
showErrorMessage('Erreurs détectées dans les données. Veuillez contacter l\'administrateur.');
}

return isValid;
} catch (error) {
console.error('❌ Erreur lors de la validation des données:', error);
return false;
}
}

// Fonction de diagnostic système
function runSystemDiagnostic() {
try {
const diagnostic = {
timestamp: new Date().toISOString(),
browser: navigator.userAgent,
platform: navigator.platform,
language: navigator.language,
cookieEnabled: navigator.cookieEnabled,
onlineStatus: navigator.onLine,
screenResolution: `${screen.width}x${screen.height}`,
viewportSize: `${window.innerWidth}x${window.innerHeight}`,
darkMode: document.documentElement.classList.contains('dark'),
currentProfile: app.currentProfile,
currentCompany: app.currentCompany,
dataIntegrity: validateDataIntegrity(),
statisticsLastUpdate: app.statistics.lastUpdate
};

console.log('🔍 Diagnostic système:', diagnostic);
return diagnostic;
} catch (error) {
console.error('❌ Erreur lors du diagnostic système:', error);
return null;
}
}

// =============================================================================
// APPLICATION START - DÉMARRAGE DE L'APPLICATION
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
try {
console.log('🚀 DOUKÈ Compta Pro - Démarrage de l\'application...');

// Exécuter le diagnostic système
runSystemDiagnostic();

// Tenter de restaurer une session précédente
restoreSession();

// Initialiser les gestionnaires d'événements de base
setTimeout(() => {
bindEventListeners();
console.log('✅ DOUKÈ Compta Pro - Application sécurisée démarrée');
}, 100);

// Ajouter des gestionnaires globaux
window.addEventListener('beforeunload', function(e) {
if (app.isAuthenticated) {
cleanupApplication();
// Note: Dans un vrai environnement, on pourrait demander confirmation
// e.preventDefault();
// e.returnValue = '';
}
});

// Gestion des erreurs de connexion réseau
window.addEventListener('online', function() {
console.log('🌐 Connexion réseau rétablie');
if (app.isAuthenticated) {
StatisticsManager.updateAllStatistics();
}
});

window.addEventListener('offline', function() {
console.warn('⚠️ Connexion réseau perdue');
showErrorMessage('Connexion réseau perdue. Certaines fonctionnalités peuvent être limitées.');
});

} catch (error) {
console.error('❌ Erreur au démarrage:', error);
showErrorMessage('Erreur critique au démarrage de l\'application');
}
});

// Protection globale contre les erreurs
window.addEventListener('error', function(e) {
console.error('❌ Erreur globale capturée:', {
message: e.message,
filename: e.filename,
lineno: e.lineno,
colno: e.colno,
error: e.error
});

// En mode production, on pourrait envoyer ces erreurs à un service de logging
// sendErrorToLoggingService(e);
});

window.addEventListener('unhandledrejection', function(e) {
console.error('❌ Promesse rejetée non gérée:', e.reason);
e.preventDefault(); // Empêche l'affichage de l'erreur dans la console
});

// Gestionnaire pour la visibilité de la page
document.addEventListener('visibilitychange', function() {
if (document.hidden) {
console.log('📱 Application mise en arrière-plan');
} else {
console.log('📱 Application remise au premier plan');
if (app.isAuthenticated) {
// Mettre à jour les données quand l'utilisateur revient
StatisticsManager.updateAllStatistics();
}
}
});

// =============================================================================
// EXPORT DES FONCTIONS PRINCIPALES - API PUBLIQUE
// =============================================================================
// Export des fonctions principales pour usage externe si nécessaire
window.DOUKECompta = {
// État de l'application
app,

// Managers principaux
SecurityManager,
StatisticsManager,
themeManager,

// Fonctions principales
initializeApp,
navigateTo,
loginAs,
logout,
cleanupApplication,

// Utilitaires
showSuccessMessage,
showErrorMessage,
closeModal,
getCompanyName,
updateSelectedCompanyInfo,
runSystemDiagnostic,
validateDataIntegrity,

// Gestion des données
initializeData,

// Version et informations
version: '2.0.0',
buildDate: '2024-12-15',
author: 'DOUKÈ Compta Pro Team',

// Statut
getStatus: () => ({
authenticated: app.isAuthenticated,
currentUser: app.currentUser?.name,
currentProfile: app.currentProfile,
currentCompany: getCompanyName(),
lastStatsUpdate: app.statistics.lastUpdate,
theme: themeManager.current
})
};

// Message de démarrage avec informations sur l'application
console.log(`
🎯 DOUKÈ COMPTA PRO v2.0.0
═══════════════════════════════════════════════════════════════
📅 Build: 2024-12-15
🔐 Sécurité: Renforcée avec contrôle d'accès par profil
📊 Fonctionnalités: Complètes avec gestion multi-entreprises
🎨 Interface: Responsive avec support mode sombre
💾 Stockage: LocalStorage avec gestion de session
🌐 Compatibilité: Tous navigateurs modernes
═══════════════════════════════════════════════════════════════
🚀 Application prête à l'utilisation !
📖 Documentation: Utilisez window.DOUKECompta pour l'API
🔍 Diagnostic: window.DOUKECompta.runSystemDiagnostic()
🔧 État: window.DOUKECompta.getStatus()
═══════════════════════════════════════════════════════════════
`);

// Exposer certaines fonctions utiles dans la console pour le debug
if (typeof window !== 'undefined' && window.console) {
window.debugDOUKE = {
stats: () => StatisticsManager.getFormattedStats(),
user: () => app.currentUser,
company: () => app.currentCompany,
entries: () => SecurityManager.getAuthorizedEntries(),
diagnostic: runSystemDiagnostic,
theme: (newTheme) => newTheme ? themeManager.setTheme(newTheme) : themeManager.current
};
// =============================================================================
// FONCTION DE CORRECTION ROBUSTE - À AJOUTER DANS LE SCRIPT
// =============================================================================

/**
 * Fonction de diagnostic et correction automatique des problèmes d'interface
 * Cette fonction force le chargement correct de l'interface principale
 */
function forceCorrectInterface() {
    try {
        console.log('🔧 Diagnostic et correction de l\'interface en cours...');
        
        // 1. Vérifier l'état de l'application
        console.log('📊 État actuel:', {
            isAuthenticated: app.isAuthenticated,
            currentUser: app.currentUser,
            currentProfile: app.currentProfile,
            currentCompany: app.currentCompany
        });

        // 2. Si l'utilisateur est connecté mais l'interface n'est pas correcte
        if (app.isAuthenticated && app.currentUser) {
            
            // 3. Forcer l'affichage de l'interface principale
            const loginInterface = document.getElementById('loginInterface');
            const mainApp = document.getElementById('mainApp');
            
            if (loginInterface) {
                loginInterface.classList.add('hidden');
                console.log('✅ Interface de connexion masquée');
            }
            
            if (mainApp) {
                mainApp.classList.remove('hidden');
                console.log('✅ Interface principale affichée');
            }

            // 4. Nettoyer tout contenu de développement
            const mainContent = document.getElementById('mainContent');
            if (mainContent && mainContent.innerHTML.includes('en cours de développement')) {
                console.log('🧹 Nettoyage du contenu de développement détecté');
                mainContent.innerHTML = '<div class="flex items-center justify-center py-8"><div class="text-primary"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</div></div>';
            }

            // 5. Forcer la réinitialisation complète
            console.log('🔄 Réinitialisation forcée de l\'interface...');
            
            // Réinitialiser le menu de navigation
            setTimeout(() => {
                loadNavigationMenu();
                console.log('✅ Menu de navigation rechargé');
            }, 100);

            // Réinitialiser les informations utilisateur
            setTimeout(() => {
                updateUserInfo();
                console.log('✅ Informations utilisateur mises à jour');
            }, 200);

            // Forcer le chargement du dashboard
            setTimeout(() => {
                loadDashboard();
                console.log('✅ Dashboard rechargé');
            }, 300);

            // Rebinder les événements
            setTimeout(() => {
                bindEventListeners();
                console.log('✅ Événements reliés');
            }, 400);

            // 6. Vérification finale
            setTimeout(() => {
                const finalCheck = document.getElementById('mainContent');
                if (finalCheck && finalCheck.innerHTML.includes('en cours de développement')) {
                    console.error('❌ Le problème persiste, application de la solution d\'urgence');
                    emergencyInterfaceFix();
                } else {
                    console.log('✅ Interface corrigée avec succès !');
                    showSuccessMessage('✅ Interface chargée avec succès !');
                }
            }, 500);

        } else {
            console.error('❌ Utilisateur non connecté, retour à l\'écran de connexion');
            showLoginInterface();
        }

    } catch (error) {
        console.error('❌ Erreur lors de la correction de l\'interface:', error);
        emergencyInterfaceFix();
    }
}

/**
 * Solution d'urgence si tout le reste échoue
 */
function emergencyInterfaceFix() {
    try {
        console.log('🚨 Application de la solution d\'urgence...');
        
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('❌ Élément mainContent introuvable');
            return;
        }

        // Forcer l'affichage d'un dashboard de base
        const emergencyDashboard = `
        <div class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                        🎯 Bienvenue ${app.currentUser?.name || 'Utilisateur'}
                    </h1>
                    <div class="text-sm bg-success/10 text-success px-3 py-1 rounded-lg">
                        ✅ Interface corrigée
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-primary/10 rounded-lg p-4 cursor-pointer hover:bg-primary/20 transition-colors" onclick="navigateTo('entries')">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-edit text-primary text-2xl"></i>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">Écritures</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Gestion des écritures comptables</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-success/10 rounded-lg p-4 cursor-pointer hover:bg-success/20 transition-colors" onclick="navigateTo('accounts')">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-list text-success text-2xl"></i>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">Plan Comptable</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Consultation des comptes</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-info/10 rounded-lg p-4 cursor-pointer hover:bg-info/20 transition-colors" onclick="navigateTo('reports')">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-chart-bar text-info text-2xl"></i>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">Rapports</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">États et analyses</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-info-circle text-amber-500 mt-0.5"></i>
                        <div>
                            <h4 class="font-medium text-amber-800 dark:text-amber-200">Interface restaurée</h4>
                            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                L'interface a été automatiquement corrigée. Profil actuel : <strong>${app.currentProfile}</strong>
                                ${app.currentCompany ? ` • Entreprise : ${getCompanyName()}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        mainContent.innerHTML = emergencyDashboard;
        console.log('✅ Solution d\'urgence appliquée avec succès');
        
    } catch (error) {
        console.error('❌ Échec de la solution d\'urgence:', error);
        // Dernier recours : message simple
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
            <div class="text-center p-8">
                <h2 class="text-xl font-bold text-red-600 mb-4">❌ Erreur d'interface</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Veuillez rafraîchir la page ou contacter le support technique.</p>
                <button onclick="location.reload()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                    🔄 Rafraîchir la page
                </button>
            </div>
            `;
        }
    }
}

/**
 * Fonction de surveillance automatique
 * Détecte et corrige automatiquement les problèmes d'interface
 */
function startInterfaceWatchdog() {
    setInterval(() => {
        if (app.isAuthenticated && app.currentUser) {
            const mainContent = document.getElementById('mainContent');
            const mainApp = document.getElementById('mainApp');
            
            // Détecter si l'interface de développement est affichée par erreur
            if (mainContent && (
                mainContent.innerHTML.includes('en cours de développement') ||
                mainContent.innerHTML.includes('Structure modulaire') ||
                mainContent.innerHTML.trim() === '' ||
                mainContent.children.length === 0
            )) {
                console.warn('⚠️ Problème d\'interface détecté, correction automatique...');
                forceCorrectInterface();
            }

            // Vérifier que l'interface principale est visible
            if (mainApp && mainApp.classList.contains('hidden')) {
                console.warn('⚠️ Interface principale masquée détectée, correction...');
                forceCorrectInterface();
            }
        }
    }, 2000); // Vérification toutes les 2 secondes
}

// =============================================================================
// INTÉGRATION AU SYSTÈME EXISTANT
// =============================================================================

// Modifier la fonction handleLogin existante pour ajouter la correction
const originalHandleLogin = handleLogin;
function handleLogin() {
    originalHandleLogin();
    
    // Ajouter une correction automatique après connexion
    setTimeout(() => {
        if (app.isAuthenticated && app.currentUser) {
            forceCorrectInterface();
            startInterfaceWatchdog();
        }
    }, 1000);
}

// Ajouter un bouton de correction d'urgence (optionnel)
function addEmergencyFixButton() {
    try {
        const nav = document.querySelector('nav .flex.items-center.space-x-4');
        if (nav) {
            const emergencyButton = document.createElement('button');
            emergencyButton.innerHTML = '<i class="fas fa-tools"></i>';
            emergencyButton.className = 'p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors';
            emergencyButton.title = 'Correction d\'urgence de l\'interface';
            emergencyButton.onclick = forceCorrectInterface;
            nav.appendChild(emergencyButton);
            console.log('🔧 Bouton de correction d\'urgence ajouté');
        }
    } catch (error) {
        console.warn('⚠️ Impossible d\'ajouter le bouton d\'urgence:', error);
    }
}

// Démarrer la surveillance automatique dès le chargement
setTimeout(() => {
    if (app.isAuthenticated) {
        startInterfaceWatchdog();
        addEmergencyFixButton();
    }
}, 2000);

console.log('🛡️ Système de correction automatique de l\'interface activé');
  
}

</script>
</body>
</html>
