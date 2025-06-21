// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Interface & Authentification)
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

        this.syncWithGlobalApp();
        console.log('✅ Données initialisées :', {
            companies: this.state.companies.length,
            users: this.state.users.length
        });
    }

    syncWithGlobalApp() {
        window.app = {
            currentUser: this.state.currentUser,
            currentProfile: this.state.currentProfile,
            currentCompany: this.state.currentCompany,
            isAuthenticated: this.state.isAuthenticated,
            companies: this.state.companies,
            users: this.state.users
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
// FONCTION DE CONNEXION
// =============================================================================

async function handleLogin() {
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            app.uiManager.showNotification('error', 'Veuillez saisir email et mot de passe');
            return;
        }

        console.log('🔄 Tentative de connexion pour:', email);

        const result = await app.authenticate(email, password);

        if (result.success) {
            console.log('✅ Connexion réussie');
            
            // Masquer la page de connexion
            document.getElementById('loginPage').style.display = 'none';
            
            // Afficher l'interface principale
            document.getElementById('mainApp').style.display = 'block';
            
            // Initialiser l'interface principale
            initializeMainApp();
            
            app.uiManager.showNotification('success', `Bienvenue ${result.user.name} !`);
        }

    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        app.uiManager.showNotification('error', error.message);
    }
}

// =============================================================================
// FONCTIONS DE NAVIGATION ET INTERFACE
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
        <a href="#" onclick="AppRouter.navigateTo('${item.id}'); return false;" 
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

// =============================================================================
// ROUTEUR PRINCIPAL (évite les conflits de noms)
// =============================================================================

const AppRouter = {
    navigateTo(page) {
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

        // Router vers la bonne fonction de chargement
        try {
            switch(page) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'users':
                    // Rediriger vers le gestionnaire de sécurité
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadUsersPage();
                    }
                    break;
                case 'companies':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadCompaniesPage();
                    }
                    break;
                case 'entries':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadEntriesPage();
                    }
                    break;
                case 'accounts':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadAccountsPage();
                    }
                    break;
                case 'caisse':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadCaissePage();
                    }
                    break;
                case 'reports':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadReportsPage();
                    }
                    break;
                case 'import':
                    if (window.SecureDataManager) {
                        window.SecureDataManager.loadImportPage();
                    }
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
                default:
                    console.log('⚠️ Page inconnue, chargement du tableau de bord');
                    this.loadDashboard();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la page :', error);
            alert('Erreur lors du chargement de la page : ' + page + '\nDétails : ' + error.message);
        }
    },

    loadDashboard() {
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
            this.loadAdminDashboard();
        } else {
            this.loadStandardDashboard();
        }
    },

    loadAdminDashboard() {
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
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entreprises</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.companies.length}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-chart-line text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs Actifs</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.users.filter(u => u.status === 'Actif').length}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-users text-success text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sélecteur d'entreprise pour Admin -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-building mr-2 text-primary"></i>Sélection d'entreprise
                    </h3>
                    <div class="flex items-center space-x-4">
                        <select id="activeCompanySelect" onchange="AppRouter.changeCompany(this.value)" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">-- Sélectionner une entreprise --</option>
                            ${window.app.companies.map(company => `
                                <option value="${company.id}" ${company.id === window.app.currentCompany ? 'selected' : ''}>
                                    ${company.name} (${company.status})
                                </option>
                            `).join('')}
                        </select>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            <i class="fas fa-info-circle mr-1"></i>
                            Sélectionnez une entreprise pour accéder à ses données
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-chart-bar mr-2 text-primary"></i>Vue d'ensemble du système
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center p-4 bg-primary/10 rounded-lg">
                            <div class="text-2xl font-bold text-primary">${window.app.companies.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Entreprises gérées</div>
                        </div>
                        <div class="text-center p-4 bg-success/10 rounded-lg">
                            <div class="text-2xl font-bold text-success">${window.app.users.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs actifs</div>
                        </div>
                        <div class="text-center p-4 bg-info/10 rounded-lg">
                            <div class="text-2xl font-bold text-info">98%</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Performance globale</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Tableau de bord admin chargé');
    },

    loadStandardDashboard() {
        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${window.app.currentProfile === 'user' ? 'Mon Entreprise' : 
                          window.app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Tableau de Bord'}
                    </h2>
                    <div class="text-sm text-primary-light font-medium">
                        <i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mon entreprise</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">${app.getCompanyName()}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-building text-primary text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</p>
                                <p class="text-xl font-bold text-success">Actif</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-check text-success text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mon rôle</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">${window.app.currentUser.role}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-user text-info text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Accès</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">Standard</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-key text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accès rapide</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="AppRouter.navigateTo('entries')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-edit text-primary text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Mes Écritures</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Gérer les opérations</div>
                                </div>
                            </div>
                        </button>
                        <button onclick="AppRouter.navigateTo('accounts')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-list text-success text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Plan Comptable</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Consulter les comptes</div>
                                </div>
                            </div>
                        </button>
                        <button onclick="AppRouter.navigateTo('reports')" class="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-chart-bar text-info text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Rapports</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">États financiers</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Dashboard standard chargé');
    },

    loadSettings() {
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
                        <button onclick="logout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page paramètres chargée');
    },

    changeCompany(companyId) {
        if (!companyId) {
            window.app.currentCompany = null;
            app.state.currentCompany = null;
        } else {
            window.app.currentCompany = parseInt(companyId);
            app.state.currentCompany = parseInt(companyId);
        }
        
        console.log('🏢 Entreprise sélectionnée:', companyId);
        
        // Rafraîchir l'affichage
        const currentPage = this.getCurrentPage();
        if (currentPage) {
            this.navigateTo(currentPage);
        }
    },

    getCurrentPage() {
        const activeMenuItem = document.querySelector('#navigationMenu a.bg-primary');
        if (activeMenuItem) {
            const onclick = activeMenuItem.getAttribute('onclick');
            const match = onclick.match(/AppRouter\.navigateTo\('(.+?)'\)/);
            return match ? match[1] : 'dashboard';
        }
        return 'dashboard';
    }
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function logout() {
    app.state.isAuthenticated = false;
    app.state.currentUser = null;
    app.state.currentProfile = null;
    app.state.currentCompany = null;
    
    window.app = null;
    
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    console.log('👋 Déconnexion réussie');
}

function initializeMainApp() {
    try {
        console.log('🔄 Initialisation de l\'interface principale...');

        if (!window.app || !window.app.currentUser || !window.app.currentProfile) {
            console.error('❌ window.app non défini ou incomplet');
            app.uiManager.showNotification('error', 'Erreur: Données d\'authentification manquantes');
            return;
        }

        loadNavigationMenu();
        updateUserInfo();
        app.uiManager.updateCompanySelector();
        app.uiManager.updateCompanyInfo();

        setTimeout(() => {
            AppRouter.loadDashboard();
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

function fillCredentials(profile) {
    const credentials = {
        admin: { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
        collaborateur: { email: 'jean.diabate@cabinet.com', password: 'collab123' },
        user: { email: 'atraore@sarltech.ci', password: 'user123' },
        caissier: { email: 'ikone@caisse.ci', password: 'caisse123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
        console.log('✅ Identifiants pré-remplis pour le profil:', profile);
    }
}

// Instance globale de l'application
let app;

// Initialisation automatique au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de DOUKÈ Compta Pro...');
    
    try {
        app = new DoukèComptaPro();
        app.initializeDefaultData();
        console.log('✅ Application principale initialisée avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

console.log('🔧 Fichier app.js principal chargé avec succès');
