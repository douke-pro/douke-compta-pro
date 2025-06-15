// =============================================================================
// AUTH.JS - GESTION COMPLÈTE DE L'AUTHENTIFICATION
// =============================================================================

// =============================================================================
// VARIABLES GLOBALES D'AUTHENTIFICATION
// =============================================================================

// Base de données des utilisateurs - ORIGINALE COMPLÈTE
const authUsers = {
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

// =============================================================================
// FONCTIONS DE CONNEXION RAPIDE
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
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (emailInput && passwordInput) {
            emailInput.value = cred.email;
            passwordInput.value = cred.password;
            handleLogin();
        }
    }
}

// =============================================================================
// GESTION DE LA CONNEXION
// =============================================================================

function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
        console.error('❌ Éléments de connexion non trouvés');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('❌ Veuillez saisir votre email et mot de passe.');
        return;
    }

    const user = authUsers[email];
    if (user && user.password === password) {
        // Authentification réussie
        app.isAuthenticated = true;
        app.currentProfile = user.profile;
        app.currentUser = {
            id: user.id,
            name: user.name,
            email: email,
            role: user.role
        };

        // Auto-sélection d'entreprise pour utilisateur et caissier
        if (user.profile === 'user') {
            app.currentCompany = '1';
        } else if (user.profile === 'caissier') {
            app.currentCompany = '2';
        }

        showMainApp();
        console.log('✅ Connexion réussie:', user.name);
    } else {
        alert('❌ Identifiants incorrects. Utilisez les comptes de démonstration.');
        console.log('❌ Tentative de connexion échouée pour:', email);
    }
}

// =============================================================================
// GESTION DE L'INSCRIPTION
// =============================================================================

