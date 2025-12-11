// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : OPTIMALE 4.1 - CORRECTION CRITIQUE CONNEXION ET FORMULAIRES
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE
// =================================================================================

const API_BASE_URL = 'https://congenial-spork-wr457x76x5q42vj65-3000.app.github.dev/api';
window.userContext = null;

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 2. AUTHENTIFICATION ET CONTEXTE (ALIGNÉ SERVEUR + CONTOURNEMENT PONCTUEL)
// =================================================================================

/**
 * Connexion utilisateur via l'API serveur.
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(email, password) {
    // 🔴 CONTOURNEMENT PONCTUEL (MOCK)
    if (email.startsWith('mock_')) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simuler le délai réseau
        const mockRole = email.split('_')[1].toUpperCase();
        
        if (ROLES[mockRole]) {
             return {
                utilisateurRole: mockRole,
                utilisateurId: `USR_MOCK_${mockRole}`,
                utilisateurNom: `Utilisateur ${mockRole}`,
                token: 'jwt.mock.user',
                // Logique simplifiée du contexte mock
                entrepriseContextId: (mockRole === ROLES.ADMIN || mockRole === ROLES.COLLABORATEUR) ? null : 'ENT_001',
                entrepriseContextName: (mockRole === ROLES.ADMIN || mockRole === ROLES.COLLABORATEUR) ? 'Aucune sélectionnée' : 'Entreprise Test Mono',
                multiEntreprise: (mockRole === ROLES.ADMIN || mockRole === ROLES.COLLABORATEUR)
            };
        }
    }
    
    // LOGIQUE RÉELLE DE L'API
    const endpoint = `${API_BASE_URL}/auth/login`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
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
            throw new Error('Serveur injoignable. Vérifiez que le serveur tourne sur http://localhost:3000');
        }
        throw error;
    }
}

/**
 * Inscription (MOCK côté client - endpoint serveur à créer)
 */
async function handleRegistration(payload) {
    console.warn('⚠️ INSCRIPTION EN MODE MOCK - Créez POST /api/auth/register sur le serveur');
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
 */
async function fetchUserCompanies(context) {
    if (!context || !context.utilisateurId) {
        return [];
    }
    
    // TEMPORAIRE MOCK : Simuler des données
    if (context.utilisateurId.startsWith('USR_MOCK_')) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [
            { id: 'ENT_001', name: 'Alpha Consulting SARL', stats: { transactions: 50, result: 1500000, pending: 3, cash: 500000 } },
            { id: 'ENT_002', name: 'Bêta Distribution', stats: { transactions: 120, result: 4500000, pending: 8, cash: 1200000 } },
            { id: 'ENT_003', name: 'Gamma Services', stats: { transactions: 30, result: -50000, pending: 1, cash: 150000 } }
        ];
    }
    
    // LOGIQUE RÉELLE
    const endpoint = `${API_BASE_URL}/companies/${context.utilisateurId}`;
    // ... suite de la logique fetch réelle
    return []; // Placeholder pour éviter erreur si API réelle manque
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
        updateNavigationMenu(window.userContext.utilisateurRole);
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
    
    // Le HTML doit avoir ces ID pour fonctionner
    const authView = document.getElementById('auth-view');
    if (authView) authView.classList.add('hidden');
    
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) dashboardView.classList.remove('hidden');

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);
    loadView('dashboard');
}

/**
 * Met à jour le header avec les informations contextuelles
 */
function updateHeaderContext(context) {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        const firstName = context.utilisateurNom.split(' ')[0];
        welcomeMessage.textContent = `Bienvenue, ${firstName}`;
    }
    
    const currentRole = document.getElementById('current-role');
    if (currentRole) currentRole.textContent = context.utilisateurRole;
    
    const currentCompanyName = document.getElementById('current-company-name');
    if (currentCompanyName) currentCompanyName.textContent = context.entrepriseContextName || '-- Global --';
    
    const contextMessage = document.getElementById('context-message');
    if (contextMessage) {
        if (context.multiEntreprise && !context.entrepriseContextId) {
            contextMessage.textContent = '⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.';
        } else {
            contextMessage.textContent = `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`;
        }
    }
}

/**
 * Construit le menu de navigation selon le rôle
 */
