// =================================================================================
// FICHIER : assets/script.js
// Description : Gère la connexion, la navigation par rôle et le rendu des dashboards.
// CORRECTION CRITIQUE : Distinction entre Dashboard (toujours accessible) et Opérations (nécessitent un contexte d'entreprise).
// =================================================================================

const API_BASE_URL = 'https://douke-compta-pro.onrender.com/api'; 
window.userContext = null; 

// Vues qui nécessitent OBLIGATOIREMENT la sélection d'une entreprise pour les rôles multi-entreprises
const OPERATIONAL_VIEWS = ['saisie', 'validation', 'generate-etats', 'reports'];

// =================================================================================
// SIMULATION DE DONNÉES (À remplacer par des appels API fetch() réels)
// =================================================================================

const MOCK_COMPANIES = [
    { id: "ENT_PROD_1", name: "Groupe D-Holding (Siège)", stats: { active_users: 5, transactions: 1200 } },
    { id: "ENT_PROD_2", name: "Sarl Services Plus", stats: { active_users: 2, transactions: 350 } },
    { id: "ENT_USER_3", name: "Sarl TechniCo (Monoposte)", stats: { active_users: 1, transactions: 80 } },
    { id: "ENT_PROD_4", name: "SCI Immo Alpha", stats: { active_users: 3, transactions: 600 } },
];

/**
 * 1. SIMULATION D'AUTHENTIFICATION
 */
function simulateLogin(username) {
    const defaultToken = "SIMULE_JWT_TOKEN_1234567890"; 
    let context = null;

    if (username.toLowerCase() === 'admin') {
        // ADMIN : Non lié à une seule entreprise par défaut. Contexte initial NULL.
        context = { utilisateurRole: 'ADMIN', utilisateurId: "SIMULE_ID_ADMIN", entrepriseContextId: null, entrepriseContextName: "Aucune sélectionnée", token: defaultToken };
    }
    if (username.toLowerCase() === 'collaborateur') {
        // COLLABORATEUR : Non lié à une seule entreprise par défaut. Contexte initial NULL.
        context = { utilisateurRole: 'COLLABORATEUR', utilisateurId: "COLLAB_A", entrepriseContextId: null, entrepriseContextName: "Aucune sélectionnée", token: defaultToken };
    }
    if (username.toLowerCase() === 'user') {
        // USER/CAISSIER : Rôle monoposte (lié à une seule entreprise)
        const company = MOCK_COMPANIES.find(c => c.id === "ENT_USER_3");
        context = { utilisateurRole: 'USER', utilisateurId: "USER_C", entrepriseContextId: company.id, entrepriseContextName: company.name, token: defaultToken };
    }
    if (username.toLowerCase() === 'caissier') {
        const company = MOCK_COMPANIES.find(c => c.id === "ENT_USER_3");
        context = { utilisateurRole: 'CAISSIER', utilisateurId: "CAISSE_X", entrepriseContextId: company.id, entrepriseContextName: company.name, token: defaultToken };
    }
    return context;
}

/**
 * 2. GESTION DU FLUX DE CONNEXION ET D'AFFICHAGE
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            const username = document.getElementById('username').value;
            const errorMessage = document.getElementById('auth-error-message');

            const payload = simulateLogin(username);

            if (payload) {
                window.userContext = payload;
                errorMessage.classList.add('hidden');
                
                document.getElementById('auth-view').classList.add('hidden');
                document.getElementById('dashboard-view').classList.remove('hidden');

                // 🛑 CORRECTION: Affiche le dashboard pour tous les rôles, y compris Admin/Collaborateur
                renderDashboard(window.userContext);
                
                document.getElementById('current-company-name').textContent = window.userContext.entrepriseContextName;

            } else {
                errorMessage.textContent = 'Nom d\'utilisateur ou mot de passe incorrect.';
                errorMessage.classList.remove('hidden');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            document.getElementById('auth-view').classList.remove('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('auth-error-message').classList.add('hidden');
            document.getElementById('current-company-name').textContent = 'Nom de l\'Entreprise';
            window.location.hash = ''; 
        });
    }
});

// =================================================================================
// 3. GESTION DU ROUTAGE ET DU CONTEXTE D'ENTREPRISE
// =================================================================================

/**
 * Charge une vue spécifique dans la zone de contenu du dashboard.
 * @param {string} viewName - Le nom de la vue à charger (ex: 'dashboard', 'saisie', 'user-management').
 */
