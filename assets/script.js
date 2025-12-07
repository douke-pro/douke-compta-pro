/**
 * Fichier de Script Principal - Doukè Compta Pro Dashboard
 * Version Consolidée et Finale: Intégration de l'architecture robuste, de la gestion
 * des contextes multi-entreprises et des vues métier conformes SYSCOHADA.
 *
 * NOTE: Amélioration UX dans renderCompanySpecificDashboard ajoutée.
 */

// =================================================================================
// 1. CONFIGURATION ET VARIABLES GLOBALES
// =================================================================================

const API_BASE_URL = 'http://api.douke-compta.mock'; // URL de base API (mockée)
window.userContext = null;

// Rôles et leurs permissions
const ROLES = {
    ADMIN: 'ADMIN', // Administrateur Système (accès à toutes les entreprises, gestion globale)
    COLLABORATEUR: 'COLLABORATEUR', // Peut travailler sur plusieurs entreprises assignées (ou toutes si c'est un cabinet)
    USER: 'USER', // Utilisateur classique (souvent mono-entreprise)
    CAISSIER: 'CAISSIER', // Rôle très limité, focalisé sur la Saisie des Flux
};

// =================================================================================
// 2. FONCTIONS DE CONTEXTE ET D'AUTHENTIFICATION (MOCKÉES)
// =================================================================================

/**
 * Simule la connexion utilisateur et retourne un contexte.
 * @param {string} email - L'email de l'utilisateur (utilisé comme rôle de test).
 * @returns {object|null} - Le contexte utilisateur mocké.
 */
async function authenticateUser(email) {
    // MOCK: Simule le délai API
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const userMap = {
        'admin@app.com': {
            utilisateurId: 'ADM_001',
            utilisateurNom: 'Jean Dupont (Admin)',
            utilisateurRole: ROLES.ADMIN,
            token: 'jwt.admin.token',
            // L'ADMIN démarre SANS contexte entreprise (Contexte Global)
            entrepriseContextId: null, 
            entrepriseContextName: '-- Global --', 
            multiEntreprise: true,
        },
        'collaborateur@app.com': {
            utilisateurId: 'COL_002',
            utilisateurNom: 'Marie Leroy (Collab)',
            utilisateurRole: ROLES.COLLABORATEUR,
            token: 'jwt.collab.token',
            entrepriseContextId: null, 
            entrepriseContextName: '-- Global --', 
            multiEntreprise: true,
        },
        'user@app.com': {
            utilisateurId: 'USR_003',
            utilisateurNom: 'Koffi Adama (User)',
            utilisateurRole: ROLES.USER,
            token: 'jwt.user.token',
            entrepriseContextId: 'ENT_2', // Mono-entreprise, contexte immédiat
            entrepriseContextName: 'MonEntrepriseSarl', 
            multiEntreprise: false,
        },
        'caissier@app.com': {
            utilisateurId: 'CAI_004',
            utilisateurNom: 'Fatou Diallo (Caissier)',
            utilisateurRole: ROLES.CAISSIER,
            token: 'jwt.caissier.token',
            entrepriseContextId: 'ENT_3', // Mono-entreprise / Caisse, contexte immédiat
            entrepriseContextName: 'CaisseTest', 
            multiEntreprise: false,
        },
    };
    
    // MOCK: Permet la saisie manuelle en utilisant les clés comme identifiants
    return userMap[email.toLowerCase()] || null; 
}

/**
 * Simule la récupération des entreprises accessibles à l'utilisateur.
 * @param {object} context - Le contexte utilisateur.
 * @returns {Array} - Liste mockée des entreprises avec leurs stats.
 */
async function fetchUserCompanies(context) {
    // MOCK: Simule le délai API
    await new Promise(resolve => setTimeout(resolve, 300));

    const allCompanies = [
        { id: 'ENT_1', name: 'Doukè Holdings', stats: { transactions: 150, result: 3500000, pending: 1, cash: 2500000 } },
        { id: 'ENT_2', name: 'MonEntrepriseSarl', stats: { transactions: 50, result: 1200000, pending: 2, cash: 800000 } },
        { id: 'ENT_3', name: 'CaisseTest', stats: { transactions: 20, result: 50000, pending: 0, cash: 100000 } },
        { id: 'ENT_4', name: 'Service Bâtiment', stats: { transactions: 10, result: 100000, pending: 0, cash: 50000 } },
    ];
    
    // ADMIN/COLLABORATEUR voient toutes les entreprises mockées
    if (context.multiEntreprise) {
        return allCompanies;
    }
    
    // Mono-entreprise (USER ou CAISSIER), retourne juste l'entreprise en cours
    return allCompanies.filter(comp => comp.id === context.entrepriseContextId);
}

/**
 * Simule les statistiques globales pour l'administrateur système.
 * @returns {object} - Statistiques globales mockées.
 */
async function fetchGlobalAdminStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        totalCompanies: 4,
        activeCompanies: 3,
        collaborators: 6,
        totalFiles: 120, 
        pendingRequests: 5, // Demandes d'entreprises à valider
        pendingValidations: 8, // Dernières validations à effectuer
    };
}

/**
 * Change l'entreprise contextuelle pour un utilisateur multi-entreprise.
 * Cette fonction est CLÉ pour la séparation des données.
 * @param {string|null} newId - ID de la nouvelle entreprise (null pour revenir au Global).
 * @param {string} newName - Nom de la nouvelle entreprise.
 */
