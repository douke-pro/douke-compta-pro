// =============================================================================
// DOUKÈ Compta Pro - Fichier Principal App.js
// Système Comptable SYSCOHADA Révisé - Version Restructurée
// =============================================================================

class DoukèComptaPro {
    constructor() {
        this.version = "2.0.0";
        this.initializeState();
        this.initializeEventListeners();
        this.securityManager = new SecurityManager();
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        
        console.log(`🚀 DOUKÈ Compta Pro v${this.version} - Initialisation...`);
    }

    // =============================================================================
    // STATE MANAGEMENT - ÉTAT GLOBAL SÉCURISÉ
    // =============================================================================
    
    initializeState() {
        this.state = {
            // Utilisateur actuel avec validation renforcée
            currentUser: null,
            currentProfile: null,
            currentCompany: null,
            isAuthenticated: false,
            
            // Collections de données avec IDs uniques
            companies: new Map(),
            users: new Map(),
            accounts: new Map(),
            entries: new Map(),
            cashRegisters: new Map(),
            
            // Métadonnées système
            lastUpdate: new Date(),
            sessionStart: new Date(),
            securityLevel: 'HIGH',
            
            // Configuration UI
            theme: 'system',
            language: 'fr',
            companyLogo: null,
            
            // Notifications et alertes
            notifications: [],
            deadlines: [],
            
            // Logs d'audit
            auditLog: []
        };
        
        // Générateur d'IDs uniques sécurisé
        this.idGenerator = {
            company: () => `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user: () => `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entry: () => `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cash: () => `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // =============================================================================
    // SECURITY MANAGER - GESTIONNAIRE DE SÉCURITÉ
    // =============================================================================
    
    validateAccess(requiredProfile, targetCompanyId = null) {
        if (!this.state.isAuthenticated || !this.state.currentUser) {
            throw new SecurityError('UNAUTHORIZED', 'Utilisateur non authentifié');
        }

        const userProfile = this.state.currentProfile;
        const profileHierarchy = {
            'admin': 4,
            'collaborateur-senior': 3,
            'collaborateur': 2,
            'user': 1,
            'caissier': 0
        };

        // Vérification hiérarchie
        if (profileHierarchy[userProfile] < profileHierarchy[requiredProfile]) {
            throw new SecurityError('INSUFFICIENT_PRIVILEGES', 'Privilèges insuffisants');
        }

        // Vérification accès entreprise
        if (targetCompanyId && !this.canAccessCompany(targetCompanyId)) {
            throw new SecurityError('COMPANY_ACCESS_DENIED', 'Accès entreprise refusé');
        }

        this.logAuditEvent('ACCESS_GRANTED', { requiredProfile, targetCompanyId });
        return true;
    }

    canAccessCompany(companyId) {
        const user = this.state.users.get(this.state.currentUser.id);
        
        switch (this.state.currentProfile) {
            case 'admin':
                return true; // Accès total
                
            case 'collaborateur-senior':
                // Ses entreprises + celles de ses collaborateurs
                return user.assignedCompanies.includes(companyId) || 
                       this.getSubordinateCompanies(user.id).includes(companyId);
                       
            case 'collaborateur':
                // Seulement ses entreprises assignées
                return user.assignedCompanies.includes(companyId);
                
            case 'user':
                // Seulement son entreprise
                return user.companyId === companyId;
                
            case 'caissier':
                // Seulement l'entreprise de sa caisse
                return user.companyId === companyId;
                
            default:
                return false;
        }
    }

    getSubordinateCompanies(seniorId) {
        const subordinates = Array.from(this.state.users.values())
            .filter(user => user.supervisorId === seniorId);
        
        return subordinates.flatMap(user => user.assignedCompanies || []);
    }

    logAuditEvent(action, details = {}) {
        const auditEntry = {
            id: this.idGenerator.entry(),
            timestamp: new Date(),
            userId: this.state.currentUser?.id,
            action,
            details,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent
        };
        
        this.state.auditLog.push(auditEntry);
        console.log(`🔒 AUDIT: ${action}`, auditEntry);
    }

    getClientIP() {
        // Simulation - en production, récupérer la vraie IP
        return '192.168.1.' + Math.floor(Math.random() * 255);
    }

    // =============================================================================
    // DATA MANAGER - GESTIONNAIRE DE DONNÉES
    // =============================================================================
    
    initializeDefaultData() {
        this.logAuditEvent('DATA_INITIALIZATION_START');
        
        try {
            // Créer l'administrateur principal
            this.createSystemAdmin();
            
            // Créer les entreprises par défaut avec IDs uniques
            this.createDefaultCompanies();
            
            // Créer les utilisateurs par défaut
            this.createDefaultUsers();
            
            // Initialiser le plan comptable SYSCOHADA
            this.initializeSyscohadaAccounts();
            
            // Créer quelques écritures d'exemple
            this.createSampleEntries();
            
            this.logAuditEvent('DATA_INITIALIZATION_SUCCESS');
            console.log('✅ Données par défaut initialisées avec IDs uniques');
            
        } catch (error) {
            this.logAuditEvent('DATA_INITIALIZATION_ERROR', { error: error.message });
            throw error;
        }
    }

    createSystemAdmin() {
        const adminId = this.idGenerator.user();
        const admin = {
            id: adminId,
            uniqueId: adminId,
            name: 'Admin Système',
            email: 'admin@doukecompta.ci',
            passwordHash: this.hashPassword('admin123'), // En production: hasher vraiment
            profile: 'admin',
            role: 'Administrateur',
            phone: '+225 07 00 00 00 00',
            status: 'Actif',
            createdAt: new Date(),
            lastLogin: null,
            assignedCompanies: [], // Admin a accès à tout
            supervisorId: null,
            securityClearance: 'LEVEL_5'
        };
        
        this.state.users.set(adminId, admin);
        return admin;
    }

    createDefaultCompanies() {
        const companies = [
            {
                name: 'SARL TECH INNOVATION',
                type: 'SARL',
                system: 'Normal',
                phone: '+225 07 12 34 56 78',
                address: 'Abidjan, Cocody'
            },
            {
                name: 'SA COMMERCE PLUS',
                type: 'SA',
                system: 'Normal',
                phone: '+225 05 98 76 54 32',
                address: 'Abidjan, Plateau'
            },
            {
                name: 'EURL SERVICES PRO',
                type: 'EURL',
                system: 'Minimal',
                phone: '+225 01 23 45 67 89',
                address: 'Bouaké Centre'
            },
            {
                name: 'SAS DIGITAL WORLD',
                type: 'SAS',
                system: 'Normal',
                phone: '+225 07 11 22 33 44',
                address: 'San-Pédro'
            }
        ];

        companies.forEach(companyData => {
            const companyId = this.idGenerator.company();
            const company = {
                id: companyId,
                uniqueId: companyId,
                ...companyData,
                status: 'Actif',
                createdAt: new Date(),
                maxCashRegisters: 5,
                currentCashRegisters: 0,
                settings: {
                    currency: 'FCFA',
                    fiscalYear: new Date().getFullYear(),
                    accountingSystem: 'SYSCOHADA_REVISED'
                },
                // Données isolées par entreprise
                accounts: new Map(),
                entries: new Map(),
                cashRegisters: new Map(),
                users: new Set() // IDs des utilisateurs de cette entreprise
            };
            
            this.state.companies.set(companyId, company);
        });
    }

    createDefaultUsers() {
        const users = [
            {
                name: 'Marie Kouassi',
                email: 'marie.kouassi@cabinet.com',
                password: 'collab123',
                profile: 'collaborateur-senior',
                role: 'Collaborateur Senior',
                phone: '+225 07 11 11 11 11'
            },
            {
                name: 'Jean Diabaté',
                email: 'jean.diabate@cabinet.com',
                password: 'collab123',
                profile: 'collaborateur',
                role: 'Collaborateur',
                phone: '+225 07 22 22 22 22'
            },
            {
                name: 'Amadou Traoré',
                email: 'atraore@sarltech.ci',
                password: 'user123',
                profile: 'user',
                role: 'Utilisateur',
                phone: '+225 07 33 33 33 33'
            },
            {
                name: 'Ibrahim Koné',
                email: 'ikone@caisse.ci',
                password: 'caisse123',
                profile: 'caissier',
                role: 'Caissier',
                phone: '+225 07 44 44 44 44'
            }
        ];

        const companyIds = Array.from(this.state.companies.keys());

        users.forEach((userData, index) => {
            const userId = this.idGenerator.user();
            const user = {
                id: userId,
                uniqueId: userId,
                ...userData,
                passwordHash: this.hashPassword(userData.password),
                status: 'Actif',
                createdAt: new Date(),
                lastLogin: null,
                assignedCompanies: this.assignCompaniesToUser(userData.profile, index, companyIds),
                companyId: userData.profile === 'user' || userData.profile === 'caissier' ? 
                          companyIds[index % companyIds.length] : null,
                supervisorId: this.assignSupervisor(userData.profile, index),
                maxCompaniesAllowed: this.getMaxCompanies(userData.profile),
                securityClearance: this.getSecurityClearance(userData.profile)
            };
            
            delete user.password; // Supprimer le mot de passe en clair
            this.state.users.set(userId, user);
            
            // Associer l'utilisateur à ses entreprises
            user.assignedCompanies.forEach(companyId => {
                const company = this.state.companies.get(companyId);
                if (company) {
                    company.users.add(userId);
                }
            });
        });
    }

    assignCompaniesToUser(profile, index, companyIds) {
        switch (profile) {
            case 'collaborateur-senior':
                return companyIds.slice(0, 3); // 3 entreprises
            case 'collaborateur':
                return companyIds.slice(1, 3); // 2 entreprises
            case 'user':
            case 'caissier':
                return [companyIds[index % companyIds.length]]; // 1 entreprise
            default:
                return [];
        }
    }

    assignSupervisor(profile, index) {
        if (profile === 'collaborateur') {
            // Les collaborateurs sont assignés aux collaborateurs senior
            const seniors = Array.from(this.state.users.values())
                .filter(u => u.profile === 'collaborateur-senior');
            return seniors.length > 0 ? seniors[0].id : null;
        }
        return null;
    }

    getMaxCompanies(profile) {
        const limits = {
            'admin': -1, // Illimité
            'collaborateur-senior': 10,
            'collaborateur': 5,
            'user': 1,
            'caissier': 1
        };
        return limits[profile] || 1;
    }

    getSecurityClearance(profile) {
        const clearances = {
            'admin': 'LEVEL_5',
            'collaborateur-senior': 'LEVEL_4',
            'collaborateur': 'LEVEL_3',
            'user': 'LEVEL_2',
            'caissier': 'LEVEL_1'
        };
        return clearances[profile] || 'LEVEL_1';
    }

    hashPassword(password) {
        // En production, utiliser une vraie fonction de hachage sécurisée
        return btoa(password + 'DOUKE_SALT_2024');
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    // =============================================================================
    // COMPANY MANAGEMENT - GESTION DES ENTREPRISES
    // =============================================================================
    
    createCompany(companyData) {
        this.validateAccess('admin');
        
        const companyId = this.idGenerator.company();
        const company = {
            id: companyId,
            uniqueId: companyId,
            name: companyData.name,
            type: companyData.type,
            status: 'Période d\'essai',
            system: companyData.system || 'Normal',
            phone: companyData.phone,
            address: companyData.address,
            createdAt: new Date(),
            createdBy: this.state.currentUser.id,
            maxCashRegisters: companyData.maxCashRegisters || 5,
            currentCashRegisters: 0,
            settings: {
                currency: 'FCFA',
                fiscalYear: new Date().getFullYear(),
                accountingSystem: 'SYSCOHADA_REVISED'
            },
            // Collections isolées par entreprise
            accounts: new Map(),
            entries: new Map(),
            cashRegisters: new Map(),
            users: new Set()
        };
        
        this.state.companies.set(companyId, company);
        this.logAuditEvent('COMPANY_CREATED', { companyId, name: company.name });
        
        return company;
    }

    getCompaniesForUser(userId = null) {
        userId = userId || this.state.currentUser.id;
        const user = this.state.users.get(userId);
        
        if (!user) return [];
        
        switch (user.profile) {
            case 'admin':
                return Array.from(this.state.companies.values());
                
            case 'collaborateur-senior':
                const ownCompanies = user.assignedCompanies.map(id => this.state.companies.get(id)).filter(Boolean);
                const subordinateCompanies = this.getSubordinateCompanies(userId)
                    .map(id => this.state.companies.get(id)).filter(Boolean);
                return [...ownCompanies, ...subordinateCompanies];
                
            case 'collaborateur':
                return user.assignedCompanies.map(id => this.state.companies.get(id)).filter(Boolean);
                
            case 'user':
            case 'caissier':
                return user.companyId ? [this.state.companies.get(user.companyId)] : [];
                
            default:
                return [];
        }
    }

    selectCompany(companyId) {
        if (!this.canAccessCompany(companyId)) {
            throw new SecurityError('COMPANY_ACCESS_DENIED', 'Accès à cette entreprise refusé');
        }
        
        this.state.currentCompany = companyId;
        this.logAuditEvent('COMPANY_SELECTED', { companyId });
        
        // Mettre à jour l'UI
        this.uiManager.updateCompanySelector();
        this.uiManager.updateCompanyInfo();
        
        return this.state.companies.get(companyId);
    }

    // =============================================================================
    // USER MANAGEMENT - GESTION DES UTILISATEURS
    // =============================================================================
    
    createUser(userData) {
        this.validateAccess('admin');
        
        // Vérifier que l'email n'existe pas déjà
        const existingUser = Array.from(this.state.users.values())
            .find(user => user.email === userData.email);
        
        if (existingUser) {
            throw new ValidationError('EMAIL_EXISTS', 'Cet email est déjà utilisé');
        }
        
        const userId = this.idGenerator.user();
        const user = {
            id: userId,
            uniqueId: userId,
            name: userData.name,
            email: userData.email,
            passwordHash: this.hashPassword(userData.password),
            profile: userData.profile,
            role: userData.role,
            phone: userData.phone,
            status: 'Actif',
            createdAt: new Date(),
            createdBy: this.state.currentUser.id,
            lastLogin: null,
            assignedCompanies: userData.assignedCompanies || [],
            companyId: userData.companyId || null,
            supervisorId: userData.supervisorId || null,
            maxCompaniesAllowed: this.getMaxCompanies(userData.profile),
            securityClearance: this.getSecurityClearance(userData.profile)
        };
        
        this.state.users.set(userId, user);
        this.logAuditEvent('USER_CREATED', { userId, email: user.email, profile: user.profile });
        
        return user;
    }

    assignUserToCompany(userId, companyId) {
        this.validateAccess('collaborateur-senior');
        
        const user = this.state.users.get(userId);
        const company = this.state.companies.get(companyId);
        
        if (!user || !company) {
            throw new ValidationError('INVALID_IDS', 'Utilisateur ou entreprise introuvable');
        }
        
        // Vérifier les limites
        if (user.assignedCompanies.length >= user.maxCompaniesAllowed && user.maxCompaniesAllowed !== -1) {
            throw new ValidationError('COMPANY_LIMIT_REACHED', 'Limite d\'entreprises atteinte');
        }
        
        // Ajouter l'assignation
        if (!user.assignedCompanies.includes(companyId)) {
            user.assignedCompanies.push(companyId);
            company.users.add(userId);
            
            this.logAuditEvent('USER_ASSIGNED_TO_COMPANY', { userId, companyId });
        }
        
        return true;
    }

    // =============================================================================
    // AUTHENTICATION - AUTHENTIFICATION
    // =============================================================================
    
    async authenticate(email, password) {
        try {
            this.logAuditEvent('LOGIN_ATTEMPT', { email });
            
            const user = Array.from(this.state.users.values())
                .find(u => u.email === email);
            
            if (!user) {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'USER_NOT_FOUND' });
                throw new AuthenticationError('INVALID_CREDENTIALS', 'Identifiants incorrects');
            }
            
            if (user.status !== 'Actif') {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'USER_INACTIVE' });
                throw new AuthenticationError('USER_INACTIVE', 'Compte désactivé');
            }
            
            if (!this.verifyPassword(password, user.passwordHash)) {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'WRONG_PASSWORD' });
                throw new AuthenticationError('INVALID_CREDENTIALS', 'Identifiants incorrects');
            }
            
            // Connexion réussie
            this.state.isAuthenticated = true;
            this.state.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };
            this.state.currentProfile = user.profile;
            
            // Auto-sélection d'entreprise pour utilisateur/caissier
            if (user.profile === 'user' || user.profile === 'caissier') {
                this.state.currentCompany = user.companyId;
            }
            
            // Mettre à jour la dernière connexion
            user.lastLogin = new Date();
            
            this.logAuditEvent('LOGIN_SUCCESS', { userId: user.id });
            
            return {
                success: true,
                user: this.state.currentUser,
                profile: this.state.currentProfile,
                companies: this.getCompaniesForUser()
            };
            
        } catch (error) {
            console.error('Erreur authentification:', error);
            throw error;
        }
    }

    logout() {
        this.logAuditEvent('LOGOUT', { userId: this.state.currentUser?.id });
        
        this.state.isAuthenticated = false;
        this.state.currentUser = null;
        this.state.currentProfile = null;
        this.state.currentCompany = null;
        
        return true;
    }

    // =============================================================================
    // ERROR CLASSES - CLASSES D'ERREURS
    // =============================================================================
}