function updateNavigationMenu(role) {
    const navMenu = document.getElementById('role-navigation-menu');
    if (!navMenu) return; 
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
    if (!contentArea) return; 
    
    // Message de chargement qui est écrasé juste après
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>';

    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];
    
    // 🛑 GUARDRAIL CRITIQUE
    if (window.userContext && requiresContext.includes(viewName) && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) {
        alert('🚨 Opération Bloquée. Veuillez sélectionner une entreprise.');
        return renderEnterpriseSelectorView(viewName);
    }
    
    switch (viewName) {
        case 'dashboard':
            contentArea.innerHTML = await renderDashboard(window.userContext);
            break;
        case 'saisie':
            contentArea.innerHTML = renderSaisieFormCaissier(window.userContext.entrepriseContextName);
            break;
        case 'journal-entry':
            contentArea.innerHTML = renderJournalEntryForm(window.userContext.entrepriseContextName);
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
    
    // 🟢 CORRECTION CRITIQUE : Exécuter la logique JavaScript après le rendu du contenu HTML
    attachViewSpecificListeners(viewName);
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
        
        // Attacher les événements de sélection
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

/**
 * Rendu principal du dashboard selon le rôle et le contexte
 */
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

/**
 * Dashboard Admin Global
 */
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
        `;
}

/**
 * Dashboard Collaborateur Global
 */
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
        `;
}

/**
 * Dashboard Admin/Collab avec contexte entreprise
 */
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
                <a href="#" id="change-context-link" class="text-danger hover:underline font-bold ml-2">
                    <i class="fas fa-undo"></i> Changer
                </a>
            </p>
            <button id="quick-entry-button" class="py-1 px-4 bg-secondary text-white rounded-lg text-sm">
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

// ... (renderUserDashboard, renderCaissierDashboard, etc. inchangés)

// =================================================================================
// 5. HELPERS DE RENDU (Ajoutés pour complétude)
// =================================================================================

function generateStatCard(icon, title, value, colorClass) {
    return `
        <div class="p-5 ${colorClass} text-white rounded-xl shadow-lg flex items-center justify-between">
            <div>
                <p class="text-sm opacity-75">${title}</p>
                <h3 class="text-2xl font-bold mt-1">${value}</h3>
            </div>
            <i class="${icon} fa-2x opacity-50"></i>
        </div>
    `;
}

function renderActivityFeed() {
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-primary mb-4">Fil d'Activité Récente</h3>
            <ul class="space-y-4">
                <li class="flex items-center text-sm"><i class="fas fa-angle-right text-success mr-2"></i> Opération #123 Validée par Admin</li>
                <li class="flex items-center text-sm"><i class="fas fa-angle-right text-warning mr-2"></i> Écriture Journal en attente: FACT-042</li>
                <li class="flex items-center text-sm"><i class="fas fa-angle-right text-info mr-2"></i> Nouvel utilisateur 'Bob' ajouté</li>
            </ul>
        </div>
    `;
}

function renderAccountingReports() {
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-primary mb-4">Rapports Compta Rapides</h3>
            <ul class="space-y-3">
                <li><a href="#" class="text-info hover:text-primary"><i class="fas fa-file-invoice-dollar mr-2"></i> Bilan Provisoire</a></li>
                <li><a href="#" class="text-info hover:text-primary"><i class="fas fa-chart-pie mr-2"></i> Compte de Résultat (Mois)</a></li>
                <li><a href="#" class="text-info hover:text-primary"><i class="fas fa-table mr-2"></i> Grand Livre du Mois</a></li>
            </ul>
        </div>
    `;
}

function renderNotFound() {
    return `
        <div class="text-center p-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <i class="fas fa-ghost fa-4x text-gray-400 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-300">Vue Non Trouvée</h2>
            <p>Le contenu demandé n'est pas encore implémenté.</p>
        </div>
    `;
}

function renderAccessDenied() {
     return `
        <div class="text-center p-12 bg-danger bg-opacity-10 rounded-xl border-4 border-danger">
            <i class="fas fa-lock fa-4x text-danger mb-4"></i>
            <h2 class="text-2xl font-bold text-danger">Accès Refusé</h2>
            <p>Vous n'avez pas les autorisations nécessaires pour accéder à cette vue.</p>
        </div>
    `;
}

