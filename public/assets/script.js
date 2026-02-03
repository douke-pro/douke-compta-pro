// =============================================================================
// FICHIER : public/assets/script.js (VERSION V15 - FINALE AVEC BALANCE 6 COLONNES)
// Description : Logique Front-End avec Balance SYSCOHADA Révisé
// Architecture : Multi-tenant sécurisé + Balance 6 colonnes conforme
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
                // 🔧 CORRECTION : Afficher le sélecteur Balance/Grand Livre
                content = generateLedgerSelectorHTML();
                break;

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

// =================================================================
// DRILL-DOWN DÉTAILS D'ÉCRITURE (STUB)
// =================================================================

/**
 * Affiche les détails complets d'une écriture dans une modal
 */
window.handleDrillDown = async function(entryId, moduleName) {
    NotificationManager.show('Fonction détails écriture en développement.', 'info');
};

// =================================================================
// GRAND LIVRE ET BALANCE (VERSION CONFORME SYSCOHADA RÉVISÉ)
// =================================================================

/**
 * 🔧 NOUVEAU : Génère le sélecteur Balance / Grand Livre
 */
function generateLedgerSelectorHTML() {
    const currentYear = new Date().getFullYear();
    
    return `
        <div class="fade-in">
            <h3 class="text-3xl font-black text-secondary mb-8">
                <i class="fas fa-balance-scale mr-3"></i> Grand Livre & Balance SYSCOHADA
            </h3>
            
            <!-- Sélecteur Type de Rapport -->
            <div class="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h4 class="text-xl font-black text-secondary mb-4">
                    <i class="fas fa-filter mr-2"></i> Sélectionnez le Type de Rapport
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button onclick="window.selectLedgerType('balance')" id="btn-balance"
                        class="flex items-center justify-center p-6 rounded-xl border-2 border-primary bg-primary/10 text-primary font-black hover:bg-primary/20 transition-colors">
                        <i class="fas fa-table fa-2x mr-3"></i>
                        <div class="text-left">
                            <div class="text-lg">Balance Générale</div>
                            <div class="text-sm font-normal">6 colonnes SYSCOHADA Révisé</div>
                        </div>
                    </button>
                    <button onclick="window.selectLedgerType('grandlivre')" id="btn-grandlivre"
                        class="flex items-center justify-center p-6 rounded-xl border-2 border-secondary text-secondary font-black hover:bg-secondary/10 transition-colors">
                        <i class="fas fa-book fa-2x mr-3"></i>
                        <div class="text-left">
                            <div class="text-lg">Grand Livre Général</div>
                            <div class="text-sm font-normal">Détails par compte</div>
                        </div>
                    </button>
                </div>
                
                <!-- Filtres de Période -->
                <div id="period-filters" class="hidden">
                    <h5 class="text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase">Période d'Analyse</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date de Début</label>
                            <input type="date" id="ledger-date-from" value="${currentYear}-01-01" 
                                class="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date de Fin</label>
                            <input type="date" id="ledger-date-to" value="${currentYear}-12-31" 
                                class="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        </div>
                        <div class="flex items-end">
                            <button onclick="window.loadLedgerData()" id="btn-load-ledger"
                                class="w-full bg-success text-white font-bold p-3 rounded-xl hover:bg-success-dark transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i> Générer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Conteneur des Résultats -->
            <div id="ledger-results" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div class="text-center text-gray-500 py-10">
                    <i class="fas fa-arrow-up fa-3x mb-4 opacity-30"></i>
                    <p class="font-bold">Sélectionnez un type de rapport pour commencer</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 🔧 NOUVEAU : Sélectionne le type de rapport (Balance ou Grand Livre)
 */
window.selectLedgerType = function(type) {
    // Stocker le type sélectionné
    window.selectedLedgerType = type;
    
    // Mise à jour visuelle des boutons
    document.getElementById('btn-balance').classList.remove('bg-primary', 'text-white');
    document.getElementById('btn-balance').classList.add('border-2', 'border-primary', 'text-primary', 'bg-primary/10');
    
    document.getElementById('btn-grandlivre').classList.remove('bg-secondary', 'text-white');
    document.getElementById('btn-grandlivre').classList.add('border-2', 'border-secondary', 'text-secondary');
    
    if (type === 'balance') {
        document.getElementById('btn-balance').classList.add('bg-primary', 'text-white');
        document.getElementById('btn-balance').classList.remove('border-primary', 'text-primary', 'bg-primary/10');
    } else {
        document.getElementById('btn-grandlivre').classList.add('bg-secondary', 'text-white');
        document.getElementById('btn-grandlivre').classList.remove('border-secondary', 'text-secondary');
    }
    
    // Afficher les filtres de période
    document.getElementById('period-filters').classList.remove('hidden');
    
    NotificationManager.show(`Type sélectionné : ${type === 'balance' ? 'Balance Générale' : 'Grand Livre'}`, 'info');
};

/**
 * 🔧 NOUVEAU : Charge les données du rapport sélectionné
 */
window.loadLedgerData = async function() {
    const type = window.selectedLedgerType;
    
    if (!type) {
        NotificationManager.show('Veuillez sélectionner un type de rapport.', 'warning');
        return;
    }
    
    const companyId = appState.currentCompanyId;
    const dateFrom = document.getElementById('ledger-date-from').value;
    const dateTo = document.getElementById('ledger-date-to').value;
    
    const resultsContainer = document.getElementById('ledger-results');
    resultsContainer.innerHTML = '<div class="text-center p-10"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">Génération en cours...</p></div>';
    
    try {
        if (type === 'balance') {
            // 🔧 CORRECTION : Appel direct sans passer par une méthode Odoo spécifique
            const endpoint = `accounting/ledger?companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}&type=balance`;
            const response = await apiFetch(endpoint, { method: 'GET' });
            
            resultsContainer.innerHTML = generateBalance6ColumnsHTML(response.data, dateFrom, dateTo);
        } else {
            const endpoint = `accounting/ledger?companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}&type=grandlivre`;
            const response = await apiFetch(endpoint, { method: 'GET' });
            
            resultsContainer.innerHTML = generateGeneralLedgerHTML(response.data);
        }
        
        NotificationManager.show('Rapport généré avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        resultsContainer.innerHTML = `
            <div class="text-center text-danger p-10">
                <i class="fas fa-exclamation-triangle fa-3x mb-4"></i>
                <p class="font-bold">Erreur lors de la génération</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
};

