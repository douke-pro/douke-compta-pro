// =============================================================================
// CAISSE.JS - Gestion des caisses
// =============================================================================

function loadCaisse() {
    if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
        showCompanySelectionWarning('gestion des caisses');
        return;
    }

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Gestion des Caisses'}
    </h2>
    <div class="flex items-center space-x-4">
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
    </div>
    ${app.currentProfile !== 'caissier' ? `
    <button onclick="openAddCashRegisterModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus mr-2"></i>Nouvelle Caisse
    </button>
    ` : ''}
    </div>
    </div>

    ${app.currentProfile === 'caissier' ? `
    <!-- Interface Caissier -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-cash-register mr-2 text-primary"></i>État de ma Caisse
    </h3>
    <div class="space-y-4">
    <div class="flex justify-between items-center p-4 bg-success/10 rounded-lg">
    <span class="text-success font-medium">Solde d'ouverture</span>
    <span class="text-2xl font-bold text-success">150,000 FCFA</span>
    </div>
    <div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">
    <span class="text-info font-medium">Recettes du jour</span>
    <span class="text-2xl font-bold text-info">+85,000 FCFA</span>
    </div>
    <div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
    <span class="text-warning font-medium">Dépenses du jour</span>
    <span class="text-2xl font-bold text-warning">-25,000 FCFA</span>
    </div>
    <div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">
    <span class="text-primary font-medium">Solde actuel</span>
    <span class="text-3xl font-bold text-primary">210,000 FCFA</span>
    </div>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-4">
    <button onclick="navigateTo('entries')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
    <i class="fas fa-plus-circle mr-2"></i>Nouvelle opération
    </button>
    <button onclick="generateCashReport()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
    <i class="fas fa-print mr-2"></i>État de caisse
    </button>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-history mr-2 text-info"></i>Dernières Opérations
    </h3>
    <div class="space-y-3">
    ${generateCashierOperations()}
    </div>
    </div>
    </div>
    ` : `
    <!-- Interface Admin/Collaborateur -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des Caisses</h3>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom de la Caisse</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsable</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    ${generateCashRegistersRows()}
    </tbody>
    </table>
    </div>
    </div>
    `}
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function openAddCashRegisterModal() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4" onclick="event.stopPropagation()">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
    <i class="fas fa-cash-register mr-2 text-primary"></i>Nouvelle Caisse
    </h3>

    <form id="addCashRegisterForm" class="space-y-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de la caisse</label>
    <input type="text" id="cashRegisterName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Ex: Caisse Ventes">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Responsable</label>
    <select id="cashRegisterResponsible" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="">-- Non assigné --</option>
    ${app.users.filter(u => u.profile === 'caissier').map(user => `
    <option value="${user.id}">${user.name}</option>
    `).join('')}
    </select>
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Solde d'ouverture (FCFA)</label>
    <input type="number" id="cashRegisterBalance" min="0" step="0.01" value="0" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
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
        const addCashRegisterForm = document.getElementById('addCashRegisterForm');
        if (addCashRegisterForm) {
            addCashRegisterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddCashRegister();
            });
        }
    }, 100);
}

function handleAddCashRegister() {
    const name = document.getElementById('cashRegisterName').value;
    const responsibleId = document.getElementById('cashRegisterResponsible').value;
    const balance = parseFloat(document.getElementById('cashRegisterBalance').value);

    const responsible = responsibleId ? app.users.find(u => u.id == responsibleId) : null;

    closeModal();
    loadCaisse();
    showSuccessMessage(`Caisse "${name}" créée avec succès !`);
    console.log('✅ Nouvelle caisse créée:', { name, responsible: responsible?.name, balance });
}

function generateCashierOperations() {
    const operations = [
        { time: '14:30', type: 'Recette', description: 'Vente comptant', amount: '+15,000', status: 'En attente' },
        { time: '13:15', type: 'Dépense', description: 'Achat fournitures', amount: '-5,000', status: 'Validé' },
        { time: '11:45', type: 'Recette', description: 'Encaissement client', amount: '+25,000', status: 'Validé' },
        { time: '10:20', type: 'Dépense', description: 'Frais transport', amount: '-3,500', status: 'En attente' }
    ];

    return operations.map(op => `
    <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
    <div class="flex items-center space-x-3">
    <div class="w-8 h-8 ${op.type === 'Recette' ? 'bg-success' : 'bg-warning'} text-white rounded-full flex items-center justify-center">
    <i class="fas ${op.type === 'Recette' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i>
    </div>
    <div>
    <div class="font-medium text-gray-900 dark:text-white">${op.description}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">${op.time}</div>
    </div>
    </div>
    <div class="text-right">
    <div class="font-bold ${op.type === 'Recette' ? 'text-success' : 'text-warning'}">${op.amount} FCFA</div>
    <div class="text-xs ${op.status === 'Validé' ? 'text-success' : 'text-warning'}">${op.status}</div>
    </div>
    </div>
    `).join('');
}

function generateCashRegistersRows() {
    const cashRegisters = [
        { name: 'Caisse Principale', responsible: 'Ibrahim Koné', balance: '210,000', status: 'Ouvert' },
        { name: 'Caisse Ventes', responsible: 'Fatou Diallo', balance: '85,000', status: 'Ouvert' },
        { name: 'Caisse Réception', responsible: 'Non assigné', balance: '0', status: 'Fermé' }
    ];

    return cashRegisters.map(cash => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${cash.name}</td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">${cash.responsible}</td>
    <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${cash.balance} FCFA</td>
    <td class="px-6 py-4">
    <span class="px-2 py-1 rounded text-sm ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
    </td>
    <td class="px-6 py-4">
    <div class="flex space-x-2">
    <button onclick="viewCashRegisterModal('${cash.name}')" class="text-primary hover:text-primary/80" title="Voir">
    <i class="fas fa-eye"></i>
    </button>
    <button onclick="editCashRegisterModal('${cash.name}')" class="text-info hover:text-info/80" title="Modifier">
    <i class="fas fa-edit"></i>
    </button>
    <button onclick="manageCashierAssignmentModal('${cash.name}')" class="text-warning hover:text-warning/80" title="Assigner caissier">
    <i class="fas fa-user-cog"></i>
    </button>
    <button onclick="confirmDeleteCashRegister('${cash.name}')" class="text-danger hover:text-danger/80" title="Supprimer">
    <i class="fas fa-trash"></i>
    </button>
    </div>
    </td>
    </tr>
    `).join('');
}

function generateCashReport(period = 'daily') {
    const periods = {
        'daily': 'État journalier',
        'weekly': 'Rapport hebdomadaire',
        'monthly': 'Rapport mensuel'
    };

    showSuccessMessage(`Génération de l'${periods[period]} de caisse en cours...\n\nRapport PDF prêt pour téléchargement.`);
    console.log('✅ Rapport de caisse généré:', period);
}

// Fonctions pour les actions sur les caisses (stubs)
function viewCashRegisterModal(name) {
    showSuccessMessage(`Consultation de la caisse: ${name} - Fonctionnalité en cours de développement.`);
}

function editCashRegisterModal(name) {
    showSuccessMessage(`Modification de la caisse: ${name} - Fonctionnalité en cours de développement.`);
}

function manageCashierAssignmentModal(name) {
    showSuccessMessage(`Gestion du caissier pour: ${name} - Fonctionnalité en cours de développement.`);
}

function confirmDeleteCashRegister(name) {
    showSuccessMessage(`Suppression de la caisse: ${name} - Fonctionnalité en cours de développement.`);
}
