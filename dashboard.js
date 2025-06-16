// =============================================================================
// DASHBOARD.JS - Tableaux de bord sécurisés par entreprise
// =============================================================================

function loadDashboard() {
    // Vérification critique de la sélection d'entreprise (sauf pour admin sans entreprise)
    if (!app.currentCompanyId && app.currentProfile !== 'admin') {
        showCompanySelectionRequired();
        return;
    }

    // Vérification de l'accès à l'entreprise sélectionnée
    if (app.currentCompanyId && !hasAccessToCompany(app.currentCompanyId)) {
        showAccessDeniedMessage('tableau de bord de cette entreprise');
        return;
    }

    console.log(`📊 Chargement du dashboard pour profil: ${app.currentProfile}, entreprise: ${app.currentCompanyId || 'GLOBALE'}`);

    // Charger le tableau de bord selon le profil
    switch (app.currentProfile) {
        case 'admin':
            if (app.currentCompanyId) {
                loadCompanyAdminDashboard();
            } else {
                loadGlobalAdminDashboard();
            }
            break;
        case 'collaborateur_senior':
        case 'collaborateur':
            loadCollaboratorDashboard();
            break;
        case 'user':
            loadUserDashboard();
            break;
        case 'caissier':
            loadCashierDashboard();
            break;
        default:
            loadStandardDashboard();
    }
}

// =============================================================================
// DASHBOARD ADMIN GLOBAL - VUE D'ENSEMBLE DE TOUTES LES ENTREPRISES
// =============================================================================

function loadGlobalAdminDashboard() {
    const accessibleCompanies = getAccessibleCompanies();
    const globalStats = calculateGlobalStats(accessibleCompanies);
    const syncStatus = dataSyncManager.getSyncStatus();

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-tachometer-alt mr-2 text-primary"></i>Tableau de Bord Administrateur
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm text-primary-light font-medium">
    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
    </div>
    <button onclick="refreshDashboard()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>

    <!-- Alerte de sélection d'entreprise -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
    <div class="flex items-center">
    <div class="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
    <i class="fas fa-info-circle text-blue-600 dark:text-blue-400"></i>
    </div>
    <div class="flex-1">
    <h3 class="font-medium text-blue-900 dark:text-blue-100">Vue d'ensemble globale</h3>
    <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
    Sélectionnez une entreprise spécifique dans le sélecteur pour accéder aux détails et fonctionnalités.
    </p>
    </div>
    </div>
    </div>

    <!-- KPI Cards Admin Global -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    ${generateGlobalAdminKPIs(globalStats)}
    </div>

    <!-- Statut de synchronisation -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    <i class="fas fa-sync mr-2 text-purple-500"></i>Statut de Synchronisation PIWA
    </h3>
    <div class="flex items-center space-x-2">
    ${syncStatus.inProgress ? `
    <div class="flex items-center text-blue-600">
    <i class="fas fa-spinner fa-spin mr-2"></i>
    <span class="text-sm">Synchronisation en cours...</span>
    </div>
    ` : `
    <div class="flex items-center text-green-600">
    <i class="fas fa-check-circle mr-2"></i>
    <span class="text-sm">Synchronisé</span>
    </div>
    `}
    </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="text-sm text-gray-600 dark:text-gray-400">Queue de synchronisation</div>
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${syncStatus.queueLength}</div>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="text-sm text-gray-600 dark:text-gray-400">En attente</div>
    <div class="text-2xl font-bold text-yellow-600">${syncStatus.pendingItems}</div>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="text-sm text-gray-600 dark:text-gray-400">Échecs</div>
    <div class="text-2xl font-bold text-red-600">${syncStatus.failedItems}</div>
    </div>
    </div>
    ${syncStatus.lastSync ? `
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
    Dernière synchronisation: ${new Date(syncStatus.lastSync).toLocaleString('fr-FR')}
    </div>
    ` : ''}
    </div>

    <!-- Portefeuille d'entreprises -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    <i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille d'Entreprises
    </h3>
    <div class="text-sm text-gray-500 dark:text-gray-400">
    ${accessibleCompanies.length} entreprise(s) accessible(s)
    </div>
    </div>
    <div class="space-y-4">
    ${generateCompaniesPortfolio(accessibleCompanies)}
    </div>
    </div>

    <!-- Graphiques globaux -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Répartition des Entreprises par Statut
    </h3>
    <div class="h-64">
    <canvas id="companiesStatusChart" width="400" height="200"></canvas>
    </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Activité Globale (Écritures)
    </h3>
    <div class="h-64">
    <canvas id="globalActivityChart" width="400" height="200"></canvas>
    </div>
    </div>
    </div>

    <!-- Actions administratives rapides -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-tools mr-2 text-primary"></i>Actions Rapides
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <button onclick="showAdminDataMenu()" class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-database text-xl mb-2"></i>
    <div class="font-medium">Gestion Données</div>
    </button>
    <button onclick="syncAllCompaniesData()" class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-sync text-xl mb-2"></i>
    <div class="font-medium">Sync Globale</div>
    </button>
    <button onclick="generateGlobalReport()" class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-chart-line text-xl mb-2"></i>
    <div class="font-medium">Rapport Global</div>
    </button>
    <button onclick="manageUsers()" class="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-users text-xl mb-2"></i>
    <div class="font-medium">Utilisateurs</div>
    </button>
    </div>
    </div>
    </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    
    setTimeout(() => {
        try {
            initializeGlobalAdminCharts(globalStats);
        } catch (error) {
            console.error('❌ Erreur chargement graphiques admin global:', error);
        }
    }, 200);
}