async function changeCompanyContext(newId, newName) {
    if (window.userContext.multiEntreprise) {
        window.userContext.entrepriseContextId = newId;
        window.userContext.entrepriseContextName = newName;
        // On met à jour le header et la navigation immédiatement
        updateHeaderContext(window.userContext);
        updateNavigationMenu(window.userContext.utilisateurRole);
    }
}

// =================================================================================
// 3. GESTION DE LA VUE ET DU CONTEXTE UTILISATEUR
// =================================================================================

/**
 * Initialise l'interface utilisateur après une connexion réussie.
 * @param {object} context - Le contexte utilisateur.
 */
function initDashboard(context) {
    window.userContext = context;
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden'); 
    document.getElementById('register-modal').classList.add('hidden');

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);

    // Charge la vue par défaut (Dashboard)
    loadView('dashboard');
}

/**
 * Met à jour le header avec les informations contextuelles de l'utilisateur.
 */
function updateHeaderContext(context) {
    document.getElementById('welcome-message').textContent = `Bonjour, ${context.utilisateurNom.split(' ')[0]}`;
    document.getElementById('user-role-display').textContent = context.utilisateurRole;
    
    const contextCompanyNameElement = document.getElementById('context-company-name');
    contextCompanyNameElement.textContent = context.entrepriseContextName || '-- Global --';

    // Ajoute une classe pour souligner le contexte global si pas d'entreprise sélectionnée
    if (!context.entrepriseContextId) {
        contextCompanyNameElement.classList.add('text-warning');
        contextCompanyNameElement.classList.remove('text-primary');
    } else {
        contextCompanyNameElement.classList.add('text-primary');
        contextCompanyNameElement.classList.remove('text-warning');
    }
}

/**
 * Construit le menu de navigation en fonction du rôle et du contexte (CLÉ pour Séparation).
 * @param {string} role - Le rôle de l'utilisateur.
 */
function updateNavigationMenu(role) {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = ''; 

    let baseItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' },
    ];
    
    // L'ADMIN et le COLLABORATEUR peuvent créer une entreprise quel que soit leur contexte
    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
         baseItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' }); 
    }
    
    // Les fonctions de comptabilité et de gestion n'apparaissent que si une entreprise est sélectionnée
    if (window.userContext.entrepriseContextId) {
        
        // Saisie des Flux (Caissier, User, Collab, Admin)
        baseItems.push({ name: 'Saisie des Flux (Simple)', icon: 'fas fa-cash-register', view: 'saisie' });
        
        if (role !== ROLES.CAISSIER) {
            // Saisie Comptable (Admin, Collab, User)
            baseItems.push({ name: 'Saisie d\'Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
            // Validation et Rapports (Admin, Collab, User)
            baseItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
            baseItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
        }
    }

    // Gestion des Utilisateurs (Admin Global uniquement)
    if (role === ROLES.ADMIN) {
        baseItems.push({ name: 'Gestion des Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
        baseItems.push({ name: 'Paramètres du Système', icon: 'fas fa-cogs', view: 'settings' });
    }
    
    // Création des liens
    baseItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-link block p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200';
        link.dataset.view = item.view;
        link.innerHTML = `<i class="${item.icon} mr-3"></i>${item.name}`;
        link.onclick = (e) => {
            e.preventDefault();
            loadView(item.view);
        };
        navMenu.appendChild(link);
    });
}

/**
 * Fonction de routage simple basée sur le nom de la vue (Robuste).
 * @param {string} viewName - La vue à charger.
 */
async function loadView(viewName) {
    const dashboardContentArea = document.getElementById('dashboard-content');
    dashboardContentArea.innerHTML = '<div class="text-center p-8 text-lg text-info dark:text-primary"><i class="fas fa-spinner fa-spin mr-2"></i> Chargement...</div>';

    // Mettre à jour la navigation pour garantir que les liens sont corrects
    updateNavigationMenu(window.userContext.utilisateurRole);
    
    // Mise en évidence du lien actif
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-primary', 'text-white', 'font-bold', 'dark:bg-primary');
        if (link.dataset.view === viewName) {
            link.classList.add('bg-primary', 'text-white', 'font-bold', 'dark:bg-primary');
        } else {
            link.classList.add('text-gray-700', 'dark:text-gray-300');
        }
    });

    // **GUARDRAIL CRITIQUE :** Vérification du contexte pour les vues métier
    const requiresCompanyContext = ['saisie', 'journal-entry', 'validation', 'reports'];
    const currentRole = window.userContext.utilisateurRole;

    if (requiresCompanyContext.includes(viewName) && !window.userContext.entrepriseContextId) {
        // Cette alerte est déclenchée si ADMIN/COLLABORATEUR essaient d'accéder sans contexte
        dashboardContentArea.innerHTML = renderNoContextWarning();
        return;
    }
    
    // Logique de rendu des vues
    switch (viewName) {
        case 'dashboard':
            dashboardContentArea.innerHTML = await renderDashboard(window.userContext);
            break;
            
        case 'saisie': 
            dashboardContentArea.innerHTML = renderSaisieFormCaissier(window.userContext.entrepriseContextName);
            break;
            
        case 'journal-entry': 
            dashboardContentArea.innerHTML = renderJournalEntryForm(window.userContext.entrepriseContextName); 
            break;
            
        case 'validation':
            dashboardContentArea.innerHTML = generateValidationTable(window.userContext.entrepriseContextName);
            break;
            
        case 'reports':
            dashboardContentArea.innerHTML = renderReportsView(window.userContext.entrepriseContextName);
            break;
        
        case 'create-company':
            if (currentRole === ROLES.ADMIN || currentRole === ROLES.COLLABORATEUR) {
                dashboardContentArea.innerHTML = renderCreateCompanyForm(); 
            } else {
                 dashboardContentArea.innerHTML = renderAccessDenied();
            }
            break;
            
        case 'user-management':
            if (currentRole === ROLES.ADMIN) {
                dashboardContentArea.innerHTML = renderUserManagementView(); 
            } else {
                 dashboardContentArea.innerHTML = renderAccessDenied();
            }
            break;
            
        default:
            dashboardContentArea.innerHTML = renderNotFound();
    }
}

