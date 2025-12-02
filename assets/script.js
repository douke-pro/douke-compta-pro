// =================================================================================
// FICHIER : assets/script.js
// Description : Gère la connexion, la navigation par rôle et le rendu des dashboards.
// URL d'API mise à jour pour le déploiement Render.
// =================================================================================

const API_BASE_URL = 'https://douke-compta-pro.onrender.com/api'; // VOTRE URL RENDER LIVE
let userContext = null; // Contient les données utilisateur (rôle, entrepriseId, token)

/**
 * 1. SIMULATION D'AUTHENTIFICATION (Doit être remplacé par un appel 'fetch' vers /api/auth/login)
 * @param {string} username - Nom d'utilisateur (simulé pour déterminer le rôle).
 * @returns {object|null} - Payload simulé du JWT Token.
 */
function simulateLogin(username) {
    const defaultCompany = "ENT_PROD_1";
    const defaultToken = "SIMULE_JWT_TOKEN_1234567890"; // Clé simulée

    // Simulation des rôles basée sur l'utilisateur saisi (identifiants de test définis précédemment)
    if (username.toLowerCase() === 'admin') {
        return { utilisateurRole: 'ADMIN', utilisateurId: "SIMULE_ID_ADMIN", entrepriseContextId: defaultCompany, token: defaultToken };
    }
    if (username.toLowerCase() === 'collaborateur') {
        return { utilisateurRole: 'COLLABORATEUR', utilisateurId: "COLLAB_A", entrepriseContextId: defaultCompany, token: defaultToken };
    }
    if (username.toLowerCase() === 'user') {
        // Le USER est assigné à une entreprise spécifique dans le contexte de test
        return { utilisateurRole: 'USER', utilisateurId: "USER_C", entrepriseContextId: "ENT_USER_3", token: defaultToken };
    }
    if (username.toLowerCase() === 'caissier') {
        // Le CAISSIER est assigné à une entreprise spécifique dans le contexte de test
        return { utilisateurRole: 'CAISSIER', utilisateurId: "CAISSE_X", entrepriseContextId: "ENT_USER_3", token: defaultToken };
    }
    return null;
}

