// public/assets/script.js
// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète et unifiée de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.8 - CORRECTION ROBUSTE API & AFFICHAGE
// =================================================================================

// =================================================================================
// 0. CONFIGURATION GLOBALE ET GESTIONNAIRES UNIFIÉS
// =================================================================================

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD
  ? 'https://douke-compta-pro.onrender.com'
  : 'http://localhost:3000';

// État global de l'application
window.app = {
  userContext: {
    token: null,
    profile: null,
    name: null,
    email: null,
  },
  currentProfile: null,
  currentCompanyId: null,
  currentCompanyName: null,
  currentSysteme: 'NORMAL',
  filteredData: {
    entries: [],
    accounts: [],
    report: null,
  },
  companiesList: [],
};

// =================================================================================
// GESTIONNAIRE DE NOTIFICATIONS (MANAGER)
// =================================================================================

const NotificationManager = {
  show: (type, title, message, duration = 5000) => {
    const container = document.getElementById('notification-zone');
    if (!container) return;

    const colors = {
      success: 'bg-success border-success/50',
      danger: 'bg-danger border-danger/50',
      warning: 'bg-warning border-warning/50',
      info: 'bg-info border-info/50',
      primary: 'bg-primary border-primary/50',
    };

    const icons = {
      success: 'fa-check-circle',
      danger: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle',
      primary: 'fa-bell',
    };

    const notification = document.createElement('div');
    notification.className = `notification w-80 p-4 rounded-xl text-white shadow-2xl transition-all duration-500 ease-in-out transform opacity-0 translate-x-full ${colors[type]}`;
    notification.innerHTML = `
      <div class="flex items-start">
        <i class="fas ${icons[type]} mr-3 mt-1"></i>
        <div>
          <strong class="text-lg">${title}</strong>
          <p class="text-sm mt-1">${message}</p>
        </div>
      </div>
    `;
    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 50);

    setTimeout(() => {
      notification.classList.remove('translate-x-0', 'opacity-100');
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => notification.remove(), 500);
    }, duration);
  },
};

// =================================================================================
// GESTIONNAIRE DE MODALES (MANAGER)
// =================================================================================

const ModalManager = {
  open: (title, subtitle, bodyHTML) => {
    const modalContainer = document.getElementById('professional-modal');
    if (!modalContainer) return;

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = subtitle;
    document.getElementById('modal-body').innerHTML = bodyHTML;

    modalContainer.classList.add('modal-open');
    document.body.classList.add('overflow-hidden');
  },
  close: () => {
    const modalContainer = document.getElementById('professional-modal');
    if (!modalContainer) return;

    modalContainer.classList.remove('modal-open');
    document.body.classList.remove('overflow-hidden');
  },
};

// =================================================================================
// MOCK DE DONNÉES ET FONCTIONS D'UTILITÉS API
// =================================================================================

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = window.app.userContext.token;
  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_) {}

  if (!response.ok) {
    const errorMessage = data.message || data.error || `Erreur ${response.status} sur ${endpoint}.`;
    throw new Error(errorMessage);
  }

  return data;
}

window.app.MOCK_COMPANIES = [
  { id: 101, name: 'SYSTÈME NORMAL Sarl', systeme: 'NORMAL' },
  { id: 102, name: 'MINIMAL TRESO PME', systeme: 'MINIMAL' },
  { id: 103, name: 'DOUKÈ HOLDING SA', systeme: 'NORMAL' },
];

window.app.MOCK_USERS = [
  { email: 'admin@douke.com', password: 'password', profile: 'ADMIN', name: 'Jean Dupont (Admin)', total_caisses: 3, active_caisses: 2 },
  { email: 'collab@douke.com', password: 'password', profile: 'COLLABORATEUR', name: 'Marie Collab', total_caisses: 0, active_caisses: 0 },
  { email: 'user@douke.com', password: 'password', profile: 'USER', name: 'Standard User', total_caisses: 1, active_caisses: 1 },
  { email: 'caissier@douke.com', password: 'password', profile: 'CAISSIER', name: 'Patrice Caisse', total_caisses: 2, active_caisses: 2 },
];

