// =================================================================================
// FICHIER : public/assets/script.js
// Description : Logique complète de l'application Doukè Compta Pro
// VERSION : PROFESSIONNELLE V1.4 (Intégration SYSCOHADA Manager & Sécurité Multi-Entreprise)
// =================================================================================

// =================================================================================
// 0. ARCHITECTURE & SÉCURITÉ : MANAGERS UNIFIÉS
// =================================================================================

/**
 * Gestionnaire d'affichage des notifications temporaires.
 */
const NotificationManager = {
    show: (type, title, message, duration = 5000) => {
        const zone = document.getElementById('notification-zone');
        if (!zone) {
            console.warn(`[NOTIF] ${title} (${type}): ${message}`);
            return;
        }

        const typeColors = {
            success: 'bg-success border-success-dark', danger: 'bg-danger border-danger-dark',
            warning: 'bg-warning border-warning-dark', info: 'bg-info border-info-dark'
        };
        const typeIcons = {
            success: 'fas fa-check-circle', danger: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle'
        };

        const html = `
            <div class="notification p-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border-l-4 border-${typeColors[type].split('-')[0]} fade-in" role="alert">
                <div class="flex items-center">
                    <i class="${typeIcons[type]} text-${typeColors[type].split('-')[0]} mr-3"></i>
                    <div>
                        <p class="font-bold text-gray-900 dark:text-white">${title}</p>
                        <p class="text-sm text-gray-700 dark:text-gray-300">${message}</p>
                    </div>
                </div>
            </div>
        `;

        const element = document.createElement('div');
        element.innerHTML = html.trim();
        const notif = element.firstChild;
        zone.prepend(notif);

        setTimeout(() => {
            notif.classList.remove('fade-in');
            notif.classList.add('fade-out');
            notif.addEventListener('transitionend', () => notif.remove());
            setTimeout(() => notif.remove(), 500);
        }, duration);
    }
};

/**
 * Gestionnaire d'affichage de la modale professionnelle (pour les rapports).
 */
const ModalManager = {
    show: (title, content) => {
        const modal = document.getElementById('professional-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        document.body.classList.add('modal-open');

        modalCloseBtn.onclick = ModalManager.hide;
        modal.onclick = (e) => {
            if (e.target === modal) ModalManager.hide();
        };
    },
    hide: () => {
        document.body.classList.remove('modal-open');
    }
};

/**
 * Gestionnaire Unifié (Simule le DoukeModuleManager pour les appels UI)
 */
window.unifiedManager = {
    notificationManager: NotificationManager,
    modalManager: ModalManager,
    showNotification: (type, title, message, duration) => NotificationManager.show(type, title, message, duration),
    showModal: (title, content) => ModalManager.show(title, content),
    getSelectedCompanyName: () => window.app.currentCompanyName || 'Entreprise non définie'
};


// =================================================================================
// 0.3. UTILITAIRES : MODALES DE CONFIRMATION ET PROMPT (Remplacent confirm/prompt)
// =================================================================================

/**
 * Affiche une modale de confirmation personnalisée (remplace confirm())
 */
function showConfirmModal(title, message, onConfirm, onCancel = null) {
    const existingModal = document.getElementById('confirm-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
    modal.id = 'confirm-modal-overlay';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-warning text-2xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white">${title}</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">${message}</p>
            </div>
            <div class="flex space-x-4">
                <button id="confirm-modal-cancel" class="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    Annuler
                </button>
                <button id="confirm-modal-ok" class="flex-1 py-3 px-4 bg-danger text-white font-bold rounded-xl hover:bg-red-600 transition">
                    Confirmer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirm-modal-cancel').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });
    
    document.getElementById('confirm-modal-ok').addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    });
}

/**
 * Affiche une modale de saisie personnalisée (remplace prompt())
 */
function showPromptModal(title, placeholder, onConfirm, onCancel = null, defaultValue = '') {
    const existingModal = document.getElementById('prompt-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
    modal.id = 'prompt-modal-overlay';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
            <div class="mb-6">
                <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4">${title}</h3>
                <input type="text" id="prompt-modal-input" 
                       class="w-full p-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                       placeholder="${placeholder}" 
                       value="${defaultValue}">
            </div>
            <div class="flex space-x-4">
                <button id="prompt-modal-cancel" class="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    Annuler
                </button>
                <button id="prompt-modal-ok" class="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition">
                    Valider
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = document.getElementById('prompt-modal-input');
    input.focus();
    input.select();
    
    const handleConfirm = () => {
        const value = input.value.trim();
        modal.remove();
        if (onConfirm) onConfirm(value);
    };
    
    document.getElementById('prompt-modal-cancel').addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });
    
    document.getElementById('prompt-modal-ok').addEventListener('click', handleConfirm);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConfirm();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    });
}

/**
 * Affiche une alerte personnalisée (remplace alert())
 */
function showAlertModal(title, message, onClose = null) {
    const existingModal = document.getElementById('alert-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
    modal.id = 'alert-modal-overlay';
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-info-circle text-info text-2xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white">${title}</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-2">${message}</p>
            </div>
            <button id="alert-modal-ok" class="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition">
                OK
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.remove();
        if (onClose) onClose();
    };
    
    document.getElementById('alert-modal-ok').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}


// ============================================================================
// 0.5. GESTIONNAIRE D'INTÉGRATION ET SÉCURITÉ (SYSCOHADAIntegrationManager)
// ============================================================================

/**
 * Gestionnaire de sécurité et d'intégration pour les couches de calculs SYSCOHADA
 * S'assure de l'isolation des données par entreprise.
 */