function loadView(viewName) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    dashboardContentArea.innerHTML = '';
    const contextMessage = document.getElementById('context-message');
    
    const isMultiEnterpriseUser = window.userContext.utilisateurRole === 'ADMIN' || window.userContext.utilisateurRole === 'COLLABORATEUR';
    
    // 🛑 VÉRIFICATION CRITIQUE : Si rôle multi-entreprise essaie d'accéder à une vue opérationnelle sans contexte
    if (isMultiEnterpriseUser && !window.userContext.entrepriseContextId && OPERATIONAL_VIEWS.includes(viewName)) {
        alert("🚨 Opération Bloquée. Vous devez d'abord sélectionner une entreprise pour procéder à cette action (Saisie, Validation, etc.).");
        
        // Redirige vers l'affichage du sélecteur
        return renderEnterpriseSelectorView(viewName); 
    }
    
    // Logique de chargement de contenu pour les boutons de navigation
    switch (viewName) {
        case 'dashboard':
            renderDashboard(window.userContext); // Réaffiche le dashboard standard
            break;
        case 'saisie':
            dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Saisie Comptable</h3><p class="text-lg">Page de saisie des écritures pour **${window.userContext.entrepriseContextName}** (${window.userContext.entrepriseContextId}). Prête pour l'intégration API.</p>`;
            contextMessage.textContent = `Saisie des opérations pour l'exercice courant de ${window.userContext.entrepriseContextName}.`;
            break;
        case 'validation':
            dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Validation des Opérations</h3><p class="text-lg">Liste des opérations en attente de validation pour **${window.userContext.entrepriseContextName}**.</p>${generateValidationTable()}`;
            contextMessage.textContent = `Tableau des mouvements à valider pour ${window.userContext.entrepriseContextName}.`;
            break;
        case 'user-management':
            if (window.userContext.utilisateurRole === 'ADMIN') {
                dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Gestion des Utilisateurs</h3><p class="text-lg">Interface complète de gestion des rôles et des accès.</p>`;
                contextMessage.textContent = `Administration système.`;
            }
            break;
        case 'reports':
             dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Rapports Financiers</h3><p class="text-lg">Génération de la Balance, Grand Livre et autres rapports pour **${window.userContext.entrepriseContextName}**.</p>`;
             contextMessage.textContent = `Consultation des documents légaux de ${window.userContext.entrepriseContextName}.`;
             break;
        default:
            dashboardContentArea.innerHTML = `<p class="text-danger">Vue **${viewName}** non implémentée.</p>`;
            contextMessage.textContent = `Erreur de navigation.`;
    }
}


/**
 * Vue utilisée pour forcer la sélection d'entreprise lors d'une action bloquée.
 * @param {string} [blockedViewName] - Nom de la vue que l'utilisateur tentait d'atteindre.
 */
function renderEnterpriseSelectorView(blockedViewName = null) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    const role = window.userContext.utilisateurRole;
    
    // Récupérer la liste des entreprises (ici, simulation)
    const companyListHTML = MOCK_COMPANIES.map(company => {
        return `
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-[1.01] cursor-pointer" 
                 data-company-id="${company.id}" data-company-name="${company.name}">
                <h4 class="text-xl font-bold text-primary dark:text-primary-light mb-2">${company.name}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">ID: ${company.id}</p>
                <div class="mt-4 flex justify-between text-sm">
                    <span class="text-info"><i class="fas fa-users"></i> Utilisateurs actifs: ${company.stats.active_users}</span>
                    <span class="text-success"><i class="fas fa-chart-bar"></i> Transactions récentes: ${company.stats.transactions}</span>
                </div>
            </div>
        `;
    }).join('');

    dashboardContentArea.innerHTML = `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-danger mb-2">Sélectionner un Contexte d'Entreprise</h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-6 border-b pb-4">
                ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Vous ne pouvez pas accéder à la fonctionnalité "${blockedViewName.toUpperCase()}"` : 'Avant de procéder à toute opération comptable,'} en tant que **${role}**, vous devez choisir l'entreprise sur laquelle vous souhaitez travailler.
            </p>
            <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${companyListHTML}
            </div>
        </div>
    `;

    // Attacher les écouteurs d'événements après le rendu
    dashboardContentArea.querySelectorAll('[data-company-id]').forEach(element => {
        element.addEventListener('click', function() {
            const companyId = this.getAttribute('data-company-id');
            const companyName = this.getAttribute('data-company-name');
            
            // Mise à jour du contexte utilisateur global
            window.userContext.entrepriseContextId = companyId;
            window.userContext.entrepriseContextName = companyName;

            // Mise à jour de l'affichage de la barre latérale
            document.getElementById('current-company-name').textContent = companyName;
            
            // Redirection vers le dashboard standard de ce nouveau contexte
            loadView('dashboard'); 
        });
    });
    
    document.getElementById('welcome-message').textContent = `Bienvenue, ${role.charAt(0) + role.slice(1).toLowerCase()} !`;
    document.getElementById('context-message').textContent = "⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise ci-dessous pour débloquer les opérations.";
    updateNavigationMenu(role);
}


