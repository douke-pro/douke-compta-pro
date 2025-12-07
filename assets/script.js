/**
 * Fichier de Script Principal - K-Compta Dashboard
 * Intègre la logique de connexion, le routage, le contexte utilisateur
 * et les rendus spécifiques aux rôles (Admin, Collaborateur, User, Caissier).
 *
 * Version: 2.3 (Intégration SYSCOHADA, Saisie Double-Entrée, Saisie Flux, Corrections d'Incohérence)
 */

// =================================================================================
// 1. CONFIGURATION ET VARIABLES GLOBALES
// =================================================================================

const API_BASE_URL = 'http://api.k-compta.mock'; // URL de base API (mockée)
window.userContext = null;

// Rôles et leurs permissions
const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 2. FONCTIONS DE CONTEXTE ET D'AUTHENTIFICATION (MOCKÉES)
// =================================================================================

/**
 * Simule la connexion utilisateur et retourne un contexte.
 * @param {string} email - L'email de l'utilisateur (utilisé comme rôle de test).
 * @returns {object|null} - Le contexte utilisateur mocké.
 */
async function authenticateUser(email) {
    // MOCK: Simule le délai API
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const userMap = {
        'admin@app.com': {
            utilisateurId: 'ADM_001',
            utilisateurNom: 'Jean Dupont (Admin)',
            utilisateurRole: ROLES.ADMIN,
            token: 'jwt.admin.token',
            entrepriseContextId: 'ENT_1', // Par défaut
            entrepriseContextName: 'Doukè Holdings', // Par défaut
            multiEntreprise: true,
        },
        'collaborateur@app.com': {
            utilisateurId: 'COL_002',
            utilisateurNom: 'Marie Leroy (Collab)',
            utilisateurRole: ROLES.COLLABORATEUR,
            token: 'jwt.collab.token',
            entrepriseContextId: 'ENT_2', // Par défaut
            entrepriseContextName: 'MonEntrepriseSarl', // Par défaut
            multiEntreprise: true,
        },
        'user@app.com': {
            utilisateurId: 'USR_003',
            utilisateurNom: 'Koffi Adama (User)',
            utilisateurRole: ROLES.USER,
            token: 'jwt.user.token',
            entrepriseContextId: 'ENT_2', // Mono-entreprise
            entrepriseContextName: 'MonEntrepriseSarl', // Nom de l'unique entreprise
            multiEntreprise: false,
        },
        'caissier@app.com': {
            utilisateurId: 'CAI_004',
            utilisateurNom: 'Fatou Diallo (Caissier)',
            utilisateurRole: ROLES.CAISSIER,
            token: 'jwt.caissier.token',
            entrepriseContextId: 'ENT_3', // Mono-entreprise / Caisse
            entrepriseContextName: 'CaisseTest', // Nom de l'unique entreprise
            multiEntreprise: false,
        },
    };

    return userMap[email] || null;
}

/**
 * Simule la récupération des entreprises accessibles à l'utilisateur.
 * @param {object} context - Le contexte utilisateur.
 * @returns {Array} - Liste mockée des entreprises avec leurs stats.
 */
async function fetchUserCompanies(context) {
    // MOCK: Simule le délai API
    await new Promise(resolve => setTimeout(resolve, 300));

    // Si mono-entreprise, retourne juste l'entreprise en cours (pour la cohérence)
    if (!context.multiEntreprise) {
        return [{
            id: context.entrepriseContextId,
            name: context.entrepriseContextName,
            stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 }
        }];
    }

    // MOCK: Liste pour Multi-Entreprise (Admin/Collaborateur)
    return [
        { id: 'ENT_1', name: 'Doukè Holdings', stats: { transactions: 150, result: 3500000, pending: 1, cash: 2500000 } },
        { id: 'ENT_2', name: 'MonEntrepriseSarl', stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 } },
        { id: 'ENT_3', name: 'CaisseTest', stats: { transactions: 20, result: 50000, pending: 0, cash: 100000 } },
    ];
}

/**
 * Change l'entreprise contextuelle pour un utilisateur multi-entreprise.
 * @param {string} newId - ID de la nouvelle entreprise.
 * @param {string} newName - Nom de la nouvelle entreprise.
 */
async function changeCompanyContext(newId, newName) {
    if (window.userContext.multiEntreprise) {
        window.userContext.entrepriseContextId = newId;
        window.userContext.entrepriseContextName = newName;
        // On recharge le dashboard pour appliquer le nouveau contexte
        await loadView('dashboard');
        updateHeaderContext(window.userContext);
    }
}

// =================================================================================
// 3. GESTION DE LA VUE ET DU CONTEXTE UTILISATEUR
// =================================================================================

/**
 * Initialise l'interface utilisateur après une connexion réussie.
 * @param {object} context - Le contexte utilisateur.
 */
function initDashboard(context) {
    window.userContext = context;
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);

    // Charge la vue par défaut (Dashboard)
    loadView('dashboard');
}

/**
 * Met à jour le header avec les informations contextuelles de l'utilisateur.
 * @param {object} context - Le contexte utilisateur.
 */
function updateHeaderContext(context) {
    document.getElementById('welcome-message').textContent = `Bonjour, ${context.utilisateurNom.split(' ')[0]}`;
    document.getElementById('user-role-display').textContent = context.utilisateurRole;
    document.getElementById('context-company-name').textContent = context.entrepriseContextName;
}

