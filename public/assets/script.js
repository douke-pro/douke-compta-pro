// =============================================================================
// FICHIER : public/assets/script.js (VERSION ARCHIBYTE V10 - FIABILITÉ & RAPPORTS COMPTABLES)
// Description : Logique Front-End (Vue et Interactions DOM)
// =============================================================================

// --- 1. CONFIGURATION GLOBALE & DÉTECTION D'ENVIRONNEMENT (SOLUTION AU ROUTAGE NON TROUVÉ) ---
// Utilisation d'un mécanisme robuste pour s'adapter à l'environnement d'hébergement.
let API_BASE_URL;

// L'URL spécifiée par l'utilisateur est conservée par défaut, mais avec une détection de fallback.
const DEFAULT_API_URL = 'https://douke-compta-pro.onrender.com/api'; 
const LOCAL_API_URL = 'http://localhost:3000/api';

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = LOCAL_API_URL;
} else if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
     // Détection des environnements de développement dynamiques (Codespaces/Gitpod)
    API_BASE_URL = `${window.location.protocol}//${window.location.host}/api`;
} else {
    // Utilisation de l'URL Render ou autre si l'environnement est inconnu ou de production
    API_BASE_URL = DEFAULT_API_URL;
}

console.log(`[ENV DEBUG] API_BASE_URL configurée: ${API_BASE_URL}`);


// État central de l'application
let appState = {
    isAuthenticated: false,
    token: null,
    user: null, // { name, email, profile, companiesList, selectedCompanyId, defaultCompany, ... }
    currentCompanyId: null,
    currentCompanyName: null,
};


// --- 2. GESTIONNAIRES D'INTERFACE (UI Managers) ---
// (Les managers de notification et de modale sont conservés pour l'efficacité V9)

const NotificationManager = {
    zone: document.getElementById('notification-zone'),
    show: function (message, type = 'success', duration = 5000) {
        if (!this.zone) return;
        const iconMap = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-exclamation-triangle"></i>', info: '<i class="fas fa-info-circle"></i>', warning: '<i class="fas fa-exclamation-circle"></i>' };
        const colorMap = { success: 'bg-success border-success/50', error: 'bg-danger border-danger/50', info: 'bg-info border-info/50', warning: 'bg-warning border-warning/50' };
        const notification = document.createElement('div');
        notification.className = `p-4 max-w-sm rounded-xl text-white shadow-lg fade-in border-l-4 ${colorMap[type]}`;
        notification.innerHTML = `<div class="flex items-center space-x-3">${iconMap[type]}<span class="font-bold">${message}</span></div>`;
        this.zone.prepend(notification);
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
        this.modalBody.innerHTML = '';
    }
};


// =================================================================
// 3. LOGIQUE D'AUTHENTIFICATION ET API (PROCESSUS DE CONNEXION INTÉGRALEMENT CONSERVÉ)
// =================================================================

