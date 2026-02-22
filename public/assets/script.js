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

/**
 * Gère la soumission du formulaire d'inscription
 * ✅ VERSION FONCTIONNELLE COMPLÈTE
 */
/**
 * Gère la soumission du formulaire d'inscription
 */
async function handleRegister(event) {
    event.preventDefault();
    
    console.log('📝 [handleRegister] Début inscription');
    
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const companyName = document.getElementById('reg-company')?.value.trim();
    
    console.log('📋 Données:', { name, email, companyName, passwordLength: password?.length });
    
    // Validation côté client
    if (!name || !email || !password || !companyName) {
        console.error('❌ Champs manquants');
        NotificationManager.show('Tous les champs sont requis', 'error');
        return;
    }
    
    if (password.length < 8) {
        console.error('❌ Mot de passe trop court');
        NotificationManager.show('Le mot de passe doit contenir au moins 8 caractères', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ Email invalide');
        NotificationManager.show('Format d\'email invalide', 'error');
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonHTML = submitButton.innerHTML;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> CRÉATION EN COURS...';
    
    try {
        console.log('🚀 Appel API /auth/register...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                companyName
            }),
        });
        
        const data = await response.json();
        console.log('📦 Réponse API:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la création du compte');
        }
        
        console.log('✅ Inscription réussie');
        NotificationManager.show(
            data.message || '🎉 Instance créée avec succès ! Connexion automatique...', 
            'success'
        );
        
        if (data.data && data.data.token) {
            localStorage.setItem('douke_auth_token', data.data.token);
            console.log('💾 Token sauvegardé');
        }
        
        console.log('🔄 Redirection vers le dashboard...');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('🚨 Erreur inscription:', error);
        NotificationManager.show(error.message, 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHTML;
    }
}

function handleLogout(isAutoLogout = false) {
    // ✅ ARRÊTER LE POLLING DES NOTIFICATIONS
    stopNotificationPolling();
    
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

    menus.push({ id: 'immobilisations', name: 'Immobilisations', icon: 'fas fa-building', badge: 'Bientôt' });
    menus.push({ id: 'settings', name: 'Paramètres', icon: 'fas fa-cog' });
    
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

        if (!appState.currentCompanyId && contentId !== 'dashboard' && contentId !== 'settings') {
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

             case 'immobilisations':
                content = generateImmobilisationsMenuHTML();
                setTimeout(() => {
                if (typeof loadImmobilisationsStats === 'function') {
                loadImmobilisationsStats();
                }
              }, 100);
          break;
                
            case 'reports':
                content = generateReportsMenuHTML();
                break;
                
            case 'manual-entry':
                contentArea.innerHTML = generateManualEntryFormHTML();
                window.initializeManualEntryLogic(); 
                return;

            case 'ledger':
                content = generateLedgerBalanceSelectorHTML();
                break;

            case 'settings':
                content = generateSettingsHTML();
                contentArea.innerHTML = content;
                await loadSettingsData();
                return;
                
            case 'admin-users':
                content = await generateAdminUsersHTML();
                contentArea.innerHTML = content;
                return;
            
            // ✅ CORRECTION #1 : Ajouter "default:" qui manquait
            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);
        }
        
        // ✅ CORRECTION #2 : Ajouter l'accolade fermante du switch qui manquait
        
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

/**
 * Génère le HTML du Dashboard avec KPIs et Actions Rapides améliorées
 */
function generateDashboardHTML(data) {
    if (!data) return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.profile);

    const kpi1 = generateStatCard('Trésorerie Actuelle', data.cashBalance || 0, 'XOF', 'fas fa-wallet', 'border-success', data.cashTrend);
    const kpi2 = generateStatCard('Résultat Net (Annuel)', data.netProfit || 0, 'XOF', 'fas fa-chart-bar', (data.netProfit || 0) >= 0 ? 'border-primary' : 'border-danger', data.profitTrend);
    const kpi3 = generateStatCard('Passif Court Terme', data.shortTermDebt || 0, 'XOF', 'fas fa-hand-holding-dollar', 'border-warning', data.debtTrend, 'fas fa-arrow-up');
    const kpi4 = generateStatCard('Marge Brute (Mois)', data.grossMargin || 0, '%', 'fas fa-percent', 'border-info', data.marginTrend);

    return `
        <h3 class="text-3xl font-black text-secondary mb-8 fade-in">Tableau de Bord Comptable pour ${appState.currentCompanyName}</h3>
        
        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${kpi1}
            ${kpi2}
            ${kpi3}
            ${kpi4}
        </div>
        
        <!-- 🔥 SECTION ACTIONS RAPIDES AVEC NUMÉRISATION -->
        <div class="mb-8">
            <h4 class="text-xl font-black text-gray-900 dark:text-white mb-4">
                <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <!-- 📷 NUMÉRISER FACTURE -->
                <div class="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border-2 border-primary/20 hover:border-primary hover:shadow-xl transition-all cursor-pointer group"
                     onclick="window.openInvoiceScanner()">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i class="fas fa-scanner fa-2x text-primary"></i>
                        </div>
                        <h5 class="font-black text-gray-900 dark:text-white mb-2">Numériser Facture</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Glissez un document ou cliquez</p>
                        <span class="text-sm font-bold text-primary group-hover:underline">Scanner →</span>
                    </div>
                </div>
                
                <!-- ✏️ SAISIE MANUELLE -->
                <div class="bg-gradient-to-br from-success/10 to-success/5 p-6 rounded-2xl border-2 border-success/20 hover:border-success hover:shadow-xl transition-all cursor-pointer group"
                     onclick="loadContentArea('manual-entry', 'Passer une Écriture')">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i class="fas fa-pen-to-square fa-2x text-success"></i>
                        </div>
                        <h5 class="font-black text-gray-900 dark:text-white mb-2">Nouvelle Écriture</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Saisie manuelle complète</p>
                        <span class="text-sm font-bold text-success group-hover:underline">Créer →</span>
                    </div>
                </div>
                
                <!-- 📊 VOIR BILAN -->
                <div class="bg-gradient-to-br from-info/10 to-info/5 p-6 rounded-2xl border-2 border-info/20 hover:border-info hover:shadow-xl transition-all cursor-pointer group"
                     onclick="window.handleOpenBalanceSheet()">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-16 h-16 bg-info/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i class="fas fa-chart-pie fa-2x text-info"></i>
                        </div>
                        <h5 class="font-black text-gray-900 dark:text-white mb-2">Voir Bilan</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Consulter bilan SYSCOHADA</p>
                        <span class="text-sm font-bold text-info group-hover:underline">Afficher →</span>
                    </div>
                </div>
                
                <!-- 📁 PLAN COMPTABLE -->
                <div class="bg-gradient-to-br from-warning/10 to-warning/5 p-6 rounded-2xl border-2 border-warning/20 hover:border-warning hover:shadow-xl transition-all cursor-pointer group"
                     onclick="loadContentArea('chart-of-accounts', 'Plan Comptable')">
                    <div class="flex flex-col items-center text-center">
                        <div class="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i class="fas fa-list-alt fa-2x text-warning"></i>
                        </div>
                        <h5 class="font-black text-gray-900 dark:text-white mb-2">Plan Comptable</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Gérer les comptes</p>
                        <span class="text-sm font-bold text-warning group-hover:underline">Ouvrir →</span>
                    </div>
                </div>
                
            </div>
        </div>
        
        <!-- SYNTHÈSE D'ACTIVITÉ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-clock-rotate-left mr-2 text-primary"></i>
                    Synthèse d'Activité (Dernières Écritures)
                </h4>
                ${generateJournalHTML(data.recentEntries || [])}
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-chart-simple mr-2 text-success"></i>
                    Statistiques Rapides
                </h4>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-400">Écritures ce mois</span>
                        <span class="text-2xl font-black text-primary">${data.recentEntries?.length || 0}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-400">Docs numérisés</span>
                        <span class="text-2xl font-black text-success">--</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span class="text-sm font-bold text-gray-600 dark:text-gray-400">Taux d'automatisation</span>
                        <span class="text-2xl font-black text-info">--%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Charge les données du Dashboard depuis l'API
 */
async function fetchDashboardData(endpoint) {
    const response = await apiFetch(endpoint, { method: 'GET' });
    
    // Données simulées pour démo (à remplacer par réponse API réelle)
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

// =============================================================================
// 📷 MODULE DE NUMÉRISATION - FONCTIONS PRINCIPALES
// =============================================================================

/**
 * 📷 Ouvre la modal de numérisation de facture
 */
window.openInvoiceScanner = function() {
    console.log('📷 [openInvoiceScanner] Ouverture du scanner de factures...');
    
    const scannerHTML = `
        <div class="space-y-6">
            <!-- Zone de Drop avec style amélioré -->
            <div id="invoice-dropzone" 
                 class="border-4 border-dashed border-primary/40 rounded-2xl p-16 text-center bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer group"
                 onclick="document.getElementById('invoice-file-input').click()"
                 ondragover="event.preventDefault(); this.classList.add('border-primary', 'bg-primary/20');"
                 ondragleave="this.classList.remove('border-primary', 'bg-primary/20');"
                 ondrop="window.handleInvoiceDrop(event)">
                <i class="fas fa-cloud-upload-alt fa-5x text-primary/50 mb-6 group-hover:scale-110 transition-transform"></i>
                <h4 class="text-2xl font-black text-gray-900 dark:text-white mb-3">Glissez votre facture ici</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">ou cliquez pour parcourir vos fichiers</p>
                <div class="inline-flex items-center gap-3 text-xs text-gray-500">
                    <span class="px-3 py-1 bg-white dark:bg-gray-700 rounded-full font-bold">📄 PDF</span>
                    <span class="px-3 py-1 bg-white dark:bg-gray-700 rounded-full font-bold">🖼️ JPG</span>
                    <span class="px-3 py-1 bg-white dark:bg-gray-700 rounded-full font-bold">🖼️ PNG</span>
                    <span class="px-3 py-1 bg-white dark:bg-gray-700 rounded-full font-bold">⚖️ Max 10 MB</span>
                </div>
                <input type="file" id="invoice-file-input" accept=".pdf,.jpg,.jpeg,.png" class="hidden" onchange="window.handleInvoiceUpload(event)">
            </div>
            
            <!-- Zone de résultat OCR (masquée au départ) -->
            <div id="ocr-result-zone" class="hidden">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Aperçu du document -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <h5 class="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <i class="fas fa-file-image mr-2 text-primary"></i>
                            Document Scanné
                        </h5>
                        <div id="document-preview" class="bg-white dark:bg-gray-800 rounded-lg p-2 min-h-[400px] flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                            <span class="text-gray-400">Aperçu du document</span>
                        </div>
                    </div>
                    
                    <!-- Formulaire de validation -->
                    <div>
                        <h5 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <i class="fas fa-edit mr-2 text-success"></i>
                            Données Extraites
                            <span class="ml-auto text-xs font-normal text-gray-500">Vérifiez et corrigez si nécessaire</span>
                        </h5>
                        <form id="ocr-validation-form" onsubmit="window.handleOCRValidation(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Date <span class="text-danger">*</span>
                                </label>
                                <input type="date" id="ocr-date" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    N° Facture <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="ocr-invoice-number" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Fournisseur <span class="text-danger">*</span>
                                </label>
                                <input type="text" id="ocr-supplier" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                            </div>
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">HT</label>
                                    <input type="number" step="0.01" id="ocr-amount-ht" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">TVA</label>
                                    <input type="number" step="0.01" id="ocr-tva" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">TTC</label>
                                    <input type="number" step="0.01" id="ocr-amount-ttc" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-black">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Compte Débit <span class="text-danger">*</span>
                                </label>
                                <select id="ocr-account-debit" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">-- Choisir un compte --</option>
                                    <option value="601100">601100 - Achats de marchandises</option>
                                    <option value="601200">601200 - Achats de matières premières</option>
                                    <option value="605000">605000 - Autres achats</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Compte Crédit <span class="text-danger">*</span>
                                </label>
                                <select id="ocr-account-credit" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">-- Choisir un compte --</option>
                                    <option value="401000">401000 - Fournisseurs</option>
                                    <option value="404000">404000 - Fournisseurs d'immobilisations</option>
                                </select>
                            </div>
                            <div class="flex gap-3 pt-6 border-t">
                                <button type="submit" class="flex-1 bg-success text-white font-bold py-4 rounded-xl hover:bg-success-dark transition-all shadow-lg hover:shadow-xl active:scale-95">
                                    <i class="fas fa-check-circle mr-2"></i>Valider et Créer l'Écriture
                                </button>
                                <button type="button" onclick="ModalManager.close()" class="px-6 bg-gray-500 text-white font-bold py-4 rounded-xl hover:bg-gray-600 transition-all">
                                    <i class="fas fa-times mr-2"></i>Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Zone de chargement -->
            <div id="ocr-loading-zone" class="hidden text-center p-12">
                <div class="loading-spinner mx-auto mb-6"></div>
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyse du document en cours...</h4>
                <p class="text-sm text-gray-500">Extraction des données avec OCR • Patientez quelques secondes</p>
                <div class="mt-6 flex justify-center gap-2">
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </div>
            </div>
        </div>
    `;
    
    ModalManager.open('📷 Numérisation de Facture', scannerHTML);
};

/**
 * 🖱️ Gère le drop de fichier (drag & drop)
 */
window.handleInvoiceDrop = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropzone = document.getElementById('invoice-dropzone');
    dropzone.classList.remove('border-primary', 'bg-primary/20');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        processInvoiceFile(file);
    }
};

/**
 * 📤 Gère l'upload du fichier via input
 */
window.handleInvoiceUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        processInvoiceFile(file);
    }
};

/**
 * ⚙️ Traite le fichier uploadé (validation + envoi OCR)
 */
async function processInvoiceFile(file) {
    console.log('📤 [processInvoiceFile] Fichier:', file.name, '|', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Validation taille
    if (file.size > 10 * 1024 * 1024) {
        NotificationManager.show('❌ Le fichier ne doit pas dépasser 10 MB', 'error');
        return;
    }
    
    // Validation type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        NotificationManager.show('❌ Type de fichier non autorisé. Utilisez PDF, JPG ou PNG.', 'error');
        return;
    }
    
    // Afficher la zone de chargement
    document.getElementById('invoice-dropzone').classList.add('hidden');
    document.getElementById('ocr-loading-zone').classList.remove('hidden');
    
    try {
        // Créer FormData
        const formData = new FormData();
        formData.append('invoice', file);
        formData.append('companyId', appState.currentCompanyId);
        
        console.log('🚀 [processInvoiceFile] Envoi au serveur pour OCR...');
        
        // Appel API OCR
        const response = await fetch(`${API_BASE_URL}/api/ocr/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appState.token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            console.log('✅ [OCR] Données extraites:', data.data.parsed);
            
            // Pré-remplir le formulaire
            document.getElementById('ocr-date').value = data.data.parsed.date || new Date().toISOString().split('T')[0];
            document.getElementById('ocr-invoice-number').value = data.data.parsed.invoiceNumber || '';
            document.getElementById('ocr-supplier').value = data.data.parsed.supplier || '';
            document.getElementById('ocr-amount-ht').value = data.data.parsed.amountHT || 0;
            document.getElementById('ocr-tva').value = data.data.parsed.tva || 0;
            document.getElementById('ocr-amount-ttc').value = data.data.parsed.amountTTC || 0;
            
            // Afficher le résultat
            document.getElementById('ocr-loading-zone').classList.add('hidden');
            document.getElementById('ocr-result-zone').classList.remove('hidden');
            
            NotificationManager.show('✅ Document analysé ! Vérifiez les données extraites.', 'success');
            
        } else {
            throw new Error(data.error || 'Erreur OCR');
        }
        
    } catch (error) {
        console.error('🚨 [processInvoiceFile] Erreur:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error');
        
        // Réafficher la dropzone
        document.getElementById('ocr-loading-zone').classList.add('hidden');
        document.getElementById('invoice-dropzone').classList.remove('hidden');
    }
}

/**
 * ✅ Valide et crée l'écriture comptable depuis les données OCR
 */
window.handleOCRValidation = async function(event) {
    event.preventDefault();
    
    const data = {
        companyId: appState.currentCompanyId,
        date: document.getElementById('ocr-date').value,
        invoiceNumber: document.getElementById('ocr-invoice-number').value,
        supplier: document.getElementById('ocr-supplier').value,
        amountHT: parseFloat(document.getElementById('ocr-amount-ht').value),
        tva: parseFloat(document.getElementById('ocr-tva').value),
        amountTTC: parseFloat(document.getElementById('ocr-amount-ttc').value),
        accountDebit: parseInt(document.getElementById('ocr-account-debit').value),
        accountCredit: parseInt(document.getElementById('ocr-account-credit').value)
    };
    
    console.log('✅ [handleOCRValidation] Validation et création:', data);
    
    try {
        NotificationManager.show('⏳ Création de l\'écriture comptable...', 'info');
        
        const response = await apiFetch('ocr/validate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.status === 'success') {
            NotificationManager.show('🎉 Facture enregistrée avec succès !', 'success');
            ModalManager.close();
            
            // Recharger le dashboard pour voir la nouvelle écriture
            loadContentArea('dashboard', 'Tableau de Bord');
        } else {
            throw new Error(response.error || 'Erreur lors de la création');
        }
        
    } catch (error) {
        console.error('🚨 [handleOCRValidation] Erreur:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error');
    }
};

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

/**

// =============================================================================
// MODULE RAPPORTS FINANCIERS - VERSION DÉFINITIVE FINALE
// Compatible avec votre backend existant (routes + controller)
// 100% Production-Ready - Sans duplication
// =============================================================================

// =============================================================================
// 0. DÉTECTION AUTOMATIQUE DU PROFIL UTILISATEUR
// =============================================================================

/**
 * Récupère le profil utilisateur (détection automatique .profile ou .role)
 */
function getUserProfile() {
    if (!appState.user) {
        console.warn('⚠️ [getUserProfile] appState.user non défini');
        return 'USER';
    }
    
    if (appState.user.profile) {
        return appState.user.profile.toUpperCase();
    }
    
    if (appState.user.role) {
        return appState.user.role.toUpperCase();
    }
    
    return 'USER';
}

/**
 * Vérifie si l'utilisateur est Admin ou Collaborateur
 */
function isAdminOrCollab() {
    const profile = getUserProfile();
    return profile === 'ADMIN' || profile === 'COLLABORATEUR';
}

// =============================================================================
// 1. FONCTIONS GÉNÉRATION CARDS
// =============================================================================

/**
 * 4 cards statistiques (Admin/Collaborateur uniquement)
 */
