// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Version Complète avec Interface)
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
            
            // Collections (maintien tableaux pour compatibilité)
            companies: [],
            users: [],
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
        const user = this.state.users.find(u => u.id === this.state.currentUser?.id);
        
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
            this.createSampleCashRegisters();
            
            // Synchroniser avec les variables globales pour compatibilité
            this.syncWithGlobalApp();
            
            this.logAuditEvent('DATA_INITIALIZATION_SUCCESS');
            console.log('✅ Données initialisées avec IDs uniques');
            
        } catch (error) {
            this.logAuditEvent('DATA_INITIALIZATION_ERROR', { error: error.message });
            console.error('❌ Erreur initialisation données:', error);
            throw error;
        }
    }

    createDefaultCompanies() {
        const companiesData = [
            {
                name: 'SARL TECH INNOVATION',
                type: 'SARL',
                system: 'Normal',
                phone: '+225 07 12 34 56 78',
                address: 'Abidjan, Cocody',
                status: 'Actif',
                cashRegisters: 3
            },
            {
                name: 'SA COMMERCE PLUS',
                type: 'SA',
                system: 'Normal',
                phone: '+225 05 98 76 54 32',
                address: 'Abidjan, Plateau',
                status: 'Actif',
                cashRegisters: 5
            },
            {
                name: 'EURL SERVICES PRO',
                type: 'EURL',
                system: 'Minimal',
                phone: '+225 01 23 45 67 89',
                address: 'Bouaké Centre',
                status: 'Période d\'essai',
                cashRegisters: 2
            },
            {
                name: 'SAS DIGITAL WORLD',
                type: 'SAS',
                system: 'Normal',
                phone: '+225 07 11 22 33 44',
                address: 'San-Pédro',
                status: 'Suspendu',
                cashRegisters: 1
            }
        ];

        this.state.companies = companiesData.map((companyData, index) => {
            const companyId = index + 1; // ID numérique pour compatibilité
            return {
                id: companyId,
                uniqueId: this.idGenerator.company(),
                ...companyData,
                createdAt: new Date(),
                settings: {
                    currency: 'FCFA',
                    fiscalYear: new Date().getFullYear(),
                    accountingSystem: 'SYSCOHADA_REVISED'
                }
            };
        });
    }

    createDefaultUsers() {
        const usersData = [
            {
                name: 'Admin Système',
                email: 'admin@doukecompta.ci',
                password: 'admin123',
                profile: 'admin',
                role: 'Administrateur',
                phone: '+225 07 00 00 00 00',
                companies: [1, 2, 3, 4]
            },
            {
                name: 'Marie Kouassi',
                email: 'marie.kouassi@cabinet.com',
                password: 'collab123',
                profile: 'collaborateur-senior',
                role: 'Collaborateur Senior',
                phone: '+225 07 11 11 11 11',
                companies: [1, 2, 3]
            },
            {
                name: 'Jean Diabaté',
                email: 'jean.diabate@cabinet.com',
                password: 'collab123',
                profile: 'collaborateur',
                role: 'Collaborateur',
                phone: '+225 07 22 22 22 22',
                companies: [2, 4]
            },
            {
                name: 'Amadou Traoré',
                email: 'atraore@sarltech.ci',
                password: 'user123',
                profile: 'user',
                role: 'Utilisateur',
                phone: '+225 07 33 33 33 33',
                companies: [1],
                companyId: 1
            },
            {
                name: 'Ibrahim Koné',
                email: 'ikone@caisse.ci',
                password: 'caisse123',
                profile: 'caissier',
                role: 'Caissier',
                phone: '+225 07 44 44 44 44',
                companies: [2],
                companyId: 2
            }
        ];

        this.state.users = usersData.map((userData, index) => {
            const userId = index + 1; // ID numérique pour compatibilité
            const user = {
                id: userId,
                uniqueId: this.idGenerator.user(),
                ...userData,
                passwordHash: this.hashPassword(userData.password),
                status: 'Actif',
                createdAt: new Date(),
                lastLogin: null,
                assignedCompanies: userData.companies || [],
                supervisorId: null,
                maxCompaniesAllowed: this.getMaxCompanies(userData.profile),
                securityClearance: this.getSecurityClearance(userData.profile)
            };
            
            delete user.password;
            return user;
        });
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
    }

    createSampleEntries() {
        this.state.entries = [
            {
                id: 1,
                uniqueId: this.idGenerator.entry(),
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
                uniqueId: this.idGenerator.entry(),
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
                uniqueId: this.idGenerator.entry(),
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
            }
        ];
    }

    createSampleCashRegisters() {
        this.state.cashRegisters = [
            {
                id: 1,
                uniqueId: this.idGenerator.cash(),
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
                uniqueId: this.idGenerator.cash(),
                name: 'Caisse Ventes',
                companyId: 2,
                responsibleId: null,
                responsibleName: 'Fatou Diallo',
                balance: 85000,
                status: 'Ouvert',
                openingBalance: 100000,
                dailyReceipts: 35000,
                dailyExpenses: 50000
            },
            {
                id: 3,
                uniqueId: this.idGenerator.cash(),
                name: 'Caisse Réception',
                companyId: 1,
                responsibleId: null,
                responsibleName: 'Non assigné',
                balance: 0,
                status: 'Fermé',
                openingBalance: 0,
                dailyReceipts: 0,
                dailyExpenses: 0
            }
        ];
    }

    // =============================================================================
    // SYNCHRONISATION AVEC VARIABLES GLOBALES
    // =============================================================================
    
    syncWithGlobalApp() {
        // Maintenir la compatibilité avec le code HTML original
        if (typeof window !== 'undefined') {
            window.app = {
                currentProfile: this.state.currentProfile,
                currentCompany: this.state.currentCompany,
                currentUser: this.state.currentUser,
                isAuthenticated: this.state.isAuthenticated,
                accounts: this.state.accounts,
                entries: this.state.entries,
                companies: this.state.companies,
                users: this.state.users,
                cashRegisters: this.state.cashRegisters,
                companyLogo: this.state.companyLogo,
                notifications: this.state.notifications,
                deadlines: []
            };
        }
    }

    // =============================================================================
    // GESTION DES ENTREPRISES
    // =============================================================================
    
    getCompaniesForUser(userId = null) {
        userId = userId || this.state.currentUser?.id;
        const user = this.state.users.find(u => u.id === userId);
        
        if (!user) return [];
        
        switch (user.profile) {
            case 'admin':
                return this.state.companies;
                
            case 'collaborateur-senior':
            case 'collaborateur':
                return this.state.companies.filter(c => user.assignedCompanies?.includes(c.id));
                
            case 'user':
            case 'caissier':
                return this.state.companies.filter(c => c.id === user.companyId);
                
            default:
                return [];
        }
    }

    selectCompany(companyId) {
        const companyIdNum = parseInt(companyId);
        
        if (!this.canAccessCompany(companyIdNum)) {
            throw new Error('Accès à cette entreprise refusé');
        }
        
        this.state.currentCompany = companyIdNum;
        this.logAuditEvent('COMPANY_SELECTED', { companyId: companyIdNum });
        
        // Synchroniser
        this.syncWithGlobalApp();
        this.uiManager.updateCompanyInfo();
        
        return this.state.companies.find(c => c.id === companyIdNum);
    }

    // =============================================================================
    // AUTHENTIFICATION
    // =============================================================================
    
    async authenticate(email, password) {
        try {
            this.logAuditEvent('LOGIN_ATTEMPT', { email });
            
            const user = this.state.users.find(u => u.email === email);
            
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
            
            // Synchroniser avec les variables globales
            this.syncWithGlobalApp();
            
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
        
        // Synchroniser
        this.syncWithGlobalApp();
        
        return true;
    }

    // =============================================================================
    // UTILITAIRES
    // =============================================================================
    
    getCompanyName() {
        if (!this.state.currentCompany) return 'Aucune entreprise sélectionnée';
        const company = this.state.companies.find(c => c.id === this.state.currentCompany);
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
            const company = this.app.state.companies.find(c => c.id === this.app.state.currentCompany);
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
// FONCTIONS D'AFFICHAGE ET NAVIGATION
// =============================================================================

function loadNavigationMenu() {
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

    const menuElement = document.getElementById('navigationMenu');
    if (menuElement) {
        menuElement.innerHTML = menuHtml;
    }
}

function navigateTo(page) {
    // Remove active class from all menu items
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active class to clicked item
    try {
        const clickedElement = event.target.closest('a');
        if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
            clickedElement.classList.add('bg-primary', 'text-white');
            clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
        }
    } catch (e) {
        // Ignore error if event is not available
    }

    console.log('🔄 Navigation vers:', page);

    // Load page content
    try {
        switch(page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'users':
                loadUsersManagement();
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
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page:', error);
        alert('Erreur lors du chargement de la page: ' + page);
    }
}

function loadDashboard() {
    if (app.currentProfile === 'admin') {
        loadAdminDashboard();
    } else {
        loadStandardDashboard();
    }
}

function loadAdminDashboard() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- KPI Cards Admin -->
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
                        <span class="text-success">+2</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-users text-info text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries.filter(e => e.status === 'En attente').length}</p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Validées</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries.filter(e => e.status === 'Validé').length}</p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-check text-success text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Portefeuille Collaborateurs -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille des Collaborateurs
                </h3>
                <div class="space-y-4">
                    ${generateCollaboratorPortfolio()}
                </div>
            </div>

            <!-- Charts Admin -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution du Portefeuille</h3>
                    <div class="h-64 flex items-center justify-center">
                        <canvas id="portfolioChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance par Secteur</h3>
                    <div class="h-64 flex items-center justify-center">
                        <canvas id="sectorChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        // Chargement différé des graphiques
        setTimeout(() => {
            try {
                initializeAdminCharts();
            } catch (error) {
                console.error('Erreur chargement graphiques admin:', error);
            }
        }, 200);
    }
}

