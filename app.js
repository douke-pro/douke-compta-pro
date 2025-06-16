// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT PRINCIPAL
// Système de gestion comptable SYSCOHADA Révisé
// =============================================================================

// =============================================================================
// APPLICATION STATE - ÉTAT GLOBAL DE L'APPLICATION
// =============================================================================
const app = {
    currentProfile: null,
    currentCompany: null,
    currentUser: null,
    isAuthenticated: false,
    accounts: [],
    entries: [],
    companies: [],
    users: [],
    cashRegisters: [],
    companyLogo: null,
    notifications: [],
    deadlines: [],
    statistics: {
        lastUpdate: null,
        totals: {},
        trends: {}
    }
};

// =============================================================================
// THEME MANAGEMENT - GESTION DU THÈME
// =============================================================================
const themeManager = {
    current: 'system',

    init() {
        if (localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            this.current = 'dark';
        } else if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.remove('dark');
            this.current = 'light';
        } else {
            this.current = 'system';
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (this.current === 'system') {
                if (event.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    },

    setTheme(theme) {
        this.current = theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
};

// =============================================================================
// SECURITY & ACCESS CONTROL - SÉCURITÉ ET CONTRÔLE D'ACCÈS
// =============================================================================
const SecurityManager = {
    // Vérifier l'accès à une entreprise pour l'utilisateur actuel
    canAccessCompany(companyId) {
        if (!app.currentUser) return false;
        
        // Admin peut accéder à toutes les entreprises
        if (app.currentProfile === 'admin') return true;
        
        // Utilisateur et Caissier : une seule entreprise
        if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            return userCompanies.length === 1 && userCompanies[0] == companyId;
        }
        
        // Collaborateurs : entreprises assignées
        if (app.currentProfile.includes('collaborateur')) {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            return userCompanies.includes(parseInt(companyId));
        }
        
        return false;
    },

    // Obtenir les entreprises autorisées pour un utilisateur
    getUserCompanies(userId) {
        const user = app.users.find(u => u.id === userId);
        if (!user) return [];
        
        // Utilisateur et Caissier : une seule entreprise prédéfinie
        if (user.profile === 'user') return [1]; // SARL TECH INNOVATION
        if (user.profile === 'caissier') return [2]; // SA COMMERCE PLUS
        
        return user.companies || [];
    },

    // Filtrer les données par entreprise autorisée
    getAuthorizedEntries() {
        if (app.currentProfile === 'admin' && app.currentCompany) {
            return app.entries.filter(e => e.companyId == app.currentCompany);
        }
        
        if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            return app.entries.filter(e => userCompanies.includes(e.companyId));
        }
        
        if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            if (userCompanies.includes(parseInt(app.currentCompany))) {
                return app.entries.filter(e => e.companyId == app.currentCompany);
            }
        }
        
        return [];
    },

    // Obtenir les caisses autorisées
    getAuthorizedCashRegisters() {
        if (app.currentProfile === 'admin' && app.currentCompany) {
            return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
        }
        
        if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            return app.cashRegisters.filter(c => userCompanies.includes(c.companyId));
        }
        
        if (app.currentProfile.includes('collaborateur') && app.currentCompany) {
            const userCompanies = this.getUserCompanies(app.currentUser.id);
            if (userCompanies.includes(parseInt(app.currentCompany))) {
                return app.cashRegisters.filter(c => c.companyId == app.currentCompany);
            }
        }
        
        return [];
    },

    // Vérifier si l'utilisateur doit sélectionner une entreprise
    requiresCompanySelection() {
        return (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) 
               && !app.currentCompany;
    },

    // Forcer la sélection d'entreprise
    enforceCompanySelection(operation) {
        if (this.requiresCompanySelection()) {
            showCompanySelectionWarning(operation);
            return false;
        }
        return true;
    }
};