// =================================================================================
// 4. RENDUS DES DASHBOARDS SPÉCIFIQUES (Base sur le Rôle)
// =================================================================================

/**
 * Fonction principale de rendu du dashboard basée sur le rôle.
 */
async function renderDashboard(context) {
    // ADMIN GLOBAL (Pas de contexte entreprise sélectionné)
    if (context.utilisateurRole === ROLES.ADMIN && !context.entrepriseContextId) {
        return renderAdminGlobalDashboard(context);
    }
    // COLLABORATEUR GLOBAL (Pas de contexte entreprise sélectionné)
    if (context.utilisateurRole === ROLES.COLLABORATEUR && !context.entrepriseContextId) {
         return renderCollaborateurGlobalDashboard(context);
    }
    
    // Rendu Contextuel (pour ADMIN/COLLABORATEUR si entreprise sélectionnée OU pour USER/CAISSIER par défaut)
    return renderCompanySpecificDashboard(context);
}

/**
 * Rendu pour l'Admin en mode GLOBAL (Statistiques d'administrateur système).
 */
async function renderAdminGlobalDashboard(context) {
    const stats = await fetchGlobalAdminStats();
    const companies = await fetchUserCompanies(context);

    // Cartes des statistiques globales (Administrateur Système)
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            ${renderStatCard('fas fa-building', 'Total Entreprises', stats.totalCompanies, 'primary')}
            ${renderStatCard('fas fa-check-circle', 'Entreprises Actives', stats.activeCompanies, 'success')}
            ${renderStatCard('fas fa-users', 'Collaborateurs/Users', stats.collaborators, 'info')}
            ${renderStatCard('fas fa-envelope-open-text', 'Demandes en Cours (Entreprise)', stats.pendingRequests, 'warning')}
        </div>
    `;
    
    // Sélecteur d'entreprise pour basculer en mode comptable contextuel
    const companyOptions = companies.map(comp => 
        `<option value="${comp.id}" data-name="${comp.name}">${comp.name}</option>`
    ).join('');

    return `
        <h2 class="text-3xl font-extrabold text-warning mb-6">Tableau de Bord Administrateur Système (Global)</h2>
        <div class="space-y-6">
            ${statCards}

            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info">
                <h3 class="text-xl font-bold text-info mb-4">Sélectionnez une Entreprise pour Accéder aux Opérations Comptables</h3>
                <div class="flex items-center space-x-4">
                    <i class="fas fa-hand-pointer fa-2x text-primary"></i>
                    <select id="company-selector" onchange="handleContextSwitch(this)" class="mt-1 block w-96 pl-3 pr-10 py-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">-- Choisir une entreprise --</option>
                        ${companyOptions}
                    </select>
                </div>
            </div>
            
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderAdminValidationSummary(stats.pendingValidations)}
                ${renderActivityFeed()}
            </div>
        </div>
        <script>
            function handleContextSwitch(select) {
                const selectedOption = select.options[select.selectedIndex];
                const newId = selectedOption.value || null;
                const newName = selectedOption.dataset.name || '-- Global --';
                
                changeCompanyContext(newId, newName);
                loadView('dashboard');
            }
        </script>
    `;
}

/**
 * Rendu pour le Collaborateur en mode GLOBAL.
 */
async function renderCollaborateurGlobalDashboard(context) {
    const companies = await fetchUserCompanies(context);
    
    // Afficher le sélecteur d'entreprise 
    const companyOptions = companies.map(comp => 
        `<option value="${comp.id}" data-name="${comp.name}">${comp.name}</option>`
    ).join('');

    return `
        <h2 class="text-3xl font-extrabold text-warning mb-6">Tableau de Bord Collaborateur (Sélection Entreprise)</h2>
        <div class="space-y-6">
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info">
                <h3 class="text-xl font-bold text-info mb-4">Sélectionnez l'Entreprise sur laquelle vous souhaitez travailler</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4">Une fois l'entreprise sélectionnée, les options de saisie et de rapport comptable apparaitront dans le menu latéral.</p>
                <div class="flex items-center space-x-4">
                    <i class="fas fa-hand-pointer fa-2x text-primary"></i>
                    <select id="company-selector" onchange="handleContextSwitch(this)" class="mt-1 block w-96 pl-3 pr-10 py-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="">-- Choisir une entreprise --</option>
                        ${companyOptions}
                    </select>
                </div>
            </div>
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderActivityFeed()}
            </div>
        </div>
        <script>
            function handleContextSwitch(select) {
                const selectedOption = select.options[select.selectedIndex];
                const newId = selectedOption.value || null;
                const newName = selectedOption.dataset.name || '-- Global --';
                
                changeCompanyContext(newId, newName);
                loadView('dashboard');
            }
        </script>
    `;
}


/**
 * Rendu du Dashboard spécifique à l'entreprise (pour Admin/Collaborateur Contextuel et User/Caissier).
 */
async function renderCompanySpecificDashboard(context) {
    const userCompanies = await fetchUserCompanies(context) || []; 
    const currentRole = context.utilisateurRole;
    
    const currentCompany = userCompanies.find(c => c.id === context.entrepriseContextId);
    
    if (!currentCompany) {
         // Si l'ADMIN/COLLAB a basculé sur un ID invalide, on revient au global
         if (context.multiEntreprise) {
             await changeCompanyContext(null, '-- Global --');
             return await renderDashboard(window.userContext);
         }
         return renderNotFound(); 
    }
    
    const stats = currentCompany.stats;

    // Cartes de statistiques (avec valeurs de l'entreprise courante)
    const statCards = renderStatCards({
        transactions: stats.transactions || 0,
        result: (stats.result || 0).toLocaleString('fr-FR') + ' XOF',
        pendingOperations: stats.pending || 0,
        currentCash: (stats.cash || 0).toLocaleString('fr-FR') + ' XOF'
    });
    
    // Logique des boutons d'action rapide
    let actionButtons = '';
    
    if (currentRole === ROLES.CAISSIER) {
        actionButtons += renderActionButton('Saisie des Flux', 'fas fa-cash-register', 'saisie', 'secondary');
    } else { // ADMIN, COLLABORATEUR, USER
         actionButtons += renderActionButton('Saisie Écriture Journal', 'fas fa-table', 'journal-entry', 'primary');
         actionButtons += renderActionButton('Saisie des Flux Simples', 'fas fa-cash-register', 'saisie', 'secondary');
         actionButtons += renderActionButton('Validation des Opérations', 'fas fa-check-double', 'validation', 'warning');
         actionButtons += renderActionButton('Générer Rapports', 'fas fa-file-invoice-dollar', 'reports', 'info');
    }

    return `
        <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Comptable de ${context.entrepriseContextName}</h2>
        <div class="space-y-6">
            ${context.multiEntreprise ? `
                <div class="p-4 bg-warning bg-opacity-10 border-l-4 border-warning rounded-xl shadow-lg flex justify-between items-center">
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                        Vous travaillez actuellement dans le contexte de l'entreprise **${context.entrepriseContextName}**. 
                        <a href="#" onclick="changeCompanyContext(null, '-- Global --'); loadView('dashboard');" class="text-danger hover:underline font-bold ml-2"><i class="fas fa-undo"></i> Changer de contexte</a>
                    </p>
                </div>
            ` : ''}
            
            ${statCards}
            
            <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Actions Rapides</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${actionButtons}
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderActivityFeed()}
                ${renderAccountingReports()}
            </div>
        </div>
    `;
}

// =================================================================================
// 5. RENDUS DES VUES MÉTIERS (Conformes SYSCOHADA et robustes)
// =================================================================================

/**
 * Interface de saisie complète d'une Écriture Journal (Rôle Comptable/Admin).
 * **Conforme SYSCOHADA :** Débit/Crédit, Compte, Libellé.
 */
function renderJournalEntryForm(companyName) {
    return `
        <div class="max-w-6xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h3 class="text-2xl font-extrabold text-info mb-4">Saisie d'une Écriture Journal (Double-Entrée) pour ${companyName}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Respect du principe de la partie double : Total Débit = Total Crédit.</p>
            
            <form id="journal-entry-form" class="space-y-6">
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Journal <span class="text-danger">*</span></label>
                        <select class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option>Achat (AC)</option>
                            <option>Vente (VT)</option>
                            <option>Trésorerie (TR)</option>
                            <option>Opérations Diverses (OD)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date <span class="text-danger">*</span></label>
                        <input type="date" required value="${new Date().toISOString().substring(0, 10)}" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Référence Pièce</label>
                        <input type="text" placeholder="Facture N° 123" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                </div>
                
                <h4 class="text-xl font-semibold border-b dark:border-gray-700 pb-2 mb-4 text-primary">Lignes Comptables</h4>
                
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Compte SYSCOHADA</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Libellé</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Débit (XOF)</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crédit (XOF)</th>
                        </tr>
                    </thead>
                    <tbody id="accounting-lines" class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        ${renderAccountingLine('601', 'Achats de Marchandises', '20000', '')}
                        ${renderAccountingLine('4452', 'TVA récupérable', '3600', '')}
                        ${renderAccountingLine('401', 'Fournisseurs', '', '23600')}
                    </tbody>
                </table>
                
                <button type="button" onclick="addAccountingLine()" class="py-2 px-4 border border-dashed border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition duration-300">
                    <i class="fas fa-plus mr-2"></i> Ajouter une ligne
                </button>
                
                <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-end space-x-6">
                    <span class="text-lg font-bold text-gray-700 dark:text-gray-300">Total Débit: <span id="total-debit" class="text-success">23,600 XOF</span></span>
                    <span class="text-lg font-bold text-gray-700 dark:text-gray-300">Total Crédit: <span id="total-credit" class="text-success">23,600 XOF</span></span>
                    <span id="balance-check" class="text-lg font-bold text-success"><i class="fas fa-balance-scale mr-2"></i> ÉQUILIBRÉ</span>
                </div>
                
                <p id="saisie-message" class="mt-4 text-center text-sm hidden"></p>
                <button type="submit" class="w-full py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-save mr-2"></i> Enregistrer l'Écriture (Soumise à Validation)
                </button>
            </form>
        </div>
        
        <script>
            // Logique de simulation d'ajout et de calcul d'équilibre
            function renderAccountingLine(compte='', libelle='', debit='', credit='') {
                 return \`
                    <tr class="line-item">
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="text" value="\${compte}" placeholder="Ex: 601" class="w-20 border-b dark:bg-gray-800 dark:text-white" required>
                        </td>
                         <td class="px-3 py-2 whitespace-nowrap">
                            <input type="text" value="\${libelle}" placeholder="Libellé de l'opération" class="w-full border-b dark:bg-gray-800 dark:text-white" required>
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="number" step="0.01" value="\${debit}" oninput="updateTotals()" class="w-full debit-input border-b dark:bg-gray-800 dark:text-white text-right">
                        </td>
                        <td class="px-3 py-2 whitespace-nowrap">
                            <input type="number" step="0.01" value="\${credit}" oninput="updateTotals()" class="w-full credit-input border-b dark:bg-gray-800 dark:text-white text-right">
                        </td>
                    </tr>
                 \`;
            }
            
            function addAccountingLine() {
                document.getElementById('accounting-lines').insertAdjacentHTML('beforeend', renderAccountingLine());
            }
            
            function updateTotals() {
                let totalDebit = 0;
                let totalCredit = 0;
                
                document.querySelectorAll('.debit-input').forEach(input => {
                    totalDebit += parseFloat(input.value || 0);
                });
                
                document.querySelectorAll('.credit-input').forEach(input => {
                    totalCredit += parseFloat(input.value || 0);
                });
                
                const diff = Math.abs(totalDebit - totalCredit);
                
                document.getElementById('total-debit').textContent = totalDebit.toLocaleString('fr-FR') + ' XOF';
                document.getElementById('total-credit').textContent = totalCredit.toLocaleString('fr-FR') + ' XOF';
                
                const balanceCheck = document.getElementById('balance-check');
                balanceCheck.classList.remove('text-success', 'text-danger');
                
                if (diff === 0) {
                    balanceCheck.innerHTML = '<i class="fas fa-balance-scale mr-2"></i> ÉQUILIBRÉ';
                    balanceCheck.classList.add('text-success');
                } else {
                    balanceCheck.innerHTML = \`<i class="fas fa-exclamation-triangle mr-2"></i> DÉSÉQUILIBRÉ (\${diff.toLocaleString('fr-FR')} XOF)\`;
                    balanceCheck.classList.add('text-danger');
                }
            }
            
            // Initialiser les totaux au chargement
            updateTotals();

            // Gestion de la soumission
            document.getElementById('journal-entry-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const msgElement = document.getElementById('saisie-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                
                const totalDebitText = document.getElementById('total-debit').textContent;
                const totalCreditText = document.getElementById('total-credit').textContent;
                
                // Nettoyer pour la conversion
                const totalDebit = parseFloat(totalDebitText.replace(/[^\d,\.]/g, '').replace(',', '.')); 
                const totalCredit = parseFloat(totalCreditText.replace(/[^\d,\.]/g, '').replace(',', '.'));
                
                if (Math.abs(totalDebit - totalCredit) > 0.01) { // Tolérance de flottant
                    msgElement.textContent = "❌ L'écriture n'est pas équilibrée (Débit ≠ Crédit). Correction requise.";
                    msgElement.classList.add('text-danger');
                } else {
                    msgElement.textContent = \`✅ Écriture Journal (TR) enregistrée avec succès pour ${companyName}. Soumise à validation.\`;
                    msgElement.classList.remove('text-danger');
                    msgElement.classList.add('text-success');
                    // Réinitialiser le formulaire après un délai
                     setTimeout(() => {
                         msgElement.classList.add('hidden');
                         // En production, on réinitialiserait
                     }, 4000);
                }
            });
        </script>
    `;
}

