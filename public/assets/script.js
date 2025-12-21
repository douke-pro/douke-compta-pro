// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.6 - CORRECTIONS PROFIL & GESTION ADMIN
// =================================================================================

// =================================================================================
// 0. CONFIGURATION GLOBALE ET GESTIONNAIRES
// =================================================================================

// Définition de l'URL de base de l'API Odoo (Render Backend)
const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD
    ? 'https://douke-compta-pro.onrender.com' // TODO: Remplacer par l'URL finale de votre backend
    : 'http://localhost:3000';

// État global de l'application
window.app = {
    userContext: null, // Contient { token, profile, name, accessible_companies }
    currentProfile: null,
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL', // 'NORMAL' ou 'MINIMAL'
    filteredData: { entries: [], accounts: [] }, // Données comptables du dossier actif
    companiesList: [], // Liste complète des entreprises accessibles
    UI_LOADED: false // Indique si l'interface a été rendue une première fois
};

// ------------------- GESTIONNAIRES D'INTERFACE UTILISATEUR (CONSERVÉS) -------------------

const NotificationManager = {
    show: (type, title, message, duration = 5000) => {
        const zone = document.getElementById('notification-zone');
        if (!zone) {
            console.warn(`[NOTIF] ${title} (${type}): ${message}`);
            return;
        }
        // Simplified rendering for example
        const html = `<div class="notification p-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border-l-4 border-info transition-all duration-300">
            <p class="font-bold">${title}</p><p class="text-sm">${message}</p>
            </div>`;
        const el = document.createElement('div');
        el.innerHTML = html.trim();
        zone.prepend(el.firstChild);
        setTimeout(() => el.firstChild.remove(), duration);
    }
};
window.unifiedManager = { notificationManager: NotificationManager };

const ModalManager = {
    open: (title, subtitle, contentHTML) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-subtitle').textContent = subtitle;
        document.getElementById('modal-body').innerHTML = contentHTML;
        document.body.classList.add('modal-open');
    },
    close: () => {
        document.body.classList.remove('modal-open');
    }
};

document.getElementById('modal-close-btn')?.addEventListener('click', ModalManager.close);

const CacheManager = {
    get: (key) => { return null; },
    set: (key, data, ttl) => { console.log(`[CACHE] Mise en cache de ${key}`); },
    clearCache: () => { console.log('[CACHE] Cache nettoyé.'); }
};

// =================================================================================
// 1. SERVICES D'API & AUTHENTIFICATION
// =================================================================================

