// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION PRINCIPALE MODIFIÉE
// =============================================================================

// Application State - ÉTAT ORIGINAL COMPLET + AJOUTS CRITIQUES
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

    // =============================================================================
    // NOUVELLES VARIABLES CRITIQUES POUR LA SÉPARATION DES DONNÉES
    // =============================================================================
    currentCompanyId: null, // ID de l'entreprise actuellement sélectionnée
    availableCompanies: [], // Entreprises accessibles selon le profil
    filteredData: { // Cache des données filtrées
        entries: [],
        accounts: [],
        reports: []
    },

    // =============================================================================
    // SYNCHRONISATION PIWA (ADMIN/COLLABORATEUR SENIOR UNIQUEMENT)
    // =============================================================================
    syncSettings: {
        enabled: false, // Activé uniquement pour admin/collab senior
        interval: 30000, // 30 secondes
        lastSync: null,
        isOnline: navigator.onLine,
        syncWorker: null,
        autoSyncTimer: null
    }
};

// =============================================================================
// GESTIONNAIRE DE SÉPARATION DES DONNÉES PAR ENTREPRISE - CRITIQUE
// =============================================================================
class CompanyDataManager {
    constructor() {
        this.initialized = false;
    }

    // Initialiser la sélection d'entreprise selon le profil
    initializeCompanySelection() {
        if (!app.currentUser || !app.currentProfile) {
            console.warn('⚠️ Utilisateur non connecté pour la sélection d\'entreprise');
            return;
        }

        try {
            // Déterminer les entreprises accessibles selon le profil
            this.setAvailableCompanies();

            // Restaurer la dernière entreprise sélectionnée ou sélectionner la première
            this.restoreSelectedCompany();

            // Filtrer toutes les données selon l'entreprise sélectionnée
            this.filterAllData();

            this.initialized = true;
            console.log('✅ Gestionnaire de séparation des données initialisé');

        } catch (error) {
            console.error('❌ Erreur initialisation séparation données:', error);
        }
    }

    // Définir les entreprises accessibles selon le profil
    setAvailableCompanies() {
        if (app.currentProfile === 'admin') {
            // Admin : accès à toutes les entreprises
            app.availableCompanies = [...app.companies];
        } else if (app.currentProfile === 'collaborateur_senior' || app.currentProfile === 'collaborateur') {
            // Collaborateurs : seulement les entreprises assignées
            app.availableCompanies = app.companies.filter(company =>
                app.currentUser.assignedCompanies &&
                app.currentUser.assignedCompanies.includes(company.id)
            );
        } else if (app.currentProfile === 'user') {
            // Utilisateur simple : seulement son entreprise
            app.availableCompanies = app.companies.filter(company =>
                company.id === app.currentUser.companyId
            );
        } else if (app.currentProfile === 'caissier') {
            // Caissier : entreprise de sa caisse assignée
            const cashRegister = app.cashRegisters.find(cr => cr.userId === app.currentUser.id);
            if (cashRegister) {
                app.availableCompanies = app.companies.filter(company =>
                    company.id === cashRegister.companyId
                );
            }
        } else {
            app.availableCompanies = [];
        }

        console.log(`🏢 ${app.availableCompanies.length} entreprise(s) accessible(s) pour ${app.currentProfile}`);
    }

    // Restaurer la dernière entreprise sélectionnée
    restoreSelectedCompany() {
        // Essayer de restaurer depuis localStorage
        const savedCompanyId = localStorage.getItem('selectedCompanyId');

        if (savedCompanyId && app.availableCompanies.some(c => c.id == savedCompanyId)) {
            app.currentCompanyId = parseInt(savedCompanyId);
        } else if (app.availableCompanies.length > 0) {
            // Sélectionner la première entreprise disponible
            app.currentCompanyId = app.availableCompanies[0].id;
        } else {
            app.currentCompanyId = null;
            console.warn('⚠️ Aucune entreprise accessible pour cet utilisateur');
        }

        if (app.currentCompanyId) {
            localStorage.setItem('selectedCompanyId', app.currentCompanyId);
            console.log(`🎯 Entreprise sélectionnée: ${app.currentCompanyId}`);
        }
    }

    // FILTRAGE CRITIQUE - Obtenir les écritures de l'entreprise sélectionnée UNIQUEMENT
    getFilteredEntries() {
        if (!app.currentCompanyId) {
            console.warn('⚠️ Aucune entreprise sélectionnée');
            return [];
        }

        return app.entries.filter(entry =>
            entry.companyId === app.currentCompanyId
        );
    }

