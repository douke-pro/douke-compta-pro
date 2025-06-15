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
    <input type="tel" id="profilePhone" value="+225 07 XX XX XX XX" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
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

    const name = nameElement ? nameElement.value : app.currentUser.name;
    const email = emailElement ? emailElement.value : app.currentUser.email;
    const phone = phoneElement ? phoneElement.value : '';

    // Mise à jour des données utilisateur
    app.currentUser.name = name;
    app.currentUser.email = email;

    // Mettre à jour l'affichage
    updateUserInfo();

    showSuccessMessage('✅ Profil mis à jour avec succès !');
    console.log('✅ Profil sauvegardé:', { name, email, phone });
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
                ${app.currentProfile === 'admin' ? `
                <button onclick="openAddCompanyModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nouvelle Entreprise
                </button>
                ` : ''}
            </div>

            <!-- Statistiques entreprises -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${app.companies.length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total entreprises</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${app.companies.filter(c => c.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actives</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${app.companies.filter(c => c.status === 'Période d\'essai').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En essai</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-danger">${app.companies.filter(c => c.status === 'Suspendu').length}</div>
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
                    <button onclick="editUser(${user.id})" class="text-primary hover:text-primary/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser(${user.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateCompaniesRows() {
    if (app.companies.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-building text-3xl mb-2"></i>
                    <div>Aucune entreprise trouvée</div>
                </td>
            </tr>
        `;
    }

    return app.companies.map(company => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4">
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">${company.name || 'Nom non défini'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${company.phone || 'Téléphone non renseigné'}</div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${company.type || 'Type non défini'}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white">${company.system || 'Système normal'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm ${getStatusColor(company.status || 'Actif')}">${company.status || 'Actif'}</span>
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="editCompany(${company.id})" class="text-primary hover:text-primary/80" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${app.currentProfile === 'admin' ? `
                    <button onclick="deleteCompany(${company.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
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
// ACTIONS POUR LES UTILISATEURS ET ENTREPRISES
// =============================================================================

function openAddUserModal() {
    alert('🚧 Fonctionnalité "Ajouter un utilisateur" à implémenter');
}

function editUser(userId) {
    alert(`🚧 Modification de l'utilisateur ${userId} à implémenter`);
}

function deleteUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        alert(`🚧 Suppression de l'utilisateur ${userId} à implémenter`);
    }
}

function openAddCompanyModal() {
    alert('🚧 Fonctionnalité "Ajouter une entreprise" à implémenter');
}

function editCompany(companyId) {
    alert(`🚧 Modification de l'entreprise ${companyId} à implémenter`);
}

function deleteCompany(companyId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
        alert(`🚧 Suppression de l'entreprise ${companyId} à implémenter`);
    }
}

function uploadLogo() {
    alert('🚧 Fonctionnalité "Upload logo" à implémenter');
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
    alert(message);
}

// Assurer la disponibilité de updateUserInfo si pas définie ailleurs
if (typeof updateUserInfo !== 'function') {
    function updateUserInfo() {
        // Fonction minimale si pas définie dans auth.js
        console.log('UpdateUserInfo called from settings.js');
    }
}