/**
 * Fonction centrale pour toutes les requêtes API (FIABILISÉE V10).
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

        // Tenter de décoder le JSON si possible, sinon lever une erreur générique
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Si le corps n'est pas JSON (ex: erreur 500 pure, timeout)
            if (!response.ok) {
                throw new Error(`Erreur réseau ou serveur inattendu (${response.status} ${response.statusText}). Endpoint: ${endpoint}`);
            }
            // Si tout va bien, mais la réponse est vide (ex: 204 No Content), retourner un objet par défaut
            return { success: true, data: null }; 
        }

        if (!response.ok) {
            // Gérer les erreurs 401/403 (jeton expiré/non autorisé)
            if (response.status === 401 || response.status === 403) {
                // On suppose que le backend renvoie 'expirée' si c'est un problème de token
                if (data.error && data.error.includes('expirée')) {
                    NotificationManager.show('Session expirée. Reconnexion requise.', 'warning', 8000);
                } else {
                    NotificationManager.show(`Accès refusé: ${data.error || 'Erreur serveur.'}`, 'error');
                }
                handleLogout(true);
            }
            // Gère l'erreur d'API fournie par le backend
            throw new Error(data.error || `Erreur HTTP ${response.status}: L'API a retourné une erreur.`);
        }

        return data;

    } catch (error) {
        console.error('Erreur API Fetch:', error);
        if (!error.message.includes('Accès refusé')) {
            NotificationManager.show(error.message, 'error');
        }
        throw error;
    }
}

// Les fonctions handleLogin, handleRegister, handleLogout et checkAuthAndRender sont conservées 
// car le processus de connexion DOIT rester identique.

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="loading-spinner mx-auto border-white border-top-white/20"></div>`;

    try {
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        appState.token = response.data.token;
        appState.user = response.data;
        appState.isAuthenticated = true;

        appState.currentCompanyId = response.data.defaultCompany.id;
        appState.currentCompanyName = response.data.defaultCompany.name;
        appState.user.selectedCompanyId = response.data.defaultCompany.id;

        localStorage.setItem('douke_auth_token', appState.token);
        
        NotificationManager.show(`Connexion Réussie. Bienvenue, ${appState.user.name}.`);
        renderAppView();
        
    } catch (error) {
        document.getElementById('password').value = ''; 
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    NotificationManager.show('Fonction d\'inscription en cours de finalisation.', 'info');
}

function handleLogout(isAutoLogout = false) {
    localStorage.removeItem('douke_auth_token');
    appState = { isAuthenticated: false, token: null, user: null, currentCompanyId: null, currentCompanyName: null };
    
    if (!isAutoLogout) {
        NotificationManager.show('Vous êtes déconnecté.', 'info');
    }
    
    renderAppView();
    window.location.hash = '';
}

async function checkAuthAndRender() {
    const token = localStorage.getItem('douke_auth_token');
    
    if (!token) {
        appState.isAuthenticated = false;
        return renderAppView();
    }
    
    appState.token = token;
    
    try {
        const response = await apiFetch('/auth/me', { method: 'GET' }); 
        
        appState.user = response.data;
        appState.isAuthenticated = true;

        const selectedId = response.data.selectedCompanyId || (response.data.companiesList[0]?.id || null);
        
        appState.currentCompanyId = selectedId;
        appState.currentCompanyName = response.data.companiesList.find(c => c.id === selectedId)?.name || 'Dossier Inconnu';
        
    } catch (error) {
        console.warn('Token invalide ou expiré. Reconnexion requise.', error);
        handleLogout(true);
        return;
    }
    
    renderAppView();
}


// =================================================================
// 4. GESTION DE LA VUE ET DU DASHBOARD (V10)
// =================================================================

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
        // V10: S'assurer que les listeners de login/register sont actifs
        document.getElementById('login-form')?.addEventListener('submit', handleLogin);
        document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    }
}

function loadDashboard() {
    if (!appState.user) return;

    // Mise à jour des informations utilisateur
    document.getElementById('welcome-message').textContent = appState.user.name;
    document.getElementById('current-role').textContent = appState.user.profile;
    document.getElementById('user-avatar-text').textContent = appState.user.name.charAt(0).toUpperCase();

    // Mise à jour du contexte de travail
    document.getElementById('current-company-name').textContent = appState.currentCompanyName || 'Aucun Dossier Actif';
    const contextMessage = appState.currentCompanyId 
        ? `Comptabilité Analytique : ${appState.currentCompanyName}`
        : 'SÉLECTION REQUISE : Veuillez choisir un dossier client.';
    document.getElementById('context-message').textContent = contextMessage;

    // Construction du menu
    const menuContainer = document.getElementById('role-navigation-menu');
    menuContainer.innerHTML = '';
    
    if (appState.user.companiesList && appState.user.companiesList.length > 0) {
        menuContainer.insertAdjacentHTML('beforeend', createCompanySelectMenu(appState.user.companiesList));
    }
    
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
    
    // Ajout du bouton de déconnexion
    const logoutItem = document.createElement('a');
    logoutItem.className = `flex items-center p-4 rounded-xl font-bold transition-colors text-danger hover:bg-danger/10 mt-4`;
    logoutItem.href = '#';
    logoutItem.innerHTML = `<i class="fas fa-sign-out-alt w-6 text-center mr-3"></i><span>Déconnexion</span>`;
    logoutItem.onclick = (e) => {
        e.preventDefault();
        handleLogout();
    };
    menuContainer.appendChild(logoutItem);

    // Charger le contenu par défaut
    if (appState.currentCompanyId) {
        loadContentArea('dashboard', 'Tableau de Bord');
    } else {
        document.getElementById('dashboard-content-area').innerHTML = generateCompanySelectionPromptHTML();
    }
}

/**
 * Gère le changement de compagnie active (Exposée à Window).
 */
