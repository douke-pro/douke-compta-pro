/**
 * DOUKÈ PRO - ERP COMPTABLE
 * Version : 3.6.0 (Restauration Logique Auth Backend + Dashboard)
 */

const DoukeApp = {
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        // Ajustez cette URL selon votre backend
        API_BASE_URL: window.location.origin.includes('localhost') 
            ? 'http://localhost:3000/api' 
            : 'https://douke-compta-pro.onrender.com/api'
    },

    async init() {
        console.log("🚀 Initialisation système...");
        
        // Si pas de session, on affiche la page de connexion initiale
        if (!this.state.token) {
            this.renderLoginView();
        } else {
            try {
                // Si session active, on charge les données et l'interface
                await this.loadCompanies();
                this.renderFullInterface();
            } catch (error) {
                console.error("Session invalide:", error);
                this.logout();
            }
        }
    },

    // ==========================================
    // 1. VUE CONNEXION (Restaurée à l'identique)
    // ==========================================
    renderLoginView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div class="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-black text-white italic">DOUKÈ<span class="text-primary text-4xl">.</span></h1>
                    <p class="text-gray-400 mt-2">Connectez-vous à votre espace SYSCOHADA</p>
                </div>
                
                <div id="auth-error" class="hidden mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-lg text-center"></div>

                <form id="login-form" class="space-y-5">
                    <input type="email" id="email" placeholder="Email professionnel" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition">
                    <input type="password" id="password" placeholder="Mot de passe" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition">
                    <button type="submit" class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all">
                        SE CONNECTER
                    </button>
                </form>
                
                <div class="mt-6 text-center">
                    <p class="text-gray-500 text-sm">Pas de compte ? 
                        <a href="#" onclick="DoukeApp.renderRegisterView()" class="text-primary font-bold hover:underline">Créer un compte</a>
                    </p>
                </div>
            </div>
        </div>`;

        // Écouteur de soumission (Logique Backend initiale)
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    },

    // ==========================================
    // 2. VUE INSCRIPTION (Restaurée à l'identique)
    // ==========================================
    renderRegisterView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div class="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">Inscription Professionnelle</h2>
                
                <form id="register-form" class="space-y-4">
                    <input type="text" id="reg-name" placeholder="Nom complet / Cabinet" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white">
                    <input type="email" id="reg-email" placeholder="Email" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white">
                    <input type="password" id="reg-password" placeholder="Mot de passe" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white">
                    
                    <select id="reg-role" class="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none">
                        <option value="USER">Client Entreprise</option>
                        <option value="COLLABORATEUR">Collaborateur Cabinet</option>
                        <option value="ADMIN">Administrateur</option>
                    </select>

                    <button type="submit" class="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition">
                        CRÉER LE COMPTE
                    </button>
                </form>

                <button onclick="DoukeApp.renderLoginView()" class="w-full mt-4 text-gray-500 text-sm hover:text-white transition">
                    Retour à la connexion
                </button>
            </div>
        </div>`;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    },

    // ==========================================
    // 3. LOGIQUE BACKEND (Communication API)
    // ==========================================
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');

        try {
            const response = await fetch(`${this.state.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Identifiants invalides');

            // Sauvegarde de la session (Comme dans votre fichier initial)
            this.state.token = data.token;
            this.state.user = {
                id: data.utilisateurId,
                name: data.utilisateurNom,
                role: data.utilisateurRole
            };

            localStorage.setItem('token', this.state.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            // Succès -> Initialisation de l'interface complète
            await this.init();

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    },

    async handleRegister() {
        const payload = {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            role: document.getElementById('reg-role').value
        };

        try {
            const response = await fetch(`${this.state.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Compte créé avec succès ! Connectez-vous.");
                this.renderLoginView();
            } else {
                const data = await response.json();
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            alert("Erreur de connexion au serveur.");
        }
    },

    // ==========================================
    // 4. CHARGEMENT & DASHBOARD (Après Connexion)
    // ==========================================
    async loadCompanies() {
        const role = this.state.user.role;
        const endpoint = (role === 'ADMIN') ? '/companies' : '/companies/assigned';
        
        try {
            const data = await this.apiFetch(endpoint);
            this.state.companies = data || [];
            if (!this.state.activeCompany && this.state.companies.length > 0) {
                this.state.activeCompany = this.state.companies[0];
            }
        } catch (e) {
            console.warn("Mode déconnecté ou erreur API entreprises.");
        }
    },

    renderFullInterface() {
        // Cette fonction remplace tout le body par le Dashboard
        document.body.innerHTML = `
        <div class="flex h-screen bg-gray-950 text-white overflow-hidden">
            <aside class="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div class="p-6 text-2xl font-black italic">DOUKÈ<span class="text-primary">.</span></div>
                <nav id="sidebar-menu" class="flex-1 px-4 space-y-2"></nav>
                <div class="p-4 border-t border-gray-800">
                    <button onclick="DoukeApp.logout()" class="w-full p-3 text-red-400 hover:bg-red-900/20 rounded-lg flex items-center transition">
                        <i class="fas fa-power-off mr-3"></i> Déconnexion
                    </button>
                </div>
            </aside>

            <main class="flex-1 flex flex-col">
                <header class="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
                    <div id="company-selector-container"></div>
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-400">${this.state.user.name}</span>
                        <div class="bg-primary px-3 py-1 rounded text-xs font-bold uppercase">${this.state.user.role}</div>
                    </div>
                </header>
                <div id="main-content-area" class="flex-1 overflow-y-auto p-8"></div>
            </main>
        </div>`;

        this.renderSidebar();
        this.renderCompanySelector();
        this.route('dashboard');
    },

    renderSidebar() {
        const menu = document.getElementById('sidebar-menu');
        const role = this.state.user.role;
        
        let html = `<a href="#" onclick="DoukeApp.route('dashboard')" class="block p-3 hover:bg-gray-800 rounded-lg"><i class="fas fa-chart-pie mr-2 text-primary"></i> Dashboard</a>`;
        
        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            html += `
                <div class="pt-4 pb-2 text-xs text-gray-500 uppercase px-3">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="block p-3 hover:bg-gray-800 rounded-lg"><i class="fas fa-book mr-2"></i> Journal</a>
                <a href="#" onclick="DoukeApp.route('balance')" class="block p-3 hover:bg-gray-800 rounded-lg"><i class="fas fa-balance-scale mr-2"></i> Balance</a>
            `;
        }

        if (role === 'ADMIN') {
            html += `
                <div class="pt-4 pb-2 text-xs text-gray-500 uppercase px-3">Admin</div>
                <a href="#" onclick="DoukeApp.route('users')" class="block p-3 hover:bg-gray-800 rounded-lg"><i class="fas fa-users-cog mr-2"></i> Affectations</a>
            `;
        }
        menu.innerHTML = html;
    },

    async route(view) {
        this.state.view = view;
        const area = document.getElementById('main-content-area');
        
        if (view === 'dashboard') {
            area.innerHTML = `
                <h1 class="text-2xl font-bold mb-6">Tableau de Bord - ${this.state.activeCompany?.name || 'Client'}</h1>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p class="text-gray-400 text-sm">Trésorerie Actuelle</p>
                        <h2 class="text-3xl font-black text-green-500 mt-2">En attente...</h2>
                    </div>
                </div>
            `;
        } else {
            area.innerHTML = `<div class="p-10 text-gray-500 border border-dashed border-gray-800 rounded-xl text-center">Module ${view.toUpperCase()} en cours de chargement...</div>`;
        }
    },

    async apiFetch(endpoint) {
        const response = await fetch(`${this.state.API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${this.state.token}` }
        });
        if (response.status === 401) this.logout();
        return await response.json();
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (!container || this.state.companies.length === 0) return;
        container.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white rounded px-3 py-1 text-sm border-none outline-none focus:ring-1 focus:ring-primary">
                ${this.state.companies.map(c => `<option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>🏢 ${c.name}</option>`).join('')}
            </select>`;
    },

    switchCompany(id) {
        this.state.activeCompany = this.state.companies.find(c => c.id == id);
        this.route(this.state.view);
    },

    logout() {
        localStorage.clear();
        this.state.token = null;
        this.init(); // Relance le cycle (affichera le login car token vide)
    }
};

document.addEventListener('DOMContentLoaded', () => DoukeApp.init());