// =============================================================================
// DASHBOARD ADMIN SPÉCIFIQUE À UNE ENTREPRISE
// =============================================================================

function loadCompanyAdminDashboard() {
    updateFilteredDataCache();
    const companyStats = getCompanyStatistics();
    const entries = getSecureFilteredEntries();
    const accounts = getSecureCompanyAccountingPlan();
    const cashRegisters = getSecureFilteredCashRegisters();

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-tachometer-alt mr-2 text-primary"></i>Tableau de Bord - ${getCompanyName()}
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i>${getCompanyName()}
    </div>
    <button onclick="refreshDashboard()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>

    <!-- KPI Cards Entreprise -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    ${generateCompanyKPIs(companyStats)}
    </div>

    <!-- Alertes et notifications -->
    ${generateCompanyAlerts(companyStats)}

    <!-- Activité récente et résumé -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-clock mr-2 text-primary"></i>Activité Récente
    </h3>
    <div class="space-y-4">
    ${generateRecentActivity(entries)}
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-chart-bar mr-2 text-primary"></i>Résumé Comptable
    </h3>
    <div class="space-y-4">
    ${generateAccountingSummary(companyStats)}
    </div>
    </div>
    </div>

    <!-- Graphiques spécifiques à l'entreprise -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Évolution des Écritures (6 derniers mois)
    </h3>
    <div class="h-64">
    <canvas id="companyEntriesChart" width="400" height="200"></canvas>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Répartition par Journal
    </h3>
    <div class="h-64">
    <canvas id="companyJournalsChart" width="400" height="200"></canvas>
    </div>
    </div>
    </div>

    <!-- Actions rapides spécifiques à l'entreprise -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <button onclick="navigateTo('entries')" class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-plus text-xl mb-2"></i>
    <div class="font-medium">Nouvelle Écriture</div>
    </button>
    <button onclick="navigateTo('accounts')" class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-list text-xl mb-2"></i>
    <div class="font-medium">Plan Comptable</div>
    </button>
    <button onclick="generateCompanyReport()" class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-file-alt text-xl mb-2"></i>
    <div class="font-medium">Rapport</div>
    </button>
    <button onclick="syncCompanyData()" class="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-sync text-xl mb-2"></i>
    <div class="font-medium">Synchroniser</div>
    </button>
    </div>
    </div>
    </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    
    setTimeout(() => {
        try {
            initializeCompanyCharts(companyStats);
        } catch (error) {
            console.error('❌ Erreur chargement graphiques entreprise:', error);
        }
    }, 200);
}

// =============================================================================
// DASHBOARD COLLABORATEUR
// =============================================================================

