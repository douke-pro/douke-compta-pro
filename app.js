// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Version Complète et Corrigée)
// =============================================================================

class DoukèComptaPro {
    constructor() {
        this.version = "2.0.0";
        this.initializeState();
        this.uiManager = new UIManager(this);
        console.log(`🚀 DOUKÈ Compta Pro v${this.version} - Initialisation...`);
    }

    initializeState() {
        this.state = {
            currentUser: null,
            currentProfile: null,
            currentCompany: null,
            isAuthenticated: false,
            companies: [],
            users: [],
            accounts: [],
            entries: [],
            cashRegisters: [],
            lastUpdate: new Date(),
            theme: 'system',
            companyLogo: null,
            notifications: [],
            auditLog: []
        };

        this.idGenerator = {
            company: () => `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user: () => `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entry: () => `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cash: () => `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
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

    hashPassword(password) {
        return btoa(password + 'DOUKE_SALT_2024');
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    initializeDefaultData() {
        console.log('🔄 Initialisation des données par défaut...');

        // Entreprises
        this.state.companies = [
            {
                id: 1,
                uniqueId: this.idGenerator.company(),
                name: 'SARL TECH INNOVATION',
                type: 'SARL',
                system: 'Normal',
                phone: '+225 07 12 34 56 78',
                address: 'Abidjan, Cocody',
                status: 'Actif',
                cashRegisters: 3
            },
            {
                id: 2,
                uniqueId: this.idGenerator.company(),
                name: 'SA COMMERCE PLUS',
                type: 'SA',
                system: 'Normal',
                phone: '+225 05 98 76 54 32',
                address: 'Abidjan, Plateau',
                status: 'Actif',
                cashRegisters: 5
            },
            {
                id: 3,
                uniqueId: this.idGenerator.company(),
                name: 'EURL SERVICES PRO',
                type: 'EURL',
                system: 'Minimal',
                phone: '+225 01 23 45 67 89',
                address: 'Bouaké Centre',
                status: 'Période d\'essai',
                cashRegisters: 2
            },
            {
                id: 4,
                uniqueId: this.idGenerator.company(),
                name: 'SAS DIGITAL WORLD',
                type: 'SAS',
                system: 'Normal',
                phone: '+225 07 11 22 33 44',
                address: 'San-Pédro',
                status: 'Suspendu',
                cashRegisters: 1
            }
        ];

        // Utilisateurs
        this.state.users = [
            {
                id: 1,
                uniqueId: this.idGenerator.user(),
                name: 'Admin Système',
                email: 'admin@doukecompta.ci',
                passwordHash: this.hashPassword('admin123'),
                profile: 'admin',
                role: 'Administrateur',
                phone: '+225 07 00 00 00 00',
                status: 'Actif',
                companies: [1, 2, 3, 4],
                assignedCompanies: [1, 2, 3, 4]
            },
            {
                id: 2,
                uniqueId: this.idGenerator.user(),
                name: 'Marie Kouassi',
                email: 'marie.kouassi@cabinet.com',
                passwordHash: this.hashPassword('collab123'),
                profile: 'collaborateur-senior',
                role: 'Collaborateur Senior',
                phone: '+225 07 11 11 11 11',
                status: 'Actif',
                companies: [1, 2, 3],
                assignedCompanies: [1, 2, 3]
            },
            {
                id: 3,
                uniqueId: this.idGenerator.user(),
                name: 'Jean Diabaté',
                email: 'jean.diabate@cabinet.com',
                passwordHash: this.hashPassword('collab123'),
                profile: 'collaborateur',
                role: 'Collaborateur',
                phone: '+225 07 22 22 22 22',
                status: 'Actif',
                companies: [2, 4],
                assignedCompanies: [2, 4]
            },
            {
                id: 4,
                uniqueId: this.idGenerator.user(),
                name: 'Amadou Traoré',
                email: 'atraore@sarltech.ci',
                passwordHash: this.hashPassword('user123'),
                profile: 'user',
                role: 'Utilisateur',
                phone: '+225 07 33 33 33 33',
                status: 'Actif',
                companies: [1],
                assignedCompanies: [1],
                companyId: 1
            },
            {
                id: 5,
                uniqueId: this.idGenerator.user(),
                name: 'Ibrahim Koné',
                email: 'ikone@caisse.ci',
                passwordHash: this.hashPassword('caisse123'),
                profile: 'caissier',
                role: 'Caissier',
                phone: '+225 07 44 44 44 44',
                status: 'Actif',
                companies: [2],
                assignedCompanies: [2],
                companyId: 2
            }
        ];

        // Plan comptable SYSCOHADA complet
        this.state.accounts = [
            // Classe 1
            { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
            { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
            { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
            { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
            { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
            // Classe 2
            { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
            { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
            { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
            { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
            // Classe 3
            { code: '311000', name: 'Marchandises', category: 'Stocks' },
            { code: '321000', name: 'Matières premières', category: 'Stocks' },
            // Classe 4
            { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
            { code: '411000', name: 'Clients', category: 'Clients' },
            { code: '421000', name: 'Personnel', category: 'Personnel' },
            { code: '441000', name: 'État et collectivités', category: 'État' },
            // Classe 5
            { code: '512000', name: 'Banques', category: 'Comptes bancaires' },
            { code: '571000', name: 'Caisse', category: 'Caisse' },
            // Classe 6
            { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
            { code: '621000', name: 'Transports', category: 'Services extérieurs' },
            { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
            // Classe 7
            { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
            { code: '706000', name: 'Services vendus', category: 'Ventes' }
        ];

        // Écritures d'exemple
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
            }
        ];

        // Caisses d'exemple
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
            }
        ];

        // Synchroniser immédiatement
        this.syncWithGlobalApp();
        console.log('✅ Données initialisées :', {
            companies: this.state.companies.length,
            users: this.state.users.length,
            accounts: this.state.accounts.length,
            entries: this.state.entries.length,
            cashRegisters: this.state.cashRegisters.length
        });
    }

    syncWithGlobalApp() {
        window.app = {
            currentUser: this.state.currentUser,
            currentProfile: this.state.currentProfile,
            currentCompany: this.state.currentCompany,
            isAuthenticated: this.state.isAuthenticated,
            companies: this.state.companies,
            users: this.state.users,
            accounts: this.state.accounts,
            entries: this.state.entries,
            cashRegisters: this.state.cashRegisters
        };
        console.log('🔄 window.app synchronisé avec', window.app.companies.length, 'entreprises');
    }

    async authenticate(email, password) {
        try {
            this.logAuditEvent('LOGIN_ATTEMPT', { email });

            const user = this.state.users.find(u => u.email === email);

            if (!user || !this.verifyPassword(password, user.passwordHash)) {
                throw new Error('Identifiants incorrects');
            }

            if (user.status !== 'Actif') {
                throw new Error('Compte désactivé');
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

            // Synchroniser OBLIGATOIREMENT
            this.syncWithGlobalApp();

            console.log('✅ Authentification réussie, window.app synchronisé:', {
                currentUser: this.state.currentUser,
                currentProfile: this.state.currentProfile,
                currentCompany: this.state.currentCompany
            });

            return {
                success: true,
                user: this.state.currentUser,
                profile: this.state.currentProfile
            };

        } catch (error) {
            console.error('❌ Erreur authentification:', error);
            throw error;
        }
    }

    getCompanyName() {
        if (!this.state.currentCompany) return 'Aucune entreprise sélectionnée';
        const company = this.state.companies.find(c => c.id === this.state.currentCompany);
        return company ? company.name : 'Entreprise inconnue';
    }
}

// ================================================================================
// GESTIONNAIRE UI
// ================================================================================

class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeTheme();
    }

    initializeTheme() {
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    showNotification(type, message) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        alert(`${icons[type] || 'ℹ️'} ${message}`);
    }

    updateCompanySelector() {
        const selector = document.getElementById('activeCompanySelect');
        if (!selector) return;

        const companies = window.app?.companies || [];
        selector.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === window.app?.currentCompany) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    updateCompanyInfo() {
        const infoElement = document.getElementById('selectedCompanyInfo');
        const currentCompanyElement = document.getElementById('currentCompany');

        if (window.app?.currentCompany) {
            const company = window.app.companies.find(c => c.id === window.app.currentCompany);
            if (company) {
                if (infoElement) infoElement.innerHTML = `${company.system} • ${company.status}`;
                if (currentCompanyElement) currentCompanyElement.textContent = company.name;
            }
        } else {
            if (infoElement) infoElement.innerHTML = '';
            if (currentCompanyElement) currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
        }
    }
}

// =============================================================================
// FONCTIONS D'AFFICHAGE (Complètes et Fonctionnelles)
// =============================================================================

function loadNavigationMenu() {
    if (!window.app) {
        console.error('❌ window.app non défini dans loadNavigationMenu');
        return;
    }

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

    const items = menuItems[window.app.currentProfile] || menuItems.user;

    const menuHtml = items.map(item => `
        <a href="#" onclick="navigateTo('${item.id}'); return false;" 
           class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
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
    console.log('🔄 Navigation vers:', page);

    if (!window.app) {
        console.error('❌ window.app non défini dans navigateTo');
        alert('❌ Erreur : Application non initialisée');
        return;
    }

    // Supprimer la classe active de tous les éléments de menu
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Ajouter la classe active à l'élément cliqué
    try {
        const clickedElement = event.target.closest('a');
        if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
            clickedElement.classList.add('bg-primary', 'text-white');
            clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
        }
    } catch (e) {
        // Ignorer si l'événement n'est pas disponible
    }

    // Charger le contenu de la page
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
                console.log('⚠️ Page inconnue, chargement du tableau de bord');
                loadDashboard();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page :', error);
        alert('Erreur lors du chargement de la page : ' + page + '\nDétails : ' + error.message);
    }
}

function loadDashboard() {
    console.log('📊 Chargement du tableau de bord pour:', window.app.currentProfile);
    
    if (!window.app || !window.app.currentProfile) {
        console.error('❌ window.app ou currentProfile non défini');
        document.getElementById('mainContent').innerHTML = `
            <div class="text-center p-8">
                <div class="text-red-500 text-xl mb-4">⚠️ Erreur de chargement</div>
                <p>Données d'authentification manquantes. Veuillez vous reconnecter.</p>
            </div>
        `;
        return;
    }

    if (window.app.currentProfile === 'admin') {
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
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- KPI Cards Admin -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.companies.filter(c => c.status === 'Actif').length}</p>
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
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
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
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.entries.filter(e => e.status === 'En attente').length}</p>
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
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.entries.filter(e => e.status === 'Validé').length}</p>
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
                    <div class="h-64 flex items-center justify-center text-gray-500">
                        <div class="text-center">
                            <i class="fas fa-chart-line text-4xl mb-2"></i>
                            <p>Graphique Chart.js</p>
                            <p class="text-sm">(Nécessite la librairie Chart.js)</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance par Secteur</h3>
                    <div class="h-64 flex items-center justify-center text-gray-500">
                        <div class="text-center">
                            <i class="fas fa-chart-bar text-4xl mb-2"></i>
                            <p>Graphique Chart.js</p>
                            <p class="text-sm">(Nécessite la librairie Chart.js)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        console.log('✅ Tableau de bord admin chargé');
    }
}

function loadStandardDashboard() {
    const userCompany = window.app.companies.find(c => c.id == window.app.currentCompany);
    let cashCount = userCompany ? userCompany.cashRegisters : 1;
    let dashboardTitle = 'Tableau de Bord';

    if (window.app.currentProfile === 'user') {
        dashboardTitle = 'Mon Entreprise';
    } else if (window.app.currentProfile === 'caissier') {
        dashboardTitle = 'Ma Caisse';
        cashCount = '→';
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- Cartes KPI Standard -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ${window.app.currentProfile === 'user' ? 'Caisses disponibles' : 
                                  window.app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${cashCount}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas ${window.app.currentProfile === 'caissier' ? 'fa-plus-circle' : 
                                         window.app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>
                        </div>
                    </div>
                    ${window.app.currentProfile === 'caissier' ? `
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
                                ${window.app.currentProfile === 'caissier' ? '45' : window.app.entries.length}
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
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente de validation</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${window.app.entries.filter(e => e.status === 'En attente').length}
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
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performances</p>
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
                    <div class="h-64 flex items-center justify-center text-gray-500">
                        <div class="text-center">
                            <i class="fas fa-chart-line text-4xl mb-2"></i>
                            <p>Graphique Chart.js</p>
                            <p class="text-sm">(${window.app.entries.length} écritures ce mois)</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par Journal</h3>
                    <div class="h-64 flex items-center justify-center text-gray-500">
                        <div class="text-center">
                            <i class="fas fa-chart-pie text-4xl mb-2"></i>
                            <p>Graphique Chart.js</p>
                            <p class="text-sm">(JV: ${window.app.entries.filter(e => e.journal === 'JV').length}, JA: ${window.app.entries.filter(e => e.journal === 'JA').length})</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        console.log('✅ Dashboard standard chargé');
    }
}

function generateCollaboratorPortfolio() {
    const collaborators = window.app.users.filter(u => u.profile.includes('collaborateur'));
    
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

// Autres fonctions de page (simplifiées pour l'exemple)
function loadUsersManagement() {
    if (window.app.currentProfile !== 'admin') {
        showAccessDenied();
        return;
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
                <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>Nouveau Collaborateur
                </button>
            </div>

            <!-- Statistiques utilisateurs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${window.app.users.filter(u => u.profile.includes('collaborateur')).length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Collaborateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-info">${window.app.users.filter(u => u.profile === 'user').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${window.app.users.filter(u => u.profile === 'caissier').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Caissiers</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${window.app.users.filter(u => u.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Utilisateurs</h3>
                <div class="space-y-4">
                    ${window.app.users.map(user => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-4">
                                <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                    ${user.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">${user.name}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${user.email} • ${user.role}</div>
                                </div>
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
    console.log('✅ Page utilisateurs chargée');
}

function loadCompanies() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
                </h2>
                ${window.app.currentProfile === 'admin' ? `
                <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nouvelle Entreprise
                </button>
                ` : ''}
            </div>

            <!-- Statistiques entreprises -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${window.app.companies.length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total entreprises</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${window.app.companies.filter(c => c.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${window.app.companies.filter(c => c.status === 'Période d\'essai').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En essai</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-danger">${window.app.companies.filter(c => c.status === 'Suspendu').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Suspendues</div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des entreprises</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${window.app.companies.map(company => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">${company.type} • ${company.system}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">${company.phone}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">${company.address}</div>
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
    console.log('✅ Page entreprises chargée');
}

function loadEntries() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-book mr-2"></i>Journal SYSCOHADA
                    </div>
                    <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
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

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des écritures</h3>
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
                            ${window.app.entries.map(entry => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.libelle}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex space-x-2">
                                            <button class="text-primary hover:text-primary/80" title="Voir">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="text-info hover:text-info/80" title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="text-danger hover:text-danger/80" title="Supprimer">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page écritures chargée');
}

function loadAccounts() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-calculator mr-2"></i>${window.app.accounts.length} comptes
                    </div>
                    ${window.app.currentProfile !== 'caissier' ? `
                    <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouveau Compte
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Filtres -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Rechercher un compte..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Toutes les catégories</option>
                        <option value="Capitaux propres">Capitaux propres</option>
                        <option value="Immobilisations">Immobilisations</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Tiers">Tiers</option>
                        <option value="Financiers">Financiers</option>
                        <option value="Charges">Charges</option>
                        <option value="Produits">Produits</option>
                    </select>
                    <button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-sync mr-2"></i>Réinitialiser
                    </button>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes disponibles</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${window.app.accounts.map(account => `
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div class="font-mono text-sm text-primary font-semibold">${account.code}</div>
                            <div class="font-medium text-gray-900 dark:text-white text-sm mt-1">${account.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${account.category}</div>
                            ${window.app.currentProfile !== 'caissier' ? `
                            <div class="mt-2 flex space-x-2">
                                <button class="text-primary hover:text-primary/80 text-xs" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="text-danger hover:text-danger/80 text-xs" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page comptes chargée');
}

function loadCaisse() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Gestion des Caisses'}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-cash-register mr-2"></i>${window.app.cashRegisters.length} caisses
                    </div>
                    ${window.app.currentProfile !== 'caissier' ? `
                    <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle Caisse
                    </button>
                    ` : ''}
                </div>
            </div>

            ${window.app.currentProfile === 'caissier' ? `
            <!-- Interface Caissier -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-cash-register mr-2 text-primary"></i>État de ma Caisse
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                            <span class="text-success font-medium">Solde d'ouverture</span>
                            <span class="text-2xl font-bold text-success">150 000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">
                            <span class="text-info font-medium">Recettes du jour</span>
                            <span class="text-2xl font-bold text-info">+85 000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
                            <span class="text-warning font-medium">Dépenses du jour</span>
                            <span class="text-2xl font-bold text-warning">-25 000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">
                            <span class="text-primary font-medium">Solde actuel</span>
                            <span class="text-3xl font-bold text-primary">210 000 FCFA</span>
                        </div>
                    </div>
                    <div class="mt-6 grid grid-cols-2 gap-4">
                        <button onclick="navigateTo('entries')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus-circle mr-2"></i>Nouvelle opération
                        </button>
                        <button class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-print mr-2"></i>État de caisse
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-history mr-2 text-info"></i>Dernières opérations
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-down text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Vente comptant</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">14:30</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-success">+15,000 FCFA</div>
                                <div class="text-xs text-success">Validé</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-warning text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-up text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Achat fournitures</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">13:15</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-warning">-5 000 FCFA</div>
                                <div class="text-xs text-warning">En attente</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : `
            <!-- Interface Admin/Collaborateur -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Caisses</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom de la Caisse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsable</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${window.app.cashRegisters.map(cash => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${cash.name}</td>
                                    <td class="px-6 py-4 text-gray-900 dark:text-white">${cash.responsibleName}</td>
                                    <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${cash.balance.toLocaleString('fr-FR')} FCFA</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-sm rounded ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-primary hover:text-primary/80" title="Voir">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="text-info hover:text-info/80" title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="text-danger hover:text-danger/80" title="Supprimer">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `}
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page caisses chargée');
}

function loadReports() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports et États Financiers</h2>
                <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                    <i class="fas fa-building mr-2"></i>SYSCOHADA Révisé
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">États financiers disponibles</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                        <i class="fas fa-file-alt text-3xl text-primary mb-3"></i>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Journal Général</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Chronologique des écritures</p>
                        <button class="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                            Générer
                        </button>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                        <i class="fas fa-book text-3xl text-success mb-3"></i>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Grand Livre</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Par compte</p>
                        <button class="bg-success text-white px-4 py-2 rounded-lg text-sm hover:bg-success/90 transition-colors">
                            Générer
                        </button>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                        <i class="fas fa-balance-scale text-3xl text-info mb-3"></i>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Balance Générale</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Tous les comptes</p>
                        <button class="bg-info text-white px-4 py-2 rounded-lg text-sm hover:bg-info/90 transition-colors">
                            Générer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page rapports chargée');
}

function loadImport() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
                <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                    <i class="fas fa-upload mr-2"></i>Compatible SYSCOHADA
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-upload mr-2 text-primary"></i>Importer un fichier
                </h3>
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez votre fichier ici ou cliquez pour le sélectionner</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Formats pris en charge : Excel, CSV (max. 10 Mo)</p>
                    <button class="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        Sélectionner un fichier
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page import chargée');
}

function loadSettings() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center space-x-6 mb-6">
                    <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        ${window.app.currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${window.app.currentUser.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400">${window.app.currentUser.email}</p>
                        <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary">${window.app.currentUser.role}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
                        <input type="text" value="${window.app.currentUser.name}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                        <input type="email" value="${window.app.currentUser.email}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                </div>

                <div class="mt-6 flex justify-between">
                    <button class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-save mr-2"></i>Sauvegarder
                    </button>
                    <button class="bg-warning hover:bg-warning/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-key mr-2"></i>Changer le mot de passe
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page paramètres chargée');
}

function showAccessDenied() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ban text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
        </div>
    `;
}

// Fonctions utilitaires supplémentaires
function initializeMainApp() {
    try {
        console.log('🔄 Initialisation de l\'interface principale...');
        console.log('📊 État de window.app:', {
            currentUser: window.app?.currentUser,
            currentProfile: window.app?.currentProfile,
            currentCompany: window.app?.currentCompany,
            isAuthenticated: window.app?.isAuthenticated
        });

        // Vérifier que window.app est bien défini
        if (!window.app || !window.app.currentUser || !window.app.currentProfile) {
            console.error('❌ window.app non défini ou incomplet');
            app.uiManager.showNotification('error', 'Erreur: Données d\'authentification manquantes');
            return;
        }

        // Charger la navigation
        loadNavigationMenu();

        // Mettre à jour les informations utilisateur
        updateUserInfo();

        // Mettre à jour les sélecteurs d'abord
        app.uiManager.updateCompanySelector();
        app.uiManager.updateCompanyInfo();

        // Charger le tableau de bord avec un petit délai pour s'assurer que tout est prêt
        setTimeout(() => {
            console.log('🔄 Chargement du dashboard...');
            loadDashboard();
        }, 100);

        console.log('✅ Interface principale initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur initialisation interface:', error);
        app.uiManager.showNotification('error', 'Erreur lors de l\'initialisation: ' + error.message);
    }
}

function updateUserInfo() {
    if (!window.app?.currentUser) return;

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (userNameElement) userNameElement.textContent = window.app.currentUser.name;
    if (userRoleElement) userRoleElement.textContent = window.app.currentUser.role;
}

// Instance globale de l'application
let app;

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de DOUKÈ Compta Pro...');
    
    try {
        app = new DoukèComptaPro();
        app.initializeDefaultData();
        console.log('✅ Application initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

console.log('🔧 Fichier app.js chargé avec succès');
