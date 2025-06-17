// ==== 1. INTERNATIONALISATION (EN par défaut, FR optionnel) ====
const LANG = {
  en: {
    login: "Login",
    logout: "Logout",
    dashboard: "Dashboard",
    company: "Company",
    companies: "Companies",
    select_company: "Select a company...",
    admin: "Administrator",
    collaborator_senior: "Senior Collaborator",
    collaborator: "Collaborator",
    user: "User",
    cashier: "Cashier",
    manage_users: "Manage Users",
    manage_companies: "Manage Companies",
    manage_collaborators: "Manage Collaborators",
    manage_cashiers: "Manage Cashiers",
    manage_accounts: "Manage Accounts",
    manage_entries: "Manage Entries",
    manage_reports: "Manage Reports",
    import_balance: "Import Excel Balance",
    export_excel: "Export Excel",
    export_pdf: "Export PDF",
    stats: "Statistics",
    affect: "Affect",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    cancel: "Cancel",
    language: "Français",
    switch_lang: "Switch to French",
    require_company: "Please select a company to continue.",
    // ... (ajoute au besoin)
  },
  fr: {
    login: "Connexion",
    logout: "Déconnexion",
    dashboard: "Tableau de bord",
    company: "Entreprise",
    companies: "Entreprises",
    select_company: "Sélectionner une entreprise...",
    admin: "Administrateur",
    collaborator_senior: "Collaborateur Senior",
    collaborator: "Collaborateur",
    user: "Utilisateur",
    cashier: "Caissier",
    manage_users: "Gérer les utilisateurs",
    manage_companies: "Gérer les entreprises",
    manage_collaborators: "Gérer les collaborateurs",
    manage_cashiers: "Gérer les caissiers",
    manage_accounts: "Gérer les comptes",
    manage_entries: "Gérer les écritures",
    manage_reports: "Gérer les rapports",
    import_balance: "Importer balance Excel",
    export_excel: "Exporter Excel",
    export_pdf: "Exporter PDF",
    stats: "Statistiques",
    affect: "Affecter",
    add: "Ajouter",
    edit: "Éditer",
    delete: "Supprimer",
    confirm: "Confirmer",
    cancel: "Annuler",
    language: "English",
    switch_lang: "Passer à l'anglais",
    require_company: "Veuillez sélectionner une entreprise pour continuer.",
    // ... (ajoute au besoin)
  }
};
let currentLang = "en";
function t(key) { return LANG[currentLang][key] || key; }
function switchLang() {
  currentLang = (currentLang === "en") ? "fr" : "en";
  renderApp();
}

// ==== 2. GÉNÉRATION SÉCURISÉE DES IDs ====
const IdPrefix = {
  company: "ENT",
  user: "USR",
  cashier: "CAI",
  account: "ACC",
  entry: "ENTR",
};
const IdCounters = {
  company: 0,
  user: 0,
  cashier: 0,
  account: 0,
  entry: 0,
};
function generateId(type) {
  if (!IdCounters[type]) IdCounters[type] = 0;
  IdCounters[type]++;
  return `${IdPrefix[type]}-${String(IdCounters[type]).padStart(5, "0")}`;
}

// ==== 3. MODÈLES & ÉTAT GLOBAL ====

// Entreprise
function Company(name) {
  this.id = generateId("company");
  this.name = name;
  this.users = []; // IDs des users, collab, caissiers
  this.accounts = [];
  this.entries = [];
  this.cashiers = [];
}

// Utilisateur
function User(email, password, profile, attachedCompanyIds = [], parentId = null) {
  this.id = generateId("user");
  this.email = email;
  this.password = pseudoHash(password);
  this.profile = profile; // admin, collaborator_senior, collaborator, user, cashier
  this.companies = attachedCompanyIds; // array of company IDs
  this.parentId = parentId; // pour hiérarchie
  this.affectees = []; // pour senior: liste d'IDs
}

// Simple hash (démo)
function pseudoHash(str) {
  return btoa(unescape(encodeURIComponent(str))).split('').reverse().join('');
}

// État global de l'app
const AppState = {
  users: [],
  companies: [],
  currentUser: null,
  currentCompanyId: null,
  isAuthenticated: false,
  lang: "en"
};

// ==== 4. HIÉRARCHIE ET AFFECTATIONS ====

// Rôles possibles
const ROLES = [
  "admin",
  "collaborator_senior",
  "collaborator",
  "user",
  "cashier"
];

