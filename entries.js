// =============================================================================
// ENTRIES.JS - Gestion des écritures comptables
// =============================================================================

function loadEntries() {
    // Vérification de la sélection d'entreprise pour admin/collaborateur
    if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
        showCompanySelectionWarning('écritures comptables');
        return;
    }

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
    <button onclick="openNewEntryModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Nouvelle écriture
    </button>
    </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <input type="text" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option>Tous les journaux</option>
    <option>Journal Général (JG)</option>
    <option>Journal des Achats (JA)</option>
    <option>Journal des Ventes (JV)</option>
    <option>Journal de Banque (JB)</option>
    <option>Journal de Caisse (JC)</option>
    <option>Journal des Opérations Diverses (JOD)</option>
    </select>
    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option>Tous les statuts</option>
    <option>Validé</option>
    <option>En attente</option>
    <option>Brouillon</option>
    </select>
    <input type="date" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>
    </div>

    <!-- Liste des écritures -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Mes Opérations de Caisse' : 'Liste des Écritures'}
    </h3>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Pièce</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    ${generateEntriesRows()}
    </tbody>
    </table>
    </div>
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function openNewEntryModal() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-edit mr-2 text-primary"></i>Nouvelle Écriture SYSCOHADA Révisé
    </h3>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>

    <form id="entryForm" class="space-y-6">
    <!-- En-tête de l'écriture -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
    <input type="date" id="entryDate" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${new Date().toISOString().split('T')[0]}">
    </div>

    ${app.currentProfile !== 'caissier' ? `
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal</label>
    <select id="entryJournal" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="generatePieceNumber()">
    <option value="JG">Journal Général (JG)</option>
    <option value="JA">Journal des Achats (JA)</option>
    <option value="JV">Journal des Ventes (JV)</option>
    <option value="JB">Journal de Banque (JB)</option>
    <option value="JC">Journal de Caisse (JC)</option>
    <option value="JOD">Journal des Opérations Diverses (JOD)</option>
    </select>
    </div>
    ` : ''}

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N° Pièce</label>
    <input type="text" id="entryPiece" readonly class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base" placeholder="Auto-généré">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Libellé général</label>
    <input type="text" id="entryLibelle" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Libellé de l'opération">
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
    ${app.currentProfile === 'caissier' ? 'Intitulé Compte' : 'Compte'}
    </th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Libellé</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Débit (FCFA)</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Crédit (FCFA)</th>
    <th class="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Action</th>
    </tr>
    </thead>
    <tbody id="entryLinesBody">
    </tbody>
    </table>
    </div>

    <div class="mt-4 flex justify-end space-x-6 text-sm">
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Total Débit</div>
    <div class="font-bold text-gray-900 dark:text-white" id="totalDebit">0 FCFA</div>
    </div>
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Total Crédit</div>
    <div class="font-bold text-gray-900 dark:text-white" id="totalCredit">0 FCFA</div>
    </div>
    <div class="text-right">
    <div class="text-gray-600 dark:text-gray-400">Équilibre</div>
    <div class="font-bold" id="balance">0 FCFA</div>
    </div>
    </div>
    </div>

    <div class="flex justify-end space-x-4">
    <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Annuler
    </button>
    <button type="submit" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-save mr-2"></i>
    ${app.currentProfile === 'caissier' ? 'Envoyer pour validation' : 'Enregistrer'}
    </button>
    </div>
    </form>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        addEntryLine();
        addEntryLine();
        generatePieceNumber();

        const entryForm = document.getElementById('entryForm');
        if (entryForm) {
            entryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveEntry();
            });
        }
    }, 100);
}

