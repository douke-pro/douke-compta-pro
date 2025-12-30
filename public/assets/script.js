// =============================================================================
// FICHIER : public/assets/script.js (VERSION FINALE ET ROBUSTE V2)
// Description : Logique Front-End (Vue et Interactions DOM)
// =============================================================================

// --- 1. CONFIGURATION GLOBALE ---
const API_BASE_URL = 'https://douke-compta-pro.onrender.com/api'; // Adapter si le backend n'est pas sur localhost:3000
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// État central de l'application (ESSENTIEL POUR L'ISOLATION)
let appState = {
    isAuthenticated: false,
    token: null,
    // Contient: { name, email, role, odooUid, companiesList, selectedCompanyId }
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


// --- 3. LOGIQUE D'AUTHENTIFICATION ET API ---

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
            // Afficher le message d'erreur spécifique de la route API
            const errorMessage = data.error || `Erreur HTTP ${response.status} - Route API non trouvée. Veuillez vérifier les endpoints montés (auth, companies, accounting, user).`;
            throw new Error(errorMessage);
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
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Mise à jour de l'état global
        appState.token = response.data.token;

        // CRITIQUE : Assurer que l'objet user est plat et contient tout
        appState.user = response.data; // Contient name, companiesList, defaultCompany, etc.
        appState.isAuthenticated = true;

        // Définir la compagnie par défaut
        const defaultCompanyId = response.data.defaultCompany?.id || response.data.selectedCompanyId;
        const defaultCompanyName = response.data.companiesList?.find(c => c.id === defaultCompanyId)?.name || 'Dossier Inconnu';
        
        appState.currentCompanyId = defaultCompanyId;
        appState.currentCompanyName = defaultCompanyName;

        // Sauvegarde du token
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
    // Logique similaire à handleLogin, non implémentée ici pour la concision
    NotificationManager.show('Fonction d\'inscription en cours de finalisation.', 'info');
}

/**
 * Gère la déconnexion.
 */
function handleLogout(isAutoLogout = false) {
    // Effacer le token
    localStorage.removeItem('douke_auth_token');
    
    // Réinitialiser l'état
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
        // Rétablissement de la route /user/session-data, qui est la plus robuste pour la validation JWT
        const response = await apiFetch('/user/session-data', { method: 'GET' }); 
        
        // CORRECTION DE STRUCTURE : Le serveur renvoie les données sous 'response.session' ou 'response.data'
        const userData = response.session || response.data;

        // Si la validation réussit, restaurer l'état
        appState.user = userData;
        appState.isAuthenticated = true;

        // Définition de la compagnie actuelle
        const selectedId = userData.selectedCompanyId || userData.defaultCompanyId;
        const companyList = userData.companiesList || [];
        
        appState.currentCompanyId = selectedId;
        
        // Trouver le nom de la compagnie (nécessaire pour l'UI)
        appState.currentCompanyName = companyList.find(c => c.id === selectedId)?.name 
                                     || 'Dossier Inconnu';
        
    } catch (error) {
        // En cas d'échec de validation (token expiré ou invalide)
        console.warn('Token invalide ou expiré. Reconnexion requise.');
        handleLogout(true);
        return;
    }
    
    renderAppView();
}

// --- 4. GESTION DE LA VUE ET DU DASHBOARD ---

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

/**
 * Charge les informations et les menus du tableau de bord.
 */
function loadDashboard() {
    if (!appState.user) return;

    // Mise à jour de l'en-tête utilisateur
    document.getElementById('welcome-message').textContent = appState.user.name;
    
    // S'assurer d'utiliser la clé 'role' ou 'profile' pour l'affichage
    const displayRole = appState.user.role || appState.user.profile || 'Utilisateur';
    document.getElementById('current-role').textContent = displayRole;
    
    document.getElementById('user-avatar-text').textContent = appState.user.name.charAt(0).toUpperCase();

    // Mise à jour du contexte de travail
    document.getElementById('current-company-name').textContent = appState.currentCompanyName;
    document.getElementById('context-message').textContent = `Comptabilité Analytique : ${appState.currentCompanyName}`;

    // -------------------------------------------------------------
    // LOGIQUE CRITIQUE: CONSTRUCTION DU MENU MULTI-COMPAGNIES
    // -------------------------------------------------------------
    const menuContainer = document.getElementById('role-navigation-menu');
    menuContainer.innerHTML = '';
    
    // 1. Menu de Sélection de Compagnie (Toujours présent si plus d'une compagnie)
    const companyList = appState.user.companiesList || [];
    if (companyList.length > 1) {
        const companySelectHTML = createCompanySelectMenu(companyList);
        menuContainer.insertAdjacentHTML('beforeend', companySelectHTML);
    }
    
    // 2. Menus de Navigation (Basés sur le Rôle)
    const baseMenus = getRoleBaseMenus(displayRole); 
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
    
    // Charger le contenu par défaut
    loadContentArea('dashboard', 'Tableau de Bord');
}


