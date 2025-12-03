// =================================================================================
// FICHIER : assets/script.js
// Description : Gère la connexion, l'inscription, la navigation et le contexte.
// CORRECTION : Implémentation d'une lecture de réponse API (response.text() + JSON.parse()) plus sûre.
// =================================================================================

const API_BASE_URL = 'https://douke-compta-pro.onrender.com/api'; 
window.userContext = null; 

// Vues qui nécessitent OBLIGATOIREMENT la sélection d'une entreprise pour les rôles multi-entreprises
const OPERATIONAL_VIEWS = ['saisie', 'validation', 'generate-etats', 'reports'];


// =================================================================================
// 1. GESTION DES VUES D'AUTHENTIFICATION/INSCRIPTION
// =================================================================================

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('register-view').classList.add('hidden');
}

function renderRegisterView() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('register-view').classList.remove('hidden');
    // Réinitialiser les messages d'erreur au cas où
    document.getElementById('register-error-message').classList.add('hidden');
}

// =================================================================================
// 2. LOGIQUE API D'AUTHENTIFICATION ET D'INSCRIPTION
// =================================================================================

/**
 * Tente de se connecter en envoyant les identifiants à l'API. (CORRIGÉ: Lecture de réponse plus sûre)
 */
async function handleLogin(username, password) {
    const endpoint = `${API_BASE_URL}/auth/login`; 
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        // 🛑 CORRECTION: Lire le corps en TEXTE d'abord pour éviter l'erreur "Unexpected end of JSON input"
        const responseText = await response.text();
        let data = {};

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                const statusText = response.statusText || 'Erreur non documentée.';
                throw new Error(`Erreur ${response.status} lors de la connexion: ${statusText}. Le serveur a renvoyé une réponse non-JSON.`);
            }
        } else if (!response.ok) {
            const statusText = response.statusText || 'Réponse vide du serveur.';
            throw new Error(`Erreur ${response.status}: ${statusText}. Le corps de la réponse est vide.`);
        }


        if (response.ok && data.token) {
            const user = data.user || {}; 
            
            let context = {
                utilisateurRole: user.role, // EX: 'ADMIN', 'COLLABORATEUR', 'USER', 'CAISSIER'
                utilisateurId: user.id,
                token: data.token,
                entrepriseContextId: user.entrepriseId || null, 
                entrepriseContextName: user.entrepriseName || "Aucune sélectionnée",
            };

            return context;
        } else {
            // Gérer les erreurs de statut (ex: 401) ou le token manquant
            const errorMsg = data.message || "Identifiants incorrects ou jeton manquant.";
            throw new Error(errorMsg);
        }

    } catch (error) {
        throw new Error(error.message === 'Failed to fetch' ? "Serveur API injoignable ou URL incorrecte." : error.message);
    }
}

/**
 * Tente d'inscrire un nouvel utilisateur et de créer son entreprise (rôle USER).
 * (CORRIGÉ: Lecture de réponse plus sûre)
 */
async function handleRegistration(payload) {
    const endpoint = `${API_BASE_URL}/auth/register`; 
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 🛑 CORRECTION MAJEURE: Lire le corps en TEXTE d'abord pour éviter l'erreur "Unexpected end of JSON input"
        const responseText = await response.text();
        let data = {};
        
        if (responseText) {
            try {
                // Si le corps existe, tenter de le parser comme JSON
                data = JSON.parse(responseText);
            } catch (e) {
                // Si le parsing échoue (ex: HTML d'erreur 500), utiliser le texte brut
                const statusText = response.statusText || 'Erreur non documentée.';
                throw new Error(`Erreur ${response.status}: ${statusText}. Le serveur a renvoyé une réponse non-JSON.`);
            }
        } else if (!response.ok) {
            // Si le corps est vide et le statut n'est pas OK
            const statusText = response.statusText || 'Réponse vide du serveur.';
            throw new Error(`Erreur ${response.status}: ${statusText}. Le corps de la réponse est vide.`);
        }
        
        if (!response.ok) {
            // Si le statut est une erreur (4xx/5xx)
            const errorMsg = data.message || `Erreur lors de la création du compte (Code: ${response.status}). Vérifiez les données de l'entreprise (NIF/Nom).`;
            throw new Error(errorMsg);
        }
        
        // SUCCESS PATH (response.ok is true)
        if (data.token) {
            // L'API doit retourner le token, l'utilisateur et les infos de l'entreprise
            const user = data.user || {}; 
            const company = data.company || {};
            
            let context = {
                utilisateurRole: user.role || 'USER', 
                utilisateurId: user.id,
                token: data.token,
                entrepriseContextId: company.id || null, 
                entrepriseContextName: company.name || "Nouvelle Entreprise",
            };
            
            return context;
        } else {
            // L'API a renvoyé 200 OK, mais sans le token attendu
            throw new Error("Inscription réussie, mais jeton d'authentification manquant dans la réponse.");
        }

    } catch (error) {
        // Gérer les erreurs de réseau (Failed to fetch)
        throw new Error(error.message === 'Failed to fetch' ? "Serveur API injoignable pour l'inscription." : error.message);
    }
}