function renderReportsView() {
     return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-primary mb-6">Génération d'États Financiers</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Sélectionnez le type de rapport et la période.</p>
            <div class="grid grid-cols-2 gap-6">
                <div class="p-4 bg-info bg-opacity-10 rounded-lg">
                    <h4 class="font-bold text-info mb-2"><i class="fas fa-balance-scale mr-2"></i> Bilan & Compte de Résultat</h4>
                    <button class="w-full py-2 mt-2 bg-info text-white rounded-lg">Générer (PDF)</button>
                </div>
                <div class="p-4 bg-secondary bg-opacity-10 rounded-lg">
                    <h4 class="font-bold text-secondary mb-2"><i class="fas fa-table mr-2"></i> Grand Livre & Journal</h4>
                    <button class="w-full py-2 mt-2 bg-secondary text-white rounded-lg">Générer (Excel)</button>
                </div>
            </div>
        </div>
    `;
}

// =================================================================================
// 6. RENDUS DES FORMULAIRES DE SAISIE
// =================================================================================
// (Les fonctions renderSaisieFormCaissier, renderJournalEntryForm, renderCreateCompanyForm 
// et les autres vues sont complètes et restent inchangées par rapport à la réponse précédente
// pour garantir la présence des ID nécessaires à la section 7.5.)

function renderSaisieFormCaissier(companyName) {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie Simplifiée des Flux (Caisse)</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Enregistrement des recettes et dépenses pour <strong>${companyName}</strong>.</p>
            
            <form id="simple-flux-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Type de Flux <span class="text-danger">*</span></label>
                        <select id="flux-type" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="recette">Recette (Entrée d'argent)</option>
                            <option value="depense">Dépense (Sortie d'argent)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Montant (XOF) <span class="text-danger">*</span></label>
                        <input type="number" id="flux-amount" required min="1" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: 50000">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium">Libellé de l'Opération <span class="text-danger">*</span></label>
                    <input type="text" id="flux-label" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: Vente de marchandises / Achat de fournitures">
                </div>
                
                <p id="flux-message" class="text-center text-sm font-bold hidden"></p>
                
                <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition">
                    <i class="fas fa-save mr-2"></i> Enregistrer le Flux
                </button>
            </form>
        </div>
    `;
}

function renderJournalEntryForm(companyName) {
    return `
        <div class="max-w-5xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie d'Écriture Journal (TR)</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Enregistrement comptable détaillé (Débit/Crédit) pour <strong>${companyName}</strong>.</p>
            
            <form id="journal-entry-form" class="space-y-6">
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Référence Pièce <span class="text-danger">*</span></label>
                        <input type="text" id="entry-ref" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: FACT-001">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Date <span class="text-danger">*</span></label>
                        <input type="date" id="entry-date" required value="${new Date().toISOString().slice(0, 10)}" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Journal <span class="text-danger">*</span></label>
                        <select id="entry-journal" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="TR">Trésorerie</option>
                            <option value="AC">Achats</option>
                            <option value="VE">Ventes</option>
                        </select>
                    </div>
                </div>

                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Compte</th>
                                <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Libellé</th>
                                <th class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider">Montant Débit (XOF)</th>
                                <th class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider">Montant Crédit (XOF)</th>
                            </tr>
                        </thead>
                        <tbody id="accounting-lines" class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            <tr class="line-item">
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <input type="text" placeholder="Ex: 571" class="w-20 border-b dark:bg-gray-800 dark:text-white" required>
                                </td>
                                 <td class="px-3 py-2 whitespace-nowrap">
                                    <input type="text" placeholder="Libellé de l'opération" class="w-full border-b dark:bg-gray-800 dark:text-white" required>
                                </td>
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <input type="number" step="0.01" value="" class="w-full debit-input border-b dark:bg-gray-800 dark:text-white text-right">
                                </td>
                                <td class="px-3 py-2 whitespace-nowrap">
                                    <input type="number" step="0.01" value="" class="w-full credit-input border-b dark:bg-gray-800 dark:text-white text-right">
                                </td>
                            </tr>
                        </tbody>
                        <tfoot class="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <td colspan="2" class="px-3 py-2 text-right text-sm font-bold">TOTAL :</td>
                                <td class="px-3 py-2 text-right text-sm font-bold text-success" id="total-debit">0 XOF</td>
                                <td class="px-3 py-2 text-right text-sm font-bold text-danger" id="total-credit">0 XOF</td>
                            </tr>
                            <tr>
                                <td colspan="4" class="px-3 py-2 text-center text-sm font-bold" id="balance-check">
                                    <i class="fas fa-balance-scale mr-2"></i> ÉQUILIBRÉ
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="flex justify-between items-center">
                    <button type="button" onclick="window.addAccountingLine()" class="py-2 px-4 bg-info text-white rounded-lg text-sm hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i> Ajouter une ligne
                    </button>
                    
                    <p id="saisie-message" class="text-center text-sm font-bold hidden"></p>

                    <button type="submit" class="py-3 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition">
                        <i class="fas fa-paper-plane mr-2"></i> Soumettre l'Écriture
                    </button>
                </div>
            </form>
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
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium">Sigle</label>
                        <input type="text" id="new-company-sigle" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: SNV">
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Devise <span class="text-danger">*</span></label>
                        <select id="new-company-currency" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="XOF">XOF - Franc CFA (UEMOA)</option>
                            <option value="XAF">XAF - Franc CFA (CEMAC)</option>
                        </select>
                    </div>
                </div>
                <p id="company-creation-message" class="text-center text-sm hidden"></p>
                <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition">
                    <i class="fas fa-plus-circle mr-2"></i> Créer l'Entreprise (MOCK)
                </button>
            </form>
        </div>
    `;
}