window.handleCompanyChange = async function (newCompanyId) { 
    const newId = parseInt(newCompanyId);
    const newCompany = appState.user.companiesList.find(c => c.id === newId);

    if (newCompany) {
        appState.currentCompanyId = newId;
        appState.currentCompanyName = newCompany.name;
        appState.user.selectedCompanyId = newId; 

        document.getElementById('current-company-name').textContent = appState.currentCompanyName;
        document.getElementById('context-message').textContent = `Comptabilité Analytique : ${appState.currentCompanyName}`;
        NotificationManager.show(`Dossier actif changé : ${appState.currentCompanyName}`, 'info');

        // On appelle une API pour enregistrer le choix côté BE (pour la persistence)
        try {
            await apiFetch('/user/set-active-company', {
                 method: 'POST',
                 body: JSON.stringify({ companyId: newId })
            });
        } catch(e) {
             NotificationManager.show(`Erreur lors de l'enregistrement du dossier par défaut: ${e.message}`, 'warning');
        }

        loadContentArea('dashboard', 'Tableau de Bord');
    }
};

/**
 * Charge le contenu HTML/Données dans la zone principale (V10).
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
        // S'assurer qu'un dossier est sélectionné
        if (!appState.currentCompanyId) {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
             return;
        }

        const companyFilter = `?companyId=${appState.currentCompanyId}`; 
        let endpoint = '';
        let content = '';

        switch (contentId) {
            case 'dashboard':
                endpoint = `/accounting/dashboard/kpis${companyFilter}`;
                content = await fetchDashboardData(endpoint);
                break;
            
            case 'chart-of-accounts': 
                endpoint = `/accounting/chart-of-accounts${companyFilter}`;
                content = await fetchChartOfAccountsData(endpoint);
                break;
            
            case 'caisse-operation': 
                content = generateCaisseOperationHTML();
                await loadCompanyAccountsForCaisse(); 
                break;
            
            case 'journal':
                endpoint = `/accounting/journal/recent${companyFilter}&limit=100`; 
                content = await fetchJournalData(endpoint, title); 
                break;
            
            case 'reports':
                // V10 : Affichage du panneau de configuration des rapports (période/système)
                content = generateReportConfigurationHTML();
                break;
                
            case 'ledger':
            case 'manual-entry': 
            case 'admin-users':
            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
        }
        
        if (content) {
            contentArea.innerHTML = content;
        }

    } catch (error) {
        contentArea.innerHTML = `<div class="p-8 text-center text-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p class="font-bold">Erreur de chargement des données pour ${title}.</p><p class="text-sm">Veuillez vérifier que l'API est fonctionnelle. Message d'erreur: ${error.message}</p></div>`;
    }
}


// =================================================================
// V10 : DASHBOARD ET KPIS RÉELS
// =================================================================

/**
 * Récupère les données du tableau de bord (V10 - KPIs).
 */
async function fetchDashboardData(endpoint) {
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        // V10 : Récupérer également les 5 dernières écritures pour la synthèse
        const journalResponse = await apiFetch(`/accounting/journal/recent?companyId=${appState.currentCompanyId}&limit=5`, { method: 'GET' });
        response.data.recentEntries = journalResponse.data || [];

        return generateDashboardHTML(response.data);
    } catch(e) {
        console.warn('Erreur lors de la récupération des KPIs, affichage du message de bienvenue.', e);
        // En cas d'échec de l'API, on affiche au moins l'interface utilisateur
        return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
    }
}

// (Le reste de la fonction generateDashboardHTML et generateStatCard est conservé de la V9)

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

