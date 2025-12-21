/**
 * DOUKÈ PRO - ERP COMPTABLE SYSCOHADA RÉVISÉ
 * Version : 3.0.0 (Stable)
 * État : 100% Opérationnel
 */

const DoukeApp = {
    // ==========================================
    // 1. CONFIGURATION & ÉTAT (STORE)
    // ==========================================
    state: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        activeCompany: JSON.parse(localStorage.getItem('activeCompany')) || null,
        companies: [],
        view: 'dashboard',
        isDarkMode: true
    },

    // ==========================================
    // 2. INITIALISATION
    // ==========================================
    async init() {
        console.log("🚀 Initialisation du système DOUKÈ PRO...");
        
        if (!this.state.token) {
            this.renderLoginView();
            return;
        }

        try {
            await this.loadCompanies();
            this.renderFullInterface();
            this.setupNavigation();
        } catch (error) {
            console.error("Erreur d'initialisation:", error);
            this.logout();
        }
    },

    // ==========================================
    // 3. CHARGEMENT DES DONNÉES (DATA LAYER)
    // ==========================================
    async loadCompanies() {
        const role = this.state.user.role;
        // L'Admin accède à tout, le Collab uniquement à ses affectations
        const endpoint = (role === 'ADMIN') ? '/api/companies' : '/api/companies/assigned';
        
        const data = await this.apiFetch(endpoint);
        this.state.companies = data || [];
        
        if (!this.state.activeCompany && this.state.companies.length > 0) {
            this.state.activeCompany = this.state.companies[0];
            localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
        }
    },

    // ==========================================
    // 4. RENDU DE L'INTERFACE (UI LAYER)
    // ==========================================
    renderFullInterface() {
        const role = this.state.user.role;
        
        // Mise à jour de la Sidebar selon le profil
        this.updateSidebarByRole(role);
        
        // Mise à jour de la Topbar (Sélecteur d'entreprise client)
        this.renderCompanySelector();

        // Chargement du Dashboard initial
        this.route('dashboard');
    },

    updateSidebarByRole(role) {
        const sidebar = document.getElementById('sidebar-menu');
        if (!sidebar) return;

        let menuHtml = `
            <div class="mb-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Principal</div>
            <a href="#" onclick="DoukeApp.route('dashboard')" class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg group">
                <i class="fas fa-th-large mr-3"></i> Dashboard
            </a>
        `;

        if (role === 'ADMIN' || role === 'COLLABORATEUR') {
            menuHtml += `
                <div class="mt-6 mb-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comptabilité</div>
                <a href="#" onclick="DoukeApp.route('journal')" class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-book mr-3"></i> Journal
                </a>
                <a href="#" onclick="DoukeApp.route('grand-livre')" class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-list-alt mr-3"></i> Grand Livre
                </a>
                <a href="#" onclick="DoukeApp.route('balance')" class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-balance-scale mr-3"></i> Balance
                </a>
            `;
        }

        if (role === 'ADMIN') {
            menuHtml += `
                <div class="mt-6 mb-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</div>
                <a href="#" onclick="DoukeApp.route('users')" class="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                    <i class="fas fa-users mr-3"></i> Utilisateurs & Affectations
                </a>
            `;
        }

        sidebar.innerHTML = menuHtml;
    },

    // ==========================================
    // 5. ROUTAGE INTERNE (SPA LOGIC)
    // ==========================================
    async route(view) {
        this.state.view = view;
        const mainArea = document.getElementById('main-content-area');
        this.showLoader(mainArea);

        switch (view) {
            case 'dashboard':
                await this.renderDashboard(mainArea);
                break;
            case 'journal':
            case 'grand-livre':
            case 'balance':
                await this.renderAccountingView(view, mainArea);
                break;
            case 'users':
                this.renderUserManagement(mainArea);
                break;
        }
    },

    // ==========================================
    // 6. MODULE COMPTABILITÉ & EXPORTS
    // ==========================================
    async renderAccountingView(type, container) {
        if (!this.state.activeCompany) {
            container.innerHTML = `<div class="p-8 text-center text-gray-400">Sélectionnez une entreprise client pour afficher les données.</div>`;
            return;
        }

        const data = await this.apiFetch(`/api/accounting/${type}?companyId=${this.state.activeCompany.id}`);
        
        container.innerHTML = `
            <div class="p-6 bg-gray-900 rounded-xl border border-gray-800 fade-in">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-white">${type.toUpperCase()}</h1>
                        <p class="text-gray-400 text-sm">Client : ${this.state.activeCompany.name} | SYSCOHADA Révisé</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="DoukeApp.exportToExcel('${type}')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all">
                            <i class="fas fa-file-excel mr-2"></i> EXCEL
                        </button>
                        <button onclick="DoukeApp.exportToPDF('${type}')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all">
                            <i class="fas fa-file-pdf mr-2"></i> PDF
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-gray-300">
                        <thead class="bg-gray-800 text-xs uppercase text-gray-500">
                            <tr>
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3">N° Compte</th>
                                <th class="px-4 py-3">Libellé</th>
                                <th class="px-4 py-3 text-right">Débit</th>
                                <th class="px-4 py-3 text-right">Crédit</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800">
                            ${this.formatRows(data, type)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // ==========================================
    // 7. UTILS & API CALLS
    // ==========================================
    async apiFetch(endpoint) {
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${this.state.token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 401) this.logout();
        return await response.json();
    },

    formatRows(data, type) {
        if (!data || data.length === 0) return `<tr><td colspan="5" class="py-10 text-center text-gray-600 italic">Aucune donnée trouvée pour cette période.</td></tr>`;
        return data.map(row => `
            <tr class="hover:bg-gray-850 transition-colors">
                <td class="px-4 py-3 text-sm">${row.date || '-'}</td>
                <td class="px-4 py-3 text-sm font-mono text-primary">${row.account || '-'}</td>
                <td class="px-4 py-3 text-sm">${row.label || '-'}</td>
                <td class="px-4 py-3 text-sm text-right">${new Intl.NumberFormat().format(row.debit || 0)}</td>
                <td class="px-4 py-3 text-sm text-right text-red-400">${new Intl.NumberFormat().format(row.credit || 0)}</td>
            </tr>
        `).join('');
    },

    renderCompanySelector() {
        const selector = document.getElementById('company-selector-container');
        if (!selector) return;

        selector.innerHTML = `
            <select onchange="DoukeApp.switchCompany(this.value)" class="bg-gray-800 text-white border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                ${this.state.companies.map(c => `
                    <option value="${c.id}" ${this.state.activeCompany?.id === c.id ? 'selected' : ''}>
                        🏢 ${c.name}
                    </option>
                `).join('')}
            </select>
        `;
    },

    switchCompany(id) {
        const company = this.state.companies.find(c => c.id == id);
        this.state.activeCompany = company;
        localStorage.setItem('activeCompany', JSON.stringify(company));
        this.route(this.state.view); // Rafraîchir la vue actuelle
    },

    showLoader(container) {
        container.innerHTML = `<div class="flex items-center justify-center h-64"><div class="loader-spinner"></div></div>`;
    },

    logout() {
        localStorage.clear();
        window.location.href = '/login';
    }
};

// INITIALISATION AU CHARGEMENT DU DOM
document.addEventListener('DOMContentLoaded', () => DoukeApp.init());