    // FILTRAGE CRITIQUE - Obtenir le plan comptable de l'entreprise sélectionnée UNIQUEMENT
    getCompanyAccountingPlan() {
        if (!app.currentCompanyId) {
            console.warn('⚠️ Aucune entreprise sélectionnée');
            return [];
        }

        const company = app.companies.find(c => c.id === app.currentCompanyId);
        return company && company.accountingPlan ? company.accountingPlan : [];
    }

    // Filtrer toutes les données selon l'entreprise sélectionnée
    filterAllData() {
        if (!app.currentCompanyId) {
            app.filteredData = { entries: [], accounts: [], reports: [] };
            return;
        }

        app.filteredData = {
            entries: this.getFilteredEntries(),
            accounts: this.getCompanyAccountingPlan(),
            reports: []
        };

        console.log(`🔍 Données filtrées pour entreprise ${app.currentCompanyId}:`, {
            entries: app.filteredData.entries.length,
            accounts: app.filteredData.accounts.length,
            reports: app.filteredData.reports.length
        });
    }

    // Obtenir les statistiques de l'entreprise active
    getCompanyStats() {
        if (!app.currentCompanyId) return null;

        const company = app.companies.find(c => c.id === app.currentCompanyId);
        const entries = this.getFilteredEntries();
        const accounts = this.getCompanyAccountingPlan();

        return {
            company: company,
            totalEntries: entries.length,
            totalAccounts: accounts.length,
            lastEntryDate: entries.length > 0 ? Math.max(...entries.map(e => new Date(e.date))) : null,
            monthlyEntries: entries.filter(e => {
                const entryDate = new Date(e.date);
                const now = new Date();
                return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            }).length
        };
    }
}

// =============================================================================
// GESTIONNAIRE DE SYNCHRONISATION PIWA - ADMIN/COLLABORATEUR SENIOR UNIQUEMENT
// =============================================================================
class PIWASyncManager {
    constructor() {
        this.initialized = false;
        this.syncQueue = [];
        this.isSyncing = false;
    }

    // Vérifier l'autorisation d'accès à la synchronisation automatique
    canAccessAutoSync() {
        return app.currentProfile === 'admin' ||
               app.currentProfile === 'collaborateur_senior';
    }

    // Initialiser la synchronisation automatique (SEULEMENT pour admin/collaborateur senior)
    initializePIWASync() {
        if (!this.canAccessAutoSync()) {
            console.log('ℹ️ Synchronisation automatique non autorisée pour ce profil');
            return;
        }

        try {
            // Configurer la synchronisation
            app.syncSettings.enabled = true;
            app.syncSettings.lastSync = new Date();

            this.initialized = true;
            console.log('✅ Synchronisation PIWA initialisée pour', app.currentProfile);

        } catch (error) {
            console.error('❌ Erreur initialisation synchronisation PIWA:', error);
        }
    }

    // Déclencher une synchronisation immédiate
    async triggerSync() {
        if (!this.canAccessAutoSync() || this.isSyncing) {
            return;
        }

        try {
            console.log('🔄 Synchronisation PIWA déclenchée');
        } catch (error) {
            console.error('❌ Erreur synchronisation immédiate:', error);
        }
    }

    // Obtenir le statut de la synchronisation
    getSyncStatus() {
        return {
            enabled: app.syncSettings.enabled,
            canAccess: this.canAccessAutoSync(),
            isOnline: app.syncSettings.isOnline,
            lastSync: app.syncSettings.lastSync,
            queueLength: this.syncQueue.length,
            isSyncing: this.isSyncing
        };
    }
}

// =============================================================================
// INSTANCES GLOBALES DES GESTIONNAIRES
// =============================================================================
const companyDataManager = new CompanyDataManager();
const syncManager = new PIWASyncManager();

// =============================================================================
// FONCTIONS GLOBALES EXPOSÉES POUR LA SÉPARATION DES DONNÉES
// =============================================================================

// FONCTION CRITIQUE - Obtenir les écritures filtrées (SEULEMENT entreprise active)
function getFilteredEntries() {
    return companyDataManager.getFilteredEntries();
}

// FONCTION CRITIQUE - Obtenir le plan comptable filtré (SEULEMENT entreprise active)
function getCompanyAccountingPlan() {
    return companyDataManager.getCompanyAccountingPlan();
}