window.app.MOCK_ENTRIES = [
  { id: 1, date: '2025-12-01', journal: 'CA', compte: 571000, libelle: 'Vente comptant (CAISSE)', debit: 0, credit: 50000, status: 'Validé' },
  { id: 2, date: '2025-12-01', journal: 'CA', compte: 701000, libelle: 'Vente comptant (CAISSE)', debit: 50000, credit: 0, status: 'Validé' },
  { id: 3, date: '2025-12-02', journal: 'BQ', compte: 411000, libelle: 'Règlement client A', debit: 0, credit: 150000, status: 'En attente' },
  { id: 4, date: '2025-12-02', journal: 'BQ', compte: 521000, libelle: 'Règlement client A', debit: 150000, credit: 0, status: 'En attente' },
  { id: 5, date: '2025-12-03', journal: 'JA', compte: 601000, libelle: 'Achat marchandises Fourn. B', debit: 120000, credit: 0, status: 'Validé' },
  { id: 6, date: '2025-12-03', journal: 'JA', compte: 411000, libelle: 'Achat marchandises Fourn. B', debit: 0, credit: 120000, status: 'Validé' },
  { id: 7, date: '2025-12-04', journal: 'JV', compte: 611000, libelle: 'Frais de nettoyage bureau', debit: 5000, credit: 0, status: 'En attente' },
  { id: 8, date: '2025-12-04', journal: 'JV', compte: 571000, libelle: 'Frais de nettoyage bureau', debit: 0, credit: 5000, status: 'En attente' },
  { id: 9, date: '2025-12-05', journal: 'VD', compte: 701000, libelle: 'Vente de services X', debit: 0, credit: 350000, status: 'Validé' },
  { id: 10, date: '2025-12-05', journal: 'VD', compte: 411000, libelle: 'Vente de services X', debit: 350000, credit: 0, status: 'Validé' },
];

// Stubs pour éviter erreurs si non définis ailleurs
async function fetchAccountingData() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
}

function renderLoginView() {
  document.getElementById('dashboard-view')?.classList.add('hidden');
  document.getElementById('auth-view')?.classList.remove('hidden');
  document.getElementById('login-form-container')?.classList.remove('hidden');
  document.getElementById('register-view')?.classList.add('hidden');
}

// =================================================================================
// 1. GESTION D'AUTHENTIFICATION ET DE CONTEXTE
// =================================================================================

