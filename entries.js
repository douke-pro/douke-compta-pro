// =============================================================================
// ENTRIES.JS - Gestion sécurisée des écritures comptables par entreprise
// =============================================================================

function loadEntries() {
    // Vérification critique de la sélection d'entreprise
    if (!app.currentCompanyId) {
        showCompanySelectionWarning('écritures comptables');
        return;
    }

    // Vérification de l'accès à l'entreprise sélectionnée
    if (!hasAccessToCompany(app.currentCompanyId)) {
        showAccessDeniedMessage('écritures comptables de cette entreprise');
        return;
    }

    console.log(`📊 Chargement des écritures pour entreprise: ${app.currentCompanyId}`);

    // Mettre à jour le cache des données filtrées
    updateFilteredDataCache();

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
    </div>
    ${canCreateEntries() ? `
    <button onclick="openNewEntryModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Nouvelle écriture
    </button>
    ` : ''}
    </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    ${generateEntriesStats()}
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <input type="text" id="searchInput" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onkeyup="filterEntries()">
    <select id="journalFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterEntries()">
    <option value="">Tous les journaux</option>
    ${Object.entries(getSyscohadaJournals()).map(([code, journal]) => 
        `<option value="${code}">${journal.name} (${code})</option>`
    ).join('')}
    </select>
    <select id="statusFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterEntries()">
    <option value="">Tous les statuts</option>
    <option value="Validé">Validé</option>
    <option value="En attente">En attente</option>
    <option value="Brouillon">Brouillon</option>
    </select>
    <input type="date" id="dateFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="filterEntries()">
    <button onclick="resetFilters()" class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-undo mr-2"></i>Reset
    </button>
    </div>
    </div>

    <!-- Liste des écritures -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <div class="flex justify-between items-center">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Mes Opérations de Caisse' : 'Liste des Écritures'}
    </h3>
    <div class="text-sm text-gray-500 dark:text-gray-400">
    <span id="entriesCount">Chargement...</span>
    </div>
    </div>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortEntries('date')">
    Date <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortEntries('journal')">
    Journal <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Pièce</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortEntries('amount')">
    Montant <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onclick="sortEntries('status')">
    Statut <i class="fas fa-sort text-xs ml-1"></i>
    </th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="entriesTableBody">
    </tbody>
    </table>
    </div>
    </div>
    </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
    
    // Charger et afficher les écritures
    loadAndDisplayEntries();
}

// =============================================================================
// FONCTIONS DE VÉRIFICATION DES DROITS - CRITIQUES
// =============================================================================

function canCreateEntries() {
    if (!app.currentCompanyId || !hasAccessToCompany(app.currentCompanyId)) {
        return false;
    }
    
    // Admin et collaborateurs peuvent créer des écritures dans leurs entreprises assignées
    if (app.currentProfile === 'admin' || 
        app.currentProfile === 'collaborateur_senior' || 
        app.currentProfile === 'collaborateur') {
        return true;
    }
    
    // Utilisateurs et caissiers peuvent créer dans leur entreprise uniquement
    if ((app.currentProfile === 'user' || app.currentProfile === 'caissier') && 
        app.currentUser.companyId === app.currentCompanyId) {
        return true;
    }
    
    return false;
}

function canModifyEntry(entry) {
    if (!hasAccessToCompany(entry.companyId)) {
        return false;
    }
    
    // Admin peut tout modifier
    if (app.currentProfile === 'admin') {
        return true;
    }
    
    // Collaborateurs peuvent modifier les écritures non validées de leurs entreprises
    if ((app.currentProfile === 'collaborateur_senior' || app.currentProfile === 'collaborateur') && 
        entry.status !== 'Validé') {
        return true;
    }
    
    // Utilisateurs et caissiers peuvent modifier seulement leurs propres écritures non validées
    if ((app.currentProfile === 'user' || app.currentProfile === 'caissier') && 
        entry.userId === app.currentUser.id && 
        entry.status !== 'Validé') {
        return true;
    }
    
    return false;
}

function canValidateEntry(entry) {
    if (!hasAccessToCompany(entry.companyId)) {
        return false;
    }
    
    // Seuls admin et collaborateurs senior peuvent valider
    return (app.currentProfile === 'admin' || app.currentProfile === 'collaborateur_senior') && 
           entry.status === 'En attente';
}