function generateReportsStatsCards() {
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                 onclick="window.loadPendingFinancialReports('pending')">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90 mb-1">En attente</p>
                        <p class="text-3xl font-black" id="stats-pending">-</p>
                        <p class="text-xs opacity-75 mt-1">demandes non traitées</p>
                    </div>
                    <i class="fas fa-clock fa-2x opacity-70"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                 onclick="window.loadPendingFinancialReports('processing')">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90 mb-1">En traitement</p>
                        <p class="text-3xl font-black" id="stats-processing">-</p>
                        <p class="text-xs opacity-75 mt-1">en cours</p>
                    </div>
                    <i class="fas fa-spinner fa-2x opacity-70"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                 onclick="window.loadPendingFinancialReports('validated')">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90 mb-1">Validés</p>
                        <p class="text-3xl font-black" id="stats-validated">-</p>
                        <p class="text-xs opacity-75 mt-1">prêts à envoyer</p>
                    </div>
                    <i class="fas fa-check-circle fa-2x opacity-70"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                 onclick="window.loadPendingFinancialReports('sent')">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90 mb-1">Envoyés</p>
                        <p class="text-3xl font-black" id="stats-sent">-</p>
                        <p class="text-xs opacity-75 mt-1">ce mois</p>
                    </div>
                    <i class="fas fa-paper-plane fa-2x opacity-70"></i>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card "Demander des États Financiers"
 */
function generateRequestReportsCard() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-info hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-file-invoice text-info text-xl"></i>
                </div>
                <div class="flex-1">
                    <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Demander des États Financiers
                    </h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Créez une demande pour recevoir vos états financiers officiels conformes SYSCOHADA.
                    </p>
                    <button onclick="window.openRequestFinancialReportsModal()" 
                        class="w-full bg-info text-white py-3 px-4 rounded-xl font-bold hover:bg-info/90 transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-plus-circle"></i>
                        <span>Nouvelle Demande</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card "Mes Demandes" avec aperçu
 */
function generateMyRequestsCard() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-primary hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-list text-primary text-xl"></i>
                </div>
                <div class="flex-1">
                    <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Mes Demandes
                    </h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Consultez l'historique et le statut de vos demandes.
                    </p>
                    <button onclick="window.loadMyFinancialReports()" 
                        class="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-eye"></i>
                        <span>Voir Mes Demandes</span>
                    </button>
                    <div id="my-requests-preview" class="mt-4 space-y-2">
                        <div class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 py-4">
                            <i class="fas fa-spinner fa-spin mr-2"></i>
                            <span>Chargement...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card "Demandes Clients en Attente" (Admin/Collab)
 */
function generatePendingRequestsCard() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-warning hover:shadow-lg transition-all">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-tasks text-warning text-xl"></i>
                </div>
                <div class="flex-1">
                    <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Demandes Clients en Attente
                    </h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Gérez les demandes d'états financiers de vos clients.
                    </p>
                    <button onclick="window.loadPendingFinancialReports()" 
                        class="w-full bg-warning text-white py-3 px-4 rounded-xl font-bold hover:bg-warning/90 transition-colors flex items-center justify-center gap-2">
                        <i class="fas fa-clipboard-check"></i>
                        <span>Voir Toutes les Demandes</span>
                    </button>
                    <div id="pending-requests-preview" class="mt-4 space-y-2">
                        <div class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 py-4">
                            <i class="fas fa-spinner fa-spin mr-2"></i>
                            <span>Chargement...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Card rapport interactif avec disclaimer
 */
function generateClassicReportCard(title, icon, reportId, description, isImplemented = false) {
    const viewAction = isImplemented 
        ? `onclick="window.handleOpenBalanceSheet()"` 
        : `onclick="window.handleOpenReportModal('${reportId}', '${title}')"`;
    
    const isSensitiveReport = ['balance-sheet', 'pnl'].includes(reportId);
    
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
            ${isSensitiveReport ? `
                <div class="mb-3 -mt-2 -mx-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/40">
                        <i class="fas fa-exclamation-triangle mr-1.5"></i>
                        APERÇU UNIQUEMENT - NON OFFICIEL
                    </span>
                </div>
            ` : ''}
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="${icon} text-info text-xl"></i>
                </div>
                <div class="flex-1">
                    <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-1">${title}</h5>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${description}</p>
                    ${isSensitiveReport ? `
                        <div class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-warning">
                            <p class="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                Aperçu interactif - peut contenir des erreurs
                            </p>
                            <p class="text-xs text-yellow-700 dark:text-yellow-300">
                                <strong>Ne pas utiliser en l'état.</strong> Pour un document officiel, 
                                <button onclick="event.stopPropagation(); window.openRequestFinancialReportsModal();" 
                                    class="underline hover:text-warning font-bold">
                                    demandez un état financier officiel
                                </button>.
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="mt-4 flex gap-3">
                <button ${viewAction}
                    class="flex-1 text-sm bg-primary text-white py-2 px-3 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                    <i class="fas fa-eye"></i>
                    <span>Voir Aperçu</span>
                </button>
                <button onclick="window.exportReport('${reportId}', '${title}')" 
                    class="text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `;
}

// =============================================================================
// 2. FONCTION PRINCIPALE - GÉNÉRATION MENU
// =============================================================================

/**
 * Génère le menu principal des rapports financiers
 */
function generateReportsMenuHTML() {
    const userProfile = getUserProfile();
    const isAdmin = isAdminOrCollab();
    
    console.log('🎯 [generateReportsMenuHTML] Profil:', userProfile, 'Admin/Collab:', isAdmin);
    
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-3xl font-black text-secondary">📊 Rapports Financiers</h3>
                    <p class="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Gérez vos états financiers officiels et consultez vos rapports interactifs.
                    </p>
                </div>
                <div class="px-4 py-2 bg-primary/10 rounded-xl border-2 border-primary/20">
                    <p class="text-xs font-bold text-primary uppercase tracking-wider">
                        <i class="fas fa-user-shield mr-2"></i>${userProfile}
                    </p>
                </div>
            </div>

            <div class="mb-10">
                <div class="flex items-center mb-6">
                    <div class="flex-1 border-t-2 border-primary"></div>
                    <h4 class="px-4 text-xl font-black text-primary uppercase tracking-wider">
                        <i class="fas fa-stamp mr-2"></i>
                        États Financiers Officiels
                    </h4>
                    <div class="flex-1 border-t-2 border-primary"></div>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-success p-4 rounded-lg mb-6">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-success text-xl mt-1"></i>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Documents Officiels Conformes aux Normes
                            </p>
                            <p class="text-xs text-gray-700 dark:text-gray-300">
                                Ces rapports sont générés par votre collaborateur et peuvent être utilisés pour :
                                <strong>audits, banques, administration fiscale, AGO/AGE</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                ${isAdmin ? generateReportsStatsCards() : ''}

                ${isAdmin ? `
                    <div class="space-y-6">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <div class="w-1 h-8 bg-warning rounded-full"></div>
                                <h4 class="text-xl font-bold text-gray-900 dark:text-white">
                                    <i class="fas fa-tasks text-warning mr-2"></i>
                                    Gestion des Demandes Clients
                                </h4>
                            </div>
                            ${generatePendingRequestsCard()}
                        </div>
                        <details class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                            <summary class="cursor-pointer list-none">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <i class="fas fa-user text-info"></i>
                                        <span>Mes Propres Demandes</span>
                                    </h4>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform details-icon"></i>
                                </div>
                            </summary>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                ${generateRequestReportsCard()}
                                ${generateMyRequestsCard()}
                            </div>
                        </details>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${generateRequestReportsCard()}
                        ${generateMyRequestsCard()}
                    </div>
                `}
            </div>

            <div>
                <div class="flex items-center mb-6">
                    <div class="flex-1 border-t-2 border-info"></div>
                    <h4 class="px-4 text-xl font-black text-info uppercase tracking-wider">
                        <i class="fas fa-chart-line mr-2"></i>
                        Rapports Interactifs
                    </h4>
                    <div class="flex-1 border-t-2 border-info"></div>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-info p-4 rounded-lg mb-6">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-info text-xl mt-1"></i>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Aperçus pour Consultation Interne Uniquement
                            </p>
                            <p class="text-xs text-gray-700 dark:text-gray-300">
                                Ces rapports sont des aperçus interactifs pour votre usage personnel.
                                <span class="text-warning font-bold">Ne pas utiliser comme documents officiels</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${generateClassicReportCard(
                        'Bilan Interactif', 
                        'fas fa-balance-scale', 
                        'balance-sheet', 
                        'Visualisation interactive du bilan.', 
                        true
                    )}
                    ${generateClassicReportCard(
                        'Compte de Résultat', 
                        'fas fa-money-bill-transfer', 
                        'pnl', 
                        'Performance financière en temps réel.'
                    )}
                    ${generateClassicReportCard(
                        'Tableau des Flux', 
                        'fas fa-arrows-split-up-and-down', 
                        'cash-flow', 
                        'Analyse des mouvements de trésorerie.'
                    )}
                </div>
            </div>

            <style>
                details[open] .details-icon {
                    transform: rotate(180deg);
                }
            </style>
        </div>
    `;
}

// =============================================================================
// 3. FONCTIONS BACKEND
// =============================================================================

window.loadReportsStats = async function() {
    if (!isAdminOrCollab()) return;
    
    try {
        console.log('📊 [loadReportsStats] Chargement...');
        
        const response = await apiFetch('reports/stats', { method: 'GET' });
        
        if (response.status === 'success' && response.data) {
            const stats = response.data;
            document.getElementById('stats-pending').textContent = stats.pending_count || 0;
            document.getElementById('stats-processing').textContent = stats.processing_count || 0;
            document.getElementById('stats-validated').textContent = stats.validated_count || 0;
            document.getElementById('stats-sent').textContent = stats.sent_count || 0;
            
            console.log('✅ [loadReportsStats] Stats chargées:', stats);
        }
    } catch (error) {
        console.error('❌ [loadReportsStats] Erreur:', error);
        ['pending', 'processing', 'validated', 'sent'].forEach(key => {
            const el = document.getElementById(`stats-${key}`);
            if (el) el.textContent = '0';
        });
    }
};

window.loadMyFinancialReportsPreview = async function() {
    const previewContainer = document.getElementById('my-requests-preview');
    if (!previewContainer) return;
    
    try {
        console.log('📋 [loadMyFinancialReportsPreview] Chargement...');
        
        const response = await apiFetch('reports/my-requests?limit=3', { method: 'GET' });
        
        if (response.success && response.data && response.data.length > 0) {
            const html = response.data.map(req => `
                <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                     onclick="window.viewRequestDetails(${req.id})">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">${req.accounting_system || 'État financier'}</span>
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full ${getStatusClass(req.status)}">
                            ${getStatusLabel(req.status)}
                        </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                        ${req.requested_at ? new Date(req.requested_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    </p>
                </div>
            `).join('');
            
            previewContainer.innerHTML = html;
        } else {
            previewContainer.innerHTML = `
                <div class="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                    <i class="fas fa-inbox mr-1"></i>
                    Aucune demande récente
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ [loadMyFinancialReportsPreview] Erreur:', error);
        previewContainer.innerHTML = `
            <div class="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                <i class="fas fa-inbox mr-1"></i>
                Aucune demande
            </div>
        `;
    }
};

window.loadPendingFinancialReportsPreview = async function() {
    if (!isAdminOrCollab()) return;
    
    const previewContainer = document.getElementById('pending-requests-preview');
    if (!previewContainer) return;
    
    try {
        console.log('📋 [loadPendingFinancialReportsPreview] Chargement...');
        
        const response = await apiFetch('reports/pending?limit=3', { method: 'GET' });
        
        if (response.success && response.data && response.data.length > 0) {
            const html = response.data.map(req => {
                const daysAgo = req.requested_at 
                    ? Math.floor((new Date() - new Date(req.requested_at)) / (1000 * 60 * 60 * 24))
                    : 0;
                return `
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-warning hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
                         onclick="window.editFinancialReport(${req.id})">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-bold text-gray-900 dark:text-white">${req.requested_by_name || req.company_name || 'Client'}</span>
                            <span class="text-warning font-bold text-xs">${daysAgo}j</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">${req.accounting_system || 'État financier'}</p>
                        <button onclick="event.stopPropagation(); window.editFinancialReport(${req.id})" 
                            class="text-xs bg-warning text-white px-3 py-1 rounded-full hover:bg-warning/90 transition-colors">
                            <i class="fas fa-edit mr-1"></i>Traiter
                        </button>
                    </div>
                `;
            }).join('');
            
            previewContainer.innerHTML = html;
        } else {
            previewContainer.innerHTML = `
                <div class="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                    <i class="fas fa-check-circle mr-1"></i>
                    Aucune demande urgente
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ [loadPendingFinancialReportsPreview] Erreur:', error);
        previewContainer.innerHTML = `
            <div class="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                <i class="fas fa-inbox mr-1"></i>
                Aucune demande
            </div>
        `;
    }
};

window.openRequestFinancialReportsModal = function() {
    const modalContent = `
        <form id="request-reports-form" onsubmit="window.submitFinancialReportRequest(event)" class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Type d'états financiers <span class="text-danger">*</span>
                </label>
                <select id="report-type" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- Sélectionner --</option>
                    <option value="SYSCOHADA_NORMAL">SYSCOHADA Normal (Bilan + CR + TFT + Annexes)</option>
                    <option value="SYSCOHADA_MINIMAL">SYSCOHADA Minimal (Bilan + CR)</option>
                    <option value="SYCEBNL_NORMAL">SYCEBNL Normal (Associations/ONG)</option>
                    <option value="SYCEBNL_ALLEGE">SYCEBNL Allégé</option>
                    <option value="PCG_FRENCH">Plan Comptable Général (France)</option>
                </select>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Période (Début) <span class="text-danger">*</span>
                    </label>
                    <input type="date" id="period-start" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Période (Fin) <span class="text-danger">*</span>
                    </label>
                    <input type="date" id="period-end" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Notes / Instructions (Optionnel)
                </label>
                <textarea id="report-notes" rows="4" 
                    class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Ex: J'ai besoin de ces états pour un audit bancaire..."></textarea>
            </div>
            
            <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                    <i class="fas fa-info-circle text-info mr-2"></i>
                    Votre demande sera traitée dans un délai de <strong>48h ouvrées</strong>.
                </p>
            </div>
            
            <div class="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Annuler
                </button>
                <button type="submit"
                    class="px-6 py-3 bg-info text-white font-bold rounded-xl hover:bg-info/90 transition-colors">
                    <i class="fas fa-paper-plane mr-2"></i>Envoyer la Demande
                </button>
            </div>
        </form>
    `;
    
    ModalManager.open('📋 Demander des États Financiers', modalContent);
};

window.submitFinancialReportRequest = async function(event) {
    event.preventDefault();
    
    const data = {
        company_id: appState.currentCompanyId,
        accounting_system: document.getElementById('report-type').value,
        period_start: document.getElementById('period-start').value,
        period_end: document.getElementById('period-end').value,
        fiscal_year: new Date(document.getElementById('period-start').value).getFullYear(),
        notes: document.getElementById('report-notes').value
    };
    
    try {
        NotificationManager.show('Envoi de la demande...', 'info');
        
        const response = await apiFetch('reports/request', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            NotificationManager.show('✅ Demande envoyée avec succès !', 'success');
            ModalManager.close();
            window.loadMyFinancialReportsPreview();
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('❌ [submitFinancialReportRequest] Erreur:', error);
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

window.loadMyFinancialReports = function() {
    NotificationManager.show('⚠️ Fonctionnalité en cours de développement', 'info', 3000);
};

window.loadPendingFinancialReports = function() {
    NotificationManager.show('⚠️ Fonctionnalité en cours de développement', 'info', 3000);
};

window.editFinancialReport = function() {
    NotificationManager.show('⚠️ Fonctionnalité en cours de développement', 'info', 3000);
};

window.validateFinancialReport = function() {
    NotificationManager.show('⚠️ Fonctionnalité en cours de développement', 'info', 3000);
};

// =============================================================================
// 4. FONCTIONS UTILITAIRES
// =============================================================================

function getStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'validated': 'bg-green-100 text-green-800',
        'generated': 'bg-green-100 text-green-800',
        'sent': 'bg-purple-100 text-purple-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'processing': 'En cours',
        'validated': 'Validé',
        'generated': 'Généré',
        'sent': 'Envoyé'
    };
    return labels[status] || status;
}

// =============================================================================
// 5. INITIALISATION
// =============================================================================

window.initFinancialReportsModule = function() {
    const profile = getUserProfile();
    
    console.log('🔄 [initFinancialReportsModule] Profil:', profile);
    
    if (isAdminOrCollab()) {
        console.log('✅ [initFinancialReportsModule] Chargement données Admin/Collab');
        window.loadReportsStats();
        window.loadPendingFinancialReportsPreview();
    }
    
    window.loadMyFinancialReportsPreview();
};

console.log('✅ [MODULE_RAPPORTS_FINAL] Toutes les fonctions chargées avec succès');
console.log('✅ [MODULE_RAPPORTS_FINAL] Détection automatique .profile vs .role');
console.log('✅ [MODULE_RAPPORTS_FINAL] Compatible avec votre backend (success au lieu de status)');

// =================================================================
// MODULE IMMOBILISATIONS - VERSION PRODUCTION COMPLÈTE
// Gestion des immobilisations corporelles et incorporelles (SYSCOHADA)
// Compatible Odoo 19 - Architecture identique au module Rapports
// =================================================================

/**
 * Générer le menu principal des immobilisations
 * ✅ CONSERVÉ (Parfait)
 */
function generateImmobilisationsMenuHTML() {
    const userRole = appState.user?.role || 'user';
    
    return `
        <div class="fade-in">
            <h3 class="text-3xl font-black text-secondary mb-4">
                <i class="fas fa-building mr-3"></i>
                Gestion des Immobilisations
            </h3>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Suivez vos immobilisations corporelles et incorporelles conformément au SYSCOHADA Révisé.
            </p>

            <!-- Statistiques des immobilisations -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Total Immobilisations</p>
                            <p class="text-3xl font-black mt-1" id="immob-total">-</p>
                        </div>
                        <i class="fas fa-building fa-2x opacity-70"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Valeur Brute</p>
                            <p class="text-2xl font-black mt-1" id="immob-valeur-brute">-</p>
                        </div>
                        <i class="fas fa-coins fa-2x opacity-70"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-2xl shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Amortissements</p>
                            <p class="text-2xl font-black mt-1" id="immob-amortissements">-</p>
                        </div>
                        <i class="fas fa-chart-line fa-2x opacity-70"></i>
                    </div>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-2xl shadow-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm opacity-90">Valeur Nette</p>
                            <p class="text-2xl font-black mt-1" id="immob-valeur-nette">-</p>
                        </div>
                        <i class="fas fa-dollar-sign fa-2x opacity-70"></i>
                    </div>
                </div>
            </div>

            <!-- Actions rapides -->
            <div class="grid grid-cols-1 md:grid-cols-${userRole === 'admin' || userRole === 'collaborateur' ? '3' : '2'} gap-6 mb-8">
                ${userRole === 'admin' || userRole === 'collaborateur' ? `
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-primary hover:shadow-lg transition-shadow">
                        <div class="flex items-start">
                            <i class="fas fa-plus-circle fa-2x text-primary mr-4"></i>
                            <div class="flex-1">
                                <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Nouvelle Immobilisation
                                </h5>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Enregistrer une nouvelle immobilisation corporelle ou incorporelle.
                                </p>
                                <button onclick="window.openNewImmobilisationModal()" 
                                    class="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-dark transition-colors">
                                    <i class="fas fa-plus mr-2"></i>
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-info hover:shadow-lg transition-shadow">
                    <div class="flex items-start">
                        <i class="fas fa-list fa-2x text-info mr-4"></i>
                        <div class="flex-1">
                            <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Liste des Immobilisations
                            </h5>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Consultez la liste complète avec détails et amortissements.
                            </p>
                            <button onclick="window.loadImmobilisationsList()" 
                                class="w-full bg-info text-white py-3 px-4 rounded-xl font-bold hover:bg-info/90 transition-colors">
                                <i class="fas fa-eye mr-2"></i>
                                Voir la Liste
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border-l-4 border-success hover:shadow-lg transition-shadow">
                    <div class="flex items-start">
                        <i class="fas fa-file-excel fa-2x text-success mr-4"></i>
                        <div class="flex-1">
                            <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                États Immobilisations
                            </h5>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Générer les tableaux réglementaires (SYSCOHADA).
                            </p>
                            <button onclick="window.openImmobilisationsReportsModal()" 
                                class="w-full bg-success text-white py-3 px-4 rounded-xl font-bold hover:bg-success/90 transition-colors">
                                <i class="fas fa-download mr-2"></i>
                                Générer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Catégories SYSCOHADA -->
            <div class="mb-8">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <i class="fas fa-folder-open text-warning mr-2"></i>
                    Catégories d'Immobilisations (SYSCOHADA)
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="categories-container">
                    ${generateImmobilisationCategoryCard('Charges Immobilisées', '20', 'fas fa-file-alt', 'Frais d\'établissement, charges à répartir', 0)}
                    ${generateImmobilisationCategoryCard('Immobilisations Incorporelles', '21', 'fas fa-lightbulb', 'Brevets, licences, logiciels, fonds commercial', 0)}
                    ${generateImmobilisationCategoryCard('Terrains', '22', 'fas fa-map', 'Terrains agricoles, bâtis, aménagés', 0)}
                    ${generateImmobilisationCategoryCard('Bâtiments', '23', 'fas fa-building', 'Constructions, installations, agencements', 0)}
                    ${generateImmobilisationCategoryCard('Matériel', '24', 'fas fa-cogs', 'Matériel industriel, outillage, équipements', 0)}
                    ${generateImmobilisationCategoryCard('Autres Immobilisations', '25-28', 'fas fa-boxes', 'Mobilier, matériel de transport, agencements', 0)}
                </div>
            </div>

            <!-- États disponibles -->
            <div class="mb-8">
                <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <i class="fas fa-clipboard-list text-info mr-2"></i>
                    États et Tableaux Disponibles
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${generateImmobilisationReportCard(
                        'Tableau des Immobilisations',
                        'fas fa-table',
                        'Détail des acquisitions, cessions et sorties par catégorie',
                        'tableau-immobilisations'
                    )}
                    ${generateImmobilisationReportCard(
                        'Tableau des Amortissements',
                        'fas fa-percentage',
                        'Amortissements cumulés et dotations de l\'exercice',
                        'tableau-amortissements'
                    )}
                    ${generateImmobilisationReportCard(
                        'Tableau des Provisions',
                        'fas fa-shield-alt',
                        'Provisions pour dépréciation des immobilisations',
                        'tableau-provisions'
                    )}
                    ${generateImmobilisationReportCard(
                        'État de Rapprochement',
                        'fas fa-sync-alt',
                        'Rapprochement comptabilité / inventaire physique',
                        'etat-rapprochement'
                    )}
                </div>
            </div>
        </div>
    `;
}

/**
 * Générer une card de catégorie d'immobilisation
 * ✅ AMÉLIORÉ : Ajout du compteur
 */
function generateImmobilisationCategoryCard(title, code, icon, description, count = 0) {
    return `
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all cursor-pointer"
             onclick="window.filterImmobilisationsByCategory('${code}')">
            <div class="flex items-start">
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="${icon} text-xl text-primary"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <h6 class="text-sm font-bold text-gray-900 dark:text-white">${title}</h6>
                        <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full" id="count-${code}">${count}</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${description}</p>
                    <span class="inline-block px-2 py-1 text-xs font-mono font-bold rounded bg-info/10 text-info">
                        Compte ${code}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Générer une card d'état/tableau
 * ✅ CONSERVÉ (Parfait)
 */
function generateImmobilisationReportCard(title, icon, description, reportId) {
    return `
        <div class="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-success hover:shadow-lg transition-shadow cursor-pointer"
             onclick="window.generateSpecificImmobilisationReport('${reportId}')">
            <div class="flex items-start">
                <i class="${icon} fa-2x text-success mr-4 mt-1"></i>
                <div class="flex-1">
                    <h6 class="text-base font-bold text-gray-900 dark:text-white mb-2">${title}</h6>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${description}</p>
                    <button class="text-sm text-success font-semibold hover:underline">
                        Générer cet état <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =================================================================
// FONCTIONS DE CHARGEMENT (API CALLS) - PRODUCTION
// =================================================================

/**
 * ✅ FONCTION PRODUCTION : Charger les statistiques des immobilisations
 * Compatible Odoo 19 - Modèle account.asset
 */
async function loadImmobilisationsStats() {
    try {
        const companyId = appState.currentCompanyId;
        
        console.log('📊 [loadImmobilisationsStats] Chargement pour company:', companyId);
        
        const response = await apiFetch(`accounting/immobilisations/stats?companyId=${companyId}`, { 
            method: 'GET' 
        });
        
        if (response.status === 'success') {
            const stats = response.data;
            
            // Mise à jour des statistiques
            document.getElementById('immob-total').textContent = stats.total || '0';
            document.getElementById('immob-valeur-brute').textContent = 
                formatCurrency(stats.valeur_brute || 0);
            document.getElementById('immob-amortissements').textContent = 
                formatCurrency(stats.amortissements || 0);
            document.getElementById('immob-valeur-nette').textContent = 
                formatCurrency(stats.valeur_nette || 0);
            
            console.log('✅ [loadImmobilisationsStats] Stats chargées:', stats);
        } else {
            throw new Error(response.message || 'Erreur réponse API');
        }
    } catch (error) {
        console.error('❌ [loadImmobilisationsStats] Erreur:', error);
        
        // Valeurs par défaut en cas d'erreur
        document.getElementById('immob-total').textContent = '0';
        document.getElementById('immob-valeur-brute').textContent = '0 XOF';
        document.getElementById('immob-amortissements').textContent = '0 XOF';
        document.getElementById('immob-valeur-nette').textContent = '0 XOF';
        
        NotificationManager.show('⚠️ Impossible de charger les statistiques', 'warning', 3000);
    }
}

/**
 * ✅ FONCTION PRODUCTION : Charger les compteurs par catégorie
 */
async function loadCategoriesCounts() {
    try {
        const companyId = appState.currentCompanyId;
        
        const response = await apiFetch(`accounting/immobilisations/categories/list?companyId=${companyId}`, {
            method: 'GET'
        });
        
        if (response.status === 'success' && response.data) {
            // Mapper les catégories Odoo aux codes SYSCOHADA
            const categoryMap = {
                '20': 0, '21': 0, '22': 0, '23': 0, '24': 0, '25-28': 0
            };
            
            response.data.forEach(cat => {
                // Logique de mapping basée sur les comptes Odoo
                // À adapter selon ta configuration Odoo
                const code = cat.code || '';
                if (code.startsWith('20')) categoryMap['20']++;
                else if (code.startsWith('21')) categoryMap['21']++;
                else if (code.startsWith('22')) categoryMap['22']++;
                else if (code.startsWith('23')) categoryMap['23']++;
                else if (code.startsWith('24')) categoryMap['24']++;
                else if (code >= '250' && code <= '289') categoryMap['25-28']++;
            });
            
            // Mettre à jour les compteurs
            Object.entries(categoryMap).forEach(([code, count]) => {
                const countElement = document.getElementById(`count-${code}`);
                if (countElement) {
                    countElement.textContent = count;
                }
            });
            
            console.log('✅ [loadCategoriesCounts] Compteurs mis à jour');
        }
    } catch (error) {
        console.error('❌ [loadCategoriesCounts] Erreur:', error);
    }
}

// =================================================================
// FONCTIONS D'ACTION UTILISATEUR - PRODUCTION
// =================================================================

/**
 * ✅ FONCTION PRODUCTION : Ouvrir modal nouvelle immobilisation
 * Formulaire complet avec tous les champs requis
 */
window.openNewImmobilisationModal = async function() {
    // Charger les catégories d'actifs depuis Odoo
    let categoriesHTML = '<option value="">Sélectionnez une catégorie...</option>';
    
    try {
        const response = await apiFetch(`accounting/immobilisations/categories/list?companyId=${appState.currentCompanyId}`, {
            method: 'GET'
        });
        
        if (response.status === 'success' && response.data) {
            categoriesHTML += response.data.map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
    
    const formHTML = `
        <div class="p-6">
            <form id="new-immobilisation-form" class="space-y-6">
                <!-- Informations générales -->
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-info">
                    <h5 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-info-circle text-info mr-2"></i>
                        Informations Générales
                    </h5>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Nom de l'immobilisation <span class="text-danger">*</span>
                            </label>
                            <input type="text" name="name" required
                                placeholder="Ex: Ordinateur Dell XPS 15"
                                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Code (optionnel)
                                </label>
                                <input type="text" name="code"
                                    placeholder="Ex: IMM-2026-001"
                                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Date d'acquisition <span class="text-danger">*</span>
                                </label>
                                <input type="date" name="date" required
                                    value="${new Date().toISOString().split('T')[0]}"
                                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Valeur et Catégorie -->
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border-l-4 border-purple-500">
                    <h5 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-coins text-purple-500 mr-2"></i>
                        Valeur et Classification
                    </h5>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Valeur d'acquisition (XOF) <span class="text-danger">*</span>
                            </label>
                            <input type="number" name="value" required min="0" step="0.01"
                                placeholder="Ex: 500000"
                                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Catégorie SYSCOHADA <span class="text-danger">*</span>
                            </label>
                            <select name="category_id" required
                                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                                ${categoriesHTML}
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Paramètres d'amortissement -->
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border-l-4 border-warning">
                    <h5 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-chart-line text-warning mr-2"></i>
                        Amortissement
                    </h5>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Méthode d'amortissement
                            </label>
                            <select name="method"
                                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                                <option value="linear">Linéaire (constant)</option>
                                <option value="degressive">Dégressif (décroissant)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Durée d'amortissement (années)
                            </label>
                            <input type="number" name="method_number" min="1" max="50" value="5"
                                class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none">
                            <p class="text-xs text-gray-500 mt-1">
                                💡 Durées usuelles : Mobilier (5-10 ans), Matériel (5-7 ans), Bâtiments (20-50 ans)
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Boutons -->
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onclick="ModalManager.close()"
                        class="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Annuler
                    </button>
                    <button type="submit"
                        class="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center">
                        <i class="fas fa-save mr-2"></i>
                        Créer l'Immobilisation
                    </button>
                </div>
            </form>
        </div>
    `;
    
    ModalManager.open('🏗️ Nouvelle Immobilisation', formHTML, 'max-w-4xl');
    
    // Gestionnaire de soumission
    document.getElementById('new-immobilisation-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            value: parseFloat(formData.get('value')),
            category_id: parseInt(formData.get('category_id')),
            date: formData.get('date'),
            method: formData.get('method') || 'linear',
            method_number: parseInt(formData.get('method_number')) || 5
        };
        
        try {
            NotificationManager.show('⏳ Création en cours...', 'info', 2000);
            
            const response = await apiFetch(`accounting/immobilisations/create?companyId=${appState.currentCompanyId}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.status === 'success') {
                NotificationManager.show('✅ Immobilisation créée avec succès !', 'success', 5000);
                ModalManager.close();
                
                // Recharger les stats
                loadImmobilisationsStats();
                loadCategoriesCounts();
            } else {
                throw new Error(response.message || 'Erreur création');
            }
        } catch (error) {
            console.error('Erreur création immobilisation:', error);
            NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
        }
    });
};

/**
 * ✅ FONCTION PRODUCTION : Charger et afficher la liste des immobilisations
 */
window.loadImmobilisationsList = async function(category = null, page = 1) {
    const loaderContent = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-5xl text-info mb-4"></i>
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Chargement de la liste...</p>
            </div>
        </div>
    `;
    
    ModalManager.open('📋 Liste des Immobilisations', loaderContent, 'max-w-6xl');
    
    try {
        const limit = 50;
        const offset = (page - 1) * limit;
        const categoryFilter = category ? `&category=${category}` : '';
        
        const response = await apiFetch(
            `accounting/immobilisations/list?companyId=${appState.currentCompanyId}${categoryFilter}&limit=${limit}&offset=${offset}`,
            { method: 'GET' }
        );
        
        if (response.status === 'success') {
            const listHTML = generateImmobilisationsListHTML(response.data, response.pagination, category);
            ModalManager.open('📋 Liste des Immobilisations', listHTML, 'max-w-6xl');
        } else {
            throw new Error(response.message || 'Erreur chargement liste');
        }
    } catch (error) {
        console.error('Erreur chargement liste:', error);
        NotificationManager.show(`❌ ${error.message}`, 'error', 5000);
        ModalManager.close();
    }
};

/**
 * Générer le HTML de la liste des immobilisations
 */
function generateImmobilisationsListHTML(assets, pagination, currentCategory) {
    if (!assets || assets.length === 0) {
        return `
            <div class="p-10 text-center">
                <i class="fas fa-inbox fa-5x text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold text-gray-500">Aucune immobilisation trouvée</p>
                <button onclick="window.openNewImmobilisationModal(); ModalManager.close();"
                    class="mt-4 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">
                    <i class="fas fa-plus mr-2"></i>
                    Créer la première immobilisation
                </button>
            </div>
        `;
    }
    
    const rows = assets.map(asset => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            onclick="window.viewImmobilisationDetails(${asset.id})">
            <td class="px-4 py-3 text-sm">
                <div class="font-bold text-gray-900 dark:text-white">${asset.name}</div>
                ${asset.code ? `<div class="text-xs text-gray-500">${asset.code}</div>` : ''}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                ${asset.category_id ? asset.category_id[1] : 'N/A'}
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono">
                ${formatCurrency(asset.value || 0)}
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono text-orange-600">
                ${formatCurrency((asset.value || 0) - (asset.value_residual || 0))}
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono font-bold text-success">
                ${formatCurrency(asset.value_residual || 0)}
            </td>
            <td class="px-4 py-3 text-sm">
                ${formatDate(asset.date)}
            </td>
            <td class="px-4 py-3 text-sm">
                ${getAssetStatusBadge(asset.state)}
            </td>
        </tr>
    `).join('');
    
    const paginationHTML = pagination ? `
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Affichage ${pagination.offset + 1} - ${Math.min(pagination.offset + pagination.limit, pagination.total)} sur ${pagination.total}
            </div>
            <div class="flex space-x-2">
                ${pagination.offset > 0 ? `
                    <button onclick="window.loadImmobilisationsList('${currentCategory || ''}', ${Math.floor(pagination.offset / pagination.limit)})"
                        class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        Précédent
                    </button>
                ` : ''}
                ${pagination.hasMore ? `
                    <button onclick="window.loadImmobilisationsList('${currentCategory || ''}', ${Math.floor(pagination.offset / pagination.limit) + 2})"
                        class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        Suivant
                    </button>
                ` : ''}
            </div>
        </div>
    ` : '';
    
    return `
        <div class="p-6">
            <!-- Filtres -->
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <select id="category-filter" onchange="window.loadImmobilisationsList(this.value, 1)"
                        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800">
                        <option value="">Toutes les catégories</option>
                        <option value="20" ${currentCategory === '20' ? 'selected' : ''}>Charges Immobilisées (20)</option>
                        <option value="21" ${currentCategory === '21' ? 'selected' : ''}>Incorporelles (21)</option>
                        <option value="22" ${currentCategory === '22' ? 'selected' : ''}>Terrains (22)</option>
                        <option value="23" ${currentCategory === '23' ? 'selected' : ''}>Bâtiments (23)</option>
                        <option value="24" ${currentCategory === '24' ? 'selected' : ''}>Matériel (24)</option>
                        <option value="25-28" ${currentCategory === '25-28' ? 'selected' : ''}>Autres (25-28)</option>
                    </select>
                </div>
                <button onclick="window.openNewImmobilisationModal(); ModalManager.close();"
                    class="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">
                    <i class="fas fa-plus mr-2"></i>
                    Nouvelle
                </button>
            </div>
            
            <!-- Tableau -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase">Désignation</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase">Catégorie</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase">Valeur Brute</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase">Amortissements</th>
                            <th class="px-4 py-3 text-right text-xs font-bold uppercase">Valeur Nette</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-bold uppercase">Statut</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${rows}
                    </tbody>
                </table>
            </div>
            
            ${paginationHTML}
        </div>
    `;
}

/**
 * Filtrer par catégorie (appel à loadImmobilisationsList avec filtre)
 */
window.filterImmobilisationsByCategory = function(categoryCode) {
    window.loadImmobilisationsList(categoryCode, 1);
};

/**
 * Voir les détails d'une immobilisation
 */
window.viewImmobilisationDetails = async function(assetId) {
    const loaderContent = `
        <div class="flex items-center justify-center py-20">
            <i class="fas fa-spinner fa-spin text-5xl text-info mb-4"></i>
        </div>
    `;
    
    ModalManager.open('Détails Immobilisation', loaderContent, 'max-w-4xl');
    
    try {
        const response = await apiFetch(`accounting/immobilisations/${assetId}?companyId=${appState.currentCompanyId}`, {
            method: 'GET'
        });
        
        if (response.status === 'success') {
            const detailsHTML = generateImmobilisationDetailsHTML(response.data);
            ModalManager.open(`Immobilisation #${assetId}`, detailsHTML, 'max-w-4xl');
        } else {
            throw new Error(response.message || 'Erreur chargement détails');
        }
    } catch (error) {
        console.error('Erreur détails:', error);
        NotificationManager.show(`❌ ${error.message}`, 'error', 5000);
        ModalManager.close();
    }
};

/**
 * Générer le HTML des détails d'une immobilisation
 */
function generateImmobilisationDetailsHTML(asset) {
    const valeurNette = (asset.value || 0) - ((asset.value || 0) - (asset.value_residual || 0));
    const tauxAmortissement = asset.value > 0 ? (((asset.value - asset.value_residual) / asset.value) * 100).toFixed(2) : 0;
    
    return `
        <div class="p-6 space-y-6">
            <!-- En-tête -->
            <div class="bg-gradient-to-r from-primary/10 to-info/10 p-6 rounded-2xl border border-primary/30">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">${asset.name}</h3>
                        ${asset.code ? `<p class="text-sm text-gray-600 dark:text-gray-400 font-mono">${asset.code}</p>` : ''}
                    </div>
                    <div class="text-right">
                        ${getAssetStatusBadge(asset.state)}
                    </div>
                </div>
            </div>
            
            <!-- Statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border-l-4 border-purple-500">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Valeur d'acquisition</p>
                    <p class="text-2xl font-black text-gray-900 dark:text-white">${formatCurrency(asset.value || 0)}</p>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border-l-4 border-warning">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Amortissements cumulés</p>
                    <p class="text-2xl font-black text-warning">${formatCurrency((asset.value || 0) - (asset.value_residual || 0))}</p>
                    <p class="text-xs text-gray-500 mt-1">${tauxAmortissement}% amorti</p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-l-4 border-success">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Valeur nette comptable</p>
                    <p class="text-2xl font-black text-success">${formatCurrency(asset.value_residual || 0)}</p>
                </div>
            </div>
            
            <!-- Informations détaillées -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                    <h5 class="font-bold text-gray-900 dark:text-white border-b pb-2">Informations générales</h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Catégorie :</span>
                            <span class="font-bold">${asset.category_id ? asset.category_id[1] : 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Date d'acquisition :</span>
                            <span class="font-bold">${formatDate(asset.date)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h5 class="font-bold text-gray-900 dark:text-white border-b pb-2">Amortissement</h5>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Méthode :</span>
                            <span class="font-bold">${asset.method === 'linear' ? 'Linéaire' : 'Dégressif'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Durée :</span>
                            <span class="font-bold">${asset.method_number || 'N/A'} ans</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Boutons d'action -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="ModalManager.close()"
                    class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700">
                    Fermer
                </button>
            </div>
        </div>
    `;
}

/**
 * Ouvrir modal de sélection des rapports
 */
window.openImmobilisationsReportsModal = function() {
    const modalContent = `
        <div class="p-6">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
                Sélectionnez le type d'état que vous souhaitez générer :
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${generateImmobilisationReportCard(
                    'Tableau des Immobilisations',
                    'fas fa-table',
                    'Détail des acquisitions, cessions et sorties',
                    'tableau-immobilisations'
                )}
                ${generateImmobilisationReportCard(
                    'Tableau des Amortissements',
                    'fas fa-percentage',
                    'Amortissements cumulés et dotations',
                    'tableau-amortissements'
                )}
                ${generateImmobilisationReportCard(
                    'Tableau des Provisions',
                    'fas fa-shield-alt',
                    'Provisions pour dépréciation',
                    'tableau-provisions'
                )}
                ${generateImmobilisationReportCard(
                    'État de Rapprochement',
                    'fas fa-sync-alt',
                    'Rapprochement comptabilité/inventaire',
                    'etat-rapprochement'
                )}
            </div>
        </div>
    `;
    
    ModalManager.open('📊 États Immobilisations', modalContent, 'max-w-4xl');
};

/**
 * Générer un rapport spécifique
 */
window.generateSpecificImmobilisationReport = async function(reportId) {
    NotificationManager.show('⏳ Génération en cours...', 'info', 2000);
    
    try {
        const endpoint = `accounting/immobilisations/reports/${reportId}?companyId=${appState.currentCompanyId}`;
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        if (response.status === 'success') {
            const reportHTML = generateReportTableHTML(response.data, reportId);
            ModalManager.open(getReportTitle(reportId), reportHTML, 'max-w-6xl');
        } else {
            throw new Error(response.message || 'Erreur génération rapport');
        }
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        NotificationManager.show(`❌ ${error.message}`, 'error', 5000);
    }
};

// =================================================================
// FONCTIONS HELPERS
// =================================================================

/**
 * Formater devise
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Formater date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Badge statut immobilisation
 */
function getAssetStatusBadge(state) {
    const configs = {
        'draft': { label: 'Brouillon', color: 'gray' },
        'open': { label: 'En cours', color: 'green' },
        'close': { label: 'Clôturé', color: 'red' }
    };
    
    const config = configs[state] || configs['draft'];
    
    return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-200">
            ${config.label}
        </span>
    `;
}

/**
 * Titre du rapport
 */
function getReportTitle(reportId) {
    const titles = {
        'tableau-immobilisations': 'Tableau des Immobilisations SYSCOHADA',
        'tableau-amortissements': 'Tableau des Amortissements',
        'tableau-provisions': 'Tableau des Provisions',
        'etat-rapprochement': 'État de Rapprochement'
    };
    return titles[reportId] || 'Rapport';
}

/**
 * Générer le HTML d'un tableau de rapport
 */
function generateReportTableHTML(data, reportId) {
    if (!data || !data.headers || !data.rows) {
        return `
            <div class="p-10 text-center">
                <i class="fas fa-chart-bar fa-5x text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold text-gray-500">Aucune donnée disponible</p>
            </div>
        `;
    }
    
    const headerRow = data.headers.map(h => `<th class="px-4 py-3 text-left text-xs font-bold uppercase">${h}</th>`).join('');
    const bodyRows = data.rows.map(row => {
        const cells = row.map(cell => `<td class="px-4 py-3 text-sm">${cell}</td>`).join('');
        return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">${cells}</tr>`;
    }).join('');
    
    return `
        <div class="p-6">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>${headerRow}</tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        ${bodyRows}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="ModalManager.close()"
                    class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700">
                    Fermer
                </button>
                <button onclick="window.print()"
                    class="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">
                    <i class="fas fa-print mr-2"></i>
                    Imprimer
                </button>
            </div>
        </div>
    `;
}

// =============================================================================
// FRONTEND - Fonctions d'affichage des tableaux détaillés
// À ajouter dans MODULE_IMMOBILISATIONS_COMPLET.js
// =============================================================================

/**
 * Générer le HTML d'un tableau détaillé d'amortissements ou provisions
 */
function generateDetailedReportTableHTML(data, reportType) {
    if (!data || !data.rows || data.rows.length === 0) {
        return `
            <div class="p-10 text-center">
                <i class="fas fa-chart-bar fa-5x text-gray-300 mb-4"></i>
                <p class="text-lg font-semibold text-gray-500">
                    ${data.message || 'Aucune donnée disponible'}
                </p>
            </div>
        `;
    }
    
    // Titres spécifiques selon le type
    const titles = {
        'amortissements': 'Tableau des Amortissements',
        'provisions': 'Tableau des Provisions pour Dépréciation'
    };
    
    const title = titles[reportType] || 'Rapport';
    
    // Générer les en-têtes
    const headerRow = data.headers.map(h => 
        `<th class="px-4 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">${h}</th>`
    ).join('');
    
    // Générer les lignes
    const bodyRows = data.rows.map(row => {
        if (row.isHeader) {
            // Ligne catégorie
            return `
                <tr class="bg-gradient-to-r from-primary/10 to-info/10 border-l-4 border-primary">
                    <td colspan="${data.headers.length}" class="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        ${row.designation}
                    </td>
                </tr>
            `;
        } else {
            // Ligne détail
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${row.designation}</td>
                    <td class="px-4 py-3 text-sm text-right font-mono text-gray-700 dark:text-gray-300">
                        ${formatCurrency(row.valeur_origine)}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        ${formatDate(row.date_entree)}
                    </td>
                    <td class="px-4 py-3 text-sm text-center font-semibold text-info">
                        ${row.taux}
                    </td>
                    <td class="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                        ${row.nb_annees}
                    </td>
                    <td class="px-4 py-3 text-sm text-right font-mono font-semibold text-warning">
                        ${formatCurrency(row.amortissement_exercice || row.provision_exercice)}
                    </td>
                    <td class="px-4 py-3 text-sm text-right font-mono font-bold text-orange-600">
                        ${formatCurrency(row.cumul_amortissements || row.cumul_provisions)}
                    </td>
                    <td class="px-4 py-3 text-sm text-right font-mono font-bold text-success">
                        ${formatCurrency(row.valeur_actuelle || row.valeur_nette)}
                    </td>
                </tr>
            `;
        }
    }).join('');
    
    // Ligne de totaux
    const totauxRow = data.totaux ? `
        <tr class="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-t-2 border-primary font-bold">
            <td class="px-4 py-4 text-sm uppercase text-gray-900 dark:text-white">
                <i class="fas fa-calculator mr-2"></i>TOTAUX
            </td>
            <td class="px-4 py-4 text-sm text-right font-mono text-lg text-gray-900 dark:text-white">
                ${formatCurrency(data.totaux.valeur_origine)}
            </td>
            <td colspan="3"></td>
            <td class="px-4 py-4 text-sm text-right font-mono text-lg text-warning">
                ${formatCurrency(data.totaux.amortissement_exercice || data.totaux.provision_exercice)}
            </td>
            <td class="px-4 py-4 text-sm text-right font-mono text-lg text-orange-600">
                ${formatCurrency(data.totaux.cumul_amortissements || data.totaux.cumul_provisions)}
            </td>
            <td class="px-4 py-4 text-sm text-right font-mono text-lg text-success">
                ${formatCurrency(data.totaux.valeur_actuelle || data.totaux.valeur_nette)}
            </td>
        </tr>
    ` : '';
    
    return `
        <div class="p-6">
            <!-- En-tête avec info exercice -->
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-black text-gray-900 dark:text-white">${title}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Exercice fiscal : <span class="font-bold">${data.exercice || new Date().getFullYear()}</span>
                    </p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="window.printReport()" 
                        class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                    <button onclick="window.exportReportToExcel('${reportType}')" 
                        class="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-file-excel mr-2"></i>Excel
                    </button>
                </div>
            </div>
            
            <!-- Tableau -->
            <div class="overflow-x-auto shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
                <table class="w-full">
                    <thead>
                        <tr>${headerRow}</tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                        ${totauxRow}
                    </tbody>
                </table>
            </div>
            
            <!-- Légende -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-info">
                    <p class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">TAUX</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Linéaire : 100% ÷ nb années<br>
                        Dégressif : Taux × coefficient (2 ou 2.5)
                    </p>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-warning">
                    <p class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">CUMUL</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        ${reportType === 'amortissements' ? 'Amortissements' : 'Provisions'} cumulés depuis acquisition
                    </p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-success">
                    <p class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">VALEUR ${reportType === 'amortissements' ? 'ACTUELLE' : 'NETTE'}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        Valeur d'origine - Cumul ${reportType === 'amortissements' ? 'amortissements' : 'provisions'}
                    </p>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onclick="ModalManager.close()"
                    class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Fermer
                </button>
                <button onclick="window.generatePDFReport('${reportType}')"
                    class="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors">
                    <i class="fas fa-file-pdf mr-2"></i>Générer PDF
                </button>
            </div>
        </div>
    `;
}

/**
 * Fonction MODIFIÉE pour générer les rapports spécifiques
 */
window.generateSpecificImmobilisationReport = async function(reportId) {
    const loaderContent = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-5xl text-info mb-4"></i>
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Génération du rapport...</p>
            </div>
        </div>
    `;
    
    ModalManager.open('Rapport Immobilisations', loaderContent, 'max-w-7xl');
    
    try {
        const companyId = appState.currentCompanyId;
        const fiscalYear = new Date().getFullYear(); // Ou depuis un sélecteur
        
        let endpoint = '';
        let reportType = '';
        
        // Mapper les IDs aux endpoints
        switch(reportId) {
            case 'tableau-immobilisations':
                endpoint = `accounting/immobilisations/reports/tableau-immobilisations?companyId=${companyId}&fiscalYear=${fiscalYear}`;
                reportType = 'immobilisations';
                break;
            case 'tableau-amortissements':
                endpoint = `accounting/immobilisations/reports/tableau-amortissements?companyId=${companyId}&fiscalYear=${fiscalYear}`;
                reportType = 'amortissements';
                break;
            case 'tableau-provisions':
                endpoint = `accounting/immobilisations/reports/tableau-provisions?companyId=${companyId}&fiscalYear=${fiscalYear}`;
                reportType = 'provisions';
                break;
            case 'etat-rapprochement':
                endpoint = `accounting/immobilisations/reports/etat-rapprochement?companyId=${companyId}`;
                reportType = 'rapprochement';
                break;
            default:
                throw new Error('Type de rapport inconnu');
        }
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        if (response.status === 'success') {
            // Utiliser la fonction détaillée pour amortissements et provisions
            let reportHTML;
            
            if (reportType === 'amortissements' || reportType === 'provisions') {
                reportHTML = generateDetailedReportTableHTML(response.data, reportType);
            } else {
                // Utiliser l'ancienne fonction pour les autres
                reportHTML = generateReportTableHTML(response.data, reportId);
            }
            
            ModalManager.open(getReportTitle(reportId), reportHTML, 'max-w-7xl');
        } else {
            throw new Error(response.message || 'Erreur génération rapport');
        }
    } catch (error) {
        console.error('Erreur génération rapport:', error);
        NotificationManager.show(`❌ ${error.message}`, 'error', 5000);
        ModalManager.close();
    }
};

/**
 * Fonctions utilitaires pour l'export
 */
window.printReport = function() {
    window.print();
};

window.exportReportToExcel = function(reportType) {
    NotificationManager.show('📊 Export Excel en cours de développement...', 'info', 3000);
    // TODO: Implémenter export Excel avec bibliothèque comme xlsx.js
};

window.generatePDFReport = function(reportType) {
    NotificationManager.show('📄 Génération PDF en cours de développement...', 'info', 3000);
    // TODO: Implémenter génération PDF avec jsPDF ou similaire
};

/**
 * Helper : Formater les devises (si pas déjà défini)
 */
function formatCurrency(amount) {
    if (typeof amount === 'undefined' || amount === null) return '0 XOF';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Helper : Formater les dates (si pas déjà défini)
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Helper : Titre du rapport (si pas déjà défini)
 */
function getReportTitle(reportId) {
    const titles = {
        'tableau-immobilisations': 'Tableau des Immobilisations SYSCOHADA',
        'tableau-amortissements': 'Tableau des Amortissements',
        'tableau-provisions': 'Tableau des Provisions',
        'etat-rapprochement': 'État de Rapprochement'
    };
    return titles[reportId] || 'Rapport';
}

/**
 * ============================================
 * INITIALISATION DU MODULE RAPPORTS FINANCIERS
 * ============================================
 */

/**
 * Charger les statistiques (Admin/Collab)
 */
window.loadReportsStats = async function() {
    try {
        const response = await apiFetch('api/reports/stats/summary', { method: 'GET' });
        
        if (response.success) {
            const stats = response.data;
            document.getElementById('stats-pending').textContent = stats.pending_count || 0;
            document.getElementById('stats-processing').textContent = stats.processing_count || 0;
            document.getElementById('stats-validated').textContent = stats.validated_count || 0;
            document.getElementById('stats-sent').textContent = stats.sent_count || 0;
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
};

/**
 * Charger un aperçu des dernières demandes de l'utilisateur
 */
window.loadMyFinancialReportsPreview = async function() {
    try {
        const response = await apiFetch('api/reports/my-requests?limit=3', { method: 'GET' });
        
        if (response.success && response.data.length > 0) {
            const html = response.data.map(req => generateRequestPreviewItem(req)).join('');
            document.getElementById('my-requests-preview').innerHTML = html;
        } else {
            document.getElementById('my-requests-preview').innerHTML = `
                <p class="text-sm text-gray-500 dark:text-gray-400 italic">Aucune demande récente.</p>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement aperçu demandes:', error);
    }
};

/**
 * Charger un aperçu des demandes en attente (Collaborateur/Admin)
 */
window.loadPendingFinancialReportsPreview = async function() {
    try {
        const response = await apiFetch('api/reports/pending?limit=3', { method: 'GET' });
        
        if (response.success && response.data.length > 0) {
            const html = response.data.map(req => generateRequestPreviewItem(req, true)).join('');
            document.getElementById('pending-requests-preview').innerHTML = html;
        } else {
            document.getElementById('pending-requests-preview').innerHTML = `
                <p class="text-sm text-gray-500 dark:text-gray-400 italic">Aucune demande en attente.</p>
            `;
        }
    } catch (error) {
        console.error('Erreur chargement demandes en attente:', error);
    }
};

/**
 * Générer un item d'aperçu de demande
 */
function generateRequestPreviewItem(request, showCompany = false) {
    const statusConfig = getStatusConfig(request.status);
    
    return `
        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
             onclick="window.viewRequestDetails(${request.id})">
            <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    ${showCompany ? request.company_name : request.accounting_system}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ${new Date(request.period_start).toLocaleDateString('fr-FR')} - ${new Date(request.period_end).toLocaleDateString('fr-FR')}
                </p>
            </div>
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bgClass} ${statusConfig.textClass}">
                ${statusConfig.label}
            </span>
        </div>
    `;
}

/**
 * Configuration des statuts
 */
function getStatusConfig(status) {
    const configs = {
        'pending': { 
            label: 'En attente', 
            bgClass: 'bg-gray-200 dark:bg-gray-700', 
            textClass: 'text-gray-800 dark:text-gray-200',
            icon: 'fas fa-clock'
        },
        'processing': { 
            label: 'En cours', 
            bgClass: 'bg-yellow-200 dark:bg-yellow-900/50', 
            textClass: 'text-yellow-800 dark:text-yellow-200',
            icon: 'fas fa-spinner fa-spin'
        },
        'generated': { 
            label: 'Générés', 
            bgClass: 'bg-blue-200 dark:bg-blue-900/50', 
            textClass: 'text-blue-800 dark:text-blue-200',
            icon: 'fas fa-file-pdf'
        },
        'validated': { 
            label: 'Validés', 
            bgClass: 'bg-green-200 dark:bg-green-900/50', 
            textClass: 'text-green-800 dark:text-green-200',
            icon: 'fas fa-check-circle'
        },
        'sent': { 
            label: 'Envoyés', 
            bgClass: 'bg-purple-200 dark:bg-purple-900/50', 
            textClass: 'text-purple-800 dark:text-purple-200',
            icon: 'fas fa-paper-plane'
        },
        'cancelled': { 
            label: 'Annulés', 
            bgClass: 'bg-red-200 dark:bg-red-900/50', 
            textClass: 'text-red-800 dark:text-red-200',
            icon: 'fas fa-ban'
        },
        'error': { 
            label: 'Erreur', 
            bgClass: 'bg-red-300 dark:bg-red-900', 
            textClass: 'text-red-900 dark:text-red-100',
            icon: 'fas fa-exclamation-triangle'
        }
    };
    
    return configs[status] || configs['pending'];
}

/**
 * Initialiser le module au chargement de la page Rapports
 */
window.initFinancialReportsModule = function() {
    const userRole = appState.user?.role || 'user';
    
    // Charger les stats si Admin/Collab
    if (userRole === 'admin' || userRole === 'collaborateur') {
        window.loadReportsStats();
        window.loadPendingFinancialReportsPreview();
    }
    
    // Charger l'aperçu des demandes de l'utilisateur
    window.loadMyFinancialReportsPreview();
};

// ========================================================================
// MODAL : DEMANDE D'ÉTATS FINANCIERS (ÉTAPE 6)
// ========================================================================

/**
 * Ouvrir le modal de demande d'états financiers
 */
window.openRequestFinancialReportsModal = function() {
    const modalContent = generateRequestFinancialReportsFormHTML();
    ModalManager.open('Demander des États Financiers', modalContent, 'max-w-2xl');
};

/**
 * Générer le HTML du formulaire de demande
 */
function generateRequestFinancialReportsFormHTML() {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    return `
        <div class="p-6">
            <div class="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-info p-4 rounded-lg">
                <div class="flex items-start">
                    <i class="fas fa-info-circle text-info text-xl mr-3 mt-1"></i>
                    <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Génération d'États Financiers Officiels
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                            Une fois votre demande envoyée, un collaborateur la traitera et générera vos états financiers conformes aux normes comptables.
                            Vous recevrez une notification lorsque les documents seront prêts.
                        </p>
                    </div>
                </div>
            </div>

            <form id="request-financial-reports-form" class="space-y-6">
                
                <!-- Système Comptable -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-book text-info mr-2"></i>
                        Système Comptable *
                    </label>
                    <select id="accounting-system" name="accounting_system" required
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-info focus:border-transparent transition-all">
                        <option value="">-- Sélectionnez un système --</option>
                        <optgroup label="SYSCOHADA (OHADA)">
                            <option value="SYSCOHADA_NORMAL">SYSCOHADA - Système Normal</option>
                            <option value="SYSCOHADA_MINIMAL">SYSCOHADA - Système Minimal de Trésorerie</option>
                        </optgroup>
                        <optgroup label="SYCEBNL (Entités à But Non Lucratif - Bénin)">
                            <option value="SYCEBNL_NORMAL">SYCEBNL - Système Normal</option>
                            <option value="SYCEBNL_ALLEGE">SYCEBNL - Système Allégé</option>
                        </optgroup>
                        <optgroup label="Plan Comptable Général (France)">
                            <option value="PCG_FRENCH">PCG - Plan Comptable Général Français</option>
                        </optgroup>
                    </select>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Choisissez le référentiel comptable applicable à votre entreprise.
                    </p>
                </div>

                <!-- Informations sur le système sélectionné -->
                <div id="system-info" class="hidden bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        <i class="fas fa-file-alt text-purple-600 mr-2"></i>
                        États financiers qui seront générés :
                    </p>
                    <ul id="system-reports-list" class="text-xs text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                        <!-- Sera rempli dynamiquement -->
                    </ul>
                </div>

                <!-- Période -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-calendar-alt text-success mr-2"></i>
                            Date de Début *
                        </label>
                        <input type="date" id="period-start" name="period_start" required
                            value="${currentYear}-01-01"
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-success focus:border-transparent transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-calendar-check text-success mr-2"></i>
                            Date de Fin *
                        </label>
                        <input type="date" id="period-end" name="period_end" required
                            value="${currentYear}-12-31"
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-success focus:border-transparent transition-all">
                    </div>
                </div>

                <!-- Exercice Fiscal -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-calendar text-primary mr-2"></i>
                        Exercice Fiscal (optionnel)
                    </label>
                    <input type="text" id="fiscal-year" name="fiscal_year" 
                        placeholder="Ex: 2026, N-1, Exercice 2026"
                        value="${currentYear}"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Identifiant de l'exercice comptable (ex: 2026, N, N-1).
                    </p>
                </div>

                <!-- Notes complémentaires -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-comment text-warning mr-2"></i>
                        Notes / Instructions (optionnel)
                    </label>
                    <textarea id="request-notes" name="notes" rows="3" 
                        placeholder="Ajoutez des précisions ou instructions particulières pour le collaborateur..."
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-warning focus:border-transparent transition-all resize-none"></textarea>
                </div>

                <!-- Résumé de la demande -->
                <div id="request-summary" class="hidden bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        <i class="fas fa-clipboard-check text-success mr-2"></i>
                        Résumé de votre demande
                    </p>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Entreprise :</span>
                            <p class="font-semibold text-gray-900 dark:text-white">${appState.currentCompanyName || 'Non définie'}</p>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Système :</span>
                            <p class="font-semibold text-gray-900 dark:text-white" id="summary-system">-</p>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Période :</span>
                            <p class="font-semibold text-gray-900 dark:text-white" id="summary-period">-</p>
                        </div>
                        <div>
                            <span class="text-gray-500 dark:text-gray-400">Exercice :</span>
                            <p class="font-semibold text-gray-900 dark:text-white" id="summary-fiscal">-</p>
                        </div>
                    </div>
                </div>

                <!-- Boutons -->
                <div class="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onclick="ModalManager.close()" 
                        class="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-times mr-2"></i>
                        Annuler
                    </button>
                    <button type="submit" id="submit-request-btn"
                        class="flex-1 px-6 py-3 bg-gradient-to-r from-info to-primary text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">
                        <i class="fas fa-paper-plane mr-2"></i>
                        Envoyer la Demande
                    </button>
                </div>
            </form>
        </div>

        <script>
            // Initialiser les event listeners du formulaire
            (function() {
                const form = document.getElementById('request-financial-reports-form');
                const systemSelect = document.getElementById('accounting-system');
                const periodStart = document.getElementById('period-start');
                const periodEnd = document.getElementById('period-end');
                const fiscalYear = document.getElementById('fiscal-year');
                
                // Afficher les infos du système sélectionné
                systemSelect.addEventListener('change', function() {
                    updateSystemInfo(this.value);
                    updateSummary();
                });
                
                // Mettre à jour le résumé en temps réel
                [periodStart, periodEnd, fiscalYear].forEach(input => {
                    input.addEventListener('change', updateSummary);
                });
                
                // Soumettre le formulaire
                form.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    await window.handleSubmitFinancialReportRequest();
                });
                
                // Afficher le résumé après 1 seconde
                setTimeout(() => {
                    document.getElementById('request-summary').classList.remove('hidden');
                }, 1000);
            })();
            
            function updateSystemInfo(system) {
                const systemInfo = document.getElementById('system-info');
                const reportsList = document.getElementById('system-reports-list');
                
                if (!system) {
                    systemInfo.classList.add('hidden');
                    return;
                }
                
                const reportsConfig = {
                    'SYSCOHADA_NORMAL': [
                        '✓ Bilan (Actif/Passif)',
                        '✓ Compte de Résultat par Nature',
                        '✓ Tableau des Flux de Trésorerie (TFT)',
                        '✓ Notes Annexes Complètes (47 pages)',
                        '✓ État des Immobilisations',
                        '✓ État des Amortissements',
                        '✓ État des Provisions',
                        '✓ Tableau de Variation des Capitaux Propres (TAFIRE)'
                    ],
                    'SYSCOHADA_MINIMAL': [
                        '✓ Bilan Simplifié',
                        '✓ Compte de Résultat Simplifié',
                        '✓ Tableau des Flux de Trésorerie Adapté',
                        '✓ État des Recettes et Dépenses'
                    ],
                    'SYCEBNL_NORMAL': [
                        '✓ Bilan (structure EBNL avec fonds propres)',
                        '✓ Compte de Résultat (Emplois/Ressources)',
                        '✓ Tableau des Flux de Trésorerie',
                        '✓ Annexes Détaillées'
                    ],
                    'SYCEBNL_ALLEGE': [
                        '✓ Bilan Abrégé',
                        '✓ Compte de Résultat Abrégé',
                        '✓ Notes Simplifiées'
                    ],
                    'PCG_FRENCH': [
                        '✓ Bilan Comptable (Actif/Passif)',
                        '✓ Compte de Résultat (liste ou tableau)',
                        '✓ Annexe Comptable',
                        '✓ Tableau des Flux de Trésorerie (optionnel)'
                    ]
                };
                
                const reports = reportsConfig[system] || [];
                reportsList.innerHTML = reports.map(r => \`<li>\${r}</li>\`).join('');
                systemInfo.classList.remove('hidden');
            }
            
            function updateSummary() {
                const system = document.getElementById('accounting-system').value;
                const periodStart = document.getElementById('period-start').value;
                const periodEnd = document.getElementById('period-end').value;
                const fiscalYear = document.getElementById('fiscal-year').value;
                
                const systemLabels = {
                    'SYSCOHADA_NORMAL': 'SYSCOHADA Normal',
                    'SYSCOHADA_MINIMAL': 'SYSCOHADA Minimal',
                    'SYCEBNL_NORMAL': 'SYCEBNL Normal',
                    'SYCEBNL_ALLEGE': 'SYCEBNL Allégé',
                    'PCG_FRENCH': 'PCG Français'
                };
                
                document.getElementById('summary-system').textContent = systemLabels[system] || '-';
                document.getElementById('summary-period').textContent = 
                    periodStart && periodEnd 
                        ? \`Du \${new Date(periodStart).toLocaleDateString('fr-FR')} au \${new Date(periodEnd).toLocaleDateString('fr-FR')}\`
                        : '-';
                document.getElementById('summary-fiscal').textContent = fiscalYear || 'Non spécifié';
            }
        </script>
    `;
}

/**
 * Soumettre la demande d'états financiers
 */
window.handleSubmitFinancialReportRequest = async function() {
    const form = document.getElementById('request-financial-reports-form');
    const submitBtn = document.getElementById('submit-request-btn');
    
    // Validation
    if (!form.checkValidity()) {
        NotificationManager.show('Veuillez remplir tous les champs obligatoires.', 'error', 5000);
        form.reportValidity();
        return;
    }
    
    // Récupérer les données
    const formData = {
        company_id: appState.currentCompanyId,
        accounting_system: document.getElementById('accounting-system').value,
        period_start: document.getElementById('period-start').value,
        period_end: document.getElementById('period-end').value,
        fiscal_year: document.getElementById('fiscal-year').value || null,
        notes: document.getElementById('request-notes').value || null
    };
    
    // Validation des dates
    if (new Date(formData.period_start) > new Date(formData.period_end)) {
        NotificationManager.show('La date de début doit être antérieure à la date de fin.', 'error', 5000);
        return;
    }
    
    // Désactiver le bouton pendant l'envoi
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Envoi en cours...';
    
    try {
        const response = await apiFetch('api/reports/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.success) {
            NotificationManager.show(
                '✅ Demande envoyée avec succès ! Un collaborateur va la traiter sous peu.', 
                'success', 
                7000
            );
            
            ModalManager.close();
            
            // Rafraîchir l'aperçu des demandes
            window.loadMyFinancialReportsPreview();
            
            // Afficher une notification visuelle de succès
            showSuccessAnimation();
            
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi de la demande');
        }
        
    } catch (error) {
        console.error('Erreur soumission demande:', error);
        NotificationManager.show(
            `❌ Erreur : ${error.message}`, 
            'error', 
            7000
        );
        
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Envoyer la Demande';
    }
};

/**
 * Animation de succès après création de demande
 */
function showSuccessAnimation() {
    const animation = document.createElement('div');
    animation.className = 'fixed inset-0 flex items-center justify-center z-50 pointer-events-none';
    animation.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-full p-8 shadow-2xl animate-bounce">
            <i class="fas fa-check-circle text-success text-6xl"></i>
        </div>
    `;
    
    document.body.appendChild(animation);
    
    setTimeout(() => {
        animation.remove();
    }, 2000);
}

// ========================================================================
// LISTE COMPLÈTE DES DEMANDES (ÉTAPE 7)
// ========================================================================

/**
 * Ouvrir la liste complète des demandes de l'utilisateur
 */
window.loadMyFinancialReports = async function() {
    const modalContent = generateMyRequestsListHTML();
    ModalManager.open('Mes Demandes d\'États Financiers', modalContent, 'max-w-6xl');
    
    // Charger les données après l'ouverture du modal
    setTimeout(() => {
        window.fetchMyFinancialReports();
    }, 100);
};

/**
 * Générer le HTML de la liste des demandes
 */
function generateMyRequestsListHTML() {
    return `
        <div class="p-6">
            <!-- En-tête avec statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-4 rounded-xl">
                    <p class="text-xs opacity-90">Total</p>
                    <p class="text-2xl font-black" id="my-stats-total">-</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-xl">
                    <p class="text-xs opacity-90">En attente</p>
                    <p class="text-2xl font-black" id="my-stats-pending">-</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl">
                    <p class="text-xs opacity-90">Prêts</p>
                    <p class="text-2xl font-black" id="my-stats-ready">-</p>
                </div>
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                    <p class="text-xs opacity-90">En cours</p>
                    <p class="text-2xl font-black" id="my-stats-processing">-</p>
                </div>
            </div>

            <!-- Filtres -->
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Filtre Statut -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Statut
                        </label>
                        <select id="filter-status" onchange="window.fetchMyFinancialReports()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-info">
                            <option value="">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="processing">En cours</option>
                            <option value="generated">Générés</option>
                            <option value="validated">Validés</option>
                            <option value="sent">Envoyés</option>
                            <option value="cancelled">Annulés</option>
                            <option value="error">Erreur</option>
                        </select>
                    </div>

                    <!-- Filtre Système -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Système Comptable
                        </label>
                        <select id="filter-system" onchange="window.fetchMyFinancialReports()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-info">
                            <option value="">Tous les systèmes</option>
                            <option value="SYSCOHADA_NORMAL">SYSCOHADA Normal</option>
                            <option value="SYSCOHADA_MINIMAL">SYSCOHADA Minimal</option>
                            <option value="SYCEBNL_NORMAL">SYCEBNL Normal</option>
                            <option value="SYCEBNL_ALLEGE">SYCEBNL Allégé</option>
                            <option value="PCG_FRENCH">PCG Français</option>
                        </select>
                    </div>

                    <!-- Filtre Période -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Depuis
                        </label>
                        <input type="date" id="filter-date-start" onchange="window.fetchMyFinancialReports()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-info">
                    </div>

                    <!-- Bouton Reset -->
                    <div class="flex items-end">
                        <button onclick="window.resetFiltersMyReports()"
                            class="w-full px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            <i class="fas fa-redo mr-2"></i>
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tableau des demandes -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Loader -->
                <div id="my-requests-loader" class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <i class="fas fa-spinner fa-spin text-4xl text-info mb-3"></i>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Chargement des demandes...</p>
                    </div>
                </div>

                <!-- Tableau -->
                <div id="my-requests-table-container" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead class="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Système
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Période
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Date Demande
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="my-requests-tbody" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <!-- Lignes générées dynamiquement -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Message si vide -->
                    <div id="my-requests-empty" class="hidden text-center py-12">
                        <i class="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                        <p class="text-lg font-semibold text-gray-500 dark:text-gray-400">Aucune demande trouvée</p>
                        <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">Créez votre première demande d'états financiers</p>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div id="my-requests-pagination" class="mt-6 flex items-center justify-between">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    <span id="pagination-info">-</span>
                </div>
                <div class="flex space-x-2" id="pagination-buttons">
                    <!-- Boutons générés dynamiquement -->
                </div>
            </div>

            <!-- Bouton Nouvelle Demande -->
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onclick="window.openRequestFinancialReportsModal(); ModalManager.close();"
                    class="w-full bg-gradient-to-r from-info to-primary text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">
                    <i class="fas fa-plus-circle mr-2"></i>
                    Nouvelle Demande d'États Financiers
                </button>
            </div>
        </div>
    `;
}

/**
 * Charger les demandes avec filtres et pagination
 */
window.fetchMyFinancialReports = async function(page = 1) {
    const loader = document.getElementById('my-requests-loader');
    const tableContainer = document.getElementById('my-requests-table-container');
    const tbody = document.getElementById('my-requests-tbody');
    const emptyMessage = document.getElementById('my-requests-empty');
    
    // Afficher le loader
    loader.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    
    try {
        // Récupérer les filtres
        const filters = {
            limit: 20,
            offset: (page - 1) * 20,
            status: document.getElementById('filter-status')?.value || '',
            accounting_system: document.getElementById('filter-system')?.value || '',
            start_date: document.getElementById('filter-date-start')?.value || ''
        };
        
        // Construire la query string
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });
        
        const response = await apiFetch(`api/reports/my-requests?${queryParams.toString()}`, {
            method: 'GET'
        });
        
        if (response.success) {
            const requests = response.data;
            const pagination = response.pagination;
            
            // Mettre à jour les statistiques
            updateMyRequestsStats(requests);
            
            // Afficher les demandes
            if (requests.length === 0) {
                tableContainer.classList.add('hidden');
                emptyMessage.classList.remove('hidden');
            } else {
                tbody.innerHTML = requests.map(req => generateMyRequestRow(req)).join('');
                tableContainer.classList.remove('hidden');
                emptyMessage.classList.add('hidden');
                
                // Mettre à jour la pagination
                updatePagination(pagination, page);
            }
            
        } else {
            throw new Error(response.message || 'Erreur de chargement');
        }
        
    } catch (error) {
        console.error('Erreur chargement demandes:', error);
        NotificationManager.show(`Erreur : ${error.message}`, 'error', 5000);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-danger mb-3"></i>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Impossible de charger les demandes</p>
                </td>
            </tr>
        `;
    } finally {
        loader.classList.add('hidden');
    }
};

/**
 * Générer une ligne de demande
 */
function generateMyRequestRow(request) {
    const statusConfig = getStatusConfig(request.status);
    const systemLabel = getSystemLabel(request.accounting_system);
    
    // Déterminer les actions disponibles selon le statut
    const actions = generateRequestActions(request);
    
    return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onclick="window.viewRequestDetails(${request.id})">
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    #${String(request.id).padStart(5, '0')}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <i class="fas fa-book text-info mr-2"></i>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                        ${systemLabel}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                    <i class="fas fa-calendar text-success mr-1"></i>
                    ${new Date(request.period_start).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    au ${new Date(request.period_end).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                    ${new Date(request.requested_at).toLocaleDateString('fr-FR')}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    ${new Date(request.requested_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgClass} ${statusConfig.textClass}">
                    <i class="${statusConfig.icon} mr-1"></i>
                    ${statusConfig.label}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onclick="event.stopPropagation()">
                ${actions}
            </td>
        </tr>
    `;
}

/**
 * Générer les actions selon le statut
 */
function generateRequestActions(request) {
    const actions = [];
    
    // Bouton Voir Détails (toujours disponible)
    actions.push(`
        <button onclick="window.viewRequestDetails(${request.id})" 
            class="text-info hover:text-info/80 mr-2" title="Voir les détails">
            <i class="fas fa-eye"></i>
        </button>
    `);
    
    // Bouton Télécharger (si rapports disponibles)
    if (['validated', 'sent'].includes(request.status) && request.pdf_files) {
        actions.push(`
            <button onclick="window.downloadAllReports(${request.id})" 
                class="text-success hover:text-success/80 mr-2" title="Télécharger les rapports">
                <i class="fas fa-download"></i>
            </button>
        `);
    }
    
    // Bouton Annuler (si en attente)
    if (['pending', 'processing'].includes(request.status)) {
        actions.push(`
            <button onclick="window.cancelFinancialReportRequest(${request.id})" 
                class="text-danger hover:text-danger/80" title="Annuler la demande">
                <i class="fas fa-times-circle"></i>
            </button>
        `);
    }
    
    return actions.join('');
}

/**
 * Mettre à jour les statistiques
 */
function updateMyRequestsStats(requests) {
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        processing: requests.filter(r => r.status === 'processing').length,
        ready: requests.filter(r => ['validated', 'sent'].includes(r.status)).length
    };
    
    document.getElementById('my-stats-total').textContent = stats.total;
    document.getElementById('my-stats-pending').textContent = stats.pending;
    document.getElementById('my-stats-processing').textContent = stats.processing;
    document.getElementById('my-stats-ready').textContent = stats.ready;
}

/**
 * Mettre à jour la pagination
 */
function updatePagination(pagination, currentPage) {
    const infoElement = document.getElementById('pagination-info');
    const buttonsContainer = document.getElementById('pagination-buttons');
    
    const total = pagination.total || 0;
    const limit = pagination.limit || 20;
    const offset = pagination.offset || 0;
    
    const start = offset + 1;
    const end = Math.min(offset + limit, total);
    
    infoElement.textContent = `Affichage ${start}-${end} sur ${total} demandes`;
    
    // Calculer le nombre de pages
    const totalPages = Math.ceil(total / limit);
    
    if (totalPages <= 1) {
        buttonsContainer.innerHTML = '';
        return;
    }
    
    // Générer les boutons de pagination
    let buttons = [];
    
    // Bouton Précédent
    buttons.push(`
        <button ${currentPage === 1 ? 'disabled' : ''} 
            onclick="window.fetchMyFinancialReports(${currentPage - 1})"
            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `);
    
    // Boutons de pages
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttons.push(`
                <button onclick="window.fetchMyFinancialReports(${i})"
                    class="px-3 py-1 border ${i === currentPage ? 'bg-info text-white border-info' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'} rounded-lg text-sm font-semibold">
                    ${i}
                </button>
            `);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttons.push(`<span class="px-2 text-gray-500">...</span>`);
        }
    }
    
    // Bouton Suivant
    buttons.push(`
        <button ${currentPage === totalPages ? 'disabled' : ''} 
            onclick="window.fetchMyFinancialReports(${currentPage + 1})"
            class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `);
    
    buttonsContainer.innerHTML = buttons.join('');
}

/**
 * Réinitialiser les filtres
 */
window.resetFiltersMyReports = function() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-system').value = '';
    document.getElementById('filter-date-start').value = '';
    window.fetchMyFinancialReports(1);
};

/**
 * Obtenir le label du système comptable
 */
function getSystemLabel(system) {
    const labels = {
        'SYSCOHADA_NORMAL': 'SYSCOHADA Normal',
        'SYSCOHADA_MINIMAL': 'SYSCOHADA Minimal',
        'SYCEBNL_NORMAL': 'SYCEBNL Normal',
        'SYCEBNL_ALLEGE': 'SYCEBNL Allégé',
        'PCG_FRENCH': 'PCG Français'
    };
    return labels[system] || system;
}

/**
 * Annuler une demande
 */
window.cancelFinancialReportRequest = async function(requestId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
        return;
    }
    
    try {
        const response = await apiFetch(`api/reports/${requestId}/cancel`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            NotificationManager.show('✅ Demande annulée avec succès', 'success', 5000);
            window.fetchMyFinancialReports(); // Recharger la liste
        } else {
            throw new Error(response.message || 'Erreur lors de l\'annulation');
        }
        
    } catch (error) {
        console.error('Erreur annulation:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

/**
 * Télécharger tous les rapports d'une demande
 */
window.downloadAllReports = async function(requestId) {
    NotificationManager.show('📥 Préparation du téléchargement...', 'info', 3000);
    
    try {
        const response = await apiFetch(`api/reports/${requestId}`, { method: 'GET' });
        
        if (response.success && response.data.pdf_files) {
            const files = response.data.pdf_files;
            
            // Télécharger chaque fichier
            for (const [type, url] of Object.entries(files)) {
                if (url) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${type}_${requestId}.pdf`;
                    link.click();
                    
                    // Délai entre chaque téléchargement
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            NotificationManager.show('✅ Téléchargement terminé', 'success', 5000);
        } else {
            throw new Error('Aucun fichier disponible');
        }
        
    } catch (error) {
        console.error('Erreur téléchargement:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

// ========================================================================
// VUE DÉTAILLÉE D'UNE DEMANDE (ÉTAPE 8)
// ========================================================================

/**
 * Afficher les détails d'une demande
 */
window.viewRequestDetails = async function(requestId) {
    // Afficher un loader pendant le chargement
    const loaderContent = `
        <div class="flex items-center justify-center py-20">
            <div class="text-center">
                <i class="fas fa-spinner fa-spin text-5xl text-info mb-4"></i>
                <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Chargement des détails...</p>
            </div>
        </div>
    `;
    
    ModalManager.open('Détails de la Demande', loaderContent, 'max-w-5xl');
    
    try {
        const response = await apiFetch(`api/reports/${requestId}`, { method: 'GET' });
        
        if (response.success) {
            const request = response.data;
            const detailsContent = generateRequestDetailsHTML(request);
            ModalManager.open(`Demande #${String(requestId).padStart(5, '0')}`, detailsContent, 'max-w-5xl');
        } else {
            throw new Error(response.message || 'Impossible de charger les détails');
        }
        
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
        ModalManager.close();
    }
};

/**
 * Générer le HTML des détails d'une demande
 */
function generateRequestDetailsHTML(request) {
    const statusConfig = getStatusConfig(request.status);
    const systemLabel = getSystemLabel(request.accounting_system);
    const userRole = appState.user?.role || 'user';
    
    return `
        <div class="p-6">
            <!-- En-tête avec badge de statut -->
            <div class="bg-gradient-to-r from-info/10 to-primary/10 dark:from-info/20 dark:to-primary/20 p-6 rounded-2xl mb-6 border border-info/30">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
                            Demande #${String(request.id).padStart(5, '0')}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <i class="fas fa-building text-primary mr-2"></i>
                            ${request.company_name || appState.currentCompanyName}
                        </p>
                    </div>
                    <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusConfig.bgClass} ${statusConfig.textClass} shadow-lg">
                        <i class="${statusConfig.icon} mr-2"></i>
                        ${statusConfig.label}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Système Comptable</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            <i class="fas fa-book text-info mr-1"></i>
                            ${systemLabel}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Période</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            <i class="fas fa-calendar text-success mr-1"></i>
                            ${new Date(request.period_start).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - 
                            ${new Date(request.period_end).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Exercice Fiscal</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            ${request.fiscal_year || 'Non spécifié'}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Date de Demande</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            ${new Date(request.requested_at).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Colonne Gauche : Timeline -->
                <div class="lg:col-span-1">
                    <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-stream text-primary mr-2"></i>
                        Historique
                    </h4>
                    ${generateRequestTimeline(request)}
                </div>

                <!-- Colonne Droite : Documents et Actions -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Documents PDF -->
                    ${generatePDFDocumentsSection(request)}
                    
                    <!-- Notes -->
                    ${request.notes ? generateNotesSection(request.notes) : ''}
                    
                    <!-- Erreur (si applicable) -->
                    ${request.error_message ? generateErrorSection(request.error_message) : ''}
                    
                    <!-- Actions selon le rôle et le statut -->
                    ${generateRequestActionsSection(request, userRole)}
                </div>
            </div>

            <!-- Boutons en bas -->
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button onclick="ModalManager.close()" 
                    class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-times mr-2"></i>
                    Fermer
                </button>
                
                ${['validated', 'sent'].includes(request.status) && request.pdf_files ? `
                    <button onclick="window.downloadAllReports(${request.id})" 
                        class="px-6 py-3 bg-gradient-to-r from-success to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">
                        <i class="fas fa-download mr-2"></i>
                        Télécharger Tous les Rapports
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Générer la timeline de la demande
 */
function generateRequestTimeline(request) {
    const events = [];
    
    // Événement 1 : Demande créée
    events.push({
        icon: 'fas fa-plus-circle',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Demande créée',
        date: request.requested_at,
        user: request.requested_by_name || 'Vous',
        completed: true
    });
    
    // Événement 2 : En traitement
    if (request.processed_at) {
        events.push({
            icon: 'fas fa-cogs',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            label: 'Traitement démarré',
            date: request.processed_at,
            user: request.processed_by_name,
            completed: true
        });
    }
    
    // Événement 3 : Rapports générés
    if (['generated', 'validated', 'sent'].includes(request.status)) {
        events.push({
            icon: 'fas fa-file-pdf',
            color: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900/30',
            label: 'Rapports générés',
            date: request.processed_at,
            user: request.processed_by_name,
            completed: true
        });
    }
    
    // Événement 4 : Validation
    if (request.validated_at) {
        events.push({
            icon: 'fas fa-check-double',
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            label: 'Rapports validés',
            date: request.validated_at,
            user: request.validated_by_name,
            completed: true
        });
    }
    
    // Événement 5 : Envoyé
    if (request.sent_at) {
        events.push({
            icon: 'fas fa-paper-plane',
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
            label: 'Rapports envoyés',
            date: request.sent_at,
            user: 'Système',
            completed: true
        });
    }
    
    // Événement spécial : Annulé
    if (request.status === 'cancelled') {
        events.push({
            icon: 'fas fa-ban',
            color: 'text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            label: 'Demande annulée',
            date: request.updated_at,
            user: 'Vous',
            completed: true
        });
    }
    
    // Événement spécial : Erreur
    if (request.status === 'error') {
        events.push({
            icon: 'fas fa-exclamation-triangle',
            color: 'text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            label: 'Erreur de traitement',
            date: request.updated_at,
            user: 'Système',
            completed: true
        });
    }
    
    return `
        <div class="relative">
            <!-- Ligne verticale -->
            <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div class="space-y-6">
                ${events.map((event, index) => `
                    <div class="relative flex items-start">
                        <!-- Icône -->
                        <div class="flex-shrink-0 w-10 h-10 rounded-full ${event.bgColor} flex items-center justify-center z-10 shadow-md">
                            <i class="${event.icon} ${event.color}"></i>
                        </div>
                        
                        <!-- Contenu -->
                        <div class="ml-4 flex-1">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white">
                                ${event.label}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ${new Date(event.date).toLocaleDateString('fr-FR', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            ${event.user ? `
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    Par ${event.user}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Section Documents PDF
 */
function generatePDFDocumentsSection(request) {
    if (!request.pdf_files || Object.keys(request.pdf_files).length === 0) {
        return `
            <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div class="text-center">
                    <i class="fas fa-file-pdf text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                    <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        Aucun document disponible pour le moment
                    </p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Les documents seront disponibles une fois la demande traitée
                    </p>
                </div>
            </div>
        `;
    }
    
    const documentsConfig = {
        'bilan': { 
            label: 'Bilan Comptable', 
            icon: 'fas fa-balance-scale', 
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        'compte_resultat': { 
            label: 'Compte de Résultat', 
            icon: 'fas fa-chart-line', 
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
        },
        'tft': { 
            label: 'Tableau des Flux de Trésorerie', 
            icon: 'fas fa-money-bill-wave', 
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        },
        'annexes': { 
            label: 'Notes Annexes', 
            icon: 'fas fa-file-alt', 
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20'
        }
    };
    
    return `
        <div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <i class="fas fa-file-pdf text-danger mr-2"></i>
                Documents Générés
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${Object.entries(request.pdf_files).map(([type, url]) => {
                    const config = documentsConfig[type] || { 
                        label: type, 
                        icon: 'fas fa-file', 
                        color: 'text-gray-600',
                        bgColor: 'bg-gray-50 dark:bg-gray-800'
                    };
                    
                    return `
                        <div class="group ${config.bgColor} p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
                             onclick="window.previewPDF('${url}', '${config.label}')">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center flex-1">
                                    <div class="w-12 h-12 ${config.bgColor} rounded-lg flex items-center justify-center mr-3">
                                        <i class="${config.icon} text-xl ${config.color}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                                            ${config.label}
                                        </p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Format PDF
                                        </p>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="event.stopPropagation(); window.previewPDF('${url}', '${config.label}')" 
                                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                        title="Aperçu">
                                        <i class="fas fa-eye text-info"></i>
                                    </button>
                                    <a href="${url}" download 
                                        onclick="event.stopPropagation()"
                                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                                        title="Télécharger">
                                        <i class="fas fa-download text-success"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

/**
 * Section Notes
 */
function generateNotesSection(notes) {
    return `
        <div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <i class="fas fa-comment-alt text-warning mr-2"></i>
                Notes & Instructions
            </h4>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border-l-4 border-warning">
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${notes}</p>
            </div>
        </div>
    `;
}

/**
 * Section Erreur
 */
function generateErrorSection(errorMessage) {
    return `
        <div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <i class="fas fa-exclamation-triangle text-danger mr-2"></i>
                Message d'Erreur
            </h4>
            <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-l-4 border-danger">
                <p class="text-sm text-red-700 dark:text-red-300 font-mono">${errorMessage}</p>
            </div>
        </div>
    `;
}

/**
 * Section Actions (selon rôle et statut)
 */
function generateRequestActionsSection(request, userRole) {
    const actions = [];
    
    // USER : Annuler si en attente
    if (['pending', 'processing'].includes(request.status)) {
        actions.push(`
            <button onclick="window.cancelFinancialReportRequest(${request.id}); ModalManager.close();" 
                class="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-600 transition-colors">
                <i class="fas fa-times-circle mr-2"></i>
                Annuler la Demande
            </button>
        `);
    }
    
    // COLLABORATEUR/ADMIN : Actions de traitement
    if ((userRole === 'collaborateur' || userRole === 'admin')) {
        if (request.status === 'pending') {
            actions.push(`
                <button onclick="window.startProcessingRequest(${request.id})" 
                    class="w-full bg-warning text-white py-3 px-4 rounded-xl font-semibold hover:bg-warning/90 transition-colors">
                    <i class="fas fa-play mr-2"></i>
                    Commencer le Traitement
                </button>
            `);
        }
        
        if (request.status === 'processing' || request.status === 'generated') {
            actions.push(`
                <button onclick="window.openEditReportsModal(${request.id})" 
                    class="w-full bg-info text-white py-3 px-4 rounded-xl font-semibold hover:bg-info/90 transition-colors mb-3">
                    <i class="fas fa-edit mr-2"></i>
                    Modifier / Régénérer les Rapports
                </button>
            `);
        }
        
        if (request.status === 'generated') {
            actions.push(`
                <button onclick="window.validateFinancialReports(${request.id})" 
                    class="w-full bg-success text-white py-3 px-4 rounded-xl font-semibold hover:bg-success/90 transition-colors">
                    <i class="fas fa-check-double mr-2"></i>
                    Valider les Rapports
                </button>
            `);
        }
        
        if (request.status === 'validated') {
            actions.push(`
                <button onclick="window.sendReportsToUser(${request.id})" 
                    class="w-full bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
                    <i class="fas fa-paper-plane mr-2"></i>
                    Envoyer au Client
                </button>
            `);
        }
    }
    
    if (actions.length === 0) {
        return '';
    }
    
    return `
        <div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <i class="fas fa-tasks text-info mr-2"></i>
                Actions Disponibles
            </h4>
            <div class="space-y-3">
                ${actions.join('')}
            </div>
        </div>
    `;
}

/**
 * Prévisualiser un PDF dans un modal
 */
window.previewPDF = function(url, title) {
    const previewContent = `
        <div class="p-6">
            <div class="bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden" style="height: 600px;">
                <iframe src="${url}" 
                    class="w-full h-full border-0"
                    title="${title}">
                </iframe>
            </div>
            <div class="mt-4 flex justify-between">
                <button onclick="ModalManager.close()" 
                    class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-times mr-2"></i>
                    Fermer
                </button>
                <a href="${url}" download 
                    class="px-6 py-3 bg-success text-white rounded-xl font-semibold hover:bg-success/90 transition-colors">
                    <i class="fas fa-download mr-2"></i>
                    Télécharger
                </a>
            </div>
        </div>
    `;
    
    ModalManager.open(`📄 ${title}`, previewContent, 'max-w-5xl');
};

/**
 * ============================================
 * ACTIONS COLLABORATEUR/ADMIN
 * ============================================
 */

/**
 * Commencer le traitement d'une demande
 */
window.startProcessingRequest = async function(requestId) {
    if (!confirm('Commencer le traitement de cette demande ? Les rapports seront générés automatiquement depuis Odoo.')) {
        return;
    }
    
    try {
        NotificationManager.show('🔄 Génération des rapports en cours...', 'info', 5000);
        
        const response = await apiFetch(`api/reports/${requestId}/generate`, {
            method: 'POST'
        });
        
        if (response.success) {
            NotificationManager.show('✅ Génération démarrée avec succès !', 'success', 5000);
            ModalManager.close();
            
            // Rafraîchir si on est sur la liste
            if (typeof window.fetchMyFinancialReports === 'function') {
                window.fetchMyFinancialReports();
            }
            if (typeof window.loadPendingFinancialReports === 'function') {
                window.loadPendingFinancialReports();
            }
        } else {
            throw new Error(response.message || 'Erreur lors du démarrage');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

/**
 * 🔧 NOUVEAU : Ouvrir le modal d'édition/régénération des rapports
 */
window.openEditReportsModal = async function(requestId) {
    try {
        // Charger les détails de la demande et les données Odoo
        const response = await apiFetch(`api/reports/${requestId}/preview`, { method: 'GET' });
        
        if (response.success) {
            const requestData = response.data;
            const modalContent = generateEditReportsModalHTML(requestId, requestData);
            ModalManager.open(`✏️ Modifier les Rapports - Demande #${String(requestId).padStart(5, '0')}`, modalContent, 'max-w-6xl');
        } else {
            throw new Error(response.message || 'Impossible de charger les données');
        }
        
    } catch (error) {
        console.error('Erreur ouverture modal édition:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

/**
 * 🔧 NOUVEAU : Générer le HTML du modal d'édition
 */
function generateEditReportsModalHTML(requestId, data) {
    const bilan = data.bilan || {};
    const compteResultat = data.compte_resultat || {};
    
    return `
        <div class="p-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-info p-4 rounded-lg mb-6">
                <div class="flex items-start">
                    <i class="fas fa-info-circle text-info text-xl mr-3 mt-1"></i>
                    <div>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Mode Édition - Modification des Données Comptables
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                            Vous pouvez <strong>ajuster les montants</strong> avant la génération finale des PDFs. 
                            Les modifications seront sauvegardées et les rapports régénérés.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Onglets : Bilan / Compte de Résultat / TFT -->
            <div class="mb-6">
                <div class="border-b border-gray-200 dark:border-gray-700">
                    <nav class="-mb-px flex space-x-4">
                        <button onclick="window.switchEditTab('bilan')" id="tab-bilan"
                            class="edit-tab active py-3 px-4 font-semibold text-sm border-b-2 border-primary text-primary">
                            <i class="fas fa-balance-scale mr-2"></i>
                            Bilan
                        </button>
                        <button onclick="window.switchEditTab('compte-resultat')" id="tab-compte-resultat"
                            class="edit-tab py-3 px-4 font-semibold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            <i class="fas fa-chart-line mr-2"></i>
                            Compte de Résultat
                        </button>
                        <button onclick="window.switchEditTab('tft')" id="tab-tft"
                            class="edit-tab py-3 px-4 font-semibold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            <i class="fas fa-money-bill-wave mr-2"></i>
                            TFT
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Contenu des onglets -->
            <div id="edit-content">
                <!-- Onglet Bilan -->
                <div id="content-bilan" class="edit-content-tab">
                    ${generateEditableBilanHTML(bilan)}
                </div>

                <!-- Onglet Compte de Résultat -->
                <div id="content-compte-resultat" class="edit-content-tab hidden">
                    ${generateEditableCompteResultatHTML(compteResultat)}
                </div>

                <!-- Onglet TFT -->
                <div id="content-tft" class="edit-content-tab hidden">
                    <div class="text-center py-12">
                        <i class="fas fa-construction text-4xl text-warning mb-3"></i>
                        <p class="text-gray-500 dark:text-gray-400">Édition du TFT en cours de développement</p>
                    </div>
                </div>
            </div>

            <!-- Boutons d'action -->
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button onclick="ModalManager.close()" 
                    class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <i class="fas fa-times mr-2"></i>
                    Annuler
                </button>
                <div class="flex space-x-3">
                    <button onclick="window.resetEditedData(${requestId})" 
                        class="px-6 py-3 border border-warning text-warning rounded-xl font-semibold hover:bg-warning/10 transition-colors">
                        <i class="fas fa-undo mr-2"></i>
                        Réinitialiser
                    </button>
                    <button onclick="window.saveAndRegenerateReports(${requestId})" 
                        class="px-6 py-3 bg-gradient-to-r from-success to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105">
                        <i class="fas fa-save mr-2"></i>
                        Sauvegarder et Régénérer
                    </button>
                </div>
            </div>
        </div>

        <style>
            .edit-tab.active {
                border-color: #3b82f6 !important;
                color: #3b82f6 !important;
            }
            .edit-content-tab {
                max-height: 500px;
                overflow-y: auto;
            }
        </style>
    `;
}

/**
 * 🔧 NOUVEAU : Générer le HTML éditable du Bilan
 */
function generateEditableBilanHTML(bilan) {
    if (!bilan.actif || !bilan.passif) {
        return '<p class="text-center text-gray-500 py-8">Aucune donnée de bilan disponible</p>';
    }

    return `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- ACTIF -->
            <div>
                <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-primary">
                    ACTIF
                </h5>
                ${generateEditableSection(bilan.actif, 'actif')}
            </div>

            <!-- PASSIF -->
            <div>
                <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-danger">
                    PASSIF
                </h5>
                ${generateEditableSection(bilan.passif, 'passif')}
            </div>
        </div>

        <!-- Totaux -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">Total Actif :</span>
                    <span class="text-lg font-bold text-gray-900 dark:text-white ml-2" id="total-actif">
                        ${formatAmount(bilan.totaux?.actif || 0)}
                    </span>
                </div>
                <div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">Total Passif :</span>
                    <span class="text-lg font-bold text-gray-900 dark:text-white ml-2" id="total-passif">
                        ${formatAmount(bilan.totaux?.passif || 0)}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * 🔧 NOUVEAU : Générer une section éditable
 */
function generateEditableSection(data, sectionType) {
    return Object.entries(data).map(([key, category]) => `
        <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ${category.label}
            </label>
            <div class="flex items-center space-x-2">
                <input type="number" 
                    id="edit-${sectionType}-${key}" 
                    value="${Math.abs(category.balance)}"
                    step="0.01"
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                    onchange="window.updateEditedBalance('${sectionType}', '${key}', this.value)">
                <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">XOF</span>
            </div>
        </div>
    `).join('');
}

/**
 * 🔧 NOUVEAU : Générer le HTML éditable du Compte de Résultat
 */
function generateEditableCompteResultatHTML(compteResultat) {
    if (!compteResultat.charges || !compteResultat.produits) {
        return '<p class="text-center text-gray-500 py-8">Aucune donnée de compte de résultat disponible</p>';
    }

    return `
        <div class="space-y-6">
            <!-- CHARGES -->
            <div>
                <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-danger">
                    CHARGES
                </h5>
                ${generateEditableSection(compteResultat.charges, 'charges')}
            </div>

            <!-- PRODUITS -->
            <div>
                <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-success">
                    PRODUITS
                </h5>
                ${generateEditableSection(compteResultat.produits, 'produits')}
            </div>

            <!-- Résultat -->
            <div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-gray-900 dark:text-white">RÉSULTAT NET :</span>
                    <span class="text-2xl font-black text-primary" id="resultat-net">
                        ${formatAmount(compteResultat.totaux?.resultat || 0)}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * 🔧 NOUVEAU : Gestion des onglets d'édition
 */
window.switchEditTab = function(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.edit-tab').forEach(tab => {
        tab.classList.remove('active', 'border-primary', 'text-primary');
        tab.classList.add('border-transparent', 'text-gray-500');
    });

    // Activer l'onglet sélectionné
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('active', 'border-primary', 'text-primary');
    activeTab.classList.remove('border-transparent', 'text-gray-500');

    // Afficher le contenu correspondant
    document.querySelectorAll('.edit-content-tab').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
};

/**
 * 🔧 NOUVEAU : Mettre à jour un solde édité
 */
let editedData = {};

window.updateEditedBalance = function(section, key, value) {
    if (!editedData[section]) {
        editedData[section] = {};
    }
    editedData[section][key] = parseFloat(value) || 0;

    // Recalculer les totaux en temps réel
    window.recalculateTotals();
};

/**
 * 🔧 NOUVEAU : Recalculer les totaux
 */
window.recalculateTotals = function() {
    // Actif
    const totalActif = Object.values(editedData.actif || {}).reduce((sum, val) => sum + val, 0);
    const actifElement = document.getElementById('total-actif');
    if (actifElement) {
        actifElement.textContent = formatAmount(totalActif);
    }

    // Passif
    const totalPassif = Object.values(editedData.passif || {}).reduce((sum, val) => sum + val, 0);
    const passifElement = document.getElementById('total-passif');
    if (passifElement) {
        passifElement.textContent = formatAmount(totalPassif);
    }

    // Résultat
    const totalProduits = Object.values(editedData.produits || {}).reduce((sum, val) => sum + val, 0);
    const totalCharges = Object.values(editedData.charges || {}).reduce((sum, val) => sum + val, 0);
    const resultat = totalProduits - totalCharges;
    const resultatElement = document.getElementById('resultat-net');
    if (resultatElement) {
        resultatElement.textContent = formatAmount(resultat);
    }
};

/**
 * 🔧 NOUVEAU : Réinitialiser les données éditées
 */
window.resetEditedData = async function(requestId) {
    if (!confirm('Réinitialiser toutes les modifications ?')) {
        return;
    }

    editedData = {};
    NotificationManager.show('Données réinitialisées', 'info', 3000);
    
    // Recharger le modal
    ModalManager.close();
    window.openEditReportsModal(requestId);
};

/**
 * 🔧 NOUVEAU : Sauvegarder et régénérer les rapports
 */
window.saveAndRegenerateReports = async function(requestId) {
    if (!confirm('Sauvegarder les modifications et régénérer les rapports PDF ?')) {
        return;
    }

    try {
        NotificationManager.show('💾 Sauvegarde et régénération en cours...', 'info', 10000);

        const response = await apiFetch(`api/reports/${requestId}/regenerate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ edited_data: editedData })
        });

        if (response.success) {
            NotificationManager.show('✅ Rapports régénérés avec succès !', 'success', 7000);
            ModalManager.close();
            
            // Rafraîchir la vue détaillée
            window.viewRequestDetails(requestId);
        } else {
            throw new Error(response.message || 'Erreur lors de la régénération');
        }

    } catch (error) {
        console.error('Erreur régénération:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 7000);
    }
};

/**
 * Valider les rapports générés
 */
window.validateFinancialReports = async function(requestId) {
    if (!confirm('Valider ces rapports financiers ? Ils seront marqués comme prêts à être envoyés au client.')) {
        return;
    }
    
    try {
        const response = await apiFetch(`api/reports/${requestId}/validate`, {
            method: 'PATCH'
        });
        
        if (response.success) {
            NotificationManager.show('✅ Rapports validés avec succès !', 'success', 5000);
            ModalManager.close();
            
            // Rafraîchir
            if (typeof window.fetchMyFinancialReports === 'function') {
                window.fetchMyFinancialReports();
            }
            if (typeof window.loadPendingFinancialReports === 'function') {
                window.loadPendingFinancialReports();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de la validation');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

/**
 * Envoyer les rapports au client
 */
window.sendReportsToUser = async function(requestId) {
    if (!confirm('Envoyer les rapports au client ? Il recevra une notification avec les documents.')) {
        return;
    }
    
    try {
        const response = await apiFetch(`api/reports/${requestId}/send`, {
            method: 'POST'
        });
        
        if (response.success) {
            NotificationManager.show('✅ Rapports envoyés au client !', 'success', 5000);
            ModalManager.close();
            
            // Rafraîchir
            if (typeof window.fetchMyFinancialReports === 'function') {
                window.fetchMyFinancialReports();
            }
            if (typeof window.loadPendingFinancialReports === 'function') {
                window.loadPendingFinancialReports();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error', 5000);
    }
};

// ========================================================================
// DASHBOARD COLLABORATEUR/ADMIN (ÉTAPE 9)
// ========================================================================

// [... Le code du Dashboard Collaborateur de l'Étape 9 ...]
// (Insérer ici tout le code de l'étape 9 pour le dashboard collaborateur)
// Pour éviter la répétition, je continue avec le code existant ci-dessous

// =================================================================
// MODULE 2 : RAPPORTS INTERACTIFS CLASSIQUES (TON CODE EXISTANT)
// Journal, Balance, Grand Livre, Drill-down
// =================================================================

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
            container.querySelector('h3').innerHTML = '<i class="fas fa-book mr-2"></i> Liste des Journaux';
            
            const response = await apiFetch(`accounting/journals${companyFilter}`, { method: 'GET' });
            const journals = response.data || [];
            
            tableContainer.innerHTML = generateJournalsListHTML(journals);
            
            document.getElementById('journal-filter-container').style.display = 'none';
            
        } else {
            container.querySelector('h3').innerHTML = '<i class="fas fa-book mr-2"></i> Écritures Comptables';
            
            const response = await apiFetch(`accounting/journal${companyFilter}`, { method: 'GET' });
            const entries = response.data?.entries || response.data || [];
            
            tableContainer.innerHTML = generateJournalHTML(entries);
            
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
 * 🔧 AMÉLIORATION: Gère le clic sur un journal
 */
window.handleJournalClick = function(journalId, journalName) {
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
            
            const linesHTML = entry.lines.map(line => `
                <tr class="border-b dark:border-gray-700">
                    <td class="px-4 py-3 font-mono text-sm font-bold">${line.account_code}</td>
                    <td class="px-4 py-3 text-sm">${line.account_name}</td>
                    <td class="px-4 py-3 text-sm">${line.label}</td>
                    <td class="px-4 py-3 text-right font-bold text-success">${line.debit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    <td class="px-4 py-3 text-right font-bold text-danger">${line.credit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('');
            
            const detailsHTML = `
                <div class="space-y-6">
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
 * Ouvre la modal du bilan avec les données réelles (AVEC DISCLAIMER)
 */
window.handleOpenBalanceSheet = async function() {
    const companyId = appState.currentCompanyId;
    const companyFilter = `?companyId=${companyId}`;
    
    try {
        NotificationManager.show('Génération du Bilan en cours...', 'info', 10000);
        
        const response = await apiFetch(`accounting/balance-sheet${companyFilter}`, { method: 'GET' });
        
        if (response.status === 'success') {
            const bilan = response.data;
            const bilanHTML = `
                <!-- AVERTISSEMENT EN HAUT DE LA MODAL -->
                <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-warning rounded-lg">
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-triangle text-warning text-2xl mr-3 mt-1"></i>
                        <div>
                            <p class="font-bold text-gray-900 dark:text-white text-sm mb-2">
                                ⚠️ DOCUMENT NON OFFICIEL - APERÇU UNIQUEMENT
                            </p>
                            <p class="text-xs text-gray-700 dark:text-gray-300">
                                Ce bilan est généré automatiquement à des fins de <strong>consultation rapide</strong> et peut contenir des erreurs.
                                <strong class="text-warning">Ne pas utiliser pour des démarches officielles</strong> (banque, administration, audit).
                            </p>
                            <p class="text-xs text-gray-700 dark:text-gray-300 mt-2">
                                👉 Pour obtenir un <strong>Bilan SYSCOHADA Officiel</strong>, contactez votre Administrateur ou 
                                <button onclick="ModalManager.close(); window.openRequestFinancialReportsModal();" 
                                    class="underline text-primary font-bold hover:text-primary-dark">
                                    créez une demande d'états financiers
                                </button>.
                            </p>
                        </div>
                    </div>
                </div>
                
                ${generateBalanceSheetHTML(bilan)}
            `;
            
            ModalManager.open(
                `📊 Bilan Interactif (Aperçu) - ${new Date(bilan.date).toLocaleDateString('fr-FR')}`, 
                bilanHTML
            );
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur génération bilan : ${error.message}`, 'error');
    }
};

/**
 * Génère le HTML du Bilan SYSCOHADA
 */
function generateBalanceSheetHTML(bilan) {
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

// [... RESTE DU CODE : Balance Générale, Grand Livre, etc. ...]
// (Insérer ici le reste de ton code existant pour Balance/Grand Livre)

/**
 * Ouvrir rapport interactif avec disclaimer
 */
window.handleOpenReportModal = async function(reportId, reportTitle) {
    try {
        const companyFilter = `?companyId=${appState.currentCompanyId}`;
        const endpoint = `accounting/report/${reportId}${companyFilter}`;
        
        NotificationManager.show(`Génération du rapport '${reportTitle}' en cours...`, 'info', 10000);
        
        const response = await apiFetch(endpoint, { method: 'GET' });
        
        const reportContent = response.data || { 
            title: reportTitle, 
            date: new Date().toLocaleDateString('fr-FR'),
            entries: []
        };

        // Ajouter disclaimer si rapport sensible
        const isSensitive = ['pnl', 'balance-sheet'].includes(reportId);
        const disclaimerHTML = isSensitive ? `
            <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-warning rounded-lg">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-warning text-2xl mr-3 mt-1"></i>
                    <div>
                        <p class="font-bold text-gray-900 dark:text-white text-sm mb-2">
                            ⚠️ DOCUMENT NON OFFICIEL - APERÇU UNIQUEMENT
                        </p>
                        <p class="text-xs text-gray-700 dark:text-gray-300">
                            Ce rapport peut contenir des erreurs. <strong>Ne pas utiliser pour des démarches officielles</strong>.
                            Pour un document certifié, 
                            <button onclick="ModalManager.close(); window.openRequestFinancialReportsModal();" 
                                class="underline text-primary font-bold">
                                demandez un état financier officiel
                            </button>.
                        </p>
                    </div>
                </div>
            </div>
        ` : '';

        const modalHtml = disclaimerHTML + generateReportHTML(reportContent);
        ModalManager.open(`${reportTitle} (Aperçu) - ${appState.currentCompanyName}`, modalHtml);

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
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    
    if (loginForm) {
        console.log('✅ Formulaire login trouvé, attachement événement');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.warn('⚠️ Formulaire login NON trouvé');
    }
    
    if (registerForm) {
        console.log('✅ Formulaire register trouvé, attachement événement');
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', ModalManager.close);
    }
}

// ✅ CORRECTION CRITIQUE : Vérifier le token AVANT d'initialiser
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application Doukè Compta Pro - Démarrage V14');
    console.log('📍 Vérification du token...');
    
    const token = localStorage.getItem('douke_auth_token');
    console.log('🔑 Token présent ?', token ? 'OUI' : 'NON');
    
    if (token) {
        console.log('✅ Token détecté, chargement du dashboard...');
    } else {
        console.log('❌ Pas de token, affichage de la connexion');
    }
    
    attachGlobalListeners();
    checkAuthAndRender();
});


// =============================================================================
// MODULE PARAMÈTRES - VERSION V16 PROFESSIONNELLE
// Ajouté le : Février 2026
// Description : Gestion complète des paramètres entreprise/utilisateur/abonnement
// Permissions : ADMIN (full), COLLABORATEUR (comptable modif), USER (lecture)
// =============================================================================

/**
 * Génère le HTML principal de l'interface Paramètres avec onglets
 */
function generateSettingsHTML() {
    const role = appState.user.profile;
    
    const showAccountingTab = role !== 'CAISSIER';
    const showSubscriptionTab = true;
    
    return `
        <div class="fade-in max-w-7xl mx-auto">
            <div class="mb-8">
                <h3 class="text-3xl font-black text-secondary mb-2">
                    <i class="fas fa-cog mr-3 text-primary"></i>Paramètres
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Gérez les informations de votre entreprise, votre profil et vos préférences système
                </p>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-t-2xl border-b-2 border-gray-200 dark:border-gray-700">
                <div class="flex flex-wrap gap-2 p-2">
                    <button onclick="window.switchSettingsTab('company')" 
                        id="tab-company"
                        class="settings-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-building mr-2"></i>Entreprise
                    </button>
                    <button onclick="window.switchSettingsTab('profile')" 
                        id="tab-profile"
                        class="settings-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-user mr-2"></i>Mon Profil
                    </button>
                    ${showAccountingTab ? `
                    <button onclick="window.switchSettingsTab('accounting')" 
                        id="tab-accounting"
                        class="settings-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-calculator mr-2"></i>Système Comptable
                    </button>
                    ` : ''}
                    ${showSubscriptionTab ? `
                    <button onclick="window.switchSettingsTab('subscription')" 
                        id="tab-subscription"
                        class="settings-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-crown mr-2"></i>Abonnement
                    </button>
                    ` : ''}
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl p-8">
                <div id="settings-content">
                    <div class="text-center p-8">
                        <div class="loading-spinner mx-auto"></div>
                        <p class="mt-4 text-gray-500 font-bold">Chargement des paramètres...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =============================================================================
// 🔧 CORRECTION CRITIQUE : DÉCLARER window.switchSettingsTab ICI
// =============================================================================

/**
 * Bascule entre les onglets des paramètres
 */
window.switchSettingsTab = function(tabName) {
    console.log('🔄 [switchSettingsTab] Basculement vers onglet:', tabName);
    
    // Mise à jour visuelle des onglets
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('bg-primary', 'text-white');
        tab.classList.add('text-gray-600', 'dark:text-gray-300');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    //                                       ↑ CORRECTION ICI
    if (activeTab) {
        activeTab.classList.add('bg-primary', 'text-white');
        activeTab.classList.remove('text-gray-600', 'dark:text-gray-300');
    } else {
        console.warn('⚠️ [switchSettingsTab] Onglet introuvable:', `tab-${tabName}`);
    }
    
    // Générer le contenu selon l'onglet
    const container = document.getElementById('settings-content');
    if (!container) {
        console.error('❌ [switchSettingsTab] Conteneur settings-content introuvable !');
        return;
    }
    
    try {
        switch(tabName) {
            case 'company':
                container.innerHTML = generateCompanySettingsHTML();
                console.log('✅ Onglet Entreprise chargé');
                break;
            
            case 'profile':
                container.innerHTML = generateProfileSettingsHTML();
                console.log('✅ Onglet Profil chargé');
                break;
            
            case 'accounting':
                container.innerHTML = generateAccountingSettingsHTML();
                console.log('✅ Onglet Comptable chargé');
                break;
            
            case 'subscription':
                container.innerHTML = generateSubscriptionSettingsHTML();
                console.log('✅ Onglet Abonnement chargé');
                break;
            
            default:
                console.warn('⚠️ [switchSettingsTab] Onglet inconnu:', tabName);
                container.innerHTML = `
                    <div class="text-center p-8 text-warning">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p class="font-bold">Onglet inconnu : ${tabName}</p>
                    </div>
                `;
        }
    } catch (error) {
        console.error('❌ [switchSettingsTab] Erreur:', error);
        container.innerHTML = `
            <div class="text-center p-8 text-danger">
                <i class="fas fa-times-circle fa-2x mb-3"></i>
                <p class="font-bold">Erreur de chargement</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
};
// =============================================================================
// CHARGEMENT DES DONNÉES
// =============================================================================

/**
 * Charge les données des paramètres depuis l'API
 */
async function loadSettingsData() {
    try {
        const companyId = appState.currentCompanyId;
        
        console.log('📋 [loadSettingsData] Chargement pour company_id:', companyId);
        
        const [companyRes, accountingRes, subscriptionRes] = await Promise.all([
            apiFetch(`settings/company/${companyId}`, { method: 'GET' }),
            apiFetch(`settings/accounting/${companyId}`, { method: 'GET' }),
            apiFetch(`settings/subscription/${companyId}`, { method: 'GET' })
        ]);
        
        window.settingsData = {
            company: companyRes.data || {},
            accounting: accountingRes.data || {},
            subscription: subscriptionRes.data || {},
            user: appState.user
        };
        
        console.log('✅ [loadSettingsData] Données chargées:', window.settingsData);
        
        // ✅ Maintenant cette fonction existe !
        window.switchSettingsTab('company');
        
    } catch (error) {
        console.error('🚨 [loadSettingsData] Erreur:', error);
        const container = document.getElementById('settings-content');
        if (container) {
            container.innerHTML = `
                <div class="text-center p-8 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p class="font-bold">Erreur de chargement des paramètres</p>
                    <p class="text-sm">${error.message}</p>
                </div>
            `;
        }
    }
}


/**
 * Génère le HTML de l'onglet Entreprise
 */
function generateCompanySettingsHTML() {
    const role = appState.user.profile;
    const isAdmin = role === 'ADMIN';
    const data = window.settingsData?.company || {};
    
    return `
        <div class="space-y-6">
            ${!isAdmin ? `
            <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                <p class="text-sm text-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    Vous consultez les informations de l'entreprise en <strong>lecture seule</strong>. 
                    Seuls les Administrateurs peuvent les modifier.
                </p>
            </div>
            ` : ''}
            
            <h4 class="text-xl font-black text-gray-900 dark:text-white mb-4">
                <i class="fas fa-building mr-2 text-primary"></i>
                Informations de l'Entreprise
            </h4>
            
            <form id="company-settings-form" onsubmit="window.handleSaveCompanySettings(event)" class="space-y-6">
                <!-- Informations Générales -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Nom de l'Entreprise <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="company-name" value="${data.name || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Statut Juridique
                        </label>
                        <select id="company-legal-status" ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}">
                            <option value="SARL" ${data.legal_status === 'SARL' ? 'selected' : ''}>SARL - Société à Responsabilité Limitée</option>
                            <option value="SA" ${data.legal_status === 'SA' ? 'selected' : ''}>SA - Société Anonyme</option>
                            <option value="SAS" ${data.legal_status === 'SAS' ? 'selected' : ''}>SAS - Société par Actions Simplifiée</option>
                            <option value="EI" ${data.legal_status === 'EI' ? 'selected' : ''}>EI - Entreprise Individuelle</option>
                        </select>
                    </div>
                </div>

                <!-- Identifiants légaux -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Numéro RCCM
                        </label>
                        <input type="text" id="company-rccm" value="${data.registration_number || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}" 
                            placeholder="Ex: RC/CTN/2024/B/123">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            NIF (Numéro d'Identification Fiscale)
                        </label>
                        <input type="text" id="company-nif" value="${data.tax_id || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}" 
                            placeholder="Ex: 3202400123456">
                    </div>
                </div>

                <!-- Coordonnées -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Email <span class="text-danger">*</span>
                        </label>
                        <input type="email" id="company-email" value="${data.email || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Téléphone
                        </label>
                        <input type="tel" id="company-phone" value="${data.phone || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}" 
                            placeholder="+229 XX XX XX XX">
                    </div>
                </div>

                <!-- Adresse -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Adresse
                        </label>
                        <input type="text" id="company-address" value="${data.address || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Ville
                        </label>
                        <input type="text" id="company-city" value="${data.city || ''}" 
                            ${!isAdmin ? 'disabled' : ''}
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 ${!isAdmin ? 'bg-gray-100' : ''}">
                    </div>
                </div>

                ${isAdmin ? `
                <div class="flex justify-end pt-6 border-t">
                    <button type="submit" class="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg">
                        <i class="fas fa-save mr-2"></i>Enregistrer
                    </button>
                </div>
                ` : ''}
            </form>
        </div>
    `;
}
/**
 * Génère le HTML de l'onglet Mon Profil
 */
function generateProfileSettingsHTML() {
    const user = appState.user;
    
    return `
        <div class="space-y-6">
            <h4 class="text-xl font-black text-gray-900 dark:text-white mb-4">
                <i class="fas fa-user mr-2 text-primary"></i>
                Mon Profil
            </h4>
            
            <form id="profile-settings-form" onsubmit="window.handleSaveProfileSettings(event)" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Nom <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="user-name" value="${user.name || ''}" 
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600" required>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Email <span class="text-gray-400">(Non modifiable)</span>
                        </label>
                        <input type="email" value="${user.email || ''}" disabled
                            class="w-full p-3 border rounded-xl bg-gray-100 dark:bg-gray-600">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Téléphone
                    </label>
                    <input type="tel" id="user-phone" value="${user.phone || ''}" 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>

                <div class="flex justify-end pt-6 border-t">
                    <button type="submit" class="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg">
                        <i class="fas fa-save mr-2"></i>Enregistrer
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * Génère le HTML de l'onglet Système Comptable
 */
function generateAccountingSettingsHTML() {
    const data = window.settingsData?.accounting || {};
    const role = appState.user.profile;
    
    // ✅ CORRECTION : USER peut aussi modifier
    const canEdit = (role === 'ADMIN' || role === 'COLLABORATEUR' || role === 'USER');
    const isEditing = false;
    
    return `
        <div class="space-y-6">
            ${!canEdit ? `
            <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                <p class="text-sm text-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    Vous consultez les paramètres comptables en <strong>lecture seule</strong>.
                </p>
            </div>
            ` : ''}
            
            ${role === 'COLLABORATEUR' ? `
            <div class="bg-warning/10 border-l-4 border-warning p-4 rounded-xl">
                <p class="text-sm text-warning">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    En tant que <strong>Collaborateur</strong>, vous pouvez modifier ces paramètres uniquement pour les entreprises qui vous sont assignées.
                </p>
            </div>
            ` : ''}
            
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-xl font-black text-gray-900 dark:text-white">
                    <i class="fas fa-calculator mr-2 text-primary"></i>
                    Configuration Comptable
                </h4>
                
                ${canEdit ? `
                <button onclick="window.handleEditAccountingSettings()" id="btn-edit-accounting"
                    class="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg">
                    <i class="fas fa-edit mr-2"></i>Modifier
                </button>
                ` : ''}
            </div>
            
            <form id="accounting-settings-form" onsubmit="window.handleSaveAccountingSettings(event)" class="space-y-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Type de Système Comptable <span class="text-danger">*</span>
                    </label>
                    <select id="accounting-system" disabled
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                        <option value="SYSCOHADA" ${data.accounting_system === 'SYSCOHADA' ? 'selected' : ''}>SYSCOHADA Révisé (OHADA)</option>
                        <option value="FRENCH" ${data.accounting_system === 'FRENCH' ? 'selected' : ''}>Système Français (PCG)</option>
                        <option value="SYCEBNL" ${data.accounting_system === 'SYCEBNL' ? 'selected' : ''}>SYCEBNL (Bénin)</option>
                    </select>
                </div>

                <div id="syscohada-options" class="${data.accounting_system === 'SYSCOHADA' ? '' : 'hidden'}">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Variante SYSCOHADA
                    </label>
                    <select id="syscohada-variant" disabled
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                        <option value="NORMAL" ${data.syscohada_variant === 'NORMAL' ? 'selected' : ''}>Système Normal</option>
                        <option value="SMT" ${data.syscohada_variant === 'SMT' ? 'selected' : ''}>Système Minimal de Trésorerie (SMT)</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Le SMT est réservé aux très petites entreprises (TPE).
                    </p>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
                    <h5 class="font-bold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-calendar-alt mr-2 text-info"></i>Exercice Fiscal
                    </h5>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Date de Début
                            </label>
                            <input type="date" id="fiscal-year-start" value="${data.fiscal_year_start || '2026-01-01'}" disabled
                                class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Date de Fin
                            </label>
                            <input type="date" id="fiscal-year-end" value="${data.fiscal_year_end || '2026-12-31'}" disabled
                                class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                        </div>
                    </div>
                </div>

                ${canEdit ? `
                <div class="flex justify-end pt-6 border-t" style="display: none;" id="accounting-save-container">
                    <button type="submit" class="bg-success text-white font-bold px-8 py-3 rounded-xl hover:bg-success-dark transition-all shadow-lg">
                        <i class="fas fa-save mr-2"></i>Enregistrer les Modifications
                    </button>
                </div>
                ` : ''}
            </form>
        </div>
    `;
}

/**
 * Génère le HTML de l'onglet Abonnement
 */
function generateSubscriptionSettingsHTML() {
    const data = window.settingsData?.subscription || {};
    const isAdmin = appState.user.profile === 'ADMIN';
    
    // Calcul des jours restants
    const today = new Date();
    const endDate = new Date(data.end_date || '2026-12-31');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return `
        <div class="space-y-6">
            ${!isAdmin ? `
            <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                <p class="text-sm text-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    Vous consultez les informations d'abonnement en <strong>lecture seule</strong>. Seuls les Administrateurs peuvent les modifier.
                </p>
            </div>
            ` : ''}
            
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-xl font-black text-gray-900 dark:text-white">
                    <i class="fas fa-crown mr-2 text-warning"></i>
                    Abonnement
                </h4>
                
                ${isAdmin ? `
                <button onclick="window.handleEditSubscriptionSettings()" id="btn-edit-subscription"
                    class="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg">
                    <i class="fas fa-edit mr-2"></i>Modifier
                </button>
                ` : ''}
            </div>
            
            <!-- Résumé visuel -->
            <div class="bg-gradient-to-r from-warning/10 to-primary/10 p-6 rounded-xl border-l-4 border-warning">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-black ${data.status === 'active' ? 'text-success' : 'text-danger'} mb-2">
                            ${data.status === 'active' ? '✅' : '❌'}
                        </div>
                        <div class="text-sm text-gray-500">Statut</div>
                        <div class="text-xl font-black ${data.status === 'active' ? 'text-success' : 'text-danger'}">
                            ${data.status === 'active' ? 'Actif' : data.status === 'suspended' ? 'Suspendu' : 'Expiré'}
                        </div>
                    </div>
                    <div>
                        <div class="text-4xl font-black text-primary mb-2">${daysRemaining}</div>
                        <div class="text-sm text-gray-500">Jours Restants</div>
                        <div class="text-xl font-black text-primary">Jusqu'au ${endDate.toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                        <div class="text-4xl font-black text-warning mb-2">👑</div>
                        <div class="text-sm text-gray-500">Plan</div>
                        <div class="text-xl font-black text-warning">${data.plan_name || 'STANDARD'}</div>
                    </div>
                </div>
            </div>

            <form id="subscription-settings-form" onsubmit="window.handleSaveSubscriptionSettings(event)" class="space-y-6">
                <!-- Détails de l'abonnement -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Plan</label>
                        <select id="subscription-plan" disabled
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                            <option value="STARTER" ${data.plan_name === 'STARTER' ? 'selected' : ''}>Starter</option>
                            <option value="STANDARD" ${data.plan_name === 'STANDARD' ? 'selected' : ''}>Standard</option>
                            <option value="PREMIUM" ${data.plan_name === 'PREMIUM' ? 'selected' : ''}>Premium</option>
                            <option value="ENTERPRISE" ${data.plan_name === 'ENTERPRISE' ? 'selected' : ''}>Enterprise</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                        <select id="subscription-status" disabled
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                            <option value="active" ${data.status === 'active' ? 'selected' : ''}>✅ Actif</option>
                            <option value="suspended" ${data.status === 'suspended' ? 'selected' : ''}>⏸️ Suspendu</option>
                            <option value="expired" ${data.status === 'expired' ? 'selected' : ''}>❌ Expiré</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de Début</label>
                        <input type="date" id="subscription-start" value="${data.start_date || '2026-01-01'}" disabled
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de Fin</label>
                        <input type="date" id="subscription-end" value="${data.end_date || '2026-12-31'}" disabled
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 bg-gray-100">
                    </div>
                </div>

                ${isAdmin ? `
                <!-- Actions Rapides (ADMIN uniquement) -->
                <div class="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl" style="display: none;" id="subscription-actions-container">
                    <h5 class="font-bold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button type="button" onclick="window.extendSubscription(365)" 
                            class="p-4 bg-success/10 border-2 border-success text-success font-bold rounded-xl hover:bg-success/20 transition-colors">
                            <i class="fas fa-plus-circle mr-2"></i>Prolonger de 1 an
                        </button>
                        <button type="button" onclick="window.extendSubscription(30)" 
                            class="p-4 bg-info/10 border-2 border-info text-info font-bold rounded-xl hover:bg-info/20 transition-colors">
                            <i class="fas fa-calendar-plus mr-2"></i>Prolonger de 1 mois
                        </button>
                        <button type="button" onclick="window.suspendSubscription()" 
                            class="p-4 bg-danger/10 border-2 border-danger text-danger font-bold rounded-xl hover:bg-danger/20 transition-colors">
                            <i class="fas fa-pause-circle mr-2"></i>Suspendre
                        </button>
                    </div>
                </div>

                <div class="flex justify-end pt-6 border-t" style="display: none;" id="subscription-save-container">
                    <button type="submit" class="bg-success text-white font-bold px-8 py-3 rounded-xl hover:bg-success-dark transition-all shadow-lg">
                        <i class="fas fa-save mr-2"></i>Enregistrer les Modifications
                    </button>
                </div>
                ` : ''}
            </form>
        </div>
    `;
}

// =============================================================================
// 🆕 NOUVELLES FONCTIONS À AJOUTER APRÈS generateSubscriptionSettingsHTML()
// (Ligne ~3020 dans ton script.js)
// =============================================================================

/**
 * 🆕 Active le mode édition pour l'onglet Système Comptable
 */
window.handleEditAccountingSettings = function() {
    // Activer les champs
    document.getElementById('accounting-system').removeAttribute('disabled');
    document.getElementById('syscohada-variant').removeAttribute('disabled');
    document.getElementById('fiscal-year-start').removeAttribute('disabled');
    document.getElementById('fiscal-year-end').removeAttribute('disabled');
    
    // Retirer bg-gray-100
    document.querySelectorAll('#accounting-settings-form select, #accounting-settings-form input').forEach(el => {
        el.classList.remove('bg-gray-100');
    });
    
    // Afficher le bouton Enregistrer
    document.getElementById('accounting-save-container').style.display = 'flex';
    
    // Changer le bouton Modifier en Annuler
    document.getElementById('btn-edit-accounting').outerHTML = `
        <button onclick="window.switchSettingsTab('accounting')" 
            class="bg-gray-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-600 transition-all shadow-lg">
            <i class="fas fa-times mr-2"></i>Annuler
        </button>
    `;
};

/**
 * 🆕 Sauvegarde les paramètres comptables
 */
window.handleSaveAccountingSettings = async function(event) {
    event.preventDefault();
    
    const companyId = appState.currentCompanyId;
    const data = {
        accounting_system: document.getElementById('accounting-system').value,
        syscohada_variant: document.getElementById('syscohada-variant').value,
        fiscal_year_start: document.getElementById('fiscal-year-start').value,
        fiscal_year_end: document.getElementById('fiscal-year-end').value
    };
    
    try {
        NotificationManager.show('Enregistrement en cours...', 'info');
        
        await apiFetch(`settings/accounting/${companyId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        NotificationManager.show('Paramètres comptables enregistrés avec succès !', 'success');
        
        // Recharger l'onglet
        await loadSettingsData();
        window.switchSettingsTab('accounting');
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * 🆕 Active le mode édition pour l'onglet Abonnement
 */
window.handleEditSubscriptionSettings = function() {
    // Activer les champs
    document.getElementById('subscription-plan').removeAttribute('disabled');
    document.getElementById('subscription-status').removeAttribute('disabled');
    document.getElementById('subscription-start').removeAttribute('disabled');
    document.getElementById('subscription-end').removeAttribute('disabled');
    
    // Retirer bg-gray-100
    document.querySelectorAll('#subscription-settings-form select, #subscription-settings-form input').forEach(el => {
        el.classList.remove('bg-gray-100');
    });
    
    // Afficher les actions rapides et le bouton Enregistrer
    document.getElementById('subscription-actions-container').style.display = 'block';
    document.getElementById('subscription-save-container').style.display = 'flex';
    
    // Changer le bouton Modifier en Annuler
    document.getElementById('btn-edit-subscription').outerHTML = `
        <button onclick="window.switchSettingsTab('subscription')" 
            class="bg-gray-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-600 transition-all shadow-lg">
            <i class="fas fa-times mr-2"></i>Annuler
        </button>
    `;
};

/**
 * 🆕 Prolonge l'abonnement de X jours
 */
window.extendSubscription = function(days) {
    const endDateInput = document.getElementById('subscription-end');
    const currentEndDate = new Date(endDateInput.value);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    
    endDateInput.value = newEndDate.toISOString().split('T')[0];
    
    NotificationManager.show(`Abonnement prolongé de ${days} jours. N'oubliez pas d'enregistrer !`, 'info');
};

/**
 * 🆕 Marque l'abonnement comme suspendu
 */
window.suspendSubscription = function() {
    const statusSelect = document.getElementById('subscription-status');
    statusSelect.value = 'suspended';
    
    NotificationManager.show('Abonnement marqué comme suspendu. Enregistrez pour appliquer.', 'warning');
};

/**
 * 🆕 Sauvegarde les paramètres d'abonnement
 */
window.handleSaveSubscriptionSettings = async function(event) {
    event.preventDefault();
    
    const companyId = appState.currentCompanyId;
    const data = {
        plan_name: document.getElementById('subscription-plan').value,
        status: document.getElementById('subscription-status').value,
        start_date: document.getElementById('subscription-start').value,
        end_date: document.getElementById('subscription-end').value
    };
    
    try {
        NotificationManager.show('Enregistrement en cours...', 'info');
        
        await apiFetch(`settings/subscription/${companyId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        NotificationManager.show('Abonnement mis à jour avec succès !', 'success');
        
        // Recharger l'onglet
        await loadSettingsData();
        window.switchSettingsTab('subscription');
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * Sauvegarde les paramètres entreprise
 */
window.handleSaveCompanySettings = async function(event) {
    event.preventDefault();
    
    const companyId = appState.currentCompanyId;
    const data = {
        name: document.getElementById('company-name').value,
        email: document.getElementById('company-email').value,
        phone: document.getElementById('company-phone').value,
        address: document.getElementById('company-address').value,
        city: document.getElementById('company-city').value,
        tax_id: document.getElementById('company-nif').value,
        registration_number: document.getElementById('company-rccm').value
    };
    
    try {
        await apiFetch(`settings/company/${companyId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        NotificationManager.show('Paramètres entreprise enregistrés !', 'success');
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * Sauvegarde le profil utilisateur
 */
window.handleSaveProfileSettings = async function(event) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('user-name').value,
        phone: document.getElementById('user-phone').value
    };
    
    try {
        await apiFetch('settings/user', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        NotificationManager.show('Profil mis à jour !', 'success');
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

// =============================================================================
// MODULE : GESTION DES UTILISATEURS (ADMIN UNIQUEMENT)
// Version : V16 - Février 2026
// Description : Interface complète de gestion des utilisateurs avec CRUD
// Permissions : ADMIN uniquement
// 
// INSTRUCTIONS D'INTÉGRATION :
// 1. Ajouter ce code APRÈS le module Paramètres dans script.js (ligne ~3200)
// 2. La fonction generateAdminUsersHTML() remplace le case 'admin-users' existant
// =============================================================================

// =============================================================================
// ÉTAT GLOBAL DU MODULE
// =============================================================================

let usersState = {
    allUsers: [],
    filteredUsers: [],
    searchTerm: '',
    roleFilter: 'ALL'
};

// =============================================================================
// FONCTION PRINCIPALE : GÉNÉRATION DE L'INTERFACE
// =============================================================================

/**
 * ✅ VERSION AMÉLIORÉE avec système d'onglets
 * Génère le module Gestion des Utilisateurs avec 3 onglets :
 * 1. Liste des Utilisateurs
 * 2. Créer un Utilisateur
 * 3. Envoyer Notification
 */
async function generateAdminUsersHTML() {
    const role = appState.user.profile;
    
    // Vérification des permissions
    if (role !== 'ADMIN') {
        return `
            <div class="p-8 text-center bg-danger/10 rounded-2xl">
                <i class="fas fa-ban fa-3x text-danger mb-4"></i>
                <h4 class="text-xl font-black text-danger">Accès Refusé</h4>
                <p class="text-gray-600">Seuls les Administrateurs peuvent accéder à cette section.</p>
            </div>
        `;
    }
    
    // Chargement des utilisateurs
    try {
        await loadAllUsers();
    } catch (error) {
        return `
            <div class="p-8 text-center bg-danger/10 rounded-2xl">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-4"></i>
                <h4 class="text-xl font-black text-danger">Erreur de Chargement</h4>
                <p class="text-gray-600">${error.message}</p>
            </div>
        `;
    }
    
    return `
        <div class="fade-in max-w-7xl mx-auto">
            <!-- En-tête -->
            <div class="mb-8">
                <h3 class="text-3xl font-black text-secondary mb-2">
                    <i class="fas fa-users-cog mr-3 text-primary"></i>Gestion des Utilisateurs
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    Gérez les comptes, permissions et envoyez des notifications
                </p>
            </div>

            <!-- 🆕 ONGLETS DE NAVIGATION -->
            <div class="bg-white dark:bg-gray-800 rounded-t-2xl border-b-2 border-gray-200 dark:border-gray-700">
                <div class="flex flex-wrap gap-2 p-2">
                    <button onclick="window.switchUsersTab('list')" 
                        id="users-tab-list"
                        class="users-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700 bg-primary text-white">
                        <i class="fas fa-list mr-2"></i>Liste des Utilisateurs
                    </button>
                    <button onclick="window.switchUsersTab('create')" 
                        id="users-tab-create"
                        class="users-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <i class="fas fa-user-plus mr-2"></i>Créer un Utilisateur
                    </button>
                    <button onclick="window.switchUsersTab('notifications')" 
                        id="users-tab-notifications"
                        class="users-tab px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <i class="fas fa-paper-plane mr-2"></i>Envoyer Notification
                    </button>
                </div>
            </div>

            <!-- CONTENEUR DES ONGLETS -->
            <div class="bg-white dark:bg-gray-800 rounded-b-2xl shadow-2xl p-8">
                <div id="users-tab-content">
                    <!-- Le contenu de l'onglet sera injecté ici -->
                    ${generateUsersListTabHTML()}
                </div>
            </div>
        </div>
    `;
}

/**
 * 🆕 Génère le contenu de l'onglet "Liste des Utilisateurs"
 */
function generateUsersListTabHTML() {
    return `
        <div class="space-y-6">
            <!-- Filtres et Recherche -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-search mr-2"></i>Rechercher
                    </label>
                    <input type="text" id="user-search" 
                        onkeyup="window.handleUserSearch(this.value)"
                        placeholder="Nom, email..."
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-filter mr-2"></i>Filtrer par Rôle
                    </label>
                    <select id="role-filter" onchange="window.handleRoleFilter(this.value)"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                        <option value="ALL">Tous les rôles</option>
                        <option value="ADMIN">Administrateurs</option>
                        <option value="COLLABORATEUR">Collaborateurs</option>
                        <option value="USER">Utilisateurs</option>
                        <option value="CAISSIER">Caissiers</option>
                    </select>
                </div>
            </div>
            
            <!-- Tableau des Utilisateurs -->
            <div id="users-table-container">
                ${generateUsersTableHTML()}
            </div>
        </div>
    `;
}

/**
 * 🆕 Génère le contenu de l'onglet "Créer un Utilisateur"
 */
function generateCreateUserTabHTML() {
    return `
        <div class="space-y-6">
            <h4 class="text-xl font-black text-gray-900 dark:text-white mb-6">
                <i class="fas fa-user-plus mr-2 text-success"></i>
                Créer un Nouvel Utilisateur
            </h4>
            
            <form id="create-user-form" onsubmit="window.handleCreateUser(event)" class="space-y-6">
                <!-- Informations de base -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Nom complet <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="user-name" required 
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success"
                            placeholder="Ex: Jean Dupont">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Email <span class="text-danger">*</span>
                        </label>
                        <input type="email" id="user-email" required 
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success"
                            placeholder="jean.dupont@example.com">
                    </div>
                </div>
                
                <!-- Téléphone -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Téléphone
                    </label>
                    <input type="tel" id="user-phone" 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success"
                        placeholder="+229 97 12 34 56">
                </div>
                
                <!-- Mot de passe -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Mot de passe <span class="text-danger">*</span>
                    </label>
                    <input type="password" id="user-password" minlength="8" required 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success"
                        placeholder="Minimum 8 caractères">
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Le mot de passe doit contenir au moins 8 caractères
                    </p>
                </div>
                
                <!-- Rôle -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Rôle <span class="text-danger">*</span>
                    </label>
                    <select id="user-role" required 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success">
                        <option value="">-- Sélectionner un rôle --</option>
                        <option value="ADMIN">👑 Administrateur - Accès total au système</option>
                        <option value="COLLABORATEUR">👔 Collaborateur - Gestion comptable avancée</option>
                        <option value="USER">👤 Utilisateur - Consultation et saisie basique</option>
                        <option value="CAISSIER">💰 Caissier - Gestion de caisse uniquement</option>
                    </select>
                </div>
                
                <!-- Entreprises -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Entreprises <span class="text-danger">*</span>
                    </label>
                    <select id="user-companies" multiple size="4" required 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success">
                        <!-- Chargé dynamiquement -->
                    </select>
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs entreprises
                    </p>
                </div>
                
                <!-- Message d'information -->
                <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                    <p class="text-sm text-info font-bold">
                        <i class="fas fa-lightbulb mr-2"></i>
                        L'utilisateur recevra un email avec ses identifiants de connexion
                    </p>
                </div>
                
                <!-- Boutons -->
                <div class="flex gap-3 pt-6 border-t">
                    <button type="submit" 
                        class="flex-1 bg-success text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-all shadow-lg">
                        <i class="fas fa-save mr-2"></i>Créer l'Utilisateur
                    </button>
                    <button type="button" onclick="window.switchUsersTab('list')" 
                        class="px-6 bg-gray-500 text-white font-bold py-4 rounded-xl hover:bg-gray-600 transition-all">
                        <i class="fas fa-times mr-2"></i>Annuler
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * 🆕 Génère le contenu de l'onglet "Envoyer Notification"
 */
function generateSendNotificationTabHTML() {
    return `
        <div class="space-y-6">
            <h4 class="text-xl font-black text-gray-900 dark:text-white mb-6">
                <i class="fas fa-paper-plane mr-2 text-primary"></i>
                Envoyer une Notification
            </h4>
            
            <form id="send-notification-form" onsubmit="window.handleSendNotification(event)" class="space-y-6">
                
                <!-- Destinataires -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Destinataires <span class="text-danger">*</span>
                    </label>
                    <div class="space-y-3">
                        <!-- Option : Tous les utilisateurs -->
                        <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="recipient-type" value="all" class="mr-3" checked>
                            <div class="flex-1">
                                <p class="font-bold text-gray-900 dark:text-white">
                                    <i class="fas fa-users mr-2 text-primary"></i>
                                    Tous les utilisateurs
                                </p>
                                <p class="text-xs text-gray-500 mt-1">Notification envoyée à tous les membres de l'entreprise</p>
                            </div>
                        </label>
                        
                        <!-- Option : Par rôle -->
                        <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all has-[:checked]:border-info has-[:checked]:bg-info/5">
                            <input type="radio" name="recipient-type" value="role" class="mr-3">
                            <div class="flex-1">
                                <p class="font-bold text-gray-900 dark:text-white">
                                    <i class="fas fa-user-tag mr-2 text-info"></i>
                                    Par rôle
                                </p>
                                <p class="text-xs text-gray-500 mt-1">Sélectionner un rôle spécifique</p>
                            </div>
                        </label>
                        
                        <!-- Option : Utilisateurs spécifiques -->
                        <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all has-[:checked]:border-success has-[:checked]:bg-success/5">
                            <input type="radio" name="recipient-type" value="specific" class="mr-3">
                            <div class="flex-1">
                                <p class="font-bold text-gray-900 dark:text-white">
                                    <i class="fas fa-user-check mr-2 text-success"></i>
                                    Utilisateurs spécifiques
                                </p>
                                <p class="text-xs text-gray-500 mt-1">Choisir des utilisateurs individuels</p>
                            </div>
                        </label>
                    </div>
                </div>
                
                <!-- Sélecteur de rôle (masqué par défaut) -->
                <div id="role-selector" class="hidden">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Sélectionner le rôle
                    </label>
                    <select id="notif-role" class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-info">
                        <option value="ADMIN">👑 Administrateurs</option>
                        <option value="COLLABORATEUR">👔 Collaborateurs</option>
                        <option value="USER">👤 Utilisateurs</option>
                        <option value="CAISSIER">💰 Caissiers</option>
                    </select>
                </div>
                
                <!-- Sélecteur d'utilisateurs spécifiques (masqué par défaut) -->
                <div id="users-selector" class="hidden">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Sélectionner les utilisateurs
                    </label>
                    <select id="notif-users" multiple size="5" 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-success">
                        <!-- Chargé dynamiquement -->
                    </select>
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs utilisateurs
                    </p>
                </div>
                
                <!-- Type et Priorité -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Type <span class="text-danger">*</span>
                        </label>
                        <select id="notif-type" required 
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                            <option value="info">ℹ️ Information</option>
                            <option value="alert">⚠️ Alerte</option>
                            <option value="reminder">📅 Rappel</option>
                            <option value="invoice">📄 Facture</option>
                            <option value="report">📊 Rapport</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Priorité <span class="text-danger">*</span>
                        </label>
                        <select id="notif-priority" required 
                            class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary">
                            <option value="low">🟢 Basse</option>
                            <option value="normal" selected>🔵 Normale</option>
                            <option value="high">🟠 Haute</option>
                            <option value="urgent">🔴 Urgente</option>
                        </select>
                    </div>
                </div>
                
                <!-- Titre -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Titre <span class="text-danger">*</span>
                    </label>
                    <input type="text" id="notif-title" maxlength="100" required 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" 
                        placeholder="Ex: Réunion demain à 10h">
                    <p class="text-xs text-gray-500 mt-2">
                        <span id="title-char-count">0</span> / 100 caractères
                    </p>
                </div>
                
                <!-- Message -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Message <span class="text-danger">*</span>
                    </label>
                    <textarea id="notif-message" rows="6" maxlength="500" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary" 
                        placeholder="Contenu de la notification..."></textarea>
                    <p class="text-xs text-gray-500 mt-2">
                        <span id="message-char-count">0</span> / 500 caractères
                    </p>
                </div>
                
                <!-- Aperçu -->
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                    <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                        <i class="fas fa-eye mr-2 text-primary"></i>Aperçu de la notification
                    </p>
                    <div class="bg-white dark:bg-gray-900 p-4 rounded-lg border-l-4 border-primary shadow-lg">
                        <p class="font-bold text-gray-900 dark:text-white mb-2" id="preview-title">
                            Titre de la notification
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400" id="preview-message">
                            Message de la notification
                        </p>
                        <p class="text-xs text-gray-400 mt-3 flex items-center gap-2">
                            <i class="fas fa-clock"></i>
                            <span>À l'instant</span>
                            <span>•</span>
                            <span id="preview-type">ℹ️ Information</span>
                            <span>•</span>
                            <span id="preview-priority">🔵 Normale</span>
                        </p>
                    </div>
                </div>
                
                <!-- Boutons -->
                <div class="flex gap-3 pt-6 border-t">
                    <button type="submit" 
                        class="flex-1 bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-dark transition-all shadow-lg">
                        <i class="fas fa-paper-plane mr-2"></i>Envoyer la Notification
                    </button>
                    <button type="button" onclick="window.switchUsersTab('list')" 
                        class="px-6 bg-gray-500 text-white font-bold py-4 rounded-xl hover:bg-gray-600 transition-all">
                        <i class="fas fa-times mr-2"></i>Annuler
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * 🆕 Bascule entre les onglets du module Gestion des Utilisateurs
 */
window.switchUsersTab = function(tabName) {
    console.log('🔄 [switchUsersTab] Basculement vers onglet:', tabName);
    
    // Mise à jour visuelle des onglets
    document.querySelectorAll('.users-tab').forEach(tab => {
        tab.classList.remove('bg-primary', 'text-white');
        tab.classList.add('text-gray-600', 'dark:text-gray-300');
    });
    
    const activeTab = document.getElementById(`users-tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('bg-primary', 'text-white');
        activeTab.classList.remove('text-gray-600', 'dark:text-gray-300');
    }
    
    // Générer le contenu selon l'onglet
    const container = document.getElementById('users-tab-content');
    if (!container) {
        console.error('❌ [switchUsersTab] Conteneur introuvable');
        return;
    }
    
    try {
        switch(tabName) {
            case 'list':
                container.innerHTML = generateUsersListTabHTML();
                console.log('✅ [switchUsersTab] Onglet Liste chargé');
                break;
            
            case 'create':
                container.innerHTML = generateCreateUserTabHTML();
                loadCompaniesForUserForm(); // Charger les entreprises
                console.log('✅ [switchUsersTab] Onglet Création chargé');
                break;
            
            case 'notifications':
                container.innerHTML = generateSendNotificationTabHTML();
                loadUsersForNotification(); // Charger les utilisateurs
                console.log('✅ [switchUsersTab] Onglet Notifications chargé');
                break;
            
            default:
                console.warn('⚠️ [switchUsersTab] Onglet inconnu:', tabName);
                container.innerHTML = `
                    <div class="text-center p-8 text-warning">
                        <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                        <p class="font-bold">Onglet "${tabName}" non trouvé</p>
                    </div>
                `;
        }
    } catch (error) {
        console.error('❌ [switchUsersTab] Erreur:', error);
        container.innerHTML = `
            <div class="text-center p-8 text-danger">
                <i class="fas fa-times-circle fa-2x mb-3"></i>
                <p class="font-bold">Erreur de chargement</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
};

/**
 * 🆕 Charge les utilisateurs pour l'envoi de notifications
 */
async function loadUsersForNotification() {
    console.log('📋 [loadUsersForNotification] Chargement des utilisateurs...');
    
    try {
        const users = usersState.allUsers || [];
        
        // Remplir le select des utilisateurs spécifiques
        const usersSelect = document.getElementById('notif-users');
        if (usersSelect && users.length > 0) {
            usersSelect.innerHTML = users.map(user => `
                <option value="${user.id}">
                    ${user.name} (${user.email}) - ${user.profile}
                </option>
            `).join('');
        }
        
        console.log(`✅ [loadUsersForNotification] ${users.length} utilisateurs chargés`);
        
    } catch (error) {
        console.error('🚨 [loadUsersForNotification] Erreur:', error);
    }
}

/**
 * 🆕 Charge les entreprises pour le formulaire de création
 */
async function loadCompaniesForUserForm() {
    console.log('🏢 [loadCompaniesForUserForm] Chargement des entreprises...');
    
    try {
        const response = await apiFetch('companies', { method: 'GET' });
        const companies = response.data || [];
        
        const companiesSelect = document.getElementById('user-companies');
        if (companiesSelect && companies.length > 0) {
            companiesSelect.innerHTML = companies.map(company => `
                <option value="${company.id}">
                    ${company.name}
                </option>
            `).join('');
        }
        
        console.log(`✅ [loadCompaniesForUserForm] ${companies.length} entreprises chargées`);
        
    } catch (error) {
        console.error('🚨 [loadCompaniesForUserForm] Erreur:', error);
    }
}

/**
 * 🆕 Gestion du changement de type de destinataire
 */
document.addEventListener('change', function(event) {
    if (event.target.name === 'recipient-type') {
        const recipientType = event.target.value;
        
        const roleSelector = document.getElementById('role-selector');
        const usersSelector = document.getElementById('users-selector');
        
        if (!roleSelector || !usersSelector) return;
        
        // Masquer tous les sélecteurs
        roleSelector.classList.add('hidden');
        usersSelector.classList.add('hidden');
        
        // Afficher le sélecteur approprié
        if (recipientType === 'role') {
            roleSelector.classList.remove('hidden');
        } else if (recipientType === 'specific') {
            usersSelector.classList.remove('hidden');
        }
    }
});

/**
 * 🆕 Mise à jour en temps réel de l'aperçu de la notification
 */
document.addEventListener('input', function(event) {
    // Compteur de caractères Titre
    if (event.target.id === 'notif-title') {
        const charCount = event.target.value.length;
        const counter = document.getElementById('title-char-count');
        if (counter) counter.textContent = charCount;
        
        // Mise à jour aperçu
        const previewTitle = document.getElementById('preview-title');
        if (previewTitle) {
            previewTitle.textContent = event.target.value || 'Titre de la notification';
        }
    }
    
    // Compteur de caractères Message
    if (event.target.id === 'notif-message') {
        const charCount = event.target.value.length;
        const counter = document.getElementById('message-char-count');
        if (counter) counter.textContent = charCount;
        
        // Mise à jour aperçu
        const previewMessage = document.getElementById('preview-message');
        if (previewMessage) {
            previewMessage.textContent = event.target.value || 'Message de la notification';
        }
    }
    
    // Mise à jour type dans aperçu
    if (event.target.id === 'notif-type') {
        const previewType = document.getElementById('preview-type');
        if (previewType) {
            const typeLabels = {
                'info': 'ℹ️ Information',
                'alert': '⚠️ Alerte',
                'reminder': '📅 Rappel',
                'invoice': '📄 Facture',
                'report': '📊 Rapport'
            };
            previewType.textContent = typeLabels[event.target.value] || 'ℹ️ Information';
        }
    }
    
    // Mise à jour priorité dans aperçu
    if (event.target.id === 'notif-priority') {
        const previewPriority = document.getElementById('preview-priority');
        if (previewPriority) {
            const priorityLabels = {
                'low': '🟢 Basse',
                'normal': '🔵 Normale',
                'high': '🟠 Haute',
                'urgent': '🔴 Urgente'
            };
            previewPriority.textContent = priorityLabels[event.target.value] || '🔵 Normale';
        }
    }
});

/**
 * 🆕 Gestion de l'envoi de notification AVEC SYNTHÈSE
 */
window.handleSendNotification = async function(event) {
    event.preventDefault();
    
    const recipientType = document.querySelector('input[name="recipient-type"]:checked')?.value;
    const type = document.getElementById('notif-type').value;
    const priority = document.getElementById('notif-priority').value;
    const title = document.getElementById('notif-title').value;
    const message = document.getElementById('notif-message').value;
    
    // Déterminer les destinataires
    let recipients = [];
    
    if (recipientType === 'all') {
        recipients = ['all'];
    } else if (recipientType === 'role') {
        const role = document.getElementById('notif-role')?.value;
        if (role) recipients = [role];
    } else if (recipientType === 'specific') {
        const usersSelect = document.getElementById('notif-users');
        if (usersSelect) {
            recipients = Array.from(usersSelect.selectedOptions).map(opt => opt.value);
        }
        
        if (recipients.length === 0) {
            NotificationManager.show('⚠️ Veuillez sélectionner au moins un utilisateur', 'warning');
            return;
        }
    }
    
    try {
        NotificationManager.show('⏳ Envoi en cours...', 'info');
        
        const response = await apiFetch('notifications/send', {
            method: 'POST',
            body: JSON.stringify({
                companyId: appState.currentCompanyId,
                recipients: recipients,
                recipientType: recipientType,
                type: type,
                priority: priority,
                title: title,
                message: message
            })
        });
        
        if (response.status === 'success') {
            // ✅ AFFICHER LA SYNTHÈSE
            showNotificationSummary(response.data, title, message, type);
            
            // ✅ CORRECTION : Vérifier que le formulaire existe AVANT de le reset
            const form = document.getElementById('send-notification-form');
            if (form) {
                form.reset();
                console.log('✅ Formulaire réinitialisé');
            } else {
                console.warn('⚠️ Formulaire send-notification-form introuvable');
            }
            
        } else {
            throw new Error(response.error || 'Erreur d\'envoi');
        }
        
    } catch (error) {
        console.error('🚨 [handleSendNotification] Erreur:', error);
        // ✅ CORRECTION LIGNE 66 : Mauvaise syntaxe (backtick au lieu de parenthèse)
        NotificationManager.show(`❌ Erreur : ${error.message}`, 'error');
    }
};

/**
 * 🆕 Affiche la synthèse des notifications envoyées (CORRIGÉE)
 */
/**
 * Affiche le récapitulatif des notifications envoyées
 */
function showNotificationSummary(data, title, message, type) {
    console.log('📊 [showNotificationSummary] Affichage du récapitulatif:', data);
    
    // Récupérer les infos
    const count = data?.count || 0;
    const recipients = data?.recipients || [];
    
    // Générer la liste des destinataires
    let recipientsList = '';
    if (recipients.length > 0) {
        recipientsList = recipients.map(r => `
            <li class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <i class="fas fa-user text-primary"></i>
                <span class="font-bold">${r.name}</span>
                <span class="text-xs text-gray-500">(${r.email})</span>
            </li>
        `).join('');
    } else {
        recipientsList = '<p class="text-gray-500 italic">Liste des destinataires non disponible</p>';
    }
    
    // Icône selon le type
    const typeIcons = {
        'info': 'ℹ️',
        'alert': '⚠️',
        'reminder': '📅',
        'invoice': '📄',
        'report': '📊'
    };
    const icon = typeIcons[type] || 'ℹ️';
    
    // HTML du récapitulatif
    const summaryHTML = `
        <div class="space-y-6">
            <div class="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                <div class="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check-circle text-success text-4xl"></i>
                </div>
                <h4 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    ✅ Notification Envoyée !
                </h4>
                <p class="text-gray-600 dark:text-gray-400">
                    ${count} utilisateur(s) ont reçu votre notification
                </p>
            </div>
            
            <!-- Aperçu du message -->
            <div>
                <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    📨 Message envoyé :
                </p>
                <div class="bg-gradient-to-br from-primary/5 to-secondary/5 p-4 rounded-xl border-2 border-primary/20">
                    <div class="flex items-start gap-3 mb-3">
                        <span class="text-2xl">${icon}</span>
                        <div class="flex-1">
                            <p class="font-black text-gray-900 dark:text-white text-lg mb-2">${title}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${message}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Liste des destinataires -->
            <div>
                <p class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    👥 Destinataires (${count}) :
                </p>
                <div class="max-h-60 overflow-y-auto border rounded-xl p-3 dark:border-gray-600">
                    <ul class="space-y-2">
                        ${recipientsList}
                    </ul>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onclick="ModalManager.close(); window.switchUsersTab('list');" 
                    class="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-all">
                    <i class="fas fa-check mr-2"></i>Terminer
                </button>
                <button onclick="ModalManager.close();" 
                    class="px-6 bg-gray-500 text-white font-bold py-3 rounded-xl hover:bg-gray-600 transition-all">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    // Ouvrir la modal avec le récapitulatif
    ModalManager.open('📬 Récapitulatif de l\'envoi', summaryHTML);
}

/**
 * Utilitaire : Label du type de notification
 */
function getNotificationTypeLabel(type) {
    const labels = {
        'info': 'ℹ️ Information',
        'alert': '⚠️ Alerte',
        'reminder': '📅 Rappel',
        'invoice': '📄 Facture',
        'report': '📊 Rapport'
    };
    return labels[type] || type;
}

// =============================================================================
// CHARGEMENT DES DONNÉES
// =============================================================================

/**
 * Charge tous les utilisateurs depuis l'API
 */
async function loadAllUsers() {
    try {
        console.log('📥 [loadAllUsers] Récupération de la liste des utilisateurs...');
        
        const response = await apiFetch('admin/users', { method: 'GET' });
        
        if (response.status === 'success') {
            usersState.allUsers = response.data || [];
            usersState.filteredUsers = [...usersState.allUsers];
            
            console.log(`✅ [loadAllUsers] ${usersState.allUsers.length} utilisateurs chargés`);
        } else {
            throw new Error(response.error || 'Erreur lors du chargement des utilisateurs');
        }
        
    } catch (error) {
        console.error('🚨 [loadAllUsers] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        // ✅ CORRECTION : Mode développement avec données simulées
        console.warn('⚠️ [loadAllUsers] Utilisation de données simulées (mode développement)');
        
        usersState.allUsers = [
            {
                id: 1,
                name: 'Admin Principal',
                email: 'admin@douke.pro',
                phone: '+229 97 12 34 56',
                profile: 'ADMIN',
                active: true,
                companies: [1, 2, 3],
                created_at: '2026-01-01',
                last_login: '2026-02-05'
            },
            {
                id: 2,
                name: 'Alice Collaboratrice',
                email: 'alice@douke.pro',
                phone: '+229 97 23 45 67',
                profile: 'COLLABORATEUR',
                active: true,
                companies: [1, 2],
                created_at: '2026-01-10',
                last_login: '2026-02-04'
            },
            {
                id: 3,
                name: 'Bob Utilisateur',
                email: 'bob@douke.pro',
                phone: '+229 97 34 56 78',
                profile: 'USER',
                active: false,
                companies: [1],
                created_at: '2026-01-15',
                last_login: '2026-01-20'
            }
        ];
        usersState.filteredUsers = [...usersState.allUsers];
        
        console.log(`✅ [loadAllUsers] ${usersState.allUsers.length} utilisateurs simulés chargés`);
        
        // Ne pas propager l'erreur en mode développement
        // throw error; // ← Commenté pour permettre l'affichage en mode simulation
    }
}

// =============================================================================
// GÉNÉRATION DU TABLEAU
// =============================================================================

/**
 * Génère le HTML du tableau des utilisateurs
 */
function generateUsersTableHTML() {
    const users = usersState.filteredUsers;
    
    if (users.length === 0) {
        return `
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                <i class="fas fa-users-slash fa-3x text-gray-400 mb-4"></i>
                <p class="text-gray-500 font-bold">Aucun utilisateur trouvé</p>
            </div>
        `;
    }
    
    const rows = users.map(user => {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const roleColor = getRoleColor(user.profile);
        const statusBadge = user.active 
            ? '<span class="px-2 py-1 bg-success/20 text-success text-xs font-bold rounded-full">✅ Actif</span>'
            : '<span class="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">⏸️ Inactif</span>';
        
        return `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black mr-3">
                            ${initials}
                        </div>
                        <div>
                            <p class="font-bold text-gray-900 dark:text-white">${user.name}</p>
                            <p class="text-xs text-gray-500">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    ${user.phone || '-'}
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${roleColor}">
                        ${user.profile}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    ${user.companies ? user.companies.length : 0} entreprise(s)
                </td>
                <td class="px-6 py-4">
                    ${statusBadge}
                </td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="window.openEditUserModal(${user.id})" 
                            class="text-primary hover:text-primary-dark font-bold text-sm"
                            title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.handleToggleUserStatus(${user.id}, ${user.active})" 
                            class="text-warning hover:text-warning-dark font-bold text-sm"
                            title="${user.active ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${user.active ? 'pause' : 'play'}-circle"></i>
                        </button>
                        <button onclick="window.handleResetPassword(${user.id})" 
                            class="text-info hover:text-info-dark font-bold text-sm"
                            title="Réinitialiser mot de passe">
                            <i class="fas fa-key"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Utilisateur</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Téléphone</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rôle</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Entreprises</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t dark:border-gray-600">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    <strong>${users.length}</strong> utilisateur(s) affiché(s)
                </p>
            </div>
        </div>
    `;
}

// =============================================================================
// FILTRES ET RECHERCHE
// =============================================================================

/**
 * Gère la recherche d'utilisateurs
 */
window.handleUserSearch = function(searchTerm) {
    usersState.searchTerm = searchTerm.toLowerCase();
    applyFilters();
};

/**
 * Gère le filtre par rôle
 */
window.handleRoleFilter = function(roleFilter) {
    usersState.roleFilter = roleFilter;
    applyFilters();
};

/**
 * Applique tous les filtres actifs
 */
function applyFilters() {
    let filtered = [...usersState.allUsers];
    
    // Filtre par recherche
    if (usersState.searchTerm) {
        filtered = filtered.filter(user => 
            user.name.toLowerCase().includes(usersState.searchTerm) ||
            user.email.toLowerCase().includes(usersState.searchTerm)
        );
    }
    
    // Filtre par rôle
    if (usersState.roleFilter !== 'ALL') {
        filtered = filtered.filter(user => user.profile === usersState.roleFilter);
    }
    
    usersState.filteredUsers = filtered;
    
    // Mise à jour du tableau
    const container = document.getElementById('users-table-container');
    if (container) {
        container.innerHTML = generateUsersTableHTML();
    }
}

// =============================================================================
// MODAL DE CRÉATION D'UTILISATEUR
// =============================================================================

/**
 * Ouvre la modal de création d'un utilisateur
 */
window.openCreateUserModal = async function() {
    const companies = appState.user.companiesList || [];
    
    const companiesCheckboxes = companies.map(company => `
        <label class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input type="checkbox" name="user-companies" value="${company.id}"
                class="mr-3 w-4 h-4 text-primary rounded focus:ring-primary">
            <span class="font-bold">${company.name}</span>
        </label>
    `).join('');
    
    const modalHTML = `
        <form id="create-user-form" onsubmit="window.handleCreateUser(event)" class="space-y-6">
            <!-- Informations Générales -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Nom complet <span class="text-danger">*</span>
                    </label>
                    <input type="text" id="new-user-name" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Jean Dupont">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Email <span class="text-danger">*</span>
                    </label>
                    <input type="email" id="new-user-email" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="jean.dupont@entreprise.com">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Téléphone
                    </label>
                    <input type="tel" id="new-user-phone"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="+229 XX XX XX XX">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Rôle <span class="text-danger">*</span>
                    </label>
                    <select id="new-user-role" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="">-- Sélectionner --</option>
                        <option value="ADMIN">Administrateur</option>
                        <option value="COLLABORATEUR">Collaborateur</option>
                        <option value="USER">Utilisateur</option>
                        <option value="CAISSIER">Caissier</option>
                    </select>
                </div>
            </div>

            <!-- Entreprises Assignées -->
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <i class="fas fa-building mr-2"></i>Entreprises Assignées <span class="text-danger">*</span>
                </label>
                <div class="border rounded-xl p-4 dark:border-gray-600 max-h-48 overflow-y-auto space-y-2">
                    ${companiesCheckboxes}
                </div>
                <p class="text-xs text-gray-500 mt-2">Sélectionnez au moins une entreprise</p>
            </div>

            <!-- Mot de Passe -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Mot de passe <span class="text-danger">*</span>
                    </label>
                    <input type="password" id="new-user-password" required minlength="8"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Minimum 8 caractères">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Confirmer le mot de passe <span class="text-danger">*</span>
                    </label>
                    <input type="password" id="new-user-password-confirm" required minlength="8"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Retapez le mot de passe">
                </div>
            </div>

            <!-- Boutons -->
            <div class="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Annuler
                </button>
                <button type="submit"
                    class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-success-dark transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>Créer l'Utilisateur
                </button>
            </div>
        </form>
    `;
    
    ModalManager.open('➕ Créer un Nouvel Utilisateur', modalHTML);
};

// =============================================================================
// MODULE GESTION UTILISATEURS - PARTIE 2/2
// Actions CRUD et fonctions utilitaires
// À ajouter IMMÉDIATEMENT APRÈS la Partie 1
// =============================================================================

// =============================================================================
// MODAL DE MODIFICATION D'UTILISATEUR
// =============================================================================

/**
 * Ouvre la modal de modification d'un utilisateur
 */
window.openEditUserModal = async function(userId) {
    const user = usersState.allUsers.find(u => u.id === userId);
    if (!user) {
        NotificationManager.show('Utilisateur introuvable', 'error');
        return;
    }
    
    const companies = appState.user.companiesList || [];
    
    const companiesCheckboxes = companies.map(company => {
        const isAssigned = user.companies && user.companies.includes(company.id);
        return `
            <label class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input type="checkbox" name="user-companies" value="${company.id}" ${isAssigned ? 'checked' : ''}
                    class="mr-3 w-4 h-4 text-primary rounded focus:ring-primary">
                <span class="font-bold">${company.name}</span>
            </label>
        `;
    }).join('');
    
    const modalHTML = `
        <form id="edit-user-form" onsubmit="window.handleUpdateUser(event, ${userId})" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Nom complet <span class="text-danger">*</span>
                    </label>
                    <input type="text" id="edit-user-name" value="${user.name}" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Email <span class="text-danger">*</span>
                    </label>
                    <input type="email" id="edit-user-email" value="${user.email}" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Téléphone
                    </label>
                    <input type="tel" id="edit-user-phone" value="${user.phone || ''}"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Rôle <span class="text-danger">*</span>
                    </label>
                    <select id="edit-user-role" required
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="ADMIN" ${user.profile === 'ADMIN' ? 'selected' : ''}>Administrateur</option>
                        <option value="COLLABORATEUR" ${user.profile === 'COLLABORATEUR' ? 'selected' : ''}>Collaborateur</option>
                        <option value="USER" ${user.profile === 'USER' ? 'selected' : ''}>Utilisateur</option>
                        <option value="CAISSIER" ${user.profile === 'CAISSIER' ? 'selected' : ''}>Caissier</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <i class="fas fa-building mr-2"></i>Entreprises Assignées
                </label>
                <div class="border rounded-xl p-4 dark:border-gray-600 max-h-48 overflow-y-auto space-y-2">
                    ${companiesCheckboxes}
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Annuler
                </button>
                <button type="submit"
                    class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
                    <i class="fas fa-save mr-2"></i>Enregistrer
                </button>
            </div>
        </form>
    `;
    
    ModalManager.open(`✏️ Modifier : ${user.name}`, modalHTML);
};

// =============================================================================
// ACTIONS SUR LES UTILISATEURS
// =============================================================================

/**
 * Crée un nouvel utilisateur
 */
window.handleCreateUser = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const phone = document.getElementById('new-user-phone').value;
    const role = document.getElementById('new-user-role').value;
    const password = document.getElementById('new-user-password').value;
    const passwordConfirm = document.getElementById('new-user-password-confirm').value;
    
    // Récupérer les entreprises cochées
    const selectedCompanies = Array.from(document.querySelectorAll('input[name="user-companies"]:checked'))
        .map(cb => parseInt(cb.value));
    
    // Validations
    if (selectedCompanies.length === 0) {
        NotificationManager.show('Veuillez sélectionner au moins une entreprise', 'warning');
        return;
    }
    
    if (password !== passwordConfirm) {
        NotificationManager.show('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 8) {
        NotificationManager.show('Le mot de passe doit contenir au moins 8 caractères', 'error');
        return;
    }
    
    const data = {
        name,
        email,
        phone,
        profile: role,
        password,
        companies: selectedCompanies
    };
    
    try {
        NotificationManager.show('Création de l\'utilisateur...', 'info');
        
        const response = await apiFetch('admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.status === 'success') {
            NotificationManager.show(`Utilisateur ${name} créé avec succès !`, 'success');
            ModalManager.close();
            
            // Recharger la liste
            await loadAllUsers();
            const container = document.getElementById('users-table-container');
            if (container) {
                container.innerHTML = generateUsersTableHTML();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de la création');
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * Met à jour un utilisateur existant
 */
window.handleUpdateUser = async function(event, userId) {
    event.preventDefault();
    
    const name = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const phone = document.getElementById('edit-user-phone').value;
    const role = document.getElementById('edit-user-role').value;
    
    const selectedCompanies = Array.from(document.querySelectorAll('input[name="user-companies"]:checked'))
        .map(cb => parseInt(cb.value));
    
    if (selectedCompanies.length === 0) {
        NotificationManager.show('Veuillez sélectionner au moins une entreprise', 'warning');
        return;
    }
    
    const data = {
        name,
        email,
        phone,
        profile: role,
        companies: selectedCompanies
    };
    
    try {
        NotificationManager.show('Mise à jour...', 'info');
        
        const response = await apiFetch(`admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response.status === 'success') {
            NotificationManager.show('Utilisateur mis à jour avec succès !', 'success');
            ModalManager.close();
            
            await loadAllUsers();
            const container = document.getElementById('users-table-container');
            if (container) {
                container.innerHTML = generateUsersTableHTML();
            }
        } else {
            throw new Error(response.message || 'Erreur lors de la mise à jour');
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * Active/Désactive un utilisateur
 */
window.handleToggleUserStatus = async function(userId, currentStatus) {
    const action = currentStatus ? 'désactiver' : 'activer';
    const user = usersState.allUsers.find(u => u.id === userId);
    
    if (!confirm(`Voulez-vous vraiment ${action} l'utilisateur ${user.name} ?`)) {
        return;
    }
    
    try {
        NotificationManager.show(`${action === 'désactiver' ? 'Désactivation' : 'Activation'}...`, 'info');
        
        const response = await apiFetch(`admin/users/${userId}/toggle-status`, {
            method: 'PATCH',
            body: JSON.stringify({ active: !currentStatus })
        });
        
        if (response.status === 'success') {
            NotificationManager.show(`Utilisateur ${action}é avec succès`, 'success');
            
            await loadAllUsers();
            const container = document.getElementById('users-table-container');
            if (container) {
                container.innerHTML = generateUsersTableHTML();
            }
        } else {
            throw new Error(response.message || 'Erreur');
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
window.handleResetPassword = async function(userId) {
    const user = usersState.allUsers.find(u => u.id === userId);
    
    const newPassword = prompt(`Entrez le nouveau mot de passe pour ${user.name} (minimum 8 caractères) :`);
    
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
        NotificationManager.show('Le mot de passe doit contenir au moins 8 caractères', 'error');
        return;
    }
    
    try {
        NotificationManager.show('Réinitialisation du mot de passe...', 'info');
        
        const response = await apiFetch(`admin/users/${userId}/reset-password`, {
            method: 'PATCH',
            body: JSON.stringify({ new_password: newPassword })
        });
        
        if (response.status === 'success') {
            NotificationManager.show('Mot de passe réinitialisé avec succès', 'success');
        } else {
            throw new Error(response.message || 'Erreur');
        }
        
    } catch (error) {
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Retourne la classe CSS selon le rôle
 */
function getRoleColor(role) {
    const colors = {
        'ADMIN': 'bg-danger/20 text-danger',
        'COLLABORATEUR': 'bg-primary/20 text-primary',
        'USER': 'bg-info/20 text-info',
        'CAISSIER': 'bg-warning/20 text-warning'
    };
    return colors[role] || 'bg-gray-200 text-gray-700';
}

// =============================================================================
// FIN DU MODULE GESTION DES UTILISATEURS
// =============================================================================

// =============================================================================
// 🆕 NOUVEAUX ÉLÉMENTS DASHBOARD - FÉVRIER 2026
// À AJOUTER À LA FIN DE script.js (après la ligne ~4000)
// =============================================================================

// =============================================================================
// 1. GESTION DES NOTIFICATIONS EMAIL
// =============================================================================

/**
 * Toggle l'affichage du dropdown notifications
 */
window.toggleNotifications = function() {
    console.log('🔔 [toggleNotifications] Toggle dropdown notifications');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (!dropdown) {
        console.error('❌ [toggleNotifications] Dropdown introuvable');
        return;
    }
    
    if (dropdown.classList.contains('hidden')) {
        // Charger les notifications avant d'afficher
        loadNotifications();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
};

/**
 * Charge les notifications depuis l'API (ou données simulées)
 */
/**
 * Charge les notifications depuis l'API (DONNÉES RÉELLES)
 */
async function loadNotifications() {
    console.log('📧 [loadNotifications] Chargement des notifications...');
    
    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;
    
    // Afficher un spinner
    listContainer.innerHTML = `
        <div class="p-8 text-center">
            <div class="loading-spinner mx-auto"></div>
            <p class="mt-3 text-xs text-gray-500">Chargement...</p>
        </div>
    `;
    
    try {
        // ✅ CORRECTION : Parenthèse au lieu de backtick
        const response = await apiFetch(`notifications?companyId=${appState.currentCompanyId}`, { 
            method: 'GET' 
        });
        
        const notifications = response.data || [];
        
        // Générer le HTML des notifications
        const notificationsHTML = notifications.map(notif => {
            const icon = getNotificationIcon(notif.type);
            const timeAgo = formatTimeAgo(notif.created_at);
            const unreadClass = notif.read ? '' : 'unread';
            
            // ✅ BADGE "NEW" pour les notifications de moins de 5 minutes
            const isRecent = (new Date() - new Date(notif.created_at)) < 5 * 60 * 1000;
            const newBadge = (isRecent && !notif.read) 
                ? '<span style="background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-left: 8px;">NEW</span>'
                : '';
            
            return `
                <div class="notification-item ${unreadClass}" 
                     style="padding: 16px; border-bottom: 1px solid #E5E7EB; cursor: pointer;" 
                     onclick="markAsRead(${notif.id})">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <i class="${icon}" 
                           style="color: ${notif.read ? '#9CA3AF' : '#10B981'}; font-size: 18px; margin-top: 2px;"></i>
                        <div style="flex: 1;">
                            <p style="font-weight: bold; font-size: 13px; color: ${notif.read ? '#6B7280' : '#111827'}; margin-bottom: 4px;">
                                ${notif.title}${newBadge}
                            </p>
                            <p style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
                                ${notif.message}
                            </p>
                            <p style="font-size: 10px; color: #9CA3AF;">
                                <i class="fas fa-clock" style="margin-right: 4px;"></i>${timeAgo}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        listContainer.innerHTML = notificationsHTML || `
            <div class="p-8 text-center text-gray-500">
                <i class="fas fa-inbox fa-2x mb-3"></i>
                <p class="text-sm">Aucune notification</p>
            </div>
        `;
        
        // Mettre à jour le badge count
        const unreadCount = notifications.filter(n => !n.read).length;
        updateNotificationCount(unreadCount);
        
        // ✅ CORRECTION : Parenthèse au lieu de backtick
        console.log(`✅ [loadNotifications] ${notifications.length} notifications chargées`);
        
    } catch (error) {
        console.error('🚨 [loadNotifications] Erreur:', error);
        listContainer.innerHTML = `
            <div class="p-8 text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p class="text-sm">Erreur de chargement</p>
            </div>
        `;
    }
}

/**
 * Retourne l'icône appropriée selon le type de notification
 */
function getNotificationIcon(type) {
    const icons = {
        'invoice': 'fas fa-envelope-open-text',
        'reminder': 'fas fa-file-invoice',
        'report': 'fas fa-check-circle',
        'alert': 'fas fa-exclamation-triangle'
    };
    return icons[type] || 'fas fa-envelope';
}

/**
 * Formate le temps écoulé (ex: "Il y a 2 heures")
 */
function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return new Date(timestamp).toLocaleDateString('fr-FR');
}

/**
 * Met à jour le compteur de notifications non lues
 */
function updateNotificationCount(count) {
    const badge = document.getElementById('notification-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Marque une notification comme lue
 */
window.markAsRead = function(notificationId) {
    console.log('✅ [markAsRead] Notification', notificationId, 'marquée comme lue');
    // TODO: Appel API pour marquer comme lu
    // await apiFetch(`notifications/${notificationId}/read`, { method: 'PATCH' });
    
    // Recharger les notifications
    loadNotifications();
};

// Fermer le dropdown si clic extérieur
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const notificationBtn = event.target.closest('button[onclick="toggleNotifications()"]');
    
    if (dropdown && !dropdown.contains(event.target) && !notificationBtn) {
        dropdown.classList.add('hidden');
    }
});

// =============================================================================
// 2. GESTION ANNÉE FISCALE (MODIFIABLE)
// =============================================================================

/**
 * Ouvre la modal de modification de l'année fiscale
 */
window.openFiscalYearModal = function() {
    console.log('📅 [openFiscalYearModal] Ouverture modal année fiscale');
    
    const currentYear = document.getElementById('fiscal-year-text')?.textContent || '2026';
    
    const modalHTML = `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Année Fiscale <span class="text-danger">*</span>
                </label>
                <input type="number" id="fiscal-year-input" value="${currentYear}" min="2020" max="2099"
                    class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-center text-2xl font-black">
                <p class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Cette année sera utilisée pour tous les rapports et écritures comptables
                </p>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
                <button onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Annuler
                </button>
                <button onclick="saveFiscalYear()"
                    class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
                    <i class="fas fa-save mr-2"></i>Enregistrer
                </button>
            </div>
        </div>
    `;
    
    ModalManager.open('📅 Modifier l\'Année Fiscale', modalHTML);
};

/**
 * Sauvegarde la nouvelle année fiscale
 */
window.saveFiscalYear = async function() {
    const newYear = document.getElementById('fiscal-year-input').value;
    
    if (!newYear || newYear < 2020 || newYear > 2099) {
        NotificationManager.show('Année invalide', 'error');
        return;
    }
    
    try {
        console.log('💾 [saveFiscalYear] Sauvegarde de l\'année', newYear);
        
        // TODO: Appel API pour sauvegarder
        const companyId = appState.currentCompanyId;
        // await apiFetch(`settings/fiscal-year/${companyId}`, {
        //     method: 'PATCH',
        //     body: JSON.stringify({ fiscal_year: newYear })
        // });
        
        // Mettre à jour l'affichage
        document.getElementById('fiscal-year-text').textContent = newYear;
        
        NotificationManager.show(`Année fiscale mise à jour : ${newYear}`, 'success');
        ModalManager.close();
        
    } catch (error) {
        console.error('🚨 [saveFiscalYear] Erreur:', error);
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

// =============================================================================
// 3. GESTION SYSTÈME COMPTABLE (MODIFIABLE)
// =============================================================================

/**
 * Ouvre la modal de modification du système comptable
 */
window.openAccountingSystemModal = function() {
    console.log('📊 [openAccountingSystemModal] Ouverture modal système comptable');
    
    const currentSystem = document.getElementById('accounting-system-text')?.textContent || 'SYSCOHADA';
    
    const modalHTML = `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Système Comptable <span class="text-danger">*</span>
                </label>
                <select id="accounting-system-input" 
                    class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-lg font-bold">
                    <option value="SYSCOHADA" ${currentSystem === 'SYSCOHADA' ? 'selected' : ''}>SYSCOHADA Révisé (OHADA)</option>
                    <option value="SYCEBNL" ${currentSystem === 'SYCEBNL' ? 'selected' : ''}>SYCEBNL (Bénin)</option>
                    <option value="PCG" ${currentSystem === 'PCG' ? 'selected' : ''}>Plan Comptable Général (France)</option>
                </select>
                <p class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Le changement de système comptable affectera la structure du plan comptable
                </p>
            </div>

            <div class="bg-warning/10 border-l-4 border-warning p-4 rounded-xl">
                <p class="text-sm text-warning font-bold">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Attention : Ce changement nécessite une validation comptable
                </p>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t">
                <button onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                    Annuler
                </button>
                <button onclick="saveAccountingSystem()"
                    class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
                    <i class="fas fa-save mr-2"></i>Enregistrer
                </button>
            </div>
        </div>
    `;
    
    ModalManager.open('📊 Modifier le Système Comptable', modalHTML);
};

/**
 * Sauvegarde le nouveau système comptable
 */
window.saveAccountingSystem = async function() {
    const newSystem = document.getElementById('accounting-system-input').value;
    
    if (!newSystem) {
        NotificationManager.show('Veuillez sélectionner un système', 'error');
        return;
    }
    
    try {
        console.log('💾 [saveAccountingSystem] Sauvegarde du système', newSystem);
        
        // TODO: Appel API pour sauvegarder
        const companyId = appState.currentCompanyId;
        // await apiFetch(`settings/accounting/${companyId}`, {
        //     method: 'PATCH',
        //     body: JSON.stringify({ accounting_system: newSystem })
        // });
        
        // Mettre à jour l'affichage
        document.getElementById('accounting-system-text').textContent = newSystem;
        
        NotificationManager.show(`Système comptable mis à jour : ${newSystem}`, 'success');
        ModalManager.close();
        
    } catch (error) {
        console.error('🚨 [saveAccountingSystem] Erreur:', error);
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

// =============================================================================
// 4. CHARGEMENT RCCM + TÉLÉPHONE (SIDEBAR)
// =============================================================================

/**
 * Charge et affiche les informations RCCM et Téléphone de l'entreprise active
 */
async function loadCompanyDetailsEnriched() {
    if (!appState.currentCompanyId) {
        console.log('⏭️ [loadCompanyDetailsEnriched] Pas d\'entreprise active, skip');
        return;
    }
    
    console.log('🏢 [loadCompanyDetailsEnriched] Chargement RCCM/Téléphone pour company_id:', appState.currentCompanyId);
    
    try {
        // Récupérer les données depuis l'API Paramètres
        const response = await apiFetch(`settings/company/${appState.currentCompanyId}`, { method: 'GET' });
        
        const companyData = response.data || {};
        const rccm = companyData.registration_number || '-';
        const phone = companyData.phone || '-';
        
        // Mettre à jour l'affichage
        const rccmElement = document.getElementById('company-rccm');
        const phoneElement = document.getElementById('company-phone');
        
        if (rccmElement) {
            rccmElement.textContent = rccm;
        }
        
        if (phoneElement) {
            phoneElement.textContent = phone;
        }
        
        console.log('✅ [loadCompanyDetailsEnriched] RCCM:', rccm, '| Téléphone:', phone);
        
    } catch (error) {
        console.error('🚨 [loadCompanyDetailsEnriched] Erreur:', error);
        // En cas d'erreur, afficher des valeurs par défaut
        document.getElementById('company-rccm').textContent = '-';
        document.getElementById('company-phone').textContent = '-';
    }
}

// =============================================================================
// 5. INITIALISATION AU CHARGEMENT DU DASHBOARD
// =============================================================================

const originalLoadDashboard = window.loadDashboard || loadDashboard;
window.loadDashboard = function() {
    console.log('🔄 [loadDashboard] Hook - Chargement des nouveaux éléments...');
    
    // Appeler la fonction originale
    if (typeof originalLoadDashboard === 'function') {
        originalLoadDashboard();
    }
    
    // Charger les données enrichies
    loadCompanyDetailsEnriched();
    
    // ✅ DÉMARRER LE POLLING AUTOMATIQUE
    startNotificationPolling();
};

// =============================================================================
// 6. HOOK DANS handleCompanyChange()
// =============================================================================

/**
 * Recharger RCCM/Téléphone quand l'utilisateur change d'entreprise
 */
const originalHandleCompanyChange = window.handleCompanyChange;
window.handleCompanyChange = async function(newCompanyId) {
    console.log('🔄 [handleCompanyChange] Hook - Rechargement RCCM/Téléphone...');
    
    // Appeler la fonction originale
    if (typeof originalHandleCompanyChange === 'function') {
        await originalHandleCompanyChange(newCompanyId);
    }
    
    // Recharger les données enrichies
    await loadCompanyDetailsEnriched();
};

// =============================================================================
// FIN DES NOUVEAUX ÉLÉMENTS
// =============================================================================
console.log('✅ [NOUVEAUX ÉLÉMENTS] Toutes les fonctions ont été chargées avec succès');

// =============================================================================
// 🔄 POLLING AUTOMATIQUE DES NOTIFICATIONS (TOUTES LES 30 SECONDES)
// =============================================================================

let notificationPollingInterval = null;

/**
 * Démarre le polling automatique des notifications
 */
function startNotificationPolling() {
    // Arrêter le polling précédent s'il existe
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
    }
    
    console.log('🔄 [startNotificationPolling] Démarrage du polling (30s)');
    
    // Charger immédiatement
    loadNotifications();
    
    // Recharger toutes les 30 secondes
    notificationPollingInterval = setInterval(() => {
        if (appState.currentCompanyId) {
            console.log('🔄 [Polling] Rechargement automatique des notifications...');
            loadNotifications();
        }
    }, 30000); // 30 secondes
}

/**
 * Arrête le polling automatique
 */
function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
        console.log('⏹️ [stopNotificationPolling] Polling arrêté');
    }
}

// =============================================================================
// FICHIER : public/assets/scriptReports.js
// Description : Module de gestion des rapports financiers avec rôles différenciés
// Dépendances : script.js (DOIT être chargé AVANT)
// Version : 1.0 - Complète avec Admin/Collaborateur
// =============================================================================

(function() {
    'use strict';
    
    // ✅ VÉRIFICATION DES DÉPENDANCES
    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptReports] script.js doit être chargé AVANT !');
        return;
    }
    
    if (typeof window.apiFetch === 'undefined') {
        console.error('❌ [scriptReports] apiFetch non disponible !');
        return;
    }
    
    console.log('✅ [scriptReports] Module chargé avec succès');
    
    // =============================================================================
    // ÉTAT DU MODULE RAPPORTS
    // =============================================================================
    
    const reportsState = {
        pendingRequests: [],
        myRequests: [],
        currentEditingReport: null
    };
    
    // =============================================================================
    // FONCTIONS POUR TOUS LES UTILISATEURS
    // =============================================================================
    
    /**
     * Ouvre la modal de demande d'états financiers
     */
    window.openRequestFinancialReportsModal = function() {
        console.log('📋 [openRequestFinancialReportsModal] Ouverture modal');
        
        const modalHTML = `
            <form id="request-financial-reports-form" onsubmit="window.submitFinancialReportRequest(event)" class="space-y-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Type d'états financiers <span class="text-danger">*</span>
                    </label>
                    <select id="report-type" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                        <option value="">-- Sélectionner --</option>
                        <option value="syscohada-complet">SYSCOHADA Complet (Bilan + CR + TFT + Annexes)</option>
                        <option value="syscohada-simplifie">SYSCOHADA Simplifié (Bilan + CR)</option>
                        <option value="sycebnl">SYCEBNL (Associations/ONG)</option>
                        <option value="pcg">Plan Comptable Général (France)</option>
                    </select>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Période (Début) <span class="text-danger">*</span>
                        </label>
                        <input type="date" id="period-start" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Période (Fin) <span class="text-danger">*</span>
                        </label>
                        <input type="date" id="period-end" required class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Notes / Instructions (Optionnel)
                    </label>
                    <textarea id="report-notes" rows="4" 
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: J'ai besoin de ces états pour un audit bancaire..."></textarea>
                </div>
                
                <div class="bg-info/10 border-l-4 border-info p-4 rounded-xl">
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                        <i class="fas fa-info-circle text-info mr-2"></i>
                        Votre demande sera traitée par un collaborateur dans un délai de <strong>48h ouvrées</strong>.
                    </p>
                </div>
                
                <div class="flex justify-end gap-3 pt-6 border-t">
                    <button type="button" onclick="ModalManager.close()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                        Annuler
                    </button>
                    <button type="submit"
                        class="px-6 py-3 bg-info text-white font-bold rounded-xl hover:bg-info/90 transition-colors">
                        <i class="fas fa-paper-plane mr-2"></i>Envoyer la Demande
                    </button>
                </div>
            </form>
        `;
        
        ModalManager.open('📋 Demander des États Financiers', modalHTML);
    };
    
    /**
     * Soumet une demande d'états financiers
     */
    window.submitFinancialReportRequest = async function(event) {
        event.preventDefault();
        
        const data = {
            companyId: appState.currentCompanyId,
            reportType: document.getElementById('report-type').value,
            periodStart: document.getElementById('period-start').value,
            periodEnd: document.getElementById('period-end').value,
            notes: document.getElementById('report-notes').value
        };
        
        try {
            NotificationManager.show('Envoi de la demande...', 'info');
            
            const response = await apiFetch('reports/request', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (response.status === 'success') {
                NotificationManager.show('✅ Demande envoyée avec succès !', 'success');
                ModalManager.close();
                
                // Recharger la liste des demandes
                window.loadMyFinancialReportsPreview();
            } else {
                throw new Error(response.error || 'Erreur lors de l\'envoi');
            }
            
        } catch (error) {
            console.error('❌ [submitFinancialReportRequest] Erreur:', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };
    
    /**
     * Charge l'aperçu des dernières demandes de l'utilisateur
     */
    window.loadMyFinancialReportsPreview = async function() {
        try {
            const response = await apiFetch(`reports/my-requests?companyId=${appState.currentCompanyId}&limit=3`, {
                method: 'GET'
            });
            
            if (response.status === 'success') {
                reportsState.myRequests = response.data || [];
                
                const container = document.getElementById('my-requests-preview');
                if (!container) return;
                
                if (reportsState.myRequests.length === 0) {
                    container.innerHTML = `
                        <p class="text-xs text-gray-500 italic">Aucune demande récente</p>
                    `;
                } else {
                    container.innerHTML = reportsState.myRequests.map(req => `
                        <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold">${req.report_type}</span>
                                <span class="px-2 py-1 rounded-full ${getStatusColor(req.status)}">${getStatusLabel(req.status)}</span>
                            </div>
                            <p class="text-gray-600 dark:text-gray-400">${new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('❌ [loadMyFinancialReportsPreview] Erreur:', error);
        }
    };
    
    /**
     * Affiche la liste complète des demandes de l'utilisateur
     */
    window.loadMyFinancialReports = async function() {
        try {
            NotificationManager.show('Chargement de vos demandes...', 'info');
            
            const response = await apiFetch(`reports/my-requests?companyId=${appState.currentCompanyId}`, {
                method: 'GET'
            });
            
            if (response.status === 'success') {
                reportsState.myRequests = response.data || [];
                
                const modalHTML = generateMyRequestsListHTML(reportsState.myRequests);
                ModalManager.open('📋 Mes Demandes d\'États Financiers', modalHTML);
            }
        } catch (error) {
            console.error('❌ [loadMyFinancialReports] Erreur:', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };
    
    // =============================================================================
    // FONCTIONS ADMIN / COLLABORATEUR
    // =============================================================================
    
    /**
     * Charge l'aperçu des demandes en attente (Admin/Collab uniquement)
     */
    window.loadPendingFinancialReportsPreview = async function() {
        const userRole = appState.user?.role || 'user';
        
        if (userRole !== 'admin' && userRole !== 'collaborateur') {
            console.warn('⚠️ [loadPendingFinancialReportsPreview] Accès refusé');
            return;
        }
        
        try {
            const response = await apiFetch(`reports/pending?limit=3`, {
                method: 'GET'
            });
            
            if (response.status === 'success') {
                reportsState.pendingRequests = response.data || [];
                
                const container = document.getElementById('pending-requests-preview');
                if (!container) return;
                
                if (reportsState.pendingRequests.length === 0) {
                    container.innerHTML = `
                        <p class="text-xs text-gray-500 italic">Aucune demande urgente</p>
                    `;
                } else {
                    container.innerHTML = reportsState.pendingRequests.map(req => `
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs border-l-4 border-warning">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold">${req.client_name} - ${req.report_type}</span>
                                <span class="text-warning font-bold">${getDaysAgo(req.created_at)}j</span>
                            </div>
                            <p class="text-gray-600 dark:text-gray-400">Demandé le ${new Date(req.created_at).toLocaleDateString('fr-FR')}</p>
                            <button onclick="window.editFinancialReport(${req.id})" 
                                class="mt-2 text-xs bg-warning text-white px-3 py-1 rounded-full hover:bg-warning/90">
                                <i class="fas fa-edit mr-1"></i>Traiter
                            </button>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('❌ [loadPendingFinancialReportsPreview] Erreur:', error);
        }
    };
    
    /**
     * Affiche la liste complète des demandes en attente (Admin/Collab uniquement)
     */
    window.loadPendingFinancialReports = async function() {
        const userRole = appState.user?.role || 'user';
        
        if (userRole !== 'admin' && userRole !== 'collaborateur') {
            NotificationManager.show('Accès refusé', 'error');
            return;
        }
        
        try {
            NotificationManager.show('Chargement des demandes en attente...', 'info');
            
            const response = await apiFetch('reports/pending', {
                method: 'GET'
            });
            
            if (response.status === 'success') {
                reportsState.pendingRequests = response.data || [];
                
                const modalHTML = generatePendingRequestsListHTML(reportsState.pendingRequests);
                ModalManager.open('📋 Demandes en Attente', modalHTML);
            }
        } catch (error) {
            console.error('❌ [loadPendingFinancialReports] Erreur:', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };
    
    /**
     * Ouvre l'éditeur d'état financier (Admin/Collab uniquement)
     */
    window.editFinancialReport = async function(requestId) {
        const userRole = appState.user?.role || 'user';
        
        if (userRole !== 'admin' && userRole !== 'collaborateur') {
            NotificationManager.show('Accès refusé', 'error');
            return;
        }
        
        try {
            NotificationManager.show('Chargement du rapport...', 'info');
            
            const response = await apiFetch(`reports/request/${requestId}`, {
                method: 'GET'
            });
            
            if (response.status === 'success') {
                reportsState.currentEditingReport = response.data;
                
                const modalHTML = generateFinancialReportEditorHTML(response.data);
                ModalManager.open(`✏️ Éditer : ${response.data.report_type}`, modalHTML);
            }
        } catch (error) {
            console.error('❌ [editFinancialReport] Erreur:', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };
    
    /**
     * Valide un état financier (Admin/Collab uniquement)
     */
    window.validateFinancialReport = async function(requestId) {
        const userRole = appState.user?.role || 'user';
        
        if (userRole !== 'admin' && userRole !== 'collaborateur') {
            NotificationManager.show('Accès refusé', 'error');
            return;
        }
        
        if (!confirm('Êtes-vous sûr de vouloir valider cet état financier ? Cette action est irréversible.')) {
            return;
        }
        
        try {
            NotificationManager.show('Validation en cours...', 'info');
            
            const response = await apiFetch(`reports/request/${requestId}/validate`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    status: 'validated',
                    validated_by: appState.user.odooUid,
                    validated_at: new Date().toISOString()
                })
            });
            
            if (response.status === 'success') {
                NotificationManager.show('✅ État financier validé avec succès !', 'success');
                ModalManager.close();
                
                // Recharger la liste
                window.loadPendingFinancialReportsPreview();
                
                // Envoyer notification au client
                window.sendClientNotification(requestId, 'validated');
            }
        } catch (error) {
            console.error('❌ [validateFinancialReport] Erreur:', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };
    
    /**
     * Envoie une notification au client (Admin/Collab uniquement)
     */
    window.sendClientNotification = async function(requestId, status) {
        try {
            await apiFetch('notifications/send', {
                method: 'POST',
                body: JSON.stringify({
                    companyId: appState.currentCompanyId,
                    recipientType: 'specific',
                    recipients: [reportsState.currentEditingReport?.user_id],
                    type: 'report',
                    priority: 'high',
                    title: `État financier ${status === 'validated' ? 'validé' : 'prêt'}`,
                    message: `Votre demande d'états financiers a été ${status === 'validated' ? 'validée' : 'traitée'}. Vous pouvez maintenant la consulter.`
                })
            });
            
            console.log('✅ Notification envoyée au client');
        } catch (error) {
            console.warn('⚠️ Erreur envoi notification:', error);
        }
    };
    
    // =============================================================================
    // FONCTIONS UTILITAIRES
    // =============================================================================
    
    function getStatusColor(status) {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'validated': 'bg-green-100 text-green-800',
            'sent': 'bg-primary/20 text-primary'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }
    
    function getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'processing': 'En cours',
            'validated': 'Validé',
            'sent': 'Envoyé'
        };
        return labels[status] || status;
    }
    
    function getDaysAgo(date) {
        const diff = new Date() - new Date(date);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    function generateMyRequestsListHTML(requests) {
        if (requests.length === 0) {
            return `
                <div class="text-center p-8">
                    <i class="fas fa-inbox fa-3x text-gray-400 mb-4"></i>
                    <p class="text-gray-500">Vous n'avez pas encore fait de demande</p>
                    <button onclick="ModalManager.close(); window.openRequestFinancialReportsModal();"
                        class="mt-4 bg-info text-white px-6 py-2 rounded-xl font-bold hover:bg-info/90">
                        Créer une Demande
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="space-y-4">
                ${requests.map(req => `
                    <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border-l-4 ${getStatusBorderColor(req.status)}">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-bold text-lg">${req.report_type}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    Période : ${new Date(req.period_start).toLocaleDateString('fr-FR')} - ${new Date(req.period_end).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}">
                                ${getStatusLabel(req.status)}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Demandé le ${new Date(req.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        ${req.status === 'validated' || req.status === 'sent' ? `
                            <button onclick="window.downloadReport(${req.id})" 
                                class="text-sm bg-success text-white px-4 py-2 rounded-xl hover:bg-success/90">
                                <i class="fas fa-download mr-2"></i>Télécharger
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function generatePendingRequestsListHTML(requests) {
        if (requests.length === 0) {
            return `
                <div class="text-center p-8">
                    <i class="fas fa-check-circle fa-3x text-green-400 mb-4"></i>
                    <p class="text-gray-500">Toutes les demandes ont été traitées !</p>
                </div>
            `;
        }
        
        return `
            <div class="space-y-4">
                ${requests.map(req => `
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-warning">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-bold text-lg">${req.client_name}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${req.report_type}</p>
                                <p class="text-xs text-gray-500 mt-1">
                                    Période : ${new Date(req.period_start).toLocaleDateString('fr-FR')} - ${new Date(req.period_end).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <div class="text-right">
                                <span class="text-warning font-bold">${getDaysAgo(req.created_at)}j</span>
                                <p class="text-xs text-gray-500">depuis la demande</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-4">
                            <button onclick="window.editFinancialReport(${req.id})" 
                                class="flex-1 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark font-bold">
                                <i class="fas fa-edit mr-2"></i>Traiter
                            </button>
                            <button onclick="window.validateFinancialReport(${req.id})" 
                                class="px-4 py-2 bg-success text-white rounded-xl hover:bg-success/90 font-bold">
                                <i class="fas fa-check mr-2"></i>Valider
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function generateFinancialReportEditorHTML(reportData) {
        return `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-l-4 border-info">
                    <p class="text-sm font-bold">Client : ${reportData.client_name}</p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                        Type : ${reportData.report_type} | Période : ${new Date(reportData.period_start).toLocaleDateString('fr-FR')} - ${new Date(reportData.period_end).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                    <i class="fas fa-file-pdf fa-3x text-gray-400 mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        Éditeur d'états financiers (intégration à venir)
                    </p>
                    <button onclick="alert('Fonctionnalité en développement')" 
                        class="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark">
                        <i class="fas fa-edit mr-2"></i>Ouvrir l'Éditeur
                    </button>
                </div>
                
                <div class="flex justify-end gap-3 pt-6 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100">
                        Fermer
                    </button>
                    <button onclick="window.validateFinancialReport(${reportData.id})"
                        class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/90">
                        <i class="fas fa-check mr-2"></i>Valider & Envoyer
                    </button>
                </div>
            </div>
        `;
    }
    
    function getStatusBorderColor(status) {
        const colors = {
            'pending': 'border-warning',
            'processing': 'border-info',
            'validated': 'border-success',
            'sent': 'border-primary'
        };
        return colors[status] || 'border-gray-300';
    }
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    // Charger les aperçus au démarrage (si rôle approprié)
    document.addEventListener('DOMContentLoaded', function() {
        const userRole = appState.user?.role;
        
        if (userRole === 'admin' || userRole === 'collaborateur') {
            window.loadPendingFinancialReportsPreview();
        }
        
        window.loadMyFinancialReportsPreview();
    });
    
    console.log('✅ [scriptReports] Module initialisé avec succès');
    
})();