// Classes d'erreurs personnalisées
class SecurityError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'SecurityError';
        this.code = code;
    }
}

class ValidationError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
    }
}

class AuthenticationError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'AuthenticationError';
        this.code = code;
    }
}

// =============================================================================
// GESTIONNAIRE UI - INTERFACE UTILISATEUR
// =============================================================================

class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeTheme();
    }

    initializeTheme() {
        // Détection et gestion du thème
        if (localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (!localStorage.getItem('theme')) {
                if (event.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    }

    updateCompanySelector() {
        const selector = document.getElementById('activeCompanySelect');
        if (!selector) return;

        const companies = this.app.getCompaniesForUser();
        selector.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === this.app.state.currentCompany) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    updateCompanyInfo() {
        const infoElement = document.getElementById('selectedCompanyInfo');
        const currentCompanyElement = document.getElementById('currentCompany');
        
        if (this.app.state.currentCompany) {
            const company = this.app.state.companies.get(this.app.state.currentCompany);
            if (company) {
                if (infoElement) {
                    infoElement.innerHTML = `${company.system} • ${company.status}`;
                }
                if (currentCompanyElement) {
                    currentCompanyElement.textContent = company.name;
                }
            }
        } else {
            if (infoElement) infoElement.innerHTML = '';
            if (currentCompanyElement) {
                currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
            }
        }
    }

    showNotification(type, message, duration = 5000) {
        const notification = {
            id: Date.now(),
            type,
            message,
            timestamp: new Date()
        };
        
        this.app.state.notifications.unshift(notification);
        
        // Afficher la notification
        this.displayNotification(notification);
        
        // Supprimer après la durée spécifiée
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    displayNotification(notification) {
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('data-id', notification.id);
        element.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                <span>${notification.message}</span>
                <button onclick="app.uiManager.removeNotification(${notification.id})" class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(element);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-triangle',
            'warning': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    removeNotification(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.remove();
        }
        
        this.app.state.notifications = this.app.state.notifications.filter(n => n.id !== id);
    }
}

// =============================================================================
// INITIALISATION GLOBALE
// =============================================================================

// Instance globale de l'application
let app;

document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new DoukèComptaPro();
        app.initializeDefaultData();
        
        console.log('✅ DOUKÈ Compta Pro - Application restructurée initialisée avec succès');
        
        // Initialiser les événements de l'interface
        initializeUIEvents();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
        alert('Erreur lors du démarrage de l\'application. Veuillez recharger la page.');
    }
});