function showRegisterForm() {
    const registerModal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-user-plus text-2xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Inscription</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Créer votre compte</p>
            </div>

            <form id="registerForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prénom</label>
                        <input type="text" id="regFirstName" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom</label>
                        <input type="text" id="regLastName" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input type="email" id="regEmail" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Numéro de téléphone</label>
                    <input type="tel" id="regPhone" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="+225 07 XX XX XX XX">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de l'entreprise</label>
                    <input type="text" id="regCompanyName" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type d'entreprise</label>
                    <select id="regCompanyType" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="">-- Sélectionner le type --</option>
                        <option value="SARL">SARL - Société à Responsabilité Limitée</option>
                        <option value="SA">SA - Société Anonyme</option>
                        <option value="EURL">EURL - Entreprise Unipersonnelle à Responsabilité Limitée</option>
                        <option value="SAS">SAS - Société par Actions Simplifiée</option>
                        <option value="SNC">SNC - Société en Nom Collectif</option>
                        <option value="EI">EI - Entreprise Individuelle</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
                    <input type="password" id="regPassword" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le mot de passe</label>
                    <input type="password" id="regConfirmPassword" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>

                <div class="bg-info/10 p-4 rounded-lg">
                    <p class="text-sm text-info">
                        <i class="fas fa-info-circle mr-2"></i>
                        Votre compte sera créé avec le profil <strong>"Utilisateur"</strong>.
                        Vous pourrez gérer uniquement votre entreprise.
                    </p>
                </div>

                <button type="submit" class="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors">
                    Créer mon compte
                </button>
            </form>

            <div class="mt-6 flex justify-between">
                <button onclick="showLoginInterface()" class="text-primary hover:text-primary/80 font-medium">← Retour à la connexion</button>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">Fermer</button>
            </div>
        </div>
    </div>
    `;

    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = registerModal;

        setTimeout(() => {
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    handleRegister();
                });
            }
        }, 100);
    }
}

function handleRegister() {
    const firstName = document.getElementById('regFirstName')?.value || '';
    const lastName = document.getElementById('regLastName')?.value || '';
    const email = document.getElementById('regEmail')?.value || '';
    const phone = document.getElementById('regPhone')?.value || '';
    const companyName = document.getElementById('regCompanyName')?.value || '';
    const companyType = document.getElementById('regCompanyType')?.value || '';
    const password = document.getElementById('regPassword')?.value || '';
    const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

    if (password !== confirmPassword) {
        alert('❌ Les mots de passe ne correspondent pas.');
        return;
    }

    if (!firstName || !lastName || !email || !companyName || !companyType || !password) {
        alert('❌ Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Vérifier si l'email existe déjà
    if (authUsers[email]) {
        alert('❌ Un compte avec cet email existe déjà.');
        return;
    }

    // Simuler la création du compte
    const newUser = {
        id: app.users.length + 1,
        name: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        role: 'Utilisateur',
        profile: 'user',
        companies: [],
        status: 'Actif'
    };

    const newCompany = {
        id: app.companies.length + 1,
        name: companyName,
        type: companyType,
        status: 'Période d\'essai',
        system: 'Normal',
        phone: phone,
        address: '',
        cashRegisters: 1
    };

    // Ajouter aux données de l'application
    app.users.push(newUser);
    app.companies.push(newCompany);
    
    // Ajouter aux utilisateurs d'authentification
    authUsers[email] = {
        password: password,
        profile: 'user',
        name: `${firstName} ${lastName}`,
        role: 'Utilisateur',
        id: newUser.id
    };

    closeModal();
    alert('✅ Inscription réussie ! Votre compte a été créé avec le profil "Utilisateur". Vous pouvez maintenant vous connecter.');
    
    console.log('✅ Nouveau compte créé:', newUser);
}

// =============================================================================
// GESTION DE LA DÉCONNEXION
// =============================================================================

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
    
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = modal;
    }
}

function logout() {
    // Réinitialiser les données de session
    app.isAuthenticated = false;
    app.currentProfile = null;
    app.currentUser = null;
    app.currentCompany = null;
    
    closeModal();
    showLoginInterface();
    showSuccessMessage('✅ Déconnexion réussie. À bientôt !');
    
    console.log('✅ Utilisateur déconnecté');
}

// =============================================================================
// GESTION DES INTERFACES
// =============================================================================

function showLoginInterface() {
    const loginInterface = document.getElementById('loginInterface');
    const mainApp = document.getElementById('mainApp');
    const modalContainer = document.getElementById('modalContainer');
    
    if (loginInterface) loginInterface.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    if (modalContainer) modalContainer.innerHTML = '';
}

function showMainApp() {
    const loginInterface = document.getElementById('loginInterface');
    const mainApp = document.getElementById('mainApp');
    
    if (loginInterface) loginInterface.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    // Initialiser l'application après connexion
    if (typeof initializeApp === 'function') {
        initializeApp();
    }
}

// =============================================================================
// GESTION MOT DE PASSE OUBLIÉ
// =============================================================================

function showForgotPassword() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-info text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-key text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Mot de passe oublié</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Saisissez votre email pour recevoir un lien de récupération</p>
            </div>
            
            <form id="forgotPasswordForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input type="email" id="forgotEmail" required class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="votre@email.com">
                </div>
                
                <button type="submit" class="w-full bg-info hover:bg-info/90 text-white py-3 rounded-lg font-medium transition-colors">
                    <i class="fas fa-paper-plane mr-2"></i>Envoyer le lien
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">Retour à la connexion</button>
            </div>
        </div>
    </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = modal;
        
        setTimeout(() => {
            const forgotForm = document.getElementById('forgotPasswordForm');
            if (forgotForm) {
                forgotForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    handleForgotPassword();
                });
            }
        }, 100);
    }
}

function handleForgotPassword() {
    const emailInput = document.getElementById('forgotEmail');
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        alert('❌ Veuillez saisir votre adresse email.');
        return;
    }
    
    if (authUsers[email]) {
        closeModal();
        alert('📧 Un email de récupération a été envoyé à votre adresse.\n\nVeuillez vérifier votre boîte de réception et suivre les instructions.');
        console.log('📧 Email de récupération envoyé pour:', email);
    } else {
        alert('❌ Aucun compte associé à cet email.');
    }
}

// =============================================================================
// VÉRIFICATION D'AUTHENTIFICATION
// =============================================================================

function checkAuthentication() {
    return app && app.isAuthenticated === true && app.currentUser !== null;
}

function requireAuth() {
    if (!checkAuthentication()) {
        showLoginInterface();
        return false;
    }
    return true;
}

function hasPermission(requiredProfile) {
    if (!checkAuthentication()) return false;
    
    const profileHierarchy = {
        'admin': 5,
        'collaborateur-senior': 4,
        'collaborateur': 3,
        'user': 2,
        'caissier': 1
    };
    
    const userLevel = profileHierarchy[app.currentProfile] || 0;
    const requiredLevel = profileHierarchy[requiredProfile] || 0;
    
    return userLevel >= requiredLevel;
}

// =============================================================================
// GESTION DES PROFILS UTILISATEUR
// =============================================================================

function getCurrentUserProfile() {
    return app && app.currentProfile ? app.currentProfile : null;
}

function getCurrentUser() {
    return app && app.currentUser ? app.currentUser : null;
}

function isAdmin() {
    return getCurrentUserProfile() === 'admin';
}

function isCollaborator() {
    const profile = getCurrentUserProfile();
    return profile === 'collaborateur' || profile === 'collaborateur-senior';
}

function isCashier() {
    return getCurrentUserProfile() === 'caissier';
}

function isUser() {
    return getCurrentUserProfile() === 'user';
}

// =============================================================================
// INITIALISATION DES ÉVÉNEMENTS D'AUTHENTIFICATION
// =============================================================================

function initializeAuthEvents() {
    // Événement pour le formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Gestion de la touche Enter dans les champs de connexion
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (loginEmail) {
        loginEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const passwordField = document.getElementById('loginPassword');
                if (passwordField) {
                    passwordField.focus();
                }
            }
        });
    }
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    console.log('✅ Événements d\'authentification initialisés');
}

// =============================================================================
// UTILITAIRES D'AUTHENTIFICATION
// =============================================================================

function updateUserInfo() {
    if (!checkAuthentication()) return;
    
    const profiles = {
        'admin': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur-senior': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'collaborateur': { showSelector: true, defaultCompany: 'Aucune entreprise sélectionnée' },
        'user': { showSelector: false, defaultCompany: 'SARL TECH INNOVATION' },
        'caissier': { showSelector: false, defaultCompany: 'SA COMMERCE PLUS' }
    };

    const profile = profiles[app.currentProfile];
    if (!profile) return;

    // Mise à jour des informations utilisateur dans l'interface
    const currentUserElement = document.getElementById('currentUser');
    const currentCompanyElement = document.getElementById('currentCompany');
    const sidebarUserNameElement = document.getElementById('sidebarUserName');
    const sidebarUserRoleElement = document.getElementById('sidebarUserRole');
    
    if (currentUserElement) {
        currentUserElement.textContent = app.currentUser.name;
    }
    
    if (currentCompanyElement) {
        currentCompanyElement.textContent = app.currentCompany ? getCompanyName() : profile.defaultCompany;
    }
    
    if (sidebarUserNameElement) {
        sidebarUserNameElement.textContent = app.currentUser.name;
    }
    
    if (sidebarUserRoleElement) {
        sidebarUserRoleElement.textContent = app.currentUser.role;
    }

    // Gestion de l'affichage du sélecteur d'entreprise
    const companySelector = document.getElementById('companySelector');
    const adminActions = document.getElementById('adminActions');

    if (companySelector) {
        companySelector.style.display = profile.showSelector ? 'block' : 'none';

        // Peupler le sélecteur
        if (profile.showSelector && typeof populateCompanySelector === 'function') {
            populateCompanySelector();
        }
    }

    // Affichage des actions admin uniquement pour les administrateurs
    if (adminActions) {
        adminActions.style.display = app.currentProfile === 'admin' ? 'block' : 'none';
    }

    // Appliquer le logo s'il existe
    if (typeof updateLogoGlobally === 'function') {
        updateLogoGlobally();
    }
}

// =============================================================================
// EXPORTATION DES FONCTIONS (si utilisé avec des modules)
// =============================================================================

// Si utilisé dans un environnement de modules, exporter les fonctions principales
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loginAs,
        handleLogin,
        showRegisterForm,
        handleRegister,
        confirmLogout,
        logout,
        showLoginInterface,
        showMainApp,
        showForgotPassword,
        handleForgotPassword,
        checkAuthentication,
        requireAuth,
        hasPermission,
        getCurrentUserProfile,
        getCurrentUser,
        isAdmin,
        isCollaborator,
        isCashier,
        isUser,
        initializeAuthEvents,
        updateUserInfo
    };
}

console.log('✅ Auth.js chargé avec succès - Toutes les fonctions d\'authentification disponibles');