async function handleLogin(event) {
  if (event) event.preventDefault();

  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;
  const submitBtn = document.getElementById('login-submit-btn');
  const messageEl = document.getElementById('login-message');

  if (!submitBtn || !messageEl || !email || !password) {
    console.error("Erreur critique: Un élément du formulaire de connexion est manquant dans le DOM.");
    return;
  }

  submitBtn.innerHTML = '<div class="loading-spinner w-5 h-5 border-white"></div><span class="ml-3">Connexion en cours...</span>';
  submitBtn.disabled = true;
  messageEl.classList.add('hidden');

  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response || !response.data || typeof response.data !== 'object' || !response.data.token) {
      throw new Error("Authentification échouée. Veuillez vérifier vos identifiants.");
    }

    const { token, profile, name, companiesList, defaultCompany } = response.data;

    window.app.userContext = { token, profile, name, email };
    window.app.currentProfile = profile;
    window.app.companiesList = companiesList;
    window.app.currentCompanyId = defaultCompany.id;
    window.app.currentCompanyName = defaultCompany.name;
    window.app.currentSysteme = defaultCompany.systeme;

    // Persistence
    localStorage.setItem('douke_token', token);
    localStorage.setItem('douke_profile', profile);
    localStorage.setItem('douke_name', name);
    localStorage.setItem('douke_email', email);
    localStorage.setItem('douke_companies', JSON.stringify(companiesList || []));
    localStorage.setItem('douke_default_company', JSON.stringify(defaultCompany || null));

    await fetchAccountingData();
    renderAppView();
    NotificationManager.show('success', 'Connexion Réussie', `Bienvenue, ${name}!`, 5000);

  } catch (error) {
    let errorMessage;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = "Erreur de connexion au service. Veuillez vérifier le statut du backend (Render).";
    } else if (error.message.includes("Authentification échouée") || error.message.includes("401")) {
      errorMessage = "Échec de l'authentification. Identifiant ou mot de passe incorrect.";
    } else {
      errorMessage = error.message || "Erreur serveur inconnue.";
    }

    messageEl.className = 'p-4 rounded-xl text-center text-sm font-bold bg-danger/10 text-danger';
    messageEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i> ${errorMessage}`;
    messageEl.classList.remove('hidden');

    submitBtn.innerHTML = '<span>ACCÉDER AU SYSTÈME</span> <i class="fas fa-arrow-right ml-3 text-sm opacity-50"></i>';
    submitBtn.disabled = false;
  }
}

function handleLogout() {
  window.app.userContext = { token: null, profile: null, name: null, email: null };
  window.app.currentProfile = null;
  window.app.currentCompanyId = null;
  window.app.currentCompanyName = null;
  window.app.filteredData = { entries: [], accounts: [], report: null };

  localStorage.removeItem('douke_token');
  localStorage.removeItem('douke_profile');
  localStorage.removeItem('douke_name');
  localStorage.removeItem('douke_email');
  localStorage.removeItem('douke_companies');
  localStorage.removeItem('douke_default_company');

  renderLoginView();
  NotificationManager.show('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
}

function switchCompany(companyId) {
  const newCompany = window.app.companiesList.find(c => c.id == companyId);
  if (!newCompany) {
    NotificationManager.show('danger', 'Erreur', 'Entreprise non trouvée.', 3000);
    return;
  }

  window.app.currentCompanyId = newCompany.id;
  window.app.currentCompanyName = newCompany.name;
  window.app.currentSysteme = newCompany.systeme;

  localStorage.setItem('douke_default_company', JSON.stringify(newCompany));
  document.getElementById('current-company-name')?.textContent = newCompany.name;

  fetchAccountingData().then(() => {
    const currentModule = document.querySelector('.sidebar-link.active')?.dataset.module || 'dashboard';
    loadModule(currentModule, true);
    NotificationManager.show('primary', 'Changement de Dossier', `Dossier basculé sur **${newCompany.name}** (${newCompany.systeme}).`, 4000);
  }).catch(error => {
    console.error("Erreur de chargement de données après switch:", error);
  });
}

// =================================================================================
// 2. RENDU DE L'INTERFACE PRINCIPALE
// =================================================================================

function renderAppView() {
  document.getElementById('auth-view')?.classList.add('hidden');
  document.getElementById('dashboard-view')?.classList.remove('hidden');
  renderHeader();
  renderSidebar();
  loadModule('dashboard');
}

function renderSidebar() {
  const profile = window.app.currentProfile;
  const sidebar = document.getElementById('role-navigation-menu');
  let menuHTML = '';

  const menus = {
    ADMIN: [
      { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord Global' },
      { module: 'user_management', icon: 'fas fa-user-shield', label: 'Gestion des Utilisateurs' },
      { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
      { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre & Balances' },
      { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
      { module: 'audit_logs', icon: 'fas fa-clipboard-list', label: 'Journal d\'Audit' },
    ],
    COLLABORATEUR: [
      { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord' },
      { module: 'entries_validation', icon: 'fas fa-check-double', label: 'Validation des Écritures' },
      { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
      { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
      { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre & Balances' },
    ],
    USER: [
      { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Tableau de Bord Stratégique' },
      { module: 'financial_statements', icon: 'fas fa-balance-scale', label: 'États Financiers (SYSCOHADA)' },
      { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Saisie Rapide' },
      { module: 'grand_livre', icon: 'fas fa-book', label: 'Grand Livre' },
    ],
    CAISSIER: [
      { module: 'dashboard', icon: 'fas fa-chart-line', label: 'Synthèse de Caisse' },
      { module: 'quick_entry', icon: 'fas fa-plus-circle', label: 'Nouvelle Opération de Caisse' },
      { module: 'cash_movements', icon: 'fas fa-exchange-alt', label: 'Mouvements de Caisse' },
      { module: 'cash_reports', icon: 'fas fa-file-invoice-dollar', label: 'Clôtures et Rapports de Caisse' },
    ],
  };

  const currentMenu = menus[profile] || menus.USER;

  menuHTML = currentMenu.map(item => `
    <li>
      <a href="#" class="sidebar-link block py-3 px-4 rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20" data-module="${item.module}">
        <i class="${item.icon} w-6 mr-3"></i>
        <span class="font-medium">${item.label}</span>
      </a>
    </li>
  `).join('');

  sidebar.innerHTML = menuHTML;

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      loadModule(e.currentTarget.dataset.module);
    });
  });
}

function loadModule(moduleName, forceReload = false) {
  const contentArea = document.getElementById('dashboard-content-area');
  const profile = window.app.currentProfile;

  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active', 'bg-primary', 'text-white', 'hover:bg-primary/80'));

  const activeLink = document.querySelector(`.sidebar-link[data-module="${moduleName}"]`);
  if (activeLink) {
    activeLink.classList.add('active', 'bg-primary', 'text-white', 'hover:bg-primary/80');
    activeLink.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-primary/10', 'dark:hover:bg-primary/20');
  }

  if (!window.app.filteredData.report || forceReload) {
    contentArea.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Synchronisation des données...</p></div>`;
    fetchAccountingData().then(() => {
      renderSpecificModule(moduleName, contentArea, profile);
    }).catch(error => {
      console.error("Erreur critique de chargement des données:", error);
    });
    return;
  }

  renderSpecificModule(moduleName, contentArea, profile);
}

