// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : V13 - RÉPARATION DU CONFLIT DE CHEMIN (SOLUTION FINALE ROBUSTE)
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

// =================================================================================
// DÉFINITION ROBUSTE DE L'URL DE L'API (CORRECTION CRITIQUE DES CONFLITS LOCAL/CODESPACES)
// =================================================================================
let API_BASE_URL;

// CORRECTION V13: L'URL de base ne contient PLUS le préfixe /api. Il est ajouté par apiFetch.
// On utilise window.location.host pour s'adapter à localhost ou à l'URL Codespaces (HTTPS)
if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
    // Si Codespaces est détecté, on utilise l'hôte et le protocole actuels (HTTPS)
    const protocol = window.location.protocol;
    const host = window.location.host;
    API_BASE_URL = protocol + '//' + host; 
    console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL (Host Only): ${API_BASE_URL}`);
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Si local, on utilise l'adresse standard HTTP
    API_BASE_URL = 'http://localhost:3000';
    console.log(`[ENV DEBUG] Local détecté. API_BASE_URL (Host Only): ${API_BASE_URL}`);
} else {
    // Production (Render, etc.): utilise l'hôte et le protocole actuels
    API_BASE_URL = window.location.protocol + '//' + window.location.host;
    console.log(`[ENV DEBUG] Production/Inconnu détecté. API_BASE_URL (Host Only): ${API_BASE_URL}`);
}

window.userContext = null;

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// NOUVELLE FONCTION CENTRALE APIFETCH (CLEANING ROBUSTE V13)
// =================================================================================

/**
 * Nettoie une URL pour éviter les doubles barres obliques ('//') ou les barres obliques finales.
 * @param {string} base - L'URL de base.
 * @param {string} path - Le chemin d'accès.
 */
function cleanUrlJoin(base, path) {
    // 1. Assure que la base n'a pas de '/' final
    const cleanedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    // 2. Assure que le path a un '/' initial
    const cleanedPath = path.startsWith('/') ? path : `/${path}`;
    // 3. Concaténation propre
    return `${cleanedBase}${cleanedPath}`;
}

/**
 * Fonction centrale pour toutes les requêtes API.
 * @param {string} endpoint - Ex: '/auth/login' ou '/companies/123' (le préfixe /api sera géré ici)
 * @param {object} options - Options Fetch (method, headers, body)
 */
async function apiFetch(endpoint, options = {}) {
    // Assurer que l'endpoint inclut le préfixe /api (si ce n'est pas déjà fait)
    let finalEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

    const url = cleanUrlJoin(API_BASE_URL, finalEndpoint);
    
    console.log(`[API FETCH V13] Requête vers: ${url}`); // DEBUG CRITIQUE

    const headers = {
        'Content-Type': 'application/json',
        // Ajout du token si disponible (même pour le login, pour les checks auth/me)
        ...window.userContext?.token && { 'Authorization': `Bearer ${window.userContext.token}` }, 
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        // Lecture du corps de la réponse
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            // S'il y a une erreur HTTP sans JSON (ex: 500 HTML), on lève une erreur
            if (!response.ok) {
                throw new Error(`Erreur réseau/serveur. Statut: ${response.status} ${response.statusText}`);
            }
            // Si la réponse est vide mais OK (ex: 204 No Content), on passe
            data = null; 
        }

        if (!response.ok) {
            // L'API nous a retourné une erreur (400, 401, 404, etc.)
            const errorMessage = data?.error || data?.message || `Erreur HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;

    } catch (error) {
        console.error('Erreur API Fetch:', error);
        throw error;
    }
}


// =================================================================================
// 2. AUTHENTIFICATION ET CONTEXTE (MISE À JOUR V13 - UTILISE APIFETCH)
// =================================================================================
/**
 * Connexion utilisateur via l'API serveur.
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(email, password) {
    // Ancien: const endpoint = `${API_BASE_URL}/auth/login`; -> Nouveau: apiFetch('/auth/login', ...)
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        console.log(' ✅  Connexion réussie:', data.utilisateurRole);
        return {
            utilisateurRole: data.utilisateurRole,
            utilisateurId: data.utilisateurId,
            utilisateurNom: data.utilisateurNom,
            token: data.token,
            entrepriseContextId: data.entrepriseContextId || null,
            entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
            multiEntreprise: data.multiEntreprise || false
        };
    } catch (error) {
        if (error.message.includes('Serveur injoignable') || error.message.includes('Failed to fetch')) {
            throw new Error('Serveur injoignable. Vérifiez que le serveur est démarré.');
        }
        throw error;
    }
}

/**
 * Inscription (MOCK côté client - endpoint serveur à créer)
 */
