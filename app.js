<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Système de Gestion Comptable SYSCOHADA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            DEFAULT: '#5D5CDE',
                            light: '#8B8AE8',
                            dark: '#4A49C4'
                        },
                        success: '#10B981',
                        warning: '#F59E0B',
                        danger: '#EF4444',
                        info: '#3B82F6'
                    }
                }
            }
        }
    </script>
</head>

<body class="h-full bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
<div id="loginInterface" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-white to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i class="fas fa-calculator text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Système SYSCOHADA Révisé</p>
        </div>

        <form id="loginForm" class="space-y-6">
            <div>
                <label for="loginEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input type="email" id="loginEmail" required
                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <div>
                <label for="loginPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
                <input type="password" id="loginPassword" required
                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
            </div>

            <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 shadow-md">
                <i class="fas fa-sign-in-alt mr-2"></i>Se connecter
            </button>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">Comptes de démonstration :</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
                <button onclick="loginAs('admin')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                    <i class="fas fa-user-shield"></i> Admin
                </button>
                <button onclick="loginAs('collaborateur-senior')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                    <i class="fas fa-user-tie"></i> Senior
                </button>
                <button onclick="loginAs('collaborateur')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                    <i class="fas fa-user"></i> Collaborateur
                </button>
                <button onclick="loginAs('user')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors">
                    <i class="fas fa-user-circle"></i> Utilisateur
                </button>
                <button onclick="loginAs('caissier')" class="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded transition-colors col-span-2">
                    <i class="fas fa-cash-register"></i> Caissier
                </button>
            </div>
        </div>
    </div>
</div>

<div id="mainApp" class="hidden min-h-screen bg-gray-100 dark:bg-gray-900">
    <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <button id="sidebarToggle" class="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                    <div class="flex items-center space-x-3 ml-4 lg:ml-0">
                        <div class="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
                            <i class="fas fa-calculator text-sm"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                            <p class="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">SYSCOHADA Révisé</p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <div id="companySelector" class="hidden lg:block">
                        <select id="activeCompanySelect" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                            <option value="">-- Sélectionner une entreprise --</option>
                        </select>
                        <div id="selectedCompanyInfo" class="text-xs text-gray-500 dark:text-gray-400 mt-1"></div>
                    </div>

                    <div class="relative">
                        <button onclick="toggleNotificationsPanel()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
                            <i class="fas fa-bell text-lg"></i>
                            <span class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                        </button>
                        <div id="notificationsPanel" class="hidden absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div class="p-4 space-y-3">
                                <div class="p-3 bg-warning/10 rounded-lg">
                                    <p class="text-sm text-warning font-medium">Écritures en attente</p>
                                    <p class="text-xs text-gray-600 dark:text-gray-400">2 écritures nécessitent une validation</p>
                                </div>
                                <div class="p-3 bg-info/10 rounded-lg">
                                    <p class="text-sm text-info font-medium">Nouveau collaborateur</p>
                                    <p class="text-xs text-gray-600 dark:text-gray-400">Jean Diabaté a rejoint l'équipe</p>
                                </div>
                                <div class="p-3 bg-success/10 rounded-lg">
                                    <p class="text-sm text-success font-medium">Rapport généré</p>
                                    <p class="text-xs text-gray-600 dark:text-gray-400">Balance comptable disponible</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="relative">
                        <button onclick="toggleThemeMenu()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <i class="fas fa-palette text-lg"></i>
                        </button>
                        <div id="themeMenu" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                            <div class="p-2">
                                <button onclick="setTheme('light')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <i class="fas fa-sun mr-2"></i>Clair
                                </button>
                                <button onclick="setTheme('dark')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <i class="fas fa-moon mr-2"></i>Sombre
                                </button>
                                <button onclick="setTheme('system')" class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <i class="fas fa-desktop mr-2"></i>Système
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="adminActions" class="hidden">
                        <button onclick="uploadLogo()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Upload Logo">
                            <i class="fas fa-image text-lg"></i>
                        </button>
                    </div>

                    <div class="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div class="text-right hidden sm:block">
                            <div id="currentUser" class="text-sm font-medium text-gray-900 dark:text-white"></div>
                            <div id="currentCompany" class="text-xs text-gray-500 dark:text-gray-400"></div>
                        </div>
                        <button onclick="confirmLogout()" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <i class="fas fa-sign-out-alt text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <div class="flex">
        <aside id="sidebar" class="w-64 bg-white dark:bg-gray-800 shadow-lg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative h-full lg:h-auto z-30 border-r border-gray-200 dark:border-gray-700">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                        <span id="userInitials"></span>
                    </div>
                    <div>
                        <div id="sidebarUserName" class="font-medium text-gray-900 dark:text-white"></div>
                        <div id="sidebarUserRole" class="text-sm text-gray-500 dark:text-gray-400"></div>
                    </div>
                </div>
            </div>

            <nav id="navigationMenu" class="mt-6 flex-1 space-y-1 px-3">
                </nav>
        </aside>

        <main class="flex-1 lg:ml-0 p-6 max-w-full overflow-x-hidden">
            <div id="mainContent">
                </div>
        </main>
    </div>
</div>

<div id="modalContainer"></div>