function generateDashboardHTML(data) {
    if (!data || Object.keys(data).length === 0) return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);

    // Assurer que les valeurs sont numériques ou 0 pour éviter les NaN
    const cashBalance = data.cashBalance || 0;
    const netProfit = data.netProfit || 0;
    const shortTermDebt = data.shortTermDebt || 0;
    const grossMargin = data.grossMargin || 0;

    const kpi1 = generateStatCard('Trésorerie Actuelle', cashBalance, 'XOF', 'fas fa-wallet', 'border-success', data.cashTrend);
    const kpi2 = generateStatCard('Résultat Net (Annuel)', netProfit, 'XOF', 'fas fa-chart-bar', netProfit >= 0 ? 'border-primary' : 'border-danger', data.profitTrend);
    const kpi3 = generateStatCard('Passif Court Terme', shortTermDebt, 'XOF', 'fas fa-hand-holding-dollar', 'border-warning', data.debtTrend, 'fas fa-arrow-up');
    const kpi4 = generateStatCard('Marge Brute (Mois)', grossMargin, '%', 'fas fa-percent', 'border-info', data.marginTrend);

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
                ${generateJournalHTML(data.recentEntries || [], false)}
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Actions Rapides</h4>
                <div class="space-y-4">
                    <button onclick="loadContentArea('manual-entry', 'Passer une Écriture')" class="w-full bg-primary/10 text-primary font-bold p-3 rounded-xl hover:bg-primary/20 transition-colors">
                        <i class="fas fa-plus-square mr-2"></i> Nouvelle Écriture
                    </button>
                    <button onclick="loadContentArea('reports', 'Rapports SYSCOHADA')" class="w-full bg-info/10 text-info font-bold p-3 rounded-xl hover:bg-info/20 transition-colors">
                        <i class="fas fa-chart-pie mr-2"></i> Générer Rapports
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
 * Récupère et affiche les données du Journal.
 */
async function fetchJournalData(endpoint, title) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    const fullJournalHTML = `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">${title}</h3>` + generateJournalHTML(response.data || [], true);
    return fullJournalHTML;
}

/**
 * Génère le HTML pour l'affichage des écritures de journal (V10).
 */
function generateJournalHTML(entries, isFullView = false) {
    const displayEntries = isFullView ? entries : entries.slice(0, 5);

    if (!displayEntries || displayEntries.length === 0) {
        return `<div class="p-4 text-center text-info"><i class="fas fa-info-circle mr-2"></i> Aucune écriture récente trouvée.</div>`;
    }

    const rows = displayEntries.map(entry => {
        // Assurez-vous que les champs requis existent, sinon utilisez des valeurs par défaut
        const debit = entry.debit ? entry.debit.toLocaleString('fr-FR') : '-';
        const credit = entry.credit ? entry.credit.toLocaleString('fr-FR') : '-';
        const status = entry.status || 'Non Validé';
        const statusClass = status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning';
        const libelle = entry.libelle || 'N/A';
        const date = entry.date || 'N/A';
        const id = entry.id || 0;

        return `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-2 font-bold">${date}</td>
                <td class="px-4 py-2">${libelle}</td>
                <td class="px-4 py-2 text-right text-success font-semibold">${debit}</td>
                <td class="px-4 py-2 text-right text-danger font-semibold">${credit}</td>
                <td class="px-4 py-2"><span class="px-2 py-1 text-xs font-bold rounded-full ${statusClass}">${status}</span></td>
                <td class="px-4 py-2">
                    <button onclick="window.handleDrillDown(${id}, 'Journal Entry')" class="text-primary hover:text-primary-dark font-bold text-sm">Détails</button>
                </td>
            </tr>
        `;
    }).join('');

    const tableHTML = `
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
    `;
    
    // Pour le dashboard, ajouter un bouton 'Voir tout' si plus de 5 entrées
    if (!isFullView && entries.length > 5) {
        return tableHTML + `<div class="mt-4 text-center"><button onclick="loadContentArea('journal', 'Journaux et Écritures')" class="text-primary font-bold hover:underline">Voir tout le Journal (${entries.length} entrées)</button></div>`;
    }

    return tableHTML;
}

// =================================================================
// V10 : RAPPORTS (CONFIGURATION ET GÉNÉRATION)
// =================================================================

/**
 * Génère le panneau de configuration du rapport (Choix du système et de la période).
 */
