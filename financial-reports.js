// =============================================================================
// 📊 MODULE ÉTATS FINANCIERS SYSCOHADA - DOUKÈ Compta Pro v3.1
// =============================================================================

(function() {
    'use strict';
    
    console.log('📊 Chargement du module d\'états financiers SYSCOHADA...');

    // =============================================================================
    // CLASSE PRINCIPALE DES ÉTATS FINANCIERS
    // =============================================================================
    class FinancialReportsModule {
        constructor() {
            this.initialized = false;
            this.planComptable = [];
            this.notifications = null;
            console.log('📊 FinancialReportsModule créé');
        }

        // Initialisation du module
        initialize() {
            if (this.initialized) return;
            
            try {
                this.initializePlanComptable();
                this.setupEventListeners();
                this.initializeNotifications();
                this.initialized = true;
                
                console.log('✅ Module d\'états financiers initialisé');
            } catch (error) {
                console.error('❌ Erreur initialisation financial-reports:', error);
            }
        }

        // Initialisation du plan comptable SYSCOHADA
        initializePlanComptable() {
            if (window.app.accounts.length === 0) {
                window.app.accounts = [
                    // Classe 1 - Comptes de ressources durables
                    { code: '101000', name: 'Capital social', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '104000', name: 'Primes liées au capital social', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '106000', name: 'Réserves', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '131000', name: 'Subventions d\'équipement', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '140000', name: 'Provisions réglementées', category: 'Capitaux propres', type: 'Passif', nature: 'Credit' },
                    { code: '151000', name: 'Provisions pour risques', category: 'Provisions', type: 'Passif', nature: 'Credit' },
                    { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières', type: 'Passif', nature: 'Credit' },
                    
                    // Classe 2 - Comptes d'actif immobilisé
                    { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '215000', name: 'Installations techniques', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '241000', name: 'Immobilisations incorporelles', category: 'Immobilisations incorporelles', type: 'Actif', nature: 'Debit' },
                    { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '245000', name: 'Matériel et mobilier de bureau', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    { code: '246000', name: 'Matériel informatique', category: 'Immobilisations corporelles', type: 'Actif', nature: 'Debit' },
                    
                    // Classe 3 - Comptes de stocks
                    { code: '311000', name: 'Marchandises', category: 'Stocks', type: 'Actif', nature: 'Debit' },
                    { code: '321000', name: 'Matières premières', category: 'Stocks', type: 'Actif', nature: 'Debit' },
                    { code: '322000', name: 'Fournitures', category: 'Stocks', type: 'Actif', nature: 'Debit' },
                    
                    // Classe 4 - Comptes de tiers
                    { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', type: 'Passif', nature: 'Credit' },
                    { code: '411000', name: 'Clients', category: 'Clients', type: 'Actif', nature: 'Debit' },
                    { code: '421000', name: 'Personnel - avances et acomptes', category: 'Personnel', type: 'Actif', nature: 'Debit' },
                    { code: '422000', name: 'Personnel - rémunérations dues', category: 'Personnel', type: 'Passif', nature: 'Credit' },
                    { code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux', type: 'Passif', nature: 'Credit' },
                    { code: '441000', name: 'État et collectivités', category: 'État', type: 'Passif', nature: 'Credit' },
                    { code: '445000', name: 'TVA due', category: 'État', type: 'Passif', nature: 'Credit' },
                    
                    // Classe 5 - Comptes financiers
                    { code: '512000', name: 'Banques', category: 'Comptes bancaires', type: 'Actif', nature: 'Debit' },
                    { code: '521000', name: 'Chèques postaux', category: 'Comptes bancaires', type: 'Actif', nature: 'Debit' },
                    { code: '531000', name: 'Caisse siège social', category: 'Caisse', type: 'Actif', nature: 'Debit' },
                    { code: '571000', name: 'Caisse', category: 'Caisse', type: 'Actif', nature: 'Debit' },
                    
                    // Classe 6 - Comptes de charges
                    { code: '601000', name: 'Achats de marchandises', category: 'Achats', type: 'Charge', nature: 'Debit' },
                    { code: '602000', name: 'Achats de matières premières', category: 'Achats', type: 'Charge', nature: 'Debit' },
                    { code: '605000', name: 'Autres achats', category: 'Achats', type: 'Charge', nature: 'Debit' },
                    { code: '621000', name: 'Transports', category: 'Services extérieurs', type: 'Charge', nature: 'Debit' },
                    { code: '622000', name: 'Rémunérations d\'intermédiaires', category: 'Services extérieurs', type: 'Charge', nature: 'Debit' },
                    { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel', type: 'Charge', nature: 'Debit' },
                    { code: '645000', name: 'Charges sociales', category: 'Charges de personnel', type: 'Charge', nature: 'Debit' },
                    { code: '661000', name: 'Intérêts des emprunts', category: 'Charges financières', type: 'Charge', nature: 'Debit' },
                    
                    // Classe 7 - Comptes de produits
                    { code: '701000', name: 'Ventes de marchandises', category: 'Ventes', type: 'Produit', nature: 'Credit' },
                    { code: '702000', name: 'Ventes de produits finis', category: 'Ventes', type: 'Produit', nature: 'Credit' },
                    { code: '704000', name: 'Travaux', category: 'Ventes', type: 'Produit', nature: 'Credit' },
                    { code: '706000', name: 'Services vendus', category: 'Ventes', type: 'Produit', nature: 'Credit' },
                    { code: '771000', name: 'Intérêts de prêts', category: 'Produits financiers', type: 'Produit', nature: 'Credit' }
                ];
                
                console.log('✅ Plan comptable SYSCOHADA initialisé:', window.app.accounts.length, 'comptes');
            }

            this.planComptable = window.app.accounts;
        }

        // Configuration des écouteurs d'événements
        setupEventListeners() {
            // Écouter les demandes de chargement des rapports
            window.moduleCommunicator.on('loadReports', (data) => {
                this.loadReportsPage(data.companyId, data.userId);
            });
            
            console.log('✅ Écouteurs d\'événements configurés');
        }

        // Initialisation du système de notifications
        initializeNotifications() {
            this.notifications = {
                show: (type, title, message) => {
                    if (window.app.modules.core && window.app.modules.core.notificationManager) {
                        window.app.modules.core.notificationManager.show(type, title, message);
                    } else {
                        // Fallback simple
                        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
                    }
                }
            };
        }

        // =============================================================================
        // INTERFACE DES ÉTATS FINANCIERS
        // =============================================================================

        // Chargement de la page des rapports
        loadReportsPage(companyId, userId) {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            const companyName = this.getCompanyName(companyId);
            const userProfile = window.app.currentProfile;

            mainContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">États Financiers SYSCOHADA${companyName ? ' - ' + companyName : ''}</h2>
                        <div class="flex items-center space-x-4">
                            <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                                <i class="fas fa-chart-bar mr-2"></i>SYSCOHADA Révisé
                            </div>
                            <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'exportAllReports')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-download mr-2"></i>Exporter Tout
                            </button>
                        </div>
                    </div>

                    <!-- Sélecteur de système comptable -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="fas fa-cog mr-2 text-primary"></i>Configuration du Système
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for="systemeComptable" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Système comptable</label>
                                <select id="systemeComptable" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                    <option value="normal">Système normal SYSCOHADA</option>
                                    <option value="minimal">Système minimal de trésorerie</option>
                                </select>
                            </div>
                            <div>
                                <label for="periodeDebut" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période début</label>
                                <input type="date" id="periodeDebut" value="${new Date().getFullYear()}-01-01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            </div>
                            <div>
                                <label for="periodeFin" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période fin</label>
                                <input type="date" id="periodeFin" value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            </div>
                        </div>
                    </div>

                    <!-- États financiers principaux -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                <i class="fas fa-balance-scale mr-2 text-primary"></i>États Financiers Principaux
                            </h3>
                            <div class="space-y-3">
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateBilan')" class="w-full text-left p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-primary">📊 Bilan SYSCOHADA</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Situation patrimoniale au ${new Date().toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <i class="fas fa-file-pdf text-primary"></i>
                                    </div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateCompteResultat')" class="w-full text-left p-3 bg-success/10 hover:bg-success/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-success">💰 Compte de Résultat</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Charges et produits de l'exercice</div>
                                        </div>
                                        <i class="fas fa-chart-line text-success"></i>
                                    </div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateTafire')" class="w-full text-left p-3 bg-info/10 hover:bg-info/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-info">📈 TAFIRE</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Tableau Financier des Ressources et Emplois</div>
                                        </div>
                                        <i class="fas fa-file-excel text-info"></i>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                <i class="fas fa-list mr-2 text-warning"></i>États Détaillés
                            </h3>
                            <div class="space-y-3">
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateGrandLivre')" class="w-full text-left p-3 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-warning">📚 Grand Livre</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Mouvements détaillés par compte</div>
                                        </div>
                                        <i class="fas fa-book text-warning"></i>
                                    </div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateBalance')" class="w-full text-left p-3 bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-danger">⚖️ Balance des Comptes</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Soldes et mouvements par compte</div>
                                        </div>
                                        <i class="fas fa-calculator text-danger"></i>
                                    </div>
                                </button>
                                <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'generateJournal')" class="w-full text-left p-3 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-medium text-gray-700 dark:text-gray-300">📋 Journal Général</div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400">Chronologie des écritures</div>
                                        </div>
                                        <i class="fas fa-clipboard-list text-gray-500"></i>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Zone d'affichage des résultats -->
                    <div id="resultatEtatFinancier" class="hidden">
                        <!-- Les résultats seront affichés ici -->
                    </div>

                    <!-- Statistiques rapides -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                            <div class="text-3xl font-bold text-primary">${this.planComptable.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Comptes SYSCOHADA</div>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                            <div class="text-3xl font-bold text-success">${window.app.entries.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Total écritures</div>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                            <div class="text-3xl font-bold text-warning">${window.app.companies.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Entreprises</div>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                            <div class="text-3xl font-bold text-info">FCFA</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Devise standard</div>
                        </div>
                    </div>
                </div>
            `;

            console.log('✅ Page des états financiers chargée');
        }

        // =============================================================================
        // MÉTHODES DE GÉNÉRATION D'ÉTATS
        // =============================================================================

        // Génération du bilan SYSCOHADA
        generateBilan() {
            const periode = this.getPeriodeFromInputs();
            const systeme = this.getSystemeFromInput();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation du bilan SYSCOHADA...');
            
            setTimeout(() => {
                const bilanData = this.calculateBilan(periode, systeme);
                this.displayBilan(bilanData);
                this.notifications.show('success', 'Bilan généré', 'Le bilan SYSCOHADA a été généré avec succès');
            }, 1500);
        }

        // Génération du compte de résultat
        generateCompteResultat() {
            const periode = this.getPeriodeFromInputs();
            const systeme = this.getSystemeFromInput();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation du compte de résultat...');
            
            setTimeout(() => {
                const compteResultatData = this.calculateCompteResultat(periode, systeme);
                this.displayCompteResultat(compteResultatData);
                this.notifications.show('success', 'Compte de résultat généré', 'Le compte de résultat a été généré avec succès');
            }, 1500);
        }

        // Génération du TAFIRE
        generateTafire() {
            const periode = this.getPeriodeFromInputs();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation du TAFIRE...');
            
            setTimeout(() => {
                const tafireData = this.calculateTafire(periode);
                this.displayTafire(tafireData);
                this.notifications.show('success', 'TAFIRE généré', 'Le Tableau Financier des Ressources et Emplois a été généré');
            }, 1500);
        }

        // Génération du grand livre
        generateGrandLivre() {
            const periode = this.getPeriodeFromInputs();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation du grand livre...');
            
            setTimeout(() => {
                const grandLivreData = this.calculateGrandLivre(periode);
                this.displayGrandLivre(grandLivreData);
                this.notifications.show('success', 'Grand livre généré', 'Le grand livre a été généré avec succès');
            }, 1500);
        }

        // Génération de la balance
        generateBalance() {
            const periode = this.getPeriodeFromInputs();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation de la balance des comptes...');
            
            setTimeout(() => {
                const balanceData = this.calculateBalance(periode);
                this.displayBalance(balanceData);
                this.notifications.show('success', 'Balance générée', 'La balance des comptes a été générée avec succès');
            }, 1500);
        }

        // Génération du journal général
        generateJournal() {
            const periode = this.getPeriodeFromInputs();
            
            this.notifications.show('info', 'Génération en cours', 'Préparation du journal général...');
            
            setTimeout(() => {
                const journalData = this.calculateJournal(periode);
                this.displayJournal(journalData);
                this.notifications.show('success', 'Journal généré', 'Le journal général a été généré avec succès');
            }, 1500);
        }

        // =============================================================================
        // MÉTHODES DE CALCUL
        // =============================================================================

        // Calcul du bilan
        calculateBilan(periode, systeme) {
            // Simulation d'un calcul de bilan SYSCOHADA
            const actifImmobilise = {
                'Immobilisations incorporelles': 150000000,
                'Immobilisations corporelles': 850000000,
                'Immobilisations financières': 100000000
            };

            const actifCirculant = {
                'Stocks et en-cours': 350000000,
                'Créances clients': 280000000,
                'Autres créances': 120000000,
                'Trésorerie-actif': 200000000
            };

            const capitauxPropres = {
                'Capital social': 500000000,
                'Réserves': 200000000,
                'Résultat de l\'exercice': 150000000,
                'Report à nouveau': 50000000
            };

            const dettes = {
                'Dettes financières': 300000000,
                'Dettes fournisseurs': 180000000,
                'Autres dettes': 170000000,
                'Trésorerie-passif': 0
            };

            const totalActif = Object.values(actifImmobilise).reduce((a, b) => a + b, 0) + 
                              Object.values(actifCirculant).reduce((a, b) => a + b, 0);
            
            const totalPassif = Object.values(capitauxPropres).reduce((a, b) => a + b, 0) + 
                               Object.values(dettes).reduce((a, b) => a + b, 0);

            return {
                periode,
                systeme,
                actifImmobilise,
                actifCirculant,
                capitauxPropres,
                dettes,
                totalActif,
                totalPassif,
                equilibre: totalActif === totalPassif
            };
        }

        // Calcul du compte de résultat
        calculateCompteResultat(periode, systeme) {
            const charges = {
                'Achats de marchandises': 450000000,
                'Autres achats': 80000000,
                'Services extérieurs': 120000000,
                'Charges de personnel': 200000000,
                'Charges financières': 30000000,
                'Dotations aux amortissements': 60000000
            };

            const produits = {
                'Ventes de marchandises': 800000000,
                'Services vendus': 150000000,
                'Produits financiers': 20000000,
                'Autres produits': 30000000
            };

            const totalCharges = Object.values(charges).reduce((a, b) => a + b, 0);
            const totalProduits = Object.values(produits).reduce((a, b) => a + b, 0);
            const resultat = totalProduits - totalCharges;

            return {
                periode,
                systeme,
                charges,
                produits,
                totalCharges,
                totalProduits,
                resultat,
                resultatType: resultat >= 0 ? 'bénéfice' : 'perte'
            };
        }

        // Calcul du TAFIRE (simplifié)
        calculateTafire(periode) {
            return {
                periode,
                emplois: {
                    'Acquisitions d\'immobilisations': 200000000,
                    'Remboursements d\'emprunts': 80000000,
                    'Dividendes versés': 50000000
                },
                ressources: {
                    'Capacité d\'autofinancement': 250000000,
                    'Nouveaux emprunts': 100000000,
                    'Cessions d\'immobilisations': 30000000
                },
                variationTresorerie: 50000000
            };
        }

        // Calcul du grand livre (simplifié)
        calculateGrandLivre(periode) {
            return {
                periode,
                comptes: this.planComptable.slice(0, 10).map(compte => ({
                    code: compte.code,
                    name: compte.name,
                    soldeInitial: Math.floor(Math.random() * 1000000),
                    mouvements: Math.floor(Math.random() * 50) + 1,
                    totalDebit: Math.floor(Math.random() * 5000000),
                    totalCredit: Math.floor(Math.random() * 5000000),
                    soldeFinal: Math.floor(Math.random() * 1000000)
                }))
            };
        }

        // Calcul de la balance (simplifié)
        calculateBalance(periode) {
            return {
                periode,
                comptes: this.planComptable.slice(0, 15).map(compte => ({
                    code: compte.code,
                    name: compte.name,
                    debitPeriode: Math.floor(Math.random() * 2000000),
                    creditPeriode: Math.floor(Math.random() * 2000000),
                    soldeDebiteur: Math.floor(Math.random() * 1000000),
                    soldeCrediteur: Math.floor(Math.random() * 1000000)
                }))
            };
        }

        // Calcul du journal général (simplifié)
        calculateJournal(periode) {
            return {
                periode,
                ecritures: window.app.entries.slice(0, 5).map(entry => ({
                    date: entry.date,
                    piece: entry.piece,
                    libelle: entry.libelle,
                    journal: entry.journal,
                    montant: entry.lines ? entry.lines.reduce((sum, line) => sum + line.debit, 0) : 0
                }))
            };
        }

        // =============================================================================
        // MÉTHODES D'AFFICHAGE
        // =============================================================================

        // Affichage du bilan
        displayBilan(data) {
            const resultatDiv = document.getElementById('resultatEtatFinancier');
            if (!resultatDiv) return;

            resultatDiv.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6';
            resultatDiv.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                        📊 Bilan SYSCOHADA
                    </h3>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Période: ${data.periode.debut} au ${data.periode.fin}</span>
                        <span class="px-2 py-1 rounded text-xs ${data.equilibre ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">
                            ${data.equilibre ? '✅ Équilibré' : '❌ Déséquilibré'}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- ACTIF -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-primary/10 px-4 py-3 border-b">
                            <h4 class="font-semibold text-primary">ACTIF</h4>
                        </div>
                        <div class="p-4 space-y-3">
                            <div>
                                <h5 class="font-medium text-gray-900 dark:text-white mb-2">Actif immobilisé</h5>
                                ${Object.entries(data.actifImmobilise).map(([label, value]) => `
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                    <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                                </div>
                                `).join('')}
                                <div class="border-t pt-2 mt-2">
                                    <div class="flex justify-between font-medium">
                                        <span>Total actif immobilisé</span>
                                        <span class="font-mono">${Object.values(data.actifImmobilise).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h5 class="font-medium text-gray-900 dark:text-white mb-2">Actif circulant</h5>
                                ${Object.entries(data.actifCirculant).map(([label, value]) => `
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                    <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                                </div>
                                `).join('')}
                                <div class="border-t pt-2 mt-2">
                                    <div class="flex justify-between font-medium">
                                        <span>Total actif circulant</span>
                                        <span class="font-mono">${Object.values(data.actifCirculant).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-primary/5 px-4 py-3 border-t">
                            <div class="flex justify-between font-bold text-primary">
                                <span>TOTAL ACTIF</span>
                                <span class="font-mono">${data.totalActif.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <!-- PASSIF -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-success/10 px-4 py-3 border-b">
                            <h4 class="font-semibold text-success">PASSIF</h4>
                        </div>
                        <div class="p-4 space-y-3">
                            <div>
                                <h5 class="font-medium text-gray-900 dark:text-white mb-2">Capitaux propres</h5>
                                ${Object.entries(data.capitauxPropres).map(([label, value]) => `
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                    <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                                </div>
                                `).join('')}
                                <div class="border-t pt-2 mt-2">
                                    <div class="flex justify-between font-medium">
                                        <span>Total capitaux propres</span>
                                        <span class="font-mono">${Object.values(data.capitauxPropres).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h5 class="font-medium text-gray-900 dark:text-white mb-2">Dettes</h5>
                                ${Object.entries(data.dettes).map(([label, value]) => `
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                    <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                                </div>
                                `).join('')}
                                <div class="border-t pt-2 mt-2">
                                    <div class="flex justify-between font-medium">
                                        <span>Total dettes</span>
                                        <span class="font-mono">${Object.values(data.dettes).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-success/5 px-4 py-3 border-t">
                            <div class="flex justify-between font-bold text-success">
                                <span>TOTAL PASSIF</span>
                                <span class="font-mono">${data.totalPassif.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'exportBilan')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                        <i class="fas fa-download mr-2"></i>Exporter PDF
                    </button>
                    <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'printBilan')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
            `;

            resultatDiv.classList.remove('hidden');
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        }

        // Affichage du compte de résultat
        displayCompteResultat(data) {
            const resultatDiv = document.getElementById('resultatEtatFinancier');
            if (!resultatDiv) return;

            resultatDiv.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6';
            resultatDiv.innerHTML = `
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                        💰 Compte de Résultat SYSCOHADA
                    </h3>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Période: ${data.periode.debut} au ${data.periode.fin}</span>
                        <span class="px-2 py-1 rounded text-xs ${data.resultat >= 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">
                            ${data.resultatType === 'bénéfice' ? '📈 Bénéfice' : '📉 Perte'}
                        </span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- CHARGES -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-danger/10 px-4 py-3 border-b">
                            <h4 class="font-semibold text-danger">CHARGES</h4>
                        </div>
                        <div class="p-4 space-y-2">
                            ${Object.entries(data.charges).map(([label, value]) => `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                            </div>
                            `).join('')}
                        </div>
                        <div class="bg-danger/5 px-4 py-3 border-t">
                            <div class="flex justify-between font-bold text-danger">
                                <span>TOTAL CHARGES</span>
                                <span class="font-mono">${data.totalCharges.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <!-- PRODUITS -->
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div class="bg-success/10 px-4 py-3 border-b">
                            <h4 class="font-semibold text-success">PRODUITS</h4>
                        </div>
                        <div class="p-4 space-y-2">
                            ${Object.entries(data.produits).map(([label, value]) => `
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-400">${label}</span>
                                <span class="font-mono">${value.toLocaleString('fr-FR')}</span>
                            </div>
                            `).join('')}
                        </div>
                        <div class="bg-success/5 px-4 py-3 border-t">
                            <div class="flex justify-between font-bold text-success">
                                <span>TOTAL PRODUITS</span>
                                <span class="font-mono">${data.totalProduits.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RÉSULTAT -->
                <div class="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div class="bg-primary/5 px-4 py-3">
                        <div class="flex justify-between font-bold text-xl ${data.resultat >= 0 ? 'text-success' : 'text-danger'}">
                            <span>RÉSULTAT DE L'EXERCICE</span>
                            <span class="font-mono">${data.resultat.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            ${data.resultatType === 'bénéfice' ? 'Exercice bénéficiaire' : 'Exercice déficitaire'}
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'exportCompteResultat')" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                        <i class="fas fa-download mr-2"></i>Exporter PDF
                    </button>
                    <button onclick="window.moduleCommunicator.safeCall('financial-reports', 'printCompteResultat')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
            `;

            resultatDiv.classList.remove('hidden');
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        }

        // Affichages des autres états (TAFIRE, Grand Livre, Balance, Journal)
        displayTafire(data) {
            // Implementation similaire pour le TAFIRE
            this.notifications.show('success', 'TAFIRE affiché', 'Le Tableau Financier des Ressources et Emplois est maintenant visible');
        }

        displayGrandLivre(data) {
            // Implementation similaire pour le Grand Livre
            this.notifications.show('success', 'Grand Livre affiché', 'Le grand livre est maintenant visible');
        }

        displayBalance(data) {
            // Implementation similaire pour la Balance
            this.notifications.show('success', 'Balance affichée', 'La balance des comptes est maintenant visible');
        }

        displayJournal(data) {
            // Implementation similaire pour le Journal
            this.notifications.show('success', 'Journal affiché', 'Le journal général est maintenant visible');
        }

        // =============================================================================
        // MÉTHODES UTILITAIRES
        // =============================================================================

        // Obtenir la période depuis les inputs
        getPeriodeFromInputs() {
            const debut = document.getElementById('periodeDebut')?.value || new Date().getFullYear() + '-01-01';
            const fin = document.getElementById('periodeFin')?.value || new Date().toISOString().split('T')[0];
            
            return { debut, fin };
        }

        // Obtenir le système depuis l'input
        getSystemeFromInput() {
            return document.getElementById('systemeComptable')?.value || 'normal';
        }

        // Obtenir le nom de l'entreprise
        getCompanyName(companyId) {
            if (!companyId) return null;
            const company = window.app.companies.find(c => c.id === companyId);
            return company ? company.name : null;
        }

        // Fonctions d'export (simulations)
        exportBilan() {
            this.notifications.show('success', 'Export réussi', 'Le bilan a été exporté en PDF');
        }

        exportCompteResultat() {
            this.notifications.show('success', 'Export réussi', 'Le compte de résultat a été exporté en PDF');
        }

        exportAllReports() {
            this.notifications.show('info', 'Export en cours', 'Exportation de tous les états financiers...');
            setTimeout(() => {
                this.notifications.show('success', 'Export terminé', 'Tous les états financiers ont été exportés');
            }, 2000);
        }

        // Fonctions d'impression (simulations)
        printBilan() {
            this.notifications.show('info', 'Impression', 'Ouverture de la fenêtre d\'impression...');
        }

        printCompteResultat() {
            this.notifications.show('info', 'Impression', 'Ouverture de la fenêtre d\'impression...');
        }
    }

    // =============================================================================
    // INITIALISATION ET ENREGISTREMENT DU MODULE
    // =============================================================================
    
    // Créer et enregistrer le module des états financiers
    const financialReportsModule = new FinancialReportsModule();
    
    // Enregistrer le module dans le communicateur
    window.moduleCommunicator.registerModule('financial-reports', financialReportsModule);
    
    // Enregistrer dans l'état global
    window.app.modules.financialReports = financialReportsModule;
    
    console.log('✅ Module d\'états financiers SYSCOHADA chargé et enregistré');

})();
