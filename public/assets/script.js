// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : OPTIMALE 4.2.1 - V9 INTÉGRATION & CORRECTION CRITIQUE
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================
let API_BASE_URL;
// On utilise window.location.host pour s'adapter à localhost ou à l'URL Codespaces (HTTPS)
if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    API_BASE_URL = protocol + '//' + host + '/api';
    console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL: ${API_BASE_URL}`);
} else {
    API_BASE_URL = 'http://localhost:3000/api';
    console.log(`[ENV DEBUG] Local détecté. API_BASE_URL: ${API_BASE_URL}`);
}

window.userContext = null;

// AJOUT V9: État central de l'application (pour les données de module)
let appState = {
    // Les KPIs sont initialisés pour garantir la structure dans le rendu
    dashboardKPIs: {
        cash: 0, profit: 0, debts: 0,
        grossMargin: 0, profitTrend: "0%", pendingEntries: 0,
        liquidityRatio: null, currentPeriod: 'N/A',
    },
    filteredData: {
        accounts: [], 
        financialReport: null,
        journalEntries: [], 
    }
};

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 2. AUTHENTIFICATION ET CONTEXTE (ALIGNÉ SERVEUR)
// =================================================================================

/**
 * AJOUT V9: Helper pour les appels API authentifiés et structurés.
 */
async function apiFetch(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const token = window.userContext ? window.userContext.token : null;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
    });

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur ${response.status} de l'API.`);
        }
        return data; 
    } else if (response.ok) {
        return response.blob(); 
    } else {
        throw new Error(`Erreur ${response.status} de l'API (non JSON).`);
    }
}

/**
 * Connexion utilisateur via l'API serveur.
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(email, password) {
    const endpoint = `/auth/login`; // Utilisation du path pour apiFetch
    console.log(' 🔐  Tentative de connexion sur:', API_BASE_URL + endpoint);
    try {
        // CORRECTION: Utilisation de fetch standard car apiFetch dépend du token qui n'est pas encore là
        const response = await fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
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
        } else {
            throw new Error(data.error || 'Erreur de connexion inconnue');
        }
    } catch (error) {
        if (error.message === 'Failed to fetch') {
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
    const endpoint = `/companies/${context.utilisateurId}`; // Utilisation de apiFetch
    console.log(' 📊  Récupération des entreprises:', API_BASE_URL + endpoint);
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        const data = response.data || response;
        if (Array.isArray(data)) {
            console.log(' ✅  Entreprises récupérées:', data.length);
            return data;
        } else {
            console.error(' ❌  Erreur récupération entreprises:', data.error || 'Réponse non valide');
            return [];
        }
    } catch (error) {
        console.error(' ❌  Erreur réseau:', error);
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
        // Mise à jour de l'état global V9
        appState.currentCompanyId = newId; 
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
    // V9 : Synchronisation de l'état
    appState.currentCompanyId = context.entrepriseContextId; 

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
 * AJOUT V9: Plan Comptable et Journal
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
            menuItems.push({ name: 'Plan Comptable', icon: 'fas fa-balance-scale', view: 'chart-of-accounts' }); // NOUVEAU V9
            menuItems.push({ name: 'Journal des Écritures', icon: 'fas fa-book', view: 'journal' }); // NOUVEAU V9
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
 * MODIFIÉ V9: Ajout du paramètre extraData pour le drill-down.
 */
async function loadView(viewName, extraData = null) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>';

    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports', 'chart-of-accounts', 'journal'];
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
            contentArea.innerHTML = renderReportsView(); // Déclenche la modale V9
            break;
        case 'chart-of-accounts': // NOUVEAU V9
            contentArea.innerHTML = await renderChartOfAccountsView();
            break;
        case 'journal': // NOUVEAU V9
            contentArea.innerHTML = await renderJournalView(extraData);
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
        return await renderCompanySpecificDashboard(context); // Utilise la logique V9
    }
    if (context.utilisateurRole === ROLES.USER) {
        return await renderUserDashboard(context);
    }
    if (context.utilisateurRole === ROLES.CAISSIER) {
        return await renderCaissierDashboard(context);
    }
    return renderNotFound();
}

// ... (renderAdminGlobalDashboard, renderCollaborateurGlobalDashboard, renderUserDashboard, renderCaissierDashboard restent identiques)
// Je conserve les fonctions du fichier original ci-dessous :

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

/**
 * MODIFIÉ V9: Remplace l'ancienne logique statique par l'appel aux nouveaux KPIs.
 */