async function apiFetch(endpoint, options = {}) {
    const token = window.app.userContext?.token;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: headers,
        });

        if (response.status === 401) {
            handleLogout();
            NotificationManager.show('danger', 'Session expirée', 'Veuillez vous reconnecter.');
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Erreur API: ${response.status} pour ${endpoint}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur dans apiFetch:", error);
        throw error;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.innerHTML = `<div class="loading-spinner w-5 h-5 border-white"></div>`;
    submitBtn.disabled = true;

    try {
        // TODO: REMPLACER PAR VOTRE VRAI APPEL API LOGIN
        // const response = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });

        // SIMULATION DE RÉPONSE Odoo (avec les NOUVEAUX NOMS de profil)
        let profile = 'USER';
        if (email.includes('admin')) profile = 'ADMIN';
        else if (email.includes('collab')) profile = 'COLLABORATEUR';
        else if (email.includes('caissier')) profile = 'CAISSIER';
        
        const mockResponse = {
            token: 'valid_jwt_token_12345',
            name: email.includes('admin') ? 'Admin DOUKÈ' : 'User Standard',
            profile: profile,
            // Les entreprises accessibles sont filtrées par Odoo, ce qui garantit la restriction du COLLABORATEUR
            accessible_companies: [
                { id: 1, name: 'Alpha Solutions SA', systeme: 'NORMAL' },
                { id: 2, name: 'Beta Consulting SARL', systeme: 'MINIMAL' },
                { id: 3, name: 'Gamma Holding S.A.', systeme: 'NORMAL' },
            ]
        };

        window.app.userContext = mockResponse;
        window.app.currentProfile = mockResponse.profile;
        window.app.companiesList = mockResponse.accessible_companies;

        if (window.app.companiesList.length > 0) {
            switchCompany(window.app.companiesList[0].id);
        } else {
            renderDashboardView(); 
        }

        NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${window.app.userContext.name} (${window.app.currentProfile})!`, 3000);
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');

    } catch (error) {
        NotificationManager.show('danger', 'Échec de la connexion', error.message, 5000);
    } finally {
        submitBtn.innerHTML = `<span>ACCÉDER AU SYSTÈME</span><i class="fas fa-arrow-right ml-3 text-sm opacity-50"></i>`;
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    window.app.userContext = null;
    window.app.currentCompanyId = null;
    window.app.currentCompanyName = null;
    window.app.filteredData.entries = [];
    CacheManager.clearCache();

    renderLoginView();
    NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}

// =================================================================================
// 2. LOGIQUE DE RENDU DU DASHBOARD PAR PROFIL
// =================================================================================

function updateSecureUserInfo() {
    const user = window.app.userContext;
    const companyName = window.app.currentCompanyName || "-- Aucune sélectionnée --";

    document.getElementById('current-role').textContent = user?.profile || 'N/A';
    document.getElementById('welcome-message').textContent = user ? `Hello, ${user.name.split(' ')[0]}!` : 'Chargement...';
    document.getElementById('user-avatar-text').textContent = user ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('current-company-name').textContent = companyName;
    document.getElementById('context-message').textContent = `Dossier Actif : ${companyName}`;
}


function createNavItem(text, icon, action, active = false) {
    const baseClasses = "flex items-center p-4 rounded-xl transition-all font-bold group";
    const activeClasses = "bg-primary text-white shadow-lg shadow-primary/30";
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
    const iconBase = "fas mr-4 w-5 text-center";

    return `
        <button onclick="loadModule('${action}')" class="${baseClasses} ${active ? activeClasses : inactiveClasses}" data-module="${action}">
            <i class="${iconBase} ${icon}"></i>
            <span>${text}</span>
        </button>
    `;
}

/**
 * Configure le menu de navigation selon le profil utilisateur (MISE À JOUR DES PROFILS).
 */
function renderRoleNavigation() {
    const menu = document.getElementById('role-navigation-menu');
    menu.innerHTML = '';

    const navItems = {
        'ADMIN': [
            ['Vue Globale', 'fa-layer-group', 'global_dashboard'],
            ['Gestion Utilisateurs', 'fa-users-cog', 'user_management'], // Module Admin
            ['Comptabilité', 'fa-balance-scale', 'accounting_menu'],
            ['Audit & Logs', 'fa-shield-alt', 'audit_logs'],
        ],
        'USER': [ // Nouveau profil USER (Pilotage Stratégique / Manager)
            ['Pilotage', 'fa-tachometer-alt', 'ceo_dashboard'],
            ['Résultat & Bilan', 'fa-file-invoice-dollar', 'reports_syscohada'],
            ['Trésorerie', 'fa-wallet', 'cash_flow'],
            ['Journal & Grand Livre', 'fa-book-open', 'grand_livre'],
        ],
        'CAISSIER': [ // Nouveau profil CAISSIER (Saisie Rapide / Trésorerie)
            ['Synthèse Caisse', 'fa-chart-line', 'quick_entry_dashboard'],
            ['Saisie Rapide Débit/Crédit', 'fa-keyboard', 'quick_entry'],
            ['Rapports de Caisse', 'fa-file-invoice', 'cash_reports'],
        ],
        'COLLABORATEUR': [
            ['Portefeuille Clients', 'fa-briefcase', 'collab_dashboard'],
            ['Consulter Mes Clients', 'fa-search', 'client_consultation'],
            ['Balance Simplifiée', 'fa-calculator', 'reports_syscohada'],
        ]
    };

    const items = navItems[window.app.currentProfile] || navItems['USER'];

    items.forEach(([text, icon, action]) => {
        menu.innerHTML += createNavItem(text, icon, action);
    });
}

/**
 * Ajout du sélecteur d'entreprise dans l'en-tête (MISE À JOUR DES PROFILS).
 */
function renderHeaderSelectors() {
    const quickActions = document.getElementById('quick-actions');
    const user = window.app.userContext;

    document.getElementById('company-selector-container')?.remove();

    // SÉLECTEUR RIGOUROUX : Disponible pour ADMIN et COLLABORATEUR (et tout autre rôle défini comme multi-dossier)
    if (user && ['ADMIN', 'COLLABORATEUR'].includes(user.profile)) {
        const selectHTML = `
            <div id="company-selector-container" class="relative">
                <select id="company-selector" onchange="switchCompany(this.value)"
                    class="p-2 border border-primary dark:border-primary-light bg-primary text-white dark:bg-primary-dark rounded-xl text-sm font-bold shadow-lg shadow-primary/30 outline-none transition-all">
                    ${window.app.companiesList.map(c => `
                        <option value="${c.id}" ${c.id == window.app.currentCompanyId ? 'selected' : ''}>
                            ${c.name}
                        </option>
                    `).join('')}
                </select>
                <i class="fas fa-building absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none"></i>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectHTML;
        quickActions.insertBefore(tempDiv.firstChild, quickActions.firstChild);
    }
}