function canDeleteEntry(entry) {
    if (!hasAccessToCompany(entry.companyId)) {
        return false;
    }
    
    // Admin peut tout supprimer
    if (app.currentProfile === 'admin') {
        return true;
    }
    
    // Collaborateurs peuvent supprimer les écritures non validées
    if ((app.currentProfile === 'collaborateur_senior' || app.currentProfile === 'collaborateur') && 
        entry.status !== 'Validé') {
        return true;
    }
    
    // Utilisateurs et caissiers peuvent supprimer seulement leurs propres écritures non validées
    if ((app.currentProfile === 'user' || app.currentProfile === 'caissier') && 
        entry.userId === app.currentUser.id && 
        entry.status !== 'Validé') {
        return true;
    }
    
    return false;
}

// =============================================================================
// CHARGEMENT ET AFFICHAGE SÉCURISÉ DES ÉCRITURES
// =============================================================================

let currentEntriesFilter = {
    search: '',
    journal: '',
    status: '',
    date: '',
    sortBy: 'date',
    sortOrder: 'desc'
};

function loadAndDisplayEntries() {
    try {
        // Obtenir les écritures sécurisées de l'entreprise active
        const entries = getSecureFilteredEntries();
        console.log(`📊 ${entries.length} écriture(s) chargée(s) pour l'entreprise ${app.currentCompanyId}`);
        
        // Appliquer les filtres
        const filteredEntries = applyEntriesFilters(entries);
        
        // Afficher les écritures
        displayEntries(filteredEntries);
        
        // Mettre à jour le compteur
        document.getElementById('entriesCount').textContent = 
            `${filteredEntries.length} écriture(s) affichée(s) sur ${entries.length}`;
            
    } catch (error) {
        console.error('❌ Erreur lors du chargement des écritures:', error);
        showErrorMessage('Erreur lors du chargement des écritures');
        
        // Afficher un message d'erreur dans le tableau
        document.getElementById('entriesTableBody').innerHTML = `
        <tr>
        <td colspan="7" class="px-6 py-8 text-center text-red-500">
        <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
        <div>Erreur lors du chargement des écritures</div>
        <div class="text-sm">Veuillez réessayer ou contacter l'administrateur</div>
        </td>
        </tr>
        `;
    }
}

