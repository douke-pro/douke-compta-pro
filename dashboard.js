// =============================================================================
// DASHBOARD.JS - Gestion des tableaux de bord
// =============================================================================

function loadDashboard() {
    if (app.currentProfile === 'admin') {
        loadAdminDashboard();
    } else {
        loadStandardDashboard();
    }
}

function loadAdminDashboard() {
    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
    <div class="text-sm text-primary-light font-medium">
    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
    </div>
    </div>

    <!-- KPI Cards Admin -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.companies.filter(c => c.status === 'Actif').length}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas fa-building text-primary text-xl"></i>
    </div>
    </div>
    <div class="mt-2 flex items-center text-sm">
    <span class="text-success">+2</span>
    <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-users text-info text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries.filter(e => e.status === 'En attente').length}</p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Validées</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries.filter(e => e.status === 'Validé').length}</p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-check text-success text-xl"></i>
    </div>
    </div>
    </div>
    </div>

    <!-- Portefeuille Collaborateurs -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille des Collaborateurs
    </h3>
    <div class="space-y-4">
    ${generateCollaboratorPortfolio()}
    </div>
    </div>

    <!-- Charts Admin -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution du Portefeuille</h3>
    <div class="h-64 flex items-center justify-center">
    <canvas id="portfolioChart" width="400" height="200"></canvas>
    </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance par Secteur</h3>
    <div class="h-64 flex items-center justify-center">
    <canvas id="sectorChart" width="400" height="200"></canvas>
    </div>
    </div>
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    
    setTimeout(() => {
        try {
            initializeAdminCharts();
        } catch (error) {
            console.error('Erreur chargement graphiques admin:', error);
        }
    }, 200);
}