const SYSCOHADAIntegrationManager = {
    validateDependencies() {
        const errors = [];
        
        if (!window.app) {
            errors.push('Module principal (window.app) non initialisé');
        }
        
        if (!window.unifiedManager) {
            errors.push('Gestionnaire unifié (window.unifiedManager) non disponible');
        }
        
        if (window.app && !window.app.currentCompanyId) {
            errors.push('Aucune entreprise sélectionnée');
        }
        
        if (errors.length > 0) {
            throw new Error(`Erreurs d'intégration détectées: ${errors.join(', ')}`);
        }
        
        return true;
    },
    
    checkDataAvailability() {
        try {
            this.validateDependencies(); 
            
            if (!window.app.filteredData || !window.app.filteredData.entries) {
                throw new Error('Données comptables (entries) non disponibles');
            }
            if (window.app.filteredData.entries.length === 0) {
                 console.warn('[SYSCOHADA] Aucune écriture trouvée pour cette entreprise.');
                 return true; 
            }
            
            return true;
        } catch (error) {
            this.handleIntegrationError(error, 'Vérification des données pour calcul'); 
            return false;
        }
    },
    
    getCurrentCompanyId() {
        return window.app.currentCompanyId;
    },
    
    handleIntegrationError(error, context = 'Opération SYSCOHADA') {
        const message = error.message.includes('fetch') ? 
                        "Erreur réseau ou API injoignable." : 
                        error.message;
        
        window.unifiedManager.showNotification('danger', 'Erreur Critique', `${context}: ${message}`);
        console.error(`[SYSCOHADA Integration Error] ${context}:`, error);
    },
    
    showNotification: (type, title, message, duration) => window.unifiedManager.showNotification(type, title, message, duration),
    showModal: (title, content) => window.unifiedManager.showModal(title, content)
};


// =================================================================================
// 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
// =================================================================================

let API_BASE_URL;

const RENDER_BACKEND_URL = 'https://douke-compta-pro.onrender.com'; 
const LOCAL_BACKEND_URL = 'http://localhost:3000';

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.host.endsWith('-3000.app.github.dev')) {
    API_BASE_URL = LOCAL_BACKEND_URL + '/api';
} else {
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
// 1.5. SERVICES TECHNIQUES : CACHE MANAGER ET GESTIONNAIRE D'ÉTAT
// =================================================================================

const CACHE_LIFETIME_MS = 300000; // 5 minutes

/**
 * Gère un cache en mémoire simple avec expiration.
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    getCached(key) {
        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            if (Date.now() < entry.expiry) {
                return entry.data;
            } else {
                this.cache.delete(key);
            }
        }
        return null;
    }

    setCached(key, data, lifetimeMs = CACHE_LIFETIME_MS) {
        const expiry = Date.now() + lifetimeMs;
        this.cache.set(key, { data, expiry });
    }
    
    clearCache(prefix = null) {
        if (!prefix) {
            this.cache.clear();
            console.log('[CACHE CLEAR] Cache complet vidé.');
            return;
        }
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
}

window.cacheManager = new CacheManager();

/**
 * Centralisation de l'état crucial pour le routing et les rapports comptables.
 */
window.app = {
    currentCompanyId: null,
    currentCompanyName: null,
    currentSysteme: 'NORMAL',
    filteredData: {
        entries: [],
        accounts: [],
    },
};


// =================================================================================
// 2. AUTHENTIFICATION ET SERVICES DE DONNÉES API
// =================================================================================

/**
 * Affiche un message flash dans la vue de connexion/inscription.
 */
function displayAuthMessage(viewId, message, type) {
    const msgElement = document.getElementById(`${viewId}-message`);
    if (!msgElement) return;

    msgElement.classList.remove('hidden', 'text-red-700', 'text-green-700', 'text-blue-700', 'bg-red-100', 'bg-green-100', 'bg-blue-100', 'text-gray-700', 'bg-gray-100');
    msgElement.classList.add('fade-in');

    let textClass = 'text-gray-700';
    let bgClass = 'bg-gray-100';

    switch (type) {
        case 'success':
            textClass = 'text-success';
            bgClass = 'bg-green-100';
            break;
        case 'danger':
            textClass = 'text-danger';
            bgClass = 'bg-red-100';
            break;
        case 'info':
            textClass = 'text-info';
            bgClass = 'bg-blue-100';
            break;
        case 'none':
            msgElement.classList.add('hidden');
            return;
    }

    msgElement.textContent = message;
    msgElement.classList.remove('hidden');
    msgElement.classList.add(textClass, bgClass);
}


/**
 * Connexion utilisateur via l'API serveur Odoo.
 */
async function handleLogin(email, password) {
    const endpoint = `${API_BASE_URL}/auth/login`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Réponse API non-JSON ou malformée:', responseText.substring(0, 100) + '...');
            if (!response.ok) {
                throw new Error(`Erreur du serveur (${response.status}) : ${responseText.substring(0, 50)}...`);
            }
            throw new Error('Réponse du serveur non valide ou non-JSON.');
        }

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
            throw new Error(data.error || 'Identifiants invalides ou erreur de connexion inconnue');
        }

    } catch (error) {
        let errorMessage = 'Erreur réseau: Serveur injoignable. Vérifiez l\'état de votre Web Service Render.';
        if (!error.message.includes('fetch') && error.message) {
            errorMessage = error.message;
        }
        console.error('❌ Erreur lors de la connexion:', errorMessage);
        throw new Error(errorMessage);
    }
}

/**
 * Inscription utilisateur via l'API Odoo
 */
async function handleRegistration(payload) {
    const endpoint = `${API_BASE_URL}/auth/register`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        let data;
        
        try { 
            data = JSON.parse(responseText); 
        } catch (e) {
            if (!response.ok) {
                throw new Error(`Erreur Serveur ${response.status}: L'endpoint d'inscription a échoué.`);
            }
            throw new Error(`Réponse API non valide (JSON malformé).`); 
        }

        if (response.ok) {
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
            throw new Error(data.error || 'Erreur d\'inscription inconnue');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription:', error.message);
        throw new Error(error.message);
    }
}


/**
 * Récupère les écritures comptables pour une entreprise.
 */