function initializeUIEvents() {
    // Gestionnaire de sélection d'entreprise
    const companySelect = document.getElementById('activeCompanySelect');
    if (companySelect) {
        companySelect.addEventListener('change', function(e) {
            if (e.target.value) {
                try {
                    app.selectCompany(e.target.value);
                    app.uiManager.showNotification('success', `Entreprise sélectionnée: ${app.state.companies.get(e.target.value).name}`);
                } catch (error) {
                    app.uiManager.showNotification('error', error.message);
                    e.target.value = '';
                }
            }
        });
    }

    // Gestionnaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const result = await app.authenticate(email, password);
                
                // Masquer l'interface de connexion et afficher l'application
                document.getElementById('loginInterface').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');
                
                // Initialiser l'interface utilisateur
                initializeMainApp();
                
                app.uiManager.showNotification('success', `Bienvenue ${result.user.name} !`);
                
            } catch (error) {
                app.uiManager.showNotification('error', error.message);
            }
        });
    }
}

function initializeMainApp() {
    // Charger la navigation
    if (typeof loadNavigationMenu === 'function') {
        loadNavigationMenu();
    }
    
    // Mettre à jour les informations utilisateur
    updateUserInfo();
    
    // Charger le tableau de bord
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
    
    // Mettre à jour les sélecteurs
    app.uiManager.updateCompanySelector();
    app.uiManager.updateCompanyInfo();
}

function updateUserInfo() {
    const user = app.state.currentUser;
    if (!user) return;
    
    // Mettre à jour les éléments de l'interface
    const elements = {
        'currentUser': user.name,
        'sidebarUserName': user.name,
        'sidebarUserRole': user.role
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Afficher/masquer les éléments selon le profil
    const profile = app.state.currentProfile;
    const companySelector = document.getElementById('companySelector');
    const adminActions = document.getElementById('adminActions');
    
    if (companySelector) {
        const shouldShow = ['admin', 'collaborateur-senior', 'collaborateur'].includes(profile);
        companySelector.style.display = shouldShow ? 'block' : 'none';
    }
    
    if (adminActions) {
        adminActions.style.display = profile === 'admin' ? 'block' : 'none';
    }
}

// Fonctions d'assistance pour la compatibilité
function loginAs(profile) {
    const credentials = {
        'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
        'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
        'user': { email: 'atraore@sarltech.ci', password: 'user123' },
        'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DoukèComptaPro, SecurityError, ValidationError, AuthenticationError };
}
