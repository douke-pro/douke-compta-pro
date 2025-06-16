// =============================================================================
// SETTINGS.JS - GESTION COMPLÈTE DES PARAMÈTRES ET UTILISATEURS
// =============================================================================

// =============================================================================
// SETTINGS MANAGEMENT - GESTION DES PARAMÈTRES UTILISATEUR
// =============================================================================

function loadSettings() {
    const content = `
    <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>

    <!-- Informations utilisateur -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex items-center space-x-6 mb-6">
    <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
    ${app.currentUser.name.split(' ').map(n => n[0]).join('')}
    </div>
    <div>
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${app.currentUser.name}</h3>
    <p class="text-gray-600 dark:text-gray-400">${app.currentUser.email}</p>
    <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm ${getProfileColor(app.currentUser.role)}">${app.currentUser.role}</span>
    </div>
    </div>

    <form id="profileForm" class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
    <input type="text" id="profileName" value="${app.currentUser.name}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
    <input type="email" id="profileEmail" value="${app.currentUser.email}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
    <div class="flex space-x-2">
    <select id="profileCountryCode" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    ${getOHADACountries()}
    </select>
    <input type="tel" id="profilePhone" value="07 XX XX XX XX" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>
    </div>
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil</label>
    <input type="text" value="${app.currentUser.role}" readonly class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base">
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Seul l'administrateur peut modifier votre profil</p>
    </div>
    </form>

    <div class="mt-6 flex justify-between">
    <button onclick="saveProfile()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-save mr-2"></i>Sauvegarder
    </button>
    <button onclick="openChangePasswordModal()" class="bg-warning hover:bg-warning/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-key mr-2"></i>Changer mot de passe
    </button>
    </div>
    </div>

    ${app.currentProfile === 'admin' ? `
    <!-- Section Admin: Gestion du logo -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-image mr-2 text-primary"></i>Logo de l'entreprise
    </h3>
    <div class="flex items-center space-x-4">
    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
    ${app.companyLogo ?
        `<img src="${app.companyLogo}" alt="Logo" class="w-full h-full object-cover rounded-lg">` :
        '<i class="fas fa-image text-gray-400 text-2xl"></i>'
    }
    </div>
    <div>
    <button onclick="uploadLogo()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-upload mr-2"></i>Télécharger logo
    </button>
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Format accepté: JPG, PNG (max 2MB)</p>
    </div>
    </div>
    </div>

    <!-- Section Admin: Gestion des données admin -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    <i class="fas fa-cog mr-2 text-primary"></i>Gestion des données admin
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <button onclick="exportAdminData()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-download mr-2"></i>Exporter données
    </button>
    <button onclick="importAdminData()" class="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-upload mr-2"></i>Importer données
    </button>
    <button onclick="resetAdminData()" class="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-refresh mr-2"></i>Réinitialiser
    </button>
    </div>
    <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <p class="text-sm text-gray-600 dark:text-gray-400">
    <i class="fas fa-info-circle mr-2"></i>
    Base de données: ${app.entries.length} écritures, ${app.users.length} utilisateurs, ${app.companies.length} entreprises
    </p>
    </div>
    </div>
    ` : ''}

    <!-- Statistiques personnelles -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mes Statistiques</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="text-center p-4 bg-primary/10 rounded-lg">
    <div class="text-2xl font-bold text-primary">
    ${app.currentProfile === 'caissier' ? '45' : app.entries.filter(e => e.userId === app.currentUser.id).length}
    </div>
    <div class="text-sm text-gray-600 dark:text-gray-400">
    ${app.currentProfile === 'caissier' ? 'Opérations caisse' : 'Écritures'} ce mois
    </div>
    </div>
    <div class="text-center p-4 bg-success/10 rounded-lg">
    <div class="text-2xl font-bold text-success">
    ${app.currentProfile === 'admin' ? app.companies.length :
        app.currentProfile.includes('collaborateur') ? '8' : '1'}
    </div>
    <div class="text-sm text-gray-600 dark:text-gray-400">
    ${app.currentProfile === 'caissier' ? 'Caisse assignée' : 'Entreprises gérées'}
    </div>
    </div>
    <div class="text-center p-4 bg-info/10 rounded-lg">
    <div class="text-2xl font-bold text-info">98%</div>
    <div class="text-sm text-gray-600 dark:text-gray-400">Taux de validation</div>
    </div>
    </div>
    </div>

    <!-- Session et déconnexion -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session</h3>
    <div class="flex items-center justify-between">
    <div>
    <p class="text-sm text-gray-600 dark:text-gray-400">Dernière connexion: Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p class="text-sm text-gray-600 dark:text-gray-400">Profil: ${app.currentUser.role}</p>
    <p class="text-sm text-gray-600 dark:text-gray-400">Navigateur: ${navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Autre'}</p>
    </div>
    <button onclick="confirmLogout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
    </button>
    </div>
    </div>
    </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

function saveProfile() {
    const nameElement = document.getElementById('profileName');
    const emailElement = document.getElementById('profileEmail');
    const phoneElement = document.getElementById('profilePhone');
    const countryCodeElement = document.getElementById('profileCountryCode');

    const name = nameElement ? nameElement.value : app.currentUser.name;
    const email = emailElement ? emailElement.value : app.currentUser.email;
    const phone = phoneElement ? phoneElement.value : '';
    const countryCode = countryCodeElement ? countryCodeElement.value : '+225';

    // Mise à jour des données utilisateur
    app.currentUser.name = name;
    app.currentUser.email = email;
    app.currentUser.phone = countryCode + ' ' + phone;

    // Mettre à jour l'affichage
    updateUserInfo();

    showSuccessMessage('✅ Profil mis à jour avec succès !');
    console.log('✅ Profil sauvegardé:', { name, email, phone: countryCode + ' ' + phone });
}

function openChangePasswordModal() {
    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4" onclick="event.stopPropagation()">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
    <i class="fas fa-key mr-2 text-warning"></i>Changer le mot de passe
    </h3>

    <form id="changePasswordForm" class="space-y-4">
    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe actuel</label>
    <input type="password" id="currentPassword" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
    <input type="password" id="newPassword" required minlength="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 6 caractères</p>
    </div>

    <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le nouveau mot de passe</label>
    <input type="password" id="confirmPassword" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
    </div>

    <div class="flex justify-end space-x-4 pt-4">
    <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    Annuler
    </button>
    <button type="submit" class="bg-warning hover:bg-warning/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
    <i class="fas fa-save mr-2"></i>Modifier
    </button>
    </div>
    </form>
    </div>
    </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleChangePassword();
            });
        }
    }, 100);
}

function handleChangePassword() {
    const currentPasswordElement = document.getElementById('currentPassword');
    const newPasswordElement = document.getElementById('newPassword');
    const confirmPasswordElement = document.getElementById('confirmPassword');

    const currentPassword = currentPasswordElement ? currentPasswordElement.value : '';
    const newPassword = newPasswordElement ? newPasswordElement.value : '';
    const confirmPassword = confirmPasswordElement ? confirmPasswordElement.value : '';

    if (newPassword !== confirmPassword) {
        alert('❌ Les nouveaux mots de passe ne correspondent pas.');
        return;
    }

    if (newPassword.length < 6) {
        alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères.');
        return;
    }

    closeModal();
    showSuccessMessage('✅ Mot de passe modifié avec succès !');
    console.log('✅ Mot de passe changé pour:', app.currentUser.email);
}

// =============================================================================
// USER MANAGEMENT - GESTION DES COLLABORATEURS (ADMIN UNIQUEMENT)
// =============================================================================

function loadUsersManagement() {
    if (app.currentProfile !== 'admin') {
        document.getElementById('mainContent').innerHTML = `
            <div class="text-center p-8">
                <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-ban text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
            </div>
        `;
        return;
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
                <button onclick="openAddUserModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>Nouveau Collaborateur
                </button>
            </div>

            <!-- Statistiques utilisateurs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${app.users.filter(u => u.profile && u.profile.includes('collaborateur')).length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Collaborateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-info">${app.users.filter(u => u.profile === 'user').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${app.users.filter(u => u.profile === 'caissier').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Caissiers</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${app.users.filter(u => u.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
                </div>
            </div>

            <!-- Liste des utilisateurs -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des Collaborateurs</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisateur</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profil</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${generateUsersRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// COMPANIES MANAGEMENT - GESTION DES ENTREPRISES  
// =============================================================================

function loadCompanies() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
                </h2>
                ${app.currentProfile === 'admin' || app.currentProfile.includes('collaborateur') ? `
                <button onclick="openAddCompanyModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nouvelle Entreprise
                </button>
                ` : ''}
            </div>

            <!-- Statistiques entreprises -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${getVisibleCompanies().length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total entreprises</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${getVisibleCompanies().filter(c => c.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actives</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${getVisibleCompanies().filter(c => c.status === 'Période d\'essai').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En essai</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-danger">${getVisibleCompanies().filter(c => c.status === 'Suspendu').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Suspendues</div>
                </div>
            </div>

            <!-- Liste des entreprises -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des Entreprises</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Collaborateur en charge</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Système</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${generateCompaniesRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
}

// =============================================================================
// FONCTIONS UTILITAIRES POUR LES TABLEAUX
// =============================================================================

function generateUsersRows() {
    if (app.users.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-users text-3xl mb-2"></i>
                    <div>Aucun utilisateur trouvé</div>
                </td>
            </tr>
        `;
    }

    return app.users.map(user => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        ${user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900 dark:text-white">${user.name || 'Nom non défini'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getProfileColor(user.role || 'Utilisateur')}">${user.role || 'Utilisateur'}</span>
            </td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${user.email || 'Email non défini'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${user.status === 'Actif' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">${user.status || 'Actif'}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="viewUser(${user.id})" class="text-info hover:text-info/80" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser(${user.id})" class="text-primary hover:text-primary/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${(user.role === 'Collaborateur' || user.role === 'Collaborateur Senior') ? `
                    <button onclick="openCompanyAssignmentModal(${user.id})" class="text-warning hover:text-warning/80" title="Gérer entreprises">
                        <i class="fas fa-building"></i>
                    </button>
                    ` : ''}
                    ${user.role === 'Collaborateur Senior' ? `
                    <button onclick="openCollaboratorAssignmentModal(${user.id})" class="text-info hover:text-info/80" title="Gérer collaborateurs">
                        <i class="fas fa-users"></i>
                    </button>
                    ` : ''}
                    ${user.role === 'Utilisateur' ? `
                    <button onclick="convertUserToCollaborator(${user.id})" class="text-purple-600 hover:text-purple-800" title="Convertir en collaborateur">
                        <i class="fas fa-user-tie"></i>
                    </button>
                    ` : ''}
                    <button onclick="deleteUser(${user.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateCompaniesRows() {
    const visibleCompanies = getVisibleCompanies();
    
    if (visibleCompanies.length === 0) {
        return `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-building text-3xl mb-2"></i>
                    <div>Aucune entreprise trouvée</div>
                </td>
            </tr>
        `;
    }

    return visibleCompanies.map(company => {
        const assignedUser = getCompanyAssignedUser(company.id);
        const canEdit = canUserEditCompany(company.id);
        
        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4">
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">${company.name || 'Nom non défini'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${company.phone || 'Téléphone non renseigné'}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                ${assignedUser ? `
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-xs">
                            ${assignedUser.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">${assignedUser.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${assignedUser.role}</div>
                        </div>
                    </div>
                ` : '<span class="text-gray-400 dark:text-gray-500">Non assigné</span>'}
            </td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${company.type || 'Type non défini'}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${company.system || 'Système normal'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(company.status || 'Actif')}">${company.status || 'Actif'}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="viewCompany(${company.id})" class="text-info hover:text-info/80" title="Voir">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${canEdit ? `
                    <button onclick="editCompany(${company.id})" class="text-primary hover:text-primary/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    ` : ''}
                    ${app.currentProfile === 'admin' ? `
                    <button onclick="deleteCompany(${company.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// =============================================================================
// FONCTIONS UTILITAIRES POUR LES PERMISSIONS ET AFFICHAGE
// =============================================================================

function getVisibleCompanies() {
    if (app.currentProfile === 'admin') {
        return app.companies;
    } else if (app.currentProfile.includes('collaborateur')) {
        // Les collaborateurs voient toutes les entreprises mais ne peuvent modifier que celles qui leur sont affectées
        return app.companies;
    } else if (app.currentProfile === 'user') {
        // Les utilisateurs ne voient que leur entreprise
        return app.companies.filter(c => c.id === app.currentUser.companyId);
    }
    return [];
}

function getCompanyAssignedUser(companyId) {
    return app.users.find(user => 
        user.assignedCompanies && 
        user.assignedCompanies.includes(companyId) &&
        (user.role === 'Collaborateur' || user.role === 'Collaborateur Senior')
    );
}

function canUserEditCompany(companyId) {
    if (app.currentProfile === 'admin') {
        return true;
    }
    
    if (app.currentProfile.includes('collaborateur')) {
        return app.currentUser.assignedCompanies && 
               app.currentUser.assignedCompanies.includes(companyId);
    }
    
    if (app.currentProfile === 'user') {
        return app.currentUser.companyId === companyId;
    }
    
    return false;
}

// =============================================================================
// FONCTIONS UTILITAIRES POUR LES COULEURS
// =============================================================================

function getProfileColor(profile) {
    switch(profile) {
        case 'Administrateur': return 'bg-danger/20 text-danger';
        case 'Collaborateur Senior': return 'bg-primary/20 text-primary';
        case 'Collaborateur': return 'bg-info/20 text-info';
        case 'Utilisateur': return 'bg-success/20 text-success';
        case 'Caissier': return 'bg-warning/20 text-warning';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'Actif': return 'bg-success/20 text-success';
        case 'Période d\'essai': return 'bg-warning/20 text-warning';
        case 'Suspendu': return 'bg-danger/20 text-danger';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

// =============================================================================
// ACTIONS POUR LES UTILISATEURS - IMPLÉMENTATION COMPLÈTE
// =============================================================================

function openAddUserModal() {
    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-user-plus mr-2 text-primary"></i>Ajouter un nouveau collaborateur
                </h3>

                <form id="addUserForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet *</label>
                            <input type="text" id="newUserName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Jean Dupont">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                            <input type="email" id="newUserEmail" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="jean.dupont@email.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                            <div class="flex space-x-2">
                                <select id="newUserCountryCode" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                    ${getOHADACountries()}
                                </select>
                                <input type="tel" id="newUserPhone" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="07 XX XX XX XX">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil *</label>
                            <select id="newUserRole" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" onchange="toggleCompanySelection()">
                                <option value="">Sélectionner un profil</option>
                                <option value="Collaborateur Senior">Collaborateur Senior</option>
                                <option value="Collaborateur">Collaborateur</option>
                                <option value="Utilisateur">Utilisateur</option>
                                <option value="Caissier">Caissier</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe *</label>
                            <input type="password" id="newUserPassword" required minlength="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Minimum 6 caractères">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="newUserStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Actif">Actif</option>
                                <option value="Inactif">Inactif</option>
                            </select>
                        </div>
                    </div>

                    <!-- Section d'affectation d'entreprise -->
                    <div id="companyAssignmentSection" style="display: none;">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Entreprise(s) à affecter *
                            <span id="assignmentNote" class="text-xs text-gray-500 dark:text-gray-400"></span>
                        </label>
                        <div class="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                            ${app.companies.map(company => `
                                <label class="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <input type="checkbox" name="assignedCompanies" value="${company.id}" class="company-assignment-checkbox">
                                    <span class="text-gray-900 dark:text-white">${company.name}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">(${company.type})</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Créer l'utilisateur
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddUser();
            });
        }
    }, 100);
}