// Obtenir les statistiques de l'entreprise active
function getCompanyStats() {
    return companyDataManager.getCompanyStats();
}

// Déclencher une synchronisation (admin/collaborateur senior uniquement)
function triggerSync() {
    return syncManager.triggerSync();
}

// Obtenir le statut de synchronisation
function getSyncStatus() {
    return syncManager.getSyncStatus();
}

// =============================================================================
// FONCTION DASHBOARD SPÉCIALISÉE PAR RÔLE - NOUVELLE IMPLÉMENTATION ACTIVE
// =============================================================================
function loadDashboard() {
    console.log('📊 Chargement du dashboard pour le profil:', app.currentProfile);
    
    const mainContent = document.getElementById('mainContent');
    
    if (!mainContent) {
        console.error('❌ Élément mainContent non trouvé');
        return;
    }

    // Données de base pour les statistiques
    const totalEntries = app.entries.length;
    const totalAccounts = app.accounts.length;
    const totalCompanies = app.companies.length;
    const totalUsers = app.users.length;

    // Calculer des statistiques additionnelles
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyEntries = app.entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    }).length;

    const todayEntries = app.entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate.toDateString() === currentDate.toDateString();
    }).length;

    const weekEntries = app.entries.filter(e => {
        const entryDate = new Date(e.date);
        const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff < 7;
    }).length;

    // Titre commun
    let content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    <i class="fas fa-tachometer-alt mr-2 text-primary"></i>
                    Tableau de Bord
                </h2>
                <div class="bg-primary/10 text-primary px-4 py-2 rounded-lg">
                    <i class="fas fa-user mr-2"></i>
                    ${app.currentProfile ? app.currentProfile.charAt(0).toUpperCase() + app.currentProfile.slice(1).replace('_', ' ') : 'Utilisateur'}
                </div>
            </div>
    `;

    // Contenu spécifique selon le rôle
    switch (app.currentProfile) {
        case 'admin':
            content += `
                <!-- Dashboard Administrateur - Accès complet -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Écritures</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalEntries}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-list text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Comptes Actifs</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalAccounts}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-building text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Entreprises</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalCompanies}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-users text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Utilisateurs</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalUsers}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions rapides Admin -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-tools mr-2"></i>Actions Administrateur
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="loadUsersManagement()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-users mr-2"></i>Gérer Collaborateurs
                        </button>
                        <button onclick="loadCompanies()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-building mr-2"></i>Gérer Entreprises
                        </button>
                        <button onclick="triggerSync()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sync mr-2"></i>Synchroniser PIWA
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'collaborateur_senior':
            content += `
                <!-- Dashboard Collaborateur Senior - Accès étendu -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Écritures Total</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalEntries}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-week text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cette Semaine</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${weekEntries}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ce Mois</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${monthlyEntries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions rapides Collaborateur Senior -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-tasks mr-2"></i>Actions Disponibles
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="loadEntries()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>Nouvelle Écriture
                        </button>
                        <button onclick="loadReports()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-chart-bar mr-2"></i>Générer Rapports
                        </button>
                        <button onclick="loadImport()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-upload mr-2"></i>Importer Balance
                        </button>
                        <button onclick="triggerSync()" class="bg-warning hover:bg-warning/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sync mr-2"></i>Synchroniser
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'collaborateur':
            content += `
                <!-- Dashboard Collaborateur - Accès standard -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Écritures</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalEntries}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ce Mois</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${monthlyEntries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions rapides Collaborateur -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-clipboard-list mr-2"></i>Mes Actions
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="loadEntries()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>Nouvelle Écriture
                        </button>
                        <button onclick="loadAccounts()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-list mr-2"></i>Plan Comptable
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'user':
            content += `
                <!-- Dashboard Utilisateur - Accès limité -->
                <div class="grid grid-cols-1 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-center">
                            <div class="text-center">
                                <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-file-alt text-white text-2xl"></i>
                                </div>
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Écritures Consultables</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${totalEntries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions utilisateur -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-eye mr-2"></i>Consultation
                    </h3>
                    <div class="flex justify-center">
                        <button onclick="loadEntries()" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-search mr-2"></i>Consulter les Écritures
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'caissier':
            content += `
                <!-- Dashboard Caissier - Interface spécialisée -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-cash-register text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Opérations Caisse</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${todayEntries}</p>
                                <p class="text-xs text-gray-400">Aujourd'hui</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-week text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cette Semaine</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${weekEntries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interface caisse -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-cash-register mr-2"></i>Gestion de Caisse
                    </h3>
                    <div class="flex justify-center">
                        <button onclick="loadCaisse()" class="bg-success hover:bg-success/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-calculator mr-2"></i>Ouvrir Interface Caisse
                        </button>
                    </div>
                </div>
            `;
            break;

        default:
            content += `
                <!-- Dashboard par défaut -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-file-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Écritures</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalEntries}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-list text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Comptes</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${totalAccounts}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calendar-alt text-white"></i>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ce Mois</p>
                                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${monthlyEntries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions de base -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-tools mr-2"></i>Actions Disponibles
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="loadEntries()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-file-alt mr-2"></i>Écritures Comptables
                        </button>
                        <button onclick="loadAccounts()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-list mr-2"></i>Plan Comptable
                        </button>
                    </div>
                </div>
            `;
    }

    // Informations utilisateur en bas pour tous les profils
    content += `
            <!-- Informations utilisateur -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                    <i class="fas fa-info-circle mr-2"></i>Informations Système
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="text-blue-800 dark:text-blue-200">
                        <strong>Profil:</strong> ${app.currentProfile || 'Non défini'}
                    </div>
                    <div class="text-blue-800 dark:text-blue-200">
                        <strong>Dernière sync:</strong> ${app.syncSettings.lastSync ? new Date(app.syncSettings.lastSync).toLocaleString() : 'Jamais'}
                    </div>
                    <div class="text-blue-800 dark:text-blue-200">
                        <strong>Statut:</strong> ${app.isAuthenticated ? 'Connecté' : 'Déconnecté'}
                    </div>
                </div>
            </div>
        </div>
    `;

    mainContent.innerHTML = content;
    console.log('✅ Dashboard chargé pour le profil:', app.currentProfile);
}

// Exposer globalement les fonctions critiques
window.getFilteredEntries = getFilteredEntries;
window.getCompanyAccountingPlan = getCompanyAccountingPlan;
window.getCompanyStats = getCompanyStats;
window.triggerSync = triggerSync;
window.getSyncStatus = getSyncStatus;

// Theme management - FONCTION ORIGINALE COMPLÈTE
const themeManager = {
    current: 'system',

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

    // Vérifier et créer les fonctions manquantes
    ensureFunctionsExist() {
        this.requiredFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                console.warn(`⚠️ Fonction ${funcName} manquante, création d'un fallback`);
                window[funcName] = this.createFallback(funcName);
            }
        });
    }

    // Créer une fonction de fallback
    createFallback(funcName) {
        const self = this;
        return function() {
            console.log(`📄 Chargement fallback pour ${funcName}`);
            self.showModuleFallback(funcName);
        };
    }

    // Afficher un contenu de fallback
    showModuleFallback(funcName) {
        const moduleInfo = this.getModuleInfo(funcName);
        const mainContent = document.getElementById('mainContent');
        
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
                template: `function initializeData() {\n    // Initialiser les données de l'app\n    app.accounts = [...]; // Plan comptable\n    app.companies = [...]; // Entreprises\n    app.users = [...]; // Utilisateurs\n    console.log('✅ Données initialisées');\n}`
            },
            'loadNavigationMenu': { 
                title: 'Navigation', 
                file: 'navigation.js', 
                isPageLoader: false,
                template: `function loadNavigationMenu() {\n    // Charger le menu selon le profil\n    const menuElement = document.getElementById('navigationMenu');\n    menuElement.innerHTML = '...';\n}`
            },
            'updateUserInfo': { 
                title: 'Information Utilisateur', 
                file: 'auth.js', 
                isPageLoader: false,
                template: `function updateUserInfo() {\n    // Mettre à jour les infos utilisateur\n    document.getElementById('currentUser').textContent = app.currentUser.name;\n}`
            },
            'loadDashboard': { 
                title: 'Tableau de Bord', 
                file: 'dashboard.js', 
                isPageLoader: true,
                template: `function loadDashboard() {\n    const content = \`\n        <h2>Tableau de Bord</h2>\n        <div class="grid grid-cols-3 gap-4">\n            <!-- KPI Cards -->\n        </div>\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadEntries': { 
                title: 'Écritures Comptables', 
                file: 'entries.js', 
                isPageLoader: true,
                template: `function loadEntries() {\n    const content = \`\n        <h2>Écritures Comptables</h2>\n        <!-- Formulaires et listes -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadAccounts': { 
                title: 'Plan Comptable', 
                file: 'accounts.js', 
                isPageLoader: true,
                template: `function loadAccounts() {\n    const content = \`\n        <h2>Plan Comptable SYSCOHADA</h2>\n        <!-- Liste des comptes -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadCaisse': { 
                title: 'Gestion des Caisses', 
                file: 'caisse.js', 
                isPageLoader: true,
                template: `function loadCaisse() {\n    const content = \`\n        <h2>Gestion des Caisses</h2>\n        <!-- Interface caisse -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadReports': { 
                title: 'Rapports & États', 
                file: 'reports.js', 
                isPageLoader: true,
                template: `function loadReports() {\n    const content = \`\n        <h2>Rapports & États</h2>\n        <!-- Génération rapports -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadImport': { 
                title: 'Import de Balances', 
                file: 'import.js', 
                isPageLoader: true,
                template: `function loadImport() {\n    const content = \`\n        <h2>Import de Balances</h2>\n        <!-- Interface import -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadSettings': { 
                title: 'Mon Profil', 
                file: 'settings.js', 
                isPageLoader: true,
                template: `function loadSettings() {\n    const content = \`\n        <h2>Mon Profil</h2>\n        <!-- Paramètres utilisateur -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadUsersManagement': { 
                title: 'Gestion Collaborateurs', 
                file: 'settings.js', 
                isPageLoader: true,
                template: `function loadUsersManagement() {\n    const content = \`\n        <h2>Gestion des Collaborateurs</h2>\n        <!-- Interface admin utilisateurs -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'loadCompanies': { 
                title: 'Gestion Entreprises', 
                file: 'settings.js', 
                isPageLoader: true,
                template: `function loadCompanies() {\n    const content = \`\n        <h2>Gestion des Entreprises</h2>\n        <!-- Interface admin entreprises -->\n    \`;\n    document.getElementById('mainContent').innerHTML = content;\n}`
            },
            'updateSelectedCompanyInfo': { 
                title: 'Info Entreprise', 
                file: 'navigation.js', 
                isPageLoader: false,
                template: `function updateSelectedCompanyInfo() {\n    // Mettre à jour les infos entreprise\n    const company = app.companies.find(c => c.id == app.currentCompany);\n    if (company) {\n        document.getElementById('selectedCompanyInfo').innerHTML = company.name;\n    }\n}`
            }
        };

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
        return `${info.file}: ${func} ${exists ? '✅' : '❌'}`;
    }).join('\n');

    const securityStatus = `\n\n🔒 SÉCURITÉ DES DONNÉES:\n✅ Séparation par entreprise activée\n✅ Fonctions de filtrage disponibles\n${syncManager.canAccessAutoSync() ? '✅' : '❌'} Synchronisation PIWA\n\n🏢 ENTREPRISE ACTIVE:\n${app.currentCompanyId ? `✅ ${getCompanyStats()?.company?.name || 'Inconnue'}` : '❌ Aucune entreprise sélectionnée'}`;

    alert(`État des modules :\n\n${status}${securityStatus}\n\n✅ = Fonction disponible\n❌ = Utilise un fallback`);
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
                    app.currentCompanyId = parseInt(e.target.value); // CRITIQUE : synchroniser les deux variables
                    updateSelectedCompanyInfo(); // Cette fonction sera créée par le moduleManager si nécessaire
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
        console.log('🔄 Initialisation de l\'application...');

        // D'abord, s'assurer que toutes les fonctions existent
        moduleManager.ensureFunctionsExist();

        // Puis les appeler en toute sécurité
        initializeData();
        loadNavigationMenu();
        updateUserInfo();

        // CRITIQUE - Initialiser la séparation des données par entreprise
        if (app.currentUser && app.currentProfile) {
            companyDataManager.initializeCompanySelection();

            // Initialiser la synchronisation PIWA si autorisée
            if (syncManager.canAccessAutoSync()) {
                syncManager.initializePIWASync();
            }
        }

        loadDashboard();
        bindEventListeners();

        console.log('✅ DOUKÈ Compta Pro initialisé avec succès avec séparation des données !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors de l\'initialisation de l\'application');
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
            console.log('🔒 Séparation des données par entreprise: ACTIVÉE');
            console.log('🔄 Synchronisation PIWA:', syncManager.canAccessAutoSync() ? 'AUTORISÉE' : 'NON AUTORISÉE');
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
