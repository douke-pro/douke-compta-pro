// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : V12 - FIXE DES ROUTES DÉFENSIVES
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT (V12 FIXE)
// =================================================================================
let API_BASE_URL;

// CORRECTION CRITIQUE V12: L'URL de base (API_BASE_URL) ne contient PLUS le préfixe /api.
// Ce préfixe est ajouté manuellement dans les appels fetch ci-dessous.

if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
    // Codespaces/URL dynamique: utilise l'hôte et le protocole actuels (HTTPS)
    const protocol = window.location.protocol;
    const host = window.location.host;
    API_BASE_URL = protocol + '//' + host; 
    console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL (Host Only): ${API_BASE_URL}`);
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local: adresse standard HTTP
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
// 2. AUTHENTIFICATION ET CONTEXTE (ALIGNÉ SERVEUR)
// =================================================================================
/**
 * Connexion utilisateur via l'API serveur.
 * Endpoint: POST /api/auth/login
 */
async function handleLogin(email, password) {
    // V12 FIX: Ajout explicite du /api pour éviter le doublon ou l'oubli
    const url = `${API_BASE_URL}/api/auth/login`; [cite: 40]
    console.log(' 🔐  Tentative de connexion sur:', url); [cite: 41]
    try {
        const response = await fetch(url, { [cite: 43]
            method: 'POST', [cite: 44]
            headers: { 'Content-Type': 'application/json' }, [cite: 45]
            body: JSON.stringify({ email, password }) [cite: 46]
        });
        const data = await response.json(); [cite: 48]
        if (response.ok) {
            console.log(' ✅  Connexion r é ussie:', data.utilisateurRole); [cite: 50]
            return {
                utilisateurRole: data.utilisateurRole, [cite: 52]
                utilisateurId: data.utilisateurId, [cite: 53]
                utilisateurNom: data.utilisateurNom, [cite: 54]
                token: data.token, [cite: 55]
                entrepriseContextId: data.entrepriseContextId || null, [cite: 56]
                entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée', [cite: 57]
                multiEntreprise: data.multiEntreprise || false [cite: 58]
            };
        } else {
            throw new Error(data.error || 'Erreur de connexion inconnue'); [cite: 61]
        }
    } catch (error) {
        if (error.message === 'Failed to fetch') { [cite: 64]
            throw new Error('Serveur injoignable. Vérifiez que le serveur est démarré.'); [cite: 65]
        }
        throw error; [cite: 67]
    }
}

/**
 * Inscription (MOCK côté client - endpoint serveur à créer)
 */
async function handleRegistration(payload) { [cite: 73]
    console.warn(' ⚠️  INSCRIPTION EN MODE MOCK - Créez POST /api/auth/register sur le serveur'); [cite: 74]
    await new Promise(resolve => setTimeout(resolve, 1000)); [cite: 75]
    const mockContext = {
        utilisateurRole: 'USER', [cite: 77]
        utilisateurId: 'USR_NEW_' + Math.random().toString(36).substring(7), [cite: 78]
        utilisateurNom: payload.username, [cite: 79]
        token: 'jwt.mock.new.user', [cite: 80]
        entrepriseContextId: 'ENT_NEW_' + Math.random().toString(36).substring(7), [cite: 81]
        entrepriseContextName: payload.companyName, [cite: 82]
        multiEntreprise: false [cite: 83]
    };
    return mockContext; [cite: 85]
}

/**
 * Récupère les entreprises accessibles à l'utilisateur.
 * Endpoint: GET /api/companies/:userId
 */
async function fetchUserCompanies(context) { [cite: 91]
    if (!context || !context.utilisateurId) { [cite: 92]
        console.error(' ❌  Impossible de r é cup é rer les entreprises sans utilisateurId'); [cite: 93]
        return []; [cite: 94]
    }
    // V12 FIX: Ajout explicite du /api pour éviter le doublon ou l'oubli
    const url = `${API_BASE_URL}/api/companies/${context.utilisateurId}`; 
    console.log(' 📊  Récupération des entreprises:', url); [cite: 97]
    try {
        const response = await fetch(url, { [cite: 99]
            method: 'GET', [cite: 100]
            headers: { 'Content-Type': 'application/json' } [cite: 101]
        });
        const data = await response.json(); [cite: 103]
        if (response.ok && Array.isArray(data)) { [cite: 104]
            console.log(' ✅  Entreprises r é cup é r é es:', data.length); [cite: 105]
            return data; [cite: 106]
        } else {
            console.error(' ❌  Erreur r é cup é ration entreprises:', data.error || 'Erreur inconnue'); [cite: 108]
            return []; [cite: 109]
        }
    } catch (error) {
        console.error(' ❌  Erreur r é seau:', error); [cite: 112]
        return []; [cite: 113]
    }
}

/**
 * Simule les statistiques globales admin (MOCK - à implémenter côté serveur)
 */
async function fetchGlobalAdminStats() { [cite: 119]
    await new Promise(resolve => setTimeout(resolve, 300)); [cite: 120]
    return {
        totalCompanies: 4, [cite: 122]
        activeCompanies: 3, [cite: 123]
        collaborators: 6, [cite: 124]
        totalFiles: 120, [cite: 125]
        pendingRequests: 5, [cite: 126]
        pendingValidations: 8, [cite: 127]
    };
}

/**
 * Change le contexte entreprise pour utilisateurs multi-entreprises
 */
async function changeCompanyContext(newId, newName) { [cite: 133]
    if (window.userContext && window.userContext.multiEntreprise) { [cite: 134]
        window.userContext.entrepriseContextId = newId; [cite: 135]
        window.userContext.entrepriseContextName = newName; [cite: 136]
        await loadView('dashboard'); [cite: 137]
        updateHeaderContext(window.userContext); [cite: 138]
    }
}

// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================
/**
 * Initialise le dashboard après connexion réussie
 */
function initDashboard(context) { [cite: 147]
    window.userContext = context; [cite: 148]
    document.getElementById('auth-view').classList.add('hidden'); [cite: 149]
    const registerView = document.getElementById('register-view'); [cite: 150]
    if (registerView) { [cite: 151]
        registerView.classList.add('hidden'); [cite: 152]
    }
    document.getElementById('dashboard-view').classList.remove('hidden'); [cite: 154]
    updateHeaderContext(context); [cite: 155]
    updateNavigationMenu(context.utilisateurRole); [cite: 156]
    loadView('dashboard'); [cite: 157]
}

/**
 * Met à jour le header avec les informations contextuelles
 */
function updateHeaderContext(context) { [cite: 162]
    const firstName = context.utilisateurNom.split(' ')[0]; [cite: 163]
    document.getElementById('welcome-message').textContent = `Bienvenue, ${firstName}`; [cite: 164]
    document.getElementById('current-role').textContent = context.utilisateurRole; [cite: 165]
    document.getElementById('current-company-name').textContent = context.entrepriseContextName || '-- Global --'; [cite: 166]
    const contextMessage = document.getElementById('context-message'); [cite: 167]
    if (context.multiEntreprise && !context.entrepriseContextId) { [cite: 168]
        contextMessage.textContent = ' ⚠️  CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.'; [cite: 169]
    } else {
        contextMessage.textContent = `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`; [cite: 171]
    }
}

/**
 * Construit le menu de navigation selon le rôle
 */
function updateNavigationMenu(role) { [cite: 177]
    const navMenu = document.getElementById('role-navigation-menu'); [cite: 178]
    navMenu.innerHTML = ''; [cite: 179]
    let menuItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' } [cite: 181]
    ];
    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) { [cite: 183]
        menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' }); [cite: 184]
    }
    if (window.userContext && window.userContext.entrepriseContextId) { [cite: 186]
        menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' }); [cite: 187]
        if (role !== ROLES.CAISSIER) { [cite: 188]
            menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' }); [cite: 189]
            menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' }); [cite: 190]
            menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' }); [cite: 191]
        }
    }
    if (role === ROLES.ADMIN) { [cite: 194]
        menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' }); [cite: 195]
    }
    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) { [cite: 197]
        menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-sync-alt', view: 'selector' }); [cite: 198]
    }
    menuItems.forEach(item => { [cite: 200]
        const link = document.createElement('a'); [cite: 201]
        link.href = '#'; [cite: 202]
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200'; [cite: 203]
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`; [cite: 204]
        link.addEventListener('click', (e) => { [cite: 205]
            e.preventDefault(); [cite: 206]
            if (item.view === 'selector') { [cite: 207]
                renderEnterpriseSelectorView(); [cite: 208]
            } else {
                loadView(item.view); [cite: 210]
            }
        });
        navMenu.appendChild(link); [cite: 213]
    });
}