function renderDashboardView() {
    updateSecureUserInfo();
    renderRoleNavigation();
    renderHeaderSelectors();

    const defaultModule = {
        'ADMIN': 'global_dashboard',
        'USER': 'ceo_dashboard',
        'CAISSIER': 'quick_entry_dashboard',
        'COLLABORATEUR': 'collab_dashboard',
    }[window.app.currentProfile] || 'ceo_dashboard';

    loadModule(defaultModule, true);
}


async function switchCompany(companyId) {
    const company = window.app.companiesList.find(c => c.id == companyId);
    if (!company) {
        NotificationManager.show('danger', 'Erreur', 'Entreprise non trouvée.', 3000);
        return;
    }

    window.app.currentCompanyId = company.id;
    window.app.currentCompanyName = company.name;
    window.app.currentSysteme = company.systeme;

    updateSecureUserInfo();
    NotificationManager.show('info', 'Changement de Contexte', `Dossier actif: ${company.name}`, 3000);

    const activeModule = document.querySelector('#role-navigation-menu button[data-active="true"]')?.dataset.module || 'ceo_dashboard';
    await loadModule(activeModule, true);
}

// =================================================================================
// 3. LOGIQUE DE CHARGEMENT DES MODULES ET RAPPORTS SYSCOHADA
// =================================================================================

async function fetchAccountingData() {
    // ... (Logique fetch inchangée, utilise apiFetch)
    const companyId = window.app.currentCompanyId;
    if (!companyId) return { entries: [], accounts: [] };

    const cacheKey = `data_${companyId}`;
    const cachedData = CacheManager.get(cacheKey);
    if (cachedData) return cachedData;

    try {
        // TODO: REMPLACER PAR VOTRE VRAI APPEL API
        // const data = await apiFetch(`/api/accounting/data/${companyId}`);
        
        // Mock de données (conservé pour le développement)
        const mockData = {
            entries: [
                { id: 101, date: '2025-10-01', journal: 'JA', compte: 411000, libelle: 'Facture Vente Alpha', debit: 500000, credit: 0, status: 'Validé' },
                { id: 102, date: '2025-10-01', journal: 'JA', compte: 701000, libelle: 'Vente Marchandises', debit: 0, credit: 500000, status: 'Validé' },
                { id: 103, date: '2025-10-02', journal: 'CA', compte: 571000, libelle: 'Encaissement Client', debit: 100000, credit: 0, status: 'Validé' },
                { id: 104, date: '2025-10-02', journal: 'CA', compte: 411000, libelle: 'Règlement Facture 101', debit: 0, credit: 100000, status: 'Validé' },
            ],
            accounts: [
                { code: 411000, name: 'Clients' },
                { code: 701000, name: 'Ventes' },
                { code: 571000, name: 'Caisse' },
            ]
        };
        
        CacheManager.set(cacheKey, mockData, 300000); // Cache 5 min
        return mockData;

    } catch (error) {
        NotificationManager.show('danger', 'Erreur de Données', 'Impossible de charger les données comptables. Vérifiez le backend Odoo.', 5000);
        return { entries: [], accounts: [] };
    }
}