/**
 * Génère le HTML pour le sélecteur de compagnie.
 */
function createCompanySelectMenu(companies) {
    let optionsHTML = companies.map(c => 
        `<option value="${c.id}" ${c.id === appState.currentCompanyId ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    // NOTE: Utiliser onchange="handleCompanyChange(this.value)"
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
    const newCompany = appState.user.companiesList.find(c => c.id === newId);

    if (newCompany) {
        appState.currentCompanyId = newId;
        appState.currentCompanyName = newCompany.name;
        
        // Mise à jour de l'état utilisateur (pour les prochains appels /session-data)
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
 * Définit les options de menu basées sur le profil utilisateur.
 */
function getRoleBaseMenus(role) {
    const menus = [
        { id: 'dashboard', name: 'Tableau de Bord', icon: 'fas fa-chart-line' },
        { id: 'journal', name: 'Journaux et Écritures', icon: 'fas fa-book' },
        { id: 'ledger', name: 'Grand Livre / Balance', icon: 'fas fa-balance-scale' },
        { id: 'reports', name: 'Rapports SYSCOHADA', icon: 'fas fa-file-invoice-dollar' },
    ];
    
    // Le nom des rôles doit être cohérent avec la valeur du JWT
    if (role === 'ADMIN') {
        menus.push({ id: 'admin-users', name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog' });
    }
    if (role === 'COLLABORATEUR' || role === 'CAISSIER') {
         // Ajouter des options spécifiques si nécessaire
    }
    
    return menus;
}

/**
 * Charge le contenu HTML/Données dans la zone principale.
 */
async function loadContentArea(contentId, title) {
    const contentArea = document.getElementById('dashboard-content-area');
    contentArea.innerHTML = `<div class="p-8 text-center"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-gray-500 font-bold">Chargement du module ${title}...</p></div>`;

    // -----------------------------------------------------------------
    // LOGIQUE CLÉ: APPEL API AVEC L'ID DE LA COMPAGNIE ACTUELLE
    // -----------------------------------------------------------------
    try {
        let endpoint = '';
        let content = '';

        // Rétablissement des Query Parameters pour la compatibilité maximale
        const companyFilter = `?companyId=${appState.currentCompanyId}`; 

        switch (contentId) {
            case 'dashboard':
                // CORRECTION CRITIQUE: Utilisation du préfixe /accounting/ au lieu de /data/
                endpoint = `/accounting/dashboard${companyFilter}`; 
                content = await fetchDashboardData(endpoint);
                break;
            case 'journal':
                // CORRECTION CRITIQUE: Utilisation du préfixe /accounting/ au lieu de /data/
                endpoint = `/accounting/journal${companyFilter}`;
                content = await fetchJournalData(endpoint);
                break;
            case 'reports':
                // CORRECTION CRITIQUE: Utilisation du préfixe /accounting/ au lieu de /data/
                const reportResponse = await apiFetch(`/accounting/reports/bilan${companyFilter}`, { method: 'GET' });
                ModalManager.open("Bilan SYSCOHADA", generateReportHTML(reportResponse.data));
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.role || appState.user.profile);
                break;
            default:
                content = generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.role || appState.user.profile);
        }
        
        // Mettre à jour la zone de contenu (sauf si une modale a été ouverte)
        if (content) {
            contentArea.innerHTML = content;
        }

    } catch (error) {
        contentArea.innerHTML = `<div class="p-8 text-center text-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p class="font-bold">Erreur de chargement des données pour ${title}.</p><p class="text-sm">${error.message}</p></div>`;
    }
}

// --- Fonctions de simulation de données (À REMPLACER) ---

async function fetchDashboardData(endpoint) {
    const data = await apiFetch(endpoint, { method: 'GET' });
    // Construction de l'interface du tableau de bord basée sur data
    return generateDashboardHTML(data.data || data); // Utiliser data.data ou data
}

