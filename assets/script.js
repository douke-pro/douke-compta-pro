// =================================================================================
// FICHIER : assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : OPTIMALE 4.3 - Détection automatique local/Codespaces/Render
// =================================================================================

// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

let API_BASE_URL;

// Définition de l'URL de l'API selon l'environnement
if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    API_BASE_URL = `${protocol}//${host}/api`;
    console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL: ${API_BASE_URL}`);
} else {
    API_BASE_URL = 'http://localhost:3000/api';
    console.log(`[ENV DEBUG] Local détecté. API_BASE_URL: ${API_BASE_URL}`);
}

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
        console.error('❌ Erreur lors de la connexion:', error.message);
        throw new Error('Serveur injoignable ou erreur de connexion. Vérifiez que le serveur est démarré et que les informations sont correctes.');
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
    updateNavigationMenu(context.utilisateurRole);
    loadView('dashboard');
}

function updateHeaderContext(context) {
    const firstName = context.utilisateurNom.split(' ')[0];
    document.getElementById('welcome-message').textContent = `Bienvenue, ${firstName}`;
    document.getElementById('current-role').textContent = context.utilisateurRole;
    document.getElementById('current-company-name').textContent = context.entrepriseContextName || '-- Global --';

    const contextMessage = document.getElementById('context-message');
    contextMessage.textContent = context.multiEntreprise && !context.entrepriseContextId
        ? '⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.'
        : `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`;
}

// =================================================================================
// 4. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgElement = document.getElementById('login-message');

            msgElement.classList.remove('hidden', 'text-danger', 'text-success');
            msgElement.textContent = 'Connexion en cours...';

            try {
                const context = await handleLogin(email, password);
                msgElement.classList.add('hidden');
                initDashboard(context);
            } catch (error) {
                msgElement.textContent = error.message;
                msgElement.classList.remove('hidden');
                msgElement.classList.add('text-danger');
            }
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            window.userContext = null;
            document.getElementById('dashboard-view').classList.add('hidden');
            renderLoginView();
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('login-message').classList.add('hidden');
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