async function loadModule(moduleName, forceReload = false) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-10 flex items-center justify-center"><div class="loading-spinner"></div><span class="ml-4 text-primary">Chargement du module ${moduleName}...</span></div>`;

    // Mise à jour de la classe active dans le menu
    document.querySelectorAll('#role-navigation-menu button').forEach(btn => {
        btn.dataset.active = (btn.dataset.module === moduleName).toString();
        btn.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
        btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        if (btn.dataset.active === 'true') {
            btn.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/30');
            btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        }
    });

    if (['ceo_dashboard', 'grand_livre', 'reports_syscohada', 'quick_entry_dashboard'].includes(moduleName)) {
        window.app.filteredData = await fetchAccountingData();
        if (window.app.filteredData.entries.length === 0 && !window.app.currentProfile.includes('ADMIN')) {
             contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Aucune donnée comptable trouvée pour ce dossier.</p><p>Veuillez vérifier l'intégration Odoo ou la période sélectionnée.</p></div>`;
             return;
        }
    }

    // Rendu spécifique du module
    switch (moduleName) {
        case 'global_dashboard':
        case 'collab_dashboard':
        case 'ceo_dashboard':
        case 'quick_entry_dashboard':
            renderGeneralDashboard(contentArea);
            break;
        case 'user_management':
            renderUserManagementModule(contentArea); // NOUVEAU RENDU DÉTAILLÉ
            break;
        case 'journal_entry':
            renderJournalEntryModule(contentArea);
            break;
        case 'grand_livre':
        case 'reports_syscohada':
            renderGrandLivreModule(contentArea);
            break;
        default:
            contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-cogs fa-3x text-gray-400 mb-4"></i><p class="text-xl font-bold">Module en construction...</p></div>`;
            break;
    }
}


// ------------------- NOUVEAU RENDU : GESTION DES UTILISATEURS (P2 CORRIGÉ) -------------------

