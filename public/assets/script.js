// =============================================================================
// FICHIER : public/assets/script.js (CORRIGÉ INTÉGRAL V8 - PLAN COMPTABLE R/W & RÔLES FINALISÉS)
// Description : Logique Front-End (Vue et Interactions DOM)
// =============================================================================

// --- 1. CONFIGURATION GLOBALE ---
const API_BASE_URL = 'https://douke-compta-pro.onrender.com/api'; // Adapter si le backend n'est pas sur localhost:3000
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// État central de l'application (ESSENTIEL POUR L'ISOLATION)
let appState = {
    isAuthenticated: false,
    token: null,
    // Structure d'utilisateur de la V4: { name, email, profile, odooUid, companiesList, selectedCompanyId, ... }
    user: null, 
    currentCompanyId: null,
    currentCompanyName: null,
};

// État central de l'application (ESSENTIEL POUR L'ISOLATION)
let appState = {
    isAuthenticated: false,
    token: null,
    // Structure d'utilisateur de la V4: { name, email, profile, odooUid, companiesList, selectedCompanyId, ... }
    user: null, 
    currentCompanyId: null,
    currentCompanyName: null,
    // --- AJOUT V9 : Données stratégiques et KPIs ---
    dashboardKPIs: {
        cash: 0,
        profit: 0,
        debts: 0,
        grossMargin: 0,         // Nouveau KPI
        profitTrend: "0%",      // Nouveau KPI
        pendingEntries: 0,      // Nouveau KPI
        liquidityRatio: null,   // Nouveau KPI
        currentPeriod: 'N/A',   // Nouveau pour le contexte
    },
    filteredData: {
        accounts: [],           // Liste complète du Plan Comptable
        financialReport: null,  // Données brutes du rapport SYSCOHADA (pour graphiques)
        journalEntries: [],     // Pour le drill-down
    }
};
// --- 2. GESTIONNAIRES D'INTERFACE (UI Managers) ---

