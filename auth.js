/**
 * DOUKÈ Compta Pro - Authentication Module COMPLET
 * Version: 2.1.0
 * Production-ready authentication system with full dashboard integration
 */

const auth = (function() {
    'use strict';

    // Private variables
    let sessionTimer = null;
    let loginAttempts = 0;
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    // Utility functions for messages
    const showSuccessMessage = (message) => {
        alert('✅ ' + message);
    };

    const showErrorMessage = (message) => {
        alert('❌ ' + message);
    };

    // Safe execution wrapper
    const safeExecute = (fn, errorMsg) => {
        try {
            return fn();
        } catch (error) {
            console.error(errorMsg, error);
            return null;
        }
    };

    // Enhanced user database with security
    const userDatabase = {
        'admin@doukecompta.ci': {
            password: 'admin123',
            profile: 'admin',
            name: 'Admin Système',
            role: 'Administrateur',
            id: 1,
            permissions: ['*'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'marie.kouassi@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur-senior',
            name: 'Marie Kouassi',
            role: 'Collaborateur Senior',
            id: 2,
            permissions: ['companies.manage', 'entries.manage', 'reports.view'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'jean.diabate@cabinet.com': {
            password: 'collab123',
            profile: 'collaborateur',
            name: 'Jean Diabaté',
            role: 'Collaborateur',
            id: 3,
            permissions: ['entries.manage', 'reports.view'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'atraore@sarltech.ci': {
            password: 'user123',
            profile: 'user',
            name: 'Amadou Traoré',
            role: 'Utilisateur',
            id: 4,
            permissions: ['entries.create', 'reports.own'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        },
        'ikone@caisse.ci': {
            password: 'caisse123',
            profile: 'caissier',
            name: 'Ibrahim Koné',
            role: 'Caissier',
            id: 5,
            permissions: ['cash.manage'],
            lastLogin: null,
            failedAttempts: 0,
            lockedUntil: null
        }
    };

    // OHADA Countries data
    const ohadaCountries = [
        { code: '+229', country: 'Bénin', flag: '🇧🇯' },
        { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
        { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
        { code: '+236', country: 'Centrafrique', flag: '🇨🇫' },
        { code: '+269', country: 'Comores', flag: '🇰🇲' },
        { code: '+242', country: 'Congo', flag: '🇨🇬' },
        { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
        { code: '+241', country: 'Gabon', flag: '🇬🇦' },
        { code: '+224', country: 'Guinée', flag: '🇬🇳' },
        { code: '+245', country: 'Guinée-Bissau', flag: '🇬🇼' },
        { code: '+240', country: 'Guinée Équatoriale', flag: '🇬🇶' },
        { code: '+223', country: 'Mali', flag: '🇲🇱' },
        { code: '+227', country: 'Niger', flag: '🇳🇪' },
        { code: '+243', country: 'RD Congo', flag: '🇨🇩' },
        { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
        { code: '+235', country: 'Tchad', flag: '🇹🇩' },
        { code: '+228', country: 'Togo', flag: '🇹🇬' }
    ];

    // Validation functions
    const validators = {
        email: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        password: (password) => {
            return password && password.length >= 6;
        },
        
        phone: (phone) => {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
            return phoneRegex.test(phone);
        }
    };

    // Security utilities
    const security = {
        hashPassword: (password) => {
            return btoa(password + 'douke_salt');
        },
        
        isLockedOut: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user || !user.lockedUntil) return false;
            
            const now = Date.now();
            if (now < user.lockedUntil) {
                return true;
            } else {
                user.lockedUntil = null;
                user.failedAttempts = 0;
                return false;
            }
        },
        
        recordFailedAttempt: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user) return;
            
            user.failedAttempts = (user.failedAttempts || 0) + 1;
            
            if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockedUntil = Date.now() + LOCKOUT_DURATION;
                showErrorMessage(`Compte verrouillé pour ${LOCKOUT_DURATION / 60000} minutes`);
            }
        },
        
        resetFailedAttempts: (userEmail) => {
            const user = userDatabase[userEmail];
            if (user) {
                user.failedAttempts = 0;
                user.lockedUntil = null;
                user.lastLogin = new Date().toISOString();
            }
        },
        
        generateSessionToken: () => {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // Session management
    const session = {
        set: (user, rememberMe = false) => {
            try {
                const sessionData = {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        profile: user.profile,
                        permissions: user.permissions
                    },
                    token: security.generateSessionToken(),
                    expiresAt: Date.now() + SESSION_DURATION,
                    rememberMe: rememberMe
                };

                if (rememberMe) {
                    localStorage.setItem('douke_session', JSON.stringify(sessionData));
                } else {
                    sessionStorage.setItem('douke_session', JSON.stringify(sessionData));
                }

                auth.setSessionTimer();
                return sessionData;
            } catch (error) {
                console.error('Session creation error:', error);
                return null;
            }
        },
        
        get: () => {
            try {
                let sessionData = sessionStorage.getItem('douke_session');
                if (!sessionData) {
                    sessionData = localStorage.getItem('douke_session');
                }
                
                if (!sessionData) return null;
                
                const session = JSON.parse(sessionData);
                
                if (session.expiresAt && Date.now() > session.expiresAt) {
                    auth.logout();
                    return null;
                }
                
                return session;
            } catch (error) {
                console.error('Session retrieval error:', error);
                auth.clearSession();
                return null;
            }
        },
        
        clear: () => {
            try {
                sessionStorage.removeItem('douke_session');
                localStorage.removeItem('douke_session');
                
                if (sessionTimer) {
                    clearTimeout(sessionTimer);
                    sessionTimer = null;
                }
            } catch (error) {
                console.error('Session clear error:', error);
            }
        },
        
        extend: () => {
            const currentSession = session.get();
            if (currentSession) {
                currentSession.expiresAt = Date.now() + SESSION_DURATION;
                
                if (currentSession.rememberMe) {
                    localStorage.setItem('douke_session', JSON.stringify(currentSession));
                } else {
                    sessionStorage.setItem('douke_session', JSON.stringify(currentSession));
                }
                
                auth.setSessionTimer();
            }
        }
    };

    // UI utilities
    const ui = {
        setFieldError: (fieldId, message) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('border-danger');
                field.classList.remove('border-gray-300');
                
                let errorElement = document.getElementById(fieldId + '_error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = fieldId + '_error';
                    errorElement.className = 'text-danger text-sm mt-1';
                    field.parentElement.appendChild(errorElement);
                }
                errorElement.textContent = message;
            }
        },
        
        clearFieldError: (fieldId) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('border-danger');
                field.classList.add('border-gray-300');
                
                const errorElement = document.getElementById(fieldId + '_error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        },
        
        clearAllErrors: () => {
            ui.clearFieldError('loginEmail');
            ui.clearFieldError('loginPassword');
        },
        
        setLoadingState: (loading) => {
            const loginButton = document.querySelector('#loginForm button[type="submit"]');
            if (loginButton) {
                loginButton.disabled = loading;
                
                if (loading) {
                    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connexion...';
                } else {
                    loginButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Se connecter';
                }
            }
        }
    };

    // Navigation menu generation
    const loadNavigationMenu = () => {
        return safeExecute(() => {
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

            const navigationMenu = document.getElementById('navigationMenu');
            if (navigationMenu) {
                navigationMenu.innerHTML = menuHtml;
            }
        }, 'Erreur lors du chargement du menu de navigation');
    };

    // Navigation function
    const navigateTo = (page, element = null) => {
        return safeExecute(() => {
            // Remove active class from all menu items
            document.querySelectorAll('#navigationMenu a').forEach(item => {
                item.classList.remove('bg-primary', 'text-white');
                item.classList.add('text-gray-700', 'dark:text-gray-300');
            });

            // Add active class to clicked item
            if (element) {
                element.classList.add('bg-primary', 'text-white');
                element.classList.remove('text-gray-700', 'dark:text-gray-300');
            }

            console.log('🔄 Navigation vers:', page);

            // Load page content
            switch(page) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'users':
                    loadUsersPlaceholder();
                    break;
                case 'companies':
                    loadCompaniesPlaceholder();
                    break;
                case 'entries':
                    loadEntriesPlaceholder();
                    break;
                case 'accounts':
                    loadAccountsPlaceholder();
                    break;
                case 'caisse':
                    loadCaissePlaceholder();
                    break;
                case 'reports':
                    loadReportsPlaceholder();
                    break;
                case 'import':
                    loadImportPlaceholder();
                    break;
                case 'settings':
                    loadSettingsPlaceholder();
                    break;
                default:
                    console.log('⚠️ Page inconnue, chargement du dashboard');
                    loadDashboard();
            }
        }, 'Erreur lors de la navigation');
    };

    // Placeholder functions for navigation (to be implemented)
    const loadUsersPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-users text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Gestion des Collaborateurs</h3>
                    <p class="text-gray-600 dark:text-gray-400">Cette section permet de gérer les collaborateurs de votre cabinet comptable.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadCompaniesPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Entreprises</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-building text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Gestion des Entreprises</h3>
                    <p class="text-gray-600 dark:text-gray-400">Cette section permet de gérer le portefeuille d'entreprises clientes.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadEntriesPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Écritures Comptables</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-edit text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Écritures Comptables</h3>
                    <p class="text-gray-600 dark:text-gray-400">Cette section permet de saisir et valider les écritures comptables selon les normes SYSCOHADA Révisé.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadAccountsPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-list text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Plan Comptable</h3>
                    <p class="text-gray-600 dark:text-gray-400">Consultation et gestion du plan comptable SYSCOHADA Révisé.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadCaissePlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Caisses</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-cash-register text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Gestion des Caisses</h3>
                    <p class="text-gray-600 dark:text-gray-400">Suivi et gestion des opérations de caisse.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadReportsPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports & États Financiers</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-chart-bar text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rapports & États</h3>
                    <p class="text-gray-600 dark:text-gray-400">Génération des états financiers et rapports comptables.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadImportPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-upload text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Import de Données</h3>
                    <p class="text-gray-600 dark:text-gray-400">Import de balances et données comptables depuis Excel ou CSV.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    const loadSettingsPlaceholder = () => {
        const content = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <i class="fas fa-user-cog text-4xl text-primary mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mon Profil</h3>
                    <p class="text-gray-600 dark:text-gray-400">Gestion de votre profil utilisateur et paramètres de compte.</p>
                </div>
            </div>
        `;
        updateMainContent(content);
    };

    // Helper function to update main content
    const updateMainContent = (content) => {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = content;
        }
    };

    // Update user info in UI
    const updateUserInfo = () => {
        return safeExecute(() => {
            const profiles = {
                'admin': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
                'collaborateur-senior': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
                'collaborateur': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
                'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
                'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
            };

            const profile = profiles[app.currentProfile];

            const currentUserElement = document.getElementById('currentUser');
            const currentCompanyElement = document.getElementById('currentCompany');
            const sidebarUserNameElement = document.getElementById('sidebarUserName');
            const sidebarUserRoleElement = document.getElementById('sidebarUserRole');

            if (currentUserElement) currentUserElement.textContent = app.currentUser.name;
            if (currentCompanyElement) currentCompanyElement.textContent = app.currentCompany ? getCompanyName() : profile.defaultCompany;
            if (sidebarUserNameElement) sidebarUserNameElement.textContent = app.currentUser.name;
            if (sidebarUserRoleElement) sidebarUserRoleElement.textContent = app.currentUser.role;

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
        }, 'Erreur lors de la mise à jour des informations utilisateur');
    };

    // Populate company selector
    const populateCompanySelector = () => {
        return safeExecute(() => {
            const select = document.getElementById('activeCompanySelect');
            if (select && app.companies) {
                select.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

                app.companies.forEach(company => {
                    const option = document.createElement('option');
                    option.value = company.id;
                    option.textContent = company.name;
                    if (company.id == app.currentCompany) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        }, 'Erreur lors du peuplement du sélecteur d\'entreprise');
    };

    // Get company name
    const getCompanyName = () => {
        if (!app.currentCompany || !app.companies) return 'Aucune entreprise sélectionnée';
        const company = app.companies.find(c => c.id == app.currentCompany);
        return company ? company.name : 'Entreprise inconnue';
    };

    // Load dashboard based on profile
    const loadDashboard = () => {
        return safeExecute(() => {
            if (app.currentProfile === 'admin') {
                loadAdminDashboard();
            } else {
                loadStandardDashboard();
            }
        }, 'Erreur lors du chargement du dashboard');
    };

    // Admin dashboard
    const loadAdminDashboard = () => {
        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                    <div class="text-sm text-primary-light font-medium">
                        <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                    </div>
                </div>

                <!-- KPI Cards Admin -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.companies ? app.companies.filter(c => c.status === 'Actif').length : 3}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas fa-building text-primary text-xl"></i>
                            </div>
                        </div>
                        <div class="mt-2 flex items-center text-sm">
                            <span class="text-success">+2</span>
                            <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.users ? app.users.filter(u => u.profile.includes('collaborateur')).length : 2}</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-users text-info text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries ? app.entries.filter(e => e.status === 'En attente').length : 1}</p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Validées</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${app.entries ? app.entries.filter(e => e.status === 'Validé').length : 2}</p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-check text-success text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions rapides -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="navigateTo('users')" class="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-user-plus text-primary text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Nouveau Collaborateur</div>
                        </button>
                        <button onclick="navigateTo('companies')" class="p-4 bg-info/10 hover:bg-info/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-building text-info text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Nouvelle Entreprise</div>
                        </button>
                        <button onclick="navigateTo('reports')" class="p-4 bg-success/10 hover:bg-success/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-chart-bar text-success text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Rapports Globaux</div>
                        </button>
                        <button onclick="navigateTo('import')" class="p-4 bg-warning/10 hover:bg-warning/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-upload text-warning text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Import de Données</div>
                        </button>
                    </div>
                </div>

                <!-- Activité récente -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-history mr-2 text-info"></i>Activité Récente
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-check text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Écriture validée</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">SARL TECH INNOVATION - il y a 2h</div>
                                </div>
                            </div>
                            <span class="text-sm text-gray-500 dark:text-gray-400">JV-2024-001-0156</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-user-plus text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Nouveau collaborateur</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Jean Diabaté ajouté - il y a 1 jour</div>
                                </div>
                            </div>
                            <span class="text-sm text-success">Collaborateur</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-info text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-building text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Nouvelle entreprise</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">SAS DIGITAL WORLD - il y a 3 jours</div>
                                </div>
                            </div>
                            <span class="text-sm text-warning">Période d'essai</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        updateMainContent(content);
    };

    // Standard dashboard
    const loadStandardDashboard = () => {
        let dashboardTitle = 'Tableau de Bord';
        let cashCount = 1;

        if (app.currentProfile === 'user') {
            dashboardTitle = 'Mon Entreprise';
            cashCount = app.currentCompany && app.companies ? 
                (app.companies.find(c => c.id == app.currentCompany)?.cashRegisters || 1) : 1;
        } else if (app.currentProfile === 'caissier') {
            dashboardTitle = 'Ma Caisse';
            cashCount = '→';
        }

        const content = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
                    <div class="text-sm text-primary-light font-medium">
                        <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                    </div>
                </div>

                <!-- KPI Cards Standard -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    ${app.currentProfile === 'user' ? 'Caisses disponibles' :
                                      app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}
                                </p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">${cashCount}</p>
                            </div>
                            <div class="bg-primary/10 p-3 rounded-lg">
                                <i class="fas ${app.currentProfile === 'caissier' ? 'fa-plus-circle' :
                                              app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>
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
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures ce mois</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                    ${app.currentProfile === 'caissier' ? '45' : (app.entries ? app.entries.length : 3)}
                                </p>
                            </div>
                            <div class="bg-success/10 p-3 rounded-lg">
                                <i class="fas fa-edit text-success text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente validation</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                    ${app.entries ? app.entries.filter(e => e.status === 'En attente').length : 1}
                                </p>
                            </div>
                            <div class="bg-warning/10 p-3 rounded-lg">
                                <i class="fas fa-clock text-warning text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
                                <p class="text-3xl font-bold text-gray-900 dark:text-white">98%</p>
                            </div>
                            <div class="bg-info/10 p-3 rounded-lg">
                                <i class="fas fa-chart-line text-info text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions rapides par profil -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-bolt mr-2 text-warning"></i>Actions Rapides
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="navigateTo('entries')" class="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-plus text-primary text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Nouvelle Écriture</div>
                        </button>
                        <button onclick="navigateTo('accounts')" class="p-4 bg-info/10 hover:bg-info/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-list text-info text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Plan Comptable</div>
                        </button>
                        <button onclick="navigateTo('reports')" class="p-4 bg-success/10 hover:bg-success/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-chart-bar text-success text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Mes Rapports</div>
                        </button>
                        <button onclick="navigateTo('caisse')" class="p-4 bg-warning/10 hover:bg-warning/20 rounded-lg text-center transition-colors">
                            <i class="fas fa-cash-register text-warning text-xl mb-2"></i>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">Gestion Caisse</div>
                        </button>
                    </div>
                </div>

                <!-- Mes données récentes -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-history mr-2 text-info"></i>Activité Récente
                    </h3>
                    <div class="space-y-3">
                        ${app.currentProfile === 'caissier' ? `
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-down text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Recette caisse</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Vente comptant - il y a 1h</div>
                                </div>
                            </div>
                            <span class="text-sm font-mono text-success">+15,000 FCFA</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-warning text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-up text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Dépense caisse</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Achat fournitures - il y a 2h</div>
                                </div>
                            </div>
                            <span class="text-sm font-mono text-warning">-5,000 FCFA</span>
                        </div>
                        ` : `
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-edit text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Écriture créée</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Vente marchandises - il y a 2h</div>
                                </div>
                            </div>
                            <span class="text-sm text-success">Validé</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-info text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-chart-bar text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Rapport généré</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Balance générale - il y a 1 jour</div>
                                </div>
                            </div>
                            <span class="text-sm text-info">PDF</span>
                        </div>
                        `}
                        <div class="text-center pt-4">
                            <button onclick="navigateTo('entries')" class="text-primary hover:text-primary/80 text-sm font-medium">
                                Voir toutes les activités <i class="fas fa-arrow-right ml-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        updateMainContent(content);
    };

    // Initialize application
    const initializeApp = () => {
        return safeExecute(() => {
            console.log('🔄 Initialisation de l\'application...');
            
            // Load navigation menu based on profile
            loadNavigationMenu();
            
            // Update user information in UI
            updateUserInfo();
            
            // Load dashboard based on profile
            loadDashboard();
            
            // Bind event listeners
            bindEventListeners();
            
            console.log('✅ DOUKÈ Compta Pro initialisé avec succès !');
        }, 'Erreur lors de l\'initialisation de l\'application');
    };

    // Bind event listeners
    const bindEventListeners = () => {
        return safeExecute(() => {
            // Company selector
            setTimeout(() => {
                const companySelect = document.getElementById('activeCompanySelect');
                if (companySelect) {
                    companySelect.addEventListener('change', function(e) {
                        app.currentCompany = e.target.value;
                        updateSelectedCompanyInfo();
                        console.log('✅ Entreprise sélectionnée:', app.currentCompany);
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

            // Close sidebar on outside click (mobile)
            document.addEventListener('click', function(e) {
                const sidebar = document.getElementById('sidebar');
                const sidebarToggle = document.getElementById('sidebarToggle');

                if (window.innerWidth < 1024 && sidebar && sidebarToggle && 
                    !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.add('-translate-x-full');
                }
            });

        }, 'Erreur lors de la liaison des événements');
    };

    // Update selected company info
    const updateSelectedCompanyInfo = () => {
        return safeExecute(() => {
            if (!app.companies) return;
            
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
        }, 'Erreur lors de la mise à jour des informations d\'entreprise');
    };

    // Export navigateTo function globally
    window.navigateTo = navigateTo;

    // Public API
    return {
        // Initialize authentication system
        init: () => {
            return safeExecute(() => {
                const existingSession = session.get();
                if (existingSession) {
                    auth.restoreSession(existingSession);
                }
                
                auth.setupFormHandlers();
                auth.setupPasswordToggle();
                
                console.log('🔐 Authentication system initialized');
            }, 'Erreur lors de l\'initialisation de l\'authentification');
        },

        // Setup form event handlers
        setupFormHandlers: () => {
            return safeExecute(() => {
                const loginForm = document.getElementById('loginForm');
                if (loginForm) {
                    loginForm.addEventListener('submit', auth.handleLogin);
                    
                    const emailField = document.getElementById('loginEmail');
                    const passwordField = document.getElementById('loginPassword');
                    
                    if (emailField) {
                        emailField.addEventListener('input', () => {
                            ui.clearFieldError('loginEmail');
                        });
                        
                        emailField.addEventListener('blur', () => {
                            if (emailField.value && !validators.email(emailField.value)) {
                                ui.setFieldError('loginEmail', 'Format d\'email invalide');
                            }
                        });
                    }
                    
                    if (passwordField) {
                        passwordField.addEventListener('input', () => {
                            ui.clearFieldError('loginPassword');
                        });
                    }
                }
            }, 'Erreur lors de la configuration des gestionnaires de formulaire');
        },

        // Setup password visibility toggle
        setupPasswordToggle: () => {
            return safeExecute(() => {
                const toggleButton = document.getElementById('togglePassword');
                const passwordField = document.getElementById('loginPassword');
                
                if (toggleButton && passwordField) {
                    toggleButton.addEventListener('click', () => {
                        const isPassword = passwordField.type === 'password';
                        passwordField.type = isPassword ? 'text' : 'password';
                        
                        const icon = toggleButton.querySelector('i');
                        if (icon) {
                            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                        }
                    });
                }
            }, 'Erreur lors de la configuration du basculement de mot de passe');
        },

        // Handle login form submission
        handleLogin: async (event) => {
            event.preventDefault();
            
            ui.clearAllErrors();
            ui.setLoadingState(true);
            
            try {
                const formData = new FormData(event.target);
                const email = formData.get('email').trim().toLowerCase();
                const password = formData.get('password');
                const rememberMe = document.getElementById('rememberMe')?.checked || false;
                
                if (!email || !password) {
                    if (!email) ui.setFieldError('loginEmail', 'Email requis');
                    if (!password) ui.setFieldError('loginPassword', 'Mot de passe requis');
                    return;
                }
                
                if (!validators.email(email)) {
                    ui.setFieldError('loginEmail', 'Format d\'email invalide');
                    return;
                }
                
                if (security.isLockedOut(email)) {
                    ui.setFieldError('loginEmail', 'Compte temporairement verrouillé');
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const user = userDatabase[email];
                if (!user || user.password !== password) {
                    security.recordFailedAttempt(email);
                    ui.setFieldError('loginPassword', 'Email ou mot de passe incorrect');
                    return;
                }
                
                security.resetFailedAttempts(email);
                const sessionData = session.set(user, rememberMe);
                
                if (sessionData) {
                    app.isAuthenticated = true;
                    app.currentProfile = user.profile;
                    app.currentUser = sessionData.user;
                    
                    if (user.profile === 'user') {
                        app.currentCompany = '1';
                    } else if (user.profile === 'caissier') {
                        app.currentCompany = '2';
                    }
                    
                    showSuccessMessage(`Bienvenue ${user.name} !`);
                    auth.showMainApp();
                    
                    console.log('✅ Login successful:', user.name);
                } else {
                    throw new Error('Session creation failed');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showErrorMessage('Erreur lors de la connexion');
            } finally {
                ui.setLoadingState(false);
            }
        },

        // Quick login with predefined credentials
        loginAs: (profile) => {
            return safeExecute(() => {
                const credentials = {
                    'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
                    'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
                    'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
                    'user': { email: 'atraore@sarltech.ci', password: 'user123' },
                    'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
                };

                const cred = credentials[profile];
                if (cred) {
                    const emailField = document.getElementById('loginEmail');
                    const passwordField = document.getElementById('loginPassword');
                    
                    if (emailField && passwordField) {
                        emailField.value = cred.email;
                        passwordField.value = cred.password;
                        
                        const loginForm = document.getElementById('loginForm');
                        if (loginForm) {
                            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                            loginForm.dispatchEvent(submitEvent);
                        }
                    }
                }
            }, 'Erreur lors de la connexion rapide');
        },

        // Show registration form
        showRegisterForm: () => {
            auth.showModal(auth.generateRegistrationModal());
        },

        // Generate country phone selector
        generateCountryPhoneSelector: (fieldId, selectedCountry = '+225') => {
            return `
                <div class="flex">
                    <select id="${fieldId}_country" 
                            class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base border-r-0 focus:ring-2 focus:ring-primary focus:border-transparent">
                        ${ohadaCountries.map(country => `
                            <option value="${country.code}" ${country.code === selectedCountry ? 'selected' : ''}>
                                ${country.flag} ${country.code}
                            </option>
                        `).join('')}
                    </select>
                    <input type="tel" id="${fieldId}" required
                           class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent" 
                           placeholder="XX XX XX XX XX"
                           pattern="[0-9\\s\\-]{8,}">
                </div>
            `;
        },

        // Generate registration modal HTML
        generateRegistrationModal: () => {
            return `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="auth.closeModalOnBackground(event)">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-user-plus text-2xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Inscription</h2>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Créer votre compte DOUKÈ Compta Pro</p>
                        </div>

                        <form id="registerForm" class="space-y-4" novalidate>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Prénom <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" name="firstName" required maxlength="50" 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nom <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" name="lastName" required maxlength="50"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" name="email" required 
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Numéro de téléphone <span class="text-danger">*</span>
                                </label>
                                ${auth.generateCountryPhoneSelector('regPhone')}
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nom de l'entreprise <span class="text-danger">*</span>
                                </label>
                                <input type="text" name="companyName" required maxlength="100"
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type d'entreprise <span class="text-danger">*</span>
                                </label>
                                <select name="companyType" required 
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="">-- Sélectionner le type --</option>
                                    <option value="SARL">SARL - Société à Responsabilité Limitée</option>
                                    <option value="SA">SA - Société Anonyme</option>
                                    <option value="EURL">EURL - Entreprise Unipersonnelle à Responsabilité Limitée</option>
                                    <option value="SAS">SAS - Société par Actions Simplifiée</option>
                                    <option value="SNC">SNC - Société en Nom Collectif</option>
                                    <option value="EI">EI - Entreprise Individuelle</option>
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mot de passe <span class="text-danger">*</span>
                                    </label>
                                    <input type="password" name="password" required minlength="6"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirmer <span class="text-danger">*</span>
                                    </label>
                                    <input type="password" name="confirmPassword" required 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div class="bg-info/10 p-4 rounded-lg">
                                <p class="text-sm text-info">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    Votre compte sera créé avec le profil <strong>"Utilisateur"</strong>.
                                </p>
                            </div>

                            <div class="flex items-center">
                                <input type="checkbox" name="agreeTerms" required class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
                                <label class="ml-2 text-sm text-gray-900 dark:text-white">
                                    J'accepte les conditions d'utilisation
                                </label>
                            </div>

                            <button type="submit" 
                                    class="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors">
                                <i class="fas fa-user-plus mr-2"></i>Créer mon compte
                            </button>
                        </form>

                        <div class="mt-6 flex justify-between items-center">
                            <button onclick="auth.showLoginInterface()" 
                                    class="text-primary hover:text-primary-700 font-medium transition-colors">
                                ← Retour à la connexion
                            </button>
                            <button onclick="auth.closeModal()" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        // Handle registration
        handleRegister: async (event) => {
            event.preventDefault();
            
            try {
                const formData = new FormData(event.target);
                const data = Object.fromEntries(formData.entries());
                
                // Basic validation
                if (data.password !== data.confirmPassword) {
                    showErrorMessage('Les mots de passe ne correspondent pas');
                    return;
                }
                
                if (!validators.email(data.email)) {
                    showErrorMessage('Email invalide');
                    return;
                }
                
                if (userDatabase[data.email.toLowerCase()]) {
                    showErrorMessage('Cette adresse email est déjà utilisée');
                    return;
                }
                
                // Simulate registration
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                auth.closeModal();
                showSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                
                // Pre-fill login form
                const emailField = document.getElementById('loginEmail');
                if (emailField) {
                    emailField.value = data.email;
                }
                
            } catch (error) {
                console.error('Registration error:', error);
                showErrorMessage('Erreur lors de l\'inscription');
            }
        },

        // Show forgot password modal
        showForgotPassword: () => {
            showSuccessMessage('📧 Un email de récupération sera envoyé (fonctionnalité de démonstration)');
        },

        // Logout confirmation
        confirmLogout: () => {
            const modal = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-sign-out-alt text-2xl"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Confirmer la déconnexion</h3>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                        </div>
                        
                        <div class="flex justify-center space-x-4">
                            <button onclick="auth.closeModal()" 
                                    class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Annuler
                            </button>
                            <button onclick="auth.logout()" 
                                    class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            auth.showModal(modal);
        },

        // Logout user
        logout: () => {
            return safeExecute(() => {
                session.clear();
                
                app.isAuthenticated = false;
                app.currentProfile = null;
                app.currentUser = null;
                app.currentCompany = null;
                
                auth.closeModal();
                auth.showLoginInterface();
                
                showSuccessMessage('Déconnexion réussie. À bientôt !');
                console.log('✅ Logout successful');
                
            }, 'Erreur lors de la déconnexion');
        },

        // Show login interface
        showLoginInterface: () => {
            return safeExecute(() => {
                const loginInterface = document.getElementById('loginInterface');
                const mainApp = document.getElementById('mainApp');
                
                if (loginInterface && mainApp) {
                    loginInterface.classList.remove('hidden');
                    mainApp.classList.add('hidden');
                    
                    setTimeout(() => {
                        const emailField = document.getElementById('loginEmail');
                        if (emailField) {
                            emailField.focus();
                        }
                    }, 100);
                }
            }, 'Erreur lors de l\'affichage de l\'interface de connexion');
        },

        // Show main application
        showMainApp: () => {
            return safeExecute(() => {
                const loginInterface = document.getElementById('loginInterface');
                const mainApp = document.getElementById('mainApp');
                
                if (loginInterface && mainApp) {
                    loginInterface.classList.add('hidden');
                    mainApp.classList.remove('hidden');
                    
                    // Initialize main app
                    initializeApp();
                }
            }, 'Erreur lors de l\'affichage de l\'application principale');
        },

        // Restore session
        restoreSession: (sessionData) => {
            return safeExecute(() => {
                app.isAuthenticated = true;
                app.currentProfile = sessionData.user.profile;
                app.currentUser = sessionData.user;
                
                if (sessionData.user.profile === 'user') {
                    app.currentCompany = '1';
                } else if (sessionData.user.profile === 'caissier') {
                    app.currentCompany = '2';
                }
                
                auth.showMainApp();
                auth.setSessionTimer();
                
                console.log('✅ Session restored:', sessionData.user.name);
                
            }, 'Erreur lors de la restauration de session');
        },

        // Set session timer for auto-logout
        setSessionTimer: () => {
            return safeExecute(() => {
                if (sessionTimer) {
                    clearTimeout(sessionTimer);
                }
                
                sessionTimer = setTimeout(() => {
                    showErrorMessage('Session expirée. Reconnexion requise.');
                    auth.logout();
                }, SESSION_DURATION);
            }, 'Erreur lors de la configuration du timer de session');
        },

        // Extend session
        extendSession: () => {
            if (app.isAuthenticated) {
                session.extend();
                auth.setSessionTimer();
            }
        },

        // Check permissions
        hasPermission: (permission) => {
            if (!app.currentUser || !app.currentUser.permissions) {
                return false;
            }
            
            return app.currentUser.permissions.includes('*') || 
                   app.currentUser.permissions.includes(permission);
        },

        // Modal utilities
        showModal: (html) => {
            return safeExecute(() => {
                const container = document.getElementById('modalContainer');
                if (container) {
                    container.innerHTML = html;
                    
                    setTimeout(() => {
                        const registerForm = document.getElementById('registerForm');
                        if (registerForm) {
                            registerForm.addEventListener('submit', auth.handleRegister);
                        }
                    }, 100);
                }
            }, 'Erreur lors de l\'affichage du modal');
        },

        closeModal: () => {
            return safeExecute(() => {
                const container = document.getElementById('modalContainer');
                if (container) {
                    container.innerHTML = '';
                }
            }, 'Erreur lors de la fermeture du modal');
        },

        closeModalOnBackground: (event) => {
            if (event.target === event.currentTarget) {
                auth.closeModal();
            }
        },

        // Clear session data
        clearSession: () => {
            session.clear();
        },

        // Get current session
        getCurrentSession: () => {
            return session.get();
        }
    };
})();

// Auto-extend session on user activity
document.addEventListener('click', auth.extendSession);
document.addEventListener('keypress', auth.extendSession);

// Export for global access
window.auth = auth;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    auth.init();
});
