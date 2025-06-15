// =============================================================================
// REPORTS.JS - Gestion des rapports et états financiers
// =============================================================================

function loadReports() {
    if ((app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) && !app.currentCompany) {
        showCompanySelectionWarning('rapports et états financiers');
        return;
    }

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? 'État de Caisse' : 'Rapports & États Financiers'}
    </h2>
    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
    <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
    </div>
    </div>

    <!-- Sélection de période -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sélection de période</h3>
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Du</label>
    <input type="date" id="reportDateFrom" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}">
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Au</label>
    <input type="date" id="reportDateTo" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
    <select id="reportFormat" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="pdf">PDF</option>
    <option value="excel">Excel</option>
    <option value="preview">Aperçu</option>
    </select>
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal</label>
    <select id="reportJournal" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <option value="">Tous</option>
    <option value="JG">Journal Général</option>
    <option value="JA">Journal des Achats</option>
    <option value="JV">Journal des Ventes</option>
    <option value="JB">Journal de Banque</option>
    <option value="JC">Journal de Caisse</option>
    <option value="JOD">Journal des Op. Diverses</option>
    </select>
    </div>
    <div class="flex items-end">
    <button onclick="updateReportPreview()" class="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sync mr-2"></i>Actualiser
    </button>
    </div>
    </div>
    </div>

    <!-- États financiers SYSCOHADA -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Livres obligatoires -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-book mr-2 text-primary"></i>Livres Obligatoires
    </h3>
    <div class="space-y-3">
    <button onclick="previewReport('journal')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">Journal Général</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Chronologique des écritures</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-primary"></i>
    </div>
    </div>
    </button>

    <button onclick="previewReport('grandlivre')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">Grand Livre</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Par compte</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-primary"></i>
    </div>
    </div>
    </button>

    <button onclick="previewReport('balance')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">Balance Générale</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Tous les comptes</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-primary"></i>
    </div>
    </div>
    </button>
    </div>
    </div>

    <!-- États financiers -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-chart-bar mr-2 text-success"></i>États Financiers
    </h3>
    <div class="space-y-3">
    <button onclick="previewReport('bilan')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">Bilan SYSCOHADA</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Actif / Passif</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-success"></i>
    </div>
    </div>
    </button>

    <button onclick="previewReport('resultat')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">Compte de Résultat</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Charges / Produits</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-success"></i>
    </div>
    </div>
    </button>

    <button onclick="previewReport('tafire')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="flex items-center justify-between">
    <div>
    <div class="font-medium text-gray-900 dark:text-white">TAFIRE</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">Tableau de flux</div>
    </div>
    <div class="flex space-x-2">
    <i class="fas fa-eye text-info"></i>
    <i class="fas fa-download text-success"></i>
    </div>
    </div>
    </button>
    </div>
    </div>
    </div>

    ${app.currentProfile === 'caissier' ? `
    <!-- États de caisse spécifiques -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-cash-register mr-2 text-warning"></i>États de Caisse
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button onclick="generateCashReport('daily')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="text-center">
    <i class="fas fa-file-alt text-2xl text-warning mb-2"></i>
    <div class="font-medium text-gray-900 dark:text-white">État journalier</div>
    </div>
    </button>

    <button onclick="generateCashReport('weekly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="text-center">
    <i class="fas fa-calendar-week text-2xl text-info mb-2"></i>
    <div class="font-medium text-gray-900 dark:text-white">Rapport hebdomadaire</div>
    </div>
    </button>

    <button onclick="generateCashReport('monthly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    <div class="text-center">
    <i class="fas fa-calendar-alt text-2xl text-primary mb-2"></i>
    <div class="font-medium text-gray-900 dark:text-white">Rapport mensuel</div>
    </div>
    </button>
    </div>
    </div>
    ` : ''}
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function previewReport(type) {
    const reportNames = {
        'journal': 'Journal Général',
        'grandlivre': 'Grand Livre',
        'balance': 'Balance Générale',
        'bilan': 'Bilan SYSCOHADA',
        'resultat': 'Compte de Résultat',
        'tafire': 'TAFIRE'
    };

    const reportContent = generateReportPreview(type);

    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()">
    <div class="flex justify-between items-center mb-6">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
    <i class="fas fa-eye mr-2 text-info"></i>Aperçu - ${reportNames[type]}
    </h3>
    <div class="flex items-center space-x-4">
    <button onclick="downloadReport('${type}')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-download mr-2"></i>Télécharger
    </button>
    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
    <i class="fas fa-times text-xl"></i>
    </button>
    </div>
    </div>

    <div class="overflow-y-auto max-h-[calc(90vh-200px)] bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
    ${reportContent}
    </div>

    <div class="mt-6 flex justify-end space-x-4">
    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Fermer
    </button>
    <button onclick="downloadReport('${type}')" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-download mr-2"></i>Télécharger ${reportNames[type]}
    </button>
    </div>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function generateReportPreview(type) {
    const company = app.companies.find(c => c.id == app.currentCompany);
    const companyName = company ? company.name : 'Entreprise non sélectionnée';
    const dateFrom = document.getElementById('reportDateFrom')?.value || '2024-01-01';
    const dateTo = document.getElementById('reportDateTo')?.value || '2024-12-31';

    switch(type) {
        case 'journal':
            return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${companyName}</h2>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">JOURNAL GÉNÉRAL</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Période du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}</p>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">N° Pièce</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compte</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Libellé</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Débit</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédit</th>
            </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            ${app.entries.filter(e => e.companyId == app.currentCompany).map(entry =>
                entry.lines.map(line => `
                <tr>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">${entry.piece}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">${line.account}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${line.libelle}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white text-right font-mono">${line.debit ? line.debit.toLocaleString('fr-FR') + ' F' : ''}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white text-right font-mono">${line.credit ? line.credit.toLocaleString('fr-FR') + ' F' : ''}</td>
                </tr>
                `).join('')
            ).join('')}
            </tbody>
            </table>
            </div>
            `;

        case 'balance':
            return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${companyName}</h2>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">BALANCE GÉNÉRALE</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Au ${new Date(dateTo).toLocaleDateString('fr-FR')}</p>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compte</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Intitulé</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Débit</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédit</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Solde</th>
            </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            ${app.accounts.slice(0, 10).map(account => {
                const movements = app.entries.filter(e => e.companyId == app.currentCompany)
                    .flatMap(e => e.lines)
                    .filter(l => l.account === account.code);
                const totalDebit = movements.reduce((sum, m) => sum + (m.debit || 0), 0);
                const totalCredit = movements.reduce((sum, m) => sum + (m.credit || 0), 0);
                const solde = totalDebit - totalCredit;
                return `
                <tr>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white font-mono">${account.code}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">${account.name}</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white text-right font-mono">${totalDebit.toLocaleString('fr-FR')} F</td>
                <td class="px-4 py-2 text-sm text-gray-900 dark:text-white text-right font-mono">${totalCredit.toLocaleString('fr-FR')} F</td>
                <td class="px-4 py-2 text-sm font-mono text-right ${solde >= 0 ? 'text-success' : 'text-danger'}">${Math.abs(solde).toLocaleString('fr-FR')} F ${solde >= 0 ? 'D' : 'C'}</td>
                </tr>
                `;
            }).join('')}
            </tbody>
            </table>
            </div>
            `;

        case 'bilan':
            return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${companyName}</h2>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">BILAN SYSCOHADA</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Au ${new Date(dateTo).toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="grid grid-cols-2 gap-8">
            <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center bg-primary text-white p-2 rounded">ACTIF</h4>
            <table class="w-full text-sm">
            <tr class="border-b">
            <td class="py-2 font-medium">Actif immobilisé</td>
            <td class="py-2 text-right font-mono">2,500,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Stocks</td>
            <td class="py-2 text-right font-mono">1,200,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Créances</td>
            <td class="py-2 text-right font-mono">800,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Trésorerie actif</td>
            <td class="py-2 text-right font-mono">300,000 F</td>
            </tr>
            <tr class="border-t-2 border-primary">
            <td class="py-2 font-bold">TOTAL ACTIF</td>
            <td class="py-2 text-right font-mono font-bold">4,800,000 F</td>
            </tr>
            </table>
            </div>
            <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center bg-primary text-white p-2 rounded">PASSIF</h4>
            <table class="w-full text-sm">
            <tr class="border-b">
            <td class="py-2 font-medium">Capitaux propres</td>
            <td class="py-2 text-right font-mono">3,200,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Dettes financières</td>
            <td class="py-2 text-right font-mono">1,000,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Dettes fournisseurs</td>
            <td class="py-2 text-right font-mono">400,000 F</td>
            </tr>
            <tr class="border-b">
            <td class="py-2 font-medium">Autres dettes</td>
            <td class="py-2 text-right font-mono">200,000 F</td>
            </tr>
            <tr class="border-t-2 border-primary">
            <td class="py-2 font-bold">TOTAL PASSIF</td>
            <td class="py-2 text-right font-mono font-bold">4,800,000 F</td>
            </tr>
            </table>
            </div>
            </div>
            </div>
            `;

        default:
            return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
            <div class="mb-6">
            <i class="fas fa-file-alt text-6xl text-gray-400 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${type.toUpperCase()}</h3>
            <p class="text-gray-600 dark:text-gray-400">Aperçu du rapport en cours de génération...</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">
            Le rapport sera généré avec les données de la période sélectionnée.
            <br>Cliquez sur "Télécharger" pour obtenir le rapport complet.
            </p>
            </div>
            </div>
            `;
    }
}

function downloadReport(type) {
    const reportNames = {
        'journal': 'Journal Général',
        'grandlivre': 'Grand Livre',
        'balance': 'Balance Générale',
        'bilan': 'Bilan SYSCOHADA',
        'resultat': 'Compte de Résultat',
        'tafire': 'TAFIRE'
    };

    const dateFromElement = document.getElementById('reportDateFrom');
    const dateToElement = document.getElementById('reportDateTo');
    const formatElement = document.getElementById('reportFormat');

    const dateFrom = dateFromElement ? dateFromElement.value : '';
    const dateTo = dateToElement ? dateToElement.value : '';
    const format = formatElement ? formatElement.value : 'PDF';

    showSuccessMessage(`Téléchargement du rapport "${reportNames[type]}" en cours...\n\nPériode: ${dateFrom ? new Date(dateFrom).toLocaleDateString('fr-FR') : 'N/A'} - ${dateTo ? new Date(dateTo).toLocaleDateString('fr-FR') : 'N/A'}\nFormat: ${format.toUpperCase()}\nEntreprise: ${getCompanyName()}`);

    console.log('✅ Rapport téléchargé:', {
        type: reportNames[type],
        dateFrom,
        dateTo,
        format,
        company: getCompanyName()
    });
}

function updateReportPreview() {
    const dateFromElement = document.getElementById('reportDateFrom');
    const dateToElement = document.getElementById('reportDateTo');
    const formatElement = document.getElementById('reportFormat');
    const journalElement = document.getElementById('reportJournal');

    const dateFrom = dateFromElement ? dateFromElement.value : '';
    const dateTo = dateToElement ? dateToElement.value : '';
    const format = formatElement ? formatElement.value : '';
    const journal = journalElement ? journalElement.value : '';

    showSuccessMessage(`Aperçu mis à jour pour la période du ${dateFrom ? new Date(dateFrom).toLocaleDateString('fr-FR') : 'N/A'} au ${dateTo ? new Date(dateTo).toLocaleDateString('fr-FR') : 'N/A'}`);
}
