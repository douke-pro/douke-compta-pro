// =================================================================================
// FICHIER : assets/script.js (Logique Front-end)
// ... (Début du fichier : API_BASE_URL, simulateLogin, gestionnaire d'événement de connexion...)
// =================================================================================

// ... (SimulateLogin et gestionnaire d'événement de connexion restent identiques) ...

/**
 * Gère l'initialisation de l'interface et le rendu du Dashboard spécifique au rôle.
 */
function renderDashboard(context) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    const welcomeMessage = document.getElementById('welcome-message');
    const contextMessage = document.getElementById('context-message');
    const currentRole = document.getElementById('current-role');

    currentRole.textContent = context.utilisateurRole;
    welcomeMessage.textContent = `Bienvenue, ${context.utilisateurRole.charAt(0) + context.utilisateurRole.slice(1).toLowerCase()} !`;
    
    // Nettoyer l'ancienne zone de contenu
    dashboardContentArea.innerHTML = '';
    
    // Appel de la fonction de rendu spécifique au rôle
    switch (context.utilisateurRole) {
        case 'ADMIN':
            contextMessage.textContent = "Vue de supervision et gestion complète du système.";
            dashboardContentArea.innerHTML = renderAdminDashboard(context);
            break;
        case 'COLLABORATEUR':
            contextMessage.textContent = "Vue de gestion des entreprises qui vous sont attribuées.";
            dashboardContentArea.innerHTML = renderCollaborateurDashboard(context);
            break;
        case 'USER':
            contextMessage.textContent = `Vue monoposte. Entreprise: ${context.entrepriseContextId}.`;
            dashboardContentArea.innerHTML = renderUserDashboard(context);
            break;
        case 'CAISSIER':
            contextMessage.textContent = `Interface de gestion de caisse et rapports.`;
            dashboardContentArea.innerHTML = renderCaissierDashboard(context);
            break;
        default:
            contextMessage.textContent = "Rôle inconnu.";
            dashboardContentArea.innerHTML = '<p class="text-danger">Erreur: Rôle utilisateur non géré.</p>';
    }

    // Mise à jour de la navigation (sidebar) pour le rôle
    updateNavigationMenu(context.utilisateurRole);
}

// =================================================================================
// 4. RENDU DES DASHBOARDS SPÉCIFIQUES AUX PROFILS (Fidélité aux captures)
// =================================================================================

/**
 * RENDU : Dashboard ADMINISTRATEUR
 * (Basé sur la capture : Synthèse globale, Statistiques d'accès, Gestion des utilisateurs)
 */
function renderAdminDashboard(context) {
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-globe', 'Total Entreprises', '12', 'bg-primary')}
            ${generateStatCard('fas fa-user-shield', 'Total Admins/Collab', '3', 'bg-secondary')}
            ${generateStatCard('fas fa-users-cog', 'Nouveaux Utilisateurs', '7', 'bg-info')}
            ${generateStatCard('fas fa-database', 'Sauvegardes Automatiques', 'OK', 'bg-success')}
        </div>
    `;

    const managementSection = `
        <div class="lg:col-span-3 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Actions d'Administration</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i> Créer Entreprise
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200">
                    <i class="fas fa-user-plus fa-2x mb-2"></i> Créer Collaborateur
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-warning hover:text-white transition duration-200">
                    <i class="fas fa-lock-open fa-2x mb-2"></i> Activer/Désactiver User
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-danger hover:text-white transition duration-200">
                    <i class="fas fa-cloud-download-alt fa-2x mb-2"></i> Déclencher Sauvegarde
                </button>
            </div>
        </div>
    `;

    const collabStats = `
        <div class="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Statistiques Collab</h3>
            <p>Synthèse des entreprises gérées par collaborateur.</p>
            </div>
    `;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">${managementSection}${collabStats}</div></div>`;
}

/**
 * RENDU : Dashboard COLLABORATEUR
 * (Basé sur la capture : Liste des entreprises attribuées, Validation d'opérations, États financiers)
 */
