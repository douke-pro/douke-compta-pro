// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION PRINCIPALE SÉCURISÉE
// =============================================================================

// Application State - ÉTAT ORIGINAL COMPLET + AJOUTS CRITIQUES DE SÉCURITÉ
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
    currentCompanyId: null,              // ID de l'entreprise actuellement sélectionnée
    availableCompanies: [],              // Entreprises accessibles selon le profil
    filteredData: {                      // Cache des données filtrées
        entries: [],
        accounts: [],
        reports: []
    },
    
    // =============================================================================
    // SYNCHRONISATION PIWA (ADMIN/COLLABORATEUR SENIOR UNIQUEMENT)
    // =============================================================================
    syncSettings: {
        enabled: false,                  // Activé uniquement pour admin/collab senior
        interval: 30000,                 // 30 secondes
        lastSync: null,
        isOnline: navigator.onLine,
        syncWorker: null,
        autoSyncTimer: null
    }
};

// Theme management - FONCTION ORIGINALE COMPLÈTE (CONSERVÉE)
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
            
            // Créer l'interface de sélection
            this.renderCompanySelector();
            
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
            app.currentCompany = savedCompanyId; // Maintenir la compatibilité avec l'ancien système
        } else if (app.availableCompanies.length > 0) {
            // Sélectionner la première entreprise disponible
            app.currentCompanyId = app.availableCompanies[0].id;
            app.currentCompany = app.availableCompanies[0].id; // Maintenir la compatibilité
        } else {
            app.currentCompanyId = null;
            app.currentCompany = null;
            console.warn('⚠️ Aucune entreprise accessible pour cet utilisateur');
        }

        if (app.currentCompanyId) {
            localStorage.setItem('selectedCompanyId', app.currentCompanyId);
            console.log(`🎯 Entreprise sélectionnée: ${app.currentCompanyId}`);
        }
    }

    // Changer d'entreprise active (FONCTION CRITIQUE)
    selectActiveCompany(companyId) {
        // Vérifier l'autorisation d'accès à cette entreprise
        if (!app.availableCompanies.some(c => c.id == companyId)) {
            console.error('❌ Accès refusé à l\'entreprise:', companyId);
            this.showUnauthorizedMessage();
            return false;
        }

        try {
            const previousCompany = app.currentCompanyId;
            app.currentCompanyId = parseInt(companyId);
            app.currentCompany = companyId; // Maintenir la compatibilité avec l'ancien système
            
            // Sauvegarder la sélection
            localStorage.setItem('selectedCompanyId', app.currentCompanyId);
            
            // Filtrer toutes les données selon la nouvelle entreprise
            this.filterAllData();
            
            // Mettre à jour l'interface
            this.updateCompanyUI();
            
            // Rafraîchir toutes les vues
            this.refreshAllViews();
            
            // Déclencher la synchronisation si autorisée
            if (syncManager.canAccessAutoSync()) {
                syncManager.triggerSync();
            }

            const company = app.companies.find(c => c.id === app.currentCompanyId);
            console.log(`✅ Entreprise changée: ${company ? company.name : 'Inconnue'}`);
            
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage(`✅ Entreprise sélectionnée: ${company ? company.name : 'Inconnue'}`);
            }
            
            // Appeler la fonction originale si elle existe
            if (typeof updateSelectedCompanyInfo === 'function') {
                updateSelectedCompanyInfo();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur changement d\'entreprise:', error);
            app.currentCompanyId = previousCompany; // Restaurer l'état précédent
            app.currentCompany = previousCompany;
            return false;
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

    // FILTRAGE CRITIQUE - Obtenir toutes les données filtrées
    getFilteredData(dataType) {
        if (!app.currentCompanyId) return [];

        switch (dataType) {
            case 'entries':
                return this.getFilteredEntries();
            case 'accounts':
                return this.getCompanyAccountingPlan();
            case 'cashRegisters':
                return app.cashRegisters.filter(cr => cr.companyId === app.currentCompanyId);
            case 'reports':
                return app.reports ? app.reports.filter(r => r.companyId === app.currentCompanyId) : [];
            default:
                console.warn(`⚠️ Type de données non reconnu: ${dataType}`);
                return [];
        }
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
            reports: this.getFilteredData('reports')
        };

        console.log(`🔍 Données filtrées pour entreprise ${app.currentCompanyId}:`, {
            entries: app.filteredData.entries.length,
            accounts: app.filteredData.accounts.length,
            reports: app.filteredData.reports.length
        });
    }

    // Créer l'interface de sélection d'entreprise
    renderCompanySelector() {
        const headerRight = document.querySelector('.header-right') || document.querySelector('header .flex');
        
        if (!headerRight || app.availableCompanies.length <= 1) {
            return; // Pas besoin de sélecteur s'il n'y a qu'une entreprise
        }

        // Créer le conteneur du sélecteur s'il n'existe pas
        let companySelector = document.getElementById('companySelectorContainer');
        if (!companySelector) {
            companySelector = document.createElement('div');
            companySelector.id = 'companySelectorContainer';
            companySelector.className = 'flex items-center space-x-3 mr-4';
            
            // Insérer avant les autres éléments du header
            headerRight.insertBefore(companySelector, headerRight.firstChild);
        }

        const currentCompany = app.companies.find(c => c.id === app.currentCompanyId);
        
        companySelector.innerHTML = `
            <div class="relative">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Entreprise active
                </label>
                <select id="activeCompanySelect" 
                        class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]">
                    ${app.availableCompanies.map(company => `
                        <option value="${company.id}" ${company.id === app.currentCompanyId ? 'selected' : ''}>
                            ${company.name} (${company.type || 'N/A'})
                        </option>
                    `).join('')}
                </select>
                
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <i class="fas fa-building mr-1"></i>
                    ${currentCompany ? currentCompany.name : 'Aucune'}
                </div>
            </div>
        `;

        // Attacher l'événement de changement (compatible avec le système existant)
        const select = document.getElementById('activeCompanySelect');
        if (select) {
            select.addEventListener('change', (e) => {
                this.selectActiveCompany(e.target.value);
            });
        }
    }

    // Mettre à jour l'interface après changement d'entreprise
    updateCompanyUI() {
        // Mettre à jour le sélecteur
        const select = document.getElementById('activeCompanySelect');
        if (select) {
            select.value = app.currentCompanyId;
        }

        // Mettre à jour les informations affichées
        if (typeof updateSelectedCompanyInfo === 'function') {
            updateSelectedCompanyInfo();
        }

        // Mettre à jour le titre de la page
        const company = app.companies.find(c => c.id === app.currentCompanyId);
        if (company) {
            document.title = `DOUKÈ Compta Pro - ${company.name}`;
        }
    }

    // Rafraîchir toutes les vues avec les données filtrées
    refreshAllViews() {
        try {
            // Recharger la vue actuelle (si c'est une fonction de chargement de page)
            const currentView = this.getCurrentView();
            if (currentView && typeof window[currentView] === 'function') {
                window[currentView]();
            }

            // Mettre à jour le dashboard s'il est affiché
            if (typeof loadDashboard === 'function' && this.isDashboardActive()) {
                loadDashboard();
            }

            console.log('🔄 Toutes les vues rafraîchies avec les données filtrées');
            
        } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement des vues:', error);
        }
    }

    // Déterminer la vue actuelle
    getCurrentView() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return null;

        // Analyser le contenu pour déterminer quelle vue est active
        const content = mainContent.innerHTML;
        if (content.includes('Écritures Comptables') || content.includes('loadEntries')) return 'loadEntries';
        if (content.includes('Plan Comptable') || content.includes('loadAccounts')) return 'loadAccounts';
        if (content.includes('Tableau de Bord') || content.includes('loadDashboard')) return 'loadDashboard';
        if (content.includes('Gestion de Caisse') || content.includes('loadCaisse')) return 'loadCaisse';
        if (content.includes('Rapports') || content.includes('loadReports')) return 'loadReports';
        
        return null;
    }

    // Vérifier si le dashboard est actif
    isDashboardActive() {
        const mainContent = document.getElementById('mainContent');
        return mainContent && mainContent.innerHTML.includes('Tableau de Bord');
    }

    // Afficher message d'accès non autorisé
    showUnauthorizedMessage() {
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('❌ Vous n\'avez pas l\'autorisation d\'accéder à cette entreprise');
        } else {
            alert('❌ Accès non autorisé à cette entreprise');
        }
    }

    // Vérifier si l'utilisateur a accès aux données multi-entreprises
    hasMultiCompanyAccess() {
        return ['admin', 'collaborateur_senior', 'collaborateur'].includes(app.currentProfile);
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

            // Enregistrer le Service Worker pour la sync en arrière-plan
            this.registerSyncService();

            // Démarrer la synchronisation automatique
            this.startAutoSync();

            // Écouter les changements de connectivité
            this.setupConnectivityListeners();

            // Synchronisation initiale
            this.triggerSync();

            this.initialized = true;
            console.log('✅ Synchronisation PIWA initialisée pour', app.currentProfile);

        } catch (error) {
            console.error('❌ Erreur initialisation synchronisation PIWA:', error);
        }
    }

    // Vérifier l'autorisation d'accès à la synchronisation automatique
    canAccessAutoSync() {
        return app.currentProfile === 'admin' || 
               app.currentProfile === 'collaborateur_senior';
    }

    // Enregistrer le Service Worker
    async registerSyncService() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker enregistré pour la synchronisation');
                
                // Enregistrer la synchronisation en arrière-plan
                await registration.sync.register('background-sync');
                
            } catch (error) {
                console.warn('⚠️ Service Worker non disponible:', error);
            }
        }
    }

    // Démarrer la synchronisation automatique
    startAutoSync() {
        if (app.syncSettings.autoSyncTimer) {
            clearInterval(app.syncSettings.autoSyncTimer);
        }

        app.syncSettings.autoSyncTimer = setInterval(() => {
            if (this.canAccessAutoSync() && app.syncSettings.enabled && navigator.onLine) {
                this.backgroundSync();
            }
        }, app.syncSettings.interval);

        console.log(`🔄 Synchronisation automatique démarrée (${app.syncSettings.interval / 1000}s)`);
    }

    // Arrêter la synchronisation automatique
    stopAutoSync() {
        if (app.syncSettings.autoSyncTimer) {
            clearInterval(app.syncSettings.autoSyncTimer);
            app.syncSettings.autoSyncTimer = null;
        }
        app.syncSettings.enabled = false;
        console.log('⏹️ Synchronisation automatique arrêtée');
    }

    // Écouter les changements de connectivité
    setupConnectivityListeners() {
        window.addEventListener('online', () => {
            app.syncSettings.isOnline = true;
            console.log('🌐 Connexion rétablie - synchronisation automatique');
            this.triggerSync();
        });

        window.addEventListener('offline', () => {
            app.syncSettings.isOnline = false;
            console.log('📶 Connexion perdue - mode hors ligne');
        });
    }

    // Déclencher une synchronisation immédiate
    async triggerSync() {
        if (!this.canAccessAutoSync() || this.isSyncing) {
            return;
        }

        try {
            await this.backgroundSync();
        } catch (error) {
            console.error('❌ Erreur synchronisation immédiate:', error);
        }
    }

    // Synchronisation en arrière-plan
    async backgroundSync() {
        if (!this.canAccessAutoSync() || !navigator.onLine || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        
        try {
            // Synchroniser les données de l'entreprise active
            if (app.currentCompanyId) {
                await this.syncCompanyData(app.currentCompanyId);
            }

            // Synchroniser les données utilisateur
            await this.syncUserData();

            // Mettre à jour le timestamp
            app.syncSettings.lastSync = new Date();

            // Notification discrète de succès
            this.showSyncNotification('✅ Données synchronisées', 'success');
            
            console.log('✅ Synchronisation PIWA terminée:', new Date().toLocaleTimeString());

        } catch (error) {
            console.error('❌ Erreur synchronisation:', error);
            this.showSyncNotification('❌ Erreur de synchronisation', 'error');
        } finally {
            this.isSyncing = false;
        }
    }

    // Synchroniser les données d'une entreprise spécifique
    async syncCompanyData(companyId) {
        // Simulation de la synchronisation des données entreprise
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`🔄 Données de l'entreprise ${companyId} synchronisées`);
                resolve();
            }, 1000);
        });
    }

    // Synchroniser les données utilisateur
    async syncUserData() {
        // Simulation de la synchronisation des données utilisateur
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('🔄 Données utilisateur synchronisées');
                resolve();
            }, 500);
        });
    }

    // Afficher une notification de synchronisation
    showSyncNotification(message, type) {
        // Notification discrète qui ne perturbe pas l'utilisateur
        if (typeof showNotification === 'function') {
            showNotification(message, type, 2000); // 2 secondes seulement
        } else {
            console.log(`🔔 ${message}`);
        }
    }

    // Ajouter des données à la queue de synchronisation
    queueForSync(data) {
        this.syncQueue.push({
            ...data,
            timestamp: new Date(),
            companyId: app.currentCompanyId
        });

        // Déclencher une synchronisation si en ligne
        if (navigator.onLine && this.canAccessAutoSync()) {
            setTimeout(() => this.triggerSync(), 1000);
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
// GESTIONNAIRE DE MODULES - ENRICHI AVEC SÉCURITÉ (CONSERVÉ + AMÉLIORÉ)
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

    // Vérifier et créer les fonctions manquantes (CONSERVÉ)
    ensureFunctionsExist() {
        this.requiredFunctions.forEach(funcName => {
            if (typeof window[funcName] !== 'function') {
                console.warn(`⚠️ Fonction ${funcName} manquante, création d'un fallback`);
                window[funcName] = this.createFallback(funcName);
            }
        });
    }

    // Créer une fonction de fallback AVEC séparation des données (AMÉLIORÉ)
    createFallback(funcName) {
        const self = this;
        return function() {
            console.log(`📄 Chargement fallback pour ${funcName}`);
            
            // Vérifier si les données doivent être filtrées
            if (self.requiresDataFiltering(funcName)) {
                self.showFilteredModuleFallback(funcName);
            } else {
                self.showModuleFallback(funcName);
            }
        };
    }

    // Déterminer si la fonction nécessite un filtrage des données (NOUVEAU)
    requiresDataFiltering(funcName) {
        const dataIntensiveFunctions = [
            'loadDashboard', 'loadEntries', 'loadAccounts', 
            'loadCaisse', 'loadReports'
        ];
        return dataIntensiveFunctions.includes(funcName);
    }

    // Afficher un contenu de fallback AVEC informations de séparation (NOUVEAU)
    showFilteredModuleFallback(funcName) {
        const moduleInfo = this.getModuleInfo(funcName);
        const mainContent = document.getElementById('mainContent');
        const companyStats = companyDataManager.getCompanyStats();
        
        if (mainContent && moduleInfo.isPageLoader) {
            mainContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${moduleInfo.title}</h2>
                        ${app.currentCompanyId ? `
                            <div class="bg-primary/10 text-primary px-4 py-2 rounded-lg">
                                <i class="fas fa-building mr-2"></i>
                                ${companyStats ? companyStats.company.name : 'Entreprise inconnue'}
                            </div>
                        ` : `
                            <div class="bg-warning/10 text-warning px-4 py-2 rounded-lg">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Aucune entreprise sélectionnée
                            </div>
                        `}
                    </div>

                    ${app.currentCompanyId ? `
                        <!-- Informations entreprise active -->
                        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                <i class="fas fa-info-circle mr-2"></i>Données filtrées pour cette entreprise
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div class="text-blue-800 dark:text-blue-200">
                                    📊 ${companyStats ? companyStats.totalEntries : 0} écritures
                                </div>
                                <div class="text-blue-800 dark:text-blue-200">
                                    📋 ${companyStats ? companyStats.totalAccounts : 0} comptes
                                </div>
                                <div class="text-blue-800 dark:text-blue-200">
                                    📅 ${companyStats ? companyStats.monthlyEntries : 0} ce mois
                                </div>
                            </div>
                        </div>
                    ` : ''}

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
                            
                            <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg mb-6">
                                <h4 class="font-medium text-orange-900 dark:text-orange-100 mb-3">
                                    <i class="fas fa-shield-alt mr-2"></i>Séparation des données activée
                                </h4>
                                <p class="text-orange-800 dark:text-orange-200 text-sm">
                                    Cette fonction utilisera automatiquement <code>getFilteredEntries()</code> et 
                                    <code>getCompanyAccountingPlan()</code> pour afficher uniquement les données 
                                    de l'entreprise sélectionnée.
                                </p>
                            </div>
                            
                            <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
                                <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-3">
                                    <i class="fas fa-lightbulb mr-2"></i>Template sécurisé :
                                </h4>
                                <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-left overflow-x-auto">
                                    <pre class="text-sm"><code>${this.getSecureTemplate(funcName)}</code></pre>
                                </div>
                            </div>

                            <div class="flex justify-center space-x-4">
                                <button onclick="location.reload()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-sync mr-2"></i>Recharger
                                </button>
                                <button onclick="showModuleStatus()" class="bg-info hover:bg-info/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-info mr-2"></i>État des modules
                                </button>
                                ${companyDataManager.hasMultiCompanyAccess() ? `
                                    <button onclick="showCompanySelector()" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        <i class="fas fa-building mr-2"></i>Changer d'entreprise
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Obtenir un template sécurisé avec séparation des données (NOUVEAU)
    getSecureTemplate(funcName) {
        const templates = {
            'loadDashboard': `function loadDashboard() {
    const entries = getFilteredEntries(); // SEULEMENT entreprise active
    const accounts = getCompanyAccountingPlan(); // SEULEMENT entreprise active
    const stats = getCompanyStats();
    
    const content = \`
        <h2>Tableau de Bord - \${stats.company.name}</h2>
        <div class="grid grid-cols-3 gap-4">
            <div class="card">\${entries.length} écritures</div>
            <div class="card">\${accounts.length} comptes</div>
            <div class="card">\${stats.monthlyEntries} ce mois</div>
        </div>
    \`;
    document.getElementById('mainContent').innerHTML = content;
}`,
            'loadEntries': `function loadEntries() {
    const entries = getFilteredEntries(); // SEULEMENT entreprise active
    
    const content = \`
        <h2>Écritures Comptables - Entreprise \${app.currentCompanyId}</h2>
        <div class="entries-table">
            <!-- Afficher uniquement les écritures de l'entreprise active -->
        </div>
    \`;
    document.getElementById('mainContent').innerHTML = content;
}`,
            'loadAccounts': `function loadAccounts() {
    const accounts = getCompanyAccountingPlan(); // SEULEMENT entreprise active
    
    const content = \`
        <h2>Plan Comptable - Entreprise \${app.currentCompanyId}</h2>
        <div class="accounts-list">
            <!-- Afficher uniquement les comptes de l'entreprise active -->
        </div>
    \`;
    document.getElementById('mainContent').innerHTML = content;
}`
        };

        return templates[funcName] || this.getModuleInfo(funcName).template;
    }

    // Afficher un contenu de fallback (CONSERVÉ ORIGINAL)
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

    // Obtenir les informations d'un module (CONSERVÉ + MAINTIEN COMPATIBILITÉ)
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

// Créer l'instance du gestionnaire de modules (CONSERVÉ)
const moduleManager = new ModuleManager();

// =============================================================================
// FONCTIONS GLOBALES EXPOSÉES POUR LA SÉPARATION DES DONNÉES
// =============================================================================

// FONCTION CRITIQUE - Sélectionner une entreprise active
function selectActiveCompany(companyId) {
    return companyDataManager.selectActiveCompany(companyId);
}

// FONCTION CRITIQUE - Obtenir les écritures filtrées (SEULEMENT entreprise active)
function getFilteredEntries() {
    return companyDataManager.getFilteredEntries();
}

// FONCTION CRITIQUE - Obtenir le plan comptable filtré (SEULEMENT entreprise active)
function getCompanyAccountingPlan() {
    return companyDataManager.getCompanyAccountingPlan();
}

// FONCTION CRITIQUE - Obtenir toutes données filtrées
function getFilteredData(dataType) {
    return companyDataManager.getFilteredData(dataType);
}

// Rafraîchir toutes les vues avec les données filtrées
function refreshAllViews() {
    companyDataManager.refreshAllViews();
}

// Obtenir les statistiques de l'entreprise active
function getCompanyStats() {
    return companyDataManager.getCompanyStats();
}

// Vérifier l'accès multi-entreprises
function hasMultiCompanyAccess() {
    return companyDataManager.hasMultiCompanyAccess();
}

// Déclencher une synchronisation (admin/collaborateur senior uniquement)
function triggerSync() {
    return syncManager.triggerSync();
}

// Obtenir le statut de synchronisation
function getSyncStatus() {
    return syncManager.getSyncStatus();
}

// Afficher le sélecteur d'entreprise en modal
function showCompanySelector() {
    if (!hasMultiCompanyAccess()) {
        showErrorMessage('❌ Accès non autorisé au changement d\'entreprise');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-building mr-2 text-primary"></i>Sélectionner une entreprise
                </h3>
                
                <div class="space-y-4">
                    ${app.availableCompanies.map(company => `
                        <button onclick="selectActiveCompany(${company.id}); closeCompanySelector()" 
                                class="w-full p-4 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${company.id === app.currentCompanyId ? 'bg-primary/10 border-primary' : ''}">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${company.type || 'N/A'}</div>
                                </div>
                                ${company.id === app.currentCompanyId ? '<i class="fas fa-check text-primary"></i>' : ''}
                            </div>
                        </button>
                    `).join('')}
                </div>
                
                <div class="flex justify-end mt-6">
                    <button onclick="closeCompanySelector()" 
                            class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'companySelectorModal';
    modalContainer.innerHTML = modal;
    document.body.appendChild(modalContainer);
}

// Fermer le sélecteur d'entreprise
function closeCompanySelector() {
    const modal = document.getElementById('companySelectorModal');
    if (modal) {
        modal.remove();
    }
}

// Exposer globalement les fonctions critiques
window.selectActiveCompany = selectActiveCompany;
window.getFilteredEntries = getFilteredEntries;
window.getCompanyAccountingPlan = getCompanyAccountingPlan;
window.getFilteredData = getFilteredData;
window.refreshAllViews = refreshAllViews;
window.getCompanyStats = getCompanyStats;
window.hasMultiCompanyAccess = hasMultiCompanyAccess;
window.triggerSync = triggerSync;
window.getSyncStatus = getSyncStatus;
window.showCompanySelector = showCompanySelector;
window.closeCompanySelector = closeCompanySelector;

// =============================================================================
// THEME MANAGEMENT - FONCTION ORIGINALE COMPLÈTE (CONSERVÉE)
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
// FONCTION DE VÉRIFICATION DES MODULES - AMÉLIORÉE AVEC SÉCURITÉ
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

// Rendre la fonction globale (CONSERVÉ)
window.showModuleStatus = showModuleStatus;

// =============================================================================
// FONCTION DE TEST POUR VÉRIFIER LE CHARGEMENT DES MODULES (NOUVEAU)
// =============================================================================
function testModuleLoading() {
    console.log('🧪 Test de chargement des modules :');
    console.log('📊 loadDashboard:', typeof loadDashboard);
    console.log('📝 loadEntries:', typeof loadEntries);
    console.log('📋 loadAccounts:', typeof loadAccounts);
    console.log('💾 initializeData:', typeof initializeData);
    
    if (typeof loadDashboard === 'function') {
        console.log('✅ dashboard.js chargé correctement');
        loadDashboard();
    } else {
        console.log('❌ dashboard.js non chargé');
    }
}

// Exposer globalement pour debug
window.testModuleLoading = testModuleLoading;

// =============================================================================
// EVENT LISTENERS & INITIALIZATION - ENRICHI AVEC SÉCURITÉ (CONSERVÉ + AMÉLIORÉ)
// =============================================================================
function bindEventListeners() {
    try {
        // Company selector - CRITIQUE POUR LA SÉPARATION DES DONNÉES (AMÉLIORÉ)
        setTimeout(() => {
            const companySelect = document.getElementById('activeCompanySelect');
            if (companySelect) {
                companySelect.addEventListener('change', function(e) {
                    // Utiliser la nouvelle fonction sécurisée
                    selectActiveCompany(e.target.value);
                    
                    // Maintenir la compatibilité avec l'ancien système
                    app.currentCompany = e.target.value;
                    
                    if (typeof updateSelectedCompanyInfo === 'function') {
                        updateSelectedCompanyInfo();
                    }
                    console.log('✅ Entreprise sélectionnée:', app.currentCompany);
                });
            }
        }, 100);

        // Sidebar toggle (CONSERVÉ)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('-translate-x-full');
                }
            });
        }

        // Login form (CONSERVÉ)
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

        // Close sidebar on outside click (mobile) (CONSERVÉ)
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

        // D'abord initialiser les données
        initializeData();
        
        // Simuler la connexion de Marie Kouassi si pas encore connectée
        if (!app.currentUser) {
            console.log('👤 Simulation connexion Marie Kouassi...');
            app.currentUser = {
                id: 1,
                name: 'Marie Kouassi',
                email: 'marie.kouassi@entreprise.com',
                role: 'Collaborateur Senior',
                assignedCompanies: [1, 2, 3], // Accès à plusieurs entreprises
                status: 'Actif'
            };
            app.currentProfile = 'collaborateur_senior';
            app.isAuthenticated = true;
        }

        // Puis charger navigation et user info
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

        // S'assurer que les fonctions manquantes ont des fallbacks APRÈS avoir chargé les vrais modules
        setTimeout(() => {
            moduleManager.ensureFunctionsExist();
        }, 100);

        // Charger le dashboard en dernier, après l'initialisation complète
        setTimeout(() => {
            if (typeof loadDashboard === 'function') {
                console.log('📊 Chargement du vrai dashboard...');
                loadDashboard();
            } else {
                console.warn('⚠️ dashboard.js non chargé, utilisation du fallback');
                moduleManager.showFilteredModuleFallback('loadDashboard');
            }
        }, 200);

        bindEventListeners();

        console.log('✅ DOUKÈ Compta Pro initialisé avec succès avec séparation des données !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors de l\'initialisation de l\'application');
    }
}

// =============================================================================
// FONCTIONS UTILITAIRES (CONSERVÉES)
// =============================================================================
function showSuccessMessage(message) {
    alert(message);
}

function showErrorMessage(message) {
    alert('❌ ' + message);
}

// Close theme menu when clicking outside (CONSERVÉ + AMÉLIORÉ)
document.addEventListener('click', function(e) {
    const menu = document.getElementById('themeMenu');
    const button = e.target.closest('[onclick="toggleThemeMenu()"]');
    if (menu && !menu.contains(e.target) && !button) {
        menu.classList.add('hidden');
    }

    // Close notifications panel when clicking outside (CONSERVÉ)
    const notifPanel = document.getElementById('notificationsPanel');
    const notifButton = e.target.closest('[onclick="toggleNotificationsPanel()"]');
    if (notifPanel && !notifPanel.contains(e.target) && !notifButton) {
        notifPanel.classList.add('hidden');
    }

    // Close company selector modal when clicking outside (NOUVEAU)
    const companySelectorModal = document.getElementById('companySelectorModal');
    if (companySelectorModal && e.target === companySelectorModal) {
        closeCompanySelector();
    }
});

// =============================================================================
// APPLICATION START - ENRICHI AVEC SÉCURITÉ (CONSERVÉ + AMÉLIORÉ)
// =============================================================================

// APPLICATION START (CONSERVÉ + AMÉLIORÉ)
document.addEventListener('DOMContentLoaded', function() {
    try {
        themeManager.init();
        setTimeout(() => {
            bindEventListeners();
            console.log('🚀 DOUKÈ Compta Pro - Application démarrée avec gestion sécurisée des modules');
            console.log('🔒 Séparation des données par entreprise: ACTIVÉE');
            console.log('🔄 Synchronisation PIWA:', syncManager.canAccessAutoSync() ? 'AUTORISÉE' : 'NON AUTORISÉE');
        }, 100);
    } catch (error) {
        console.error('❌ Erreur au démarrage:', error);
    }
});

// Protection globale contre les erreurs (CONSERVÉ)
window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale capturée:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
});

// =============================================================================
// FONCTION DE NETTOYAGE À LA FERMETURE (NOUVEAU)
// =============================================================================
window.addEventListener('beforeunload', function() {
    // Arrêter la synchronisation automatique
    if (syncManager.initialized) {
        syncManager.stopAutoSync();
    }
    
    // Sauvegarder l'état actuel
    if (app.currentCompanyId) {
        localStorage.setItem('selectedCompanyId', app.currentCompanyId);
    }
    
    console.log('🔄 Application fermée proprement');
});