function applyEntriesFilters(entries) {
    let filtered = [...entries];
    
    // Filtre de recherche
    if (currentEntriesFilter.search) {
        const search = currentEntriesFilter.search.toLowerCase();
        filtered = filtered.filter(entry => 
            entry.libelle.toLowerCase().includes(search) ||
            entry.piece.toLowerCase().includes(search) ||
            entry.lines.some(line => 
                line.libelle.toLowerCase().includes(search) ||
                line.accountName.toLowerCase().includes(search)
            )
        );
    }
    
    // Filtre par journal
    if (currentEntriesFilter.journal) {
        filtered = filtered.filter(entry => entry.journal === currentEntriesFilter.journal);
    }
    
    // Filtre par statut
    if (currentEntriesFilter.status) {
        filtered = filtered.filter(entry => entry.status === currentEntriesFilter.status);
    }
    
    // Filtre par date
    if (currentEntriesFilter.date) {
        filtered = filtered.filter(entry => entry.date === currentEntriesFilter.date);
    }
    
    // Tri
    filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (currentEntriesFilter.sortBy) {
            case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;
            case 'journal':
                aValue = a.journal;
                bValue = b.journal;
                break;
            case 'amount':
                aValue = a.lines.reduce((sum, line) => sum + line.debit, 0);
                bValue = b.lines.reduce((sum, line) => sum + line.debit, 0);
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                aValue = a.date;
                bValue = b.date;
        }
        
        if (currentEntriesFilter.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    return filtered;
}

function displayEntries(entries) {
    const tbody = document.getElementById('entriesTableBody');
    
    if (entries.length === 0) {
        tbody.innerHTML = `
        <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <div>Aucune écriture trouvée</div>
        <div class="text-sm">
        ${canCreateEntries() ? 'Cliquez sur "Nouvelle écriture" pour commencer' : 'Aucune écriture disponible avec les filtres actuels'}
        </div>
        </td>
        </tr>
        `;
        return;
    }
    
    tbody.innerHTML = entries.map(entry => generateEntryRow(entry)).join('');
}

function generateEntryRow(entry) {
    const totalAmount = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const canModify = canModifyEntry(entry);
    const canValidate = canValidateEntry(entry);
    const canDelete = canDeleteEntry(entry);
    
    return `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
    ${new Date(entry.date).toLocaleDateString('fr-FR')}
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
    <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-mono">
    ${entry.journal}
    </span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">
    ${entry.piece}
    </td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">
    <div class="max-w-xs truncate" title="${entry.libelle}">
    ${entry.libelle}
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
    ${entry.lines.length} ligne(s)
    </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">
    ${totalAmount.toLocaleString('fr-FR')} FCFA
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
    ${getStatusBadge(entry.status)}
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex space-x-2">
    <button onclick="viewEntryDetails(${entry.id})" class="text-primary hover:text-primary/80" title="Voir détails">
    <i class="fas fa-eye"></i>
    </button>
    ${canModify ? `
    <button onclick="editEntryModal(${entry.id})" class="text-info hover:text-info/80" title="Modifier">
    <i class="fas fa-edit"></i>
    </button>
    ` : ''}
    ${canValidate ? `
    <button onclick="validateEntry(${entry.id})" class="text-success hover:text-success/80" title="Valider">
    <i class="fas fa-check"></i>
    </button>
    ` : ''}
    <button onclick="duplicateEntry(${entry.id})" class="text-purple-500 hover:text-purple-400" title="Dupliquer">
    <i class="fas fa-copy"></i>
    </button>
    ${canDelete ? `
    <button onclick="confirmDeleteEntry(${entry.id})" class="text-danger hover:text-danger/80" title="Supprimer">
    <i class="fas fa-trash"></i>
    </button>
    ` : ''}
    </div>
    </td>
    </tr>
    `;
}

function getStatusBadge(status) {
    const badges = {
        'Validé': 'bg-success/20 text-success',
        'En attente': 'bg-warning/20 text-warning',
        'Brouillon': 'bg-gray-500/20 text-gray-500'
    };
    
    return `<span class="px-2 py-1 rounded text-sm ${badges[status] || badges['Brouillon']}">${status}</span>`;
}

function generateEntriesStats() {
    const entries = getSecureFilteredEntries();
    
    const stats = {
        total: entries.length,
        validated: entries.filter(e => e.status === 'Validé').length,
        pending: entries.filter(e => e.status === 'En attente').length,
        thisMonth: entries.filter(e => {
            const entryDate = new Date(e.date);
            const now = new Date();
            return entryDate.getMonth() === now.getMonth() && 
                   entryDate.getFullYear() === now.getFullYear();
        }).length
    };
    
    return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
    <i class="fas fa-file-alt text-blue-600 dark:text-blue-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.total}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Total écritures</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
    <i class="fas fa-check-circle text-green-600 dark:text-green-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.validated}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Validées</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
    <i class="fas fa-clock text-yellow-600 dark:text-yellow-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.pending}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">En attente</div>
    </div>
    </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center">
    <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
    <i class="fas fa-calendar-alt text-purple-600 dark:text-purple-400"></i>
    </div>
    <div class="ml-4">
    <div class="text-2xl font-bold text-gray-900 dark:text-white">${stats.thisMonth}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Ce mois</div>
    </div>
    </div>
    </div>
    `;
}

// =============================================================================
// FONCTIONS DE FILTRAGE ET TRI
// =============================================================================

function filterEntries() {
    currentEntriesFilter.search = document.getElementById('searchInput')?.value || '';
    currentEntriesFilter.journal = document.getElementById('journalFilter')?.value || '';
    currentEntriesFilter.status = document.getElementById('statusFilter')?.value || '';
    currentEntriesFilter.date = document.getElementById('dateFilter')?.value || '';
    
    loadAndDisplayEntries();
}

function sortEntries(field) {
    if (currentEntriesFilter.sortBy === field) {
        currentEntriesFilter.sortOrder = currentEntriesFilter.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentEntriesFilter.sortBy = field;
        currentEntriesFilter.sortOrder = 'desc';
    }
    
    loadAndDisplayEntries();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('journalFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    
    currentEntriesFilter = {
        search: '',
        journal: '',
        status: '',
        date: '',
        sortBy: 'date',
        sortOrder: 'desc'
    };
    
    loadAndDisplayEntries();
}

// =============================================================================
// MODAL DE CRÉATION/MODIFICATION D'ÉCRITURE
// =============================================================================

function openNewEntryModal() {
    if (!canCreateEntries()) {
        showErrorMessage('Vous n\'avez pas les droits pour créer des écritures dans cette entreprise.');
        return;
    }
    
    openEntryModal();
}

function editEntryModal(entryId) {
    const entries = getSecureFilteredEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
        showErrorMessage('Écriture non trouvée.');
        return;
    }
    
    if (!canModifyEntry(entry)) {
        showErrorMessage('Vous n\'avez pas les droits pour modifier cette écriture.');
        return;
    }
    
    openEntryModal(entry);
}

function openEntryModal(existingEntry = null) {
    const isEdit = existingEntry !== null;
    const companyAccounts = getSecureCompanyAccountingPlan();
    
    if (companyAccounts.length === 0) {
        showErrorMessage('Aucun plan comptable trouvé pour cette entreprise. Veuillez contacter l\'administrateur.');
        return;
    }
    
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-${isEdit ? 'edit' : 'plus'} mr-2 text-primary"></i>
    ${isEdit ? 'Modifier l\'Écriture' : 'Nouvelle Écriture'} SYSCOHADA Révisé
    </h3>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>

    <form id="entryForm" class="space-y-6">
    <input type="hidden" id="entryId" value="${existingEntry ? existingEntry.id : ''}">
    
    <!-- Informations de l'entreprise -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
    <div class="flex items-center text-blue-700 dark:text-blue-300">
    <i class="fas fa-building mr-2"></i>
    <span class="font-medium">${getCompanyName()}</span>
    <span class="ml-2 text-sm opacity-75">(ID: ${app.currentCompanyId})</span>
    </div>
    </div>

    <!-- En-tête de l'écriture -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
    <input type="date" id="entryDate" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${existingEntry ? existingEntry.date : new Date().toISOString().split('T')[0]}">
    </div>

    ${app.currentProfile !== 'caissier' ? `
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal *</label>
    <select id="entryJournal" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="generatePieceNumber()">
    ${Object.entries(getSyscohadaJournals()).map(([code, journal]) => 
        `<option value="${code}" ${existingEntry && existingEntry.journal === code ? 'selected' : ''}>${journal.name} (${code})</option>`
    ).join('')}
    </select>
    </div>
    ` : `<input type="hidden" id="entryJournal" value="JC">`}

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N° Pièce</label>
    <input type="text" id="entryPiece" ${isEdit ? '' : 'readonly'} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${isEdit ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-600'} text-gray-900 dark:text-white text-base" value="${existingEntry ? existingEntry.piece : ''}" placeholder="Auto-généré">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Libellé général *</label>
    <input type="text" id="entryLibelle" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${existingEntry ? existingEntry.libelle : ''}" placeholder="Libellé de l'opération">
    </div>
    </div>

    <!-- Lignes d'écriture -->
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <div class="flex justify-between items-center mb-4">
    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Lignes d'écriture</h4>
    <button type="button" onclick="addEntryLine()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Ajouter ligne
    </button>
    </div>

    <div class="overflow-x-auto">
    <table class="min-w-full" id="entryLinesTable">
    <thead>
    <tr class="border-b border-gray-200 dark:border-gray-700">
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
    ${app.currentProfile === 'caissier' ? 'Intitulé Compte' : 'Compte *'}
    </th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Libellé *</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Débit (FCFA)</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Crédit (FCFA)</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Action</th>
    </tr>
    </thead>
    <tbody id="entryLinesBody">
    </tbody>
    </table>
    </div>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Total Débit</div>
    <div class="font-bold text-gray-900 dark:text-white text-lg" id="totalDebit">0 FCFA</div>
    </div>
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Total Crédit</div>
    <div class="font-bold text-gray-900 dark:text-white text-lg" id="totalCredit">0 FCFA</div>
    </div>
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Équilibre</div>
    <div class="font-bold text-lg" id="balance">0 FCFA</div>
    </div>
    </div>
    </div>

    <div class="flex justify-end space-x-4">
    <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Annuler
    </button>
    ${!isEdit ? `
    <button type="button" onclick="saveEntry(true)" class="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-save mr-2"></i>Enregistrer en brouillon
    </button>
    ` : ''}
    <button type="submit" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-${isEdit ? 'save' : 'check'} mr-2"></i>
    ${isEdit ? 'Modifier' : (app.currentProfile === 'caissier' ? 'Envoyer pour validation' : 'Enregistrer')}
    </button>
    </div>
    </form>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        // Ajouter les lignes existantes ou des lignes vides
        if (existingEntry && existingEntry.lines) {
            existingEntry.lines.forEach(line => {
                addEntryLine(line);
            });
        } else {
            addEntryLine();
            addEntryLine();
        }
        
        // Générer le numéro de pièce si création
        if (!isEdit) {
            generatePieceNumber();
        }

        // Attacher l'événement de soumission du formulaire
        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveEntry(false);
            });
        }
        
        updateTotals();
    }, 100);
}

function addEntryLine(existingLine = null) {
    const tbody = document.getElementById('entryLinesBody');
    const row = document.createElement('tr');
    const companyAccounts = getSecureCompanyAccountingPlan();
    
    row.innerHTML = `
    <td class="py-2 px-3">
    ${app.currentProfile === 'caissier' ? `
    <input type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base account-input" placeholder="Ex: Recettes ventes" value="${existingLine ? existingLine.accountName || '' : ''}">
    ` : `
    <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base account-select" required>
    <option value="">-- Sélectionner un compte --</option>
    ${companyAccounts.map(acc => 
        `<option value="${acc.code}" ${existingLine && existingLine.account === acc.code ? 'selected' : ''}>${acc.code} - ${acc.name}</option>`
    ).join('')}
    </select>
    `}
    </td>
    <td class="py-2 px-3">
    <input type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base libelle-input" placeholder="Libellé de la ligne" value="${existingLine ? existingLine.libelle || '' : ''}" required>
    </td>
    <td class="py-2 px-3">
    <input type="number" step="0.01" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base debit-input" placeholder="0.00" value="${existingLine && existingLine.debit ? existingLine.debit : ''}" oninput="updateTotals()" onchange="clearOppositeField(this, 'credit')">
    </td>
    <td class="py-2 px-3">
    <input type="number" step="0.01" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base credit-input" placeholder="0.00" value="${existingLine && existingLine.credit ? existingLine.credit : ''}" oninput="updateTotals()" onchange="clearOppositeField(this, 'debit')">
    </td>
    <td class="py-2 px-3">
    <button type="button" onclick="removeEntryLine(this)" class="text-danger hover:text-danger/80" title="Supprimer cette ligne">
    <i class="fas fa-trash"></i>
    </button>
    </td>
    `;

    tbody.appendChild(row);
    updateTotals();
}

function clearOppositeField(currentInput, oppositeType) {
    const row = currentInput.closest('tr');
    if (currentInput.value && parseFloat(currentInput.value) > 0) {
        const oppositeInput = row.querySelector(`.${oppositeType}-input`);
        if (oppositeInput) {
            oppositeInput.value = '';
        }
    }
    updateTotals();
}

function removeEntryLine(button) {
    const tbody = document.getElementById('entryLinesBody');
    if (tbody.children.length > 2) {
        button.closest('tr').remove();
        updateTotals();
    } else {
        showErrorMessage('Une écriture doit contenir au moins 2 lignes.');
    }
}

function updateTotals() {
    const debitInputs = document.querySelectorAll('.debit-input');
    const creditInputs = document.querySelectorAll('.credit-input');

    let totalDebit = 0;
    let totalCredit = 0;

    debitInputs.forEach(input => {
        totalDebit += parseFloat(input.value) || 0;
    });

    creditInputs.forEach(input => {
        totalCredit += parseFloat(input.value) || 0;
    });

    const balance = totalDebit - totalCredit;

    const totalDebitElement = document.getElementById('totalDebit');
    const totalCreditElement = document.getElementById('totalCredit');
    const balanceElement = document.getElementById('balance');

    if (totalDebitElement) {
        totalDebitElement.textContent = totalDebit.toLocaleString('fr-FR') + ' FCFA';
    }
    if (totalCreditElement) {
        totalCreditElement.textContent = totalCredit.toLocaleString('fr-FR') + ' FCFA';
    }
    if (balanceElement) {
        balanceElement.textContent = balance.toLocaleString('fr-FR') + ' FCFA';
        if (Math.abs(balance) < 0.01) {
            balanceElement.className = 'font-bold text-success text-lg';
        } else {
            balanceElement.className = 'font-bold text-danger text-lg';
        }
    }
}

function generatePieceNumber() {
    const journalSelect = document.getElementById('entryJournal');
    const journalCode = journalSelect ? journalSelect.value : 'JC';

    const pieceNumber = generateJournalNumber(journalCode, app.currentCompanyId);
    const entryPiece = document.getElementById('entryPiece');
    if (entryPiece && !entryPiece.value) {
        entryPiece.value = pieceNumber;
    }
}

// =============================================================================
// SAUVEGARDE SÉCURISÉE DES ÉCRITURES
// =============================================================================

function saveEntry(isDraft = false) {
    try {
        // Vérification des permissions
        if (!canCreateEntries()) {
            showErrorMessage('Vous n\'avez pas les droits pour créer des écritures dans cette entreprise.');
            return;
        }
        
        const entryId = document.getElementById('entryId').value;
        const isEdit = entryId !== '';
        
        // Validation de base
        const debitInputs = document.querySelectorAll('.debit-input');
        const creditInputs = document.querySelectorAll('.credit-input');

        let totalDebit = 0;
        let totalCredit = 0;

        debitInputs.forEach(input => {
            totalDebit += parseFloat(input.value) || 0;
        });

        creditInputs.forEach(input => {
            totalCredit += parseFloat(input.value) || 0;
        });

        // Vérifications critiques
        if (!isDraft && Math.abs(totalDebit - totalCredit) > 0.01) {
            showErrorMessage('L\'écriture n\'est pas équilibrée. Le total des débits doit être égal au total des crédits.');
            return;
        }

        if (totalDebit === 0 && totalCredit === 0) {
            showErrorMessage('L\'écriture ne peut pas être vide. Veuillez saisir au moins un montant.');
            return;
        }

        // Construction de l'objet écriture
        const entry = {
            id: isEdit ? parseInt(entryId) : (app.entries.length > 0 ? Math.max(...app.entries.map(e => e.id)) + 1 : 1),
            date: document.getElementById('entryDate').value,
            journal: document.getElementById('entryJournal') ? document.getElementById('entryJournal').value : 'JC',
            piece: document.getElementById('entryPiece').value,
            libelle: document.getElementById('entryLibelle').value,
            companyId: app.currentCompanyId,
            lines: [],
            status: isDraft ? 'Brouillon' : (app.currentProfile === 'caissier' ? 'En attente' : 'Validé'),
            userId: app.currentUser.id,
            createdAt: isEdit ? (app.entries.find(e => e.id === parseInt(entryId))?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: app.currentUser.id
        };

        // Extraction des lignes
        const rows = document.querySelectorAll('#entryLinesBody tr');
        const companyAccounts = getSecureCompanyAccountingPlan();
        
        rows.forEach(row => {
            const accountInput = row.querySelector('.account-input, .account-select');
            const libelleInput = row.querySelector('.libelle-input');
            const debitInput = row.querySelector('.debit-input');
            const creditInput = row.querySelector('.credit-input');

            if (accountInput && libelleInput && accountInput.value && libelleInput.value) {
                const debitValue = parseFloat(debitInput.value) || 0;
                const creditValue = parseFloat(creditInput.value) || 0;

                if (debitValue > 0 || creditValue > 0) {
                    let accountCode = '';
                    let accountName = '';

                    if (app.currentProfile === 'caissier') {
                        accountName = accountInput.value;
                        accountCode = '571000'; // Compte caisse par défaut
                    } else {
                        accountCode = accountInput.value;
                        const account = companyAccounts.find(acc => acc.code === accountCode);
                        accountName = account ? account.name : accountCode;
                        
                        // Vérification que le compte existe dans le plan comptable de l'entreprise
                        if (!account) {
                            showErrorMessage(`Le compte ${accountCode} n'existe pas dans le plan comptable de cette entreprise.`);
                            return;
                        }
                    }

                    entry.lines.push({
                        account: accountCode,
                        accountName: accountName,
                        libelle: libelleInput.value,
                        debit: debitValue,
                        credit: creditValue
                    });
                }
            }
        });

        if (entry.lines.length < 2) {
            showErrorMessage('Une écriture doit contenir au moins 2 lignes avec des montants.');
            return;
        }

        // Validation sécurisée avec la fonction du data.js
        const validation = validateEntry(entry);
        if (!validation.isValid) {
            showErrorMessage('Erreurs de validation:\n- ' + validation.errors.join('\n- '));
            return;
        }

        // Sauvegarde sécurisée
        if (isEdit) {
            // Modification
            const entryIndex = app.entries.findIndex(e => e.id === parseInt(entryId));
            if (entryIndex !== -1) {
                app.entries[entryIndex] = entry;
                console.log('✅ Écriture modifiée:', entry);
            } else {
                showErrorMessage('Écriture non trouvée pour modification.');
                return;
            }
        } else {
            // Création
            app.entries.push(entry);
            console.log('✅ Nouvelle écriture créée:', entry);
        }

        // Mettre à jour le cache des données filtrées
        updateFilteredDataCache();

        // Ajouter à la queue de synchronisation si autorisé
        if (dataSyncManager.canSyncData()) {
            dataSyncManager.queueDataForSync(
                'entries', 
                isEdit ? 'update' : 'create', 
                entry, 
                app.currentCompanyId
            );
        }

        closeModal();
        loadAndDisplayEntries();

        const message = isDraft ? 
            'Écriture sauvegardée en brouillon.' :
            (isEdit ? 'Écriture modifiée avec succès.' :
                (app.currentProfile === 'caissier' ? 
                    'Opération enregistrée et envoyée pour validation.' : 
                    'Écriture enregistrée avec succès.'
                )
            );

        showSuccessMessage(message);
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'écriture:', error);
        showErrorMessage('Erreur lors de la sauvegarde: ' + error.message);
    }
}

