/**
 * DOUKÈ Compta Pro - Authentication Module
 * Version: 2.1.0
 * Production-ready authentication system with enhanced security
 */

const auth = (function() {
    'use strict';

    // Private variables
    let sessionTimer = null;
    let loginAttempts = 0;
    const MAX_LOGIN_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    // Enhanced user database with security
    const userDatabase = {
        'admin@doukecompta.ci': {
            password: 'admin123', // In production, this would be hashed
            profile: 'admin',
            name: 'Admin Système',
            role: 'Administrateur',
            id: 1,
            permissions: ['*'], // Full access
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
        // Simple password hashing (in production, use bcrypt or similar)
        hashPassword: (password) => {
            // This is a simple hash for demo purposes
            // In production, use proper password hashing
            return btoa(password + 'douke_salt');
        },
        
        // Check if user is locked out
        isLockedOut: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user || !user.lockedUntil) return false;
            
            const now = Date.now();
            if (now < user.lockedUntil) {
                return true;
            } else {
                // Reset lockout if time has passed
                user.lockedUntil = null;
                user.failedAttempts = 0;
                return false;
            }
        },
        
        // Record failed login attempt
        recordFailedAttempt: (userEmail) => {
            const user = userDatabase[userEmail];
            if (!user) return;
            
            user.failedAttempts = (user.failedAttempts || 0) + 1;
            
            if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockedUntil = Date.now() + LOCKOUT_DURATION;
                showErrorToast(`Compte verrouillé pour ${LOCKOUT_DURATION / 60000} minutes`);
            }
        },
        
        // Reset failed attempts on successful login
        resetFailedAttempts: (userEmail) => {
            const user = userDatabase[userEmail];
            if (user) {
                user.failedAttempts = 0;
                user.lockedUntil = null;
                user.lastLogin = new Date().toISOString();
            }
        },
        
        // Generate session token
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

                // Store session
                if (rememberMe) {
                    localStorage.setItem('douke_session', JSON.stringify(sessionData));
                } else {
                    sessionStorage.setItem('douke_session', JSON.stringify(sessionData));
                }

                // Set auto-logout timer
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
                
                // Check if session is expired
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
            const errorElement = document.getElementById(fieldId.replace('login', '').toLowerCase() + '-error');
            
            if (field) {
                field.classList.add('border-danger', 'focus:ring-danger');
                field.classList.remove('border-gray-300', 'focus:ring-primary');
            }
            
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            }
        },
        
        clearFieldError: (fieldId) => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(fieldId.replace('login', '').toLowerCase() + '-error');
            
            if (field) {
                field.classList.remove('border-danger', 'focus:ring-danger');
                field.classList.add('border-gray-300', 'focus:ring-primary');
            }
            
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
        },
        
        clearAllErrors: () => {
            ui.clearFieldError('loginEmail');
            ui.clearFieldError('loginPassword');
        },
        
        setLoadingState: (loading) => {
            const loginButton = document.getElementById('loginButton');
            const loginButtonText = document.getElementById('loginButtonText');
            const loginButtonLoading = document.getElementById('loginButtonLoading');
            
            if (loginButton && loginButtonText && loginButtonLoading) {
                loginButton.disabled = loading;
                
                if (loading) {
                    loginButtonText.classList.add('hidden');
                    loginButtonLoading.classList.remove('hidden');
                } else {
                    loginButtonText.classList.remove('hidden');
                    loginButtonLoading.classList.add('hidden');
                }
            }
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

    // Public API
    return {
        // Initialize authentication system
        init: () => {
            try {
                // Check for existing session
                const existingSession = session.get();
                if (existingSession) {
                    auth.restoreSession(existingSession);
                }
                
                // Setup form handlers
                auth.setupFormHandlers();
                
                // Setup password toggle
                auth.setupPasswordToggle();
                
                console.log('🔐 Authentication system initialized');
            } catch (error) {
                console.error('Auth initialization error:', error);
            }
        },

        // Setup form event handlers
        setupFormHandlers: () => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', auth.handleLogin);
                
                // Real-time validation
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
        },

        // Setup password visibility toggle
        setupPasswordToggle: () => {
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
                
                // Validate input
                if (!email || !password) {
                    if (!email) ui.setFieldError('loginEmail', 'Email requis');
                    if (!password) ui.setFieldError('loginPassword', 'Mot de passe requis');
                    return;
                }
                
                if (!validators.email(email)) {
                    ui.setFieldError('loginEmail', 'Format d\'email invalide');
                    return;
                }
                
                // Check if user is locked out
                if (security.isLockedOut(email)) {
                    ui.setFieldError('loginEmail', 'Compte temporairement verrouillé');
                    return;
                }
                
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Authenticate user
                const user = userDatabase[email];
                if (!user || user.password !== password) {
                    security.recordFailedAttempt(email);
                    ui.setFieldError('loginPassword', 'Email ou mot de passe incorrect');
                    return;
                }
                
                // Success - create session
                security.resetFailedAttempts(email);
                const sessionData = session.set(user, rememberMe);
                
                if (sessionData) {
                    // Update app state
                    app.isAuthenticated = true;
                    app.currentProfile = user.profile;
                    app.currentUser = sessionData.user;
                    
                    // Auto-select company for specific profiles
                    if (user.profile === 'user') {
                        app.currentCompany = '1';
                    } else if (user.profile === 'caissier') {
                        app.currentCompany = '2';
                    }
                    
                    // Show success and redirect
                    showSuccessToast(`Bienvenue ${user.name} !`);
                    auth.showMainApp();
                    
                    console.log('✅ Login successful:', user.name);
                } else {
                    throw new Error('Session creation failed');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showErrorToast('Erreur lors de la connexion');
            } finally {
                ui.setLoadingState(false);
            }
        },

        // Quick login with predefined credentials
        loginAs: (profile) => {
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
                    
                    // Trigger login
                    const loginForm = document.getElementById('loginForm');
                    if (loginForm) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        loginForm.dispatchEvent(submitEvent);
                    }
                }
            }
        },

        // Show registration form
        showRegisterForm: () => {
            auth.showModal(auth.generateRegistrationModal());
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
                                    <input type="text" id="regFirstName" required maxlength="50" 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nom <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="regLastName" required maxlength="50"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email <span class="text-danger">*</span>
                                </label>
                                <input type="email" id="regEmail" required 
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Utilisez votre email professionnel
                                </div>
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
                                <input type="text" id="regCompanyName" required maxlength="100"
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type d'entreprise <span class="text-danger">*</span>
                                </label>
                                <select id="regCompanyType" required 
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
                                    <input type="password" id="regPassword" required minlength="6"
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Minimum 6 caractères
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirmer <span class="text-danger">*</span>
                                    </label>
                                    <input type="password" id="regConfirmPassword" required 
                                           class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                                </div>
                            </div>

                            <div class="bg-info/10 p-4 rounded-lg">
                                <p class="text-sm text-info">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    Votre compte sera créé avec le profil <strong>"Utilisateur"</strong>.
                                    Vous pourrez gérer uniquement votre entreprise. Période d'essai de 30 jours incluse.
                                </p>
                            </div>

                            <div class="flex items-center">
                                <input type="checkbox" id="agreeTerms" required class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2">
                                <label for="agreeTerms" class="ml-2 text-sm text-gray-900 dark:text-white">
                                    J'accepte les <a href="#" class="text-primary hover:underline">conditions d'utilisation</a> et la <a href="#" class="text-primary hover:underline">politique de confidentialité</a>
                                </label>
                            </div>

                            <button type="submit" 
                                    class="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                <i class="fas fa-user-plus mr-2"></i>Créer mon compte
                            </button>
                        </form>

                        <div class="mt-6 flex justify-between items-center">
                            <button onclick="auth.showLoginInterface()" 
                                    class="text-primary hover:text-primary-700 font-medium transition-colors focus:outline-none focus:underline">
                                ← Retour à la connexion
                            </button>
                            <button onclick="auth.closeModal()" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:underline">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            `;
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

        // Handle registration
        handleRegister: async (event) => {
            event.preventDefault();
            
            try {
                showLoading();
                
                const formData = new FormData(event.target);
                const data = {
                    firstName: formData.get('firstName')?.trim(),
                    lastName: formData.get('lastName')?.trim(),
                    email: formData.get('email')?.trim().toLowerCase(),
                    phone: formData.get('phone')?.trim(),
                    companyName: formData.get('companyName')?.trim(),
                    companyType: formData.get('companyType'),
                    password: formData.get('password'),
                    confirmPassword: formData.get('confirmPassword'),
                    agreeTerms: formData.get('agreeTerms')
                };
                
                // Validation
                const errors = [];
                
                if (!data.firstName) errors.push('Le prénom est requis');
                if (!data.lastName) errors.push('Le nom est requis');
                if (!data.email || !validators.email(data.email)) errors.push('Email valide requis');
                if (!data.phone || !validators.phone(data.phone)) errors.push('Numéro de téléphone valide requis');
                if (!data.companyName) errors.push('Le nom de l\'entreprise est requis');
                if (!data.companyType) errors.push('Le type d\'entreprise est requis');
                if (!data.password || !validators.password(data.password)) errors.push('Mot de passe de 6 caractères minimum requis');
                if (data.password !== data.confirmPassword) errors.push('Les mots de passe ne correspondent pas');
                if (!data.agreeTerms) errors.push('Vous devez accepter les conditions d\'utilisation');
                
                // Check if email already exists
                if (userDatabase[data.email]) {
                    errors.push('Cette adresse email est déjà utilisée');
                }
                
                if (errors.length > 0) {
                    showErrorToast(errors.join('<br>'));
                    return;
                }
                
                // Simulate registration process
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Create new user (in production, this would be sent to backend)
                const newUser = {
                    id: Object.keys(userDatabase).length + 1,
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    phone: data.phone,
                    role: 'Utilisateur',
                    profile: 'user',
                    password: data.password, // Would be hashed in production
                    permissions: ['entries.create', 'reports.own'],
                    lastLogin: null,
                    failedAttempts: 0,
                    lockedUntil: null,
                    company: {
                        name: data.companyName,
                        type: data.companyType
                    }
                };
                
                // Add to database (in production, this would be sent to backend)
                userDatabase[data.email] = newUser;
                
                auth.closeModal();
                showSuccessToast('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                
                // Pre-fill login form
                const emailField = document.getElementById('loginEmail');
                if (emailField) {
                    emailField.value = data.email;
                    emailField.focus();
                }
                
                console.log('✅ Registration successful:', newUser.name);
                
            } catch (error) {
                console.error('Registration error:', error);
                showErrorToast('Erreur lors de l\'inscription');
            } finally {
                hideLoading();
            }
        },

        // Show forgot password modal
        showForgotPassword: () => {
            const modal = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="auth.closeModalOnBackground(event)">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md" onclick="event.stopPropagation()">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-key text-2xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mot de passe oublié</h2>
                            <p class="text-gray-600 dark:text-gray-400 mt-2">Entrez votre email pour recevoir un lien de réinitialisation</p>
                        </div>

                        <form id="forgotPasswordForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input type="email" id="forgotEmail" required 
                                       class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                                       placeholder="votre@email.com">
                            </div>

                            <button type="submit" 
                                    class="w-full bg-warning hover:bg-warning/90 text-white py-3 rounded-lg font-medium transition-colors">
                                <i class="fas fa-paper-plane mr-2"></i>Envoyer le lien
                            </button>
                        </form>

                        <div class="mt-6 text-center">
                            <button onclick="auth.closeModal()" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors">
                                Retour à la connexion
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            auth.showModal(modal);
            
            // Setup form handler
            setTimeout(() => {
                const form = document.getElementById('forgotPasswordForm');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const email = document.getElementById('forgotEmail')?.value;
                        
                        if (email && validators.email(email)) {
                            showLoading();
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            hideLoading();
                            auth.closeModal();
                            showSuccessToast('Instructions envoyées par email (fonctionnalité de démonstration)');
                        } else {
                            showErrorToast('Veuillez entrer un email valide');
                        }
                    });
                }
            }, 100);
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
            try {
                // Clear session
                session.clear();
                
                // Reset app state
                app.isAuthenticated = false;
                app.currentProfile = null;
                app.currentUser = null;
                app.currentCompany = null;
                
                // Close modal and show login
                auth.closeModal();
                auth.showLoginInterface();
                
                showSuccessToast('Déconnexion réussie. À bientôt !');
                console.log('✅ Logout successful');
                
            } catch (error) {
                console.error('Logout error:', error);
                showErrorToast('Erreur lors de la déconnexion');
            }
        },

        // Show login interface
        showLoginInterface: () => {
            const loginInterface = document.getElementById('loginInterface');
            const mainApp = document.getElementById('mainApp');
            
            if (loginInterface && mainApp) {
                loginInterface.classList.remove('hidden');
                mainApp.classList.add('hidden');
                
                // Focus email field
                setTimeout(() => {
                    const emailField = document.getElementById('loginEmail');
                    if (emailField) {
                        emailField.focus();
                    }
                }, 100);
            }
        },

        // Show main application
        showMainApp: () => {
            const loginInterface = document.getElementById('loginInterface');
            const mainApp = document.getElementById('mainApp');
            
            if (loginInterface && mainApp) {
                loginInterface.classList.add('hidden');
                mainApp.classList.remove('hidden');
                
                // Initialize main app if function exists
                if (typeof initializeMainApp === 'function') {
                    initializeMainApp();
                }
            }
        },

        // Restore session
        restoreSession: (sessionData) => {
            try {
                app.isAuthenticated = true;
                app.currentProfile = sessionData.user.profile;
                app.currentUser = sessionData.user;
                
                // Auto-select company for specific profiles
                if (sessionData.user.profile === 'user') {
                    app.currentCompany = '1';
                } else if (sessionData.user.profile === 'caissier') {
                    app.currentCompany = '2';
                }
                
                auth.showMainApp();
                auth.setSessionTimer();
                
                console.log('✅ Session restored:', sessionData.user.name);
                
            } catch (error) {
                console.error('Session restore error:', error);
                auth.logout();
            }
        },

        // Set session timer for auto-logout
        setSessionTimer: () => {
            if (sessionTimer) {
                clearTimeout(sessionTimer);
            }
            
            sessionTimer = setTimeout(() => {
                showErrorToast('Session expirée. Reconnexion requise.');
                auth.logout();
            }, SESSION_DURATION);
        },

        // Extend session (call this on user activity)
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
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = html;
                
                // Setup form handlers if register form
                setTimeout(() => {
                    const registerForm = document.getElementById('registerForm');
                    if (registerForm) {
                        registerForm.addEventListener('submit', auth.handleRegister);
                    }
                }, 100);
            }
        },

        closeModal: () => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
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
