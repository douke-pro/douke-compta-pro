// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Version Corrigée)
// =============================================================================

class DoukèComptaPro {
    constructor() {
        this.version = "2.0.0";
        this.initializeState();
        this.uiManager = new UIManager(this);
        console.log(`🚀 DOUKÈ Compta Pro v${this.version} - Initialisation...`);
    }

    // =============================================================================
    // ÉTAT DE L'APPLICATION
    // =============================================================================
    
    initializeState() {
        this.state = {
            // Utilisateur actuel
            currentUser: null,
            currentProfile: null,
            currentCompany: null,
            isAuthenticated: false,
            
            // Collections avec IDs uniques
            companies: new Map(),
            users: new Map(),
            accounts: [],
            entries: [],
            cashRegisters: [],
            
            // Métadonnées
            lastUpdate: new Date(),
            sessionStart: new Date(),
            
            // Configuration
            theme: 'system',
            companyLogo: null,
            notifications: [],
            auditLog: []
        };
        
        // Générateur d'IDs uniques
        this.idGenerator = {
            company: () => `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user: () => `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entry: () => `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cash: () => `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // =============================================================================
    // GESTION DE SÉCURITÉ
    // =============================================================================
    
    validateAccess(requiredProfile, targetCompanyId = null) {
        if (!this.state.isAuthenticated || !this.state.currentUser) {
            throw new Error('Utilisateur non authentifié');
        }

        const userProfile = this.state.currentProfile;
        const profileHierarchy = {
            'admin': 4,
            'collaborateur-senior': 3,
            'collaborateur': 2,
            'user': 1,
            'caissier': 0
        };

        if (profileHierarchy[userProfile] < profileHierarchy[requiredProfile]) {
            throw new Error('Privilèges insuffisants');
        }

        this.logAuditEvent('ACCESS_GRANTED', { requiredProfile, targetCompanyId });
        return true;
    }

    canAccessCompany(companyId) {
        const user = this.state.users.get(this.state.currentUser?.id);
        
        switch (this.state.currentProfile) {
            case 'admin':
                return true;
                
            case 'collaborateur-senior':
                return user?.assignedCompanies?.includes(companyId) || false;
                
            case 'collaborateur':
                return user?.assignedCompanies?.includes(companyId) || false;
                
            case 'user':
            case 'caissier':
                return user?.companyId === companyId;
                
            default:
                return false;
        }
    }

    logAuditEvent(action, details = {}) {
        const auditEntry = {
            id: this.idGenerator.entry(),
            timestamp: new Date(),
            userId: this.state.currentUser?.id,
            action,
            details,
            userAgent: navigator.userAgent
        };
        
        this.state.auditLog.push(auditEntry);
        console.log(`🔒 AUDIT: ${action}`, auditEntry);
    }

    // =============================================================================
    // INITIALISATION DES DONNÉES
    // =============================================================================
    
    initializeDefaultData() {
        this.logAuditEvent('DATA_INITIALIZATION_START');
        
        try {
            this.createDefaultCompanies();
            this.createDefaultUsers();
            this.initializeSyscohadaAccounts();
            this.createSampleEntries();
            
            this.logAuditEvent('DATA_INITIALIZATION_SUCCESS');
            console.log('✅ Données initialisées avec IDs uniques');
            
        } catch (error) {
            this.logAuditEvent('DATA_INITIALIZATION_ERROR', { error: error.message });
            throw error;
        }
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

        companies.forEach((companyData, index) => {
            const companyId = this.idGenerator.company();
            const company = {
                id: companyId,
                uniqueId: companyId,
                ...companyData,
                status: index === 3 ? 'Suspendu' : (index === 2 ? 'Période d\'essai' : 'Actif'),
                createdAt: new Date(),
                cashRegisters: Math.floor(Math.random() * 5) + 1,
                settings: {
                    currency: 'FCFA',
                    fiscalYear: new Date().getFullYear(),
                    accountingSystem: 'SYSCOHADA_REVISED'
                },
                accounts: new Map(),
                entries: new Map(),
                cashRegisters_data: new Map(),
                users: new Set()
            };
            
            this.state.companies.set(companyId, company);
        });
    }

    createDefaultUsers() {
        const users = [
            {
                name: 'Admin Système',
                email: 'admin@doukecompta.ci',
                password: 'admin123',
                profile: 'admin',
                role: 'Administrateur',
                phone: '+225 07 00 00 00 00'
            },
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
                supervisorId: null,
                maxCompaniesAllowed: this.getMaxCompanies(userData.profile),
                securityClearance: this.getSecurityClearance(userData.profile)
            };
            
            delete user.password;
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
            case 'admin':
                return companyIds; // Toutes les entreprises
            case 'collaborateur-senior':
                return companyIds.slice(0, 3);
            case 'collaborateur':
                return companyIds.slice(1, 3);
            case 'user':
            case 'caissier':
                return [companyIds[index % companyIds.length]];
            default:
                return [];
        }
    }

    getMaxCompanies(profile) {
        const limits = {
            'admin': -1,
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
        return btoa(password + 'DOUKE_SALT_2024');
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    initializeSyscohadaAccounts() {
        this.state.accounts = [
            // Classe 1 - Comptes de ressources durables
            { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
            { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
            { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
            { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
            { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
            
            // Classe 2 - Comptes d'actif immobilisé
            { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
            { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
            { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
            { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
            
            // Classe 3 - Comptes de stocks
            { code: '311000', name: 'Marchandises', category: 'Stocks' },
            { code: '321000', name: 'Matières premières', category: 'Stocks' },
            
            // Classe 4 - Comptes de tiers
            { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
            { code: '411000', name: 'Clients', category: 'Clients' },
            { code: '421000', name: 'Personnel', category: 'Personnel' },
            { code: '441000', name: 'État et collectivités', category: 'État' },
            
            // Classe 5 - Comptes financiers
            { code: '512000', name: 'Banques', category: 'Comptes bancaires' },
            { code: '571000', name: 'Caisse', category: 'Caisse' },
            
            // Classe 6 - Comptes de charges
            { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
            { code: '621000', name: 'Transports', category: 'Services extérieurs' },
            { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
            
            // Classe 7 - Comptes de produits
            { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
            { code: '706000', name: 'Services vendus', category: 'Ventes' }
        ];
    }

    createSampleEntries() {
        const companyIds = Array.from(this.state.companies.keys());
        
        this.state.entries = [
            {
                id: this.idGenerator.entry(),
                date: '2024-12-15',
                journal: 'JV',
                piece: 'JV-2024-001-0156',
                libelle: 'Vente marchandises Client ABC',
                companyId: companyIds[0],
                lines: [
                    { account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 },
                    { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },
                    { account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }
                ],
                status: 'Validé',
                userId: Array.from(this.state.users.values())[1].id
            },
            {
                id: this.idGenerator.entry(),
                date: '2024-12-14',
                journal: 'JA',
                piece: 'JA-2024-001-0157',
                libelle: 'Achat marchandises Fournisseur XYZ',
                companyId: companyIds[0],
                lines: [
                    { account: '601000', accountName: 'Achats de marchandises', libelle: 'Achat marchandises', debit: 850000, credit: 0 },
                    { account: '441000', accountName: 'État et collectivités', libelle: 'TVA déductible', debit: 170000, credit: 0 },
                    { account: '401000', accountName: 'Fournisseurs', libelle: 'Fournisseur XYZ', debit: 0, credit: 1020000 }
                ],
                status: 'En attente',
                userId: Array.from(this.state.users.values())[2].id
            }
        ];
    }

    // =============================================================================
    // GESTION DES ENTREPRISES
    // =============================================================================
    
    getCompaniesForUser(userId = null) {
        userId = userId || this.state.currentUser?.id;
        const user = this.state.users.get(userId);
        
        if (!user) return [];
        
        switch (user.profile) {
            case 'admin':
                return Array.from(this.state.companies.values());
                
            case 'collaborateur-senior':
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
            throw new Error('Accès à cette entreprise refusé');
        }
        
        this.state.currentCompany = companyId;
        this.logAuditEvent('COMPANY_SELECTED', { companyId });
        
        this.uiManager.updateCompanyInfo();
        return this.state.companies.get(companyId);
    }

    // =============================================================================
    // AUTHENTIFICATION
    // =============================================================================
    
    async authenticate(email, password) {
        try {
            this.logAuditEvent('LOGIN_ATTEMPT', { email });
            
            const user = Array.from(this.state.users.values())
                .find(u => u.email === email);
            
            if (!user) {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'USER_NOT_FOUND' });
                throw new Error('Identifiants incorrects');
            }
            
            if (user.status !== 'Actif') {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'USER_INACTIVE' });
                throw new Error('Compte désactivé');
            }
            
            if (!this.verifyPassword(password, user.passwordHash)) {
                this.logAuditEvent('LOGIN_FAILED', { email, reason: 'WRONG_PASSWORD' });
                throw new Error('Identifiants incorrects');
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
    // UTILITAIRES
    // =============================================================================
    
    getCompanyName() {
        if (!this.state.currentCompany) return 'Aucune entreprise sélectionnée';
        const company = this.state.companies.get(this.state.currentCompany);
        return company ? company.name : 'Entreprise inconnue';
    }
}

// =============================================================================
// GESTIONNAIRE UI
// =============================================================================

class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeTheme();
    }

    initializeTheme() {
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

    showNotification(type, message) {
        // Utiliser alert pour la simplicité
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        alert(`${icons[type] || 'ℹ️'} ${message}`);
    }
}

// =============================================================================
// INITIALISATION GLOBALE
// =============================================================================

let app;

document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new DoukèComptaPro();
        app.initializeDefaultData();
        
        console.log('✅ DOUKÈ Compta Pro - Application initialisée avec succès');
        initializeUIEvents();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du démarrage de l\'application. Veuillez recharger la page.');
    }
});

function initializeUIEvents() {
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

    // Gestionnaire de sélection d'entreprise
    setTimeout(() => {
        const companySelect = document.getElementById('activeCompanySelect');
        if (companySelect) {
            companySelect.addEventListener('change', function(e) {
                if (e.target.value) {
                    try {
                        app.selectCompany(e.target.value);
                        app.uiManager.showNotification('success', `Entreprise sélectionnée: ${app.getCompanyName()}`);
                    } catch (error) {
                        app.uiManager.showNotification('error', error.message);
                        e.target.value = '';
                    }
                }
            });
        }
    }, 1000);
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

// Fonctions de compatibilité avec l'interface existante
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

// Maintenir la compatibilité avec les variables globales existantes
window.app = {
    currentProfile: null,
    currentCompany: null,
    currentUser: null,
    isAuthenticated: false,
    accounts: [],
    entries: [],
    companies: [],
    users: [],
    cashRegisters: []
};

// Synchroniser avec la nouvelle structure
function syncLegacyData() {
    if (window.app && app) {
        window.app.currentProfile = app.state.currentProfile;
        window.app.currentCompany = app.state.currentCompany;
        window.app.currentUser = app.state.currentUser;
        window.app.isAuthenticated = app.state.isAuthenticated;
        window.app.accounts = app.state.accounts;
        window.app.entries = app.state.entries;
        window.app.companies = Array.from(app.state.companies.values());
        window.app.users = Array.from(app.state.users.values());
    }
}
