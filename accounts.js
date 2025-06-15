// =============================================================================
// ACCOUNTS.JS - Gestion du plan comptable SYSCOHADA
// =============================================================================

function loadAccounts() {
    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Comptes Disponibles' : 'Plan Comptable SYSCOHADA Révisé'}
    </h2>
    ${app.currentProfile !== 'caissier' ? `
    <button onclick="openAddAccountModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Nouveau Compte
    </button>
    ` : ''}
    </div>

    <!-- Filtres -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <input type="text" id="accountSearch" placeholder="Rechercher un compte..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" oninput="filterAccounts()">
    <select id="categoryFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterAccounts()">
    <option value="">Toutes les catégories</option>
    <option value="Capitaux propres">Capitaux propres</option>
    <option value="Immobilisations">Immobilisations</option>
    <option value="Stocks">Stocks</option>
    <option value="Tiers">Tiers</option>
    <option value="Financiers">Financiers</option>
    <option value="Charges">Charges</option>
    <option value="Produits">Produits</option>
    <option value="Résultats">Résultats</option>
    <option value="Comptabilité analytique">Comptabilité analytique</option>
    </select>
    <button onclick="resetAccountFilters()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
    <i class="fas fa-sync mr-2"></i>Réinitialiser
    </button>
    </div>
    </div>

    <!-- Plan comptable par classes -->
    <div class="grid grid-cols-1 gap-6" id="accountsContainer">
    ${generateAccountsByClass()}
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function openAddAccountModal() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4" onclick="event.stopPropagation()">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
    <i class="fas fa-plus mr-2 text-primary"></i>Nouveau Compte
    </h3>

    <form id="addAccountForm" class="space-y-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code du compte</label>
    <input type="text" id="accountCode" required pattern="[0-9]{6}" maxlength="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Ex: 512001">
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">6 chiffres selon SYSCOHADA</p>
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Intitulé du compte</label>
    <input type="text" id="accountName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Ex: Banque SGBCI">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
    <select id="accountCategory" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="">-- Sélectionner une catégorie --</option>
    <option value="Capitaux propres">Capitaux propres</option>
    <option value="Immobilisations corporelles">Immobilisations corporelles</option>
    <option value="Immobilisations incorporelles">Immobilisations incorporelles</option>
    <option value="Stocks">Stocks</option>
    <option value="Clients">Clients</option>
    <option value="Fournisseurs">Fournisseurs</option>
    <option value="Personnel">Personnel</option>
    <option value="Organismes sociaux">Organismes sociaux</option>
    <option value="État">État</option>
    <option value="Comptes bancaires">Comptes bancaires</option>
    <option value="Caisse">Caisse</option>
    <option value="Achats">Achats</option>
    <option value="Services extérieurs">Services extérieurs</option>
    <option value="Charges de personnel">Charges de personnel</option>
    <option value="Impôts et taxes">Impôts et taxes</option>
    <option value="Ventes">Ventes</option>
    <option value="Produits financiers">Produits financiers</option>
    <option value="Résultats">Résultats</option>
    <option value="Comptabilité analytique">Comptabilité analytique</option>
    </select>
    </div>

    <div class="flex justify-end space-x-4 pt-4">
    <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Annuler
    </button>
    <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-save mr-2"></i>Créer
    </button>
    </div>
    </form>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const addAccountForm = document.getElementById('addAccountForm');
        if (addAccountForm) {
            addAccountForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddAccount();
            });
        }
    }, 100);
}

function handleAddAccount() {
    const code = document.getElementById('accountCode').value;
    const name = document.getElementById('accountName').value;
    const category = document.getElementById('accountCategory').value;

    if (app.accounts.find(acc => acc.code === code)) {
        alert('❌ Ce code de compte existe déjà.');
        return;
    }

    const newAccount = {
        code: code,
        name: name,
        category: category
    };

    app.accounts.push(newAccount);
    app.accounts.sort((a, b) => a.code.localeCompare(b.code));

    closeModal();
    loadAccounts();
    showSuccessMessage('Compte créé avec succès !');
    console.log('✅ Nouveau compte créé:', newAccount);
}

function filterAccounts() {
    const searchInput = document.getElementById('accountSearch');
    const categorySelect = document.getElementById('categoryFilter');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const categoryFilter = categorySelect ? categorySelect.value : '';

    const filteredAccounts = app.accounts.filter(account => {
        const matchesSearch = account.code.toLowerCase().includes(searchTerm) ||
                            account.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || account.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

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

    filteredAccounts.forEach(account => {
        const classNumber = parseInt(account.code.charAt(0));
        if (accountsByClass[classNumber]) {
            accountsByClass[classNumber].accounts.push(account);
        }
    });

    let html = '';
    Object.values(accountsByClass).forEach(classData => {
        if (classData.accounts.length > 0) {
            html += generateAccountClassHTML(classData);
        }
    });

    const accountsContainer = document.getElementById('accountsContainer');
    if (accountsContainer) {
        accountsContainer.innerHTML = html;
    }
}

function resetAccountFilters() {
    const searchInput = document.getElementById('accountSearch');
    const categorySelect = document.getElementById('categoryFilter');
    const accountsContainer = document.getElementById('accountsContainer');

    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (accountsContainer) accountsContainer.innerHTML = generateAccountsByClass();
}

function generateAccountsByClass() {
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

    app.accounts.forEach(account => {
        const classNumber = parseInt(account.code.charAt(0));
        if (accountsByClass[classNumber]) {
            accountsByClass[classNumber].accounts.push(account);
        }
    });

    return Object.values(accountsByClass).map(classData => generateAccountClassHTML(classData)).join('');
}

function generateAccountClassHTML(classData) {
    if (classData.accounts.length === 0) return '';

    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${classData.name}</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400">${classData.accounts.length} compte(s)</p>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Intitulé</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    ${classData.accounts.map(account => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${account.code}</td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">${account.name}</td>
    <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${account.category}</td>
    <td class="px-6 py-4">
    <div class="flex space-x-2">
    <button onclick="editAccountModal('${account.code}')" class="text-primary hover:text-primary/80" title="Modifier">
    <i class="fas fa-edit"></i>
    </button>
    <button onclick="confirmDeleteAccount('${account.code}')" class="text-danger hover:text-danger/80" title="Supprimer">
    <i class="fas fa-trash"></i>
    </button>
    </div>
    </td>
    </tr>
    `).join('')}
    </tbody>
    </table>
    </div>
    </div>
    `;
}

// Fonctions pour les actions sur les comptes (stubs)
function editAccountModal(code) {
    showSuccessMessage(`Modification du compte ${code} - Fonctionnalité en cours de développement.`);
}

function confirmDeleteAccount(code) {
    showSuccessMessage(`Suppression du compte ${code} - Fonctionnalité en cours de développement.`);
}