/**
 * Interface de saisie simplifiée des Flux (Caisse/Banque - Rôle Caissier/User).
 */
function renderSaisieFormCaissier(companyName) {
    return `
        <div class="max-w-xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h3 class="text-2xl font-extrabold text-info mb-4">Saisie Simplifiée des Flux de ${companyName}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Enregistrement rapide des mouvements de Trésorerie (Recettes et Dépenses). Le système génère automatiquement la contrepartie comptable.</p>
            
            <form id="simple-flux-form" class="space-y-4">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type de Flux <span class="text-danger">*</span></label>
                    <select id="flux-type" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                        <option value="recette">Recette / Encaissement (Entrée)</option>
                        <option value="depense">Dépense / Décaissement (Sortie)</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Compte de Trésorerie <span class="text-danger">*</span></label>
                    <select required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                        <option>571 - Caisse Principale</option>
                        <option>572 - Banque (Compte 1)</option>
                        <option>573 - Caisse Secondaire</option>
                    </select>
                </div>
                
                 <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Compte de Contrepartie (Nature) <span class="text-danger">*</span></label>
                    <input type="text" list="contrepartie-options" placeholder="Ex: 701 (Vente)" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    <datalist id="contrepartie-options">
                        <option value="701 - Ventes de Marchandises">
                        <option value="601 - Achats de Marchandises">
                        <option value="621 - Fournitures de Bureau">
                        <option value="411 - Clients">
                    </datalist>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Montant (XOF) <span class="text-danger">*</span></label>
                    <input type="number" step="1" required placeholder="0" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white text-lg font-bold">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description / Objet</label>
                    <textarea placeholder="Vente du jour / Achat de carburant" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"></textarea>
                </div>
                
                <p id="flux-message" class="mt-4 text-center text-sm hidden"></p>
                <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-plus-circle mr-2"></i> Enregistrer le Flux
                </button>
            </form>
            
             <script>
                document.getElementById('simple-flux-form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const msgElement = document.getElementById('flux-message');
                    const fluxType = document.getElementById('flux-type').value === 'recette' ? 'Recette' : 'Dépense';
                    
                    msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                    msgElement.textContent = \`✅ ${fluxType} enregistrée pour ${companyName}. \${fluxType === 'Dépense' ? 'Soumise à validation.' : ''}\`;
                    msgElement.classList.add('text-success');
                     setTimeout(() => {
                         msgElement.classList.add('hidden');
                         document.getElementById('simple-flux-form').reset();
                     }, 4000);
                });
             </script>
        </div>
    `;
}

