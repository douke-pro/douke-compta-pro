// =============================================================================
// DOUKÈ Compta Pro - Contrôleur des tableaux de bord v3.1
// =============================================================================

class DashboardController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshRate = 60000; // 1 minute
        
        console.log('📊 DashboardController initialisé');
    }

    // Charger le tableau de bord approprié selon le profil
    loadSecureDashboard() {
        const profile = window.app.currentProfile;
        if (!profile) {
            console.error('Aucun profil utilisateur défini');
            return;
        }

        let content = '';

        try {
            switch(profile) {
                case 'admin':
                    content = this.generateAdminDashboard();
                    break;
                case 'collaborateur_senior':
                    content = this.generateSeniorDashboard();
                    break;
                case 'collaborateur':
                    content = this.generateCollaboratorDashboard();
                    break;
                case 'user':
                    content = this.generateUserDashboard();
                    break;
                case 'caissier':
                    content = this.generateCashierDashboard();
                    break;
                default:
                    content = this.generateDefaultDashboard();
            }

            document.getElementById('mainContent').innerHTML = content;
            this.updateSecurityIndicators();
            this.startAutoRefresh();
            
            // Charger les graphiques si nécessaire
            this.loadDashboardCharts(profile);
            
        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
            content = this.generateErrorDashboard();
            document.getElementById('mainContent').innerHTML = content;
        }
    }

    // Tableau de bord administrateur
    generateAdminDashboard() {
        const stats = this.getAppStatistics();
        const recentActivity = this.getRecentActivity();

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                        <p class="text-gray-600 dark:text-gray-400">Vue d'ensemble du système DOUKÈ Compta Pro</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2 text-sm text-danger font-medium bg-danger/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-crown"></i>
                            <span>Accès Total</span>
                        </div>
                        <button onclick="window.dashboardController.refreshDashboard()" 
                                class="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 text-sm">
                            <i class="fas fa-sync-alt mr-1"></i>Actualiser
                        </button>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary hover:shadow-xl transition-all transform hover:scale-105">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.companies.active}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-building text-primary text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-success">+${Math.floor(Math.random() * 3) + 1}</span>
                            <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                        </div>
                        <div class="mt-2">
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: ${(stats.companies.active / stats.companies.total * 100)}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info hover:shadow-xl transition-all transform hover:scale-105">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${(stats.users.byRole['Collaborateur Senior'] || 0) + (stats.users.byRole['Collaborateur'] || 0)}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-users text-info text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-info">100%</span>
                            <span class="text-gray-500 dark:text-gray-400 ml-1">actifs</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning hover:shadow-xl transition-all transform hover:scale-105">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.entries.pending}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2">
                            <button onclick="showPendingEntries()" class="text-xs bg-warning/20 text-warning px-2 py-1 rounded hover:bg-warning/30 transition-colors">
                                Traiter
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success hover:shadow-xl transition-all transform hover:scale-105">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Caisses</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.cashRegisters.total}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-cash-register text-success text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-success">${stats.cashRegisters.totalBalance.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    </div>
                </div>

                <!-- Graphiques et activité récente -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Graphique des écritures -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-chart-line mr-2 text-primary"></i>Évolution des Écritures
                        </h3>
                        <div class="h-64">
                            <canvas id="entriesChart"></canvas>
                        </div>
                    </div>

                    <!-- Activité récente -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-history mr-2 text-info"></i>Activité Récente
                        </h3>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                            ${recentActivity.slice(0, 10).map(activity => `
                                <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <div class="w-8 h-8 ${this.getActivityColor(activity.type)} rounded-full flex items-center justify-center">
                                        <i class="${this.getActivityIcon(activity.type)} text-white text-xs"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-900 dark:text-white">${activity.description}</p>
                                        <p class="text-xs text-gray-500">${this.formatRelativeTime(activity.timestamp)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Actions d'administration -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides
                        </h3>
                        <div class="space-y-3">
                            <button onclick="window.unifiedManager.loadUsersPage()" class="w-full text-left p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                <i class="fas fa-users mr-3 text-primary"></i>Gestion Collaborateurs
                            </button>
                            <button onclick="window.unifiedManager.loadCompaniesPage()" class="w-full text-left p-3 bg-info/10 hover:bg-info/20 rounded-lg transition-colors">
                                <i class="fas fa-building mr-3 text-info"></i>Gestion Entreprises
                            </button>
                            <button onclick="showSecurityAudit()" class="w-full text-left p-3 bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors">
                                <i class="fas fa-shield-alt mr-3 text-danger"></i>Audit de Sécurité
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-chart-bar mr-2 text-success"></i>Rapports Système
                        </h3>
                        <div class="space-y-3">
                            <button onclick="generateGlobalReport()" class="w-full text-left p-3 bg-success/10 hover:bg-success/20 rounded-lg transition-colors">
                                <i class="fas fa-file-pdf mr-3 text-success"></i>Rapport Global
                            </button>
                            <button onclick="exportSystemData()" class="w-full text-left p-3 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors">
                                <i class="fas fa-download mr-3 text-warning"></i>Export Données
                            </button>
                            <button onclick="showSystemHealth()" class="w-full text-left p-3 bg-info/10 hover:bg-info/20 rounded-lg transition-colors">
                                <i class="fas fa-heartbeat mr-3 text-info"></i>État Système
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-cog mr-2 text-gray-500"></i>Statistiques Système
                        </h3>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Utilisateurs:</span>
                                <span class="font-semibold">${stats.users.total}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Entreprises:</span>
                                <span class="font-semibold">${stats.companies.total}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Total Écritures:</span>
                                <span class="font-semibold">${stats.entries.total}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Taux de Validation:</span>
                                <span class="font-semibold text-success">${((stats.entries.validated / stats.entries.total) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Tableau de bord utilisateur
    generateUserDashboard() {
        const companyStats = this.getCompanyStatistics();
        if (!companyStats) {
            return this.generateCompanySelectionRequired();
        }

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Entreprise</h2>
                        <p class="text-gray-600 dark:text-gray-400">${companyStats.companyName}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2 text-sm text-success font-medium bg-success/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-user"></i>
                            <span>Utilisateur</span>
                        </div>
                        <button onclick="window.dashboardController.refreshDashboard()" 
                                class="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 text-sm">
                            <i class="fas fa-sync-alt mr-1"></i>Actualiser
                        </button>
                    </div>
                </div>

                <!-- KPI Cards User -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Écritures</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.entries.total}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-edit text-success text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-success">+${companyStats.entries.thisMonth}</span>
                            <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Mes Caisses</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.cashRegisters.total}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-cash-register text-info text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-info">${companyStats.cashRegisters.open} ouverte(s)</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${companyStats.entries.pending}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-clock text-warning text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2">
                            <button onclick="showPendingEntries()" class="text-xs bg-warning/20 text-warning px-2 py-1 rounded hover:bg-warning/30 transition-colors">
                                Voir détails
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Solde Total</p>
                                <p class="text-xl font-bold text-gray-900 dark:text-white">${(companyStats.cashRegisters.totalBalance || 0).toLocaleString('fr-FR')}</p>
                                <p class="text-xs text-gray-500">FCFA</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-coins text-primary text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions et activité récente -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
                        </h3>
                        <div class="space-y-3">
                            <button onclick="showNewEntryModal()" class="w-full text-left p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                <i class="fas fa-plus mr-3 text-primary"></i>Nouvelle Écriture
                            </button>
                            <button onclick="window.unifiedManager.loadCaissePage()" class="w-full text-left p-3 bg-info/10 hover:bg-info/20 rounded-lg transition-colors">
                                <i class="fas fa-cash-register mr-3 text-info"></i>Gestion Caisses
                            </button>
                            <button onclick="window.unifiedManager.loadReportsPage()" class="w-full text-left p-3 bg-success/10 hover:bg-success/20 rounded-lg transition-colors">
                                <i class="fas fa-chart-bar mr-3 text-success"></i>Mes Rapports
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-history mr-2 text-info"></i>Dernières Écritures
                        </h3>
                        <div class="space-y-2 max-h-80 overflow-y-auto">
                            ${this.getRecentEntries().slice(0, 5).map(entry => `
                                <div class="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <div>
                                        <div class="font-medium text-sm">${entry.libelle}</div>
                                        <div class="text-xs text-gray-500">${new Date(entry.date).toLocaleDateString('fr-FR')} • ${entry.journal}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-mono text-sm">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} F</div>
                                        <div class="text-xs ${entry.status === 'Validé' ? 'text-success' : 'text-warning'}">${entry.status}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-4 text-center">
                            <button onclick="window.unifiedManager.loadEntriesPage()" class="text-primary hover:text-primary/80 text-sm">
                                Voir toutes les écritures →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Tableau de bord caissier
    generateCashierDashboard() {
        if (!window.app.currentCompanyId) {
            return this.generateCompanySelectionRequired();
        }

        const myCashRegisters = this.data.getCompanyCashRegisters(window.app.currentCompanyId).filter(cash =>
            cash.responsibleId === window.app.currentUser.id);

        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Ma Caisse</h2>
                        <p class="text-gray-600 dark:text-gray-400">Gestion quotidienne des opérations de caisse</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2 text-sm text-warning font-medium bg-warning/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-cash-register"></i>
                            <span>Caissier</span>
                        </div>
                        <button onclick="window.dashboardController.refreshDashboard()" 
                                class="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 text-sm">
                            <i class="fas fa-sync-alt mr-1"></i>Actualiser
                        </button>
                    </div>
                </div>

                ${myCashRegisters.length > 0 ? `
                    <!-- État de la caisse principale -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                <i class="fas fa-cash-register mr-2 text-warning"></i>${myCashRegisters[0].name}
                            </h3>
                            <span class="px-3 py-1 rounded-full text-sm ${myCashRegisters[0].status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">
                                ${myCashRegisters[0].status}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div class="text-center p-4 bg-success/10 rounded-lg">
                                <div class="text-2xl font-bold text-success">${(myCashRegisters[0].openingBalance || 0).toLocaleString('fr-FR')} F</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Solde d'ouverture</div>
                            </div>
                            <div class="text-center p-4 bg-info/10 rounded-lg">
                                <div class="text-2xl font-bold text-info">+${(myCashRegisters[0].dailyReceipts || 0).toLocaleString('fr-FR')} F</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Recettes du jour</div>
                            </div>
                            <div class="text-center p-4 bg-warning/10 rounded-lg">
                                <div class="text-2xl font-bold text-warning">-${(myCashRegisters[0].dailyExpenses || 0).toLocaleString('fr-FR')} F</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Dépenses du jour</div>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                            <div class="flex justify-between items-center">
                                <span class="text-primary font-medium text-lg">Solde actuel</span>
                                <span class="text-3xl font-bold text-primary">${(myCashRegisters[0].balance || 0).toLocaleString('fr-FR')} F</span>
                            </div>
                            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Dernière opération: ${myCashRegisters[0].lastOperation ? new Date(myCashRegisters[0].lastOperation).toLocaleString('fr-FR') : 'Aucune'}
                            </div>
                        </div>

                        <!-- Actions rapides caissier -->
                        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onclick="openCashOperation('receipt')" class="bg-success text-white p-4 rounded-lg hover:bg-success/90 transition-colors">
                                <i class="fas fa-arrow-down text-2xl mb-2"></i>
                                <div class="text-sm">Encaissement</div>
                            </button>
                            <button onclick="openCashOperation('expense')" class="bg-danger text-white p-4 rounded-lg hover:bg-danger/90 transition-colors">
                                <i class="fas fa-arrow-up text-2xl mb-2"></i>
                                <div class="text-sm">Décaissement</div>
                            </button>
                            <button onclick="generateCashReport(${myCashRegisters[0].id})" class="bg-info text-white p-4 rounded-lg hover:bg-info/90 transition-colors">
                                <i class="fas fa-print text-2xl mb-2"></i>
                                <div class="text-sm">État Caisse</div>
                            </button>
                            <button onclick="requestCashValidation()" class="bg-warning text-white p-4 rounded-lg hover:bg-warning/90 transition-colors">
                                <i class="fas fa-check-circle text-2xl mb-2"></i>
                                <div class="text-sm">Validation</div>
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-warning mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune caisse assignée</h3>
                        <p class="text-gray-600 dark:text-gray-400">Contactez votre administrateur pour assigner une caisse.</p>
                    </div>
                `}

                <!-- Dernières opérations -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-history mr-2 text-info"></i>Dernières Opérations
                    </h3>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        ${this.getRecentCashOperations().slice(0, 8).map(operation => `
                            <div class="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 ${operation.type === 'receipt' ? 'bg-success' : 'bg-danger'} rounded-full flex items-center justify-center">
                                        <i class="fas ${operation.type === 'receipt' ? 'fa-arrow-down' : 'fa-arrow-up'} text-white text-xs"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-sm">${operation.description}</div>
                                        <div class="text-xs text-gray-500">${new Date(operation.date).toLocaleString('fr-FR')}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-mono text-sm ${operation.type === 'receipt' ? 'text-success' : 'text-danger'}">
                                        ${operation.type === 'receipt' ? '+' : '-'}${operation.amount.toLocaleString('fr-FR')} F
                                    </div>
                                    <div class="text-xs ${operation.status === 'Validé' ? 'text-success' : 'text-warning'}">${operation.status}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ... Continuons avec les autres méthodes
}

// Export et fonctions utilitaires
window.DashboardController = DashboardController;
console.log('📦 Module DashboardController chargé');
