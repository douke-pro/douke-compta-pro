// =============================================================================
// CAISSE.JS - Gestion des caisses avec système recettes/dépenses
// =============================================================================

// =============================================================================
// DONNÉES ET STRUCTURES CAISSE
// =============================================================================

// Structure d'une opération de caisse
class CaisseOperation {
    constructor(data) {
        this.id = data.id || Date.now();
        this.type = data.type; // 'RECETTE' ou 'DEPENSE'
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.heure = data.heure || new Date().toLocaleTimeString('fr-FR');
        this.client = data.client || '';
        this.description = data.description;
        this.montantTotal = parseFloat(data.montantTotal) || 0;
        this.moyensPaiement = {
            especes: parseFloat(data.especes) || 0,
            cheque: parseFloat(data.cheque) || 0,
            banque: parseFloat(data.banque) || 0,
            monnaieElectronique: parseFloat(data.monnaieElectronique) || 0
        };
        this.caisseId = data.caisseId;
        this.userId = data.userId || app.currentUser.id;
        this.validated = data.validated || false;
        this.pieceJustificative = data.pieceJustificative || null;
        this.createdAt = data.createdAt || new Date().toISOString();
    }
}

// Intitulés pré-définis pour les opérations
const INTITULES_RECETTES = [
    'Vente de marchandises',
    'Prestations de services',
    'Encaissement clients',
    'Remboursement de frais',
    'Autres recettes'
];

const INTITULES_DEPENSES = [
    'Achats divers',
    'Frais de transport',
    'Frais de bureau',
    'Paiement fournisseurs',
    'Frais de communication',
    'Autres dépenses'
];

function loadCaisse() {
    if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
        showCompanySelectionWarning('gestion des caisses');
        return;
    }

    // Initialiser les données caisse si pas existantes
    if (!app.caisseOperations) {
        app.caisseOperations = [];
    }

    if (!app.cashRegisters) {
        app.cashRegisters = [
            { id: 1, name: 'Caisse Principale', responsible: 'Ibrahim Koné', responsibleId: 1, balance: 210000, status: 'Ouvert', companyId: app.currentCompany?.id || 1 },
            { id: 2, name: 'Caisse Ventes', responsible: 'Fatou Diallo', responsibleId: 2, balance: 85000, status: 'Ouvert', companyId: app.currentCompany?.id || 1 },
            { id: 3, name: 'Caisse Réception', responsible: 'Non assigné', responsibleId: null, balance: 0, status: 'Fermé', companyId: app.currentCompany?.id || 1 }
        ];
    }

    // Interface différente selon le profil
    if (app.currentProfile === 'caissier') {
        loadCaisseInterface(); // Nouvelle interface complète pour caissiers
    } else {
        loadCaisseManagement(); // Interface de gestion pour admin/collaborateurs
    }
}

// =============================================================================
// INTERFACE CAISSIER - SYSTÈME RECETTES/DÉPENSES COMPLET
// =============================================================================

