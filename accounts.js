// =============================================================================
// ACCOUNTS.JS - Gestion sécurisée du plan comptable par entreprise
// =============================================================================

function loadAccounts() {
    // Vérification critique de la sélection d'entreprise
    if (!app.currentCompanyId) {
        showCompanySelectionWarning('plan comptable');
        return;
    }

    // Vérification de l'accès à l'entreprise sélectionnée
    if (!hasAccessToCompany(app.currentCompanyId)) {
        showAccessDeniedMessage('plan comptable de cette entreprise');
        return;
    }

    console.log(`📊 Chargement du plan comptable pour entreprise: ${app.currentCompanyId}`);

    // Mettre à jour le cache des données filtrées
    updateFilteredDataCache();

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Comptes Disponibles' : 'Plan Comptable SYSCOHADA Révisé'}
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
    </div>
    ${canManageAccounts() ? `
    <button onclick="openAddAccountModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Nouveau Compte
    </button>
    ` : ''}
    </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    ${generateAccountsStats()}
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <input type="text" id="accountSearch" placeholder="Rechercher un compte..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" oninput="filterAccounts()">
    <select id="categoryFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterAccounts()">
    <option value="">Toutes les catégories</option>
    ${getAvailableCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
    </select>
    <select id="statusFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterAccounts()">
    <option value="">Tous les statuts</option>
    <option value="active">Actifs</option>
    <option value="inactive">Inactifs</option>
    <option value="mandatory">Obligatoires</option>
    </select>
    <button onclick="resetAccountFilters()" class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors">
    <i class="fas fa-sync mr-2"></i>Reset
    </button>
    </div>
    </div>

    <!-- Plan comptable par classes -->
    <div class="grid grid-cols-1 gap-6" id="accountsContainer">
    <div class="text-center py-8">
    <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
    <div class="mt-2 text-gray-500">Chargement du plan comptable...</div>
    </div>
    </div>

    ${canManageAccounts() ? `
    <!-- Actions d'import/export -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions de gestion</h3>
    <div class="flex flex-wrap gap-4">
    <button onclick="exportAccountingPlan()" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-download mr-2"></i>Exporter le plan
    </button>
    <button onclick="importAccountingPlan()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-upload mr-2"></i>Importer un plan
    </button>
    <button onclick="resetToStandardPlan()" class="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-undo mr-2"></i>Réinitialiser au plan standard
    </button>
    <button onclick="syncAccountingPlan()" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Synchroniser
    </button>
    </div>
    </div>
    ` : ''}
    </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    
    // Charger et afficher le plan comptable
    loadAndDisplayAccounts();
}

// =============================================================================
// FONCTIONS DE VÉRIFICATION DES DROITS - CRITIQUES
// =============================================================================

function canManageAccounts() {
    if (!app.currentCompanyId || !hasAccessToCompany(app.currentCompanyId)) {
        return false;
    }
    
    // Seuls admin et collaborateurs peuvent gérer les comptes
    return app.currentProfile === 'admin' || 
           app.currentProfile === 'collaborateur_senior' || 
           app.currentProfile === 'collaborateur';
}

function canEditAccount(account) {
    if (!canManageAccounts()) {
        return false;
    }
    
    // Admin peut tout modifier
    if (app.currentProfile === 'admin') {
        return true;
    }
    
    // Collaborateurs ne peuvent pas modifier les comptes obligatoires
    return !account.mandatory;
}

function canDeleteAccount(account) {
    if (!canManageAccounts()) {
        return false;
    }
    
    // Admin peut tout supprimer (sauf obligatoires)
    if (app.currentProfile === 'admin' && !account.mandatory) {
        return true;
    }
    
    // Collaborateurs ne peuvent supprimer que les comptes non obligatoires et non utilisés
    if (!account.mandatory && !isAccountUsed(account.code)) {
        return true;
    }
    
    return false;
}

function isAccountUsed(accountCode) {
    const entries = getSecureFilteredEntries();
    return entries.some(entry => 
        entry.lines.some(line => line.account === accountCode)
    );
}

// =============================================================================
// CHARGEMENT ET AFFICHAGE SÉCURISÉ DU PLAN COMPTABLE
// =============================================================================

let currentAccountsFilter = {
    search: '',
    category: '',
    status: '',
    sortBy: 'code',
    sortOrder: 'asc'
};

function loadAndDisplayAccounts() {
    try {
        // Obtenir le plan comptable sécurisé de l'entreprise active
        const accounts = getSecureCompanyAccountingPlan();
        console.log(`📊 ${accounts.length} compte(s) chargé(s) pour l'entreprise ${app.currentCompanyId}`);
        
        if (accounts.length === 0) {
            displayEmptyAccountingPlan();
            return;
        }
        
        // Appliquer les filtres
        const filteredAccounts = applyAccountsFilters(accounts);
        
        // Afficher les comptes
        displayAccounts(filteredAccounts);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du plan comptable:', error);
        showErrorMessage('Erreur lors du chargement du plan comptable');
        
        // Afficher un message d'erreur
        document.getElementById('accountsContainer').innerHTML = `
        <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
        <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
        <div class="text-red-700 dark:text-red-300 font-medium">Erreur lors du chargement du plan comptable</div>
        <div class="text-red-600 dark:text-red-400 text-sm mt-2">Veuillez réessayer ou contacter l'administrateur</div>
        <button onclick="loadAndDisplayAccounts()" class="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
        <i class="fas fa-redo mr-2"></i>Réessayer
        </button>
        </div>
        `;
    }
}

function displayEmptyAccountingPlan() {
    document.getElementById('accountsContainer').innerHTML = `
    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-8 text-center">
    <i class="fas fa-chart-bar text-3xl text-yellow-500 mb-4"></i>
    <div class="text-yellow-700 dark:text-yellow-300 font-medium">Plan comptable vide</div>
    <div class="text-yellow-600 dark:text-yellow-400 text-sm mt-2">Cette entreprise n'a pas encore de plan comptable configuré</div>
    ${canManageAccounts() ? `
    <div class="mt-4 space-x-4">
    <button onclick="resetToStandardPlan()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg">
    <i class="fas fa-plus mr-2"></i>Créer le plan standard
    </button>
    <button onclick="importAccountingPlan()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg">
    <i class="fas fa-upload mr-2"></i>Importer un plan
    </button>
    </div>
    ` : ''}
    </div>
    `;
}

function applyAccountsFilters(accounts) {
    let filtered = [...accounts];
    
    // Filtre de recherche
    if (currentAccountsFilter.search) {
        const search = currentAccountsFilter.search.toLowerCase();
        filtered = filtered.filter(account => 
            account.code.toLowerCase().includes(search) ||
            account.name.toLowerCase().includes(search) ||
            account.category.toLowerCase().includes(search)
        );
    }
    
    // Filtre par catégorie
    if (currentAccountsFilter.category) {
        filtered = filtered.filter(account => account.category === currentAccountsFilter.category);
    }
    
    // Filtre par statut
    if (currentAccountsFilter.status) {
        switch (currentAccountsFilter.status) {
            case 'active':
                filtered = filtered.filter(account => account.isActive !== false);
                break;
            case 'inactive':
                filtered = filtered.filter(account => account.isActive === false);
                break;
            case 'mandatory':
                filtered = filtered.filter(account => account.mandatory === true);
                break;
        }
    }
    
    // Tri
    filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (currentAccountsFilter.sortBy) {
            case 'code':
                aValue = a.code;
                bValue = b.code;
                break;
            case 'name':
                aValue = a.name;
                bValue = b.name;
                break;
            case 'category':
                aValue = a.category;
                bValue = b.category;
                break;
            default:
                aValue = a.code;
                bValue = b.code;
        }
        
        if (currentAccountsFilter.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    return filtered;
}

function displayAccounts(accounts) {
    const accountsByClass = groupAccountsByClass(accounts);
    
    let html = '';
    Object.entries(accountsByClass).forEach(([classNumber, classData]) => {
        if (classData.accounts.length > 0) {
            html += generateAccountClassHTML(classData, classNumber);
        }
    });
    
    if (html === '') {
        html = `
        <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 text-center">
        <i class="fas fa-search text-3xl text-gray-400 mb-4"></i>
        <div class="text-gray-600 dark:text-gray-300">Aucun compte trouvé avec ces filtres</div>
        <button onclick="resetAccountFilters()" class="mt-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg">
        <i class="fas fa-undo mr-2"></i>Réinitialiser les filtres
        </button>
        </div>
        `;
    }
    
    document.getElementById('accountsContainer').innerHTML = html;
}

function groupAccountsByClass(accounts) {
    const accountsByClass = {
        1: { name: 'Classe 1 - Comptes de ressources durables', accounts: [] },
        2: { name: 'Classe 2 - Comptes d\'actif immobilisé', accounts: [] },
        3: { name: 'Classe 3 - Comptes de stocks', accounts: [] },
        4: { name: 'Classe 4 - Comptes de tiers', accounts: [] },
        5: { name: 'Classe 5 - Comptes financiers', accounts: [] },
        6: { name: 'Classe 6 - Comptes de charges', accounts: [] },
        7: { name: 'Classe 7 - Comptes de produits', accounts: [] },
        8: { name: 'Classe 8 - Comptes de résultats', accounts: [] },
        9: { name: 'Classe 9 - Comptes analytiques', accounts: [] }
    };

    accounts.forEach(account => {
        const classNumber = parseInt(account.code.charAt(0));
        if (accountsByClass[classNumber]) {
            accountsByClass[classNumber].accounts.push(account);
        }
    });

    return accountsByClass;
}

function generateAccountClassHTML(classData, classNumber) {
    const totalBalance = classData.accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center">
    <div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${classData.name}</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400">${classData.accounts.length} compte(s)</p>
    </div>
    <div class="text-right">
    <div class="text-sm text-gray-500 dark:text-gray-400">Solde total</div>
    <div class="font-bold text-gray-900 dark:text-white">${totalBalance.toLocaleString('fr-FR')} FCFA</div>
    </div>
    </div>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortAccounts('code')">
    Code <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortAccounts('name')">
    Intitulé <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortAccounts('category')">
    Catégorie <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    ${classData.accounts.map(account => generateAccountRow(account)).join('')}
    </tbody>
    </table>
    </div>
    </div>
    `;
}

function generateAccountRow(account) {
    const isUsed = isAccountUsed(account.code);
    const canEdit = canEditAccount(account);
    const canDelete = canDeleteAccount(account);
    
    return `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">
    <div class="flex items-center">
    <span>${account.code}</span>
    ${account.mandatory ? '<i class="fas fa-star text-yellow-500 ml-2" title="Compte obligatoire"></i>' : ''}
    </div>
    </td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">
    <div class="max-w-xs truncate" title="${account.name}">
    ${account.name}
    </div>
    </td>
    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
    ${account.category}
    </span>
    </td>
    <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">
    ${(account.balance || 0).toLocaleString('fr-FR')} FCFA
    </td>
    <td class="px-6 py-4">
    <div class="flex items-center space-x-2">
    ${getAccountStatusBadge(account)}
    ${isUsed ? '<i class="fas fa-link text-blue-500" title="Compte utilisé dans des écritures"></i>' : ''}
    </div>
    </td>
    <td class="px-6 py-4">
    <div class="flex space-x-2">
    <button onclick="viewAccountDetails('${account.code}')" class="text-primary hover:text-primary/80" title="Voir détails">
    <i class="fas fa-eye"></i>
    </button>
    ${canEdit ? `
    <button onclick="editAccountModal('${account.code}')" class="text-info hover:text-info/80" title="Modifier">
    <i class="fas fa-edit"></i>
    </button>
    ` : ''}
    <button onclick="duplicateAccount('${account.code}')" class="text-purple-500 hover:text-purple-400" title="Dupliquer">
    <i class="fas fa-copy"></i>
    </button>
    ${canDelete ? `
    <button onclick="confirmDeleteAccount('${account.code}')" class="text-danger hover:text-danger/80" title="Supprimer">
    <i class="fas fa-trash"></i>
    </button>
    ` : ''}
    </div>
    </td>
    </tr>
    `;
}

function getAccountStatusBadge(account) {
    if (account.isActive === false) {
        return '<span class="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs">Inactif</span>';
    }
    return '<span class="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs">Actif</span>';
}

function generateAccountsStats() {
    const accounts = getSecureCompanyAccountingPlan();
    
    const stats = {
        total: accounts.length,
        active: accounts.filter(a => a.isActive !== false).length,
        mandatory: accounts.filter(a => a.mandatory === true).length,
        used: accounts.filter(a => isAccountUsed(a.code)).length
    };
    
    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
    <i class="fas fa-chart-bar text-blue-600 dark:text-blue-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.total}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Total comptes</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
    <i class="fas fa-check-circle text-green-600 dark:text-green-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.active}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Actifs</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
    <i class="fas fa-star text-yellow-600 dark:text-yellow-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.mandatory}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Obligatoires</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
    <i class="fas fa-link text-purple-600 dark:text-purple-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.used}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Utilisés</div>
    </div>
    </div>
    </div>
    `;
}

function getAvailableCategories() {
    const accounts = getSecureCompanyAccountingPlan();
    const categories = [...new Set(accounts.map(account => account.category))];
    return categories.sort();
}

// =============================================================================
// FONCTIONS DE FILTRAGE ET TRI
// =============================================================================

function filterAccounts() {
    currentAccountsFilter.search = document.getElementById('accountSearch')?.value || '';
    currentAccountsFilter.category = document.getElementById('categoryFilter')?.value || '';
    currentAccountsFilter.status = document.getElementById('statusFilter')?.value || '';
    
    loadAndDisplayAccounts();
}

function sortAccounts(field) {
    if (currentAccountsFilter.sortBy === field) {
        currentAccountsFilter.sortOrder = currentAccountsFilter.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentAccountsFilter.sortBy = field;
        currentAccountsFilter.sortOrder = 'asc';
    }
    
    loadAndDisplayAccounts();
}

function resetAccountFilters() {
    document.getElementById('accountSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    
    currentAccountsFilter = {
        search: '',
        category: '',
        status: '',
        sortBy: 'code',
        sortOrder: 'asc'
    };
    
    loadAndDisplayAccounts();
}

// =============================================================================
// MODAL DE CRÉATION/MODIFICATION DE COMPTE
// =============================================================================

function openAddAccountModal() {
    if (!canManageAccounts()) {
        showErrorMessage('Vous n\'avez pas les droits pour créer des comptes dans cette entreprise.');
        return;
    }
    
    openAccountModal();
}

function editAccountModal(accountCode) {
    const accounts = getSecureCompanyAccountingPlan();
    const account = accounts.find(a => a.code === accountCode);
    
    if (!account) {
        showErrorMessage('Compte non trouvé.');
        return;
    }
    
    if (!canEditAccount(account)) {
        showErrorMessage('Vous n\'avez pas les droits pour modifier ce compte.');
        return;
    }
    
    openAccountModal(account);
}

function openAccountModal(existingAccount = null) {
    const isEdit = existingAccount !== null;
    
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-primary"></i>
    ${isEdit ? 'Modifier le Compte' : 'Nouveau Compte'}
    </h3>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>

    <!-- Informations de l'entreprise -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
    <div class="flex items-center text-blue-700 dark:text-blue-300">
    <i class="fas fa-building mr-2"></i>
    <span class="font-medium">${getCompanyName()}</span>
    <span class="ml-2 text-sm opacity-75">(ID: ${app.currentCompanyId})</span>
    </div>
    </div>

    <form id="accountForm" class="space-y-6">
    <input type="hidden" id="originalAccountCode" value="${existingAccount ? existingAccount.code : ''}">
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code du compte *</label>
    <input type="text" id="accountCode" required pattern="[0-9]{6}" maxlength="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base font-mono" placeholder="Ex: 512001" value="${existingAccount ? existingAccount.code : ''}" ${isEdit && existingAccount.mandatory ? 'readonly' : ''}>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">6 chiffres selon SYSCOHADA Révisé</p>
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
    <select id="accountStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="true" ${!existingAccount || existingAccount.isActive !== false ? 'selected' : ''}>Actif</option>
    <option value="false" ${existingAccount && existingAccount.isActive === false ? 'selected' : ''}>Inactif</option>
    </select>
    </div>
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Intitulé du compte *</label>
    <input type="text" id="accountName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Ex: Banque SGBCI Plateau" value="${existingAccount ? existingAccount.name : ''}">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie *</label>
    <select id="accountCategory" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="">-- Sélectionner une catégorie --</option>
    ${getSyscohadaCategories().map(cat => 
        `<option value="${cat}" ${existingAccount && existingAccount.category === cat ? 'selected' : ''}>${cat}</option>`
    ).join('')}
    </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Solde initial</label>
    <input type="number" step="0.01" id="accountBalance" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="0.00" value="${existingAccount ? (existingAccount.balance || 0) : 0}">
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Montant en FCFA</p>
    </div>

    <div>
    <div class="flex items-center mt-8">
    <input type="checkbox" id="accountMandatory" class="mr-2" ${existingAccount && existingAccount.mandatory ? 'checked disabled' : ''}>
    <label for="accountMandatory" class="text-sm text-gray-700 dark:text-gray-300">
    Compte obligatoire
    ${existingAccount && existingAccount.mandatory ? ' (non modifiable)' : ''}
    </label>
    </div>
    </div>
    </div>

    ${existingAccount ? `
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <h4 class="font-medium text-gray-900 dark:text-white mb-2">Informations</h4>
    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
    <div>Créé le : ${new Date(existingAccount.createdAt).toLocaleDateString('fr-FR')} ${new Date(existingAccount.createdAt).toLocaleTimeString('fr-FR')}</div>
    <div>Utilisé dans : ${isAccountUsed(existingAccount.code) ? 'Oui' : 'Non'} écriture(s)</div>
    <div>ID : ${existingAccount.id}</div>
    </div>
    </div>
    ` : ''}

    <div class="flex justify-end space-x-4">
    <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Annuler
    </button>
    <button type="submit" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-${isEdit ? 'save' : 'plus'} mr-2"></i>
    ${isEdit ? 'Modifier' : 'Créer'}
    </button>
    </div>
    </form>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveAccount();
            });
        }
    }, 100);
}