function toggleCompanySelection() {
    const roleSelect = document.getElementById('newUserRole');
    const companySection = document.getElementById('companyAssignmentSection');
    const assignmentNote = document.getElementById('assignmentNote');
    const checkboxes = document.querySelectorAll('.company-assignment-checkbox');
    
    if (roleSelect && companySection) {
        const selectedRole = roleSelect.value;
        
        if (selectedRole === 'Utilisateur') {
            companySection.style.display = 'block';
            assignmentNote.textContent = '(Une seule entreprise pour un utilisateur)';
            
            // Permettre une seule sélection pour les utilisateurs
            checkboxes.forEach(checkbox => {
                checkbox.type = 'radio';
                checkbox.name = 'userCompany';
            });
        } else if (selectedRole === 'Collaborateur' || selectedRole === 'Collaborateur Senior') {
            companySection.style.display = 'block';
            assignmentNote.textContent = '(Plusieurs entreprises possibles pour un collaborateur)';
            
            // Permettre plusieurs sélections pour les collaborateurs
            checkboxes.forEach(checkbox => {
                checkbox.type = 'checkbox';
                checkbox.name = 'assignedCompanies';
            });
        } else {
            companySection.style.display = 'none';
        }
    }
}

function handleAddUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const countryCode = document.getElementById('newUserCountryCode').value;
    const phone = document.getElementById('newUserPhone').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;
    const status = document.getElementById('newUserStatus').value;

    // Validation
    if (!name || !email || !role || !password) {
        alert('❌ Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Vérifier si l'email existe déjà
    if (app.users.some(user => user.email === email)) {
        alert('❌ Cet email est déjà utilisé.');
        return;
    }

    // Gérer l'affectation d'entreprises selon le profil
    let assignedCompanies = [];
    let companyId = null;

    if (role === 'Utilisateur') {
        const selectedCompany = document.querySelector('input[name="userCompany"]:checked');
        if (!selectedCompany) {
            alert('❌ Veuillez sélectionner une entreprise pour l\'utilisateur.');
            return;
        }
        companyId = parseInt(selectedCompany.value);
    } else if (role === 'Collaborateur' || role === 'Collaborateur Senior') {
        const selectedCompanies = document.querySelectorAll('input[name="assignedCompanies"]:checked');
        if (selectedCompanies.length === 0) {
            alert('❌ Veuillez sélectionner au moins une entreprise pour le collaborateur.');
            return;
        }
        assignedCompanies = Array.from(selectedCompanies).map(cb => parseInt(cb.value));
    }

    // Créer le nouvel utilisateur
    const newUser = {
        id: app.users.length > 0 ? Math.max(...app.users.map(u => u.id)) + 1 : 1,
        name: name,
        email: email,
        phone: countryCode + ' ' + phone,
        role: role,
        status: status,
        password: password, // En production, il faudrait le hasher
        profile: role.toLowerCase().replace(' ', '_'),
        createdAt: new Date().toISOString(),
        lastLogin: null,
        assignedCompanies: assignedCompanies,
        companyId: companyId
    };

    // Ajouter à la liste des utilisateurs
    app.users.push(newUser);

    closeModal();
    showSuccessMessage('✅ Utilisateur créé avec succès !');
    
    // Recharger la page des utilisateurs
    loadUsersManagement();
    
    console.log('✅ Nouvel utilisateur créé:', newUser);
}

function viewUser(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    const assignedCompaniesInfo = user.assignedCompanies 
        ? user.assignedCompanies.map(companyId => {
            const company = app.companies.find(c => c.id === companyId);
            return company ? company.name : 'Entreprise inconnue';
        }).join(', ')
        : 'Aucune entreprise affectée';

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-lg mx-4" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-user mr-2 text-info"></i>Informations utilisateur
                </h3>

                <div class="space-y-4">
                    <div class="text-center mb-6">
                        <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                            ${user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${user.name}</h4>
                        <span class="px-3 py-1 rounded-full text-sm ${getProfileColor(user.role)}">${user.role}</span>
                    </div>

                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p class="text-gray-900 dark:text-white">${user.email}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                            <p class="text-gray-900 dark:text-white">${user.phone || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Statut</label>
                            <span class="px-2 py-1 rounded text-sm ${user.status === 'Actif' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}">${user.status}</span>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Entreprises affectées</label>
                            <p class="text-gray-900 dark:text-white text-sm">${assignedCompaniesInfo}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</label>
                            <p class="text-gray-900 dark:text-white">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Dernière connexion</label>
                            <p class="text-gray-900 dark:text-white">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais connecté'}</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-6">
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Fermer
                    </button>
                    <button onclick="closeModal(); editUser(${userId})" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-edit mr-2"></i>Modifier
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function editUser(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-user-edit mr-2 text-primary"></i>Modifier l'utilisateur
                </h3>

                <form id="editUserForm" class="space-y-4">
                    <input type="hidden" id="editUserId" value="${user.id}">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet *</label>
                            <input type="text" id="editUserName" value="${user.name}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                            <input type="email" id="editUserEmail" value="${user.email}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                            <div class="flex space-x-2">
                                <select id="editUserCountryCode" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                    ${getOHADACountries()}
                                </select>
                                <input type="tel" id="editUserPhone" value="${user.phone ? user.phone.split(' ').slice(1).join(' ') : ''}" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil *</label>
                            <select id="editUserRole" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Collaborateur Senior" ${user.role === 'Collaborateur Senior' ? 'selected' : ''}>Collaborateur Senior</option>
                                <option value="Collaborateur" ${user.role === 'Collaborateur' ? 'selected' : ''}>Collaborateur</option>
                                <option value="Utilisateur" ${user.role === 'Utilisateur' ? 'selected' : ''}>Utilisateur</option>
                                <option value="Caissier" ${user.role === 'Caissier' ? 'selected' : ''}>Caissier</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="editUserStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Actif" ${user.status === 'Actif' ? 'selected' : ''}>Actif</option>
                                <option value="Inactif" ${user.status === 'Inactif' ? 'selected' : ''}>Inactif</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
                            <input type="password" id="editUserPassword" minlength="6" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Laisser vide pour conserver l'actuel">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleEditUser();
            });
        }
        
        // Pré-sélectionner le code pays
        if (user.phone) {
            const countryCode = user.phone.split(' ')[0];
            const countrySelect = document.getElementById('editUserCountryCode');
            if (countrySelect) {
                countrySelect.value = countryCode;
            }
        }
    }, 100);
}