/**
 * Interface de validation des opérations (Rôle Admin/Collaborateur).
 */
function generateValidationTable(companyName) {
    // Mock de données pour la validation
    const pendingOps = [
        { id: 'TR-001', date: '2025-12-05', type: 'Saisie Flux', description: 'Achat de fourniture de bureau', montant: 5000, soumisePar: 'Fatou Diallo (Caissier)' },
        { id: 'OD-003', date: '2025-12-04', type: 'Écriture Journal', description: 'Correction de TVA', montant: 100000, soumisePar: 'Koffi Adama (User)' },
        { id: 'AC-002', date: '2025-12-03', type: 'Écriture Journal', description: 'Facture Fournisseur N°123', montant: 23600, soumisePar: 'Marie Leroy (Collab)' },
    ];
    
    const rows = pendingOps.map(op => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100" data-id="${op.id}">${op.id}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${op.date}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-info">${op.type}</td>
            <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">${op.description}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-right font-bold text-danger">${op.montant.toLocaleString('fr-FR')} XOF</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${op.soumisePar}</td>
            <td class="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onclick="handleValidation('${op.id}', 'Valider')" class="text-success hover:text-green-900"><i class="fas fa-check"></i> Valider</button>
                <button onclick="handleValidation('${op.id}', 'Rejeter')" class="text-danger hover:text-red-900"><i class="fas fa-times"></i> Rejeter</button>
            </td>
        </tr>
    `).join('');
    
    return `
        <div class="max-w-full mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h3 class="text-2xl font-extrabold text-info mb-4">Validation des Opérations de ${companyName}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Veuillez examiner et valider ou rejeter les opérations comptables soumises par les collaborateurs.</p>
            
            <div id="validation-message" class="p-3 mb-4 rounded-lg text-center hidden"></div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID Opération</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Soumise Par</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="validation-table-body" class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        ${rows}
                    </tbody>
                </table>
            </div>
             
             <script>
                function handleValidation(opId, action) {
                    const msgElement = document.getElementById('validation-message');
                    msgElement.classList.remove('hidden', 'bg-red-100', 'bg-green-100', 'text-danger', 'text-success');
                    
                    if (action === 'Valider') {
                        msgElement.textContent = \`✅ Opération \${opId} validée et reportée dans les comptes de \${companyName}.\`;
                        msgElement.classList.add('bg-green-100', 'text-success');
                    } else {
                        msgElement.textContent = \`❌ Opération \${opId} rejetée. Un email de notification a été envoyé au soumissionnaire.\`;
                        msgElement.classList.add('bg-red-100', 'text-danger');
                    }
                    
                    // En production, on supprimerait la ligne de la table
                    // const tableBody = document.getElementById('validation-table-body');
                    // const rowToRemove = tableBody.querySelector(\`tr td:first-child[data-id="\${opId}"]\`)?.closest('tr');
                    // if (rowToRemove) rowToRemove.remove();
                }
             </script>
        </div>
    `;
}

/**
 * Interface de génération des rapports SYSCOHADA (Bilan, TFR).
 */
function renderReportsView(companyName) {
     return `
         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-info mb-4">Génération des États Financiers de ${companyName}</h2>
            <p class="text-gray-700 dark:text-gray-300 mb-6">Sélectionnez la période et le type de rapport à générer selon les normes **SYSCOHADA Révisé**.</p>
            
            <div class="grid grid-cols-2 gap-6 mb-8">
                 <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de Début</label>
                    <input type="date" value="2025-01-01" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de Fin</label>
                    <input type="date" value="2025-12-31" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                </div>
            </div>
            
            <div class="space-y-4">
                 ${renderReportButton('Bilan SYSCOHADA (Actif / Passif)', 'fas fa-balance-scale-left', 'Bilan')}
                 ${renderReportButton('Tableau de Formation des Résultats (TFR)', 'fas fa-chart-line', 'TFR')}
                 ${renderReportButton('Grand Livre Général', 'fas fa-book-open', 'GrandLivre')}
                 ${renderReportButton('Balance Générale des Comptes', 'fas fa-sort-amount-up-alt', 'Balance')}
            </div>
            
            <p id="report-message" class="mt-6 text-center text-sm hidden"></p>
            
        </div>
        <script>
            function renderReportButton(title, icon, type) {
                return \`
                    <button onclick="generateReport('\${title}', '\${type}')" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center">
                        <i class="\${icon} mr-3"></i> \${title}
                    </button>
                \`;
            }
            
            function generateReport(title, type) {
                const msgElement = document.getElementById('report-message');
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = \`⏳ Génération du rapport "\${title}" en cours pour \${companyName}... (Simule l'export PDF/Excel)\`;
                msgElement.classList.add('text-info');

                setTimeout(() => {
                    msgElement.textContent = \`✅ Rapport "\${title}" généré avec succès. Début du téléchargement.\`;
                    msgElement.classList.add('text-success');
                    msgElement.classList.remove('text-info');
                }, 2000);
            }
        </script>
    `;
}

// =================================================================================
// 6. CREATION D'ENTREPRISE (ADMIN/COLLABORATEUR)
// =================================================================================

/**
 * Formulaire de création de nouvelle entreprise.
 */
function renderCreateCompanyForm() {
    const currentRole = window.userContext.utilisateurRole;
    const validationNote = currentRole === ROLES.COLLABORATEUR ? 
        "Votre demande sera soumise à l'Administrateur Système pour validation." :
        "L'entreprise sera créée et activée immédiatement.";

    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-secondary mb-2">Création de Nouvelle Entreprise</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">${validationNote}</p>
            
            <form id="new-company-form" class="space-y-4">
                
                <div>
                    <label for="new-company-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Dénomination Sociale <span class="text-danger">*</span></label>
                    <input type="text" id="new-company-name" required placeholder="Ex: Sarl Nouvelle Vision" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="new-company-sigle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sigle</label>
                        <input type="text" id="new-company-sigle" placeholder="Ex: SNV" class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                    </div>
                     <div>
                        <label for="new-company-currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Devise de l'Exercice <span class="text-danger">*</span></label>
                        <select id="new-company-currency" required class="mt-1 block w-full py-2 border rounded-md dark:bg-gray-700 dark:text-white">
                            <option value="XOF">XOF - Franc CFA (UEMOA)</option>
                            <option value="XAF">XAF - Franc CFA (CEMAC)</option>
                        </select>
                    </div>
                </div>
                
                <p id="company-creation-message" class="mt-6 text-center text-sm hidden"></p>
                
                <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-plus-circle mr-2"></i> Soumettre la Création d'Entreprise
                </button>
            </form>
        </div>
        
        <script>
            document.getElementById('new-company-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const role = window.userContext.utilisateurRole;
                const companyName = document.getElementById('new-company-name').value;
                const msgElement = document.getElementById('company-creation-message');
                
                msgElement.classList.remove('hidden', 'text-danger', 'text-success');
                msgElement.textContent = "Soumission en cours...";

                await new Promise(resolve => setTimeout(resolve, 1500)); 
                
                if (role === '${ROLES.ADMIN}') {
                    msgElement.textContent = \`✅ Entreprise "\${companyName}" créée et activée immédiatement.\`;
                    msgElement.classList.add('text-success');
                    // En production, on ajouterait l'entreprise aux listes
                } else {
                    msgElement.textContent = \`✅ Demande de création de "\${companyName}" soumise pour validation Administrateur.\`;
                    msgElement.classList.add('text-success');
                }
                
                document.getElementById('new-company-form').reset();
                setTimeout(() => msgElement.classList.add('hidden'), 5000);
            });
        </script>
    `;
}

// =================================================================================
// 7. HELPER COMPONENTS (Cartes de stats, etc.)
// =================================================================================

function renderNoContextWarning() {
     return `
        <div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl mt-12">
            <i class="fas fa-exclamation-triangle fa-3x text-danger mb-4"></i>
            <h3 class="text-2xl font-extrabold text-danger">Contexte d'Entreprise Manquant</h3>
            <p class="text-gray-700 dark:text-gray-300">
                Veuillez **sélectionner une entreprise** dans votre **Tableau de Bord** (mode Global) avant d'accéder aux fonctionnalités de saisie ou de rapport comptable.
            </p>
        </div>
    `;
}

/**
 * Rendu pour le résumé des validations ADMIN GLOBAL.
 */
function renderAdminValidationSummary(pendingCount) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Validations Système & Demandes en Attente</h3>
            <ul class="space-y-3 text-sm">
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Validation de nouvelles inscriptions (Entreprises)</span>
                    <span class="font-bold text-warning">${pendingCount}</span>
                </li>
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Demandes de réinitialisation de mot de passe</span>
                    <span class="font-bold text-info">3</span>
                </li>
                <li class="flex justify-between items-center p-2">
                    <span>Audits de sécurité en cours</span>
                    <span class="font-bold text-success">0</span>
                </li>
            </ul>
            <button onclick="loadView('user-management')" class="mt-4 w-full py-2 bg-warning hover:bg-yellow-600 text-white font-bold rounded-lg transition duration-300">
                 <i class="fas fa-eye mr-2"></i> Examiner les Demandes
            </button>
        </div>
    `;
}

/**
 * Rend une carte de statistique individuelle.
 */
function renderStatCard(icon, title, value, color) {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 border-${color}">
            <i class="${icon} fa-2x text-${color}"></i>
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                <p class="text-2xl font-extrabold text-gray-900 dark:text-gray-100">${value}</p>
            </div>
        </div>
    `;
}

/**
 * Rend l'ensemble des cartes pour les rôles complets (USER, COLLABORATEUR, ADMIN - Contexte).
 */
function renderStatCards({ transactions, result, pendingOperations, currentCash }) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            ${renderStatCard('fas fa-chart-bar', 'Résultat Provisoire (Bénéfice)', result, 'success')}
            ${renderStatCard('fas fa-hand-holding-usd', 'Total Transactions', transactions, 'primary')}
            ${renderStatCard('fas fa-history', 'Opérations en Attente de Validation', pendingOperations, 'warning')}
            ${renderStatCard('fas fa-money-check-alt', 'Solde Caisse/Banque Actuel', currentCash, 'info')}
        </div>
    `;
}

/**
 * Génère un bouton d'action rapide pour le dashboard contextuel.
 */
function renderActionButton(title, icon, viewName, color) {
    const colorMap = {
        'primary': 'bg-primary hover:bg-blue-700',
        'secondary': 'bg-secondary hover:bg-green-700',
        'warning': 'bg-warning hover:bg-yellow-600',
        'info': 'bg-info hover:bg-teal-600',
    };
    const bgColor = colorMap[color] || colorMap['primary'];
    
    return `
        <button onclick="loadView('${viewName}')" class="p-4 ${bgColor} text-white font-bold rounded-lg shadow-md transition duration-300 flex flex-col items-center text-center transform hover:scale-105">
            <i class="${icon} fa-2x mb-2"></i>
            <span class="text-xs">${title}</span>
        </button>
    `;
}

/**
 * Mock du fil d'activité.
 */
function renderActivityFeed() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fil d'Activité Récent</h3>
            <ul class="space-y-3 text-sm">
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-success">[14:30]</span> Validation de la dépense CRB-005.</li>
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-primary">[10:00]</span> Connexion de l'utilisateur CAI_004 (CaisseTest).</li>
                <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-danger">[08:15]</span> Écriture Journal (AC) N° 001 rejetée par ADM_001.</li>
                <li class="p-2"><span class="font-bold text-info">[Hier]</span> Nouvel utilisateur (COL_002) ajouté à Doukè Holdings.</li>
            </ul>
        </div>
    `;
}

/**
 * Mock des rapports comptables.
 */
function renderAccountingReports() {
    return `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports Complets (SYSCOHADA)</h3>
            <ul class="space-y-3 text-sm">
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Bilan Provisoire (N)</span>
                    <button class="text-info hover:text-primary" onclick="loadView('reports')"><i class="fas fa-eye mr-1"></i> Voir</button>
                </li>
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Tableau de Formation des Résultats (TFR)</span>
                    <button class="text-info hover:text-primary" onclick="loadView('reports')"><i class="fas fa-eye mr-1"></i> Voir</button>
                </li>
                <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
                    <span>Grand Livre (Comptes Auxiliaires)</span>
                    <button class="text-info hover:text-primary" onclick="loadView('reports')"><i class="fas fa-eye mr-1"></i> Voir</button>
                </li>
            </ul>
        </div>
    `;
}

function renderNotFound() {
    return `<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>`;
}

function renderAccessDenied() {
     return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl mt-12">
        <i class="fas fa-lock fa-3x text-danger mb-4"></i>
        <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3>
        <p class="text-gray-700 dark:text-gray-300">
            Votre rôle (${window.userContext.utilisateurRole}) ne vous autorise pas à accéder à cette fonctionnalité.
        </p>
    </div>`;
}

function renderUserManagementView() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-warning mb-6">Gestion des Utilisateurs & Rôles</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Interface d'administration globale pour gérer les comptes utilisateurs et leurs attributions aux entreprises.</p>
            
            <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                 <h4 class="font-bold mb-2">Opérations Simples (Mock)</h4>
                 <button class="py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 mr-2" onclick="alert('Ajout Utilisateur simulé')"><i class="fas fa-user-plus mr-1"></i> Ajouter Utilisateur</button>
                 <button class="py-2 px-4 bg-secondary text-white rounded-lg hover:bg-green-700" onclick="alert('Gestion Rôles simulée')"><i class="fas fa-user-tag mr-1"></i> Gérer Rôles & Permissions</button>
            </div>
        </div>
    `;
}

function renderSettingsView() {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 class="text-3xl font-extrabold text-warning mb-6">Paramètres du Système (Admin)</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Gestion des comptes SYSCOHADA, configuration des journaux et paramètres d'audit.</p>
            
            <p class="p-4 bg-info bg-opacity-10 border-l-4 border-info text-gray-700 dark:text-gray-300">
                Ceci est la vue des paramètres système. Elle est uniquement accessible à l'Administrateur Global.
            </p>
        </div>
    `;
}

// =================================================================================
// 8. INITIALISATION ET GESTIONNAIRE D'ÉVÉNEMENTS (AJOUT CRITIQUE)
// =================================================================================

/**
 * Attache les gestionnaires d'événements DOM nécessaires au chargement de la page.
 */
function attachEventListeners() {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            // Password est ignoré pour le MOCK, mais l'élément doit être présent dans l'HTML
            // const password = document.getElementById('password').value; 
            
            loginMessage.textContent = 'Connexion en cours...';
            loginMessage.classList.remove('hidden', 'text-danger');
            
            const userContext = await authenticateUser(email);

            if (userContext) {
                loginMessage.textContent = 'Connexion réussie ! Redirection...';
                initDashboard(userContext); // Démarre l'application
            } else {
                loginMessage.textContent = '❌ Échec de la connexion. Email/Mot de passe invalide.';
                loginMessage.classList.add('text-danger');
            }
        });
    }

    // Gestionnaire pour le bouton de déconnexion
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.userContext = null;
            document.getElementById('app').classList.add('hidden');
            document.getElementById('login-modal').classList.remove('hidden');
            // Recharger la page pour réinitialiser complètement l'état
            window.location.reload(); 
        });
    }
}

// Démarre l'écoute des événements lorsque le DOM est complètement chargé
document.addEventListener('DOMContentLoaded', attachEventListeners);