function renderCollaborateurDashboard(context) {
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-briefcase', 'Entreprises Attribuées', '3', 'bg-primary')}
            ${generateStatCard('fas fa-tasks', 'Opérations à Valider', '15', 'bg-warning')}
            ${generateStatCard('fas fa-chart-line', 'Calculs Réalisés ce mois', '8', 'bg-info')}
            ${generateStatCard('fas fa-clock', 'Moyenne Validation', '4h', 'bg-success')}
        </div>
    `;

    const attributedList = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Liste de Mes Entreprises</h3>
            <p>Afficher ici les entreprises gérées avec les contacts et statistiques.</p>
        </div>
    `;
    
    // Le tableau de validation est essentiel pour le Collaborateur
    const validationTable = generateValidationTable();

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${attributedList}<div class="lg:col-span-1">${validationTable}</div></div></div>`;
}

/**
 * RENDU : Dashboard USER (Propriétaire/Comptable)
 * (Basé sur la capture : Synthèse Monoposte, Balances, États de Rapprochement)
 */
function renderUserDashboard(context) {
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${generateStatCard('fas fa-hand-holding-usd', 'Résultat Net Provisoire', '1.2 M XOF', 'bg-success')}
            ${generateStatCard('fas fa-wallet', 'Caisses Créées', '3/5', 'bg-primary')}
            ${generateStatCard('fas fa-hourglass-half', 'Opérations en Attente', '2', 'bg-warning')}
            ${generateStatCard('fas fa-chart-area', 'Trésorerie Actuelle', '800 K XOF', 'bg-info')}
        </div>
    `;

    const accountingReports = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Rapports Comptables Rapides</h3>
            <div class="grid grid-cols-2 gap-4">
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark">Balance des Comptes</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark">Grand Livre</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark">États de Rapprochement</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark">Synthèse Statistique</button>
            </div>
        </div>
    `;
    
    // Le formulaire de demande d'états financiers est critique pour le USER
    const requestForm = `<div class="lg:col-span-1">${renderUserRequestForm()}</div>`;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${accountingReports}${requestForm}</div></div>`;
}

/**
 * RENDU : Dashboard CAISSIER
 * (Basé sur la capture : Simple, centré sur la caisse, avec ouverture/fermeture et validation des mouvements)
 */
function renderCaissierDashboard(context) {
    const statCards = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${generateStatCard('fas fa-money-check-alt', 'Solde de Ma Caisse', '150 K XOF', 'bg-success')}
            ${generateStatCard('fas fa-calendar-check', 'État de la Caisse', 'OUVERTE', 'bg-info')}
            ${generateStatCard('fas fa-undo-alt', 'Mouvements en Attente', '4', 'bg-warning')}
        </div>
    `;

    const caisseActions = `
        <div class="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Actions de Caisse</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <button class="py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"><i class="fas fa-lock-open mr-2"></i> Ouvrir/Fermer la Caisse</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark"><i class="fas fa-plus-square mr-2"></i> Enregistrer Opération</button>
            </div>
            <p class="text-gray-600 dark:text-gray-400">Toutes les opérations enregistrées nécessitent une validation par le User/Collaborateur/Admin avant intégration au Grand Livre.</p>
        </div>
    `;
    
    const caisseReports = `
        <div class="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Rapports Journaliers</h3>
            <button class="w-full py-3 bg-info text-white rounded-lg hover:bg-blue-700 mb-2"><i class="fas fa-print mr-2"></i> Éditer Rapport de Caisse</button>
            <p class="text-sm text-gray-500 dark:text-gray-400">Liste des mouvements récents et solde.</p>
        </div>
    `;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${caisseActions}${caisseReports}</div></div>`;
}

// ... (Les fonctions utilitaires : generateStatCard, generateChartsSection, generateValidationTable, renderUserRequestForm, et updateNavigationMenu restent identiques) ...