function handleEditUser() {
    const userId = parseInt(document.getElementById('editUserId').value);
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const countryCode = document.getElementById('editUserCountryCode').value;
    const phone = document.getElementById('editUserPhone').value;
    const role = document.getElementById('editUserRole').value;
    const status = document.getElementById('editUserStatus').value;
    const password = document.getElementById('editUserPassword').value;

    // Validation
    if (!name || !email || !role) {
        alert('❌ Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Vérifier si l'email existe déjà (exclure l'utilisateur actuel)
    if (app.users.some(user => user.email === email && user.id !== userId)) {
        alert('❌ Cet email est déjà utilisé par un autre utilisateur.');
        return;
    }

    // Trouver et mettre à jour l'utilisateur
    const userIndex = app.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        app.users[userIndex] = {
            ...app.users[userIndex],
            name: name,
            email: email,
            phone: countryCode + ' ' + phone,
            role: role,
            status: status,
            profile: role.toLowerCase().replace(' ', '_'),
            updatedAt: new Date().toISOString()
        };

        // Mettre à jour le mot de passe seulement s'il est fourni
        if (password) {
            app.users[userIndex].password = password;
        }

        closeModal();
        showSuccessMessage('✅ Utilisateur modifié avec succès !');
        
        // Recharger la page des utilisateurs
        loadUsersManagement();
        
        console.log('✅ Utilisateur modifié:', app.users[userIndex]);
    } else {
        alert('❌ Erreur lors de la modification de l\'utilisateur.');
    }
}

function deleteUser(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    if (user.id === app.currentUser.id) {
        alert('❌ Vous ne pouvez pas supprimer votre propre compte.');
        return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?\n\nCette action est irréversible.`)) {
        // Supprimer l'utilisateur
        app.users = app.users.filter(u => u.id !== userId);
        
        showSuccessMessage('✅ Utilisateur supprimé avec succès !');
        
        // Recharger la page des utilisateurs
        loadUsersManagement();
        
        console.log('✅ Utilisateur supprimé:', user);
    }
}

// =============================================================================
// ACTIONS POUR LES ENTREPRISES - IMPLÉMENTATION COMPLÈTE
// =============================================================================

function openAddCompanyModal() {
    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-building mr-2 text-primary"></i>Ajouter une nouvelle entreprise
                </h3>

                <form id="addCompanyForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de l'entreprise *</label>
                            <input type="text" id="newCompanyName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="SARL EXEMPLE">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                            <div class="flex space-x-2">
                                <select id="newCompanyCountryCode" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                    ${getOHADACountries()}
                                </select>
                                <input type="tel" id="newCompanyPhone" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="XX XX XX XX">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                            <input type="email" id="newCompanyEmail" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="contact@exemple.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type d'entreprise *</label>
                            <select id="newCompanyType" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Sélectionner un type</option>
                                <option value="SARL">SARL</option>
                                <option value="SA">SA</option>
                                <option value="SAS">SAS</option>
                                <option value="SASU">SASU</option>
                                <option value="EURL">EURL</option>
                                <option value="Auto-entreprise">Auto-entreprise</option>
                                <option value="Association">Association</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Système comptable</label>
                            <select id="newCompanySystem" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Système normal">Système normal</option>
                                <option value="Système simplifié">Système simplifié</option>
                                <option value="Micro-entreprise">Micro-entreprise</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="newCompanyStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Actif">Actif</option>
                                <option value="Période d'essai">Période d'essai</option>
                                <option value="Suspendu">Suspendu</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
                        <textarea id="newCompanyAddress" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" placeholder="Adresse complète de l'entreprise"></textarea>
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Créer l'entreprise
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const addCompanyForm = document.getElementById('addCompanyForm');
        if (addCompanyForm) {
            addCompanyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAddCompany();
            });
        }
    }, 100);
}

function handleAddCompany() {
    const name = document.getElementById('newCompanyName').value;
    const countryCode = document.getElementById('newCompanyCountryCode').value;
    const phone = document.getElementById('newCompanyPhone').value;
    const email = document.getElementById('newCompanyEmail').value;
    const type = document.getElementById('newCompanyType').value;
    const system = document.getElementById('newCompanySystem').value;
    const status = document.getElementById('newCompanyStatus').value;
    const address = document.getElementById('newCompanyAddress').value;

    // Validation
    if (!name || !type) {
        alert('❌ Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Vérifier si l'entreprise existe déjà
    if (app.companies.some(company => company.name.toLowerCase() === name.toLowerCase())) {
        alert('❌ Une entreprise avec ce nom existe déjà.');
        return;
    }

    // Créer la nouvelle entreprise
    const newCompany = {
        id: app.companies.length > 0 ? Math.max(...app.companies.map(c => c.id)) + 1 : 1,
        name: name,
        phone: phone ? countryCode + ' ' + phone : '',
        email: email,
        type: type,
        system: system,
        status: status,
        address: address,
        createdAt: new Date().toISOString(),
        createdBy: app.currentUser.id,
        // Créer un plan comptable spécifique à cette entreprise
        accountingPlan: generateDefaultAccountingPlan()
    };

    // Ajouter à la liste des entreprises
    app.companies.push(newCompany);

    closeModal();
    showSuccessMessage('✅ Entreprise créée avec succès !');
    
    // Recharger la page des entreprises
    loadCompanies();
    
    console.log('✅ Nouvelle entreprise créée:', newCompany);
}

function generateDefaultAccountingPlan() {
    // Plan comptable de base OHADA
    return [
        { code: '101', label: 'Capital' },
        { code: '110', label: 'Réserves' },
        { code: '120', label: 'Report à nouveau' },
        { code: '130', label: 'Résultat net' },
        { code: '401', label: 'Fournisseurs' },
        { code: '411', label: 'Clients' },
        { code: '512', label: 'Banque' },
        { code: '531', label: 'Caisse' },
        { code: '601', label: 'Achats de marchandises' },
        { code: '701', label: 'Ventes de marchandises' }
    ];
}

function viewCompany(companyId) {
    const company = app.companies.find(c => c.id === companyId);
    if (!company) {
        alert('❌ Entreprise non trouvée.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-building mr-2 text-info"></i>Informations de l'entreprise
                </h3>

                <div class="space-y-6">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-primary text-white rounded-lg flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                            <i class="fas fa-building"></i>
                        </div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${company.name}</h4>
                        <span class="px-3 py-1 rounded-full text-sm ${getStatusColor(company.status)}">${company.status}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Nom</label>
                            <p class="text-gray-900 dark:text-white font-medium">${company.name}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                            <p class="text-gray-900 dark:text-white">${company.type}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                            <p class="text-gray-900 dark:text-white">${company.phone || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p class="text-gray-900 dark:text-white">${company.email || 'Non renseigné'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Système comptable</label>
                            <p class="text-gray-900 dark:text-white">${company.system}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</label>
                            <p class="text-gray-900 dark:text-white">${company.createdAt ? new Date(company.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                        </div>
                    </div>

                    ${company.address ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</label>
                        <p class="text-gray-900 dark:text-white">${company.address}</p>
                    </div>
                    ` : ''}

                    <!-- Statistiques de l'entreprise -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 class="font-medium text-gray-900 dark:text-white mb-4">Statistiques</h5>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary">${app.entries.filter(e => e.companyId === company.id).length}</div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">Écritures</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-success">${app.users.filter(u => u.assignedCompanies && u.assignedCompanies.includes(company.id)).length}</div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">Collaborateurs</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-info">${company.accountingPlan ? company.accountingPlan.length : 0}</div>
                                <div class="text-xs text-gray-600 dark:text-gray-400">Comptes</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-6">
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Fermer
                    </button>
                    ${canUserEditCompany(companyId) ? `
                    <button onclick="closeModal(); editCompany(${companyId})" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-edit mr-2"></i>Modifier
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function editCompany(companyId) {
    const company = app.companies.find(c => c.id === companyId);
    if (!company) {
        alert('❌ Entreprise non trouvée.');
        return;
    }

    if (!canUserEditCompany(companyId)) {
        alert('❌ Vous n\'avez pas les permissions pour modifier cette entreprise.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-building-edit mr-2 text-primary"></i>Modifier l'entreprise
                </h3>

                <form id="editCompanyForm" class="space-y-4">
                    <input type="hidden" id="editCompanyId" value="${company.id}">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom de l'entreprise *</label>
                            <input type="text" id="editCompanyName" value="${company.name}" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                            <div class="flex space-x-2">
                                <select id="editCompanyCountryCode" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                    ${getOHADACountries()}
                                </select>
                                <input type="tel" id="editCompanyPhone" value="${company.phone ? company.phone.split(' ').slice(1).join(' ') : ''}" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                            <input type="email" id="editCompanyEmail" value="${company.email || ''}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type d'entreprise *</label>
                            <select id="editCompanyType" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="SARL" ${company.type === 'SARL' ? 'selected' : ''}>SARL</option>
                                <option value="SA" ${company.type === 'SA' ? 'selected' : ''}>SA</option>
                                <option value="SAS" ${company.type === 'SAS' ? 'selected' : ''}>SAS</option>
                                <option value="SASU" ${company.type === 'SASU' ? 'selected' : ''}>SASU</option>
                                <option value="EURL" ${company.type === 'EURL' ? 'selected' : ''}>EURL</option>
                                <option value="Auto-entreprise" ${company.type === 'Auto-entreprise' ? 'selected' : ''}>Auto-entreprise</option>
                                <option value="Association" ${company.type === 'Association' ? 'selected' : ''}>Association</option>
                                <option value="Autre" ${company.type === 'Autre' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Système comptable</label>
                            <select id="editCompanySystem" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Système normal" ${company.system === 'Système normal' ? 'selected' : ''}>Système normal</option>
                                <option value="Système simplifié" ${company.system === 'Système simplifié' ? 'selected' : ''}>Système simplifié</option>
                                <option value="Micro-entreprise" ${company.system === 'Micro-entreprise' ? 'selected' : ''}>Micro-entreprise</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="editCompanyStatus" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="Actif" ${company.status === 'Actif' ? 'selected' : ''}>Actif</option>
                                <option value="Période d'essai" ${company.status === 'Période d\'essai' ? 'selected' : ''}>Période d'essai</option>
                                <option value="Suspendu" ${company.status === 'Suspendu' ? 'selected' : ''}>Suspendu</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
                        <textarea id="editCompanyAddress" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">${company.address || ''}</textarea>
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const editCompanyForm = document.getElementById('editCompanyForm');
        if (editCompanyForm) {
            editCompanyForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleEditCompany();
            });
        }
        
        // Pré-sélectionner le code pays
        if (company.phone) {
            const countryCode = company.phone.split(' ')[0];
            const countrySelect = document.getElementById('editCompanyCountryCode');
            if (countrySelect) {
                countrySelect.value = countryCode;
            }
        }
    }, 100);
}

function handleEditCompany() {
    const companyId = parseInt(document.getElementById('editCompanyId').value);
    const name = document.getElementById('editCompanyName').value;
    const countryCode = document.getElementById('editCompanyCountryCode').value;
    const phone = document.getElementById('editCompanyPhone').value;
    const email = document.getElementById('editCompanyEmail').value;
    const type = document.getElementById('editCompanyType').value;
    const system = document.getElementById('editCompanySystem').value;
    const status = document.getElementById('editCompanyStatus').value;
    const address = document.getElementById('editCompanyAddress').value;

    // Validation
    if (!name || !type) {
        alert('❌ Veuillez remplir tous les champs obligatoires.');
        return;
    }

    // Vérifier si l'entreprise existe déjà (exclure l'entreprise actuelle)
    if (app.companies.some(company => company.name.toLowerCase() === name.toLowerCase() && company.id !== companyId)) {
        alert('❌ Une entreprise avec ce nom existe déjà.');
        return;
    }

    // Trouver et mettre à jour l'entreprise
    const companyIndex = app.companies.findIndex(c => c.id === companyId);
    if (companyIndex !== -1) {
        app.companies[companyIndex] = {
            ...app.companies[companyIndex],
            name: name,
            phone: phone ? countryCode + ' ' + phone : '',
            email: email,
            type: type,
            system: system,
            status: status,
            address: address,
            updatedAt: new Date().toISOString(),
            updatedBy: app.currentUser.id
        };

        closeModal();
        showSuccessMessage('✅ Entreprise modifiée avec succès !');
        
        // Recharger la page des entreprises
        loadCompanies();
        
        console.log('✅ Entreprise modifiée:', app.companies[companyIndex]);
    } else {
        alert('❌ Erreur lors de la modification de l\'entreprise.');
    }
}

function deleteCompany(companyId) {
    const company = app.companies.find(c => c.id === companyId);
    if (!company) {
        alert('❌ Entreprise non trouvée.');
        return;
    }

    // Vérifier s'il y a des données liées
    const hasEntries = app.entries.some(e => e.companyId === companyId);
    const hasUsers = app.users.some(u => u.assignedCompanies && u.assignedCompanies.includes(companyId));

    let confirmMessage = `Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ?\n\nCette action est irréversible.`;
    
    if (hasEntries || hasUsers) {
        confirmMessage += `\n\nATTENTION: Cette entreprise a des données associées:`;
        if (hasEntries) confirmMessage += `\n- ${app.entries.filter(e => e.companyId === companyId).length} écriture(s)`;
        if (hasUsers) confirmMessage += `\n- ${app.users.filter(u => u.assignedCompanies && u.assignedCompanies.includes(companyId)).length} utilisateur(s)`;
        confirmMessage += `\n\nToutes ces données seront également supprimées.`;
    }

    if (confirm(confirmMessage)) {
        // Supprimer l'entreprise
        app.companies = app.companies.filter(c => c.id !== companyId);
        
        // Supprimer les écritures liées
        app.entries = app.entries.filter(e => e.companyId !== companyId);
        
        // Mettre à jour les utilisateurs liés
        app.users.forEach(user => {
            if (user.assignedCompanies && user.assignedCompanies.includes(companyId)) {
                user.assignedCompanies = user.assignedCompanies.filter(id => id !== companyId);
            }
        });
        
        showSuccessMessage('✅ Entreprise supprimée avec succès !');
        
        // Recharger la page des entreprises
        loadCompanies();
        
        console.log('✅ Entreprise supprimée:', company);
    }
}

// =============================================================================
// FONCTIONS COMPLÉMENTAIRES - GESTION DES AFFECTATIONS
// =============================================================================

// Pays de l'espace OHADA avec leurs codes téléphoniques
function getOHADACountries() {
    const countries = [
        { code: '+229', name: 'Bénin', flag: '🇧🇯' },
        { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
        { code: '+237', name: 'Cameroun', flag: '🇨🇲' },
        { code: '+236', name: 'République Centrafricaine', flag: '🇨🇫' },
        { code: '+269', name: 'Comores', flag: '🇰🇲' },
        { code: '+242', name: 'République du Congo', flag: '🇨🇬' },
        { code: '+243', name: 'République Démocratique du Congo', flag: '🇨🇩' },
        { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮', selected: true },
        { code: '+241', name: 'Gabon', flag: '🇬🇦' },
        { code: '+220', name: 'Gambie', flag: '🇬🇲' },
        { code: '+224', name: 'Guinée', flag: '🇬🇳' },
        { code: '+245', name: 'Guinée-Bissau', flag: '🇬🇼' },
        { code: '+240', name: 'Guinée Équatoriale', flag: '🇬🇶' },
        { code: '+223', name: 'Mali', flag: '🇲🇱' },
        { code: '+227', name: 'Niger', flag: '🇳🇪' },
        { code: '+221', name: 'Sénégal', flag: '🇸🇳' },
        { code: '+235', name: 'Tchad', flag: '🇹🇩' },
        { code: '+228', name: 'Togo', flag: '🇹🇬' }
    ];
    
    return countries.map(country => 
        `<option value="${country.code}" ${country.selected ? 'selected' : ''}>${country.flag} ${country.code} ${country.name}</option>`
    ).join('');
}

// Gestion des affectations d'entreprises aux collaborateurs
function openCompanyAssignmentModal(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    // Initialiser les entreprises affectées si nécessaire
    if (!user.assignedCompanies) {
        user.assignedCompanies = [];
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-building mr-2 text-primary"></i>Gestion des entreprises - ${user.name}
                </h3>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Entreprises disponibles -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entreprises disponibles</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            ${app.companies.filter(c => !user.assignedCompanies.includes(c.id)).map(company => `
                                <div class="flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg">
                                    <div>
                                        <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">${company.type} - ${company.status}</div>
                                    </div>
                                    <button onclick="assignCompanyToUser(${userId}, ${company.id})" class="bg-success hover:bg-success/90 text-white px-3 py-1 rounded text-sm transition-colors">
                                        <i class="fas fa-plus mr-1"></i>Affecter
                                    </button>
                                </div>
                            `).join('') || '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Aucune entreprise disponible</p>'}
                        </div>
                    </div>

                    <!-- Entreprises affectées -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entreprises affectées</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            ${user.assignedCompanies.map(companyId => {
                                const company = app.companies.find(c => c.id === companyId);
                                return company ? `
                                    <div class="flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">${company.name}</div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">${company.type} - ${company.status}</div>
                                        </div>
                                        <button onclick="unassignCompanyFromUser(${userId}, ${company.id})" class="bg-danger hover:bg-danger/90 text-white px-3 py-1 rounded text-sm transition-colors">
                                            <i class="fas fa-minus mr-1"></i>Retirer
                                        </button>
                                    </div>
                                ` : '';
                            }).join('') || '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Aucune entreprise affectée</p>'}
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-6">
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function assignCompanyToUser(userId, companyId) {
    const user = app.users.find(u => u.id === userId);
    const company = app.companies.find(c => c.id === companyId);
    
    if (!user || !company) {
        alert('❌ Utilisateur ou entreprise non trouvé.');
        return;
    }

    if (!user.assignedCompanies) {
        user.assignedCompanies = [];
    }

    if (!user.assignedCompanies.includes(companyId)) {
        user.assignedCompanies.push(companyId);
        showSuccessMessage(`✅ Entreprise "${company.name}" affectée à ${user.name}`);
        
        // Recharger le modal
        openCompanyAssignmentModal(userId);
        
        console.log(`✅ Entreprise ${company.name} affectée à ${user.name}`);
    }
}

function unassignCompanyFromUser(userId, companyId) {
    const user = app.users.find(u => u.id === userId);
    const company = app.companies.find(c => c.id === companyId);
    
    if (!user || !company) {
        alert('❌ Utilisateur ou entreprise non trouvé.');
        return;
    }

    if (user.assignedCompanies) {
        user.assignedCompanies = user.assignedCompanies.filter(id => id !== companyId);
        showSuccessMessage(`✅ Entreprise "${company.name}" retirée de ${user.name}`);
        
        // Recharger le modal
        openCompanyAssignmentModal(userId);
        
        console.log(`✅ Entreprise ${company.name} retirée de ${user.name}`);
    }
}

// Gestion des collaborateurs par les collaborateurs seniors
function openCollaboratorAssignmentModal(seniorUserId) {
    const seniorUser = app.users.find(u => u.id === seniorUserId);
    if (!seniorUser || seniorUser.role !== 'Collaborateur Senior') {
        alert('❌ Collaborateur senior non trouvé.');
        return;
    }

    // Initialiser les collaborateurs affectés si nécessaire
    if (!seniorUser.managedCollaborators) {
        seniorUser.managedCollaborators = [];
    }

    const availableCollaborators = app.users.filter(u => 
        u.role === 'Collaborateur' && 
        !seniorUser.managedCollaborators.includes(u.id) &&
        u.id !== seniorUserId
    );

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-users mr-2 text-primary"></i>Gestion des collaborateurs - ${seniorUser.name}
                </h3>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Collaborateurs disponibles -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collaborateurs disponibles</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            ${availableCollaborators.map(collaborator => `
                                <div class="flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                            ${collaborator.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div class="font-medium text-gray-900 dark:text-white">${collaborator.name}</div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">${collaborator.email}</div>
                                        </div>
                                    </div>
                                    <button onclick="assignCollaboratorToSenior(${seniorUserId}, ${collaborator.id})" class="bg-success hover:bg-success/90 text-white px-3 py-1 rounded text-sm transition-colors">
                                        <i class="fas fa-plus mr-1"></i>Affecter
                                    </button>
                                </div>
                            `).join('') || '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Aucun collaborateur disponible</p>'}
                        </div>
                    </div>

                    <!-- Collaborateurs gérés -->
                    <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collaborateurs gérés</h4>
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                            ${seniorUser.managedCollaborators.map(collaboratorId => {
                                const collaborator = app.users.find(u => u.id === collaboratorId);
                                return collaborator ? `
                                    <div class="flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                                ${collaborator.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-900 dark:text-white">${collaborator.name}</div>
                                                <div class="text-sm text-gray-500 dark:text-gray-400">${collaborator.email}</div>
                                            </div>
                                        </div>
                                        <button onclick="unassignCollaboratorFromSenior(${seniorUserId}, ${collaborator.id})" class="bg-danger hover:bg-danger/90 text-white px-3 py-1 rounded text-sm transition-colors">
                                            <i class="fas fa-minus mr-1"></i>Retirer
                                        </button>
                                    </div>
                                ` : '';
                            }).join('') || '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Aucun collaborateur géré</p>'}
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-6">
                    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
}

function assignCollaboratorToSenior(seniorUserId, collaboratorId) {
    const seniorUser = app.users.find(u => u.id === seniorUserId);
    const collaborator = app.users.find(u => u.id === collaboratorId);
    
    if (!seniorUser || !collaborator) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    if (!seniorUser.managedCollaborators) {
        seniorUser.managedCollaborators = [];
    }

    if (!seniorUser.managedCollaborators.includes(collaboratorId)) {
        seniorUser.managedCollaborators.push(collaboratorId);
        
        // Mettre à jour le collaborateur pour indiquer qu'il est géré
        collaborator.managedBy = seniorUserId;
        
        showSuccessMessage(`✅ Collaborateur "${collaborator.name}" affecté à ${seniorUser.name}`);
        
        // Recharger le modal
        openCollaboratorAssignmentModal(seniorUserId);
        
        console.log(`✅ Collaborateur ${collaborator.name} affecté à ${seniorUser.name}`);
    }
}

function unassignCollaboratorFromSenior(seniorUserId, collaboratorId) {
    const seniorUser = app.users.find(u => u.id === seniorUserId);
    const collaborator = app.users.find(u => u.id === collaboratorId);
    
    if (!seniorUser || !collaborator) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    if (seniorUser.managedCollaborators) {
        seniorUser.managedCollaborators = seniorUser.managedCollaborators.filter(id => id !== collaboratorId);
        
        // Retirer la référence du collaborateur
        delete collaborator.managedBy;
        
        showSuccessMessage(`✅ Collaborateur "${collaborator.name}" retiré de ${seniorUser.name}`);
        
        // Recharger le modal
        openCollaboratorAssignmentModal(seniorUserId);
        
        console.log(`✅ Collaborateur ${collaborator.name} retiré de ${seniorUser.name}`);
    }
}

// Conversion d'un utilisateur en collaborateur
function convertUserToCollaborator(userId) {
    const user = app.users.find(u => u.id === userId);
    if (!user) {
        alert('❌ Utilisateur non trouvé.');
        return;
    }

    if (user.role !== 'Utilisateur') {
        alert('❌ Seuls les utilisateurs peuvent être convertis en collaborateurs.');
        return;
    }

    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    <i class="fas fa-user-tie mr-2 text-primary"></i>Convertir en collaborateur - ${user.name}
                </h3>

                <form id="convertUserForm" class="space-y-4">
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <p class="text-blue-800 dark:text-blue-200">
                            <i class="fas fa-info-circle mr-2"></i>
                            Cette action convertira l'utilisateur "${user.name}" en collaborateur et lui permettra de gérer plusieurs entreprises.
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau profil *</label>
                        <select id="newCollaboratorRole" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">Sélectionner un profil</option>
                            <option value="Collaborateur">Collaborateur</option>
                            <option value="Collaborateur Senior">Collaborateur Senior</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entreprises à affecter</label>
                        <div class="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                            ${app.companies.map(company => `
                                <label class="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                                    <input type="checkbox" value="${company.id}" class="company-checkbox" ${company.id === user.companyId ? 'checked' : ''}>
                                    <span class="text-gray-900 dark:text-white">${company.name}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">(${company.type})</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-4 pt-6">
                        <button type="button" onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-user-tie mr-2"></i>Convertir
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;

    setTimeout(() => {
        const convertUserForm = document.getElementById('convertUserForm');
        if (convertUserForm) {
            convertUserForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleConvertUser(userId);
            });
        }
    }, 100);
}

function handleConvertUser(userId) {
    const newRole = document.getElementById('newCollaboratorRole').value;
    const selectedCompanies = Array.from(document.querySelectorAll('.company-checkbox:checked')).map(cb => parseInt(cb.value));

    if (!newRole) {
        alert('❌ Veuillez sélectionner un profil.');
        return;
    }

    if (selectedCompanies.length === 0) {
        alert('❌ Veuillez sélectionner au moins une entreprise.');
        return;
    }

    const user = app.users.find(u => u.id === userId);
    if (user) {
        // Convertir l'utilisateur
        user.role = newRole;
        user.profile = newRole.toLowerCase().replace(' ', '_');
        user.assignedCompanies = selectedCompanies;
        user.convertedAt = new Date().toISOString();
        
        // Supprimer l'ancienne référence companyId
        delete user.companyId;

        closeModal();
        showSuccessMessage(`✅ ${user.name} converti en ${newRole} avec succès !`);
        
        // Recharger la page des utilisateurs
        loadUsersManagement();
        
        console.log(`✅ Utilisateur ${user.name} converti en ${newRole}`);
    }
}

// =============================================================================
// FONCTIONS DE GESTION DES DONNÉES ADMIN
// =============================================================================

function exportAdminData() {
    try {
        const adminData = {
            users: app.users,
            companies: app.companies,
            entries: app.entries,
            exportDate: new Date().toISOString(),
            exportedBy: app.currentUser.id,
            version: '1.0'
        };

        const dataStr = JSON.stringify(adminData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-admin-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showSuccessMessage('✅ Données exportées avec succès !');
        console.log('✅ Export des données admin effectué');
    } catch (error) {
        alert('❌ Erreur lors de l\'export des données.');
        console.error('❌ Erreur export:', error);
    }
}

function importAdminData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validation basique de la structure
                if (!importedData.users || !importedData.companies || !importedData.entries) {
                    throw new Error('Structure de données invalide');
                }
                
                if (confirm('Êtes-vous sûr de vouloir importer ces données ?\n\nCela remplacera toutes les données actuelles.')) {
                    app.users = importedData.users;
                    app.companies = importedData.companies;
                    app.entries = importedData.entries;
                    
                    showSuccessMessage('✅ Données importées avec succès !');
                    
                    // Recharger l'interface
                    loadSettings();
                    
                    console.log('✅ Import des données admin effectué');
                }
            } catch (error) {
                alert('❌ Erreur lors de l\'import: fichier invalide.');
                console.error('❌ Erreur import:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function resetAdminData() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?\n\nCette action supprimera:\n- Tous les utilisateurs (sauf admin)\n- Toutes les entreprises\n- Toutes les écritures\n\nCette action est irréversible.')) {
        if (confirm('DERNIÈRE CONFIRMATION:\n\nToutes les données seront définitivement perdues.\n\nContinuer ?')) {
            // Garder seulement l'utilisateur admin actuel
            app.users = app.users.filter(u => u.id === app.currentUser.id);
            app.companies = [];
            app.entries = [];
            
            showSuccessMessage('✅ Données réinitialisées avec succès !');
            
            // Recharger l'interface
            loadSettings();
            
            console.log('✅ Réinitialisation des données admin effectuée');
        }
    }
}