// =============================================================================
// STATISTICS MANAGER - GESTIONNAIRE DE STATISTIQUES AUTO-MISE À JOUR
// =============================================================================
const StatisticsManager = {
    // Mettre à jour toutes les statistiques
    updateAllStatistics() {
        this.updateBasicStats();
        this.updateTrends();
        this.updateFinancialMetrics();
        app.statistics.lastUpdate = new Date();
        console.log('📊 Statistiques mises à jour:', app.statistics);
    },

    // Statistiques de base
    updateBasicStats() {
        const authorizedEntries = SecurityManager.getAuthorizedEntries();
        const authorizedCashRegisters = SecurityManager.getAuthorizedCashRegisters();
        
        app.statistics.totals = {
            companies: this.getCompanyCount(),
            users: app.users.length,
            activeUsers: app.users.filter(u => u.status === 'Actif').length,
            entries: authorizedEntries.length,
            pendingEntries: authorizedEntries.filter(e => e.status === 'En attente').length,
            validatedEntries: authorizedEntries.filter(e => e.status === 'Validé').length,
            totalDebit: this.calculateTotalDebit(authorizedEntries),
            totalCredit: this.calculateTotalCredit(authorizedEntries),
            cashRegisters: authorizedCashRegisters.length,
            activeCashRegisters: authorizedCashRegisters.filter(c => c.status === 'Ouvert').length
        };
    },

    // Tendances et évolutions
    updateTrends() {
        const authorizedEntries = SecurityManager.getAuthorizedEntries();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthEntries = authorizedEntries.filter(e => {
            const entryDate = new Date(e.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        });
        
        const lastMonthEntries = authorizedEntries.filter(e => {
            const entryDate = new Date(e.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const year = currentMonth === 0 ? currentYear - 1 : currentYear;
            return entryDate.getMonth() === lastMonth && entryDate.getFullYear() === year;
        });

        app.statistics.trends = {
            entriesGrowth: this.calculateGrowthRate(thisMonthEntries.length, lastMonthEntries.length),
            validationRate: this.calculateValidationRate(authorizedEntries),
            averageProcessingTime: this.calculateAverageProcessingTime(authorizedEntries),
            monthlyProgress: this.calculateMonthlyProgress(thisMonthEntries)
        };
    },

    // Métriques financières
    updateFinancialMetrics() {
        const authorizedEntries = SecurityManager.getAuthorizedEntries();
        
        app.statistics.financial = {
            balance: this.calculateBalance(authorizedEntries),
            cashFlow: this.calculateCashFlow(authorizedEntries),
            topAccounts: this.getTopUsedAccounts(authorizedEntries),
            journalDistribution: this.getJournalDistribution(authorizedEntries)
        };
    },

    // Calculer le nombre d'entreprises accessibles
    getCompanyCount() {
        if (app.currentProfile === 'admin') {
            return app.companies.length;
        }
        
        if (app.currentProfile === 'user' || app.currentProfile === 'caissier') {
            return 1; // Une seule entreprise
        }
        
        return SecurityManager.getUserCompanies(app.currentUser.id).length;
    },

    // Calculer le total des débits
    calculateTotalDebit(entries) {
        return entries.reduce((total, entry) => {
            return total + entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        }, 0);
    },

    // Calculer le total des crédits
    calculateTotalCredit(entries) {
        return entries.reduce((total, entry) => {
            return total + entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        }, 0);
    },

    // Calculer le taux de croissance
    calculateGrowthRate(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    },

    // Calculer le taux de validation
    calculateValidationRate(entries) {
        if (entries.length === 0) return 100;
        const validated = entries.filter(e => e.status === 'Validé').length;
        return Math.round((validated / entries.length) * 100);
    },

    // Calculer le temps moyen de traitement
    calculateAverageProcessingTime(entries) {
        const processedEntries = entries.filter(e => e.status === 'Validé');
        if (processedEntries.length === 0) return 0;
        
        // Simulation du temps de traitement (en heures)
        return Math.round(processedEntries.length * 2.5 / processedEntries.length);
    },

    // Calculer le progrès mensuel
    calculateMonthlyProgress(monthEntries) {
        const targetMonthly = 100; // Objectif mensuel
        return Math.min(100, Math.round((monthEntries.length / targetMonthly) * 100));
    },

    // Calculer la balance
    calculateBalance(entries) {
        const totalDebit = this.calculateTotalDebit(entries);
        const totalCredit = this.calculateTotalCredit(entries);
        return totalDebit - totalCredit;
    },

    // Calculer le flux de trésorerie
    calculateCashFlow(entries) {
        const cashAccounts = ['571000', '512000', '531000']; // Caisse, Banque, Chèques postaux
        
        return entries.reduce((flow, entry) => {
            const cashLines = entry.lines.filter(line => cashAccounts.includes(line.account));
            return flow + cashLines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
        }, 0);
    },

    // Obtenir les comptes les plus utilisés
    getTopUsedAccounts(entries) {
        const accountUsage = {};
        
        entries.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.account) {
                    accountUsage[line.account] = (accountUsage[line.account] || 0) + 1;
                }
            });
        });
        
        return Object.entries(accountUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([account, count]) => ({
                account,
                count,
                name: this.getAccountName(account)
            }));
    },

    // Obtenir la distribution par journal
    getJournalDistribution(entries) {
        const distribution = {};
        
        entries.forEach(entry => {
            distribution[entry.journal] = (distribution[entry.journal] || 0) + 1;
        });
        
        return distribution;
    },

    // Obtenir le nom d'un compte
    getAccountName(code) {
        const account = app.accounts.find(acc => acc.code === code);
        return account ? account.name : 'Compte inconnu';
    },

    // Formater les statistiques pour l'affichage
    getFormattedStats() {
        return {
            ...app.statistics.totals,
            ...app.statistics.trends,
            lastUpdate: app.statistics.lastUpdate ? 
                app.statistics.lastUpdate.toLocaleString('fr-FR') : 
                'Jamais mise à jour'
        };
    }
};

