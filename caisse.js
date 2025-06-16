<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Système de Gestion de Caisse</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#5D5CDE',
                        success: '#10B981',
                        warning: '#F59E0B',
                        danger: '#EF4444',
                        info: '#3B82F6'
                    }
                }
            },
            darkMode: 'class'
        }
    </script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-hover {
            transition: all 0.3s ease;
        }
        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 min-h-screen">
    <!-- Header -->
    <header class="gradient-bg text-white p-6">
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold">💰 Gestion de Caisse</h1>
                    <p class="text-blue-100 mt-1">Caisse Principale - Système Recettes/Dépenses</p>
                </div>
                <div class="flex space-x-4">
                    <button onclick="openOperationModal('recette')" 
                            class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i>Nouvelle Recette
                    </button>
                    <button onclick="openOperationModal('depense')" 
                            class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-minus-circle mr-2"></i>Nouvelle Dépense
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto p-6">
        <!-- Tableau de bord -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-blue-500 card-hover">
                <div class="text-3xl font-bold text-blue-600" id="soldeDebut">450,000 FCFA</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">🏁 Solde début</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-green-500 card-hover">
                <div class="text-3xl font-bold text-green-600" id="totalRecettes">0 FCFA</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">💰 Recettes du jour</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-red-500 card-hover">
                <div class="text-3xl font-bold text-red-600" id="totalDepenses">0 FCFA</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">💸 Dépenses du jour</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-purple-500 card-hover">
                <div class="text-3xl font-bold text-purple-600" id="soldeActuel">450,000 FCFA</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">🏆 Solde actuel</div>
            </div>
        </div>

        <!-- Graphiques -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-chart-line mr-2 text-primary"></i>Évolution (7 derniers jours)
                </h3>
                <div class="h-64">
                    <canvas id="evolutionChart"></canvas>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-chart-pie mr-2 text-primary"></i>Moyens de Paiement
                </h3>
                <div class="h-64">
                    <canvas id="paiementChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Actions rapides -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <i class="fas fa-bolt mr-2 text-primary"></i>Actions Rapides
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button onclick="genererRapport()" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                    <i class="fas fa-calendar-day mr-2"></i>État Journalier
                </button>
                <button onclick="exportCSV()" class="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                    <i class="fas fa-download mr-2"></i>Export CSV
                </button>
                <button onclick="exportPiecesJustificatives()" class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                    <i class="fas fa-file-download mr-2"></i>Export Pièces
                </button>
                <button onclick="toggleMode()" class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-all hover:shadow-lg">
                    <i class="fas fa-moon mr-2"></i>Mode Sombre
                </button>
            </div>
        </div>

        <!-- Liste des opérations -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    📋 Opérations du jour
                </h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Heure</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Client/Fournisseur</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Paiement</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="operationsTableBody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <!-- Les opérations seront ajoutées ici -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal pour ajouter une opération -->
    <div id="operationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 id="modalTitle" class="text-xl font-bold text-gray-900 dark:text-white mb-6"></h3>
            
            <form id="operationForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                        <input type="date" id="date" required 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Heure</label>
                        <input type="time" id="heure" 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" id="clientLabel">Client</label>
                        <input type="text" id="client" placeholder="Nom du client"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                        <select id="description" required 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">Sélectionner...</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant Total * (FCFA)</label>
                        <input type="number" id="montantTotal" min="0" step="0.01" required 
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                               onchange="updateRepartition()">
                    </div>
                </div>

                <!-- Répartition moyens de paiement -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">💳 Répartition par moyens de paiement</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 Espèces</label>
                            <input type="number" id="especes" min="0" step="0.01" value="0" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                                   onchange="updateRepartition()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📄 Chèque</label>
                            <input type="number" id="cheque" min="0" step="0.01" value="0" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                                   onchange="updateRepartition()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🏦 Banque</label>
                            <input type="number" id="banque" min="0" step="0.01" value="0" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                                   onchange="updateRepartition()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📱 Mobile Money</label>
                            <input type="number" id="monnaieElectronique" min="0" step="0.01" value="0" 
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" 
                                   onchange="updateRepartition()">
                        </div>
                    </div>
                    
                    <!-- Règlement Client/Fournisseur pour différence -->
                    <div id="clientFournisseurSection" style="display: none;" class="border-t pt-4 mt-4">
                        <h5 class="text-md font-semibold text-gray-900 dark:text-white mb-3">👥 Règlement Client/Fournisseur</h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code Client/Fournisseur *</label>
                                <input type="text" id="codeClientFournisseur" placeholder="Ex: CLI001 ou FRS001" 
                                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Montant différence</label>
                                <input type="number" id="montantDifference" step="0.01" readonly
                                       class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base">
                            </div>
                        </div>
                    </div>
                    
                    <div id="repartitionInfo" class="mt-4 text-sm"></div>
                </div>

                <!-- Upload pièce justificative -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📎 Pièce justificative (optionnel)</label>
                    <div class="flex items-center space-x-4">
                        <button type="button" onclick="document.getElementById('pieceInput').click()" 
                                class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-upload mr-2"></i>Choisir fichier
                        </button>
                        <div id="pieceInfo" class="text-sm text-gray-600 dark:text-gray-400"></div>
                    </div>
                    <input type="file" id="pieceInput" style="display: none;" accept="image/*,.pdf" onchange="handleFileUpload()">
                </div>

                <div class="flex justify-end space-x-4 pt-6">
                    <button type="button" onclick="closeModal()" 
                            class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button type="submit" 
                            class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-save mr-2"></i>Enregistrer
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Variables globales
        let operations = [];
        let currentOperationType = '';
        let uploadedFile = null;
        
        // Intitulés prédéfinis
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

        // Gestion du mode sombre
        function toggleMode() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDark);
        }

        // Initialiser le mode sombre selon la préférence
        if (localStorage.getItem('darkMode') === 'true' || 
            (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }

        // Formatage des montants
        function formatMontant(montant) {
            return new Intl.NumberFormat('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(montant) + ' FCFA';
        }

        // Ouvrir modal d'opération
        function openOperationModal(type) {
            currentOperationType = type;
            const modal = document.getElementById('operationModal');
            const title = document.getElementById('modalTitle');
            const clientLabel = document.getElementById('clientLabel');
            const description = document.getElementById('description');
            
            // Remplir les champs par défaut
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('heure').value = new Date().toTimeString().slice(0,5);
            
            if (type === 'recette') {
                title.innerHTML = '<i class="fas fa-plus-circle mr-2 text-green-500"></i>Nouvelle Recette';
                clientLabel.textContent = 'Client';
                description.innerHTML = '<option value="">Sélectionner...</option>' + 
                    INTITULES_RECETTES.map(i => `<option value="${i}">${i}</option>`).join('');
            } else {
                title.innerHTML = '<i class="fas fa-minus-circle mr-2 text-red-500"></i>Nouvelle Dépense';
                clientLabel.textContent = 'Fournisseur/Bénéficiaire';
                description.innerHTML = '<option value="">Sélectionner...</option>' + 
                    INTITULES_DEPENSES.map(i => `<option value="${i}">${i}</option>`).join('');
            }
            
            // Reset form
            document.getElementById('operationForm').reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            document.getElementById('heure').value = new Date().toTimeString().slice(0,5);
            document.getElementById('pieceInfo').textContent = '';
            document.getElementById('clientFournisseurSection').style.display = 'none';
            uploadedFile = null;
            
            modal.classList.remove('hidden');
        }

        // Fermer modal
        function closeModal() {
            document.getElementById('operationModal').classList.add('hidden');
        }

        // Mise à jour de la répartition
        function updateRepartition() {
            const montantTotal = parseFloat(document.getElementById('montantTotal').value) || 0;
            const especes = parseFloat(document.getElementById('especes').value) || 0;
            const cheque = parseFloat(document.getElementById('cheque').value) || 0;
            const banque = parseFloat(document.getElementById('banque').value) || 0;
            const monnaieElectronique = parseFloat(document.getElementById('monnaieElectronique').value) || 0;
            
            const totalPaiements = especes + cheque + banque + monnaieElectronique;
            const difference = montantTotal - totalPaiements;
            
            const infoDiv = document.getElementById('repartitionInfo');
            const clientSection = document.getElementById('clientFournisseurSection');
            const montantDiffField = document.getElementById('montantDifference');
            
            if (Math.abs(difference) < 0.01) {
                infoDiv.innerHTML = '<span class="text-green-600 font-medium">✅ Répartition correcte</span>';
                clientSection.style.display = 'none';
            } else {
                clientSection.style.display = 'block';
                montantDiffField.value = Math.abs(difference).toFixed(2);
                
                if (difference > 0) {
                    infoDiv.innerHTML = `<span class="text-orange-600 font-medium">⚠️ Manque: ${formatMontant(difference)} - Créance client/fournisseur requise</span>`;
                } else {
                    infoDiv.innerHTML = `<span class="text-blue-600 font-medium">💰 Excédent: ${formatMontant(Math.abs(difference))} - Dette client/fournisseur</span>`;
                }
            }
        }

        // Auto-remplir en espèces par défaut
        document.getElementById('montantTotal').addEventListener('input', function() {
            const montant = parseFloat(this.value) || 0;
            document.getElementById('especes').value = montant;
            document.getElementById('cheque').value = 0;
            document.getElementById('banque').value = 0;
            document.getElementById('monnaieElectronique').value = 0;
            updateRepartition();
        });

        // Gestion upload fichier
        function handleFileUpload() {
            const input = document.getElementById('pieceInput');
            const file = input.files[0];
            const infoDiv = document.getElementById('pieceInfo');
            
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('❌ Fichier trop volumineux (max 5MB)');
                    input.value = '';
                    return;
                }
                
                uploadedFile = file;
                infoDiv.innerHTML = `<span class="text-green-600">✅ ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)</span>`;
            } else {
                uploadedFile = null;
                infoDiv.textContent = '';
            }
        }

        // Soumettre le formulaire
        document.getElementById('operationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const montantTotal = parseFloat(document.getElementById('montantTotal').value);
            const especes = parseFloat(document.getElementById('especes').value) || 0;
            const cheque = parseFloat(document.getElementById('cheque').value) || 0;
            const banque = parseFloat(document.getElementById('banque').value) || 0;
            const monnaieElectronique = parseFloat(document.getElementById('monnaieElectronique').value) || 0;
            const totalPaiements = especes + cheque + banque + monnaieElectronique;
            const difference = Math.abs(montantTotal - totalPaiements);
            
            // Validation différence Client/Fournisseur
            if (difference > 0.01) {
                const codeClientFournisseur = document.getElementById('codeClientFournisseur').value.trim();
                if (!codeClientFournisseur) {
                    alert('❌ Code Client/Fournisseur requis pour la différence de paiement');
                    return;
                }
            }
            
            const operation = {
                id: Date.now(),
                type: currentOperationType.toUpperCase(),
                date: document.getElementById('date').value,
                heure: document.getElementById('heure').value,
                client: document.getElementById('client').value,
                description: document.getElementById('description').value,
                montantTotal: montantTotal,
                moyensPaiement: {
                    especes: especes,
                    cheque: cheque,
                    banque: banque,
                    monnaieElectronique: monnaieElectronique
                },
                clientFournisseur: difference > 0.01 ? {
                    code: document.getElementById('codeClientFournisseur').value,
                    montant: difference,
                    type: montantTotal > totalPaiements ? 'CREANCE' : 'DETTE'
                } : null,
                pieceJustificative: uploadedFile ? {
                    name: uploadedFile.name,
                    size: uploadedFile.size,
                    type: uploadedFile.type
                } : null,
                validated: true,
                createdAt: new Date().toISOString()
            };
            
            operations.push(operation);
            closeModal();
            loadOperations();
            updateTotals();
            updateCharts();
            
            const message = `✅ ${operation.type === 'RECETTE' ? 'Recette' : 'Dépense'} de ${formatMontant(operation.montantTotal)} enregistrée avec succès !`;
            showNotification(message, 'success');
        });

        // Afficher notification
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transform transition-all duration-300 translate-x-full`;
            
            switch(type) {
                case 'success': notification.classList.add('bg-green-500'); break;
                case 'error': notification.classList.add('bg-red-500'); break;
                case 'warning': notification.classList.add('bg-yellow-500'); break;
                default: notification.classList.add('bg-blue-500');
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.classList.remove('translate-x-full'), 100);
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Charger les opérations dans le tableau
        function loadOperations() {
            const tbody = document.getElementById('operationsTableBody');
            const today = new Date().toISOString().split('T')[0];
            const operationsToday = operations.filter(op => op.date === today)
                .sort((a, b) => new Date(`${b.date} ${b.heure}`) - new Date(`${a.date} ${a.heure}`));
            
            if (operationsToday.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            <i class="fas fa-clipboard-list text-3xl mb-2"></i>
                            <div>Aucune opération pour aujourd'hui</div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = operationsToday.map(op => `
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
                            ${getMoyensPaiementDisplay(op)}
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex space-x-2">
                            <button onclick="viewOperation(${op.id})" class="text-blue-600 hover:text-blue-800" title="Voir détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${op.pieceJustificative ? `
                                <button onclick="downloadPiece(${op.id})" class="text-purple-600 hover:text-purple-800" title="Télécharger pièce">
                                    <i class="fas fa-download"></i>
                                </button>
                            ` : ''}
                            ${op.clientFournisseur ? `
                                <button onclick="viewClientFournisseur(${op.id})" class="text-orange-600 hover:text-orange-800" title="Voir compte">
                                    <i class="fas fa-user-tie"></i>
                                </button>
                            ` : ''}
                            <button onclick="deleteOperation(${op.id})" class="text-red-600 hover:text-red-800" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Afficher moyens de paiement
        function getMoyensPaiementDisplay(op) {
            const moyens = [];
            if (op.moyensPaiement.especes > 0) moyens.push(`💰 ${formatMontant(op.moyensPaiement.especes)}`);
            if (op.moyensPaiement.cheque > 0) moyens.push(`📄 ${formatMontant(op.moyensPaiement.cheque)}`);
            if (op.moyensPaiement.banque > 0) moyens.push(`🏦 ${formatMontant(op.moyensPaiement.banque)}`);
            if (op.moyensPaiement.monnaieElectronique > 0) moyens.push(`📱 ${formatMontant(op.moyensPaiement.monnaieElectronique)}`);
            if (op.clientFournisseur) {
                const icon = op.clientFournisseur.type === 'CREANCE' ? '👤➡️' : '👤⬅️';
                moyens.push(`${icon} ${formatMontant(op.clientFournisseur.montant)}`);
            }
            return moyens.join('<br>') || '-';
        }

        // Voir détails opération
        function viewOperation(id) {
            const op = operations.find(o => o.id === id);
            if (!op) return;
            
            let details = `
                📊 DÉTAILS DE L'OPÉRATION
                
                Type: ${op.type}
                Date: ${new Date(op.date).toLocaleDateString('fr-FR')}
                Heure: ${op.heure}
                Description: ${op.description}
                ${op.type === 'RECETTE' ? 'Client' : 'Fournisseur'}: ${op.client || 'Non renseigné'}
                Montant Total: ${formatMontant(op.montantTotal)}
                
                💳 MOYENS DE PAIEMENT:
                💰 Espèces: ${formatMontant(op.moyensPaiement.especes)}
                📄 Chèques: ${formatMontant(op.moyensPaiement.cheque)}
                🏦 Banque: ${formatMontant(op.moyensPaiement.banque)}
                📱 Mobile Money: ${formatMontant(op.moyensPaiement.monnaieElectronique)}
            `;
            
            if (op.clientFournisseur) {
                details += `\n\n👥 CLIENT/FOURNISSEUR:\nCode: ${op.clientFournisseur.code}\nType: ${op.clientFournisseur.type}\nMontant: ${formatMontant(op.clientFournisseur.montant)}`;
            }
            
            if (op.pieceJustificative) {
                details += `\n\n📎 PIÈCE JUSTIFICATIVE:\nFichier: ${op.pieceJustificative.name}\nTaille: ${(op.pieceJustificative.size/1024/1024).toFixed(2)} MB`;
            }
            
            alert(details);
        }

        // Télécharger pièce justificative (simulation)
        function downloadPiece(id) {
            const op = operations.find(o => o.id === id);
            if (op && op.pieceJustificative) {
                showNotification(`📎 Téléchargement de ${op.pieceJustificative.name} simulé`, 'success');
            }
        }

        // Voir détails compte client/fournisseur
        function viewClientFournisseur(id) {
            const op = operations.find(o => o.id === id);
            if (op && op.clientFournisseur) {
                const cf = op.clientFournisseur;
                const details = `
                    👥 COMPTE CLIENT/FOURNISSEUR
                    
                    Code: ${cf.code}
                    Type: ${cf.type === 'CREANCE' ? 'CRÉANCE (Client nous doit)' : 'DETTE (Nous devons au fournisseur)'}
                    Montant: ${formatMontant(cf.montant)}
                    Opération liée: ${op.description}
                    Date: ${new Date(op.date).toLocaleDateString('fr-FR')}
                `;
                alert(details);
            }
        }

        // Supprimer opération
        function deleteOperation(id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
                operations = operations.filter(op => op.id !== id);
                loadOperations();
                updateTotals();
                updateCharts();
                showNotification('✅ Opération supprimée', 'success');
            }
        }

        // Mettre à jour les totaux
        function updateTotals() {
            const today = new Date().toISOString().split('T')[0];
            const operationsToday = operations.filter(op => op.date === today && op.validated);
            
            const totalRecettes = operationsToday
                .filter(op => op.type === 'RECETTE')
                .reduce((sum, op) => sum + op.montantTotal, 0);
                
            const totalDepenses = operationsToday
                .filter(op => op.type === 'DEPENSE')
                .reduce((sum, op) => sum + op.montantTotal, 0);
                
            const soldeDebut = 450000; // Solde fixe de début
            const soldeActuel = soldeDebut + totalRecettes - totalDepenses;
            
            document.getElementById('totalRecettes').textContent = formatMontant(totalRecettes);
            document.getElementById('totalDepenses').textContent = formatMontant(totalDepenses);
            document.getElementById('soldeActuel').textContent = formatMontant(soldeActuel);
        }

        // Initialiser les graphiques
        function initCharts() {
            // Graphique d'évolution
            const ctxEvolution = document.getElementById('evolutionChart').getContext('2d');
            const dates = [];
            const soldes = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dates.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
                
                // Calcul simulé du solde pour chaque jour
                const baseBalance = 450000;
                const randomVariation = Math.random() * 100000 - 50000;
                soldes.push(baseBalance + randomVariation);
            }
            
            window.evolutionChart = new Chart(ctxEvolution, {
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
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return formatMontant(value);
                                }
                            }
                        }
                    }
                }
            });
            
            // Graphique moyens de paiement
            const ctxPaiement = document.getElementById('paiementChart').getContext('2d');
            window.paiementChart = new Chart(ctxPaiement, {
                type: 'doughnut',
                data: {
                    labels: ['💰 Espèces', '📄 Chèques', '🏦 Banque', '📱 Mobile Money'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // Mettre à jour les graphiques
        function updateCharts() {
            const today = new Date().toISOString().split('T')[0];
            const operationsToday = operations.filter(op => op.date === today && op.validated);
            
            let totalEspeces = 0, totalCheques = 0, totalBanque = 0, totalMobile = 0;
            
            operationsToday.forEach(op => {
                totalEspeces += op.moyensPaiement.especes;
                totalCheques += op.moyensPaiement.cheque;
                totalBanque += op.moyensPaiement.banque;
                totalMobile += op.moyensPaiement.monnaieElectronique;
            });
            
            if (window.paiementChart) {
                window.paiementChart.data.datasets[0].data = [totalEspeces, totalCheques, totalBanque, totalMobile];
                window.paiementChart.update();
            }
        }

        // Générer rapport journalier
        function genererRapport() {
            const today = new Date().toLocaleDateString('fr-FR');
            const operationsToday = operations.filter(op => op.date === new Date().toISOString().split('T')[0]);
            
            let rapport = `
                📊 RAPPORT JOURNALIER DE CAISSE
                Date: ${today}
                
                💰 RÉSUMÉ:
                Solde début: 450,000 FCFA
                Total recettes: ${document.getElementById('totalRecettes').textContent}
                Total dépenses: ${document.getElementById('totalDepenses').textContent}
                Solde actuel: ${document.getElementById('soldeActuel').textContent}
                
                📋 OPÉRATIONS (${operationsToday.length}):
            `;
            
            operationsToday.forEach(op => {
                rapport += `\n${op.heure} - ${op.type} - ${op.description} - ${formatMontant(op.montantTotal)}`;
                if (op.clientFournisseur) {
                    rapport += ` (${op.clientFournisseur.code}: ${formatMontant(op.clientFournisseur.montant)})`;
                }
            });
            
            // Ouvrir dans nouvelle fenêtre pour impression
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`<pre style="font-family: monospace; padding: 20px;">${rapport}</pre>`);
            newWindow.print();
        }

        // Export CSV
        function exportCSV() {
            const headers = ['Date', 'Heure', 'Type', 'Description', 'Client/Fournisseur', 'Montant', 'Espèces', 'Chèques', 'Banque', 'Mobile Money', 'Code CF', 'Montant CF'];
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
                op.clientFournisseur ? op.clientFournisseur.code : '',
                op.clientFournisseur ? op.clientFournisseur.montant : ''
            ]);
            
            const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `caisse-operations-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            URL.revokeObjectURL(url);
            showNotification('✅ Export CSV réalisé avec succès', 'success');
        }

        // Export toutes les pièces justificatives
        function exportPiecesJustificatives() {
            const operationsAvecPieces = operations.filter(op => op.pieceJustificative);
            
            if (operationsAvecPieces.length === 0) {
                showNotification('ℹ️ Aucune pièce justificative à exporter', 'info');
                return;
            }
            
            // Simulation de l'export - dans un vrai système, on créerait un ZIP
            let rapport = `📎 EXPORT DES PIÈCES JUSTIFICATIVES\nDate: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
            
            operationsAvecPieces.forEach(op => {
                rapport += `${op.date} ${op.heure} - ${op.type} - ${op.description}\n`;
                rapport += `  Fichier: ${op.pieceJustificative.name} (${(op.pieceJustificative.size/1024/1024).toFixed(2)} MB)\n\n`;
            });
            
            const blob = new Blob([rapport], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `pieces-justificatives-index-${new Date().toISOString().split('T')[0]}.txt`;
            link.click();
            
            URL.revokeObjectURL(url);
            showNotification(`✅ Index de ${operationsAvecPieces.length} pièces exporté`, 'success');
        }

        // Fermer modal en cliquant à l'extérieur
        document.getElementById('operationModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // =============================================================================
        // FONCTION PRINCIPALE : LOADCAISSE - INITIALISATION DU MODULE DE CAISSE
        // =============================================================================
        
        function loadCaisse() {
            console.log('🔧 Initialisation du module de caisse...');
            
            try {
                // 1. Vérifier la disponibilité des données
                if (typeof app === 'undefined') {
                    console.warn('⚠️ Variable app non définie, initialisation avec données par défaut');
                    window.app = window.app || {
                        currentUser: { id: 1, name: 'Utilisateur', role: 'Caissier' },
                        currentProfile: 'caissier',
                        operations: []
                    };
                }
                
                // 2. Initialiser les variables globales de caisse si nécessaire
                if (!window.operations) {
                    window.operations = [];
                }
                
                // 3. Configurer la date par défaut
                const today = new Date().toISOString().split('T')[0];
                const timeNow = new Date().toTimeString().slice(0,5);
                
                // 4. Charger les données existantes de la caisse
                loadExistingCaisseData();
                
                // 5. Charger et afficher les opérations
                loadOperations();
                
                // 6. Mettre à jour les totaux et indicateurs
                updateTotals();
                
                // 7. Initialiser les graphiques
                initCharts();
                
                // 8. Configurer les event listeners spécifiques à la caisse
                setupCaisseEventListeners();
                
                // 9. Afficher le statut de la caisse
                displayCaisseStatus();
                
                console.log('✅ Module de caisse initialisé avec succès');
                showNotification('✅ Caisse chargée et prête à l\'utilisation', 'success');
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement de la caisse:', error);
                showNotification('❌ Erreur lors du chargement de la caisse', 'error');
            }
        }
        
        // Fonction pour charger les données existantes de la caisse
        function loadExistingCaisseData() {
            try {
                // Charger les opérations depuis localStorage si disponible
                const savedOperations = localStorage.getItem('caisseOperations');
                if (savedOperations) {
                    const parsedOperations = JSON.parse(savedOperations);
                    operations.push(...parsedOperations);
                    console.log(`📊 ${parsedOperations.length} opérations chargées depuis le stockage local`);
                }
                
                // Charger les paramètres de caisse
                const savedSettings = localStorage.getItem('caisseSettings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    // Appliquer les paramètres sauvegardés
                    if (settings.soldeDebut) {
                        document.getElementById('soldeDebut').textContent = formatMontant(settings.soldeDebut);
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ Impossible de charger les données existantes:', error);
            }
        }
        
        // Configuration des event listeners spécifiques à la caisse
        function setupCaisseEventListeners() {
            // Sauvegarder automatiquement les opérations
            window.addEventListener('beforeunload', function() {
                try {
                    localStorage.setItem('caisseOperations', JSON.stringify(operations));
                    localStorage.setItem('caisseSettings', JSON.stringify({
                        soldeDebut: 450000, // Valeur par défaut
                        lastUpdate: new Date().toISOString()
                    }));
                } catch (error) {
                    console.warn('⚠️ Impossible de sauvegarder les données:', error);
                }
            });
            
            // Raccourcis clavier pour la caisse
            document.addEventListener('keydown', function(e) {
                // Ctrl + R : Nouvelle recette
                if (e.ctrlKey && e.key === 'r') {
                    e.preventDefault();
                    openOperationModal('recette');
                }
                
                // Ctrl + D : Nouvelle dépense  
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    openOperationModal('depense');
                }
                
                // Ctrl + E : Export
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    exportCSV();
                }
                
                // Échap : Fermer modal
                if (e.key === 'Escape') {
                    closeModal();
                }
            });
            
            console.log('⌨️ Raccourcis clavier configurés (Ctrl+R: Recette, Ctrl+D: Dépense, Ctrl+E: Export)');
        }
        
        // Afficher le statut de la caisse
        function displayCaisseStatus() {
            const now = new Date();
            const statusMessage = `
                📅 Caisse ouverte le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}
                👤 Utilisateur: ${app.currentUser ? app.currentUser.name : 'Non défini'}
                🏪 Profil: ${app.currentProfile || 'Non défini'}
            `;
            
            console.log(statusMessage);
            
            // Mettre à jour le titre de la page si possible
            if (document.title.indexOf('Caisse') === -1) {
                document.title = `Gestion de Caisse - ${app.currentUser ? app.currentUser.name : 'Utilisateur'}`;
            }
        }
        
        // Fonction utilitaire pour le formatage des notifications de caisse
        function showCaisseNotification(message, type = 'info') {
            const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
            showNotification(`${prefix} [CAISSE] ${message}`, type);
        }
        
        // Fonction pour rafraîchir complètement la caisse
        function refreshCaisse() {
            console.log('🔄 Rafraîchissement de la caisse...');
            loadOperations();
            updateTotals();
            updateCharts();
            showCaisseNotification('Caisse rafraîchie', 'success');
        }
        
        // Exposer la fonction loadCaisse globalement
        window.loadCaisse = loadCaisse;
        window.refreshCaisse = refreshCaisse;

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            // Appeler la nouvelle fonction loadCaisse au lieu de l'ancienne logique
            loadCaisse();
        });
    </script>
</body>
</html>
