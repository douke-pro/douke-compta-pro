// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Version Corrigée et Compatible)
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