function loadCaisseInterface() {
    const userCaisse = getUserCaisse();
    if (!userCaisse) {
        document.getElementById('mainContent').innerHTML = `
            <div class="text-center p-8">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Aucune caisse assignée</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Contactez votre administrateur pour vous assigner une caisse.</p>
            </div>
        `;
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const soldeDebut = getSoldeCaisseDebut(today, userCaisse.id);
    const soldeFin = getSoldeCaisseFin(today, userCaisse.id);
    const operationsJour = getOperationsJour(today, userCaisse.id);
    const recettesJour = operationsJour.filter(op => op.type === 'RECETTE').reduce((sum, op) => sum + op.montantTotal, 0);
    const depensesJour = operationsJour.filter(op => op.type === 'DEPENSE').reduce((sum, op) => sum + op.montantTotal, 0);

    const content = `
        <div class="space-y-6">
            <!-- En-tête Caisse -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    💰 ${userCaisse.name}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="openAddRecetteModal()" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus-circle mr-2"></i>Nouvelle Recette
                        </button>
                        <button onclick="openAddDepenseModal()" class="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-minus-circle mr-2"></i>Nouvelle Dépense
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tableau de bord Caisse -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Solde début -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-blue-500">
                    <div class="text-3xl font-bold text-blue-600">${formatMontant(soldeDebut)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">🏁 Solde début</div>
                </div>
                
                <!-- Recettes du jour -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-green-500">
                    <div class="text-3xl font-bold text-green-600">${formatMontant(recettesJour)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">💰 Recettes du jour</div>
                </div>
                
                <!-- Dépenses du jour -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-red-500">
                    <div class="text-3xl font-bold text-red-600">${formatMontant(depensesJour)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">💸 Dépenses du jour</div>
                </div>
                
                <!-- Solde fin -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-purple-500">
                    <div class="text-3xl font-bold text-purple-600">${formatMontant(soldeFin)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">🏆 Solde actuel</div>
                </div>
            </div>

            <!-- Graphique d'évolution et moyens de paiement -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Graphique d'évolution -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-chart-line mr-2 text-primary"></i>Évolution (7 derniers jours)
                    </h3>
                    <div class="h-64">
                        <canvas id="caisseEvolutionChart"></canvas>
                    </div>
                </div>

                <!-- Actions rapides -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
                    </h3>
                    <div class="space-y-3">
                        <button onclick="genererEtatJournalier()" class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                            <i class="fas fa-calendar-day mr-2"></i>État Journalier
                        </button>
                        <button onclick="genererRapportHebdomadaire()" class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                            <i class="fas fa-calendar-week mr-2"></i>Rapport Hebdomadaire
                        </button>
                        <button onclick="genererRapportMensuel()" class="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                            <i class="fas fa-calendar-alt mr-2"></i>Rapport Mensuel
                        </button>
                        <button onclick="exportOperationsCaisse()" class="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                            <i class="fas fa-download mr-2"></i>Exporter Données
                        </button>
                    </div>
                    
                    <!-- Répartition moyens de paiement -->
                    <div class="mt-6">
                        <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-3">💳 Moyens de Paiement (Aujourd'hui)</h4>
                        <div class="h-48">
                            <canvas id="moyensPaiementChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Liste des opérations du jour -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        📋 Opérations du jour (${new Date().toLocaleDateString('fr-FR')})
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Heure</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Client</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Paiement</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${generateOperationsCaisseRows(operationsJour)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = content;
    
    // Initialiser les graphiques après rendu
    setTimeout(() => {
        initCaisseEvolutionChart();
        initMoyensPaiementChart();
    }, 100);
}

// =============================================================================
// INTERFACE GESTION DES CAISSES (ADMIN/COLLABORATEURS)
// =============================================================================

function loadCaisseManagement() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Caisses</h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
                    </div>
                    <button onclick="openAddCashRegisterModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle Caisse
                    </button>
                </div>
            </div>

            <!-- Statistiques des caisses -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${app.cashRegisters.length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total caisses</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${app.cashRegisters.filter(c => c.status === 'Ouvert').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Caisses ouvertes</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-info">${formatMontant(app.cashRegisters.reduce((sum, c) => sum + c.balance, 0))}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Solde total</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${app.caisseOperations.filter(op => !op.validated).length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En attente validation</div>
                </div>
            </div>

            <!-- Liste des caisses -->
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
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// FONCTIONS UTILITAIRES CAISSE
// =============================================================================

function getUserCaisse() {
    if (app.currentProfile === 'caissier') {
        return app.cashRegisters.find(c => c.responsibleId === app.currentUser.id);
    }
    return null;
}

function getSoldeCaisseDebut(date, caisseId) {
    const caisse = app.cashRegisters.find(c => c.id === caisseId);
    if (!caisse) return 0;

    // Solde initial + toutes les opérations jusqu'à la date donnée (exclue)
    const operationsAnterieures = app.caisseOperations.filter(op => 
        op.caisseId === caisseId && 
        op.date < date && 
        op.validated
    );

    let solde = caisse.balance;
    operationsAnterieures.forEach(op => {
        if (op.type === 'RECETTE') {
            solde += op.montantTotal;
        } else {
            solde -= op.montantTotal;
        }
    });

    return solde;
}

function getSoldeCaisseFin(date, caisseId) {
    const soldeDebut = getSoldeCaisseDebut(date, caisseId);
    const operationsJour = getOperationsJour(date, caisseId);
    
    let soldeFin = soldeDebut;
    operationsJour.forEach(op => {
        if (op.validated) {
            if (op.type === 'RECETTE') {
                soldeFin += op.montantTotal;
            } else {
                soldeFin -= op.montantTotal;
            }
        }
    });

    return soldeFin;
}

function getOperationsJour(date, caisseId) {
    return app.caisseOperations.filter(op => 
        op.caisseId === caisseId && 
        op.date === date
    ).sort((a, b) => new Date(`${a.date} ${a.heure}`) - new Date(`${b.date} ${b.heure}`));
}

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
    }).format(montant).replace('XOF', 'FCFA');
}

// =============================================================================
// MODALS POUR AJOUTER RECETTES/DÉPENSES
// =============================================================================

function openAddRecetteModal() {
    const userCaisse = getUserCaisse();
    if (!userCaisse) {
        alert('❌ Aucune caisse assignée.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-plus-circle mr-2 text-success"></i>Nouvelle Recette
                </h3>

                <form id="addRecetteForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                            <input type="date" id="recetteDate" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Heure</label>
                            <input type="time" id="recetteHeure" value="${new Date().toTimeString().slice(0,5)}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client/Source</label>
                            <input type="text" id="recetteClient" placeholder="Nom du client ou source" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                            <select id="recetteDescription" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="toggleCustomDescription('recette')">
                                <option value="">Sélectionner une description</option>
                                ${INTITULES_RECETTES.map(intitule => `<option value="${intitule}">${intitule}</option>`).join('')}
                                <option value="custom">Autre (personnalisé)</option>
                            </select>
                        </div>

                        <div id="recetteCustomDescription" style="display: none;" class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description personnalisée</label>
                            <input type="text" id="recetteCustomInput" placeholder="Saisir la description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant Total * (FCFA)</label>
                            <input type="number" id="recetteMontantTotal" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateMontantTotal('recette')">
                        </div>
                    </div>

                    <!-- Répartition moyens de paiement -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">💳 Répartition par moyens de paiement</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 Espèces</label>
                                <input type="number" id="recetteEspeces" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('recette')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📄 Chèque</label>
                                <input type="number" id="recetteCheque" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('recette')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🏦 Banque</label>
                                <input type="number" id="recetteBanque" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('recette')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📱 Mobile Money</label>
                                <input type="number" id="recetteMonnaieElectronique" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('recette')">
                            </div>
                        </div>
                        <div id="recetteRepartitionInfo" class="mt-2 text-sm text-gray-600 dark:text-gray-400"></div>
                    </div>

                    <!-- Upload pièce justificative -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📎 Pièce justificative (optionnel)</label>
                        <div class="flex items-center space-x-4">
                            <button type="button" onclick="uploadPieceJustificative('recette')" class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-upload mr-2"></i>Choisir fichier
                            </button>
                            <div id="recettePieceInfo" class="text-sm text-gray-600 dark:text-gray-400"></div>
                        </div>
                        <input type="file" id="recettePieceInput" style="display: none;" accept="image/*,.pdf" onchange="handlePieceUpload('recette')">
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Enregistrer Recette
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const form = document.getElementById('addRecetteForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddRecette();
            });
        }
    }, 100);
}

function openAddDepenseModal() {
    const userCaisse = getUserCaisse();
    if (!userCaisse) {
        alert('❌ Aucune caisse assignée.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-minus-circle mr-2 text-danger"></i>Nouvelle Dépense
                </h3>

                <form id="addDepenseForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                            <input type="date" id="depenseDate" value="${new Date().toISOString().split('T')[0]}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Heure</label>
                            <input type="time" id="depenseHeure" value="${new Date().toTimeString().slice(0,5)}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fournisseur/Bénéficiaire</label>
                            <input type="text" id="depenseClient" placeholder="Nom du fournisseur ou bénéficiaire" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                            <select id="depenseDescription" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="toggleCustomDescription('depense')">
                                <option value="">Sélectionner une description</option>
                                ${INTITULES_DEPENSES.map(intitule => `<option value="${intitule}">${intitule}</option>`).join('')}
                                <option value="custom">Autre (personnalisé)</option>
                            </select>
                        </div>

                        <div id="depenseCustomDescription" style="display: none;" class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description personnalisée</label>
                            <input type="text" id="depenseCustomInput" placeholder="Saisir la description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant Total * (FCFA)</label>
                            <input type="number" id="depenseMontantTotal" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateMontantTotal('depense')">
                        </div>
                    </div>

                    <!-- Répartition moyens de paiement -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">💳 Répartition par moyens de paiement</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 Espèces</label>
                                <input type="number" id="depenseEspeces" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('depense')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📄 Chèque</label>
                                <input type="number" id="depenseCheque" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('depense')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🏦 Banque</label>
                                <input type="number" id="depenseBanque" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('depense')">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📱 Mobile Money</label>
                                <input type="number" id="depenseMonnaieElectronique" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="updateRepartition('depense')">
                            </div>
                        </div>
                        <div id="depenseRepartitionInfo" class="mt-2 text-sm text-gray-600 dark:text-gray-400"></div>
                    </div>

                    <!-- Upload pièce justificative -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📎 Pièce justificative (optionnel)</label>
                        <div class="flex items-center space-x-4">
                            <button type="button" onclick="uploadPieceJustificative('depense')" class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-upload mr-2"></i>Choisir fichier
                            </button>
                            <div id="depensePieceInfo" class="text-sm text-gray-600 dark:text-gray-400"></div>
                        </div>
                        <input type="file" id="depensePieceInput" style="display: none;" accept="image/*,.pdf" onchange="handlePieceUpload('depense')">
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Enregistrer Dépense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const form = document.getElementById('addDepenseForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddDepense();
            });
        }
    }, 100);
}

// =============================================================================
// FONCTIONS UTILITAIRES MODALS
// =============================================================================

function toggleCustomDescription(type) {
    const select = document.getElementById(`${type}Description`);
    const customDiv = document.getElementById(`${type}CustomDescription`);
    
    if (select.value === 'custom') {
        customDiv.style.display = 'block';
    } else {
        customDiv.style.display = 'none';
    }
}

function updateMontantTotal(type) {
    const montantTotal = parseFloat(document.getElementById(`${type}MontantTotal`).value) || 0;
    
    // Auto-remplir en espèces par défaut
    document.getElementById(`${type}Especes`).value = montantTotal;
    document.getElementById(`${type}Cheque`).value = 0;
    document.getElementById(`${type}Banque`).value = 0;
    document.getElementById(`${type}MonnaieElectronique`).value = 0;
    
    updateRepartition(type);
}

function updateRepartition(type) {
    const montantTotal = parseFloat(document.getElementById(`${type}MontantTotal`).value) || 0;
    const especes = parseFloat(document.getElementById(`${type}Especes`).value) || 0;
    const cheque = parseFloat(document.getElementById(`${type}Cheque`).value) || 0;
    const banque = parseFloat(document.getElementById(`${type}Banque`).value) || 0;
    const monnaieElectronique = parseFloat(document.getElementById(`${type}MonnaieElectronique`).value) || 0;
    
    const totalRepartition = especes + cheque + banque + monnaieElectronique;
    const difference = montantTotal - totalRepartition;
    
    const infoDiv = document.getElementById(`${type}RepartitionInfo`);
    
    if (difference === 0) {
        infoDiv.innerHTML = `<span class="text-green-600">✅ Répartition correcte: ${formatMontant(totalRepartition)}</span>`;
    } else if (difference > 0) {
        infoDiv.innerHTML = `<span class="text-orange-600">⚠️ Manque: ${formatMontant(difference)}</span>`;
    } else {
        infoDiv.innerHTML = `<span class="text-red-600">❌ Excédent: ${formatMontant(Math.abs(difference))}</span>`;
    }
}

function uploadPieceJustificative(type) {
    document.getElementById(`${type}PieceInput`).click();
}

function handlePieceUpload(type) {
    const input = document.getElementById(`${type}PieceInput`);
    const file = input.files[0];
    const infoDiv = document.getElementById(`${type}PieceInfo`);
    
    if (file) {
        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Le fichier est trop volumineux. Taille maximum: 5MB');
            input.value = '';
            return;
        }
        
        infoDiv.innerHTML = `<span class="text-green-600">✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>`;
    } else {
        infoDiv.innerHTML = '';
    }
}

// =============================================================================
// TRAITEMENT DES AJOUTS RECETTES/DÉPENSES
// =============================================================================

function handleAddRecette() {
    const userCaisse = getUserCaisse();
    const data = {
        type: 'RECETTE',
        date: document.getElementById('recetteDate').value,
        heure: document.getElementById('recetteHeure').value,
        client: document.getElementById('recetteClient').value,
        description: getDescription('recette'),
        montantTotal: parseFloat(document.getElementById('recetteMontantTotal').value),
        especes: parseFloat(document.getElementById('recetteEspeces').value) || 0,
        cheque: parseFloat(document.getElementById('recetteCheque').value) || 0,
        banque: parseFloat(document.getElementById('recetteBanque').value) || 0,
        monnaieElectronique: parseFloat(document.getElementById('recetteMonnaieElectronique').value) || 0,
        caisseId: userCaisse.id
    };

    // Validation de la répartition
    const totalRepartition = data.especes + data.cheque + data.banque + data.monnaieElectronique;
    if (Math.abs(data.montantTotal - totalRepartition) > 0.01) {
        alert('❌ La répartition des moyens de paiement ne correspond pas au montant total.');
        return;
    }

    // Gérer la pièce justificative
    const pieceInput = document.getElementById('recettePieceInput');
    if (pieceInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            data.pieceJustificative = {
                name: pieceInput.files[0].name,
                type: pieceInput.files[0].type,
                data: e.target.result
            };
            ajouterOperationCaisse(data);
        };
        reader.readAsDataURL(pieceInput.files[0]);
    } else {
        ajouterOperationCaisse(data);
    }
}

function handleAddDepense() {
    const userCaisse = getUserCaisse();
    const data = {
        type: 'DEPENSE',
        date: document.getElementById('depenseDate').value,
        heure: document.getElementById('depenseHeure').value,
        client: document.getElementById('depenseClient').value,
        description: getDescription('depense'),
        montantTotal: parseFloat(document.getElementById('depenseMontantTotal').value),
        especes: parseFloat(document.getElementById('depenseEspeces').value) || 0,
        cheque: parseFloat(document.getElementById('depenseCheque').value) || 0,
        banque: parseFloat(document.getElementById('depenseBanque').value) || 0,
        monnaieElectronique: parseFloat(document.getElementById('depenseMonnaieElectronique').value) || 0,
        caisseId: userCaisse.id
    };

    // Validation de la répartition
    const totalRepartition = data.especes + data.cheque + data.banque + data.monnaieElectronique;
    if (Math.abs(data.montantTotal - totalRepartition) > 0.01) {
        alert('❌ La répartition des moyens de paiement ne correspond pas au montant total.');
        return;
    }

    // Gérer la pièce justificative
    const pieceInput = document.getElementById('depensePieceInput');
    if (pieceInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            data.pieceJustificative = {
                name: pieceInput.files[0].name,
                type: pieceInput.files[0].type,
                data: e.target.result
            };
            ajouterOperationCaisse(data);
        };
        reader.readAsDataURL(pieceInput.files[0]);
    } else {
        ajouterOperationCaisse(data);
    }
}

function getDescription(type) {
    const select = document.getElementById(`${type}Description`);
    if (select.value === 'custom') {
        return document.getElementById(`${type}CustomInput`).value;
    }
    return select.value;
}

function ajouterOperationCaisse(data) {
    const operation = new CaisseOperation(data);
    app.caisseOperations.push(operation);
    
    closeModal();
    showSuccessMessage(`✅ ${operation.type === 'RECETTE' ? 'Recette' : 'Dépense'} enregistrée avec succès !`);
    
    // Recharger l'interface caisse
    if (app.currentProfile === 'caissier') {
        loadCaisseInterface();
    } else {
        loadCaisseManagement();
    }
    
    console.log('✅ Opération caisse ajoutée:', operation);
}

// =============================================================================
// GÉNÉRATION DES LIGNES DU TABLEAU
// =============================================================================

function generateOperationsCaisseRows(operations) {
    if (operations.length === 0) {
        return `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                    <div>Aucune opération pour aujourd'hui</div>
                </td>
            </tr>
        `;
    }

    return operations.map(op => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 text-gray-900 dark:text-white">${op.heure}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${op.type === 'RECETTE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}">
                    ${op.type === 'RECETTE' ? '💰 RECETTE' : '💸 DÉPENSE'}
                </span>
            </td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${op.description}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${op.client || '-'}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white font-semibold">${formatMontant(op.montantTotal)}</td>
            <td class="px-6 py-4">
                <div class="text-xs text-gray-600 dark:text-gray-400">
                    ${getMoyensPaiementDisplay(op.moyensPaiement)}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="viewOperationCaisse(${op.id})" class="text-info hover:text-info/80" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${op.pieceJustificative ? `
                    <button onclick="viewPieceJustificative(${op.id})" class="text-purple-600 hover:text-purple-800" title="Voir pièce">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    ` : ''}
                    <button onclick="toggleValidationOperation(${op.id})" class="text-${op.validated ? 'success' : 'warning'} hover:opacity-80" title="${op.validated ? 'Validée' : 'En attente'}">
                        <i class="fas fa-${op.validated ? 'check-circle' : 'clock'}"></i>
                    </button>
                    <button onclick="deleteOperationCaisse(${op.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getMoyensPaiementDisplay(moyens) {
    const parts = [];
    if (moyens.especes > 0) parts.push(`💰 ${formatMontant(moyens.especes)}`);
    if (moyens.cheque > 0) parts.push(`📄 ${formatMontant(moyens.cheque)}`);
    if (moyens.banque > 0) parts.push(`🏦 ${formatMontant(moyens.banque)}`);
    if (moyens.monnaieElectronique > 0) parts.push(`📱 ${formatMontant(moyens.monnaieElectronique)}`);
    return parts.join('<br>') || '-';
}

function generateCashRegistersRows() {
    return app.cashRegisters.map(cash => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${cash.name}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${cash.responsible}</td>
            <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${formatMontant(cash.balance)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="viewCashRegisterModal(${cash.id})" class="text-primary hover:text-primary/80" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCashRegisterModal(${cash.id})" class="text-info hover:text-info/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="manageCashierAssignmentModal(${cash.id})" class="text-warning hover:text-warning/80" title="Assigner caissier">
                        <i class="fas fa-user-cog"></i>
                    </button>
                    <button onclick="confirmDeleteCashRegister(${cash.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// =============================================================================
// GESTION DES CAISSES (ADMIN/COLLABORATEURS)
// =============================================================================

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
                            ${app.users.filter(u => u.role === 'Caissier').map(user => `
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

    const newCashRegister = {
        id: app.cashRegisters.length > 0 ? Math.max(...app.cashRegisters.map(c => c.id)) + 1 : 1,
        name: name,
        responsible: responsible ? responsible.name : 'Non assigné',
        responsibleId: responsibleId ? parseInt(responsibleId) : null,
        balance: balance,
        status: 'Fermé',
        companyId: app.currentCompany?.id || 1,
        createdAt: new Date().toISOString()
    };

    app.cashRegisters.push(newCashRegister);

    closeModal();
    loadCaisseManagement();
    showSuccessMessage(`✅ Caisse "${name}" créée avec succès !`);
    console.log('✅ Nouvelle caisse créée:', newCashRegister);
}

// =============================================================================
// GRAPHIQUES AVEC CHART.JS
// =============================================================================

function initCaisseEvolutionChart() {
    const ctx = document.getElementById('caisseEvolutionChart');
    if (!ctx) return;

    const userCaisse = getUserCaisse();
    if (!userCaisse) return;

    const dates = [];
    const soldes = [];
    
    // Générer les 7 derniers jours
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        soldes.push(getSoldeCaisseFin(dateStr, userCaisse.id));
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Solde de caisse',
                data: soldes,
                borderColor: '#5D5CDE',
                backgroundColor: 'rgba(93, 92, 222, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#5D5CDE',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatMontant(value);
                        }
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

function initMoyensPaiementChart() {
    const ctx = document.getElementById('moyensPaiementChart');
    if (!ctx) return;

    const userCaisse = getUserCaisse();
    if (!userCaisse) return;

    const today = new Date().toISOString().split('T')[0];
    const operations = getOperationsJour(today, userCaisse.id);
    
    const totaux = {
        especes: 0,
        cheque: 0,
        banque: 0,
        monnaieElectronique: 0
    };
    
    operations.forEach(op => {
        if (op.validated) {
            totaux.especes += op.moyensPaiement.especes;
            totaux.cheque += op.moyensPaiement.cheque;
            totaux.banque += op.moyensPaiement.banque;
            totaux.monnaieElectronique += op.moyensPaiement.monnaieElectronique;
        }
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['💰 Espèces', '📄 Chèques', '🏦 Banque', '📱 Mobile Money'],
            datasets: [{
                data: [totaux.especes, totaux.cheque, totaux.banque, totaux.monnaieElectronique],
                backgroundColor: [
                    '#10B981',
                    '#F59E0B',
                    '#3B82F6',
                    '#8B5CF6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// =============================================================================
// RAPPORTS ET EXPORTS
// =============================================================================

function genererEtatJournalier() {
    const userCaisse = getUserCaisse();
    if (!userCaisse) return;

    const today = new Date().toISOString().split('T')[0];
    const soldeDebut = getSoldeCaisseDebut(today, userCaisse.id);
    const soldeFin = getSoldeCaisseFin(today, userCaisse.id);
    const operations = getOperationsJour(today, userCaisse.id);
    
    const recettes = operations.filter(op => op.type === 'RECETTE' && op.validated);
    const depenses = operations.filter(op => op.type === 'DEPENSE' && op.validated);
    
    const totalRecettes = recettes.reduce((sum, op) => sum + op.montantTotal, 0);
    const totalDepenses = depenses.reduce((sum, op) => sum + op.montantTotal, 0);

    const rapport = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>État Journalier - ${userCaisse.name} - ${new Date().toLocaleDateString('fr-FR')}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 ÉTAT JOURNALIER DE CAISSE</h1>
                <h2>${userCaisse.name}</h2>
                <h3>${new Date().toLocaleDateString('fr-FR')}</h3>
            </div>
            
            <div class="section">
                <h3>💰 Résumé</h3>
                <table>
                    <tr><td>Solde début de journée</td><td>${formatMontant(soldeDebut)}</td></tr>
                    <tr><td>Total recettes</td><td style="color: green;">${formatMontant(totalRecettes)}</td></tr>
                    <tr><td>Total dépenses</td><td style="color: red;">${formatMontant(totalDepenses)}</td></tr>
                    <tr class="total"><td>Solde fin de journée</td><td>${formatMontant(soldeFin)}</td></tr>
                </table>
            </div>

            <div class="section">
                <h3>💰 Recettes (${recettes.length})</h3>
                <table>
                    <tr><th>Heure</th><th>Description</th><th>Client</th><th>Montant</th></tr>
                    ${recettes.map(op => `
                        <tr>
                            <td>${op.heure}</td>
                            <td>${op.description}</td>
                            <td>${op.client || '-'}</td>
                            <td>${formatMontant(op.montantTotal)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total"><td colspan="3">TOTAL RECETTES</td><td>${formatMontant(totalRecettes)}</td></tr>
                </table>
            </div>

            <div class="section">
                <h3>💸 Dépenses (${depenses.length})</h3>
                <table>
                    <tr><th>Heure</th><th>Description</th><th>Bénéficiaire</th><th>Montant</th></tr>
                    ${depenses.map(op => `
                        <tr>
                            <td>${op.heure}</td>
                            <td>${op.description}</td>
                            <td>${op.client || '-'}</td>
                            <td>${formatMontant(op.montantTotal)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total"><td colspan="3">TOTAL DÉPENSES</td><td>${formatMontant(totalDepenses)}</td></tr>
                </table>
            </div>
        </body>
        </html>
    `;

    // Ouvrir dans une nouvelle fenêtre pour impression
    const newWindow = window.open('', '_blank');
    newWindow.document.write(rapport);
    newWindow.document.close();
    newWindow.print();
}

function genererRapportHebdomadaire() {
    showSuccessMessage('🔄 Rapport hebdomadaire en cours de génération...');
    // TODO: Implémenter le rapport hebdomadaire complet
}

function genererRapportMensuel() {
    showSuccessMessage('🔄 Rapport mensuel en cours de génération...');
    // TODO: Implémenter le rapport mensuel complet
}

function exportOperationsCaisse() {
    const userCaisse = getUserCaisse();
    if (!userCaisse) return;

    const operations = app.caisseOperations.filter(op => op.caisseId === userCaisse.id);
    const csvContent = generateCSVContent(operations);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `operations-${userCaisse.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showSuccessMessage('✅ Données exportées avec succès !');
}

function generateCSVContent(operations) {
    const headers = ['Date', 'Heure', 'Type', 'Description', 'Client', 'Montant', 'Espèces', 'Chèque', 'Banque', 'Mobile Money', 'Validé'];
    const rows = operations.map(op => [
        op.date,
        op.heure,
        op.type,
        op.description,
        op.client || '',
        op.montantTotal,
        op.moyensPaiement.especes,
        op.moyensPaiement.cheque,
        op.moyensPaiement.banque,
        op.moyensPaiement.monnaieElectronique,
        op.validated ? 'Oui' : 'Non'
    ]);
    
    return [headers, ...rows].map(row => row.join(';')).join('\n');
}

// =============================================================================
// ACTIONS SUR LES OPÉRATIONS
// =============================================================================

function viewOperationCaisse(operationId) {
    const operation = app.caisseOperations.find(op => op.id === operationId);
    if (!operation) return;

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    ${operation.type === 'RECETTE' ? '💰' : '💸'} Détails ${operation.type.toLowerCase()}
                </h3>
                
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><strong>Date:</strong> ${new Date(operation.date).toLocaleDateString('fr-FR')}</div>
                        <div><strong>Heure:</strong> ${operation.heure}</div>
                        <div><strong>Type:</strong> <span class="px-2 py-1 rounded text-sm ${operation.type === 'RECETTE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${operation.type}</span></div>
                        <div><strong>Montant:</strong> ${formatMontant(operation.montantTotal)}</div>
                    </div>
                    
                    <div><strong>Description:</strong> ${operation.description}</div>
                    <div><strong>${operation.type === 'RECETTE' ? 'Client' : 'Bénéficiaire'}:</strong> ${operation.client || 'Non renseigné'}</div>
                    
                    <div>
                        <strong>Moyens de paiement:</strong>
                        <div class="grid grid-cols-2 gap-2 mt-2">
                            <div>💰 Espèces: ${formatMontant(operation.moyensPaiement.especes)}</div>
                            <div>📄 Chèques: ${formatMontant(operation.moyensPaiement.cheque)}</div>
                            <div>🏦 Banque: ${formatMontant(operation.moyensPaiement.banque)}</div>
                            <div>📱 Mobile Money: ${formatMontant(operation.moyensPaiement.monnaieElectronique)}</div>
                        </div>
                    </div>
                    
                    <div><strong>Statut:</strong> <span class="px-2 py-1 rounded text-sm ${operation.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${operation.validated ? 'Validée' : 'En attente'}</span></div>
                </div>
                
                <div class="flex justify-end space-x-4 pt-6">
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg">Fermer</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function viewPieceJustificative(operationId) {
    const operation = app.caisseOperations.find(op => op.id === operationId);
    if (!operation || !operation.pieceJustificative) return;

    const piece = operation.pieceJustificative;
    const isImage = piece.type.startsWith('image/');

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    📎 Pièce justificative - ${piece.name}
                </h3>
                
                <div class="text-center">
                    ${isImage 
                        ? `<img src="${piece.data}" alt="${piece.name}" class="max-w-full h-auto rounded-lg shadow-lg">`
                        : `<div class="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                             <i class="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
                             <p>Fichier PDF: ${piece.name}</p>
                             <a href="${piece.data}" download="${piece.name}" class="bg-primary text-white px-4 py-2 rounded-lg mt-4 inline-block">
                               <i class="fas fa-download mr-2"></i>Télécharger
                             </a>
                           </div>`
                    }
                </div>
                
                <div class="flex justify-end space-x-4 pt-6">
                    <a href="${piece.data}" download="${piece.name}" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg">
                        <i class="fas fa-download mr-2"></i>Télécharger
                    </a>
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg">Fermer</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function toggleValidationOperation(operationId) {
    const operation = app.caisseOperations.find(op => op.id === operationId);
    if (operation) {
        operation.validated = !operation.validated;
        showSuccessMessage(`✅ Opération ${operation.validated ? 'validée' : 'invalidée'} !`);
        if (app.currentProfile === 'caissier') {
            loadCaisseInterface();
        } else {
            loadCaisseManagement();
        }
    }
}

function deleteOperationCaisse(operationId) {
    const operation = app.caisseOperations.find(op => op.id === operationId);
    if (operation && confirm(`Supprimer cette ${operation.type.toLowerCase()} de ${formatMontant(operation.montantTotal)} ?`)) {
        app.caisseOperations = app.caisseOperations.filter(op => op.id !== operationId);
        showSuccessMessage('✅ Opération supprimée !');
        if (app.currentProfile === 'caissier') {
            loadCaisseInterface();
        } else {
            loadCaisseManagement();
        }
    }
}

// =============================================================================
// STUBS POUR FONCTIONS EXISTANTES (À COMPLÉTER)
// =============================================================================

function viewCashRegisterModal(cashId) {
    showSuccessMessage(`Consultation de la caisse ID: ${cashId} - Fonctionnalité en cours de développement.`);
}

function editCashRegisterModal(cashId) {
    showSuccessMessage(`Modification de la caisse ID: ${cashId} - Fonctionnalité en cours de développement.`);
}

function manageCashierAssignmentModal(cashId) {
    showSuccessMessage(`Gestion du caissier pour caisse ID: ${cashId} - Fonctionnalité en cours de développement.`);
}

function confirmDeleteCashRegister(cashId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette caisse ?')) {
        app.cashRegisters = app.cashRegisters.filter(c => c.id !== cashId);
        showSuccessMessage('✅ Caisse supprimée avec succès !');
        loadCaisseManagement();
    }
}

// Ancienne fonction pour compatibilité
function generateCashReport(period = 'daily') {
    if (app.currentProfile === 'caissier') {
        genererEtatJournalier();
    } else {
        const periods = {
            'daily': 'État journalier',
            'weekly': 'Rapport hebdomadaire', 
            'monthly': 'Rapport mensuel'
        };
        showSuccessMessage(`Génération de l'${periods[period]} de caisse en cours...`);
    }
}

// Assurer que Chart.js est disponible
if (typeof Chart === 'undefined') {
    console.warn('Chart.js non disponible - Les graphiques ne s\'afficheront pas');
}