function generateReportConfigurationHTML() {
    // Déterminer les dates par défaut (ex: 1er janvier de l'année en cours à aujourd'hui)
    const today = new Date().toISOString().slice(0, 10);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    
    return `
        <h3 class="text-3xl font-black text-secondary mb-8 fade-in">Configuration des Rapports Comptables</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
            **CRITIQUE:** Veuillez définir la période et le système comptable pour garantir la conformité SYSCOHADA.
        </p>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl mb-8">
            <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2"><i class="fas fa-filter mr-2"></i> Filtres Obligatoires</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label for="report-start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de Début</label>
                    <input type="date" id="report-start-date" value="${startOfYear}" required 
                           class="mt-1 block w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label for="report-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de Fin</label>
                    <input type="date" id="report-end-date" value="${today}" required 
                           class="mt-1 block w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label for="accounting-system" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Système Comptable</label>
                    <select id="accounting-system" required 
                            class="mt-1 block w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="SYSCOHADA-NORMAL">SYSCOHADA Normal</option>
                        <option value="SYSCOHADA-ALLEGE">SYSCOHADA Allégé</option>
                        <option value="OHADA-IFRS">OHADA/IFRS</option>
                    </select>
                </div>
            </div>
        </div>

        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2"><i class="fas fa-file-invoice-dollar mr-2"></i> Sélection du Rapport</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${generateReportSelectionCard('Bilan', 'fas fa-balance-scale', 'bilan', 'Actifs, Passifs et Capitaux Propres.')}
            ${generateReportSelectionCard('Compte de Résultat', 'fas fa-money-bill-transfer', 'pnl', 'Produits et Charges de la période.')}
            ${generateReportSelectionCard('Tableau des Flux', 'fas fa-arrows-split-up-and-down', 'cash-flow', 'Mouvements de Trésorerie.')}
            ${generateReportSelectionCard('Balance Générale', 'fas fa-list-ol', 'balance', 'Soldes Débiteurs et Créditeurs des comptes.')}
        </div>
    `;
}

function generateReportSelectionCard(title, icon, reportId, description) {
    return `
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col justify-between">
            <div>
                <i class="${icon} fa-2x text-primary mb-3"></i>
                <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-1">${title}</h4>
                <p class="text-xs text-gray-500 mb-4">${description}</p>
            </div>
            <div class="flex space-x-3 mt-3">
                <button onclick="window.handleGenerateReport('${reportId}', '${title}', 'VIEW')" class="flex-1 bg-primary text-white py-2 px-3 rounded-xl font-bold hover:bg-primary-dark transition-colors text-sm">
                    <i class="fas fa-eye"></i> Afficher
                </button>
                <button onclick="window.handleGenerateReport('${reportId}', '${title}', 'PDF')" class="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-xl font-bold hover:bg-gray-300 transition-colors text-sm">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
            </div>
        </div>
    `;
}

/**
 * Gère la génération ou l'exportation du rapport après la sélection de la période/système (V10).
 */
window.handleGenerateReport = async function(reportId, title, actionType) {
    const periodStart = document.getElementById('report-start-date').value;
    const periodEnd = document.getElementById('report-end-date').value;
    const system = document.getElementById('accounting-system').value;

    if (!periodStart || !periodEnd || !system) {
        NotificationManager.show('Veuillez sélectionner la période et le système comptable.', 'error');
        return;
    }

    const queryParams = new URLSearchParams({
        companyId: appState.currentCompanyId,
        startDate: periodStart,
        endDate: periodEnd,
        system: system,
    });
    
    try {
        if (actionType === 'VIEW') {
            NotificationManager.show(`Génération du rapport '${title}' pour affichage...`, 'info');
            const endpoint = `/accounting/reports/${reportId}?${queryParams.toString()}`;
            
            const response = await apiFetch(endpoint, { method: 'GET' });
            
            // Assurez-vous que les données sont structurées pour la fonction generateReportHTML
            if (!response.data || response.data.sections === undefined) {
                 throw new Error("L'API a retourné une structure de données invalide pour le rapport.");
            }

            ModalManager.open(`${title} (${system})`, generateReportHTML(response.data, periodStart, periodEnd));

        } else if (actionType === 'PDF') {
            NotificationManager.show(`Exportation de '${title}' en PDF...`, 'info', 15000);
            
            // Endpoint dédié à l'exportation
            const exportQueryParams = new URLSearchParams(queryParams);
            exportQueryParams.set('format', 'pdf');
            const endpoint = `/accounting/reports/${reportId}/export?${exportQueryParams.toString()}`;

            // L'appel doit gérer le téléchargement du fichier (pas seulement JSON)
            const exportUrl = `${API_BASE_URL}${endpoint}`;
            window.open(exportUrl, '_blank'); // Ouvre dans un nouvel onglet pour le téléchargement
            
            // Notifier l'utilisateur après l'action
            NotificationManager.show(`Le téléchargement de '${title}' devrait commencer sous peu.`, 'success');
        }
    } catch (error) {
        NotificationManager.show(`Échec de l'opération de rapport : ${error.message}`, 'error', 15000);
    }
}