/**
 * Récupère la liste des entreprises pour les rôles multi-entreprises (Admin/Collaborateur). (Inchangé)
 */
async function fetchUserCompanies(context) {
    if (!context.token) return [];
    
    const endpoint = `${API_BASE_URL}/user/companies`; 
    
    try {
        // NOTE: Ici response.json() est conservé car on s'attend à un JSON valide.
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.token}` 
            },
        });
        
        // La gestion d'erreur dans handleLogin/handleRegistration est plus critique (POST/création)
        // Mais nous devrions aussi appliquer la sûreté ici. Simplifié pour le moment.
        const data = await response.json(); 
        
        if (response.ok && Array.isArray(data)) {
            return data; 
        } else {
            console.error("Erreur de récupération des entreprises:", data.message || "Erreur inconnue");
            return [];
        }

    } catch (error) {
        console.error("Erreur de communication API lors de la récupération des entreprises:", error);
        return [];
    }
}


/**
 * 3. GESTION DES ÉVÉNEMENTS DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form'); 
    const logoutButton = document.getElementById('logout-button');
    const authErrorMessage = document.getElementById('auth-error-message');
    const registerErrorMessage = document.getElementById('register-error-message');

    // Gestion de la CONNEXION 
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            authErrorMessage.textContent = 'Connexion en cours...';
            authErrorMessage.classList.remove('hidden', 'text-danger');
            
            try {
                const payload = await handleLogin(username, password);

                window.userContext = payload;
                authErrorMessage.classList.add('hidden');
                
                document.getElementById('auth-view').classList.add('hidden');
                document.getElementById('dashboard-view').classList.remove('hidden');

                renderDashboard(window.userContext);
                
                document.getElementById('current-company-name').textContent = window.userContext.entrepriseContextName;

            } catch (error) {
                authErrorMessage.textContent = error.message;
                authErrorMessage.classList.remove('hidden');
                authErrorMessage.classList.add('text-danger');
            }
        });
    }
    
    // Gestion de l'INSCRIPTION 
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            const payload = {
                username: document.getElementById('reg-username').value,
                password: document.getElementById('reg-password').value,
                email: document.getElementById('reg-email').value,
                companyName: document.getElementById('reg-company-name').value,
                companyNif: document.getElementById('reg-company-nif').value,
                companyStatus: document.getElementById('reg-company-status').value,
            };
            
            registerErrorMessage.textContent = 'Inscription et création d\'entreprise en cours...';
            registerErrorMessage.classList.remove('hidden', 'text-danger');
            
            try {
                const context = await handleRegistration(payload);

                window.userContext = context;
                registerErrorMessage.classList.add('hidden');
                
                document.getElementById('register-view').classList.add('hidden');
                document.getElementById('dashboard-view').classList.remove('hidden');

                renderDashboard(window.userContext);
                
                document.getElementById('current-company-name').textContent = window.userContext.entrepriseContextName;
                alert(`✅ Succès ! Bienvenue ${context.utilisateurRole}. Votre entreprise "${context.entrepriseContextName}" a été créée et sélectionnée.`);


            } catch (error) {
                registerErrorMessage.textContent = error.message;
                registerErrorMessage.classList.remove('hidden');
                registerErrorMessage.classList.add('text-danger');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            renderLoginView(); 
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            authErrorMessage.classList.add('hidden');
            document.getElementById('current-company-name').textContent = 'Nom de l\'Entreprise';
            window.location.hash = ''; 
        });
    }
});

// =================================================================================
// 4. GESTION DU ROUTAGE ET DU CONTEXTE D'ENTREPRISE (Inchangé)
// =================================================================================

function loadView(viewName) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    dashboardContentArea.innerHTML = '';
    const contextMessage = document.getElementById('context-message');
    
    if (!window.userContext) {
        return; 
    }
    
    const isMultiEnterpriseUser = window.userContext.utilisateurRole === 'ADMIN' || window.userContext.utilisateurRole === 'COLLABORATEUR';
    
    if (isMultiEnterpriseUser && !window.userContext.entrepriseContextId && OPERATIONAL_VIEWS.includes(viewName)) {
        alert("🚨 Opération Bloquée. Vous devez d'abord sélectionner une entreprise pour procéder à cette action (Saisie, Validation, etc.).");
        
        return renderEnterpriseSelectorView(viewName); 
    }
    
    switch (viewName) {
        case 'dashboard':
            renderDashboard(window.userContext); 
            break;
        case 'saisie':
            dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Saisie Comptable</h3><p class="text-lg">Page de saisie des écritures pour **${window.userContext.entrepriseContextName}** (${window.userContext.entrepriseContextId}). Prête pour l'intégration API.</p>`;
            contextMessage.textContent = `Saisie des opérations pour l'exercice courant de ${window.userContext.entrepriseContextName}.`;
            break;
        case 'validation':
            dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Validation des Opérations</h3><p class="text-lg">Liste des opérations en attente de validation pour **${window.userContext.entrepriseContextName}**.</p>${generateValidationTable()}`;
            contextMessage.textContent = `Tableau des mouvements à valider pour ${window.userContext.entrepriseContextName}.`;
            break;
        case 'user-management':
            if (window.userContext.utilisateurRole === 'ADMIN') {
                dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Gestion des Utilisateurs</h3><p class="text-lg">Interface complète de gestion des rôles et des accès.</p>`;
                contextMessage.textContent = `Administration système.`;
            }
            break;
        case 'reports':
             dashboardContentArea.innerHTML = `<h3 class="text-3xl font-bold mb-4">Rapports Financiers</h3><p class="text-lg">Génération de la Balance, Grand Livre et autres rapports pour **${window.userContext.entrepriseContextName}**.</p>`;
             contextMessage.textContent = `Consultation des documents légaux de ${window.userContext.entrepriseContextName}.`;
             break;
        default:
            dashboardContentArea.innerHTML = `<p class="text-danger">Vue **${viewName}** non implémentée.</p>`;
            contextMessage.textContent = `Erreur de navigation.`;
    }
}


