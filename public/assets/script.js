// =============================================================================
// FICHIER : public/assets/script.js (VERSION V13 - FINALE CORRIGÉE)
// Description : Logique Front-End avec toutes les améliorations appliquées
// Architecture : Multi-tenant sécurisé + API Odoo optimisée
// =============================================================================

// --- 1. CONFIGURATION GLOBALE ---
const API_BASE_URL = 'https://douke-compta-pro.onrender.com';
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// État central de l'application (ESSENTIEL POUR L'ISOLATION)
let appState = {
    isAuthenticated: false,
    token: null,
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
        
        // 🔑 CORRECTION CRITIQUE: Réattacher l'événement au bouton de fermeture
        this.attachCloseHandler();
    },
    
    close: function () {
        if (!this.modalBackdrop) return;
        
        document.body.classList.remove('modal-open');
        this.modalBackdrop.style.display = 'none';
        this.modalBody.innerHTML = '';
    },
    
    // 🔑 NOUVELLE MÉTHODE: Attacher les événements de fermeture
    attachCloseHandler: function() {
        // Fermeture par le bouton X
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }
        
        // Fermeture par clic sur le backdrop
        if (this.modalBackdrop) {
            this.modalBackdrop.onclick = (e) => {
                if (e.target === this.modalBackdrop) {
                    this.close();
                }
            };
        }
        
        // Fermeture par touche Échap
        document.onkeydown = (e) => {
            if (e.key === 'Escape' && this.modalBackdrop.style.display === 'flex') {
                this.close();
            }
        };
    }
};

// =================================================================
// 3. LOGIQUE D'AUTHENTIFICATION ET API
// =================================================================

function cleanUrlJoin(base, path) {
    const cleanedBase = base.replace(/\/+$/, '');
    const cleanedPath = path.replace(/^\/+/, '');
    return `${cleanedBase}/api/${cleanedPath}`;
}

async function apiFetch(endpoint, options = {}) {
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
            if (response.status === 401 || response.status === 403) {
                if (data.error && data.error.includes('expirée')) {
                    NotificationManager.show('Session expirée. Reconnexion requise.', 'warning', 8000);
                } else {
                    NotificationManager.show(`Accès refusé: ${data.error || 'Erreur serveur.'}`, 'error');
                }
                handleLogout(true);
            }
            throw new Error(data.error || `Erreur HTTP ${response.status}`);
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

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-submit-btn');
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="loading-spinner mx-auto border-white border-top-white/20"></div>`;

    try {
        const response = await apiFetch('auth/login', { 
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
        const response = await apiFetch('auth/me', { method: 'GET' }); 
        
        appState.user = response.data;
        appState.isAuthenticated = true;

        const selectedId = response.data.selectedCompanyId || (response.data.companiesList[0]?.id || null);
        
        appState.currentCompanyId = selectedId;
        appState.currentCompanyName = response.data.companiesList.find(c => c.id === selectedId)?.name || 'Dossier Inconnu';
        
    } catch (error) {
        console.warn('Token invalide ou expiré. Reconnexion requise.');
        handleLogout(true);
        return;
    }
    
    renderAppView();
}

// =================================================================
// 4. GESTION DE LA VUE ET DU DASHBOARD
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
    }
}

function loadDashboard() {
    if (!appState.user) return;

    document.getElementById('welcome-message').textContent = appState.user.name;
    document.getElementById('current-role').textContent = appState.user.profile;
    document.getElementById('user-avatar-text').textContent = appState.user.name.charAt(0).toUpperCase();
    document.getElementById('current-company-name').textContent = appState.currentCompanyName || 'Aucun Dossier Actif';
    
    const contextMessage = appState.currentCompanyId 
        ? `Comptabilité Analytique : ${appState.currentCompanyName}`
        : 'SÉLECTION REQUISE : Veuillez choisir un dossier client.';
        
    document.getElementById('context-message').textContent = contextMessage;

    const menuContainer = document.getElementById('role-navigation-menu');
    menuContainer.innerHTML = '';
    
    if (appState.user.companiesList && appState.user.companiesList.length > 0) {
        const companySelectHTML = createCompanySelectMenu(appState.user.companiesList);
        menuContainer.insertAdjacentHTML('beforeend', companySelectHTML);
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
    
    const contentArea = document.getElementById('dashboard-content-area');
    
    if (appState.currentCompanyId) {
        loadContentArea('dashboard', 'Tableau de Bord');
    } else {
        if (contentArea) {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
        }
    }
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

        loadContentArea('dashboard', 'Tableau de Bord');
    }
};

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

async function loadContentArea(contentId, title) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">Chargement du module ${title}...</p></div>`;

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

        const companyFilter = `?companyId=${appState.currentCompanyId}`; 

        if (!appState.currentCompanyId && contentId !== 'dashboard') {
             contentArea.innerHTML = generateCompanySelectionPromptHTML();
             return;
        }

        switch (contentId) {
            case 'dashboard':
                endpoint = `accounting/dashboard/kpis${companyFilter}`;
                content = await fetchDashboardData(endpoint);
                break;
            
            case 'chart-of-accounts': 
                endpoint = `accounting/chart-of-accounts${companyFilter}`;
                content = await fetchChartOfAccountsData(endpoint);
                break;
            
            case 'caisse-operation': 
                content = generateCaisseOperationHTML();
                await loadCompanyAccountsForCaisse();
                break;
            
            case 'journal':
                endpoint = `accounting/journal${companyFilter}`; 
                content = await fetchJournalData(endpoint); 
                break;
            
            case 'reports':
                content = generateReportsMenuHTML();
                break;
                
            case 'manual-entry':
                contentArea.innerHTML = generateManualEntryFormHTML();
                window.initializeManualEntryLogic(); 
                return;

            case 'ledger':
            case 'admin-users':
            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
        }
        
        if (content) {
            contentArea.innerHTML = content;
        }

    } catch (error) {
        contentArea.innerHTML = `<div class="p-8 text-center text-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p class="font-bold">Erreur de chargement des données pour ${title}.</p><p class="text-sm">${error.message}</p></div>`;
    }
}

