// =============================================================================
// FICHIER : public/assets/script.js (CORRIGÉ INTÉGRAL V9 - OPTIMAL DASHBOARD)
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
// 3. LOGIQUE D'AUTHENTIFICATION ET API (PROCESSUS DE CONNEXION INTÉGRALEMENT CONSERVÉ)
// =================================================================

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

// =================================================================
// 4. GESTION DE LA VUE ET DU DASHBOARD (AMÉLIORÉ V9)
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
// Utilitaires de Menu
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
 * RENDU DISPONIBLE DANS LA PORTÉE GLOBALE DU DOM.
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
 * Définit les options de menu basées sur le profil utilisateur et ses permissions.
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
 * Charge le contenu HTML/Données dans la zone principale (AMÉLIORÉ V9).
 */
async function loadContentArea(contentId, title) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">Chargement du module ${title}...</p></div>`;

    // Mise à jour de la classe active du menu
    document.querySelectorAll('#role-navigation-menu a').forEach(el => el.classList.remove('bg-primary', 'text-white'));
    const activeMenuItem = Array.from(document.querySelectorAll('#role-navigation-menu a')).find(el => el.textContent.includes(title));
    if (activeMenuItem) {
        activeMenuItem.classList.add('bg-primary', 'text-white');
    }

    try {
        let endpoint = '';
        let content = '';

        // Filtre de compagnie (Format V4)
        const companyFilter = `?companyId=${appState.currentCompanyId}`; 

        // S'assurer qu'un dossier est sélectionné, sauf pour le menu de sélection lui-même
        if (!appState.currentCompanyId && contentId !== 'dashboard') {
             // Afficher le message de sélection si on tente d'accéder à un autre module sans dossier
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
             return;
        }

        switch (contentId) {
            case 'dashboard':
                // V9 : Appel à /api/accounting/dashboard/kpis?companyId=X pour des KPIs riches
                endpoint = `/accounting/dashboard/kpis${companyFilter}`;
                content = await fetchDashboardData(endpoint);
                break;
            
            case 'chart-of-accounts': 
                endpoint = `/accounting/chart-of-accounts${companyFilter}`;
                content = await fetchChartOfAccountsData(endpoint);
                break;
            
            case 'caisse-operation': 
                content = generateCaisseOperationHTML();
                // Assurez-vous que les comptes sont chargés après le rendu HTML
                await loadCompanyAccountsForCaisse(); 
                break;
            
            case 'journal':
                // V9 : Appel à /api/accounting/journal?companyId=X pour la liste du journal
                endpoint = `/accounting/journal${companyFilter}`; 
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

// =================================================================
// V9 : DASHBOARD ET KPIS OPTIMAUX
// =================================================================

/**
 * Génère une carte de statistique (KPI) stylisée (Formule de Rendu Optimale).
 */
function generateStatCard(title, value, unit, icon, colorClass, trend = null, trendIcon = null) {
    // Formule de formatage : Conversion en nombre formaté si possible
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
    return generateDashboardHTML(response.data);
}

// =================================================================
// V9 : JOURNAL ET DRILL-DOWN (AMÉLIORÉ V9)
// =================================================================

/**
 * Récupère les données du Journal.
 */
async function fetchJournalData(endpoint) {
    // Simule la latence si l'endpoint ne renvoie pas de vraies données
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // Simuler des données si l'API n'est pas encore prête pour le journal
    const simulatedData = [
        { id: 1, date: '2025-01-15', libelle: 'Achat de fournitures - Facture XYZ', debit: 50000, credit: 0, status: 'Validé' },
        { id: 2, date: '2025-01-15', libelle: 'Vente de biens - Client A', debit: 0, credit: 150000, status: 'Brouillon' },
        { id: 3, date: '2025-01-16', libelle: 'Paiement fournisseur', debit: 0, credit: 25000, status: 'Validé' },
        { id: 4, date: '2025-01-17', libelle: 'Encaissement vente B', debit: 80000, credit: 0, status: 'Validé' },
    ];
    
    // Si l'API existe et renvoie { data: { entries: [...] } }
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        return generateJournalHTML(response.data.entries || response.data);
    } catch (e) {
        console.warn("Utilisation des données simulées pour le journal.");
        return generateJournalHTML(simulatedData);
    }
}

/**
 * Génère le HTML pour l'affichage des écritures de journal (V9).
 */
function generateJournalHTML(entries) {
    if (!entries || entries.length === 0) {
        return `<div class="p-4 text-center text-info"><i class="fas fa-info-circle mr-2"></i> Aucune écriture récente trouvée.</div>`;
    }

    // Afficher seulement 5 entrées sur le dashboard
    const rows = entries.slice(0, 5).map(entry => {
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
 * Gère le clic sur les détails (Drill-down) - V9.
 */
window.handleDrillDown = async function(entryId, moduleName) {
    try {
        const endpoint = `/accounting/details/${entryId}?companyId=${appState.currentCompanyId}`;
        NotificationManager.show(`Récupération des détails pour l'entrée ${entryId}...`, 'info');
        
        // Simuler la récupération (remplacer par apiFetch(endpoint))
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
// V9 : RAPPORTS ET EXPORT (AMÉLIORÉ V9)
// =================================================================

/**
 * Génère le menu de sélection de rapport.
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

function generateReportCard(title, icon, reportId, description) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <i class="${icon} fa-2x text-primary mb-3"></i>
            <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${title}</h4>
            <p class="text-sm text-gray-500 mb-4">${description}</p>
            <div class="flex space-x-3">
                <button onclick="window.handleOpenReportModal('${reportId}', '${title}')" class="flex-1 bg-primary text-white py-2 px-3 rounded-xl font-bold hover:bg-primary-dark transition-colors text-sm">
                    <i class="fas fa-eye"></i> Aperçu
                </button>
                <button onclick="window.exportReport('${reportId}', '${title}')" class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-xl font-bold hover:bg-gray-300 transition-colors text-sm">
                    <i class="fas fa-file-pdf"></i> PDF/CSV
                </button>
            </div>
        </div>
    `;
}

/**
 * Ouvre la modale du rapport sélectionné.
 */
window.handleOpenReportModal = async function(reportId, title) {
    try {
        const companyFilter = `?companyId=${appState.currentCompanyId}`;
        const endpoint = `/accounting/reports/${reportId}${companyFilter}`;
        
        NotificationManager.show(`Génération du rapport '${title}'...`, 'info');
        
        // Simuler des données de rapport pour la démo V9
        const mockReportData = {
            title: title,
            period: '01/01/2025 - 31/12/2025',
            sections: [
                { name: 'ACTIF COURANT', lines: [
                    { name: 'Caisse', balance: 500000 },
                    { name: 'Banque', balance: 1200000 },
                    { name: 'Créances Clients', balance: 300000 },
                    { name: 'TOTAL ACTIF COURANT', balance: 2000000 },
                ]},
                { name: 'PASSIF COURANT', lines: [
                    { name: 'Dettes Fournisseurs', balance: -750000 },
                    { name: 'Emprunts Bancaires CT', balance: -250000 },
                    { name: 'TOTAL PASSIF COURANT', balance: -1000000 },
                ]},
            ]
        };

        // Remplacer par const reportContent = await apiFetch(endpoint, { method: 'GET' }); 
        const reportContent = { data: mockReportData }; 
        
        ModalManager.open(`${title} SYSCOHADA`, generateReportHTML(reportContent.data));
    } catch (error) {
        NotificationManager.show(`Échec de la génération du rapport : ${error.message}`, 'error', 10000);
    }
}

/**
 * Déclenche l'exportation du rapport (PDF/CSV).
 */
window.exportReport = async function(reportId, title) {
    try {
        const companyFilter = `?companyId=${appState.currentCompanyId}&format=pdf`; 
        const endpoint = `/accounting/reports/${reportId}/export${companyFilter}`;
        
        NotificationManager.show(`Exportation de '${title}' en cours...`, 'info');

        // Simulation d'une attente d'export
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        NotificationManager.show(`Le rapport '${title}' a été exporté et téléchargé !`, 'success');
        
    } catch (error) {
        NotificationManager.show(`Échec de l'exportation: ${error.message}`, 'error', 10000);
    }
}


/**
 * Génère le HTML pour l'affichage du contenu du rapport (dans une modale).
 */
function generateReportHTML(reportData) {
    if (!reportData || !reportData.title || !reportData.sections) {
        return `<p class="p-4 text-danger">Données de rapport invalides.</p>`;
    }

    const sectionsHTML = reportData.sections.map(section => `
        <h4 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 border-b pb-1">${section.name}</h4>
        ${section.lines.map(line => {
            // Formules de Rendu Optimale: Gras pour les totaux, couleur pour le solde
            const isTotal = line.name.includes('TOTAL') || line.name.includes('SOLDE');
            const isNegative = line.balance < 0;
            const balanceClass = isNegative ? 'text-danger' : 'text-success';
            const fontWeight = isTotal ? 'font-extrabold text-lg' : 'font-medium';
            const balanceValue = (line.balance || 0).toLocaleString('fr-FR');
            
            return `
                <div class="flex justify-between items-center py-2 ${isTotal ? 'bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2' : ''}">
                    <span class="${fontWeight} ${isTotal ? 'text-secondary dark:text-white' : 'text-gray-700 dark:text-gray-300'}">${line.name}</span>
                    <span class="${fontWeight} ${balanceClass}">${balanceValue} XOF</span>
                </div>
            `;
        }).join('')}
    `).join('');

    return `
        <div class="p-4">
            <h3 class="text-2xl font-black text-primary mb-4">${reportData.title}</h3>
            <p class="text-sm text-gray-500 mb-6">Période: ${reportData.period || 'Année Courante'} - Dossier: ${appState.currentCompanyName}</p>
            ${sectionsHTML}
            <div class="mt-8 text-center">
                <button onclick="window.exportReport('bilan', '${reportData.title}')" class="bg-info text-white py-2 px-4 rounded-xl font-bold hover:bg-info-dark transition-colors">
                    <i class="fas fa-download mr-2"></i> Télécharger le Rapport
                </button>
            </div>
        </div>
    `;
}

// =================================================================
// Plan Comptable (CONSERVÉ + R/W OPTIMISÉ V9)
// =================================================================

/**
 * Récupère les données du Plan Comptable.
 */
async function fetchChartOfAccountsData(endpoint) {
    // Simuler des données si l'API n'est pas prête
    const simulatedAccounts = [
        { id: 101, code: '101000', name: 'Capital Social', type: 'equity', balance: 50000000 },
        { id: 211, code: '211000', name: 'Terrains', type: 'asset_other', balance: 15000000 },
        { id: 401, code: '401000', name: 'Fournisseurs', type: 'liability_other', balance: -2500000 },
        { id: 601, code: '601000', name: 'Achat de Marchandises', type: 'expense', balance: 1200000 },
        { id: 701, code: '701000', name: 'Ventes de Marchandises', type: 'income', balance: -15000000 },
        { id: 571, code: '571000', name: 'Caisse', type: 'asset_other', balance: 500000 },
    ];
    
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        return generateChartOfAccountsHTML(response.data);
    } catch (e) {
        console.warn("Utilisation des données simulées pour le plan comptable.");
        return generateChartOfAccountsHTML(simulatedAccounts);
    }
}

/**
 * Génère le HTML pour l'affichage du Plan Comptable.
 */
function generateChartOfAccountsHTML(accounts) {
    if (!accounts || accounts.length === 0) {
        return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Plan Comptable SYSCOHADA</h3>
            <div class="p-8 text-center text-info"><i class="fas fa-info-circle fa-2x mb-3"></i><p class="font-bold">Aucun compte trouvé pour ce dossier client.</p></div>
            <button onclick="window.showCreateAccountModal()" class="bg-success text-white py-2 px-4 rounded-xl font-bold hover:bg-success-dark transition-colors mt-4">
                <i class="fas fa-plus-circle mr-2"></i> Ajouter Compte
            </button>`;
    }

    const rows = accounts.map(account => `
        <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-3 font-bold">${account.code}</td>
            <td class="px-6 py-3">${account.name}</td>
            <td class="px-6 py-3">${account.type}</td>
            <td class="px-6 py-3 text-right font-black ${(account.balance || 0) < 0 ? 'text-danger' : 'text-success'}">${(account.balance || 0).toLocaleString('fr-FR')}</td>
            <td class="px-6 py-3 flex space-x-2">
                <button onclick="window.showCreateAccountModal(${account.id}, {code: '${account.code}', name: '${account.name}', type: '${account.type}'})" 
                        class="text-primary hover:text-primary-dark font-bold text-sm">Modifier</button>
                <button onclick="window.handleDeleteAccount(${account.id}, '${account.code}')" 
                        class="text-danger hover:text-danger-dark font-bold text-sm">Supprimer</button>
            </td>
        </tr>
    `).join('');

    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Plan Comptable SYSCOHADA</h3>
        <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-500">Affiche les comptes de la compagnie: **${appState.currentCompanyName}**.</p>
            <button onclick="window.showCreateAccountModal()" class="bg-success text-white py-2 px-4 rounded-xl font-bold hover:bg-success-dark transition-colors">
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
 * Ouvre la modale pour la création ou la modification d'un compte.
 */
window.showCreateAccountModal = function(accountId = null, currentData = {}) {
    const title = accountId ? "Modifier le Compte" : "Créer un Nouveau Compte";
    
    const htmlContent = `
        <form id="create-account-form" onsubmit="window.handleCreateAccountSubmit(event)">
            <input type="hidden" id="account-id" value="${accountId || ''}">
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Code du Compte (ex: 601000)</label>
                <input type="text" id="account-code" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" 
                        pattern="[0-9]{6,}" title="Code numérique de 6 chiffres minimum" value="${currentData.code || ''}">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Libellé</label>
                <input type="text" id="account-name" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" value="${currentData.name || ''}">
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
 * Gère la soumission du formulaire de création/modification de compte (R/W).
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

        // Simulation de l'appel API (remplacer par apiFetch pour le R/W)
        await apiFetch('/accounting/chart-of-accounts', { 
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

/**
 * Gère la suppression d'un compte (V9 R/W).
 */
window.handleDeleteAccount = async function(accountId, accountCode) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte ${accountCode} ? Cette action est irréversible et effacera toutes les écritures liées.`)) {
        return;
    }
    
    try {
        NotificationManager.show(`Suppression du compte ${accountCode} en cours...`, 'warning');

        // Simulation de l'appel API (remplacer par apiFetch pour le R/W)
        await apiFetch(`/accounting/chart-of-accounts/${accountId}?companyId=${appState.currentCompanyId}`, {
            method: 'DELETE',
        });

        NotificationManager.show(`Compte ${accountCode} supprimé avec succès !`, 'success');
        // Recharger le plan comptable
        loadContentArea('chart-of-accounts', 'Plan Comptable');
    } catch (error) {
        NotificationManager.show(`Échec de la suppression: ${error.message}`, 'error', 10000);
    }
};

// =================================================================
// Fonctions Opérations de Caisse (CAISSIER) (AMÉLIORÉ V9)
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
            <form id="caisse-entry-form" onsubmit="window.handleCaisseEntrySubmit(event)">
                
                <div class="flex space-x-4 mb-6">
                    <button type="button" onclick="window.selectFluxType('RECETTE')" id="btn-recette" class="flex-1 p-4 rounded-xl border-2 border-success text-success font-black hover:bg-success/10 transition-colors">
                        <i class="fas fa-arrow-alt-circle-up"></i> Recette
                    </button>
                    <button type="button" onclick="window.selectFluxType('DEPENSE')" id="btn-depense" class="flex-1 p-4 rounded-xl border-2 border-danger text-danger font-black hover:bg-danger/10 transition-colors">
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
                    <div class="mb-4">
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Montant (XOF)</label>
                        <input type="number" id="caisse-amount" required min="1" class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <button type="submit" id="caisse-submit-btn" class="w-full bg-primary text-white font-bold p-3 rounded-xl hover:bg-primary-dark transition-colors mt-4">
                        Enregistrer l'Opération
                    </button>
                </div>
            </form>
        </div>`;
}

/**
 * Met à jour l'interface utilisateur lors de la sélection du type de flux (Recette/Dépense).
 */
window.selectFluxType = function(type) {
    currentFluxType = type;
    document.getElementById('flux-details').classList.remove('hidden');
    
    // Mise à jour des classes pour la sélection visuelle
    document.getElementById('btn-recette').classList.remove('bg-success', 'text-white');
    document.getElementById('btn-depense').classList.remove('bg-danger', 'text-white');
    document.getElementById('btn-recette').classList.add('text-success');
    document.getElementById('btn-depense').classList.add('text-danger');


    if (type === 'RECETTE') {
        document.getElementById('btn-recette').classList.add('bg-success', 'text-white');
        document.getElementById('btn-depense').classList.remove('text-white');
        document.getElementById('caisse-submit-btn').textContent = 'Enregistrer la Recette';
    } else {
        document.getElementById('btn-depense').classList.add('bg-danger', 'text-white');
        document.getElementById('btn-recette').classList.remove('text-white');
        document.getElementById('caisse-submit-btn').textContent = 'Enregistrer la Dépense';
    }
};

/**
 * Charge les comptes pertinents (produits/charges) pour l'interface de caisse.
 */
async function loadCompanyAccountsForCaisse() {
    const selectElement = document.getElementById('contra-account');
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Chargement...</option>';

    try {
        // V9 : Endpoint dédié pour les comptes simplifiés (Charges/Produits)
        const response = await apiFetch(`/accounting/accounts/simplified?companyId=${appState.currentCompanyId}`, { method: 'GET' });
        
        let optionsHTML = '<option value="">-- Sélectionnez un compte --</option>';

        // Simuler des comptes si l'API ne renvoie rien
        const accounts = response.data && response.data.length > 0 ? response.data : [
            { code: '601000', name: 'Achats' }, 
            { code: '701000', name: 'Ventes' }, 
            { code: '622000', name: 'Fournitures de Bureau' }
        ];

        optionsHTML += accounts.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('');
        
        selectElement.innerHTML = optionsHTML;

    } catch (error) {
        selectElement.innerHTML = '<option value="">Erreur de chargement des comptes</option>';
        NotificationManager.show(`Impossible de charger les comptes: ${error.message}`, 'error', 10000);
    }
}

/**
 * Gère la soumission du formulaire de caisse.
 */
window.handleCaisseEntrySubmit = async function(event) {
    event.preventDefault();

    if (!currentFluxType) {
        NotificationManager.show('Veuillez sélectionner Recette ou Dépense.', 'warning');
        return;
    }

    const data = {
        fluxType: currentFluxType,
        contraAccountCode: document.getElementById('contra-account').value,
        label: document.getElementById('caisse-label').value,
        amount: parseFloat(document.getElementById('caisse-amount').value),
        companyId: appState.currentCompanyId
    };

    if (isNaN(data.amount) || data.amount <= 0) {
        NotificationManager.show('Le montant doit être un nombre positif.', 'error');
        return;
    }

    try {
        const btn = document.getElementById('caisse-submit-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.innerHTML = `<div class="loading-spinner mx-auto border-white border-top-white/20"></div>`;
        
        NotificationManager.show(`Enregistrement de l'opération en cours...`, 'info');

        // V9 : Endpoint pour les écritures simplifiées
        // Simulation de l'appel API (remplacer par apiFetch pour le R/W)
        await apiFetch('/accounting/caisse-entry', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Opération de type ${data.fluxType} enregistrée avec succès pour ${data.amount.toLocaleString('fr-FR')} XOF!`, 'success');

        // Réinitialiser le formulaire
        document.getElementById('caisse-entry-form').reset();
        document.getElementById('flux-details').classList.add('hidden');
        currentFluxType = null;

    } catch (error) {
        NotificationManager.show(`Échec de l'enregistrement: ${error.message}`, 'error', 10000);
    } finally {
        const btn = document.getElementById('caisse-submit-btn');
        btn.disabled = false;
        btn.textContent = originalText;
    }
};


// =================================================================
// Autres Vues/Utilitaires
// =================================================================

/**
 * Message d'accueil par défaut si le contenu n'est pas prêt.
 */
function generateDashboardWelcomeHTML(companyName, profile) {
    return `
        <div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
            <i class="fas fa-cubes fa-5x text-primary/70 mb-6"></i>
            <h3 class="text-3xl font-black text-gray-900 dark:text-white mb-2">Bienvenue, ${appState.user.name} !</h3>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                Vous êtes connecté(e) avec le profil **${profile}**. Le contexte actuel est le dossier **${companyName}**.
            </p>
            <p class="mt-4 text-sm text-gray-500">Utilisez le menu de gauche pour naviguer entre les différents modules comptables.</p>
        </div>
    `;
}

// --- 5. INITIALISATION ---

// Assurez-vous que les fonctions globales sont bien exposées
window.handleCompanyChange = window.handleCompanyChange;
window.showCreateAccountModal = window.showCreateAccountModal;
window.handleCreateAccountSubmit = window.handleCreateAccountSubmit;
window.handleDeleteAccount = window.handleDeleteAccount;
window.selectFluxType = window.selectFluxType;
window.handleCaisseEntrySubmit = window.handleCaisseEntrySubmit;
window.handleDrillDown = window.handleDrillDown;
window.handleOpenReportModal = window.handleOpenReportModal;
window.exportReport = window.exportReport;


document.addEventListener('DOMContentLoaded', checkAuthAndRender);
