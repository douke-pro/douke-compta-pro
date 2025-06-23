// =============================================================================
// DOUKÈ Compta Pro - Contrôleur de gestion des entreprises v3.1
// =============================================================================

class CompaniesController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.currentFilters = {
            search: '',
            type: '',
            status: '',
            sector: ''
        };
        
        console.log('🏢 CompaniesController initialisé');
    }

    // Charger la page de gestion des entreprises
    loadCompaniesPage() {
        let companies = this.security.getAccessibleCompanies(window.app.currentUser?.id);
        const isAdmin = window.app.currentProfile === 'admin';

        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            ${isAdmin ? 'Gestion des Entreprises' : 'Mes Entreprises'}
                        </h2>
                        <p class="text-gray-600 dark:text-gray-400">
                            ${isAdmin ? 'Administration complète des entreprises clientes' : 'Entreprises qui vous sont assignées'}
                        </p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            ${companies.length} entreprise(s) accessible(s)
                        </div>
                        ${isAdmin ? `
                        <button onclick="window.companiesController.showNewCompanyModal()" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>Nouvelle Entreprise
                        </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Statistiques par type et statut -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                                <p class="text-3xl font-bold text-success">${companies.filter(c => c.status === 'Actif').length}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-check-circle text-success text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Période d'essai</p>
                                <p class="text-3xl font-bold text-warning">${companies.filter(c => c.status === 'Période d\'essai').length}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-clock text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-danger">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Suspendues</p>
                                <p class="text-3xl font-bold text-danger">${companies.filter(c => c.status === 'Suspendu').length}</p>
                            </div>
                            <div class="bg-danger/10 p-3 rounded-lg">
                                <i class="fas fa-pause-circle text-danger text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Caisses</p>
                                <p class="text-3xl font-bold text-info">${companies.reduce((sum, c) => sum + (c.cashRegisters || 0), 0)}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-cash-register text-info text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filtres de recherche -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche</label>
                            <input type="text" id="companySearch" placeholder="Nom, RCCM, email..." 
                                   onkeyup="window.companiesController.filterCompanies()"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                            <select id="typeFilter" onchange="window.companiesController.filterCompanies()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les types</option>
                                <option value="SARL">SARL</option>
                                <option value="SA">SA</option>
                                <option value="EURL">EURL</option>
                                <option value="SAS">SAS</option>
                                <option value="SNC">SNC</option>
                                <option value="SCI">SCI</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="statusFilter" onchange="window.companiesController.filterCompanies()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les statuts</option>
                                <option value="Actif">Actif</option>
                                <option value="Période d'essai">Période d'essai</option>
                                <option value="Suspendu">Suspendu</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secteur</label>
                            <select id="sectorFilter" onchange="window.companiesController.filterCompanies()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les secteurs</option>
                                <option value="Commerce">Commerce</option>
                                <option value="Services">Services</option>
                                <option value="Informatique">Informatique</option>
                                <option value="Digital">Digital</option>
                                <option value="BTP">BTP</option>
                                <option value="Agriculture">Agriculture</option>
                                <option value="Industrie">Industrie</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="window.companiesController.resetFilters()" 
                                    class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                <i class="fas fa-sync mr-2"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Liste des entreprises -->
                <div id="companiesGrid">
                    ${this.generateCompaniesGrid()}
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
    }

    // Générer la grille des entreprises
    generateCompaniesGrid() {
        const filteredCompanies = this.getFilteredCompanies();

        if (filteredCompanies.length === 0) {
            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <i class="fas fa-building text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune entreprise trouvée</h3>
                    <p class="text-gray-600 dark:text-gray-400">Aucune entreprise ne correspond à vos critères de recherche.</p>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${filteredCompanies.map(company => `
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${company.id === window.app.currentCompanyId ? 'border-2 border-primary ring-2 ring-primary/20' : 'border border-gray-200 dark:border-gray-700'} hover:shadow-xl transition-all transform hover:scale-105 card-hover">
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 ${this.getCompanyColor(company.sector)} text-white rounded-lg flex items-center justify-center">
                                    <i class="${this.getCompanyIcon(company.sector)} text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-gray-900 dark:text-white text-lg leading-tight">${company.name}</h3>
                                    <div class="flex items-center space-x-2 mt-1">
                                        <span class="px-2 py-1 rounded text-xs font-medium ${this.getTypeColor(company.type)}">${company.type}</span>
                                        <span class="px-2 py-1 rounded text-xs font-medium ${this.getStatusColor(company.status)}">${company.status}</span>
                                    </div>
                                </div>
                            </div>
                            ${company.id === window.app.currentCompanyId ? `
                                <div class="bg-success text-white p-2 rounded-lg">
                                    <i class="fas fa-check text-sm"></i>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Informations -->
                        <div class="space-y-2 mb-4">
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <i class="fas fa-industry w-4 mr-2"></i>
                                <span>${company.sector || 'Non spécifié'}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <i class="fas fa-phone w-4 mr-2"></i>
                                <span>${company.phone}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <i class="fas fa-envelope w-4 mr-2"></i>
                                <span class="truncate">${company.email}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <i class="fas fa-map-marker-alt w-4 mr-2"></i>
                                <span class="truncate">${company.address}</span>
                            </div>
                        </div>

                        <!-- Statistiques -->
                        <div class="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-center">
                                <div class="text-lg font-bold text-primary">${company.cashRegisters || 0}</div>
                                <div class="text-xs text-gray-500">Caisses</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-info">${this.getCompanyEntriesCount(company.id)}</div>
                                <div class="text-xs text-gray-500">Écritures</div>
                            </div>
                        </div>

                        <!-- Identifiants légaux -->
                        <div class="space-y-1 mb-4 text-xs">
                            <div class="flex justify-between">
                                <span class="text-gray-500">RCCM:</span>
                                <span class="font-mono text-gray-700 dark:text-gray-300">${company.rccm}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-500">NIF:</span>
                                <span class="font-mono text-gray-700 dark:text-gray-300">${company.nif}</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="space-y-2">
                            <button onclick="window.unifiedManager.selectCompany(${company.id})" 
                                    class="w-full ${company.id === window.app.currentCompanyId ? 'bg-success' : 'bg-primary'} text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-all">
                                <i class="fas ${company.id === window.app.currentCompanyId ? 'fa-check' : 'fa-mouse-pointer'} mr-2"></i>
                                ${company.id === window.app.currentCompanyId ? 'Entreprise sélectionnée' : 'Sélectionner cette entreprise'}
                            </button>
                            
                            <div class="flex space-x-2">
                                <button onclick="window.companiesController.viewCompany(${company.id})" 
                                        class="flex-1 bg-info text-white px-3 py-2 rounded-lg text-sm hover:bg-info/90 transition-colors">
                                    <i class="fas fa-eye mr-1"></i>Voir
                                </button>
                                ${window.app.currentProfile === 'admin' ? `
                                <button onclick="window.companiesController.editCompany(${company.id})" 
                                        class="flex-1 bg-warning text-white px-3 py-2 rounded-lg text-sm hover:bg-warning/90 transition-colors">
                                    <i class="fas fa-edit mr-1"></i>Modifier
                                </button>
                                ` : ''}
                                <button onclick="window.companiesController.generateCompanyReport(${company.id})" 
                                        class="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                                    <i class="fas fa-chart-bar mr-1"></i>Rapport
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Filtrer les entreprises
    filterCompanies() {
        const search = document.getElementById('companySearch')?.value.toLowerCase() || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const sector = document.getElementById('sectorFilter')?.value || '';

        this.currentFilters = { search, type, status, sector };

        // Mettre à jour la grille
        document.getElementById('companiesGrid').innerHTML = this.generateCompaniesGrid();
    }

    // Obtenir les entreprises filtrées
    getFilteredCompanies() {
        const accessibleCompanies = this.security.getAccessibleCompanies(window.app.currentUser?.id);
        
        return accessibleCompanies.filter(company => {
            const matchesSearch = !this.currentFilters.search || 
                company.name.toLowerCase().includes(this.currentFilters.search) ||
                company.email.toLowerCase().includes(this.currentFilters.search) ||
                company.rccm.toLowerCase().includes(this.currentFilters.search);
            
            const matchesType = !this.currentFilters.type || company.type === this.currentFilters.type;
            const matchesStatus = !this.currentFilters.status || company.status === this.currentFilters.status;
            const matchesSector = !this.currentFilters.sector || company.sector === this.currentFilters.sector;

            return matchesSearch && matchesType && matchesStatus && matchesSector;
        });
    }

    // Méthodes utilitaires
    getCompanyColor(sector) {
        const colors = {
            'Commerce': 'bg-blue-500',
            'Services': 'bg-green-500',
            'Informatique': 'bg-purple-500',
            'Digital': 'bg-pink-500',
            'BTP': 'bg-orange-500',
            'Agriculture': 'bg-emerald-500',
            'Industrie': 'bg-gray-600'
        };
        return colors[sector] || 'bg-gray-500';
    }

    getCompanyIcon(sector) {
        const icons = {
            'Commerce': 'fas fa-store',
            'Services': 'fas fa-handshake',
            'Informatique': 'fas fa-laptop-code',
            'Digital': 'fas fa-digital-tachograph',
            'BTP': 'fas fa-hard-hat',
            'Agriculture': 'fas fa-seedling',
            'Industrie': 'fas fa-industry'
        };
        return icons[sector] || 'fas fa-building';
    }

    getTypeColor(type) {
        const colors = {
            'SARL': 'bg-blue-100 text-blue-800',
            'SA': 'bg-green-100 text-green-800',
            'EURL': 'bg-yellow-100 text-yellow-800',
            'SAS': 'bg-purple-100 text-purple-800',
            'SNC': 'bg-orange-100 text-orange-800',
            'SCI': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }

    getStatusColor(status) {
        const colors = {
            'Actif': 'bg-success/20 text-success',
            'Période d\'essai': 'bg-warning/20 text-warning',
            'Suspendu': 'bg-danger/20 text-danger'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-500';
    }

    getCompanyEntriesCount(companyId) {
        return window.app.entries.filter(e => e.companyId === companyId).length;
    }

    // Actions sur les entreprises
    viewCompany(companyId) {
        const company = window.app.companies.find(c => c.id === companyId);
        if (!company) return;

        window.unifiedManager.notificationManager.show('info', 'Vue entreprise', `Affichage des détails de ${company.name}`);
        // Implémenter la vue détaillée
    }

    editCompany(companyId) {
        if (window.app.currentProfile !== 'admin') {
            window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Seuls les administrateurs peuvent modifier les entreprises');
            return;
        }

        const company = window.app.companies.find(c => c.id === companyId);
        if (!company) return;

        // Implémenter l'édition d'entreprise
        window.unifiedManager.notificationManager.show('info', 'Édition entreprise', `Modification de ${company.name}`);
    }

    generateCompanyReport(companyId) {
        const company = window.app.companies.find(c => c.id === companyId);
        if (!company) return;

        window.unifiedManager.notificationManager.show('info', 'Rapport en cours', `Génération du rapport pour ${company.name}...`);
        // Implémenter la génération de rapport
    }

    showNewCompanyModal() {
        if (window.app.currentProfile !== 'admin') {
            window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Seuls les administrateurs peuvent créer des entreprises');
            return;
        }

        // Implémenter le modal de création d'entreprise
        window.unifiedManager.notificationManager.show('info', 'Nouvelle entreprise', 'Modal de création d\'entreprise (à implémenter)');
    }

    resetFilters() {
        document.getElementById('companySearch').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sectorFilter').value = '';
        this.currentFilters = { search: '', type: '', status: '', sector: '' };
        this.filterCompanies();
    }
}

// Export de la classe
window.CompaniesController = CompaniesController;

console.log('📦 Module CompaniesController chargé');