/**
 * Routage des vues selon le nom
 */
async function loadView(viewName) { [cite: 219]
    const contentArea = document.getElementById('dashboard-content-area'); [cite: 220]
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>'; [cite: 221]
    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports']; [cite: 222]
    if (requiresContext.includes(viewName) && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) { [cite: 223]
        alert(' 🚨  Opération Bloquée. Veuillez sélectionner une entreprise.'); [cite: 224]
        return renderEnterpriseSelectorView(viewName); [cite: 225]
    }
    switch (viewName) { [cite: 227]
        case 'dashboard': [cite: 228]
            contentArea.innerHTML = await renderDashboard(window.userContext); [cite: 229]
            break;
        case 'saisie': [cite: 231]
            contentArea.innerHTML = renderSaisieFormCaissier(); [cite: 232]
            break;
        case 'journal-entry': [cite: 234]
            contentArea.innerHTML = renderJournalEntryForm(); [cite: 235]
            break;
        case 'validation': [cite: 237]
            contentArea.innerHTML = generateValidationTable(); [cite: 238]
            break;
        case 'reports': [cite: 240]
            contentArea.innerHTML = renderReportsView(); [cite: 241]
            break;
        case 'create-company': [cite: 243]
            contentArea.innerHTML = renderCreateCompanyForm(); [cite: 244]
            break;
        case 'user-management': [cite: 246]
            if (window.userContext.utilisateurRole === ROLES.ADMIN) { [cite: 247]
                contentArea.innerHTML = renderUserManagementView(); [cite: 248]
            } else {
                contentArea.innerHTML = renderAccessDenied(); [cite: 250]
            }
            break;
        default:
            contentArea.innerHTML = renderNotFound(); [cite: 254]
    }
}