function loadCollaboratorDashboard() {
    updateFilteredDataCache();
    const companyStats = getCompanyStatistics();
    const entries = getSecureFilteredEntries();
    const myEntries = getSecureEntriesByUser(app.currentUser.id);

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-user-tie mr-2 text-primary"></i>Mon Tableau de Bord
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i>${getCompanyName()}
    </div>
    <button onclick="refreshDashboard()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>

    <!-- KPI Cards Collaborateur -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Écritures</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${myEntries.length}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-edit text-primary text-xl"></i>
    </div>
    </div>
    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">Ce mois</div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">À Valider</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${entries.filter(e => e.status === 'En attente').length}
    </p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-clock text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Validées</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myEntries.filter(e => e.status === 'Validé').length}
    </p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-check text-success text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myEntries.length > 0 ? Math.round((myEntries.filter(e => e.status === 'Validé').length / myEntries.length) * 100) : 0}%
    </p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-chart-line text-info text-xl"></i>
    </div>
    </div>
    </div>
    </div>

    <!-- Mes tâches et actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-tasks mr-2 text-primary"></i>Mes Tâches Prioritaires
    </h3>
    <div class="space-y-3">
    ${generateCollaboratorTasks(entries)}
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-clock mr-2 text-primary"></i>Activité Récente
    </h3>
    <div class="space-y-3">
    ${generateMyRecentActivity(myEntries)}
    </div>
    </div>
    </div>

    <!-- Actions rapides collaborateur -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button onclick="navigateTo('entries')" class="bg-primary hover:bg-primary/90 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-plus text-xl mb-2"></i>
    <div class="font-medium">Nouvelle Écriture</div>
    </button>
    <button onclick="validatePendingEntries()" class="bg-success hover:bg-success/90 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-check text-xl mb-2"></i>
    <div class="font-medium">Valider Écritures</div>
    </button>
    <button onclick="navigateTo('accounts')" class="bg-info hover:bg-info/90 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-list text-xl mb-2"></i>
    <div class="font-medium">Plan Comptable</div>
    </button>
    </div>
    </div>
    </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// DASHBOARD UTILISATEUR
// =============================================================================

function loadUserDashboard() {
    updateFilteredDataCache();
    const companyStats = getCompanyStatistics();
    const myEntries = getSecureEntriesByUser(app.currentUser.id);

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-user mr-2 text-primary"></i>Mon Entreprise
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i>${getCompanyName()}
    </div>
    <button onclick="refreshDashboard()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>

    <!-- KPI Cards Utilisateur -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Écritures</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${myEntries.length}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-edit text-primary text-xl"></i>
    </div>
    </div>
    <div class="mt-3">
    <button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
    Nouvelle écriture
    </button>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myEntries.filter(e => e.status === 'En attente').length}
    </p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-clock text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Validées</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myEntries.filter(e => e.status === 'Validé').length}
    </p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-check text-success text-xl"></i>
    </div>
    </div>
    </div>
    </div>

    <!-- Mes écritures récentes -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-history mr-2 text-primary"></i>Mes Écritures Récentes
    </h3>
    <div class="space-y-3">
    ${generateMyRecentActivity(myEntries)}
    </div>
    </div>

    <!-- Actions rapides utilisateur -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <button onclick="navigateTo('entries')" class="bg-primary hover:bg-primary/90 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-plus text-xl mb-2"></i>
    <div class="font-medium">Nouvelle Écriture</div>
    </button>
    <button onclick="navigateTo('accounts')" class="bg-info hover:bg-info/90 text-white p-4 rounded-lg text-center transition-colors">
    <i class="fas fa-list text-xl mb-2"></i>
    <div class="font-medium">Consulter Plan Comptable</div>
    </button>
    </div>
    </div>
    </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// DASHBOARD CAISSIER
// =============================================================================

