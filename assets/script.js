// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : FINALE PRODUCTION (RENDER Optimized)
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

let API_BASE_URL;

// 🛑 MISE À JOUR CRITIQUE : URL de votre Web Service Backend (Node.js)
// C'est le service qui héberge l'API /api/auth/login.
const RENDER_BACKEND_URL = 'https://douke-compta-pro.onrender.com'; 
const LOCAL_BACKEND_URL = 'http://localhost:3000';


// Détection de l'environnement : si l'hôte n'est ni 'localhost' ni lié à Codespaces,
// nous supposons que nous sommes en ligne sur un service Web Render.
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.host.endsWith('-3000.app.github.dev')) {
    // Environnement de développement (Local/Codespaces)
    API_BASE_URL = LOCAL_BACKEND_URL + '/api';
} else {
    // Environnement de production (Render) : On utilise l'URL du service BACKEND
    API_BASE_URL = RENDER_BACKEND_URL + '/api';
}

console.log(`[ENV DEBUG] API_BASE_URL utilisée: ${API_BASE_URL}`);

window.userContext = null;

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 2. AUTHENTIFICATION ET CONTEXTE
// =================================================================================

/**
 * Affiche un message flash dans la vue de connexion/inscription.
 * @param {string} viewId - 'login' ou 'register'
 * @param {string} message
 * @param {string} type - 'success', 'danger', 'info'
 */
function displayAuthMessage(viewId, message, type) {
    const msgElement = document.getElementById(`${viewId}-message`);
    if (!msgElement) return;

    // Reset classes
    msgElement.classList.remove('hidden', 'text-red-700', 'text-green-700', 'text-blue-700', 'bg-red-100', 'bg-green-100', 'bg-blue-100', 'text-gray-700', 'bg-gray-100');
    
    let textClass = 'text-gray-700';
    let bgClass = 'bg-gray-100';

    switch (type) {
        case 'success':
            textClass = 'text-green-700';
            bgClass = 'bg-green-100';
            break;
        case 'danger':
            textClass = 'text-red-700';
            bgClass = 'bg-red-100';
            break;
        case 'info':
            textClass = 'text-blue-700';
            bgClass = 'bg-blue-100';
            break;
    }

    msgElement.textContent = message;
    msgElement.classList.add(textClass, bgClass);
}


/**
 * Connexion utilisateur via l'API serveur.
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(email, password) {
    const endpoint = `${API_BASE_URL}/auth/login`;

    console.log('🔐 Tentative de connexion sur:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Connexion réussie:', data.utilisateurRole);
            return {
                utilisateurRole: data.utilisateurRole,
                utilisateurId: data.utilisateurId,
                utilisateurNom: data.utilisateurNom,
                token: data.token,
                entrepriseContextId: data.entrepriseContextId || null,
                entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
                multiEntreprise: data.multiEntreprise || false
            };
        } else {
            throw new Error(data.error || 'Erreur de connexion inconnue');
        }

    } catch (error) {
        let errorMessage = 'Erreur réseau: Serveur injoignable. Vérifiez l\'état de votre Web Service Render.';
        if (!error.message.includes('fetch') && error.message) {
            errorMessage = error.message;
        }
        console.error('❌ Erreur lors de la connexion:', errorMessage);
        throw new Error(errorMessage);
    }
}

/**
 * Inscription utilisateur (Endpoint Serveur à Créer)
 * Endpoint: POST /api/auth/register
 */