// =============================================================================
// ACTIONS SUR LES ÉCRITURES - IMPLÉMENTATION COMPLÈTE
// =============================================================================

function viewEntryDetails(entryId) {
    const entries = getSecureFilteredEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
        showErrorMessage('Écriture non trouvée.');
        return;
    }
    
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    const creator = app.users.find(u => u.id === entry.userId);
    
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-eye mr-2 text-primary"></i>Détails de l'Écriture
    </h3>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>

    <!-- Informations générales -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="space-y-4">
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Informations générales</h4>
    <div class="space-y-2 text-sm">
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Date:</span>
    <span class="font-medium text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Journal:</span>
    <span class="font-medium text-gray-900 dark:text-white">${entry.journal}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">N° Pièce:</span>
    <span class="font-medium text-gray-900 dark:text-white font-mono">${entry.piece}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Statut:</span>
    <span>${getStatusBadge(entry.status)}</span>
    </div>
    </div>
    </div>
    </div>
    
    <div class="space-y-4">
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Métadonnées</h4>
    <div class="space-y-2 text-sm">
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Créé par:</span>
    <span class="font-medium text-gray-900 dark:text-white">${creator ? creator.name : 'Utilisateur inconnu'}</span>
    </div>
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Date création:</span>
    <span class="font-medium text-gray-900 dark:text-white">${new Date(entry.createdAt).toLocaleDateString('fr-FR')} ${new Date(entry.createdAt).toLocaleTimeString('fr-FR')}</span>
    </div>
    ${entry.updatedAt ? `
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Dernière modification:</span>
    <span class="font-medium text-gray-900 dark:text-white">${new Date(entry.updatedAt).toLocaleDateString('fr-FR')} ${new Date(entry.updatedAt).toLocaleTimeString('fr-FR')}</span>
    </div>
    ` : ''}
    <div class="flex justify-between">
    <span class="text-gray-600 dark:text-gray-400">Entreprise:</span>
    <span class="font-medium text-gray-900 dark:text-white">${getCompanyName()}</span>
    </div>
    </div>
    </div>
    </div>
    </div>

    <!-- Libellé -->
    <div class="mb-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Libellé</h4>
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <p class="text-gray-900 dark:text-white">${entry.libelle}</p>
    </div>
    </div>

    <!-- Lignes d'écriture -->
    <div class="mb-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Lignes d'écriture</h4>
    <div class="overflow-x-auto">
    <table class="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compte</th>
    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Libellé</th>
    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Débit</th>
    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédit</th>
    </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
    ${entry.lines.map(line => `
    <tr class="bg-white dark:bg-gray-800">
    <td class="px-4 py-3">
    <div class="font-mono text-sm text-gray-900 dark:text-white">${line.account || 'N/A'}</div>
    <div class="text-xs text-gray-500 dark:text-gray-400">${line.accountName}</div>
    </td>
    <td class="px-4 py-3 text-gray-900 dark:text-white">${line.libelle}</td>
    <td class="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
    ${line.debit > 0 ? line.debit.toLocaleString('fr-FR') + ' FCFA' : '-'}
    </td>
    <td class="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
    ${line.credit > 0 ? line.credit.toLocaleString('fr-FR') + ' FCFA' : '-'}
    </td>
    </tr>
    `).join('')}
    </tbody>
    <tfoot class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <td colspan="2" class="px-4 py-3 font-semibold text-gray-900 dark:text-white">TOTAUX</td>
    <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white font-mono">
    ${totalDebit.toLocaleString('fr-FR')} FCFA
    </td>
    <td class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white font-mono">
    ${totalCredit.toLocaleString('fr-FR')} FCFA
    </td>
    </tr>
    </tfoot>
    </table>
    </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-4">
    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Fermer
    </button>
    ${canModifyEntry(entry) ? `
    <button onclick="closeModal(); editEntryModal(${entry.id})" class="bg-info hover:bg-info/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-edit mr-2"></i>Modifier
    </button>
    ` : ''}
    <button onclick="duplicateEntry(${entry.id})" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-copy mr-2"></i>Dupliquer
    </button>
    </div>
    </div>
    </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