async function fetchCompanyEntries(companyId, token) {
    if (!companyId || !token) {
        throw new Error('Company ID et Token sont requis pour récupérer les écritures.');
    }
    
    const cacheKey = `entries_${companyId}`;
    const cachedData = window.cacheManager.getCached(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const endpoint = `${API_BASE_URL}/entries/${companyId}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 404 || response.status === 401 || !response.ok) {
            console.warn(`⚠️ API entries non disponible (Status: ${response.status}). Utilisation données MOCK.`);
            const mockEntries = generateMockEntries(companyId);
            window.cacheManager.setCached(cacheKey, mockEntries);
            window.app.filteredData.entries = mockEntries; 
            return mockEntries;
        }

        const responseText = await response.text();
        let data = JSON.parse(responseText);

        if (Array.isArray(data)) {
            window.cacheManager.setCached(cacheKey, data);
            window.app.filteredData.entries = data; 
            return data;
        } else {
            throw new Error(data.error || 'Format de données invalide.');
        }
    } catch (error) {
        console.error('❌ ERREUR RÉSEAU (fetchCompanyEntries). Fallback MOCK:', error);
        const mockEntries = generateMockEntries(companyId);
        window.cacheManager.setCached(cacheKey, mockEntries);
        window.app.filteredData.entries = mockEntries; 
        return mockEntries;
    }
}

/**
 * Génère des écritures MOCK pour le SYSCOHADA.
 */
function generateMockEntries(companyId) {
    const entries = [
        { date: '2024-01-05', libelle: 'Vente Client A', compteD: 41100000, compteC: 70100000, montant: 10000000 },
        { date: '2024-01-05', libelle: 'TVA Vente', compteD: 41100000, compteC: 44300000, montant: 1800000 },
        { date: '2024-01-10', libelle: 'Achat Fournisseur B', compteD: 60100000, compteC: 40100000, montant: 4000000 },
        { date: '2024-01-10', libelle: 'TVA Achat', compteD: 44500000, compteC: 40100000, montant: 720000 },
        { date: '2024-01-15', libelle: 'Salaire', compteD: 66100000, compteC: 52100000, montant: 3000000 },
        { date: '2024-02-01', libelle: 'Encaissement Client A', compteD: 52100000, compteC: 41100000, montant: 11800000 },
        { date: '2024-02-20', libelle: 'Loyer', compteD: 62100000, compteC: 52100000, montant: 1500000 },
    ];

    entries.unshift({ date: '2024-01-01', libelle: 'Solde Initial Banque', compteD: 52100000, compteC: 10100000, montant: 20000000 });

    console.log(`[MOCK Data] ${entries.length} écritures générées pour ${companyId}.`);
    return entries;
}


/**
 * Récupère les entreprises accessibles à l'utilisateur.
 */
async function fetchUserCompanies(context) {
    const cacheKey = `companies_${context.utilisateurId}`;
    const cachedData = window.cacheManager.getCached(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const endpoint = `${API_BASE_URL}/companies/list`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.companies && Array.isArray(data.companies)) {
                window.cacheManager.setCached(cacheKey, data.companies);
                return data.companies;
            }
        }
        
        // Fallback MOCK
        console.warn('⚠️ API companies non disponible. Utilisation données MOCK.');
    } catch (error) {
        console.warn('⚠️ Erreur réseau companies. Utilisation données MOCK.');
    }
    
    // Données MOCK
    const mockCompanies = [
        { id: 'ENT_001', name: 'Alpha Solutions', stats: { transactions: 450, result: 15000000, pending: 12, cash: 8900000 } },
        { id: 'ENT_002', name: 'Beta Consulting', stats: { transactions: 120, result: 2500000, pending: 5, cash: 1200000 } },
        { id: 'ENT_003', name: 'Gama Holding', stats: { transactions: 880, result: 45000000, pending: 30, cash: 25000000 } }
    ];
    
    window.cacheManager.setCached(cacheKey, mockCompanies);
    window.unifiedManager.showNotification('warning', 'Contexte Multi-Entreprise', 'Les données des entreprises sont simulées (MOCK).', 3000);

    return mockCompanies;
}


/**
 * Change le contexte entreprise pour utilisateurs multi-entreprises
 */
async function changeCompanyContext(newId, newName) {
    if (window.userContext && window.userContext.multiEntreprise) {
        window.userContext.entrepriseContextId = newId;
        window.userContext.entrepriseContextName = newName;
        
        window.app.currentCompanyId = newId;
        window.app.currentCompanyName = newName;
        window.app.filteredData.entries = [];
        window.cacheManager.clearCache(`entries_`);
        
        updateNavigationMenu(window.userContext.utilisateurRole); 
        await loadView('dashboard'); 
        updateHeaderContext(window.userContext);
        
        SYSCOHADAIntegrationManager.showNotification('success', 'Contexte Changé', `Passage réussi à l'entreprise : ${newName}`);
    }
}


// =================================================================================
// 2.5. SQUELETTE LOGIQUE SYSCOHADA
// =================================================================================

const MOCK_REPORT_DATA = {
    bilan: "<p>Tableau ACTIF/PASSIF structuré professionnellement (Bilan MOCK)</p>",
    resultat: "<p>Compte de Résultat par nature (MOCK)</p>",
    flux: "<p>Tableau de Financement/Flux de Trésorerie (MOCK)</p>",
    recettesDepenses: "<p>Tableau des Recettes et Dépenses (MOCK)</p>",
    bilanMinimal: "<p>Bilan Minimal SYSCOHADA TPE (MOCK)</p>",
    annexes: "<h3>Notes Annexes Simplifiées</h3><p>Méthodes comptables utilisées...</p>",
};

function genererBilan(ecritures) { return MOCK_REPORT_DATA.bilan; }
function genererCompteResultat(ecritures) { return MOCK_REPORT_DATA.resultat; }
function genererFluxTresorerie(ecritures) { return MOCK_REPORT_DATA.flux; }
function annexesNormal(ecritures, options) { return MOCK_REPORT_DATA.annexes; }

function genererEtatRecettesDepenses(ecritures) { return MOCK_REPORT_DATA.recettesDepenses; }
function genererBilanMinimal(ecritures) { return MOCK_REPORT_DATA.bilanMinimal; }
function annexesMinimal(ecritures, options) { return MOCK_REPORT_DATA.annexes; }