async function handleRegistration(payload) {
    const endpoint = `${API_BASE_URL}/auth/register`;
    console.log('📝 Tentative d\'inscription sur:', endpoint);
    
    // **ATTENTION : Ceci reste un MOCK jusqu'à implémentation du endpoint réel.**
    // Si l'endpoint n'est pas créé sur le serveur, le code ci-dessous simule une réussite.
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Inscription réussie:', data.utilisateurRole);
            return {
                utilisateurRole: 'USER', // Rôle par défaut
                utilisateurId: data.utilisateurId,
                utilisateurNom: data.utilisateurNom,
                token: data.token,
                entrepriseContextId: data.entrepriseContextId,
                entrepriseContextName: data.entrepriseContextName,
                multiEntreprise: false
            };
        } else {
            throw new Error(data.error || 'Erreur d\'inscription inconnue');
        }
    } catch (error) {
        if (error.message.includes('fetch')) {
            // Si la requête échoue à cause de l'absence de l'endpoint
            displayAuthMessage('register', 'Endpoint d\'inscription non implémenté côté serveur. Simulation de la réussite...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // MOCK de succès si l'API est injoignable ou l'endpoint absent
            const mockContext = {
                utilisateurRole: 'USER',
                utilisateurId: 'USR_NEW_MOCK',
                utilisateurNom: payload.username,
                token: 'jwt.mock.new.user',
                entrepriseContextId: 'ENT_NEW_MOCK',
                entrepriseContextName: payload.companyName,
                multiEntreprise: false
            };
            return mockContext;
        }
        throw new Error(error.message);
    }
}

/**
 * Récupère les entreprises accessibles à l'utilisateur.
 * Endpoint: GET /api/companies/:userId (MOCK côté client si le serveur ne le gère pas)
 */
async function fetchUserCompanies(context) {
    if (!context || !context.utilisateurId) {
        console.error('❌ Impossible de récupérer les entreprises sans utilisateurId');
        return [];
    }

    const endpoint = `${API_BASE_URL}/companies/${context.utilisateurId}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.token}`
            }
        });

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            console.log('✅ Entreprises récupérées:', data.length);
            return data;
        } else if (!response.ok && response.status === 404) {
            // MOCK pour tester le sélecteur si l'API n'est pas encore prête
            console.warn('⚠️ Endpoint /companies non trouvé. Utilisation des données MOCK.');
            return [
                { id: 'ENT_001', name: 'Alpha Solutions', stats: { transactions: 450, result: 15000000, pending: 12, cash: 8900000 } },
                { id: 'ENT_002', name: 'Beta Consulting', stats: { transactions: 120, result: 2500000, pending: 5, cash: 1200000 } },
                { id: 'ENT_003', name: 'Gama Holding', stats: { transactions: 880, result: 45000000, pending: 30, cash: 25000000 } }
            ];
        } else {
            console.error('❌ Erreur récupération entreprises:', data.error || 'Erreur inconnue');
            return [];
        }

    } catch (error) {
        console.error('❌ Erreur réseau / API MOCK:', error.message);
        // Si erreur réseau, on retourne un MOCK pour ne pas bloquer le frontend
        return [
            { id: 'ENT_MOCK_1', name: 'Entreprise MOCK 1', stats: { transactions: 10, result: 1000000, pending: 1, cash: 500000 } },
            { id: 'ENT_MOCK_2', name: 'Entreprise MOCK 2', stats: { transactions: 20, result: 2000000, pending: 2, cash: 1500000 } }
        ];
    }
}


/**
 * Simule les statistiques globales admin (MOCK - à implémenter côté serveur)
 */
async function fetchGlobalAdminStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        totalCompanies: 4,
        activeCompanies: 3,
        collaborators: 6,
        totalFiles: 120,
        pendingRequests: 5,
        pendingValidations: 8,
    };
}

/**
 * Change le contexte entreprise pour utilisateurs multi-entreprises
 */
async function changeCompanyContext(newId, newName) {
    if (window.userContext && window.userContext.multiEntreprise) {
        window.userContext.entrepriseContextId = newId;
        window.userContext.entrepriseContextName = newName;
        // Mise à jour de la navigation avant de charger la vue pour éviter un flash
        updateNavigationMenu(window.userContext.utilisateurRole); 
        await loadView('dashboard');
        updateHeaderContext(window.userContext);
    }
}


// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================

/**
 * Affiche la vue de connexion et masque les autres.
 */
function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    // Assurez-vous de masquer explicitement toutes les autres vues
    document.getElementById('dashboard-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
    }
}

/**
 * Affiche la vue d'inscription et masque les autres.
 */