// Droits par rôle (lecture/écriture sur quels objets)
const RoleRights = {
  admin:         { companies: "RW", users: "RW", cashiers: "RW", entries: "RW", reports: "RW" },
  collaborator_senior: { companies: "R", users: "RW", cashiers: "RW", entries: "RW", reports: "RW" },
  collaborator:  { companies: "R", users: "R", cashiers: "R", entries: "RW", reports: "R" },
  user:          { companies: "R", users: "RW", cashiers: "R", entries: "R", reports: "R" },
  cashier:       { companies: "R", users: "R", cashiers: "R", entries: "R", reports: "R" },
};

// Affectations (par modals en front, stub ici)
function affectCompanyToUser(userId, companyId) {
  const user = AppState.users.find(u => u.id === userId);
  if (user && !user.companies.includes(companyId)) {
    user.companies.push(companyId);
  }
}
function affectCollaboratorToSenior(collabId, seniorId) {
  const senior = AppState.users.find(u => u.id === seniorId);
  const collab = AppState.users.find(u => u.id === collabId);
  if (senior && collab && !senior.affectees.includes(collabId)) {
    collab.parentId = seniorId;
    senior.affectees.push(collabId);
  }
}

// ==== 5. SÉCURISATION DES ACCÈS ET DES DROITS ====
function canUserAccessCompany(user, companyId) {
  if (!user) return false;
  if (user.profile === "admin") return true;
  return user.companies && user.companies.includes(companyId);
}

// ==== 6. INITIALISATION DONNÉES DÉMO ====
// Pour une vraie app, cette partie ira dans le backend ou sera remplacée par import.
function initDemoData() {
  // 2 entreprises
  const compA = new Company("Alpha Consulting");
  const compB = new Company("Beta Holdings");
  AppState.companies.push(compA, compB);

  // Admin global
  const admin = new User("admin@douke.com", "admin123", "admin");
  AppState.users.push(admin);

  // Senior collaborateur (aucune entreprise assignée initialement)
  const senior = new User("senior@douke.com", "senior123", "collaborator_senior");
  AppState.users.push(senior);

  // Collaborateur assigné à senior et à Alpha
  const collab = new User("collab@douke.com", "collab123", "collaborator", [compA.id], senior.id);
  AppState.users.push(collab);
  senior.affectees.push(collab.id);

  // Utilisateur Alpha, peut créer d'autres users Alpha et max 5 caisses
  const userA = new User("user@douke.com", "user123", "user", [compA.id]);
  AppState.users.push(userA);

  // Caissier Beta
  const cashierB = new User("cashier@douke.com", "cash123", "cashier", [compB.id]);
  AppState.users.push(cashierB);

  // Affectations entreprises <-> users
  compA.users.push(admin.id, senior.id, collab.id, userA.id);
  compB.users.push(admin.id, senior.id, cashierB.id);

  // Exemples caisses (max 5 par entreprise)
  compA.cashiers.push(generateId("cashier"));
  compB.cashiers.push(generateId("cashier"));

  // Comptes et écritures (exemple simple)
  compA.accounts = [{ id: generateId("account"), code: "511000", label: "Banque" }];
  compA.entries = [{ id: generateId("entry"), amount: 1000, label: "Dépôt initial" }];

  // Sélection initiale
  AppState.currentUser = null;
  AppState.isAuthenticated = false;
  AppState.currentCompanyId = null;
}

// Appelle au chargement si besoin
initDemoData();

// ==== 7. AUTHENTIFICATION ET SÉLECTION ENTREPRISE ====

function login(email, password) {
  const user = AppState.users.find(
    u => u.email === email && u.password === pseudoHash(password)
  );
  if (user) {
    AppState.currentUser = user;
    AppState.isAuthenticated = true;
    // Sélectionne la première entreprise si user pas admin
    if (user.profile !== "admin" && user.companies.length > 0)
      AppState.currentCompanyId = user.companies[0];
    else
      AppState.currentCompanyId = null;
    renderApp();
    return true;
  }
  alert("Login incorrect");
  return false;
}

function logout() {
  AppState.currentUser = null;
  AppState.isAuthenticated = false;
  AppState.currentCompanyId = null;
  renderApp();
}

// Sélection d’entreprise (pour admin ou collaborateur)
function selectCompany(companyId) {
  if (!AppState.isAuthenticated) return;
  if (canUserAccessCompany(AppState.currentUser, companyId)) {
    AppState.currentCompanyId = companyId;
    renderApp();
  } else {
    alert(t("require_company"));
  }
}

// ==== 8. DASHBOARD & UI PRINCIPALE ====

function renderApp() {
  // 1. Affiche la page login si non authentifié
  if (!AppState.isAuthenticated || !AppState.currentUser) {
    document.getElementById("mainApp").style.display = "none";
    document.getElementById("loginInterface").style.display = "";
    renderLoginForm();
    return;
  }
  document.getElementById("mainApp").style.display = "";
  document.getElementById("loginInterface").style.display = "none";

  // 2. Affiche la sélection d’entreprise si nécessaire
  if (
    (AppState.currentUser.profile === "admin" ||
      AppState.currentUser.profile === "collaborator_senior" ||
      AppState.currentUser.profile === "collaborator") &&
    !AppState.currentCompanyId
  ) {
    renderCompanySelector();
    return;
  }

  // 3. Affiche le dashboard selon le profil
  renderDashboard();
}