function validateEntry(entryId) {
    const entries = getSecureFilteredEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
        showErrorMessage('Écriture non trouvée.');
        return;
    }
    
    if (!canValidateEntry(entry)) {
        showErrorMessage('Vous n\'avez pas les droits pour valider cette écriture.');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir valider l'écriture "${entry.libelle}" ?\n\nUne fois validée, elle ne pourra plus être modifiée.`)) {
        try {
            // Trouver l'écriture dans la liste globale et la modifier
            const globalEntry = app.entries.find(e => e.id === entryId);
            if (globalEntry) {
                globalEntry.status = 'Validé';
                globalEntry.validatedAt = new Date().toISOString();
                globalEntry.validatedBy = app.currentUser.id;
                
                // Mettre à jour le cache
                updateFilteredDataCache();
                
                // Ajouter à la queue de synchronisation
                if (dataSyncManager.canSyncData()) {
                    dataSyncManager.queueDataForSync('entries', 'update', globalEntry, app.currentCompanyId);
                }
                
                // Recharger l'affichage
                loadAndDisplayEntries();
                
                showSuccessMessage('Écriture validée avec succès.');
                console.log('✅ Écriture validée:', globalEntry);
            } else {
                showErrorMessage('Erreur lors de la validation.');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la validation:', error);
            showErrorMessage('Erreur lors de la validation: ' + error.message);
        }
    }
}