async function handleRegistration(payload) {
    console.warn(' ⚠️  INSCRIPTION EN MODE MOCK - Créez POST /api/auth/register sur le serveur');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockContext = {
        utilisateurRole: 'USER',
        utilisateurId: 'USR_NEW_' + Math.random().toString(36).substring(7),
        utilisateurNom: payload.username,
        token: 'jwt.mock.new.user',
        entrepriseContextId: 'ENT_NEW_' + Math.random().toString(36).substring(7),
        entrepriseContextName: payload.companyName,
        multiEntreprise: false
    };
    return mockContext;
}

/**
 * Récupère les entreprises accessibles à l'utilisateur.
 * Endpoint: GET /api/companies/:userId
 */
async function fetchUserCompanies(context) {
    if (!context || !context.utilisateurId) {
        console.error(' ❌  Impossible de récupérer les entreprises sans utilisateurId');
        return [];
    }
    // Ancien: const endpoint = `${API_BASE_URL}/companies/${context.utilisateurId}`; -> Nouveau: apiFetch(`/companies/${context.utilisateurId}`, ...)
    try {
        const companies = await apiFetch(`/companies/${context.utilisateurId}`, {
            method: 'GET',
        });
        
        if (Array.isArray(companies)) {
            console.log(' ✅  Entreprises récupérées:', companies.length);
            return companies;
        } else {
            console.error(' ❌  Réponse API inattendue pour /companies:', companies);
            return [];
        }
    } catch (error) {
        console.error(' ❌  Erreur API fetchUserCompanies:', error);
        return [];
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
        await loadView('dashboard');
        updateHeaderContext(window.userContext);
    }
}

// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================
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
    document.getElementById('current-company-name').textContent = context.entrepriseContextName || '-- Global --';
    const contextMessage = document.getElementById('context-message');
    if (context.multiEntreprise && !context.entrepriseContextId) {
        contextMessage.textContent = ' ⚠️  CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.';
    } else {
        contextMessage.textContent = `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`;
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
    if (window.userContext && window.userContext.entrepriseContextId) {
        menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
        if (role !== ROLES.CAISSIER) {
            menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
            menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
            menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
        }
    }
    if (role === ROLES.ADMIN) {
        menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }
    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
        menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-sync-alt', view: 'selector' });
    }
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.view === 'selector') {
                renderEnterpriseSelectorView();
            } else {
                loadView(item.view);
            }
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
        alert(' 🚨  Opération Bloquée. Veuillez sélectionner une entreprise.');
        return renderEnterpriseSelectorView(viewName);
    }
    switch (viewName) {
        case 'dashboard':
            contentArea.innerHTML = await renderDashboard(window.userContext);
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
            companyListHTML = '<div class="p-6 text-center bg-warning bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée.</p></div>';
        } else {
            companyListHTML = companies.map(company => `
                <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
                data-company-id="${company.id}" data-company-name="${company.name}">
                <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">ID: ${company.id}</p>
                <div class="mt-4 flex justify-between text-sm">
                <span class="text-success"><i class="fas fa-chart-bar"></i> ${company.stats.transactions} transactions</span>
                </div>
                </div>
            `).join('');
        }
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-danger mb-2">Sélectionner un Contexte d'Entreprise</h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
            </p>
            <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${companyListHTML}
            </div>
            </div>
        `;
        contentArea.querySelectorAll('[data-company-id]').forEach(element => {
            element.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                const companyName = this.getAttribute('data-company-name');
                window.userContext.entrepriseContextId = companyId;
                window.userContext.entrepriseContextName = companyName;
                document.getElementById('current-company-name').textContent = companyName;
                updateNavigationMenu(window.userContext.utilisateurRole);
                loadView('dashboard');
            });
        });
    } catch (error) {
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-danger bg-opacity-10 border-4 border-danger rounded-xl text-center">
            <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
            <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
            <p class="text-lg">${error.message}</p>
            </div>
        `;
    }
    updateHeaderContext(window.userContext);
}

// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES
// =================================================================================
async function renderDashboard(context) {
    if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && !context.entrepriseContextId) {
        return context.utilisateurRole === ROLES.ADMIN ?
            await renderAdminGlobalDashboard(context) :
            await renderCollaborateurGlobalDashboard(context);
    }
    if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && context.entrepriseContextId) {
        return await renderCompanySpecificDashboard(context);
    }
    if (context.utilisateurRole === ROLES.USER) {
        return await renderUserDashboard(context);
    }
    if (context.utilisateurRole === ROLES.CAISSIER) {
        return await renderCaissierDashboard(context);
    }
    return renderNotFound();
}