function loadCashierDashboard() {
    updateFilteredDataCache();
    const myEntries = getSecureEntriesByUser(app.currentUser.id);
    const myCashRegisters = getSecureFilteredCashRegisters().filter(cr => cr.responsibleId === app.currentUser.id);

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-cash-register mr-2 text-primary"></i>Ma Caisse
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i>${getCompanyName()}
    </div>
    <button onclick="refreshDashboard()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>

    <!-- KPI Cards Caissier -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Caisses</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${myCashRegisters.length}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-cash-register text-primary text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Solde Total</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myCashRegisters.reduce((sum, cr) => sum + (cr.balance || 0), 0).toLocaleString('fr-FR')}
    </p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-coins text-success text-xl"></i>
    </div>
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">FCFA</div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Opérations ce mois</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${myEntries.length}</p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-exchange-alt text-warning text-xl"></i>
    </div>
    </div>
    <div class="mt-3">
    <button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
    Nouvelle opération
    </button>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente validation</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${myEntries.filter(e => e.status === 'En attente').length}
    </p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-clock text-info text-xl"></i>
    </div>
    </div>
    </div>
    </div>

    <!-- Mes caisses -->
    ${myCashRegisters.length > 0 ? `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-cash-register mr-2 text-primary"></i>Mes Caisses
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${myCashRegisters.map(cr => `
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="flex items-center justify-between mb-2">
    <h4 class="font-medium text-gray-900 dark:text-white">${cr.name}</h4>
    <span class="px-2 py-1 rounded text-xs ${cr.status === 'Ouvert' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
    ${cr.status}
    </span>
    </div>
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${(cr.balance || 0).toLocaleString('fr-FR')} FCFA</div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
    Ouvert: ${(cr.openingBalance || 0).toLocaleString('fr-FR')} | 
    Recettes: ${(cr.dailyReceipts || 0).toLocaleString('fr-FR')} | 
    Dépenses: ${(cr.dailyExpenses || 0).toLocaleString('fr-FR')}
    </div>
    </div>
    `).join('')}
    </div>
    </div>
    ` : ''}

    <!-- Mes opérations récentes -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-history mr-2 text-primary"></i>Mes Opérations Récentes
    </h3>
    <div class="space-y-3">
    ${generateMyRecentActivity(myEntries)}
    </div>
    </div>
    </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// FONCTIONS DE GÉNÉRATION DE CONTENU
// =============================================================================

function generateGlobalAdminKPIs(globalStats) {
    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${globalStats.companies.active}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-building text-primary text-xl"></i>
    </div>
    </div>
    <div class="mt-2 flex items-center text-sm">
    <span class="text-success">+${globalStats.companies.total - globalStats.companies.active}</span>
    <span class="text-gray-500 dark:text-gray-400 ml-1">total: ${globalStats.companies.total}</span>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs Actifs</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${globalStats.users.active}</p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-users text-info text-xl"></i>
    </div>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
    Total: ${globalStats.users.total}
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${globalStats.entries.pending}</p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Écritures</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${globalStats.entries.total}</p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-check text-success text-xl"></i>
    </div>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
    Validées: ${globalStats.entries.validated}
    </div>
    </div>
    `;
}

function generateCompanyKPIs(companyStats) {
    if (!companyStats) {
        return '<div class="col-span-4 text-center text-gray-500">Aucune statistique disponible</div>';
    }

    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Total</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.entries.total}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-file-alt text-primary text-xl"></i>
    </div>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
    Ce mois: ${companyStats.entries.thisMonth}
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Validées</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.entries.validated}</p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-check-circle text-success text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.entries.pending}</p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-clock text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Comptes Actifs</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.accounts.active}</p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-list text-info text-xl"></i>
    </div>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
    Total: ${companyStats.accounts.total}
    </div>
    </div>
    `;
}

function generateCompaniesPortfolio(companies) {
    if (companies.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune entreprise accessible</div>';
    }

    return companies.map(company => {
        const companyEntries = app.entries.filter(e => e.companyId === company.id);
        const pendingEntries = companyEntries.filter(e => e.status === 'En attente');
        
        return `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onclick="selectCompanyAndRefresh(${company.id})">
        <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
        ${company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div>
        <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">${company.type} - ${company.status}</div>
        </div>
        </div>
        <div class="text-right">
        <div class="text-lg font-bold text-gray-900 dark:text-white">${companyEntries.length}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">écritures</div>
        ${pendingEntries.length > 0 ? `
        <div class="text-xs text-warning font-medium">${pendingEntries.length} en attente</div>
        ` : ''}
        </div>
        </div>
        `;
    }).join('');
}