/**
 * Construit le menu de navigation en fonction du rôle.
 * @param {string} role - Le rôle de l'utilisateur.
 */
function updateNavigationMenu(role) {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = ''; // Nettoyer le menu existant

    let baseItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' },
        // La saisie simple est pour tout le monde (Caissier/User/Comptable)
        { name: 'Saisie des Flux (Simple)', icon: 'fas fa-cash-register', view: 'saisie' },
    ];

    if (role === ROLES.USER || role === ROLES.COLLABORATEUR || role === ROLES.ADMIN) {
        // Le formulaire professionnel multi-lignes pour les comptables
        baseItems.push({ name: 'Saisie d\'Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
        baseItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
        baseItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
    }

    if (role === ROLES.ADMIN) {
        baseItems.push({ name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
        baseItems.push({ name: 'Paramètres du Système', icon: 'fas fa-cogs', view: 'settings' });
    }
    
    // Création des liens
    baseItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-link block p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200';
        link.dataset.view = item.view;
        link.innerHTML = `<i class="${item.icon} mr-3"></i>${item.name}`;
        link.onclick = (e) => {
            e.preventDefault();
            loadView(item.view);
        };
        navMenu.appendChild(link);
    });

    // Option de mode clair/sombre pour le mobile
    const themeToggle = document.getElementById('toggle-theme');
    if (themeToggle) themeToggle.onclick = toggleTheme;
}

/**
 * Fonction de routage simple basée sur le nom de la vue.
 * @param {string} viewName - La vue à charger.
 */
async function loadView(viewName) {
    const dashboardContentArea = document.getElementById('dashboard-content');
    dashboardContentArea.innerHTML = '<div class="text-center p-8 text-lg text-info dark:text-primary"><i class="fas fa-spinner fa-spin mr-2"></i> Chargement...</div>';

    // Désactiver/Réactiver les liens de navigation (pour l'état actif)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-primary', 'text-white', 'font-bold', 'dark:bg-primary');
        if (link.dataset.view === viewName) {
            link.classList.add('bg-primary', 'text-white', 'font-bold', 'dark:bg-primary');
        } else {
            link.classList.add('text-gray-700', 'dark:text-gray-300');
        }
    });
    
    // Logique de rendu des vues
    switch (viewName) {
        case 'dashboard':
            dashboardContentArea.innerHTML = await renderDashboard(window.userContext);
            break;
            
        case 'saisie': // Formulaire Caissier/User (Flux Simple)
            dashboardContentArea.innerHTML = renderSaisieFormCaissier();
            if (window.userContext.entrepriseContextId) {
                document.getElementById('context-message').textContent = `Saisie simple d'une nouvelle opération pour ${window.userContext.entrepriseContextName}.`;
            } else {
                 document.getElementById('context-message').textContent = `Saisie simple d'une nouvelle opération.`;
            }
            break;
            
        case 'journal-entry': // Formulaire Comptable (Double-Entrée)
            dashboardContentArea.innerHTML = renderJournalEntryForm(); 
            document.getElementById('context-message').textContent = `Saisie d'une écriture journal à double-entrée pour ${window.userContext.entrepriseContextName}.`;
            break;
            
        case 'validation':
            dashboardContentArea.innerHTML = generateValidationTable();
            document.getElementById('context-message').textContent = `Validation des opérations en attente pour ${window.userContext.entrepriseContextName}.`;
            break;
            
        case 'reports':
            dashboardContentArea.innerHTML = renderReportsView();
            document.getElementById('context-message').textContent = `Génération des états financiers (Bilan, TCR, etc.).`;
            break;

        case 'user-management':
            if (window.userContext.utilisateurRole === ROLES.ADMIN) {
                dashboardContentArea.innerHTML = renderUserManagementView();
                document.getElementById('context-message').textContent = `Administration: Gestion des utilisateurs, des rôles et des attributions d'entreprise.`;
            } else {
                 dashboardContentArea.innerHTML = renderAccessDenied();
            }
            break;
            
        default:
            dashboardContentArea.innerHTML = renderNotFound();
    }
}

// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES (Base sur le Rôle)
// =================================================================================

/**
 * Fonction principale de rendu du dashboard basée sur le rôle.
 */
async function renderDashboard(context) {
    switch (context.utilisateurRole) {
        case ROLES.ADMIN:
        case ROLES.COLLABORATEUR:
            return renderMultiCompanyDashboard(context);
        case ROLES.USER:
            return renderUserDashboard(context);
        case ROLES.CAISSIER:
            return renderCaissierDashboard(context);
        default:
            return renderNotFound();
    }
}

/**
 * Rendu pour Admin et Collaborateur (Multi-Entreprise).
 */