function generateValidationTable() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center">
            <i class="fas fa-check-double fa-4x text-success mb-6"></i>
            <h2 class="text-3xl font-extrabold text-success mb-4">Espace de Validation des Opérations</h2>
            <p class="text-gray-700 dark:text-gray-300 mb-6">Liste des transactions en attente de vérification par un collaborateur ou un administrateur.</p>
             <button onclick="loadView('dashboard')" class="py-2 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition">
                Retour au Tableau de Bord
            </button>
        </div>
    `;
}

function renderUserManagementView() {
     return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-info mb-6">Gestion des Utilisateurs</h2>
            <div class="p-4 bg-info bg-opacity-10 border-l-4 border-info rounded-xl mb-6">
                <h3 class="text-xl font-bold text-info">Création / Modification des comptes</h3>
                <p class="text-sm">Endpoint à implémenter sur le serveur.</p>
            </div>
            ${renderUserList()}
        </div>
    `;
}

function renderUserList() {
    const mockUsers = [
        { id: 1, name: 'Alice Admin', role: 'ADMIN', email: 'mock_admin@app.com', status: 'Actif' },
        { id: 2, name: 'Bob Collaborateur', role: 'COLLABORATEUR', email: 'mock_collaborateur@app.com', status: 'Actif' },
        { id: 3, name: 'Charlie Caissier', role: 'CAISSIER', email: 'mock_caissier@app.com', status: 'Inactif' }
    ];
    
    const rows = mockUsers.map(user => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-danger text-white' : 'bg-primary bg-opacity-10 text-primary'}">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                 <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Actif' ? 'bg-success text-white' : 'bg-danger text-white'}">
                    ${user.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-info hover:text-primary mr-3">Modifier</a>
                <a href="#" class="text-danger hover:text-red-700">Supprimer</a>
            </td>
        </tr>
    `).join('');

    return `
        <div class="mt-8 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// =================================================================================
// 7.5 LOGIQUE DE GESTION POST-RENDU DES VUES (CORRECTION DU PROBLÈME 'CHARGEMENT...')
// =================================================================================

/**
 * Attache les gestionnaires d'événements spécifiques aux formulaires/vues après leur rendu.
 * Doit être appelée à la fin de loadView.
 */
function attachViewSpecificListeners(viewName) {
    // Logique pour les Dashboards (Sélecteur d'entreprise)
    if (viewName === 'dashboard') {
        // Logique de sélection d'entreprise dans le Dashboard Admin/Collab Global
        const companySelector = document.getElementById('company-selector');
        if (companySelector) {
            companySelector.addEventListener('change', function() {
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
        }
        
        // Logique du bouton "Changer" dans le Dashboard Spécifique Entreprise
        const changeContextLink = document.getElementById('change-context-link');
        if (changeContextLink) {
             changeContextLink.addEventListener('click', (e) => {
                e.preventDefault();
                changeCompanyContext(null, '-- Global --');
             });
        }
        
        // Logique du bouton "Saisie Rapide"
         const quickEntryButton = document.getElementById('quick-entry-button');
        if (quickEntryButton) {
             quickEntryButton.addEventListener('click', () => {
                loadView('journal-entry');
             });
        }
    }
    
    // Logique pour le Formulaire de Saisie Simplifiée des Flux
    if (viewName === 'saisie') {
        const fluxForm = document.getElementById('simple-flux-form');
        if (fluxForm) {
             fluxForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('flux-message');
                const fluxType = document.getElementById('flux-type').value === 'recette' ? 'Recette' : 'Dépense';
                
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = `✅ ${fluxType} enregistrée pour ${window.userContext.entrepriseContextName}. ${fluxType === 'Dépense' ? 'Soumise à validation.' : ''}`;
                msgElement.classList.add('text-success');
                 setTimeout(() => {
                     msgElement.classList.add('hidden');
                     fluxForm.reset();
                 }, 4000);
            });
        }
    } 
    
    // Logique pour le Formulaire de Saisie d'Écriture Journal
    else if (viewName === 'journal-entry') {
        const form = document.getElementById('journal-entry-form');
        if (form) {
            
            // Fonction d'aide pour l'ajout de ligne
            window.addAccountingLine = function() {
                const accountingLines = document.getElementById('accounting-lines');
                const newRowHtml = `
                    <tr class="line-item">
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="text" placeholder="Ex: 601" class="w-20 border-b dark:bg-gray-800 dark:text-white" required>
                        </td>
                         <td class="px-3 py-2 whitespace-nowrap">
                            <input type="text" placeholder="Libellé de l'opération" class="w-full border-b dark:bg-gray-800 dark:text-white" required>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="number" step="0.01" value="" class="w-full debit-input border-b dark:bg-gray-800 dark:text-white text-right">
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="number" step="0.01" value="" class="w-full credit-input border-b dark:bg-gray-800 dark:text-white text-right">
                        </td>
                    </tr>
                `;
                accountingLines.insertAdjacentHTML('beforeend', newRowHtml);
                updateTotals(); // Mettre à jour après ajout
            };
            
            // Logique de calcul des totaux Débit/Crédit
            const updateTotals = () => {
                let totalDebit = 0;
                let totalCredit = 0;
                
                document.querySelectorAll('.debit-input').forEach(input => {
                    totalDebit += parseFloat(input.value || 0);
                });
                
                document.querySelectorAll('.credit-input').forEach(input => {
                    totalCredit += parseFloat(input.value || 0);
                });
                
                const diff = Math.abs(totalDebit - totalCredit);
                
                document.getElementById('total-debit').textContent = totalDebit.toLocaleString('fr-FR') + ' XOF';
                document.getElementById('total-credit').textContent = totalCredit.toLocaleString('fr-FR') + ' XOF';
                
                const balanceCheck = document.getElementById('balance-check');
                balanceCheck.classList.remove('text-success', 'text-danger');
                
                if (diff < 0.01) { // Tolérance de float
                    balanceCheck.innerHTML = '<i class="fas fa-balance-scale mr-2"></i> ÉQUILIBRÉ';
                    balanceCheck.classList.add('text-success');
                } else {
                    balanceCheck.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> DÉSÉQUILIBRÉ (${diff.toLocaleString('fr-FR')} XOF)`;
                    balanceCheck.classList.add('text-danger');
                }
            };
            
            // Attacher les écouteurs aux inputs existants et futurs
            form.addEventListener('input', (e) => {
                if (e.target.classList.contains('debit-input') || e.target.classList.contains('credit-input')) {
                    updateTotals();
                }
            });
            
            // Initialisation des totaux
            updateTotals();
            
            // Soumission du formulaire
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('saisie-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                
                const totalDebitText = document.getElementById('total-debit').textContent;
                const totalCreditText = document.getElementById('total-credit').textContent;
                
                // Nettoyer pour la conversion
                const totalDebit = parseFloat(totalDebitText.replace(/[^\d,\.]/g, '').replace(',', '.')); 
                const totalCredit = parseFloat(totalCreditText.replace(/[^\d,\.]/g, '').replace(',', '.'));
                
                if (Math.abs(totalDebit - totalCredit) > 0.01) { 
                    msgElement.textContent = "❌ L'écriture n'est pas équilibrée (Débit ≠ Crédit). Correction requise.";
                    msgElement.classList.add('text-danger');
                } else {
                    msgElement.textContent = `✅ Écriture Journal (TR) enregistrée avec succès pour ${window.userContext.entrepriseContextName}. Soumise à validation.`;
                    msgElement.classList.remove('text-danger');
                    msgElement.classList.add('text-success');
                     setTimeout(() => {
                         msgElement.classList.add('hidden');
                         form.reset();
                         // Retirer les lignes supplémentaires si nécessaire
                         document.getElementById('accounting-lines').innerHTML = document.getElementById('accounting-lines').querySelector('.line-item').outerHTML;
                         updateTotals(); // Réinitialiser les totaux
                     }, 4000);
                }
            });
        }
    } 
    
    // Logique pour le Formulaire de Création d'Entreprise
    else if (viewName === 'create-company') {
        const companyForm = document.getElementById('new-company-form');
        if (companyForm) {
            companyForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('company-creation-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                
                const payload = {
                    companyName: document.getElementById('new-company-name').value,
                    sigle: document.getElementById('new-company-sigle').value,
                    currency: document.getElementById('new-company-currency').value
                };
                
                msgElement.textContent = `Création de l'entreprise ${payload.companyName} en cours...`;

                // NOTE: handleRegistration est un MOCK
                const newCompanyContext = await handleRegistration(payload);
                
                msgElement.textContent = `🎉 L'entreprise ${newCompanyContext.entrepriseContextName} a été créée et sélectionnée.`;
                msgElement.classList.add('text-success');
                
                // Rediriger ou mettre à jour le contexte (optionnel)
                setTimeout(() => {
                    loadView('dashboard');
                }, 2000);
            });
        }
    }
}


// =================================================================================
// 8. INITIALISATION ET GESTIONNAIRE D'ÉVÉNEMENTS (CORRECTION CRITIQUE)
// =================================================================================

/**
 * Attache les gestionnaires d'événements DOM nécessaires au chargement de la page.
 * C'est cette fonction qui corrige le problème de connexion en garantissant que 
 * le formulaire existe avant d'essayer de lui attacher l'événement 'submit'.
 */
function attachEventListeners() {
    const loginForm = document.getElementById('login-form');
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');

    // Vérification cruciale : Si le formulaire de connexion existe, on attache l'écouteur.
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const loginMessage = document.getElementById('login-message');

            if (!emailInput || !passwordInput || !loginMessage) {
                console.error("Éléments de connexion manquants dans le HTML.");
                return;
            }
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            loginMessage.textContent = 'Connexion en cours...';
            loginMessage.classList.remove('hidden', 'text-danger', 'text-success');
            
            try {
                // Tente la connexion (réelle ou mockée)
                const userContext = await handleLogin(email, password);

                if (userContext) {
                    loginMessage.textContent = 'Connexion réussie ! Redirection...';
                    loginMessage.classList.add('text-success');
                    
                    // 🛑 DÉMARRAGE DE L'APPLICATION
                    setTimeout(() => {
                        initDashboard(userContext); 
                    }, 500); 
                } else {
                    // Ne devrait pas arriver si handleLogin gère les erreurs
                    loginMessage.textContent = '❌ Échec de la connexion. Email/Mot de passe invalide.';
                    loginMessage.classList.add('text-danger');
                }
            } catch (error) {
                loginMessage.textContent = `❌ Erreur: ${error.message}`;
                loginMessage.classList.add('text-danger');
                console.error('Erreur de connexion:', error);
            }
        });
    }

    // Gestionnaire pour le bouton de déconnexion
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.userContext = null;
            
            // Afficher la vue de connexion et cacher le tableau de bord
            if (authView) authView.classList.remove('hidden');
            if (dashboardView) dashboardView.classList.add('hidden');
            
            // Nettoyer l'URL
            window.history.pushState({}, '', '/'); 
            // Recharge pour réinitialiser l'état complet
            window.location.reload(); 
        });
    }
    
    // Au chargement, vérifier s'il existe déjà un contexte utilisateur (ex: sessionStorage), sinon afficher la vue d'authentification.
    // Pour cet exemple, nous partons du principe que nous commençons toujours par la connexion.
    if (authView && dashboardView) {
         authView.classList.remove('hidden');
         dashboardView.classList.add('hidden');
    }
}

// 🛑 LIGNE CRITIQUE : Démarre l'écoute des événements lorsque le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', attachEventListeners);