async function renderCompanySpecificDashboard(context) {
    const companyId = context.entrepriseContextId;
    const companyName = context.entrepriseContextName;

    try {
        const dashboardHTML = await fetchDashboardData(companyId);
        
        return `
            <div class="p-4 bg-warning bg-opacity-10 border-l-4 border-warning rounded-xl mb-6 flex justify-between items-center">
                <p class="text-sm">Contexte actuel: <strong>${companyName}</strong>
                    <a href="#" onclick="changeCompanyContext(null, '-- Global --'); loadView('dashboard'); return false;" class="text-danger hover:underline font-bold ml-2">
                        <i class="fas fa-undo"></i> Changer
                    </a>
                </p>
                <button onclick="loadView('journal-entry')" class="py-1 px-4 bg-secondary text-white rounded-lg text-sm">
                    <i class="fas fa-plus mr-1"></i> Saisie Rapide
                </button>
            </div>
            ${dashboardHTML}
        `;
    } catch (error) {
        return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl">
            <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
            <h3 class="text-2xl font-extrabold text-danger">ERREUR: Tableau de Bord Indisponible</h3>
            <p>Impossible de charger les KPIs: ${error.message}</p>
        </div>`;
    }
}
async function renderUserDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || [];
    const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {};
    if (userCompanies.length === 0) {
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Entreprise Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
    }
    // Remplacement par la logique V9 pour plus de cohérence
    return renderCompanySpecificDashboard(context);
}
async function renderCaissierDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || [];
    if (userCompanies.length === 0) {
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Caisse Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
    }
    // Remplacement par la logique V9 pour plus de cohérence, le caissier voit le dashboard de l'entreprise
    return renderCompanySpecificDashboard(context);
}

// =================================================================================
// 5. FONCTIONS V9 : NOUVELLE LOGIQUE MÉTIER (KPIs, PLAN COMPTABLE, RAPPORTS)
// =================================================================================

/**
 * V9 - Récupère les nouveaux KPIs du Dashboard.
 */
async function fetchDashboardData(companyId) {
    const endpoint = `/accounting/dashboard?companyId=${companyId}`;
    const response = await apiFetch(endpoint, { method: 'GET' });
    
    // Assumons que l'API renvoie { data: {kpis...} } ou directement {kpis...}
    const newKPIs = response.data || response;

    // Mise à jour de l'état global
    appState.dashboardKPIs = {
        ...appState.dashboardKPIs, 
        ...newKPIs,             
    };
    
    return generateDashboardHTML(appState.dashboardKPIs, window.userContext.entrepriseContextName);
}

/**
 * V9 - Génère le HTML pour l'affichage du Tableau de Bord avec les Nouveaux KPIs.
 */
function generateDashboardHTML(kpis, companyName) {
    const formatValue = (value, isCurrency = true) => {
        if (typeof value === 'number') {
            return isCurrency ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : value.toLocaleString('fr-FR');
        }
        return value;
    };
    
    const trendColor = kpis.profitTrend && parseFloat(kpis.profitTrend) >= 0 ? 'text-success' : 'text-danger';

    const cardHTML = [
        { title: 'Trésorerie Actuelle', value: formatValue(kpis.cash), icon: 'fas fa-hand-holding-usd', color: 'bg-primary' },
        { title: 'Résultat Net', value: formatValue(kpis.profit), icon: 'fas fa-chart-bar', color: 'bg-info' },
        { title: 'Dettes Fournisseurs', value: formatValue(kpis.debts), icon: 'fas fa-truck-loading', color: 'bg-warning' },
        { title: 'Marge Brute', value: formatValue(kpis.grossMargin), icon: 'fas fa-percentage', color: 'bg-secondary' },
        { title: 'Ratio de Liquidité', value: formatValue(kpis.liquidityRatio, false), icon: 'fas fa-balance-scale', color: 'bg-info' },
    ];
    
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Comptable de ${companyName}</h2>

        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center shadow-inner">
            <p class="text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Période Financière Actuelle</p>
            <p class="text-lg font-extrabold text-primary dark:text-primary-light">${kpis.currentPeriod}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            ${cardHTML.map(card => `
                <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-bold text-gray-500 dark:text-gray-400">${card.title}</p>
                        <i class="${card.icon} text-lg ${card.color.replace('bg-', 'text-')}"></i>
                    </div>
                    <p class="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">${card.value}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <p class="text-sm font-bold text-gray-500 dark:text-gray-400">Tendance du Résultat (vs. Période Préc.)</p>
                <div class="flex items-end mt-2">
                    <p class="text-3xl font-extrabold ${trendColor}">${kpis.profitTrend}</p>
                    <i class="fas ${parseFloat(kpis.profitTrend) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} ml-3 text-lg ${trendColor}"></i>
                </div>
            </div>

            <div class="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <p class="text-sm font-bold text-gray-500 dark:text-gray-400">Écritures en Brouillon/Validation</p>
                <div class="flex items-end mt-2">
                    <p class="text-3xl font-extrabold text-danger">${kpis.pendingEntries}</p>
                    <button onclick="loadView('validation')" class="ml-4 text-primary hover:underline text-sm font-bold">Voir</button>
                </div>
            </div>
        </div>
        
        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 text-center">
            <i class="fas fa-chart-pie fa-2x text-primary/50 mb-3"></i>
            <p class="text-gray-500">Espace réservé pour les Graphiques de Performance (Marge, Répartition des Charges)</p>
        </div>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            ${renderActivityFeed()}
            ${renderAccountingReports()}
         </div>
    `;
}

/**
 * V9 - Récupère et affiche le Plan Comptable (CoA).
 */
async function renderChartOfAccountsView() {
    const companyId = window.userContext.entrepriseContextId;
    
    try {
        const companyFilter = `?companyId=${companyId}`;
        const endpoint = `/accounting/chart-of-accounts${companyFilter}`;
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        // Assume response.data is an array of accounts: [{id, code, name, type, balance, lastUsed}]
        appState.filteredData.accounts = response.data || response;

        return generateChartOfAccountsHTML(appState.filteredData.accounts);

    } catch (error) {
        return `<div class="max-w-xl mx-auto p-8 text-center text-danger">
            <h3 class="font-bold">Erreur de chargement du Plan Comptable.</h3>
            <p class="text-sm">${error.message}</p>
        </div>`;
    }
}

/**
 * V9 - Génère le HTML pour l'affichage du Plan Comptable, incluant le solde et les actions.
 */
function generateChartOfAccountsHTML(accounts) {
    const companyName = window.userContext.entrepriseContextName;
    
    const rows = accounts.map(account => `
        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-3 font-bold">${account.code}</td>
            <td class="px-6 py-3">${account.name}</td>
            <td class="px-6 py-3">${account.type}</td>
            
            <td class="px-6 py-3 text-right font-black">
                ${(account.balance || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
            </td>
            
            <td class="px-6 py-3 text-sm text-gray-500">
                 ${account.lastUsed ? new Date(account.lastUsed).toLocaleDateString('fr-FR') : 'N/A'} 
            </td>

            <td class="px-6 py-3 whitespace-nowrap">
                <button onclick="showAccountModal(${account.id}, '${account.code}', '${account.name}')" 
                    class="text-primary hover:text-primary-dark font-bold mr-3">Modifier</button>
                <button onclick="handleDeleteAccount(${account.id})" 
                    class="text-danger hover:text-danger-dark font-bold">Supprimer</button>
            </td>
        </tr>
    `).join('');

    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Plan Comptable SYSCOHADA</h3>
        <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-500">Affiche les comptes de la compagnie: **${companyName}**.</p>
            <button onclick="showAccountModal(null)" class="bg-success text-white py-2 px-4 rounded-xl font-bold hover:bg-success-dark transition-colors">
                <i class="fas fa-plus-circle mr-2"></i> Ajouter Compte
            </button>
        </div>
        <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">Code</th>
                        <th scope="col" class="px-6 py-3">Libellé du Compte</th>
                        <th scope="col" class="px-6 py-3">Type</th>
                        <th scope="col" class="px-6 py-3 text-right">Solde Actuel (XOF)</th>
                        <th scope="col" class="px-6 py-3">Dernière Utilisation</th>
                        <th scope="col" class="px-6 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length > 0 ? rows : `<tr><td colspan="6" class="text-center py-8">Aucun compte trouvé.</td></tr>`}
                </tbody>
            </table>
        </div>`;
}

/**
 * V9 - Fonction asynchrone pour générer le rapport et ouvrir la modale.
 */
async function generateReportAndOpenModal(companyId) {
    try {
        NotificationManager.show("Récupération des données du rapport financier...", 'info');
        const companyFilter = `?companyId=${companyId}`;
        const endpoint = `/accounting/reports/bilan${companyFilter}`;
        
        const reportResponse = await apiFetch(endpoint, { method: 'GET' }); 
        
        appState.filteredData.financialReport = reportResponse.data || reportResponse; 

        NotificationManager.hide();
        ModalManager.open("Bilan SYSCOHADA (Période Actuelle)", generateReportHTML(appState.filteredData.financialReport));
        
    } catch (error) {
        NotificationManager.show(`Échec de la génération du rapport: ${error.message}`, 'error', 10000);
    }
}

/**
 * V9 - Génère le HTML pour les rapports financiers (incluant les boutons d'action et le drill-down).
 */
function generateReportHTML(reportData) {
    // Simulation d'une structure de données de rapport pour l'affichage
    const simulatedReport = reportData.Actif ? reportData : {
        'Actif': [
            { title: 'Trésorerie Actif', value: 210000, detailUrl: 'account=571' },
            { title: 'Créances Clients', value: 800000, detailUrl: 'account=411' },
        ],
        'Passif': [
            { title: 'Dettes Fournisseurs', value: 150000, detailUrl: 'account=401' },
            { title: 'Capitaux Propres', value: 960000, detailUrl: null },
        ]
    };

    let html = `<div class="mb-4 flex justify-end space-x-3">
        <button onclick="exportReport('csv')" class="btn-icon bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20"><i class="fas fa-file-csv mr-2"></i> Export CSV</button>
        <button onclick="exportReport('pdf')" class="btn-icon bg-danger/10 text-danger p-2 rounded-xl hover:bg-danger/20"><i class="fas fa-file-pdf mr-2"></i> Export PDF</button>
    </div>
    <div class="space-y-6">`;

    for (const section in simulatedReport) {
        html += `<h4 class="text-xl font-black text-secondary mt-4 border-b pb-2">${section}</h4>`;
        simulatedReport[section].forEach(item => {
            const totalCliquable = item.detailUrl 
                ? `<a href="#" onclick="handleDrillDown('${item.detailUrl}', '${item.title}')" class="font-black text-primary hover:underline">${(item.value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</a>`
                : `<span class="font-black">${(item.value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</span>`;

            html += `<div class="flex justify-between border-b border-dashed py-2 text-gray-700 dark:text-gray-300">
                <span>${item.title}</span>
                ${totalCliquable}
            </div>`;
        });
    }

    html += `</div>`;
    return html;
}

/**
 * V9 - Vue du Journal des Écritures (supporte le Drill-down)
 */
async function renderJournalView(extraData) {
    const companyId = window.userContext.entrepriseContextId;
    if (!companyId) return renderAccessDenied("Veuillez sélectionner une entreprise pour accéder au Journal.");
    
    const companyFilter = `?companyId=${companyId}${extraData && extraData.filter ? `&${extraData.filter}` : ''}`;
    const drillDownTitle = extraData && extraData.drillDownTitle ? extraData.drillDownTitle : 'Journal Général';

    try {
        const endpoint = `/accounting/journal${companyFilter}`;
        // const response = await apiFetch(endpoint, { method: 'GET' }); 
        // const journalEntries = response.data || response;
        
        // MOCK de données de journal
        const journalEntries = [
             { id: 101, date: '2025-01-15', libelle: `Écriture pour ${drillDownTitle}`, debit: 50000, credit: 0, journal: 'AC', status: 'Validé' },
             { id: 102, date: '2025-01-16', libelle: 'Écriture de test standard', debit: 0, credit: 150000, journal: 'VT', status: 'Brouillon' },
        ];
        
        appState.filteredData.journalEntries = journalEntries;

        return generateJournalHTML(journalEntries, drillDownTitle);
        
    } catch (error) {
         return `<div class="max-w-xl mx-auto p-8 text-center text-danger">
            <h3 class="font-bold">Erreur de chargement du Journal.</h3>
            <p class="text-sm">${error.message}</p>
        </div>`;
    }
}

// =================================================================================
// 6. HELPERS V9 (MOCKS pour Notification/Modal)
// =================================================================================

const NotificationManager = {
    show: (message, type = 'info', duration = 5000) => {
        console.log(`[NOTIF ${type.toUpperCase()}] ${message}`);
        // Implémentation réelle non nécessaire dans le script.js
    },
    hide: () => {
        console.log('[NOTIF] Cachée.');
    }
};

const ModalManager = {
    open: (title, content, id = 'generic-modal') => {
        console.log(`[MODAL OPEN] Titre: ${title}`);
        const existing = document.getElementById(id);
        if (existing) existing.remove(); // S'assurer qu'une seule modale est ouverte
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300">
                <div class="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 class="text-2xl font-bold text-primary">${title}</h3>
                    <button onclick="ModalManager.close('${id}')" class="text-gray-500 hover:text-danger text-3xl font-light leading-none">&times;</button>
                </div>
                <div class="p-6">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    close: (id = 'generic-modal') => {
        console.log(`[MODAL CLOSE] ID: ${id}`);
        const modal = document.getElementById(id);
        if (modal) {
            modal.remove();
        }
    }
};

window.handleDrillDown = function(filterQuery, title) {
    ModalManager.close('generic-modal'); // Fermer la modale du rapport
    // Changer de vue vers le journal avec le filtre approprié
    loadView('journal', { filter: filterQuery, drillDownTitle: title }); 
}

window.exportReport = async function(format) {
    try {
        NotificationManager.show(`Génération du rapport ${format.toUpperCase()}...`, 'info', 5000);
        const companyFilter = `?companyId=${window.userContext.entrepriseContextId}&format=${format}`;
        window.open(`${API_BASE_URL}/accounting/reports/export/bilan${companyFilter}`, '_blank');
        NotificationManager.show(`Export ${format.toUpperCase()} démarré. Vérifiez vos téléchargements.`, 'success');
    } catch (error) {
        NotificationManager.show(`Échec de l'export : ${error.message}`, 'error', 10000);
    }
}

window.handleDeleteAccount = async function(accountId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) return;
    NotificationManager.show(`Tentative de suppression du compte ID ${accountId}.`, 'warning');
    try {
        await apiFetch(`/accounting/chart-of-accounts/${accountId}?companyId=${window.userContext.entrepriseContextId}`, {
            method: 'DELETE',
        });
        NotificationManager.show(`Compte ID ${accountId} supprimé avec succès.`, 'success');
        loadView('chart-of-accounts'); 
    } catch (error) {
        NotificationManager.show(`Échec de la suppression: ${error.message}`, 'error', 10000);
    }
}

window.showAccountModal = function(accountId = null, code = '', name = '') {
    const isEdit = accountId !== null;
    ModalManager.open(
        isEdit ? `Modifier le Compte: ${name}` : "Créer un Nouveau Compte",
        `<p class="p-4">${isEdit ? `Modification du compte ${code}` : 'Saisie d\'un nouveau compte'}. (Formulaire complet à implémenter)</p>`,
        'modal-account-form'
    );
}

function generateJournalHTML(entries, title) {
    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">${title}</h3>
        <p class="text-sm text-gray-500">Affiche ${entries.length} écritures.</p>
        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner mt-4 text-center">
             <p>Tableau d'affichage des écritures comptables à implémenter ici.</p>
        </div>`;
}

// =================================================================================
// 7. HELPERS DE RENDU (Fin du fichier original)
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
    <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports SYSCOHADA (Accès V9)</h3>
    <ul class="space-y-3 text-sm">
    <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
    <span>Générer le Bilan / TFR</span>
    <button class="text-info hover:text-primary" onclick="loadView('reports')"><i class="fas fa-file-invoice-dollar mr-1"></i> Ouvrir la vue</button>
    </li>
    <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
    <span>Grand Livre</span>
    <button class="text-info hover:text-primary" onclick="loadView('journal', { drillDownTitle: 'Grand Livre Complet' })"><i class="fas fa-book mr-1"></i> Voir</button>
    </li>
    <li class="flex justify-between items-center p-2">
    <span>Balance Générale</span>
    <button class="text-info hover:text-primary" onclick="alert('Génération Balance...')"><i class="fas fa-table mr-1"></i> Télécharger</button>
    </li>
    </ul>
    </div>
    `;
}
function renderNotFound() {
    return '<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>';
}
function renderAccessDenied(message = "Accès refusé. Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.") {
    return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl">
    <i class="fas fa-lock fa-3x text-danger mb-4"></i>
    <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3>
    <p>${message}</p>
    </div>`;
}

function renderReportsView() {
    const companyId = window.userContext.entrepriseContextId;
    if (!companyId) {
        return renderAccessDenied("Veuillez sélectionner une entreprise pour générer les rapports.");
    }
    
    const loadingHTML = `<div class="p-8 text-center bg-info bg-opacity-10 rounded-xl"><i class="fas fa-chart-pie fa-2x text-info mb-3"></i><p class="text-info font-bold">Génération du Bilan en cours...</p></div>`;
    
    generateReportAndOpenModal(companyId);

    return loadingHTML + `
        <div class="mt-8 text-center">
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
// 8. INITIALISATION ET GESTION DES ÉVÉNEMENTS
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
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // CRITIQUE: Empêche le rafraîchissement
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgElement = document.getElementById('login-message');
            msgElement.textContent = 'Connexion en cours...';
            msgElement.classList.remove('hidden', 'text-danger', 'text-success');
            try {
                const context = await handleLogin(email, password);
                if (context) {
                    msgElement.classList.add('hidden');
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
