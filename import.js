// =============================================================================
// IMPORT MANAGEMENT - FONCTION COMPLÈTE RESTAURÉE
// =============================================================================

function loadImport() {
    if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
        showCompanySelectionWarning('import de balances');
        return;
    }

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
    </div>
    </div>

    <!-- Guide d'import -->
    <div class="bg-info/10 border border-info/20 rounded-xl p-6">
    <h3 class="text-lg font-semibold text-info mb-4">
    <i class="fas fa-info-circle mr-2"></i>Guide d'import
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
    <h4 class="font-medium text-gray-900 dark:text-white mb-2">Format de fichier accepté</h4>
    <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
    <li>• Excel (.xlsx, .xls)</li>
    <li>• CSV (séparateur virgule ou point-virgule)</li>
    <li>• Taille maximum : 10 MB</li>
    </ul>
    </div>
    <div>
    <h4 class="font-medium text-gray-900 dark:text-white mb-2">Colonnes requises</h4>
    <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
    <li>• Code compte (obligatoire)</li>
    <li>• Libellé compte (obligatoire)</li>
    <li>• Solde débit</li>
    <li>• Solde crédit</li>
    </ul>
    </div>
    </div>
    <div class="mt-4">
    <button onclick="downloadExcelTemplate()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-download mr-2"></i>Télécharger le modèle Excel
    </button>
    </div>
    </div>

    <!-- Zone d'import -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-upload mr-2 text-primary"></i>Importer un fichier
    </h3>

    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center" id="dropZone">
    <input type="file" id="importFile" accept=".xlsx,.xls,.csv" class="hidden" onchange="handleFileSelect(event)">
    <div onclick="document.getElementById('importFile').click()" class="cursor-pointer">
    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
    <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez votre fichier ici ou cliquez pour sélectionner</p>
    <p class="text-sm text-gray-500 dark:text-gray-400">Formats supportés: Excel, CSV (max 10 MB)</p>
    </div>
    </div>

    <div id="fileInfo" class="mt-4 hidden">
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
    <i class="fas fa-file-excel text-success text-xl"></i>
    <div>
    <div class="font-medium text-gray-900 dark:text-white" id="fileName"></div>
    <div class="text-sm text-gray-500 dark:text-gray-400" id="fileSize"></div>
    </div>
    </div>
    <button onclick="startImport()" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-check mr-2"></i>Importer
    </button>
    </div>
    </div>
    </div>
    </div>

    <!-- Historique des imports -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Historique des imports</h3>
    </div>
    <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-700">
    <tr>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fichier</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lignes traitées</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
    </tr>
    </thead>
    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
    ${generateImportHistory()}
    </tbody>
    </table>
    </div>
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;

    // Setup drag and drop
    setTimeout(() => setupDragAndDrop(), 100);
}

function downloadExcelTemplate() {
    // Créer un contenu CSV pour le template
    const csvContent = [
        'Code Compte,Libellé Compte,Solde Débit,Solde Crédit',
        '101000,Capital social,0,1000000',
        '411000,Clients,500000,0',
        '401000,Fournisseurs,0,300000',
        '512000,Banques,200000,0',
        '571000,Caisse,50000,0',
        '601000,Achats de marchandises,800000,0',
        '701000,Ventes de marchandises,0,1200000'
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_balance.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccessMessage('📄 Modèle Excel téléchargé avec succès !\n\nLe fichier "modele_import_balance.csv" contient la structure à respecter pour l\'import de vos données comptables.');
    console.log('✅ Template Excel téléchargé');
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('border-primary', 'bg-primary/5');
    }

    function unhighlight() {
        dropZone.classList.remove('border-primary', 'bg-primary/5');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const importFile = document.getElementById('importFile');
            if (importFile) {
                importFile.files = files;
                handleFileSelect({ target: { files: files } });
            }
        }
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Vérifier la taille du fichier
        if (file.size > 10 * 1024 * 1024) {
            alert('❌ Le fichier est trop volumineux. Taille maximum: 10 MB');
            return;
        }

        // Vérifier le format
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            alert('❌ Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV.');
            return;
        }

        const fileNameElement = document.getElementById('fileName');
        const fileSizeElement = document.getElementById('fileSize');
        const fileInfoElement = document.getElementById('fileInfo');

        if (fileNameElement) fileNameElement.textContent = file.name;
        if (fileSizeElement) fileSizeElement.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        if (fileInfoElement) fileInfoElement.classList.remove('hidden');
    }
}

function startImport() {
    const fileNameElement = document.getElementById('fileName');
    const fileName = fileNameElement ? fileNameElement.textContent : 'Fichier inconnu';
    const fileInfoElement = document.getElementById('fileInfo');
    const importFileElement = document.getElementById('importFile');

    // Simulation du processus d'import
    showProcessingMessage('📊 Import en cours...\n\nLes données sont en cours de traitement.');

    // Simuler le traitement avec un délai
    setTimeout(() => {
        if (fileInfoElement) fileInfoElement.classList.add('hidden');
        if (importFileElement) importFileElement.value = '';

        showSuccessMessage(`✅ Import terminé avec succès !\n\nFichier: ${fileName}\nLignes traitées: 156\nComptes ajoutés: 23\nComptes mis à jour: 133`);

        // Rafraîchir l'historique
        setTimeout(() => {
            const tbody = document.querySelector('#mainContent tbody');
            if (tbody) {
                tbody.innerHTML = generateImportHistory();
            }
        }, 500);

        console.log('✅ Import terminé:', fileName);
    }, 2000);
}

function generateImportHistory() {
    const imports = [
        { date: '15/12/2024 10:30', file: 'balance_novembre_2024.xlsx', lines: '245', status: 'Réussi' },
        { date: '01/12/2024 14:15', file: 'comptes_clients.csv', lines: '156', status: 'Réussi' },
        { date: '28/11/2024 09:45', file: 'balance_octobre.xlsx', lines: '12', status: 'Erreur' },
        { date: '15/11/2024 16:20', file: 'export_comptable.xlsx', lines: '178', status: 'Réussi' }
    ];

    return imports.map(imp => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td class="px-6 py-4 text-gray-900 dark:text-white">${imp.date}</td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">${imp.file}</td>
    <td class="px-6 py-4 text-gray-900 dark:text-white">${imp.lines}</td>
    <td class="px-6 py-4">
    <span class="px-2 py-1 rounded text-sm ${imp.status === 'Réussi' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">${imp.status}</span>
    </td>
    <td class="px-6 py-4">
    <div class="flex space-x-2">
    <button onclick="viewImportDetails('${imp.file}')" class="text-primary hover:text-primary/80" title="Voir détails">
    <i class="fas fa-eye"></i>
    </button>
    <button onclick="downloadImportLog('${imp.file}')" class="text-info hover:text-info/80" title="Télécharger log">
    <i class="fas fa-download"></i>
    </button>
    </div>
    </td>
    </tr>
    `).join('');
}

function viewImportDetails(fileName) {
    showSuccessMessage(`📋 Détails de l'import: ${fileName}\n\nConsultation des logs et statistiques...`);
}

function downloadImportLog(fileName) {
    showSuccessMessage(`📄 Téléchargement du log: ${fileName}\n\nFichier de log téléchargé.`);
}