/**
 * Initialise le dashboard.
 */
function renderDashboard(context) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    const welcomeMessage = document.getElementById('welcome-message');
    const contextMessage = document.getElementById('context-message');
    const currentRole = document.getElementById('current-role');

    currentRole.textContent = context.utilisateurRole;
    welcomeMessage.textContent = `Bienvenue, ${context.utilisateurRole.charAt(0) + context.utilisateurRole.slice(1).toLowerCase()} !`;
    
    dashboardContentArea.innerHTML = '';
    
    let isMultiEnterpriseUser = context.utilisateurRole === 'ADMIN' || context.utilisateurRole === 'COLLABORATEUR';
    let contextName = context.entrepriseContextName || "Aucune sélectionnée";
    
    // Ajout d'un avertissement si le contexte n'est pas sélectionné
    if (isMultiEnterpriseUser && context.entrepriseContextId === null) {
        contextMessage.textContent = `⚠️ CONTEXTE INCOMPLET. Affichage des statistiques globales. Veuillez sélectionner une entreprise (menu ci-dessous ou barre latérale) pour effectuer des opérations comptables.`;
    } else {
        contextMessage.textContent = `Contexte de travail actuel: ${contextName}.`;
    }
    
    switch (context.utilisateurRole) {
        case 'ADMIN':
            dashboardContentArea.innerHTML = renderAdminDashboard(context);
            initializeCharts(); 
            break;
        case 'COLLABORATEUR':
            dashboardContentArea.innerHTML = renderCollaborateurDashboard(context);
            break;
        case 'USER':
            dashboardContentArea.innerHTML = renderUserDashboard(context);
            break;
        case 'CAISSIER':
            dashboardContentArea.innerHTML = renderCaissierDashboard(context);
            break;
    }
    
    // Si ADMIN ou COLLAB et AUCUNE entreprise choisie, ajouter le bouton de sélection au dashboard
    if (isMultiEnterpriseUser && context.entrepriseContextId === null) {
        dashboardContentArea.innerHTML += `
            <div class="mt-8 text-center p-6 bg-info bg-opacity-10 border-4 border-info rounded-xl shadow-lg">
                <h3 class="text-xl font-bold text-info mb-4">Choisir votre entreprise de travail</h3>
                <p class="mb-4 text-gray-700 dark:text-gray-300">Vos actions de saisie ou de validation sont bloquées tant qu'une entreprise n'est pas sélectionnée.</p>
                <button onclick="renderEnterpriseSelectorView()" class="py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-briefcase mr-2"></i> Sélectionner une Entreprise Maintenant
                </button>
            </div>
        `;
    }
    
    updateNavigationMenu(context.utilisateurRole);
}

// =================================================================================
// 4. RENDU DES DASHBOARDS SPÉCIFIQUES AUX PROFILS (Fonctions inchangées)
// =================================================================================

function renderAdminDashboard(context) { 
    // ... (Code inchangé)
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-globe', 'Total Entreprises', '12', 'bg-primary')}
            ${generateStatCard('fas fa-user-shield', 'Total Admins/Collab', '3', 'bg-secondary')}
            ${generateStatCard('fas fa-users-cog', 'Nouveaux Utilisateurs', '7', 'bg-info')}
            ${generateStatCard('fas fa-database', 'Sauvegardes Automatiques', 'OK', 'bg-success')}
        </div>
    `;

    const managementSection = `
        <div class="lg:col-span-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Actions d'Administration</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200" onclick="loadView('create-company')">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i> Créer Entreprise
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200" onclick="loadView('user-management')">
                    <i class="fas fa-user-plus fa-2x mb-2"></i> Créer Collaborateur
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-warning hover:text-white transition duration-200">
                    <i class="fas fa-lock-open fa-2x mb-2"></i> Activer/Désactiver User
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-danger hover:text-white transition duration-200">
                    <i class="fas fa-cloud-download-alt fa-2x mb-2"></i> Déclencher Sauvegarde
                </button>
            </div>
        </div>
    `;

    const collabStats = `
        <div class="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Statistiques Collab</h3>
            <p>Synthèse des entreprises gérées par collaborateur.</p>
            ${generateChartsSection()}
        </div>
    `;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">${managementSection}${collabStats}</div></div>`;
}