async function renderMultiCompanyDashboard(context) {
    const userCompanies = await fetchUserCompanies(context);
    
    if (userCompanies.length === 0) {
        return `<div class="p-8 text-center bg-warning bg-opacity-10 border-2 border-warning rounded-xl mt-12">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i>
                    <h3 class="text-2xl font-extrabold text-warning">Alerte: Aucune Entreprise Associée</h3>
                    <p class="text-gray-700 dark:text-gray-300">Votre compte n'est associé à aucune entreprise active. Veuillez contacter l'administrateur système.</p>
                </div>`;
    }

    // Afficher le sélecteur d'entreprise si Multi-entreprise
    const companyOptions = userCompanies.map(comp => 
        `<option value="${comp.id}" data-name="${comp.name}" ${comp.id === context.entrepriseContextId ? 'selected' : ''}>${comp.name}</option>`
    ).join('');

    const currentCompany = userCompanies.find(c => c.id === context.entrepriseContextId) || userCompanies[0];
    const stats = currentCompany.stats;

    // Cartes de statistiques (avec valeurs de l'entreprise courante)
    const statCards = renderStatCards({
        transactions: stats.transactions || 0,
        result: (stats.result || 0).toLocaleString('fr-FR') + ' XOF',
        pendingOperations: stats.pending || 0,
        currentCash: (stats.cash || 0).toLocaleString('fr-FR') + ' XOF'
    });
    
    return `
        <div class="space-y-6">
            <div class="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <i class="fas fa-building fa-2x text-primary"></i>
                <div>
                    <label for="company-selector" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Entreprise Actuellement Consultée :</label>
                    <select id="company-selector" onchange="changeContextAndReload(this)" class="mt-1 block w-96 pl-3 pr-10 py-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                        ${companyOptions}
                    </select>
                </div>
            </div>
            
            ${statCards}

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderActivityFeed()}
                ${renderAccountingReports()}
            </div>
        </div>
        <script>
            function changeContextAndReload(select) {
                const selectedOption = select.options[select.selectedIndex];
                const newId = selectedOption.value;
                const newName = selectedOption.dataset.name;
                if (window.userContext.entrepriseContextId !== newId) {
                    changeCompanyContext(newId, newName);
                }
            }
        </script>
    `;
}

/**
 * Rendu pour l'utilisateur Mono-Entreprise.
 */
async function renderUserDashboard(context) {
    // Dans le cas mono-entreprise, nous nous fions à l'entreprise du contexte de connexion
    const userCompanies = await fetchUserCompanies(context) || []; 
    // Si l'API échoue ou est vide, on utilise des statistiques par défaut
    const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {};

    const transactions = companyStats.transactions || 0; 
    const provisionalResult = (companyStats.result || 1200000).toLocaleString('fr-FR') + ' XOF'; // MOCK PAR DÉFAUT
    const pendingOperations = companyStats.pending || 2; // MOCK PAR DÉFAUT
    const currentCash = (companyStats.cash || 800000).toLocaleString('fr-FR') + ' XOF'; // MOCK PAR DÉFAUT

    // L'ancienne vérification d'erreur est supprimée pour éviter l'incohérence
    
    const statCards = renderStatCards({
        transactions: transactions,
        result: provisionalResult,
        pendingOperations: pendingOperations,
        currentCash: currentCash
    });

    return `
        <div class="space-y-6">
            ${statCards}

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderActivityFeed()}
                ${renderAccountingReports()}
            </div>
        </div>
    `;
}

/**
 * Rendu pour le Caissier (Mono-Caisse/Entreprise).
 */
async function renderCaissierDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || []; 
    const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {};

    const transactions = companyStats.transactions || 0; 
    const provisionalResult = (companyStats.result || 50000).toLocaleString('fr-FR') + ' XOF'; 
    const pendingOperations = companyStats.pending || 0; 
    const currentCash = (companyStats.cash || 100000).toLocaleString('fr-FR') + ' XOF'; 

    // L'ancienne vérification d'erreur est supprimée pour éviter l'incohérence
    
    // Cartes simplifiées pour le caissier
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${renderStatCard('fas fa-wallet', 'Solde Actuel de la Caisse', currentCash, 'info')}
            ${renderStatCard('fas fa-receipt', 'Transactions du Jour', transactions, 'primary')}
            ${renderStatCard('fas fa-clock', 'Opérations en Attente', pendingOperations, 'warning')}
        </div>
    `;

    return `
        <div class="space-y-6">
            <div class="p-6 bg-secondary bg-opacity-10 border border-secondary rounded-xl text-center">
                <h3 class="text-xl font-bold text-secondary">Interface de Caisse Rapide</h3>
                <p class="text-gray-700 dark:text-gray-300">Utilisez la navigation "Saisie des Flux" pour enregistrer les entrées/sorties de caisse.</p>
            </div>
            
            ${statCards}

            <div class="grid grid-cols-1 gap-6">
                ${renderActivityFeed()}
            </div>
        </div>
    `;
}

// =================================================================================
// 5. HELPER COMPONENTS POUR LE RENDU DU DASHBOARD
// =================================================================================

/**
 * Rend une carte de statistique individuelle.
 */
function renderStatCard(icon, title, value, color) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 border-${color}">
            <i class="${icon} fa-2x text-${color}"></i>
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100">${value}</p>
            </div>
        </div>
    `;
}

/**
 * Rend l'ensemble des cartes pour les rôles complets (USER, COLLABORATEUR, ADMIN).
 */