/**
 * Affiche le sélecteur d'entreprise pour les rôles multi-entreprises
 */
async function renderEnterpriseSelectorView(blockedViewName = null) { [cite: 260]
    const contentArea = document.getElementById('dashboard-content-area'); [cite: 261]
    contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p>Chargement des entreprises...</p></div>'; [cite: 262]
    try {
        const companies = await fetchUserCompanies(window.userContext); [cite: 264]
        let companyListHTML = ''; [cite: 265]
        if (companies.length === 0) { [cite: 266]
            companyListHTML = '<div class="p-6 text-center bg-warning bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée.</p></div>'; [cite: 267]
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
            `).join(''); [cite: 279]
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
        `; [cite: 290]
        contentArea.querySelectorAll('[data-company-id]').forEach(element => { [cite: 291]
            element.addEventListener('click', function() { [cite: 292]
                const companyId = this.getAttribute('data-company-id'); [cite: 293]
                const companyName = this.getAttribute('data-company-name'); [cite: 294]
                window.userContext.entrepriseContextId = companyId; [cite: 295]
                window.userContext.entrepriseContextName = companyName; [cite: 296]
                document.getElementById('current-company-name').textContent = companyName; [cite: 297]
                updateNavigationMenu(window.userContext.utilisateurRole); [cite: 298]
                loadView('dashboard'); [cite: 299]
            });
        });
    } catch (error) {
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-danger bg-opacity-10 border-4 border-danger rounded-xl text-center">
            <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
            <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
            <p class="text-lg">${error.message}</p>
            </div>
        `; [cite: 310]
    }
    updateHeaderContext(window.userContext); [cite: 311]
}

// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES
// =================================================================================
async function renderDashboard(context) { [cite: 316]
    if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && !context.entrepriseContextId) { [cite: 317]
        return context.utilisateurRole === ROLES.ADMIN ?
            await renderAdminGlobalDashboard(context) : [cite: 319]
            await renderCollaborateurGlobalDashboard(context); [cite: 320]
    }
    if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && context.entrepriseContextId) { [cite: 322]
        return await renderCompanySpecificDashboard(context); [cite: 323]
    }
    if (context.utilisateurRole === ROLES.USER) { [cite: 325]
        return await renderUserDashboard(context); [cite: 326]
    }
    if (context.utilisateurRole === ROLES.CAISSIER) { [cite: 328]
        return await renderCaissierDashboard(context); [cite: 329]
    }
    return renderNotFound(); [cite: 331]
}

async function renderAdminGlobalDashboard(context) { [cite: 333]
    const stats = await fetchGlobalAdminStats(); [cite: 334]
    const companies = await fetchUserCompanies(context); [cite: 335]
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-building', 'Total Entreprises', stats.totalCompanies, 'bg-primary')} [cite: 338]
        ${generateStatCard('fas fa-check-circle', 'Entreprises Actives', stats.activeCompanies, 'bg-success')} [cite: 339]
        ${generateStatCard('fas fa-users', 'Collaborateurs', stats.collaborators, 'bg-info')} [cite: 340]
        ${generateStatCard('fas fa-envelope-open-text', 'Demandes en Cours', stats.pendingRequests, 'bg-warning')} [cite: 341]
        </div>
    `; [cite: 342]
    const companyOptions = companies.map(c =>
        `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
    ).join(''); [cite: 346]
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Administrateur Système (Global)</h2> [cite: 348]
        ${statCards} [cite: 349]
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6"> [cite: 350]
        <h3 class="text-xl font-bold text-info mb-4">Sélectionnez une Entreprise pour Travailler</h3> [cite: 351]
        <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"> [cite: 352]
        <option value="">-- Choisir une entreprise --</option> [cite: 353]
        ${companyOptions} [cite: 354]
        </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"> [cite: 357]
        ${renderActivityFeed()} [cite: 358]
        ${renderAccountingReports()} [cite: 359]
        </div>
        <script>
        document.getElementById('company-selector').addEventListener('change', function() { [cite: 362]
            const selectedOption = this.options[this.selectedIndex]; [cite: 363]
            const newId = selectedOption.value || null; [cite: 364]
            const newName = selectedOption.dataset.name || '-- Global --'; [cite: 365]
            if (newId) { [cite: 366]
                changeCompanyContext(newId, newName); [cite: 367]
            } else {
                window.userContext.entrepriseContextId = null; [cite: 369]
                window.userContext.entrepriseContextName = '-- Global --'; [cite: 370]
                updateHeaderContext(window.userContext); [cite: 371]
                loadView('dashboard'); [cite: 372]
            }
        });
        </script>
    `; [cite: 376]
}

async function renderCollaborateurGlobalDashboard(context) { [cite: 378]
    const companies = await fetchUserCompanies(context); [cite: 379]
    const companyOptions = companies.map(c =>
        `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
    ).join(''); [cite: 382]
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Collaborateur (Sélection Entreprise)</h2> [cite: 384]
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6"> [cite: 385]
        <h3 class="text-xl font-bold text-info mb-4">Sélectionnez l'Entreprise sur laquelle travailler</h3> [cite: 386]
        <p class="text-gray-600 dark:text-gray-300 mb-4">Les options de saisie apparaîtront après sélection.</p> [cite: 387]
        <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"> [cite: 388]
        <option value="">-- Choisir une entreprise --</option> [cite: 389]
        ${companyOptions} [cite: 390]
        </select>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"> [cite: 393]
        ${renderActivityFeed()} [cite: 394]
        </div>
        <script>
        document.getElementById('company-selector').addEventListener('change', function() { [cite: 397]
            const selectedOption = this.options[this.selectedIndex]; [cite: 398]
            const newId = selectedOption.value || null; [cite: 399]
            const newName = selectedOption.dataset.name || '-- Global --'; [cite: 400]
            if (newId) { [cite: 401]
                changeCompanyContext(newId, newName); [cite: 402]
            }
        });
        </script>
    `; [cite: 406]
}

async function renderCompanySpecificDashboard(context) { [cite: 408]
    const userCompanies = await fetchUserCompanies(context) || []; [cite: 409]
    const currentCompany = userCompanies.find(c => c.id === context.entrepriseContextId); [cite: 410]
    if (!currentCompany) { [cite: 411]
        return '<div class="text-center p-8 text-danger">Entreprise introuvable.</div>'; [cite: 412]
    }
    const stats = currentCompany.stats; [cite: 414]
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-chart-bar', 'Résultat Provisoire', (stats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')} [cite: 417]
        ${generateStatCard('fas fa-hand-holding-usd', 'Total Transactions', stats.transactions || 0, 'bg-primary')} [cite: 418]
        ${generateStatCard('fas fa-history', 'Opérations en Attente', stats.pending || 0, 'bg-warning')} [cite: 419]
        ${generateStatCard('fas fa-money-check-alt', 'Solde Caisse/Banque', (stats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')} [cite: 420]
        </div>
    `; [cite: 421]
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Comptable de ${context.entrepriseContextName}</h2> [cite: 424]
        <div class="p-4 bg-warning bg-opacity-10 border-l-4 border-warning rounded-xl mb-6 flex justify-between items-center"> [cite: 425]
        <p class="text-sm">Contexte actuel: <strong>${context.entrepriseContextName}</strong>
        <a href="#" onclick="changeCompanyContext(null, '-- Global --'); loadView('dashboard'); return false;" class="text-danger hover:underline font-bold ml-2"> [cite: 427]
        <i class="fas fa-undo"></i> Changer
        </a>
        </p>
        <button onclick="loadView('journal-entry')" class="py-1 px-4 bg-secondary text-white rounded-lg text-sm"> [cite: 431]
        <i class="fas fa-plus mr-1"></i> Saisie Rapide
        </button>
        </div>
        ${statCards} [cite: 435]
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"> [cite: 436]
        ${renderActivityFeed()} [cite: 437]
        ${renderAccountingReports()} [cite: 438]
        </div>
    `; [cite: 440]
}

async function renderUserDashboard(context) { [cite: 442]
    const userCompanies = await fetchUserCompanies(context) || []; [cite: 443]
    const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {}; [cite: 444]
    if (userCompanies.length === 0) { [cite: 445]
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Entreprise Introuvable</h3><p>Contactez l\'administrateur système.</p></div>'; [cite: 446]
    }
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        ${generateStatCard('fas fa-hand-holding-usd', 'Résultat Net', (companyStats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')} [cite: 450]
        ${generateStatCard('fas fa-wallet', 'Transactions', companyStats.transactions || 0, 'bg-primary')} [cite: 451]
        ${generateStatCard('fas fa-hourglass-half', 'En Attente', companyStats.pending || 0, 'bg-warning')} [cite: 452]
        ${generateStatCard('fas fa-chart-area', 'Trésorerie', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')} [cite: 453]
        </div>
    `; [cite: 455]
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de ${context.entrepriseContextName}</h2> [cite: 457]
        ${statCards} [cite: 458]
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"> [cite: 459]
        ${renderActivityFeed()} [cite: 460]
        ${renderAccountingReports()} [cite: 461]
        </div>
    `; [cite: 463]
}

async function renderCaissierDashboard(context) { [cite: 465]
    const userCompanies = await fetchUserCompanies(context) || []; [cite: 466]
    if (userCompanies.length === 0) { [cite: 467]
        return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Caisse Introuvable</h3><p>Contactez l\'administrateur système.</p></div>'; [cite: 468]
    }
    const companyStats = userCompanies[0].stats; [cite: 470]
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        ${generateStatCard('fas fa-wallet', 'Solde de Ma Caisse', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')} [cite: 473]
        ${generateStatCard('fas fa-receipt', 'Transactions du Jour', companyStats.transactions || 0, 'bg-primary')} [cite: 474]
        ${generateStatCard('fas fa-clock', 'Opérations en Attente', companyStats.pending || 0, 'bg-warning')} [cite: 475]
        </div>
    `; [cite: 477]
    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de Caisse de ${context.entrepriseContextName}</h2> [cite: 479]
        <div class="p-6 bg-secondary bg-opacity-10 border border-secondary rounded-xl text-center mb-6"> [cite: 480]
        <h3 class="text-xl font-bold text-secondary">Interface de Caisse Rapide</h3> [cite: 481]
        <p class="text-gray-700 dark:text-gray-300">Utilisez "Saisie des Flux" pour enregistrer les entrées/sorties.</p> [cite: 482]
        </div>
        ${statCards} [cite: 484]
        <div class="grid grid-cols-1 gap-6"> [cite: 485]
        ${renderActivityFeed()} [cite: 486]
        </div>
    `; [cite: 488]
}

// =================================================================================
// 5. HELPERS DE RENDU
// =================================================================================
function generateStatCard(icon, title, value, bgColor) { [cite: 493]
    return `
        <div class="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-between transform transition hover:scale-105"> [cite: 495]
        <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p> [cite: 497]
        <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">${value}</p> [cite: 498]
        </div>
        <div class="p-3 rounded-full ${bgColor} bg-opacity-10"> [cite: 500]
        <i class="${icon} text-2xl ${bgColor.replace('bg-', 'text-')}"></i> [cite: 501]
        </div>
        </div>
    `;
}

function renderActivityFeed() { [cite: 506]
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"> [cite: 508]
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fil d'Activité Récent</h3> [cite: 509]
        <ul class="space-y-3 text-sm"> [cite: 510]
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-success">[14:30]</span> Validation de la dépense CRB-005.</li> [cite: 511]
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-primary">[10:00]</span> Connexion utilisateur CAI_004.</li> [cite: 512]
        <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-danger">[08:15]</span> Écriture Journal AC-001 rejetée.</li> [cite: 513]
        <li class="p-2"><span class="font-bold text-info">[Hier]</span> Nouvel utilisateur ajouté.</li> [cite: 514]
        </ul>
        </div>
    `;
}

function renderAccountingReports() { [cite: 519]
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"> [cite: 521]
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports SYSCOHADA</h3> [cite: 522]
        <ul class="space-y-3 text-sm"> [cite: 523]
        <li class="flex justify-between items-center p-2 border-b dark:border-gray-700"> [cite: 524]
        <span>Bilan Provisoire (N)</span> [cite: 525]
        <button class="text-info hover:text-primary" onclick="alert('Génération Bilan...')"><i class="fas fa-download mr-1"></i> Télécharger</button> [cite: 526]
        </li>
        <li class="flex justify-between items-center p-2 border-b dark:border-gray-700"> [cite: 528]
        <span>Tableau de Formation des Résultats (TFR)</span> [cite: 529]
        <button class="text-info hover:text-primary" onclick="alert('Génération TFR...')"><i class="fas fa-download mr-1"></i> Télécharger</button> [cite: 530]
        </li>
        <li class="flex justify-between items-center p-2"> [cite: 532]
        <span>Grand Livre</span> [cite: 533]
        <button class="text-info hover:text-primary" onclick="alert('Génération Grand Livre...')"><i class="fas fa-download mr-1"></i> Télécharger</button> [cite: 534]
        </li>
        </ul>
        </div>
    `;
}

function renderNotFound() { [cite: 540]
    return '<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>'; [cite: 541]
}

function renderAccessDenied() { [cite: 543]
    return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl">
        <i class="fas fa-lock fa-3x text-danger mb-4"></i> [cite: 545]
        <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3> [cite: 546]
        <p>Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.</p> [cite: 547]
    </div>`;
}

function renderReportsView() { [cite: 550]
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center"> [cite: 552]
        <i class="fas fa-cogs fa-4x text-info mb-6"></i> [cite: 553]
        <h2 class="text-3xl font-extrabold text-info mb-4">Génération de Rapports SYSCOHADA</h2> [cite: 554]
        <p class="text-gray-700 dark:text-gray-300 mb-6">Configuration de la période comptable et génération des états financiers officiels (Bilan, TFR, etc.).</p> [cite: 555]
        <button onclick="loadView('dashboard')" class="py-2 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition"> [cite: 556]
        Retour au Tableau de Bord
        </button>
        </div>
    `;
}

function renderCreateCompanyForm() { [cite: 562]
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl"> [cite: 564]
        <h2 class="text-3xl font-extrabold text-secondary mb-6">Création de Nouvelle Entreprise</h2> [cite: 565]
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Fonctionnalité en cours de développement (endpoint serveur à créer).</p> [cite: 566]
        <form id="new-company-form" class="space-y-4"> [cite: 567]
        <div>
        <label class="block text-sm font-medium">Nom de l'Entreprise <span class="text-danger">*</span></label> [cite: 569]
        <input type="text" id="new-company-name" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: Sarl Nouvelle Vision"> [cite: 570]
        </div>
        <p id="company-creation-message" class="text-center text-sm hidden"></p> [cite: 572]
        <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition"> [cite: 573]
        <i class="fas fa-plus-circle mr-2"></i> Créer l'Entreprise (MOCK)
        </button>
        </form>
        </div>
        <script>
        document.getElementById('new-company-form').addEventListener('submit', async function(e) { [cite: 579]
            e.preventDefault(); [cite: 580]
            const msgElement = document.getElementById('company-creation-message'); [cite: 581]
            const companyName = document.getElementById('new-company-name').value; [cite: 582]
            msgElement.classList.remove('hidden', 'text-danger', 'text-success'); [cite: 583]
            msgElement.textContent = "Création en cours..."; [cite: 584]
            await new Promise(resolve => setTimeout(resolve, 1500)); [cite: 585]
            msgElement.textContent = \` ✅  Entreprise "\${companyName}" cr éé e (MOCK). Endpoint serveur  à  impl é menter.\`; [cite: 586]
            msgElement.classList.add('text-success'); [cite: 587]
            setTimeout(() => {
                document.getElementById('new-company-form').reset(); [cite: 589]
                msgElement.classList.add('hidden'); [cite: 590]
            }, 3000);
        });
        </script>
    `;
}

function renderSaisieFormCaissier() { [cite: 596]
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl"> [cite: 598]
        <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie des Flux (Simple)</h2> [cite: 599]
        <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie pour ${window.userContext.entrepriseContextName}.</p> [cite: 600]
        <p class="text-sm text-warning"> ⚠️  Formulaire à implémenter - Endpoint: POST /api/saisie/flux</p> [cite: 601]
        </div>
    `;
}

function renderJournalEntryForm() { [cite: 605]
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl"> [cite: 607]
        <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie d'Écriture Journal</h2> [cite: 608]
        <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie à double-entrée pour ${window.userContext.entrepriseContextName}.</p> [cite: 609]
        <p class="text-sm text-warning"> ⚠️  Formulaire à implémenter - Endpoint: POST /api/saisie/journal</p> [cite: 610]
        </div>
    `;
}

function generateValidationTable() { [cite: 614]
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"> [cite: 616]
        <h3 class="text-xl font-semibold mb-4">Opérations en Attente de Validation</h3> [cite: 617]
        <p class="text-sm text-gray-600 dark:text-gray-400">Tableau de validation pour ${window.userContext.entrepriseContextName}.</p> [cite: 618]
        <p class="text-sm text-warning mt-4"> ⚠️  Tableau à implémenter - Endpoint GET à créer</p> [cite: 619]
        </div>
    `;
}

function renderUserManagementView() { [cite: 623]
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl"> [cite: 625]
        <h2 class="text-3xl font-extrabold text-primary mb-6">Gestion des Utilisateurs</h2> [cite: 626]
        <p class="text-gray-600 dark:text-gray-400">Interface de gestion des rôles et des accès.</p> [cite: 627]
        <p class="text-sm text-warning mt-4"> ⚠️  Interface à implémenter - Endpoints GET/POST/PUT/DELETE à créer</p> [cite: 628]
        </div>
    `;
}

// =================================================================================
// 7. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================
function renderLoginView() { [cite: 635]
    document.getElementById('auth-view').classList.remove('hidden'); [cite: 636]
    const registerView = document.getElementById('register-view'); [cite: 637]
    if (registerView) { [cite: 638]
        registerView.classList.add('hidden'); [cite: 639]
    }
}

function renderRegisterView() { [cite: 642]
    document.getElementById('auth-view').classList.add('hidden'); [cite: 643]
    const registerView = document.getElementById('register-view'); [cite: 644]
    if (registerView) { [cite: 645]
        registerView.classList.remove('hidden'); [cite: 646]
    }
}

document.addEventListener('DOMContentLoaded', function() { [cite: 649]
    const loginForm = document.getElementById('login-form'); [cite: 650]
    if (loginForm) { [cite: 651]
        loginForm.addEventListener('submit', async function(e) { [cite: 652]
            e.preventDefault(); [cite: 653]
            const email = document.getElementById('email').value; [cite: 654]
            const password = document.getElementById('password').value; [cite: 655]
            const msgElement = document.getElementById('login-message'); [cite: 656]
            msgElement.textContent = 'Connexion en cours...'; [cite: 657]
            msgElement.classList.remove('hidden', 'text-danger', 'text-success'); [cite: 658]
            try {
                const context = await handleLogin(email, password); [cite: 660]
                if (context) { [cite: 661]
                    msgElement.classList.add('hidden'); [cite: 662]
                    initDashboard(context); [cite: 663]
                } else {
                    msgElement.textContent = 'Échec de la connexion.'; [cite: 665]
                    msgElement.classList.add('text-danger'); [cite: 666]
                }
            } catch (error) {
                msgElement.textContent = error.message; [cite: 669]
                msgElement.classList.remove('hidden'); [cite: 670]
                msgElement.classList.add('text-danger'); [cite: 671]
            }
        });
    }

    const registerForm = document.getElementById('register-form'); [cite: 675]
    if (registerForm) { [cite: 676]
        registerForm.addEventListener('submit', async function(e) { [cite: 677]
            e.preventDefault(); [cite: 678]
            const password = document.getElementById('reg-password').value; [cite: 679]
            const passwordConfirm = document.getElementById('reg-password-confirm').value; [cite: 680]
            const msgElement = document.getElementById('register-error-message'); [cite: 681]
            if (password !== passwordConfirm) { [cite: 682]
                msgElement.textContent = ' ❌  Les mots de passe ne correspondent pas.'; [cite: 683]
                msgElement.classList.remove('hidden'); [cite: 684]
                msgElement.classList.add('text-danger'); [cite: 685]
                return;
            }
            const payload = {
                username: document.getElementById('reg-username').value, [cite: 689]
                email: document.getElementById('reg-email').value, [cite: 690]
                password: password, [cite: 691]
                companyName: document.getElementById('reg-company-name').value, [cite: 692]
                companyNif: document.getElementById('reg-company-nif').value, [cite: 693]
                companyStatus: document.getElementById('reg-company-status').value, [cite: 694]
            };
            msgElement.textContent = 'Inscription en cours...'; [cite: 696]
            msgElement.classList.remove('hidden', 'text-danger'); [cite: 697]
            try {
                const context = await handleRegistration(payload); [cite: 699]
                msgElement.classList.add('hidden'); [cite: 700]
                initDashboard(context); [cite: 701]
                alert(` ✅  Inscription R é ussie !\nBienvenue chez Douk è  Compta Pro.\nVotre entreprise "${context.entrepriseContextName}" a  é t é  cr éé e.`); [cite: 702]
            } catch (error) {
                msgElement.textContent = error.message; [cite: 704]
                msgElement.classList.remove('hidden'); [cite: 705]
                msgElement.classList.add('text-danger'); [cite: 706]
            }
        });
    }

    const logoutButton = document.getElementById('logout-button'); [cite: 710]
    if (logoutButton) { [cite: 711]
        logoutButton.addEventListener('click', function() { [cite: 712]
            window.userContext = null; [cite: 713]
            document.getElementById('dashboard-view').classList.add('hidden'); [cite: 714]
            renderLoginView(); [cite: 715]
            document.getElementById('email').value = ''; [cite: 716]
            document.getElementById('password').value = ''; [cite: 717]
            document.getElementById('login-message').classList.add('hidden'); [cite: 718]
        });
    }
});

function toggleTheme() { [cite: 722]
    document.documentElement.classList.toggle('dark'); [cite: 723]
}