function renderSpecificModule(moduleName, contentArea, profile) {
  if (!window.app.currentCompanyId && moduleName !== 'user_management') {
    contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-building fa-3x text-warning mb-4"></i><p class="text-xl font-bold">Sélectionnez d'abord un dossier comptable.</p></div>`;
    return;
  }

  function renderDashboard(area, p) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Dashboard de base (Profil: ${p}) - Données prêtes!</div>`; }
  function renderCollaboratorDashboard(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Dashboard Collaborateur - Validation en cours.</div>`; }
  function renderCashierDashboard(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Dashboard Caissier - Mouvements de caisse.</div>`; }
  function renderUserManagementModule(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Gestion des Utilisateurs.</div>`; }
  function renderFinancialStatementsModule(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">États Financiers SYSCOHADA.</div>`; }
  function renderEntriesValidationModule(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Validation des Écritures.</div>`; }
  function renderQuickEntryModule(area) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Saisie Rapide.</div>`; }
  function renderStubModule(area, name) { area.innerHTML = `<div class="p-8 text-center text-gray-500">Module en cours d'implémentation: ${name}.</div>`; }

  switch (moduleName) {
    case 'dashboard':
      if (profile === 'COLLABORATEUR') {
        renderCollaboratorDashboard(contentArea);
      } else if (profile === 'CAISSIER') {
        renderCashierDashboard(contentArea);
      } else {
        renderDashboard(contentArea, profile);
      }
      break;
    case 'user_management':
      renderUserManagementModule(contentArea);
      break;
    case 'financial_statements':
      renderFinancialStatementsModule(contentArea);
      break;
    case 'entries_validation':
      if (profile === 'COLLABORATEUR' || profile === 'ADMIN') {
        renderEntriesValidationModule(contentArea);
      } else {
        contentArea.innerHTML = `<div class="text-center p-20 opacity-50"><i class="fas fa-lock fa-3x text-danger mb-4"></i><p class="text-xl font-bold text-danger">Accès Refusé</p><p>Seul un collaborateur ou un administrateur peut valider des écritures.</p></div>`;
      }
      break;
    case 'quick_entry':
      renderQuickEntryModule(contentArea);
      break;
    case 'grand_livre':
    case 'cash_flow':
    case 'audit_logs':
    case 'cash_movements':
    case 'cash_reports':
      renderStubModule(contentArea, moduleName);
      break;
    default:
      contentArea.innerHTML = `<div class="p-8 text-center text-gray-500">Module non implémenté: ${moduleName}</div>`;
  }
}