/**
 * 2. GESTION DU FLUX DE CONNEXION ET D'AFFICHAGE
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du gestionnaire de formulaire de connexion
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value; // À utiliser pour le fetch réel
        const errorMessage = document.getElementById('auth-error-message');

        // Appel simulé à l'API (Remplacer par fetch() vers l'API /api/auth/login)
        const payload = simulateLogin(username);

        if (payload) {
            userContext = payload;
            errorMessage.classList.add('hidden');
            
            // Cacher la vue auth et afficher la vue dashboard
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('dashboard-view').classList.remove('hidden');

            // Initialiser l'interface utilisateur en fonction du rôle
            renderDashboard(userContext);
        } else {
            errorMessage.textContent = 'Identifiants invalides ou rôle non reconnu.';
            errorMessage.classList.remove('hidden');
        }
    });

    // Gestion de la déconnexion
    document.getElementById('logout-button').addEventListener('click', function() {
        userContext = null;
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('auth-view').classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('auth-error-message').classList.add('hidden');
        window.location.hash = ''; // Nettoyer l'URL
    });
});


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
            // Si le dashboard ADMIN contient un graphique, il doit être initialisé ici
            initializeCharts(); 
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
            ${generateChartsSection()}
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

// =================================================================================
// 5. FONCTIONS UTILITAIRES POUR LE RENDU ET L'INTERACTION API
// =================================================================================

function generateStatCard(iconClass, title, value, bgColor) {
    // Génère une carte de statistiques (Style Tailwind)
    return `
        <div class="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.03] flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
                <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">${value}</p>
            </div>
            <div class="p-3 rounded-full ${bgColor} bg-opacity-10 text-white shadow-xl">
                <i class="${iconClass} text-2xl ${bgColor.replace('bg-', 'text-')}"></i>
            </div>
        </div>
    `;
}

function generateValidationTable() {
    // Tableau d'opérations en attente
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Opérations de Caisse en Attente</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nature</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th class="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">ENT_USER_3</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">Dépense Carburant</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">50,000 XOF</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button class="text-success hover:text-green-700 ml-4"><i class="fas fa-check-circle"></i> Valider</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateChartsSection() {
    // Contenu générique pour le graphique (Doit être initialisé après le rendu)
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Évolution Annuelle</h3>
            <canvas id="mainChart"></canvas>
        </div>
    `;
}

function initializeCharts() {
    // Initialise le graphique Chart.js après que son conteneur soit dans le DOM
    setTimeout(() => {
        const ctx = document.getElementById('mainChart');
        if (ctx) {
            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                    datasets: [{
                        label: 'Résultat Provisoire',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: '#5D5CDE', // primary
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }, 100); // Petit délai pour s'assurer que le DOM est prêt
}

function renderUserRequestForm() {
    // Formulaire du USER pour demander un état financier
    return `
        <div class="max-w-xl p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold text-secondary mb-4">Demande d'États Financiers</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Ce formulaire enverra une notification au Collaborateur en charge.</p>
            
            <form id="request-form">
                <label for="periodicite" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Période souhaitée</label>
                <select id="periodicite" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white">
                    <option value="annuel">Annuel (Clôture)</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="mensuel">Mensuel</option>
                </select>
                
                <label for="commentaires" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Commentaires additionnels</label>
                <textarea id="commentaires" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"></textarea>
                
                <button type="submit" class="w-full mt-6 py-3 bg-secondary hover:bg-primary-dark text-white font-bold rounded-lg transition duration-300 ease-in-out">
                    <i class="fas fa-paper-plane mr-2"></i> Envoyer la Demande
                </button>
                <p id="request-status" class="text-sm mt-3 text-center"></p>
            </form>
        </div>
        <script>
            // Logique de soumission de formulaire pour le workflow
            document.getElementById('request-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const statusElement = document.getElementById('request-status');
                statusElement.textContent = 'Envoi en cours...';

                try {
                    const response = await fetch(`${API_BASE_URL}/workflow/demandeEtat`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${userContext.token}\` // Le token d'autorisation est nécessaire
                        },
                        body: JSON.stringify({ 
                            entrepriseId: userContext.entrepriseContextId,
                            periodicite: document.getElementById('periodicite').value,
                            commentaires: document.getElementById('commentaires').value,
                            tokenPayload: userContext // Envoi du payload pour la simulation de vérification côté serveur
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        statusElement.textContent = '✅ Demande envoyée avec succès au collaborateur et à l\'admin !';
                        statusElement.classList.remove('text-danger');
                        statusElement.classList.add('text-success');
                    } else {
                        statusElement.textContent = \`❌ Erreur (\${response.status}): \${data.error || 'Requête rejetée par l\\'API'}\`;
                        statusElement.classList.remove('text-success');
                        statusElement.classList.add('text-danger');
                    }
                } catch (error) {
                    statusElement.textContent = '❌ Erreur de connexion au serveur API. Vérifiez l\'URL.';
                    statusElement.classList.remove('text-success');
                    statusElement.classList.add('text-danger');
                }
            });
        </script>
    `;
}

function updateNavigationMenu(role) {
    const menu = document.getElementById('role-navigation-menu');
    menu.innerHTML = ''; // Nettoyer l'ancien menu

    const baseItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' },
        { name: 'Saisie Comptable', icon: 'fas fa-edit', view: 'saisie' },
    ];
    
    // Ajout des liens spécifiques selon la hiérarchie
    if (role === 'ADMIN' || role === 'COLLABORATEUR') {
        baseItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'generate-etats' });
        baseItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
    }
    if (role === 'ADMIN') {
        baseItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }
    if (role === 'CAISSIER') {
        baseItems.push({ name: 'Rapports Caisse', icon: 'fas fa-receipt', view: 'reports' });
    }

    baseItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary-light hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;
        // Ici, vous ajouteriez un gestionnaire d'événements pour charger la vue spécifique
        menu.appendChild(link);
    });
}