function generateCompanyAlerts(companyStats) {
    const alerts = [];
    
    if (companyStats && companyStats.entries.pending > 0) {
        alerts.push({
            type: 'warning',
            icon: 'fas fa-exclamation-triangle',
            title: 'Écritures en attente',
            message: `${companyStats.entries.pending} écriture(s) nécessitent une validation`,
            action: 'validatePendingEntries()',
            actionText: 'Valider maintenant'
        });
    }

    if (companyStats && companyStats.accounts.total === 0) {
        alerts.push({
            type: 'info',
            icon: 'fas fa-chart-bar',
            title: 'Plan comptable vide',
            message: 'Cette entreprise n\'a pas encore de plan comptable configuré',
            action: 'navigateTo("accounts")',
            actionText: 'Configurer'
        });
    }

    if (alerts.length === 0) {
        return '';
    }

    return `
    <div class="space-y-4">
    ${alerts.map(alert => `
    <div class="bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-50 dark:bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-900/20 rounded-xl p-4 border border-${alert.type === 'warning' ? 'yellow' : 'blue'}-200 dark:border-${alert.type === 'warning' ? 'yellow' : 'blue'}-800">
    <div class="flex items-center justify-between">
    <div class="flex items-center">
    <div class="p-2 bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-100 dark:bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-800 rounded-lg mr-3">
    <i class="${alert.icon} text-${alert.type === 'warning' ? 'yellow' : 'blue'}-600 dark:text-${alert.type === 'warning' ? 'yellow' : 'blue'}-400"></i>
    </div>
    <div>
    <h4 class="font-medium text-${alert.type === 'warning' ? 'yellow' : 'blue'}-900 dark:text-${alert.type === 'warning' ? 'yellow' : 'blue'}-100">${alert.title}</h4>
    <p class="text-${alert.type === 'warning' ? 'yellow' : 'blue'}-700 dark:text-${alert.type === 'warning' ? 'yellow' : 'blue'}-300 text-sm">${alert.message}</p>
    </div>
    </div>
    <button onclick="${alert.action}" class="bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-500 hover:bg-${alert.type === 'warning' ? 'yellow' : 'blue'}-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
    ${alert.actionText}
    </button>
    </div>
    </div>
    `).join('')}
    </div>
    `;
}

function generateRecentActivity(entries) {
    const recentEntries = entries.slice(-5).reverse();
    
    if (recentEntries.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune activité récente</div>';
    }

    return recentEntries.map(entry => `
    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div class="flex items-center space-x-3">
    <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
    ${entry.journal}
    </div>
    <div>
    <div class="font-medium text-gray-900 dark:text-white text-sm">${entry.libelle}</div>
    <div class="text-xs text-gray-500 dark:text-gray-400">${new Date(entry.date).toLocaleDateString('fr-FR')}</div>
    </div>
    </div>
    <div class="text-right">
    <div class="text-sm font-medium text-gray-900 dark:text-white">
    ${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA
    </div>
    <span class="text-xs px-2 py-1 rounded ${entry.status === 'Validé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}">
    ${entry.status}
    </span>
    </div>
    </div>
    `).join('');
}

function generateMyRecentActivity(myEntries) {
    const recentEntries = myEntries.slice(-5).reverse();
    
    if (recentEntries.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune activité récente</div>';
    }

    return generateRecentActivity(recentEntries);
}

function generateAccountingSummary(companyStats) {
    if (!companyStats) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune donnée disponible</div>';
    }

    return `
    <div class="space-y-3">
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Plan comptable:</span>
    <span class="font-medium text-gray-900 dark:text-white">${companyStats.accounts.total} comptes</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Comptes actifs:</span>
    <span class="font-medium text-gray-900 dark:text-white">${companyStats.accounts.active}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Caisses:</span>
    <span class="font-medium text-gray-900 dark:text-white">${companyStats.cashRegisters.total}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Solde caisses:</span>
    <span class="font-medium text-gray-900 dark:text-white">${companyStats.cashRegisters.totalBalance.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Utilisateurs:</span>
    <span class="font-medium text-gray-900 dark:text-white">${companyStats.users.total}</span>
    </div>
    <div class="border-t pt-2 mt-2">
    <div class="flex justify-between font-semibold">
    <span class="text-gray-900 dark:text-white">Dernière mise à jour:</span>
    <span class="text-gray-900 dark:text-white">${new Date(companyStats.lastUpdate).toLocaleTimeString('fr-FR')}</span>
    </div>
    </div>
    </div>
    `;
}

