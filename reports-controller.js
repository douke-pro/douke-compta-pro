// =============================================================================
// DOUKÈ Compta Pro - Contrôleur de génération de rapports SYSCOHADA v3.1
// =============================================================================

class ReportsController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.reportTypes = {
            'bilan': 'Bilan SYSCOHADA',
            'tafire': 'TAFIRE',
            'compte_resultat': 'Compte de Résultat',
            'grand_livre': 'Grand Livre',
            'balance': 'Balance des Comptes',
            'journal': 'Journal Général',
            'cash_flow': 'Tableau de Flux de Trésorerie',
            'annexes': 'Notes Annexes'
        };
        
        console.log('📊 ReportsController initialisé');
    }

    // Charger la page des rapports
    loadReportsPage() {
        if (this.security.requiresCompanySelection(window.app.currentProfile) && !window.app.currentCompanyId) {
            document.getElementById('mainContent').innerHTML = this.generateCompanySelectionRequired();
            return;
        }

        const companyName = this.getSelectedCompanyName();
        const stats = this.getCompanyStatistics();
        const isCashier = window.app.currentProfile === 'caissier';

        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            ${isCashier ? 'État Caisse' : 'Rapports & États SYSCOHADA'}
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-chart-bar mr-2"></i>SYSCOHADA Révisé
                        </div>
                        <button onclick="window.reportsController.generateAllReports()" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-download mr-2"></i>Exporter Tout
                        </button>
                    </div>
                </div>

                ${!isCashier ? `
                <!-- États financiers principaux -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-balance-scale mr-2 text-primary"></i>États Financiers Principaux
                        </h3>
                        <div class="space-y-3">
                            <button onclick="window.reportsController.generateBilan()" 
                                    class="w-full text-left p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-primary">Bilan SYSCOHADA</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Situation patrimoniale au ${new Date().toLocaleDateString('fr-FR')}</div>
                                    </div>
                                    <i class="fas fa-file-pdf text-primary text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateTafire()" 
                                    class="w-full text-left p-4 bg-info/10 hover:bg-info/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-info">TAFIRE</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Tableau Financier des Ressources et Emplois</div>
                                    </div>
                                    <i class="fas fa-file-excel text-info text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateCompteResultat()" 
                                    class="w-full text-left p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-success">Compte de Résultat</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Charges et produits de l'exercice</div>
                                    </div>
                                    <i class="fas fa-chart-line text-success text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateCashFlow()" 
                                    class="w-full text-left p-4 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-warning">Tableau de Flux</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Flux de trésorerie par activité</div>
                                    </div>
                                    <i class="fas fa-exchange-alt text-warning text-xl"></i>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-list mr-2 text-warning"></i>États Détaillés
                        </h3>
                        <div class="space-y-3">
                            <button onclick="window.reportsController.generateGrandLivre()" 
                                    class="w-full text-left p-4 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-warning">Grand Livre</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Mouvements détaillés par compte</div>
                                    </div>
                                    <i class="fas fa-book text-warning text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateBalance()" 
                                    class="w-full text-left p-4 bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-danger">Balance des Comptes</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Soldes et mouvements par compte</div>
                                    </div>
                                    <i class="fas fa-calculator text-danger text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateJournal()" 
                                    class="w-full text-left p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-gray-700 dark:text-gray-300">Journal Général</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Chronologie des écritures</div>
                                    </div>
                                    <i class="fas fa-clipboard-list text-gray-500 text-xl"></i>
                                </div>
                            </button>
                            
                            <button onclick="window.reportsController.generateAnnexes()" 
                                    class="w-full text-left p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-medium text-purple-700 dark:text-purple-300">Notes Annexes</div>
                                        <div class="text-sm text-gray-600 dark:text-gray-400">Informations complémentaires</div>
                                    </div>
                                    <i class="fas fa-sticky-note text-purple-500 text-xl"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Statistiques rapides -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <div class="text-3xl font-bold text-primary">${stats?.entries.total || 0}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total écritures</div>
                        <div class="text-xs text-primary mt-1">Période courante</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <div class="text-3xl font-bold text-success">${stats?.entries.validated || 0}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Écritures validées</div>
                        <div class="text-xs text-success mt-1">${stats?.entries.total > 0 ? ((stats.entries.validated / stats.entries.total) * 100).toFixed(1) : 0}%</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <div class="text-3xl font-bold text-warning">${stats?.entries.pending || 0}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">En attente</div>
                        <div class="text-xs text-warning mt-1">À valider</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                        <div class="text-2xl font-bold text-info">${stats?.cashRegisters.totalBalance?.toLocaleString('fr-FR') || 0}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Solde caisses (FCFA)</div>
                        <div class="text-xs text-info mt-1">Disponible</div>
                    </div>
                </div>

                <!-- Rapports par journal -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rapports par Journal</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        ${['JG', 'JA', 'JV', 'JB', 'JC', 'JOD'].map(journal => `
                            <button onclick="window.reportsController.generateJournalReport('${journal}')" 
                                    class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow text-center">
                                <div class="text-2xl font-bold text-primary">${stats?.entries.byJournal[journal] || 0}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">${journal}</div>
                                <div class="text-xs text-primary mt-1">Générer</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Rapports personnalisés -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rapports Personnalisés</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="window.reportsController.showCustomReportModal()" 
                                class="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center">
                            <i class="fas fa-plus text-2xl text-gray-400 mb-2 block"></i>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Nouveau rapport</div>
                        </button>
                        
                        <button onclick="window.reportsController.generateAnalyticsReport()" 
                                class="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors">
                            <i class="fas fa-chart-pie text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Analyse Financière</div>
                            <div class="text-xs opacity-80">Ratios et indicateurs</div>
                        </button>
                        
                        <button onclick="window.reportsController.generateTrendReport()" 
                                class="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors">
                            <i class="fas fa-trending-up text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Évolution</div>
                            <div class="text-xs opacity-80">Tendances mensuelles</div>
                        </button>
                        
                        <button onclick="window.reportsController.generateComparisonReport()" 
                                class="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors">
                            <i class="fas fa-balance-scale-right text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Comparaison</div>
                            <div class="text-xs opacity-80">Exercices antérieurs</div>
                        </button>
                    </div>
                </div>
                ` : `
                <!-- Rapports caissier -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-cash-register mr-2 text-warning"></i>Rapports Caisse
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onclick="window.reportsController.generateMyCashReport()" 
                                class="p-6 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-left">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-file-alt text-primary text-2xl"></i>
                                <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Ma caisse</span>
                            </div>
                            <div class="font-medium text-gray-900 dark:text-white">État de Ma Caisse</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Situation actuelle et mouvements du jour</div>
                        </button>
                        
                        <button onclick="window.reportsController.generateCashHistory()" 
                                class="p-6 bg-info/10 hover:bg-info/20 rounded-lg transition-colors text-left">
                            <div class="flex items-center justify-between mb-2">
                                <i class="fas fa-history text-info text-2xl"></i>
                                <span class="text-xs bg-info/20 text-info px-2 py-1 rounded">Historique</span>
                            </div>
                            <div class="font-medium text-gray-900 dark:text-white">Historique des Opérations</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Toutes les opérations de la période</div>
                        </button>
                    </div>
                </div>
                `}
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
    }

    // Génération du Bilan SYSCOHADA
    generateBilan() {
        window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation du Bilan SYSCOHADA...');
        
        setTimeout(() => {
            const bilanData = this.calculateBilan();
            this.showBilanModal(bilanData);
        }, 2000);
    }

    // Calcul du Bilan SYSCOHADA
    calculateBilan() {
        const accounts = this.data.getCompanyAccounts(window.app.currentCompanyId);
        const entries = this.data.getCompanyEntries(window.app.currentCompanyId).filter(e => e.status === 'Validé');
        
        const actif = {
            immobilisations: this.calculateAccountsBalance(accounts, entries, ['2']),
            stocks: this.calculateAccountsBalance(accounts, entries, ['3']),
            creances: this.calculateAccountsBalance(accounts, entries, ['4'], 'debit'),
            tresorerie: this.calculateAccountsBalance(accounts, entries, ['5'])
        };
        
        const passif = {
            capitaux: this.calculateAccountsBalance(accounts, entries, ['1']),
            dettes: this.calculateAccountsBalance(accounts, entries, ['4'], 'credit'),
            resultat: this.calculateAccountsBalance(accounts, entries, ['6', '7'])
        };
        
        return {
            actif,
            passif,
            totalActif: Object.values(actif).reduce((sum, val) => sum + val, 0),
            totalPassif: Object.values(passif).reduce((sum, val) => sum + val, 0),
            date: new Date().toLocaleDateString('fr-FR'),
            exercice: new Date().getFullYear()
        };
    }

    // Modal d'affichage du Bilan
    showBilanModal(bilanData) {
        const modalContent = `
            <div class="space-y-6">
                <!-- En-tête -->
                <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">BILAN SYSCOHADA</h2>
                    <p class="text-gray-600 dark:text-gray-400">${this.getSelectedCompanyName()}</p>
                    <p class="text-sm text-gray-500">Exercice ${bilanData.exercice} - Arrêté au ${bilanData.date}</p>
                </div>

                <!-- Bilan -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- ACTIF -->
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">ACTIF</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-sm">Actif immobilisé</span>
                                <span class="font-mono">${bilanData.actif.immobilisations.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm">Stocks et en-cours</span>
                                <span class="font-mono">${bilanData.actif.stocks.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm">Créances et emplois assimilés</span>
                                <span class="font-mono">${bilanData.actif.creances.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm">Trésorerie-Actif</span>
                                <span class="font-mono">${bilanData.actif.tresorerie.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="border-t border-blue-200 dark:border-blue-700 pt-2">
                                <div class="flex justify-between font-bold">
                                    <span>TOTAL ACTIF</span>
                                    <span class="font-mono">${bilanData.totalActif.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PASSIF -->
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">PASSIF</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-sm">Capitaux propres et ressources assimilées</span>
                                <span class="font-mono">${bilanData.passif.capitaux.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm">Dettes financières et ressources assimilées</span>
                                <span class="font-mono">${bilanData.passif.dettes.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-sm">Résultat net de l'exercice</span>
                                <span class="font-mono">${bilanData.passif.resultat.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="border-t border-green-200 dark:border-green-700 pt-2">
                                <div class="flex justify-between font-bold">
                                    <span>TOTAL PASSIF</span>
                                    <span class="font-mono">${bilanData.totalPassif.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Équilibre -->
                <div class="text-center p-4 ${bilanData.totalActif === bilanData.totalPassif ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'} rounded-lg">
                    <p class="font-semibold ${bilanData.totalActif === bilanData.totalPassif ? 'text-success' : 'text-danger'}">
                        ${bilanData.totalActif === bilanData.totalPassif ? '✓ Bilan équilibré' : '⚠ Bilan déséquilibré'}
                    </p>
                    ${bilanData.totalActif !== bilanData.totalPassif ? `
                    <p class="text-sm text-danger mt-1">
                        Écart: ${Math.abs(bilanData.totalActif - bilanData.totalPassif).toLocaleString('fr-FR')} FCFA
                    </p>
                    ` : ''}
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div class="flex space-x-3">
                        <button onclick="window.reportsController.exportBilan()"
                                class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                            <i class="fas fa-download mr-2"></i>Exporter PDF
                        </button>
                        <button onclick="window.reportsController.printBilan()"
                                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                            <i class="fas fa-print mr-2"></i>Imprimer
                        </button>
                    </div>
                    <button onclick="window.unifiedManager.modalManager.hide()"
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Fermer
                    </button>
                </div>
            </div>
        `;

        window.unifiedManager.modalManager.show('Bilan SYSCOHADA', modalContent, { size: 'large' });
        window.unifiedManager.notificationManager.show('success', 'Bilan généré', 'Le bilan SYSCOHADA a été généré avec succès');
    }

    // Méthodes de génération des autres rapports
    generateTafire() {
        window.unifiedManager.notificationManager.show('info', 'TAFIRE', 'Génération du Tableau Financier des Ressources et Emplois...');
        // Implémenter la génération du TAFIRE
    }

    generateCompteResultat() {
        window.unifiedManager.notificationManager.show('info', 'Compte de Résultat', 'Génération du compte de résultat...');
        // Implémenter la génération du compte de résultat
    }

    generateGrandLivre() {
        window.unifiedManager.notificationManager.show('info', 'Grand Livre', 'Génération du grand livre...');
        // Implémenter la génération du grand livre
    }

    generateBalance() {
        window.unifiedManager.notificationManager.show('info', 'Balance', 'Génération de la balance des comptes...');
        // Implémenter la génération de la balance
    }

    generateJournal() {
        window.unifiedManager.notificationManager.show('info', 'Journal', 'Génération du journal général...');
        // Implémenter la génération du journal
    }

    generateAllReports() {
        window.unifiedManager.notificationManager.show('info', 'Export global', 'Génération de tous les rapports en cours...');
        // Implémenter l'export global
    }

    // Méthodes utilitaires
    calculateAccountsBalance(accounts, entries, classes, nature = null) {
        let balance = 0;
        
        accounts.forEach(account => {
            if (classes.includes(account.code.charAt(0))) {
                entries.forEach(entry => {
                    entry.lines.forEach(line => {
                        if (line.account === account.code) {
                            if (!nature) {
                                balance += (line.debit || 0) - (line.credit || 0);
                            } else if (nature === 'debit') {
                                balance += (line.debit || 0);
                            } else if (nature === 'credit') {
                                balance += (line.credit || 0);
                            }
                        }
                    });
                });
            }
        });
        
        return balance;
    }

    getCompanyStatistics() {
        if (!window.app.currentCompanyId) return null;
        
        const entries = this.data.getCompanyEntries(window.app.currentCompanyId);
        const cashRegisters = this.data.getCompanyCashRegisters(window.app.currentCompanyId);
        
        return {
            entries: {
                total: entries.length,
                validated: entries.filter(e => e.status === 'Validé').length,
                pending: entries.filter(e => e.status === 'En attente').length,
                byJournal: entries.reduce((acc, entry) => {
                    acc[entry.journal] = (acc[entry.journal] || 0) + 1;
                    return acc;
                }, {})
            },
            cashRegisters: {
                total: cashRegisters.length,
                totalBalance: cashRegisters.reduce((sum, cash) => sum + (cash.balance || 0), 0)
            }
        };
    }

    getSelectedCompanyName() {
        if (!window.app.currentCompanyId) return 'Aucune entreprise';
        const company = window.app.companies.find(c => c.id === window.app.currentCompanyId);
        return company ? company.name : 'Entreprise inconnue';
    }

    generateCompanySelectionRequired() {
        return `
            <div class="text-center p-8">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-building text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Sélection d'entreprise requise</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2 mb-6">Sélectionnez une entreprise dans la barre latérale pour accéder aux rapports.</p>
                <button onclick="window.unifiedManager.loadCompaniesPage()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <i class="fas fa-building mr-2"></i>Sélectionner une entreprise
                </button>
            </div>
        `;
    }
}

// Export de la classe
window.ReportsController = ReportsController;

console.log('📦 Module ReportsController chargé');