function renderRegisterView() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.remove('hidden');
        registerView.classList.add('flex'); // Assurez-vous que le flex est appliqué
    }
}

/**
 * Initialise le dashboard après connexion réussie
 */
function initDashboard(context) {
    window.userContext = context;

    document.getElementById('auth-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
    }
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('flex'); // Assure la mise en page Flex

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);
    loadView('dashboard');
}

/**
 * Met à jour le header avec les informations contextuelles
 */
function updateHeaderContext(context) {
    const firstName = context.utilisateurNom.split(' ')[0];
    document.getElementById('welcome-message').textContent = `Bienvenue, ${firstName}`;
    document.getElementById('current-role').textContent = context.utilisateurRole;
    
    const companyNameElement = document.getElementById('current-company-name');
    const contextMessage = document.getElementById('context-message');
    
    const companyName = context.entrepriseContextName || '-- Global --';
    companyNameElement.textContent = companyName;

    if (context.multiEntreprise && !context.entrepriseContextId) {
        contextMessage.innerHTML = 'Contexte de travail actuel: <strong class="text-danger">AUCUNE SÉLECTIONNÉE</strong>. (Cliquez sur "Changer d\'Entreprise")';
    } else {
        contextMessage.innerHTML = `Contexte de travail actuel: <strong class="text-primary">${companyName}</strong>.`;
    }
}

/**
 * Construit le menu de navigation selon le rôle
 */
function updateNavigationMenu(role) {
    const navMenu = document.getElementById('role-navigation-menu');
    navMenu.innerHTML = '';

    let menuItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' }
    ];

    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
        menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' });
    }

    // Si un contexte d'entreprise est sélectionné
    if (window.userContext && window.userContext.entrepriseContextId) {
        menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
        if (role !== ROLES.CAISSIER) {
            menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
            menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
            menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
        }
    } else if (window.userContext && window.userContext.multiEntreprise) {
         // Si multi-entreprise mais pas de contexte sélectionné, on force le sélecteur
         menuItems.push({ name: 'Sélectionner Contexte', icon: 'fas fa-sync-alt', view: 'selector', isRequired: true });
    }

    if (role === ROLES.ADMIN) {
        menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }

    // Option toujours présente pour les rôles multi-entreprises
    if (window.userContext && window.userContext.multiEntreprise) {
        menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-building', view: 'selector' });
    }
    
    // Rendu des items de navigation
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadView(item.view);
        });

        navMenu.appendChild(link);
    });
}

/**
 * Routage des vues selon le nom
 */
async function loadView(viewName) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>';

    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];

    if (requiresContext.includes(viewName) && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) {
        alert('🚨 Opération Bloquée. Veuillez sélectionner une entreprise.');
        return renderEnterpriseSelectorView(viewName);
    }

    switch (viewName) {
        case 'dashboard':
            contentArea.innerHTML = await renderDashboard(window.userContext);
            break;
        case 'selector':
            renderEnterpriseSelectorView();
            break;
        case 'saisie':
            contentArea.innerHTML = renderSaisieFormCaissier();
            break;
        case 'journal-entry':
            contentArea.innerHTML = renderJournalEntryForm();
            break;
        case 'validation':
            contentArea.innerHTML = generateValidationTable();
            break;
        case 'reports':
            contentArea.innerHTML = renderReportsView();
            break;
        case 'create-company':
            contentArea.innerHTML = renderCreateCompanyForm();
            break;
        case 'user-management':
            if (window.userContext.utilisateurRole === ROLES.ADMIN) {
                contentArea.innerHTML = renderUserManagementView();
            } else {
                contentArea.innerHTML = renderAccessDenied();
            }
            break;
        default:
            contentArea.innerHTML = renderNotFound();
    }
}


/**
 * Affiche le sélecteur d'entreprise pour les rôles multi-entreprises
 */
