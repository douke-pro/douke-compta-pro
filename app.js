// =============================================================================
// DOUKÈ COMPTA PRO - APPLICATION JAVASCRIPT INTÉGRALE
// Système de gestion comptable SYSCOHADA Révisé - VERSION COMPLÈTE
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
// DATA INITIALIZATION - INITIALISATION DES DONNÉES
// =============================================================================
function initializeData() {
    // Plan comptable SYSCOHADA Révisé complet
    app.accounts = [
        // Classe 1 - Comptes de ressources durables
        { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
        { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
        { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
        { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
        { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
        { code: '171000', name: 'Dettes de crédit-bail', category: 'Dettes financières' },

        // Classe 2 - Comptes d'actif immobilisé
        { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
        { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
        { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
        { code: '221000', name: 'Logiciels', category: 'Immobilisations incorporelles' },
        { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
        { code: '241000', name: 'Matériel et mobilier', category: 'Immobilisations corporelles' },

        // Classe 3 - Comptes de stocks
        { code: '311000', name: 'Marchandises', category: 'Stocks' },
        { code: '321000', name: 'Matières premières', category: 'Stocks' },
        { code: '371000', name: 'Stock en cours', category: 'Stocks' },
        { code: '381000', name: 'Stocks de produits finis', category: 'Stocks' },

        // Classe 4 - Comptes de tiers
        { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
        { code: '411000', name: 'Clients', category: 'Clients' },
        { code: '421000', name: 'Personnel', category: 'Personnel' },
        { code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux' },
        { code: '441000', name: 'État et collectivités', category: 'État' },
        { code: '471000', name: 'Comptes d\'attente', category: 'Comptes transitoires' },

        // Classe 5 - Comptes financiers
        { code: '512000', name: 'Banques', category: 'Comptes bancaires' },
        { code: '531000', name: 'Chèques postaux', category: 'Comptes postaux' },
        { code: '571000', name: 'Caisse', category: 'Caisse' },
        { code: '581000', name: 'Virements internes', category: 'Virements' },

        // Classe 6 - Comptes de charges
        { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
        { code: '605000', name: 'Autres achats', category: 'Achats' },
        { code: '621000', name: 'Transports', category: 'Services extérieurs' },
        { code: '622000', name: 'Rémunérations intermédiaires', category: 'Services extérieurs' },
        { code: '631000', name: 'Impôts et taxes', category: 'Impôts et taxes' },
        { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
        { code: '646000', name: 'Charges sociales', category: 'Charges de personnel' },
        { code: '681000', name: 'Dotations aux amortissements', category: 'Dotations' },

        // Classe 7 - Comptes de produits
        { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
        { code: '706000', name: 'Services vendus', category: 'Ventes' },
        { code: '771000', name: 'Revenus financiers', category: 'Produits financiers' },
        { code: '781000', name: 'Reprises d\'amortissements', category: 'Reprises' },

        // Classe 8 - Comptes de résultats
        { code: '801000', name: 'Résultat en instance d\'affectation', category: 'Résultats' },
        { code: '810000', name: 'Résultat net: bénéfice', category: 'Résultats' },
        { code: '820000', name: 'Résultat net: perte', category: 'Résultats' },

        // Classe 9 - Comptes analytiques
        { code: '901000', name: 'Coûts de revient', category: 'Comptabilité analytique' },
        { code: '905000', name: 'Coûts de production', category: 'Comptabilité analytique' },
        { code: '910000', name: 'Charges indirectes', category: 'Comptabilité analytique' },
        { code: '920000', name: 'Centres d\'analyse', category: 'Comptabilité analytique' }
    ];

    // Entreprises avec restriction d'accès
    app.companies = [
        {
            id: 1,
            name: 'SARL TECH INNOVATION',
            type: 'SARL',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 07 12 34 56 78',
            address: 'Abidjan, Cocody',
            cashRegisters: 3
        },
        {
            id: 2,
            name: 'SA COMMERCE PLUS',
            type: 'SA',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 05 98 76 54 32',
            address: 'Abidjan, Plateau',
            cashRegisters: 5
        },
        {
            id: 3,
            name: 'EURL SERVICES PRO',
            type: 'EURL',
            status: 'Période d\'essai',
            system: 'Minimal',
            phone: '+225 01 23 45 67 89',
            address: 'Bouaké Centre',
            cashRegisters: 2
        },
        {
            id: 4,
            name: 'SAS DIGITAL WORLD',
            type: 'SAS',
            status: 'Suspendu',
            system: 'Normal',
            phone: '+225 07 11 22 33 44',
            address: 'San-Pédro',
            cashRegisters: 1
        }
    ];

    // Utilisateurs avec restrictions d'entreprises
    app.users = [
        {
            id: 1,
            name: 'Admin Système',
            email: 'admin@doukecompta.ci',
            role: 'Administrateur',
            profile: 'admin',
            phone: '+225 07 00 00 00 00',
            companies: [1, 2, 3, 4], // Admin accède à toutes
            status: 'Actif'
        },
        {
            id: 2,
            name: 'Marie Kouassi',
            email: 'marie.kouassi@cabinet.com',
            role: 'Collaborateur Senior',
            profile: 'collaborateur-senior',
            phone: '+225 07 11 11 11 11',
            companies: [1, 2, 3], // Entreprises assignées
            status: 'Actif'
        },
        {
            id: 3,
            name: 'Jean Diabaté',
            email: 'jean.diabate@cabinet.com',
            role: 'Collaborateur',
            profile: 'collaborateur',
            phone: '+225 07 22 22 22 22',
            companies: [2, 4], // Entreprises assignées
            status: 'Actif'
        },
        {
            id: 4,
            name: 'Amadou Traoré',
            email: 'atraore@sarltech.ci',
            role: 'Utilisateur',
            profile: 'user',
            phone: '+225 07 33 33 33 33',
            companies: [1], // Une seule entreprise
            status: 'Actif'
        },
        {
            id: 5,
            name: 'Ibrahim Koné',
            email: 'ikone@caisse.ci',
            role: 'Caissier',
            profile: 'caissier',
            phone: '+225 07 44 44 44 44',
            companies: [2], // Une seule entreprise
            status: 'Actif'
        }
    ];

    // Écritures avec restriction par entreprise
    app.entries = [
        {
            id: 1,
            date: '2024-12-15',
            journal: 'JV',
            piece: 'JV-2024-001-0156',
            libelle: 'Vente marchandises Client ABC',
            companyId: 1,
            lines: [
                { account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 },
                { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },
                { account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }
            ],
            status: 'Validé',
            userId: 2
        },
        {
            id: 2,
            date: '2024-12-14',
            journal: 'JA',
            piece: 'JA-2024-001-0157',
            libelle: 'Achat marchandises Fournisseur XYZ',
            companyId: 1,
            lines: [
                { account: '601000', accountName: 'Achats de marchandises', libelle: 'Achat marchandises', debit: 850000, credit: 0 },
                { account: '441000', accountName: 'État et collectivités', libelle: 'TVA déductible', debit: 170000, credit: 0 },
                { account: '401000', accountName: 'Fournisseurs', libelle: 'Fournisseur XYZ', debit: 0, credit: 1020000 }
            ],
            status: 'En attente',
            userId: 3
        },
        {
            id: 3,
            date: '2024-12-13',
            journal: 'JC',
            piece: 'JC-2024-002-0034',
            libelle: 'Recette caisse vente comptant',
            companyId: 2,
            lines: [
                { account: '571000', accountName: 'Caisse', libelle: 'Encaissement espèces', debit: 150000, credit: 0 },
                { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente comptant', debit: 0, credit: 150000 }
            ],
            status: 'Validé',
            userId: 5
        },
        {
            id: 4,
            date: '2024-12-12',
            journal: 'JB',
            piece: 'JB-2024-003-0045',
            libelle: 'Virement bancaire fournisseur',
            companyId: 2,
            lines: [
                { account: '401000', accountName: 'Fournisseurs', libelle: 'Règlement fournisseur', debit: 500000, credit: 0 },
                { account: '512000', accountName: 'Banques', libelle: 'Virement sortant', debit: 0, credit: 500000 }
            ],
            status: 'Validé',
            userId: 5
        },
        {
            id: 5,
            date: '2024-12-11',
            journal: 'JG',
            piece: 'JG-2024-004-0078',
            libelle: 'Dotation amortissement matériel',
            companyId: 3,
            lines: [
                { account: '681000', accountName: 'Dotations aux amortissements', libelle: 'Amortissement matériel', debit: 125000, credit: 0 },
                { account: '244000', accountName: 'Matériel et outillage', libelle: 'Amortissement cumulé', debit: 0, credit: 125000 }
            ],
            status: 'Validé',
            userId: 2
        }
    ];

    // Caisses par entreprise
    app.cashRegisters = [
        {
            id: 1,
            name: 'Caisse Principale',
            companyId: 2,
            responsibleId: 5,
            responsibleName: 'Ibrahim Koné',
            balance: 210000,
            status: 'Ouvert',
            openingBalance: 150000,
            dailyReceipts: 85000,
            dailyExpenses: 25000
        },
        {
            id: 2,
            name: 'Caisse Ventes',
            companyId: 2,
            responsibleId: null,
            responsibleName: 'Non assigné',
            balance: 85000,
            status: 'Ouvert',
            openingBalance: 100000,
            dailyReceipts: 35000,
            dailyExpenses: 50000
        },
        {
            id: 3,
            name: 'Caisse Réception',
            companyId: 1,
            responsibleId: null,
            responsibleName: 'Non assigné',
            balance: 0,
            status: 'Fermé',
            openingBalance: 0,
            dailyReceipts: 0,
            dailyExpenses: 0
        },
        {
            id: 4,
            name: 'Caisse Principale',
            companyId: 3,
            responsibleId: null,
            responsibleName: 'Non assigné',
            balance: 45000,
            status: 'Ouvert',
            openingBalance: 50000,
            dailyReceipts: 15000,
            dailyExpenses: 20000
        }
    ];

    // Initialiser les statistiques
    StatisticsManager.updateAllStatistics();
    
    console.log('✅ Données initialisées avec succès avec sécurité renforcée');
}

// =============================================================================
// AUTHENTICATION & USER MANAGEMENT - AUTHENTIFICATION COMPLÈTE
// =============================================================================
function loginAs(profile) {
    const credentials = {
        'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
        'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
        'user': { email: 'atraore@sarltech.ci', password: 'user123' },
        'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
        handleLogin();
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('❌ Veuillez saisir votre email et mot de passe.');
        return;
    }

    const users = {
        'admin@doukecompta.ci': {
            password: 'admin123',
            profile: 'admin',
            name: 'Admin Système',
            role: 'Administrateur',
            id: 1
        },
        'marie.kouassi@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur-senior',
            name: 'Marie Kouassi',
            role: 'Collaborateur Senior',
            id: 2
        },
        'jean.diabate@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur',
            name: 'Jean Diabaté',
            role: 'Collaborateur',
            id: 3
        },
        'atraore@sarltech.ci': {
            password: 'user123',
            profile: 'user',
            name: 'Amadou Traoré',
            role: 'Utilisateur',
            id: 4
        },
        'ikone@caisse.ci': {
            password: 'caisse123',
            profile: 'caissier',
            name: 'Ibrahim Koné',
            role: 'Caissier',
            id: 5
        }
    };

    const user = users[email];
    if (user && user.password === password) {
        app.isAuthenticated = true;
        app.currentProfile = user.profile;
        app.currentUser = {
            id: user.id,
            name: user.name,
            email: email,
            role: user.role
        };

        // Auto-sélection d'entreprise pour utilisateur et caissier (UNE SEULE ENTREPRISE)
        if (user.profile === 'user') {
            app.currentCompany = '1'; // SARL TECH INNOVATION uniquement
        } else if (user.profile === 'caissier') {
            app.currentCompany = '2'; // SA COMMERCE PLUS uniquement
        }

        showMainApp();
        console.log('✅ Connexion réussie:', user.name);
    } else {
        alert('❌ Identifiants incorrects. Utilisez les comptes de démonstration.');
    }
}

function showMainApp() {
    document.getElementById('loginInterface').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initializeApp();
}

function confirmLogout() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-sign-out-alt text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Confirmer la déconnexion</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            </div>
            <div class="flex justify-center space-x-4">
                <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Annuler
                </button>
                <button onclick="logout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                </button>
            </div>
        </div>
    </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

function logout() {
    closeModal();
    showLoginInterface();
    showSuccessMessage('✅ Déconnexion réussie. À bientôt !');
}

function showLoginInterface() {
    document.getElementById('loginInterface').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('modalContainer').innerHTML = '';
    app.isAuthenticated = false;
    app.currentProfile = null;
    app.currentUser = null;
    app.currentCompany = null;
}

// =============================================================================
// NAVIGATION & INTERFACE MANAGEMENT - NAVIGATION COMPLÈTE
// =============================================================================
function loadNavigationMenu() {
    const menuItems = {
        admin: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord Admin', active: true },
            { id: 'users', icon: 'fas fa-users', text: 'Gestion Collaborateurs' },
            { id: 'companies', icon: 'fas fa-building', text: 'Gestion Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        'collaborateur-senior': [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        collaborateur: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        user: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Mon Entreprise', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Mes Écritures' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Mes Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Mes Rapports' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balance' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        caissier: [
            { id: 'dashboard', icon: 'fas fa-cash-register', text: 'Ma Caisse', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Opérations Caisse' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Comptes Disponibles' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'État de Caisse' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ]
    };

    const items = menuItems[app.currentProfile] || menuItems.user;
    const menuHtml = items.map(item => `
        <a href="#" onclick="navigateTo('${item.id}'); return false;" class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
            <i class="${item.icon} w-5 h-5 mr-3"></i>
            <span>${item.text}</span>
        </a>
    `).join('');

    document.getElementById('navigationMenu').innerHTML = menuHtml;
}

function navigateTo(page, element = null) {
    // Remove active class from all menu items
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active class to clicked item
    if (element) {
        element.classList.add('bg-primary', 'text-white');
        element.classList.remove('text-gray-700', 'dark:text-gray-300');
    } else {
        // Find the clicked element from event if available
        try {
            const clickedElement = event.target.closest('a');
            if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
                clickedElement.classList.add('bg-primary', 'text-white');
                clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
            }
        } catch (e) {
            // Ignore error if event is not available
        }
    }

    console.log('🔄 Navigation vers:', page);

    // Load page content with security checks
    try {
        switch(page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'users':
                if (app.currentProfile === 'admin') {
                    loadUsersManagement();
                } else {
                    showAccessDenied();
                }
                break;
            case 'companies':
                loadCompanies();
                break;
            case 'entries':
                loadEntries();
                break;
            case 'accounts':
                loadAccounts();
                break;
            case 'caisse':
                loadCaisse();
                break;
            case 'reports':
                loadReports();
                break;
            case 'import':
                loadImport();
                break;
            case 'settings':
                loadSettings();
                break;
            default:
                console.log('⚠️ Page inconnue, chargement du dashboard');
                loadDashboard();
        }
        
        // Mettre à jour les statistiques après navigation
        StatisticsManager.updateAllStatistics();
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page:', error);
        showErrorMessage('Erreur lors du chargement de la page: ' + page);
    }
}

function updateUserInfo() {
    const profiles = {
        'admin': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur-senior': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
        'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
    };

    const profile = profiles[app.currentProfile];

    document.getElementById('currentUser').textContent = app.currentUser.name;
    document.getElementById('currentCompany').textContent = app.currentCompany ? getCompanyName() : profile.defaultCompany;
    document.getElementById('sidebarUserName').textContent = app.currentUser.name;
    document.getElementById('sidebarUserRole').textContent = app.currentUser.role;

    // Gestion de l'affichage du sélecteur d'entreprise
    const companySelector = document.getElementById('companySelector');
    const adminActions = document.getElementById('adminActions');

    if (companySelector) {
        companySelector.style.display = profile.showSelector ? 'block' : 'none';

        if (profile.showSelector) {
            populateCompanySelector();
        }
    }

    if (adminActions) {
        adminActions.style.display = app.currentProfile === 'admin' ? 'block' : 'none';
    }

    updateLogoGlobally();
}

function populateCompanySelector() {
    const select = document.getElementById('activeCompanySelect');
    if (select) {
        select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        // Filtrer les entreprises selon les droits d'accès
        const userCompanies = SecurityManager.getUserCompanies(app.currentUser.id);
        const availableCompanies = app.companies.filter(company => 
            userCompanies.includes(company.id)
        );

        availableCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id == app.currentCompany) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
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
// DASHBOARD FUNCTIONS - TABLEAUX DE BORD COMPLETS
// =============================================================================
function loadDashboard() {
    if (app.currentProfile === 'admin') {
        loadAdminDashboard();
    } else {
        loadStandardDashboard();
    }
}

function loadAdminDashboard() {
    const stats = StatisticsManager.getFormattedStats();
    
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${stats.lastUpdate}
                </div>
            </div>

            <!-- KPI Cards Admin avec statistiques dynamiques -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.companies.filter(c => c.status === 'Actif').length}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas fa-building text-primary text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-success">+${Math.floor(Math.random() * 5) + 1}</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.activeUsers}</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-users text-info text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-${stats.activeUsers >= 4 ? 'success' : 'warning'}">
                            ${stats.activeUsers >= 4 ? '↗' : '→'} ${((stats.activeUsers/stats.users)*100).toFixed(0)}%
                        </span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">d'activité</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.pendingEntries}</p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-${stats.pendingEntries <= 2 ? 'success' : 'warning'}">
                            ${stats.validationRate}%
                        </span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">taux validation</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Écritures</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.entries}</p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-check text-success text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-success">+${stats.entriesGrowth || 15}%</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">vs mois dernier</span>
                    </div>
                </div>
            </div>

            <!-- Métriques financières -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-money-bill-wave mr-2 text-success"></i>Flux Financiers
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Total Débits</span>
                            <span class="font-bold text-gray-900 dark:text-white">${(stats.totalDebit || 0).toLocaleString('fr-FR')} F</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Total Crédits</span>
                            <span class="font-bold text-gray-900 dark:text-white">${(stats.totalCredit || 0).toLocaleString('fr-FR')} F</span>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t">
                            <span class="text-gray-900 dark:text-white font-medium">Balance</span>
                            <span class="font-bold ${(stats.totalDebit - stats.totalCredit) >= 0 ? 'text-success' : 'text-danger'}">
                                ${Math.abs(stats.totalDebit - stats.totalCredit).toLocaleString('fr-FR')} F
                                ${(stats.totalDebit - stats.totalCredit) >= 0 ? 'D' : 'C'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-chart-line mr-2 text-primary"></i>Performance
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Taux de validation</span>
                            <div class="flex items-center">
                                <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3">
                                    <div class="h-full bg-success rounded-full" style="width: ${stats.validationRate}%"></div>
                                </div>
                                <span class="font-bold text-success">${stats.validationRate}%</span>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Temps moyen traitement</span>
                            <span class="font-bold text-gray-900 dark:text-white">${stats.averageProcessingTime || 2}h</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Progrès mensuel</span>
                            <span class="font-bold text-primary">${stats.monthlyProgress || 85}%</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-cash-register mr-2 text-warning"></i>Caisses
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Total caisses</span>
                            <span class="font-bold text-gray-900 dark:text-white">${stats.cashRegisters}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Caisses actives</span>
                            <span class="font-bold text-success">${stats.activeCashRegisters}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 dark:text-gray-400">Taux d'utilisation</span>
                            <span class="font-bold text-primary">${stats.cashRegisters > 0 ? Math.round((stats.activeCashRegisters/stats.cashRegisters)*100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Portefeuille et graphiques -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille Collaborateurs
                    </h3>
                    <div class="space-y-4">
                        ${generateCollaboratorPortfolio()}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dernières Activités</h3>
                    <div class="space-y-3">
                        ${generateRecentActivities()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function loadStandardDashboard() {
    const stats = StatisticsManager.getFormattedStats();
    const userCompany = app.companies.find(c => c.id == app.currentCompany);
    let dashboardTitle = 'Tableau de Bord';

    if (app.currentProfile === 'user') {
        dashboardTitle = 'Mon Entreprise - ' + (userCompany ? userCompany.name : 'SARL TECH INNOVATION');
    } else if (app.currentProfile === 'caissier') {
        dashboardTitle = 'Ma Caisse - ' + (userCompany ? userCompany.name : 'SA COMMERCE PLUS');
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Mise à jour: ${stats.lastUpdate}
                </div>
            </div>

            <!-- KPI Cards avec données personnalisées -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ${app.currentProfile === 'caissier' ? 'Opérations aujourd\'hui' : 'Mes écritures'}
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${app.currentProfile === 'caissier' ? '12' : stats.entries}
                            </p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas ${app.currentProfile === 'caissier' ? 'fa-calculator' : 'fa-edit'} text-primary text-xl"></i>
                        </div>
                    </div>
                    ${app.currentProfile === 'caissier' ? `
                    <div class="mt-3">
                        <button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                            Nouvelle opération
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ${app.currentProfile === 'caissier' ? 'Solde caisse' : 'Écritures validées'}
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${app.currentProfile === 'caissier' ? '210,000 F' : stats.validatedEntries}
                            </p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas ${app.currentProfile === 'caissier' ? 'fa-wallet' : 'fa-check'} text-success text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-success">+${app.currentProfile === 'caissier' ? '15%' : stats.validationRate + '%'}</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">performance</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.pendingEntries}</p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-clock text-warning text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de réussite</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${stats.validationRate}%</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-chart-line text-info text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            ${app.currentProfile === 'caissier' ? generateCashierDashboard() : generateStandardUserDashboard()}
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = content;
}

function generateCashierDashboard() {
    return `
        <!-- Interface spéciale Caissier -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-cash-register mr-2 text-primary"></i>État de ma Caisse
                </h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                        <span class="text-success font-medium">Solde d'ouverture</span>
                        <span class="text-2xl font-bold text-success">150,000 F</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">
                        <span class="text-info font-medium">Recettes du jour</span>
                        <span class="text-2xl font-bold text-info">+85,000 F</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
                        <span class="text-warning font-medium">Dépenses du jour</span>
                        <span class="text-2xl font-bold text-warning">-25,000 F</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">
                        <span class="text-primary font-medium">Solde actuel</span>
                        <span class="text-3xl font-bold text-primary">210,000 F</span>
                    </div>
                </div>

                <div class="mt-6 grid grid-cols-2 gap-4">
                    <button onclick="navigateTo('entries')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i>Nouvelle opération
                    </button>
                    <button onclick="navigateTo('reports')" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-print mr-2"></i>État de caisse
                    </button>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-history mr-2 text-info"></i>Dernières Opérations
                </h3>
                <div class="space-y-3">
                    ${generateCashierOperations()}
                </div>
            </div>
        </div>
    `;
}

function generateStandardUserDashboard() {
    return `
        <!-- Dashboard utilisateur standard -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité Récente</h3>
                <div class="space-y-3">
                    ${generateUserRecentActivity()}
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accès Rapides</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="navigateTo('entries')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-edit text-2xl text-primary mb-2"></i>
                        <div class="font-medium text-gray-900 dark:text-white">Écritures</div>
                    </button>
                    
                    <button onclick="navigateTo('reports')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-chart-bar text-2xl text-success mb-2"></i>
                        <div class="font-medium text-gray-900 dark:text-white">Rapports</div>
                    </button>
                    
                    <button onclick="navigateTo('accounts')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-list text-2xl text-info mb-2"></i>
                        <div class="font-medium text-gray-900 dark:text-white">Plan Comptable</div>
                    </button>
                    
                    <button onclick="navigateTo('caisse')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-cash-register text-2xl text-warning mb-2"></i>
                        <div class="font-medium text-gray-900 dark:text-white">Caisses</div>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =============================================================================
// ENTRIES MANAGEMENT - GESTION DES ÉCRITURES SÉCURISÉE
// =============================================================================
function loadEntries() {
    // Vérification sécurisée de l'accès
    if (!SecurityManager.enforceCompanySelection('écritures comptables')) {
        return;
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-building mr-2"></i><span>${getCompanyName()}</span>
                    </div>
                    <button onclick="openNewEntryModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle écriture
                    </button>
                </div>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option>Tous les journaux</option>
                        <option>Journal Général (JG)</option>
                        <option>Journal des Achats (JA)</option>
                        <option>Journal des Ventes (JV)</option>
                        <option>Journal de Banque (JB)</option>
                        <option>Journal de Caisse (JC)</option>
                        <option>Journal des Opérations Diverses (JOD)</option>
                    </select>
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>En attente</option>
                        <option>Brouillon</option>
                    </select>
                    <input type="date" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
            </div>

            <!-- Liste des écritures sécurisée -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        ${app.currentProfile === 'caissier' ? 'Mes Opérations de Caisse' : 'Liste des Écritures'}
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Pièce</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${generateSecureEntriesRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function generateSecureEntriesRows() {
    // Utiliser les données filtrées par sécurité
    const filteredEntries = SecurityManager.getAuthorizedEntries();

    if (filteredEntries.length === 0) {
        return `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <div>Aucune écriture trouvée pour cette entreprise</div>
                    <div class="text-sm">Cliquez sur "Nouvelle écriture" pour commencer</div>
                </td>
            </tr>
        `;
    }

    return filteredEntries.map(entry => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${entry.libelle}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} F</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-2">
                    <button onclick="viewEntryDetails(${entry.id})" class="text-primary hover:text-primary/80" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${entry.userId === app.currentUser.id || app.currentProfile === 'admin' ? `
                    <button onclick="editEntryModal(${entry.id})" class="text-info hover:text-info/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                    ${entry.status === 'En attente' && (app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur')) ? `
                    <button onclick="validateEntry(${entry.id})" class="text-success hover:text-success/80" title="Valider">
                        <i class="fas fa-check"></i>
                    </button>
                    ` : ''}
                    ${(entry.userId === app.currentUser.id || app.currentProfile === 'admin') && entry.status !== 'Validé' ? `
                    <button onclick="confirmDeleteEntry(${entry.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// =============================================================================
// UTILITY FUNCTIONS - FONCTIONS UTILITAIRES
// =============================================================================
function generateCollaboratorPortfolio() {
    const collaborators = app.users.filter(u => u.profile.includes('collaborateur'));

    if (collaborators.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun collaborateur trouvé</div>';
    }

    return collaborators.map(collab => {
        const companiesCount = collab.companies?.length || 0;
        const performance = 85 + Math.floor(Math.random() * 15); // Performance simulée
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                        ${collab.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900 dark:text-white">${collab.name}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${collab.role}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-gray-900 dark:text-white">${companiesCount}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">entreprise${companiesCount > 1 ? 's' : ''}</div>
                    <div class="flex items-center space-x-2 mt-1">
                        <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div class="h-full bg-success" style="width: ${performance}%"></div>
                        </div>
                        <span class="text-xs font-medium text-success">${performance}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateRecentActivities() {
    const activities = [
        { user: 'Marie Kouassi', action: 'a validé une écriture', time: 'Il y a 15 min', type: 'success' },
        { user: 'Jean Diabaté', action: 'a créé une nouvelle écriture', time: 'Il y a 32 min', type: 'info' },
        { user: 'Ibrahim Koné', action: 'a effectué une opération caisse', time: 'Il y a 1h', type: 'warning' },
        { user: 'Admin Système', action: 'a ajouté un nouveau collaborateur', time: 'Il y a 2h', type: 'primary' }
    ];

    return activities.map(activity => `
        <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div class="w-8 h-8 bg-${activity.type}/10 text-${activity.type} rounded-full flex items-center justify-center">
                <i class="fas fa-user text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm text-gray-900 dark:text-white">
                    <span class="font-medium">${activity.user}</span> ${activity.action}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function generateUserRecentActivity() {
    const authorizedEntries = SecurityManager.getAuthorizedEntries();
    const recentEntries = authorizedEntries.slice(-5).reverse();

    if (recentEntries.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucune activité récente</div>';
    }

    return recentEntries.map(entry => `
        <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div class="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <i class="fas fa-edit text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm text-gray-900 dark:text-white font-medium">${entry.libelle}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                    ${new Date(entry.date).toLocaleDateString('fr-FR')} - ${entry.journal}
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} F
                </div>
                <span class="text-xs px-2 py-1 rounded ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">
                    ${entry.status}
                </span>
            </div>
        </div>
    `).join('');
}

function generateCashierOperations() {
    const operations = [
        { time: '14:30', type: 'Recette', description: 'Vente comptant', amount: '+15,000', status: 'En attente' },
        { time: '13:15', type: 'Dépense', description: 'Achat fournitures', amount: '-5,000', status: 'Validé' },
        { time: '11:45', type: 'Recette', description: 'Encaissement client', amount: '+25,000', status: 'Validé' },
        { time: '10:20', type: 'Dépense', description: 'Frais transport', amount: '-3,500', status: 'En attente' }
    ];

    return operations.map(op => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 ${op.type === 'Recette' ? 'bg-success' : 'bg-warning'} text-white rounded-full flex items-center justify-center">
                    <i class="fas ${op.type === 'Recette' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i>
                </div>
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">${op.description}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${op.time}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-bold ${op.type === 'Recette' ? 'text-success' : 'text-warning'}">${op.amount} F</div>
                <div class="text-xs ${op.status === 'Validé' ? 'text-success' : 'text-warning'}">${op.status}</div>
            </div>
        </div>
    `).join('');
}

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
// PLACEHOLDER FUNCTIONS - MODULES À DÉVELOPPER
// =============================================================================
function loadUsersManagement() {
    showSuccessMessage('👥 Module Gestion Utilisateurs\n\nFonctionnalité en cours de développement.');
}

function loadCompanies() {
    showSuccessMessage('🏢 Module Gestion Entreprises\n\nFonctionnalité en cours de développement.');
}

function loadAccounts() {
    showSuccessMessage('📊 Module Plan Comptable\n\nFonctionnalité en cours de développement.');
}

function loadCaisse() {
    showSuccessMessage('💰 Module Gestion Caisses\n\nFonctionnalité en cours de développement.');
}

function loadReports() {
    showSuccessMessage('📈 Module Rapports\n\nFonctionnalité en cours de développement.');
}

function loadImport() {
    showSuccessMessage('📤 Module Import\n\nFonctionnalité en cours de développement.');
}

function loadSettings() {
    showSuccessMessage('⚙️ Module Paramètres\n\nFonctionnalité en cours de développement.');
}

function openNewEntryModal() {
    showSuccessMessage('➕ Nouvelle Écriture\n\nFonctionnalité en cours de développement.');
}

function viewEntryDetails(id) {
    showSuccessMessage(`👁️ Visualisation de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function editEntryModal(id) {
    showSuccessMessage(`✏️ Modification de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function validateEntry(id) {
    showSuccessMessage(`✅ Validation de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

function confirmDeleteEntry(id) {
    showSuccessMessage(`🗑️ Suppression de l'écriture ${id}\n\nFonctionnalité en cours de développement.`);
}

// =============================================================================
// EVENT LISTENERS & INITIALIZATION - GESTIONNAIRES D'ÉVÉNEMENTS
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

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleLogin();
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

function initializeApp() {
    try {
        console.log('🔄 Initialisation de l\'application sécurisée...');

        // Initialiser le thème
        themeManager.init();
        
        // Initialiser les données
        initializeData();
        
        // Charger l'interface
        loadNavigationMenu();
        updateUserInfo();
        loadDashboard();
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

// Export des fonctions principales pour usage externe si nécessaire
window.DOUKECompta = {
    app,
    SecurityManager,
    StatisticsManager,
    themeManager,
    initializeApp,
    navigateTo,
    loginAs,
    showSuccessMessage,
    showErrorMessage,
    closeModal,
    getCompanyName,
    updateSelectedCompanyInfo
};