// =============================================================================
// LOGO MANAGEMENT - GESTION DU LOGO
// =============================================================================
function uploadLogo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('❌ Le fichier est trop volumineux. Taille maximum: 2 MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                app.companyLogo = e.target.result;
                updateLogoGlobally();
                showSuccessMessage('✅ Logo uploadé et appliqué à toute l\'application !');
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function updateLogoGlobally() {
    if (!app.companyLogo) return;

    const logoElement = document.getElementById('appLogo');
    if (logoElement) {
        logoElement.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
    }

    const logoElements = document.querySelectorAll('.company-logo');
    logoElements.forEach(element => {
        if (element.classList.contains('w-20')) {
            element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-20 h-20 rounded-full object-cover shadow-lg">`;
        } else {
            element.innerHTML = `<img src="${app.companyLogo}" alt="Logo" class="w-8 h-8 rounded object-cover">`;
        }
    });
}

// =============================================================================
// THEME FUNCTIONS - FONCTIONS DE THÈME
// =============================================================================
function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function setTheme(theme) {
    try {
        themeManager.setTheme(theme);
        document.getElementById('themeMenu').classList.add('hidden');
        showSuccessMessage('✅ Thème modifié : ' + theme);
    } catch (error) {
        console.error('Erreur changement thème:', error);
    }
}

// =============================================================================
// UTILITY FUNCTIONS - FONCTIONS UTILITAIRES GLOBALES
// =============================================================================
function showCompanySelectionWarning(operation) {
    const content = `
        <div class="flex items-center justify-center min-h-96">
            <div class="text-center bg-warning/10 p-8 rounded-xl max-w-md">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sélection d'entreprise requise</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Vous devez sélectionner une entreprise dans la barre latérale avant d'accéder aux ${operation}.
                </p>
                <button onclick="focusCompanySelector()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-building mr-2"></i>Sélectionner une entreprise
                </button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function focusCompanySelector() {
    const selector = document.getElementById('activeCompanySelect');
    if (selector) {
        selector.focus();
        selector.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAccessDenied() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ban text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
    `;
}

function showSuccessMessage(message) {
    alert(message);
}

function showErrorMessage(message) {
    alert('❌ ' + message);
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

function getCompanyName() {
    if (!app.currentCompany) return 'Aucune entreprise sélectionnée';

    const company = app.companies.find(c => c.id == app.currentCompany);
    return company ? company.name : 'Entreprise inconnue';
}

function updateSelectedCompanyInfo() {
    const company = app.companies.find(c => c.id == app.currentCompany);
    const infoElement = document.getElementById('selectedCompanyInfo');
    const currentCompanyElement = document.getElementById('currentCompany');

    if (company) {
        if (infoElement) {
            infoElement.innerHTML = `${company.system} • ${company.status}`;
        }
        if (currentCompanyElement) {
            currentCompanyElement.textContent = company.name;
        }
    } else {
        if (infoElement) {
            infoElement.innerHTML = '';
        }
        if (currentCompanyElement) {
            currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
        }
    }
}

// =============================================================================
// EVENT LISTENERS & GLOBAL COORDINATION
// =============================================================================
function bindEventListeners() {
    try {
        // Company selector avec sécurité renforcée
        setTimeout(() => {
            const companySelect = document.getElementById('activeCompanySelect');
            if (companySelect) {
                companySelect.addEventListener('change', function(e) {
                    const selectedCompanyId = e.target.value;
                    
                    // Vérifier l'autorisation d'accès
                    if (selectedCompanyId && SecurityManager.canAccessCompany(selectedCompanyId)) {
                        app.currentCompany = selectedCompanyId;
                        updateSelectedCompanyInfo();
                        StatisticsManager.updateAllStatistics(); // Mise à jour automatique des stats
                        console.log('✅ Entreprise sélectionnée:', app.currentCompany);
                        
                        // Rafraîchir la page actuelle si nécessaire
                        if (typeof refreshCurrentPage === 'function') {
                            refreshCurrentPage();
                        }
                    } else if (selectedCompanyId) {
                        alert('❌ Vous n\'avez pas accès à cette entreprise.');
                        e.target.value = app.currentCompany || '';
                    } else {
                        app.currentCompany = null;
                        updateSelectedCompanyInfo();
                    }
                });
            }
        }, 100);

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('-translate-x-full');
                }
            });
        }

        // Close menus when clicking outside
        document.addEventListener('click', function(e) {
            // Close theme menu
            const themeMenu = document.getElementById('themeMenu');
            const themeButton = e.target.closest('[onclick="toggleThemeMenu()"]');
            if (themeMenu && !themeMenu.contains(e.target) && !themeButton) {
                themeMenu.classList.add('hidden');
            }

            // Close notifications panel
            const notifPanel = document.getElementById('notificationsPanel');
            const notifButton = e.target.closest('[onclick="toggleNotificationsPanel()"]');
            if (notifPanel && !notifPanel.contains(e.target) && !notifButton) {
                notifPanel.classList.add('hidden');
            }

            // Close sidebar on outside click (mobile)
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (window.innerWidth < 1024 && sidebar && sidebarToggle && 
                !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.add('-translate-x-full');
            }
        });
        
    } catch (error) {
        console.error('Erreur bindEventListeners:', error);
    }
}