/**
 * Affiche les états financiers dans la zone désignée.
 */
function afficherEtatFinancier(etats) {
    const zone = document.getElementById('etat-financier');
    if (!zone) return;
    zone.innerHTML = '';
    
    for (const [cle, contenu] of Object.entries(etats)) {
        const title = cle.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const bloc = document.createElement('div');
        bloc.className = "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-4 fade-in";
        bloc.innerHTML = `<h3 class="text-2xl font-bold text-secondary mb-4">${title}</h3>${contenu}`;
        zone.appendChild(bloc);
    }
}

/**
 * Contrôleur central pour générer les états financiers basés sur le système sélectionné.
 */
async function genererEtatsFinanciers() {
    const zoneRapports = document.getElementById('etat-financier');
    if (zoneRapports) {
        zoneRapports.innerHTML = '<div class="text-center p-8"><i class="loading-spinner mb-4 mx-auto block"></i><p>Chargement et calcul des écritures...</p></div>';
    }
    
    try {
        SYSCOHADAIntegrationManager.validateDependencies();
        const companyId = SYSCOHADAIntegrationManager.getCurrentCompanyId();
        const systeme = window.app.currentSysteme;
        const token = window.userContext.token;
        
        let ecritures = await fetchCompanyEntries(companyId, token);
        
        if (ecritures.length === 0) {
            if (zoneRapports) zoneRapports.innerHTML = '<p class="text-warning font-bold p-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg">⚠️ Aucune écriture comptable trouvée pour cette entreprise.</p>';
            return;
        }
        
        SYSCOHADAIntegrationManager.showNotification('success', 'Données Prêtes', `${ecritures.length} écritures chargées pour le calcul.`);

        let etats = {};
        if (systeme === 'normal' || systeme === 'NORMAL') {
            etats.bilan = genererBilan(ecritures);
            etats.resultat = genererCompteResultat(ecritures);
            etats.flux = genererFluxTresorerie(ecritures);
            etats.annexes = annexesNormal(ecritures, {});
        } else {
            etats.recettesDepenses = genererEtatRecettesDepenses(ecritures);
            etats.bilanMinimal = genererBilanMinimal(ecritures);
            etats.annexes = annexesMinimal(ecritures, {});
        }
        
        afficherEtatFinancier(etats);
        
        const companyName = window.app.currentCompanyName;
        const bilanHtml = `
            <div class="text-center"><h4 class="text-xl font-bold mb-4 text-primary">BILAN COMPTABLE PROVISOIRE</h4></div>
            ${etats.bilan || etats.bilanMinimal}
            <p class="mt-4 text-sm text-gray-500">Note: Ce bilan est basé sur des données et des calculs en cours d'intégration Odoo.</p>
        `;
        SYSCOHADAIntegrationManager.showModal(`Bilan SYSCOHADA - ${companyName}`, bilanHtml);

    } catch (e) {
        SYSCOHADAIntegrationManager.handleIntegrationError(e, 'Calcul des États Financiers');
        if (zoneRapports) zoneRapports.innerHTML = `<p class="text-danger font-bold p-10 bg-red-100 dark:bg-red-900 rounded-lg">Erreur: ${e.message}</p>`;
    }
}


// =================================================================================
// 3. GESTION DES VUES ET DU CONTEXTE
// =================================================================================

function renderLoginView() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('auth-view').classList.add('flex');
    document.getElementById('dashboard-view').classList.add('hidden');
    
    const loginFormContainer = document.getElementById('login-form-container');
    const registerView = document.getElementById('register-view');
    
    if (loginFormContainer) {
        loginFormContainer.classList.remove('hidden');
    }
    if (registerView) {
        registerView.classList.add('hidden');
        registerView.classList.remove('flex');
    }
    
    displayAuthMessage('login', '', 'none');
    displayAuthMessage('register', '', 'none');
}

function renderRegisterView() {
    const loginFormContainer = document.getElementById('login-form-container');
    const registerView = document.getElementById('register-view');
    
    if (loginFormContainer) {
        loginFormContainer.classList.add('hidden');
    }
    if (registerView) {
        registerView.classList.remove('hidden');
    }
    
    displayAuthMessage('login', '', 'none');
    displayAuthMessage('register', '', 'none');
}

function initDashboard(context) {
    window.userContext = context;

    window.app.currentCompanyId = context.entrepriseContextId;
    window.app.currentCompanyName = context.entrepriseContextName;

    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('flex');
    
    const registerView = document.getElementById('register-view');
    if (registerView) {
        registerView.classList.add('hidden');
        registerView.classList.remove('flex');
    }
    
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('flex');

    updateHeaderContext(context);
    updateNavigationMenu(context.utilisateurRole);
    loadView('dashboard');
}

function updateHeaderContext(context) {
    const firstName = context.utilisateurNom.split(' ')[0];
    
    const welcomeMsg = document.getElementById('welcome-message');
    const currentRole = document.getElementById('current-role');
    const companyNameElement = document.getElementById('current-company-name');
    const contextMessage = document.getElementById('context-message');
    const userAvatarText = document.getElementById('user-avatar-text');
    
    if (welcomeMsg) welcomeMsg.textContent = `Bienvenue, ${firstName}`;
    if (currentRole) currentRole.textContent = context.utilisateurRole;
    if (userAvatarText) userAvatarText.textContent = firstName.charAt(0).toUpperCase();
    
    const companyName = context.entrepriseContextName || '-- Global --';
    if (companyNameElement) companyNameElement.textContent = companyName;

    if (contextMessage) {
        if (context.multiEntreprise && !context.entrepriseContextId) {
            contextMessage.innerHTML = 'Contexte de travail actuel: <strong class="text-danger">AUCUNE SÉLECTIONNÉE</strong>. (Cliquez sur "Changer d\'Entreprise")';
        } else {
            contextMessage.innerHTML = `Contexte de travail actuel: <strong class="text-primary">${companyName}</strong>.`;
        }
    }
}

