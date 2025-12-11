// =================================================================================
// FICHIER : assets/script.js
// Description : Logique frontend de l'application Doukè Compta Pro (Version Finale Intégrale)
// =================================================================================

// 🛑 CORRECTION CRITIQUE : DÉTECTION DYNAMIQUE DE L'URL DE L'API (Solution Robuste)
let API_BASE_URL;
const isCodespaces = window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev');

// 
if (isCodespaces) {
    // Dans Codespaces, on utilise le protocole et l'hôte actuels pour garantir HTTPS
    const protocol = window.location.protocol;
    const host = window.location.host;
    API_BASE_URL = protocol + '//' + host + '/api'; 
    console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL: ${API_BASE_URL}`);

} else {
    // Si local, on utilise l'adresse standard HTTP
    API_BASE_URL = 'http://localhost:3000/api';
    console.log(`[ENV DEBUG] Local détecté. API_BASE_URL: ${API_BASE_URL}`);
}
// =================================================================================


// =================================================================================
// CONSTANTES GLOBALES ET VARIABLES D'ÉTAT
// =================================================================================

const USER_ROLES = {
    ADMIN: 'Administrateur',
    COLLABORATEUR: 'Collaborateur',
    USER: 'Utilisateur Standard',
    CAISSIER: 'Caissier',
};

const USER_CONTEXT = {
    role: null,
    id: null,
    name: null,
    token: null,
    multiEntreprise: false,
    entrepriseContextId: null,
    entrepriseContextName: 'Non sélectionnée',
};

// =================================================================================
// ÉLÉMENTS DU DOM
// =================================================================================

const authView = document.getElementById('auth-view');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const dashboardView = document.getElementById('dashboard-view');
const dashboardContentArea = document.getElementById('dashboard-content-area');
const welcomeMessage = document.getElementById('welcome-message');
const currentRoleDisplay = document.getElementById('current-role');
const currentCompanyNameDisplay = document.getElementById('current-company-name');
const logoutButton = document.getElementById('logout-button');
const roleNavigationMenu = document.getElementById('role-navigation-menu');

// =================================================================================
// UTILS
// =================================================================================

/**
 * Affiche un message dans la vue de connexion.
 * @param {string} message - Le message à afficher.
 * @param {string} type - 'success' ou 'error'.
 */
function displayLoginMessage(message, type = 'error') {
    loginMessage.textContent = message;
    loginMessage.className = `text-center text-sm font-bold mt-4 p-2 rounded ${
        type === 'error' ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'
    }`;
    loginMessage.classList.remove('hidden');
    setTimeout(() => {
        loginMessage.classList.add('hidden');
    }, 5000);
}

/**
 * Bascule entre la vue d'authentification et la vue du tableau de bord.
 * @param {boolean} showDashboard - Vrai pour afficher le tableau de bord, faux pour l'authentification.
 */
function toggleViews(showDashboard) {
    if (showDashboard) {
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
    } else {
        dashboardView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
}

// =================================================================================
// GESTION DE L'AUTHENTIFICATION
// =================================================================================

/**
 * Gère la soumission du formulaire de connexion.
 * @param {Event} event - L'événement de soumission.
 */
async function handleLogin(event) {
    event.preventDefault();

    // ✅ CORRECTION 2: Les IDs sont maintenant corrects dans index.html
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Mise à jour du contexte utilisateur
            USER_CONTEXT.role = data.utilisateurRole;
            USER_CONTEXT.id = data.utilisateurId;
            USER_CONTEXT.name = data.utilisateurNom;
            USER_CONTEXT.token = data.token;
            USER_CONTEXT.multiEntreprise = data.multiEntreprise;
            
            // Si le serveur renvoie un contexte d'entreprise initial
            if (data.entrepriseContextId) {
                USER_CONTEXT.entrepriseContextId = data.entrepriseContextId;
                USER_CONTEXT.entrepriseContextName = data.entrepriseContextName;
            }

            // Affichage du tableau de bord
            initializeDashboard();

        } else {
            // Le serveur a répondu avec une erreur 400 ou 401, etc.
            throw new Error(data.error || 'Identifiants incorrects.');
        }
    } catch (error) {
        // Erreur de connexion (serveur injoignable, CORS, etc.)
        console.error('Erreur de connexion:', error);
        
        // Affichage du message d'erreur utilisant la variable corrigée
        displayLoginMessage(`❌ Erreur: ${error.message || 'Serveur injoignable. Vérifiez que le serveur tourne sur ' + API_BASE_URL}`, 'error');
    }
}


/**
 * Gère la déconnexion de l'utilisateur.
 * @param {Event} event - L'événement de clic.
 */
function handleLogout(event) {
    event.preventDefault();
    // Réinitialiser le contexte
    USER_CONTEXT.role = null;
    USER_CONTEXT.id = null;
    USER_CONTEXT.token = null;
    USER_CONTEXT.entrepriseContextId = null;
    USER_CONTEXT.entrepriseContextName = 'Non sélectionnée';
    
    // Afficher la vue de connexion
    toggleViews(false);
    displayLoginMessage('Déconnexion réussie.', 'success');
}

// =================================================================================
// INITIALISATION DU DASHBOARD
// =================================================================================

/**
 * Configure les éléments visuels du tableau de bord.
 */
function updateDashboardUI() {
    welcomeMessage.textContent = `Bienvenue, ${USER_CONTEXT.name} !`;
    currentRoleDisplay.textContent = USER_ROLES[USER_CONTEXT.role] || USER_CONTEXT.role;
    currentCompanyNameDisplay.textContent = USER_CONTEXT.entrepriseContextName;
}

/**
 * Construit le menu de navigation en fonction du rôle de l'utilisateur.
 */
function buildNavigationMenu() {
    let links = [];
    
    // Liens communs (Accueil, Profil)
    links.push({ name: 'Accueil', icon: 'fas fa-tachometer-alt', role: 'ALL', action: 'loadDashboardSummary' });
    
    // Liens spécifiques au rôle
    switch (USER_CONTEXT.role) {
        case 'ADMIN':
            links.push(
                { name: 'Administration', icon: 'fas fa-user-shield', role: 'ADMIN', action: 'loadAdminPanel' },
                { name: 'Saisie Journal', icon: 'fas fa-pen-nib', role: 'ADMIN', action: 'loadJournalEntryForm' },
                { name: 'Rapports Financiers', icon: 'fas fa-chart-line', role: 'ADMIN', action: 'loadFinancialReports' }
            );
            break;
        case 'COLLABORATEUR':
            links.push(
                { name: 'Saisie Journal', icon: 'fas fa-pen-nib', role: 'COLLABORATEUR', action: 'loadJournalEntryForm' },
                { name: 'Documents Clients', icon: 'fas fa-file-invoice', role: 'COLLABORATEUR', action: 'loadClientDocs' }
            );
            break;
        case 'USER':
            links.push(
                { name: 'Saisie Simple Flux', icon: 'fas fa-exchange-alt', role: 'USER', action: 'loadCaissierForm' },
                { name: 'Suivi Budget', icon: 'fas fa-piggy-bank', role: 'USER', action: 'loadBudgetTracker' }
            );
            break;
        case 'CAISSIER':
            links.push(
                { name: 'Saisie Caisse/Banque', icon: 'fas fa-cash-register', role: 'CAISSIER', action: 'loadCaissierForm' },
                { name: 'Consultation Historique', icon: 'fas fa-history', role: 'CAISSIER', action: 'loadHistory' }
            );
            break;
        default:
            console.warn(`Rôle inconnu: ${USER_CONTEXT.role}`);
    }

    // Génération du HTML du menu
    roleNavigationMenu.innerHTML = links.map(link => `
        <a href="#" data-action="${link.action}" class="flex items-center p-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <i class="${link.icon} w-5 h-5 mr-3"></i>
            ${link.name}
        </a>
    `).join('');

    // Ajout des écouteurs d'événements aux nouveaux liens
    roleNavigationMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const action = e.target.closest('a').dataset.action;
            handleNavigation(action);
        });
    });
}

/**
 * Initialise le tableau de bord après la connexion.
 */
async function initializeDashboard() {
    updateDashboardUI();
    buildNavigationMenu();
    toggleViews(true);
    
    // Afficher la page d'accueil par défaut
    loadDashboardSummary();
    
    // Chargement dynamique des entreprises si nécessaire
    if (USER_CONTEXT.multiEntreprise || !USER_CONTEXT.entrepriseContextId) {
        await loadCompaniesList();
    }
}

// =================================================================================
// GESTION DES VUES ET DU CONTENU
// =================================================================================

/**
 * Gère le clic sur les liens de navigation.
 * @param {string} action - L'action à effectuer.
 */
function handleNavigation(action) {
    // Dans une application professionnelle, ceci déclencherait un routeur ou un chargement de module
    // Pour ce mock, nous affichons un placeholder.
    dashboardContentArea.innerHTML = `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-2xl font-semibold text-primary">Vue: ${action}</h3>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Le contenu de cette section pour le rôle ${USER_ROLES[USER_CONTEXT.role] || USER_CONTEXT.role} sera implémenté ici.</p>
        </div>
    `;
    // Logique pour charger les formulaires réels (loadCaissierForm, loadJournalEntryForm, etc.) irait ici
}

/**
 * Charge le résumé initial du tableau de bord.
 */
async function loadDashboardSummary() {
    dashboardContentArea.innerHTML = `
        <div class="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <i class="fas fa-spinner fa-spin text-4xl text-primary"></i>
            <p class="mt-4 text-lg">Chargement des données principales...</p>
        </div>
    `;
    
    // Simuler le chargement des entreprises pour l'administrateur/multi-entreprise
    let companiesHTML = '';
    if (USER_CONTEXT.multiEntreprise) {
        companiesHTML = await fetchCompaniesAndRender();
    } else {
        companiesHTML = `<p class="p-4 text-center text-gray-500">Vous êtes dans le contexte d'une seule entreprise: ${USER_CONTEXT.entrepriseContextName}.</p>`;
    }

    dashboardContentArea.innerHTML = `
        <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tableau de Bord Global</h3>
        ${companiesHTML}
        `;
}