function duplicateEntry(entryId) {
    const entries = getSecureFilteredEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
        showErrorMessage('Écriture non trouvée.');
        return;
    }
    
    if (!canCreateEntries()) {
        showErrorMessage('Vous n\'avez pas les droits pour créer des écritures dans cette entreprise.');
        return;
    }
    
    try {
        // Créer une copie de l'écriture
        const duplicatedEntry = {
            ...entry,
            id: app.entries.length > 0 ? Math.max(...app.entries.map(e => e.id)) + 1 : 1,
            date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
            piece: generateJournalNumber(entry.journal, app.currentCompanyId), // Nouveau numéro
            libelle: `[COPIE] ${entry.libelle}`,
            status: 'Brouillon',
            createdAt: new Date().toISOString(),
            updatedAt: null,
            validatedAt: null,
            validatedBy: null,
            lines: entry.lines.map(line => ({ ...line })) // Copie des lignes
        };
        
        // Sauvegarder la copie
        app.entries.push(duplicatedEntry);
        
        // Mettre à jour le cache
        updateFilteredDataCache();
        
        // Ajouter à la queue de synchronisation
        if (dataSyncManager.canSyncData()) {
            dataSyncManager.queueDataForSync('entries', 'create', duplicatedEntry, app.currentCompanyId);
        }
        
        // Recharger l'affichage
        loadAndDisplayEntries();
        
        showSuccessMessage('Écriture dupliquée avec succès en brouillon.');
        console.log('✅ Écriture dupliquée:', duplicatedEntry);
        
    } catch (error) {
        console.error('❌ Erreur lors de la duplication:', error);
        showErrorMessage('Erreur lors de la duplication: ' + error.message);
    }
}