function renderStatCards({ transactions, result, pendingOperations, currentCash }) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            ${renderStatCard('fas fa-chart-bar', 'Résultat Provisoire (Bénéfice)', result, 'success')}
            ${renderStatCard('fas fa-hand-holding-usd', 'Total Transactions', transactions, 'primary')}
            ${renderStatCard('fas fa-history', 'Opérations en Attente de Validation', pendingOperations, 'warning')}
            ${renderStatCard('fas fa-money-check-alt', 'Solde Caisse/Banque Actuel', currentCash, 'info')}
        </div>
    `;
}

/**
 * Mock du fil d'activité.
 */
function renderActivityFeed() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fil d'Activité Récent</h3>
            <ul class="space-y-3 text-sm">
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-success">[14:30]</span> Validation de la dépense CRB-005.</li>
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-primary">[10:00]</span> Connexion de l'utilisateur CAI_004 (CaisseTest).</li>
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-danger">[08:15]</span> Écriture Journal (AC) N° 001 rejetée par ADM_001.</li>
                <li class="p-2"><span class="font-bold text-info">[Hier]</span> Nouvel utilisateur (COL_002) ajouté à Doukè Holdings.</li>
            </ul>
        </div>
    `;
}

/**
 * Mock des rapports comptables.
 */
function renderAccountingReports() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports Complets (SYSCOHADA)</h3>
            <ul class="space-y-3 text-sm">
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Bilan Provisoire (N)</span>
                    <button class="text-info hover:text-primary" onclick="alert('Génération Bilan...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
                </li>
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Tableau de Formation des Résultats (TFR)</span>
                    <button class="text-info hover:text-primary" onclick="alert('Génération TFR...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
                </li>
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Grand Livre (Comptes Auxiliaires)</span>
                    <button class="text-info hover:text-primary" onclick="alert('Génération Grand Livre...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
                </li>
            </ul>
        </div>
    `;
}

/**
 * Rendu pour les vues manquantes ou non autorisées.
 */
function renderNotFound() {
    return `<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>`;
}

function renderAccessDenied() {
     return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl mt-12">
                <i class="fas fa-lock fa-3x text-danger mb-4"></i>
                <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3>
                <p class="text-gray-700 dark:text-gray-300">Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité (${window.userContext.utilisateurRole}).</p>
            </div>`;
}

function renderReportsView() {
    return `
         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center">
            <i class="fas fa-cogs fa-4x text-info mb-6"></i>
            <h2 class="text-3xl font-extrabold text-info mb-4">Génération de Rapports SYSCOHADA</h2>
            <p class="text-gray-700 dark:text-gray-300 mb-6">Cette section permettra de configurer la période comptable et de générer les états financiers officiels (Bilan, TFR, etc.). (Fonctionnalité en cours de développement).</p>
            <button onclick="loadView('dashboard')" class="py-2 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300">
                Retour au Tableau de Bord
            </button>
        </div>
    `;
}


// =================================================================================
// 6. GESTION DE L'AUTHENTIFICATION ET DU THÈME
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Gérer la soumission du formulaire de connexion
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value; // Ignoré pour le mock
        const msgElement = document.getElementById('login-message');

        msgElement.classList.remove('hidden');
        msgElement.textContent = 'Connexion en cours...';
        msgElement.classList.remove('text-danger');

        const context = await authenticateUser(email);

        if (context) {
            initDashboard(context);
        } else {
            msgElement.textContent = 'Échec de la connexion. Email/Mot de passe incorrect.';
            msgElement.classList.add('text-danger');
        }
    });

    // 2. Gérer le thème (Dark/Light Mode)
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
    document.getElementById('toggle-theme-footer').addEventListener('click', toggleTheme);
});

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function logout() {
    window.userContext = null;
    localStorage.removeItem('userContext');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
    // Réinitialiser la vue au cas où
    document.getElementById('dashboard-content').innerHTML = '';
}

// =================================================================================
// 7. FONCTIONS DE SAISIE PROFESSIONNELLE (JOURNAL ENTRY)
// =================================================================================

/**
 * Rend l'interface de saisie professionnelle à double-entrée (Multi-lignes Débit/Crédit).
 */