function getSyscohadaCategories() {
    return [
        'Capitaux propres',
        'Dettes financières',
        'Immobilisations corporelles',
        'Immobilisations incorporelles',
        'Immobilisations financières',
        'Stocks',
        'Clients',
        'Fournisseurs',
        'Personnel',
        'Organismes sociaux',
        'État',
        'Associés',
        'Actionnaires',
        'Dirigeants',
        'Comptes transitoires',
        'Comptes bancaires',
        'Comptes postaux',
        'Caisse',
        'Virements',
        'Achats',
        'Services extérieurs',
        'Charges de personnel',
        'Impôts et taxes',
        'Dotations',
        'Charges financières',
        'Ventes',
        'Produits financiers',
        'Reprises',
        'Résultats',
        'Comptabilité analytique'
    ];
}

// =============================================================================
// SAUVEGARDE SÉCURISÉE DES COMPTES
// =============================================================================

function saveAccount() {
    try {
        if (!canManageAccounts()) {
            showErrorMessage('Vous n\'avez pas les droits pour gérer les comptes dans cette entreprise.');
            return;
        }
        
        const originalCode = document.getElementById('originalAccountCode').value;
        const isEdit = originalCode !== '';
        
        const accountData = {
            code: document.getElementById('accountCode').value,
            name: document.getElementById('accountName').value,
            category: document.getElementById('accountCategory').value,
            balance: parseFloat(document.getElementById('accountBalance').value) || 0,
            isActive: document.getElementById('accountStatus').value === 'true',
            mandatory: document.getElementById('accountMandatory').checked
        };
        
        // Validation
        if (!accountData.code || !accountData.name || !accountData.category) {
            showErrorMessage('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        if (!/^[0-9]{6}$/.test(accountData.code)) {
            showErrorMessage('Le code doit contenir exactement 6 chiffres.');
            return;
        }
        
        // Vérifier l'unicité du code dans le plan comptable de l'entreprise
        const accounts = getSecureCompanyAccountingPlan();
        const existingAccount = accounts.find(acc => acc.code === accountData.code && acc.code !== originalCode);
        if (existingAccount) {
            showErrorMessage('Ce code de compte existe déjà dans cette entreprise.');
            return;
        }
        
        // Obtenir l'entreprise et son plan comptable
        const company = app.companies.find(c => c.id === app.currentCompanyId);
        if (!company) {
            showErrorMessage('Entreprise non trouvée.');
            return;
        }
        
        if (!company.accountingPlan) {
            company.accountingPlan = [];
        }
        
        if (isEdit) {
            // Modification
            const accountIndex = company.accountingPlan.findIndex(acc => acc.code === originalCode);
            if (accountIndex !== -1) {
                company.accountingPlan[accountIndex] = {
                    ...company.accountingPlan[accountIndex],
                    ...accountData,
                    updatedAt: new Date().toISOString(),
                    updatedBy: app.currentUser.id
                };
                console.log('✅ Compte modifié:', company.accountingPlan[accountIndex]);
            } else {
                showErrorMessage('Compte non trouvé pour modification.');
                return;
            }
        } else {
            // Création
            const newAccount = {
                ...accountData,
                id: `${app.currentCompanyId}_${accountData.code}_${Date.now()}`,
                createdAt: new Date().toISOString(),
                createdBy: app.currentUser.id
            };
            
            company.accountingPlan.push(newAccount);
            
            // Trier par code
            company.accountingPlan.sort((a, b) => a.code.localeCompare(b.code));
            
            console.log('✅ Nouveau compte créé:', newAccount);
        }
        
        // Mettre à jour le cache des données filtrées
        updateFilteredDataCache();
        
        // Ajouter à la queue de synchronisation
        if (dataSyncManager.canSyncData()) {
            dataSyncManager.queueDataForSync(
                'accounts', 
                isEdit ? 'update' : 'create', 
                accountData, 
                app.currentCompanyId
            );
        }
        
        closeModal();
        loadAndDisplayAccounts();
        
        const message = isEdit ? 'Compte modifié avec succès.' : 'Compte créé avec succès.';
        showSuccessMessage(message);
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du compte:', error);
        showErrorMessage('Erreur lors de la sauvegarde: ' + error.message);
    }
}

// =============================================================================
// ACTIONS SUR LES COMPTES - IMPLÉMENTATION COMPLÈTE
// =============================================================================

function viewAccountDetails(accountCode) {
    const accounts = getSecureCompanyAccountingPlan();
    const account = accounts.find(a => a.code === accountCode);
    
    if (!account) {
        showErrorMessage('Compte non trouvé.');
        return;
    }
    
    const entries = getSecureFilteredEntries();
    const accountEntries = entries.filter(entry => 
        entry.lines.some(line => line.account === accountCode)
    );
    
    const accountBalance = calculateAccountBalance(accountCode, accountEntries);
    
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-eye mr-2 text-primary"></i>Détails du Compte
    </h3>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>

    <!-- Informations générales -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Informations du compte</h4>
    <div class="space-y-3">
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Code:</span>
    <span class="font-mono font-medium text-gray-900 dark:text-white">${account.code}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Intitulé:</span>
    <span class="font-medium text-gray-900 dark:text-white">${account.name}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Catégorie:</span>
    <span class="font-medium text-gray-900 dark:text-white">${account.category}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Statut:</span>
    <span>${getAccountStatusBadge(account)}</span>
    </div>
    ${account.mandatory ? `
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Type:</span>
    <span class="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs">
    <i class="fas fa-star mr-1"></i>Obligatoire
    </span>
    </div>
    ` : ''}
    </div>
    </div>
    
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Soldes et mouvements</h4>
    <div class="space-y-3">
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Solde initial:</span>
    <span class="font-mono font-medium text-gray-900 dark:text-white">${(account.balance || 0).toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Total débits:</span>
    <span class="font-mono font-medium text-gray-900 dark:text-white">${accountBalance.totalDebit.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Total crédits:</span>
    <span class="font-mono font-medium text-gray-900 dark:text-white">${accountBalance.totalCredit.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="flex justify-between border-t pt-2">
    <span class="font-semibold text-gray-900 dark:text-white">Solde actuel:</span>
    <span class="font-mono font-bold text-lg ${accountBalance.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}">${accountBalance.currentBalance.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Nombre d'écritures:</span>
    <span class="font-medium text-gray-900 dark:text-white">${accountEntries.length}</span>
    </div>
    </div>
    </div>
    </div>

    <!-- Métadonnées -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Métadonnées</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
    <div>
    <span class="text-gray-600 dark:text-gray-400">Créé le:</span>
    <span class="ml-2 text-gray-900 dark:text-white">${new Date(account.createdAt).toLocaleDateString('fr-FR')} ${new Date(account.createdAt).toLocaleTimeString('fr-FR')}</span>
    </div>
    ${account.updatedAt ? `
    <div>
    <span class="text-gray-600 dark:text-gray-400">Modifié le:</span>
    <span class="ml-2 text-gray-900 dark:text-white">${new Date(account.updatedAt).toLocaleDateString('fr-FR')} ${new Date(account.updatedAt).toLocaleTimeString('fr-FR')}</span>
    </div>
    ` : ''}
    <div>
    <span class="text-gray-600 dark:text-gray-400">Entreprise:</span>
    <span class="ml-2 text-gray-900 dark:text-white">${getCompanyName()}</span>
    </div>
    <div>
    <span class="text-gray-600 dark:text-gray-400">ID:</span>
    <span class="ml-2 font-mono text-gray-900 dark:text-white">${account.id}</span>
    </div>
    </div>
    </div>

    <!-- Dernières écritures -->
    ${accountEntries.length > 0 ? `
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Dernières écritures (${Math.min(accountEntries.length, 5)} sur ${accountEntries.length})</h4>
    <div class="overflow-x-auto">
    <table class="min-w-full">
    <thead>
    <tr class="border-b border-gray-300 dark:border-gray-600">
    <th class="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
    <th class="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Libellé</th>
    <th class="text-right py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Débit</th>
    <th class="text-right py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Crédit</th>
    </tr>
    </thead>
    <tbody>
    ${accountEntries.slice(-5).reverse().map(entry => {
        const line = entry.lines.find(l => l.account === accountCode);
        return `
        <tr class="border-b border-gray-200 dark:border-gray-600">
        <td class="py-2 text-sm text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
        <td class="py-2 text-sm text-gray-900 dark:text-white">${line.libelle}</td>
        <td class="py-2 text-sm text-right font-mono text-gray-900 dark:text-white">${line.debit > 0 ? line.debit.toLocaleString('fr-FR') : '-'}</td>
        <td class="py-2 text-sm text-right font-mono text-gray-900 dark:text-white">${line.credit > 0 ? line.credit.toLocaleString('fr-FR') : '-'}</td>
        </tr>
        `;
    }).join('')}
    </tbody>
    </table>
    </div>
    </div>
    ` : ''}

    <!-- Actions -->
    <div class="flex justify-end space-x-4 mt-6">
    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Fermer
    </button>
    ${canEditAccount(account) ? `
    <button onclick="closeModal(); editAccountModal('${account.code}')" class="bg-info hover:bg-info/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-edit mr-2"></i>Modifier
    </button>
    ` : ''}
    <button onclick="duplicateAccount('${account.code}')" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-copy mr-2"></i>Dupliquer
    </button>
    </div>
    </div>
    </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

function calculateAccountBalance(accountCode, entries) {
    let totalDebit = 0;
    let totalCredit = 0;
    
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            if (line.account === accountCode) {
                totalDebit += line.debit || 0;
                totalCredit += line.credit || 0;
            }
        });
    });
    
    const currentBalance = totalDebit - totalCredit;
    
    return {
        totalDebit,
        totalCredit,
        currentBalance
    };
}

function duplicateAccount(accountCode) {
    const accounts = getSecureCompanyAccountingPlan();
    const account = accounts.find(a => a.code === accountCode);
    
    if (!account) {
        showErrorMessage('Compte non trouvé.');
        return;
    }
    
    if (!canManageAccounts()) {
        showErrorMessage('Vous n\'avez pas les droits pour créer des comptes dans cette entreprise.');
        return;
    }
    
    // Générer un nouveau code
    let newCode = account.code;
    let counter = 1;
    
    while (accounts.some(a => a.code === newCode)) {
        newCode = (parseInt(account.code) + counter).toString().padStart(6, '0');
        counter++;
        if (counter > 999) break;
    }
    
    if (accounts.some(a => a.code === newCode)) {
        showErrorMessage('Impossible de générer un nouveau code de compte.');
        return;
    }
    
    try {
        const company = app.companies.find(c => c.id === app.currentCompanyId);
        if (!company || !company.accountingPlan) {
            showErrorMessage('Plan comptable non trouvé.');
            return;
        }
        
        const duplicatedAccount = {
            ...account,
            code: newCode,
            name: `[COPIE] ${account.name}`,
            balance: 0,
            mandatory: false,
            id: `${app.currentCompanyId}_${newCode}_${Date.now()}`,
            createdAt: new Date().toISOString(),
            createdBy: app.currentUser.id,
            updatedAt: null,
            updatedBy: null
        };
        
        company.accountingPlan.push(duplicatedAccount);
        company.accountingPlan.sort((a, b) => a.code.localeCompare(b.code));
        
        // Mettre à jour le cache
        updateFilteredDataCache();
        
        // Ajouter à la queue de synchronisation
        if (dataSyncManager.canSyncData()) {
            dataSyncManager.queueDataForSync('accounts', 'create', duplicatedAccount, app.currentCompanyId);
        }
        
        loadAndDisplayAccounts();
        showSuccessMessage(`Compte dupliqué avec succès (nouveau code: ${newCode}).`);
        console.log('✅ Compte dupliqué:', duplicatedAccount);
        
    } catch (error) {
        console.error('❌ Erreur lors de la duplication:', error);
        showErrorMessage('Erreur lors de la duplication: ' + error.message);
    }
}

function confirmDeleteAccount(accountCode) {
    const accounts = getSecureCompanyAccountingPlan();
    const account = accounts.find(a => a.code === accountCode);
    
    if (!account) {
        showErrorMessage('Compte non trouvé.');
        return;
    }
    
    if (!canDeleteAccount(account)) {
        if (account.mandatory) {
            showErrorMessage('Ce compte est obligatoire et ne peut pas être supprimé.');
        } else if (isAccountUsed(accountCode)) {
            showErrorMessage('Ce compte est utilisé dans des écritures et ne peut pas être supprimé.');
        } else {
            showErrorMessage('Vous n\'avez pas les droits pour supprimer ce compte.');
        }
        return;
    }
    
    const message = `Êtes-vous sûr de vouloir supprimer le compte :\n\n${account.code} - ${account.name}\n\nCette action est irréversible.`;
    
    if (confirm(message)) {
        try {
            const company = app.companies.find(c => c.id === app.currentCompanyId);
            if (!company || !company.accountingPlan) {
                showErrorMessage('Plan comptable non trouvé.');
                return;
            }
            
            const accountIndex = company.accountingPlan.findIndex(a => a.code === accountCode);
            if (accountIndex !== -1) {
                const deletedAccount = company.accountingPlan.splice(accountIndex, 1)[0];
                
                // Mettre à jour le cache
                updateFilteredDataCache();
                
                // Ajouter à la queue de synchronisation
                if (dataSyncManager.canSyncData()) {
                    dataSyncManager.queueDataForSync('accounts', 'delete', deletedAccount, app.currentCompanyId);
                }
                
                loadAndDisplayAccounts();
                showSuccessMessage('Compte supprimé avec succès.');
                console.log('✅ Compte supprimé:', deletedAccount);
            } else {
                showErrorMessage('Erreur lors de la suppression.');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            showErrorMessage('Erreur lors de la suppression: ' + error.message);
        }
    }
}

// =============================================================================
// FONCTIONS D'IMPORT/EXPORT ET GESTION DU PLAN
// =============================================================================

function exportAccountingPlan() {
    if (!canManageAccounts()) {
        showErrorMessage('Vous n\'avez pas les droits pour exporter le plan comptable.');
        return;
    }
    
    try {
        const accounts = getSecureCompanyAccountingPlan();
        const company = app.companies.find(c => c.id === app.currentCompanyId);
        
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            company: {
                id: company.id,
                name: company.name,
                type: company.type
            },
            accounts: accounts.map(account => ({
                code: account.code,
                name: account.name,
                category: account.category,
                balance: account.balance || 0,
                isActive: account.isActive !== false,
                mandatory: account.mandatory || false
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan-comptable-${company.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showSuccessMessage('Plan comptable exporté avec succès.');
        console.log('✅ Export du plan comptable effectué:', exportData);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'export:', error);
        showErrorMessage('Erreur lors de l\'export: ' + error.message);
    }
}

function importAccountingPlan() {
    if (!canManageAccounts()) {
        showErrorMessage('Vous n\'avez pas les droits pour importer un plan comptable.');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.accounts || !Array.isArray(importData.accounts)) {
                    throw new Error('Format de fichier invalide');
                }
                
                if (confirm(`Importer ${importData.accounts.length} compte(s) ?\n\nCela remplacera le plan comptable actuel de l'entreprise.`)) {
                    const company = app.companies.find(c => c.id === app.currentCompanyId);
                    if (!company) {
                        showErrorMessage('Entreprise non trouvée.');
                        return;
                    }
                    
                    // Convertir les comptes importés au format interne
                    const importedAccounts = importData.accounts.map((account, index) => ({
                        ...account,
                        id: `${app.currentCompanyId}_${account.code}_${Date.now()}_${index}`,
                        createdAt: new Date().toISOString(),
                        createdBy: app.currentUser.id,
                        isActive: account.isActive !== false
                    }));
                    
                    company.accountingPlan = importedAccounts;
                    
                    // Mettre à jour le cache
                    updateFilteredDataCache();
                    
                    // Ajouter à la queue de synchronisation
                    if (dataSyncManager.canSyncData()) {
                        dataSyncManager.queueDataForSync('accounts', 'bulk_import', importedAccounts, app.currentCompanyId);
                    }
                    
                    loadAndDisplayAccounts();
                    showSuccessMessage(`${importedAccounts.length} compte(s) importé(s) avec succès.`);
                    console.log('✅ Import du plan comptable effectué:', importedAccounts);
                }
            } catch (error) {
                console.error('❌ Erreur lors de l\'import:', error);
                showErrorMessage('Erreur lors de l\'import: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function resetToStandardPlan() {
    if (!canManageAccounts()) {
        showErrorMessage('Vous n\'avez pas les droits pour réinitialiser le plan comptable.');
        return;
    }
    
    const company = app.companies.find(c => c.id === app.currentCompanyId);
    if (!company) {
        showErrorMessage('Entreprise non trouvée.');
        return;
    }
    
    if (confirm(`Réinitialiser le plan comptable au plan standard SYSCOHADA ?\n\nCela remplacera tous les comptes actuels de ${company.name}.`)) {
        try {
            // Générer le plan comptable standard pour le type d'entreprise
            const standardPlan = generateCompanyAccountingPlan(company.type);
            
            company.accountingPlan = standardPlan;
            
            // Mettre à jour le cache
            updateFilteredDataCache();
            
            // Ajouter à la queue de synchronisation
            if (dataSyncManager.canSyncData()) {
                dataSyncManager.queueDataForSync('accounts', 'reset_standard', standardPlan, app.currentCompanyId);
            }
            
            loadAndDisplayAccounts();
            showSuccessMessage(`Plan comptable réinitialisé avec ${standardPlan.length} compte(s) standard.`);
            console.log('✅ Plan comptable réinitialisé:', standardPlan);
            
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation:', error);
            showErrorMessage('Erreur lors de la réinitialisation: ' + error.message);
        }
    }
}

function syncAccountingPlan() {
    if (!dataSyncManager.canSyncData()) {
        showErrorMessage('Vous n\'avez pas les droits pour synchroniser les données.');
        return;
    }
    
    if (confirm('Synchroniser le plan comptable avec le serveur ?\n\nCela peut prendre quelques instants.')) {
        try {
            const accounts = getSecureCompanyAccountingPlan();
            
            // Ajouter tous les comptes à la queue de synchronisation
            accounts.forEach(account => {
                dataSyncManager.queueDataForSync('accounts', 'sync', account, app.currentCompanyId);
            });
            
            // Traiter la queue
            dataSyncManager.processSyncQueue();
            
            showSuccessMessage('Synchronisation du plan comptable lancée.');
            console.log('✅ Synchronisation du plan comptable lancée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la synchronisation:', error);
            showErrorMessage('Erreur lors de la synchronisation: ' + error.message);
        }
    }
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getCompanyName() {
    const company = app.companies.find(c => c.id === app.currentCompanyId);
    return company ? company.name : 'Entreprise inconnue';
}

function showCompanySelectionWarning(feature) {
    showErrorMessage(`Veuillez sélectionner une entreprise pour accéder au ${feature}.`);
}

function showAccessDeniedMessage(resource) {
    showErrorMessage(`Accès refusé au ${resource}. Veuillez contacter votre administrateur.`);
}

function showSuccessMessage(message) {
    if (typeof window.showSuccessMessage === 'function') {
        window.showSuccessMessage(message);
    } else {
        alert('✅ ' + message);
    }
}

function showErrorMessage(message) {
    if (typeof window.showErrorMessage === 'function') {
        window.showErrorMessage(message);
    } else {
        alert('❌ ' + message);
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

function closeModalOnBackground(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

console.log('✅ Module accounts.js chargé avec sécurité renforcée par entreprise');
