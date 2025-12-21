/**
 * APPLICATION : DOUKÈ Compta Pro
 * VERSION : 4.0.0 (Production Stable - Backend Restauré)
 * État : Correction majeure de l'initialisation et du routage
 */

const DoukeApp = {
    // 1. ÉTAT DE L'APPLICATION
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        API_BASE_URL: 'https://douke-compta-pro.onrender.com/api'
    },

    // 2. INITIALISATION CRITIQUE
    init() {
        console.log("🚀 Lancement de DOUKÈ Compta Pro...");
        
        // On vide le body pour éviter les conflits HTML/JS
        document.body.className = "bg-gray-950 text-gray-200 font-sans";
        
        // Vérification de la session
        if (!this.state.token) {
            console.log("🔑 Aucune session - Affichage du Login");
            this.renderLoginView();
        } else {
            console.log("✅ Session active - Chargement Dashboard");
            this.startProtectedSession();
        }
    },

    // 3. VUE DE CONNEXION (Fixée : Injectée directement dans le body)
    renderLoginView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10 animate-fade-in">
                <div class="text-center mb-10">
                    <h1 class="text-3xl font-black text-white italic tracking-tighter uppercase">DOUKÈ <span class="text-indigo-500">Compta Pro</span></h1>
                    <p class="text-gray-500 mt-2 text-sm uppercase tracking-widest font-bold">Connexion SYSCOHADA</p>
                </div>

                <div id="auth-error" class="hidden mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 text-xs rounded-2xl text-center font-bold"></div>

                <form id="login-form" class="space-y-6">
                    <input type="email" id="email" placeholder="Email professionnel" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <input type="password" id="password" placeholder="Mot de passe" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <button type="submit" id="btn-login" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all">
                        SE CONNECTER
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p class="text-gray-500 text-sm">Pas encore de compte ? 
                        <button onclick="DoukeApp.renderRegisterView()" class="text-indigo-400 font-bold hover:underline">Créer un profil</button>
                    </p>
                </div>
            </div>
        </div>`;

        // Écouteur d'événement immédiat
        document.getElementById('login-form').onsubmit = (e) => this.handleLogin(e);
    },

    // 4. VUE D'INSCRIPTION (Restaurée avec les rubriques v1.4)
    renderRegisterView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10">
                <h2 class="text-2xl font-bold text-white mb-2 text-center uppercase tracking-tighter">Nouvel Utilisateur</h2>
                <p class="text-gray-500 text-center mb-8 text-[10px] font-black uppercase tracking-widest">Configuration DOUKÈ Compta Pro</p>
                
                <form id="register-form" class="space-y-4">
                    <input type="text" id="reg-name" placeholder="Nom complet / Cabinet" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    <input type="email" id="reg-email" placeholder="Email professionnel" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    <input type="password" id="reg-password" placeholder="Mot de passe" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    
                    <div class="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                        <label class="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Type de profil</label>
                        <select id="reg-role" class="w-full bg-transparent text-white font-bold outline-none cursor-pointer">
                            <option value="USER">Client Entreprise</option>
                            <option value="COLLABORATEUR">Collaborateur Cabinet</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>

                    <button type="submit" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg">
                        S'INSCRIRE
                    </button>
                </form>

                <button onclick="DoukeApp.renderLoginView()" class="w-full mt-6 text-gray-500 text-xs font-bold hover:text-white transition-all uppercase tracking-widest text-center">
                    <i class="fas fa-arrow-left mr-2"></i> Retour à la connexion
                </button>
            </div>
        </div>`;

        document.getElementById('register-form').onsubmit = (e) => this.handleRegister(e);
    },

    // 5. LOGIQUE BACKEND (FETCH)
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errBox = document.getElementById('auth-error');
        const btn = document.getElementById('btn-login');

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Authentification...';

        try {
            const res = await fetch(`${this.state.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

            // Stockage exactement comme dans votre v1.4
            this.state.token = data.token;
            this.state.user = { 
                id: data.utilisateurId, 
                name: data.utilisateurNom, 
                role: data.utilisateurRole 
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            console.log("✅ Login réussi, redirection...");
            this.init(); // Relance init() pour charger le dashboard

        } catch (error) {
            btn.disabled = false;
            btn.textContent = 'SE CONNECTER';
            errBox.textContent = error.message;
            errBox.classList.remove('hidden');
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
            const res = await fetch(`${this.state.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            alert("Bienvenue sur DOUKÈ Compta Pro ! Votre compte est créé.");
            this.renderLoginView();
        } catch (error) {
            alert("Erreur: " + error.message);
        }
    },

    // 6. DASHBOARD & NAVIGATION
    async startProtectedSession() {
        try {
            const endpoint = (this.state.user.role === 'ADMIN') ? '/companies' : '/companies/assigned';
            const res = await fetch(`${this.state.API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            
            const data = await res.json();
            this.state.companies = Array.isArray(data) ? data : [];
            
            if (this.state.companies.length > 0 && !this.state.activeCompany) {
                this.state.activeCompany = this.state.companies[0];
            }
            
            this.renderFullInterface();
        } catch (err) {
            console.warn("Mode dégradé (Server Unreachable)");
            this.renderFullInterface();
        }
    },

    renderFullInterface() {
        document.body.innerHTML = `
        <div class="flex h-screen bg-gray-950 text-gray-200">
            <aside class="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div class="p-8">
                    <h1 class="text-xl font-black text-white italic tracking-tighter uppercase">DOUKÈ <span class="text-indigo-500">PRO</span></h1>
                </div>
                <nav class="flex-1 px-4 space-y-2" id="nav-menu"></nav>
                <div class="p-6 border-t border-gray-800">
                    <button onclick="DoukeApp.logout()" class="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                        <i class="fas fa-power-off"></i> Déconnexion
                    </button>
                </div>
            </aside>
            <main class="flex-1 flex flex-col overflow-hidden">
                <header class="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-10">
                    <div id="company-selector-container"></div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs font-bold text-gray-500 uppercase">${this.state.user.name}</span>
                        <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">${this.state.user.name.charAt(0)}</div>
                    </div>
                </header>
                <div id="main-content" class="flex-1 overflow-y-auto p-10"></div>
            </main>
        </div>`;

        this.renderMenu();
        this.renderCompanySelector();
        this.route('dashboard');
    },

    renderMenu() {
        const nav = document.getElementById('nav-menu');
        const role = this.state.user.role;
        
        let html = `<a href="#" onclick="DoukeApp.route('dashboard')" class="flex items-center gap-3 p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-600/20 mb-4"><i class="fas fa-chart-line"></i> <span class="text-xs font-black uppercase tracking-widest">Dashboard</span></a>`;

        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            html += `
                <div class="pt-4 pb-2 px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white rounded-2xl transition-all"><i class="fas fa-book"></i> <span class="text-xs font-bold uppercase">Journaux</span></a>
                <a href="#" onclick="DoukeApp.route('balance')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white rounded-2xl transition-all"><i class="fas fa-balance-scale"></i> <span class="text-xs font-bold uppercase">Grand Livre</span></a>
            `;
        }
        nav.innerHTML = html;
    },

    route(view) {
        this.state.view = view;
        const main = document.getElementById('main-content');
        if (view === 'dashboard') {
            main.innerHTML = `
                <h2 class="text-3xl font-black text-white tracking-tighter uppercase mb-6">Résumé d'activité</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800">
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Trésorerie Actuelle</p>
                        <h3 class="text-4xl font-black text-emerald-500">0 <span class="text-xs text-gray-600 ml-1">FCFA</span></h3>
                    </div>
                </div>`;
        } else {
            main.innerHTML = `<div class="p-20 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 font-bold uppercase tracking-widest text-xs">Module ${view} en attente de données</div>`;
        }
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (this.state.companies.length === 0) return;
        container.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white rounded-xl px-4 py-2 text-xs font-black border border-gray-700 outline-none cursor-pointer">
                ${this.state.companies.map(c => `<option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>${c.name.toUpperCase()}</option>`).join('')}
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

// INITIALISATION AU CHARGEMENT DU DOM
window.onload = () => DoukeApp.init();
