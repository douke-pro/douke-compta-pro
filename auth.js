// =============================================================================
// 🔐 MODULE D'AUTHENTIFICATION - DOUKÈ Compta Pro v3.1
// =============================================================================

(function() {
    'use strict';
    
    console.log('🔐 Chargement du module d\'authentification...');

    // =============================================================================
    // CLASSE PRINCIPALE D'AUTHENTIFICATION
    // =============================================================================
    class AuthModule {
        constructor() {
            this.currentUser = null;
            this.securityManager = null;
            this.initialized = false;
            console.log('🔐 AuthModule créé');
        }

        // Initialisation du module
        initialize() {
            if (this.initialized) return;
            
            try {
                this.initializeData();
                this.initializeSecurity();
                this.setupLoginInterface();
                this.setupEventHandlers();
                this.initialized = true;
                
                console.log('✅ Module d\'authentification initialisé');
            } catch (error) {
                console.error('❌ Erreur initialisation auth:', error);
            }
        }

        // Initialisation des données utilisateur
        initializeData() {
            if (window.app.users.length === 0) {
                window.app.users = [
                    {
                        id: 1,
                        name: 'Admin Système',
                        email: 'admin@doukecompta.ci',
                        passwordHash: this.hashPassword('admin123'),
                        profile: 'admin',
                        role: 'Administrateur',
                        phone: '+225 07 00 00 00 00',
                        status: 'Actif',
                        assignedCompanies: [1, 2, 3, 4],
                        companies: [1, 2, 3, 4],
                        permissions: ['all'],
                        lastLogin: new Date(),
                        createdAt: new Date('2024-01-01')
                    },
                    {
                        id: 2,
                        name: 'Marie Kouassi',
                        email: 'marie.kouassi@cabinet.com',
                        passwordHash: this.hashPassword('marie123'),
                        profile: 'collaborateur_senior',
                        role: 'Collaborateur Senior',
                        phone: '+225 07 11 11 11 11',
                        status: 'Actif',
                        assignedCompanies: [1, 2, 3],
                        companies: [1, 2, 3],
                        managedCollaborators: [3],
                        permissions: ['read', 'write', 'validate'],
                        lastLogin: new Date(),
                        createdAt: new Date('2024-02-01')
                    },
                    {
                        id: 3,
                        name: 'Jean Diabaté',
                        email: 'jean.diabate@cabinet.com',
                        passwordHash: this.hashPassword('jean123'),
                        profile: 'collaborateur',
                        role: 'Collaborateur',
                        phone: '+225 07 22 22 22 22',
                        status: 'Actif',
                        assignedCompanies: [2, 4],
                        companies: [2, 4],
                        seniorCollaboratorId: 2,
                        permissions: ['read', 'write'],
                        lastLogin: new Date(),
                        createdAt: new Date('2024-03-01')
                    },
                    {
                        id: 4,
                        name: 'Amadou Traoré',
                        email: 'atraore@sarltech.ci',
                        passwordHash: this.hashPassword('user123'),
                        profile: 'user',
                        role: 'Utilisateur',
                        phone: '+225 07 33 33 33 33',
                        status: 'Actif',
                        companyId: 1,
                        assignedCompanies: [1],
                        companies: [1],
                        permissions: ['read'],
                        lastLogin: new Date(),
                        createdAt: new Date('2024-04-01')
                    },
                    {
                        id: 5,
                        name: 'Ibrahim Koné',
                        email: 'ikone@caisse.ci',
                        passwordHash: this.hashPassword('caisse123'),
                        profile: 'caissier',
                        role: 'Caissier',
                        phone: '+225 07 44 44 44 44',
                        status: 'Actif',
                        companyId: 2,
                        assignedCompanies: [2],
                        companies: [2],
                        permissions: ['cash_operations'],
                        lastLogin: new Date(),
                        createdAt: new Date('2024-05-01')
                    }
                ];
                
                console.log('✅ Données utilisateur initialisées:', window.app.users.length, 'utilisateurs');
            }

            // Initialiser les entreprises si nécessaire
            if (window.app.companies.length === 0) {
                window.app.companies = [
                    {
                        id: 1,
                        name: 'SARL TECH INNOVATION',
                        type: 'SARL',
                        status: 'Actif',
                        system: 'Normal',
                        phone: '+225 07 12 34 56 78',
                        email: 'contact@tech-innovation.ci',
                        address: 'Abidjan, Cocody, Riviera 3',
                        rccm: 'CI-ABJ-2020-B-12345',
                        nif: '0123456789',
                        cashRegisters: 3,
                        sector: 'Informatique',
                        currency: 'FCFA',
                        exerciceStart: '2024-01-01',
                        exerciceEnd: '2024-12-31',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        createdBy: 1
                    },
                    {
                        id: 2,
                        name: 'SA COMMERCE PLUS',
                        type: 'SA',
                        status: 'Actif',
                        system: 'Normal',
                        phone: '+225 05 98 76 54 32',
                        email: 'admin@commerce-plus.ci',
                        address: 'Abidjan, Plateau, Boulevard Clozel',
                        rccm: 'CI-ABJ-2019-B-67890',
                        nif: '9876543210',
                        cashRegisters: 5,
                        sector: 'Commerce',
                        currency: 'FCFA',
                        exerciceStart: '2024-01-01',
                        exerciceEnd: '2024-12-31',
                        createdAt: '2024-01-15T00:00:00.000Z',
                        createdBy: 1
                    },
                    {
                        id: 3,
                        name: 'EURL SERVICES PRO',
                        type: 'EURL',
                        status: 'Période d\'essai',
                        system: 'Minimal',
                        phone: '+225 01 23 45 67 89',
                        email: 'info@services-pro.ci',
                        address: 'Bouaké Centre, Quartier Air France',
                        rccm: 'CI-BKE-2021-B-11111',
                        nif: '1111111111',
                        cashRegisters: 2,
                        sector: 'Services',
                        currency: 'FCFA',
                        exerciceStart: '2024-01-01',
                        exerciceEnd: '2024-12-31',
                        createdAt: '2024-02-01T00:00:00.000Z',
                        createdBy: 1
                    },
                    {
                        id: 4,
                        name: 'SAS DIGITAL WORLD',
                        type: 'SAS',
                        status: 'Suspendu',
                        system: 'Normal',
                        phone: '+225 07 11 22 33 44',
                        email: 'contact@digital-world.ci',
                        address: 'San-Pédro, Zone Industrielle',
                        rccm: 'CI-SPE-2022-B-22222',
                        nif: '2222222222',
                        cashRegisters: 1,
                        sector: 'Digital',
                        currency: 'FCFA',
                        exerciceStart: '2024-01-01',
                        exerciceEnd: '2024-12-31',
                        createdAt: '2024-03-01T00:00:00.000Z',
                        createdBy: 1
                    }
                ];
                
                console.log('✅ Données entreprises initialisées:', window.app.companies.length, 'entreprises');
            }
        }

        // Initialisation du gestionnaire de sécurité
        initializeSecurity() {
            this.securityManager = new SecurityManager();
            console.log('✅ Gestionnaire de sécurité initialisé');
        }

        // Configuration de l'interface de connexion
        setupLoginInterface() {
            const loginInterface = document.getElementById('loginInterface');
            if (!loginInterface) return;

            loginInterface.innerHTML = `
                <div class="max-w-md w-full mx-4">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                        <!-- Logo et titre -->
                        <div class="text-center mb-8">
                            <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i class="fas fa-calculator text-3xl"></i>
                            </div>
                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Système Comptable SYSCOHADA Intégré</p>
                            <div class="flex items-center justify-center mt-2 text-xs">
                                <span class="px-2 py-1 bg-success/20 text-success rounded-full mr-2">v3.1</span>
                                <span class="text-gray-500">Hiérarchie Admin→Senior→Collaborateur→User→Caissier</span>
                            </div>
                        </div>

                        <!-- Formulaire de connexion -->
                        <form id="loginForm" class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <i class="fas fa-envelope mr-2"></i>Email
                                </label>
                                <input type="email" id="loginEmail" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-colors">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <i class="fas fa-lock mr-2"></i>Mot de passe
                                </label>
                                <div class="relative">
                                    <input type="password" id="loginPassword" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent pr-10">
                                    <button type="button" onclick="window.moduleCommunicator.safeCall('auth', 'togglePassword')" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <i id="passwordToggleIcon" class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" id="loginButton" class="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors transform hover:scale-105">
                                <i class="fas fa-sign-in-alt mr-2"></i>Connexion Sécurisée
                            </button>
                        </form>

                        <!-- Comptes de démonstration -->
                        <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Comptes hiérarchiques de démonstration :</h3>
                            <div class="space-y-2 text-xs">
                                <button onclick="window.moduleCommunicator.safeCall('auth', 'fillCredentials', 'admin')" class="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors border-l-4 border-danger">
                                    <strong class="text-danger">👑 Admin :</strong> admin@doukecompta.ci / admin123
                                    <div class="text-gray-500">Accès total • Gestion utilisateurs • Toutes entreprises</div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('auth', 'fillCredentials', 'collaborateur_senior')" class="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors border-l-4 border-primary">
                                    <strong class="text-primary">⭐ Collaborateur Senior :</strong> marie.kouassi@cabinet.com / marie123
                                    <div class="text-gray-500">Multi-entreprises • Gestion équipe • Validation</div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('auth', 'fillCredentials', 'collaborateur')" class="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors border-l-4 border-info">
                                    <strong class="text-info">👥 Collaborateur :</strong> jean.diabate@cabinet.com / jean123
                                    <div class="text-gray-500">Entreprises assignées • Validation • Rapports</div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('auth', 'fillCredentials', 'user')" class="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors border-l-4 border-success">
                                    <strong class="text-success">🏢 Utilisateur :</strong> atraore@sarltech.ci / user123
                                    <div class="text-gray-500">Une entreprise • Gestion complète • Caisses</div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('auth', 'fillCredentials', 'caissier')" class="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors border-l-4 border-warning">
                                    <strong class="text-warning">💰 Caissier :</strong> ikone@caisse.ci / caisse123
                                    <div class="text-gray-500">Caisse uniquement • Opérations • Validation requise</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            console.log('✅ Interface de connexion configurée');
        }

        // Configuration des gestionnaires d'événements
        setupEventHandlers() {
            // Gestion du formulaire de connexion
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }
            
            console.log('✅ Gestionnaires d\'événements configurés');
        }

        // =============================================================================
        // MÉTHODES D'AUTHENTIFICATION
        // =============================================================================

        // Hachage de mot de passe
        hashPassword(password) {
            return btoa(password + 'DOUKE_SALT_2024');
        }

        // Vérification de mot de passe
        verifyPassword(password, storedHash) {
            return this.hashPassword(password) === storedHash;
        }

        // Pré-remplissage des identifiants
        fillCredentials(profile) {
            const credentials = {
                'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
                'collaborateur_senior': { email: 'marie.kouassi@cabinet.com', password: 'marie123' },
                'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'jean123' },
                'user': { email: 'atraore@sarltech.ci', password: 'user123' },
                'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
            };

            const cred = credentials[profile];
            if (cred) {
                document.getElementById('loginEmail').value = cred.email;
                document.getElementById('loginPassword').value = cred.password;
                
                if (window.app.modules.core && window.app.modules.core.notificationManager) {
                    window.app.modules.core.notificationManager.show('info', 'Identifiants pré-remplis', `Profil ${profile} sélectionné`);
                }
            }
        }

        // Toggle affichage mot de passe
        togglePassword() {
            const passwordInput = document.getElementById('loginPassword');
            const toggleIcon = document.getElementById('passwordToggleIcon');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                toggleIcon.className = 'fas fa-eye';
            }
        }

        // Gestion de la connexion
        async handleLogin() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const loginButton = document.getElementById('loginButton');

            if (!email || !password) {
                if (window.app.modules.core && window.app.modules.core.notificationManager) {
                    window.app.modules.core.notificationManager.show('error', 'Erreur', 'Veuillez saisir votre email et mot de passe.');
                } else {
                    alert('Veuillez saisir votre email et mot de passe.');
                }
                return;
            }

            // Désactiver le bouton et montrer le loading
            loginButton.disabled = true;
            loginButton.innerHTML = '<div class="loading-spinner mr-2"></div>Connexion...';

            try {
                const result = await this.authenticateUser(email, password);

                if (result.success) {
                    this.showMainApp();
                    if (window.app.modules.core && window.app.modules.core.notificationManager) {
                        window.app.modules.core.notificationManager.show('success', 'Connexion réussie', `Bienvenue ${result.user.name} !`);
                    }
                } else {
                    if (window.app.modules.core && window.app.modules.core.notificationManager) {
                        window.app.modules.core.notificationManager.show('error', 'Erreur de connexion', result.message);
                    } else {
                        alert(result.message);
                    }
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                if (window.app.modules.core && window.app.modules.core.notificationManager) {
                    window.app.modules.core.notificationManager.show('error', 'Erreur', 'Erreur de connexion inattendue');
                } else {
                    alert('Erreur de connexion inattendue');
                }
            }

            // Réactiver le bouton
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Connexion Sécurisée';
        }

        // Authentification de l'utilisateur
        async authenticateUser(email, password) {
            console.log('🔐 Tentative d\'authentification pour:', email);
            
            const user = window.app.users.find(u => u.email === email);
            
            if (!user) {
                console.log('❌ Utilisateur non trouvé pour email:', email);
                return {
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                };
            }
            
            console.log('🔍 Utilisateur trouvé:', user.name, 'Profil:', user.profile);

            if (!this.verifyPassword(password, user.passwordHash)) {
                console.log('❌ Mot de passe incorrect');
                return {
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                };
            }

            if (user.status !== 'Actif') {
                return {
                    success: false,
                    message: 'Compte utilisateur désactivé'
                };
            }

            // Définir l'utilisateur courant
            window.app.currentUser = user;
            window.app.currentProfile = user.profile;
            this.currentUser = user;

            // Mettre à jour la dernière connexion
            user.lastLogin = new Date().toISOString();

            // Pour les utilisateurs avec une seule entreprise, la sélectionner automatiquement
            if (user.profile === 'user' || user.profile === 'caissier') {
                if (user.companyId) {
                    window.app.currentCompanyId = user.companyId;
                }
            }

            console.log(`✅ Connexion réussie: ${user.name} (${user.profile})`);

            return {
                success: true,
                user: user,
                dashboard: this.securityManager.getDashboardForProfile(user.profile),
                requiresCompanySelection: this.securityManager.requiresCompanySelection(user.profile) && !window.app.currentCompanyId
            };
        }

        // Affichage de l'application principale
        showMainApp() {
            document.getElementById('loginInterface').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            this.initializeMainApp();
        }

        // Affichage de l'interface de connexion
        showLoginInterface() {
            document.getElementById('loginInterface').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('modalContainer').innerHTML = '';
        }

        // Initialisation de l'application principale
        initializeMainApp() {
            this.generateSidebar();
            this.generateHeader();
            this.updateUserInfo();
            this.loadDashboard();
            this.populateCompanySelector();
        }

        // Génération de la sidebar
        generateSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar) return;

            const user = window.app.currentUser;
            if (!user) return;

            sidebar.innerHTML = `
                <div class="flex flex-col h-full">
                    
                    <!-- Header -->
                    <div class="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 bg-primary">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-white text-primary rounded-lg flex items-center justify-center font-bold">
                                <i class="fas fa-calculator"></i>
                            </div>
                            <span class="text-white font-bold text-lg">DOUKÈ Compta Pro</span>
                        </div>
                    </div>

                    <!-- Profil utilisateur -->
                    <div class="p-4 bg-primary/10">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
                                <span id="userInitials">${user.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900 dark:text-white" id="sidebarUserName">${user.name}</div>
                                <div class="text-sm text-primary font-medium" id="sidebarUserRole">${user.role}</div>
                                <div class="text-xs text-gray-500" id="sidebarUserHierarchy">Niveau ${this.securityManager.profileHierarchy[user.profile]}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Sélecteur d'entreprise -->
                    <div id="companySelector" class="p-4 border-b border-gray-200 dark:border-gray-700">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-building mr-2"></i>Entreprise Active
                        </label>
                        <select id="activeCompanySelect" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">-- Sélectionner une entreprise --</option>
                        </select>
                        <div class="mt-2">
                            <span id="selectedCompanyInfo" class="text-xs text-primary-light font-medium"></span>
                        </div>
                        <div id="accessIndicator" class="mt-1 text-xs text-gray-500"></div>
                    </div>

                    <!-- Navigation -->
                    <nav id="navigationMenu" class="flex-1 overflow-y-auto py-4">
                        ${this.generateNavigationMenu()}
                    </nav>

                    <!-- Indicateur de synchronisation -->
                    <div id="syncStatus" class="p-3 border-t border-gray-200 dark:border-gray-700 bg-info/5">
                        <div class="flex items-center space-x-2 text-xs">
                            <i class="fas fa-sync-alt text-info"></i>
                            <span class="text-info">Sync PIWA</span>
                            <span id="syncIndicator" class="ml-auto px-2 py-1 bg-success/20 text-success rounded">●</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Génération du menu de navigation
        generateNavigationMenu() {
            const profile = window.app.currentProfile;
            const menus = {
                admin: [
                    { id: 'dashboard', icon: 'fas fa-crown', text: 'Dashboard Admin', handler: 'loadDashboard' },
                    { id: 'users', icon: 'fas fa-users', text: 'Gestion Collaborateurs', handler: 'loadUsersPage' },
                    { id: 'companies', icon: 'fas fa-building', text: 'Gestion Entreprises', handler: 'loadCompaniesPage' },
                    { id: 'entries', icon: 'fas fa-edit', text: 'Écritures', handler: 'loadEntriesPage' },
                    { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports SYSCOHADA', handler: 'loadReportsPage' }
                ],
                collaborateur_senior: [
                    { id: 'dashboard', icon: 'fas fa-star', text: 'Dashboard Senior', handler: 'loadDashboard' },
                    { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises', handler: 'loadCompaniesPage' },
                    { id: 'entries', icon: 'fas fa-edit', text: 'Écritures', handler: 'loadEntriesPage' },
                    { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports SYSCOHADA', handler: 'loadReportsPage' }
                ],
                collaborateur: [
                    { id: 'dashboard', icon: 'fas fa-users', text: 'Dashboard', handler: 'loadDashboard' },
                    { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises', handler: 'loadCompaniesPage' },
                    { id: 'entries', icon: 'fas fa-edit', text: 'Écritures', handler: 'loadEntriesPage' },
                    { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports SYSCOHADA', handler: 'loadReportsPage' }
                ],
                user: [
                    { id: 'dashboard', icon: 'fas fa-user', text: 'Mon Entreprise', handler: 'loadDashboard' },
                    { id: 'entries', icon: 'fas fa-edit', text: 'Mes Écritures', handler: 'loadEntriesPage' },
                    { id: 'reports', icon: 'fas fa-chart-bar', text: 'États SYSCOHADA', handler: 'loadReportsPage' }
                ],
                caissier: [
                    { id: 'dashboard', icon: 'fas fa-cash-register', text: 'Ma Caisse', handler: 'loadDashboard' },
                    { id: 'operations', icon: 'fas fa-edit', text: 'Opérations', handler: 'loadEntriesPage' },
                    { id: 'reports', icon: 'fas fa-chart-bar', text: 'État Caisse', handler: 'loadCashierReports' }
                ]
            };

            const menuItems = menus[profile] || menus.user;
            
            return menuItems.map((item, index) => {
                const isFirst = index === 0;
                return `
                    <a href="#" onclick="window.moduleCommunicator.safeCall('auth', '${item.handler}'); window.moduleCommunicator.safeCall('auth', 'setActiveMenuItem', this); return false;" 
                       class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${isFirst ? 'bg-primary text-white' : ''}">
                        <i class="${item.icon} w-5 h-5 mr-3"></i>
                        <span>${item.text}</span>
                    </a>
                `;
            }).join('');
        }

        // Génération du header
        generateHeader() {
            const header = document.querySelector('header');
            if (!header) return;

            const user = window.app.currentUser;
            if (!user) return;

            header.innerHTML = `
                <div class="flex items-center justify-between px-6 py-4">
                    <div class="flex items-center space-x-4">
                        <button id="sidebarToggle" class="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                        <div>
                            <h1 class="text-xl font-semibold text-gray-900 dark:text-white" id="currentUserName">${user.name}</h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400" id="currentCompanyName">${this.getSelectedCompanyName()}</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-4">
                        <!-- Indicateur de niveau de sécurité -->
                        <div id="securityLevel" class="flex items-center space-x-2 px-3 py-1 rounded-lg ${this.getSecurityLevelClass()}">
                            <i class="fas ${this.getSecurityLevelIcon()} text-sm"></i>
                            <span class="text-xs font-medium" id="securityLevelText">Niveau ${this.securityManager.profileHierarchy[user.profile]} - ${user.role}</span>
                        </div>

                        <!-- Theme Switcher -->
                        <div class="relative">
                            <button onclick="toggleThemeMenu()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Changer de thème">
                                <i class="fas fa-palette text-xl"></i>
                            </button>
                            <div id="themeMenu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                <div class="py-2">
                                    <button onclick="setTheme('light')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <i class="fas fa-sun mr-2"></i>Thème clair
                                    </button>
                                    <button onclick="setTheme('dark')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <i class="fas fa-moon mr-2"></i>Thème sombre
                                    </button>
                                    <button onclick="setTheme('system')" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <i class="fas fa-desktop mr-2"></i>Système
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onclick="window.moduleCommunicator.safeCall('auth', 'logout')" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" title="Déconnexion sécurisée">
                            <i class="fas fa-sign-out-alt text-xl"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // =============================================================================
        // MÉTHODES UTILITAIRES
        // =============================================================================

        // Mise à jour des informations utilisateur
        updateUserInfo() {
            const user = window.app.currentUser;
            if (!user) return;

            const elements = {
                'currentUserName': user.name,
                'currentCompanyName': this.getSelectedCompanyName(),
                'sidebarUserName': user.name,
                'sidebarUserRole': user.role,
                'userInitials': user.name.split(' ').map(n => n[0]).join('')
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
        }

        // Obtenir le nom de l'entreprise sélectionnée
        getSelectedCompanyName() {
            if (!window.app.currentCompanyId) return 'Aucune entreprise';
            const company = window.app.companies.find(c => c.id === window.app.currentCompanyId);
            return company ? company.name : 'Entreprise inconnue';
        }

        // Obtenir la classe CSS pour le niveau de sécurité
        getSecurityLevelClass() {
            const classes = {
                'admin': 'bg-danger/10 text-danger',
                'collaborateur_senior': 'bg-primary/10 text-primary',
                'collaborateur': 'bg-info/10 text-info',
                'user': 'bg-success/10 text-success',
                'caissier': 'bg-warning/10 text-warning'
            };
            return classes[window.app.currentProfile] || classes['user'];
        }

        // Obtenir l'icône pour le niveau de sécurité
        getSecurityLevelIcon() {
            const icons = {
                'admin': 'fa-crown',
                'collaborateur_senior': 'fa-star',
                'collaborateur': 'fa-users',
                'user': 'fa-user',
                'caissier': 'fa-cash-register'
            };
            return icons[window.app.currentProfile] || icons['user'];
        }

        // Population du sélecteur d'entreprise
        populateCompanySelector() {
            const select = document.getElementById('activeCompanySelect');
            if (!select || !window.app.currentUser) return;

            select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

            const accessible = this.securityManager.getAccessibleCompanies(window.app.currentUser.id);
            accessible.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = company.name;
                if (company.id == window.app.currentCompanyId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            // Gestionnaire de changement
            select.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.selectCompany(parseInt(e.target.value));
                }
            });
        }

        // Sélection d'une entreprise
        selectCompany(companyId) {
            if (!this.securityManager.hasAccessToCompany(window.app.currentUser.id, companyId)) {
                if (window.app.modules.core && window.app.modules.core.notificationManager) {
                    window.app.modules.core.notificationManager.show('error', 'Accès refusé', 'Vous n\'avez pas accès à cette entreprise');
                }
                return false;
            }

            window.app.currentCompanyId = companyId;
            this.updateUserInfo();
            
            if (window.app.modules.core && window.app.modules.core.notificationManager) {
                window.app.modules.core.notificationManager.show('success', 'Entreprise sélectionnée', 
                    `Vous travaillez maintenant sur ${this.getSelectedCompanyName()}`);
            }

            // Recharger le dashboard
            this.loadDashboard();
            return true;
        }

        // Définir l'élément de menu actif
        setActiveMenuItem(element) {
            const menuItems = document.querySelectorAll('#navigationMenu a');
            menuItems.forEach(item => {
                item.classList.remove('bg-primary', 'text-white');
                item.classList.add('text-gray-700', 'dark:text-gray-300');
            });
            
            if (element) {
                element.classList.add('bg-primary', 'text-white');
                element.classList.remove('text-gray-700', 'dark:text-gray-300');
            }
        }

        // Chargement du dashboard
        loadDashboard() {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            const user = window.app.currentUser;
            if (!user) return;

            mainContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Dashboard ${user.role}
                        </h2>
                        <div class="flex items-center space-x-2 text-sm font-medium ${this.getSecurityLevelClass()} px-3 py-1 rounded-lg">
                            <i class="fas ${this.getSecurityLevelIcon()}"></i>
                            <span>${user.role}</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <i class="fas fa-chart-line text-4xl text-primary mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Bienvenue ${user.name}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-400">
                            Dashboard personnalisé pour votre profil ${user.role}
                        </p>
                        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-primary/10 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-primary">${window.app.users.length}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
                            </div>
                            <div class="bg-success/10 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-success">${window.app.companies.length}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Entreprises</div>
                            </div>
                            <div class="bg-info/10 p-4 rounded-lg">
                                <div class="text-2xl font-bold text-info">${window.app.entries.length}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Écritures</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Chargement des pages (à implémenter selon les besoins)
        loadUsersPage() {
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-users text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Gestion des Utilisateurs</h3>
                    <p class="text-gray-600 dark:text-gray-400">Module en cours de développement</p>
                </div>
            `;
        }

        loadCompaniesPage() {
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-building text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Gestion des Entreprises</h3>
                    <p class="text-gray-600 dark:text-gray-400">Module en cours de développement</p>
                </div>
            `;
        }

        loadEntriesPage() {
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-edit text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Gestion des Écritures</h3>
                    <p class="text-gray-600 dark:text-gray-400">Module en cours de développement</p>
                </div>
            `;
        }

        loadReportsPage() {
            // Déléguer au module des états financiers
            window.moduleCommunicator.emit('loadReports', {
                companyId: window.app.currentCompanyId,
                userId: window.app.currentUser.id
            });
        }

        loadCashierReports() {
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-cash-register text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">États de Caisse</h3>
                    <p class="text-gray-600 dark:text-gray-400">Module en cours de développement</p>
                </div>
            `;
        }

        // Déconnexion
        logout() {
            window.app.currentUser = null;
            window.app.currentProfile = null;
            window.app.currentCompanyId = null;
            this.currentUser = null;
            this.showLoginInterface();
            
            if (window.app.modules.core && window.app.modules.core.notificationManager) {
                window.app.modules.core.notificationManager.show('info', 'Déconnexion', 'Déconnexion sécurisée effectuée. À bientôt !');
            }
        }
    }

    // =============================================================================
    // CLASSE DE GESTION DE SÉCURITÉ
    // =============================================================================
    class SecurityManager {
        constructor() {
            this.profileHierarchy = {
                'admin': 5,
                'collaborateur_senior': 4,
                'collaborateur': 3,
                'user': 2,
                'caissier': 1
            };

            this.permissions = {
                'admin': {
                    canManageUsers: true,
                    canManageCompanies: true,
                    canAccessAllCompanies: true,
                    canAssignCompanies: true,
                    canValidateOperations: true,
                    canCreateReports: true,
                    requiresCompanySelection: true
                },
                'collaborateur_senior': {
                    canManageUsers: ['collaborateur', 'user', 'caissier'],
                    canManageCompanies: true,
                    canAccessAllCompanies: false,
                    canAssignCompanies: ['collaborateur'],
                    canValidateOperations: true,
                    canCreateReports: true,
                    requiresCompanySelection: true
                },
                'collaborateur': {
                    canManageUsers: ['user', 'caissier'],
                    canManageCompanies: false,
                    canAccessAllCompanies: false,
                    canAssignCompanies: false,
                    canValidateOperations: true,
                    canCreateReports: true,
                    requiresCompanySelection: true
                },
                'user': {
                    canManageUsers: false,
                    canManageCompanies: false,
                    canAccessAllCompanies: false,
                    canAssignCompanies: false,
                    canValidateOperations: true,
                    canCreateReports: true,
                    requiresCompanySelection: false,
                    singleCompanyAccess: true
                },
                'caissier': {
                    canManageUsers: false,
                    canManageCompanies: false,
                    canAccessAllCompanies: false,
                    canAssignCompanies: false,
                    canValidateOperations: false,
                    canCreateReports: false,
                    requiresCompanySelection: false,
                    singleCompanyAccess: true
                }
            };
        }

        hasAccessToCompany(userId, companyId) {
            const user = this.getCurrentUser(userId);
            if (!user || !companyId) return false;

            const profile = user.profile;

            // Admin accède à tout
            if (profile === 'admin') return true;

            // User/caissier : seulement leur entreprise
            if (profile === 'user' || profile === 'caissier') {
                return user.companyId === companyId;
            }

            // Collaborateurs : entreprises assignées
            if (profile === 'collaborateur_senior' || profile === 'collaborateur') {
                return user.assignedCompanies && user.assignedCompanies.includes(companyId);
            }

            return false;
        }

        requiresCompanySelection(profile) {
            const permissions = this.permissions[profile];
            return permissions ? permissions.requiresCompanySelection : false;
        }

        getAccessibleCompanies(userId) {
            const user = this.getCurrentUser(userId);
            if (!user) return [];

            if (user.profile === 'admin') {
                return window.app.companies || [];
            }

            if (user.profile === 'user' || user.profile === 'caissier') {
                return window.app.companies.filter(c => c.id === user.companyId);
            }

            if (user.profile === 'collaborateur_senior' || user.profile === 'collaborateur') {
                return window.app.companies.filter(c =>
                    user.assignedCompanies && user.assignedCompanies.includes(c.id)
                );
            }

            return [];
        }

        getCurrentUser(userId) {
            if (!userId && window.app && window.app.currentUser) {
                return window.app.currentUser;
            }
            if (!window.app || !window.app.users) return null;
            return window.app.users.find(u => u.id === userId);
        }

        getDashboardForProfile(profile) {
            const dashboards = {
                'admin': 'admin-dashboard',
                'collaborateur_senior': 'senior-dashboard',
                'collaborateur': 'collaborator-dashboard',
                'user': 'user-dashboard',
                'caissier': 'cashier-dashboard'
            };
            return dashboards[profile] || 'user-dashboard';
        }
    }

    // =============================================================================
    // INITIALISATION ET ENREGISTREMENT DU MODULE
    // =============================================================================
    
    // Créer et enregistrer le module d'authentification
    const authModule = new AuthModule();
    
    // Enregistrer le module dans le communicateur
    window.moduleCommunicator.registerModule('auth', authModule);
    
    // Enregistrer dans l'état global
    window.app.modules.auth = authModule;
    
    console.log('✅ Module d\'authentification chargé et enregistré');

})();