function loadStandardDashboard() {
    const userCompany = app.companies.find(c => c.id == app.currentCompany);
    let cashCount = userCompany ? userCompany.cashRegisters : 1;
    let dashboardTitle = 'Tableau de Bord';

    if (app.currentProfile === 'user') {
        dashboardTitle = 'Mon Entreprise';
    } else if (app.currentProfile === 'caissier') {
        dashboardTitle = 'Ma Caisse';
        cashCount = '→';
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- KPI Cards Standard -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ${app.currentProfile === 'user' ? 'Caisses disponibles' :
                                  app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${cashCount}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas ${app.currentProfile === 'caissier' ? 'fa-plus-circle' :
                                         app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>
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
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures ce mois</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${app.currentProfile === 'caissier' ? '45' : app.entries.length}
                            </p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-edit text-success text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente validation</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${app.entries.filter(e => e.status === 'En attente').length}
                            </p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-clock text-warning text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">98%</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-chart-line text-info text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Standard -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution Mensuelle</h3>
                    <div class="h-64 flex items-center justify-center">
                        <canvas id="monthlyChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par Journal</h3>
                    <div class="h-64 flex items-center justify-center">
                        <canvas id="journalChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        // Chargement différé des graphiques
        setTimeout(() => {
            try {
                initializeStandardCharts();
            } catch (error) {
                console.error('Erreur chargement graphiques standard:', error);
            }
        }, 200);
    }
}

function generateCollaboratorPortfolio() {
    const collaborators = app.users.filter(u => u.profile.includes('collaborateur'));

    if (collaborators.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun collaborateur trouvé</div>';
    }

    return collaborators.map(collab => `
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
                <div class="text-lg font-bold text-gray-900 dark:text-white">${collab.companies?.length || 0}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">entreprises</div>
                <div class="flex items-center space-x-2 mt-1">
                    <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div class="h-full bg-success" style="width: 95%"></div>
                    </div>
                    <span class="text-xs font-medium text-success">95%</span>
                </div>
            </div>
        </div>
    `).join('');
}

function initializeAdminCharts() {
    try {
        // Portfolio Chart
        const portfolioCtx = document.getElementById('portfolioChart');
        if (portfolioCtx && typeof Chart !== 'undefined') {
            new Chart(portfolioCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Entreprises Actives',
                        data: [18, 20, 22, 21, 23, app.companies.filter(c => c.status === 'Actif').length],
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true } },
                    animation: { duration: 800 }
                }
            });
        }

        // Sector Chart avec délai
        setTimeout(() => {
            const sectorCtx = document.getElementById('sectorChart');
            if (sectorCtx && typeof Chart !== 'undefined') {
                new Chart(sectorCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Commerce', 'Services', 'Industries', 'Agriculture'],
                        datasets: [{
                            label: 'Performance (%)',
                            data: [92, 88, 95, 85],
                            backgroundColor: ['#5D5CDE', '#3B82F6', '#0284C7', '#059669']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        animation: { duration: 600 }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('Erreur initialisation graphiques admin:', error);
    }
}

function initializeStandardCharts() {
    try {
        // Monthly Chart
        const monthlyCtx = document.getElementById('monthlyChart');
        if (monthlyCtx && typeof Chart !== 'undefined') {
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Écritures',
                        data: [120, 190, 300, 500, 200, app.entries.length * 10],
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 800 }
                }
            });
        }

        // Journal Chart avec délai
        setTimeout(() => {
            const journalCtx = document.getElementById('journalChart');
            if (journalCtx && typeof Chart !== 'undefined') {
                const journalData = {
                    'JG': app.entries.filter(e => e.journal === 'JG').length,
                    'JA': app.entries.filter(e => e.journal === 'JA').length,
                    'JV': app.entries.filter(e => e.journal === 'JV').length,
                    'JB': app.entries.filter(e => e.journal === 'JB').length,
                    'JC': app.entries.filter(e => e.journal === 'JC').length,
                    'JOD': app.entries.filter(e => e.journal === 'JOD').length
                };

                new Chart(journalCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['JG', 'JA', 'JV', 'JB', 'JC', 'JOD'],
                        datasets: [{
                            data: Object.values(journalData),
                            backgroundColor: ['#5D5CDE', '#3B82F6', '#0284C7', '#059669', '#D97706', '#DC2626']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 600 }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('Erreur initialisation graphiques standard:', error);
    }
}

// Fonctions de page simplifiées pour les tests
function loadUsersManagement() {
    if (app.currentProfile !== 'admin') {
        showAccessDenied();
        return;
    }
    
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Utilisateurs</h3>
                <div class="space-y-4">
                    ${app.users.map(user => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <div class="font-medium text-gray-900 dark:text-white">${user.name}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">${user.email} • ${user.role}</div>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                ${user.assignedCompanies?.length || 0} entreprise(s)
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadCompanies() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                ${app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Entreprises</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${app.companies.map(company => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">${company.type} • ${company.system}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">${company.phone}</div>
                            <div class="mt-2">
                                <span class="px-2 py-1 rounded text-xs ${company.status === 'Actif' ? 'bg-success/20 text-success' : 
                                                                      company.status === 'Période d\'essai' ? 'bg-warning/20 text-warning' : 
                                                                      'bg-danger/20 text-danger'}">${company.status}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadEntries() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                ${app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Écritures</h3>
                <div class="space-y-4">
                    ${app.entries.map(entry => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">${entry.libelle}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${entry.piece} • ${new Date(entry.date).toLocaleDateString('fr-FR')}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA</div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadAccounts() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes Disponibles</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${app.accounts.map(account => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div class="font-mono text-sm text-primary">${account.code}</div>
                            <div class="font-medium text-gray-900 dark:text-white text-sm">${account.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${account.category}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadCaisse() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                ${app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Gestion des Caisses'}
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Caisses Disponibles</h3>
                <div class="space-y-4">
                    ${app.cashRegisters.map(cash => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">${cash.name}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Responsable: ${cash.responsibleName}</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-mono text-lg text-gray-900 dark:text-white">${cash.balance.toLocaleString('fr-FR')} FCFA</div>
                                    <span class="px-2 py-1 rounded text-xs ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadReports() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports & États Financiers</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Journal Général</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Chronologique des écritures</p>
                    <button class="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Télécharger
                    </button>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Balance Générale</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Tous les comptes</p>
                    <button class="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Télécharger
                    </button>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bilan SYSCOHADA</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Actif / Passif</p>
                    <button class="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Télécharger
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadImport() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Importer un fichier</h3>
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez votre fichier ici</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Formats supportés: Excel, CSV (max 10 MB)</p>
                    <button class="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        Sélectionner un fichier
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function loadSettings() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center space-x-6 mb-6">
                    <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        ${app.currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${app.currentUser.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400">${app.currentUser.email}</p>
                        <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary">${app.currentUser.role}</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
                        <input type="text" value="${app.currentUser.name}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <input type="email" value="${app.currentUser.email}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                </div>
                
                <div class="mt-6">
                    <button class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-save mr-2"></i>Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function showAccessDenied() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ban text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
    `;
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
        console.log('📊 Données chargées:', {
            companies: app.state.companies.length,
            users: app.state.users.length,
            accounts: app.state.accounts.length,
            entries: app.state.entries.length
        });
        
        initializeUIEvents();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du démarrage de l\'application. Détails dans la console.');
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
    try {
        // Charger la navigation
        loadNavigationMenu();
        
        // Mettre à jour les informations utilisateur
        updateUserInfo();
        
        // Charger le tableau de bord
        loadDashboard();
        
        // Mettre à jour les sélecteurs
        app.uiManager.updateCompanySelector();
        app.uiManager.updateCompanyInfo();
        
        console.log('✅ Interface principale initialisée');
        
    } catch (error) {
        console.error('❌ Erreur initialisation interface:', error);
    }
}

function updateUserInfo() {
    const user = app.state.currentUser;
    if (!user) return;
    
    try {
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
        
    } catch (error) {
        console.error('❌ Erreur mise à jour infos utilisateur:', error);
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

// Gestionnaire d'erreurs global
window.addEventListener('error', function(e) {
    console.error('❌ Erreur JavaScript:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
});

          