function renderCollaborateurDashboard(context) {
    // ... (Code inchangé)
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-briefcase', 'Entreprises Attribuées', '3', 'bg-primary')}
            ${generateStatCard('fas fa-tasks', 'Opérations à Valider', '15', 'bg-warning')}
            ${generateStatCard('fas fa-chart-line', 'Calculs Réalisés ce mois', '8', 'bg-info')}
            ${generateStatCard('fas fa-clock', 'Moyenne Validation', '4h', 'bg-success')}
        </div>
    `;

    const attributedList = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Liste de Mes Entreprises</h3>
            <p>Afficher ici les entreprises gérées avec les contacts et statistiques.</p>
        </div>
    `;
    
    const validationTable = generateValidationTable();

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${attributedList}<div class="lg:col-span-1">${validationTable}</div></div></div>`;
}
function renderUserDashboard(context) { /* ... (Code inchangé) ... */
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-hand-holding-usd', 'Résultat Net Provisoire', '1.2 M XOF', 'bg-success')}
            ${generateStatCard('fas fa-wallet', 'Caisses Créées', '3/5', 'bg-primary')}
            ${generateStatCard('fas fa-hourglass-half', 'Opérations en Attente', '2', 'bg-warning')}
            ${generateStatCard('fas fa-chart-area', 'Trésorerie Actuelle', '800 K XOF', 'bg-info')}
        </div>
    `;

    const accountingReports = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Rapports Comptables Rapides</h3>
            <div class="grid grid-cols-2 gap-4">
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Balance des Comptes</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Grand Livre</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">États de Rapprochement</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Synthèse Statistique</button>
            </div>
        </div>
    `;
    
    const requestForm = `<div class="lg:col-span-1">${renderUserRequestForm()}</div>`;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${accountingReports}${requestForm}</div></div>`;
}
function renderCaissierDashboard(context) { /* ... (Code inchangé) ... */
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${generateStatCard('fas fa-money-check-alt', 'Solde de Ma Caisse', '150 K XOF', 'bg-success')}
            ${generateStatCard('fas fa-calendar-check', 'État de la Caisse', 'OUVERTE', 'bg-info')}
            ${generateStatCard('fas fa-undo-alt', 'Mouvements en Attente', '4', 'bg-warning')}
        </div>
    `;

    const caisseActions = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Actions de Caisse</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <button class="py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"><i class="fas fa-lock-open mr-2"></i> Ouvrir/Fermer la Caisse</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('saisie')"><i class="fas fa-plus-square mr-2"></i> Enregistrer Opération</button>
            </div>
            <p class="text-gray-600 dark:text-gray-400">Toutes les opérations enregistrées nécessitent une validation par le User/Collaborateur/Admin avant intégration au Grand Livre.</p>
        </div>
    `;
    
    const caisseReports = `
        <div class="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Rapports Journaliers</h3>
            <button class="w-full py-3 bg-info text-white rounded-lg hover:bg-blue-700 mb-2" onclick="loadView('reports')"><i class="fas fa-print mr-2"></i> Éditer Rapport de Caisse</button>
            <p class="text-sm text-gray-500 dark:text-gray-400">Liste des mouvements récents et solde.</p>
        </div>
    `;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${caisseActions}${caisseReports}</div></div>`;
}
// ... (Les fonctions utilitaires comme generateStatCard, generateValidationTable, etc. restent inchangées) ...

// =================================================================================
// 5. FONCTIONS UTILITAIRES POUR LE RENDU ET L'INTERACTION API
// =================================================================================

function generateStatCard(iconClass, title, value, bgColor) { /* ... (Code inchangé) ... */
    return `
        <div class="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.03] flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">${value}</p>
            </div>
            <div class="p-3 rounded-full ${bgColor} bg-opacity-10 text-white shadow-xl">
                <i class="${iconClass} text-2xl ${bgColor.replace('bg-', 'text-')}"></i>
            </div>
        </div>
    `;
}

function generateValidationTable() { /* ... (Code inchangé) ... */
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Opérations de Caisse en Attente</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">ENT_USER_3</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Dépense Carburant</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">50,000 XOF</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button class="text-success hover:text-green-700 ml-4"><i class="fas fa-check-circle"></i> Valider</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateChartsSection() { /* ... (Code inchangé) ... */
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Évolution Annuelle</h3>
            <canvas id="mainChart"></canvas>
        </div>
    `;
}