function loadStandardDashboard() {
    const userCompany = app.companies.find(c => c.id == app.currentCompany);
    let cashCount = userCompany ? userCompany.cashRegisters : 1;
    let dashboardTitle = 'Tableau de Bord';

    if (app.currentProfile === 'user') {
        dashboardTitle = 'Mon Entreprise';
    } else if (app.currentProfile === 'caissier') {
        dashboardTitle = 'Ma Caisse';
        cashCount = '→';
    }

    const content = `
    <div class="space-y-6">
    <div class="flex justify-between items-center">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
    <div class="text-sm text-primary-light font-medium">
    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
    </div>
    </div>

    <!-- KPI Cards Standard -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
    ${app.currentProfile === 'user' ? 'Caisses disponibles' :
      app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}
    </p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">${cashCount}</p>
    </div>
    <div class="bg-primary/10 p-3 rounded-lg">
    <i class="fas ${app.currentProfile === 'caissier' ? 'fa-plus-circle' :
                    app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>
    </div>
    </div>
    ${app.currentProfile === 'caissier' ? `
    <div class="mt-3">
    <button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
    Nouvelle opération
    </button>
    </div>
    ` : ''}
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures ce mois</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${app.currentProfile === 'caissier' ? '45' : app.entries.length}
    </p>
    </div>
    <div class="bg-success/10 p-3 rounded-lg">
    <i class="fas fa-edit text-success text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente validation</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">
    ${app.entries.filter(e => e.status === 'En attente').length}
    </p>
    </div>
    <div class="bg-warning/10 p-3 rounded-lg">
    <i class="fas fa-clock text-warning text-xl"></i>
    </div>
    </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
    <p class="text-3xl font-bold text-gray-900 dark:text-white">98%</p>
    </div>
    <div class="bg-info/10 p-3 rounded-lg">
    <i class="fas fa-chart-line text-info text-xl"></i>
    </div>
    </div>
    </div>
    </div>

    <!-- Charts Standard -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution Mensuelle</h3>
    <div class="h-64 flex items-center justify-center">
    <canvas id="monthlyChart" width="400" height="200"></canvas>
    </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par Journal</h3>
    <div class="h-64 flex items-center justify-center">
    <canvas id="journalChart" width="400" height="200"></canvas>
    </div>
    </div>
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    
    setTimeout(() => {
        try {
            initializeStandardCharts();
        } catch (error) {
            console.error('Erreur chargement graphiques standard:', error);
        }
    }, 200);
}

function generateCollaboratorPortfolio() {
    const collaborators = app.users.filter(u => u.profile.includes('collaborateur'));

    if (collaborators.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun collaborateur trouvé</div>';
    }

    return collaborators.map(collab => `
    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
    <div class="flex items-center space-x-4">
    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
    ${collab.name.split(' ').map(n => n[0]).join('')}
    </div>
    <div>
    <div class="font-medium text-gray-900 dark:text-white">${collab.name}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">${collab.role}</div>
    </div>
    </div>
    <div class="text-right">
    <div class="text-lg font-bold text-gray-900 dark:text-white">${collab.companies?.length || 0}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400">entreprises</div>
    <div class="flex items-center space-x-2 mt-1">
    <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
    <div class="h-full bg-success" style="width: 95%"></div>
    </div>
    <span class="text-xs font-medium text-success">95%</span>
    </div>
    </div>
    </div>
    `).join('');
}

function initializeAdminCharts() {
    try {
        // Portfolio Chart
        const portfolioCtx = document.getElementById('portfolioChart');
        if (portfolioCtx) {
            new Chart(portfolioCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Entreprises Actives',
                        data: [18, 20, 22, 21, 23, app.companies.filter(c => c.status === 'Actif').length],
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true } },
                    animation: { duration: 800 }
                }
            });
        }

        // Sector Chart
        setTimeout(() => {
            const sectorCtx = document.getElementById('sectorChart');
            if (sectorCtx) {
                new Chart(sectorCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Commerce', 'Services', 'Industries', 'Agriculture'],
                        datasets: [{
                            label: 'Performance (%)',
                            data: [92, 88, 95, 85],
                            backgroundColor: ['#5D5CDE', '#3B82F6', '#0284C7', '#059669']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        animation: { duration: 600 }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('Erreur initialisation graphiques admin:', error);
    }
}

function initializeStandardCharts() {
    try {
        // Monthly Chart
        const monthlyCtx = document.getElementById('monthlyChart');
        if (monthlyCtx) {
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Écritures',
                        data: [120, 190, 300, 500, 200, app.entries.length * 10],
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 800 }
                }
            });
        }

        // Journal Chart
        setTimeout(() => {
            const journalCtx = document.getElementById('journalChart');
            if (journalCtx) {
                const journalData = {
                    'JG': app.entries.filter(e => e.journal === 'JG').length,
                    'JA': app.entries.filter(e => e.journal === 'JA').length,
                    'JV': app.entries.filter(e => e.journal === 'JV').length,
                    'JB': app.entries.filter(e => e.journal === 'JB').length,
                    'JC': app.entries.filter(e => e.journal === 'JC').length,
                    'JOD': app.entries.filter(e => e.journal === 'JOD').length
                };

                new Chart(journalCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['JG', 'JA', 'JV', 'JB', 'JC', 'JOD'],
                        datasets: [{
                            data: Object.values(journalData),
                            backgroundColor: ['#5D5CDE', '#3B82F6', '#0284C7', '#059669', '#D97706', '#DC2626']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: { duration: 600 }
                    }
                });
            }
        }, 300);
    } catch (error) {
        console.error('Erreur initialisation graphiques standard:', error);
    }
}

// Fonctions de gestion (pour admin uniquement)
function loadUsersManagement() {
    if (app.currentProfile !== 'admin') {
        showAccessDenied();
        return;
    }
    showSuccessMessage('Gestion des utilisateurs - Fonctionnalité en cours de développement.');
}

function loadCompanies() {
    showSuccessMessage('Gestion des entreprises - Fonctionnalité en cours de développement.');
}