function updateNavigationMenu(role) {
    const navMenu = document.getElementById('role-navigation-menu');
    if (!navMenu) return;
    
    navMenu.innerHTML = '';

    let menuItems = [
        { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' }
    ];

    if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
        menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' });
    }

    if (window.userContext && window.userContext.entrepriseContextId) {
        menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
        if (role !== ROLES.CAISSIER) {
            menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
            menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
            menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
        }
    } else if (window.userContext && window.userContext.multiEntreprise) {
         menuItems.push({ name: 'Sélectionner Contexte', icon: 'fas fa-sync-alt', view: 'selector', isRequired: true });
    }

    if (role === ROLES.ADMIN) {
        menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
        menuItems.push({ name: 'Paramètres', icon: 'fas fa-cog', view: 'settings' });
    }

    if (window.userContext && window.userContext.multiEntreprise) {
        menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-building', view: 'selector' });
    }
    
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
        link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadView(item.view);
        });

        navMenu.appendChild(link);
    });
}

/**
 * Routage des vues selon le nom
 */
async function loadView(viewName) {
    const contentArea = document.getElementById('dashboard-content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="text-center p-8"><i class="loading-spinner mx-auto block"></i><p class="text-lg text-gray-500">Chargement...</p></div>';

    const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];

    if (requiresContext.includes(viewName) && window.userContext && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) {
        SYSCOHADAIntegrationManager.showNotification('warning', 'Action Bloquée', `Veuillez sélectionner une entreprise pour accéder à la vue "${viewName}".`);
        renderEnterpriseSelectorView(viewName);
        return; 
    }

    let htmlContent = ''; 

    switch (viewName) {
        case 'dashboard':
            htmlContent = await renderDashboard(window.userContext); 
            break;
        case 'selector':
            renderEnterpriseSelectorView();
            return; 
        case 'reports':
            htmlContent = renderReportsView(); 
            break;
        case 'saisie':
            htmlContent = renderSaisieFormCaissier();
            break;
        case 'journal-entry':
            htmlContent = renderJournalEntryForm();
            break;
        case 'create-company':
            htmlContent = renderCreateCompanyForm();
            break;
        case 'validation':
            htmlContent = renderValidationView();
            break;
        case 'user-management':
            htmlContent = renderUserManagementView();
            break;
        case 'settings':
            htmlContent = renderSettingsView();
            break;
        default:
            htmlContent = renderNotFound();
    }

    if (htmlContent) {
        contentArea.innerHTML = htmlContent;
        
        if (viewName === 'reports') {
            await initialiserRapportsEtSysteme(window.userContext);
            await genererEtatsFinanciers();
        }
        
        if (viewName === 'saisie') {
            initSaisieFormListeners();
        }
    }
}


/**
 * Affiche le sélecteur d'entreprise pour les rôles multi-entreprises
 */