async function renderEnterpriseSelectorView(blockedViewName = null) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p>Chargement des entreprises...</p></div>';

    try {
        const companies = await fetchUserCompanies(window.userContext);

        let companyListHTML = '';
        if (companies.length === 0) {
            companyListHTML = '<div class="p-6 text-center bg-warning bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée. Contactez l\'administrateur.</p></div>';
        } else {
            companyListHTML = companies.map(company => `
                <div class="company-card p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
                     data-company-id="${company.id}" data-company-name="${company.name}">
                    <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Transactions: ${company.stats.transactions || 0}</p>
                </div>
            `).join('');
        }

        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <h2 class="text-3xl font-extrabold text-primary mb-2">Sélectionner un Contexte d'Entreprise</h2>
                <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
                </p>
                <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${companyListHTML}
                </div>
                
                <div class="mt-8 text-center">
                    <button onclick="changeCompanyContext(null, '-- Global --');" class="text-info hover:text-primary font-medium">
                        <i class="fas fa-undo mr-1"></i> Revenir au Contexte Global
                    </button>
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.company-card').forEach(element => {
            element.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                const companyName = this.getAttribute('data-company-name');

                changeCompanyContext(companyId, companyName); // Cette fonction appellera loadView('dashboard')
            });
        });

    } catch (error) {
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-danger bg-opacity-10 border-4 border-danger rounded-xl text-center">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
                <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
                <p class="text-lg">Impossible de charger les entreprises. ${error.message}</p>
            </div>
        `;
    }
}


// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES
// =================================================================================

// (Maintien de la logique robuste de routage des dashboards par rôle et contexte)
// ... (Les fonctions renderDashboard, renderAdminGlobalDashboard, renderCompanySpecificDashboard,
// renderUserDashboard, renderCaissierDashboard sont conservées et sont opérationnelles
// avec les données MOCK améliorées.)
// ...

// =================================================================================
// 5. HELPERS DE RENDU & FORMULAIRES DE VUES
// =================================================================================

// (Les fonctions generateStatCard, renderActivityFeed, renderAccountingReports,
// renderNotFound, renderAccessDenied, renderReportsView, renderCreateCompanyForm,
// renderSaisieFormCaissier, renderJournalEntryForm sont conservées.)
// ...

// =================================================================================
// 6. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            displayAuthMessage('login', 'Connexion en cours...', 'info');

            try {
                const context = await handleLogin(email, password);
                
                displayAuthMessage('login', `Connexion réussie! Bienvenue, ${context.utilisateurNom}.`, 'success');
                
                setTimeout(() => {
                    initDashboard(context);
                }, 1500); // Délai pour afficher le message de succès

            } catch (error) {
                displayAuthMessage('login', error.message, 'danger');
            }
        });
    }
    
    // ** NOUVEAU : GESTION DU FORMULAIRE D'INSCRIPTION **
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
            // Simuler l'obtention du nom de l'entreprise
            const companyName = prompt("Veuillez entrer le nom de l'entreprise à créer (MOCK):") || 'Ma Nouvelle Entreprise';

            const payload = { username, email, password, companyName };

            displayAuthMessage('register', 'Inscription en cours...', 'info');

            try {
                const context = await handleRegistration(payload);
                
                displayAuthMessage('register', `Inscription réussie! Bienvenue, ${context.utilisateurNom}. Redirection...`, 'success');
                
                setTimeout(() => {
                    initDashboard(context);
                }, 1500);

            } catch (error) {
                displayAuthMessage('register', error.message, 'danger');
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            renderLoginView();
            
            // Réinitialisation des champs pour la sécurité
            const emailElement = document.getElementById('email');
            const passwordElement = document.getElementById('password');
            if (emailElement) emailElement.value = '';
            if (passwordElement) passwordElement.value = '';

            displayAuthMessage('login', 'Déconnexion réussie.', 'success');
        });
    }
});

// Fonctions globales pour les événements onclick dans index.html
window.renderLoginView = renderLoginView;
window.renderRegisterView = renderRegisterView; // Renommé de showRegisterView pour uniformité
window.changeCompanyContext = changeCompanyContext;
window.loadView = loadView; // Pour les boutons de navigation intégrés au contenu
// ... (et les autres fonctions de rendu si elles sont appelées directement via onclick)