function renderLoginForm() {
  document.getElementById("loginEmail").placeholder = t("email");
  document.getElementById("loginPassword").placeholder = t("password");
  // Bouton switch de langue (optionnel)
  document.getElementById("langSwitchBtn").innerText = t("switch_lang");
}

function renderCompanySelector() {
  const companies = AppState.companies.filter(c =>
    canUserAccessCompany(AppState.currentUser, c.id)
  );
  let html = `<h2>${t("select_company")}</h2><select id="companySelect">`;
  companies.forEach(c => {
    html += `<option value="${c.id}">${c.name}</option>`;
  });
  html += `</select><button id="companySelectBtn">${t("confirm")}</button>`;
  document.getElementById("mainContent").innerHTML = html;
  document.getElementById("companySelectBtn").onclick = () =>
    selectCompany(document.getElementById("companySelect").value);
}

function renderDashboard() {
  const user = AppState.currentUser;
  const company = AppState.companies.find(c => c.id === AppState.currentCompanyId);
  let html = `<h2>${t("dashboard")} - ${t(user.profile)}</h2>`;
  if (company) html += `<h3>${company.name}</h3>`;
  html += `<button onclick="logout()">${t("logout")}</button> `;
  html += `<button onclick="switchLang()">${t("switch_lang")}</button>`;
  html += `<hr>`;
  // Options Import/Export (squelettes)
  html += `<button onclick="showImportModal()">${t("import_balance")}</button> `;
  html += `<button onclick="exportExcel()">${t("export_excel")}</button> `;
  html += `<button onclick="exportPDF()">${t("export_pdf")}</button> `;
  html += `<div id="dashboardDetails"></div>`;
  document.getElementById("mainContent").innerHTML = html;
  renderDashboardDetails();
}

function renderDashboardDetails() {
  // Affichage spécifique par profil
  const user = AppState.currentUser;
  let html = `<ul>`;
  if (user.profile === "admin") {
    html += `<li>${t("manage_companies")}</li>`;
    html += `<li>${t("manage_users")}</li>`;
    html += `<li>${t("manage_accounts")}</li>`;
    html += `<li>${t("manage_entries")}</li>`;
  }
  if (user.profile === "collaborator_senior" || user.profile === "collaborator") {
    html += `<li>${t("manage_entries")}</li>`;
    html += `<li>${t("manage_reports")}</li>`;
  }
  if (user.profile === "user") {
    html += `<li>${t("manage_reports")}</li>`;
    html += `<li>${t("stats")}</li>`;
  }
  if (user.profile === "cashier") {
    html += `<li>${t("manage_cashiers")}</li>`;
    html += `<li>${t("manage_entries")}</li>`;
  }
  html += `</ul>`;
  document.getElementById("dashboardDetails").innerHTML = html;
}

// ==== 9. IMPORT/EXPORT (SQUELETTES POUR BACKEND FUTUR) ====
function showImportModal() {
  alert("Import Excel non implémenté (prévu pour le backend).");
}

function exportExcel() {
  alert("Export Excel non implémenté (prévu pour le backend).");
}

function exportPDF() {
  alert("Export PDF non implémenté (prévu pour le backend).");
}

// ==== 10. LANGUE ====
// Déjà géré via switchLang et t(key)

// ==== 11. POUR INTÉGRATION BACKEND ====
// Ajoute ici tes hooks AJAX/fetch API plus tard pour sauvegarder/charger les données réelles.

// ==== 12. LIAISON DOM ET EVENT LISTENERS ====

// À appeler après chargement du DOM
function setupEventListeners() {
  // Formulaire de login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.onsubmit = function (e) {
      e.preventDefault();
      login(
        document.getElementById("loginEmail").value,
        document.getElementById("loginPassword").value
      );
    };
  }
  // Switch langue
  const langSwitch = document.getElementById("langSwitchBtn");
  if (langSwitch) langSwitch.onclick = switchLang;
}

// ==== 13. DÉMARRAGE AUTOMATIQUE ====

// Lancer setup et affichage après chargement de la page
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners();
  renderApp();
});

// ==== 14. POUR TEST : BOUTONS DEMO LOGIN RAPIDE (optionnel) ====
// Appelle login('admin@douke.com', 'admin123') pour se connecter en admin démo, etc.
// Tu peux créer des boutons dans ton HTML pour tester.