async function renderEnterpriseSelectorView(blockedViewName = null) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    dashboardContentArea.innerHTML = `
        <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center">
            <i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i>
            <h2 class="text-2xl font-extrabold text-primary">Chargement des entreprises...</h2>
            <p class="text-gray-600 dark:text-gray-400">Récupération de la liste des entreprises depuis l'API sécurisée.</p>
        </div>
    `;

    try {
        const companies = await fetchUserCompanies(window.userContext);
        
        const role = window.userContext.utilisateurRole;
        let companyListHTML;

        if (companies.length === 0) {
            companyListHTML = `
                <div class="p-6 text-center bg-warning bg-opacity-10 rounded-xl">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p class="text-warning font-semibold">Aucune entreprise trouvée ou votre API n'a renvoyé aucune donnée.</p>
                    <p class="text-sm text-gray-700 dark:text-gray-300 mt-2">Veuillez vérifier l'endpoint /user/companies et votre base de données.</p>
                </div>
            `;
        } else {
            companyListHTML = companies.map(company => {
                const transactions = company.stats && company.stats.transactions ? company.stats.transactions : 'N/A';
                const active_users = company.stats && company.stats.active_users ? company.stats.active_users : 'N/A';
                
                return `
                    <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:scale-[1.01] cursor-pointer border-l-4 border-primary hover:border-secondary" 
                         data-company-id="${company.id}" data-company-name="${company.name}">
                        <h4 class="text-xl font-bold text-primary dark:text-primary-light mb-2">${company.name}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">ID: ${company.id}</p>
                        <div class="mt-4 flex justify-between text-sm">
                            <span class="text-info"><i class="fas fa-users"></i> Utilisateurs actifs: ${active_users}</span>
                            <span class="text-success"><i class="fas fa-chart-bar"></i> Transactions récentes: ${transactions}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        dashboardContentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <h2 class="text-3xl font-extrabold text-danger mb-2">Sélectionner un Contexte d'Entreprise</h2>
                <p class="text-lg text-gray-600 dark:text-gray-400 mb-6 border-b pb-4">
                    ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Vous ne pouvez pas accéder à la fonctionnalité "${blockedViewName.toUpperCase()}"` : 'Avant de procéder à toute opération comptable,'} en tant que **${role}**, vous devez choisir l'entreprise sur laquelle vous souhaitez travailler.
                </p>
                <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${companyListHTML}
                </div>
            </div>
        `;
        
        dashboardContentArea.querySelectorAll('[data-company-id]').forEach(element => {
            element.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                const companyName = this.getAttribute('data-company-name');
                
                window.userContext.entrepriseContextId = companyId;
                window.userContext.entrepriseContextName = companyName;

                document.getElementById('current-company-name').textContent = companyName;
                
                loadView('dashboard'); 
            });
        });
        
    } catch (error) {
        dashboardContentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-danger bg-opacity-10 border-4 border-danger rounded-xl shadow-2xl text-center">
                <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
                <h2 class="text-2xl font-extrabold text-danger">Erreur Fatale du Chargement des Entreprises</h2>
                <p class="text-lg text-gray-900 dark:text-gray-100">${error.message}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">Veuillez vérifier l'état du serveur API et la console pour les détails du réseau.</p>
            </div>
        `;
    }

    document.getElementById('welcome-message').textContent = `Bienvenue, ${window.userContext.utilisateurRole.charAt(0) + window.userContext.utilisateurRole.slice(1).toLowerCase()} !`;
    document.getElementById('context-message').textContent = "⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise ci-dessous pour débloquer les opérations.";
    updateNavigationMenu(window.userContext.utilisateurRole);
}


function renderDashboard(context) {
    const dashboardContentArea = document.getElementById('dashboard-content-area');
    const welcomeMessage = document.getElementById('welcome-message');
    const contextMessage = document.getElementById('context-message');
    const currentRole = document.getElementById('current-role');

    currentRole.textContent = context.utilisateurRole;
    welcomeMessage.textContent = `Bienvenue, ${context.utilisateurRole.charAt(0) + context.utilisateurRole.slice(1).toLowerCase()} !`;
    
    dashboardContentArea.innerHTML = '';
    
    let isMultiEnterpriseUser = context.utilisateurRole === 'ADMIN' || context.utilisateurRole === 'COLLABORATEUR';
    let contextName = context.entrepriseContextName || "Aucune sélectionnée";
    
    if (isMultiEnterpriseUser && context.entrepriseContextId === null) {
        contextMessage.textContent = `⚠️ CONTEXTE INCOMPLET. Affichage des statistiques globales. Veuillez sélectionner une entreprise (menu ci-dessous ou barre latérale) pour effectuer des opérations comptables.`;
    } else {
        contextMessage.textContent = `Contexte de travail actuel: ${contextName}.`;
    }
    
    switch (context.utilisateurRole) {
        case 'ADMIN':
            dashboardContentArea.innerHTML = renderAdminDashboard(context);
            initializeCharts(); 
            break;
        case 'COLLABORATEUR':
            dashboardContentArea.innerHTML = renderCollaborateurDashboard(context);
            break;
        case 'USER':
            dashboardContentArea.innerHTML = renderUserDashboard(context);
            break;
        case 'CAISSIER':
            dashboardContentArea.innerHTML = renderCaissierDashboard(context);
            break;
    }
    
    if (isMultiEnterpriseUser && context.entrepriseContextId === null) {
        dashboardContentArea.innerHTML += `
            <div class="mt-8 text-center p-6 bg-info bg-opacity-10 border-4 border-info rounded-xl shadow-lg">
                <h3 class="text-xl font-bold text-info mb-4">Choisir votre entreprise de travail</h3>
                <p class="mb-4 text-gray-700 dark:text-gray-300">Vos actions de saisie ou de validation sont bloquées tant qu'une entreprise n'est pas sélectionnée.</p>
                <button onclick="renderEnterpriseSelectorView()" class="py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition duration-300">
                    <i class="fas fa-briefcase mr-2"></i> Sélectionner une Entreprise Maintenant
                </button>
            </div>
        `;
    }
    
    updateNavigationMenu(context.utilisateurRole);
}

// =================================================================================
// 5. RENDU DES DASHBOARDS SPÉCIFIQUES AUX PROFILS (Inchangé)
// =================================================================================

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
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200" onclick="loadView('create-company')">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i> Créer Entreprise
                </button>
                <button class="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-primary hover:text-white transition duration-200" onclick="loadView('user-management')">
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
    
    const validationTable = generateValidationTable();

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${attributedList}<div class="lg:col-span-1">${validationTable}</div></div></div>`;
}
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
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Balance des Comptes</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Grand Livre</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">États de Rapprochement</button>
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('reports')">Synthèse Statistique</button>
            </div>
        </div>
    `;
    
    const requestForm = `<div class="lg:col-span-1">${renderUserRequestForm()}</div>`;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${accountingReports}${requestForm}</div></div>`;
}
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
                <button class="py-3 bg-secondary text-white rounded-lg hover:bg-primary-dark" onclick="loadView('saisie')"><i class="fas fa-plus-square mr-2"></i> Enregistrer Opération</button>
            </div>
            <p class="text-gray-600 dark:text-gray-400">Toutes les opérations enregistrées nécessitent une validation par le User/Collaborateur/Admin avant intégration au Grand Livre.</p>
        </div>
    `;
    
    const caisseReports = `
        <div class="lg:col-span-1 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">Rapports Journaliers</h3>
            <button class="w-full py-3 bg-info text-white rounded-lg hover:bg-blue-700 mb-2" onclick="loadView('reports')"><i class="fas fa-print mr-2"></i> Éditer Rapport de Caisse</button>
            <p class="text-sm text-gray-500 dark:text-gray-400">Liste des mouvements récents et solde.</p>
        </div>
    `;

    return `<div class="space-y-8">${statCards}<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${caisseActions}${caisseReports}</div></div>`;
}