function renderUserManagementModule(contentArea) {
    if (window.app.currentProfile !== 'ADMIN') {
         contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-lock fa-3x text-danger mb-4"></i><p class="text-xl font-bold text-danger">Accès Refusé</p><p>Seul un administrateur peut gérer les utilisateurs.</p></div>`;
         return;
    }

    const mockUsers = [
        { id: 1, name: 'Jean Dupont', email: 'jean@collab.com', profile: 'COLLABORATEUR', companies: 2, lastLogin: '2025-12-20' },
        { id: 2, name: 'Marie Chef', email: 'marie@user.com', profile: 'USER', companies: 1, lastLogin: '2025-12-18' },
        { id: 3, name: 'Patrice Caisse', email: 'patrice@caissier.com', profile: 'CAISSIER', companies: 1, lastLogin: '2025-12-20' },
    ];

    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Gestion des Utilisateurs & Affectation des Dossiers</h2>
        <div class="space-y-8 fade-in">
            <div class="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 class="text-xl font-black">Liste des Utilisateurs</h3>
                <button onclick="showCreateUserModal()" class="px-5 py-2 bg-success text-white rounded-xl font-bold hover:bg-green-600 transition-colors">
                    <i class="fas fa-user-plus mr-2"></i> Créer un Nouvel Utilisateur
                </button>
            </div>

            <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <table class="report-table w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Profil</th>
                            <th>Dossiers Actifs</th>
                            <th>Dernière Connexion</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockUsers.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td><span class="font-black text-sm p-1 rounded-md text-white ${user.profile === 'ADMIN' ? 'bg-danger' : (user.profile === 'COLLABORATEUR' ? 'bg-info' : 'bg-secondary')}">${user.profile}</span></td>
                                <td>${user.companies} / ${window.app.companiesList.length}</td>
                                <td>${user.lastLogin}</td>
                                <td>
                                    <button onclick="showAssignmentModal(${user.id}, '${user.name}')" class="text-primary hover:text-primary-dark mr-3"><i class="fas fa-link"></i> Affecter</button>
                                    <button onclick="showEditUserModal(${user.id})" class="text-warning hover:text-orange-600"><i class="fas fa-edit"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Stubs pour la modal d'affectation (pour valider le flux)
function showAssignmentModal(userId, userName) {
    const companyOptions = window.app.companiesList.map(c => `
        <label class="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <input type="checkbox" name="company" value="${c.id}" class="rounded text-primary focus:ring-primary">
            <span>${c.name} (${c.systeme})</span>
        </label>
    `).join('');
    
    ModalManager.open(
        `Affecter Dossiers à ${userName}`,
        `Définir le portefeuille d'entreprises pour le collaborateur ${userName}.`,
        `
        <form id="assignment-form" class="space-y-4">
            <div class="space-y-2">${companyOptions}</div>
            <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-colors">
                <i class="fas fa-save mr-2"></i> Sauvegarder les Affectations
            </button>
        </form>
        `
    );
    // TODO: Ajouter la logique de soumission du formulaire qui appelle /api/admin/assign-company
}
function showCreateUserModal() { NotificationManager.show('info', 'Création', 'Modal de création d\'utilisateur en cours de développement.'); }
function showEditUserModal() { NotificationManager.show('info', 'Modification', 'Modal de modification d\'utilisateur en cours de développement.'); }

// ------------------- FONCTIONS DE RENDU SPÉCIFIQUES (INCHANGÉES DANS LE PRINCIPE) -------------------

function renderGeneralDashboard(contentArea) {
    // ... (Logique de rendu des cartes KPI et Chart.js)
    const data = window.app.filteredData.entries;
    const isNormalSystem = window.app.currentSysteme === 'NORMAL';
    const totalRevenue = data.filter(e => e.compte >= 70 && e.compte < 80).reduce((sum, e) => sum + e.credit, 0); 
    const totalExpenses = data.filter(e => e.compte >= 60 && e.compte < 70).reduce((sum, e) => sum + e.debit, 0); 
    const totalCash = data.filter(e => e.compte >= 570000 && e.compte < 580000).reduce((sum, e) => sum + e.debit - e.credit, 0) || 12500000;

    contentArea.innerHTML = `
        <div class="space-y-8 fade-in">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Tableau de Bord | ${window.app.currentProfile}</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-coins mr-2"></i> Trésorerie Actuelle</p>
                    <h3 class="text-3xl font-black text-primary mt-2">${totalCash.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-hand-holding-usd mr-2"></i> Chiffre d'Affaires YTD</p>
                    <h3 class="text-3xl font-black text-success mt-2">${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-money-bill-wave mr-2"></i> Marge Nette Estimée</p>
                    <h3 class="text-3xl font-black text-info mt-2">${(totalRevenue - totalExpenses).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-chart-pie mr-2"></i> Système Comptable</p>
                    <h3 class="text-3xl font-black text-secondary mt-2">${isNormalSystem ? 'NORMAL' : 'MINIMAL'}</h3>
                </div>
            </div>
            <div class="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 class="font-black text-lg mb-4">Évolution des Flux (Revenus vs Dépenses)</h3>
                <canvas id="mainChart" height="100"></canvas>
            </div>
        </div>
    `;

    const ctx = document.getElementById('mainChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
            datasets: [
                {
                    label: 'Revenus',
                    data: [totalRevenue * 0.1, totalRevenue * 0.15, totalRevenue * 0.3, totalRevenue * 0.25, totalRevenue * 0.2],
                    backgroundColor: 'rgba(93, 92, 222, 0.7)',
                    borderColor: '#5D5CDE',
                    borderWidth: 1,
                },
                {
                    label: 'Dépenses',
                    data: [totalExpenses * 0.1, totalExpenses * 0.12, totalExpenses * 0.2, totalExpenses * 0.25, totalExpenses * 0.33],
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}


function renderJournalEntryModule(contentArea) {
    // ... (Saisie de pièce - inchangé)
    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Saisie d'une Nouvelle Pièce Comptable</h2>
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 fade-in">
            <p class="text-gray-500 mb-6">Création de la pièce dans le journal **${window.app.currentSysteme === 'NORMAL' ? 'Standard' : 'Simplifié'}**.</p>
            <div class="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <p class="text-gray-400 italic">Formulaire de Saisie (Compte Débit/Crédit, Montant, Libellé) en cours de développement...</p>
            </div>
            <button onclick="NotificationManager.show('info', 'Saisie', 'Fonctionnalité en cours de raccordement à l\'API Odoo pour la création de la pièce.', 3000)" class="mt-6 bg-success hover:bg-green-600 text-white font-black py-3 px-6 rounded-xl transition-colors">
                <i class="fas fa-plus mr-2"></i> Valider l'Écriture
            </button>
        </div>
    `;
}

function renderGrandLivreModule(contentArea) {
    // ... (Grand Livre / Balance - inchangé)
    contentArea.innerHTML = `
        <h2 class="text-3xl font-black text-primary dark:text-white mb-6">Grand Livre & Balance</h2>
        
        <div class="flex space-x-4 mb-6">
            <button onclick="displayAccountingReport('Grand Livre')" class="px-5 py-2 bg-primary text-white rounded-xl font-bold transition-all hover:shadow-lg">
                <i class="fas fa-book mr-2"></i> Afficher Grand Livre
            </button>
            <button onclick="displayAccountingReport('Balance')" class="px-5 py-2 bg-secondary text-white rounded-xl font-bold transition-all hover:shadow-lg">
                <i class="fas fa-calculator mr-2"></i> Afficher Balance Générale
            </button>
            <button onclick="displayAccountingReport('Journal')" class="px-5 py-2 bg-info text-white rounded-xl font-bold transition-all hover:shadow-lg">
                <i class="fas fa-clipboard-list mr-2"></i> Afficher Journal
            </button>
        </div>

        <div id="accounting-report-area" class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 min-h-[500px] flex items-center justify-center fade-in">
             <p class="text-gray-400 italic">Sélectionnez un rapport ci-dessus...</p>
        </div>
    `;
}


function displayAccountingReport(reportType) {
    // ... (Rapport dans Modale - inchangé, incluant les boutons PDF/Excel)
    if (!window.app.currentCompanyId) {
        return NotificationManager.show('warning', 'Alerte', 'Sélectionnez d\'abord une entreprise.', 3000);
    }
    
    const reportHTML = `
        <div class="overflow-x-auto">
        <table class="report-table w-full whitespace-nowrap">
            <thead>
                <tr>
                    <th>Compte</th>
                    <th>Libellé</th>
                    <th>Date</th>
                    <th class="text-right">Débit</th>
                    <th class="text-right">Crédit</th>
                </tr>
            </thead>
            <tbody>
                ${window.app.filteredData.entries.slice(0, 5).map(e => `
                    <tr>
                        <td>${e.compte}</td>
                        <td>${e.libelle}</td>
                        <td>${e.date}</td>
                        <td class="text-right">${(e.debit || 0).toLocaleString('fr-FR')}</td>
                        <td class="text-right">${(e.credit || 0).toLocaleString('fr-FR')}</td>
                    </tr>
                `).join('')}
                <tr>
                    <td colspan="3" class="font-black text-right bg-gray-50 dark:bg-gray-900">TOTAUX (MOCK)</td>
                    <td class="font-black text-right bg-gray-50 dark:bg-gray-900">10,800,000</td>
                    <td class="font-black text-right bg-gray-50 dark:bg-gray-900">10,800,000</td>
                </tr>
            </tbody>
        </table>
        </div>
        <div class="mt-4 text-sm text-gray-500">
            <p>Ce rapport affiche des données simplifiées pour démonstration. Le calcul réel du ${reportType} est effectué sur le backend Odoo.</p>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
            <button onclick="exportReportToExcel('${reportType}')" class="px-4 py-2 bg-success/10 text-success rounded-lg font-medium hover:bg-success/20 transition">
                <i class="fas fa-file-excel mr-2"></i> Export Excel
            </button>
            <button onclick="exportReportToPDF('${reportType}')" class="px-4 py-2 bg-danger/10 text-danger rounded-lg font-medium hover:bg-danger/20 transition">
                <i class="fas fa-file-pdf mr-2"></i> Export PDF
            </button>
        </div>
    `;

    ModalManager.open(
        `${reportType} | ${window.app.currentCompanyName}`,
        `SYSCOHADA Révisé - Système ${window.app.currentSysteme}`,
        reportHTML
    );
}


function exportReportToExcel(reportName) {
    NotificationManager.show('success', 'Export Excel', `Génération du fichier Excel pour le ${reportName}...`, 3000);
    // TODO: Appel API Odoo pour génération/téléchargement Excel
}

function exportReportToPDF(reportName) {
    NotificationManager.show('success', 'Export PDF', `Génération du fichier PDF pour le ${reportName}...`, 3000);
    // TODO: Appel API Odoo pour génération/téléchargement PDF
}

// ------------------- RENDU DES VUES COMPLÈTES -------------------

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('register-view').classList.add('hidden');
}


function toggleAuthView(showRegister) {
    document.getElementById('login-form-container').classList.toggle('hidden', showRegister);
    document.getElementById('register-view').classList.toggle('hidden', !showRegister);
}

// =================================================================================
// 4. ÉCOUTEURS D'ÉVÉNEMENTS ET INITIALISATION
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        ModalManager.open(
            'Confirmation de Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter du système DOUKÈ PRO ?',
            `
            <p>Vos données de session seront effacées.</p>
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="ModalManager.close()" class="px-4 py-2 border rounded-xl hover:bg-gray-100">Annuler</button>
                <button onclick="handleLogout(); ModalManager.close();" class="px-4 py-2 bg-danger text-white rounded-xl hover:bg-red-600 font-bold">Confirmer</button>
            </div>
            `
        );
    });

    document.getElementById('show-register-btn')?.addEventListener('click', () => toggleAuthView(true));
    document.getElementById('show-login-btn')?.addEventListener('click', () => toggleAuthView(false));
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        NotificationManager.show('warning', 'Enregistrement', 'Fonctionnalité d\'enregistrement non raccordée à l\'API Odoo pour le moment.', 5000);
    });

    renderLoginView();

    // Auto-login de démonstration pour un test rapide du dashboard (à retirer en prod)
    if (!IS_PROD && window.location.hash === '#dev') {
        const mockEvent = { preventDefault: () => {} };
        document.getElementById('email').value = 'admin@douke.com';
        document.getElementById('password').value = 'password';
        handleLogin(mockEvent); 
    }

    console.log(' ╔═══════════════════════════════════════════════════════════╗ ');
    console.log(' ║        🚀  DOUKÈ COMPTA PRO v1.6 - Système Unifié         ║ ');
    console.log(` ║        📡  API: ${API_BASE_URL.padEnd(43)} ║ `);
    console.log(' ╚═══════════════════════════════════════════════════════════╝ ');
});

// Rendre les fonctions d'action spécifiques disponibles globalement pour l'onclick
window.displayAccountingReport = displayAccountingReport;
window.loadModule = loadModule;
window.exportReportToExcel = exportReportToExcel;
window.exportReportToPDF = exportReportToPDF;
window.switchCompany = switchCompany;
window.showAssignmentModal = showAssignmentModal;
window.showCreateUserModal = showCreateUserModal;
window.showEditUserModal = showEditUserModal;