<script>
    // =============================================================================
    // DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT CORRIGÉE
    // Système de gestion comptable SYSCOHADA Révisé - VERSION STABLE
    // =============================================================================

    // =============================================================================
    // APPLICATION STATE - ÉTAT GLOBAL DE L'APPLICATION
    // =============================================================================
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
        statistics: {
            lastUpdate: null,
            totals: {},
            trends: {},
            financial: {},
            hierarchical: {}
        },
        counters: {
            nextCompanyId: 1,
            nextUserId: 1,
            nextEntryId: 1,
            nextCashRegisterId: 1
        }
    };

    // =============================================================================
    // THEME MANAGEMENT - GESTION DU THÈME
    // =============================================================================
    const themeManager = {
        current: 'system',

        init() {
            try {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                    this.current = 'dark';
                } else {
                    document.documentElement.classList.remove('dark');
                    this.current = 'light';
                }

                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                    if (this.current === 'system') {
                        if (event.matches) {
                            document.documentElement.classList.add('dark');
                        } else {
                            document.documentElement.classList.remove('dark');
                        }
                    }
                });
            } catch (error) {
                console.error('❌ Erreur initialisation thème:', error);
            }
        },

        setTheme(theme) {
            try {
                this.current = theme;
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            } catch (error) {
                console.error('❌ Erreur changement thème:', error);
            }
        }
    };

    // =============================================================================
    // UTILITY FUNCTIONS - FONCTIONS UTILITAIRES
    // =============================================================================
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0
            }).format(0);
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    }

    function safeAccess(obj, path, defaultValue = 0) {
        try {
            return path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : defaultValue, obj);
        } catch {
            return defaultValue;
        }
    }

    // =============================================================================
    // USER & COMPANY MANAGEMENT - GESTION HIÉRARCHIQUE
    // =============================================================================
    const HierarchyManager = {
        generateCompanyId() {
            const maxId = app.companies.length > 0 ? Math.max(...app.companies.map(c => c.id)) : 0;
            return maxId + 1;
        },

        generateUserId() {
            const maxId = app.users.length > 0 ? Math.max(...app.users.map(u => u.id)) : 0;
            return maxId + 1;
        },

        getAccessibleCompanies() {
            if (!app.currentUser) return [];
            
            if (app.currentProfile === 'admin') {
                return app.companies.map(c => c.id);
            }

            if (app.currentProfile === 'collaborateur-senior') {
                const directCompanies = app.currentUser.companies || [];
                const subordinateCompanies = app.users
                    .filter(u => u.managedBy === app.currentUser.id)
                    .flatMap(u => u.companies || []);
                return [...new Set([...directCompanies, ...subordinateCompanies])];
            }

            if (app.currentProfile === 'collaborateur') {
                return app.currentUser.companies || [];
            }

            if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                return app.currentUser.companies || [];
            }

            return [];
        },

        getManagedCollaborators() {
            if (app.currentProfile !== 'collaborateur-senior') {
                return [];
            }
            return app.users.filter(u => u.managedBy === app.currentUser.id);
        }
    };

    // =============================================================================
    // SECURITY & ACCESS CONTROL - SÉCURITÉ ET CONTRÔLE D'ACCÈS
    // =============================================================================
    const SecurityManager = {
        canAccessCompany(companyId) {
            try {
                if (!app.currentUser || !companyId) return false;
                const accessibleCompanies = HierarchyManager.getAccessibleCompanies();
                return accessibleCompanies.includes(parseInt(companyId));
            } catch (error) {
                console.error('❌ Erreur canAccessCompany:', error);
                return false;
            }
        },

        getUserCompanies() {
            return HierarchyManager.getAccessibleCompanies();
        },

        getAuthorizedEntries() {
            try {
                const accessibleCompanies = this.getUserCompanies();

                if (app.currentCompany) {
                    if (accessibleCompanies.includes(parseInt(app.currentCompany))) {
                        return app.entries.filter(e => e.companyId == app.currentCompany);
                    }
                    return [];
                }

                return app.entries.filter(e => accessibleCompanies.includes(e.companyId));
            } catch (error) {
                console.error('❌ Erreur getAuthorizedEntries:', error);
                return [];
            }
        },

        getAuthorizedCashRegisters() {
            try {
                const accessibleCompanies = this.getUserCompanies();

                if (app.currentCompany) {
                    if (accessibleCompanies.includes(parseInt(app.currentCompany))) {
                        return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
                    }
                    return [];
                }

                return app.cashRegisters.filter(c => accessibleCompanies.includes(c.companyId));
            } catch (error) {
                console.error('❌ Erreur getAuthorizedCashRegisters:', error);
                return [];
            }
        },

        requiresCompanySelection() {
            try {
                if (app.currentProfile === 'admin') {
                    return !app.currentCompany;
                }

                if (app.currentProfile.includes('collaborateur')) {
                    const accessibleCompanies = this.getUserCompanies();
                    return accessibleCompanies.length > 1 && !app.currentCompany;
                }

                return false;
            } catch (error) {
                console.error('❌ Erreur requiresCompanySelection:', error);
                return false;
            }
        },

        enforceCompanySelection(operation) {
            try {
                if (this.requiresCompanySelection()) {
                    showCompanySelectionWarning(operation);
                    return false;
                }
                return true;
            } catch (error) {
                console.error('❌ Erreur enforceCompanySelection:', error);
                return false;
            }
        }
    };

    // =============================================================================
    // STATISTICS MANAGER - GESTIONNAIRE DE STATISTIQUES
    // =============================================================================
    const StatisticsManager = {
        updateAllStatistics() {
            try {
                // S'assurer que tous les objets existent
                if (!app.statistics.totals) app.statistics.totals = {};
                if (!app.statistics.trends) app.statistics.trends = {};
                if (!app.statistics.financial) app.statistics.financial = {};
                if (!app.statistics.hierarchical) app.statistics.hierarchical = {};

                this.updateBasicStats();
                this.updateTrends();
                this.updateFinancialMetrics();
                this.updateHierarchicalStats();
                app.statistics.lastUpdate = new Date();
                console.log('📊 Statistiques mises à jour avec succès');
            } catch (error) {
                console.error('❌ Erreur mise à jour statistiques:', error);
                // Valeurs par défaut
                app.statistics.totals = {
                    companies: 0,
                    users: 0,
                    activeUsers: 0,
                    entries: 0,
                    pendingEntries: 0,
                    validatedEntries: 0,
                    totalDebit: 0,
                    totalCredit: 0,
                    cashRegisters: 0,
                    activeCashRegisters: 0,
                    accessibleCompaniesNames: []
                };
                app.statistics.trends = {
                    entriesGrowth: 0,
                    validationRate: 100,
                    averageProcessingTime: 0,
                    monthlyProgress: 0
                };
                app.statistics.financial = {
                    balance: 0,
                    cashFlow: 0,
                    topAccounts: [],
                    journalDistribution: {}
                };
                app.statistics.hierarchical = {
                    managedCollaborators: 0,
                    managedCompanies: 0,
                    totalManagedEntries: 0
                };
            }
        },

        updateBasicStats() {
            try {
                const authorizedEntries = SecurityManager.getAuthorizedEntries();
                const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
                const accessibleCompanies = SecurityManager.getUserCompanies();
                const visibleUsers = this.getVisibleUsers();

                app.statistics.totals = {
                    companies: accessibleCompanies.length,
                    accessibleCompaniesNames: app.companies
                        .filter(c => accessibleCompanies.includes(c.id))
                        .map(c => c.name),
                    users: visibleUsers.length,
                    activeUsers: visibleUsers.filter(u => u.status === 'Actif').length,
                    entries: authorizedEntries.length,
                    pendingEntries: authorizedEntries.filter(e => e.status === 'En attente').length,
                    validatedEntries: authorizedEntries.filter(e => e.status === 'Validé').length,
                    totalDebit: this.calculateTotalDebit(authorizedEntries),
                    totalCredit: this.calculateTotalCredit(authorizedEntries),
                    cashRegisters: authorizedCashRegisters.length,
                    activeCashRegisters: authorizedCashRegisters.filter(c => c.status === 'Ouvert').length
                };
            } catch (error) {
                console.error('❌ Erreur updateBasicStats:', error);
            }
        },

        getVisibleUsers() {
            try {
                switch (app.currentProfile) {
                    case 'admin':
                        return app.users;
                    case 'collaborateur-senior':
                        const managedCollaborators = HierarchyManager.getManagedCollaborators();
                        const currentUser = [app.currentUser];
                        const otherSeniors = app.users.filter(u => u.profile === 'collaborateur-senior' && u.id !== app.currentUser.id);
                        return [...currentUser, ...managedCollaborators, ...otherSeniors];
                    case 'collaborateur':
                        const userCompanies = app.currentUser.companies || [];
                        return app.users.filter(u => 
                            u.id === app.currentUser.id || 
                            (u.companies && u.companies.some(c => userCompanies.includes(c)))
                        );
                    default:
                        return [app.currentUser];
                }
            } catch (error) {
                console.error('❌ Erreur getVisibleUsers:', error);
                return [app.currentUser];
            }
        },

        updateHierarchicalStats() {
            try {
                if (app.currentProfile === 'collaborateur-senior') {
                    const managedCollaborators = HierarchyManager.getManagedCollaborators();
                    const managedCompanies = managedCollaborators.flatMap(c => c.companies || []);
                    const uniqueManagedCompanies = [...new Set(managedCompanies)];

                    app.statistics.hierarchical = {
                        managedCollaborators: managedCollaborators.length,
                        managedCompanies: uniqueManagedCompanies.length,
                        totalManagedEntries: app.entries.filter(e => uniqueManagedCompanies.includes(e.companyId)).length
                    };
                } else {
                    app.statistics.hierarchical = {
                        managedCollaborators: 0,
                        managedCompanies: 0,
                        totalManagedEntries: 0
                    };
                }
            } catch (error) {
                console.error('❌ Erreur updateHierarchicalStats:', error);
            }
        },

        updateTrends() {
            try {
                const authorizedEntries = SecurityManager.getAuthorizedEntries();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                const thisMonthEntries = authorizedEntries.filter(e => {
                    const entryDate = new Date(e.date);
                    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
                });

                const lastMonthEntries = authorizedEntries.filter(e => {
                    const entryDate = new Date(e.date);
                    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
                    return entryDate.getMonth() === lastMonth && entryDate.getFullYear() === year;
                });

                app.statistics.trends = {
                    entriesGrowth: this.calculateGrowthRate(thisMonthEntries.length, lastMonthEntries.length),
                    validationRate: this.calculateValidationRate(authorizedEntries),
                    averageProcessingTime: this.calculateAverageProcessingTime(authorizedEntries),
                    monthlyProgress: this.calculateMonthlyProgress(thisMonthEntries)
                };
            } catch (error) {
                console.error('❌ Erreur updateTrends:', error);
            }
        },

        updateFinancialMetrics() {
            try {
                const authorizedEntries = SecurityManager.getAuthorizedEntries();

                app.statistics.financial = {
                    balance: this.calculateBalance(authorizedEntries),
                    cashFlow: this.calculateCashFlow(authorizedEntries),
                    topAccounts: this.getTopUsedAccounts(authorizedEntries),
                    journalDistribution: this.getJournalDistribution(authorizedEntries)
                };
            } catch (error) {
                console.error('❌ Erreur updateFinancialMetrics:', error);
            }
        },

        calculateTotalDebit(entries) {
            try {
                return entries.reduce((total, entry) => {
                    return total + (entry.lines || []).reduce((sum, line) => sum + (line.debit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateTotalDebit:', error);
                return 0;
            }
        },

        calculateTotalCredit(entries) {
            try {
                return entries.reduce((total, entry) => {
                    return total + (entry.lines || []).reduce((sum, line) => sum + (line.credit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateTotalCredit:', error);
                return 0;
            }
        },

        calculateGrowthRate(current, previous) {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        },

        calculateValidationRate(entries) {
            if (entries.length === 0) return 100;
            const validated = entries.filter(e => e.status === 'Validé').length;
            return Math.round((validated / entries.length) * 100);
        },

        calculateAverageProcessingTime(entries) {
            const processedEntries = entries.filter(e => e.status === 'Validé');
            if (processedEntries.length === 0) return 0;
            return Math.round(processedEntries.length * 2.5 / processedEntries.length);
        },

        calculateMonthlyProgress(monthEntries) {
            const targetMonthly = 100;
            return Math.min(100, Math.round((monthEntries.length / targetMonthly) * 100));
        },

        calculateBalance(entries) {
            const totalDebit = this.calculateTotalDebit(entries);
            const totalCredit = this.calculateTotalCredit(entries);
            return totalDebit - totalCredit;
        },

        calculateCashFlow(entries) {
            try {
                const cashAccounts = ['571000', '512000', '531000'];
                return entries.reduce((flow, entry) => {
                    const cashLines = (entry.lines || []).filter(line => cashAccounts.includes(line.account));
                    return flow + cashLines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateCashFlow:', error);
                return 0;
            }
        },

        getTopUsedAccounts(entries) {
            try {
                const accountUsage = {};
                entries.forEach(entry => {
                    (entry.lines || []).forEach(line => {
                        if (line.account) {
                            accountUsage[line.account] = (accountUsage[line.account] || 0) + 1;
                        }
                    });
                });

                return Object.entries(accountUsage)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([account, count]) => ({
                        account,
                        count,
                        name: this.getAccountName(account)
                    }));
            } catch (error) {
                console.error('❌ Erreur getTopUsedAccounts:', error);
                return [];
            }
        },

        getJournalDistribution(entries) {
            try {
                const distribution = {};
                entries.forEach(entry => {
                    distribution[entry.journal] = (distribution[entry.journal] || 0) + 1;
                });
                return distribution;
            } catch (error) {
                console.error('❌ Erreur getJournalDistribution:', error);
                return {};
            }
        },

        getAccountName(code) {
            try {
                const account = app.accounts.find(acc => acc.code === code);
                return account ? account.name : 'Compte inconnu';
            } catch (error) {
                console.error('❌ Erreur getAccountName:', error);
                return 'Compte inconnu';
            }
        },

        getFormattedStats() {
            try {
                return {
                    ...app.statistics.totals,
                    ...app.statistics.trends,
                    ...app.statistics.hierarchical,
                    lastUpdate: app.statistics.lastUpdate ?
                        app.statistics.lastUpdate.toLocaleString('fr-FR') :
                        'Jamais mise à jour'
                };
            } catch (error) {
                console.error('❌ Erreur getFormattedStats:', error);
                return {};
            }
        }
    };

    // =============================================================================
    // DATA INITIALIZATION - INITIALISATION DES DONNÉES
    // =============================================================================
    function initializeData() {
        try {
            // Plan comptable SYSCOHADA Révisé
            app.accounts = [
                { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
                { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
                { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
                { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
                { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
                { code: '171000', name: 'Dettes de crédit-bail', category: 'Dettes financières' },
                { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
                { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
                { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
                { code: '221000', name: 'Logiciels', category: 'Immobilisations incorporelles' },
                { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
                { code: '241000', name: 'Matériel et mobilier', category: 'Immobilisations corporelles' },
                { code: '311000', name: 'Marchandises', category: 'Stocks' },
                { code: '321000', name: 'Matières premières', category: 'Stocks' },
                { code: '371000', name: 'Stock en cours', category: 'Stocks' },
                { code: '381000', name: 'Stocks de produits finis', category: 'Stocks' },
                { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
                { code: '411000', name: 'Clients', category: 'Clients' },
                { code: '421000', name: 'Personnel', category: 'Personnel' },
                { code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux' },
                { code: '441000', name: 'État et collectivités', category: 'État' },
                { code: '471000', name: 'Comptes d\'attente', category: 'Comptes transitoires' },
                { code: '512000', name: 'Banques', category: 'Comptes bancaires' },
                { code: '531000', name: 'Chèques postaux', category: 'Comptes postaux' },
                { code: '571000', name: 'Caisse', category: 'Caisse' },
                { code: '581000', name: 'Virements internes', category: 'Virements' },
                { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
                { code: '605000', name: 'Autres achats', category: 'Achats' },
                { code: '621000', name: 'Transports', category: 'Services extérieurs' },
                { code: '622000', name: 'Rémunérations intermédiaires', category: 'Services extérieurs' },
                { code: '631000', name: 'Impôts et taxes', category: 'Impôts et taxes' },
                { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
                { code: '646000', name: 'Charges sociales', category: 'Charges de personnel' },
                { code: '681000', name: 'Dotations aux amortissements', category: 'Dotations' },
                { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
                { code: '706000', name: 'Services vendus', category: 'Ventes' },
                { code: '771000', name: 'Revenus financiers', category: 'Produits financiers' },
                { code: '781000', name: 'Reprises d\'amortissements', category: 'Reprises' },
                { code: '801000', name: 'Résultat en instance d\'affectation', category: 'Résultats' },
                { code: '810000', name: 'Résultat net: bénéfice', category: 'Résultats' },
                { code: '820000', name: 'Résultat net: perte', category: 'Résultats' },
                { code: '901000', name: 'Coûts de revient', category: 'Comptabilité analytique' },
                { code: '905000', name: 'Coûts de production', category: 'Comptabilité analytique' },
                { code: '910000', name: 'Charges indirectes', category: 'Comptabilité analytique' },
                { code: '920000', name: 'Centres d\'analyse', category: 'Comptabilité analytique' }
            ];

            // Entreprises avec IDs automatiques
            app.companies = [
                {
                    id: 1,
                    name: 'SARL TECH INNOVATION',
                    type: 'SARL',
                    status: 'Actif',
                    system: 'Normal',
                    phone: '+225 07 12 34 56 78',
                    address: 'Abidjan, Cocody',
                    cashRegisters: 3,
                    createdBy: 1,
                    createdAt: '2024-01-01T00:00:00.000Z'
                },
                {
                    id: 2,
                    name: 'SA COMMERCE PLUS',
                    type: 'SA',
                    status: 'Actif',
                    system: 'Normal',
                    phone: '+225 05 98 76 54 32',
                    address: 'Abidjan, Plateau',
                    cashRegisters: 5,
                    createdBy: 1,
                    createdAt: '2024-01-02T00:00:00.000Z'
                },
                {
                    id: 3,
                    name: 'EURL SERVICES PRO',
                    type: 'EURL',
                    status: 'Période d\'essai',
                    system: 'Minimal',
                    phone: '+225 01 23 45 67 89',
                    address: 'Bouaké Centre',
                    cashRegisters: 2,
                    createdBy: 1,
                    createdAt: '2024-01-03T00:00:00.000Z'
                },
                {
                    id: 4,
                    name: 'SAS DIGITAL WORLD',
                    type: 'SAS',
                    status: 'Suspendu',
                    system: 'Normal',
                    phone: '+225 07 11 22 33 44',
                    address: 'San-Pédro',
                    cashRegisters: 1,
                    createdBy: 1,
                    createdAt: '2024-01-04T00:00:00.000Z'
                }
            ];

            // Utilisateurs avec hiérarchie
            app.users = [
                {
                    id: 1,
                    name: 'Admin Système',
                    email: 'admin@doukecompta.ci',
                    role: 'Administrateur',
                    profile: 'admin',
                    phone: '+225 07 00 00 00 00',
                    companies: [1, 2, 3, 4],
                    status: 'Actif',
                    createdBy: null,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    parentUserId: null,
                    managedBy: null
                },
                {
                    id: 2,
                    name: 'Marie Kouassi',
                    email: 'marie.kouassi@cabinet.com',
                    role: 'Collaborateur Senior',
                    profile: 'collaborateur-senior',
                    phone: '+225 07 11 11 11 11',
                    companies: [1, 2, 3],
                    status: 'Actif',
                    createdBy: 1,
                    createdAt: '2024-01-05T00:00:00.000Z',
                    parentUserId: null,
                    managedBy: null
                },
                {
                    id: 3,
                    name: 'Jean Diabaté',
                    email: 'jean.diabate@cabinet.com',
                    role: 'Collaborateur',
                    profile: 'collaborateur',
                    phone: '+225 07 22 22 22 22',
                    companies: [2, 4],
                    status: 'Actif',
                    createdBy: 2,
                    createdAt: '2024-01-06T00:00:00.000Z',
                    parentUserId: 2,
                    managedBy: 2
                },
                {
                    id: 4,
                    name: 'Amadou Traoré',
                    email: 'atraore@sarltech.ci',
                    role: 'Utilisateur',
                    profile: 'user',
                    phone: '+225 07 33 33 33 33',
                    companies: [1],
                    status: 'Actif',
                    createdBy: 1,
                    createdAt: '2024-01-07T00:00:00.000Z',
                    parentUserId: null,
                    managedBy: null
                },
                {
                    id: 5,
                    name: 'Ibrahim Koné',
                    email: 'ikone@caisse.ci',
                    role: 'Caissier',
                    profile: 'caissier',
                    phone: '+225 07 44 44 44 44',
                    companies: [2],
                    status: 'Actif',
                    createdBy: 1,
                    createdAt: '2024-01-08T00:00:00.000Z',
                    parentUserId: null,
                    managedBy: null
                }
            ];

            // Écritures avec IDs automatiques
            app.entries = [
                {
                    id: 1,
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
                },
                {
                    id: 4,
                    date: '2024-12-12',
                    journal: 'JB',
                    piece: 'JB-2024-003-0045',
                    libelle: 'Virement bancaire fournisseur',
                    companyId: 2,
                    lines: [
                        { account: '401000', accountName: 'Fournisseurs', libelle: 'Règlement fournisseur', debit: 500000, credit: 0 },
                        { account: '512000', accountName: 'Banques', libelle: 'Virement sortant', debit: 0, credit: 500000 }
                    ],
                    status: 'Validé',
                    userId: 5
                },
                {
                    id: 5,
                    date: '2024-12-11',
                    journal: 'JG',
                    piece: 'JG-2024-004-007',
                    libelle: 'Paiement salaire personnel',
                    companyId: 3,
                    lines: [
                        { account: '641000', accountName: 'Rémunérations du personnel', libelle: 'Salaires', debit: 750000, credit: 0 },
                        { account: '512000', accountName: 'Banques', libelle: 'Paiement salaires', debit: 0, credit: 750000 }
                    ],
                    status: 'En attente',
                    userId: 2
                },
                {
                    id: 6,
                    date: '2024-12-10',
                    journal: 'JF',
                    piece: 'JF-2024-005-0012',
                    libelle: 'Amortissement matériel de transport',
                    companyId: 4,
                    lines: [
                        { account: '681000', accountName: 'Dotations aux amortissements', libelle: 'Amortissement', debit: 120000, credit: 0 },
                        { account: '281800', accountName: 'Amort. Matériel de transport', libelle: 'Amortissement', debit: 0, credit: 120000 }
                    ],
                    status: 'Validé',
                    userId: 3
                }
            ];

            // Caisses avec IDs automatiques
            app.cashRegisters = [
                { id: 101, name: 'Caisse Principale SARL TECH', companyId: 1, balance: 500000, status: 'Ouvert' },
                { id: 102, name: 'Caisse Secondaire SARL TECH', companyId: 1, balance: 120000, status: 'Fermé' },
                { id: 103, name: 'Caisse SA COMMERCE Plus', companyId: 2, balance: 780000, status: 'Ouvert' },
                { id: 104, name: 'Caisse SA COMMERCE Plus Agence', companyId: 2, balance: 30000, status: 'Ouvert' },
                { id: 105, name: 'Caisse EURL SERVICES', companyId: 3, balance: 90000, status: 'Ouvert' },
                { id: 106, name: 'Caisse SAS DIGITAL', companyId: 4, balance: 250000, status: 'Ouvert' }
            ];

            app.notifications = [
                { id: 1, message: '2 écritures en attente de validation', type: 'warning', date: '2024-06-15' },
                { id: 2, message: 'Nouvel utilisateur enregistré: Jean Dupont', type: 'info', date: '2024-06-14' },
                { id: 3, message: 'Rapport financier mensuel disponible', type: 'success', date: '2024-06-13' }
            ];

            app.deadlines = [
                { id: 1, description: 'Déclaration TVA mensuelle', date: '2025-06-20', status: 'pending' },
                { id: 2, description: 'Clôture annuelle des comptes', date: '2025-12-31', status: 'upcoming' },
                { id: 3, description: 'Versement acomptes IS', date: '2025-09-15', status: 'upcoming' }
            ];

            console.log('✅ Données initialisées avec succès.');
        } catch (error) {
            console.error('❌ Erreur initialisation des données:', error);
        }
    }

    // =============================================================================
    // AUTHENTICATION - GESTION DE L'AUTHENTIFICATION
    // =============================================================================
    function handleLogin(event) {
        event.preventDefault();
        try {
            const email = document.getElementById('loginEmail').value;
            console.log(`Tentative de connexion avec Email: ${email}`);

            const user = app.users.find(u => u.email === email);

            if (user) {
                app.currentUser = user;
                app.currentProfile = user.profile;
                app.isAuthenticated = true;

                // Auto-assignation pour utilisateurs et caissiers
                if (user.profile === 'user' || user.profile === 'caissier') {
                    if (user.companies && user.companies.length > 0) {
                        app.currentCompany = user.companies[0];
                    }
                } else {
                    app.currentCompany = null;
                }

                console.log(`✅ Connexion réussie pour ${user.name} (${user.profile}).`);
                
                // Afficher immédiatement l'interface principale
                updateUIForRole();
            } else {
                alert('Email ou mot de passe incorrect.');
                console.warn('❌ Tentative de connexion échouée: utilisateur non trouvé.');
            }
        } catch (error) {
            console.error('❌ Erreur durant la connexion:', error);
            alert('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
        }
    }

    function loginAs(profileType) {
        try {
            let user = null;
            switch (profileType) {
                case 'admin':
                    user = app.users.find(u => u.profile === 'admin');
                    break;
                case 'collaborateur-senior':
                    user = app.users.find(u => u.profile === 'collaborateur-senior');
                    break;
                case 'collaborateur':
                    user = app.users.find(u => u.profile === 'collaborateur');
                    break;
                case 'user':
                    user = app.users.find(u => u.profile === 'user');
                    break;
                case 'caissier':
                    user = app.users.find(u => u.profile === 'caissier');
                    break;
                default:
                    alert('Profil de démonstration inconnu.');
                    return;
            }

            if (user) {
                document.getElementById('loginEmail').value = user.email;
                document.getElementById('loginPassword').value = 'password';
                handleLogin({ preventDefault: () => {} });
            } else {
                alert(`Utilisateur de démonstration pour le profil "${profileType}" introuvable.`);
            }
        } catch (error) {
            console.error('❌ Erreur loginAs:', error);
        }
    }

    function confirmLogout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            logout();
        }
    }

    function logout() {
        try {
            app.currentUser = null;
            app.currentProfile = null;
            app.isAuthenticated = false;
            app.currentCompany = null;
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('loginInterface').classList.remove('hidden');
            document.getElementById('loginForm').reset();
            console.log('🚪 Déconnexion réussie.');
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    // =============================================================================
    // UI RENDERING - RENDU DE L'INTERFACE
    // =============================================================================
    function updateUIForRole() {
        try {
            console.log('🔄 Mise à jour de l\'interface pour:', app.currentProfile);
            
            // Cacher la page de connexion, afficher l'application principale
            document.getElementById('loginInterface').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            if (!app.isAuthenticated || !app.currentUser) {
                logout();
                return;
            }

            // Mettre à jour les infos utilisateur
            const userInitials = app.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('currentUser').textContent = app.currentUser.name;
            document.getElementById('sidebarUserName').textContent = app.currentUser.name;
            document.getElementById('sidebarUserRole').textContent = app.currentUser.role;
            document.getElementById('userInitials').textContent = userInitials;

            // Gérer la visibilité du sélecteur d'entreprise
            const companySelectorDiv = document.getElementById('companySelector');
            const adminActionsDiv = document.getElementById('adminActions');
            const activeCompanySelect = document.getElementById('activeCompanySelect');
            const selectedCompanyInfoDiv = document.getElementById('selectedCompanyInfo');

            companySelectorDiv.classList.add('hidden');
            adminActionsDiv.classList.add('hidden');

            // Sélecteur d'entreprise pour admin et collaborateurs avec plusieurs entreprises
            const accessibleCompanies = SecurityManager.getUserCompanies();
            if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && accessibleCompanies.length > 1) {
                companySelectorDiv.classList.remove('hidden');
                populateCompanySelector();

                if (app.currentCompany) {
                    activeCompanySelect.value = app.currentCompany;
                    const selectedCompany = app.companies.find(c => c.id == app.currentCompany);
                    selectedCompanyInfoDiv.textContent = selectedCompany ? selectedCompany.name : '';
                } else {
                    selectedCompanyInfoDiv.textContent = 'Aucune entreprise sélectionnée';
                }
            } else if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                // Affichage direct de l'entreprise assignée
                if (accessibleCompanies.length > 0) {
                    app.currentCompany = accessibleCompanies[0];
                    const company = app.companies.find(c => c.id === app.currentCompany);
                    document.getElementById('currentCompany').textContent = company ? company.name : 'N/A';
                } else {
                    document.getElementById('currentCompany').textContent = 'Aucune entreprise assignée';
                }
            }

            if (app.currentProfile === 'admin') {
                adminActionsDiv.classList.remove('hidden');
            }

            // Afficher l'entreprise courante dans la nav
            if (app.currentCompany) {
                const company = app.companies.find(c => c.id == app.currentCompany);
                document.getElementById('currentCompany').textContent = company ? company.name : '';
            } else {
                document.getElementById('currentCompany').textContent = '';
            }

            // Rendre le menu de navigation et le tableau de bord
            renderNavigationMenu();
            renderDashboard();

            console.log('✅ Interface mise à jour avec succès');

        } catch (error) {
            console.error('❌ Erreur updateUIForRole:', error);
            alert('Une erreur est survenue lors de la mise à jour de l\'interface. Veuillez recharger la page.');
        }
    }

    function populateCompanySelector() {
        const select = document.getElementById('activeCompanySelect');
        select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        const accessibleCompanies = SecurityManager.getUserCompanies();
        const companies = app.companies.filter(c => accessibleCompanies.includes(c.id));

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            select.appendChild(option);
        });

        select.removeEventListener('change', handleCompanySelectionChange);
        select.addEventListener('change', handleCompanySelectionChange);
    }

    function handleCompanySelectionChange() {
        const selectedCompanyId = document.getElementById('activeCompanySelect').value;
        app.currentCompany = selectedCompanyId ? parseInt(selectedCompanyId) : null;

        const selectedCompanyInfoDiv = document.getElementById('selectedCompanyInfo');
        const currentCompanyDisplay = document.getElementById('currentCompany');
        if (app.currentCompany) {
            const selectedCompany = app.companies.find(c => c.id === app.currentCompany);
            selectedCompanyInfoDiv.textContent = selectedCompany ? selectedCompany.name : '';
            currentCompanyDisplay.textContent = selectedCompany ? selectedCompany.name : '';
        } else {
            selectedCompanyInfoDiv.textContent = 'Aucune entreprise sélectionnée';
            currentCompanyDisplay.textContent = '';
        }

        renderDashboard();
    }

    function renderNavigationMenu() {
        const navMenu = document.getElementById('navigationMenu');
        navMenu.innerHTML = '';

        const menuItems = {
            'admin': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', action: 'renderDashboard(\'admin\')' },
                { icon: 'fas fa-building', text: 'Gestion des entreprises', action: 'renderCompanyManagement()' },
                { icon: 'fas fa-users', text: 'Gestion des utilisateurs', action: 'renderUserManagement()' },
                { icon: 'fas fa-book', text: 'Plan Comptable', action: 'renderAccountPlan()' },
                { icon: 'fas fa-file-invoice', text: 'Écritures Comptables', action: 'renderEntriesManagement()' },
                { icon: 'fas fa-cash-register', text: 'Gestion des Caisses', action: 'renderCashRegisterManagement()' },
                { icon: 'fas fa-chart-line', text: 'Rapports et analyses', action: 'renderReports()' },
                { icon: 'fas fa-bell', text: 'Notifications', action: 'renderNotifications()' }
            ],
            'collaborateur-senior': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', action: 'renderDashboard(\'collaborateur-senior\')' },
                { icon: 'fas fa-users', text: 'Mes Collaborateurs', action: 'renderManagedCollaborators()' },
                { icon: 'fas fa-file-invoice', text: 'Écritures Comptables', action: 'renderEntriesManagement()' },
                { icon: 'fas fa-check-double', text: 'Validation des écritures', action: 'renderValidationEntries()' },
                { icon: 'fas fa-chart-line', text: 'Rapports avancés', action: 'renderReports()' }
            ],
            'collaborateur': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', action: 'renderDashboard(\'collaborateur\')' },
                { icon: 'fas fa-file-invoice', text: 'Saisie d\'écritures', action: 'renderEntriesManagement()' },
                { icon: 'fas fa-search', text: 'Consultation des comptes', action: 'renderAccountConsultation()' },
                { icon: 'fas fa-bell', text: 'Mes notifications', action: 'renderNotifications()' }
            ],
            'user': [
                { icon: 'fas fa-tachometer-alt', text: 'Mon Tableau de bord', action: 'renderDashboard(\'user\')' },
                { icon: 'fas fa-file-alt', text: 'Consulter mes rapports', action: 'renderUserReports()' },
                { icon: 'fas fa-wallet', text: 'Suivi Trésorerie', action: 'renderCashFlowTracking()' }
            ],
            'caissier': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord Caisse', action: 'renderDashboard(\'caissier\')' },
                { icon: 'fas fa-cash-register', text: 'Opérations de Caisse', action: 'renderCashOperations()' },
                { icon: 'fas fa-exchange-alt', text: 'Historique des mouvements', action: 'renderCashMovementHistory()' }
            ]
        };

        const profileMenu = menuItems[app.currentProfile] || [];

        profileMenu.forEach(item => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-primary-light hover:text-white rounded-lg transition-colors duration-200';
            link.setAttribute('onclick', item.action);
            link.innerHTML = `<i class="${item.icon} mr-3 text-lg"></i><span class="font-medium">${item.text}</span>`;
            navMenu.appendChild(link);
        });

        console.log(`✅ Menu de navigation rendu pour le profil: ${app.currentProfile}`);
    }

    function renderDashboard(profile = app.currentProfile) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '';

        if (SecurityManager.requiresCompanySelection()) {
            showCompanySelectionWarning('afficher le tableau de bord');
            return;
        }

        // Mettre à jour les statistiques avant d'afficher le dashboard
        StatisticsManager.updateAllStatistics();
        const stats = StatisticsManager.getFormattedStats();

        let dashboardContent = '';
        let title = 'Tableau de bord';

        try {
            switch (profile) {
                case 'admin':
                    title = 'Tableau de bord Administrateur';
                    dashboardContent = renderAdminDashboard(stats);
                    break;
                case 'collaborateur-senior':
                    title = 'Tableau de bord Collaborateur Senior';
                    dashboardContent = renderCollaborateurSeniorDashboard(stats);
                    break;
                case 'collaborateur':
                    title = 'Tableau de bord Collaborateur';
                    dashboardContent = renderCollaborateurDashboard(stats);
                    break;
                case 'user':
                    title = 'Mon Tableau de bord';
                    dashboardContent = renderUserDashboard(stats);
                    break;
                case 'caissier':
                    title = 'Tableau de bord Caisse';
                    dashboardContent = renderCaissierDashboard(stats);
                    break;
                default:
                    dashboardContent = '<p class="text-gray-600 dark:text-gray-400">Bienvenue. Sélectionnez un rôle pour voir le tableau de bord.</p>';
                    break;
            }

            mainContent.innerHTML = `
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">${title}</h2>
                ${dashboardContent}
            `;
            console.log(`✅ Tableau de bord rendu pour le profil: ${profile}`);
        } catch (error) {
            console.error('❌ Erreur renderDashboard:', error);
            mainContent.innerHTML = `
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">${title}</h2>
                <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p class="font-bold">Erreur lors du chargement du tableau de bord</p>
                    <p>Une erreur est survenue. Veuillez recharger la page.</p>
                </div>
            `;
        }
    }

    // DASHBOARDS SPÉCIFIQUES AUX RÔLES AVEC GESTION D'ERREURS

    function renderAdminDashboard(stats) {
        try {
            const balance = safeAccess(app, 'statistics.financial.balance', 0);
            const topAccounts = safeAccess(app, 'statistics.financial.topAccounts', []);
            const journalDistribution = safeAccess(app, 'statistics.financial.journalDistribution', {});

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Entreprises</h3>
                        <p class="text-4xl font-bold text-primary">${stats.companies || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Entreprises accessibles</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Utilisateurs</h3>
                        <p class="text-4xl font-bold text-success">${stats.users || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${stats.activeUsers || 0} actifs</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures Total</h3>
                        <p class="text-4xl font-bold text-info">${stats.entries || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${stats.pendingEntries || 0} en attente</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Caisses</h3>
                        <p class="text-4xl font-bold text-warning">${stats.cashRegisters || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${stats.activeCashRegisters || 0} ouvertes</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistiques Financières</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Débit:</span>
                                <span class="font-semibold">${formatCurrency(stats.totalDebit || 0)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Crédit:</span>
                                <span class="font-semibold">${formatCurrency(stats.totalCredit || 0)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Solde Global:</span>
                                <span class="font-semibold ${balance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(balance)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Taux de validation:</span>
                                <span class="font-semibold text-success">${stats.validationRate || 0}%</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Entreprises Accessibles</h3>
                        <div class="space-y-2">
                            ${(stats.accessibleCompaniesNames || []).map(name => `
                                <div class="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <i class="fas fa-building text-primary mr-2"></i>
                                    <span class="text-sm">${name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Rapides Administrateur</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="renderCompanyManagement()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-primary hover:bg-primary-dark">
                            <i class="fas fa-plus-circle mr-2"></i> Nouvelle Entreprise
                        </button>
                        <button onclick="renderUserManagement()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-info hover:bg-info-dark">
                            <i class="fas fa-user-plus mr-2"></i> Ajouter un utilisateur
                        </button>
                        <button onclick="renderReports()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-success hover:bg-success-dark">
                            <i class="fas fa-chart-pie mr-2"></i> Générer un rapport global
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur renderAdminDashboard:', error);
            return '<p class="text-red-600">Erreur lors du chargement du tableau de bord administrateur.</p>';
        }
    }

    function renderCollaborateurSeniorDashboard(stats) {
        try {
            const managedCollaborators = HierarchyManager.getManagedCollaborators();
            const balance = safeAccess(app, 'statistics.financial.balance', 0);
            const cashFlow = safeAccess(app, 'statistics.financial.cashFlow', 0);
            
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mes Collaborateurs</h3>
                        <p class="text-4xl font-bold text-primary">${stats.managedCollaborators || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Sous ma responsabilité</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Entreprises Gérées</h3>
                        <p class="text-4xl font-bold text-success">${stats.managedCompanies || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Total accessible</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures en Attente</h3>
                        <p class="text-4xl font-bold text-warning">${stats.pendingEntries || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">À valider</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Taux de Validation</h3>
                        <p class="text-4xl font-bold text-success">${stats.validationRate || 0}%</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Performance globale</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aperçu Financier</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Débit:</span>
                                <span class="font-semibold">${formatCurrency(stats.totalDebit || 0)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Crédit:</span>
                                <span class="font-semibold">${formatCurrency(stats.totalCredit || 0)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Flux de Trésorerie:</span>
                                <span class="font-semibold">${formatCurrency(cashFlow)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mes Collaborateurs</h3>
                        <div class="space-y-2">
                            ${managedCollaborators.length > 0 ? managedCollaborators.map(collab => `
                                <div class="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <i class="fas fa-user text-primary mr-2"></i>
                                    <span class="text-sm">${collab.name}</span>
                                    <span class="ml-auto text-xs text-gray-500">${(collab.companies || []).length} entreprises</span>
                                </div>
                            `).join('') : '<p class="text-gray-500 dark:text-gray-400 text-sm">Aucun collaborateur assigné</p>'}
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Recommandées</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="renderManagedCollaborators()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-primary hover:bg-primary-dark">
                            <i class="fas fa-users mr-2"></i> Gérer les collaborateurs
                        </button>
                        <button onclick="renderValidationEntries()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-warning hover:bg-warning-dark">
                            <i class="fas fa-check-square mr-2"></i> Valider les écritures
                        </button>
                        <button onclick="renderReports()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-info hover:bg-info-dark">
                            <i class="fas fa-file-export mr-2"></i> Exporter des rapports
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur renderCollaborateurSeniorDashboard:', error);
            return '<p class="text-red-600">Erreur lors du chargement du tableau de bord collaborateur senior.</p>';
        }
    }

    function renderCollaborateurDashboard(stats) {
        try {
            const myEntries = app.entries.filter(e => e.userId === app.currentUser.id && 
                SecurityManager.getUserCompanies().includes(e.companyId)).length;

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mes Écritures Saisies</h3>
                        <p class="text-4xl font-bold text-primary">${myEntries}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Au total</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures en Attente</h3>
                        <p class="text-4xl font-bold text-warning">${stats.pendingEntries || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">À valider</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mes Entreprises</h3>
                        <p class="text-4xl font-bold text-info">${stats.companies || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Assignées</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mes Entreprises Assignées</h3>
                    <div class="space-y-2">
                        ${(stats.accessibleCompaniesNames || []).map(name => `
                            <div class="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <i class="fas fa-building text-primary mr-2"></i>
                                <span class="text-sm">${name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Progrès Mensuel des Saisies</h3>
                    <div class="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                        <div class="bg-primary h-4 rounded-full" style="width: ${stats.monthlyProgress || 0}%"></div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${stats.monthlyProgress || 0}% de l'objectif atteint ce mois-ci.</p>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Rapides</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="renderEntriesManagement()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-success hover:bg-success-dark">
                            <i class="fas fa-edit mr-2"></i> Saisir une nouvelle écriture
                        </button>
                        <button onclick="renderAccountConsultation()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-info hover:bg-info-dark">
                            <i class="fas fa-eye mr-2"></i> Consulter les comptes
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur renderCollaborateurDashboard:', error);
            return '<p class="text-red-600">Erreur lors du chargement du tableau de bord collaborateur.</p>';
        }
    }

    function renderUserDashboard(stats) {
        try {
            const userCompany = app.companies.find(c => c.id === app.currentCompany) || {name: 'N/A'};
            const balance = safeAccess(app, 'statistics.financial.balance', 0);
            const cashFlow = safeAccess(app, 'statistics.financial.cashFlow', 0);
            
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mon Entreprise</h3>
                        <p class="text-2xl font-bold text-primary">${userCompany.name}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${userCompany.type || 'N/A'}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures Total</h3>
                        <p class="text-4xl font-bold text-info">${stats.entries || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${stats.validationRate || 0}% validées</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Solde Entreprise</h3>
                        <p class="text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(balance)}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Situation actuelle</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aperçu Financier de ${userCompany.name}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        <div class="flex justify-between">
                            <span class="font-medium">Total Débit:</span>
                            <span class="font-semibold">${formatCurrency(stats.totalDebit || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Total Crédit:</span>
                            <span class="font-semibold">${formatCurrency(stats.totalCredit || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Flux de trésorerie:</span>
                            <span class="font-semibold">${formatCurrency(cashFlow)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Caisses disponibles:</span>
                            <span class="font-semibold">${stats.cashRegisters || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accès Rapide</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="renderUserReports()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-info hover:bg-info-dark">
                            <i class="fas fa-file-pdf mr-2"></i> Rapports financiers
                        </button>
                        <button onclick="renderCashFlowTracking()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-success hover:bg-success-dark">
                            <i class="fas fa-chart-area mr-2"></i> Suivi de Trésorerie
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur renderUserDashboard:', error);
            return '<p class="text-red-600">Erreur lors du chargement du tableau de bord utilisateur.</p>';
        }
    }

    function renderCaissierDashboard(stats) {
        try {
            const userCompany = app.companies.find(c => c.id === app.currentCompany) || {name: 'N/A'};
            const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
            const totalCashBalance = authorizedCashRegisters.reduce((sum, reg) => sum + (reg.balance || 0), 0);

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mon Entreprise</h3>
                        <p class="text-2xl font-bold text-primary">${userCompany.name}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Caissier principal</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Solde Total Caisses</h3>
                        <p class="text-4xl font-bold text-success">${formatCurrency(totalCashBalance)}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${authorizedCashRegisters.length} caisses</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Opérations Enregistrées</h3>
                        <p class="text-4xl font-bold text-info">${stats.entries || 0}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Ce mois-ci</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mes Caisses (${userCompany.name})</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom de la Caisse</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                ${authorizedCashRegisters.map(reg => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${reg.name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${formatCurrency(reg.balance || 0)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">
                                                ${reg.status}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Opérations de Caisse</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onclick="renderCashOperations()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-success hover:bg-success-dark">
                            <i class="fas fa-hand-holding-usd mr-2"></i> Enregistrer une opération
                        </button>
                        <button onclick="renderCashMovementHistory()" class="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md bg-info hover:bg-info-dark">
                            <i class="fas fa-history mr-2"></i> Voir l'historique
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('❌ Erreur renderCaissierDashboard:', error);
            return '<p class="text-red-600">Erreur lors du chargement du tableau de bord caissier.</p>';
        }
    }

    // =============================================================================
    // PLACEHOLDER FUNCTIONS - FONCTIONS PLACEHOLDERS
    // =============================================================================
    function renderCompanyManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les entreprises')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des entreprises</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderUserManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les utilisateurs')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des utilisateurs</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderAccountPlan() {
        if (!SecurityManager.enforceCompanySelection('consulter le plan comptable')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Plan Comptable SYSCOHADA</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderEntriesManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les écritures')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des Écritures Comptables</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderCashRegisterManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les caisses')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des Caisses</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderReports() {
        if (!SecurityManager.enforceCompanySelection('générer les rapports')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Rapports et analyses</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderNotifications() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Notifications</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderManagedCollaborators() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Collaborateurs</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderValidationEntries() {
        if (!SecurityManager.enforceCompanySelection('valider les écritures')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Validation des Écritures</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderAccountConsultation() {
        if (!SecurityManager.enforceCompanySelection('consulter les comptes')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Consultation des Comptes</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderUserReports() {
        if (!SecurityManager.enforceCompanySelection('consulter mes rapports')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Rapports</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderCashFlowTracking() {
        if (!SecurityManager.enforceCompanySelection('suivre la trésorerie')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Suivi de Trésorerie</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderCashOperations() {
        if (!SecurityManager.enforceCompanySelection('effectuer des opérations de caisse')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Opérations de Caisse</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    function renderCashMovementHistory() {
        if (!SecurityManager.enforceCompanySelection('consulter l\'historique des mouvements de caisse')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Historique des Mouvements de Caisse</h2>
            <p class="text-gray-700 dark:text-gray-300">Fonctionnalité en cours de développement...</p>
        `;
    }

    // =============================================================================
    // UTILITY FUNCTIONS - FONCTIONS UTILITAIRES
    // =============================================================================
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-translate-x-full');
    }

    function toggleNotificationsPanel() {
        document.getElementById('notificationsPanel').classList.toggle('hidden');
    }

    function toggleThemeMenu() {
        document.getElementById('themeMenu').classList.toggle('hidden');
    }

    function setTheme(theme) {
        themeManager.setTheme(theme);
        document.getElementById('themeMenu').classList.add('hidden');
    }

    function showCompanySelectionWarning(operation) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="bg-warning/10 border border-warning text-warning p-4 rounded-md" role="alert">
                <p class="font-bold mb-2">Sélection d'entreprise requise !</p>
                <p>Veuillez sélectionner une entreprise dans le menu déroulant en haut pour pouvoir ${operation}.</p>
            </div>
        `;
        console.warn(`⚠️ Opération bloquée: Sélection d'entreprise requise pour ${operation}.`);
    }

    function uploadLogo() {
        alert('Fonctionnalité d\'upload de logo non implémentée.');
        console.log('Admin a tenté d\'uploader un logo.');
    }

    // =============================================================================
    // EVENT LISTENERS - ÉCOUTEURS D'ÉVÉNEMENTS
    // =============================================================================
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Initialisation de l\'application DOUKÈ Compta Pro');
        
        try {
            initializeData();
            themeManager.init();

            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

            console.log('✅ Application initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
        }
    });

    // Fermer les panels si on clique à l'extérieur
    window.onclick = function(event) {
        if (!event.target.matches('.fa-bell') && !event.target.closest('#notificationsPanel') && 
            !event.target.matches('.fa-palette') && !event.target.closest('#themeMenu')) {
            const notificationsPanel = document.getElementById('notificationsPanel');
            const themeMenu = document.getElementById('themeMenu');
            if (notificationsPanel && !notificationsPanel.classList.contains('hidden')) {
                notificationsPanel.classList.add('hidden');
            }
            if (themeMenu && !themeMenu.classList.contains('hidden')) {
                themeMenu.classList.add('hidden');
            }
        }
    };
</script>
</body>
</html>