const NotificationManager = {
    zone: document.getElementById('notification-zone'),
    show: function (message, type = 'success', duration = 5000) {
        if (!this.zone) return;

        const iconMap = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-circle"></i>',
        };
        const colorMap = {
            success: 'bg-success border-success/50',
            error: 'bg-danger border-danger/50',
            info: 'bg-info border-info/50',
            warning: 'bg-warning border-warning/50',
        };

        const notification = document.createElement('div');
        notification.className = `p-4 max-w-sm rounded-xl text-white shadow-lg fade-in border-l-4 ${colorMap[type]}`;
        notification.innerHTML = `<div class="flex items-center space-x-3">${iconMap[type]}<span class="font-bold">${message}</span></div>`;

        this.zone.prepend(notification); // Ajouter en haut

        // Disparaître après la durée spécifiée
        setTimeout(() => {
            notification.classList.remove('fade-in');
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
};

const ModalManager = {
    modalBackdrop: document.getElementById('professional-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    open: function (title, contentHTML) {
        if (!this.modalBackdrop) return;
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = contentHTML;
        document.body.classList.add('modal-open');
        this.modalBackdrop.style.display = 'flex';
    },
    close: function () {
        if (!this.modalBackdrop) return;
        document.body.classList.remove('modal-open');
        this.modalBackdrop.style.display = 'none';
        this.modalBody.innerHTML = ''; // Nettoyer le contenu
    }
};


// --- 3. LOGIQUE D'AUTHENTIFICATION ET API ---

/**
 * Fonction centrale pour toutes les requêtes API vers le backend Node.js.
 * Ajoute automatiquement le jeton JWT si disponible.
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (appState.token) {
        headers['Authorization'] = `Bearer ${appState.token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        const data = await response.json();

        if (!response.ok) {
            // Gérer les erreurs 401/403 (jeton expiré/non autorisé)
            if (response.status === 401 || response.status === 403) {
                if (data.error && data.error.includes('expirée')) {
                    NotificationManager.show('Session expirée. Reconnexion requise.', 'warning', 8000);
                } else {
                    NotificationManager.show(`Accès refusé: ${data.error || 'Erreur serveur.'}`, 'error');
                }
                // Déconnexion automatique après une erreur d'authentification
                handleLogout(true);
            }
            // Gère le cas où la route n'est pas trouvée, affichant le message
            throw new Error(data.error || `Erreur HTTP ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error('Erreur API Fetch:', error);
        // Ne pas notifier deux fois si c'est déjà fait par le 401/403
        if (!error.message.includes('Accès refusé')) {
            NotificationManager.show(error.message, 'error');
        }
        throw error;
    }
}

/**
 * Gère la soumission du formulaire de connexion.
 * Utilise la structure de réponse de la V4.
 */
async function handleLogin(event) {
    event.preventDefault(); // GARANTIE : Empêcher le rafraîchissement
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-submit-btn');
    
    // Afficher le spinner/état de chargement
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="loading-spinner mx-auto border-white border-top-white/20"></div>`;

    try {
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // 1. Mise à jour de l'état global (Structure V4)
        appState.token = response.data.token;
        appState.user = response.data; // Contient profile, name, companiesList, defaultCompany
        appState.isAuthenticated = true;

        // 2. Définir la compagnie par défaut
        appState.currentCompanyId = response.data.defaultCompany.id;
        appState.currentCompanyName = response.data.defaultCompany.name;
        
        // Assurez-vous que selectedCompanyId existe sur l'objet user pour handleCompanyChange
        appState.user.selectedCompanyId = response.data.defaultCompany.id;

        // 3. Sauvegarde du token
        localStorage.setItem('douke_auth_token', appState.token);
        
        NotificationManager.show(`Connexion Réussie. Bienvenue, ${appState.user.name}.`);
        renderAppView(); // Charger le tableau de bord
        
    } catch (error) {
        // Le NotifManager s'occupe déjà de l'affichage de l'erreur
        document.getElementById('password').value = ''; 
    } finally {
        // Rétablir le bouton
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Gère la soumission du formulaire d'inscription.
 */
async function handleRegister(event) {
    event.preventDefault();
    NotificationManager.show('Fonction d\'inscription en cours de finalisation.', 'info');
}

/**
 * Gère la déconnexion.
 */
function handleLogout(isAutoLogout = false) {
    // Effacer le token et réinitialiser l'état
    localStorage.removeItem('douke_auth_token');
    appState = {
        isAuthenticated: false,
        token: null,
        user: null,
        currentCompanyId: null,
        currentCompanyName: null,
    };
    
    if (!isAutoLogout) {
        NotificationManager.show('Vous êtes déconnecté.', 'info');
    }
    
    // Retourner à la vue d'authentification
    renderAppView();
    window.location.hash = ''; // Nettoyer l'URL
}

/**
 * Vérifie l'authentification au chargement de la page (token localStorage).
 * Utilise la route /auth/me et la structure de réponse de la V4.
 */
async function checkAuthAndRender() {
    const token = localStorage.getItem('douke_auth_token');
    
    if (!token) {
        appState.isAuthenticated = false;
        return renderAppView();
    }
    
    appState.token = token;
    
    try {
        // Tenter de valider le token et de récupérer les données utilisateur
        const response = await apiFetch('/auth/me', { method: 'GET' }); 
        
        // Si la validation réussit, restaurer l'état (structure V4)
        appState.user = response.data;
        appState.isAuthenticated = true;

        // Récupérer l'ID de la compagnie actuellement sélectionnée
        const selectedId = response.data.selectedCompanyId || (response.data.companiesList[0]?.id || null);
        
        appState.currentCompanyId = selectedId;
        appState.currentCompanyName = response.data.companiesList.find(c => c.id === selectedId)?.name || 'Dossier Inconnu';
        
    } catch (error) {
        // En cas d'échec de validation (token expiré ou invalide)
        console.warn('Token invalide ou expiré. Reconnexion requise.');
        handleLogout(true);
        return;
    }
    
    renderAppView();
}

// --- 4. GESTION DE LA VUE ET DU DASHBOARD ---

/**
 * Bascule entre la vue d'authentification et le tableau de bord.
 */
function renderAppView() {
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    if (appState.isAuthenticated) {
        authView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        loadDashboard();
    } else {
        dashboardView.classList.add('hidden');
        authView.classList.remove('hidden');
    }
}

// =================================================================
// function loadDashboard()
// =================================================================

/**
 * Charge les informations et les menus du tableau de bord.
 * AJUSTÉ pour gérer l'état sans compagnie sélectionnée (currentCompanyId: null).
 */
function loadDashboard() {
    if (!appState.user) return;

    // Mise à jour de l'en-tête utilisateur
    document.getElementById('welcome-message').textContent = appState.user.name;
    document.getElementById('current-role').textContent = appState.user.profile; // Utilisation de 'profile'
    document.getElementById('user-avatar-text').textContent = appState.user.name.charAt(0).toUpperCase();

    // Mise à jour du contexte de travail (Correction pour afficher le message de sélection)
    document.getElementById('current-company-name').textContent = appState.currentCompanyName || 'Aucun Dossier Actif';
    
    // Modification 1: Conditionner le message de contexte
    const contextMessage = appState.currentCompanyId 
        ? `Comptabilité Analytique : ${appState.currentCompanyName}`
        : 'SÉLECTION REQUISE : Veuillez choisir un dossier client.';
        
    document.getElementById('context-message').textContent = contextMessage;


    // -------------------------------------------------------------
    // LOGIQUE CRITIQUE: CONSTRUCTION DU MENU MULTI-COMPAGNIES
    // -------------------------------------------------------------
    const menuContainer = document.getElementById('role-navigation-menu');
    menuContainer.innerHTML = '';
    
    // 1. Menu de Sélection de Compagnie (Rendu si plus de 0 compagnies)
    if (appState.user.companiesList && appState.user.companiesList.length > 0) {
        // NOTE: Dans la V1.7, ce sélecteur est déplacé dans l'en-tête (renderHeaderSelectors). 
        // Je le garde ici pour ne pas modifier la structure DOM que vous utilisez.
        const companySelectHTML = createCompanySelectMenu(appState.user.companiesList);
        menuContainer.insertAdjacentHTML('beforeend', companySelectHTML);
    }
    
    // 2. Menus de Navigation (Basés sur le Rôle)
    const baseMenus = getRoleBaseMenus(appState.user.profile);
    baseMenus.forEach(menu => {
        const isActive = menu.id === 'dashboard' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
        const menuItem = document.createElement('a');
        menuItem.className = `flex items-center p-4 rounded-xl font-bold transition-colors ${isActive}`;
        menuItem.href = '#';
        menuItem.innerHTML = `<i class="${menu.icon} w-6 text-center mr-3"></i><span>${menu.name}</span>`;
        menuItem.onclick = (e) => {
            e.preventDefault();
            loadContentArea(menu.id, menu.name);
        };
        menuContainer.appendChild(menuItem);
    });
    
    // 3. Charger le contenu par défaut (Modification 2: Vérification Conditionnelle)
    const contentArea = document.getElementById('dashboard-content-area');
    
    if (appState.currentCompanyId) {
        // Charger le dashboard uniquement si une compagnie est sélectionnée
        loadContentArea('dashboard', 'Tableau de Bord');
    } else {
        // Sinon, afficher un message d'invitation à sélectionner une compagnie.
        if (contentArea) {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
        }
    }
}


// =================================================================
// function generateCompanySelectionPromptHTML()
// =================================================================
/**
 * Génère le HTML pour l'écran demandant à l'utilisateur de sélectionner une compagnie.
 */
function generateCompanySelectionPromptHTML() {
    return `<div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
        <i class="fas fa-sitemap fa-5x text-warning/70 mb-6"></i>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">Sélectionnez votre Dossier Actif</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Afin d'accéder aux données comptables, veuillez choisir un dossier client dans le menu de gauche.
        </p>
    </div>`;
}


/**
 * Génère le HTML pour le sélecteur de compagnie.
 */
function createCompanySelectMenu(companies) {
    let optionsHTML = companies.map(c => 
        `<option value="${c.id}" ${c.id === appState.currentCompanyId ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    // NOTE: Utiliser onchange="handleCompanyChange(this.value)"
    return `
        <div class="mb-5 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <label class="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2 block">Dossier Client Actif</label>
            <select id="company-select-menu" onchange="handleCompanyChange(this.value)"
                class="w-full bg-transparent border-none p-0 text-sm font-bold text-secondary dark:text-primary-light focus:outline-none">
                ${optionsHTML}
            </select>
        </div>
    `;
}

/**
 * Gère le changement de compagnie active par l'utilisateur.
 * RENDU DISPONIBLE DANS LA PORTÉE GLOBALE DU DOM.
 */
window.handleCompanyChange = async function (newCompanyId) { // Rendu asynchrone pour la cohérence
    const newId = parseInt(newCompanyId);
    // Recherche dans la liste stockée dans l'état utilisateur (V4)
    const newCompany = appState.user.companiesList.find(c => c.id === newId);

    if (newCompany) {
        appState.currentCompanyId = newId;
        appState.currentCompanyName = newCompany.name;
        
        // Mise à jour de l'état utilisateur (IMPORTANT pour les prochains checkAuth)
        appState.user.selectedCompanyId = newId; 

        // 💡 OPTIONNEL : Si vous avez une route API pour mettre à jour la compagnie dans le JWT, elle irait ici.
        // Ex: await apiFetch('/user/set-company', { method: 'POST', body: JSON.stringify({ companyId: newId }) });

        // Mise à jour de l'UI
        document.getElementById('current-company-name').textContent = appState.currentCompanyName;
        document.getElementById('context-message').textContent = `Comptabilité Analytique : ${appState.currentCompanyName}`;
        NotificationManager.show(`Dossier actif changé : ${appState.currentCompanyName}`, 'info');

        // Recharger le contenu principal avec le nouveau contexte
        loadContentArea('dashboard', 'Tableau de Bord');
    }
};


// =================================================================
// CORRECTION CRITIQUE : getRoleBaseMenus (NOUVELLE LOGIQUE RÔLES)
// =================================================================
/**
 * Définit les options de menu basées sur le profil utilisateur et ses permissions.
 * Les permissions d'accès aux données (lecture/écriture) doivent être VÉRIFIÉES EN ARRIÈRE-PLAN (Back-End).
 */
function getRoleBaseMenus(role) {
    const menus = [
        { id: 'dashboard', name: 'Tableau de Bord', icon: 'fas fa-chart-line' },
    ];
    
    // --- 4. CAISSIER (Accès très limité) ---
    if (role === 'CAISSIER') {
        // Le Caissier n'a accès qu'à son interface de saisie simplifiée.
        menus.push({ id: 'caisse-operation', name: 'Opérations de Caisse', icon: 'fas fa-cash-register' });
        // Les Rapports SYSCOHADA (version très simplifiée/filtrée) peuvent rester visibles
        menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
        return menus;
    }

    // --- 3. USER, 2. COLLABORATEUR & 1. ADMIN ---
    // Ces trois rôles ont un accès complet aux outils comptables. La différence est l'ISOLATION.
    
    // Modules d'Analyse
    menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
    menus.push({ id: 'journal', name: 'Journaux et Écritures', icon: 'fas fa-book' });
    menus.push({ id: 'ledger', name: 'Grand Livre / Balance', icon: 'fas fa-balance-scale' });
    
    // Modules d'Écriture/Configuration (Nécessitent un droit R/W côté BE)
    menus.push({ id: 'chart-of-accounts', name: 'Plan Comptable', icon: 'fas fa-list-alt' }); 
    menus.push({ id: 'manual-entry', name: 'Passer une Écriture', icon: 'fas fa-plus-square' }); 
    
    // --- 1. ADMIN (Administration de la Plateforme) ---
    if (role === 'ADMIN') {
        // Module exclusif pour l'ADMIN (Gestion des Utilisateurs/Permissions)
        menus.push({ id: 'admin-users', name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog' });
    }
    
    return menus;
}

/**
 * Charge le contenu HTML/Données dans la zone principale.
 * Utilise la structure de route V4 (`/accounting/module?companyId=...`).
 *
 * @param {string} contentId - L'identifiant du module (ex: 'dashboard', 'journal').
 * @param {string} title - Le titre à afficher pendant le chargement et dans la console.
 * @param {object | null} extraData - Données supplémentaires (ex: { accountCode: '701000' } pour le drill-down).
 */
async function loadContentArea(contentId, title, extraData = null) {
    // Vérification critique: Si aucun dossier n'est sélectionné, ne rien faire sauf le prompt
    if (!appState.currentCompanyId && contentId !== 'admin-users') { 
        // Si l'utilisateur n'a pas de compagnie active et tente d'accéder à un module
        const contentArea = document.getElementById('dashboard-content-area');
        if (contentArea) {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
        }
        return NotificationManager.show("Veuillez d'abord sélectionner un dossier client.", 'warning');
    }

    const contentArea = document.getElementById('dashboard-content-area');
    const loadingMessage = extraData && extraData.drillDownTitle 
        ? `Chargement des détails de ${extraData.drillDownTitle}...`
        : `Chargement du module ${title}...`;
        
    contentArea.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">${loadingMessage}</p></div>`;

    try {
        let endpoint = '';
        let content = '';

        // Filtre de base requis pour toutes les requêtes comptables
        let companyFilter = `?companyId=${appState.currentCompanyId}`;
        
        // Ajouter un filtre spécifique si présent (par exemple, pour le Drill-Down)
        if (extraData && extraData.filter) {
            companyFilter += `&${extraData.filter}`;
        }

        switch (contentId) {
            case 'dashboard':
                // 1. Dashboard (KPIs Riches V9)
                endpoint = `/accounting/dashboard${companyFilter}`;
                // fetchDashboardData met à jour appState.dashboardKPIs et renvoie le HTML
                content = await fetchDashboardData(endpoint);
                break;
            
            case 'chart-of-accounts': 
                // 2. Plan Comptable (R/W & Solde)
                endpoint = `/accounting/chart-of-accounts${companyFilter}`;
                // fetchChartOfAccountsData met à jour appState.filteredData.accounts
                content = await fetchChartOfAccountsData(endpoint);
                break;
                
            case 'caisse-operation': 
                // 3. Opérations de Caisse (Interface Caissier)
                content = generateCaisseOperationHTML();
                break;
                
            case 'journal':
                // 4. Journaux et Écritures (Incluant Drill-Down des Rapports)
                endpoint = `/accounting/journal${companyFilter}`;
                // extraData peut contenir le titre du drill-down
                content = await fetchJournalData(endpoint, extraData); 
                break;
                
            case 'reports':
                // 5. Rapports SYSCOHADA (Bilan/SMT) - Ouvre une Modale
                endpoint = `/accounting/reports/bilan${companyFilter}`;
                const reportResponse = await apiFetch(endpoint, { method: 'GET' }); 
                
                // Stocker les données brutes du rapport pour les graphiques futurs
                appState.filteredData.financialReport = reportResponse.data; 

                // Ouvrir la modale (l'affichage dans contentArea est ignoré)
                ModalManager.open("Bilan SYSCOHADA (Période Actuelle)", generateReportHTML(reportResponse.data));
                
                // Afficher le message d'accueil ou le dashboard en arrière-plan
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
                break;
            
            case 'ledger':
                // 6. Grand Livre / Balance
                endpoint = `/accounting/ledger${companyFilter}`;
                content = await fetchLedgerData(endpoint);
                break;
                
            case 'manual-entry':
                // 7. Passer une Écriture (Formulaire de saisie manuelle)
                content = generateManualEntryHTML();
                break;
                
            case 'admin-users':
                // 8. Administration (Réservé aux ADMINs)
                content = await fetchAdminUsersData();
                break;

            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
        }
        
        // Mettre à jour la zone de contenu (sauf si une modale a été ouverte via 'reports')
        if (content) {
            contentArea.innerHTML = content;
        }

    } catch (error) {
        // Gérer les erreurs de chargement de module
        contentArea.innerHTML = `<div class="p-8 text-center text-danger">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4 class="font-bold">Erreur de chargement des données pour ${title}.</h4>
            <p class="text-sm mt-2">${error.message}</p>
        </div>`;
    }
}

// --- Fonctions de récupération et de rendu ---

/**
 * Récupère les données du tableau de bord et met à jour l'état.
 */
async function fetchDashboardData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    
    // Assumons que l'API renvoie { cash, profit, debts, grossMargin, profitTrend, pendingEntries, liquidityRatio, currentPeriod }
    const newKPIs = response.data;

    // Mise à jour de l'état global avec les nouveaux KPIs
    appState.dashboardKPIs = {
        ...appState.dashboardKPIs, // Conserver les valeurs par défaut au cas où
        ...newKPIs,                // Écraser avec les données réelles
    };
    
    // Nous devons maintenant rendre le HTML avec les données stockées dans l'état
    return generateDashboardHTML(appState.dashboardKPIs);
}

// ⚠️ À implémenter (Laisser en simulation pour l'instant)
async function fetchJournalData(endpoint) {
    // Simule la latence réseau
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const simulatedData = [
        { id: 1, date: '2025-01-15', libelle: 'Achat de fournitures', debit: 50000, credit: 0, status: 'Validé' },
        { id: 2, date: '2025-01-15', libelle: 'Vente de biens', debit: 0, credit: 150000, status: 'Brouillon' },
    ];
    
    return generateJournalHTML(simulatedData);
}

// =================================================================
// AJOUT : Fonctions du Plan Comptable (R/W)
// =================================================================

/**
 * Récupère les données du Plan Comptable (GET /accounting/chart-of-accounts).
 */
async function fetchChartOfAccountsData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    // Supposons que l'API renvoie { data: [{ code, name, type, balance, id }] }
    return generateChartOfAccountsHTML(response.data);
}

/**
 * Génère le HTML pour l'affichage du Plan Comptable.
 */
/**
 * Génère le HTML pour l'affichage du Plan Comptable, incluant le solde et les actions.
 */
function generateChartOfAccountsHTML(accounts) {
    // ... (vérification accounts.length === 0 reste la même)

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
                <button onclick="showCreateAccountModal(${account.id}, {code: '${account.code}', name: '${account.name}', type: '${account.type}'})" 
                    class="text-primary hover:text-primary-dark font-bold mr-3">Modifier</button>
                <button onclick="handleDeleteAccount(${account.id})" 
                    class="text-danger hover:text-danger-dark font-bold">Supprimer</button>
            </td>
        </tr>
    `).join('');

    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Plan Comptable SYSCOHADA</h3>
        <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-500">Affiche les comptes de la compagnie: **${appState.currentCompanyName}**.</p>
            <button onclick="showCreateAccountModal()" class="bg-success text-white py-2 px-4 rounded-xl font-bold hover:bg-success-dark transition-colors">
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
                    ${rows}
                </tbody>
            </table>
        </div>`;
}

/**
 * AJOUT: Gère la suppression d'un compte.
 * NOTE: Nécessite une route DELETE /accounting/chart-of-accounts/:id?companyId=X
 */
window.handleDeleteAccount = async function(accountId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible et impossible si le compte est utilisé.")) {
        return;
    }
    
    try {
        NotificationManager.show('Suppression du compte en cours...', 'warning');
        
        await apiFetch(`/accounting/chart-of-accounts/${accountId}?companyId=${appState.currentCompanyId}`, {
            method: 'DELETE',
        });

        NotificationManager.show(`Compte ID ${accountId} supprimé avec succès.`, 'success');
        loadContentArea('chart-of-accounts', 'Plan Comptable');
    } catch (error) {
        NotificationManager.show(`Échec de la suppression : ${error.message}`, 'error', 10000);
    }
}

// =================================================================
// AJOUT : Fonctions Opérations de Caisse (CAISSIER)
// =================================================================

let currentFluxType = null; 

/**
 * Génère le HTML pour l'interface simplifiée d'Opérations de Caisse.
 */
function generateCaisseOperationHTML() {
    // Réinitialisation de l'état local du flux à chaque chargement
    currentFluxType = null;
    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Opérations de Trésorerie Rapides (Caisse)</h3>
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto fade-in">
            <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
                Sélectionnez le type de flux (Recette ou Dépense) pour enregistrer une transaction simplifiée.
            </p>
            <form id="caisse-entry-form" onsubmit="handleCaisseEntrySubmit(event)">
                
                <div class="flex space-x-4 mb-6">
                    <button type="button" onclick="selectFluxType('RECETTE')" id="btn-recette" class="flex-1 p-4 rounded-xl border-2 border-success text-success font-black hover:bg-success/10 transition-colors">
                        <i class="fas fa-arrow-alt-circle-up"></i> Recette
                    </button>
                    <button type="button" onclick="selectFluxType('DEPENSE')" id="btn-depense" class="flex-1 p-4 rounded-xl border-2 border-danger text-danger font-black hover:bg-danger/10 transition-colors">
                        <i class="fas fa-arrow-alt-circle-down"></i> Dépense
                    </button>
                </div>

                <div id="flux-details" class="hidden">
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Compte de Contrepartie (ex: Ventes / Fournitures)</label>
                        <select id="contra-account" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                            <option value="">Chargement des comptes...</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Libellé</label>
                        <input type="text" id="caisse-label" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Montant (XOF)</label>
                        <input type="number" step="0.01" min="1" id="caisse-amount" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <button type="submit" class="w-full bg-primary text-white font-bold p-3 rounded-xl hover:bg-primary-dark transition-colors">Enregistrer l'Opération</button>
                </div>
            </form>
        </div>`;
}

/**
 * Change le type de flux (Recette/Dépense) et met à jour l'UI.
 */
window.selectFluxType = function(type) {
    currentFluxType = type;
    document.getElementById('flux-details').classList.remove('hidden');
    
    // Logique de style
    const r = document.getElementById('btn-recette');
    const d = document.getElementById('btn-depense');
    
    // Réinitialiser les classes de base (pour la robustesse des clics multiples)
    r.className = 'flex-1 p-4 rounded-xl border-2 border-success text-success font-black hover:bg-success/10 transition-colors';
    d.className = 'flex-1 p-4 rounded-xl border-2 border-danger text-danger font-black hover:bg-danger/10 transition-colors';

    if(type === 'RECETTE') {
        r.classList.add('bg-success', 'text-white', 'shadow-md', 'shadow-success/30');
    } else {
        d.classList.add('bg-danger', 'text-white', 'shadow-md', 'shadow-danger/30');
    }
}

/**
 * Gère la soumission du formulaire d'opération de caisse.
 */
window.handleCaisseEntrySubmit = async function(event) {
    event.preventDefault();
    if (!currentFluxType) {
        NotificationManager.show('Veuillez sélectionner Recette ou Dépense.', 'warning');
        return;
    }

    const data = {
        type: currentFluxType,
        contraAccount: document.getElementById('contra-account').value,
        label: document.getElementById('caisse-label').value,
        amount: parseFloat(document.getElementById('caisse-amount').value),
        companyId: appState.currentCompanyId // CRITIQUE pour l'isolation mono-entreprise du CAISSIER
    };

    try {
        NotificationManager.show(`Soumission de l'opération ${currentFluxType} en cours...`, 'info');

        // 💡 APPEL API (Nouvelle route à créer: POST /accounting/caisse-entry)
        await apiFetch('/accounting/caisse-entry', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        
        NotificationManager.show(`Opération ${currentFluxType} enregistrée avec succès. En attente de validation.`, 'success');
        document.getElementById('caisse-entry-form').reset();
        document.getElementById('flux-details').classList.add('hidden');
        currentFluxType = null;
    } catch (error) {
        NotificationManager.show(`Échec de l'enregistrement de l'opération : ${error.message}`, 'error', 10000);
    }
};

// =================================================================
// FIN des Fonctions spécifiques
// =================================================================

// Fonction de génération HTML basique
function generateDashboardHTML(data) {
    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Synthèse Financière</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Trésorerie Actuelle</p>
                    <p class="text-4xl font-black text-success mt-2">${(data.cash || 0).toLocaleString('fr-FR')} XOF</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Bénéfice Net (YTD)</p>
                    <p class="text-4xl font-black text-info mt-2">${(data.profit || 0).toLocaleString('fr-FR')} XOF</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Dettes Fournisseurs</p>
                    <p class="text-4xl font-black text-warning mt-2">${(data.debts || 0).toLocaleString('fr-FR')} XOF</p>
                </div>
            </div>
            <p class="mt-8 text-sm text-gray-500">Données filtrées pour le dossier client: **${appState.currentCompanyName}**.</p>
            `;
}

/**
 * Génère le HTML pour l'affichage du Tableau de Bord.
 */
function generateDashboardHTML(kpis) {
    // Helper pour formater les pourcentages/nombres
    const formatValue = (value, isCurrency = true) => {
        if (typeof value === 'number') {
            return isCurrency ? value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) : value.toLocaleString('fr-FR');
        }
        return value;
    };
    
    // Détermination de la couleur pour la tendance
    const trendColor = kpis.profitTrend && parseFloat(kpis.profitTrend) >= 0 ? 'text-success' : 'text-danger';

    // Rendu des cartes d'information
    const cardHTML = [
        { title: 'Trésorerie Actuelle', value: formatValue(kpis.cash), icon: 'fas fa-hand-holding-usd', color: 'bg-primary' },
        { title: 'Résultat Net', value: formatValue(kpis.profit), icon: 'fas fa-chart-bar', color: 'bg-info' },
        { title: 'Dettes Fournisseurs', value: formatValue(kpis.debts), icon: 'fas fa-truck-loading', color: 'bg-warning' },
        { title: 'Marge Brute', value: formatValue(kpis.grossMargin), icon: 'fas fa-percentage', color: 'bg-secondary' },
        { title: 'Ratio de Liquidité', value: formatValue(kpis.liquidityRatio, false), icon: 'fas fa-balance-scale', color: 'bg-info-dark' },
    ];
    
    // Ajoutez ici la logique pour générer les graphiques de ventilation (Classes 6 & 7) .

    return `
        <h3 class="text-3xl font-black text-secondary mb-6 fade-in">Tableau de Bord Comptable</h3>
        
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
                    <button onclick="loadContentArea('journal', 'Journaux et Écritures')" class="ml-4 text-primary hover:underline text-sm font-bold">Voir</button>
                </div>
            </div>
        </div>
        
        <div class="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 text-center">
            <i class="fas fa-chart-pie fa-2x text-primary/50 mb-3"></i>
            <p class="text-gray-500">Espace réservé pour les Graphiques de Performance (Marge, Répartition des Charges)</p>
        </div>
    `;
}

function generateJournalHTML(journalEntries) {
    if (!journalEntries || journalEntries.length === 0) {
        return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
    }
    
    const rows = journalEntries.map(entry => `
        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-3">${entry.id}</td>
            <td class="px-6 py-3">${entry.date}</td>
            <td class="px-6 py-3">${entry.libelle}</td>
            <td class="px-6 py-3 text-right">${entry.debit.toLocaleString('fr-FR')}</td>
            <td class="px-6 py-3 text-right">${entry.credit.toLocaleString('fr-FR')}</td>
            <td class="px-6 py-3">
                <span class="p-1 text-xs rounded ${entry.status === 'Validé' ? 'bg-success/20 text-success font-bold' : 'bg-warning/20 text-warning font-bold'}">
                    ${entry.status}
                </span>
            </td>
        </tr>
    `).join('');

    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Journaux et Écritures</h3>
            <p class="text-sm text-gray-500 mb-4">Affichage des écritures pour la compagnie: **${appState.currentCompanyName}**.</p>
            <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">ID</th>
                        <th scope="col" class="px-6 py-3">Date</th>
                        <th scope="col" class="px-6 py-3">Libellé</th>
                        <th scope="col" class="px-6 py-3 text-right">Débit</th>
                        <th scope="col" class="px-6 py-3 text-right">Crédit</th>
                        <th scope="col" class="px-6 py-3">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            </div>`;
}

function generateReportHTML(reportData) {
    // Rendu basé sur le format de données V4 (simulation)
    return `<div class="prose dark:prose-invert max-w-none">
        <h4 class="text-xl font-bold mb-4">Détails du Bilan au ${new Date().toLocaleDateString('fr-FR')}</h4>
        <p>Simulation de données pour la compagnie ${appState.currentCompanyName}. L'appel API a utilisé le filtre: <code>company_id = ${appState.currentCompanyId}</code>.</p>
        <table class="report-table w-full">
            <thead><tr><th>Compte</th><th>Libellé</th><th>Montant</th></tr></thead>
            <tbody>
                <tr><td>211</td><td>Terrains</td><td>${(reportData.terrains || 15000000).toLocaleString('fr-FR')}</td></tr>
                <tr><td>411</td><td>Clients</td><td>${(reportData.clients || 800000).toLocaleString('fr-FR')}</td></tr>
            </tbody>
        </table>
    </div>`;
}

function generateDashboardWelcomeHTML(companyName, role) {
    return `<div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
        <i class="fas fa-hand-wave fa-5x text-primary/70 mb-6"></i>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">Bienvenue dans votre espace DOUKÈ PRO !</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Vous opérez en tant que <span class="font-black text-primary">${role}</span> sur le dossier client isolé :
            <span class="font-black text-secondary dark:text-primary-light">${companyName}</span>.
        </p>
        <p class="mt-4 text-sm text-gray-500">Veuillez sélectionner un module dans le menu de gauche.</p>
    </div>`;
}


// --- 5. INITIALISATION DU DOM (CRITIQUE POUR LA ROBUSTESSE) ---

document.addEventListener('DOMContentLoaded', () => {
    // Tentative d'authentification et rendu initial
    checkAuthAndRender();

    // 1. Attachement des formulaires
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister); 
    }

    // 2. Attachement des boutons de navigation AUTH/REGISTER
    const loginContainer = document.getElementById('login-form-container');
    const registerView = document.getElementById('register-view');
    const showRegisterBtn = document.getElementById('show-register-btn'); 
    const showLoginBtn = document.getElementById('show-login-btn');    
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Bascule vers l'inscription
    if (showRegisterBtn && loginContainer && registerView) {
        showRegisterBtn.addEventListener('click', () => {
            loginContainer.classList.add('hidden');
            registerView.classList.remove('hidden');
        });
    }

    // Bascule vers la connexion
    if (showLoginBtn && loginContainer && registerView) {
        showLoginBtn.addEventListener('click', () => {
            registerView.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        });
    }
    
    // 3. Attachement des boutons de déconnexion et de Modale
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', ModalManager.close);
    }

    // 4. Outil de Dev (Mode rapide pour tests)
    if (!IS_PROD && window.location.hash === '#dev') {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput && passwordInput) {
            emailInput.value = 'admin@douke.com';
            passwordInput.value = 'password';
            const mockEvent = { preventDefault: () => {} };
            setTimeout(() => handleLogin(mockEvent), 500); 
        }
    }
});
