// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : FINALE INTÉGRALE - Détection automatique local/Render
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

let API_BASE_URL;

// 🛑 CORRECTION CRITIQUE : Définir la base URL de Render ici.
// REMPLACER LE PLACEHOLDER CI-DESSOUS PAR VOTRE URL RÉELLE DE WEB SERVICE RENDER !
const RENDER_BACKEND_URL = 'https://[VOTRE-URL-RENDER].onrender.com'; 
const LOCAL_BACKEND_URL = 'http://localhost:3000';


// Détection de l'environnement : si l'hôte n'est ni 'localhost' ni '127.0.0.1', 
// nous supposons que nous sommes sur le Web (Render)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = LOCAL_BACKEND_URL + '/api';
} else {
    // Si nous sommes en ligne, nous utilisons l'URL Render permanente
    API_BASE_URL = RENDER_BACKEND_URL + '/api';
}

console.log(`[ENV DEBUG] API_BASE_URL utilisée: ${API_BASE_URL}`);


window.userContext = null;

const ROLES = {
    ADMIN: 'ADMIN',
    COLLABORATEUR: 'COLLABORATEUR',
    USER: 'USER',
    CAISSIER: 'CAISSIER',
};

// =================================================================================
// 2. AUTHENTIFICATION ET CONTEXTE (ALIGNÉ SERVEUR)
// =================================================================================

async function handleLogin(email, password) {
    const endpoint = `${API_BASE_URL}/auth/login`;

    console.log('🔐 Tentative de connexion sur:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Connexion réussie:', data.utilisateurRole);
            return {
                utilisateurRole: data.utilisateurRole,
                utilisateurId: data.utilisateurId,
                utilisateurNom: data.utilisateurNom,
                token: data.token,
                entrepriseContextId: data.entrepriseContextId || null,
                entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
                multiEntreprise: data.multiEntreprise || false
            };
        } else {
            throw new Error(data.error || 'Erreur de connexion inconnue');
        }

    } catch (error) {
        // Ajout d'une précision pour le débogage de la connexion échouée
        let errorMessage = 'Serveur injoignable. Vérifiez le service Web Render.';
        if (error.message.includes('fetch')) {
             errorMessage = `Erreur réseau: le backend (${endpoint}) n'a pas répondu.`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        console.error('❌ Erreur lors de la connexion:', errorMessage);
        throw new Error(errorMessage);
    }
}

// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================

function initDashboard(context) {
    window.userContext = context;

    document.getElementById('auth-view').classList.add('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
    }
    document.getElementById('dashboard-view').classList.remove('hidden');

    updateHeaderContext(context);
    // Le reste de la navigation et du chargement des vues est à implémenter ici
    // updateNavigationMenu(context.utilisateurRole);
    // loadView('dashboard');
}

function updateHeaderContext(context) {
    const firstName = context.utilisateurNom.split(' ')[0];
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
        welcomeElement.textContent = `Bienvenue, ${firstName}`;
    }

    const roleElement = document.getElementById('current-role');
    if (roleElement) {
        roleElement.textContent = context.utilisateurRole;
    }

    const companyNameElement = document.getElementById('current-company-name');
    if (companyNameElement) {
        companyNameElement.textContent = context.entrepriseContextName || '-- Global --';
    }

    // Le message de contexte doit être géré dans index.html
    const contextMessage = document.getElementById('context-message');
    if (contextMessage) {
        contextMessage.textContent = context.multiEntreprise && !context.entrepriseContextId
            ? '⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.'
            : `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`;
    }
}

// =================================================================================
// 4. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // S'assurer que les IDs sont présents dans index.html
            const emailElement = document.getElementById('email');
            const passwordElement = document.getElementById('password');

            if (!emailElement || !passwordElement) {
                console.error("IDs 'email' ou 'password' manquants dans le DOM.");
                return;
            }

            const email = emailElement.value;
            const password = passwordElement.value;
            const msgElement = document.getElementById('login-message');

            msgElement.classList.remove('hidden', 'text-red-700', 'text-green-700', 'bg-red-100', 'bg-green-100');
            msgElement.textContent = 'Connexion en cours...';
            msgElement.classList.add('text-gray-700', 'bg-gray-100'); // Temporaire

            try {
                const context = await handleLogin(email, password);
                
                msgElement.textContent = `Connexion réussie! Bienvenue, ${context.utilisateurNom}.`;
                msgElement.classList.remove('text-gray-700', 'bg-gray-100');
                msgElement.classList.add('text-green-700', 'bg-green-100');
                
                setTimeout(() => {
                    initDashboard(context);
                }, 1000); // Délai pour afficher le message de succès

            } catch (error) {
                msgElement.textContent = error.message;
                msgElement.classList.remove('text-gray-700', 'bg-gray-100');
                msgElement.classList.add('text-red-700', 'bg-red-100');
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            renderLoginView();
            
            // Réinitialisation des champs pour la sécurité
            const emailElement = document.getElementById('email');
            const passwordElement = document.getElementById('password');
            if (emailElement) emailElement.value = '';
            if (passwordElement) passwordElement.value = '';

            const loginMessage = document.getElementById('login-message');
            if (loginMessage) {
                loginMessage.textContent = 'Déconnexion réussie.';
                loginMessage.classList.remove('hidden');
                loginMessage.classList.add('text-green-700', 'bg-green-100');
            }
        });
    }
});

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
    }
}