// =============================================================================
// APPLICATION INITIALIZATION - INITIALISATION PRINCIPALE
// =============================================================================
function initializeApp() {
    try {
        console.log('🔄 Initialisation de l\'application sécurisée...');

        // Initialiser le thème
        themeManager.init();
        
        // Initialiser les données (délégué à data.js)
        if (typeof initializeData === 'function') {
            initializeData();
        }
        
        // Charger la navigation (délégué à navigation.js)
        if (typeof loadNavigationMenu === 'function') {
            loadNavigationMenu();
        }
        
        // Mettre à jour l'interface utilisateur (délégué à auth.js)
        if (typeof updateUserInfo === 'function') {
            updateUserInfo();
        }
        
        // Charger le dashboard (délégué à dashboard.js)
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
        
        // Lier les événements
        bindEventListeners();

        // Mettre à jour les statistiques automatiquement toutes les 5 minutes
        setInterval(() => {
            StatisticsManager.updateAllStatistics();
            console.log('📊 Statistiques mises à jour automatiquement');
        }, 5 * 60 * 1000);

        console.log('✅ DOUKÈ Compta Pro initialisé avec sécurité renforcée !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors de l\'initialisation de l\'application');
    }
}

// =============================================================================
// APPLICATION START - DÉMARRAGE DE L'APPLICATION
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    try {
        setTimeout(() => {
            bindEventListeners();
            console.log('🚀 DOUKÈ Compta Pro - Application sécurisée démarrée');
        }, 100);
    } catch (error) {
        console.error('❌ Erreur au démarrage:', error);
    }
});

// Protection globale contre les erreurs
window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale capturée:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
});

// Export des fonctions principales pour usage par les autres modules
window.DOUKECompta = {
    app,
    SecurityManager,
    StatisticsManager,
    themeManager,
    initializeApp,
    showSuccessMessage,
    showErrorMessage,
    closeModal,
    getCompanyName,
    updateSelectedCompanyInfo
};