function renderHeader() {
  const header = document.getElementById('context-header');
  const profile = window.app.currentProfile;
  const companies = window.app.companiesList;
  const currentCompanyId = window.app.currentCompanyId;

  if (!profile) return;

  document.getElementById('welcome-message').textContent = window.app.userContext.name;
  document.getElementById('current-role').textContent = profile;
  document.getElementById('user-avatar-text').textContent = profile.charAt(0);

  const companyOptionsHTML = companies.map(c => `
    <option value="${c.id}" ${c.id === currentCompanyId ? 'selected' : ''}>
      ${c.name} (${c.systeme})
    </option>
  `).join('');

  const contextHTML = `
    <p class="text-xs font-black text-gray-400 uppercase mb-1">Dossier Actif / Sélection</p>
    <div class="flex items-center space-x-3">
      <i class="fas fa-briefcase text-primary dark:text-white"></i>
      <select id="company-selector" onchange="switchCompany(this.value)" class="bg-transparent text-xl font-black text-gray-900 dark:text-white border-none p-0 focus:ring-0 w-auto cursor-pointer outline-none">
        ${companies.length > 0 ? companyOptionsHTML : '<option>Pas de dossiers</option>'}
      </select>
    </div>
  `;
  header.innerHTML = contextHTML;

  const darkModeButton = document.querySelector('#quick-actions button');
  if (darkModeButton) {
    darkModeButton.onclick = function() {
      document.documentElement.classList.toggle('dark');
      const icon = this.querySelector('.fas');
      if (document.documentElement.classList.contains('dark')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    };
  }
}

// =================================================================================
// 3. LOGIQUE D'INITIALISATION ET D'ÉVÉNEMENTS
// =================================================================================

function checkAuthAndRender() {
  const savedToken = localStorage.getItem('douke_token');
  if (savedToken) {
    window.app.userContext.token = savedToken;
    window.app.userContext.profile = localStorage.getItem('douke_profile');
    window.app.userContext.name = localStorage.getItem('douke_name');
    window.app.userContext.email = localStorage.getItem('douke_email');

    const savedCompanies = localStorage.getItem('douke_companies');
    const savedDefaultCompany = localStorage.getItem('douke_default_company');

    window.app.companiesList = savedCompanies ? JSON.parse(savedCompanies) : [];
    const defCompany = savedDefaultCompany ? JSON.parse(savedDefaultCompany) : null;
    if (defCompany) {
      window.app.currentCompanyId = defCompany.id;
      window.app.currentCompanyName = defCompany.name;
      window.app.currentSysteme = defCompany.systeme;
    }
    window.app.currentProfile = window.app.userContext.profile;

    renderAppView();
    return;
  }
  renderLoginView();
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisation de la vue (Connexion ou Dashboard)
    checkAuthAndRender();

    // 2. Attachement du formulaire de connexion
    // NOTE: L'arrêt du rafraîchissement est maintenant garanti par l'attribut
    // onsubmit="handleLogin(event); return false;" dans index.html
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 3. Attachement des boutons de bascule Connexion <-> Inscription
    const loginContainer = document.getElementById('login-form-container');
    const registerView = document.getElementById('register-view');
    const showRegisterBtn = document.getElementById('show-register-btn'); // Le bouton "Créer un compte"
    const showLoginBtn = document.getElementById('show-login-btn');      // Le bouton "Retour à la connexion"
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
    
    // 4. Attachement des boutons de déconnexion et de Modale
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Attachement du bouton de fermeture de Modale (pour plus de robustesse)
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', ModalManager.close);
    }

    // 5. Outil de Dev (laissé intact)
    if (!IS_PROD && window.location.hash === '#dev') {
        document.getElementById('email').value = 'admin@douke.com';
        document.getElementById('password').value = 'password';
        const mockEvent = { preventDefault: () => {} };
        setTimeout(() => handleLogin(mockEvent), 500);
    }
});

// =================================================================================
// 3. LOGIQUE DE CHARGEMENT DES MODULES ET RENDU SPÉCIFIQUE
// =================================================================================

async function fetchAccountingData() {
  if (!window.app.currentCompanyId) {
    console.warn("Tentative de chargement des données sans Company ID sélectionné.");
    return { report: null, accounts: [], entries: [] };
  }

  const dashboardContent = document.getElementById('dashboard-content-area');
  if (dashboardContent) {
    dashboardContent.innerHTML = `<div class="text-center p-20"><div class="loading-spinner w-10 h-10 border-primary"></div><p class="mt-4 text-primary font-bold">Chargement des données comptables...</p></div>`;
  }

  try {
    const reportData = { chiffreAffaires: 5000000, chargesExploitation: 3000000 };

    const accountsMock = [
      { id: 1, code: 411000, name: 'Clients' },
      { id: 2, code: 701000, name: 'Ventes de biens' },
      { id: 3, code: 601000, name: 'Achats de Marchandises' },
      { id: 4, code: 521000, name: 'Banque' },
      { id: 5, code: 571000, name: 'Caisse' },
      { id: 6, code: 611000, name: 'Services extérieurs' },
      { id: 7, code: 211000, name: 'Terrains' },
    ];

    window.app.filteredData = {
      report: reportData,
      accounts: accountsMock,
      entries: window.app.MOCK_ENTRIES,
    };

    return window.app.filteredData;

  } catch (error) {
    NotificationManager.show('danger', 'Erreur de Chargement', `Impossible de charger les données : ${error.message}`, 8000);
    window.app.filteredData = { report: null, accounts: [], entries: [] };
    if (dashboardContent) {
      dashboardContent.innerHTML = `<div class="text-center p-20 text-danger"><i class="fas fa-exclamation-triangle fa-3x mb-4"></i><p class="text-xl font-bold">Échec de la connexion aux données comptables.</p><p>Vérifiez l'état de votre backend Express et si le service Odoo est accessible.</p></div>`;
    }
    throw error;
  }
}

