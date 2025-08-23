// =============================================================================
// DOUKÈ Compta Pro - Composants d'Interface
// components.js - Composants réutilisables et fonctions d'interface
// =============================================================================

class UIComponents {
    // =============================================================================
    // MODAL DE CRÉATION D'UTILISATEUR
    // =============================================================================

    static showNewUserModal() {
        const content = `
        <form id="newUserForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-user mr-2"></i>Nom complet *
                    </label>
                    <input type="text" id="userName" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-envelope mr-2"></i>Email *
                    </label>
                    <input type="email" id="userEmail" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-phone mr-2"></i>Téléphone
                    </label>
                    <input type="tel" id="userPhone" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-shield-alt mr-2"></i>Profil *
                    </label>
                    <select id="userProfile" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">-- Sélectionner un profil --</option>
                        ${Object.entries(DOUKE_CONFIG.ROLES).map(([key, role]) => 
                            `<option value="${key.toLowerCase()}">${role.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-lock mr-2"></i>Mot de passe *
                    </label>
                    <input type="password" id="userPassword" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-toggle-on mr-2"></i>Statut
                    </label>
                    <select id="userStatus" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                    </select>
                </div>
            </div>
            
            <div id="companyAssignment" class="hidden">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <i class="fas fa-building mr-2"></i>Entreprises assignées
                </label>
                <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    ${window.app.companies.map(company => `
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" name="assignedCompanies" value="${company.id}" 
                            class="rounded border-gray-300 text-primary focus:ring-primary">
                        <span class="text-sm">${company.name}</span>
                    </label>
                    `).join('')}
                </div>
            </div>
        </form>
        `;

        const actions = `
            <button onclick="window.unifiedManager.modalManager.hide()" 
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Annuler
            </button>
            <button onclick="UIComponents.saveNewUser()" 
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                <i class="fas fa-save mr-2"></i>Créer l'utilisateur
            </button>
        `;

        window.unifiedManager.modalManager.show('Nouvel Utilisateur', content, { actions });

        // Gestion dynamique du profil
        document.getElementById('userProfile').addEventListener('change', function(e) {
            const companyDiv = document.getElementById('companyAssignment');
            if (['collaborateur_senior', 'collaborateur'].includes(e.target.value)) {
                companyDiv.classList.remove('hidden');
            } else {
                companyDiv.classList.add('hidden');
            }
        });
    }

    static saveNewUser() {
        const form = document.getElementById('newUserForm');
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('userName'),
            email: formData.get('userEmail'),
            phone: formData.get('userPhone'),
            profile: formData.get('userProfile'),
            password: formData.get('userPassword'),
            status: formData.get('userStatus') || 'Actif',
            assignedCompanies: Array.from(document.querySelectorAll('input[name="assignedCompanies"]:checked')).map(cb => parseInt(cb.value))
        };

        const validation = window.validationService.validateUser(userData);
        if (!validation.isValid) {
            window.unifiedManager.notificationManager.show('error', 'Erreur de validation', validation.errors.join(', '));
            return;
        }

        // Générer ID et hasher mot de passe
        userData.id = Math.max(...window.app.users.map(u => u.id)) + 1;
        userData.passwordHash = window.unifiedManager.hashPassword(userData.password);
        userData.createdAt = new Date().toISOString();
        delete userData.password;

        // Ajouter à la liste
        window.app.users.push(userData);
        
        window.unifiedManager.modalManager.hide();
        window.unifiedManager.notificationManager.show('success', 'Utilisateur créé', `${userData.name} a été créé avec succès`);
        
        // Recharger la page si on est sur la gestion des utilisateurs
        if (document.getElementById('mainContent').innerHTML.includes('Gestion des Utilisateurs')) {
            window.unifiedManager.loadUsersPage();
        }
    }

    // =============================================================================
    // MODAL DE CRÉATION D'ENTREPRISE
    // =============================================================================

    static showNewCompanyModal() {
        const content = `
        <form id="newCompanyForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-building mr-2"></i>Nom de l'entreprise *
                    </label>
                    <input type="text" id="companyName" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-certificate mr-2"></i>Type de société *
                    </label>
                    <select id="companyType" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">-- Sélectionner --</option>
                        ${Object.entries(DOUKE_CONFIG.COMPANY_TYPES).map(([key, name]) => 
                            `<option value="${key}">${key} - ${name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-envelope mr-2"></i>Email
                    </label>
                    <input type="email" id="companyEmail" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-phone mr-2"></i>Téléphone
                    </label>
                    <input type="tel" id="companyPhone" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-map-marker-alt mr-2"></i>Adresse
                    </label>
                    <input type="text" id="companyAddress" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-id-card mr-2"></i>RCCM
                    </label>
                    <input type="text" id="companyRccm" placeholder="CI-ABJ-2024-B-12345"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-hashtag mr-2"></i>NIF
                    </label>
                    <input type="text" id="companyNif" placeholder="0123456789"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-industry mr-2"></i>Secteur d'activité
                    </label>
                    <select id="companySector" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">-- Sélectionner --</option>
                        ${DOUKE_CONFIG.SECTORS.map(sector => 
                            `<option value="${sector}">${sector}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-toggle-on mr-2"></i>Statut
                    </label>
                    <select id="companyStatus" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="Actif">Actif</option>
                        <option value="Période d'essai">Période d'essai</option>
                        <option value="Suspendu">Suspendu</option>
                    </select>
                </div>
            </div>
        </form>
        `;

        const actions = `
            <button onclick="window.unifiedManager.modalManager.hide()" 
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Annuler
            </button>
            <button onclick="UIComponents.saveNewCompany()" 
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                <i class="fas fa-save mr-2"></i>Créer l'entreprise
            </button>
        `;

        window.unifiedManager.modalManager.show('Nouvelle Entreprise', content, { actions });
    }

    static saveNewCompany() {
        const formData = {
            name: document.getElementById('companyName').value,
            type: document.getElementById('companyType').value,
            email: document.getElementById('companyEmail').value,
            phone: document.getElementById('companyPhone').value,
            address: document.getElementById('companyAddress').value,
            rccm: document.getElementById('companyRccm').value,
            nif: document.getElementById('companyNif').value,
            sector: document.getElementById('companySector').value,
            status: document.getElementById('companyStatus').value
        };

        const validation = window.validationService.validateCompany(formData);
        if (!validation.isValid) {
            window.unifiedManager.notificationManager.show('error', 'Erreur de validation', validation.errors.join(', '));
            return;
        }

        // Compléter les données
        formData.id = Math.max(...window.app.companies.map(c => c.id)) + 1;
        formData.system = 'Normal';
        formData.cashRegisters = 0;
        formData.currency = 'FCFA';
        formData.exerciceStart = '2024-01-01';
        formData.exerciceEnd = '2024-12-31';
        formData.createdAt = new Date().toISOString();
        formData.createdBy = window.app.currentUser.id;

        window.app.companies.push(formData);
        
        window.unifiedManager.modalManager.hide();
        window.unifiedManager.notificationManager.show('success', 'Entreprise créée', `${formData.name} a été créée avec succès`);
        
        // Recharger la page si nécessaire
        if (document.getElementById('mainContent').innerHTML.includes('Gestion des Entreprises')) {
            window.unifiedManager.loadCompaniesPage();
        }
    }

    // =============================================================================
    // MODAL DE CRÉATION D'ÉCRITURE
    // =============================================================================

    static showNewEntryModal() {
        const content = `
        <form id="newEntryForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-calendar mr-2"></i>Date *
                    </label>
                    <input type="date" id="entryDate" required value="${new Date().toISOString().split('T')[0]}"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-book mr-2"></i>Journal *
                    </label>
                    <select id="entryJournal" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">-- Sélectionner --</option>
                        ${Object.entries(DOUKE_CONFIG.SYSCOHADA.journaux).map(([code, name]) => 
                            `<option value="${code}">${code} - ${name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i class="fas fa-hashtag mr-2"></i>N° Pièce *
                    </label>
                    <input type="text" id="entryPiece" required 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <i class="fas fa-file-alt mr-2"></i>Libellé *
                </label>
                <input type="text" id="entryLibelle" required 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
            </div>
            
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white">Lignes d'écriture</h4>
                    <button type="button" onclick="UIComponents.addEntryLine()" 
                        class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                        <i class="fas fa-plus mr-1"></i>Ajouter ligne
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full border border-gray-300 dark:border-gray-600">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compte</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Libellé</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Débit</th>
                                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédit</th>
                                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody id="entryLines">
                            <!-- Les lignes seront ajoutées dynamiquement -->
                        </tbody>
                        <tfoot class="bg-gray-50 dark:bg-gray-700">
                            <tr class="font-medium">
                                <td colspan="2" class="px-3 py-2 text-right">TOTAUX:</td>
                                <td class="px-3 py-2 text-right" id="totalDebit">0 FCFA</td>
                                <td class="px-3 py-2 text-right" id="totalCredit">0 FCFA</td>
                                <td class="px-3 py-2 text-center" id="balanceStatus">
                                    <span class="text-red-500"><i class="fas fa-times"></i></span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </form>
        `;

        const actions = `
            <button onclick="window.unifiedManager.modalManager.hide()" 
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Annuler
            </button>
            <button onclick="UIComponents.saveNewEntry()" 
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                <i class="fas fa-save mr-2"></i>Enregistrer l'écriture
            </button>
        `;

        window.unifiedManager.modalManager.show('Nouvelle Écriture Comptable', content, { actions });
        
        // Ajouter deux lignes par défaut
        UIComponents.addEntryLine();
        UIComponents.addEntryLine();
    }

    static addEntryLine() {
        const tbody = document.getElementById('entryLines');
        const lineCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-3 py-2">
                <select name="account" required 
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    onchange="UIComponents.updateAccountName(this)">
                    <option value="">-- Sélectionner --</option>
                    ${window.app.accounts.map(account => 
                        `<option value="${account.code}" data-name="${account.name}">${account.code} - ${account.name}</option>`
                    ).join('')}
                </select>
            </td>
            <td class="px-3 py-2">
                <input type="text" name="libelle" required 
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            </td>
            <td class="px-3 py-2">
                <input type="number" name="debit" min="0" step="1" value="0"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                    onchange="UIComponents.updateTotals()" oninput="UIComponents.clearOpposite(this, 'credit')">
            </td>
            <td class="px-3 py-2">
                <input type="number" name="credit" min="0" step="1" value="0"
                    class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                    onchange="UIComponents.updateTotals()" oninput="UIComponents.clearOpposite(this, 'debit')">
            </td>
            <td class="px-3 py-2 text-center">
                <button type="button" onclick="UIComponents.removeEntryLine(this)" 
                    class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    }

    static removeEntryLine(button) {
        if (document.getElementById('entryLines').children.length > 2) {
            button.closest('tr').remove();
            UIComponents.updateTotals();
        } else {
            window.unifiedManager.notificationManager.show('warning', 'Attention', 'Une écriture doit avoir au moins 2 lignes');
        }
    }

    static updateAccountName(select) {
        const selectedOption = select.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.name) {
            const libelle = select.closest('tr').querySelector('input[name="libelle"]');
            if (!libelle.value) {
                libelle.value = selectedOption.dataset.name;
            }
        }
    }

    static clearOpposite(input, oppositeField) {
        if (parseFloat(input.value) > 0) {
            const oppositeInput = input.closest('tr').querySelector(`input[name="${oppositeField}"]`);
            oppositeInput.value = 0;
        }
        UIComponents.updateTotals();
    }

    static updateTotals() {
        const debitInputs = document.querySelectorAll('input[name="debit"]');
        const creditInputs = document.querySelectorAll('input[name="credit"]');
        
        let totalDebit = 0;
        let totalCredit = 0;
        
        debitInputs.forEach(input => totalDebit += parseFloat(input.value) || 0);
        creditInputs.forEach(input => totalCredit += parseFloat(input.value) || 0);
        
        document.getElementById('totalDebit').textContent = window.formatService.formatCurrency(totalDebit);
        document.getElementById('totalCredit').textContent = window.formatService.formatCurrency(totalCredit);
        
        const balanceStatus = document.getElementById('balanceStatus');
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
        
        if (isBalanced && totalDebit > 0) {
            balanceStatus.innerHTML = '<span class="text-green-500"><i class="fas fa-check"></i></span>';
        } else {
            balanceStatus.innerHTML = '<span class="text-red-500"><i class="fas fa-times"></i></span>';
        }
    }

    static saveNewEntry() {
        const form = document.getElementById('newEntryForm');
        const formData = new FormData(form);
        
        // Collecter les lignes
        const lines = [];
        const rows = document.getElementById('entryLines').children;
        
        for (let row of rows) {
            const account = row.querySelector('select[name="account"]').value;
            const libelle = row.querySelector('input[name="libelle"]').value;
            const debit = parseFloat(row.querySelector('input[name="debit"]').value) || 0;
            const credit = parseFloat(row.querySelector('input[name="credit"]').value) || 0;
            
            if (account && libelle && (debit > 0 || credit > 0)) {
                const accountData = window.app.accounts.find(a => a.code === account);
                lines.push({
                    account: account,
                    accountName: accountData ? accountData.name : '',
                    libelle: libelle,
                    debit: debit,
                    credit: credit
                });
            }
        }
        
        const entryData = {
            date: document.getElementById('entryDate').value,
            journal: document.getElementById('entryJournal').value,
            piece: document.getElementById('entryPiece').value,
            libelle: document.getElementById('entryLibelle').value,
            lines: lines,
            companyId: window.app.currentCompanyId
        };
        
        const validation = window.validationService.validateEntry(entryData);
        if (!validation.isValid) {
            window.unifiedManager.notificationManager.show('error', 'Erreur de validation', validation.errors.join(', '));
            return;
        }
        
        // Compléter les données
        entryData.id = Math.max(...window.app.entries.map(e => e.id)) + 1;
        entryData.status = 'En attente';
        entryData.userId = window.app.currentUser.id;
        entryData.createdAt = new Date().toISOString();
        
        window.app.entries.push(entryData);
        
        window.unifiedManager.modalManager.hide();
        window.unifiedManager.notificationManager.show('success', 'Écriture créée', 'L\'écriture a été enregistrée avec succès');
        
        // Recharger la page si nécessaire
        if (document.getElementById('mainContent').innerHTML.includes('Gestion des Écritures')) {
            window.unifiedManager.loadEntriesPage();
        }
    }

    // =============================================================================
    // FONCTIONS UTILITAIRES D'INTERFACE
    // =============================================================================

    static formatTableData(data, columns, actions = []) {
        if (!data || data.length === 0) {
            return '<tr><td colspan="' + (columns.length + (actions.length > 0 ? 1 : 0)) + '" class="px-6 py-4 text-center text-gray-500">Aucune donnée disponible</td></tr>';
        }

        return data.map(item => {
            const cells = columns.map(col => {
                let value = item[col.field];
                
                if (col.format) {
                    switch (col.format) {
                        case 'currency':
                            value = window.formatService.formatCurrency(value);
                            break;
                        case 'date':
                            value = window.formatService.formatDate(value);
                            break;
                        case 'datetime':
                            value = window.formatService.formatDateTime(value);
                            break;
                    }
                }
                
                return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${col.align || ''}">${value || '-'}</td>`;
            }).join('');
            
            const actionButtons = actions.length > 0 ? `
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex space-x-2 justify-end">
                        ${actions.map(action => `
                        <button onclick="${action.handler}(${item.id})" 
                            class="text-${action.color || 'blue'}-600 hover:text-${action.color || 'blue'}-900" 
                            title="${action.title}">
                            <i class="${action.icon}"></i>
                        </button>
                        `).join('')}
                    </div>
                </td>
            ` : '';
            
            return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">${cells}${actionButtons}</tr>`;
        }).join('');
    }

    static createPagination(totalItems, currentPage, pageSize) {
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) return '';
        
        let pagination = '<div class="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">';
        
        pagination += `<div class="text-sm text-gray-700 dark:text-gray-300">
            Affichage de ${(currentPage - 1) * pageSize + 1} à ${Math.min(currentPage * pageSize, totalItems)} sur ${totalItems} résultats
        </div>`;
        
        pagination += '<div class="flex space-x-2">';
        
        // Bouton précédent
        if (currentPage > 1) {
            pagination += `<button onclick="UIComponents.changePage(${currentPage - 1})" 
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                Précédent
            </button>`;
        }
        
        // Numéros de pages
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const isActive = i === currentPage;
            pagination += `<button onclick="UIComponents.changePage(${i})" 
                class="px-3 py-1 text-sm ${isActive ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'} rounded hover:bg-primary/80">
                ${i}
            </button>`;
        }
        
        // Bouton suivant
        if (currentPage < totalPages) {
            pagination += `<button onclick="UIComponents.changePage(${currentPage + 1})" 
                class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                Suivant
            </button>`;
        }
        
        pagination += '</div></div>';
        return pagination;
    }

    static changePage(page) {
        // Cette fonction sera implémentée selon le contexte de la page
        console.log('Changement de page:', page);
    }
}

// Exposer globalement
window.UIComponents = UIComponents;

// Fonctions globales pour les onclick (votre logique préservée)
window.showNewUserModal = () => UIComponents.showNewUserModal();
window.showNewCompanyModal = () => UIComponents.showNewCompanyModal();
window.showNewEntryModal = () => UIComponents.showNewEntryModal();

console.log('✅ Composants d\'interface chargés');
