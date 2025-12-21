/**
 * DOUKÈ PRO - ERP COMPTABLE SYSCOHADA RÉVISÉ
 * Version : 3.5.0 (Fusion Intégrale Stable)
 * Description : Gestion multi-profils, Inscription, Login et Dashboard dynamique.
 */

const DoukeApp = {
    // ==========================================
    // 1. ÉTAT DE L'APPLICATION (STORE)
    // ==========================================
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        isDarkMode: true,
        API_BASE_URL: window.location.hostname.includes('localhost') 
            ? 'http://localhost:3000/api' 
            : 'https://douke-compta-pro.onrender.com/api'
    },

    // ==========================================
    // 2. INITIALISATION & ROUTING INITIAL
    // ==========================================
    async init() {
        console.log("🚀 Initialisation DOUKÈ PRO v3.5...");
        
        // Si pas de token, on force la vue de connexion
        if (!this.state.token) {
            this.renderLoginView();
        } else {
            try {
                await this.loadCompanies();
                this.renderFullInterface();
            } catch (error) {
                console.error("Session expirée ou erreur serveur:", error);
                this.logout();
            }
        }
    },

    // ==========================================
    // 3. AUTHENTIFICATION (LOGIN / REGISTER)
    // ==========================================
    renderLoginView() {
        const root = document.getElementById('app-root') || document.body;
        root.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <div class="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 fade-in">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-black text-white italic">DOUKÈ<span class="text-primary text-4xl">.</span></h1>
                        <p class="text-gray-400 mt-2">Accédez à votre espace professionnel</p>
                    </div>
                    <div id="auth-message" class="mb-4 hidden p-3 rounded-lg text-sm"></div>
                    <form id="login-form" class="space-y-5">
                        <input type="email" id="login-email" placeholder="Email professionnel" required 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition">
                        <input type="password" id="login-password" placeholder="Mot de passe" required 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition">
                        <button type="submit" class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all transform hover:scale-[1.02]">
                            SE CONNECTER
                        </button>
                    </form>
                    <div class="mt-6 text-center">
                        <p class="text-gray-500 text-sm">Pas encore de compte ? 
                            <a href="#" onclick="DoukeApp.renderRegisterView()" class="text-primary font-bold hover:underline">S'inscrire</a>
                        </p>
                    </div>
                </div>
            </div>`;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await this.handleAuth('login', { email, password });
        });
    },

    renderRegisterView() {
        const root = document.getElementById('app-root') || document.body;
        root.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
                <div class="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 fade-in">
                    <h2 class="text-2xl font-bold text-white mb-6">Créer un compte</h2>
                    <form id="register-form" class="space-y-4">
                        <input type="text" id="reg-name" placeholder="Nom complet" required class="w-full p-4 bg-gray-800 border-gray-700 rounded-xl text-white">
                        <input type="email" id="reg-email" placeholder="Email" required class="w-full p-4 bg-gray-800 border-gray-700 rounded-xl text-white">
                        <input type="password" id="reg-password" placeholder="Mot de passe" required class="w-full p-4 bg-gray-800 border-gray-700 rounded-xl text-white">
                        <select id="reg-role" class="w-full p-4 bg-gray-800 border-gray-700 rounded-xl text-white">
                            <option value="USER">Client Entreprise</option>
                            <option value="COLLABORATEUR">Collaborateur Cabinet</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                        <button type="submit" class="w-full py-4 bg-success text-white font-bold rounded-xl hover:bg-green-600 transition">S'INSCRIRE</button>
                    </form>
                    <button onclick="DoukeApp.renderLoginView()" class="w-full mt-4 text-gray-400 text-sm">Retour à la connexion</button>
                </div>
            </div>`;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                role: document.getElementById('reg-role').value
            };
            await this.handleAuth('register', payload);
        });
    },

    async handleAuth(type, payload) {
        const msg = document.getElementById('auth-message');
        try {
            const res = await fetch(`${this.state.API_BASE_URL}/auth/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Échec de l'authentification");

            // Sauvegarde Session
            this.state.token = data.token;
            this.state.user = { id: data.utilisateurId, name: data.utilisateurNom, role: data.utilisateurRole };
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            // Succès -> Vers l'interface
            await this.init(); 
        } catch (err) {
            msg.textContent = err.message;
            msg.className = "mb-4 p-3 rounded-lg text-sm bg-red-900/50 text-red-200 border border-red-800 block";
        }
    },

    // ==========================================
    // 4. LOGIQUE DE DONNÉES & INTERFACE
    // ==========================================
    async loadCompanies() {
        try {
            // Dans votre logique initiale, l'admin voit tout, le collab voit ses affectations
            const endpoint = (this.state.user.role === 'ADMIN') ? '/companies' : '/companies/assigned';
            const data = await this.apiFetch(endpoint);
            this.state.companies = Array.isArray(data) ? data : [];
            
            if (!this.state.activeCompany && this.state.companies.length > 0) {
                this.state.activeCompany = this.state.companies[0];
                localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
            }
        } catch (e) {
            console.warn("Utilisation des données MOCK car le serveur est indisponible.");
            this.state.companies = [{id: 1, name: "ENTREPRISE TEST SARL"}];
            this.state.activeCompany = this.state.companies[0];
        }
    },

    renderFullInterface() {
        const root = document.getElementById('app-root') || document.body;
        root.innerHTML = `
            <div class="flex h-screen bg-gray-950 text-white overflow-hidden">
                <aside class="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                    <div class="p-6">
                        <h1 class="text-2xl font-black italic">DOUKÈ<span class="text-primary">.</span></h1>
                    </div>
                    <nav id="sidebar-menu" class="flex-1 px-4 space-y-2 overflow-y-auto"></nav>
                    <div class="p-4 border-t border-gray-800">
                        <button onclick="DoukeApp.logout()" class="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition">
                            <i class="fas fa-sign-out-alt mr-3"></i> Déconnexion
                        </button>
                    </div>
                </aside>

                <main class="flex-1 flex flex-col overflow-hidden">
                    <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
                        <div id="company-selector-container"></div>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-400">${this.state.user.name} (${this.state.user.role})</span>
                            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-xs">
                                ${this.state.user.name.charAt(0)}
                            </div>
                        </div>
                    </header>
                    <div id="main-content-area" class="flex-1 overflow-y-auto p-8 bg-gray-950"></div>
                </main>
            </div>`;

        this.updateSidebarByRole(this.state.user.role);
        this.renderCompanySelector();
        this.route('dashboard');
    },

    updateSidebarByRole(role) {
        const sidebar = document.getElementById('sidebar-menu');
        if (!sidebar) return;

        let menuHtml = `
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 mt-2 px-4">Menu</div>
            <a href="#" onclick="DoukeApp.route('dashboard')" class="nav-item flex items-center px-4 py-3 hover:bg-gray-800 rounded-xl transition">
                <i class="fas fa-chart-line mr-3 text-primary"></i> Dashboard
            </a>
        `;

        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            menuHtml += `
                <div class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 mt-6 px-4">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="nav-item flex items-center px-4 py-3 hover:bg-gray-800 rounded-xl transition">
                    <i class="fas fa-book mr-3 text-success"></i> Journaux
                </a>
                <a href="#" onclick="DoukeApp.route('grand-livre')" class="nav-item flex items-center px-4 py-3 hover:bg-gray-800 rounded-xl transition">
                    <i class="fas fa-list mr-3 text-warning"></i> Grand Livre
                </a>
            `;
        }

        if (role === 'ADMIN') {
            menuHtml += `
                <div class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 mt-6 px-4">Paramètres</div>
                <a href="#" onclick="DoukeApp.route('users')" class="nav-item flex items-center px-4 py-3 hover:bg-gray-800 rounded-xl transition">
                    <i class="fas fa-users-cog mr-3 text-info"></i> Utilisateurs
                </a>
            `;
        }
        sidebar.innerHTML = menuHtml;
    },

    // ==========================================
    // 5. ROUTAGE ET VUES
    // ==========================================
    async route(view) {
        this.state.view = view;
        const area = document.getElementById('main-content-area');
        this.showLoader(area);

        switch (view) {
            case 'dashboard':
                area.innerHTML = `
                    <div class="fade-in">
                        <h2 class="text-3xl font-bold mb-2 text-white">Bonjour, ${this.state.user.name} 👋</h2>
                        <p class="text-gray-400 mb-8">Voici l'état financier de ${this.state.activeCompany?.name || 'votre entreprise'}.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p class="text-gray-500 text-sm font-bold uppercase">Trésorerie Disponible</p>
                                <h3 class="text-3xl font-black text-success mt-2">12 450 000 FCFA</h3>
                            </div>
                            <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p class="text-gray-500 text-sm font-bold uppercase">Chiffre d'Affaires</p>
                                <h3 class="text-3xl font-black text-primary mt-2">45 800 000 FCFA</h3>
                            </div>
                            <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p class="text-gray-500 text-sm font-bold uppercase">Charges à Payer</p>
                                <h3 class="text-3xl font-black text-red-500 mt-2">5 200 000 FCFA</h3>
                            </div>
                        </div>
                    </div>`;
                break;
            case 'journal':
                area.innerHTML = `<div class="p-8 bg-gray-900 rounded-2xl border border-gray-800"><h2 class="text-xl font-bold">Journal des écritures</h2><p class="text-gray-400 mt-2">Chargement des données SYSCOHADA...</p></div>`;
                break;
            default:
                area.innerHTML = `<div class="text-center p-20 text-gray-600">Module [${view}] en cours de développement.</div>`;
        }
    },

    // ==========================================
    // 6. UTILITAIRES (API, STORAGE, UI)
    // ==========================================
    async apiFetch(endpoint) {
        const response = await fetch(`${this.state.API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.state.token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 401) this.logout();
        return await response.json();
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (!container || this.state.companies.length === 0) return;

        container.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 border-none text-white text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary transition cursor-pointer">
                ${this.state.companies.map(c => `
                    <option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>🏢 ${c.name}</option>
                `).join('')}
            </select>`;
    },

    switchCompany(id) {
        const company = this.state.companies.find(c => c.id == id);
        this.state.activeCompany = company;
        localStorage.setItem('activeCompany', JSON.stringify(company));
        this.route(this.state.view);
    },

    showLoader(container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 space-y-4">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-gray-500 animate-pulse text-sm">Traitement en cours...</p>
            </div>`;
    },

    logout() {
        localStorage.clear();
        this.state.token = null;
        this.state.user = null;
        this.renderLoginView();
    }
};

// Démarrage de l'application
document.addEventListener('DOMContentLoaded', () => DoukeApp.init());