async function renderAdminGlobalDashboard(context) {
    const stats = await fetchGlobalAdminStats();
    const companies = await fetchUserCompanies(context);
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-building', 'Total Entreprises', stats.totalCompanies, 'bg-primary')}
        ${generateStatCard('fas fa-check-circle', 'Entreprises Actives', stats.activeCompanies, 'bg-success')}
        ${generateStatCard('fas fa-users', 'Collaborateurs', stats.collaborators, 'bg-info')}
        ${generateStatCard('fas fa-envelope-open-text', 'Demandes en Cours', stats.pendingRequests, 'bg-warning')}
        </div>
    `;
    const companyOptions = companies.map(c =>
        `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
    ).join('');
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Administrateur Système (Global)</h2>
        ${statCards}
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6">
        <h3 class="text-xl font-bold text-info mb-4">Sélectionnez une Entreprise pour Travailler</h3>
        <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
        <option value="">-- Choisir une entreprise --</option>
        ${companyOptions}
        </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${renderActivityFeed()}
        ${renderAccountingReports()}
        </div>
        <script>
        document.getElementById('company-selector').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const newId = selectedOption.value || null;
            const newName = selectedOption.dataset.name || '-- Global --';
            if (newId) {
                changeCompanyContext(newId, newName);
            } else {
                window.userContext.entrepriseContextId = null;
                window.userContext.entrepriseContextName = '-- Global --';
                updateHeaderContext(window.userContext);
                loadView('dashboard');
            }
        });
        </script>
    `;
}

async function renderCollaborateurGlobalDashboard(context) {
    const companies = await fetchUserCompanies(context);
    const companyOptions = companies.map(c =>
        `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
    ).join('');
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Collaborateur (Sélection Entreprise)</h2>
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6">
        <h3 class="text-xl font-bold text-info mb-4">Sélectionnez l'Entreprise sur laquelle travailler</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4">Les options de saisie apparaîtront après sélection.</p>
        <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
        <option value="">-- Choisir une entreprise --</option>
        ${companyOptions}
        </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${renderActivityFeed()}
        </div>
        <script>
        document.getElementById('company-selector').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const newId = selectedOption.value || null;
            const newName = selectedOption.dataset.name || '-- Global --';
            if (newId) {
                changeCompanyContext(newId, newName);
            }
        });
        </script>
    `;
}

async function renderCompanySpecificDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || [];
    const currentCompany = userCompanies.find(c => c.id === context.entrepriseContextId);
    if (!currentCompany) {
        return '<div class="text-center p-8 text-danger">Entreprise introuvable.</div>';
    }
    const stats = currentCompany.stats;
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-chart-bar', 'Résultat Provisoire', (stats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')}
        ${generateStatCard('fas fa-hand-holding-usd', 'Total Transactions', stats.transactions || 0, 'bg-primary')}
        ${generateStatCard('fas fa-history', 'Opérations en Attente', stats.pending || 0, 'bg-warning')}
        ${generateStatCard('fas fa-money-check-alt', 'Solde Caisse/Banque', (stats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
        </div>
    `;
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Comptable de ${context.entrepriseContextName}</h2>
        <div class="p-4 bg-warning bg-opacity-10 border-l-4 border-warning rounded-xl mb-6 flex justify-between items-center">
        <p class="text-sm">Contexte actuel: <strong>${context.entrepriseContextName}</strong>
        <a href="#" onclick="changeCompanyContext(null, '-- Global --'); loadView('dashboard'); return false;" class="text-danger hover:underline font-bold ml-2">
        <i class="fas fa-undo"></i> Changer
        </a>
        </p>
        <button onclick="loadView('journal-entry')" class="py-1 px-4 bg-secondary text-white rounded-lg text-sm">
        <i class="fas fa-plus mr-1"></i> Saisie Rapide
        </button>
        </div>
        ${statCards}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${renderActivityFeed()}
        ${renderAccountingReports()}
        </div>
    `;
}

async function renderUserDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || [];
    const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {};
    if (userCompanies.length === 0) {
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Entreprise Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
    }
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-hand-holding-usd', 'Résultat Net', (companyStats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')}
        ${generateStatCard('fas fa-wallet', 'Transactions', companyStats.transactions || 0, 'bg-primary')}
        ${generateStatCard('fas fa-hourglass-half', 'En Attente', companyStats.pending || 0, 'bg-warning')}
        ${generateStatCard('fas fa-chart-area', 'Trésorerie', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
        </div>
    `;
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de ${context.entrepriseContextName}</h2>
        ${statCards}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${renderActivityFeed()}
        ${renderAccountingReports()}
        </div>
    `;
}

async function renderCaissierDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || [];
    if (userCompanies.length === 0) {
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Caisse Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
    }
    const companyStats = userCompanies[0].stats;
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        ${generateStatCard('fas fa-wallet', 'Solde de Ma Caisse', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
        ${generateStatCard('fas fa-receipt', 'Transactions du Jour', companyStats.transactions || 0, 'bg-primary')}
        ${generateStatCard('fas fa-clock', 'Opérations en Attente', companyStats.pending || 0, 'bg-warning')}
        </div>
    `;
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de Caisse de ${context.entrepriseContextName}</h2>
        <div class="p-6 bg-secondary bg-opacity-10 border border-secondary rounded-xl text-center mb-6">
        <h3 class="text-xl font-bold text-secondary">Interface de Caisse Rapide</h3>
        <p class="text-gray-700 dark:text-gray-300">Utilisez "Saisie des Flux" pour enregistrer les entrées/sorties.</p>
        </div>
        ${statCards}
        <div class="grid grid-cols-1 gap-6">
        ${renderActivityFeed()}
        </div>
    `;
}

// =================================================================================
// 5. HELPERS DE RENDU
// =================================================================================
function generateStatCard(icon, title, value, bgColor) {
    return `
        <div class="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-between transform transition hover:scale-105">
        <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
        <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">${value}</p>
        </div>
        <div class="p-3 rounded-full ${bgColor} bg-opacity-10">
        <i class="${icon} text-2xl ${bgColor.replace('bg-', 'text-')}"></i>
        </div>
        </div>
    `;
}

function renderActivityFeed() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fil d'Activité Récent</h3>
        <ul class="space-y-3 text-sm">
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-success">[14:30]</span> Validation de la dépense CRB-005.</li>
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-primary">[10:00]</span> Connexion utilisateur CAI_004.</li>
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-danger">[08:15]</span> Écriture Journal AC-001 rejetée.</li>
        <li class="p-2"><span class="font-bold text-info">[Hier]</span> Nouvel utilisateur ajouté.</li>
        </ul>
        </div>
    `;
}