function confirmDeleteEntry(entryId) {
    const entries = getSecureFilteredEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
        showErrorMessage('Écriture non trouvée.');
        return;
    }
    
    if (!canDeleteEntry(entry)) {
        showErrorMessage('Vous n\'avez pas les droits pour supprimer cette écriture.');
        return;
    }
    
    const message = entry.status === 'Validé' ? 
        `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer une écriture VALIDÉE:\n\n"${entry.libelle}"\nDate: ${new Date(entry.date).toLocaleDateString('fr-FR')}\nMontant: ${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA\n\nCette action est IRRÉVERSIBLE et peut impacter la comptabilité.\n\nÊtes-vous absolument certain de vouloir continuer ?` :
        `Êtes-vous sûr de vouloir supprimer l'écriture :\n\n"${entry.libelle}"\nDate: ${new Date(entry.date).toLocaleDateString('fr-FR')}\n\nCette action est irréversible.`;
    
    if (confirm(message)) {
        try {
            // Supprimer de la liste globale
            const entryIndex = app.entries.findIndex(e => e.id === entryId);
            if (entryIndex !== -1) {
                const deletedEntry = app.entries.splice(entryIndex, 1)[0];
                
                // Mettre à jour le cache
                updateFilteredDataCache();
                
                // Ajouter à la queue de synchronisation
                if (dataSyncManager.canSyncData()) {
                    dataSyncManager.queueDataForSync('entries', 'delete', deletedEntry, app.currentCompanyId);
                }
                
                // Recharger l'affichage
                loadAndDisplayEntries();
                
                showSuccessMessage('Écriture supprimée avec succès.');
                console.log('✅ Écriture supprimée:', deletedEntry);
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
// FONCTIONS UTILITAIRES
// =============================================================================

function getCompanyName() {
    const company = app.companies.find(c => c.id === app.currentCompanyId);
    return company ? company.name : 'Entreprise inconnue';
}

function showCompanySelectionWarning(feature) {
    showErrorMessage(`Veuillez sélectionner une entreprise pour accéder aux ${feature}.`);
}

function showAccessDeniedMessage(resource) {
    showErrorMessage(`Accès refusé aux ${resource}. Veuillez contacter votre administrateur.`);
}

function showSuccessMessage(message) {
    // Cette fonction doit être définie dans le fichier principal ou utils
    if (typeof window.showSuccessMessage === 'function') {
        window.showSuccessMessage(message);
    } else {
        alert('✅ ' + message);
    }
}

function showErrorMessage(message) {
    // Cette fonction doit être définie dans le fichier principal ou utils
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

console.log('✅ Module entries.js chargé avec sécurité renforcée par entreprise');