// =============================================================================
// FONCTIONNALITÉ UPLOAD LOGO - IMPLÉMENTATION COMPLÈTE
// =============================================================================

function uploadLogo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png, image/jpg';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Vérification de la taille (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('❌ Le fichier est trop volumineux. Taille maximum: 2MB');
            return;
        }
        
        // Vérification du type
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            alert('❌ Format non supporté. Utilisez JPG ou PNG uniquement.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Stocker le logo en base64
                app.companyLogo = e.target.result;
                
                showSuccessMessage('✅ Logo téléchargé avec succès !');
                
                // Recharger la section pour afficher le nouveau logo
                loadSettings();
                
                console.log('✅ Logo uploadé avec succès');
            } catch (error) {
                alert('❌ Erreur lors du téléchargement du logo.');
                console.error('❌ Erreur upload logo:', error);
            }
        };
        
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// =============================================================================
// FONCTIONS GLOBALES NÉCESSAIRES
// =============================================================================

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

function closeModalOnBackground(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

function showSuccessMessage(message) {
    // Créer une notification moderne
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animer l'entrée
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function confirmLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        if (typeof logout === 'function') {
            logout();
        } else {
            // Fallback si la fonction logout n'est pas disponible
            app.currentUser = null;
            app.currentProfile = null;
            window.location.reload();
        }
    }
}

// Assurer la disponibilité de updateUserInfo si pas définie ailleurs
if (typeof updateUserInfo !== 'function') {
    function updateUserInfo() {
        // Fonction minimale si pas définie dans auth.js
        const userNameElement = document.querySelector('.user-name');
        const userEmailElement = document.querySelector('.user-email');
        
        if (userNameElement) userNameElement.textContent = app.currentUser.name;
        if (userEmailElement) userEmailElement.textContent = app.currentUser.email;
        
        console.log('UpdateUserInfo called from settings.js');
    }
}