function generateCollaboratorTasks(entries) {
    const pendingEntries = entries.filter(e => e.status === 'En attente');
    
    if (pendingEntries.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune tâche en attente</div>';
    }

    return pendingEntries.slice(0, 5).map(entry => `
    <div class="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
    <div class="flex items-center space-x-3">
    <div class="w-8 h-8 bg-warning text-white rounded-full flex items-center justify-center text-xs">
    <i class="fas fa-clock"></i>
    </div>
    <div>
    <div class="font-medium text-gray-900 dark:text-white text-sm">Valider écriture</div>
    <div class="text-xs text-gray-600 dark:text-gray-400">${entry.libelle}</div>
    </div>
    </div>
    <button onclick="validateEntry(${entry.id})" class="bg-success hover:bg-success/90 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
    Valider
    </button>
    </div>
    `).join('');
}

// =============================================================================
// FONCTIONS UTILITAIRES ET ACTIONS
// =============================================================================

function getAccessibleCompanies() {
    if (app.currentProfile === 'admin') {
        return app.companies;
    }
    
    return app.companies.filter(company => 
        app.currentUser.assignedCompanies && 
        app.currentUser.assignedCompanies.includes(company.id)
    );
}

function calculateGlobalStats(companies) {
    const allEntries = app.entries.filter(entry => 
        companies.some(c => c.id === entry.companyId)
    );
    
    const allUsers = app.users.filter(user => 
        companies.some(c => 
            user.assignedCompanies && user.assignedCompanies.includes(c.id)
        )
    );

    return {
        companies: {
            total: companies.length,
            active: companies.filter(c => c.status === 'Actif').length,
            trial: companies.filter(c => c.status === 'Période d\'essai').length,
            suspended: companies.filter(c => c.status === 'Suspendu').length
        },
        users: {
            total: allUsers.length,
            active: allUsers.filter(u => u.status === 'Actif').length,
            byRole: allUsers.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {})
        },
        entries: {
            total: allEntries.length,
            validated: allEntries.filter(e => e.status === 'Validé').length,
            pending: allEntries.filter(e => e.status === 'En attente').length,
            byJournal: allEntries.reduce((acc, entry) => {
                acc[entry.journal] = (acc[entry.journal] || 0) + 1;
                return acc;
            }, {})
        }
    };
}