function renderDashboard(contentArea, profile) {
  const data = window.app.filteredData.entries;
  const isNormalSystem = window.app.currentSysteme === 'NORMAL';

  const totalRevenue = data.filter(e => e.compte >= 700000 && e.compte < 800000).reduce((sum, e) => sum + e.credit, 0);
  const pendingEntries = data.filter(e => e.status === 'En attente').length;
  const totalCash = data.filter(e => e.compte === 571000).reduce((sum, e) => sum + (e.debit - e.credit), 0) + 1000000;

  let specificKPIs = '';
  if (profile === 'ADMIN') {
    const totalCollaborators = 3;
    const totalCompanies = window.app.companiesList.length;
    const avgCompanyPerCollab = (totalCompanies / totalCollaborators).toFixed(1);
    specificKPIs = `
      <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-info">
        <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-users mr-2"></i> Collaborateurs Actifs</p>
        <h3 class="text-2xl font-black text-info mt-2">${totalCollaborators}</h3>
      </div>
      <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
        <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-briefcase mr-2"></i> Dossiers / Collab (Moyenne)</p>
        <h3 class="text-2xl font-black text-secondary mt-2">${avgCompanyPerCollab}</h3>
      </div>
    `;
  } else if (profile === 'USER' || profile === 'CAISSIER') {
    const userMocks = window.app.MOCK_USERS.find(u => u.profile === profile);
    const totalCaisses = userMocks?.total_caisses || 0;
    const activeCaisses = userMocks?.active_caisses || 0;
    specificKPIs = `
      <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-info">
        <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-cash-register mr-2"></i> Caisses (Comptes 571) Crées</p>
        <h3 class="text-2xl font-black text-info mt-2">${totalCaisses}</h3>
      </div>
      <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
        <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-check-circle mr-2"></i> Caisses Actives / Actuelles</p>
        <h3 class="text-2xl font-black ${activeCaisses > 0 ? 'text-success' : 'text-danger'} mt-2">${activeCaisses}</h3>
      </div>
    `;
  }

  contentArea.innerHTML = `
    <div class="space-y-8 fade-in">
      <h2 class="text-3xl font-black text-gray-900 dark:text-white">Tableau de Bord ${profile === 'ADMIN' ? 'Global' : (profile === 'USER' ? 'Stratégique' : 'Opérationnel')}</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300">Synthèse du dossier <strong class="text-primary">${window.app.currentCompanyName}</strong></p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl-grid-cols-6 gap-6">
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-primary">
          <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-coins mr-2"></i> Trésorerie Actuelle (512/571)</p>
          <h3 class="text-2xl font-black text-primary mt-2">${totalCash.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-success">
          <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-hand-holding-usd mr-2"></i> Chiffre d'Affaires YTD (7xx)</p>
          <h3 class="text-2xl font-black text-success mt-2">${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-warning">
          <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-check-circle mr-2"></i> Écritures à Valider</p>
          <h3 class="text-2xl font-black ${pendingEntries > 0 ? 'text-danger' : 'text-success'} mt-2">${pendingEntries}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 border-l-4 border-secondary">
          <p class="text-gray-400 text-xs font-black uppercase"><i class="fas fa-chart-pie mr-2"></i> Système Comptable</p>
          <h3 class="text-2xl font-black text-secondary mt-2">${isNormalSystem ? 'NORMAL' : 'MINIMAL'}</h3>
        </div>
        ${specificKPIs}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="mt-4 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <h3 class="font-black text-lg mb-4">Évolution Mensuelle des Flux (Revenus vs Dépenses)</h3>
          <canvas id="mainChart" height="100"></canvas>
        </div>
        <div class="mt-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <h3 class="font-black text-lg mb-4 text-warning"><i class="fas fa-bell mr-2"></i> Alertes et Tâches Prioritaires</h3>
          <ul class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li><i class="fas fa-arrow-up text-success mr-2"></i> Forte croissance du CA (+12% ce mois)</li>
            ${pendingEntries > 0 ? `<li><i class="fas fa-exclamation-circle text-danger mr-2"></i> ${pendingEntries} écritures nécessitent une validation.</li>` : `<li><i class="fas fa-check text-success mr-2"></i> Aucune écriture en attente.</li>`}
            <li><i class="fas fa-calendar-alt text-info mr-2"></i> Date limite de clôture mensuelle (J+5).</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    if (typeof Chart !== 'undefined' && document.getElementById('mainChart')) {
      const ctx = document.getElementById('mainChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
          datasets: [
            { label: 'Revenus', data: [totalRevenue * 0.1, totalRevenue * 0.15, totalRevenue * 0.3, totalRevenue * 0.25, totalRevenue * 0.2, totalRevenue * 0.4].map(v => v / 100000), backgroundColor: 'rgba(93, 92, 222, 0.7)', borderColor: '#5D5CDE', borderWidth: 1 },
            { label: 'Dépenses', data: [totalCash * 0.1, totalCash * 0.12, totalCash * 0.2, totalCash * 0.25, totalCash * 0.33, totalCash * 0.5].map(v => v / 100000), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#EF4444', borderWidth: 1 }
          ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  }, 100);
}

function renderCollaboratorDashboard(contentArea) {
  const data = window.app.filteredData.entries;
  const pendingValidation = data.filter(e => e.status === 'En attente').length;
  const clientsCount = window.app.companiesList.length;
  const totalFees = 8000000;

  contentArea.innerHTML = `
    <div class="space-y-8 fade-in">
      <h2 class="text-3xl font-black text-gray-900 dark:text-white">Portefeuille et Suivi Collaborateur</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300">Gestion de l'intégrité et de la validation des écritures pour votre portefeuille.</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-info">
          <p class="text-gray-400 text-xs font-black uppercase">Entreprises Managées</p>
          <h3 class="text-2xl font-black text-info mt-2">${clientsCount}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-warning">
          <p class="text-gray-400 text-xs font-black uppercase">Écritures à Valider</p>
          <h3 class="text-2xl font-black ${pendingValidation > 0 ? 'text-danger' : 'text-success'} mt-2">${pendingValidation}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-primary">
          <p class="text-gray-400 text-xs font-black uppercase">Total Honoraires YTD</p>
          <h3 class="text-2xl font-black text-primary mt-2">${totalFees.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
        </div>
      </div>

      <div class="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <h3 class="font-black text-xl mb-4 text-primary">Tableau de Bord de Validation</h3>
        <p class="text-gray-500 mb-4">Concentrez-vous sur les actions nécessitant votre approbation.</p>
        <button onclick="loadModule('entries_validation')" class="mt-2 px-5 py-2 bg-success text-white rounded-XL font-bold hover:bg-green-600 transition-colors">
          <i class="fas fa-check-circle mr-2"></i> Accéder à la Validation (${pendingValidation} en attente)
        </button>
      </div>
    </div>
  `;
}

function renderCashierDashboard(contentArea) {
  const data = window.app.filteredData.entries;
  const totalCash = data.filter(e => e.compte === 571000).reduce((sum, e) => sum + (e.debit - e.credit), 0) + 10000;
  const todayTransactions = data.filter(e => e.journal === 'CA').length;

  contentArea.innerHTML = `
    <div class="space-y-8 fade-in">
      <h2 class="text-3xl font-black text-gray-900 dark:text-white">Synthèse et Opérations de Caisse</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300">Gestion des flux de trésorerie en espèces (Compte 571000).</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-success">
          <p class="text-gray-400 text-xs font-black uppercase">Solde Actuel de Caisse</p>
          <h3 class="text-2xl font-black text-success mt-2">${totalCash.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-primary">
          <p class="text-gray-400 text-xs font-black uppercase">Transactions Caisse du Jour</p>
          <h3 class="text-2xl font-black text-primary mt-2">${todayTransactions}</h3>
        </div>
        <div class="kpi-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border-l-4 border-danger">
          <p class="text-gray-400 text-xs font-black uppercase">Opérations en Attente (Rapprochement)</p>
          <h3 class="text-2xl font-black text-warning mt-2">0</h3>
        </div>
      </div>

      <div class="mt-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex justify-start space-x-4">
        <h3 class="font-black text-lg mr-4">Accès Rapide:</h3>
        <button onclick="loadModule('quick_entry')" class="px-5 py-2 bg-primary text-white rounded-XL font-bold hover:bg-primary-dark transition-colors">
          <i class="fas fa-plus-circle mr-2"></i> Nouvelle Opération
        </button>
        <button onclick="loadModule('cash_reports')" class="px-5 py-2 bg-secondary text-white rounded-XL font-bold hover:bg-secondary/80 transition-colors">
          <i class="fas fa-file-invoice mr-2"></i> Clôturer Caisse
        </button>
      </div>
    </div>
  `;
}

// ------------------- UTILITAIRES -------------------

function generateReportBlock(title, content, icon, modalTitle) {
  return `
    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-secondary fade-in">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-xl font-bold text-secondary mb-2"><i class="fas ${icon} mr-2"></i> ${title}</h3>
          <p class="text-gray-700 dark:text-gray-300 text-sm">${content}</p>
        </div>
        <button onclick="showDetailedReport('${modalTitle}', '${title}')" class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary/10 text-gray-500 hover:text-primary transition-all">
          <i class="fas fa-file-pdf fa-lg"></i>
        </button>
      </div>
    </div>
  `;
}

function showDetailedReport(modalTitle, reportType) {
  ModalManager.open(
    modalTitle,
    `Rapport ${reportType} - Période: Année Fiscale 2025`,
    `
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 class="text-lg font-bold text-primary dark:text-white mb-4">${reportType} (Tableau Détaillé)</h4>
        <div class="h-64 flex items-center justify-center text-center text-gray-500">
          <i class="fas fa-table fa-2x mr-2"></i>
          <p>Le tableau de données réel du rapport (Bilan, CPC) sera injecté ici depuis l'API.</p>
        </div>
      </div>
    `
  );
}

function renderStubModule(contentArea, moduleName) {
  const moduleTitles = {
    'grand_livre': 'Grand Livre Général',
    'cash_flow': 'Tableau de Flux de Trésorerie (Détail)',
    'quick_entry': 'Saisie Rapide d\'Écritures',
    'audit_logs': 'Journal d\'Audit et Sécurité',
    'cash_movements': 'Liste des Mouvements de Caisse',
    'cash_reports': 'Rapports de Clôture de Caisse',
  };
  const title = moduleTitles[moduleName] || `Module ${moduleName}`;

  contentArea.innerHTML = `
    <div class="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl space-y-4 fade-in min-h-[400px] flex flex-col items-center justify-center text-center">
      <i class="fas fa-tools fa-4x text-warning/50 mb-4"></i>
      <h1 class="text-3xl font-bold text-secondary">${title}</h1>
      <p class="text-gray-700 dark:text-gray-300 max-w-xl">Cette interface est prête. Raccordement direct à l'API Odoo pour charger le contenu dynamique.</p>
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-warning font-semibold">
        ⚠️ Interface de module prête. En attente de données du Backend.
      </div>
    </div>
  `;
}

// ------------------- VUES -------------------

function toggleAuthView(showRegister) {
  document.getElementById('login-form-container').classList.toggle('hidden', showRegister);
  document.getElementById('register-view').classList.toggle('hidden', !showRegister);
}

// =================================================================================
// 4. ÉCOUTEURS D'ÉVÉNEMENTS ET INITIALISATION
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('show-register-btn')?.addEventListener('click', () => toggleAuthView(true));
  document.getElementById('show-login-btn')?.addEventListener('click', () => toggleAuthView(false));
  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    NotificationManager.show('warning', 'Enregistrement', 'Fonctionnalité d\'enregistrement non raccordée pour le moment.', 8000);
  });

  checkAuthAndRender();

  if (!IS_PROD && window.location.hash === '#dev') {
    document.getElementById('email').value = 'admin@douke.com';
    document.getElementById('password').value = 'password';
    const mockEvent = { preventDefault: () => {} };
    setTimeout(() => handleLogin(mockEvent), 500);
  }
});

// =================================================================================
// EXPORTS GLOBAUX
// =================================================================================

window.loadModule = loadModule;
window.switchCompany = switchCompany;
window.toggleAuthView = toggleAuthView;
window.showAssignmentModal = () => NotificationManager.show('info', 'Affectation', 'Fonctionnalité en cours de raccordement.', 3000);
window.showCreateUserModal = () => NotificationManager.show('warning', 'En cours', 'Modal de création d\'utilisateur en cours de développement.');
window.showEditUserModal = () => NotificationManager.show('warning', 'En cours', 'Modal de modification d\'utilisateur en cours de développement.');
window.generateFinancialStatements = () => {};
window.showDetailedReport = showDetailedReport;
window.validateEntry = () => {};
window.rejectEntry = () => {};
window.validateAllPending = () => {};
window.addEntryLine = () => {};
window.removeEntryLine = () => {};
window.updateBalance = () => {};
window.handleQuickEntrySubmit = () => {};

