// =============================================================================
// DOUKÈ Compta Pro - Services et API
// services.js - Couche de services pour l'API et la logique métier
// =============================================================================

class ApiService {
    constructor() {
        this.baseUrl = DOUKE_CONFIG.API.baseUrl;
        this.timeout = DOUKE_CONFIG.API.timeout;
        this.retryAttempts = DOUKE_CONFIG.API.retryAttempts;
        this.authToken = null;
    }

    // =============================================================================
    // MÉTHODES HTTP DE BASE
    // =============================================================================

    async request(method, url, data = null, options = {}) {
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: options.timeout || this.timeout
        };

        if (this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (data) {
            config.body = JSON.stringify(data);
        }

        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, config);
                
                if (response.ok) {
                    return await response.json();
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await this.delay(DOUKE_CONFIG.API.retryDelay * attempt);
                }
            }
        }
        throw lastError;
    }

    async get(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        return this.request('GET', url.toString());
    }

    async post(endpoint, data) {
        return this.request('POST', this.baseUrl + endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', this.baseUrl + endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', this.baseUrl + endpoint);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    // =============================================================================
    // SERVICES D'AUTHENTIFICATION
    // =============================================================================

    async login(email, password) {
        try {
            const response = await this.post('/auth/login', { email, password });
            if (response.token) {
                this.setAuthToken(response.token);
            }
            return response;
        } catch (error) {
            console.error('Erreur connexion API:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.warn('Erreur déconnexion API:', error);
        } finally {
            this.authToken = null;
        }
    }

    async refreshToken() {
        try {
            const response = await this.post('/auth/refresh');
            if (response.token) {
                this.setAuthToken(response.token);
            }
            return response;
        } catch (error) {
            console.error('Erreur refresh token:', error);
            throw error;
        }
    }

    // =============================================================================
    // SERVICES UTILISATEURS
    // =============================================================================

    async getUsers(companyId = null) {
        const params = companyId ? { companyId } : {};
        return this.get('/users', params);
    }

    async createUser(userData) {
        return this.post('/users', userData);
    }

    async updateUser(userId, userData) {
        return this.put(`/users/${userId}`, userData);
    }

    async deleteUser(userId) {
        return this.delete(`/users/${userId}`);
    }

    async getUserPermissions(userId) {
        return this.get(`/users/${userId}/permissions`);
    }

    // =============================================================================
    // SERVICES ENTREPRISES
    // =============================================================================

    async getCompanies() {
        return this.get('/companies');
    }

    async createCompany(companyData) {
        return this.post('/companies', companyData);
    }

    async updateCompany(companyId, companyData) {
        return this.put(`/companies/${companyId}`, companyData);
    }

    async deleteCompany(companyId) {
        return this.delete(`/companies/${companyId}`);
    }

    async getCompanyStats(companyId) {
        return this.get(`/companies/${companyId}/stats`);
    }

    // =============================================================================
    // SERVICES ÉCRITURES COMPTABLES
    // =============================================================================

    async getEntries(companyId, filters = {}) {
        const params = { companyId, ...filters };
        return this.get('/entries', params);
    }

    async createEntry(entryData) {
        return this.post('/entries', entryData);
    }

    async updateEntry(entryId, entryData) {
        return this.put(`/entries/${entryId}`, entryData);
    }

    async deleteEntry(entryId) {
        return this.delete(`/entries/${entryId}`);
    }

    async validateEntry(entryId) {
        return this.put(`/entries/${entryId}/validate`);
    }

    async duplicateEntry(entryId) {
        return this.post(`/entries/${entryId}/duplicate`);
    }

    // =============================================================================
    // SERVICES PLAN COMPTABLE
    // =============================================================================

    async getAccounts() {
        return this.get('/accounts');
    }

    async createAccount(accountData) {
        return this.post('/accounts', accountData);
    }

    async updateAccount(accountId, accountData) {
        return this.put(`/accounts/${accountId}`, accountData);
    }

    async getAccountHistory(accountCode, companyId, dateRange = {}) {
        const params = { companyId, ...dateRange };
        return this.get(`/accounts/${accountCode}/history`, params);
    }

    // =============================================================================
    // SERVICES CAISSES
    // =============================================================================

    async getCashRegisters(companyId) {
        return this.get('/cash-registers', { companyId });
    }

    async createCashRegister(cashData) {
        return this.post('/cash-registers', cashData);
    }

    async updateCashRegister(cashId, cashData) {
        return this.put(`/cash-registers/${cashId}`, cashData);
    }

    async getCashOperations(cashId, dateRange = {}) {
        return this.get(`/cash-registers/${cashId}/operations`, dateRange);
    }

    async addCashOperation(cashId, operationData) {
        return this.post(`/cash-registers/${cashId}/operations`, operationData);
    }

    // =============================================================================
    // SERVICES RAPPORTS
    // =============================================================================

    async generateBalanceSheet(companyId, date) {
        return this.get('/reports/balance-sheet', { companyId, date });
    }

    async generateIncomeStatement(companyId, startDate, endDate) {
        return this.get('/reports/income-statement', { companyId, startDate, endDate });
    }

    async generateTrialBalance(companyId, date) {
        return this.get('/reports/trial-balance', { companyId, date });
    }

    async generateCashFlow(companyId, startDate, endDate) {
        return this.get('/reports/cash-flow', { companyId, startDate, endDate });
    }

    async exportReport(reportType, companyId, params, format = 'pdf') {
        const response = await fetch(`${this.baseUrl}/reports/${reportType}/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify({ companyId, ...params, format })
        });

        if (response.ok) {
            return response.blob();
        } else {
            throw new Error(`Erreur export: ${response.statusText}`);
        }
    }

    // =============================================================================
    // SERVICES SYNCHRONISATION
    // =============================================================================

    async sync(data) {
        return this.post('/sync', data);
    }

    async getLastSyncStatus() {
        return this.get('/sync/status');
    }

    async backup(companyId) {
        return this.post('/backup', { companyId });
    }
}

// =============================================================================
// SERVICE DE VALIDATION MÉTIER
// =============================================================================

class ValidationService {
    static validateAccount(account) {
        const errors = [];
        const config = DOUKE_CONFIG.VALIDATION.account;

        if (!account.code || account.code.length !== config.codeLength) {
            errors.push(`Le code compte doit faire ${config.codeLength} caractères`);
        }

        if (!account.name || account.name.length > config.nameMaxLength) {
            errors.push(`Le nom ne peut dépasser ${config.nameMaxLength} caractères`);
        }

        config.requiredFields.forEach(field => {
            if (!account[field]) {
                errors.push(`Le champ ${field} est obligatoire`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateEntry(entry) {
        const errors = [];
        const config = DOUKE_CONFIG.VALIDATION.entry;

        if (!entry.lines || entry.lines.length === 0) {
            errors.push('Une écriture doit avoir au moins une ligne');
        }

        if (entry.lines && entry.lines.length > config.maxLines) {
            errors.push(`Maximum ${config.maxLines} lignes par écriture`);
        }

        // Vérifier équilibre débit/crédit
        if (entry.lines) {
            const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                errors.push('L\'écriture doit être équilibrée (débit = crédit)');
            }
        }

        config.requiredFields.forEach(field => {
            if (!entry[field]) {
                errors.push(`Le champ ${field} est obligatoire`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateUser(user) {
        const errors = [];
        const config = DOUKE_CONFIG.VALIDATION.user;

        if (!user.email || !this.validateEmail(user.email)) {
            errors.push('Email invalide');
        }

        if (!user.name || user.name.length > config.nameMaxLength) {
            errors.push(`Le nom ne peut dépasser ${config.nameMaxLength} caractères`);
        }

        if (user.phone && !config.phonePattern.test(user.phone)) {
            errors.push('Format de téléphone invalide');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateCompany(company) {
        const errors = [];
        const config = DOUKE_CONFIG.VALIDATION.company;

        if (!company.name || company.name.length > config.nameMaxLength) {
            errors.push(`Le nom ne peut dépasser ${config.nameMaxLength} caractères`);
        }

        if (company.rccm && !config.rccmPattern.test(company.rccm)) {
            errors.push('Format RCCM invalide (ex: CI-ABJ-2020-B-12345)');
        }

        if (company.nif && !config.nifPattern.test(company.nif)) {
            errors.push('Format NIF invalide (10 chiffres)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateAmount(amount) {
        return !isNaN(amount) && amount >= 0 && amount <= DOUKE_CONFIG.VALIDATION.entry.maxAmount;
    }
}

// =============================================================================
// SERVICE DE FORMATAGE
// =============================================================================

class FormatService {
    static formatCurrency(amount) {
        return DOUKE_CONFIG.formatCurrency(amount);
    }

    static formatDate(date) {
        return DOUKE_CONFIG.formatDate(date);
    }

    static formatDateTime(datetime) {
        return new Date(datetime).toLocaleString('fr-FR');
    }

    static formatAccountCode(code) {
        return code.replace(/(\d{3})(\d{3})/, '$1 $2');
    }

    static formatPercentage(value, decimals = 2) {
        return `${value.toFixed(decimals)}%`;
    }

    static formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Instances globales
window.apiService = new ApiService();
window.validationService = ValidationService;
window.formatService = FormatService;

console.log('✅ Services API et validation chargés');