function renderJournalEntryForm() {
    const currentCompanyName = window.userContext.entrepriseContextName || 'N/A';
    const currentRole = window.userContext.utilisateurRole;
    
    // MOCK: Simulation des dates de l'exercice pour validation front-end
    const exerciseStart = '2025-01-01';
    const exerciseEnd = '2025-12-31';

    return `
        <div class="max-w-6xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-primary mb-2">Saisie d'Écriture de Journal (Partie Double)</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Enregistrement pour **${currentCompanyName}** (Rôle: ${currentRole}). Exercice: du ${exerciseStart} au ${exerciseEnd}.
            </p>
            
            <form id="journal-entry-form">
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mb-6 border border-primary rounded-lg">
                    <div class="md:col-span-1">
                        <label for="journal" class="block text-xs font-medium text-gray-700 dark:text-gray-300">Journal <span class="text-danger">*</span></label>
                        <select id="journal" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="AC">Journal d'Achats (AC)</option>
                            <option value="VT">Journal de Ventes (VT)</option>
                            <option value="BQ">Journal de Banque (BQ)</option>
                            <option value="OD">Opérations Diverses (OD)</option>
                        </select>
                    </div>
                    
                    <div class="md:col-span-1">
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">N° d'Opération (Auto)</label>
                        <input type="text" id="num-operation" readonly value="[Journal]/[Date]/001" class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-info font-bold bg-gray-100 dark:bg-gray-700/50">
                    </div>

                    <div class="md:col-span-1">
                        <label for="date-operation" class="block text-xs font-medium text-gray-700 dark:text-gray-300">Date de l'Opération <span class="text-danger">*</span></label>
                        <input type="date" id="date-operation" required min="${exerciseStart}" max="${exerciseEnd}" value="${new Date().toISOString().slice(0, 10)}" class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                    
                    <div class="md:col-span-1">
                        <label for="piece-ref" class="block text-xs font-medium text-gray-700 dark:text-gray-300">N° de Pièce Justificative <span class="text-danger">*</span></label>
                        <input type="text" id="piece-ref" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: FACT-4521">
                    </div>
                    
                    <div class="md:col-span-4">
                        <label for="libelle-general" class="block text-xs font-medium text-gray-700 dark:text-gray-300">Libellé Général <span class="text-danger">*</span></label>
                        <input type="text" id="libelle-general" required class="mt-1 block w-full py-2 border rounded-md shadow-sm dark:bg-gray-700 dark:text-white" placeholder="Ex: Règlement de la facture Sarl Delta">
                    </div>
                </div>

                <h3 class="text-xl font-bold text-secondary mb-4">Lignes de l'Écriture (Ventilation)</h3>
                <div class="overflow-x-auto mb-4">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">N° Compte (SYSCOHADA)</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Libellé de Ligne (Détail)</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Débit (XOF)</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Crédit (XOF)</th>
                                <th class="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody id="accounting-lines">
                            </tbody>
                        <tfoot>
                            <tr class="bg-gray-50 dark:bg-gray-700 font-bold">
                                <td colspan="2" class="px-3 py-2 text-right text-sm">TOTAL</td>
                                <td id="total-debit" class="px-3 py-2 text-right text-sm text-danger">0.00</td>
                                <td id="total-credit" class="px-3 py-2 text-right text-sm text-danger">0.00</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td colspan="5" class="px-3 py-1 text-center text-xs">
                                    <span id="balance-message" class="font-bold"></span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <button type="button" onclick="addAccountingLine()" class="py-2 px-4 bg-info hover:bg-blue-700 text-white rounded-lg transition duration-200 mb-6">
                    <i class="fas fa-plus-circle mr-2"></i> Ajouter une Ligne d'Écriture
                </button>
                
                <p id="journal-entry-message" class="mt-6 text-center text-sm hidden"></p>
                
                <button type="submit" id="submit-journal-btn" class="w-full py-3 bg-success hover:bg-green-700 text-white font-bold rounded-lg transition duration-300" disabled>
                    <i class="fas fa-save mr-2"></i> Enregistrer l'Écriture (Doit être équilibrée)
                </button>
            </form>
        </div>
        
        <script>
            let lineCounter = 0;
            const availableAccounts = [
                { id: '401', name: 'Fournisseurs' },
                { id: '521', name: 'Banque' },
                { id: '571', name: 'Caisse' },
                { id: '601', name: 'Achats de Marchandises' },
                { id: '701', name: 'Ventes de Marchandises' },
                // ... Comptes SYSCOHADA essentiels
            ];
            
            function addAccountingLine(account = '', debit = '', credit = '') {
                lineCounter++;
                const tbody = document.getElementById('accounting-lines');
                const row = document.createElement('tr');
                row.id = 'line-' + lineCounter;
                row.innerHTML = \`
                    <td class="px-3 py-2">
                        <select id="account-\${lineCounter}" required class="w-full py-1 border rounded-md dark:bg-gray-700 dark:text-white text-sm">
                            <option value="">-- Choisir Compte --</option>
                            \${availableAccounts.map(acc => \`<option value="\${acc.id}" \${acc.id === account ? 'selected' : ''}>\${acc.id} - \${acc.name}</option>\`).join('')}
                        </select>
                    </td>
                    <td class="px-3 py-2">
                        <input type="text" id="libelle-line-\${lineCounter}" class="w-full py-1 border rounded-md dark:bg-gray-700 dark:text-white text-sm" placeholder="Détail" oninput="updateGeneralLibelle(\${lineCounter})">
                    </td>
                    <td class="px-3 py-2">
                        <input type="number" step="0.01" min="0" value="\${debit}" id="debit-\${lineCounter}" class="w-full py-1 text-right border rounded-md dark:bg-gray-700 dark:text-white text-sm input-debit-credit" oninput="updateTotals()">
                    </td>
                    <td class="px-3 py-2">
                        <input type="number" step="0.01" min="0" value="\${credit}" id="credit-\${lineCounter}" class="w-full py-1 text-right border rounded-md dark:bg-gray-700 dark:text-white text-sm input-debit-credit" oninput="updateTotals()">
                    </td>
                    <td class="px-1 py-2 text-center">
                        <button type="button" onclick="removeAccountingLine('line-\${lineCounter}')" class="text-danger hover:text-red-700 text-lg"><i class="fas fa-trash-alt"></i></button>
                    </td>
                \`;
                tbody.appendChild(row);
                updateTotals(); 
            }
            
            function removeAccountingLine(rowId) {
                document.getElementById(rowId).remove();
                updateTotals(); 
            }

            function updateGeneralLibelle(lineNum) {
                 const generalLibelle = document.getElementById('libelle-general').value;
                 const lineLibelle = document.getElementById('libelle-line-' + lineNum);
                 if (!lineLibelle.value.trim() && generalLibelle) {
                     lineLibelle.value = generalLibelle;
                 }
            }
            
            function updateTotals() {
                let totalDebit = 0;
                let totalCredit = 0;
                
                document.querySelectorAll('.input-debit-credit').forEach(input => {
                    const value = parseFloat(input.value) || 0;
                    // On vérifie l'ID du parent pour savoir si c'est un Débit ou un Crédit
                    if (input.id.startsWith('debit')) {
                        totalDebit += value;
                    } else if (input.id.startsWith('credit')) {
                        totalCredit += value;
                    }
                });

                document.getElementById('total-debit').textContent = totalDebit.toFixed(2);
                document.getElementById('total-credit').textContent = totalCredit.toFixed(2);
                
                const message = document.getElementById('balance-message');
                const submitBtn = document.getElementById('submit-journal-btn');
                
                if (Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0) { // Tolérance de 0.01 pour les floats
                    message.textContent = 'ÉQUILIBRÉ ! L\'écriture est valide.';
                    message.className = 'font-bold text-success';
                    submitBtn.disabled = false;
                } else if (totalDebit === 0 && totalCredit === 0) {
                     message.textContent = 'Ajouter au moins une ligne et équilibrer les totaux.';
                     message.className = 'font-bold text-info';
                     submitBtn.disabled = true;
                } else {
                    const diff = Math.abs(totalDebit - totalCredit).toFixed(2);
                    const side = totalDebit > totalCredit ? 'Crédit' : 'Débit';
                    message.textContent = \`DÉSÉQUILIBRÉ ! Manque \${diff} XOF au \${side}.\`;
                    message.className = 'font-bold text-danger';
                    submitBtn.disabled = true;
                }
            }
            
            // Initialisation: Ajouter 2 lignes par défaut
            addAccountingLine();
            addAccountingLine();

            // Gestion de l'envoi du formulaire (simulé)
            document.getElementById('journal-entry-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('journal-entry-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = "Soumission de l'écriture en cours...";

                // MOCK: Soumission réussie
                
                msgElement.textContent = "✅ Écriture Journal Soumise avec succès pour validation !";
                msgElement.classList.add('text-success');
                // Note: En prod, on réinitialiserait ou on redirigerait
                setTimeout(() => msgElement.classList.add('hidden'), 5000);
            });
            
            // Mise à jour du numéro d'opération dynamique
             document.getElementById('journal').addEventListener('change', updateNumOperation);
             document.getElementById('date-operation').addEventListener('change', updateNumOperation);
             
             function updateNumOperation() {
                 const journalCode = document.getElementById('journal').value;
                 const dateValue = document.getElementById('date-operation').value;
                 const datePart = dateValue ? dateValue.replace(/-/g, '') : 'AAAA-MM-JJ';
                 
                 document.getElementById('num-operation').value = \`\${journalCode}/\${datePart}/001\`;
             }
             updateNumOperation();
             
        </script>
    `;
}