function initializeCharts() { /* ... (Code inchangé) ... */
    setTimeout(() => {
        const ctx = document.getElementById('mainChart');
        if (ctx) {
            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{
                        label: 'Résultat Provisoire',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: '#5D5CDE', // primary
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }, 100); 
}

function renderUserRequestForm() { /* ... (Code inchangé) ... */
    return `
        <div class="max-w-xl p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold text-secondary mb-4">Demande d'États Financiers</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Ce formulaire enverra une notification au Collaborateur en charge.</p>
            
            <form id="request-form">
                <label for="periodicite" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Période souhaitée</label>
                <select id="periodicite" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="annuel">Annuel (Clôture)</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="mensuel">Mensuel</option>
                </select>
                
                <label for="commentaires" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Commentaires additionnels</label>
                <textarea id="commentaires" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
                
                <button type="submit" class="w-full mt-6 py-3 bg-secondary hover:bg-primary-dark text-white font-bold rounded-lg transition duration-300 ease-in-out">
                    <i class="fas fa-paper-plane mr-2"></i> Envoyer la Demande
                </button>
                <p id="request-status" class="text-sm mt-3 text-center"></p>
            </form>
        </div>
        <script>
            // Note: Cette logique doit être dans un script tag car elle est insérée dynamiquement.
            document.getElementById('request-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const statusElement = document.getElementById('request-status');
                statusElement.textContent = 'Envoi en cours...';
                statusElement.classList.remove('text-success', 'text-danger');

                if (!window.userContext || !window.userContext.token) {
                    statusElement.textContent = '❌ Erreur: Utilisateur non connecté ou token manquant.';
                    statusElement.classList.add('text-danger');
                    return;
                }

                try {
                    const response = await fetch(\`${API_BASE_URL}/workflow/demandeEtat\`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${window.userContext.token}\` 
                        },
                        body: JSON.stringify({ 
                            entrepriseId: window.userContext.entrepriseContextId,
                            periodicite: document.getElementById('periodicite').value,
                            commentaires: document.getElementById('commentaires').value,
                            tokenPayload: window.userContext
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        statusElement.textContent = '✅ Demande envoyée avec succès au collaborateur et à l\'admin !';
                        statusElement.classList.add('text-success');
                    } else {
                        statusElement.textContent = \`❌ Erreur (\${response.status}): \${data.error || 'Requête rejetée par l\\'API'}\`;
                        statusElement.classList.add('text-danger');
                    }
                } catch (error) {
                    console.error("Erreur d'API:", error);
                    statusElement.textContent = '❌ Erreur de connexion au serveur API. Vérifiez l\'URL.';
                    statusElement.classList.add('text-danger');
                }
            });
        </script>
    `;
}

function updateNavigationMenu(role) {
    const menu = document.getElementById('role-navigation-menu');
    menu.innerHTML = ''; 

    const baseItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' },
        { name: 'Saisie Comptable', icon: 'fas fa-edit', view: 'saisie' },
    ];
    
    if (role === 'ADMIN' || role === 'COLLABORATEUR') {
        baseItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
        baseItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
    }
    if (role === 'ADMIN') {
        baseItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }
    if (role === 'CAISSIER') {
        baseItems.push({ name: 'Rapports Caisse', icon: 'fas fa-receipt', view: 'reports' });
    }
    
    // Ajout d'une option de sélection d'entreprise explicite pour les rôles multi-entreprises
    if (role === 'ADMIN' || role === 'COLLABORATEUR') {
         baseItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-sync-alt', view: 'selector' });
    }

    baseItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary-light hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;
        
        // Attachement du gestionnaire d'événement de routage
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Traitement spécifique pour le sélecteur d'entreprise
            if (item.view === 'selector') {
                renderEnterpriseSelectorView();
            } else {
                loadView(item.view);
            }
        });
        
        menu.appendChild(link);
    });
}
