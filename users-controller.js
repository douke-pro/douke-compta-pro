// =============================================================================
// DOUKÈ Compta Pro - Contrôleur de gestion des utilisateurs v3.1
// =============================================================================

class UsersController {
    constructor(securityManager, dataManager) {
        this.security = securityManager;
        this.data = dataManager;
        this.currentFilters = {
            search: '',
            role: '',
            status: '',
            company: ''
        };
        
        console.log('👥 UsersController initialisé');
    }

    // Charger la page de gestion des utilisateurs
    loadUsersPage() {
        if (window.app.currentProfile !== 'admin') {
            this.showAccessDenied();
            return;
        }

        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
                        <p class="text-gray-600 dark:text-gray-400">Administration complète des utilisateurs du système</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            ${window.app.users.length} utilisateur(s) total
                        </div>
                        <button onclick="window.usersController.showNewUserModal()" 
                                class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>Nouveau Collaborateur
                        </button>
                    </div>
                </div>

                <!-- Statistiques par rôle -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-danger">
                        <div class="text-3xl font-bold text-danger">${window.app.users.filter(u => u.profile === 'admin').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Administrateurs</div>
                        <div class="text-xs text-danger mt-1">Niveau 5</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-primary">
                        <div class="text-3xl font-bold text-primary">${window.app.users.filter(u => u.profile === 'collaborateur_senior').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Senior</div>
                        <div class="text-xs text-primary mt-1">Niveau 4</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-info">
                        <div class="text-3xl font-bold text-info">${window.app.users.filter(u => u.profile === 'collaborateur').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Collaborateurs</div>
                        <div class="text-xs text-info mt-1">Niveau 3</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-success">
                        <div class="text-3xl font-bold text-success">${window.app.users.filter(u => u.profile === 'user').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
                        <div class="text-xs text-success mt-1">Niveau 2</div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border-l-4 border-warning">
                        <div class="text-3xl font-bold text-warning">${window.app.users.filter(u => u.profile === 'caissier').length}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Caissiers</div>
                        <div class="text-xs text-warning mt-1">Niveau 1</div>
                    </div>
                </div>

                <!-- Filtres et recherche -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche</label>
                            <input type="text" id="userSearch" placeholder="Nom, email..." 
                                   onkeyup="window.usersController.filterUsers()"
                                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
                            <select id="roleFilter" onchange="window.usersController.filterUsers()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les rôles</option>
                                <option value="admin">Administrateur</option>
                                <option value="collaborateur_senior">Collaborateur Senior</option>
                                <option value="collaborateur">Collaborateur</option>
                                <option value="user">Utilisateur</option>
                                <option value="caissier">Caissier</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                            <select id="statusFilter" onchange="window.usersController.filterUsers()"
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                                <option value="">Tous les statuts</option>
                                <option value="Actif">Actif</option>
                                <option value="Inactif">Inactif</option>
                                <option value="Suspendu">Suspendu</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="window.usersController.resetFilters()" 
                                    class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                <i class="fas fa-sync mr-2"></i>Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Liste des utilisateurs -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Liste des Utilisateurs
                            <span id="userCount" class="text-sm font-normal text-gray-500 ml-2">(${window.app.users.length})</span>
                        </h3>
                    </div>
                    <div id="usersTableContainer">
                        ${this.generateUsersTable()}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('mainContent').innerHTML = content;
    }

    // Générer le tableau des utilisateurs
    generateUsersTable() {
        const filteredUsers = this.getFilteredUsers();
        
        if (filteredUsers.length === 0) {
            return `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-users text-6xl mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
                    <p>Aucun utilisateur ne correspond à vos critères de recherche.</p>
                </div>
            `;
        }

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Utilisateur
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Rôle & Niveau
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Entreprises
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Statut
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Dernière connexion
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        ${filteredUsers.map(user => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 ${this.getRoleColor(user.profile)} text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                            ${user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900 dark:text-white">${user.name}</div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">${user.email}</div>
                                            <div class="text-xs text-gray-400">${user.phone || 'Tél. non renseigné'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-900 dark:text-white font-medium">${user.role}</div>
                                    <div class="flex items-center space-x-2">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getRoleBadgeColor(user.profile)}">
                                            ${this.getRoleIcon(user.profile)} Niveau ${this.security.profileHierarchy[user.profile]}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-900 dark:text-white">
                                        ${this.getUserCompanies(user).length} entreprise(s)
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        ${this.getUserCompanies(user).slice(0, 2).map(c => c.name).join(', ')}
                                        ${this.getUserCompanies(user).length > 2 ? '...' : ''}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(user.status)}">
                                        ${user.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                                </td>
                                <td class="px-6 py-4 text-sm font-medium">
                                    <div class="flex space-x-2">
                                        <button onclick="window.usersController.viewUser(${user.id})" 
                                                class="text-info hover:text-info/80" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="editUser(${user.id})" 
                                                class="text-primary hover:text-primary/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="manageUserAccess(${user.id})" 
                                                class="text-warning hover:text-warning/80" title="Accès">
                                            <i class="fas fa-key"></i>
                                        </button>
                                        ${user.id !== window.app.currentUser.id ? `
                                        <button onclick="window.usersController.toggleUserStatus(${user.id})" 
                                                class="text-${user.status === 'Actif' ? 'danger' : 'success'} hover:opacity-80" 
                                                title="${user.status === 'Actif' ? 'Désactiver' : 'Activer'}">
                                            <i class="fas fa-${user.status === 'Actif' ? 'user-slash' : 'user-check'}"></i>
                                        </button>
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Filtrer les utilisateurs
    filterUsers() {
        const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const role = document.getElementById('roleFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';

        this.currentFilters = { search, role, status };

        // Mettre à jour le tableau
        document.getElementById('usersTableContainer').innerHTML = this.generateUsersTable();
        
        // Mettre à jour le compteur
        const userCount = document.getElementById('userCount');
        if (userCount) {
            userCount.textContent = `(${this.getFilteredUsers().length})`;
        }
    }

    // Obtenir les utilisateurs filtrés
    getFilteredUsers() {
        return window.app.users.filter(user => {
            const matchesSearch = !this.currentFilters.search || 
                user.name.toLowerCase().includes(this.currentFilters.search) ||
                user.email.toLowerCase().includes(this.currentFilters.search);
            
            const matchesRole = !this.currentFilters.role || user.profile === this.currentFilters.role;
            const matchesStatus = !this.currentFilters.status || user.status === this.currentFilters.status;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }

    // Réinitialiser les filtres
    resetFilters() {
        document.getElementById('userSearch').value = '';
        document.getElementById('roleFilter').value = '';
        document.getElementById('statusFilter').value = '';
        this.currentFilters = { search: '', role: '', status: '' };
        this.filterUsers();
    }

    // Afficher le modal de création d'utilisateur
    showNewUserModal() {
        const modalContent = `
            <form id="newUserForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet*</label>
                        <input type="text" id="newUserName" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email*</label>
                        <input type="email" id="newUserEmail" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                        <input type="tel" id="newUserPhone"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle*</label>
                        <select id="newUserRole" required onchange="window.usersController.updateCompanyOptions()"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base">
                            <option value="">Sélectionner un rôle</option>
                            <option value="admin">Administrateur (Niveau 5)</option>
                            <option value="collaborateur_senior">Collaborateur Senior (Niveau 4)</option>
                            <option value="collaborateur">Collaborateur (Niveau 3)</option>
                            <option value="user">Utilisateur (Niveau 2)</option>
                            <option value="caissier">Caissier (Niveau 1)</option>
                        </select>
                    </div>
                </div>

                <div id="companySelectionSection" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entreprises assignées</label>
                    <div id="companiesCheckboxes" class="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                        ${window.app.companies.map(company => `
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" name="companies" value="${company.id}"
                                       class="rounded border-gray-300 text-primary focus:ring-primary">
                                <span class="text-sm text-gray-700 dark:text-gray-300">${company.name}</span>
                                <span class="text-xs text-gray-500">(${company.type})</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe temporaire*</label>
                    <div class="relative">
                        <input type="password" id="newUserPassword" required
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white text-base pr-10">
                        <button type="button" onclick="window.usersController.generatePassword()" 
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <i class="fas fa-random"></i>
                        </button>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">L'utilisateur devra changer ce mot de passe à la première connexion</div>
                </div>

                <div class="flex items-center">
                    <input type="checkbox" id="sendWelcomeEmail" checked class="rounded border-gray-300 dark:border-gray-600">
                    <label for="sendWelcomeEmail" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Envoyer un email de bienvenue avec les identifiants
                    </label>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button type="button" onclick="window.unifiedManager.modalManager.hide()"
                            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Annuler
                    </button>
                    <button type="submit"
                            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-user-plus mr-2"></i>Créer l'utilisateur
                    </button>
                </div>
            </form>
        `;

        window.unifiedManager.modalManager.show('Nouveau Collaborateur', modalContent, { size: 'large' });

        // Attacher l'événement de soumission
        setTimeout(() => {
            document.getElementById('newUserForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUser();
            });
        }, 100);
    }

    // Créer un nouvel utilisateur
    createUser() {
        const name = document.getElementById('newUserName').value.trim();
        const email = document.getElementById('newUserEmail').value.trim();
        const phone = document.getElementById('newUserPhone').value.trim();
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;
        const selectedCompanies = Array.from(document.querySelectorAll('input[name="companies"]:checked'))
            .map(input => parseInt(input.value));

        // Validation
        if (!name || !email || !role || !password) {
            window.unifiedManager.notificationManager.show('error', 'Erreur', 'Tous les champs obligatoires doivent être remplis');
            return;
        }

        // Vérifier l'email unique
        if (window.app.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            window.unifiedManager.notificationManager.show('error', 'Erreur', 'Cet email est déjà utilisé');
            return;
        }

        // Créer l'utilisateur
        const newId = Math.max(...window.app.users.map(u => u.id), 0) + 1;
        const roleInfo = this.getRoleInfo(role);

        const newUser = {
            id: newId,
            name: name,
            email: email,
            phone: phone,
            passwordHash: window.unifiedManager.authController.hashPassword(password),
            profile: role,
            role: roleInfo.name,
            status: 'Actif',
            assignedCompanies: selectedCompanies,
            companies: selectedCompanies,
            permissions: roleInfo.permissions,
            requirePasswordChange: true,
            createdAt: new Date().toISOString(),
            createdBy: window.app.currentUser.id
        };

        // Si c'est un utilisateur ou caissier, assigner une seule entreprise
        if ((role === 'user' || role === 'caissier') && selectedCompanies.length > 0) {
            newUser.companyId = selectedCompanies[0];
        }

        window.app.users.push(newUser);

        // Log de sécurité
        window.unifiedManager.security.logSecurityEvent('user_created', {
            newUserId: newId,
            newUserEmail: email,
            role: role,
            createdBy: window.app.currentUser.id
        });

        window.unifiedManager.modalManager.hide();
        window.unifiedManager.notificationManager.show('success', 'Utilisateur créé', `${name} a été créé avec succès`);

        // Recharger la page
        this.loadUsersPage();
    }

    // Méthodes utilitaires
    getRoleColor(profile) {
        const colors = {
            'admin': 'bg-danger',
            'collaborateur_senior': 'bg-primary',
            'collaborateur': 'bg-info',
            'user': 'bg-success',
            'caissier': 'bg-warning'
        };
        return colors[profile] || 'bg-gray-500';
    }

    getRoleBadgeColor(profile) {
        const colors = {
            'admin': 'bg-danger/20 text-danger',
            'collaborateur_senior': 'bg-primary/20 text-primary',
            'collaborateur': 'bg-info/20 text-info',
            'user': 'bg-success/20 text-success',
            'caissier': 'bg-warning/20 text-warning'
        };
        return colors[profile] || 'bg-gray-500/20 text-gray-500';
    }

    getRoleIcon(profile) {
        const icons = {
            'admin': '<i class="fas fa-crown mr-1"></i>',
            'collaborateur_senior': '<i class="fas fa-star mr-1"></i>',
            'collaborateur': '<i class="fas fa-users mr-1"></i>',
            'user': '<i class="fas fa-user mr-1"></i>',
            'caissier': '<i class="fas fa-cash-register mr-1"></i>'
        };
        return icons[profile] || '<i class="fas fa-user mr-1"></i>';
    }

    getStatusColor(status) {
        const colors = {
            'Actif': 'bg-success/20 text-success',
            'Inactif': 'bg-gray-500/20 text-gray-500',
            'Suspendu': 'bg-danger/20 text-danger'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-500';
    }

    getUserCompanies(user) {
        if (user.profile === 'admin') {
            return window.app.companies;
        }
        if (user.profile === 'user' || user.profile === 'caissier') {
            return window.app.companies.filter(c => c.id === user.companyId);
        }
        return window.app.companies.filter(c => user.assignedCompanies && user.assignedCompanies.includes(c.id));
    }

    // Autres méthodes de gestion...
    viewUser(userId) {
        const user = window.app.users.find(u => u.id === userId);
        if (!user) return;

        // Implémenter la vue détaillée de l'utilisateur
        window.unifiedManager.notificationManager.show('info', 'Vue utilisateur', `Affichage des détails de ${user.name}`);
    }

    toggleUserStatus(userId) {
        const user = window.app.users.find(u => u.id === userId);
        if (!user) return;

        const newStatus = user.status === 'Actif' ? 'Inactif' : 'Actif';
        user.status = newStatus;

        window.unifiedManager.notificationManager.show('success', 'Statut modifié', `${user.name} est maintenant ${newStatus}`);
        this.loadUsersPage();
    }

    showAccessDenied() {
        window.unifiedManager.notificationManager.show('error', 'Accès refusé', 'Seuls les administrateurs peuvent accéder à cette page');
    }
}

// Export de la classe
window.UsersController = UsersController;

console.log('📦 Module UsersController chargé');