function addEntryLine() {
    const tbody = document.getElementById('entryLinesBody');
    const row = document.createElement('tr');
    row.innerHTML = `
    <td class="py-2 px-3">
    ${app.currentProfile === 'caissier' ? `
    <input type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base account-input" placeholder="Ex: Recettes ventes">
    ` : `
    <select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base account-select">
    <option value="">-- Sélectionner un compte --</option>
    ${app.accounts.map(acc => `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`).join('')}
    </select>
    `}
    </td>
    <td class="py-2 px-3">
    <input type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base libelle-input" placeholder="Libellé de la ligne">
    </td>
    <td class="py-2 px-3">
    <input type="number" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base debit-input" placeholder="0.00" oninput="updateTotals()" onchange="clearOppositeField(this, 'credit')">
    </td>
    <td class="py-2 px-3">
    <input type="number" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base credit-input" placeholder="0.00" oninput="updateTotals()" onchange="clearOppositeField(this, 'debit')">
    </td>
    <td class="py-2 px-3">
    <button type="button" onclick="removeEntryLine(this)" class="text-danger hover:text-danger/80">
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
        alert('❌ Une écriture doit contenir au moins 2 lignes.');
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
            balanceElement.className = 'font-bold text-success';
        } else {
            balanceElement.className = 'font-bold text-danger';
        }
    }
}

function generatePieceNumber() {
    const journalSelect = document.getElementById('entryJournal');
    const journalCode = journalSelect ? journalSelect.value : 'JC';
    const companyId = app.currentCompany || '001';

    const pieceNumber = generateJournalNumber(journalCode, companyId);
    const entryPiece = document.getElementById('entryPiece');
    if (entryPiece) {
        entryPiece.value = pieceNumber;
    }
}

function saveEntry() {
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

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        alert('❌ L\'écriture n\'est pas équilibrée. Le total des débits doit être égal au total des crédits.');
        return;
    }

    if (totalDebit === 0 && totalCredit === 0) {
        alert('❌ L\'écriture ne peut pas être vide. Veuillez saisir au moins un montant.');
        return;
    }

    const entry = {
        id: app.entries.length + 1,
        date: document.getElementById('entryDate').value,
        journal: document.getElementById('entryJournal') ? document.getElementById('entryJournal').value : 'JC',
        piece: document.getElementById('entryPiece').value,
        libelle: document.getElementById('entryLibelle').value,
        companyId: parseInt(app.currentCompany) || 1,
        lines: [],
        status: app.currentProfile === 'caissier' ? 'En attente' : 'Validé',
        userId: app.currentUser.id || 1
    };

    const rows = document.querySelectorAll('#entryLinesBody tr');
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
                    accountCode = '';
                } else {
                    accountCode = accountInput.value;
                    const account = app.accounts.find(acc => acc.code === accountCode);
                    accountName = account ? account.name : accountCode;
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
        alert('❌ Une écriture doit contenir au moins 2 lignes avec des montants.');
        return;
    }

    app.entries.push(entry);

    closeModal();
    loadEntries();

    const message = app.currentProfile === 'caissier' ?
        'Opération enregistrée et envoyée pour validation.' :
        'Écriture enregistrée avec succès.';

    showSuccessMessage(message);
    console.log('✅ Écriture sauvegardée:', entry);
}

function generateEntriesRows() {
    let filteredEntries = app.entries;

    if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
        filteredEntries = app.entries.filter(e => e.companyId == app.currentCompany);
    }

    if (filteredEntries.length === 0) {
        return `
        <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <div>Aucune écriture trouvée</div>
        <div class="text-sm">Cliquez sur "Nouvelle écriture" pour commencer</div>
        </td>
        </tr>
        `;
    }

    return filteredEntries.map(entry => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">${entry.libelle}</td>
    <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA</td>
    <td class="px-6 py-4 whitespace-nowrap">
    <span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex space-x-2">
    <button onclick="viewEntryDetails(${entry.id})" class="text-primary hover:text-primary/80" title="Voir">
    <i class="fas fa-eye"></i>
    </button>
    <button onclick="editEntryModal(${entry.id})" class="text-info hover:text-info/80" title="Modifier">
    <i class="fas fa-edit"></i>
    </button>
    ${entry.status === 'En attente' && app.currentProfile !== 'caissier' ? `
    <button onclick="validateEntry(${entry.id})" class="text-success hover:text-success/80" title="Valider">
    <i class="fas fa-check"></i>
    </button>
    ` : ''}
    <button onclick="confirmDeleteEntry(${entry.id})" class="text-danger hover:text-danger/80" title="Supprimer">
    <i class="fas fa-trash"></i>
    </button>
    </div>
    </td>
    </tr>
    `).join('');
}

// Fonctions pour les actions sur les écritures (stubs pour le moment)
function viewEntryDetails(id) {
    showSuccessMessage(`Visualisation de l'écriture ${id} - Fonctionnalité en cours de développement.`);
}

function editEntryModal(id) {
    showSuccessMessage(`Modification de l'écriture ${id} - Fonctionnalité en cours de développement.`);
}

function confirmDeleteEntry(id) {
    showSuccessMessage(`Suppression de l'écriture ${id} - Fonctionnalité en cours de développement.`);
}

function validateEntry(id) {
    showSuccessMessage(`Validation de l'écriture ${id} - Fonctionnalité en cours de développement.`);
}