/**
 * 🔧 NOUVEAU : Génère la Balance 6 Colonnes SYSCOHADA Révisé
 */
function generateBalance6ColumnsHTML(balanceData, dateFrom, dateTo) {
    if (!balanceData || !balanceData.accounts || balanceData.accounts.length === 0) {
        return `<div class="text-center text-info p-10">
            <i class="fas fa-info-circle fa-3x mb-4"></i>
            <p class="font-bold">Aucune donnée disponible pour cette période.</p>
        </div>`;
    }

    const rows = balanceData.accounts.map(account => {
        const soldeInitialDebit = account.opening_balance > 0 ? account.opening_balance : 0;
        const soldeInitialCredit = account.opening_balance < 0 ? Math.abs(account.opening_balance) : 0;
        const soldeFinalDebit = account.closing_balance > 0 ? account.closing_balance : 0;
        const soldeFinalCredit = account.closing_balance < 0 ? Math.abs(account.closing_balance) : 0;

        return `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-3 font-mono text-sm font-bold">${account.code}</td>
                <td class="px-4 py-3 text-sm">${account.name}</td>
                <td class="px-4 py-3 text-right font-bold ${soldeInitialDebit > 0 ? 'text-success' : ''}">${soldeInitialDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-right font-bold ${soldeInitialCredit > 0 ? 'text-danger' : ''}">${soldeInitialCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-right font-bold">${account.period_debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-right font-bold">${account.period_credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-right font-bold ${soldeFinalDebit > 0 ? 'text-success' : ''}">${soldeFinalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3 text-right font-bold ${soldeFinalCredit > 0 ? 'text-danger' : ''}">${soldeFinalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
            </tr>
        `;
    }).join('');

    return `
        <div>
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-2xl font-black text-secondary">
                    <i class="fas fa-table mr-2"></i> Balance Générale à 6 Colonnes
                </h4>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-calendar mr-2"></i> 
                    Du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}
                </div>
            </div>

            <div class="overflow-x-auto border rounded-xl">
                <table class="w-full text-sm">
                    <thead class="bg-gradient-to-r from-primary/10 to-secondary/10">
                        <tr>
                            <th rowspan="2" class="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase border-r">Compte</th>
                            <th rowspan="2" class="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase border-r">Libellé</th>
                            <th colspan="2" class="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase border-r border-b">Solde Initial</th>
                            <th colspan="2" class="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase border-r border-b">Mouvements</th>
                            <th colspan="2" class="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase">Solde Final</th>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-700">
                            <th class="px-4 py-2 text-right text-xs font-bold text-success uppercase">Débit</th>
                            <th class="px-4 py-2 text-right text-xs font-bold text-danger uppercase border-r">Crédit</th>
                            <th class="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Débit</th>
                            <th class="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase border-r">Crédit</th>
                            <th class="px-4 py-2 text-right text-xs font-bold text-success uppercase">Débit</th>
                            <th class="px-4 py-2 text-right text-xs font-bold text-danger uppercase">Crédit</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-gray-100 dark:bg-gray-700 font-black">
                        <tr>
                            <td colspan="2" class="px-4 py-4 text-right uppercase text-sm">TOTAUX</td>
                            <td class="px-4 py-4 text-right text-success text-lg">${balanceData.totals.opening_debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            <td class="px-4 py-4 text-right text-danger text-lg">${balanceData.totals.opening_credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            <td class="px-4 py-4 text-right text-lg">${balanceData.totals.period_debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            <td class="px-4 py-4 text-right text-lg">${balanceData.totals.period_credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            <td class="px-4 py-4 text-right text-success text-lg">${balanceData.totals.closing_debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            <td class="px-4 py-4 text-right text-danger text-lg">${balanceData.totals.closing_credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Vérification Équilibre -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-xl ${Math.abs(balanceData.totals.opening_debit - balanceData.totals.opening_credit) < 0.01 ? 'bg-success/20 border-l-4 border-success' : 'bg-warning/20 border-l-4 border-warning'}">
                    <div class="text-xs font-bold text-gray-500 uppercase mb-1">Solde Initial</div>
                    <div class="font-black">${Math.abs(balanceData.totals.opening_debit - balanceData.totals.opening_credit) < 0.01 ? '✅ Équilibré' : '⚠️ Écart: ' + Math.abs(balanceData.totals.opening_debit - balanceData.totals.opening_credit).toLocaleString('fr-FR')}</div>
                </div>
                <div class="p-4 rounded-xl ${Math.abs(balanceData.totals.period_debit - balanceData.totals.period_credit) < 0.01 ? 'bg-success/20 border-l-4 border-success' : 'bg-warning/20 border-l-4 border-warning'}">
                    <div class="text-xs font-bold text-gray-500 uppercase mb-1">Mouvements</div>
                    <div class="font-black">${Math.abs(balanceData.totals.period_debit - balanceData.totals.period_credit) < 0.01 ? '✅ Équilibré' : '⚠️ Écart: ' + Math.abs(balanceData.totals.period_debit - balanceData.totals.period_credit).toLocaleString('fr-FR')}</div>
                </div>
                <div class="p-4 rounded-xl ${Math.abs(balanceData.totals.closing_debit - balanceData.totals.closing_credit) < 0.01 ? 'bg-success/20 border-l-4 border-success' : 'bg-warning/20 border-l-4 border-warning'}">
                    <div class="text-xs font-bold text-gray-500 uppercase mb-1">Solde Final</div>
                    <div class="font-black">${Math.abs(balanceData.totals.closing_debit - balanceData.totals.closing_credit) < 0.01 ? '✅ Équilibré' : '⚠️ Écart: ' + Math.abs(balanceData.totals.closing_debit - balanceData.totals.closing_credit).toLocaleString('fr-FR')}</div>
                </div>
            </div>

            <p class="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                Balance conforme au SYSCOHADA Révisé - Générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </p>
        </div>
    `;
}