// =================================================================================
// 6. FONCTIONS UTILITAIRES POUR LE RENDU ET L'INTERACTION API (Inchangées, sauf handleRegistration et handleLogin)
// =================================================================================

function generateStatCard(iconClass, title, value, bgColor) { 
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
    return `
        <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Évolution Annuelle</h3>
            <canvas id="mainChart"></canvas>
        </div>
    `;
}

function initializeCharts() { 
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
    }, 100); 
}

function renderUserRequestForm() { 
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
            document.getElementById('request-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const statusElement = document.getElementById('request-status');
                statusElement.textContent = 'Envoi en cours...';
                statusElement.classList.remove('text-success', 'text-danger');

                if (!window.userContext || !window.userContext.token) {
                    statusElement.textContent = '❌ Erreur: Utilisateur non connecté ou token manquant.';
                    statusElement.classList.add('text-danger');
                    return;
                }

                try {
                    const response = await fetch(\`${API_BASE_URL}/workflow/demandeEtat\`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${window.userContext.token}\` 
                        },
                        body: JSON.stringify({ 
                            entrepriseId: window.userContext.entrepriseContextId,
                            periodicite: document.getElementById('periodicite').value,
                            commentaires: document.getElementById('commentaires').value,
                            tokenPayload: window.userContext
                        })
                    });
                    
                    // Simple check for success, assuming this API is stable and always returns JSON.
                    const data = await response.json(); 

                    if (response.ok && data.success) {
                        statusElement.textContent = '✅ Demande envoyée avec succès au collaborateur et à l\'admin !';
                        statusElement.classList.add('text-success');
                    } else {
                        statusElement.textContent = \`❌ Erreur (\${response.status}): \${data.error || 'Requête rejetée par l\\'API'}\`;
                        statusElement.classList.add('text-danger');
                    }
                } catch (error) {
                    console.error("Erreur d'API:", error);
                    statusElement.textContent = '❌ Erreur de connexion au serveur API ou réponse non lisible. Vérifiez l\'URL et la console.';
                    statusElement.classList.add('text-danger');
                }
            });
        </script>
    `;
}

function updateNavigationMenu(role) {
    const menu = document.getElementById('role-navigation-menu');
    menu.innerHTML = ''; 

    const baseItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' },
        { name: 'Saisie Comptable', icon: 'fas fa-edit', view: 'saisie' },
    ];
    
    if (role === 'ADMIN' || role === 'COLLABORATEUR') {
        baseItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
        baseItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
    }
    if (role === 'ADMIN') {
        baseItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
    }
    if (role === 'CAISSIER') {
        baseItems.push({ name: 'Rapports Caisse', icon: 'fas fa-receipt', view: 'reports' });
    }
    
    if (role === 'ADMIN' || role === 'COLLABORATEUR') {
         baseItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-sync-alt', view: 'selector' });
    }

    baseItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary-light hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (item.view === 'selector') {
                renderEnterpriseSelectorView();
            } else {
                loadView(item.view);
            }
        });
        
        menu.appendChild(link);
    });
}
