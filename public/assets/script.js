// =================================================================================
// DOUKÈ COMPTA PRO - VERSION RESTAURÉE (Logique Auth Backend Intégrale)
// =================================================================================

const DoukeApp = {
    // 1. CONFIGURATION & ÉTAT INITIAL
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        API_BASE_URL: 'https://douke-compta-pro.onrender.com/api' // Ton URL Backend
    },

    // 2. INITIALISATION DU SYSTÈME
    init() {
        console.log("🚀 Initialisation DOUKÈ PRO...");
        if (!this.state.token) {
            this.renderLoginView();
        } else {
            this.loadInitialData();
        }
    },

    // 3. PAGE DE CONNEXION (LOGIQUE ORIGINALE RESTAURÉE)
    renderLoginView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans text-gray-200">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10 fade-in">
                <div class="text-center mb-10">
                    <h1 class="text-4xl font-black text-white tracking-tighter italic">DOUKÈ<span class="text-indigo-500">.</span></h1>
                    <p class="text-gray-400 mt-2 font-medium">Système Comptable Professionnel</p>
                </div>

                <div id="auth-alert" class="hidden mb-6 p-4 rounded-xl text-sm border"></div>

                <form id="login-form" class="space-y-6">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Email Professionnel</label>
                        <input type="email" id="email" required placeholder="nom@cabinet.com" 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Mot de passe</label>
                        <input type="password" id="password" required placeholder="••••••••" 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.01]">
                        SE CONNECTER
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p class="text-gray-500 text-sm">Nouveau sur la plateforme ? 
                        <a href="#" onclick="DoukeApp.renderRegisterView()" class="text-indigo-400 font-bold hover:text-indigo-300">Créer un compte</a>
                    </p>
                </div>
            </div>
        </div>`;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    },

    // 4. PAGE D'INSCRIPTION (LOGIQUE ORIGINALE RESTAURÉE)
    renderRegisterView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans text-gray-200">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10">
                <h2 class="text-2xl font-bold text-white mb-2 text-center">Inscription</h2>
                <p class="text-gray-400 text-center mb-8 text-sm">Créez votre profil collaborateur ou client</p>
                
                <form id="register-form" class="space-y-4">
                    <input type="text" id="reg-name" placeholder="Nom complet" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white">
                    <input type="email" id="reg-email" placeholder="Email professionnel" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white">
                    <input type="password" id="reg-password" placeholder="Mot de passe" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white">
                    
                    <div class="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Type de profil</label>
                        <select id="reg-role" class="w-full bg-transparent text-white outline-none">
                            <option value="USER">Client Entreprise</option>
                            <option value="COLLABORATEUR">Collaborateur Cabinet</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>

                    <button type="submit" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                        CRÉER LE COMPTE
                    </button>
                </form>

                <button onclick="DoukeApp.renderLoginView()" class="w-full mt-6 text-gray-500 text-sm font-medium hover:text-white transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i> Retour à la connexion
                </button>
            </div>
        </div>`;

        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    },

    // 5. COMMUNICATION BACKEND (LOGIQUE EXACTE DU FICHIER SOURCE)
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const alertBox = document.getElementById('auth-alert');

        try {
            const response = await fetch(`${this.state.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erreur de connexion');

            // Stockage exact comme dans ta version 1.4
            this.state.token = data.token;
            this.state.user = { id: data.utilisateurId, name: data.utilisateurNom, role: data.utilisateurRole };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            this.loadInitialData();

        } catch (error) {
            alertBox.innerHTML = `<strong>Erreur:</strong> ${error.message}`;
            alertBox.className = "mb-6 p-4 rounded-xl text-sm border bg-red-900/20 border-red-800 text-red-200 block";
        }
    },

    async handleRegister(e) {
        e.preventDefault();
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

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alert("Compte créé ! Veuillez vous connecter.");
            this.renderLoginView();
        } catch (error) {
            alert(error.message);
        }
    },

    // 6. LOGIQUE DASHBOARD & PROFILS
    async loadInitialData() {
        try {
            const endpoint = (this.state.user.role === 'ADMIN') ? '/companies' : '/companies/assigned';
            const response = await fetch(`${this.state.API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            
            const companies = await response.json();
            this.state.companies = Array.isArray(companies) ? companies : [];
            
            if (this.state.companies.length > 0) {
                this.state.activeCompany = this.state.companies[0];
            }
            
            this.renderFullInterface();
        } catch (err) {
            console.error("Erreur chargement entreprises", err);
            this.renderFullInterface(); // On affiche quand même l'interface (mode secours)
        }
    },

    renderFullInterface() {
        document.body.innerHTML = `
        <div class="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">
            <aside class="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div class="p-8">
                    <h1 class="text-2xl font-black text-white italic">DOUKÈ<span class="text-indigo-500">.</span></h1>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">SYSCOHADA Pro</p>
                </div>
                
                <nav class="flex-1 px-4 space-y-1 overflow-y-auto" id="nav-menu"></nav>

                <div class="p-6 border-t border-gray-800">
                    <div class="flex items-center gap-3 mb-4 px-2">
                        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            ${this.state.user.name.charAt(0)}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-white truncate w-32">${this.state.user.name}</p>
                            <p class="text-[10px] text-gray-500 font-bold uppercase">${this.state.user.role}</p>
                        </div>
                    </div>
                    <button onclick="DoukeApp.logout()" class="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-all font-medium">
                        <i class="fas fa-sign-out-alt"></i> Quitter la session
                    </button>
                </div>
            </aside>

            <main class="flex-1 flex flex-col">
                <header class="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-10">
                    <div id="company-selector-container"></div>
                    <div class="flex items-center gap-6">
                        <button class="text-gray-400 hover:text-white transition-colors relative">
                            <i class="fas fa-bell"></i>
                            <span class="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                        </button>
                    </div>
                </header>
                <div id="main-content" class="flex-1 overflow-y-auto p-10 bg-gray-950"></div>
            </main>
        </div>`;

        this.renderMenu();
        this.renderCompanySelector();
        this.route('dashboard');
    },

    renderMenu() {
        const nav = document.getElementById('nav-menu');
        const role = this.state.user.role;
        
        let menuItems = `
            <a href="#" onclick="DoukeApp.route('dashboard')" class="flex items-center gap-4 p-4 text-gray-400 hover:bg-indigo-600/10 hover:text-white rounded-2xl transition-all group">
                <i class="fas fa-th-large text-indigo-500 group-hover:scale-110 transition-transform"></i>
                <span class="font-bold">Tableau de bord</span>
            </a>
        `;

        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            menuItems += `
                <div class="mt-8 mb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="flex items-center gap-4 p-4 text-gray-400 hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-file-invoice text-emerald-500"></i> <span class="font-medium">Saisie Journaux</span>
                </a>
                <a href="#" onclick="DoukeApp.route('balance')" class="flex items-center gap-4 p-4 text-gray-400 hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-balance-scale text-amber-500"></i> <span class="font-medium">Grand Livre & Balance</span>
                </a>
            `;
        }

        if (role === 'ADMIN') {
            menuItems += `
                <div class="mt-8 mb-2 px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Administration</div>
                <a href="#" onclick="DoukeApp.route('users')" class="flex items-center gap-4 p-4 text-gray-400 hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-users-cog text-indigo-400"></i> <span class="font-medium">Gestion Clients</span>
                </a>
            `;
        }
        nav.innerHTML = menuItems;
    },

    route(view) {
        this.state.view = view;
        const main = document.getElementById('main-content');
        
        if (view === 'dashboard') {
            main.innerHTML = `
                <div class="fade-in">
                    <h2 class="text-3xl font-black text-white mb-2">Synthèse d'Activité</h2>
                    <p class="text-gray-400 mb-10">Client : ${this.state.activeCompany?.name || 'Aucune entreprise sélectionnée'}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-indigo-500/50 transition-all group">
                            <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trésorerie Nette</p>
                            <h3 class="text-4xl font-black text-emerald-500 tabular-nums">0 <span class="text-sm text-gray-600 ml-1">FCFA</span></h3>
                        </div>
                    </div>
                </div>`;
        } else {
            main.innerHTML = `<div class="p-20 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 font-bold uppercase tracking-widest">Module ${view} en cours...</div>`;
        }
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (this.state.companies.length === 0) return;

        container.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white rounded-xl px-4 py-2 text-sm font-bold border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                ${this.state.companies.map(c => `<option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>🏢 ${c.name}</option>`).join('')}
            </select>`;
    },

    switchCompany(id) {
        this.state.activeCompany = this.state.companies.find(c => c.id == id);
        this.route(this.state.view);
    },

    logout() {
        localStorage.clear();
        location.reload();
    }
};

// Lancement au chargement du DOM
document.addEventListener('DOMContentLoaded', () => DoukeApp.init());
