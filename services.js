// =============================================================================
// 🌐 DOUKÈ Compta Pro - Services et API v3.2
// =============================================================================

(function() {
    'use strict';

    console.log('🌐 Chargement du module Services...');

    // =============================================================================
    // 🔌 SERVICE API PRINCIPAL
    // =============================================================================
    class APIService {
        constructor() {
            this.baseURL = window.configManager?.get('apiBaseUrl') || 'https://api.doukecompta.com/v1';
            this.timeout = window.configManager?.get('timeout') || 30000;
            this.retryAttempts = window.configManager?.get('maxRetries') || 3;
            this.requestQueue = [];
            this.isOnline = navigator.onLine;
            
            this.setupEventListeners();
        }

        setupEventListeners() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.processQueue();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }

        async request(endpoint, options = {}) {
            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...this.getAuthHeaders(),
                    ...options.headers
                },
                timeout: this.timeout,
                ...options
            };

            const url = `${this.baseURL}${endpoint}`;

            try {
                if (!this.isOnline) {
                    throw new Error('Hors ligne - Requête mise en file d\'attente');
                }

                const response = await this.fetchWithTimeout(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return { success: true, data };

            } catch (error) {
                console.error(`Erreur API ${endpoint}:`, error);
                
                if (!this.isOnline) {
                    this.queueRequest(endpoint, config);
                }

                return { success: false, error: error.message };
            }
        }

        async fetchWithTimeout(url, config) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            try {
                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }

        getAuthHeaders() {
            const token = window.unifiedManager?.securityManager?.sessionToken;
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        }

        queueRequest(endpoint, config) {
            this.requestQueue.push({ endpoint, config, timestamp: Date.now() });
        }

        async processQueue() {
            while (this.requestQueue.length > 0 && this.isOnline) {
                const request = this.requestQueue.shift();
                try {
                    await this.request(request.endpoint, request.config);
                } catch (error) {
                    console.error('Erreur lors du traitement de la queue:', error);
                }
            }
        }

        // Méthodes HTTP spécialisées
        async get(endpoint, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${endpoint}?${queryString}` : endpoint;
            return this.request(url);
        }

        async post(endpoint, data) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        async put(endpoint, data) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        async delete(endpoint) {
            return this.request(endpoint, {
                method: 'DELETE'
            });
        }

        async patch(endpoint, data) {
            return this.request(endpoint, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        }
    }

    // =============================================================================
    // 🔐 SERVICE D'AUTHENTIFICATION
    // =============================================================================
    class AuthenticationService {
        constructor(apiService) {
            this.api = apiService;
            this.tokenRefreshInterval = null;
        }

        async login(credentials) {
            try {
                const response = await this.api.post('/auth/login', credentials);
                
                if (response.success) {
                    this.handleLoginSuccess(response.data);
                    return response;
                }
                
                return response;
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        async logout() {
            try {
                await this.api.post('/auth/logout');
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            } finally {
                this.clearSession();
            }
        }

        async refreshToken() {
            try {
                const response = await this.api.post('/auth/refresh');
                
                if (response.success) {
                    this.updateToken(response.data.token);
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('Erreur lors du rafraîchissement du token:', error);
                return false;
            }
        }

        async resetPassword(email) {
            return this.api.post('/auth/reset-password', { email });
        }

        async changePassword(currentPassword, newPassword) {
            return this.api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
        }

        handleLoginSuccess(data) {
            const { token, user, expiresIn } = data;
            
            // Stocker les informations de session
            window.SandboxStorage.setItem('authToken', token);
            window.SandboxStorage.setItem('user', JSON.stringify(user));
            window.SandboxStorage.setItem('tokenExpiry', Date.now() + expiresIn);
            
            // Programmer le rafraîchissement automatique
            this.scheduleTokenRefresh(expiresIn);
        }

        updateToken(token) {
            window.SandboxStorage.setItem('authToken', token);
        }

        clearSession() {
            window.SandboxStorage.removeItem('authToken');
            window.SandboxStorage.removeItem('user');
            window.SandboxStorage.removeItem('tokenExpiry');
            
            if (this.tokenRefreshInterval) {
                clearInterval(this.tokenRefreshInterval);
                this.tokenRefreshInterval = null;
            }
        }

        scheduleTokenRefresh(expiresIn) {
            // Rafraîchir 5 minutes avant expiration
            const refreshTime = expiresIn - (5 * 60 * 1000);
            
            this.tokenRefreshInterval = setTimeout(() => {
                this.refreshToken();
            }, refreshTime);
        }

        isAuthenticated() {
            const token = window.SandboxStorage.getItem('authToken');
            const expiry = window.SandboxStorage.getItem('tokenExpiry');
            
            return token && expiry && Date.now() < parseInt(expiry);
        }

        getCurrentUser() {
            const userStr = window.SandboxStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        }
    }

    // =============================================================================
    // 💾 SERVICE DE GESTION DES DONNÉES
    // =============================================================================
    class DataService {
        constructor(apiService) {
            this.api = apiService;
            this.cache = new Map();
            this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        }

        // Gestion des utilisateurs
        async getUsers(params = {}) {
            return this.api.get('/users', params);
        }

        async getUserById(id) {
            return this.api.get(`/users/${id}`);
        }

        async createUser(userData) {
            const response = await this.api.post('/users', userData);
            this.invalidateCache('users');
            return response;
        }

        async updateUser(id, userData) {
            const response = await this.api.put(`/users/${id}`, userData);
            this.invalidateCache('users');
            this.invalidateCache(`user_${id}`);
            return response;
        }

        async deleteUser(id) {
            const response = await this.api.delete(`/users/${id}`);
            this.invalidateCache('users');
            this.invalidateCache(`user_${id}`);
            return response;
        }

        // Gestion des entreprises
        async getCompanies(params = {}) {
            return this.api.get('/companies', params);
        }

        async getCompanyById(id) {
            return this.api.get(`/companies/${id}`);
        }

        async createCompany(companyData) {
            const response = await this.api.post('/companies', companyData);
            this.invalidateCache('companies');
            return response;
        }

        async updateCompany(id, companyData) {
            const response = await this.api.put(`/companies/${id}`, companyData);
            this.invalidateCache('companies');
            this.invalidateCache(`company_${id}`);
            return response;
        }

        async deleteCompany(id) {
            const response = await this.api.delete(`/companies/${id}`);
            this.invalidateCache('companies');
            this.invalidateCache(`company_${id}`);
            return response;
        }

        // Gestion des écritures comptables
        async getEntries(params = {}) {
            return this.api.get('/entries', params);
        }

        async getEntryById(id) {
            return this.api.get(`/entries/${id}`);
        }

        async createEntry(entryData) {
            const response = await this.api.post('/entries', entryData);
            this.invalidateCache('entries');
            return response;
        }

        async updateEntry(id, entryData) {
            const response = await this.api.put(`/entries/${id}`, entryData);
            this.invalidateCache('entries');
            this.invalidateCache(`entry_${id}`);
            return response;
        }

        async validateEntry(id) {
            const response = await this.api.patch(`/entries/${id}/validate`);
            this.invalidateCache('entries');
            this.invalidateCache(`entry_${id}`);
            return response;
        }

        async deleteEntry(id) {
            const response = await this.api.delete(`/entries/${id}`);
            this.invalidateCache('entries');
            this.invalidateCache(`entry_${id}`);
            return response;
        }

        // Gestion des comptes
        async getAccounts(params = {}) {
            return this.api.get('/accounts', params);
        }

        async getAccountByCode(code) {
            return this.api.get(`/accounts/${code}`);
        }

        async getAccountHistory(code, params = {}) {
            return this.api.get(`/accounts/${code}/history`, params);
        }

        // Gestion des caisses
        async getCashRegisters(params = {}) {
            return this.api.get('/cash-registers', params);
        }

        async createCashRegister(cashData) {
            const response = await this.api.post('/cash-registers', cashData);
            this.invalidateCache('cash-registers');
            return response;
        }

        async updateCashRegister(id, cashData) {
            const response = await this.api.put(`/cash-registers/${id}`, cashData);
            this.invalidateCache('cash-registers');
            return response;
        }

        async getCashOperations(id, params = {}) {
            return this.api.get(`/cash-registers/${id}/operations`, params);
        }

        async createCashOperation(id, operationData) {
            return this.api.post(`/cash-registers/${id}/operations`, operationData);
        }

        // Gestion du cache
        setCached(key, data) {
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
        }

        getCached(key) {
            const cached = this.cache.get(key);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
                return cached.data;
            }
            return null;
        }

        invalidateCache(key) {
            if (key) {
                this.cache.delete(key);
            } else {
                this.cache.clear();
            }
        }
    }

    // =============================================================================
    // 📊 SERVICE DE SYNCHRONISATION
    // =============================================================================
    class SynchronizationService {
        constructor(apiService, dataService) {
            this.api = apiService;
            this.dataService = dataService;
            this.syncQueue = [];
            this.isSyncing = false;
            this.syncInterval = null;
            
            this.startAutoSync();
        }

        startAutoSync() {
            const interval = window.configManager?.get('sync.interval') || 5 * 60 * 1000;
            
            this.syncInterval = setInterval(() => {
                if (navigator.onLine && !this.isSyncing) {
                    this.performSync();
                }
            }, interval);
        }

        stopAutoSync() {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
        }

        async performSync() {
            if (this.isSyncing) return;
            
            this.isSyncing = true;
            
            try {
                console.log('🔄 Début de la synchronisation...');
                
                // Synchroniser les données dans l'ordre de priorité
                await this.syncUsers();
                await this.syncCompanies();
                await this.syncEntries();
                await this.syncCashRegisters();
                
                // Traiter la queue d'opérations en attente
                await this.processQueuedOperations();
                
                console.log('✅ Synchronisation terminée avec succès');
                
                // Notifier le succès
                if (window.unifiedManager?.notificationManager) {
                    window.unifiedManager.notificationManager.show(
                        'success',
                        'Synchronisation réussie',
                        'Toutes les données ont été synchronisées'
                    );
                }
                
            } catch (error) {
                console.error('❌ Erreur de synchronisation:', error);
                
                if (window.unifiedManager?.notificationManager) {
                    window.unifiedManager.notificationManager.show(
                        'error',
                        'Erreur de synchronisation',
                        error.message
                    );
                }
            } finally {
                this.isSyncing = false;
            }
        }

        async syncUsers() {
            try {
                const response = await this.dataService.getUsers();
                if (response.success) {
                    // Mettre à jour les données locales
                    window.app.users = response.data;
                    console.log('✅ Utilisateurs synchronisés');
                }
            } catch (error) {
                console.error('Erreur sync utilisateurs:', error);
            }
        }

        async syncCompanies() {
            try {
                const response = await this.dataService.getCompanies();
                if (response.success) {
                    window.app.companies = response.data;
                    console.log('✅ Entreprises synchronisées');
                }
            } catch (error) {
                console.error('Erreur sync entreprises:', error);
            }
        }

        async syncEntries() {
            try {
                const response = await this.dataService.getEntries();
                if (response.success) {
                    window.app.entries = response.data;
                    console.log('✅ Écritures synchronisées');
                }
            } catch (error) {
                console.error('Erreur sync écritures:', error);
            }
        }

        async syncCashRegisters() {
            try {
                const response = await this.dataService.getCashRegisters();
                if (response.success) {
                    window.app.cashRegisters = response.data;
                    console.log('✅ Caisses synchronisées');
                }
            } catch (error) {
                console.error('Erreur sync caisses:', error);
            }
        }

        async processQueuedOperations() {
            while (this.syncQueue.length > 0) {
                const operation = this.syncQueue.shift();
                
                try {
                    await this.executeQueuedOperation(operation);
                } catch (error) {
                    console.error('Erreur lors de l\'exécution d\'opération en queue:', error);
                    // Remettre en queue si échec
                    if (operation.retries < 3) {
                        operation.retries = (operation.retries || 0) + 1;
                        this.syncQueue.push(operation);
                    }
                }
            }
        }

        async executeQueuedOperation(operation) {
            const { type, method, endpoint, data } = operation;
            
            switch (method) {
                case 'POST':
                    return this.api.post(endpoint, data);
                case 'PUT':
                    return this.api.put(endpoint, data);
                case 'DELETE':
                    return this.api.delete(endpoint);
                case 'PATCH':
                    return this.api.patch(endpoint, data);
                default:
                    throw new Error(`Méthode non supportée: ${method}`);
            }
        }

        queueOperation(type, method, endpoint, data = null) {
            this.syncQueue.push({
                type,
                method,
                endpoint,
                data,
                timestamp: Date.now(),
                retries: 0
            });
        }

        getSyncStatus() {
            return {
                isSyncing: this.isSyncing,
                queueLength: this.syncQueue.length,
                isOnline: navigator.onLine,
                lastSync: this.lastSyncTime
            };
        }
    }

    // =============================================================================
    // 🎯 INITIALISATION ET INTÉGRATION
    // =============================================================================
    
    // Créer les instances des services
    window.apiService = new APIService();
    window.authService = new AuthenticationService(window.apiService);
    window.dataService = new DataService(window.apiService);
    window.syncService = new SynchronizationService(window.apiService, window.dataService);

    // Intégrer au système unifié si disponible
    if (window.unifiedManager) {
        window.unifiedManager.apiService = window.apiService;
        window.unifiedManager.authService = window.authService;
        window.unifiedManager.dataService = window.dataService;
        window.unifiedManager.syncService = window.syncService;
        
        console.log('✅ Services intégrés au système unifié');
    }

    // Gestionnaire global d'erreurs API
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Erreur API non gérée:', event.reason);
        
        if (window.unifiedManager?.notificationManager) {
            window.unifiedManager.notificationManager.show(
                'error',
                'Erreur de connexion',
                'Une erreur est survenue lors de la communication avec le serveur'
            );
        }
    });

    console.log('✅ Module Services chargé avec succès');

})();
