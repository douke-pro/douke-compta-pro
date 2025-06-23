// =============================================================================
// DOUKÈ Compta Pro - Initialisation de l'application v3.1
// =============================================================================

// Variables globales pour l'application
window.app = {
    accounts: [],
    companies: [],
    users: [],
    entries: [],
    cashRegisters: [],
    currentUser: null,
    currentProfile: null,
    currentCompanyId: null,
    filteredData: {
        entries: [],
        accounts: [],
        reports: [],
        cashRegisters: [],
        users: [],
        lastUpdate: null,
        companyId: null
    }
};

// Configuration de l'application
window.appConfig = {
    version: '3.1',
    environment: 'production',
    debug: false,
    syncEnabled: true,
    autoSaveInterval: 30000, // 30 secondes
    maxRetries: 3,
    timeoutDelay: 10000, // 10 secondes
    supportedLanguages: ['fr'],
    defaultCurrency: 'FCFA',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: 'fr-FR'
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Initialisation DOUKÈ Compta Pro v' + window.appConfig.version);
        
        // Initialiser les gestionnaires de base
        initializeThemeManager();
        
        // Attendre que tous les scripts soient chargés
        setTimeout(() => {
            if (typeof UnifiedDataManager !== 'undefined') {
                window.unifiedManager = new UnifiedDataManager();
                setupEventListeners();
                console.log('✅ Application initialisée avec succès');
            } else {
                console.error('❌ Erreur: UnifiedDataManager non disponible');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        handleInitializationError(error);
    }
});

// Configuration des écouteurs d'événements principaux
function setupEventListeners() {
    try {
        // Gestion du formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSecureLogin();
            });
        }

        // Gestion du bouton de la sidebar
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('-translate-x-full');
                }
            });
        }

        // Gestion fermeture menu thème
        document.addEventListener('click', function(e) {
            const themeMenu = document.getElementById('themeMenu');
            const themeButton = e.target.closest('[onclick="toggleThemeMenu()"]');
            if (themeMenu && !themeMenu.contains(e.target) && !themeButton) {
                themeMenu.classList.add('hidden');
            }
        });

        // Gestion du changement d'entreprise
        setTimeout(() => {
            const companySelect = document.getElementById('activeCompanySelect');
            if (companySelect) {
                companySelect.addEventListener('change', function(e) {
                    if (e.target.value && window.unifiedManager) {
                        window.unifiedManager.selectCompany(parseInt(e.target.value));
                        updateSecureUserInfo();
                    }
                });
            }
        }, 200);

        console.log('✅ Écouteurs d\'événements configurés');
    } catch (error) {
        console.error('❌ Erreur configuration événements:', error);
    }
}

// Gestion des erreurs d'initialisation
function handleInitializationError(error) {
    const errorMessage = `
        <div class="min-h-screen flex items-center justify-center bg-red-50">
            <div class="max-w-md w-full mx-4 p-8 bg-white rounded-lg shadow-lg">
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Erreur d'initialisation</h2>
                    <p class="text-gray-600 mb-4">Une erreur est survenue lors du chargement de l'application.</p>
                    <button onclick="location.reload()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        Recharger la page
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.innerHTML = errorMessage;
}

// Protection globale contre les erreurs
window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale capturée:', e.error);
    if (window.appConfig && window.appConfig.debug) {
        console.trace('Stack trace:', e.error);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
    if (window.appConfig && window.appConfig.debug) {
        console.trace('Promise rejection:', e.reason);
    }
});

// Fonction utilitaire pour la détection de fonctionnalités
function detectFeatures() {
    return {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        webWorkers: !!window.Worker,
        websockets: !!window.WebSocket,
        geolocation: !!navigator.geolocation,
        notifications: !!window.Notification,
        serviceWorker: !!navigator.serviceWorker
    };
}

// Export pour les autres modules
window.AppInit = {
    setupEventListeners,
    handleInitializationError,
    detectFeatures
};

console.log('📦 Module AppInit chargé');