async function renderEnterpriseSelectorView(blockedViewName = null) {
    const contentArea = document.getElementById('dashboard-content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="text-center p-8"><i class="loading-spinner mx-auto block"></i><p>Chargement des entreprises...</p></div>';

    try {
        const companies = await fetchUserCompanies(window.userContext);

        let companyListHTML = '';
        if (companies.length === 0) {
            companyListHTML = '<div class="p-6 text-center bg-yellow-100 bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée. Contactez l\'administrateur.</p></div>';
        } else {
            companyListHTML = companies.map(company => `
                <div class="company-card p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
                     data-company-id="${company.id}" data-company-name="${company.name}">
                    <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Statut: Actif</p>
                    ${company.stats ? `<p class="text-xs text-gray-500 mt-2">${company.stats.transactions || 0} transactions</p>` : ''}
                </div>
            `).join('');
        }

        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl fade-in">
                <h2 class="text-3xl font-extrabold text-primary mb-2">Sélectionner un Contexte d'Entreprise</h2>
                <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
                </p>
                <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${companyListHTML}
                </div>
                
                <div class="mt-8 text-center">
                    <button id="btn-global-context" class="text-secondary hover:text-primary font-medium">
                        <i class="fas fa-undo mr-1"></i> Revenir au Contexte Global
                    </button>
                </div>
            </div>
        `;

        contentArea.querySelectorAll('.company-card').forEach(element => {
            element.addEventListener('click', function() {
                const companyId = this.getAttribute('data-company-id');
                const companyName = this.getAttribute('data-company-name');
                changeCompanyContext(companyId, companyName); 
            });
        });
        
        document.getElementById('btn-global-context')?.addEventListener('click', () => {
            changeCompanyContext(null, '-- Global --');
        });

    } catch (error) {
        contentArea.innerHTML = renderErrorBox(`Impossible de charger les entreprises. ${error.message}`);
    }
}

function renderErrorBox(message) {
    return `
        <div class="max-w-4xl mx-auto p-8 bg-red-100 dark:bg-red-900 border-4 border-danger rounded-xl text-center fade-in">
            <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
            <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
            <p class="text-lg text-red-700 dark:text-red-300">${message}</p>
        </div>
    `;
}

function renderNotFound() {
    return `
        <div class="max-w-4xl mx-auto p-8 text-center fade-in">
            <i class="fas fa-search fa-4x text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-extrabold text-gray-500">Vue non trouvée</h2>
            <p class="text-gray-400">Cette fonctionnalité est en cours de développement.</p>
        </div>
    `;
}

async function renderDashboard(context) {
    if (!context) {
        return renderErrorBox('Contexte utilisateur non disponible.');
    }
    
    if (context.multiEntreprise && !context.entrepriseContextId) {
        await renderEnterpriseSelectorView(); 
        return null; 
    }
    
    const companyName = context.entrepriseContextName || 'Mon Entreprise';
    
    return `
        <div class="fade-in">
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Tableau de Bord : ${companyName}</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase">Chiffre d'Affaires</p>
                            <p class="text-2xl font-black text-primary">15.2M XOF</p>
                        </div>
                        <i class="fas fa-chart-line text-3xl text-primary/30"></i>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase">Résultat Net</p>
                            <p class="text-2xl font-black text-success">+2.8M XOF</p>
                        </div>
                        <i class="fas fa-trending-up text-3xl text-success/30"></i>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase">Opérations en Attente</p>
                            <p class="text-2xl font-black text-warning">12</p>
                        </div>
                        <i class="fas fa-clock text-3xl text-warning/30"></i>
                    </div>
                </div>
                
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase">Trésorerie</p>
                            <p class="text-2xl font-black text-info">8.9M XOF</p>
                        </div>
                        <i class="fas fa-wallet text-3xl text-info/30"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-primary bg-opacity-10 rounded-xl border-l-4 border-primary p-6">
                <p class="text-primary font-bold"><i class="fas fa-info-circle mr-2"></i> Bienvenue ${context.utilisateurNom}</p>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Rôle: <strong>${context.utilisateurRole}</strong>. Les statistiques affichées sont des données de démonstration. Connectez votre instance Odoo pour voir les données réelles.</p>
            </div>
        </div>
    `;
}


// =================================================================================
// 4. VUES MÉTIER
// =================================================================================

function renderSaisieFormCaissier() {
    return `
        <div class="max-w-3xl mx-auto fade-in">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 border-b-8 border-warning">
                <div class="flex justify-between items-center mb-10">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white">Saisie de Flux</h2>
                    <i class="fas fa-cash-register text-4xl text-warning/30"></i>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <button id="btn-recette" class="p-5 rounded-2xl border-2 border-success text-success font-black transition-all bg-success/5 hover:bg-success hover:text-white">
                        <i class="fas fa-arrow-down mr-2"></i> RECETTE
                    </button>
                    <button id="btn-depense" class="p-5 rounded-2xl border-2 border-danger text-danger font-black transition-all hover:bg-danger hover:text-white">
                        <i class="fas fa-arrow-up mr-2"></i> DÉPENSE
                    </button>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Nature de l'opération</label>
                        <input list="oper-list" id="cash-label" class="w-full p-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-lg shadow-inner" placeholder="Ex: Vente de marchandises...">
                        <datalist id="oper-list">
                            <option value="Vente de marchandises">
                            <option value="Prestation de service">
                            <option value="Achat fournitures">
                            <option value="Frais de transport">
                            <option value="Paiement salaire">
                            <option value="Règlement fournisseur">
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Montant (XOF)</label>
                        <input type="number" id="cash-val" class="w-full p-8 text-5xl font-black text-center text-primary bg-primary/5 rounded-3xl" placeholder="0" min="0">
                    </div>
                    
                    <input type="hidden" id="flux-type" value="RECETTE">
                    
                    <button id="btn-submit-flux" class="w-full py-6 bg-primary text-white text-xl font-black rounded-2xl shadow-xl hover:bg-primary-dark hover:scale-[1.01] transition-transform">
                        <i class="fas fa-check mr-2"></i> VALIDER LA SAISIE
                    </button>
                </div>
            </div>
        </div>
    `;
}

function initSaisieFormListeners() {
    const btnRecette = document.getElementById('btn-recette');
    const btnDepense = document.getElementById('btn-depense');
    const fluxTypeInput = document.getElementById('flux-type');
    const btnSubmit = document.getElementById('btn-submit-flux');
    
    if (btnRecette && btnDepense) {
        btnRecette.addEventListener('click', () => {
            fluxTypeInput.value = 'RECETTE';
            btnRecette.className = 'p-5 rounded-2xl border-2 border-success bg-success text-white font-black shadow-lg shadow-success/30';
            btnDepense.className = 'p-5 rounded-2xl border-2 border-danger text-danger font-black transition-all hover:bg-danger hover:text-white';
        });
        
        btnDepense.addEventListener('click', () => {
            fluxTypeInput.value = 'DEPENSE';
            btnDepense.className = 'p-5 rounded-2xl border-2 border-danger bg-danger text-white font-black shadow-lg shadow-danger/30';
            btnRecette.className = 'p-5 rounded-2xl border-2 border-success text-success font-black transition-all hover:bg-success hover:text-white';
        });
    }
    
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            const libelle = document.getElementById('cash-label').value.trim();
            const montant = document.getElementById('cash-val').value;
            const type = fluxTypeInput.value;
            
            if (!libelle) {
                showAlertModal('Champ requis', 'Veuillez saisir la nature de l\'opération.');
                return;
            }
            
            if (!montant || parseFloat(montant) <= 0) {
                showAlertModal('Montant invalide', 'Veuillez saisir un montant valide supérieur à 0.');
                return;
            }
            
            const data = {
                libelle,
                montant: parseFloat(montant),
                type,
                status: 'BROUILLON',
                companyId: window.app.currentCompanyId,
                date: new Date().toISOString()
            };
            
            console.log('[FLUX] Transmission vers Odoo...', data);
            
            // TODO: Envoyer vers l'API Odoo
            // await fetch(`${API_BASE_URL}/entries`, { method: 'POST', body: JSON.stringify(data) });
            
            showAlertModal('Opération enregistrée', `${type} de ${parseInt(montant).toLocaleString()} XOF enregistrée avec succès.\n\nEn attente de validation par le comptable.`);
            
            // Reset form
            document.getElementById('cash-label').value = '';
            document.getElementById('cash-val').value = '';
        });
    }
}

function renderJournalEntryForm() {
    return `
        <div class="fade-in">
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Saisie Écriture Journal</h2>
            <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <p class="text-gray-500 mb-6"><i class="fas fa-info-circle mr-2"></i> Entreprise : <strong class="text-primary">${window.app.currentCompanyName}</strong></p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Date</label>
                        <input type="date" id="journal-date" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Journal</label>
                        <select id="journal-type" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                            <option value="VT">Ventes (VT)</option>
                            <option value="AC">Achats (AC)</option>
                            <option value="BQ">Banque (BQ)</option>
                            <option value="CA">Caisse (CA)</option>
                            <option value="OD">Opérations Diverses (OD)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Référence</label>
                        <input type="text" id="journal-ref" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="FA-2024-001">
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="block text-xs font-black uppercase text-gray-400 mb-2">Libellé</label>
                    <input type="text" id="journal-libelle" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="Description de l'écriture...">
                </div>
                
                <div class="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-6">
                    <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-4">Lignes d'écriture</h4>
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-gray-500">
                                <th class="p-2">Compte</th>
                                <th class="p-2">Libellé</th>
                                <th class="p-2 text-right">Débit</th>
                                <th class="p-2 text-right">Crédit</th>
                            </tr>
                        </thead>
                        <tbody id="journal-lines">
                            <tr>
                                <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="411000"></td>
                                <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="Client X"></td>
                                <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
                                <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
                            </tr>
                            <tr>
                                <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="701000"></td>
                                <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="Vente"></td>
                                <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
                                <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <button class="w-full py-4 bg-success text-white font-bold rounded-xl hover:bg-green-600 transition">
                    <i class="fas fa-save mr-2"></i> Enregistrer l'écriture
                </button>
            </div>
        </div>
    `;
}

function renderCreateCompanyForm() {
    return `
        <div class="max-w-2xl mx-auto fade-in">
            <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-6"><i class="fas fa-building mr-2 text-primary"></i> Créer une Nouvelle Entreprise</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Dénomination Sociale *</label>
                        <input type="text" id="new-company-name" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="Ma Nouvelle Entreprise SARL">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-black uppercase text-gray-400 mb-2">Forme Juridique</label>
                            <select id="new-company-type" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                                <option value="SARL">SARL</option>
                                <option value="SA">SA</option>
                                <option value="SAS">SAS</option>
                                <option value="EI">Entreprise Individuelle</option>
                                <option value="GIE">GIE</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-black uppercase text-gray-400 mb-2">Régime Fiscal</label>
                            <select id="new-company-regime" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                                <option value="REEL_NORMAL">Réel Normal</option>
                                <option value="REEL_SIMPLIFIE">Réel Simplifié</option>
                                <option value="FORFAIT">Forfait</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Système Comptable SYSCOHADA</label>
                        <select id="new-company-systeme" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                            <option value="NORMAL">Système Normal (Complet)</option>
                            <option value="SMT">Système Minimal de Trésorerie (TPE)</option>
                        </select>
                    </div>
                    
                    <button id="btn-create-company" class="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition mt-6">
                        <i class="fas fa-plus-circle mr-2"></i> Créer l'entreprise dans Odoo
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderValidationView() {
    return `
        <div class="fade-in">
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Validation des Opérations</h2>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <p class="text-gray-500 mb-4">Entreprise : <strong class="text-primary">${window.app.currentCompanyName}</strong></p>
                <div class="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
                    <p class="text-warning font-bold"><i class="fas fa-hourglass-half mr-2"></i> 12 opérations en attente de validation</p>
                </div>
                <p class="text-sm text-gray-400 mt-4">Les opérations saisies par les caissiers apparaîtront ici pour validation par le comptable.</p>
            </div>
        </div>
    `;
}

function renderUserManagementView() {
    return `
        <div class="fade-in">
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Gestion des Utilisateurs</h2>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <p class="text-gray-500 mb-4">Gérez les accès et les rôles des utilisateurs de votre organisation.</p>
                <p class="text-sm text-gray-400">Fonctionnalité en cours d'intégration avec Odoo (res.users).</p>
            </div>
        </div>
    `;
}

function renderSettingsView() {
    return `
        <div class="fade-in">
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Paramètres</h2>
            <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Système de Reporting</label>
                        <select id="set-systeme" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                            <option value="NORMAL">SYSTÈME NORMAL (Complet)</option>
                            <option value="SMT">SYSTÈME MINIMAL (SMT)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Date de Clôture Exercice</label>
                        <input type="date" id="set-cloture" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                    </div>
                </div>
                <button class="mt-8 bg-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:bg-primary-dark transition-all">
                    <i class="fas fa-save mr-2"></i> SAUVEGARDER LES PARAMÈTRES
                </button>
            </div>
        </div>
    `;
}


// =================================================================================
// 5. RENDU DE LA VUE REPORTS
// =================================================================================

function renderReportsView() {
    const currentCompany = window.app.currentCompanyName || "AUCUNE ENTREPRISE SÉLECTIONNÉE";

    return `
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Générer les États Financiers SYSCOHADA</h2>
        
        <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-inner mb-6 fade-in">
            <h3 class="text-xl font-bold mb-4 text-primary">Options de Rapport pour : ${currentCompany}</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="report-controls">
                ${window.userContext && window.userContext.multiEntreprise ? `
                <div class="mb-4">
                  <label for="entreprise" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sélectionner l'entreprise :</label>
                  <select id="entreprise" class="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"></select>
                </div>
                ` : `<input type="hidden" id="entreprise" value="${window.app.currentCompanyId}">`}

                <div class="mb-4">
                  <label for="systeme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Choisir le système comptable :</label>
                  <select id="systeme" class="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg">
                    <option value="normal" ${window.app.currentSysteme === 'normal' || window.app.currentSysteme === 'NORMAL' ? 'selected' : ''}>Système normal</option>
                    <option value="minimal" ${window.app.currentSysteme === 'minimal' || window.app.currentSysteme === 'SMT' ? 'selected' : ''}>Système minimal de trésorerie</option>
                  </select>
                </div>
            </div>
            
            <button id="generer-rapport" class="w-full mt-4 bg-success hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md">
                <i class="fas fa-calculator mr-2"></i> Générer les États Financiers
            </button>
        </div>
        
        <div id="etat-financier" class="mt-8">
            <p class="text-center text-gray-500 p-10">Les états financiers seront affichés ici, et le Bilan s'ouvrira dans une modale.</p>
        </div>
    `;
}

async function initialiserRapportsEtSysteme(context) {
    const selectEntreprise = document.getElementById('entreprise');
    const selectSysteme = document.getElementById('systeme');
    const btnGenerer = document.getElementById('generer-rapport');

    if (context.multiEntreprise && selectEntreprise && selectEntreprise.tagName === 'SELECT') {
        selectEntreprise.innerHTML = '';
        const companies = await fetchUserCompanies(context);
        
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === context.entrepriseContextId) {
                option.selected = true;
            }
            selectEntreprise.appendChild(option);
        });

        selectEntreprise.addEventListener('change', async function() {
            const newId = this.value;
            const newName = this.options[this.selectedIndex].text;
            await changeCompanyContext(newId, newName); 
            
            if (document.getElementById('etat-financier')) {
                await genererEtatsFinanciers();
            }
        });
    }

    if (selectSysteme) {
        selectSysteme.addEventListener('change', async function() {
            window.app.currentSysteme = this.value;
            SYSCOHADAIntegrationManager.showNotification('info', 'Système Changé', `Calcul basé sur le Système ${this.value.toUpperCase()}.`);
            await genererEtatsFinanciers();
        });
    }
    
    if (btnGenerer) {
        btnGenerer.addEventListener('click', genererEtatsFinanciers);
    }
}