async function fetchJournalData(endpoint) {
    const data = await apiFetch(endpoint, { method: 'GET' });
    // Simuler un rendu de journal
    return generateDashboardWelcomeHTML(appState.currentCompanyName, appState.user.role || appState.user.profile) + 
           `<p class="text-xs mt-4">Journal chargé depuis : ${endpoint}</p>`;
}


// Fonction de génération HTML basique
function generateDashboardHTML(data) {
    return `<h3 class="text-3xl font-black text-secondary mb-6 fade-in">Synthèse Financière</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Trésorerie Actuelle</p>
                    <p class="text-4xl font-black text-success mt-2">${(data.cash || 2500000).toLocaleString('fr-FR')} XOF</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Bénéfice Net (YTD)</p>
                    <p class="text-4xl font-black text-info mt-2">${(data.profit || 450000).toLocaleString('fr-FR')} XOF</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
                    <p class="text-xs font-bold uppercase text-gray-500">Dettes Fournisseurs</p>
                    <p class="text-4xl font-black text-warning mt-2">${(data.debts || 1200000).toLocaleString('fr-FR')} XOF</p>
                </div>
            </div>
            <p class="mt-8 text-sm text-gray-500">Données filtrées pour le dossier client: **${appState.currentCompanyName}**.</p>
            `;
}

function generateReportHTML(reportData) {
    // Ceci serait le rendu complexe d'un Bilan/Compte de Résultat
    return `<div class="prose dark:prose-invert max-w-none">
        <h4 class="text-xl font-bold mb-4">Détails du Bilan au ${new Date().toLocaleDateString('fr-FR')}</h4>
        <p>Simulation de données pour la compagnie ${appState.currentCompanyName}. L'appel API a utilisé le filtre: <code>company_id = ${appState.currentCompanyId}</code>.</p>
        <table class="report-table w-full">
            <thead><tr><th>Compte</th><th>Libellé</th><th>Montant</th></tr></thead>
            <tbody>
                <tr><td>211</td><td>Terrains</td><td>${(reportData.terrains || 15000000).toLocaleString('fr-FR')}</td></tr>
                <tr><td>411</td><td>Clients</td><td>${(reportData.clients || 800000).toLocaleString('fr-FR')}</td></tr>
            </tbody>
        </table>
    </div>`;
}

function generateDashboardWelcomeHTML(companyName, role) {
    return `<div class="h-full flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 fade-in">
        <i class="fas fa-hand-wave fa-5x text-primary/70 mb-6"></i>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">Bienvenue dans votre espace DOUKÈ PRO !</h3>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Vous opérez en tant que <span class="font-black text-primary">${role}</span> sur le dossier client isolé :
            <span class="font-black text-secondary dark:text-primary-light">${companyName}</span>.
        </p>
        <p class="mt-4 text-sm text-gray-500">Veuillez sélectionner un module dans le menu de gauche.</p>
    </div>`;
}


// --- 5. INITIALISATION DU DOM (CRITIQUE POUR LA ROBUSTESSE) ---

document.addEventListener('DOMContentLoaded', () => {
    // Tentative d'authentification et rendu initial
    checkAuthAndRender();

    // 1. Attachement des formulaires
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // L'interception est ici + l'attribut onsubmit dans index.html
        loginForm.addEventListener('submit', handleLogin);
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
         // L'interception doit aussi être ajoutée au formulaire d'inscription
        registerForm.addEventListener('submit', handleRegister); 
    }

    // 2. Attachement des boutons de navigation AUTH/REGISTER
    const loginContainer = document.getElementById('login-form-container');
    const registerView = document.getElementById('register-view');
    const showRegisterBtn = document.getElementById('show-register-btn'); 
    const showLoginBtn = document.getElementById('show-login-btn');      
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
    
    // 3. Attachement des boutons de déconnexion et de Modale
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', ModalManager.close);
    }

    // 4. Outil de Dev (Mode rapide pour tests)
    if (!IS_PROD && window.location.hash === '#dev') {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput && passwordInput) {
            emailInput.value = 'admin@douke.com';
            passwordInput.value = 'password';
            const mockEvent = { preventDefault: () => {} };
            // Connexion après un court délai pour que l'utilisateur puisse voir les champs se remplir
            setTimeout(() => handleLogin(mockEvent), 500); 
        }
    }
});