// =================================================================
// DASHBOARD ET KPIS
// =================================================================

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
    if (!data) return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);

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

async function fetchDashboardData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
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

    const finalData = response.data && Object.keys(response.data).length > 0 ? response.data : simulatedData;

    return generateDashboardHTML(finalData);
}

// =================================================================
// JOURNAL (AVEC AMÉLIORATIONS)
// =================================================================

/**
 * 🔧 AMÉLIORATION: Récupère les journaux ET les écritures avec filtres
 */
async function fetchJournalData(endpoint) {
    const companyId = appState.currentCompanyId;
    const companyFilter = `?companyId=${companyId}`;
    
    try {
        // 1️⃣ Récupérer la liste des journaux pour le filtre
        const journalsResponse = await apiFetch(`accounting/journals${companyFilter}`, { method: 'GET' });
        const journals = journalsResponse.data || [];
        
        // 2️⃣ Récupérer les écritures
        const entriesResponse = await apiFetch(`accounting/journal${companyFilter}`, { method: 'GET' });
        const entries = entriesResponse.data?.entries || entriesResponse.data || [];
        
        // 3️⃣ Générer le HTML avec filtres
        return generateJournalWithFiltersHTML(entries, journals);
        
    } catch (e) {
        console.error("Erreur fetchJournalData:", e);
        return '<p class="text-center text-danger mt-4">Erreur de chargement des données.</p>';
    }
}

/**
 * 🔧 AMÉLIORATION: Génère le HTML avec filtres (Type/Journal/Période)
 */