// =================================================================================
// 6. EXTENSIONS DOUKÈ PRO V1.4 - MODULES EXPERTS
// =================================================================================

const DoukeExpert = {
    currentFluxType: 'RECETTE',
    
    renderSettings: function(companyData) {
        const contentArea = document.getElementById('dashboard-content-area');
        if(!contentArea) return;
        
        contentArea.innerHTML = `
        <div class="fade-in space-y-6">
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-l-8 border-primary">
                <h2 class="text-2xl font-black mb-6"><i class="fas fa-cog mr-3 text-primary"></i>Configuration Expert</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Système de Reporting</label>
                        <select id="set-systeme" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-primary">
                            <option value="NORMAL" ${companyData?.systeme === 'NORMAL' ? 'selected' : ''}>SYSTÈME NORMAL (Complet)</option>
                            <option value="SMT" ${companyData?.systeme === 'SMT' ? 'selected' : ''}>SYSTÈME MINIMAL (SMT)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase text-gray-400 mb-2">Clôture Exercice</label>
                        <input type="date" id="set-cloture" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
                    </div>
                </div>
                <button onclick="DoukeExpert.saveSettings()" class="mt-8 bg-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:bg-primary-dark transition-all">
                    METTRE À JOUR LE RÉGIME
                </button>
            </div>
        </div>`;
    },

    renderCashier: function() {
        const contentArea = document.getElementById('dashboard-content-area');
        if(!contentArea) return;
        
        contentArea.innerHTML = renderSaisieFormCaissier();
        initSaisieFormListeners();
    },

    setType: function(type) {
        this.currentFluxType = type;
    },

    submitEntry: async function() {
        const data = {
            libelle: document.getElementById('cash-label')?.value || '',
            montant: document.getElementById('cash-val')?.value || 0,
            type: this.currentFluxType,
            status: 'BROUILLON'
        };
        
        console.log("[ODOO] Transmission vers Odoo (account.move)...", data);
        showAlertModal('Enregistré', 'Opération enregistrée. En attente de validation par le comptable.');
    },

    saveSettings: async function() {
        const systeme = document.getElementById('set-systeme')?.value;
        showAlertModal('Paramètres', `Changement de régime : ${systeme}. Le moteur de Bilan va s'adapter.`);
    }
};