function renderAccountingReports() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports SYSCOHADA</h3>
        <ul class="space-y-3 text-sm">
        <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
        <span>Bilan Provisoire (N)</span>
        <button class="text-info hover:text-primary" onclick="alert('Génération Bilan...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
        </li>
        <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
        <span>Tableau de Formation des Résultats (TFR)</span>
        <button class="text-info hover:text-primary" onclick="alert('Génération TFR...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
        </li>
        <li class="flex justify-between items-center p-2">
        <span>Grand Livre</span>
        <button class="text-info hover:text-primary" onclick="alert('Génération Grand Livre...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
        </li>
        </ul>
        </div>
    `;
}

function renderNotFound() {
    return '<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>';
}

function renderAccessDenied() {
    return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl">
        <i class="fas fa-lock fa-3x text-danger mb-4"></i>
        <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3>
        <p>Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.</p>
    </div>`;
}

function renderReportsView() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center">
        <i class="fas fa-cogs fa-4x text-info mb-6"></i>
        <h2 class="text-3xl font-extrabold text-info mb-4">Génération de Rapports SYSCOHADA</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-6">Configuration de la période comptable et génération des états financiers officiels (Bilan, TFR, etc.).</p>
        <button onclick="loadView('dashboard')" class="py-2 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition">
        Retour au Tableau de Bord
        </button>
        </div>
    `;
}

function renderCreateCompanyForm() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-extrabold text-secondary mb-6">Création de Nouvelle Entreprise</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Fonctionnalité en cours de développement (endpoint serveur à créer).</p>
        <form id="new-company-form" class="space-y-4">
        <div>
        <label class="block text-sm font-medium">Nom de l'Entreprise <span class="text-danger">*</span></label>
        <input type="text" id="new-company-name" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: Sarl Nouvelle Vision">
        </div>
        <p id="company-creation-message" class="text-center text-sm hidden"></p>
        <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition">
        <i class="fas fa-plus-circle mr-2"></i> Créer l'Entreprise (MOCK)
        </button>
        </form>
        </div>
        <script>
        document.getElementById('new-company-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const msgElement = document.getElementById('company-creation-message');
            const companyName = document.getElementById('new-company-name').value;
            msgElement.classList.remove('hidden', 'text-danger', 'text-success');
            msgElement.textContent = "Création en cours...";
            await new Promise(resolve => setTimeout(resolve, 1500));
            msgElement.textContent = \` ✅  Entreprise "\${companyName}" créée (MOCK). Endpoint serveur à implémenter.\`;
            msgElement.classList.add('text-success');
            setTimeout(() => {
                document.getElementById('new-company-form').reset();
                msgElement.classList.add('hidden');
            }, 3000);
        });
        </script>
    `;
}