/**
 * Génère le HTML du Grand Livre
 */
function generateGeneralLedgerHTML(ledgerData) {
    if (!ledgerData || ledgerData.length === 0) {
        return `<div class="text-center text-info p-10">
            <i class="fas fa-info-circle fa-3x mb-4"></i>
            <p class="font-bold">Aucune donnée disponible pour cette période.</p>
        </div>`;
    }

    const accountSections = ledgerData.map(account => {
        const linesHTML = account.lines.map(line => `
            <tr class="border-b dark:border-gray-700">
                <td class="px-4 py-2 text-sm">${new Date(line.date).toLocaleDateString('fr-FR')}</td>
                <td class="px-4 py-2 text-sm font-mono">${line.move_name}</td>
                <td class="px-4 py-2 text-sm">${line.description}</td>
                <td class="px-4 py-2 text-right font-bold text-success">${line.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-2 text-right font-bold text-danger">${line.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-2 text-right font-bold">${line.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-l-4 border-primary">
                    <h4 class="text-lg font-black text-gray-900 dark:text-white">
                        ${account.code} - ${account.name}
                    </h4>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">N° Pièce</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Débit</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Crédit</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Solde</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linesHTML}
                        </tbody>
                        <tfoot class="bg-gray-100 dark:bg-gray-700 font-black">
                            <tr>
                                <td colspan="3" class="px-4 py-3 text-right uppercase">TOTAUX</td>
                                <td class="px-4 py-3 text-right text-success">${account.totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                <td class="px-4 py-3 text-right text-danger">${account.totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                <td class="px-4 py-3 text-right">${account.finalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div>
            <h4 class="text-2xl font-black text-secondary mb-6">
                <i class="fas fa-book mr-2"></i> Grand Livre Général
            </h4>
            ${accountSections}
        </div>
    `;
}

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
            ${generateReportCard('Bilan', 'fas fa-balance-scale', 'balance-sheet', 'Aperçu des actifs, passifs et capitaux propres à une date donnée.', false)}
            ${generateReportCard('Compte de Résultat', 'fas fa-money-bill-transfer', 'pnl', 'Performance financière (revenus et dépenses) sur une période.')}
            ${generateReportCard('Tableau des Flux', 'fas fa-arrows-split-up-and-down', 'cash-flow', 'Analyse des mouvements de trésorerie sur la période.')}
            ${generateReportCard('Balance & Grand Livre', 'fas fa-list-ol', 'ledger', 'Balance 6 colonnes et Grand Livre détaillé.', false)}
        </div>
    `;
}

function generateReportCard(title, icon, reportId, description, isImplemented = false) {
    const viewAction = reportId === 'ledger' 
        ? `onclick="loadContentArea('ledger', 'Grand Livre / Balance')"` 
        : `onclick="window.handleOpenReportModal('${reportId}', '${title}')"`;
    
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
                <button ${viewAction}
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
    NotificationManager.show('Fonction rapport en développement.', 'info');
};

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
                            <input type="date" id="entry-date" class="w-full rounded-xl border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-primary font-bold

