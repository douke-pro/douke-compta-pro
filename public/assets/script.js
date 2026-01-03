//
// =============================================================================
// FICHIER : public/assets/script.js (VERSION V10 - ROBUSTE UNIFIÉ)
// Description : Logique Front-End (Vue et Interactions DOM)
// Architecture : (V8/V9 Business Logic) x (V13 API Reliability)
// =============================================================================

// --- 1. CONFIGURATION GLOBALE ---
const API_BASE_URL = 'https://douke-compta-pro.onrender.com'; // NOTE CRITIQUE : Suppression du /api car il est géré par apiFetch
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


// =================================================================
// 3. LOGIQUE D'AUTHENTIFICATION ET API (V13 ARCHITECTURE INTÉGRÉE)
// =================================================================

/**
 * Nettoie et joint le chemin de base et le chemin d'API.
 * @param {string} base - URL de base (ex: http://server.com)
 * @param {string} path - Chemin d'API (ex: /auth/login)
 * @returns {string} L'URL finale propre.
 */
function cleanUrlJoin(base, path) {
    // Supprime les barres obliques de fin de la base et de début du chemin
    const cleanedBase = base.replace(/\/+$/, '');
    const cleanedPath = path.replace(/^\/+/, '');
    // Ajoute le préfixe /api/ qui est désormais dans l'URL de base.
    return `${cleanedBase}/api/${cleanedPath}`;
}


/**
 * Fonction centrale pour toutes les requêtes API vers le backend Node.js.
 * Ajoute automatiquement le jeton JWT si disponible.
 */