function renderSaisieFormCaissier() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie des Flux (Simple)</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie pour ${window.userContext.entrepriseContextName}.</p>
        <p class="text-sm text-warning"> ⚠️  Formulaire à implémenter - Endpoint: POST /api/saisie/flux</p>
        </div>
    `;
}

function renderJournalEntryForm() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie d'Écriture Journal</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie à double-entrée pour ${window.userContext.entrepriseContextName}.</p>
        <p class="text-sm text-warning"> ⚠️  Formulaire à implémenter - Endpoint: POST /api/saisie/journal</p>
        </div>
    `;
}

function generateValidationTable() {
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h3 class="text-xl font-semibold mb-4">Opérations en Attente de Validation</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">Tableau de validation pour ${window.userContext.entrepriseContextName}.</p>
        <p class="text-sm text-warning mt-4"> ⚠️  Tableau à implémenter - Endpoint GET à créer</p>
        </div>
    `;
}

function renderUserManagementView() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <h2 class="text-3xl font-extrabold text-primary mb-6">Gestion des Utilisateurs</h2>
        <p class="text-gray-600 dark:text-gray-400">Interface de gestion des rôles et des accès.</p>
        <p class="text-sm text-warning mt-4"> ⚠️  Interface à implémenter - Endpoints GET/POST/PUT/DELETE à créer</p>
        </div>
    `;
}

// =================================================================================
// 6. GESTION DES VUES AUTHENTIFICATION (Login/Register)
// =================================================================================

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
    }
}

function renderRegisterView() {
    document.getElementById('auth-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.remove('hidden');
    }
}


// =================================================================================
// 7. INITIALISATION ET GESTION DES ÉVÉNEMENTS (LISTENERS)
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgElement = document.getElementById('login-message');
            msgElement.textContent = 'Connexion en cours...';
            msgElement.classList.remove('hidden', 'text-danger', 'text-success');
            try {
                // Appel de la fonction corrigée handleLogin
                const context = await handleLogin(email, password); 
                if (context) {
                    msgElement.classList.add('hidden');
                    // Définir le contexte après connexion réussie
                    window.userContext = context; 
                    initDashboard(context);
                } else {
                    msgElement.textContent = 'Échec de la connexion.';
                    msgElement.classList.add('text-danger');
                }
            } catch (error) {
                msgElement.textContent = error.message;
                msgElement.classList.remove('hidden');
                msgElement.classList.add('text-danger');
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('reg-password').value;
            const passwordConfirm = document.getElementById('reg-password-confirm').value;
            const msgElement = document.getElementById('register-error-message');
            if (password !== passwordConfirm) {
                msgElement.textContent = ' ❌  Les mots de passe ne correspondent pas.';
                msgElement.classList.remove('hidden');
                msgElement.classList.add('text-danger');
                return;
            }
            const payload = {
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: password,
                companyName: document.getElementById('reg-company-name').value,
                companyNif: document.getElementById('reg-company-nif').value,
                companyStatus: document.getElementById('reg-company-status').value,
            };
            msgElement.textContent = 'Inscription en cours...';
            msgElement.classList.remove('hidden', 'text-danger');
            try {
                const context = await handleRegistration(payload);
                msgElement.classList.add('hidden');
                // Définir le contexte après inscription réussie
                window.userContext = context; 
                initDashboard(context);
                alert(` ✅  Inscription Réussie !\nBienvenue chez Doukè Compta Pro.\nVotre entreprise "${context.entrepriseContextName}" a été créée.`);
            } catch (error) {
                msgElement.textContent = error.message;
                msgElement.classList.remove('hidden');
                msgElement.classList.add('text-danger');
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            renderLoginView();
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('login-message').classList.add('hidden');
        });
    }
});

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}