function routeToModule(moduleName) {
    if(moduleName === 'settings') DoukeExpert.renderSettings();
    if(moduleName === 'cashier') DoukeExpert.renderCashier();
}


// =================================================================================
// 7. INITIALISATION ET GESTION DES ÉVÉNEMENTS
// =================================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Fermeture de la modale professionnelle
    document.getElementById('modal-close-btn')?.addEventListener('click', ModalManager.hide);
    
    // =========================================================================
    // GESTION DU FORMULAIRE DE CONNEXION
    // =========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            displayAuthMessage('login', 'Connexion en cours...', 'info');

            try {
                const context = await handleLogin(email, password);
                displayAuthMessage('login', `Connexion réussie! Bienvenue, ${context.utilisateurNom}.`, 'success');
                
                setTimeout(() => {
                    initDashboard(context);
                }, 1500); 

            } catch (error) {
                displayAuthMessage('login', error.message, 'danger');
            }
        });
    }
    
    // =========================================================================
    // GESTION DU FORMULAIRE D'INSCRIPTION
    // =========================================================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const companyName = document.getElementById('reg-company').value || 'Ma Nouvelle Entreprise';
            
            const payload = { username, email, password, companyName };

            displayAuthMessage('register', 'Inscription en cours...', 'info');

            try {
                const context = await handleRegistration(payload);
                
                displayAuthMessage('register', `Inscription réussie! Veuillez vous connecter avec vos identifiants.`, 'success');
                
                setTimeout(() => {
                    renderLoginView();
                    document.getElementById('email').value = email;
                }, 2000); 

            } catch (error) {
                displayAuthMessage('register', error.message, 'danger');
            }
        });
    }
    
    // =========================================================================
    // NAVIGATION ENTRE LOGIN ET REGISTER
    // =========================================================================
    document.getElementById('show-register-btn')?.addEventListener('click', renderRegisterView);
    document.getElementById('show-login-btn')?.addEventListener('click', renderLoginView);

    // =========================================================================
    // BOUTON DE DÉCONNEXION (Utilise showConfirmModal au lieu de confirm())
    // =========================================================================
    document.getElementById('logout-btn')?.addEventListener('click', function() {
        showConfirmModal(
            'Confirmation de déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            () => {
                // Callback de confirmation
                window.userContext = null;
                window.app.currentCompanyId = null;
                window.app.currentCompanyName = null;
                window.app.filteredData.entries = [];
                window.cacheManager.clearCache();
                
                renderLoginView();
                SYSCOHADAIntegrationManager.showNotification('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.', 3000);
            }
        );
    });

    // =========================================================================
    // INITIALISATION : Afficher la vue de connexion
    // =========================================================================
    renderLoginView();
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║      🚀 DOUKÈ COMPTA PRO v1.4 - Frontend Initialisé       ║');
    console.log('║      📡 API: ' + API_BASE_URL.padEnd(43) + '║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
});