function showCompanySelectionRequired() {
    const content = `
    <div class="min-h-screen flex items-center justify-center">
    <div class="text-center max-w-md mx-auto p-8">
    <div class="mb-6">
    <i class="fas fa-building text-6xl text-gray-400 mb-4"></i>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sélection d'entreprise requise</h2>
    <p class="text-gray-600 dark:text-gray-400">
    Veuillez sélectionner une entreprise dans le menu de navigation pour accéder au tableau de bord.
    </p>
    </div>
    
    <div class="space-y-4">
    ${getAccessibleCompanies().map(company => `
    <button onclick="selectCompanyAndRefresh(${company.id})" class="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left transition-colors">
    <div class="flex items-center space-x-3">
    <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
    ${company.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
    </div>
    <div>
    <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">${company.type} - ${company.status}</div>
    </div>
    </div>
    </button>
    `).join('')}
    </div>
    </div>
    </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function selectCompanyAndRefresh(companyId) {
    // Fonction qui sera définie dans le fichier principal
    if (typeof selectCompany === 'function') {
        selectCompany(companyId);
        loadDashboard();
    } else {
        console.error('Fonction selectCompany non trouvée');
    }
}

function refreshDashboard() {
    // Vider le cache pour forcer la mise à jour
    clearFilteredDataCache();
    loadDashboard();
    showSuccessMessage('Tableau de bord actualisé.');
}

function validatePendingEntries() {
    navigateTo('entries');
    // Le filtrage par statut sera fait dans entries.js
    setTimeout(() => {
        if (typeof filterEntries === 'function') {
            document.getElementById('statusFilter').value = 'En attente';
            filterEntries();
        }
    }, 500);
}

function generateCompanyReport() {
    showSuccessMessage('Génération de rapport - Fonctionnalité en cours de développement.');
}

function generateGlobalReport() {
    showSuccessMessage('Génération de rapport global - Fonctionnalité en cours de développement.');
}

function syncCompanyData() {
    if (dataSyncManager.canSyncData() && app.currentCompanyId) {
        dataSyncManager.forceSyncCompanyData(app.currentCompanyId)
            .then(() => {
                showSuccessMessage('Synchronisation de l\'entreprise terminée.');
                refreshDashboard();
            })
            .catch(error => {
                showErrorMessage('Erreur lors de la synchronisation: ' + error.message);
            });
    } else {
        showErrorMessage('Synchronisation non autorisée ou aucune entreprise sélectionnée.');
    }
}

function manageUsers() {
    showSuccessMessage('Gestion des utilisateurs - Fonctionnalité en cours de développement.');
}

// =============================================================================
// FONCTIONS DE GRAPHIQUES SÉCURISÉES
// =============================================================================

function initializeGlobalAdminCharts(globalStats) {
    try {
        // Graphique des statuts d'entreprises
        const companiesCtx = document.getElementById('companiesStatusChart');
        if (companiesCtx) {
            new Chart(companiesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Actives', 'Période d\'essai', 'Suspendues'],
                    datasets: [{
                        data: [
                            globalStats.companies.active,
                            globalStats.companies.trial,
                            globalStats.companies.suspended
                        ],
                        backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // Graphique d'activité globale
        setTimeout(() => {
            const activityCtx = document.getElementById('globalActivityChart');
            if (activityCtx) {
                new Chart(activityCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(globalStats.entries.byJournal),
                        datasets: [{
                            label: 'Nombre d\'écritures',
                            data: Object.values(globalStats.entries.byJournal),
                            backgroundColor: '#5D5CDE'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('❌ Erreur initialisation graphiques admin global:', error);
    }
}

function initializeCompanyCharts(companyStats) {
    try {
        // Graphique des écritures de l'entreprise
        const entriesCtx = document.getElementById('companyEntriesChart');
        if (entriesCtx && companyStats) {
            // Données simulées pour les 6 derniers mois
            const monthlyData = generateMonthlyEntriesData(companyStats.entries.total);
            
            new Chart(entriesCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Écritures',
                        data: monthlyData,
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Graphique des journaux
        setTimeout(() => {
            const journalsCtx = document.getElementById('companyJournalsChart');
            if (journalsCtx && companyStats) {
                new Chart(journalsCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(companyStats.entries.byJournal),
                        datasets: [{
                            data: Object.values(companyStats.entries.byJournal),
                            backgroundColor: ['#5D5CDE', '#3B82F6', '#0284C7', '#059669', '#D97706', '#DC2626']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('❌ Erreur initialisation graphiques entreprise:', error);
    }
}

function generateMonthlyEntriesData(totalEntries) {
    // Générer des données réalistes basées sur le total
    const base = Math.max(1, Math.floor(totalEntries / 6));
    return [
        Math.max(0, base + Math.floor(Math.random() * base)),
        Math.max(0, base + Math.floor(Math.random() * base)),
        Math.max(0, base + Math.floor(Math.random() * base)),
        Math.max(0, base + Math.floor(Math.random() * base)),
        Math.max(0, base + Math.floor(Math.random() * base)),
        Math.max(0, totalEntries - (base * 5)) // Ajuster le dernier mois
    ];
}

// =============================================================================
// DASHBOARD STANDARD (FALLBACK)
// =============================================================================

function loadStandardDashboard() {
    const content = `
    <div class="min-h-screen flex items-center justify-center">
    <div class="text-center max-w-md mx-auto p-8">
    <div class="mb-6">
    <i class="fas fa-user-circle text-6xl text-gray-400 mb-4"></i>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tableau de Bord</h2>
    <p class="text-gray-600 dark:text-gray-400">
    Profil utilisateur non reconnu. Veuillez contacter l'administrateur.
    </p>
    </div>
    </div>
    </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getCompanyName() {
    const company = app.companies.find(c => c.id === app.currentCompanyId);
    return company ? company.name : 'Entreprise inconnue';
}

function showAccessDeniedMessage(resource) {
    showErrorMessage(`Accès refusé au ${resource}. Veuillez contacter votre administrateur.`);
}

function showSuccessMessage(message) {
    if (typeof window.showSuccessMessage === 'function') {
        window.showSuccessMessage(message);
    } else {
        alert('✅ ' + message);
    }
}

function showErrorMessage(message) {
    if (typeof window.showErrorMessage === 'function') {
        window.showErrorMessage(message);
    } else {
        alert('❌ ' + message);
    }
}

function navigateTo(page) {
    if (typeof window.navigateTo === 'function') {
        window.navigateTo(page);
    } else {
        console.error('Fonction navigateTo non trouvée');
    }
}

console.log('✅ Module dashboard.js chargé avec sécurité renforcée par entreprise');