/**
 * Génère le HTML pour l'affichage du contenu du rapport (dans une modale).
 */
function generateReportHTML(reportData, periodStart, periodEnd) {
    if (!reportData || !reportData.title || !reportData.sections) {
        return `<p class="p-4 text-danger">Données de rapport invalides ou manquantes.</p>`;
    }

    const sectionsHTML = reportData.sections.map(section => `
        <h4 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 border-b pb-1">${section.name}</h4>
        ${section.lines.map(line => {
            const isTotal = line.name.includes('TOTAL') || line.name.includes('SOLDE');
            const isNegative = line.balance < 0;
            // Formule de Rendu Optimale
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
            <h3 class="text-2xl font-black text-primary mb-2">${reportData.title}</h3>
            <p class="text-sm text-gray-500 mb-6">Période: Du ${periodStart} au ${periodEnd} - Dossier: ${appState.currentCompanyName}</p>
            ${sectionsHTML}
            <div class="mt-8 text-center">
                <button onclick="window.handleGenerateReport('bilan', '${reportData.title}', 'PDF')" class="bg-info text-white py-2 px-4 rounded-xl font-bold hover:bg-info-dark transition-colors">
                    <i class="fas fa-download mr-2"></i> Télécharger en PDF
                </button>
            </div>
        </div>
    `;
}

// =================================================================
// Fonctions existantes (Plan Comptable, Caisse, etc.) conservées V9 R/W
// =================================================================

// Les fonctions `fetchChartOfAccountsData`, `generateChartOfAccountsHTML`, 
// `showCreateAccountModal`, `handleCreateAccountSubmit`, `handleDeleteAccount`,
// `generateCaisseOperationHTML`, `selectFluxType`, `loadCompanyAccountsForCaisse`, 
// et `handleCaisseEntrySubmit` sont conservées de la V9, car leur logique de 
// R/W était déjà optimisée et conforme à la demande.

/**
 * Récupère les données du Plan Comptable.
 */
async function fetchChartOfAccountsData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    return generateChartOfAccountsHTML(response.data || []);
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
            <td class="px-6 py-3">${account.type || 'N/A'}</td>
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
    if (currentData.type) {
        document.getElementById('account-type').value = currentData.type;
    }
};

