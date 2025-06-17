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
            <div id="appLogo" class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
                        <div id="appLogo" class="w-8 h-8 bg-primary text-white rounded flex items-center justify-center">
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
    // DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT INTÉGRALE CORRIGÉE
    // Système de gestion comptable SYSCOHADA Révisé - VERSION ROBUSTE ET SÉCURISÉE
    // =============================================================================

    // =============================================================================
    // APPLICATION STATE - ÉTAT GLOBAL DE L'APPLICATION
    // =============================================================================
    const app = {
        currentProfile: null,
        currentCompany: null, // ID de l'entreprise sélectionnée
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
            trends: {}
        }
    };

    // =============================================================================
    // THEME MANAGEMENT - GESTION DU THÈME
    // =============================================================================
    const themeManager = {
        current: 'system',

        init() {
            try {
                if (localStorage.getItem('theme') === 'dark' ||
                    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    this.current = 'dark';
                } else if (localStorage.getItem('theme') === 'light') {
                    document.documentElement.classList.remove('dark');
                    this.current = 'light';
                } else {
                    this.current = 'system';
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
                    localStorage.setItem('theme', 'dark');
                } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                } else {
                    localStorage.removeItem('theme');
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
    // SECURITY & ACCESS CONTROL - SÉCURITÉ ET CONTRÔLE D'ACCÈS CORRIGÉ
    // =============================================================================
    const SecurityManager = {
        // ✅ CORRIGÉ : Vérifier l'accès à une entreprise pour l'utilisateur actuel
        canAccessCompany(companyId) {
            try {
                if (!app.currentUser || !companyId) return false;

                // Admin peut accéder à toutes les entreprises
                if (app.currentProfile === 'admin') return true;

                // Utilisateur et Caissier : une seule entreprise prédéfinie
                if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    return userCompanies.length === 1 && userCompanies[0] == companyId;
                }

                // Collaborateurs : entreprises assignées
                if (app.currentProfile.includes('collaborateur')) {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    return userCompanies.includes(parseInt(companyId));
                }

                return false;
            } catch (error) {
                console.error('❌ Erreur canAccessCompany:', error);
                return false;
            }
        },

        // ✅ CORRIGÉ : Obtenir les entreprises autorisées pour un utilisateur
        getUserCompanies(userId) {
            try {
                const user = app.users.find(u => u.id === userId);
                if (!user) return [];

                // Utilisateur et Caissier : une seule entreprise prédéfinie
                if (user.profile === 'user') return [1]; // SARL TECH INNOVATION
                if (user.profile === 'caissier') return [2]; // SA COMMERCE PLUS

                return user.companies || [];
            } catch (error) {
                console.error('❌ Erreur getUserCompanies:', error);
                return [];
            }
        },

        // ✅ CORRIGÉ : Filtrer les données par entreprise autorisée
        getAuthorizedEntries() {
            try {
                if (app.currentProfile === 'admin' && app.currentCompany) {
                    return app.entries.filter(e => e.companyId == app.currentCompany);
                }

                if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    return app.entries.filter(e => userCompanies.includes(e.companyId));
                }

                if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    if (userCompanies.includes(parseInt(app.currentCompany))) {
                        return app.entries.filter(e => e.companyId == app.currentCompany);
                    }
                }
                // Si aucune entreprise n'est sélectionnée ou pas d'accès, retourner vide
                return [];
            } catch (error) {
                console.error('❌ Erreur getAuthorizedEntries:', error);
                return [];
            }
        },

        // ✅ CORRIGÉ : Obtenir les caisses autorisées
        getAuthorizedCashRegisters() {
            try {
                if (app.currentProfile === 'admin' && app.currentCompany) {
                    return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
                }

                if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    return app.cashRegisters.filter(c => userCompanies.includes(c.companyId));
                }

                if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
                    const userCompanies = this.getUserCompanies(app.currentUser.id);
                    if (userCompanies.includes(parseInt(app.currentCompany))) {
                        return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
                    }
                }
                // Si aucune entreprise n'est sélectionnée ou pas d'accès, retourner vide
                return [];
            } catch (error) {
                console.error('❌ Erreur getAuthorizedCashRegisters:', error);
                return [];
            }
        },

        // ✅ CORRIGÉ : Vérifier si l'utilisateur doit sélectionner une entreprise
        requiresCompanySelection() {
            try {
                // Seuls les admin et collaborateurs ont besoin de sélectionner une entreprise
                // Les utilisateurs et caissiers ont une entreprise auto-assignée
                return (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur'))
                    && !app.currentCompany;
            } catch (error) {
                console.error('❌ Erreur requiresCompanySelection:', error);
                return false;
            }
        },

        // ✅ CORRIGÉ : Forcer la sélection d'entreprise avec logique améliorée
        enforceCompanySelection(operation) {
            try {
                // Ne jamais bloquer les utilisateurs et caissiers (entreprise auto-assignée)
                if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                    return true;
                }

                // Pour admin et collaborateurs, vérifier la sélection
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
    // STATISTICS MANAGER - GESTIONNAIRE DE STATISTIQUES AUTO-MISE À JOUR
    // =============================================================================
    const StatisticsManager = {
        // ✅ CORRIGÉ : Mettre à jour toutes les statistiques avec gestion d'erreurs
        updateAllStatistics() {
            try {
                this.updateBasicStats();
                this.updateTrends();
                this.updateFinancialMetrics();
                app.statistics.lastUpdate = new Date();
                console.log('📊 Statistiques mises à jour avec succès');
            } catch (error) {
                console.error('❌ Erreur mise à jour statistiques:', error);
            }
        },

        // Statistiques de base
        updateBasicStats() {
            try {
                const authorizedEntries = SecurityManager.getAuthorizedEntries();
                const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();

                app.statistics.totals = {
                    companies: this.getCompanyCount(),
                    users: app.users.length,
                    activeUsers: app.users.filter(u => u.status === 'Actif').length,
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

        // Tendances et évolutions
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

        // Métriques financières
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

        // Calculer le nombre d'entreprises accessibles
        getCompanyCount() {
            try {
                if (app.currentProfile === 'admin') {
                    return app.companies.length;
                }

                if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                    return 1; // Une seule entreprise
                }

                return SecurityManager.getUserCompanies(app.currentUser.id).length;
            } catch (error) {
                console.error('❌ Erreur getCompanyCount:', error);
                return 0;
            }
        },

        // Calculer le total des débits
        calculateTotalDebit(entries) {
            try {
                return entries.reduce((total, entry) => {
                    return total + entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateTotalDebit:', error);
                return 0;
            }
        },

        // Calculer le total des crédits
        calculateTotalCredit(entries) {
            try {
                return entries.reduce((total, entry) => {
                    return total + entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateTotalCredit:', error);
                return 0;
            }
        },

        // Calculer le taux de croissance
        calculateGrowthRate(current, previous) {
            try {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            } catch (error) {
                console.error('❌ Erreur calculateGrowthRate:', error);
                return 0;
            }
        },

        // Calculer le taux de validation
        calculateValidationRate(entries) {
            try {
                if (entries.length === 0) return 100;
                const validated = entries.filter(e => e.status === 'Validé').length;
                return Math.round((validated / entries.length) * 100);
            } catch (error) {
                console.error('❌ Erreur calculateValidationRate:', error);
                return 0;
            }
        },

        // Calculer le temps moyen de traitement
        calculateAverageProcessingTime(entries) {
            try {
                const processedEntries = entries.filter(e => e.status === 'Validé');
                if (processedEntries.length === 0) return 0;

                // Simulation du temps de traitement (en heures)
                return Math.round(processedEntries.length * 2.5 / processedEntries.length);
            } catch (error) {
                console.error('❌ Erreur calculateAverageProcessingTime:', error);
                return 0;
            }
        },

        // Calculer le progrès mensuel
        calculateMonthlyProgress(monthEntries) {
            try {
                const targetMonthly = 100; // Objectif mensuel
                return Math.min(100, Math.round((monthEntries.length / targetMonthly) * 100));
            } catch (error) {
                console.error('❌ Erreur calculateMonthlyProgress:', error);
                return 0;
            }
        },

        // Calculer la balance
        calculateBalance(entries) {
            try {
                const totalDebit = this.calculateTotalDebit(entries);
                const totalCredit = this.calculateTotalCredit(entries);
                return totalDebit - totalCredit;
            } catch (error) {
                console.error('❌ Erreur calculateBalance:', error);
                return 0;
            }
        },

        // Calculer le flux de trésorerie
        calculateCashFlow(entries) {
            try {
                const cashAccounts = ['571000', '512000', '531000']; // Caisse, Banque, Chèques postaux

                return entries.reduce((flow, entry) => {
                    const cashLines = entry.lines.filter(line => cashAccounts.includes(line.account));
                    return flow + cashLines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
                }, 0);
            } catch (error) {
                console.error('❌ Erreur calculateCashFlow:', error);
                return 0;
            }
        },

        // Obtenir les comptes les plus utilisés
        getTopUsedAccounts(entries) {
            try {
                const accountUsage = {};

                entries.forEach(entry => {
                    entry.lines.forEach(line => {
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

        // Obtenir la distribution par journal
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

        // Obtenir le nom d'un compte
        getAccountName(code) {
            try {
                const account = app.accounts.find(acc => acc.code === code);
                return account ? account.name : 'Compte inconnu';
            } catch (error) {
                console.error('❌ Erreur getAccountName:', error);
                return 'Compte inconnu';
            }
        },

        // Formater les statistiques pour l'affichage
        getFormattedStats() {
            try {
                return {
                    ...app.statistics.totals,
                    ...app.statistics.trends,
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
            // Plan comptable SYSCOHADA Révisé complet
            app.accounts = [
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

            // Entreprises avec restriction d'accès
            app.companies = [
                {
                    id: 1,
                    name: 'SARL TECH INNOVATION',
                    type: 'SARL',
                    status: 'Actif',
                    system: 'Normal',
                    phone: '+225 07 12 34 56 78',
                    address: 'Abidjan, Cocody',
                    cashRegisters: 3
                },
                {
                    id: 2,
                    name: 'SA COMMERCE PLUS',
                    type: 'SA',
                    status: 'Actif',
                    system: 'Normal',
                    phone: '+225 05 98 76 54 32',
                    address: 'Abidjan, Plateau',
                    cashRegisters: 5
                },
                {
                    id: 3,
                    name: 'EURL SERVICES PRO',
                    type: 'EURL',
                    status: 'Période d\'essai',
                    system: 'Minimal',
                    phone: '+225 01 23 45 67 89',
                    address: 'Bouaké Centre',
                    cashRegisters: 2
                },
                {
                    id: 4,
                    name: 'SAS DIGITAL WORLD',
                    type: 'SAS',
                    status: 'Suspendu',
                    system: 'Normal',
                    phone: '+225 07 11 22 33 44',
                    address: 'San-Pédro',
                    cashRegisters: 1
                }
            ];

            // Utilisateurs avec restrictions d'entreprises
            app.users = [
                {
                    id: 1,
                    name: 'Admin Système',
                    email: 'admin@doukecompta.ci',
                    role: 'Administrateur',
                    profile: 'admin',
                    phone: '+225 07 00 00 00 00',
                    companies: [1, 2, 3, 4], // Admin accède à toutes
                    status: 'Actif'
                },
                {
                    id: 2,
                    name: 'Marie Kouassi',
                    email: 'marie.kouassi@cabinet.com',
                    role: 'Collaborateur Senior',
                    profile: 'collaborateur-senior',
                    phone: '+225 07 11 11 11 11',
                    companies: [1, 2, 3], // Entreprises assignées
                    status: 'Actif'
                },
                {
                    id: 3,
                    name: 'Jean Diabaté',
                    email: 'jean.diabate@cabinet.com',
                    role: 'Collaborateur',
                    profile: 'collaborateur',
                    phone: '+225 07 22 22 22 22',
                    companies: [2, 4], // Entreprises assignées
                    status: 'Actif'
                },
                {
                    id: 4,
                    name: 'Amadou Traoré',
                    email: 'atraore@sarltech.ci',
                    role: 'Utilisateur',
                    profile: 'user',
                    phone: '+225 07 33 33 33 33',
                    companies: [1], // Une seule entreprise
                    status: 'Actif'
                },
                {
                    id: 5,
                    name: 'Ibrahim Koné',
                    email: 'ikone@caisse.ci',
                    role: 'Caissier',
                    profile: 'caissier',
                    phone: '+225 07 44 44 44 44',
                    companies: [2], // Une seule entreprise
                    status: 'Actif'
                }
            ];

            // Écritures avec restriction par entreprise
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

            // Caisses par entreprise
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
            console.log('✅ Données initialisées.');
        } catch (error) {
            console.error('❌ Erreur initialisation des données:', error);
        }
    }

    // =============================================================================
    // LOCAL STORAGE MANAGEMENT - GESTION DU STOCKAGE LOCAL
    // =============================================================================
    function saveAppState() {
        try {
            localStorage.setItem('doukeComptaApp', JSON.stringify({
                currentUser: app.currentUser,
                currentProfile: app.currentProfile,
                isAuthenticated: app.isAuthenticated,
                currentCompany: app.currentCompany // Sauvegarder l'entreprise sélectionnée
            }));
            console.log('💾 État de l\'application sauvegardé.');
        } catch (error) {
            console.error('❌ Erreur sauvegarde état:', error);
        }
    }

    function loadAppState() {
        try {
            const savedState = localStorage.getItem('doukeComptaApp');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                app.currentUser = parsedState.currentUser;
                app.currentProfile = parsedState.currentProfile;
                app.isAuthenticated = parsedState.isAuthenticated;
                app.currentCompany = parsedState.currentCompany; // Charger l'entreprise sélectionnée
                console.log('🔁 État de l\'application chargé.', parsedState);

                // Si l'utilisateur était connecté, afficher l'interface principale directement
                if (app.isAuthenticated && app.currentUser) {
                    updateUIForRole();
                }
            } else {
                console.log('ℹ️ Aucun état sauvegardé trouvé.');
            }
        } catch (error) {
            console.error('❌ Erreur chargement état:', error);
            // En cas d'erreur de parsing, nettoyer le localStorage
            localStorage.removeItem('doukeComptaApp');
        }
    }

    // =============================================================================
    // AUTHENTICATION - GESTION DE L'AUTHENTIFICATION
    // =============================================================================
    function handleLogin(event) {
        event.preventDefault();
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value; // Pour démo, mot de passe non utilisé
            console.log(`Tentative de connexion avec Email: ${email}`);

            const user = app.users.find(u => u.email === email);

            if (user) {
                // Pour la démo, pas de vérification de mot de passe. Tout email trouvé est "connecté".
                app.currentUser = user;
                app.currentProfile = user.profile;
                app.isAuthenticated = true;

                // Pour les rôles 'user' et 'caissier', définir directement l'entreprise
                if (user.profile === 'user' || user.profile === 'caissier') {
                    const assignedCompanies = SecurityManager.getUserCompanies(user.id);
                    if (assignedCompanies.length > 0) {
                        app.currentCompany = assignedCompanies[0]; // Assigner la première entreprise
                    }
                } else {
                    app.currentCompany = null; // Réinitialiser pour admin/collaborateur, forcer la sélection
                }

                saveAppState();
                console.log(`✅ Connexion réussie pour ${user.name} (${user.profile}).`);
                updateUIForRole(); // Mettre à jour l'UI après connexion
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
                document.getElementById('loginPassword').value = 'password'; // Mot de passe fictif
                handleLogin({ preventDefault: () => {} }); // Simule la soumission du formulaire
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
            app.currentCompany = null; // Réinitialiser l'entreprise sélectionnée
            saveAppState();
            document.getElementById('mainApp').classList.add('hidden');
            document.getElementById('loginInterface').classList.remove('hidden');
            document.getElementById('loginForm').reset(); // Nettoyer le formulaire
            console.log('🚪 Déconnexion réussie.');
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    // =============================================================================
    // UI RENDERING & DYNAMIC CONTENT - RENDU ET CONTENU DYNAMIQUE
    // =============================================================================

    // Fonction principale pour mettre à jour l'UI après connexion/changement de rôle/entreprise
    function updateUIForRole() {
        try {
            // Cacher la page de connexion, afficher l'application principale
            document.getElementById('loginInterface').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            if (!app.isAuthenticated || !app.currentUser) {
                logout(); // Si pour une raison l'état est incohérent, déconnecter
                return;
            }

            // Mettre à jour les infos utilisateur dans la barre de nav et sidebar
            const userInitials = app.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('currentUser').textContent = app.currentUser.name;
            document.getElementById('sidebarUserName').textContent = app.currentUser.name;
            document.getElementById('sidebarUserRole').textContent = app.currentUser.role;
            document.getElementById('userInitials').textContent = userInitials;

            // Gérer la visibilité du sélecteur d'entreprise et des actions admin
            const companySelectorDiv = document.getElementById('companySelector');
            const adminActionsDiv = document.getElementById('adminActions');
            const activeCompanySelect = document.getElementById('activeCompanySelect');
            const selectedCompanyInfoDiv = document.getElementById('selectedCompanyInfo');

            companySelectorDiv.classList.add('hidden'); // Cacher par défaut
            adminActionsDiv.classList.add('hidden'); // Cacher par défaut

            // Remplir le sélecteur d'entreprise et gérer la visibilité
            if (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) {
                companySelectorDiv.classList.remove('hidden');
                populateCompanySelector();

                // Pré-sélectionner l'entreprise si elle est déjà définie dans l'état
                if (app.currentCompany) {
                    activeCompanySelect.value = app.currentCompany;
                    const selectedCompany = app.companies.find(c => c.id == app.currentCompany);
                    selectedCompanyInfoDiv.textContent = selectedCompany ? selectedCompany.name : '';
                } else {
                    selectedCompanyInfoDiv.textContent = 'Aucune entreprise sélectionnée';
                }

            } else if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
                // Pour ces rôles, l'entreprise est auto-assignée, on l'affiche directement
                const userCompanies = SecurityManager.getUserCompanies(app.currentUser.id);
                if (userCompanies.length > 0) {
                    app.currentCompany = userCompanies[0]; // S'assurer que l'entreprise est définie
                    const company = app.companies.find(c => c.id === app.currentCompany);
                    document.getElementById('currentCompany').textContent = company ? company.name : 'N/A';
                    selectedCompanyInfoDiv.textContent = company ? company.name : 'N/A'; // Également pour la nav bar mobile ou si jamais visible
                } else {
                    document.getElementById('currentCompany').textContent = 'Aucune entreprise assignée';
                }
            }


            if (app.currentProfile === 'admin') {
                adminActionsDiv.classList.remove('hidden');
            }

            // Afficher l'entreprise courante dans la barre de navigation
            if (app.currentCompany) {
                const company = app.companies.find(c => c.id == app.currentCompany);
                document.getElementById('currentCompany').textContent = company ? company.name : '';
            } else {
                document.getElementById('currentCompany').textContent = '';
            }


            // Rendre le menu de navigation en fonction du rôle
            renderNavigationMenu();

            // Rendre le tableau de bord initial pour le rôle
            renderDashboard();

            // Mettre à jour les statistiques
            StatisticsManager.updateAllStatistics();

        } catch (error) {
            console.error('❌ Erreur updateUIForRole:', error);
            alert('Une erreur est survenue lors de la mise à jour de l\'interface. Veuillez recharger la page.');
            logout(); // Déconnecter pour éviter un état incohérent
        }
    }


    // Remplit le sélecteur d'entreprise pour Admin et Collaborateurs
    function populateCompanySelector() {
        const select = document.getElementById('activeCompanySelect');
        select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>'; // Réinitialiser

        const accessibleCompanies = [];
        if (app.currentProfile === 'admin') {
            accessibleCompanies.push(...app.companies);
        } else if (app.currentProfile.includes('collaborateur')) {
            const userCompanyIds = SecurityManager.getUserCompanies(app.currentUser.id);
            app.companies.forEach(company => {
                if (userCompanyIds.includes(company.id)) {
                    accessibleCompanies.push(company);
                }
            });
        }

        accessibleCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            select.appendChild(option);
        });

        // Ajouter l'écouteur d'événements si ce n'est pas déjà fait
        select.removeEventListener('change', handleCompanySelectionChange); // Éviter les duplicatas
        select.addEventListener('change', handleCompanySelectionChange);
    }

    // Gère le changement de sélection d'entreprise
    function handleCompanySelectionChange() {
        const selectedCompanyId = document.getElementById('activeCompanySelect').value;
        app.currentCompany = selectedCompanyId ? parseInt(selectedCompanyId) : null;
        saveAppState(); // Sauvegarder la sélection

        // Mettre à jour l'affichage de l'entreprise courante dans la nav bar
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

        // Re-rendre le tableau de bord avec les données de la nouvelle entreprise
        renderDashboard();
    }


    // Rend le menu de navigation en fonction du rôle
    function renderNavigationMenu() {
        const navMenu = document.getElementById('navigationMenu');
        navMenu.innerHTML = ''; // Nettoyer le menu existant

        const menuItems = {
            'admin': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', action: 'renderDashboard(\'admin\')' },
                { icon: 'fas fa-building', text: 'Gestion des entreprises', action: 'renderCompanyManagement()' },
                { icon: 'fas fa-users', text: 'Gestion des utilisateurs', action: 'renderUserManagement()' },
                { icon: 'fas fa-book', text: 'Plan Comptable', action: 'renderAccountPlan()' },
                { icon: 'fas fa-file-invoice', text: 'Écritures Comptables', action: 'renderEntriesManagement()' },
                { icon: 'fas fa-cash-register', text: 'Gestion des Caisses', action: 'renderCashRegisterManagement()' },
                { icon: 'fas fa-chart-line', text: 'Rapports et analyses', action: 'renderReports()' },
                { icon: 'fas fa-bell', text: 'Notifications', action: 'renderNotifications()' },
                { icon: 'fas fa-cogs', text: 'Paramètres système', action: 'renderSystemSettings()' }
            ],
            'collaborateur-senior': [
                { icon: 'fas fa-tachometer-alt', text: 'Tableau de bord', action: 'renderDashboard(\'collaborateur-senior\')' },
                { icon: 'fas fa-file-invoice', text: 'Écritures Comptables', action: 'renderEntriesManagement()' },
                { icon: 'fas fa-check-double', text: 'Validation des écritures', action: 'renderValidationEntries()' },
                { icon: 'fas fa-chart-line', text: 'Rapports avancés', action: 'renderReports()' },
                { icon: 'fas fa-tasks', text: 'Tâches assignées', action: 'renderAssignedTasks()' }
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

    // Rendre le contenu du tableau de bord selon le rôle
    function renderDashboard(profile = app.currentProfile) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = ''; // Nettoyer le contenu précédent

        // Vérifier si une entreprise doit être sélectionnée
        if (SecurityManager.requiresCompanySelection()) {
            showCompanySelectionWarning('afficher le tableau de bord');
            return; // Arrêter l'affichage du tableau de bord jusqu'à la sélection
        }

        // Mettre à jour les statistiques pour l'entreprise sélectionnée
        StatisticsManager.updateAllStatistics();
        const stats = StatisticsManager.getFormattedStats();

        let dashboardContent = '';
        let title = 'Tableau de bord';

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
        console.log(`✅ Tableau de bord rendu pour le profil: ${profile} (Entreprise: ${app.currentCompany || 'N/A'})`);
    }

    // DASHBOARDS SPÉCIFIQUES AUX RÔLES

    function renderAdminDashboard(stats) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Entreprises</h3>
                    <p class="text-4xl font-bold text-primary">${stats.companies}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Utilisateurs</h3>
                    <p class="text-4xl font-bold text-success">${stats.users}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures Total (Entreprise Sél.)</h3>
                    <p class="text-4xl font-bold text-info">${stats.entries}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistiques Détaillées (Entreprise Sélectionnée)</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Écritures en attente:</strong> <span class="text-warning font-semibold">${stats.pendingEntries}</span></p>
                    <p><strong>Taux de validation:</strong> <span class="text-success font-semibold">${stats.validationRate}%</span></p>
                    <p><strong>Solde Global:</strong> <span class="font-semibold">${formatCurrency(app.statistics.financial.balance)}</span></p>
                    <p><strong>Top 5 Comptes Utilisés:</strong>
                        <ul class="list-disc list-inside ml-2">
                            ${app.statistics.financial.topAccounts.map(acc => `<li>${acc.name} (${acc.count})</li>`).join('')}
                        </ul>
                    </p>
                    <p><strong>Distribution par Journal:</strong>
                        <ul class="list-disc list-inside ml-2">
                            ${Object.entries(app.statistics.financial.journalDistribution).map(([journal, count]) => `<li>${journal}: ${count}</li>`).join('')}
                        </ul>
                    </p>
                    <p><strong>Dernière mise à jour:</strong> ${stats.lastUpdate}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Rapides Administrateur</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onclick="renderCompanyManagement()" class="btn-dashboard bg-primary hover:bg-primary-dark">
                        <i class="fas fa-plus-circle mr-2"></i> Nouvelle Entreprise
                    </button>
                    <button onclick="renderUserManagement()" class="btn-dashboard bg-info hover:bg-info-dark">
                        <i class="fas fa-user-plus mr-2"></i> Ajouter un utilisateur
                    </button>
                    <button onclick="renderReports()" class="btn-dashboard bg-success hover:bg-success-dark">
                        <i class="fas fa-chart-pie mr-2"></i> Générer un rapport global
                    </button>
                </div>
            </div>
            <style>
                .btn-dashboard {
                    @apply w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md;
                }
            </style>
        `;
    }

    function renderCollaborateurSeniorDashboard(stats) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures en Attente (Entreprise Sél.)</h3>
                    <p class="text-4xl font-bold text-warning">${stats.pendingEntries}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Taux de Validation</h3>
                    <p class="text-4xl font-bold text-success">${stats.validationRate}%</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aperçu Financier (Entreprise Sélectionnée)</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Total Débit:</strong> <span class="font-semibold">${formatCurrency(stats.totalDebit)}</span></p>
                    <p><strong>Total Crédit:</strong> <span class="font-semibold">${formatCurrency(stats.totalCredit)}</span></p>
                    <p><strong>Solde Comptable:</strong> <span class="font-semibold">${formatCurrency(app.statistics.financial.balance)}</span></p>
                    <p><strong>Flux de Trésorerie:</strong> <span class="font-semibold">${formatCurrency(app.statistics.financial.cashFlow)}</span></p>
                    <p><strong>Dernière mise à jour:</strong> ${stats.lastUpdate}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Recommandées</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="renderValidationEntries()" class="btn-dashboard bg-warning hover:bg-warning-dark">
                        <i class="fas fa-check-square mr-2"></i> Valider les écritures
                    </button>
                    <button onclick="renderReports()" class="btn-dashboard bg-info hover:bg-info-dark">
                        <i class="fas fa-file-export mr-2"></i> Exporter des rapports
                    </button>
                </div>
            </div>
            <style>
                .btn-dashboard {
                    @apply w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md;
                }
            </style>
        `;
    }

    function renderCollaborateurDashboard(stats) {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mes Écritures Saisies (Entreprise Sél.)</h3>
                    <p class="text-4xl font-bold text-primary">${app.entries.filter(e => e.userId === app.currentUser.id && e.companyId === app.currentCompany).length}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures en Attente de Validation</h3>
                    <p class="text-4xl font-bold text-warning">${stats.pendingEntries}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Progrès Mensuel des Saisies</h3>
                <div class="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
                    <div class="bg-primary h-4 rounded-full" style="width: ${stats.monthlyProgress}%"></div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${stats.monthlyProgress}% de l'objectif atteint ce mois-ci.</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Dernière mise à jour: ${stats.lastUpdate}</p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions Rapides</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="renderEntriesManagement()" class="btn-dashboard bg-success hover:bg-success-dark">
                        <i class="fas fa-edit mr-2"></i> Saisir une nouvelle écriture
                    </button>
                    <button onclick="renderAccountConsultation()" class="btn-dashboard bg-info hover:bg-info-dark">
                        <i class="fas fa-eye mr-2"></i> Consulter les comptes
                    </button>
                </div>
            </div>
            <style>
                .btn-dashboard {
                    @apply w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md;
                }
            </style>
        `;
    }

    function renderUserDashboard(stats) {
        const userCompany = app.companies.find(c => c.id === app.currentCompany) || {name: 'N/A'};
        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aperçu de ${userCompany.name}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Solde de l'entreprise:</strong> <span class="font-semibold">${formatCurrency(app.statistics.financial.balance)}</span></p>
                    <p><strong>Flux de trésorerie récent:</strong> <span class="font-semibold">${formatCurrency(app.statistics.financial.cashFlow)}</span></p>
                    <p><strong>Nombre d'écritures:</strong> <span class="font-semibold">${stats.entries}</span></p>
                    <p><strong>Taux de validation des écritures:</strong> <span class="font-semibold">${stats.validationRate}%</span></p>
                    <p><strong>Dernière mise à jour:</strong> ${stats.lastUpdate}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accès Rapide</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="renderUserReports()" class="btn-dashboard bg-info hover:bg-info-dark">
                        <i class="fas fa-file-pdf mr-2"></i> Rapports financiers
                    </button>
                    <button onclick="renderCashFlowTracking()" class="btn-dashboard bg-primary hover:bg-primary-dark">
                        <i class="fas fa-chart-area mr-2"></i> Suivi de Trésorerie
                    </button>
                </div>
            </div>
            <style>
                .btn-dashboard {
                    @apply w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md;
                }
            </style>
        `;
    }

    function renderCaissierDashboard(stats) {
        const userCompany = app.companies.find(c => c.id === app.currentCompany) || {name: 'N/A'};
        const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
        const totalCashBalance = authorizedCashRegisters.reduce((sum, reg) => sum + reg.balance, 0);

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Solde Total des Caisses (${userCompany.name})</h3>
                    <p class="text-4xl font-bold text-success">${formatCurrency(totalCashBalance)}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Opérations Enregistrées</h3>
                    <p class="text-4xl font-bold text-primary">${SecurityManager.getAuthorizedEntries().length}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Caisses Gérées (${userCompany.name})</h3>
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
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${formatCurrency(reg.balance)}</td>
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
                    <button onclick="renderCashOperations()" class="btn-dashboard bg-success hover:bg-success-dark">
                        <i class="fas fa-hand-holding-usd mr-2"></i> Enregistrer une opération
                    </button>
                    <button onclick="renderCashMovementHistory()" class="btn-dashboard bg-info hover:bg-info-dark">
                        <i class="fas fa-history mr-2"></i> Voir l'historique
                    </button>
                </div>
            </div>
            <style>
                .btn-dashboard {
                    @apply w-full py-3 px-4 rounded-lg font-medium text-white transition-colors duration-200 shadow-md;
                }
            </style>
        `;
    }

    // Fonctions de rendu pour les autres pages (placeholders)
    function renderCompanyManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les entreprises')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des entreprises</h2>
            <p class="text-gray-700 dark:text-gray-300">Contenu de la page de gestion des entreprises pour l'administrateur. Actuellement sélectionnée: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Liste des Entreprises</h3>
                <ul class="list-disc list-inside space-y-2">
                    ${app.companies.map(c => `<li>${c.name} (${c.type}) - Statut: ${c.status}</li>`).join('')}
                </ul>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est accessible uniquement par les administrateurs.</p>
        `;
        console.log('Page "Gestion des entreprises" rendue.');
    }

    function renderUserManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les utilisateurs')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des utilisateurs</h2>
            <p class="text-gray-700 dark:text-gray-300">Contenu de la page de gestion des utilisateurs. Actuellement sélectionnée: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Liste des Utilisateurs</h3>
                <ul class="list-disc list-inside space-y-2">
                    ${app.users.map(u => `<li>${u.name} (${u.role}) - Email: ${u.email}</li>`).join('')}
                </ul>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est accessible uniquement par les administrateurs.</p>
        `;
        console.log('Page "Gestion des utilisateurs" rendue.');
    }

    function renderAccountPlan() {
        if (!SecurityManager.enforceCompanySelection('consulter le plan comptable')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Plan Comptable SYSCOHADA</h2>
            <p class="text-gray-700 dark:text-gray-300">Visualisation du plan comptable de l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom du Compte</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        ${app.accounts.map(acc => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${acc.code}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${acc.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${acc.category}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Le plan comptable est une référence pour toutes les entreprises.</p>
        `;
        console.log('Page "Plan Comptable" rendue.');
    }

    function renderEntriesManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les écritures')) return;
        const mainContent = document.getElementById('mainContent');
        const authorizedEntries = SecurityManager.getAuthorizedEntries();
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des Écritures Comptables</h2>
            <p class="text-gray-700 dark:text-gray-300">Liste des écritures pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Écritures (${authorizedEntries.length})</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            ${authorizedEntries.length > 0 ? authorizedEntries.map(entry => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${entry.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${entry.journal}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${entry.libelle}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">
                                            ${entry.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucune écriture trouvée pour cette entreprise.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Les collaborateurs et administrateurs peuvent saisir et consulter les écritures.</p>
        `;
        console.log('Page "Écritures Comptables" rendue.');
    }

    function renderCashRegisterManagement() {
        if (!SecurityManager.enforceCompanySelection('gérer les caisses')) return;
        const mainContent = document.getElementById('mainContent');
        const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Gestion des Caisses</h2>
            <p class="text-gray-700 dark:text-gray-300">Liste des caisses pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Caisses (${authorizedCashRegisters.length})</h3>
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
                            ${authorizedCashRegisters.length > 0 ? authorizedCashRegisters.map(reg => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${reg.name}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${formatCurrency(reg.balance)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">
                                            ${reg.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucune caisse trouvée pour cette entreprise.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Les administrateurs et caissiers gèrent les caisses.</p>
        `;
        console.log('Page "Gestion des Caisses" rendue.');
    }

    function renderReports() {
        if (!SecurityManager.enforceCompanySelection('générer les rapports')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Rapports et analyses</h2>
            <p class="text-gray-700 dark:text-gray-300">Génération et consultation des rapports financiers pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Types de Rapports Disponibles</h3>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Balance Générale</li>
                    <li>Compte de Résultat</li>
                    <li>Bilan</li>
                    <li>Grand Livre</li>
                    <li>Journal des Opérations</li>
                </ul>
                <button class="mt-4 bg-info hover:bg-info-dark text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    <i class="fas fa-download mr-2"></i> Télécharger Rapport
                </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Les administrateurs et collaborateurs seniors ont accès à tous les rapports.</p>
        `;
        console.log('Page "Rapports et analyses" rendue.');
    }

    function renderNotifications() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Notifications</h2>
            <p class="text-gray-700 dark:text-gray-300">Consultez ici vos dernières alertes et informations.</p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Alertes Récentes</h3>
                <div class="space-y-3">
                    ${app.notifications.map(n => `
                        <div class="p-3 ${n.type === 'warning' ? 'bg-warning/10' : n.type === 'info' ? 'bg-info/10' : 'bg-success/10'} rounded-lg">
                            <p class="text-sm ${n.type === 'warning' ? 'text-warning' : n.type === 'info' ? 'text-info' : 'text-success'} font-medium">${n.message}</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">${new Date(n.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Chaque rôle reçoit des notifications pertinentes.</p>
        `;
        console.log('Page "Notifications" rendue.');
    }

    function renderSystemSettings() {
        if (!SecurityManager.enforceCompanySelection('modifier les paramètres système')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Paramètres Système</h2>
            <p class="text-gray-700 dark:text-gray-300">Configurations globales de l'application. Actuellement sélectionnée: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Options de configuration</h3>
                <p class="text-gray-700 dark:text-gray-300">
                    Ici, l'administrateur peut configurer des éléments comme les journaux par défaut, les taux de TVA, les périodes comptables, les règles de validation, etc.
                </p>
                <button class="mt-4 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    <i class="fas fa-save mr-2"></i> Enregistrer les paramètres
                </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est uniquement pour les administrateurs.</p>
        `;
        console.log('Page "Paramètres Système" rendue.');
    }

    function renderValidationEntries() {
        if (!SecurityManager.enforceCompanySelection('valider les écritures')) return;
        const mainContent = document.getElementById('mainContent');
        const pendingEntries = SecurityManager.getAuthorizedEntries().filter(e => e.status === 'En attente');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Validation des Écritures</h2>
            <p class="text-gray-700 dark:text-gray-300">Écritures en attente de validation pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Écritures en Attente (${pendingEntries.length})</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant Total</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            ${pendingEntries.length > 0 ? pendingEntries.map(entry => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${entry.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${entry.libelle}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${formatCurrency(StatisticsManager.calculateTotalDebit([entry]))}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onclick="validateEntry(${entry.id})" class="text-success hover:text-success-dark mr-3"><i class="fas fa-check"></i> Valider</button>
                                        <button onclick="rejectEntry(${entry.id})" class="text-danger hover:text-danger-dark"><i class="fas fa-times"></i> Rejeter</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucune écriture en attente.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est principalement pour les collaborateurs seniors et les administrateurs.</p>
        `;
        console.log('Page "Validation des écritures" rendue.');
    }

    function validateEntry(entryId) {
        const entryIndex = app.entries.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            app.entries[entryIndex].status = 'Validé';
            alert(`Écriture ${entryId} validée.`);
            saveAppState();
            renderValidationEntries(); // Re-render the page
            StatisticsManager.updateAllStatistics(); // Update stats
        }
    }

    function rejectEntry(entryId) {
        const entryIndex = app.entries.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            app.entries[entryIndex].status = 'Rejetée'; // Ou un autre statut comme 'Corrigée'
            alert(`Écriture ${entryId} rejetée.`);
            saveAppState();
            renderValidationEntries(); // Re-render the page
            StatisticsManager.updateAllStatistics(); // Update stats
        }
    }

    function renderAssignedTasks() {
        if (!SecurityManager.enforceCompanySelection('consulter les tâches assignées')) return;
        const mainContent = document.getElementById('mainContent');
        const relevantDeadlines = app.deadlines.filter(d => d.status === 'pending' || d.status === 'upcoming');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Tâches Assignées</h2>
            <p class="text-gray-700 dark:text-gray-300">Les échéances et tâches importantes pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Échéances à Venir (${relevantDeadlines.length})</h3>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    ${relevantDeadlines.length > 0 ? relevantDeadlines.map(d => `
                        <li>${d.description} - Date: ${new Date(d.date).toLocaleDateString('fr-FR')} 
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${d.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'}">
                                ${d.status === 'pending' ? 'En attente' : 'À venir'}
                            </span>
                        </li>
                    `).join('') : `<li>Aucune tâche assignée ou échéance à venir.</li>`}
                </ul>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette section est pertinente pour les collaborateurs seniors et administrateurs.</p>
        `;
        console.log('Page "Tâches assignées" rendue.');
    }

    function renderAccountConsultation() {
        if (!SecurityManager.enforceCompanySelection('consulter les comptes')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Consultation des Comptes</h2>
            <p class="text-gray-700 dark:text-gray-300">Consultez le grand livre et les soldes des comptes pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sélectionner un Compte</h3>
                <select id="accountSelect" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="">-- Choisir un compte --</option>
                    ${app.accounts.map(acc => `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`).join('')}
                </select>
                <button onclick="displayAccountDetails()" class="mt-4 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    <i class="fas fa-search mr-2"></i> Afficher Détails
                </button>
                <div id="accountDetails" class="mt-6 text-gray-700 dark:text-gray-300">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Sélectionnez un compte pour voir ses mouvements.</p>
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Les collaborateurs peuvent consulter les comptes.</p>
        `;
        console.log('Page "Consultation des comptes" rendue.');
    }

    function displayAccountDetails() {
        const selectedAccountCode = document.getElementById('accountSelect').value;
        const accountDetailsDiv = document.getElementById('accountDetails');
        if (!selectedAccountCode) {
            accountDetailsDiv.innerHTML = '<p class="text-danger">Veuillez sélectionner un compte.</p>';
            return;
        }

        const account = app.accounts.find(a => a.code === selectedAccountCode);
        const authorizedEntries = SecurityManager.getAuthorizedEntries();
        const accountMovements = authorizedEntries.flatMap(entry =>
            entry.lines.filter(line => line.account === selectedAccountCode)
                      .map(line => ({
                          date: entry.date,
                          journal: entry.journal,
                          piece: entry.piece,
                          libelle: line.libelle || entry.libelle,
                          debit: line.debit || 0,
                          credit: line.credit || 0
                      }))
        );

        let balance = 0;
        const movementsHtml = accountMovements.length > 0 ? accountMovements.map(mov => {
            balance += (mov.debit - mov.credit);
            return `
                <tr>
                    <td class="px-4 py-2 whitespace-nowrap text-sm">${mov.date}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm">${mov.journal}</td>
                    <td class="px-4 py-2 text-sm">${mov.libelle}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-right">${formatCurrency(mov.debit)}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-right">${formatCurrency(mov.credit)}</td>
                    <td class="px-4 py-2 whitespace-nowrap text-sm text-right">${formatCurrency(balance)}</td>
                </tr>
            `;
        }).join('') : `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucun mouvement pour ce compte.</td>
            </tr>
        `;

        accountDetailsDiv.innerHTML = `
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Détails du Compte: ${account.name} (${account.code})</h4>
            <p class="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">Solde Actuel: <span class="font-bold ${balance >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(balance)}</span></p>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Débit</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Crédit</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        ${movementsHtml}
                    </tbody>
                </table>
            </div>
        `;
        console.log(`Détails du compte ${selectedAccountCode} affichés.`);
    }

    function renderUserReports() {
        if (!SecurityManager.enforceCompanySelection('consulter mes rapports')) return;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Mes Rapports</h2>
            <p class="text-gray-700 dark:text-gray-300">Accédez aux rapports financiers de votre entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Rapports Disponibles pour Utilisateur</h3>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Rapport de Solde de Caisse</li>
                    <li>Rapport de Ventes Mensuelles</li>
                    <li>Résumé des Charges</li>
                </ul>
                <button class="mt-4 bg-info hover:bg-info-dark text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    <i class="fas fa-file-download mr-2"></i> Télécharger un rapport
                </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Les utilisateurs ont accès à des rapports spécifiques à leur entreprise.</p>
        `;
        console.log('Page "Mes Rapports" (utilisateur) rendue.');
    }

    function renderCashFlowTracking() {
        if (!SecurityManager.enforceCompanySelection('suivre la trésorerie')) return;
        const mainContent = document.getElementById('mainContent');
        const currentCashFlow = StatisticsManager.calculateCashFlow(SecurityManager.getAuthorizedEntries());
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Suivi de Trésorerie</h2>
            <p class="text-gray-700 dark:text-gray-300">Visualisation des flux de trésorerie de votre entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Situation de Trésorerie Actuelle</h3>
                <p class="text-3xl font-bold ${currentCashFlow >= 0 ? 'text-success' : 'text-danger'} mb-4">
                    ${formatCurrency(currentCashFlow)}
                </p>
                <p class="text-gray-700 dark:text-gray-300">
                    Cette section affiche un graphique (non implémenté ici) des entrées et sorties d'argent au fil du temps.
                </p>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Accessible aux utilisateurs pour un aperçu rapide de la trésorerie.</p>
        `;
        console.log('Page "Suivi Trésorerie" rendue.');
    }

    function renderCashOperations() {
        if (!SecurityManager.enforceCompanySelection('effectuer des opérations de caisse')) return;
        const mainContent = document.getElementById('mainContent');
        const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Opérations de Caisse</h2>
            <p class="text-gray-700 dark:text-gray-300">Enregistrez les entrées et sorties de fonds pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Enregistrer une Nouvelle Opération</h3>
                <form id="cashOperationForm" class="space-y-4">
                    <div>
                        <label for="operationType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type d'opération</label>
                        <select id="operationType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="recette">Recette</option>
                            <option value="depense">Dépense</option>
                        </select>
                    </div>
                    <div>
                        <label for="cashRegister" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Caisse</label>
                        <select id="cashRegister" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            ${authorizedCashRegisters.map(reg => `<option value="${reg.id}">${reg.name} (Solde: ${formatCurrency(reg.balance)})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="operationAmount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Montant</label>
                        <input type="number" id="operationAmount" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label for="operationDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <input type="text" id="operationDescription" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <button type="submit" class="bg-success hover:bg-success-dark text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        <i class="fas fa-check-circle mr-2"></i> Enregistrer
                    </button>
                </form>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est pour les caissiers.</p>
        `;
        document.getElementById('cashOperationForm').addEventListener('submit', handleCashOperation);
        console.log('Page "Opérations de Caisse" rendue.');
    }

    function handleCashOperation(event) {
        event.preventDefault();
        const type = document.getElementById('operationType').value;
        const cashRegisterId = parseInt(document.getElementById('cashRegister').value);
        const amount = parseFloat(document.getElementById('operationAmount').value);
        const description = document.getElementById('operationDescription').value;

        if (isNaN(amount) || amount <= 0) {
            alert('Veuillez entrer un montant valide.');
            return;
        }

        const cashRegister = app.cashRegisters.find(reg => reg.id === cashRegisterId);
        if (!cashRegister) {
            alert('Caisse non trouvée.');
            return;
        }

        if (type === 'recette') {
            cashRegister.balance += amount;
            alert(`Recette de ${formatCurrency(amount)} enregistrée pour la caisse ${cashRegister.name}. Nouveau solde: ${formatCurrency(cashRegister.balance)}`);
        } else if (type === 'depense') {
            if (cashRegister.balance < amount) {
                alert('Solde insuffisant pour cette dépense.');
                return;
            }
            cashRegister.balance -= amount;
            alert(`Dépense de ${formatCurrency(amount)} enregistrée pour la caisse ${cashRegister.name}. Nouveau solde: ${formatCurrency(cashRegister.balance)}`);
        }
        saveAppState();
        StatisticsManager.updateAllStatistics();
        renderCashOperations(); // Re-render to show updated balances
    }


    function renderCashMovementHistory() {
        if (!SecurityManager.enforceCompanySelection('consulter l\'historique des mouvements de caisse')) return;
        const mainContent = document.getElementById('mainContent');
        const authorizedEntries = SecurityManager.getAuthorizedEntries().filter(e =>
            e.lines.some(line => ['571000', '512000', '531000'].includes(line.account)) // Filter for cash/bank accounts
        );
        mainContent.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Historique des Mouvements de Caisse</h2>
            <p class="text-gray-700 dark:text-gray-300">Historique des transactions de caisse et banque pour l'entreprise: <strong>${app.companies.find(c => c.id == app.currentCompany)?.name || 'N/A'}</strong></p>
            <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transactions Récents (${authorizedEntries.length})</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">C/D</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Compte</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            ${authorizedEntries.length > 0 ? authorizedEntries.flatMap(entry =>
                                entry.lines.filter(line => ['571000', '512000', '531000'].includes(line.account)).map(line => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${entry.date}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${line.libelle || entry.libelle}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${line.debit > 0 ? 'D' : 'C'}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${formatCurrency(line.debit || line.credit)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">${line.accountName}</td>
                                    </tr>
                                `)
                            ).join('') : `
                                <tr>
                                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucun mouvement de caisse ou banque trouvé pour cette entreprise.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Cette page est pour les caissiers.</p>
        `;
        console.log('Page "Historique des mouvements" (caissier) rendue.');
    }


    // =============================================================================
    // UTILITY FUNCTIONS - FONCTIONS UTILITAIRES
    // =============================================================================

    // Helper pour formater les montants en devise
    function formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF', // Franc CFA (Afrique de l'Ouest)
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Gérer l'affichage/masquage de la sidebar
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-translate-x-full');
    }

    // Gérer l'affichage/masquage du panneau de notifications
    function toggleNotificationsPanel() {
        document.getElementById('notificationsPanel').classList.toggle('hidden');
    }

    // Gérer l'affichage/masquage du menu de thème
    function toggleThemeMenu() {
        document.getElementById('themeMenu').classList.toggle('hidden');
    }

    // Fonction pour afficher un avertissement de sélection d'entreprise
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

    // Placeholder pour l'upload de logo (pour Admin)
    function uploadLogo() {
        alert('Fonctionnalité d\'upload de logo non implémentée.');
        console.log('Admin a tenté d\'uploader un logo.');
    }


    // =============================================================================
    // EVENT LISTENERS - ÉCOUTEURS D'ÉVÉNEMENTS
    // =============================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initializeData(); // Initialiser les données de l'application
        themeManager.init(); // Initialiser le thème

        // Associer le gestionnaire d'événements au formulaire de connexion
        document.getElementById('loginForm').addEventListener('submit', handleLogin);

        // Associer le toggle de la sidebar
        document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

        // Charger l'état de l'application au démarrage
        loadAppState();
    });

    // Fermer les panels si on clique à l'extérieur
    window.onclick = function(event) {
        if (!event.target.matches('.fa-bell') && !event.target.closest('#notificationsPanel') && !event.target.matches('.fa-palette') && !event.target.closest('#themeMenu')) {
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
