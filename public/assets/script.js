/**
 * APPLICATION : DOUKÈ Compta Pro
 * VERSION : 3.7.0 (Stable - Intégration SYSCOHADA & Sécurité)
 * État : Logique Backend v1.4 Restaurée + Dashboard Professionnel
 */

const DoukeApp = {
    // ==========================================
    // 1. ARCHITECTURE DES DONNÉES (USER CONTEXT)
    // ==========================================
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        // URL EXACTE DE VOTRE BACKEND
        API_BASE_URL: 'https://douke-compta-pro.onrender.com/api'
    },

    // ==========================================
    // 2. INITIALISATION ET CONTRÔLE D'ACCÈS
    // ==========================================
    init() {
        console.log("🚀 Lancement de DOUKÈ Compta Pro...");
        
        // Vérification de la session comme dans votre fichier initial
        if (!this.state.token) {
            this.renderLoginView();
        } else {
            this.startProtectedSession();
        }
    },

    // ==========================================
    // 3. LOGIQUE D'AUTHENTIFICATION (IDENTIQUE V1.4)
    // ==========================================
    
    // VUE CONNEXION
    renderLoginView() {
        document.body.className = "bg-gray-950 text-gray-200 font-sans";
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10 fade-in">
                <div class="text-center mb-10">
                    <h1 class="text-3xl font-black text-white tracking-tighter italic uppercase">DOUKÈ <span class="text-indigo-500">Compta Pro</span></h1>
                    <p class="text-gray-500 mt-2 text-sm uppercase tracking-widest font-bold">Accès Sécurisé</p>
                </div>

                <div id="auth-error" class="hidden mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 text-xs rounded-2xl text-center font-bold"></div>

                <form id="login-form" class="space-y-6">
                    <input type="email" id="email" placeholder="Email professionnel" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <input type="password" id="password" placeholder="Mot de passe" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all transform hover:scale-[1.01]">
                        SE CONNECTER
                    </button>
                </form>

                <div class="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p class="text-gray-500 text-sm">Pas encore de compte ? 
                        <a href="#" onclick="DoukeApp.renderRegisterView()" class="text-indigo-400 font-bold hover:underline">Créer un profil</a>
                    </p>
                </div>
            </div>
        </div>`;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    },

    // VUE INSCRIPTION (AVEC LES RUBRIQUES EXACTES DE VOTRE LOGIQUE)
    renderRegisterView() {
        document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="max-w-md w-full bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-10">
                <h2 class="text-2xl font-bold text-white mb-2 text-center uppercase tracking-tighter">Nouveau Utilisateur</h2>
                <p class="text-gray-500 text-center mb-8 text-xs font-bold uppercase">Configuration du profil DOUKÈ</p>
                
                <form id="register-form" class="space-y-4">
                    <input type="text" id="reg-name" placeholder="Nom complet / Cabinet" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    
                    <input type="email" id="reg-email" placeholder="Email professionnel" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    
                    <input type="password" id="reg-password" placeholder="Mot de passe" required 
                        class="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl text-white outline-none">
                    
                    <div class="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                        <label class="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Rôle Utilisateur</label>
                        <select id="reg-role" class="w-full bg-transparent text-white font-bold outline-none cursor-pointer">
                            <option value="USER" class="bg-gray-900">Client Entreprise</option>
                            <option value="COLLABORATEUR" class="bg-gray-900">Collaborateur Cabinet</option>
                            <option value="ADMIN" class="bg-gray-900">Administrateur</option>
                        </select>
                    </div>

                    <button type="submit" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-900/20">
                        CRÉER LE COMPTE
                    </button>
                </form>

                <button onclick="DoukeApp.renderLoginView()" class="w-full mt-6 text-gray-500 text-xs font-bold hover:text-white transition-all uppercase tracking-widest">
                    <i class="fas fa-arrow-left mr-2"></i> Retour
                </button>
            </div>
        </div>`;

        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    },

    // TRAITEMENT BACKEND (LOGIQUE FETCH v1.4)
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errBox = document.getElementById('auth-error');

        try {
            const res = await fetch(`${this.state.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');

            // Sauvegarde identique au fichier v1.4
            this.state.token = data.token;
            this.state.user = { 
                id: data.utilisateurId, 
                name: data.utilisateurNom, 
                role: data.utilisateurRole 
            };
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.state.user));

            this.startProtectedSession();

        } catch (error) {
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

            alert("Compte créé avec succès pour DOUKÈ Compta Pro !");
            this.renderLoginView();
        } catch (error) {
            alert("Erreur: " + error.message);
        }
    },

    // ==========================================
    // 4. GESTION DE LA SESSION ET DASHBOARD
    // ==========================================
    async startProtectedSession() {
        try {
            // Chargement des entreprises selon le rôle (Admin ou Collab)
            const endpoint = (this.state.user.role === 'ADMIN') ? '/companies' : '/companies/assigned';
            const res = await fetch(`${this.state.API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            
            const data = await res.json();
            this.state.companies = Array.isArray(data) ? data : [];
            
            if (this.state.companies.length > 0 && !this.state.activeCompany) {
                this.state.activeCompany = this.state.companies[0];
                localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
            }
            
            this.renderFullInterface();
        } catch (err) {
            console.error("Erreur session:", err);
            this.renderFullInterface(); 
        }
    },

    renderFullInterface() {
        document.body.innerHTML = `
        <div class="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">
            <aside class="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div class="p-8">
                    <h1 class="text-xl font-black text-white italic tracking-tighter uppercase">DOUKÈ <span class="text-indigo-500">PRO</span></h1>
                </div>
                
                <nav class="flex-1 px-4 space-y-2" id="nav-menu"></nav>

                <div class="p-6 border-t border-gray-800 bg-gray-900/50">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                            ${this.state.user.name.charAt(0)}
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-xs font-black text-white truncate">${this.state.user.name}</p>
                            <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">${this.state.user.role}</p>
                        </div>
                    </div>
                    <button onclick="DoukeApp.logout()" class="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                        <i class="fas fa-power-off"></i> Déconnexion
                    </button>
                </div>
            </aside>

            <main class="flex-1 flex flex-col">
                <header class="h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-10">
                    <div id="company-selector-container"></div>
                    <div class="flex items-center gap-4">
                        <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Statut Serveur: <span class="text-emerald-500">En ligne</span></div>
                    </div>
                </header>
                <div id="main-content" class="flex-1 overflow-y-auto p-10"></div>
            </main>
        </div>`;

        this.updateNavigation();
        this.renderCompanySelector();
        this.route('dashboard');
    },

    updateNavigation() {
        const nav = document.getElementById('nav-menu');
        const role = this.state.user.role;
        
        let html = `
            <a href="#" onclick="DoukeApp.route('dashboard')" class="flex items-center gap-3 p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-600/20">
                <i class="fas fa-chart-line"></i> <span class="text-xs font-black uppercase tracking-widest">Dashboard</span>
            </a>
        `;

        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            html += `
                <div class="pt-6 pb-2 px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-book"></i> <span class="text-xs font-bold uppercase">Saisie Journaux</span>
                </a>
                <a href="#" onclick="DoukeApp.route('balance')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-balance-scale"></i> <span class="text-xs font-bold uppercase">Grand Livre</span>
                </a>
            `;
        }

        if (role === 'ADMIN') {
            html += `
                <div class="pt-6 pb-2 px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Système</div>
                <a href="#" onclick="DoukeApp.route('users')" class="flex items-center gap-3 p-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl transition-all">
                    <i class="fas fa-users-cog"></i> <span class="text-xs font-bold uppercase">Utilisateurs</span>
                </a>
            `;
        }
        nav.innerHTML = html;
    },

    route(view) {
        this.state.view = view;
        const main = document.getElementById('main-content');
        
        if (view === 'dashboard') {
            main.innerHTML = `
                <div class="fade-in">
                    <div class="flex justify-between items-end mb-10">
                        <div>
                            <h2 class="text-3xl font-black text-white tracking-tighter uppercase">Tableau de bord</h2>
                            <p class="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">
                                ${this.state.activeCompany?.name || 'Veuillez sélectionner une entreprise'}
                            </p>
                        </div>
                        <div class="bg-indigo-600/20 border border-indigo-600/30 px-4 py-2 rounded-xl text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            SYSCOHADA Révisé
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800 border-b-emerald-500 border-b-4">
                            <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Trésorerie</p>
                            <h3 class="text-4xl font-black text-white">0 <span class="text-xs text-gray-600 ml-1 italic">FCFA</span></h3>
                        </div>
                        <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800 border-b-indigo-500 border-b-4">
                            <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
                            <h3 class="text-4xl font-black text-white">0 <span class="text-xs text-gray-600 ml-1 italic">FCFA</span></h3>
                        </div>
                        <div class="bg-gray-900 p-8 rounded-3xl border border-gray-800 border-b-red-500 border-b-4">
                            <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Dettes Fournisseurs</p>
                            <h3 class="text-4xl font-black text-white">0 <span class="text-xs text-gray-600 ml-1 italic">FCFA</span></h3>
                        </div>
                    </div>
                </div>`;
        } else {
            main.innerHTML = `
                <div class="h-full flex items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl">
                    <div class="text-center">
                        <i class="fas fa-layer-group text-4xl text-gray-800 mb-4"></i>
                        <p class="text-gray-600 font-black uppercase tracking-[0.3em] text-xs">Module ${view} en cours d'intégration</p>
                    </div>
                </div>`;
        }
    },

    renderCompanySelector() {
        const container = document.getElementById('company-selector-container');
        if (this.state.companies.length === 0) return;

        container.innerHTML = `
            <div class="flex items-center gap-3">
                <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest">Client Actif:</label>
                <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white rounded-xl px-4 py-2 text-xs font-black border border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                    ${this.state.companies.map(c => `
                        <option value="${c.id}" ${this.state.activeCompany?.id == c.id ? 'selected' : ''}>${c.name.toUpperCase()}</option>
                    `).join('')}
                </select>
            </div>`;
    },

    switchCompany(id) {
        const company = this.state.companies.find(c => c.id == id);
        this.state.activeCompany = company;
        localStorage.setItem('activeCompany', JSON.stringify(company));
        this.route(this.state.view);
    },

    logout() {
        localStorage.clear();
        location.reload();
    }
};

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => DoukeApp.init());
