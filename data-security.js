// =============================================================================
// DOUKÈ Compta Pro - Gestionnaire de Sécurité des Données par Entreprise
// =============================================================================

class SecureDataManager {
    constructor() {
        this.companyData = new Map();
        this.initializeCompanyData();
        console.log('🔒 Gestionnaire de sécurité des données initialisé');
    }

    initializeCompanyData() {
        console.log('🔄 Initialisation des données sécurisées par entreprise...');

        // Données par entreprise (identiques au code précédent)
        const companiesData = {
            1: { // SARL TECH INNOVATION
                accounts: [
                    { code: '101000', name: 'Capital social', category: 'Capitaux propres', balance: 5000000 },
                    { code: '106000', name: 'Réserves', category: 'Capitaux propres', balance: 1200000 },
                    { code: '411000', name: 'Clients', category: 'Clients', balance: 2800000 },
                    { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', balance: 1500000 },
                    { code: '512000', name: 'Banque BCI', category: 'Comptes bancaires', balance: 3200000 },
                    { code: '571000', name: 'Caisse principale', category: 'Caisse', balance: 150000 },
                    { code: '601000', name: 'Achats de marchandises', category: 'Achats', balance: 0 },
                    { code: '701000', name: 'Ventes de marchandises', category: 'Ventes', balance: 0 }
                ],
                entries: [
                    {
                        id: 1,
                        date: '2024-12-15',
                        journal: 'JV',
                        piece: 'JV-2024-001-0156',
                        libelle: 'Vente marchandises Client ABC',
                        lines: [
                            { account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 },
                            { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },
                            { account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }
                        ],
                        status: 'Validé',
                        userId: 2
                    }
                ],
                cashRegisters: [
                    {
                        id: 1,
                        name: 'Caisse Principale',
                        responsibleName: 'Amadou Traoré',
                        balance: 150000,
                        status: 'Ouvert',
                        openingBalance: 120000,
                        dailyReceipts: 45000,
                        dailyExpenses: 15000
                    }
                ]
            },
            2: { // SA COMMERCE PLUS
                accounts: [
                    { code: '101000', name: 'Capital social', category: 'Capitaux propres', balance: 10000000 },
                    { code: '106000', name: 'Réserves', category: 'Capitaux propres', balance: 2500000 },
                    { code: '411000', name: 'Clients', category: 'Clients', balance: 4200000 },
                    { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', balance: 2800000 },
                    { code: '512000', name: 'Banque SGBCI', category: 'Comptes bancaires', balance: 5600000 },
                    { code: '571000', name: 'Caisse principale', category: 'Caisse', balance: 210000 },
                    { code: '572000', name: 'Caisse ventes', category: 'Caisse', balance: 85000 }
                ],
                entries: [
                    {
                        id: 3,
                        date: '2024-12-15',
                        journal: 'JV',
                        piece: 'JV-2024-002-0201',
                        libelle: 'Vente en gros Client DEF',
                        lines: [
                            { account: '411000', accountName: 'Clients', libelle: 'Vente Client DEF', debit: 3600000, credit: 0 },
                            { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente gros', debit: 0, credit: 3000000 },
                            { account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 600000 }
                        ],
                        status: 'Validé',
                        userId: 2
                    }
                ],
                cashRegisters: [
                    {
                        id: 2,
                        name: 'Caisse Principale',
                        responsibleName: 'Ibrahim Koné',
                        balance: 210000,
                        status: 'Ouvert',
                        openingBalance: 150000,
                        dailyReceipts: 85000,
                        dailyExpenses: 25000
                    }
                ]
            },
            3: { // EURL SERVICES PRO
                accounts: [
                    { code: '101000', name: 'Capital social', category: 'Capitaux propres', balance: 2000000 },
                    { code: '411000', name: 'Clients', category: 'Clients', balance: 800000 },
                    { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', balance: 450000 }
                ],
                entries: [],
                cashRegisters: []
            },
            4: { // SAS DIGITAL WORLD
                accounts: [
                    { code: '101000', name: 'Capital social', category: 'Capitaux propres', balance: 3000000 },
                    { code: '411000', name: 'Clients', category: 'Clients', balance: 1200000 }
                ],
                entries: [],
                cashRegisters: []
            }
        };

        Object.keys(companiesData).forEach(companyId => {
            this.companyData.set(parseInt(companyId), companiesData[companyId]);
        });

        console.log('✅ Données sécurisées initialisées pour', this.companyData.size, 'entreprises');
    }

    // =============================================================================
    // MÉTHODES DE CONTRÔLE D'ACCÈS
    // =============================================================================

    hasAccessToCompany(companyId) {
        if (!window.app || !window.app.currentUser) return false;

        const profile = window.app.currentProfile;
        
        if (profile === 'admin') return true;

        if (profile === 'user' || profile === 'caissier') {
            return window.app.currentCompany === companyId;
        }

        if (profile.includes('collaborateur')) {
            const user = window.app.users.find(u => u.id === window.app.currentUser.id);
            return user && user.assignedCompanies && user.assignedCompanies.includes(companyId);
        }

        return false;
    }

    requireCompanySelection() {
        const profile = window.app.currentProfile;
        
        if (profile === 'admin' || profile.includes('collaborateur')) {
            if (!window.app.currentCompany) {
                return {
                    required: true,
                    message: 'Veuillez sélectionner une entreprise pour accéder à cette fonctionnalité'
                };
            }
            
            if (!this.hasAccessToCompany(window.app.currentCompany)) {
                return {
                    required: true,
                    message: 'Vous n\'avez pas accès à cette entreprise'
                };
            }
        }
        
        return { required: false };
    }

    getCompanyData(companyId) {
        if (!this.hasAccessToCompany(companyId)) {
            throw new Error('Accès non autorisé à cette entreprise');
        }
        
        return this.companyData.get(companyId) || {
            accounts: [],
            entries: [],
            cashRegisters: []
        };
    }

    getSelectedCompanyName() {
        if (!window.app.currentCompany) return 'Aucune entreprise';
        const company = window.app.companies.find(c => c.id === window.app.currentCompany);
        return company ? company.name : 'Entreprise inconnue';
    }

    // =============================================================================
    // FONCTIONS DE CHARGEMENT DES PAGES SÉCURISÉES
    // =============================================================================

    loadUsersPage() {
        if (window.app.currentProfile !== 'admin') {
            this.showAccessDenied();
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
        console.log('✅ Page utilisateurs sécurisée chargée');
    }

    loadCompaniesPage() {
        let companies = window.app.companies;
        
        if (window.app.currentProfile.includes('collaborateur')) {
            const user = window.app.users.find(u => u.id === window.app.currentUser.id);
            companies = companies.filter(c => user.assignedCompanies.includes(c.id));
        } else if (window.app.currentProfile === 'user' || window.app.currentProfile === 'caissier') {
            companies = companies.filter(c => c.id === window.app.currentCompany);
        }

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        ${window.app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
                    </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${companies.map(company => `
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${company.id === window.app.currentCompany ? 'border-2 border-primary' : ''}">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-medium text-gray-900 dark:text-white">${company.name}</h3>
                                <span class="px-2 py-1 rounded text-xs ${company.status === 'Actif' ? 'bg-success/20 text-success' : 
                                                                      company.status === 'Période d\'essai' ? 'bg-warning/20 text-warning' : 
                                                                      'bg-danger/20 text-danger'}">${company.status}</span>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                <div>${company.type} • ${company.system}</div>
                                <div>${company.phone}</div>
                                <div>${company.address}</div>
                            </div>
                            ${(window.app.currentProfile === 'admin' || window.app.currentProfile.includes('collaborateur')) ? `
                            <div class="mt-4">
                                <button onclick="AppRouter.changeCompany(${company.id})" class="w-full ${company.id === window.app.currentCompany ? 'bg-success' : 'bg-primary'} text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                                    ${company.id === window.app.currentCompany ? 'Entreprise sélectionnée' : 'Sélectionner cette entreprise'}
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page entreprises sécurisée chargée');
    }

    loadEntriesPage() {
        const validationResult = this.requireCompanySelection();
        if (validationResult.required) {
            this.showCompanySelectionRequired(validationResult.message);
            return;
        }

        const companyData = this.getCompanyData(window.app.currentCompany);
        const entries = companyData.entries;

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Écritures Comptables - ${this.getSelectedCompanyName()}
                    </h2>
                    <button class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle écriture
                    </button>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ${entries.length} écriture(s) trouvée(s)
                    </h3>
                    ${entries.length > 0 ? `
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Journal</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">N° Pièce</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Libellé</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Statut</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                ${entries.map(entry => `
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td class="px-6 py-4 text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                        <td class="px-6 py-4 text-gray-900 dark:text-white">${entry.journal}</td>
                                        <td class="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">${entry.piece}</td>
                                        <td class="px-6 py-4 text-gray-900 dark:text-white">${entry.libelle}</td>
                                        <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA</td>
                                        <td class="px-6 py-4">
                                            <span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-file-alt text-4xl mb-4"></i>
                        <p>Aucune écriture trouvée pour cette entreprise</p>
                    </div>
                    `}
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page écritures sécurisée chargée pour entreprise', window.app.currentCompany);
    }

    loadAccountsPage() {
        const validationResult = this.requireCompanySelection();
        if (validationResult.required) {
            this.showCompanySelectionRequired(validationResult.message);
            return;
        }

        const companyData = this.getCompanyData(window.app.currentCompany);
        const accounts = companyData.accounts;

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Plan Comptable - ${this.getSelectedCompanyName()}
                    </h2>
                    <div class="text-sm font-medium text-success-light bg-success/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-calculator mr-2"></i>${accounts.length} comptes
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes de l'entreprise</h3>
                    ${accounts.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${accounts.map(account => `
                            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="font-mono text-sm text-primary font-semibold">${account.code}</div>
                                    <div class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">${account.category}</div>
                                </div>
                                <div class="font-medium text-gray-900 dark:text-white text-sm mb-2">${account.name}</div>
                                ${account.balance !== undefined ? `
                                <div class="text-sm text-gray-600 dark:text-gray-400">
                                    Solde: <span class="font-mono font-medium">${account.balance.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-list text-4xl mb-4"></i>
                        <p>Aucun compte trouvé pour cette entreprise</p>
                    </div>
                    `}
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page plan comptable sécurisée chargée pour entreprise', window.app.currentCompany);
    }

    loadCaissePage() {
        const validationResult = this.requireCompanySelection();
        if (validationResult.required) {
            this.showCompanySelectionRequired(validationResult.message);
            return;
        }

        const companyData = this.getCompanyData(window.app.currentCompany);
        const cashRegisters = companyData.cashRegisters;

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestion des Caisses - ${this.getSelectedCompanyName()}
                    </h2>
                    <div class="text-sm font-medium text-warning-light bg-warning/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-cash-register mr-2"></i>${cashRegisters.length} caisse(s)
                    </div>
                </div>

                ${cashRegisters.length > 0 ? `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    ${cashRegisters.map(cash => `
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-medium text-gray-900 dark:text-white">${cash.name}</h4>
                                <span class="px-2 py-1 text-sm rounded ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
                            </div>
                            
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">Responsable:</span>
                                    <span class="font-medium text-gray-900 dark:text-white">${cash.responsibleName}</span>
                                </div>
                                
                                <div class="border-t pt-3">
                                    <div class="flex justify-between mb-2">
                                        <span class="text-gray-600 dark:text-gray-400">Solde d'ouverture:</span>
                                        <span class="font-mono text-gray-900 dark:text-white">${cash.openingBalance.toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                    <div class="flex justify-between mb-2">
                                        <span class="text-success">Recettes du jour:</span>
                                        <span class="font-mono text-success">+${cash.dailyReceipts.toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                    <div class="flex justify-between mb-2">
                                        <span class="text-warning">Dépenses du jour:</span>
                                        <span class="font-mono text-warning">-${cash.dailyExpenses.toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                    <div class="border-t pt-2 flex justify-between">
                                        <span class="font-medium text-gray-900 dark:text-white">Solde actuel:</span>
                                        <span class="font-mono text-xl font-bold text-primary">${cash.balance.toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-cash-register text-4xl mb-4"></i>
                        <p>Aucune caisse trouvée pour cette entreprise</p>
                    </div>
                </div>
                `}
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page caisses sécurisée chargée pour entreprise', window.app.currentCompany);
    }

    loadReportsPage() {
        const validationResult = this.requireCompanySelection();
        if (validationResult.required) {
            this.showCompanySelectionRequired(validationResult.message);
            return;
        }

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Rapports Financiers - ${this.getSelectedCompanyName()}
                    </h2>
                    <div class="text-sm font-medium text-info-light bg-info/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-file-alt mr-2"></i>SYSCOHADA Révisé
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">États financiers disponibles</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <i class="fas fa-file-alt text-3xl text-primary mb-3"></i>
                            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Journal Général</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Chronologique des écritures</p>
                            <button class="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90">
                                Générer
                            </button>
                        </div>
                        
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <i class="fas fa-book text-3xl text-success mb-3"></i>
                            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Grand Livre</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Par compte</p>
                            <button class="bg-success text-white px-4 py-2 rounded-lg text-sm hover:bg-success/90">
                                Générer
                            </button>
                        </div>
                        
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                            <i class="fas fa-balance-scale text-3xl text-info mb-3"></i>
                            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Balance Générale</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Tous les comptes</p>
                            <button class="bg-info text-white px-4 py-2 rounded-lg text-sm hover:bg-info/90">
                                Générer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page rapports sécurisée chargée pour entreprise', window.app.currentCompany);
    }

    loadImportPage() {
        const validationResult = this.requireCompanySelection();
        if (validationResult.required) {
            this.showCompanySelectionRequired(validationResult.message);
            return;
        }

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Import de Balances - ${this.getSelectedCompanyName()}
                    </h2>
                    <div class="text-sm font-medium text-success-light bg-success/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-upload mr-2"></i>Compatible SYSCOHADA
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-upload mr-2 text-primary"></i>Importer un fichier
                    </h3>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Import pour ${this.getSelectedCompanyName()}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Les données seront importées dans l'entreprise sélectionnée
                        </p>
                        <button class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90">
                            Sélectionner un fichier
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
        console.log('✅ Page import sécurisée chargée pour entreprise', window.app.currentCompany);
    }

    // =============================================================================
    // UTILITAIRES D'AFFICHAGE
    // =============================================================================

    showCompanySelectionRequired(message) {
        document.getElementById('mainContent').innerHTML = `
            <div class="text-center p-8">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-building text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Sélection d'entreprise requise</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2 mb-6">${message}</p>
                <button onclick="AppRouter.navigateTo('companies')" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <i class="fas fa-building mr-2"></i>Sélectionner une entreprise
                </button>
            </div>
        `;
    }

    showAccessDenied() {
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
}

// Instance globale du gestionnaire de sécurité
window.SecureDataManager = new SecureDataManager();

console.log('🔒 Gestionnaire de sécurité des données chargé avec succès');