/**
 * Appelle l'API pour récupérer la liste des entreprises.
 */
async function fetchCompaniesAndRender() {
    try {
        const response = await fetch(`${API_BASE_URL}/companies/${USER_CONTEXT.id}`, {
            headers: {
                'Authorization': `Bearer ${USER_CONTEXT.token}`
            }
        });

        if (!response.ok) throw new Error('Erreur de chargement des entreprises.');

        const companies = await response.json();
        
        let companyCards = companies.map(comp => `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-primary hover:shadow-lg transition">
                <h4 class="text-xl font-bold text-primary mb-2">${comp.name}</h4>
                <p class="text-gray-600 dark:text-gray-400">Transactions: <span class="font-semibold">${comp.stats.transactions}</span></p>
                <p class="text-gray-600 dark:text-gray-400">Résultat (YTD): <span class="font-semibold text-success">${comp.stats.result.toLocaleString('fr-FR')} XOF</span></p>
                <p class="text-gray-600 dark:text-gray-400">Encaisse: <span class="font-semibold">${comp.stats.cash.toLocaleString('fr-FR')} XOF</span></p>
                <button onclick="setCompanyContext('${comp.id}', '${comp.name}')" 
                        class="mt-3 text-xs bg-secondary text-white py-1 px-3 rounded hover:bg-primary transition">
                    Sélectionner
                </button>
            </div>
        `).join('');

        return `
            <h4 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Vos Entreprises Accessibles</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${companyCards}
            </div>
        `;

    } catch (error) {
        console.error('Erreur de récupération des entreprises:', error);
        return `<p class="text-red-600 p-4 bg-red-50 rounded-lg">Impossible de charger les entreprises: ${error.message}</p>`;
    }
}

/**
 * Change le contexte d'entreprise actuel (pour les rôles multi-entreprises).
 * @param {string} id - ID de la nouvelle entreprise.
 * @param {string} name - Nom de la nouvelle entreprise.
 */
function setCompanyContext(id, name) {
    USER_CONTEXT.entrepriseContextId = id;
    USER_CONTEXT.entrepriseContextName = name;
    updateDashboardUI(); // Met à jour le nom dans le header
    alert(`Contexte changé pour: ${name}`);
    // Recharger la vue pour afficher les données de la nouvelle entreprise (à implémenter)
    loadDashboardSummary();
}


// =================================================================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// =================================================================================

/**
 * Attache tous les écouteurs d'événements après le chargement du DOM.
 */
function attachEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    // Les écouteurs pour la navigation sont ajoutés dynamiquement dans buildNavigationMenu()
    
    // Tentative de reconnexion si les données sont dans le localStorage (non implémenté)
    // Pour l'instant, on commence toujours à la vue d'authentification.
}

// Assurez-vous que le DOM est complètement chargé avant d'attacher les événements.
document.addEventListener('DOMContentLoaded', attachEventListeners);

// =================================================================================
// FIN DU FICHIER
// =================================================================================