async function apiFetch(endpoint, options = {}) {
    // CRITIQUE V13 : Utilisation de cleanUrlJoin pour garantir une URL propre
    const url = cleanUrlJoin(API_BASE_URL, endpoint); 

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
        // endpoint sans /api car géré par cleanUrlJoin
        const response = await apiFetch('auth/login', { 
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
 */
async function checkAuthAndRender() {
    const token = localStorage.getItem('douke_auth_token');
    
    if (!token) {
        appState.isAuthenticated = false;
        return renderAppView();
    }
    
    appState.token = token;
    
    try {
        // endpoint sans /api car géré par cleanUrlJoin
        const response = await apiFetch('auth/me', { method: 'GET' }); 
        
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

// =================================================================
// 4. GESTION DE LA VUE ET DU DASHBOARD (UNIFIÉ V8/V9)
// =================================================================

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
 */
function loadDashboard() {
    if (!appState.user) return;

    // Mise à jour de l'en-tête utilisateur
    document.getElementById('welcome-message').textContent = appState.user.name;
    document.getElementById('current-role').textContent = appState.user.profile; // Utilisation de 'profile'
    document.getElementById('user-avatar-text').textContent = appState.user.name.charAt(0).toUpperCase();

    // Mise à jour du contexte de travail
    document.getElementById('current-company-name').textContent = appState.currentCompanyName || 'Aucun Dossier Actif';
    
    const contextMessage = appState.currentCompanyId 
        ? `Comptabilité Analytique : ${appState.currentCompanyName}`
        : 'SÉLECTION REQUISE : Veuillez choisir un dossier client.';
        
    document.getElementById('context-message').textContent = contextMessage;


    // -------------------------------------------------------------
    // LOGIQUE CRITIQUE: CONSTRUCTION DU MENU MULTI-COMPAGNIES
    // -------------------------------------------------------------
    const menuContainer = document.getElementById('role-navigation-menu');
    menuContainer.innerHTML = '';
    
    // 1. Menu de Sélection de Compagnie
    if (appState.user.companiesList && appState.user.companiesList.length > 0) {
        const companySelectHTML = createCompanySelectMenu(appState.user.companiesList);
        menuContainer.insertAdjacentHTML('beforeend', companySelectHTML);
    }
    
    // 2. Menus de Navigation (Basés sur le Rôle)
    const baseMenus = getRoleBaseMenus(appState.user.profile);
    baseMenus.forEach(menu => {
        // Le dashboard est actif par défaut au chargement
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
    
    // 3. Charger le contenu par défaut
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
// Utilitaires de Menu (V8/V9)
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
 */
window.handleCompanyChange = async function (newCompanyId) { 
    const newId = parseInt(newCompanyId);
    // Recherche dans la liste stockée dans l'état utilisateur (V4)
    const newCompany = appState.user.companiesList.find(c => c.id === newId);

    if (newCompany) {
        appState.currentCompanyId = newId;
        appState.currentCompanyName = newCompany.name;
        
        // Mise à jour de l'état utilisateur (IMPORTANT pour les prochains checkAuth)
        appState.user.selectedCompanyId = newId; 

        // Mise à jour de l'UI
        document.getElementById('current-company-name').textContent = appState.currentCompanyName;
        document.getElementById('context-message').textContent = `Comptabilité Analytique : ${appState.currentCompanyName}`;
        NotificationManager.show(`Dossier actif changé : ${appState.currentCompanyName}`, 'info');

        // Recharger le contenu principal avec le nouveau contexte
        loadContentArea('dashboard', 'Tableau de Bord');
    }
};


/**
 * Définit les options de menu basées sur le profil utilisateur et ses permissions. (Logique V8/V9)
 */
function getRoleBaseMenus(role) {
    const menus = [
        { id: 'dashboard', name: 'Tableau de Bord', icon: 'fas fa-chart-line' },
    ];
    
    // --- 4. CAISSIER (Accès très limité) ---
    if (role === 'CAISSIER') {
        menus.push({ id: 'caisse-operation', name: 'Opérations de Caisse', icon: 'fas fa-cash-register' });
        menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
        return menus;
    }

    // --- 3. USER, 2. COLLABORATEUR & 1. ADMIN ---
    
    // Modules d'Analyse
    menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
    menus.push({ id: 'journal', name: 'Journaux et Écritures', icon: 'fas fa-book' });
    menus.push({ id: 'ledger', name: 'Grand Livre / Balance', icon: 'fas fa-balance-scale' });
    
    // Modules d'Écriture/Configuration (Nécessitent un droit R/W côté BE)
    menus.push({ id: 'chart-of-accounts', name: 'Plan Comptable', icon: 'fas fa-list-alt' }); 
    menus.push({ id: 'manual-entry', name: 'Passer une Écriture', icon: 'fas fa-plus-square' }); 
    
    // --- 1. ADMIN (Administration de la Plateforme) ---
    if (role === 'ADMIN') {
        menus.push({ id: 'admin-users', name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog' });
    }
    
    return menus;
}

/**
 * Charge le contenu HTML/Données dans la zone principale (Unifié V8/V9).
 */
async function loadContentArea(contentId, title) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">Chargement du module ${title}...</p></div>`;

    // V9 UX: Mise à jour de la classe active du menu
    document.querySelectorAll('#role-navigation-menu a').forEach(el => {
        el.classList.remove('bg-primary', 'text-white');
        el.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
    });
    const activeMenuItem = Array.from(document.querySelectorAll('#role-navigation-menu a')).find(el => el.textContent.includes(title));
    if (activeMenuItem) {
        activeMenuItem.classList.add('bg-primary', 'text-white');
        activeMenuItem.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
    }

    try {
        let endpoint = '';
        let content = '';

        // Filtre de compagnie (Format V4)
        const companyFilter = `?companyId=${appState.currentCompanyId}`; 

        // CRITIQUE V9 : Vérification Conditionnelle
        if (!appState.currentCompanyId && contentId !== 'dashboard') {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
             return;
        }

        switch (contentId) {
            case 'dashboard':
                // V9 : Appel à /accounting/dashboard/kpis?companyId=X pour des KPIs riches
                endpoint = `accounting/dashboard/kpis${companyFilter}`;
                content = await fetchDashboardData(endpoint);
                break;
            
            case 'chart-of-accounts': 
                endpoint = `accounting/chart-of-accounts${companyFilter}`;
                content = await fetchChartOfAccountsData(endpoint);
                break;
            
            case 'caisse-operation': 
                content = generateCaisseOperationHTML(); // V8/V9 Logique
                await loadCompanyAccountsForCaisse(); // V8/V9 Logique
                break;
            
            case 'journal':
                // V9 : Appel à /accounting/journal?companyId=X pour la liste du journal
                endpoint = `accounting/journal${companyFilter}`; 
                content = await fetchJournalData(endpoint); 
                break;
            
            case 'reports':
                // V9 : Affichage d'un menu de sélection de rapport
                content = generateReportsMenuHTML();
                break;
                
            case 'ledger':
            case 'manual-entry': 
            case 'admin-users':
            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
        }
        
        // Mettre à jour la zone de contenu (sauf si une modale a été ouverte)
        if (content) {
            contentArea.innerHTML = content;
        }

    } catch (error) {
        contentArea.innerHTML = `<div class="p-8 text-center text-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p class="font-bold">Erreur de chargement des données pour ${title}.</p><p class="text-sm">${error.message}</p></div>`;
    }
}

// --- Fonctions de récupération et de rendu ---

// =================================================================
// V9 : DASHBOARD ET KPIS OPTIMAUX (Intégrés)
// =================================================================

/**
 * Génère une carte de statistique (KPI) stylisée. (V9)
 */
function generateStatCard(title, value, unit, icon, colorClass, trend = null, trendIcon = null) {
    const formattedValue = (typeof value === 'number') ? value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value;
    const trendHtml = trend !== null ? 
        `<div class="mt-2 text-sm font-semibold flex items-center ${trend >= 0 ? 'text-success' : 'text-danger'}">
            <i class="${trendIcon || (trend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down')} mr-1"></i>
            ${trend}% vs Période Précédente
        </div>` : '';
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl transition duration-300 hover:shadow-2xl border-l-4 ${colorClass}">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                    <h4 class="text-3xl font-black text-gray-900 dark:text-white mt-1">
                        ${formattedValue} <span class="text-lg font-bold text-gray-400">${unit}</span>
                    </h4>
                </div>
                <div class="p-3 rounded-full text-white bg-opacity-80 ${colorClass.replace('border-l-4 ', '')}">
                    <i class="${icon} fa-lg"></i>
                </div>
            </div>
            ${trendHtml}
        </div>
    `;
}

/**
 * Génère le HTML pour l'affichage principal du Tableau de Bord (V9).
 */
function generateDashboardHTML(data) {
    if (!data) return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);

    // Formules d'affichage des KPIs
    const kpi1 = generateStatCard('Trésorerie Actuelle', data.cashBalance || 0, 'XOF', 'fas fa-wallet', 'border-success', data.cashTrend);
    const kpi2 = generateStatCard('Résultat Net (Annuel)', data.netProfit || 0, 'XOF', 'fas fa-chart-bar', (data.netProfit || 0) >= 0 ? 'border-primary' : 'border-danger', data.profitTrend);
    const kpi3 = generateStatCard('Passif Court Terme', data.shortTermDebt || 0, 'XOF', 'fas fa-hand-holding-dollar', 'border-warning', data.debtTrend, 'fas fa-arrow-up');
    const kpi4 = generateStatCard('Marge Brute (Mois)', data.grossMargin || 0, '%', 'fas fa-percent', 'border-info', data.marginTrend);

    return `
        <h3 class="text-3xl font-black text-secondary mb-8 fade-in">Tableau de Bord Comptable pour ${appState.currentCompanyName}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${kpi1}
            ${kpi2}
            ${kpi3}
            ${kpi4}
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Synthèse d'Activité (Dernières Écritures)</h4>
                ${generateJournalHTML(data.recentEntries || [])}
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Actions Rapides</h4>
                <div class="space-y-4">
                    <button onclick="loadContentArea('manual-entry', 'Passer une Écriture')" class="w-full bg-primary/10 text-primary font-bold p-3 rounded-xl hover:bg-primary/20 transition-colors">
                        <i class="fas fa-plus-square mr-2"></i> Nouvelle Écriture
                    </button>
                    <button onclick="window.handleOpenReportModal('bilan', 'Bilan Actuel')" class="w-full bg-info/10 text-info font-bold p-3 rounded-xl hover:bg-info/20 transition-colors">
                        <i class="fas fa-chart-pie mr-2"></i> Afficher Bilan (Modal)
                    </button>
                    <button onclick="loadContentArea('chart-of-accounts', 'Plan Comptable')" class="w-full bg-warning/10 text-warning font-bold p-3 rounded-xl hover:bg-warning/20 transition-colors">
                        <i class="fas fa-list-alt mr-2"></i> Gérer Plan Comptable
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Récupère les données du tableau de bord (V9 - KPIs).
 */
async function fetchDashboardData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    // Structure de données simulées pour le dashboard (à adapter selon le BE réel)
    const simulatedData = {
        cashBalance: 8500000,
        netProfit: 1200000,
        shortTermDebt: 350000,
        grossMargin: 45,
        cashTrend: 12,
        profitTrend: -5,
        debtTrend: 8,
        marginTrend: 2,
        recentEntries: [
            { id: 1, date: '2025-01-15', libelle: 'Achat de fournitures - Facture XYZ', debit: 50000, credit: 0, status: 'Validé' },
            { id: 2, date: '2025-01-15', libelle: 'Vente de biens - Client A', debit: 0, credit: 150000, status: 'Brouillon' },
            { id: 3, date: '2025-01-16', libelle: 'Paiement fournisseur', debit: 0, credit: 25000, status: 'Validé' },
            { id: 4, date: '2025-01-17', libelle: 'Encaissement vente B', debit: 80000, credit: 0, status: 'Validé' },
            { id: 5, date: '2025-01-18', libelle: 'Frais de transport', debit: 12000, credit: 0, status: 'Validé' },
            { id: 6, date: '2025-01-18', libelle: 'Facture électricité', debit: 0, credit: 80000, status: 'Brouillon' },
        ],
    };

    // Le BE est censé renvoyer la structure complète, si response.data est vide, on peut fallback sur de la simulation
    const finalData = response.data && Object.keys(response.data).length > 0 ? response.data : simulatedData;

    return generateDashboardHTML(finalData);
}


// =================================================================
// V9 : JOURNAL ET DRILL-DOWN (Intégrés)
// =================================================================

/**
 * Récupère les données du Journal. (V9)
 */
async function fetchJournalData(endpoint) {
    const simulatedData = [
        { id: 101, date: '2025-01-15', libelle: 'Achat de fournitures - Facture XYZ', debit: 50000, credit: 0, status: 'Validé' },
        { id: 102, date: '2025-01-15', libelle: 'Vente de biens - Client A', debit: 0, credit: 150000, status: 'Brouillon' },
        { id: 103, date: '2025-01-16', libelle: 'Paiement fournisseur', debit: 0, credit: 25000, status: 'Validé' },
        { id: 104, date: '2025-01-17', libelle: 'Encaissement vente B', debit: 80000, credit: 0, status: 'Validé' },
    ];
    
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        // Utiliser response.data.entries si l'API l'encapsule, sinon response.data
        const entries = response.data.entries || response.data;
        return generateJournalHTML(entries);
    } catch (e) {
        console.warn("Utilisation des données simulées pour le journal. Assurez-vous que l'endpoint est fonctionnel.");
        return generateJournalHTML(simulatedData);
    }
}

/**
 * Génère le HTML pour l'affichage des écritures de journal. (V9)
 */
function generateJournalHTML(entries) {
    if (!entries || entries.length === 0) {
        return `<div class="p-4 text-center text-info"><i class="fas fa-info-circle mr-2"></i> Aucune écriture trouvée.</div>`;
    }

    // Limiter la vue dashboard à 5 entrées (gestion du drill-down)
    const rows = entries.map(entry => {
        const debit = entry.debit ? entry.debit.toLocaleString('fr-FR') : '-';
        const credit = entry.credit ? entry.credit.toLocaleString('fr-FR') : '-';
        const statusClass = entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning';
        return `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-2 font-bold">${entry.date}</td>
                <td class="px-4 py-2">${entry.libelle}</td>
                <td class="px-4 py-2 text-right text-success font-semibold">${debit}</td>
                <td class="px-4 py-2 text-right text-danger font-semibold">${credit}</td>
                <td class="px-4 py-2"><span class="px-2 py-1 text-xs font-bold rounded-full ${statusClass}">${entry.status}</span></td>
                <td class="px-4 py-2">
                    <button onclick="window.handleDrillDown(${entry.id}, 'Journal Entry')" class="text-primary hover:text-primary-dark font-bold text-sm">Détails</button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">Date</th>
                        <th scope="col" class="px-4 py-3">Libellé</th>
                        <th scope="col" class="px-4 py-3 text-right">Débit (XOF)</th>
                        <th scope="col" class="px-4 py-3 text-right">Crédit (XOF)</th>
                        <th scope="col" class="px-4 py-3">Statut</th>
                        <th scope="col" class="px-4 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        ${entries.length > 5 ? `<div class="mt-4 text-center"><button onclick="loadContentArea('journal', 'Journaux et Écritures')" class="text-primary font-bold hover:underline">Voir tout le Journal (${entries.length} entrées)</button></div>` : ''}
    `;
}

/**
 * Gère le clic sur les détails (Drill-down). (V9)
 */
window.handleDrillDown = async function(entryId, moduleName) {
    try {
        const endpoint = `accounting/details/${entryId}?companyId=${appState.currentCompanyId}`;
        NotificationManager.show(`Récupération des détails pour l'entrée ${entryId}...`, 'info');
        
        // Simuler la récupération (remplacer par const response = await apiFetch(endpoint))
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockDetails = {
            id: entryId,
            module: moduleName,
            details: 'Détails complets de l\'écriture n° ' + entryId + ' avec lignes de comptes, documents attachés, etc. (Données réelles à récupérer via API)',
            accounts: [
                { code: '571000', name: 'Caisse', debit: 150000, credit: 0 },
                { code: '701000', name: 'Ventes', debit: 0, credit: 150000 },
            ]
        };

        const detailsHTML = `
            <p class="text-lg font-bold mb-4">Écriture N° ${mockDetails.id} - ${moduleName}</p>
            <p class="mb-4 text-gray-600 dark:text-gray-400">${mockDetails.details}</p>
            <h5 class="font-bold text-gray-700 dark:text-gray-300 mb-2">Lignes Comptables:</h5>
            <ul class="list-disc list-inside space-y-1">
                ${mockDetails.accounts.map(acc => 
                    `<li>${acc.code} - ${acc.name}: Débit: ${acc.debit.toLocaleString('fr-FR')} | Crédit: ${acc.credit.toLocaleString('fr-FR')}</li>`
                ).join('')}
            </ul>
        `;
        ModalManager.open(`Détails: ${moduleName} #${entryId}`, detailsHTML);

    } catch (error) {
        NotificationManager.show(`Erreur lors du Drill-Down: ${error.message}`, 'error');
    }
};

// =================================================================
// V9 : RAPPORTS ET EXPORT (Intégrés)
// =================================================================

/**
 * Génère le menu de sélection de rapport. (V9)
 */
function generateReportsMenuHTML() {
    return `
        <h3 class="text-3xl font-black text-secondary mb-8 fade-in">Rapports Financiers SYSCOHADA</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Sélectionnez un rapport pour afficher sa version interactive ou l'exporter.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            ${generateReportCard('Bilan', 'fas fa-balance-scale', 'bilan', 'Aperçu des actifs, passifs et capitaux propres à une date donnée.')}
            ${generateReportCard('Compte de Résultat', 'fas fa-money-bill-transfer', 'pnl', 'Performance financière (revenus et dépenses) sur une période.')}
            ${generateReportCard('Tableau des Flux', 'fas fa-arrows-split-up-and-down', 'cash-flow', 'Analyse des mouvements de trésorerie sur la période.')}
            ${generateReportCard('Balance Générale', 'fas fa-list-ol', 'balance', 'Liste de tous les comptes avec leurs soldes débiteurs et créditeurs.')}
        </div>
    `;
}

/**
 * Génère une carte de rapport. (V9)
 */
function generateReportCard(title, icon, reportId, description) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-info transition duration-200 hover:shadow-lg">
            <div class="flex items-start">
                <i class="${icon} fa-2x text-info/80 mr-4"></i>
                <div>
                    <h4 class="text-xl font-bold text-gray-900 dark:text-white">${title}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${description}</p>
                </div>
            </div>
            <div class="mt-4 flex space-x-3">
                <button onclick="window.handleOpenReportModal('${reportId}', '${title}')" 
                    class="text-sm bg-primary text-white py-2 px-3 rounded-xl font-bold hover:bg-primary-dark transition-colors flex-1">
                    <i class="fas fa-eye mr-2"></i> Voir
                </button>
                <button onclick="window.exportReport('${reportId}', '${title}')" 
                    class="text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        </div>
    `;
}

/**
 * Gère l'ouverture d'un rapport dans une modale. (V9)
 */
window.handleOpenReportModal = async function(reportId, reportTitle) {
    try {
        const companyFilter = `?companyId=${appState.currentCompanyId}`;
        const endpoint = `accounting/report/${reportId}${companyFilter}`;
        
        NotificationManager.show(`Génération du rapport '${reportTitle}' en cours...`, 'info', 10000);
        
        // Appel API (utiliser l'endpoint V9 : /api/accounting/reports/bilan?companyId=X)
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        // Générer un contenu simulé ou utiliser la réponse si l'API est mockée
        const reportContent = response.data || { 
            title: reportTitle, 
            date: new Date().toLocaleDateString('fr-FR'),
            entries: [
                { line: 'Actif Immobilisé', amount: 5000000, type: 'asset' },
                { line: 'Passif Court Terme', amount: -350000, type: 'liability' },
                { line: 'Capitaux Propres', amount: 4650000, type: 'equity' },
            ]
        };

        const modalHtml = generateReportHTML(reportContent);
        ModalManager.open(`Aperçu: ${reportTitle} (${appState.currentCompanyName})`, modalHtml);

    } catch (error) {
        NotificationManager.show(`Impossible d'ouvrir le rapport ${reportTitle}: ${error.message}`, 'error', 10000);
    }
};

/**
 * Génère le HTML pour l'affichage d'un rapport dans la modale. (V8/V9)
 */
function generateReportHTML(reportData) {
    const rows = (reportData.entries || []).map(item => `
        <tr class="border-b dark:border-gray-700 ${item.type === 'equity' ? 'bg-gray-100 dark:bg-gray-700 font-bold' : ''}">
            <td class="px-4 py-2">${item.line}</td>
            <td class="px-4 py-2 text-right">${item.amount.toLocaleString('fr-FR')}</td>
        </tr>
    `).join('');

    return `
        <div class="p-4">
            <h4 class="text-2xl font-black mb-3">${reportData.title || 'Rapport Financier'}</h4>
            <p class="text-sm text-gray-500 mb-4">Date de génération: ${reportData.date || 'N/A'}</p>
            
            <div class="overflow-x-auto border rounded-xl">
                <table class="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-4 py-3">Rubrique</th>
                            <th scope="col" class="px-4 py-3 text-right">Montant (XOF)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Ce rapport est un aperçu. Utilisez l'option Export pour la version officielle.</p>
        </div>
    `;
}

/**
 * Gère l'export de rapport (Simulation). (V9)
 */
window.exportReport = function(reportId, reportTitle) {
    NotificationManager.show(`Simulation d'export du rapport '${reportTitle}' en PDF/CSV. Appel à l'API d'export requis.`, 'warning', 7000);
    // Logique réelle : appel à apiFetch(`/accounting/reports/export/${reportId}?format=pdf&companyId=X`)
};

// =================================================================
// Fonctions Plan Comptable (R/W) (V8/V10)
// =================================================================

/**
 * Récupère les données du Plan Comptable (GET /accounting/chart-of-accounts).
 */
async function fetchChartOfAccountsData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    return generateChartOfAccountsHTML(response.data);
}

/**
 * Génère le HTML pour l'affichage du Plan Comptable. (V8)
 */
function generateChartOfAccountsHTML(accounts) {
    if (!accounts || accounts.length === 0) {
         return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Plan Comptable SYSCOHADA</h3>
            <div class="p-8 text-center text-info"><i class="fas fa-info-circle fa-2x mb-3"></i><p class="font-bold">Aucun compte trouvé pour ce dossier client.</p></div>
            <button onclick="showCreateAccountModal()" class="bg-success text-white py-2 px-4 rounded-xl font-bold hover:bg-success-dark transition-colors mt-4">
                <i class="fas fa-plus-circle mr-2"></i> Ajouter Compte
            </button>`;
    }

    const rows = accounts.map(account => `
        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-3 font-bold">${account.code}</td>
            <td class="px-6 py-3">${account.name}</td>
            <td class="px-6 py-3">${account.type}</td>
            <td class="px-6 py-3 text-right font-black">${(account.balance || 0).toLocaleString('fr-FR')}</td>
            <td class="px-6 py-3">
                <button onclick="showCreateAccountModal(${account.id}, {code: '${account.code}', name: '${account.name}', type: '${account.type}'})" 
                    class="text-primary hover:text-primary-dark font-bold">Modifier</button>
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
 * Ouvre la modale pour la création ou la modification d'un compte. (V8)
 */
window.showCreateAccountModal = function(accountId = null, currentData = {}) {
    const title = accountId ? "Modifier le Compte" : "Créer un Nouveau Compte";
    
    const htmlContent = `
        <form id="create-account-form" onsubmit="handleCreateAccountSubmit(event)">
            <input type="hidden" id="account-id" value="${accountId || ''}">
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Code du Compte (ex: 601000)</label>
                <input type="text" id="account-code" required
                    class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" 
                    pattern="[0-9]{6,}" title="Code numérique de 6 chiffres minimum" value="${currentData.code || ''}">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Libellé</label>
                <input type="text" id="account-name" required
                    class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value="${currentData.name || ''}">
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Type de Compte</label>
                <select id="account-type" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    <option value="asset_other">Actif (Classe 2/3)</option>
                    <option value="liability_other">Passif (Classe 4)</option>
                    <option value="income">Produit (Classe 7)</option>
                    <option value="expense">Charge (Classe 6)</option>
                    <option value="equity">Capitaux Propres (Classe 1)</option>
                </select>
            </div>
            <button type="submit" class="w-full bg-primary text-white font-bold p-3 rounded-xl hover:bg-primary-dark transition-colors">
                ${accountId ? 'Modifier le Compte' : 'Créer le Compte'}
            </button>
        </form>
    `;
    ModalManager.open(title, htmlContent);
    // Sélectionner le type correct si en mode édition
    if (currentData.type) {
        document.getElementById('account-type').value = currentData.type;
    }
};

/**
 * Gère la soumission du formulaire de création/modification de compte (R/W). (V8)
 */
window.handleCreateAccountSubmit = async function(event) {
    event.preventDefault();
    const accountId = document.getElementById('account-id').value;
    const isEdit = accountId !== '';
    
    const data = {
        id: accountId ? parseInt(accountId) : undefined,
        code: document.getElementById('account-code').value,
        name: document.getElementById('account-name').value,
        type: document.getElementById('account-type').value,
        companyId: appState.currentCompanyId // CRITIQUE pour la vérification BE (checkWritePermission)
    };

    try {
        const method = isEdit ? 'PUT' : 'POST';
        const msg = isEdit ? 'Modification du compte en cours...' : 'Création du compte en cours...';
        NotificationManager.show(msg, 'info');

        await apiFetch('accounting/chart-of-accounts', { 
            method: method, 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Compte ${data.code} enregistré avec succès !`, 'success');
        ModalManager.close();
        // Recharger le plan comptable
        loadContentArea('chart-of-accounts', 'Plan Comptable'); 
    } catch (error) {
        NotificationManager.show(`Échec de l'opération : ${error.message}`, 'error', 10000);
    }
};

// =================================================================
// Fonctions Opérations de Caisse (CAISSIER) (V8/V10 - Complétées)
// =================================================================

let currentFluxType = null; 
let loadedCompanyAccounts = [];

/**
 * Génère le HTML pour l'interface simplifiée d'Opérations de Caisse. (V8)
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
                    <button type="button" onclick="selectFluxType('RECETTE')" id="btn-recette"
                        class="flex-1 p-4 rounded-xl border-2 border-success text-success font-black hover:bg-success/10 transition-colors">
                        <i class="fas fa-arrow-alt-circle-up"></i> Recette
                    </button>
                    <button type="button" onclick="selectFluxType('DEPENSE')" id="btn-depense"
                        class="flex-1 p-4 rounded-xl border-2 border-danger text-danger font-black hover:bg-danger/10 transition-colors">
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
                        <input type="text" id="caisse-label" required
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Montant (XOF)</label>
                        <input type="number" step="0.01" min="1" id="caisse-amount" required class="w-full p-3
                            border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <button type="submit" id="caisse-submit-btn" class="w-full bg-primary text-white font-bold p-3 rounded-xl hover:bg-primary-dark transition-colors">
                        Enregistrer l'Opération
                    </button>
                </div>
            </form>
        </div>`;
}

/**
 * Charge les comptes pour le sélecteur de contrepartie. (V8)
 */
async function loadCompanyAccountsForCaisse() {
    try {
        const endpoint = `accounting/chart-of-accounts?companyId=${appState.currentCompanyId}&filter=simplifie`; // Ajouter un filtre pour ne prendre que les comptes utiles (Produits/Charges)
        
        // Utiliser les données du Plan Comptable si déjà chargé, sinon appeler l'API
        // Pour être sûr, on refait l'appel ici.
        const response = await apiFetch(endpoint, { method: 'GET' });
        loadedCompanyAccounts = response.data || [];
        
        const select = document.getElementById('contra-account');
        if (!select) return;

        // Filtrer les comptes pour la caisse (Produits/Charges)
        const filteredAccounts = loadedCompanyAccounts.filter(acc => ['income', 'expense'].includes(acc.type));

        select.innerHTML = '<option value="">-- Sélectionnez un compte --</option>';

        filteredAccounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.code;
            option.textContent = `${acc.code} - ${acc.name} (${acc.type.toUpperCase()})`;
            select.appendChild(option);
        });

    } catch (error) {
        NotificationManager.show('Erreur lors du chargement des comptes de contrepartie.', 'error');
        // Vider le selecteur en cas d'échec
        const select = document.getElementById('contra-account');
        if (select) select.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

/**
 * Gère le clic pour sélectionner le flux de caisse. (V8)
 */
window.selectFluxType = function(type) {
    currentFluxType = type;
    document.getElementById('flux-details').classList.remove('hidden');

    // Mise à jour de l'UI des boutons
    document.getElementById('btn-recette').classList.remove('bg-success', 'text-white');
    document.getElementById('btn-depense').classList.remove('bg-danger', 'text-white');

    if (type === 'RECETTE') {
        document.getElementById('btn-recette').classList.add('bg-success', 'text-white');
    } else {
        document.getElementById('btn-depense').classList.add('bg-danger', 'text-white');
    }

    // Mise à jour du bouton de soumission
    document.getElementById('caisse-submit-btn').textContent = `Enregistrer la ${type}`;
};

/**
 * Gère la soumission de l'opération de caisse simplifiée. (V8)
 */
window.handleCaisseEntrySubmit = async function(event) {
    event.preventDefault();
    if (!currentFluxType) {
        NotificationManager.show('Veuillez sélectionner un type de flux (Recette/Dépense).', 'warning');
        return;
    }

    const data = {
        type: currentFluxType,
        contraAccountCode: document.getElementById('contra-account').value,
        libelle: document.getElementById('caisse-label').value,
        amount: parseFloat(document.getElementById('caisse-amount').value),
        companyId: appState.currentCompanyId
    };

    if (isNaN(data.amount) || data.amount <= 0) {
        NotificationManager.show('Le montant doit être un nombre positif.', 'error');
        return;
    }

    try {
        NotificationManager.show(`Enregistrement de la ${currentFluxType} en cours...`, 'info');
        
        // API CRITIQUE V4 : Endpoint pour la saisie simplifiée
        await apiFetch('accounting/caisse-entry', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Opération de caisse enregistrée avec succès !`, 'success');
        // Réinitialiser le formulaire
        document.getElementById('caisse-entry-form').reset();
        document.getElementById('flux-details').classList.add('hidden');
        currentFluxType = null;

    } catch (error) {
        NotificationManager.show(`Échec de l'enregistrement de caisse : ${error.message}`, 'error', 10000);
    }
};

/**
 * Fonction générique de bienvenue / contenu par défaut. (V8/V9)
 */
function generateDashboardWelcomeHTML(companyName, role) {
    return `
        <div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
            <i class="fas fa-tachometer-alt fa-5x text-primary/70 mb-6"></i>
            <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">Bienvenue sur votre Espace Opérationnel</h3>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                Vous êtes connecté en tant que **${role}** pour le dossier **${companyName}**. Utilisez le menu pour naviguer.
            </p>
        </div>
    `;
}


// --- 5. INITIALISATION ---

/**
 * Lie les événements DOM (Formulaires) au chargement du document.
 */
function attachGlobalListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    const modalCloseButton = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('professional-modal');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', ModalManager.close);
    }
    if (modalBackdrop) {
        // Fermeture si on clique en dehors
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                ModalManager.close();
            }
        });
    }
}


/**
 * Point d'entrée de l'application.
 */
document.addEventListener('DOMContentLoaded', () => {
    attachGlobalListeners();
    checkAuthAndRender();
});
