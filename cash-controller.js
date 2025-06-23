// =============================================================================
// DOUKÈ Compta Pro - Contrôleur de gestion des caisses v3.1
// =============================================================================

class CashController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.currentFilters = {
            search: '',
            status: '',
            responsible: ''
        };
        
        console.log('💰 CashController initialisé');
    }

    // Charger la page de gestion des caisses
    loadCaissePage() {
        if (this.security.requiresCompanySelection(window.app.currentProfile) && !window.app.currentCompanyId) {
            document.getElementById('mainContent').innerHTML = this.generateCompanySelectionRequired();
            return;
        }

        const companyName = this.getSelectedCompanyName();
        const cashRegisters = this.data.getCompanyCashRegisters(window.app.currentCompanyId);
        const canManage = window.app.currentProfile !== 'caissier';
        const isCashier = window.app.currentProfile === 'caissier';
        const maxCashRegisters = window.app.currentProfile === 'user' ? 5 : Infinity;

        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Caisses</h2>
                        <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                            <i class="fas fa-cash-register mr-2"></i>${cashRegisters.length} caisse(s)
                        </div>
                        ${canManage && (window.app.currentProfile === 'user' ? cashRegisters.length < maxCashRegisters : true) ? `
                        <button onclick="window.cashController.showNewCashRegisterModal()" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>Nouvelle Caisse
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Statistiques des caisses -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-success">
                        <div class="text-3xl font-bold text-success">${cashRegisters.filter(c => c.status === 'Ouvert').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Caisses ouvertes</div>
                        <div class="text-xs text-success mt-1">Opérationnelles</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-warning">
                        <div class="text-3xl font-bold text-warning">${cashRegisters.filter(c => c.status === 'Fermé').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Caisses fermées</div>
                        <div class="text-xs text-warning mt-1">Hors service</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-primary">
                        <div class="text-2xl font-bold text-primary">${cashRegisters.reduce((sum, c) => sum + (c.balance || 0), 0).toLocaleString('fr-FR')}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Solde total (FCFA)</div>
                        <div class="text-xs text-primary mt-1">Disponible</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-info">
                        <div class="text-3xl font-bold text-info">${cashRegisters.filter(c => c.responsibleId).length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Caisses assignées</div>
                        <div class="text-xs text-info mt-1">Avec responsable</div>
                    </div>
                </div>

                <!-- Filtres et recherche -->
                ${!isCashier ? `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche</label>
                            <input type="text" id="cashSearch" placeholder="Nom de la caisse..." 
                                   onkeyup="window.cashController.filterCashRegisters()"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="statusFilter" onchange="window.cashController.filterCashRegisters()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les statuts</option>
                                <option value="Ouvert">Ouvert</option>
                                <option value="Fermé">Fermé</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Responsable</label>
                            <select id="responsibleFilter" onchange="window.cashController.filterCashRegisters()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les responsables</option>
                                <option value="assigned">Avec responsable</option>
                                <option value="unassigned">Sans responsable</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="window.cashController.resetFilters()" 
                                    class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                <i class="fas fa-sync mr-2"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Actions rapides pour caissiers -->
                ${isCashier && cashRegisters.filter(c => c.responsibleId === window.app.currentUser.id).length > 0 ? `
                <div class="bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides Caissier
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onclick="window.cashController.quickCashOperation('receipt')" 
                                class="bg-success text-white p-4 rounded-lg hover:bg-success/90 transition-colors text-center">
                            <i class="fas fa-arrow-down text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Encaissement</div>
                        </button>
                        <button onclick="window.cashController.quickCashOperation('expense')" 
                                class="bg-danger text-white p-4 rounded-lg hover:bg-danger/90 transition-colors text-center">
                            <i class="fas fa-arrow-up text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Décaissement</div>
                        </button>
                        <button onclick="window.cashController.generateMyCashReport()" 
                                class="bg-info text-white p-4 rounded-lg hover:bg-info/90 transition-colors text-center">
                            <i class="fas fa-print text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">État Caisse</div>
                        </button>
                        <button onclick="window.cashController.requestValidation()" 
                                class="bg-warning text-white p-4 rounded-lg hover:bg-warning/90 transition-colors text-center">
                            <i class="fas fa-check-circle text-2xl mb-2 block"></i>
                            <div class="text-sm font-medium">Demander validation</div>
                        </button>
                    </div>
                </div>
                ` : ''}

                <!-- Liste des caisses -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Liste des Caisses
                            <span id="cashCount" class="text-sm font-normal text-gray-500 ml-2">(${cashRegisters.length})</span>
                        </h3>
                        <div class="flex space-x-2">
                            <button onclick="window.cashController.exportCashData()" 
                                    class="bg-success text-white px-3 py-2 rounded-lg text-sm hover:bg-success/90">
                                <i class="fas fa-download mr-1"></i>Exporter
                            </button>
                            <button onclick="window.cashController.generateGlobalCashReport()" 
                                    class="bg-info text-white px-3 py-2 rounded-lg text-sm hover:bg-info/90">
                                <i class="fas fa-chart-bar mr-1"></i>Rapport Global
                            </button>
                        </div>
                    </div>
                    <div id="cashRegistersContainer">
                        ${this.generateCashRegistersGrid()}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
    }

    // Générer la grille des caisses
    generateCashRegistersGrid() {
        const filteredCashRegisters = this.getFilteredCashRegisters();
        
        if (filteredCashRegisters.length === 0) {
            const isCashier = window.app.currentProfile === 'caissier';
            return `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-cash-register text-6xl mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">
                        ${isCashier ? 'Aucune caisse assignée' : 'Aucune caisse trouvée'}
                    </h3>
                    <p>
                        ${isCashier 
                            ? 'Contactez votre administrateur pour assigner une caisse.' 
                            : 'Créez votre première caisse pour cette entreprise.'
                        }
                    </p>
                    ${!isCashier ? `
                    <button onclick="window.cashController.showNewCashRegisterModal()" 
                            class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                        <i class="fas fa-plus mr-2"></i>Créer une caisse
                    </button>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${filteredCashRegisters.map(cash => `
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${cash.responsibleId === window.app.currentUser?.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''} hover:shadow-lg transition-all card-hover">
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 ${this.getCashStatusColor(cash.status)} text-white rounded-lg flex items-center justify-center">
                                    <i class="fas fa-cash-register text-xl"></i>
                                </div>
                                <div>
                                    <h4 class="font-medium text-gray-900 dark:text-white">${cash.name}</h4>
                                    <div class="text-xs text-gray-500">ID: ${cash.id}</div>
                                </div>
                            </div>
                            <span class="px-2 py-1 rounded text-xs font-medium ${this.getStatusBadgeColor(cash.status)}">
                                ${cash.status}
                            </span>
                        </div>

                        <!-- Informations responsable -->
                        <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Responsable:</span>
                                <div class="text-right">
                                    ${cash.responsibleName ? `
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">${cash.responsibleName}</div>
                                        ${cash.responsibleId === window.app.currentUser?.id ? `
                                        <div class="text-xs text-primary">Votre caisse</div>
                                        ` : ''}
                                    ` : `
                                        <div class="text-sm text-gray-500">Non assigné</div>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- Soldes et montants -->
                        <div class="space-y-3 mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Solde actuel:</span>
                                <span class="text-lg font-bold text-primary">${(cash.balance || 0).toLocaleString('fr-FR')} F</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4 text-xs">
                                <div class="text-center p-2 bg-success/10 rounded">
                                    <div class="font-semibold text-success">+${(cash.dailyReceipts || 0).toLocaleString('fr-FR')}</div>
                                    <div class="text-gray-500">Recettes</div>
                                </div>
                                <div class="text-center p-2 bg-danger/10 rounded">
                                    <div class="font-semibold text-danger">-${(cash.dailyExpenses || 0).toLocaleString('fr-FR')}</div>
                                    <div class="text-gray-500">Dépenses</div>
                                </div>
                            </div>
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-500">Ouverture:</span>
                                <span class="font-medium">${(cash.openingBalance || 0).toLocaleString('fr-FR')} F</span>
                            </div>
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-500">Limite max:</span>
                                <span class="font-medium">${(cash.maxLimit || 0).toLocaleString('fr-FR')} F</span>
                            </div>
                        </div>

                        <!-- Indicateur de remplissage -->
                        <div class="mb-4">
                            <div class="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Utilisation</span>
                                <span>${cash.maxLimit ? Math.round((cash.balance / cash.maxLimit) * 100) : 0}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full transition-all duration-300" 
                                     style="width: ${cash.maxLimit ? Math.min((cash.balance / cash.maxLimit) * 100, 100) : 0}%"></div>
                            </div>
                        </div>

                        <!-- Dernière activité -->
                        <div class="text-xs text-gray-500 mb-4">
                            <i class="fas fa-clock mr-1"></i>
                            Dernière activité: ${cash.lastOperation ? new Date(cash.lastOperation).toLocaleString('fr-FR') : 'Aucune'}
                        </div>

                        <!-- Actions -->
                        <div class="grid grid-cols-2 gap-2">
                            ${cash.responsibleId === window.app.currentUser?.id || window.app.currentProfile !== 'caissier' ? `
                            <button onclick="window.cashController.openCashOperations(${cash.id})" 
                                    class="bg-primary text-white px-3 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                                <i class="fas fa-plus-circle mr-1"></i>Opération
                            </button>
                            ` : `
                            <button disabled class="bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm cursor-not-allowed">
                                <i class="fas fa-lock mr-1"></i>Bloqué
                            </button>
                            `}
                            
                            <button onclick="window.cashController.generateCashReport(${cash.id})" 
                                    class="bg-success text-white px-3 py-2 rounded-lg text-sm hover:bg-success/90 transition-colors">
                                <i class="fas fa-print mr-1"></i>État
                            </button>
                            
                            ${window.app.currentProfile !== 'caissier' ? `
                            <button onclick="window.cashController.editCashRegister(${cash.id})" 
                                    class="bg-info text-white px-3 py-2 rounded-lg text-sm hover:bg-info/90 transition-colors">
                                <i class="fas fa-edit mr-1"></i>Modifier
                            </button>
                            <button onclick="window.cashController.manageCashResponsible(${cash.id})" 
                                    class="bg-warning text-white px-3 py-2 rounded-lg text-sm hover:bg-warning/90 transition-colors">
                                <i class="fas fa-user-cog mr-1"></i>Responsable
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Modal de nouvelle caisse
    showNewCashRegisterModal() {
        const canManage = window.app.currentProfile !== 'caissier';
        if (!canManage) {
            window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Les caissiers ne peuvent pas créer de caisses');
            return;
        }

        const users = window.app.users.filter(u => u.profile === 'caissier' && u.status === 'Actif');

        const modalContent = `
            <form id="newCashForm" class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-info-circle text-blue-500"></i>
                        <span class="text-blue-800 dark:text-blue-200 font-medium">Nouvelle Caisse</span>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300 text-sm mt-2">
                        Une caisse permet de gérer les opérations de trésorerie quotidiennes avec un suivi précis des entrées et sorties.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de la caisse*</label>
                        <input type="text" id="cashName" required maxlength="100"
                               placeholder="Ex: Caisse Principale, Caisse Ventes..."
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monnaie</label>
                        <select id="cashCurrency" required
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                            <option value="FCFA">FCFA (Franc CFA)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="USD">USD (Dollar US)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Solde d'ouverture</label>
                        <input type="number" id="openingBalance" min="0" step="0.01" value="0"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                        <div class="text-xs text-gray-500 mt-1">Montant initial dans la caisse</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limite maximale</label>
                        <input type="number" id="maxLimit" min="0" step="0.01" value="500000"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                        <div class="text-xs text-gray-500 mt-1">Montant maximum autorisé dans la caisse</div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Responsable de la caisse</label>
                    <select id="responsibleId"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                        <option value="">Aucun responsable (à assigner plus tard)</option>
                        ${users.map(user => `
                            <option value="${user.id}">${user.name} (${user.email})</option>
                        `).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optionnel)</label>
                    <textarea id="cashDescription" rows="3" maxlength="500"
                              placeholder="Description de l'utilisation de cette caisse..."
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-center">
                        <input type="checkbox" id="cashActive" checked
                               class="rounded border-gray-300 text-primary focus:ring-primary">
                        <label for="cashActive" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Caisse active (ouverte)
                        </label>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="autoValidation"
                               class="rounded border-gray-300 text-primary focus:ring-primary">
                        <label for="autoValidation" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Validation automatique des opérations
                        </label>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button type="button" onclick="window.unifiedManager.modalManager.hide()"
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Annuler
                    </button>
                    <button type="submit"
                            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-cash-register mr-2"></i>Créer la caisse
                    </button>
                </div>
            </form>
        `;

        window.unifiedManager.modalManager.show('Nouvelle Caisse', modalContent, { size: 'large' });

        // Attacher l'événement de soumission
        setTimeout(() => {
            document.getElementById('newCashForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCashRegister();
            });
        }, 100);
    }

    // Créer une nouvelle caisse
    createCashRegister() {
        const name = document.getElementById('cashName').value.trim();
        const currency = document.getElementById('cashCurrency').value;
        const openingBalance = parseFloat(document.getElementById('openingBalance').value) || 0;
        const maxLimit = parseFloat(document.getElementById('maxLimit').value) || 500000;
        const responsibleId = document.getElementById('responsibleId').value || null;
        const description = document.getElementById('cashDescription').value.trim();
        const isActive = document.getElementById('cashActive').checked;
        const autoValidation = document.getElementById('autoValidation').checked;

        // Validation
        if (!name) {
            window.unifiedManager.notificationManager.show('error', 'Erreur', 'Le nom de la caisse est obligatoire');
            return;
        }

        if (maxLimit < openingBalance) {
            window.unifiedManager.notificationManager.show('error', 'Erreur', 'La limite maximale doit être supérieure au solde d\'ouverture');
            return;
        }

        // Créer la caisse
        const newId = Math.max(...window.app.cashRegisters.map(c => c.id), 0) + 1;
        const responsible = responsibleId ? window.app.users.find(u => u.id == responsibleId) : null;

        const newCashRegister = {
            id: newId,
            name: name,
            companyId: window.app.currentCompanyId,
            responsibleId: responsibleId,
            responsibleName: responsible ? responsible.name : null,
            balance: openingBalance,
            status: isActive ? 'Ouvert' : 'Fermé',
            openingBalance: openingBalance,
            dailyReceipts: 0,
            dailyExpenses: 0,
            lastOperation: new Date().toISOString(),
            currency: currency,
            maxLimit: maxLimit,
            description: description,
            autoValidation: autoValidation,
            createdAt: new Date().toISOString(),
            createdBy: window.app.currentUser.id
        };

        window.app.cashRegisters.push(newCashRegister);

        // Log de sécurité
        window.unifiedManager.security.logSecurityEvent('cash_register_created', {
            cashId: newId,
            companyId: window.app.currentCompanyId,
            responsible: responsible ? responsible.email : null
        });

        window.unifiedManager.modalManager.hide();
        window.unifiedManager.notificationManager.show('success', 'Caisse créée', `${name} a été créée avec succès`);

        // Recharger la page
        this.loadCaissePage();
    }

    // Filtrer les caisses
    filterCashRegisters() {
        const search = document.getElementById('cashSearch')?.value.toLowerCase() || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const responsible = document.getElementById('responsibleFilter')?.value || '';

        this.currentFilters = { search, status, responsible };

        document.getElementById('cashRegistersContainer').innerHTML = this.generateCashRegistersGrid();
        
        const cashCount = document.getElementById('cashCount');
        if (cashCount) {
            cashCount.textContent = `(${this.getFilteredCashRegisters().length})`;
        }
    }

    // Obtenir les caisses filtrées
    getFilteredCashRegisters() {
        const cashRegisters = this.data.getCompanyCashRegisters(window.app.currentCompanyId);
        
        return cashRegisters.filter(cash => {
            const matchesSearch = !this.currentFilters.search || 
                cash.name.toLowerCase().includes(this.currentFilters.search);
            
            const matchesStatus = !this.currentFilters.status || cash.status === this.currentFilters.status;
            
            let matchesResponsible = true;
            if (this.currentFilters.responsible === 'assigned') {
                matchesResponsible = !!cash.responsibleId;
            } else if (this.currentFilters.responsible === 'unassigned') {
                matchesResponsible = !cash.responsibleId;
            }

            return matchesSearch && matchesStatus && matchesResponsible;
        });
    }

    // Méthodes utilitaires
    getCashStatusColor(status) {
        const colors = {
            'Ouvert': 'bg-success',
            'Fermé': 'bg-danger',
            'Maintenance': 'bg-warning'
        };
        return colors[status] || 'bg-gray-500';
    }

    getStatusBadgeColor(status) {
        const colors = {
            'Ouvert': 'bg-success/20 text-success',
            'Fermé': 'bg-danger/20 text-danger',
            'Maintenance': 'bg-warning/20 text-warning'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-500';
    }

    // Actions sur les caisses
    openCashOperations(cashId) {
        const cash = window.app.cashRegisters.find(c => c.id === cashId);
        if (!cash) return;

        window.unifiedManager.notificationManager.show('info', 'Opération caisse', `Ouverture des opérations pour ${cash.name}`);
        // Implémenter l'interface d'opération de caisse
    }

    generateCashReport(cashId) {
        const cash = window.app.cashRegisters.find(c => c.id === cashId);
        if (!cash) return;

        window.unifiedManager.notificationManager.show('info', 'Rapport caisse', `Génération de l'état pour ${cash.name}...`);
        // Implémenter la génération de rapport
    }

    editCashRegister(cashId) {
        if (window.app.currentProfile === 'caissier') {
            window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Les caissiers ne peuvent pas modifier les caisses');
            return;
        }

        const cash = window.app.cashRegisters.find(c => c.id === cashId);
        if (!cash) return;

        window.unifiedManager.notificationManager.show('info', 'Modification caisse', `Modification de ${cash.name}`);
        // Implémenter l'édition de caisse
    }

    resetFilters() {
        if (document.getElementById('cashSearch')) document.getElementById('cashSearch').value = '';
        if (document.getElementById('statusFilter')) document.getElementById('statusFilter').value = '';
        if (document.getElementById('responsibleFilter')) document.getElementById('responsibleFilter').value = '';
        this.currentFilters = { search: '', status: '', responsible: '' };
        this.filterCashRegisters();
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
                <p class="text-gray-600 dark:text-gray-400 mt-2 mb-6">Sélectionnez une entreprise dans la barre latérale pour accéder aux caisses.</p>
                <button onclick="window.unifiedManager.loadCompaniesPage()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <i class="fas fa-building mr-2"></i>Sélectionner une entreprise
                </button>
            </div>
        `;
    }
}

// Export de la classe
window.CashController = CashController;

console.log('📦 Module CashController chargé');