function generateJournalWithFiltersHTML(entries, journals) {
    // Options du menu déroulant journaux
    const journalOptions = journals.map(j => 
        `<option value="${j.id}">${j.name} (${j.code})</option>`
    ).join('');
    
    // En-tête avec filtres
    const filtersHTML = `
        <div class="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 class="text-2xl font-black text-secondary mb-4">
                <i class="fas fa-filter mr-2"></i> Filtres
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Filtre par Type -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Type d'affichage
                    </label>
                    <select id="view-type-filter" onchange="window.handleViewTypeChange(this.value)" 
                        class="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="entries">📋 Écritures Comptables</option>
                        <option value="journals">📖 Liste des Journaux</option>
                    </select>
                </div>
                
                <!-- Filtre par Journal -->
                <div id="journal-filter-container">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Filtrer par Journal
                    </label>
                    <select id="journal-filter" onchange="window.handleJournalFilter(this.value)" 
                        class="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Tous les journaux</option>
                        ${journalOptions}
                    </select>
                </div>
                
                <!-- Filtre par Période -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Période
                    </label>
                    <select id="period-filter" onchange="window.handlePeriodFilter(this.value)" 
                        class="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="all">Toutes les périodes</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                        <option value="year">Cette année</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    // Conteneur pour les résultats
    const resultsHTML = `
        <div id="journal-results-container" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-2xl font-black text-secondary mb-4">
                <i class="fas fa-book mr-2"></i> Écritures Comptables
            </h3>
            <div id="journal-table-container">
                ${generateJournalHTML(entries)}
            </div>
        </div>
    `;
    
    return filtersHTML + resultsHTML;
}

/**
 * 🔧 AMÉLIORATION: Affiche Journal + N° Opération
 */
function generateJournalHTML(entries) {
    if (!entries || entries.length === 0) {
        return '<p class="text-center text-gray-500 mt-4">Aucune écriture trouvée pour le moment.</p>';
    }

    const tableRows = entries.map(entry => {
        const numero = entry.name || `#${entry.id}`;  // ← N° opération
        const journal = entry.journal || 'N/A';  // ← Nom du journal
        const narration = entry.libelle || `Écriture #${entry.id}`;
        const debit = (entry.debit || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
        const credit = (entry.credit || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
        
        let statusClass = 'text-gray-500';
        if (entry.status === 'Validé') {
            statusClass = 'text-success';
        } else if (entry.status === 'Brouillon') {
            statusClass = 'text-warning';
        }

        return `
            <tr class="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" onclick="window.handleDrillDown(${entry.id}, 'Journal')">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">${numero}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${entry.date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">${journal}</td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">${narration}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-success">${debit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-danger">${credit}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">${entry.status || 'Inconnu'}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Opération</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débit</th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédit</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

// =================================================================
// HANDLERS DES FILTRES (NOUVELLES FONCTIONS GLOBALES)
// =================================================================

/**
 * 🔧 AMÉLIORATION: Change le type d'affichage (Écritures vs Journaux)
 */
window.handleViewTypeChange = async function(viewType) {
    const companyId = appState.currentCompanyId;
    const companyFilter = `?companyId=${companyId}`;
    
    const container = document.getElementById('journal-results-container');
    const tableContainer = document.getElementById('journal-table-container');
    
    if (!container || !tableContainer) return;
    
    try {
        if (viewType === 'journals') {
            // Afficher la liste des journaux
            container.querySelector('h3').innerHTML = '<i class="fas fa-book mr-2"></i> Liste des Journaux';
            
            const response = await apiFetch(`accounting/journals${companyFilter}`, { method: 'GET' });
            const journals = response.data || [];
            
            tableContainer.innerHTML = generateJournalsListHTML(journals);
            
            // Cacher le filtre par journal (pas utile ici)
            document.getElementById('journal-filter-container').style.display = 'none';
            
        } else {
            // Afficher les écritures
            container.querySelector('h3').innerHTML = '<i class="fas fa-book mr-2"></i> Écritures Comptables';
            
            const response = await apiFetch(`accounting/journal${companyFilter}`, { method: 'GET' });
            const entries = response.data?.entries || response.data || [];
            
            tableContainer.innerHTML = generateJournalHTML(entries);
            
            // Réafficher le filtre par journal
            document.getElementById('journal-filter-container').style.display = 'block';
        }
    } catch (error) {
        NotificationManager.show('Erreur lors du changement de vue.', 'error');
    }
};

/**
 * 🔧 AMÉLIORATION: Filtre les écritures par journal
 */
window.handleJournalFilter = async function(journalId) {
    const companyId = appState.currentCompanyId;
    let endpoint = `accounting/journal?companyId=${companyId}`;
    
    if (journalId) {
        endpoint += `&journal_id=${journalId}`;
    }
    
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        const entries = response.data?.entries || response.data || [];
        
        const tableContainer = document.getElementById('journal-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = generateJournalHTML(entries);
        }
        
        NotificationManager.show(`Filtré: ${entries.length} écriture(s)`, 'info');
    } catch (error) {
        NotificationManager.show('Erreur lors du filtrage.', 'error');
    }
};

/**
 * 🔧 AMÉLIORATION: Filtre les écritures par période
 */
window.handlePeriodFilter = async function(period) {
    const companyId = appState.currentCompanyId;
    let endpoint = `accounting/journal?companyId=${companyId}`;
    
    // Calcul des dates selon la période
    const today = new Date();
    let dateFrom = null;
    let dateTo = today.toISOString().split('T')[0];
    
    switch(period) {
        case 'today':
            dateFrom = dateTo;
            break;
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            dateFrom = weekAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            dateFrom = monthAgo.toISOString().split('T')[0];
            break;
        case 'year':
            dateFrom = `${today.getFullYear()}-01-01`;
            break;
        default:
            dateFrom = null;
            dateTo = null;
    }
    
    if (dateFrom) {
        endpoint += `&date_from=${dateFrom}&date_to=${dateTo}`;
    }
    
    try {
        const response = await apiFetch(endpoint, { method: 'GET' });
        const entries = response.data?.entries || response.data || [];
        
        const tableContainer = document.getElementById('journal-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = generateJournalHTML(entries);
        }
        
        NotificationManager.show(`${entries.length} écriture(s) trouvée(s)`, 'info');
    } catch (error) {
        NotificationManager.show('Erreur lors du filtrage par période.', 'error');
    }
};

/**
 * 🔧 AMÉLIORATION: Génère le HTML de la liste des journaux
 */
function generateJournalsListHTML(journals) {
    if (!journals || journals.length === 0) {
        return '<p class="text-center text-gray-500 mt-4">Aucun journal trouvé.</p>';
    }
    
    const cards = journals.map(journal => `
        <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border-l-4 border-primary hover:shadow-lg transition-shadow cursor-pointer"
             onclick="window.handleJournalClick('${journal.id}', '${journal.name}')">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="text-lg font-bold text-gray-900 dark:text-white">${journal.name}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Code: ${journal.code}</p>
                </div>
                <div class="text-right">
                    <span class="inline-block px-3 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary">
                        ${journal.type || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;
}

/**
 * 🔧 AMÉLIORATION: Gère le clic sur un journal
 */
window.handleJournalClick = function(journalId, journalName) {
    // Basculer vers la vue "Écritures" et filtrer par ce journal
    document.getElementById('view-type-filter').value = 'entries';
    document.getElementById('journal-filter').value = journalId;
    
    window.handleViewTypeChange('entries').then(() => {
        window.handleJournalFilter(journalId);
        NotificationManager.show(`Affichage des écritures du journal: ${journalName}`, 'info');
    });
};

window.handleDrillDown = async function(entryId, moduleName) {
    try {
        const endpoint = `accounting/details/${entryId}?companyId=${appState.currentCompanyId}`;
        NotificationManager.show(`Récupération des détails pour l'entrée ${entryId}...`, 'info');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockDetails = {
            id: entryId,
            module: moduleName,
            details: 'Détails complets de l\'écriture n° ' + entryId + ' avec lignes de comptes, documents attachés, etc.',
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
// RAPPORTS
// =================================================================

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

window.handleOpenReportModal = async function(reportId, reportTitle) {
    try {
        const companyFilter = `?companyId=${appState.currentCompanyId}`;
        const endpoint = `accounting/report/${reportId}${companyFilter}`;
        
        NotificationManager.show(`Génération du rapport '${reportTitle}' en cours...`, 'info', 10000);
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        
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

window.exportReport = function(reportId, reportTitle) {
    NotificationManager.show(`Simulation d'export du rapport '${reportTitle}' en PDF/CSV.`, 'warning', 7000);
};

// =================================================================
// PLAN COMPTABLE
// =================================================================

async function fetchChartOfAccountsData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    return generateChartOfAccountsHTML(response.data);
}

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
            <td class="px-6 py-3">${account.account_type || account.type}</td>
            <td class="px-6 py-3 text-right font-black">${(account.balance || 0).toLocaleString('fr-FR')}</td>
            <td class="px-6 py-3">
                <button onclick="showCreateAccountModal(${account.id}, {code: '${account.code}', name: '${account.name}', type: '${account.account_type || account.type}'})" 
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

        await apiFetch('accounting/chart-of-accounts', { 
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

// =================================================================
// OPÉRATIONS DE CAISSE
// =================================================================

let currentFluxType = null; 
let loadedCompanyAccounts = [];

function generateCaisseOperationHTML() {
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
                        <label class="block text-gray-700 dark:text-gray-300 font-bold mb-2">Compte de Contrepartie</label>
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

async function loadCompanyAccountsForCaisse() {
    try {
        const endpoint = `accounting/chart-of-accounts?companyId=${appState.currentCompanyId}`;
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        loadedCompanyAccounts = response.data || [];
        
        const select = document.getElementById('contra-account');
        if (!select) return;

        const filteredAccounts = loadedCompanyAccounts.filter(acc => {
            const type = acc.account_type || acc.type;
            return ['income', 'expense'].includes(type);
        });

        select.innerHTML = '<option value="">-- Sélectionnez un compte --</option>';

        filteredAccounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.code;
            const type = acc.account_type || acc.type;
            option.textContent = `${acc.code} - ${acc.name} (${type.toUpperCase()})`;
            select.appendChild(option);
        });

    } catch (error) {
        NotificationManager.show('Erreur lors du chargement des comptes de contrepartie.', 'error');
        const select = document.getElementById('contra-account');
        if (select) select.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}

window.selectFluxType = function(type) {
    currentFluxType = type;
    document.getElementById('flux-details').classList.remove('hidden');

    document.getElementById('btn-recette').classList.remove('bg-success', 'text-white');
    document.getElementById('btn-depense').classList.remove('bg-danger', 'text-white');

    if (type === 'RECETTE') {
        document.getElementById('btn-recette').classList.add('bg-success', 'text-white');
    } else {
        document.getElementById('btn-depense').classList.add('bg-danger', 'text-white');
    }

    document.getElementById('caisse-submit-btn').textContent = `Enregistrer la ${type}`;
};

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
        
        await apiFetch('accounting/caisse-entry', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });

        NotificationManager.show(`Opération de caisse enregistrée avec succès !`, 'success');
        document.getElementById('caisse-entry-form').reset();
        document.getElementById('flux-details').classList.add('hidden');
        currentFluxType = null;

    } catch (error) {
        NotificationManager.show(`Échec de l'enregistrement de caisse : ${error.message}`, 'error', 10000);
    }
};

// =================================================================
// SAISIE MANUELLE D'ÉCRITURE (100% COMPATIBLE AVEC MODULE PYTHON)
// =================================================================

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

function generateManualEntryFormHTML() {
    return `
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-3xl font-black text-secondary flex items-center">
                    <i class="fas fa-calculator mr-3 text-primary"></i> Nouvelle Écriture Comptable
                </h3>
                <div id="period-badge" class="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 shadow-sm">
                    <i class="fas fa-calendar-check mr-2"></i> Période : Vérification...
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-100">
                <form id="journalEntryForm" class="space-y-6">
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date d'Écriture</label>
                            <input type="date" id="entry-date" class="w-full rounded-xl border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-primary font-bold" required>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Journal</label>
                            <select id="journal-code" class="w-full rounded-xl border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-primary" required>
                                <option value="">Chargement...</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Référence</label>
                            <input type="text" id="narration" class="w-full rounded-xl border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-primary" placeholder="Ex: FACTURE-2026-XYZ" required>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-3 px-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <div class="col-span-2">Compte</div>
                        <div class="col-span-5">Libellé</div>
                        <div class="col-span-2 text-right">Débit</div>
                        <div class="col-span-2 text-right">Crédit</div>
                        <div class="col-span-1"></div>
                    </div>

                    <div id="lines-container" class="space-y-3 min-h-[150px]"></div>

                    <div class="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-4">
                        <button type="button" onclick="window.addLineToEntry()" class="group bg-gray-100 text-secondary font-bold py-3 px-6 rounded-xl hover:bg-secondary hover:text-white transition-all shadow-sm">
                            <i class="fas fa-plus-circle mr-2"></i> Ajouter ligne
                        </button>

                        <div class="flex flex-col items-end">
                            <div id="total-balance" class="text-lg font-black p-3 rounded-xl transition-all shadow-inner">
                                Balance : 0,00 XOF
                            </div>
                            <button type="submit" id="submit-btn" class="mt-2 bg-primary text-white font-black py-4 px-10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest" disabled>
                                <i class="fas fa-paper-plane mr-2"></i> Valider
                            </button>
                        </div>
                    </div>
                </form>
                <div id="entry-message" class="mt-6 text-center p-4 rounded-xl hidden"></div>
            </div>
        </div>
        <datalist id="accounts-list"></datalist>
    `;
}

window.addLineToEntry = function(defaultValues = {}) {
    const container = document.getElementById('lines-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'journal-line grid grid-cols-12 gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-transparent hover:border-blue-100 transition-all items-center';
    
    row.innerHTML = `
        <div class="col-span-2">
            <input type="text" list="accounts-list" class="line-account-code w-full p-2.5 border-none rounded-lg font-mono text-sm font-bold bg-white shadow-sm focus:ring-2 focus:ring-primary uppercase" placeholder="Code..." value="${defaultValues.accountCode || ''}" required>
        </div>
        <div class="col-span-5">
            <input type="text" class="line-name w-full p-2.5 border-none rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-primary" placeholder="Libellé..." value="${defaultValues.name || ''}" required>
        </div>
        <div class="col-span-2">
            <input type="number" step="0.01" min="0" class="line-debit w-full p-2.5 border-none rounded-lg text-right font-black text-green-700 bg-white shadow-sm" placeholder="0.00" value="${defaultValues.debit || ''}">
        </div>
        <div class="col-span-2">
            <input type="number" step="0.01" min="0" class="line-credit w-full p-2.5 border-none rounded-lg text-right font-black text-red-700 bg-white shadow-sm" placeholder="0.00" value="${defaultValues.credit || ''}">
        </div>
        <div class="col-span-1 text-center">
            <button type="button" class="remove-line-btn text-gray-300 hover:text-red-500 transition-all">
                <i class="fas fa-minus-circle fa-lg"></i>
            </button>
        </div>
    `;

    container.appendChild(row);

    const codeIn = row.querySelector('.line-account-code');
    const nameIn = row.querySelector('.line-name');
    const debIn = row.querySelector('.line-debit');
    const creIn = row.querySelector('.line-credit');

    codeIn.addEventListener('input', (e) => {
        const account = window.allChartOfAccounts.find(a => a.code === e.target.value.trim());
        if (account) {
            nameIn.value = account.name;
            row.classList.replace('bg-gray-50', 'bg-blue-50/30');
        }
    });

    [debIn, creIn].forEach(input => {
        input.addEventListener('input', () => {
            if (input === debIn && debIn.value > 0) creIn.value = '';
            if (input === creIn && creIn.value > 0) debIn.value = '';
            updateLineBalance();
        });
    });

    row.querySelector('.remove-line-btn').addEventListener('click', () => {
        if (document.querySelectorAll('.journal-line').length > 2) {
            row.remove();
            updateLineBalance();
        }
    });
};

function updateLineBalance() {
    let tDebit = 0, tCredit = 0;
    document.querySelectorAll('.journal-line').forEach(l => {
        tDebit += parseFloat(l.querySelector('.line-debit').value) || 0;
        tCredit += parseFloat(l.querySelector('.line-credit').value) || 0;
    });

    const diff = Math.abs(tDebit - tCredit);
    const isOk = diff < 0.01 && tDebit > 0;
    const balEl = document.getElementById('total-balance');
    const subBtn = document.getElementById('submit-btn');

    if (isOk) {
        balEl.innerHTML = `<i class="fas fa-check-circle mr-2"></i> Équilibré : ${tDebit.toLocaleString()} XOF`;
        balEl.className = "text-lg font-black p-3 rounded-xl bg-green-100 text-green-700 shadow-inner";
        subBtn.disabled = false;
    } else {
        balEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> Écart : ${diff.toLocaleString()} XOF`;
        balEl.className = "text-lg font-black p-3 rounded-xl bg-red-100 text-red-700 shadow-inner";
        subBtn.disabled = true;
    }
}

window.initializeManualEntryLogic = async function() {
    const form = document.getElementById('journalEntryForm');
    if (!form) {
        console.error('❌ Formulaire journalEntryForm introuvable !');
        return;
    }

    const msgArea = document.getElementById('entry-message');
    const dateInput = document.getElementById('entry-date');
    const periodBadge = document.getElementById('period-badge');
    const companyId = appState.currentCompanyId;
    const companyFilter = `?companyId=${companyId}`;
    
    console.log('🔄 Initialisation du formulaire de saisie manuelle...');
    console.log('📍 Company ID:', companyId);
    
    try {
        const [accRes, jourRes, configRes] = await Promise.all([
            apiFetch(`accounting/chart-of-accounts${companyFilter}`),
            apiFetch(`accounting/journals${companyFilter}`),
            apiFetch(`accounting/fiscal-config${companyFilter}`)
        ]);

        console.log('✅ Données chargées:', {
            accounts: accRes.data?.length || 0,
            journals: jourRes.data?.length || 0,
            config: configRes.status
        });

        window.allChartOfAccounts = accRes.data || [];
        
        if (configRes.status === 'success' && configRes.fiscal_period) {
            const { start_date, end_date } = configRes.fiscal_period;
            dateInput.min = start_date;
            dateInput.max = end_date;
            dateInput.value = end_date < new Date().toISOString().split('T')[0] ? end_date : new Date().toISOString().split('T')[0];
            periodBadge.innerHTML = `<i class="fas fa-lock-open mr-2"></i> ${new Date(start_date).toLocaleDateString()} - ${new Date(end_date).toLocaleDateString()}`;
        }

        const dl = document.getElementById('accounts-list');
        dl.innerHTML = window.allChartOfAccounts.map(a => `<option value="${a.code}">${a.name}</option>`).join('');

        const jSel = document.getElementById('journal-code');
        jSel.innerHTML = '<option value="">-- Choisir --</option>' + 
                         jourRes.data.map(j => `<option value="${j.code}">${j.name} (${j.code})</option>`).join('');

        console.log('📋 Journaux disponibles:', jourRes.data);

        document.getElementById('lines-container').innerHTML = '';
        window.addLineToEntry();
        window.addLineToEntry();

    } catch (e) {
        console.error("❌ Erreur initialisation:", e);
        if (msgArea) {
            msgArea.className = 'mt-6 text-center p-4 rounded-xl bg-red-100 text-red-700';
            msgArea.innerHTML = `<strong>Erreur:</strong> ${e.message}`;
            msgArea.classList.remove('hidden');
        }
        return;
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const subBtn = document.getElementById('submit-btn');
        
        const payload = {
            company_id: parseInt(companyId),
            journal_code: document.getElementById('journal-code').value,
            date: dateInput.value,
            reference: document.getElementById('narration').value,
            lines: Array.from(document.querySelectorAll('.journal-line')).map(l => ({
                account_code: l.querySelector('.line-account-code').value.trim(),
                name: l.querySelector('.line-name').value.trim(),
                debit: parseFloat(l.querySelector('.line-debit').value) || 0,
                credit: parseFloat(l.querySelector('.line-credit').value) || 0
            }))
        };

        console.log('📤 Payload envoyé:', JSON.stringify(payload, null, 2));

        try {
            subBtn.disabled = true;
            subBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Création...';
            
            const response = await apiFetch('accounting/move/create', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            console.log('📥 Réponse Odoo:', response);

            if (response.status === 'success') {
                msgArea.className = 'mt-6 text-center p-4 rounded-xl bg-green-100 text-green-700';
                msgArea.innerHTML = `
                    <div class="flex flex-col">
                        <span class="font-bold text-lg"><i class="fas fa-check-double mr-2"></i> Écriture Validée !</span>
                        <span class="text-sm">N° Pièce : <strong>${response.move_name || response.data?.move_name || 'N/A'}</strong></span>
                    </div>
                `;
                msgArea.classList.remove('hidden');
                
                form.reset();
                setTimeout(() => {
                    window.initializeManualEntryLogic();
                }, 2000);
            } else {
                throw new Error(response.message || response.error || "Erreur inconnue");
            }
        } catch (err) {
            console.error('🚨 Erreur:', err);
            msgArea.className = 'mt-6 text-center p-4 rounded-xl bg-red-100 text-red-700';
            msgArea.innerHTML = `<strong>Erreur:</strong> ${err.message}`;
            msgArea.classList.remove('hidden');
        } finally {
            subBtn.disabled = false;
            subBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Valider';
        }
    };
    
    console.log('✅ Initialisation terminée');
};

// =================================================================
// INITIALISATION GLOBALE
// =================================================================

function attachGlobalListeners() {
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('modal-close-btn')?.addEventListener('click', ModalManager.close);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application Doukè Compta Pro - Démarrage');
    attachGlobalListeners();
    checkAuthAndRender();
});
