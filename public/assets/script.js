// =============================================================================
// FICHIER : public/assets/script.js (VERSION V14 - BALANCE/GRAND LIVRE CORRIGÉS)
// Description : Logique Front-End avec toutes les améliorations appliquées
// Architecture : Multi-tenant sécurisé + API Odoo optimisée
// Corrections V14 :
//   - Sélecteur Balance / Grand Livre
//   - Balance 6 colonnes SYSCOHADA Révisé
//   - Gestion erreur backend Odoo (get_full_informations)
//   - Filtres de période dynamiques
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
        menus.push({ id: 'settings', name: 'Paramètres', icon: 'fas fa-cog' }); // ✅ AJOUTÉ
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

            // 🔧 V14 CORRECTION: Nouveau case 'ledger' avec sélecteur
            case 'ledger':
                content = generateLedgerBalanceSelectorHTML();
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
// DRILL-DOWN DÉTAILS D'ÉCRITURE (VERSION COMPLÈTE)
// =================================================================

/**
 * Affiche les détails complets d'une écriture dans une modal
 */
window.handleDrillDown = async function(entryId, moduleName) {
    try {
        const companyId = appState.currentCompanyId;
        const endpoint = `accounting/entry/${entryId}?companyId=${companyId}`;
        
        NotificationManager.show(`Récupération des détails de l'écriture ${entryId}...`, 'info');
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        if (response.status === 'success') {
            const entry = response.data;
            
            // Génération du HTML des lignes
            const linesHTML = entry.lines.map(line => `
                <tr class="border-b dark:border-gray-700">
                    <td class="px-4 py-3 font-mono text-sm font-bold">${line.account_code}</td>
                    <td class="px-4 py-3 text-sm">${line.account_name}</td>
                    <td class="px-4 py-3 text-sm">${line.label}</td>
                    <td class="px-4 py-3 text-right font-bold text-success">${line.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td class="px-4 py-3 text-right font-bold text-danger">${line.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');
            
            // HTML complet de la modal
            const detailsHTML = `
                <div class="space-y-6">
                    <!-- En-tête -->
                    <div class="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border-l-4 border-primary">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-gray-500 uppercase font-bold">N° Pièce</p>
                                <p class="text-xl font-black text-gray-900 dark:text-white">${entry.name}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 uppercase font-bold">Date</p>
                                <p class="text-lg font-bold text-gray-700 dark:text-gray-300">${new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 uppercase font-bold">Journal</p>
                                <p class="text-lg font-bold text-primary">${entry.journal}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 uppercase font-bold">Statut</p>
                                <span class="inline-block px-3 py-1 text-sm font-bold rounded-full ${entry.state === 'posted' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">
                                    ${entry.state_label}
                                </span>
                            </div>
                        </div>
                        ${entry.reference ? `
                        <div class="mt-4">
                            <p class="text-xs text-gray-500 uppercase font-bold">Référence</p>
                            <p class="text-sm text-gray-700 dark:text-gray-300">${entry.reference}</p>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Lignes comptables -->
                    <div>
                        <h4 class="text-lg font-black text-gray-900 dark:text-white mb-3">
                            <i class="fas fa-list-ul mr-2 text-primary"></i> Lignes Comptables (${entry.lines.length})
                        </h4>
                        <div class="overflow-x-auto border rounded-xl">
                            <table class="min-w-full text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Compte</th>
                                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé Compte</th>
                                        <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                        <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Débit (XOF)</th>
                                        <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Crédit (XOF)</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    ${linesHTML}
                                </tbody>
                                <tfoot class="bg-gray-100 dark:bg-gray-700">
                                    <tr class="font-black">
                                        <td colspan="3" class="px-4 py-3 text-right uppercase text-sm">TOTAUX</td>
                                        <td class="px-4 py-3 text-right text-success text-lg">${entry.totals.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                        <td class="px-4 py-3 text-right text-danger text-lg">${entry.totals.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    ${entry.totals.difference > 0.01 ? `
                                    <tr class="bg-red-50 dark:bg-red-900/20">
                                        <td colspan="5" class="px-4 py-3 text-center text-danger font-bold">
                                            <i class="fas fa-exclamation-triangle mr-2"></i>
                                            ATTENTION : Écart de ${entry.totals.difference.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} XOF
                                        </td>
                                    </tr>
                                    ` : ''}
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Métadonnées -->
                    <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">Métadonnées</p>
                        <div class="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span class="text-gray-500">Créé le :</span>
                                <span class="font-bold ml-2">${new Date(entry.metadata.created_at).toLocaleString('fr-FR')}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Par :</span>
                                <span class="font-bold ml-2">${entry.metadata.created_by}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Modifié le :</span>
                                <span class="font-bold ml-2">${new Date(entry.metadata.updated_at).toLocaleString('fr-FR')}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Par :</span>
                                <span class="font-bold ml-2">${entry.metadata.updated_by}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            ModalManager.open(`📄 Détails de l'Écriture #${entry.name}`, detailsHTML);
        }

    } catch (error) {
        console.error('🚨 handleDrillDown Error:', error);
        NotificationManager.show(`Erreur lors du chargement : ${error.message}`, 'error');
    }
};

// =================================================================
// BILAN SYSCOHADA
// =================================================================

/**
 * Ouvre la modal du bilan avec les données réelles
 */
window.handleOpenBalanceSheet = async function() {
    const companyId = appState.currentCompanyId;
    const companyFilter = `?companyId=${companyId}`;
    
    try {
        NotificationManager.show('Génération du Bilan en cours...', 'info', 10000);
        
        const response = await apiFetch(`accounting/balance-sheet${companyFilter}`, { method: 'GET' });
        
        if (response.status === 'success') {
            const bilan = response.data;
            const bilanHTML = generateBalanceSheetHTML(bilan);
            ModalManager.open(`📊 Bilan SYSCOHADA au ${new Date(bilan.date).toLocaleDateString('fr-FR')}`, bilanHTML);
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur génération bilan : ${error.message}`, 'error');
    }
};

/**
 * Génère le HTML du Bilan SYSCOHADA
 */
function generateBalanceSheetHTML(bilan) {
    // Fonction helper pour générer une section
    const generateSection = (title, section) => {
        if (section.accounts.length === 0) return '';
        
        const rows = section.accounts.map(acc => `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-2 font-mono text-sm font-bold">${acc.code}</td>
                <td class="px-4 py-2 text-sm">${acc.name}</td>
                <td class="px-4 py-2 text-right font-bold">${Math.abs(acc.balance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');
        
        return `
            <tr class="bg-primary/10">
                <td colspan="2" class="px-4 py-3 font-black text-primary uppercase">${title}</td>
                <td class="px-4 py-3 text-right font-black text-primary">${section.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
            </tr>
            ${rows}
        `;
    };
    
    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- ACTIF -->
            <div>
                <h4 class="text-xl font-black text-secondary mb-3 pb-2 border-b-2 border-secondary">
                    <i class="fas fa-chart-line mr-2"></i> ACTIF
                </h4>
                <div class="overflow-x-auto border rounded-xl">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Compte</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant (XOF)</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800">
                            ${generateSection('ACTIF IMMOBILISÉ', bilan.actif.immobilise)}
                            ${generateSection('ACTIF CIRCULANT', bilan.actif.circulant)}
                            ${generateSection('TRÉSORERIE-ACTIF', bilan.actif.tresorerie)}
                        </tbody>
                        <tfoot class="bg-success/20">
                            <tr class="font-black">
                                <td colspan="2" class="px-4 py-3 text-right uppercase">TOTAL ACTIF</td>
                                <td class="px-4 py-3 text-right text-lg">${bilan.totals.actif.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- PASSIF -->
            <div>
                <h4 class="text-xl font-black text-secondary mb-3 pb-2 border-b-2 border-secondary">
                    <i class="fas fa-balance-scale mr-2"></i> PASSIF
                </h4>
                <div class="overflow-x-auto border rounded-xl">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Compte</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant (XOF)</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800">
                            ${generateSection('CAPITAUX PROPRES', bilan.passif.capitaux)}
                            ${generateSection('DETTES FINANCIÈRES', bilan.passif.dettes)}
                            ${generateSection('TRÉSORERIE-PASSIF', bilan.passif.tresorerie)}
                        </tbody>
                        <tfoot class="bg-danger/20">
                            <tr class="font-black">
                                <td colspan="2" class="px-4 py-3 text-right uppercase">TOTAL PASSIF</td>
                                <td class="px-4 py-3 text-right text-lg">${bilan.totals.passif.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

        <!-- Équilibre -->
        <div class="mt-6 p-4 rounded-xl ${bilan.totals.difference < 0.01 ? 'bg-success/20 border-l-4 border-success' : 'bg-warning/20 border-l-4 border-warning'}">
            <div class="flex items-center justify-between">
                <span class="font-bold text-gray-700 dark:text-gray-300">
                    ${bilan.totals.difference < 0.01 ? '✅ Bilan Équilibré' : '⚠️ Écart Détecté'}
                </span>
                <span class="font-black text-lg">
                    ${bilan.totals.difference.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} XOF
                </span>
            </div>
        </div>

        <p class="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Date de génération : ${new Date(bilan.date).toLocaleDateString('fr-FR')}
        </p>
    `;
}

// =============================================================================
// 🔧 V14 - BALANCE GÉNÉRALE ET GRAND LIVRE (SECTION ENTIÈREMENT RÉÉCRITE)
// =============================================================================

/**
 * 🔧 V14: Génère l'interface de sélection Balance / Grand Livre
 * avec filtres de période et types de rapport
 */
function generateLedgerBalanceSelectorHTML() {
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    const yearStart = `${currentYear}-01-01`;
    
    return `
        <div class="fade-in">
            <h3 class="text-3xl font-black text-secondary mb-6">
                <i class="fas fa-balance-scale mr-3"></i>Balance & Grand Livre
            </h3>
            
            <p class="text-gray-600 dark:text-gray-400 mb-8">
                Sélectionnez le type de rapport et la période d'analyse pour générer votre état comptable conforme au <strong>SYSCOHADA Révisé</strong>.
            </p>

            <!-- SÉLECTEUR DE TYPE DE RAPPORT -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-primary mb-6">
                <h4 class="text-lg font-black text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-file-alt mr-2 text-primary"></i>Type de Rapport
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Balance Générale -->
                    <label class="relative cursor-pointer">
                        <input type="radio" name="reportType" value="balance" class="peer sr-only" checked>
                        <div class="p-4 border-2 rounded-xl transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div class="flex items-start">
                                <i class="fas fa-list-ol fa-2x text-info mr-4 mt-1"></i>
                                <div>
                                    <span class="block font-bold text-gray-900 dark:text-white">Balance Générale</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        6 colonnes SYSCOHADA : Soldes initiaux, Mouvements, Soldes finaux
                                    </span>
                                </div>
                            </div>
                        </div>
                    </label>
                    
                    <!-- Grand Livre -->
                    <label class="relative cursor-pointer">
                        <input type="radio" name="reportType" value="ledger" class="peer sr-only">
                        <div class="p-4 border-2 rounded-xl transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div class="flex items-start">
                                <i class="fas fa-book-open fa-2x text-success mr-4 mt-1"></i>
                                <div>
                                    <span class="block font-bold text-gray-900 dark:text-white">Grand Livre Général</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        Détail de toutes les écritures par compte avec solde progressif
                                    </span>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- FILTRES DE PÉRIODE -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-info mb-6">
                <h4 class="text-lg font-black text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-calendar-alt mr-2 text-info"></i>Période d'Analyse
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Date Début</label>
                        <input type="date" id="ledger-date-from" value="${yearStart}"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Date Fin</label>
                        <input type="date" id="ledger-date-to" value="${today}"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Période Rapide</label>
                        <select id="quick-period" onchange="window.setQuickPeriod(this.value)"
                            class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="">-- Personnalisé --</option>
                            <option value="month">Mois en cours</option>
                            <option value="quarter">Trimestre en cours</option>
                            <option value="year" selected>Année en cours</option>
                            <option value="last-year">Année précédente</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- BOUTON GÉNÉRER -->
            <div class="flex justify-center">
                <button onclick="window.generateLedgerBalanceReport()" 
                    class="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <i class="fas fa-cogs mr-3"></i>Générer le Rapport
                </button>
            </div>

            <!-- ZONE DE RÉSULTAT -->
            <div id="ledger-balance-result" class="mt-8"></div>
        </div>
    `;
}

/**
 * 🔧 V14: Définit rapidement une période prédéfinie
 */
window.setQuickPeriod = function(period) {
    const dateFrom = document.getElementById('ledger-date-from');
    const dateTo = document.getElementById('ledger-date-to');
    const now = new Date();
    const year = now.getFullYear();
    
    switch(period) {
        case 'month':
            dateFrom.value = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            dateTo.value = now.toISOString().split('T')[0];
            break;
        case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            dateFrom.value = `${year}-${String(quarter * 3 + 1).padStart(2, '0')}-01`;
            dateTo.value = now.toISOString().split('T')[0];
            break;
        case 'year':
            dateFrom.value = `${year}-01-01`;
            dateTo.value = `${year}-12-31`;
            break;
        case 'last-year':
            dateFrom.value = `${year - 1}-01-01`;
            dateTo.value = `${year - 1}-12-31`;
            break;
    }
};

/**
 * 🔧 V14: Génère le rapport Balance ou Grand Livre selon la sélection
 */
window.generateLedgerBalanceReport = async function() {
    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    const dateFrom = document.getElementById('ledger-date-from').value;
    const dateTo = document.getElementById('ledger-date-to').value;
    const resultDiv = document.getElementById('ledger-balance-result');
    const companyId = appState.currentCompanyId;
    
    // Validation
    if (!dateFrom || !dateTo) {
        NotificationManager.show('Veuillez sélectionner les dates de début et de fin.', 'warning');
        return;
    }
    
    if (new Date(dateFrom) > new Date(dateTo)) {
        NotificationManager.show('La date de début doit être antérieure à la date de fin.', 'error');
        return;
    }
    
    // Afficher le spinner
    resultDiv.innerHTML = `
        <div class="p-8 text-center">
            <div class="loading-spinner mx-auto"></div>
            <p class="mt-4 text-gray-500 font-bold">Génération du ${reportType === 'balance' ? 'Balance Générale' : 'Grand Livre'}...</p>
        </div>
    `;
    
    try {
        const companyFilter = `?companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
        
        if (reportType === 'balance') {
            // BALANCE GÉNÉRALE SYSCOHADA 6 COLONNES
            const endpoint = `accounting/trial-balance-syscohada${companyFilter}`;
            const response = await apiFetch(endpoint, { method: 'GET' });
            resultDiv.innerHTML = generateTrialBalance6ColumnsHTML(response.data, dateFrom, dateTo);
        } else {
            // GRAND LIVRE GÉNÉRAL
            const endpoint = `accounting/general-ledger${companyFilter}`;
            const response = await apiFetch(endpoint, { method: 'GET' });
            resultDiv.innerHTML = generateGeneralLedgerHTML(response.data, dateFrom, dateTo);
        }
        
        NotificationManager.show(`${reportType === 'balance' ? 'Balance' : 'Grand Livre'} généré avec succès !`, 'success');
        
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        resultDiv.innerHTML = generateLedgerErrorHTML(error, reportType);
    }
};

/**
 * 🔧 V14: Génère le HTML d'erreur avec diagnostic
 */
function generateLedgerErrorHTML(error, reportType) {
    const reportName = reportType === 'balance' ? 'Balance Générale' : 'Grand Livre';
    
    // Diagnostic de l'erreur Odoo
    let diagnosticHTML = '';
    if (error.message.includes('get_full_informations') || error.message.includes('does not exist')) {
        diagnosticHTML = `
            <div class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-l-4 border-yellow-500">
                <h5 class="font-bold text-yellow-700 dark:text-yellow-400 mb-2">
                    <i class="fas fa-lightbulb mr-2"></i>Diagnostic
                </h5>
                <p class="text-sm text-yellow-600 dark:text-yellow-300">
                    <strong>Cause probable :</strong> Le backend utilise la méthode Odoo 
                    <code class="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">account.report.get_full_informations</code> 
                    qui n'existe pas dans votre version d'Odoo.
                </p>
                <p class="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                    <strong>Solution :</strong> Le backend doit utiliser 
                    <code class="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">account.move.line</code> 
                    pour récupérer les écritures et calculer la balance côté serveur.
                </p>
            </div>
        `;
    }
    
    return `
        <div class="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
            <i class="fas fa-exclamation-triangle fa-3x text-danger mb-4"></i>
            <h4 class="text-xl font-black text-danger mb-2">Erreur de chargement de la ${reportName}</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
            
            ${diagnosticHTML}
            
            <button onclick="window.generateLedgerBalanceReport()" 
                class="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-colors">
                <i class="fas fa-redo mr-2"></i>Réessayer
            </button>
        </div>
    `;
}

// =============================================================================
// 🔧 V14 - BALANCE GÉNÉRALE 6 COLONNES - SYSCOHADA RÉVISÉ
// =============================================================================

/**
 * 🔧 V14: Génère le HTML de la Balance Générale à 6 colonnes
 * Structure SYSCOHADA Révisé :
 * - Solde Initial (Débit / Crédit)
 * - Mouvements (Débit / Crédit)
 * - Solde Final (Débit / Crédit)
 */
function generateTrialBalance6ColumnsHTML(balanceData, dateFrom, dateTo) {
    if (!balanceData || !balanceData.accounts || balanceData.accounts.length === 0) {
        return `
            <div class="p-8 text-center bg-info/10 rounded-2xl">
                <i class="fas fa-info-circle fa-3x text-info mb-4"></i>
                <h4 class="text-xl font-black text-gray-700 dark:text-gray-300">Aucune donnée disponible</h4>
                <p class="text-gray-500">Aucun compte n'a été mouvementé sur cette période.</p>
            </div>
        `;
    }

    // Générer les lignes du tableau
    const rows = balanceData.accounts.map(account => {
        // Calcul des colonnes
        const siDebit = account.opening_debit || 0;
        const siCredit = account.opening_credit || 0;
        const mvtDebit = account.debit || 0;
        const mvtCredit = account.credit || 0;
        
        // Solde final = Solde initial + Mouvements
        const sfDebit = Math.max(0, (siDebit - siCredit) + (mvtDebit - mvtCredit));
        const sfCredit = Math.max(0, (siCredit - siDebit) + (mvtCredit - mvtDebit));

        // Classe de la ligne (alternance + mise en évidence classes)
        const isClassAccount = account.code.length <= 2;
        const rowClass = isClassAccount 
            ? 'bg-primary/10 font-bold' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700';

        return `
            <tr class="border-b dark:border-gray-700 ${rowClass}">
                <td class="px-3 py-2 font-mono text-sm ${isClassAccount ? 'font-black text-primary' : 'font-bold'}">${account.code}</td>
                <td class="px-3 py-2 text-sm ${isClassAccount ? 'font-black' : ''}">${account.name}</td>
                
                <!-- Solde Initial -->
                <td class="px-3 py-2 text-right font-mono text-sm ${siDebit > 0 ? 'text-blue-600' : 'text-gray-400'}">${formatAmount(siDebit)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm ${siCredit > 0 ? 'text-blue-600' : 'text-gray-400'}">${formatAmount(siCredit)}</td>
                
                <!-- Mouvements -->
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${mvtDebit > 0 ? 'text-success' : 'text-gray-400'}">${formatAmount(mvtDebit)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${mvtCredit > 0 ? 'text-danger' : 'text-gray-400'}">${formatAmount(mvtCredit)}</td>
                
                <!-- Solde Final -->
                <td class="px-3 py-2 text-right font-mono text-sm font-black ${sfDebit > 0 ? 'text-success' : 'text-gray-400'}">${formatAmount(sfDebit)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-black ${sfCredit > 0 ? 'text-danger' : 'text-gray-400'}">${formatAmount(sfCredit)}</td>
            </tr>
        `;
    }).join('');

    // Calcul des totaux
    const totals = balanceData.totals || calculateTotals(balanceData.accounts);

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <!-- En-tête -->
            <div class="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-xl font-black text-gray-900 dark:text-white">
                            <i class="fas fa-list-ol mr-2 text-primary"></i>Balance Générale SYSCOHADA
                        </h4>
                        <p class="text-sm text-gray-500 mt-1">
                            Entreprise : <strong>${appState.currentCompanyName}</strong>
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm text-gray-500">
                            <i class="fas fa-calendar mr-2"></i>
                            Du ${formatDate(dateFrom)} au ${formatDate(dateTo)}
                        </span>
                        <div class="mt-2">
                            <button onclick="window.exportBalanceToExcel()" class="text-sm bg-success text-white px-3 py-1 rounded-lg font-bold hover:bg-success/80 mr-2">
                                <i class="fas fa-file-excel mr-1"></i>Excel
                            </button>
                            <button onclick="window.printBalance()" class="text-sm bg-info text-white px-3 py-1 rounded-lg font-bold hover:bg-info/80">
                                <i class="fas fa-print mr-1"></i>Imprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tableau Balance 6 colonnes -->
            <div class="overflow-x-auto">
                <table class="w-full text-sm" id="balance-table">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th rowspan="2" class="px-3 py-3 text-left text-xs font-black text-gray-600 uppercase border-r dark:border-gray-600">Compte</th>
                            <th rowspan="2" class="px-3 py-3 text-left text-xs font-black text-gray-600 uppercase border-r dark:border-gray-600">Libellé</th>
                            <th colspan="2" class="px-3 py-2 text-center text-xs font-black text-blue-600 uppercase border-r dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                                <i class="fas fa-flag-checkered mr-1"></i>Solde Initial
                            </th>
                            <th colspan="2" class="px-3 py-2 text-center text-xs font-black text-gray-600 uppercase border-r dark:border-gray-600">
                                <i class="fas fa-exchange-alt mr-1"></i>Mouvements Période
                            </th>
                            <th colspan="2" class="px-3 py-2 text-center text-xs font-black text-purple-600 uppercase bg-purple-50 dark:bg-purple-900/20">
                                <i class="fas fa-flag mr-1"></i>Solde Final
                            </th>
                        </tr>
                        <tr class="bg-gray-50 dark:bg-gray-600">
                            <th class="px-3 py-2 text-right text-xs font-bold text-gray-500 border-r dark:border-gray-500">Débit</th>
                            <th class="px-3 py-2 text-right text-xs font-bold text-gray-500 border-r dark:border-gray-500">Crédit</th>
                            <th class="px-3 py-2 text-right text-xs font-bold text-success border-r dark:border-gray-500">Débit</th>
                            <th class="px-3 py-2 text-right text-xs font-bold text-danger border-r dark:border-gray-500">Crédit</th>
                            <th class="px-3 py-2 text-right text-xs font-bold text-success">Débit</th>
                            <th class="px-3 py-2 text-right text-xs font-bold text-danger">Crédit</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-gray-800 dark:bg-gray-900 text-white font-black">
                        <tr>
                            <td colspan="2" class="px-3 py-4 text-right uppercase">TOTAUX GÉNÉRAUX</td>
                            <td class="px-3 py-4 text-right font-mono">${formatAmount(totals.opening_debit || 0)}</td>
                            <td class="px-3 py-4 text-right font-mono">${formatAmount(totals.opening_credit || 0)}</td>
                            <td class="px-3 py-4 text-right font-mono text-success">${formatAmount(totals.total_debit || 0)}</td>
                            <td class="px-3 py-4 text-right font-mono text-danger">${formatAmount(totals.total_credit || 0)}</td>
                            <td class="px-3 py-4 text-right font-mono text-success">${formatAmount(totals.closing_debit || 0)}</td>
                            <td class="px-3 py-4 text-right font-mono text-danger">${formatAmount(totals.closing_credit || 0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Indicateur d'équilibre -->
            ${generateBalanceIndicator(totals)}
        </div>
    `;
}

/**
 * 🔧 V14: Génère l'indicateur d'équilibre de la balance
 */
function generateBalanceIndicator(totals) {
    const debitTotal = (totals.total_debit || 0);
    const creditTotal = (totals.total_credit || 0);
    const difference = Math.abs(debitTotal - creditTotal);
    const isBalanced = difference < 0.01;

    return `
        <div class="p-4 ${isBalanced ? 'bg-success/20 border-t-4 border-success' : 'bg-warning/20 border-t-4 border-warning'}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas ${isBalanced ? 'fa-check-circle text-success' : 'fa-exclamation-triangle text-warning'} fa-2x mr-3"></i>
                    <div>
                        <span class="font-black text-gray-700 dark:text-gray-300 block">
                            ${isBalanced ? '✅ Balance Équilibrée' : '⚠️ Écart Détecté'}
                        </span>
                        <span class="text-sm text-gray-500">
                            ${isBalanced 
                                ? 'Les totaux débit et crédit sont égaux.' 
                                : `Un écart de ${formatAmount(difference)} XOF a été détecté.`}
                        </span>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-2xl font-black ${isBalanced ? 'text-success' : 'text-warning'}">
                        ${formatAmount(difference)} XOF
                    </span>
                </div>
            </div>
        </div>
    `;
}

// =============================================================================
// 🔧 V14 - GRAND LIVRE GÉNÉRAL AMÉLIORÉ
// =============================================================================

/**
 * 🔧 V14: Génère le HTML du Grand Livre avec détails des écritures
 */
function generateGeneralLedgerHTML(ledgerData, dateFrom, dateTo) {
    if (!ledgerData || ledgerData.length === 0) {
        return `
            <div class="p-8 text-center bg-info/10 rounded-2xl">
                <i class="fas fa-info-circle fa-3x text-info mb-4"></i>
                <h4 class="text-xl font-black text-gray-700 dark:text-gray-300">Aucune donnée disponible</h4>
                <p class="text-gray-500">Aucune écriture trouvée pour cette période.</p>
            </div>
        `;
    }

    // Générer les sections par compte
    const accountSections = ledgerData.map(account => {
        let runningBalance = account.opening_balance || 0;
        
        const linesHTML = account.lines.map(line => {
            runningBalance += (line.debit || 0) - (line.credit || 0);
            
            return `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-4 py-2 text-sm">${formatDate(line.date)}</td>
                    <td class="px-4 py-2 text-sm font-mono font-bold text-primary">${line.move_name || line.journalEntry || '-'}</td>
                    <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">${line.journal_code || '-'}</td>
                    <td class="px-4 py-2 text-sm">${line.name || line.description || '-'}</td>
                    <td class="px-4 py-2 text-right font-mono font-bold ${line.debit > 0 ? 'text-success' : 'text-gray-400'}">${formatAmount(line.debit || 0)}</td>
                    <td class="px-4 py-2 text-right font-mono font-bold ${line.credit > 0 ? 'text-danger' : 'text-gray-400'}">${formatAmount(line.credit || 0)}</td>
                    <td class="px-4 py-2 text-right font-mono font-black ${runningBalance >= 0 ? 'text-success' : 'text-danger'}">${formatAmount(runningBalance)}</td>
                </tr>
            `;
        }).join('');

        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
                <!-- En-tête du compte -->
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-l-4 border-primary">
                    <div class="flex justify-between items-center">
                        <h4 class="text-lg font-black text-gray-900 dark:text-white">
                            <span class="font-mono text-primary">${account.code}</span> - ${account.name}
                        </h4>
                        <div class="text-right">
                            <span class="text-sm text-gray-500">Solde Initial :</span>
                            <span class="font-bold ml-2 ${(account.opening_balance || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                ${formatAmount(account.opening_balance || 0)} XOF
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Tableau des écritures -->
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">N° Pièce</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Journal</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-success uppercase">Débit</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-danger uppercase">Crédit</th>
                                <th class="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Solde</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linesHTML}
                        </tbody>
                        <tfoot class="bg-gray-100 dark:bg-gray-700 font-black">
                            <tr>
                                <td colspan="4" class="px-4 py-3 text-right uppercase">TOTAUX DU COMPTE</td>
                                <td class="px-4 py-3 text-right font-mono text-success">${formatAmount(account.totalDebit || 0)}</td>
                                <td class="px-4 py-3 text-right font-mono text-danger">${formatAmount(account.totalCredit || 0)}</td>
                                <td class="px-4 py-3 text-right font-mono ${(account.finalBalance || 0) >= 0 ? 'text-success' : 'text-danger'}">${formatAmount(account.finalBalance || 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="fade-in">
            <!-- En-tête du Grand Livre -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-xl font-black text-gray-900 dark:text-white">
                            <i class="fas fa-book-open mr-2 text-success"></i>Grand Livre Général
                        </h4>
                        <p class="text-sm text-gray-500 mt-1">
                            Entreprise : <strong>${appState.currentCompanyName}</strong> | 
                            Du ${formatDate(dateFrom)} au ${formatDate(dateTo)}
                        </p>
                    </div>
                    <div>
                        <button onclick="window.exportLedgerToExcel()" class="text-sm bg-success text-white px-3 py-2 rounded-lg font-bold hover:bg-success/80 mr-2">
                            <i class="fas fa-file-excel mr-1"></i>Export Excel
                        </button>
                        <button onclick="window.printLedger()" class="text-sm bg-info text-white px-3 py-2 rounded-lg font-bold hover:bg-info/80">
                            <i class="fas fa-print mr-1"></i>Imprimer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sections par compte -->
            ${accountSections}
        </div>
    `;
}

// =============================================================================
// 🔧 V14 - FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Formate un montant en XOF
 */
function formatAmount(amount) {
    return (amount || 0).toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

/**
 * Formate une date au format français
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Calcule les totaux si non fournis par le backend
 */
function calculateTotals(accounts) {
    return accounts.reduce((totals, acc) => {
        totals.opening_debit += acc.opening_debit || 0;
        totals.opening_credit += acc.opening_credit || 0;
        totals.total_debit += acc.debit || 0;
        totals.total_credit += acc.credit || 0;
        
        const sfDebit = Math.max(0, (acc.opening_debit - acc.opening_credit) + (acc.debit - acc.credit));
        const sfCredit = Math.max(0, (acc.opening_credit - acc.opening_debit) + (acc.credit - acc.debit));
        totals.closing_debit += sfDebit;
        totals.closing_credit += sfCredit;
        
        return totals;
    }, {
        opening_debit: 0,
        opening_credit: 0,
        total_debit: 0,
        total_credit: 0,
        closing_debit: 0,
        closing_credit: 0
    });
}

// =============================================================================
// 🔧 V14 - FONCTIONS D'EXPORT
// =============================================================================

window.exportBalanceToExcel = function() {
    NotificationManager.show('Export Excel en cours de développement...', 'info');
    // TODO: Implémenter avec SheetJS ou côté backend
};

window.printBalance = function() {
    window.print();
};

window.exportLedgerToExcel = function() {
    NotificationManager.show('Export Excel en cours de développement...', 'info');
};

window.printLedger = function() {
    window.print();
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
            ${generateReportCard('Bilan', 'fas fa-balance-scale', 'balance-sheet', 'Aperçu des actifs, passifs et capitaux propres à une date donnée.', true)}
            ${generateReportCard('Compte de Résultat', 'fas fa-money-bill-transfer', 'pnl', 'Performance financière (revenus et dépenses) sur une période.')}
            ${generateReportCard('Tableau des Flux', 'fas fa-arrows-split-up-and-down', 'cash-flow', 'Analyse des mouvements de trésorerie sur la période.')}
            ${generateReportCard('Balance Générale', 'fas fa-list-ol', 'balance', 'Liste de tous les comptes avec leurs soldes débiteurs et créditeurs.')}
        </div>
    `;
}

function generateReportCard(title, icon, reportId, description, isImplemented = false) {
    const viewAction = isImplemented 
        ? `onclick="window.handleOpenBalanceSheet()"` 
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
    console.log('🚀 Application Doukè Compta Pro - Démarrage V14');
    attachGlobalListeners();
    checkAuthAndRender();
});