window.handleCreateAccountSubmit = async function(event) {
    event.preventDefault();
    const accountId = document.getElementById('account-id').value;
    const isEdit = accountId !== '';
    const data = {
        id: accountId ? parseInt(accountId) : undefined,
        code: document.getElementById('account-code').value,
        name: document.getElementById('account-name').value,
        type: document.getElementById('account-type').value,
        companyId: appState.currentCompanyId
    };

    try {
        const method = isEdit ? 'PUT' : 'POST';
        const msg = isEdit ? 'Modification du compte en cours...' : 'Création du compte en cours...';
        NotificationManager.show(msg, 'info');

        await apiFetch('/accounting/chart-of-accounts', { 
            method: method, 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Compte ${data.code} enregistré avec succès !`, 'success');
        ModalManager.close();
        loadContentArea('chart-of-accounts', 'Plan Comptable'); 
    } catch (error) {
        NotificationManager.show(`Échec de l'opération : ${error.message}`, 'error', 10000);
    }
};

window.handleDeleteAccount = async function(accountId, accountCode) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte ${accountCode} ? Cette action est irréversible et effacera toutes les écritures liées.`)) {
        return;
    }
    
    try {
        NotificationManager.show(`Suppression du compte ${accountCode} en cours...`, 'warning');
        await apiFetch(`/accounting/chart-of-accounts/${accountId}?companyId=${appState.currentCompanyId}`, {
            method: 'DELETE',
        });

        NotificationManager.show(`Compte ${accountCode} supprimé avec succès !`, 'success');
        loadContentArea('chart-of-accounts', 'Plan Comptable');
    } catch (error) {
        NotificationManager.show(`Échec de la suppression: ${error.message}`, 'error', 10000);
    }
};

// --- Caisse simplifiée (V9) ---

let currentFluxType = null; 

function generateCaisseOperationHTML() {
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

window.selectFluxType = function(type) {
    currentFluxType = type;
    document.getElementById('flux-details').classList.remove('hidden');
    
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

async function loadCompanyAccountsForCaisse() {
    const selectElement = document.getElementById('contra-account');
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">Chargement...</option>';

    try {
        const response = await apiFetch(`/accounting/accounts/simplified?companyId=${appState.currentCompanyId}`, { method: 'GET' });
        
        let optionsHTML = '<option value="">-- Sélectionnez un compte --</option>';

        const accounts = response.data || [];

        optionsHTML += accounts.map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`).join('');
        
        selectElement.innerHTML = optionsHTML;

    } catch (error) {
        selectElement.innerHTML = '<option value="">Erreur de chargement des comptes</option>';
        NotificationManager.show(`Impossible de charger les comptes: ${error.message}`, 'error', 10000);
    }
}

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

        await apiFetch('/accounting/caisse-entry', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Opération de type ${data.fluxType} enregistrée avec succès pour ${data.amount.toLocaleString('fr-FR')} XOF!`, 'success');

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
// Utilitaires de Menu et Divers
// =================================================================

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

function getRoleBaseMenus(role) {
    const menus = [
        { id: 'dashboard', name: 'Tableau de Bord', icon: 'fas fa-chart-line' },
    ];
    
    if (role === 'CAISSIER') {
        menus.push({ id: 'caisse-operation', name: 'Opérations de Caisse', icon: 'fas fa-cash-register' });
        menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
        return menus;
    }

    menus.push({ id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' });
    menus.push({ id: 'journal', name: 'Journaux et Écritures', icon: 'fas fa-book' });
    menus.push({ id: 'ledger', name: 'Grand Livre / Balance', icon: 'fas fa-balance-scale' });
    
    menus.push({ id: 'chart-of-accounts', name: 'Plan Comptable', icon: 'fas fa-list-alt' }); 
    menus.push({ id: 'manual-entry', name: 'Passer une Écriture', icon: 'fas fa-plus-square' }); 
    
    if (role === 'ADMIN') {
        menus.push({ id: 'admin-users', name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog' });
    }
    
    return menus;
}

function generateCompanySelectionPromptHTML() {
    return `<div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
        <i class="fas fa-sitemap fa-5x text-warning/70 mb-6"></i>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">Sélectionnez votre Dossier Actif</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Afin d'accéder aux données comptables, veuillez choisir un dossier client dans le menu de gauche.
        </p>
    </div>`;
}

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

window.handleDrillDown = async function(entryId, moduleName) {
    try {
        const endpoint = `/accounting/details/${entryId}?companyId=${appState.currentCompanyId}`;
        NotificationManager.show(`Récupération des détails pour l'entrée ${entryId}...`, 'info');
        
        const response = await apiFetch(endpoint, { method: 'GET' });

        const mockDetails = { // Utilisé si les données réelles sont incomplètes
            id: entryId,
            module: moduleName,
            details: response.data.details || 'Détails complets de l\'écriture n° ' + entryId + ' avec lignes de comptes, documents attachés, etc.',
            accounts: response.data.accounts || []
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

// --- 5. INITIALISATION ---

// Exposer les fonctions critiques au scope global (window) pour les gestionnaires d'événements inline du HTML
window.handleCompanyChange = window.handleCompanyChange;
window.showCreateAccountModal = window.showCreateAccountModal;
window.handleCreateAccountSubmit = window.handleCreateAccountSubmit;
window.handleDeleteAccount = window.handleDeleteAccount;
window.selectFluxType = window.selectFluxType;
window.handleCaisseEntrySubmit = window.handleCaisseEntrySubmit;
window.handleDrillDown = window.handleDrillDown;
window.handleGenerateReport = window.handleGenerateReport; // Nouveau gestionnaire

document.addEventListener('DOMContentLoaded', checkAuthAndRender);