// =================================================================================
// 8. FONCTION DE SAISIE CAISSIER (FLUX SIMPLIFIÉ)
// =================================================================================

/**
 * Rend l'interface de saisie simplifiée par flux (Caissier/User).
 */
function renderSaisieFormCaissier() {
    const currentCompanyName = window.userContext.entrepriseContextName || 'N/A';
    const currentRole = window.userContext.utilisateurRole;

    // MOCK: Désignations (Nature de l'opération) qui impliquent une imputation comptable prédéfinie
    const designations = [
        { code: 'CRB', name: 'Carburant Véhicule (Charge)', type: 'depense' },
        { code: 'FOU', name: 'Achat Fournitures Bureau (Charge)', type: 'depense' },
        { code: 'FRA', name: 'Frais Bancaires (Charge)', type: 'depense' },
        { code: 'VTE', name: 'Vente Comptant (Produit)', type: 'recette' },
        { code: 'LCN', name: 'Loyers Encaissés (Produit)', type: 'recette' },
    ];
    
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-secondary mb-2">Saisie Simplifiée des Flux de Trésorerie</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Enregistrement en tant que **${currentRole}** pour **${currentCompanyName}**. La comptabilisation est automatique.
            </p>
            
            <form id="saisie-caissier-form">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mb-6 border border-secondary rounded-lg">
                    <div class="md:col-span-1">
                        <label for="compte-mouvement" class="block text-xs font-medium text-gray-700 dark:text-gray-300">Compte de Mouvement (Contrepartie) <span class="text-danger">*</span></label>
                        <select id="compte-mouvement" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="571">Caisse (571)</option>
                            <option value="521">Banque (521)</option>
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <label for="date-mouvement" class="block text-xs font-medium text-gray-700 dark:text-gray-300">Date du Flux <span class="text-danger">*</span></label>
                        <input type="date" id="date-mouvement" required value="${new Date().toISOString().slice(0, 10)}" class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                </div>

                <h3 class="text-xl font-bold text-primary mb-4">Détails des Flux</h3>
                <div class="overflow-x-auto mb-4">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Désignation (Nature)</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Bénéficiaire/Tiers</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Montant (XOF)</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Type</th>
                                <th class="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody id="flux-lines">
                            </tbody>
                        <tfoot>
                            <tr class="bg-gray-50 dark:bg-gray-700 font-bold">
                                <td colspan="2" class="px-3 py-2 text-right text-sm">TOTAL ENREGISTRÉ</td>
                                <td id="total-flux" class="px-3 py-2 text-right text-sm text-info">0.00</td>
                                <td colspan="2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <button type="button" onclick="addFluxLine()" class="py-2 px-4 bg-info hover:bg-blue-700 text-white rounded-lg transition duration-200 mb-6">
                    <i class="fas fa-plus-circle mr-2"></i> Ajouter un Flux
                </button>
                
                <p id="caissier-saisie-message" class="mt-6 text-center text-sm hidden"></p>
                
                <button type="submit" class="w-full py-3 bg-success hover:bg-green-700 text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-save mr-2"></i> Soumettre les Flux pour Validation
                </button>
            </form>
        </div>

        <script>
            let fluxLineCounter = 0;
            const designations = ${JSON.stringify(designations)};

            function addFluxLine(montant = '', designationCode = '', tiers = '') {
                fluxLineCounter++;
                const tbody = document.getElementById('flux-lines');
                const row = document.createElement('tr');
                row.id = 'flux-line-' + fluxLineCounter;
                row.innerHTML = \`
                    <td class="px-3 py-2">
                        <select id="designation-\${fluxLineCounter}" required class="w-full py-1 border rounded-md dark:bg-gray-700 dark:text-white text-sm" onchange="updateFluxType(\${fluxLineCounter})">
                            <option value="">-- Choisir Désignation --</option>
                            \${designations.map(d => \`<option value="\${d.code}" data-type="\${d.type}" \${d.code === designationCode ? 'selected' : ''}>\${d.name}</option>\`).join('')}
                        </select>
                    </td>
                    <td class="px-3 py-2">
                        <input type="text" id="tiers-\${fluxLineCounter}" value="\${tiers}" class="w-full py-1 border rounded-md dark:bg-gray-700 dark:text-white text-sm" placeholder="Nom du Bénéficiaire/Payeur">
                    </td>
                    <td class="px-3 py-2">
                        <input type="number" step="0.01" min="1" required value="\${montant}" id="montant-\${fluxLineCounter}" class="w-full py-1 text-right border rounded-md dark:bg-gray-700 dark:text-white text-sm input-flux-montant" oninput="updateFluxTotals()">
                    </td>
                    <td class="px-3 py-2 text-sm">
                        <span id="flux-type-display-\${fluxLineCounter}">\${designationCode ? designations.find(d => d.code === designationCode).type.charAt(0).toUpperCase() + designations.find(d => d.code === designationCode).type.slice(1) : 'Dépense'}</span>
                    </td>
                    <td class="px-1 py-2 text-center">
                        <button type="button" onclick="removeFluxLine('flux-line-\${fluxLineCounter}')" class="text-danger hover:text-red-700 text-lg"><i class="fas fa-trash-alt"></i></button>
                    </td>
                \`;
                tbody.appendChild(row);
                updateFluxTotals();
                if(designationCode) updateFluxType(fluxLineCounter); // Initialiser la couleur
            }

            function updateFluxType(lineNum) {
                const selectElement = document.getElementById('designation-' + lineNum);
                const typeDisplay = document.getElementById('flux-type-display-' + lineNum);
                
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const type = selectedOption.dataset.type || 'depense'; 
                
                typeDisplay.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                typeDisplay.className = type === 'recette' ? 'text-success font-bold' : 'text-danger font-bold';
            }
            
            function removeFluxLine(rowId) {
                document.getElementById(rowId).remove();
                updateFluxTotals();
            }

            function updateFluxTotals() {
                let totalFlux = 0;
                document.querySelectorAll('.input-flux-montant').forEach(input => {
                    totalFlux += parseFloat(input.value) || 0;
                });
                document.getElementById('total-flux').textContent = totalFlux.toFixed(2);
            }
            
            // Initialisation
            addFluxLine();
            
            // Gestion de l'envoi du formulaire (simulé)
            document.getElementById('saisie-caissier-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('caissier-saisie-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = "Soumission des flux en cours...";

                // MOCK: Soumission réussie
                
                msgElement.textContent = \`✅ Soumission de flux pour validation réussie !\`;
                msgElement.classList.add('text-success');
                // Note: En prod, on réinitialiserait
                setTimeout(() => msgElement.classList.add('hidden'), 5000);
            });
        </script>
    `;
}

// =================================================================================
// 9. GESTION DES UTILISATEURS (ADMIN) ET VALIDATION
// =================================================================================

/**
 * Rend l'interface de gestion des utilisateurs (ADMIN uniquement).
 */
function renderUserManagementView() {
    
    // MOCK: Liste des utilisateurs
    const mockUsers = [
        { id: 'U1', email: 'collaborateur@test.com', role: ROLES.COLLABORATEUR, company: 'ENT_1 (Doukè Holdings)' },
        { id: 'U2', email: 'user@monentreprise.com', role: ROLES.USER, company: 'ENT_2 (MonEntrepriseSarl)' },
        { id: 'U3', email: 'caissier@caisse.com', role: ROLES.CAISSIER, company: 'ENT_3 (CaisseTest)' },
        { id: 'U4', email: 'admin@app.com', role: ROLES.ADMIN, company: 'Global' },
    ];
    
    const userRows = mockUsers.map(user => `
        <tr id="user-row-${user.id}" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
            <td class="px-4 py-3 whitespace-nowrap">${user.email}</td>
            <td class="px-4 py-3 whitespace-nowrap font-medium text-info">${user.role}</td>
            <td class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">${user.company}</td>
            <td class="px-4 py-3 whitespace-nowrap text-right">
                <button class="text-sm text-secondary hover:text-primary-dark" onclick="alert('Modifier les rôles de ${user.email}')"><i class="fas fa-user-edit mr-1"></i> Modifier</button>
            </td>
        </tr>
    `).join('');

    return `
        <div class="space-y-8">
            <h2 class="text-3xl font-extrabold text-secondary">Tableau de Bord Administration</h2>
            
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h3 class="text-xl font-bold text-primary mb-4 border-b pb-2">Créer un Nouvel Utilisateur</h3>
                <form id="create-user-form" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="email" placeholder="Email de l'utilisateur" id="new-user-email" required class="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    <select id="new-user-role" required class="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="${ROLES.USER}">USER (Mono-entreprise)</option>
                        <option value="${ROLES.CAISSIER}">CAISSIER</option>
                        <option value="${ROLES.COLLABORATEUR}">COLLABORATEUR (Multi-entreprise)</option>
                        <option value="${ROLES.ADMIN}">ADMIN (Accès total)</option>
                    </select>
                    <button type="submit" class="py-2 bg-success hover:bg-green-700 text-white font-bold rounded-lg"><i class="fas fa-user-plus mr-1"></i> Créer</button>
                </form>
                <p id="create-user-message" class="mt-3 text-center text-sm hidden"></p>
            </div>
            
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h3 class="text-xl font-bold text-secondary mb-4 border-b pb-2">Liste des Utilisateurs du Système</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribué à</th>
                                <th class="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${userRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('create-user-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('create-user-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = "Création du compte en cours...";

                // MOCK: Simulation de la création
                
                msgElement.textContent = \`✅ Utilisateur \${document.getElementById('new-user-email').value} (\${document.getElementById('new-user-role').value}) créé. (Mot de passe temporaire envoyé par API)\`;
                msgElement.classList.add('text-success');
                document.getElementById('create-user-form').reset();
                setTimeout(() => msgElement.classList.add('hidden'), 5000);
            });
        </script>
    `;
}

/**
 * Rend la table des opérations en attente de validation.
 */
function generateValidationTable() { 
    const currentCompanyId = window.userContext.entrepriseContextId || 'NO_CONTEXT';
    const currentCompanyName = window.userContext.entrepriseContextName || 'N/A';
    
    // Simuler des données en attente pour une entreprise
    // Seules ENT_1 et ENT_2 ont des validations en attente ici
    const mockPendingMovements = [
        { id: 'MOV_001', entreprise: 'ENT_2', nature: 'Dépense Carburant (Simple)', montant: '50,000 XOF', soumis_par: 'USR_003' },
        { id: 'MOV_002', entreprise: 'ENT_2', nature: 'Recette Vente Services (Simple)', montant: '250,000 XOF', soumis_par: 'USR_003' },
        { id: 'MOV_003', entreprise: 'ENT_1', nature: 'Écriture Journal (AC) FACT-125', montant: '1,500,000 XOF', soumis_par: 'COL_002' },
    ].filter(m => m.entreprise === currentCompanyId); // Filtrer par le contexte actuel
    
    if (mockPendingMovements.length === 0) {
        return `
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Opérations de Caisse/Journal en Attente</h3>
                <p class="text-center text-info p-4">✅ Aucune opération en attente de validation pour **${currentCompanyName}**.</p>
            </div>
        `;
    }

    const tableRows = mockPendingMovements.map(movement => `
        <tr id="row-${movement.id}" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">${movement.nature}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${movement.montant}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Soumis par ${movement.soumis_par}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="handleValidation('${movement.id}', 'approve')" class="text-success hover:text-green-700 ml-4"><i class="fas fa-check-circle"></i> Valider</button>
                <button onclick="handleValidation('${movement.id}', 'reject')" class="text-danger hover:text-red-700 ml-4"><i class="fas fa-times-circle"></i> Rejeter</button>
            </td>
        </tr>
    `).join('');
    
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Opérations de Caisse/Journal en Attente (${mockPendingMovements.length})</h3>
            <div id="validation-message" class="text-center text-sm mb-4 hidden"></div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature de l'Opération</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soumis Par</th>
                            <th class="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700" id="validation-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Gère l'action de validation ou de rejet d'un mouvement (simulée).
 */
async function handleValidation(movementId, action) {
    const msgElement = document.getElementById('validation-message');
    msgElement.classList.remove('hidden', 'text-danger', 'text-success');
    msgElement.textContent = "Traitement en cours...";
    
    // MOCK: Simuler l'appel API de validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulation du succès
    msgElement.textContent = `✅ Mouvement ${movementId} a été **${action === 'approve' ? 'VALIDÉ' : 'REJETÉ'}** avec succès.`;
    msgElement.classList.add('text-success');
    
    // Retirer l'élément de la liste
    const rowToRemove = document.getElementById(`row-${movementId}`);
    if (rowToRemove) {
        rowToRemove.remove();
    }
    
    setTimeout(() => msgElement.classList.add('hidden'), 3000);
}
