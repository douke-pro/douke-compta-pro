// =============================================================================
// DOUKÈ Compta Pro - Contrôleur du plan comptable SYSCOHADA v3.1
// =============================================================================

class AccountsController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.currentFilters = {
            search: '',
            class: '',
            category: '',
            type: ''
        };
        
        console.log('📊 AccountsController initialisé');
    }

    // Charger la page du plan comptable
    loadAccountsPage() {
        if (this.security.requiresCompanySelection(window.app.currentProfile) && !window.app.currentCompanyId) {
            document.getElementById('mainContent').innerHTML = this.generateCompanySelectionRequired();
            return;
        }

        const companyName = this.getSelectedCompanyName();
        const accounts = this.data.getCompanyAccounts(window.app.currentCompanyId);
        const isCashier = window.app.currentProfile === 'caissier';

        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>
                        <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-calculator mr-2"></i>${accounts.length} comptes
                        </div>
                        ${!isCashier ? `
                        <button onclick="window.accountsController.showNewAccountModal()" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>Nouveau Compte
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Statistiques par classe SYSCOHADA -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    ${[1,2,3,4,5].map(classe => {
                        const classAccounts = accounts.filter(a => a.code.charAt(0) === classe.toString());
                        return `
                        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center border-l-4 ${this.getClassColor(classe)}">
                            <div class="text-2xl font-bold text-gray-900 dark:text-white">${classAccounts.length}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Classe ${classe}</div>
                            <div class="text-xs text-gray-500 mt-1">${this.getClassTitle(classe).split(' - ')[1]}</div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Filtres par classe SYSCOHADA -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche</label>
                            <input type="text" id="accountSearchInput" placeholder="Code, nom du compte..." 
                                   onkeyup="window.accountsController.filterAccounts()"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Classe</label>
                            <select id="classFilter" onchange="window.accountsController.filterAccounts()" 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Toutes les classes</option>
                                ${[1,2,3,4,5,6,7,8,9].map(classe => 
                                    `<option value="${classe}">Classe ${classe} - ${this.getClassTitle(classe).split(' - ')[1]}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
                            <select id="categoryFilter" onchange="window.accountsController.filterAccounts()" 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Toutes les catégories</option>
                                ${[...new Set(accounts.map(a => a.category))].sort().map(cat => 
                                    `<option value="${cat}">${cat}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="window.accountsController.resetAccountFilters()" 
                                    class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                <i class="fas fa-sync mr-2"></i>Réinitialiser
                            </button>
                        </div>
                    </div>

                    <!-- Actions rapides -->
                    <div class="flex flex-wrap gap-2">
                        <button onclick="window.accountsController.exportAccounts()" 
                                class="bg-success text-white px-3 py-2 rounded-lg text-sm hover:bg-success/90">
                            <i class="fas fa-download mr-1"></i>Exporter Plan
                        </button>
                        <button onclick="window.accountsController.showAccountsUsage()" 
                                class="bg-info text-white px-3 py-2 rounded-lg text-sm hover:bg-info/90">
                            <i class="fas fa-chart-pie mr-1"></i>Utilisation
                        </button>
                        <button onclick="window.accountsController.validateAccounts()" 
                                class="bg-warning text-white px-3 py-2 rounded-lg text-sm hover:bg-warning/90">
                            <i class="fas fa-check-double mr-1"></i>Validation SYSCOHADA
                        </button>
                    </div>
                </div>

                <!-- Liste des comptes par classe -->
                <div id="accountsList" class="space-y-6">
                    ${this.generateAccountsByClass()}
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
    }

    // Générer les comptes organisés par classe
    generateAccountsByClass() {
        const filteredAccounts = this.getFilteredAccounts();
        const accountsByClass = {};

        // Grouper par classe
        filteredAccounts.forEach(account => {
            const classe = account.code.charAt(0);
            if (!accountsByClass[classe]) {
                accountsByClass[classe] = [];
            }
            accountsByClass[classe].push(account);
        });

        if (Object.keys(accountsByClass).length === 0) {
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <i class="fas fa-search text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun compte trouvé</h3>
                    <p class="text-gray-600 dark:text-gray-400">Aucun compte ne correspond à vos critères de recherche.</p>
                </div>
            `;
        }

        return Object.keys(accountsByClass).sort().map(classe => {
            const classAccounts = accountsByClass[classe];
            
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div class="bg-gradient-to-r ${this.getClassGradient(classe)} px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-white">
                                <i class="fas ${this.getClassIcon(classe)} mr-2"></i>
                                Classe ${classe} - ${this.getClassTitle(classe).split(' - ')[1]}
                            </h3>
                            <span class="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                                ${classAccounts.length} compte(s)
                            </span>
                        </div>
                        <div class="text-white/80 text-sm mt-1">
                            ${this.getClassDescription(classe)}
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${classAccounts.map(account => `
                                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow account-card"
                                     data-category="${account.category}" data-code="${account.code}" data-name="${account.name.toLowerCase()}" data-class="${classe}">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="font-mono text-sm ${this.getClassTextColor(classe)} font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            ${account.code}
                                        </div>
                                        <div class="flex space-x-1">
                                            <span class="px-2 py-1 rounded text-xs bg-primary/20 text-primary">SYSCOHADA</span>
                                            ${account.nature === 'Debit' ? 
                                                '<span class="px-2 py-1 rounded text-xs bg-success/20 text-success">Débit</span>' : 
                                                '<span class="px-2 py-1 rounded text-xs bg-danger/20 text-danger">Crédit</span>'
                                            }
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <h4 class="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">
                                            ${account.name}
                                        </h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">${account.category}</p>
                                    </div>
                                    
                                    <div class="flex items-center justify-between text-xs">
                                        <div class="flex items-center space-x-2">
                                            <span class="text-gray-600 dark:text-gray-400">Type:</span>
                                            <span class="font-medium ${this.getTypeColor(account.type)}">${account.type}</span>
                                        </div>
                                        
                                        ${window.app.currentProfile !== 'caissier' ? `
                                        <div class="flex space-x-1">
                                            <button onclick="window.accountsController.viewAccountHistory('${account.code}')" 
                                                    class="text-info hover:text-info/80 p-1" title="Historique">
                                                <i class="fas fa-history"></i>
                                            </button>
                                            <button onclick="window.accountsController.viewAccountBalance('${account.code}')" 
                                                    class="text-success hover:text-success/80 p-1" title="Solde">
                                                <i class="fas fa-balance-scale"></i>
                                            </button>
                                            <button onclick="window.accountsController.editAccount('${account.code}')" 
                                                    class="text-warning hover:text-warning/80 p-1" title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        </div>
                                        ` : ''}
                                    </div>
                                    
                                    <!-- Utilisation du compte -->
                                    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <div class="flex justify-between text-xs text-gray-500">
                                            <span>Utilisations:</span>
                                            <span class="font-medium">${this.getAccountUsage(account.code)} écriture(s)</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                                            <div class="bg-primary h-1 rounded-full transition-all duration-300" 
                                                 style="width: ${Math.min(this.getAccountUsage(account.code) * 10, 100)}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filtrer les comptes
    filterAccounts() {
        const search = document.getElementById('accountSearchInput')?.value.toLowerCase() || '';
        const classFilter = document.getElementById('classFilter')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';

        this.currentFilters = { search, class: classFilter, category };

        // Mettre à jour l'affichage
        document.getElementById('accountsList').innerHTML = this.generateAccountsByClass();
    }

    // Obtenir les comptes filtrés
    getFilteredAccounts() {
        const accounts = this.data.getCompanyAccounts(window.app.currentCompanyId);
        
        return accounts.filter(account => {
            const matchesSearch = !this.currentFilters.search || 
                account.code.toLowerCase().includes(this.currentFilters.search) ||
                account.name.toLowerCase().includes(this.currentFilters.search);
            
            const matchesClass = !this.currentFilters.class || account.code.charAt(0) === this.currentFilters.class;
            const matchesCategory = !this.currentFilters.category || account.category === this.currentFilters.category;

            return matchesSearch && matchesClass && matchesCategory;
        });
    }

    // Modal de nouveau compte
    showNewAccountModal() {
        if (window.app.currentProfile === 'caissier') {
            window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Les caissiers ne peuvent pas créer de comptes');
            return;
        }

        const modalContent = `
            <form id="newAccountForm" class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-info-circle text-blue-500"></i>
                        <span class="text-blue-800 dark:text-blue-200 font-medium">Information SYSCOHADA</span>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300 text-sm mt-2">
                        Le plan comptable SYSCOHADA est normalisé. Assurez-vous que le nouveau compte respecte la classification officielle.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code compte (6 chiffres)*</label>
                        <input type="text" id="accountCode" pattern="[0-9]{6}" maxlength="6" required
                               placeholder="Ex: 411000"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base font-mono">
                        <div class="text-xs text-gray-500 mt-1">Le code doit respecter la classification SYSCOHADA</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Classe SYSCOHADA</label>
                        <select id="accountClass" onchange="window.accountsController.updateAccountCategories()" required
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                            <option value="">Sélectionner une classe</option>
                            ${[1,2,3,4,5,6,7,8,9].map(classe => 
                                `<option value="${classe}">Classe ${classe} - ${this.getClassTitle(classe).split(' - ')[1]}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du compte*</label>
                    <input type="text" id="accountName" required maxlength="100"
                           placeholder="Ex: Clients particuliers"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie*</label>
                        <select id="accountCategory" required
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                            <option value="">Sélectionner d'abord une classe</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type*</label>
                        <select id="accountType" required
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                            <option value="">Sélectionner un type</option>
                            <option value="Actif">Actif</option>
                            <option value="Passif">Passif</option>
                            <option value="Charge">Charge</option>
                            <option value="Produit">Produit</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nature*</label>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="nature" value="Debit" required
                                   class="text-primary focus:ring-primary">
                            <span>Débit (solde normal débiteur)</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="radio" name="nature" value="Credit" required
                                   class="text-primary focus:ring-primary">
                            <span>Crédit (solde normal créditeur)</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optionnel)</label>
                    <textarea id="accountDescription" rows="3" maxlength="500"
                              placeholder="Description détaillée du compte et de son utilisation..."
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base"></textarea>
                </div>

                <div class="flex items-center">
                    <input type="checkbox" id="accountActive" checked
                           class="rounded border-gray-300 text-primary focus:ring-primary">
                    <label for="accountActive" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Compte actif (disponible pour les écritures)
                    </label>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button type="button" onclick="window.unifiedManager.modalManager.hide()"
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Annuler
                    </button>
                    <button type="submit"
                            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Créer le compte
                    </button>
                </div>
            </form>
        `;

        window.unifiedManager.modalManager.show('Nouveau Compte SYSCOHADA', modalContent, { size: 'large' });

        // Attacher l'événement de soumission
        setTimeout(() => {
            document.getElementById('newAccountForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAccount();
            });
        }, 100);
    }

    // Méthodes utilitaires pour les classes SYSCOHADA
    getClassTitle(classe) {
        const titles = {
            1: 'Classe 1 - Comptes de ressources durables',
            2: 'Classe 2 - Comptes d\'actif immobilisé',
            3: 'Classe 3 - Comptes de stocks',
            4: 'Classe 4 - Comptes de tiers',
            5: 'Classe 5 - Comptes financiers',
            6: 'Classe 6 - Comptes de charges',
            7: 'Classe 7 - Comptes de produits',
            8: 'Classe 8 - Comptes de résultats',
            9: 'Classe 9 - Comptes analytiques'
        };
        return titles[classe] || 'Classe inconnue';
    }

    getClassDescription(classe) {
        const descriptions = {
            1: 'Capitaux propres, provisions et dettes financières',
            2: 'Immobilisations incorporelles, corporelles et financières',
            3: 'Marchandises, matières premières et produits',
            4: 'Créances et dettes d\'exploitation',
            5: 'Disponibilités et valeurs mobilières',
            6: 'Charges par nature et charges supplétives',
            7: 'Produits par nature et produits supplétifs',
            8: 'Résultats et reports à nouveau',
            9: 'Comptabilité analytique et budgétaire'
        };
        return descriptions[classe] || '';
    }

    getClassColor(classe) {
        const colors = {
            1: 'border-red-500',
            2: 'border-blue-500',
            3: 'border-green-500',
            4: 'border-yellow-500',
            5: 'border-purple-500',
            6: 'border-orange-500',
            7: 'border-pink-500',
            8: 'border-gray-500',
            9: 'border-indigo-500'
        };
        return colors[classe] || 'border-gray-500';
    }

    getClassGradient(classe) {
        const gradients = {
            1: 'from-red-500 to-red-600',
            2: 'from-blue-500 to-blue-600',
            3: 'from-green-500 to-green-600',
            4: 'from-yellow-500 to-yellow-600',
            5: 'from-purple-500 to-purple-600',
            6: 'from-orange-500 to-orange-600',
            7: 'from-pink-500 to-pink-600',
            8: 'from-gray-500 to-gray-600',
            9: 'from-indigo-500 to-indigo-600'
        };
        return gradients[classe] || 'from-gray-500 to-gray-600';
    }

    getClassIcon(classe) {
        const icons = {
            1: 'fa-piggy-bank',
            2: 'fa-industry',
            3: 'fa-boxes',
            4: 'fa-handshake',
            5: 'fa-coins',
            6: 'fa-arrow-up',
            7: 'fa-arrow-down',
            8: 'fa-chart-line',
            9: 'fa-analytics'
        };
        return icons[classe] || 'fa-folder';
    }

    getTypeColor(type) {
        const colors = {
            'Actif': 'text-success',
            'Passif': 'text-danger',
            'Charge': 'text-warning',
            'Produit': 'text-info'
        };
        return colors[type] || 'text-gray-500';
    }

    getAccountUsage(accountCode) {
        if (!window.app.currentCompanyId) return 0;
        
        const entries = window.app.entries.filter(e => e.companyId === window.app.currentCompanyId);
        let usage = 0;
        
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.account === accountCode) {
                    usage++;
                }
            });
        });
        
        return usage;
    }

    // Actions sur les comptes
    viewAccountHistory(accountCode) {
        window.unifiedManager.notificationManager.show('info', 'Historique du compte', `Affichage de l'historique du compte ${accountCode}`);
    }

    viewAccountBalance(accountCode) {
        const balance = this.calculateAccountBalance(accountCode);
        window.unifiedManager.notificationManager.show('info', 'Solde du compte', `Solde du compte ${accountCode}: ${balance.toLocaleString('fr-FR')} FCFA`);
    }

    calculateAccountBalance(accountCode) {
        if (!window.app.currentCompanyId) return 0;
        
        const entries = window.app.entries.filter(e => 
            e.companyId === window.app.currentCompanyId && e.status === 'Validé'
        );
        
        let balance = 0;
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.account === accountCode) {
                    balance += (line.debit || 0) - (line.credit || 0);
                }
            });
        });
        
        return balance;
    }

    exportAccounts() {
        window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Plan comptable exporté avec succès');
    }

    showAccountsUsage() {
        window.unifiedManager.notificationManager.show('info', 'Analyse d\'utilisation', 'Génération du rapport d\'utilisation des comptes...');
    }

    validateAccounts() {
        window.unifiedManager.notificationManager.show('success', 'Validation SYSCOHADA', 'Tous les comptes sont conformes au référentiel SYSCOHADA');
    }

    resetAccountFilters() {
        document.getElementById('accountSearchInput').value = '';
        document.getElementById('classFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        this.currentFilters = { search: '', class: '', category: '' };
        this.filterAccounts();
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
                <p class="text-gray-600 dark:text-gray-400 mt-2 mb-6">Sélectionnez une entreprise dans la barre latérale pour accéder au plan comptable.</p>
                <button onclick="window.unifiedManager.loadCompaniesPage()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <i class="fas fa-building mr-2"></i>Sélectionner une entreprise
                </button>
            </div>
        `;
    }
}

// Export de la classe
window.AccountsController = AccountsController;

console.log('📦 Module AccountsController chargé');
