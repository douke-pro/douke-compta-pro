/**
 * DOUKÈ COMPTA PRO - VERSION 4.1.0 (STABLE)
 * Restauration totale du Backend et de l'interface graphique
 */

const DoukeApp = {
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        API_BASE_URL: 'https://douke-compta-pro.onrender.com/api'
    },

    // 1. INITIALISATION ROBUSTE
    init() {
        console.log("🚀 Initialisation DOUKÈ Compta Pro...");
        
        // On s'assure que le body est prêt pour recevoir l'interface
        document.body.className = "bg-gray-950 text-gray-100 font-sans m-0 p-0 overflow-x-hidden";
        
        if (!this.state.token) {
            this.renderLoginView();
        } else {
            this.startProtectedSession();
        }
    },

    // 2. PAGE DE CONNEXION (Restaurée visuellement et fonctionnellement)
    renderLoginView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div class="w-full max-w-md bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div class="text-center mb-10">
                    <h1 class="text-3xl font-black text-white italic tracking-tighter uppercase">DOUKÈ <span class="text-indigo-500">Compta Pro</span></h1>
                    <p class="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Expertise SYSCOHADA</p>
                </div>

                <div id="auth-error" class="hidden mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-xs rounded-2xl text-center font-bold"></div>

                <form id="login-form" class="space-y-5">
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-500 uppercase ml-2">Email Professionnel</label>
                        <input type="email" id="email" required placeholder="nom@cabinet.com" 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-500 uppercase ml-2">Mot de passe</label>
                        <input type="password" id="password" required placeholder="••••••••" 
                            class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <button type="submit" id="btn-submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm">
                        Accéder au Dashboard
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-800 text-center">
                    <button onclick="DoukeApp.renderRegisterView()" class="text-gray-400 text-xs hover:text-indigo-400 transition-colors">
                        Pas de compte ? <span class="text-indigo-500 font-bold">Créer un profil professionnel</span>
                    </button>
                </div>
            </div>
        </div>`;

        document.getElementById('login-form').onsubmit = (e) => this.handleLogin(e);
    },

    // 3. PAGE D'INSCRIPTION (Reprend exactement les rubriques demandées)
    renderRegisterView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-950 px-4">
            <div class="w-full max-w-md bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10">
                <div class="mb-8">
                    <h2 class="text-2xl font-black text-white uppercase tracking-tighter">Inscription</h2>
                    <p class="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Nouveau collaborateur DOUKÈ</p>
                </div>
                
                <form id="register-form" class="space-y-4">
                    <input type="text" id="reg-name" placeholder="Nom complet ou Cabinet" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    <input type="email" id="reg-email" placeholder="Email de contact" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    <input type="password" id="reg-password" placeholder="Définir un mot de passe" required class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    
                    <div class="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                        <label class="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Type d'accès</label>
                        <select id="reg-role" class="w-full bg-transparent text-white font-bold outline-none cursor-pointer">
                            <option value="USER">Client Entreprise</option>
                            <option value="COLLABORATEUR">Collaborateur Cabinet</option>
                            <option value="ADMIN">Administrateur Système</option>
                        </select>
                    </div>

                    <button type="submit" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-sm">
                        Créer mon accès
                    </button>
                </form>

                <button onclick="DoukeApp.renderLoginView()" class="w-full mt-6 text-gray-500 text-[10px] font-black hover:text-white transition-all uppercase tracking-widest">
                    <i class="fas fa-arrow-left mr-2"></i> Revenir à la connexion
                </button>
            </div>
        </div>`;

        document.getElementById('register-form').onsubmit = (e) => this.handleRegister(e);
    },

    // 4. LOGIQUE DE CONNEXION (FETCH STRICT v1.4)
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btn-submit');
        const errBox = document.getElementById('auth-error');

        btn.disabled = true;
        btn.textContent = "Vérification...";

        try {
            const res = await fetch(`${this.state.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

            // Stockage selon userContext v1.4
            this.state.token = data.token;
            this.state.user = { 
                id: data.utilisateurId, 
                name: data.utilisateurNom, 
                role: data.utilisateurRole 
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            this.init(); // Redémarre l'app avec la session active

        } catch (err) {
            btn.disabled = false;
            btn.textContent = "Accéder au Dashboard";
            errBox.textContent = err.message;
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

            alert("Bienvenue chez DOUKÈ ! Votre compte a été créé.");
            this.renderLoginView();
        } catch (err) {
            alert("Erreur: " + err.message);
        }
    },

    // 5. SESSION ET DASHBOARD
    async startProtectedSession() {
        try {
            const role = this.state.user.role;
            const endpoint = (role === 'ADMIN') ? '/companies' : '/companies/assigned';
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
            this.renderFullInterface();
        }
    },

    renderFullInterface() {
        document.body.innerHTML = `
        <div class="flex h-screen bg-gray-950">
            <aside class="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div class="p-8">
                    <h1 class="text-xl font-black text-white italic tracking-tighter uppercase">DOUKÈ <span class="text-indigo-500">PRO</span></h1>
                </div>
                <nav class="flex-1 px-6 space-y-2" id="nav-menu"></nav>
                <div class="p-6 border-t border-gray-800">
                    <div class="flex items-center gap-3 p-3 bg-gray-800/50 rounded-2xl mb-4">
                        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">${this.state.user.name.charAt(0)}</div>
                        <div class="truncate text-xs">
                            <p class="font-bold text-white">${this.state.user.name}</p>
                            <p class="text-gray-500 font-bold uppercase text-[8px]">${this.state.user.role}</p>
                        </div>
                    </div>
                    <button onclick="DoukeApp.logout()" class="w-full p-3 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <i class="fas fa-power-off mr-2"></i> Déconnexion
                    </button>
                </div>
            </aside>
            <main class="flex-1 flex flex-col">
                <header class="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-10">
                    <div id="company-selector-container"></div>
                    <div class="flex items-center gap-4 text-xs font-bold text-gray-500">
                        <i class="fas fa-calendar-alt mr-2"></i> ${new Date().toLocaleDateString('fr-FR')}
                    </div>
                </header>
                <div id="main-content" class="flex-1 overflow-y-auto p-10"></div>
            </main>
        </div>`;

        this.updateNav();
        this.renderCompanySelector();
        this.route('dashboard');
    },

    updateNav() {
        const nav = document.getElementById('nav-menu');
        const role = this.state.user.role;
        let html = `
            <a href="#" onclick="DoukeApp.route('dashboard')" class="flex items-center gap-3 p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-600/20">
                <i class="fas fa-home"></i> <span class="text-[10px] font-black uppercase tracking-widest">Accueil</span>
            </a>
        `;
        if (role !== 'USER') {
            html += `
                <div class="pt-6 pb-2 text-[8px] font-black text-gray-600 uppercase tracking-widest">Gestion</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white rounded-2xl transition-all"><i class="fas fa-book"></i> <span class="text-[10px] font-bold uppercase">Journaux</span></a>
                <a href="#" onclick="DoukeApp.route('balance')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white rounded-2xl transition-all"><i class="fas fa-balance-scale"></i> <span class="text-[10px] font-bold uppercase">Balance</span></a>
            `;
        }
        nav.innerHTML = html;
    },

    route(view) {
        const main = document.getElementById('main-content');
        if (view === 'dashboard') {
            main.innerHTML = `
                <h2 class="text-3xl font-black text-white uppercase tracking-tighter mb-8 italic">Statistiques Générales</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Trésorerie Disponible</p>
                        <h3 class="text-4xl font-black text-emerald-500 tabular-nums">0 <span class="text-sm text-gray-600">FCFA</span></h3>
                    </div>
                    <div class="bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Entreprise Active</p>
                        <h3 class="text-2xl font-black text-white uppercase tracking-tighter">${this.state.activeCompany?.name || 'Aucune'}</h3>
                    </div>
                </div>`;
        } else {
            main.innerHTML = `<div class="p-20 text-center border-2 border-dashed border-gray-800 rounded-[2rem] text-gray-600 font-black uppercase tracking-widest text-[10px]">Module ${view} prêt pour injection de données</div>`;
        }
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (this.state.companies.length === 0) return;
        container.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white rounded-xl px-4 py-2 text-[10px] font-black border border-gray-700 outline-none cursor-pointer uppercase">
                ${this.state.companies.map(c => `<option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
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

// Démarrage forcé
window.addEventListener('load', () => DoukeApp.init());
