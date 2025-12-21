+    1 /**
+    2  * =================================================================================
+    3  * DOUKÈ PRO - ERP COMPTABLE CLOUD
+    4  * FICHIER : assets/script.js
+    5  * VERSION : PROFESSIONNELLE V2.0 - Fusion SYSCOHADA Manager & Moteur Opérationnel
+    6  * Description : Logique complète avec authentification, gestion multi-entreprise,
+    7  *               et moteur SYSCOHADA Révisé 100% opérationnel
+    8  * =================================================================================
+    9  */
+   10 
+   11 // =================================================================================
+   12 // 0. ARCHITECTURE & SÉCURITÉ : MANAGERS UNIFIÉS
+   13 // =================================================================================
+   14 
+   15 /**
+   16  * Gestionnaire d'affichage des notifications temporaires.
+   17  */
+   18 const NotificationManager = {
+   19     show: (type, title, message, duration = 5000) => {
+   20         const zone = document.getElementById('notification-zone');
+   21         if (!zone) {
+   22             console.warn(`[NOTIF] ${title} (${type}): ${message}`);
+   23             return;
+   24         }
+   25 
+   26         const typeColors = {
+   27             success: 'bg-success border-success-dark',
+   28             danger: 'bg-danger border-danger-dark',
+   29             warning: 'bg-warning border-warning-dark',
+   30             info: 'bg-info border-info-dark'
+   31         };
+   32         const typeIcons = {
+   33             success: 'fas fa-check-circle',
+   34             danger: 'fas fa-times-circle',
+   35             warning: 'fas fa-exclamation-triangle',
+   36             info: 'fas fa-info-circle'
+   37         };
+   38 
+   39         const colorMap = {
+   40             success: 'green',
+   41             danger: 'red',
+   42             warning: 'yellow',
+   43             info: 'blue'
+   44         };
+   45 
+   46         const html = `
+   47             <div class="notification p-4 bg-white dark:bg-gray-700 rounded-lg shadow-xl border-l-4 border-${colorMap[type]}-500 fade-in" role="alert">
+   48                 <div class="flex items-center">
+   49                     <i class="${typeIcons[type]} text-${colorMap[type]}-500 mr-3"></i>
+   50                     <div>
+   51                         <p class="font-bold text-gray-900 dark:text-white">${title}</p>
+   52                         <p class="text-sm text-gray-700 dark:text-gray-300">${message}</p>
+   53                     </div>
+   54                 </div>
+   55             </div>
+   56         `;
+   57 
+   58         const element = document.createElement('div');
+   59         element.innerHTML = html.trim();
+   60         const notif = element.firstChild;
+   61         zone.prepend(notif);
+   62 
+   63         setTimeout(() => {
+   64             notif.style.opacity = '0';
+   65             notif.style.transform = 'translateX(100%)';
+   66             notif.style.transition = 'all 0.3s ease-out';
+   67             setTimeout(() => notif.remove(), 300);
+   68         }, duration);
+   69     }
+   70 };
+   71 
+   72 /**
+   73  * Gestionnaire d'affichage de la modale professionnelle (pour les rapports).
+   74  */
+   75 const ModalManager = {
+   76     show: (title, content, subtitle = 'SYSCOHADA Révisé - Système Normal') => {
+   77         const modal = document.getElementById('professional-modal');
+   78         const modalTitle = document.getElementById('modal-title');
+   79         const modalSubtitle = document.getElementById('modal-subtitle');
+   80         const modalBody = document.getElementById('modal-body');
+   81         const modalCloseBtn = document.getElementById('modal-close-btn');
+   82 
+   83         if (!modal || !modalTitle || !modalBody) return;
+   84 
+   85         modalTitle.textContent = title;
+   86         if (modalSubtitle) modalSubtitle.textContent = subtitle;
+   87         modalBody.innerHTML = content;
+   88         document.body.classList.add('modal-open');
+   89 
+   90         const closeHandler = () => ModalManager.hide();
+   91         modalCloseBtn.onclick = closeHandler;
+   92         modal.onclick = (e) => {
+   93             if (e.target === modal) closeHandler();
+   94         };
+   95     },
+   96     hide: () => {
+   97         document.body.classList.remove('modal-open');
+   98     }
+   99 };
+  100 
+  101 // =================================================================================
+  102 // 0.3. UTILITAIRES : MODALES DE CONFIRMATION ET PROMPT (Remplacent confirm/prompt/alert)
+  103 // =================================================================================
+  104 
+  105 /**
+  106  * Affiche une modale de confirmation personnalisée (remplace confirm())
+  107  */
+  108 function showConfirmModal(title, message, onConfirm, onCancel = null) {
+  109     const existingModal = document.getElementById('confirm-modal-overlay');
+  110     if (existingModal) existingModal.remove();
+  111 
+  112     const modal = document.createElement('div');
+  113     modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
+  114     modal.id = 'confirm-modal-overlay';
+  115     
+  116     modal.innerHTML = `
+  117         <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
+  118             <div class="text-center mb-6">
+  119                 <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
+  120                     <i class="fas fa-exclamation-triangle text-warning text-2xl"></i>
+  121                 </div>
+  122                 <h3 class="text-xl font-black text-gray-900 dark:text-white">${title}</h3>
+  123                 <p class="text-gray-600 dark:text-gray-400 mt-2">${message}</p>
+  124             </div>
+  125             <div class="flex space-x-4">
+  126                 <button id="confirm-modal-cancel" class="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
+  127                     Annuler
+  128                 </button>
+  129                 <button id="confirm-modal-ok" class="flex-1 py-3 px-4 bg-danger text-white font-bold rounded-xl hover:bg-red-600 transition">
+  130                     Confirmer
+  131                 </button>
+  132             </div>
+  133         </div>
+  134     `;
+  135     
+  136     document.body.appendChild(modal);
+  137     
+  138     document.getElementById('confirm-modal-cancel').addEventListener('click', () => {
+  139         modal.remove();
+  140         if (onCancel) onCancel();
+  141     });
+  142     
+  143     document.getElementById('confirm-modal-ok').addEventListener('click', () => {
+  144         modal.remove();
+  145         if (onConfirm) onConfirm();
+  146     });
+  147     
+  148     modal.addEventListener('click', (e) => {
+  149         if (e.target === modal) {
+  150             modal.remove();
+  151             if (onCancel) onCancel();
+  152         }
+  153     });
+  154 }
+  155 
+  156 /**
+  157  * Affiche une modale de saisie personnalisée (remplace prompt())
+  158  */
+  159 function showPromptModal(title, placeholder, onConfirm, onCancel = null, defaultValue = '') {
+  160     const existingModal = document.getElementById('prompt-modal-overlay');
+  161     if (existingModal) existingModal.remove();
+  162 
+  163     const modal = document.createElement('div');
+  164     modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
+  165     modal.id = 'prompt-modal-overlay';
+  166     
+  167     modal.innerHTML = `
+  168         <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
+  169             <div class="mb-6">
+  170                 <h3 class="text-xl font-black text-gray-900 dark:text-white mb-4">${title}</h3>
+  171                 <input type="text" id="prompt-modal-input" 
+  172                        class="w-full p-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
+  173                        placeholder="${placeholder}" 
+  174                        value="${defaultValue}">
+  175             </div>
+  176             <div class="flex space-x-4">
+  177                 <button id="prompt-modal-cancel" class="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
+  178                     Annuler
+  179                 </button>
+  180                 <button id="prompt-modal-ok" class="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition">
+  181                     Valider
+  182                 </button>
+  183             </div>
+  184         </div>
+  185     `;
+  186     
+  187     document.body.appendChild(modal);
+  188     
+  189     const input = document.getElementById('prompt-modal-input');
+  190     input.focus();
+  191     input.select();
+  192     
+  193     const handleConfirm = () => {
+  194         const value = input.value.trim();
+  195         modal.remove();
+  196         if (onConfirm) onConfirm(value);
+  197     };
+  198     
+  199     document.getElementById('prompt-modal-cancel').addEventListener('click', () => {
+  200         modal.remove();
+  201         if (onCancel) onCancel();
+  202     });
+  203     
+  204     document.getElementById('prompt-modal-ok').addEventListener('click', handleConfirm);
+  205     
+  206     input.addEventListener('keypress', (e) => {
+  207         if (e.key === 'Enter') handleConfirm();
+  208     });
+  209     
+  210     modal.addEventListener('click', (e) => {
+  211         if (e.target === modal) {
+  212             modal.remove();
+  213             if (onCancel) onCancel();
+  214         }
+  215     });
+  216 }
+  217 
+  218 /**
+  219  * Affiche une alerte personnalisée (remplace alert())
+  220  */
+  221 function showAlertModal(title, message, onClose = null) {
+  222     const existingModal = document.getElementById('alert-modal-overlay');
+  223     if (existingModal) existingModal.remove();
+  224 
+  225     const modal = document.createElement('div');
+  226     modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] fade-in';
+  227     modal.id = 'alert-modal-overlay';
+  228     
+  229     modal.innerHTML = `
+  230         <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-100">
+  231             <div class="text-center mb-6">
+  232                 <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
+  233                     <i class="fas fa-info-circle text-info text-2xl"></i>
+  234                 </div>
+  235                 <h3 class="text-xl font-black text-gray-900 dark:text-white">${title}</h3>
+  236                 <p class="text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">${message}</p>
+  237             </div>
+  238             <button id="alert-modal-ok" class="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition">
+  239                 OK
+  240             </button>
+  241         </div>
+  242     `;
+  243     
+  244     document.body.appendChild(modal);
+  245     
+  246     const closeModal = () => {
+  247         modal.remove();
+  248         if (onClose) onClose();
+  249     };
+  250     
+  251     document.getElementById('alert-modal-ok').addEventListener('click', closeModal);
+  252     
+  253     modal.addEventListener('click', (e) => {
+  254         if (e.target === modal) closeModal();
+  255     });
+  256 }
+  257 
+  258 // =================================================================================
+  259 // 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
+  260 // =================================================================================
+  261 
+  262 const RENDER_BACKEND_URL = 'https://douke-compta-pro.onrender.com';
+  263 const LOCAL_BACKEND_URL = 'http://localhost:3000';
+  264 
+  265 let API_BASE_URL;
+  266 if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.host.endsWith('-3000.app.github.dev')) {
+  267     API_BASE_URL = LOCAL_BACKEND_URL + '/api';
+  268 } else {
+  269     API_BASE_URL = RENDER_BACKEND_URL + '/api';
+  270 }
+  271 
+  272 console.log(`[ENV DEBUG] API_BASE_URL utilisée: ${API_BASE_URL}`);
+  273 
+  274 const ROLES = {
+  275     ADMIN: 'ADMIN',
+  276     COLLABORATEUR: 'COLLABORATEUR',
+  277     CHEF: 'CHEF',
+  278     COMPTABLE: 'COMPTABLE',
+  279     CAISSIER: 'CAISSIER',
+  280     USER: 'USER'
+  281 };
+  282 
+  283 const CACHE_LIFETIME_MS = 300000; // 5 minutes
+  284 
+  285 // =================================================================================
+  286 // 1.5. SERVICES TECHNIQUES : CACHE MANAGER
+  287 // =================================================================================
+  288 
+  289 class CacheManager {
+  290     constructor() {
+  291         this.cache = new Map();
+  292     }
+  293 
+  294     getCached(key) {
+  295         if (this.cache.has(key)) {
+  296             const entry = this.cache.get(key);
+  297             if (Date.now() < entry.expiry) {
+  298                 return entry.data;
+  299             } else {
+  300                 this.cache.delete(key);
+  301             }
+  302         }
+  303         return null;
+  304     }
+  305 
+  306     setCached(key, data, lifetimeMs = CACHE_LIFETIME_MS) {
+  307         const expiry = Date.now() + lifetimeMs;
+  308         this.cache.set(key, { data, expiry });
+  309     }
+  310     
+  311     clearCache(prefix = null) {
+  312         if (!prefix) {
+  313             this.cache.clear();
+  314             console.log('[CACHE CLEAR] Cache complet vidé.');
+  315             return;
+  316         }
+  317         
+  318         for (const key of this.cache.keys()) {
+  319             if (key.startsWith(prefix)) {
+  320                 this.cache.delete(key);
+  321             }
+  322         }
+  323     }
+  324 }
+  325 
+  326 // =================================================================================
+  327 // 2. MOTEUR PRINCIPAL DOUKÈ PRO - APPLICATION SINGLETON
+  328 // =================================================================================
+  329 
+  330 const DoukeApp = {
+  331     // -------------------------------------------------------------------------
+  332     // 2.1. ÉTAT GLOBAL CENTRALISÉ
+  333     // -------------------------------------------------------------------------
+  334     state: {
+  335         user: null,
+  336         token: null,
+  337         activeCompany: null,
+  338         allCompanies: [],
+  339         currentView: 'dashboard',
+  340         fiscalYear: new Date().getFullYear(),
+  341         currentSysteme: 'NORMAL',
+  342         filteredData: {
+  343             entries: [],
+  344             accounts: []
+  345         }
+  346     },
+  347 
+  348     cacheManager: new CacheManager(),
+  349 
+  350     // -------------------------------------------------------------------------
+  351     // 2.2. INITIALISATION DU MOTEUR
+  352     // -------------------------------------------------------------------------
+  353     async init() {
+  354         console.log("🚀 Lancement du moteur DOUKÈ PRO v2.0...");
+  355         
+  356         // Vérifier si un utilisateur est déjà connecté (session persistante)
+  357         const storedUser = localStorage.getItem('user');
+  358         const storedToken = localStorage.getItem('token');
+  359         
+  360         if (storedUser && storedToken) {
+  361             try {
+  362                 this.state.user = JSON.parse(storedUser);
+  363                 this.state.token = storedToken;
+  364                 
+  365                 // Restaurer le contexte entreprise si disponible
+  366                 const storedCompany = localStorage.getItem('activeCompany');
+  367                 if (storedCompany) {
+  368                     this.state.activeCompany = JSON.parse(storedCompany);
+  369                 }
+  370                 
+  371                 await this.loadInitialData();
+  372                 this.renderDashboard();
+  373             } catch (e) {
+  374                 console.error("Erreur de restauration de session:", e);
+  375                 this.clearSession();
+  376                 this.renderLoginView();
+  377             }
+  378         } else {
+  379             this.renderLoginView();
+  380         }
+  381         
+  382         this.setupEventListeners();
+  383     },
+  384 
+  385     // -------------------------------------------------------------------------
+  386     // 2.3. GESTION DE L'AUTHENTIFICATION
+  387     // -------------------------------------------------------------------------
+  388     async handleLogin(email, password) {
+  389         const endpoint = `${API_BASE_URL}/auth/login`;
+  390         
+  391         try {
+  392             const response = await fetch(endpoint, {
+  393                 method: 'POST',
+  394                 headers: { 'Content-Type': 'application/json' },
+  395                 body: JSON.stringify({ email, password })
+  396             });
+  397             
+  398             const responseText = await response.text();
+  399             let data;
+  400 
+  401             try {
+  402                 data = JSON.parse(responseText);
+  403             } catch (e) {
+  404                 console.error('❌ Réponse API non-JSON ou malformée:', responseText.substring(0, 100) + '...');
+  405                 if (!response.ok) {
+  406                     throw new Error(`Erreur du serveur (${response.status})`);
+  407                 }
+  408                 throw new Error('Réponse du serveur non valide.');
+  409             }
+  410 
+  411             if (response.ok) {
+  412                 console.log('✅ Connexion réussie:', data.utilisateurRole);
+  413                 return {
+  414                     utilisateurRole: data.utilisateurRole || data.role || 'USER',
+  415                     utilisateurId: data.utilisateurId || data.id,
+  416                     utilisateurNom: data.utilisateurNom || data.name || email.split('@')[0],
+  417                     token: data.token,
+  418                     entrepriseContextId: data.entrepriseContextId || null,
+  419                     entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
+  420                     multiEntreprise: data.multiEntreprise || false
+  421                 };
+  422             } else {
+  423                 throw new Error(data.error || 'Identifiants invalides');
+  424             }
+  425 
+  426         } catch (error) {
+  427             let errorMessage = 'Erreur réseau: Serveur injoignable.';
+  428             if (!error.message.includes('fetch') && error.message) {
+  429                 errorMessage = error.message;
+  430             }
+  431             console.error('❌ Erreur lors de la connexion:', errorMessage);
+  432             throw new Error(errorMessage);
+  433         }
+  434     },
+  435 
+  436     async handleRegistration(payload) {
+  437         const endpoint = `${API_BASE_URL}/auth/register`;
+  438         
+  439         try {
+  440             const response = await fetch(endpoint, {
+  441                 method: 'POST',
+  442                 headers: { 'Content-Type': 'application/json' },
+  443                 body: JSON.stringify(payload)
+  444             });
+  445             
+  446             const responseText = await response.text();
+  447             let data;
+  448             
+  449             try { 
+  450                 data = JSON.parse(responseText); 
+  451             } catch (e) {
+  452                 if (!response.ok) {
+  453                     throw new Error(`Erreur Serveur ${response.status}: L'endpoint d'inscription a échoué.`);
+  454                 }
+  455                 throw new Error(`Réponse API non valide (JSON malformé).`); 
+  456             }
+  457 
+  458             if (response.ok) {
+  459                 return {
+  460                     utilisateurRole: data.utilisateurRole || data.role || 'USER',
+  461                     utilisateurId: data.utilisateurId || data.id,
+  462                     utilisateurNom: data.utilisateurNom || data.name,
+  463                     token: data.token,
+  464                     entrepriseContextId: data.entrepriseContextId || null,
+  465                     entrepriseContextName: data.entrepriseContextName || payload.companyName || 'Mon Entreprise',
+  466                     multiEntreprise: data.multiEntreprise || false
+  467                 };
+  468             } else {
+  469                 throw new Error(data.error || 'Erreur d\'inscription inconnue');
+  470             }
+  471         } catch (error) {
+  472             console.error('❌ Erreur lors de l\'inscription:', error.message);
+  473             throw new Error(error.message);
+  474         }
+  475     },
+  476 
+  477     saveSession(userContext) {
+  478         this.state.user = {
+  479             id: userContext.utilisateurId,
+  480             name: userContext.utilisateurNom,
+  481             role: userContext.utilisateurRole,
+  482             multiEntreprise: userContext.multiEntreprise
+  483         };
+  484         this.state.token = userContext.token;
+  485         
+  486         if (userContext.entrepriseContextId) {
+  487             this.state.activeCompany = {
+  488                 id: userContext.entrepriseContextId,
+  489                 name: userContext.entrepriseContextName
+  490             };
+  491             localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
+  492         }
+  493         
+  494         localStorage.setItem('user', JSON.stringify(this.state.user));
+  495         localStorage.setItem('token', this.state.token);
+  496     },
+  497 
+  498     clearSession() {
+  499         this.state.user = null;
+  500         this.state.token = null;
+  501         this.state.activeCompany = null;
+  502         this.state.allCompanies = [];
+  503         this.state.filteredData = { entries: [], accounts: [] };
+  504         this.cacheManager.clearCache();
+  505         localStorage.clear();
+  506     },
+  507 
+  508     logout() {
+  509         showConfirmModal(
+  510             'Déconnexion',
+  511             'Êtes-vous sûr de vouloir vous déconnecter ?',
+  512             () => {
+  513                 this.clearSession();
+  514                 location.reload();
+  515             }
+  516         );
+  517     },
+  518 
+  519     // -------------------------------------------------------------------------
+  520     // 2.4. MOTEUR DE DONNÉES (DATA ENGINE)
+  521     // -------------------------------------------------------------------------
+  522     async loadInitialData() {
+  523         try {
+  524             const role = this.state.user.role;
+  525             const endpoint = (role === 'ADMIN') ? '/api/companies/all' : '/api/companies/list';
+  526             this.state.allCompanies = await this.fetchUserCompanies();
+  527             
+  528             if (this.state.allCompanies.length > 0 && !this.state.activeCompany) {
+  529                 this.state.activeCompany = this.state.allCompanies[0];
+  530                 localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
+  531             }
+  532         } catch (e) {
+  533             console.error("Erreur de chargement des données", e);
+  534         }
+  535     },
+  536 
+  537     async fetchUserCompanies() {
+  538         if (!this.state.user || !this.state.token) return [];
+  539         
+  540         const cacheKey = `companies_${this.state.user.id}`;
+  541         const cachedData = this.cacheManager.getCached(cacheKey);
+  542         if (cachedData) return cachedData;
+  543 
+  544         const endpoint = `${API_BASE_URL}/companies/list`;
+  545         
+  546         try {
+  547             const response = await fetch(endpoint, {
+  548                 method: 'GET',
+  549                 headers: { 
+  550                     'Content-Type': 'application/json',
+  551                     'Authorization': `Bearer ${this.state.token}`
+  552                 }
+  553             });
+  554 
+  555             if (response.ok) {
+  556                 const data = await response.json();
+  557                 if (data.companies && Array.isArray(data.companies)) {
+  558                     this.cacheManager.setCached(cacheKey, data.companies);
+  559                     return data.companies;
+  560                 }
+  561             }
+  562         } catch (error) {
+  563             console.warn('⚠️ Erreur réseau companies. Utilisation données MOCK.');
+  564         }
+  565         
+  566         // Données MOCK
+  567         const mockCompanies = [
+  568             { id: 'ENT_001', name: 'Alpha Solutions', stats: { transactions: 450, result: 15000000, pending: 12, cash: 8900000 } },
+  569             { id: 'ENT_002', name: 'Beta Consulting', stats: { transactions: 120, result: 2500000, pending: 5, cash: 1200000 } },
+  570             { id: 'ENT_003', name: 'Gama Holding', stats: { transactions: 880, result: 45000000, pending: 30, cash: 25000000 } }
+  571         ];
+  572         
+  573         this.cacheManager.setCached(cacheKey, mockCompanies);
+  574         NotificationManager.show('warning', 'Mode Démonstration', 'Les données des entreprises sont simulées.', 3000);
+  575 
+  576         return mockCompanies;
+  577     },
+  578 
+  579     async fetchCompanyEntries(companyId) {
+  580         if (!companyId || !this.state.token) {
+  581             throw new Error('Company ID et Token sont requis pour récupérer les écritures.');
+  582         }
+  583         
+  584         const cacheKey = `entries_${companyId}`;
+  585         const cachedData = this.cacheManager.getCached(cacheKey);
+  586         if (cachedData) {
+  587             this.state.filteredData.entries = cachedData;
+  588             return cachedData;
+  589         }
+  590 
+  591         const endpoint = `${API_BASE_URL}/entries/${companyId}`;
+  592         
+  593         try {
+  594             const response = await fetch(endpoint, {
+  595                 method: 'GET',
+  596                 headers: { 
+  597                     'Content-Type': 'application/json',
+  598                     'Authorization': `Bearer ${this.state.token}`
+  599                 }
+  600             });
+  601 
+  602             if (response.status === 404 || response.status === 401 || !response.ok) {
+  603                 console.warn(`⚠️ API entries non disponible (Status: ${response.status}). Utilisation données MOCK.`);
+  604                 const mockEntries = this.generateMockEntries(companyId);
+  605                 this.cacheManager.setCached(cacheKey, mockEntries);
+  606                 this.state.filteredData.entries = mockEntries;
+  607                 return mockEntries;
+  608             }
+  609 
+  610             const data = await response.json();
+  611 
+  612             if (Array.isArray(data)) {
+  613                 this.cacheManager.setCached(cacheKey, data);
+  614                 this.state.filteredData.entries = data;
+  615                 return data;
+  616             } else {
+  617                 throw new Error(data.error || 'Format de données invalide.');
+  618             }
+  619         } catch (error) {
+  620             console.error('❌ ERREUR RÉSEAU (fetchCompanyEntries). Fallback MOCK:', error);
+  621             const mockEntries = this.generateMockEntries(companyId);
+  622             this.cacheManager.setCached(cacheKey, mockEntries);
+  623             this.state.filteredData.entries = mockEntries;
+  624             return mockEntries;
+  625         }
+  626     },
+  627 
+  628     generateMockEntries(companyId) {
+  629         const entries = [
+  630             { date: '2024-01-01', libelle: 'Solde Initial Banque', compteD: 52100000, compteC: 10100000, montant: 20000000 },
+  631             { date: '2024-01-05', libelle: 'Vente Client A', compteD: 41100000, compteC: 70100000, montant: 10000000 },
+  632             { date: '2024-01-05', libelle: 'TVA Vente', compteD: 41100000, compteC: 44300000, montant: 1800000 },
+  633             { date: '2024-01-10', libelle: 'Achat Fournisseur B', compteD: 60100000, compteC: 40100000, montant: 4000000 },
+  634             { date: '2024-01-10', libelle: 'TVA Achat', compteD: 44500000, compteC: 40100000, montant: 720000 },
+  635             { date: '2024-01-15', libelle: 'Salaire', compteD: 66100000, compteC: 52100000, montant: 3000000 },
+  636             { date: '2024-02-01', libelle: 'Encaissement Client A', compteD: 52100000, compteC: 41100000, montant: 11800000 },
+  637             { date: '2024-02-20', libelle: 'Loyer', compteD: 62100000, compteC: 52100000, montant: 1500000 },
+  638         ];
+  639 
+  640         console.log(`[MOCK Data] ${entries.length} écritures générées pour ${companyId}.`);
+  641         return entries;
+  642     },
+  643 
+  644     async apiFetch(endpoint, options = {}) {
+  645         const defaultOptions = {
+  646             headers: {
+  647                 'Authorization': `Bearer ${this.state.token}`,
+  648                 'Content-Type': 'application/json'
+  649             }
+  650         };
+  651         
+  652         const response = await fetch(API_BASE_URL + endpoint, { ...defaultOptions, ...options });
+  653         
+  654         if (response.status === 401) {
+  655             NotificationManager.show('danger', 'Session Expirée', 'Veuillez vous reconnecter.');
+  656             this.clearSession();
+  657             this.renderLoginView();
+  658             throw new Error('Session expirée');
+  659         }
+  660         
+  661         return await response.json();
+  662     },
+  663 
+  664     // -------------------------------------------------------------------------
+  665     // 2.5. GESTION DU CONTEXTE ENTREPRISE
+  666     // -------------------------------------------------------------------------
+  667     async changeCompanyContext(companyId, companyName) {
+  668         if (companyId) {
+  669             this.state.activeCompany = { id: companyId, name: companyName };
+  670             localStorage.setItem('activeCompany', JSON.stringify(this.state.activeCompany));
+  671         } else {
+  672             this.state.activeCompany = null;
+  673             localStorage.removeItem('activeCompany');
+  674         }
+  675         
+  676         this.state.filteredData.entries = [];
+  677         this.cacheManager.clearCache('entries_');
+  678         
+  679         this.updateHeaderContext();
+  680         this.updateNavigationMenu();
+  681         await this.loadView('dashboard');
+  682         
+  683         NotificationManager.show('success', 'Contexte Changé', `Passage réussi à l'entreprise : ${companyName || '-- Global --'}`);
+  684     },
+  685 
+  686     // -------------------------------------------------------------------------
+  687     // 2.6. MOTEUR D'INTERFACE (UI ENGINE)
+  688     // -------------------------------------------------------------------------
+  689     renderLoginView() {
+  690         document.getElementById('auth-view').classList.remove('hidden');
+  691         document.getElementById('auth-view').classList.add('flex');
+  692         document.getElementById('dashboard-view').classList.add('hidden');
+  693         document.getElementById('dashboard-view').classList.remove('flex');
+  694         
+  695         const loginFormContainer = document.getElementById('login-form-container');
+  696         const registerView = document.getElementById('register-view');
+  697         
+  698         if (loginFormContainer) loginFormContainer.classList.remove('hidden');
+  699         if (registerView) registerView.classList.add('hidden');
+  700         
+  701         this.displayAuthMessage('login', '', 'none');
+  702     },
+  703 
+  704     renderRegisterView() {
+  705         const loginFormContainer = document.getElementById('login-form-container');
+  706         const registerView = document.getElementById('register-view');
+  707         
+  708         if (loginFormContainer) loginFormContainer.classList.add('hidden');
+  709         if (registerView) registerView.classList.remove('hidden');
+  710         
+  711         this.displayAuthMessage('register', '', 'none');
+  712     },
+  713 
+  714     displayAuthMessage(viewId, message, type) {
+  715         const msgElement = document.getElementById(`${viewId}-message`);
+  716         if (!msgElement) return;
+  717 
+  718         msgElement.classList.remove('hidden', 'text-red-700', 'text-green-700', 'text-blue-700', 'bg-red-100', 'bg-green-100', 'bg-blue-100');
+  719         msgElement.classList.add('fade-in');
+  720 
+  721         if (type === 'none') {
+  722             msgElement.classList.add('hidden');
+  723             return;
+  724         }
+  725 
+  726         const colorMap = {
+  727             success: { text: 'text-green-700', bg: 'bg-green-100' },
+  728             danger: { text: 'text-red-700', bg: 'bg-red-100' },
+  729             info: { text: 'text-blue-700', bg: 'bg-blue-100' }
+  730         };
+  731 
+  732         const colors = colorMap[type] || colorMap.info;
+  733         msgElement.textContent = message;
+  734         msgElement.classList.remove('hidden');
+  735         msgElement.classList.add(colors.text, colors.bg);
+  736     },
+  737 
+  738     renderDashboard() {
+  739         document.getElementById('auth-view').classList.add('hidden');
+  740         document.getElementById('auth-view').classList.remove('flex');
+  741         document.getElementById('register-view')?.classList.add('hidden');
+  742         
+  743         document.getElementById('dashboard-view').classList.remove('hidden');
+  744         document.getElementById('dashboard-view').classList.add('flex');
+  745 
+  746         this.updateHeaderContext();
+  747         this.updateNavigationMenu();
+  748         this.loadView('dashboard');
+  749     },
+  750 
+  751     updateHeaderContext() {
+  752         const user = this.state.user;
+  753         if (!user) return;
+  754 
+  755         const firstName = user.name ? user.name.split(' ')[0] : 'Utilisateur';
+  756         
+  757         const welcomeMsg = document.getElementById('welcome-message');
+  758         const currentRole = document.getElementById('current-role');
+  759         const companyNameElement = document.getElementById('current-company-name');
+  760         const contextMessage = document.getElementById('context-message');
+  761         const userAvatarText = document.getElementById('user-avatar-text');
+  762         
+  763         if (welcomeMsg) welcomeMsg.textContent = `Bienvenue, ${firstName}`;
+  764         if (currentRole) currentRole.textContent = user.role;
+  765         if (userAvatarText) userAvatarText.textContent = firstName.charAt(0).toUpperCase();
+  766         
+  767         const companyName = this.state.activeCompany?.name || '-- Global --';
+  768         if (companyNameElement) companyNameElement.textContent = companyName;
+  769 
+  770         if (contextMessage) {
+  771             if (user.multiEntreprise && !this.state.activeCompany) {
+  772                 contextMessage.innerHTML = 'Contexte de travail : <strong class="text-danger">AUCUNE SÉLECTIONNÉE</strong>';
+  773             } else {
+  774                 contextMessage.innerHTML = `Contexte de travail : <strong class="text-primary">${companyName}</strong>`;
+  775             }
+  776         }
+  777     },
+  778 
+  779     updateNavigationMenu() {
+  780         const navMenu = document.getElementById('role-navigation-menu');
+  781         if (!navMenu) return;
+  782         
+  783         navMenu.innerHTML = '';
+  784         const role = this.state.user?.role || 'USER';
+  785 
+  786         let menuItems = [
+  787             { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' }
+  788         ];
+  789 
+  790         if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
+  791             menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' });
+  792         }
+  793 
+  794         if (this.state.activeCompany) {
+  795             menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
+  796             if (role !== ROLES.CAISSIER) {
+  797                 menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
+  798                 menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
+  799                 menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
+  800             }
+  801         } else if (this.state.user?.multiEntreprise) {
+  802             menuItems.push({ name: 'Sélectionner Contexte', icon: 'fas fa-sync-alt', view: 'selector' });
+  803         }
+  804 
+  805         if (role === ROLES.ADMIN) {
+  806             menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
+  807             menuItems.push({ name: 'Paramètres', icon: 'fas fa-cog', view: 'settings' });
+  808         }
+  809 
+  810         if (this.state.user?.multiEntreprise || this.state.allCompanies.length > 1) {
+  811             menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-building', view: 'selector' });
+  812         }
+  813         
+  814         menuItems.forEach(item => {
+  815             const link = document.createElement('a');
+  816             link.href = '#';
+  817             link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
+  818             link.innerHTML = `<i class="${item.icon} mr-3 w-5 text-center"></i> ${item.name}`;
+  819 
+  820             link.addEventListener('click', (e) => {
+  821                 e.preventDefault();
+  822                 this.loadView(item.view);
+  823             });
+  824 
+  825             navMenu.appendChild(link);
+  826         });
+  827     },
+  828 
+  829     // -------------------------------------------------------------------------
+  830     // 2.7. ROUTEUR DE VUES
+  831     // -------------------------------------------------------------------------
+  832     async loadView(viewName) {
+  833         const contentArea = document.getElementById('dashboard-content-area');
+  834         if (!contentArea) return;
+  835         
+  836         this.state.currentView = viewName;
+  837         contentArea.innerHTML = this.renderLoader();
+  838 
+  839         const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];
+  840 
+  841         if (requiresContext.includes(viewName) && !this.state.activeCompany && this.state.user?.multiEntreprise) {
+  842             NotificationManager.show('warning', 'Action Bloquée', `Veuillez sélectionner une entreprise pour "${viewName}".`);
+  843             this.renderEnterpriseSelectorView(viewName);
+  844             return;
+  845         }
+  846 
+  847         let htmlContent = '';
+  848 
+  849         switch (viewName) {
+  850             case 'dashboard':
+  851                 htmlContent = await this.renderDashboardContent();
+  852                 break;
+  853             case 'selector':
+  854                 this.renderEnterpriseSelectorView();
+  855                 return;
+  856             case 'reports':
+  857                 htmlContent = this.renderReportsView();
+  858                 break;
+  859             case 'saisie':
+  860                 htmlContent = this.renderSaisieFormCaissier();
+  861                 break;
+  862             case 'journal-entry':
+  863                 htmlContent = this.renderJournalEntryForm();
+  864                 break;
+  865             case 'create-company':
+  866                 htmlContent = this.renderCreateCompanyForm();
+  867                 break;
+  868             case 'validation':
+  869                 htmlContent = this.renderValidationView();
+  870                 break;
+  871             case 'user-management':
+  872                 htmlContent = this.renderUserManagementView();
+  873                 break;
+  874             case 'settings':
+  875                 htmlContent = this.renderSettingsView();
+  876                 break;
+  877             default:
+  878                 htmlContent = this.renderNotFound();
+  879         }
+  880 
+  881         if (htmlContent) {
+  882             contentArea.innerHTML = htmlContent;
+  883             
+  884             if (viewName === 'reports') {
+  885                 await this.genererEtatsFinanciers();
+  886             }
+  887             
+  888             if (viewName === 'saisie') {
+  889                 this.initSaisieFormListeners();
+  890             }
+  891         }
+  892     },
+  893 
+  894     renderLoader() {
+  895         return `
+  896             <div class="flex flex-col items-center justify-center h-64 text-gray-500">
+  897                 <div class="loading-spinner mb-4"></div>
+  898                 <p class="font-bold animate-pulse">Chargement du module...</p>
+  899             </div>
+  900         `;
+  901     },
+  902 
+  903     renderNotFound() {
+  904         return `
+  905             <div class="max-w-4xl mx-auto p-8 text-center fade-in">
+  906                 <i class="fas fa-search fa-4x text-gray-300 mb-4"></i>
+  907                 <h2 class="text-2xl font-extrabold text-gray-500">Vue non trouvée</h2>
+  908                 <p class="text-gray-400">Cette fonctionnalité est en cours de développement.</p>
+  909             </div>
+  910         `;
+  911     },
+  912 
+  913     renderErrorBox(message) {
+  914         return `
+  915             <div class="max-w-4xl mx-auto p-8 bg-red-100 dark:bg-red-900 border-4 border-danger rounded-xl text-center fade-in">
+  916                 <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
+  917                 <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
+  918                 <p class="text-lg text-red-700 dark:text-red-300">${message}</p>
+  919             </div>
+  920         `;
+  921     },
+  922 
+  923     // -------------------------------------------------------------------------
+  924     // 2.8. VUES MÉTIER
+  925     // -------------------------------------------------------------------------
+  926     async renderDashboardContent() {
+  927         if (!this.state.user) {
+  928             return this.renderErrorBox('Contexte utilisateur non disponible.');
+  929         }
+  930         
+  931         if (this.state.user.multiEntreprise && !this.state.activeCompany) {
+  932             this.renderEnterpriseSelectorView();
+  933             return null;
+  934         }
+  935         
+  936         const companyName = this.state.activeCompany?.name || 'Mon Entreprise';
+  937         const stats = this.state.activeCompany?.stats || { transactions: 0, result: 0, pending: 0, cash: 0 };
+  938         
+  939         return `
+  940             <div class="fade-in">
+  941      <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Tableau de Bord : ${companyName}</h2>
+  942                 
+  943                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
+  944                     <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-primary">
+  945                         <div class="flex items-center justify-between">
+  946                             <div>
+  947                                 <p class="text-xs font-bold text-gray-500 uppercase">Chiffre d'Affaires</p>
+  948                                 <p class="text-2xl font-black text-primary">15.2M XOF</p>
+  949                             </div>
+  950                             <i class="fas fa-chart-line text-3xl text-primary opacity-30"></i>
+  951                         </div>
+  952                     </div>
+  953                     
+  954                     <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-success">
+  955                         <div class="flex items-center justify-between">
+  956                             <div>
+  957                                 <p class="text-xs font-bold text-gray-500 uppercase">Résultat Net</p>
+  958                                 <p class="text-2xl font-black text-success">+2.8M XOF</p>
+  959                             </div>
+  960                             <i class="fas fa-arrow-trend-up text-3xl text-success opacity-30"></i>
+  961                         </div>
+  962                     </div>
+  963                     
+  964                     <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-warning">
+  965                         <div class="flex items-center justify-between">
+  966                             <div>
+  967                                 <p class="text-xs font-bold text-gray-500 uppercase">Opérations en Attente</p>
+  968                                 <p class="text-2xl font-black text-warning">${stats.pending || 12}</p>
+  969                             </div>
+  970                             <i class="fas fa-clock text-3xl text-warning opacity-30"></i>
+  971                         </div>
+  972                     </div>
+  973                     
+  974                     <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-info">
+  975                         <div class="flex items-center justify-between">
+  976                             <div>
+  977                                 <p class="text-xs font-bold text-gray-500 uppercase">Trésorerie</p>
+  978                                 <p class="text-2xl font-black text-info">8.9M XOF</p>
+  979                             </div>
+  980                             <i class="fas fa-wallet text-3xl text-info opacity-30"></i>
+  981                         </div>
+  982                     </div>
+  983                 </div>
+  984                 
+  985                 <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-primary p-6">
+  986                     <p class="text-primary font-bold"><i class="fas fa-info-circle mr-2"></i> Bienvenue ${this.state.user.name}</p>
+  987                     <p class="text-gray-600 dark:text-gray-400 mt-2">Rôle: <strong>${this.state.user.role}</strong>. Les statistiques affichées sont des données de démonstration. Connectez votre instance Odoo pour voir les données réelles.</p>
+  988                 </div>
+  989             </div>
+  990         `;
+  991     },
+  992 
+  993     async renderEnterpriseSelectorView(blockedViewName = null) {
+  994         const contentArea = document.getElementById('dashboard-content-area');
+  995         if (!contentArea) return;
+  996         
+  997         contentArea.innerHTML = this.renderLoader();
+  998 
+  999         try {
+ 1000             const companies = await this.fetchUserCompanies();
+ 1001 
+ 1002             let companyListHTML = '';
+ 1003             if (companies.length === 0) {
+ 1004                 companyListHTML = `
+ 1005                     <div class="p-6 text-center bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
+ 1006                         <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
+ 1007                         <p class="text-warning font-semibold">Aucune entreprise trouvée. Contactez l'administrateur.</p>
+ 1008                     </div>
+ 1009                 `;
+ 1010             } else {
+ 1011                 companyListHTML = companies.map(company => `
+ 1012                     <div class="company-card p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
+ 1013                          data-company-id="${company.id}" data-company-name="${company.name}">
+ 1014                         <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
+ 1015                         <p class="text-sm text-gray-600 dark:text-gray-400">Statut: Actif</p>
+ 1016                         ${company.stats ? `<p class="text-xs text-gray-500 mt-2">${company.stats.transactions || 0} transactions</p>` : ''}
+ 1017                     </div>
+ 1018                 `).join('');
+ 1019             }
+ 1020 
+ 1021             contentArea.innerHTML = `
+ 1022                 <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl fade-in">
+ 1023                     <h2 class="text-3xl font-extrabold text-primary mb-2">Sélectionner un Contexte d'Entreprise</h2>
+ 1024                     <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
+ 1025                         ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
+ 1026                     </p>
+ 1027                     <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
+ 1028                         ${companyListHTML}
+ 1029                     </div>
+ 1030                     
+ 1031                     <div class="mt-8 text-center">
+ 1032                         <button id="btn-global-context" class="text-secondary hover:text-primary font-medium">
+ 1033                             <i class="fas fa-undo mr-1"></i> Revenir au Contexte Global
+ 1034                         </button>
+ 1035                     </div>
+ 1036                 </div>
+ 1037             `;
+ 1038 
+ 1039             contentArea.querySelectorAll('.company-card').forEach(element => {
+ 1040                 element.addEventListener('click', () => {
+ 1041                     const companyId = element.getAttribute('data-company-id');
+ 1042                     const companyName = element.getAttribute('data-company-name');
+ 1043                     this.changeCompanyContext(companyId, companyName);
+ 1044                 });
+ 1045             });
+ 1046             
+ 1047             document.getElementById('btn-global-context')?.addEventListener('click', () => {
+ 1048                 this.changeCompanyContext(null, '-- Global --');
+ 1049             });
+ 1050 
+ 1051         } catch (error) {
+ 1052             contentArea.innerHTML = this.renderErrorBox(`Impossible de charger les entreprises. ${error.message}`);
+ 1053         }
+ 1054     },
+ 1055 
+ 1056     renderSaisieFormCaissier() {
+ 1057         return `
+ 1058             <div class="max-w-3xl mx-auto fade-in">
+ 1059                 <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 border-b-8 border-warning">
+ 1060                     <div class="flex justify-between items-center mb-10">
+ 1061                         <h2 class="text-3xl font-black text-gray-900 dark:text-white">Saisie de Flux</h2>
+ 1062                         <i class="fas fa-cash-register text-4xl text-warning opacity-30"></i>
+ 1063                     </div>
+ 1064                     
+ 1065                     <div class="grid grid-cols-2 gap-4 mb-8">
+ 1066                         <button id="btn-recette" class="p-5 rounded-2xl border-2 border-success bg-success text-white font-black shadow-lg shadow-success/30">
+ 1067                             <i class="fas fa-arrow-down mr-2"></i> RECETTE
+ 1068                         </button>
+ 1069                         <button id="btn-depense" class="p-5 rounded-2xl border-2 border-danger text-danger font-black transition-all hover:bg-danger hover:text-white">
+ 1070                             <i class="fas fa-arrow-up mr-2"></i> DÉPENSE
+ 1071                         </button>
+ 1072                     </div>
+ 1073                     
+ 1074                     <div class="space-y-6">
+ 1075                         <div>
+ 1076                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Nature de l'opération</label>
+ 1077                             <input list="oper-list" id="cash-label" class="w-full p-5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-lg shadow-inner" placeholder="Ex: Vente de marchandises...">
+ 1078                             <datalist id="oper-list">
+ 1079                                 <option value="Vente de marchandises">
+ 1080                                 <option value="Prestation de service">
+ 1081                                 <option value="Achat fournitures">
+ 1082                                 <option value="Frais de transport">
+ 1083                                 <option value="Paiement salaire">
+ 1084                                 <option value="Règlement fournisseur">
+ 1085                             </datalist>
+ 1086                         </div>
+ 1087                         
+ 1088                         <div>
+ 1089                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Montant (XOF)</label>
+ 1090                             <input type="number" id="cash-val" class="w-full p-8 text-5xl font-black text-center text-primary bg-blue-50 dark:bg-blue-900/20 rounded-3xl" placeholder="0" min="0">
+ 1091                         </div>
+ 1092                         
+ 1093                         <input type="hidden" id="flux-type" value="RECETTE">
+ 1094                         
+ 1095                         <button id="btn-submit-flux" class="w-full py-6 bg-primary text-white text-xl font-black rounded-2xl shadow-xl hover:bg-primary-dark hover:scale-[1.01] transition-transform">
+ 1096                             <i class="fas fa-check mr-2"></i> VALIDER LA SAISIE
+ 1097                         </button>
+ 1098                     </div>
+ 1099                 </div>
+ 1100             </div>
+ 1101         `;
+ 1102     },
+ 1103 
+ 1104     initSaisieFormListeners() {
+ 1105         const btnRecette = document.getElementById('btn-recette');
+ 1106         const btnDepense = document.getElementById('btn-depense');
+ 1107         const fluxTypeInput = document.getElementById('flux-type');
+ 1108         const btnSubmit = document.getElementById('btn-submit-flux');
+ 1109         
+ 1110         if (btnRecette && btnDepense) {
+ 1111             btnRecette.addEventListener('click', () => {
+ 1112                 fluxTypeInput.value = 'RECETTE';
+ 1113                 btnRecette.className = 'p-5 rounded-2xl border-2 border-success bg-success text-white font-black shadow-lg shadow-success/30';
+ 1114                 btnDepense.className = 'p-5 rounded-2xl border-2 border-danger text-danger font-black transition-all hover:bg-danger hover:text-white';
+ 1115             });
+ 1116             
+ 1117             btnDepense.addEventListener('click', () => {
+ 1118                 fluxTypeInput.value = 'DEPENSE';
+ 1119                 btnDepense.className = 'p-5 rounded-2xl border-2 border-danger bg-danger text-white font-black shadow-lg shadow-danger/30';
+ 1120                 btnRecette.className = 'p-5 rounded-2xl border-2 border-success text-success font-black transition-all hover:bg-success hover:text-white';
+ 1121             });
+ 1122         }
+ 1123         
+ 1124         if (btnSubmit) {
+ 1125             btnSubmit.addEventListener('click', async () => {
+ 1126                 const libelle = document.getElementById('cash-label').value.trim();
+ 1127                 const montant = document.getElementById('cash-val').value;
+ 1128                 const type = fluxTypeInput.value;
+ 1129                 
+ 1130                 if (!libelle) {
+ 1131                     showAlertModal('Champ requis', 'Veuillez saisir la nature de l\'opération.');
+ 1132                     return;
+ 1133                 }
+ 1134                 
+ 1135                 if (!montant || parseFloat(montant) <= 0) {
+ 1136                     showAlertModal('Montant invalide', 'Veuillez saisir un montant valide supérieur à 0.');
+ 1137                     return;
+ 1138                 }
+ 1139                 
+ 1140                 const data = {
+ 1141                     libelle,
+ 1142                     montant: parseFloat(montant),
+ 1143                     type,
+ 1144                     status: 'BROUILLON',
+ 1145                     companyId: this.state.activeCompany?.id,
+ 1146                     date: new Date().toISOString()
+ 1147                 };
+ 1148                 
+ 1149                 console.log('[FLUX] Transmission vers Odoo...', data);
+ 1150                 
+ 1151                 // TODO: Envoyer vers l'API Odoo
+ 1152                 // await this.apiFetch('/entries', { method: 'POST', body: JSON.stringify(data) });
+ 1153                 
+ 1154                 showAlertModal('Opération enregistrée', `${type} de ${parseInt(montant).toLocaleString()} XOF enregistrée avec succès.\n\nEn attente de validation par le comptable.`);
+ 1155                 
+ 1156                 // Reset form
+ 1157                 document.getElementById('cash-label').value = '';
+ 1158                 document.getElementById('cash-val').value = '';
+ 1159             });
+ 1160         }
+ 1161     },
+ 1162 
+ 1163     renderJournalEntryForm() {
+ 1164         const companyName = this.state.activeCompany?.name || 'Non définie';
+ 1165         return `
+ 1166             <div class="fade-in">
+ 1167                 <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Saisie Écriture Journal</h2>
+ 1168                 <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
+ 1169                     <p class="text-gray-500 mb-6"><i class="fas fa-info-circle mr-2"></i> Entreprise : <strong class="text-primary">${companyName}</strong></p>
+ 1170                     
+ 1171                     <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
+ 1172                         <div>
+ 1173                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Date</label>
+ 1174                             <input type="date" id="journal-date" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" value="${new Date().toISOString().split('T')[0]}">
+ 1175                         </div>
+ 1176                         <div>
+ 1177                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Journal</label>
+ 1178                             <select id="journal-type" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1179                                 <option value="VT">Ventes (VT)</option>
+ 1180                                 <option value="AC">Achats (AC)</option>
+ 1181                                 <option value="BQ">Banque (BQ)</option>
+ 1182                                 <option value="CA">Caisse (CA)</option>
+ 1183                                 <option value="OD">Opérations Diverses (OD)</option>
+ 1184                             </select>
+ 1185                         </div>
+ 1186                         <div>
+ 1187                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Référence</label>
+ 1188                             <input type="text" id="journal-ref" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="FA-2024-001">
+ 1189                         </div>
+ 1190                     </div>
+ 1191                     
+ 1192                     <div class="mb-6">
+ 1193                         <label class="block text-xs font-black uppercase text-gray-400 mb-2">Libellé</label>
+ 1194                         <input type="text" id="journal-libelle" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="Description de l'écriture...">
+ 1195                     </div>
+ 1196                     
+ 1197                     <div class="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-6">
+ 1198                         <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-4">Lignes d'écriture</h4>
+ 1199                         <table class="w-full text-sm">
+ 1200                             <thead>
+ 1201                                 <tr class="text-left text-xs uppercase text-gray-500">
+ 1202                                     <th class="p-2">Compte</th>
+ 1203                                     <th class="p-2">Libellé</th>
+ 1204                                     <th class="p-2 text-right">Débit</th>
+ 1205                                     <th class="p-2 text-right">Crédit</th>
+ 1206                                 </tr>
+ 1207                             </thead>
+ 1208                             <tbody id="journal-lines">
+ 1209                                 <tr>
+ 1210                                     <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="411000"></td>
+ 1211                                     <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="Client X"></td>
+ 1212                                     <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
+ 1213                                     <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
+ 1214                                 </tr>
+ 1215                                 <tr>
+ 1216                                     <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="701000"></td>
+ 1217                                     <td class="p-2"><input type="text" class="w-full p-2 bg-white dark:bg-gray-800 rounded" placeholder="Vente"></td>
+ 1218                                     <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
+ 1219                                     <td class="p-2"><input type="number" class="w-full p-2 bg-white dark:bg-gray-800 rounded text-right" placeholder="0"></td>
+ 1220                                 </tr>
+ 1221                             </tbody>
+ 1222                         </table>
+ 1223                     </div>
+ 1224                     
+ 1225                     <button class="w-full py-4 bg-success text-white font-bold rounded-xl hover:bg-green-600 transition">
+ 1226                         <i class="fas fa-save mr-2"></i> Enregistrer l'écriture
+ 1227                     </button>
+ 1228                 </div>
+ 1229             </div>
+ 1230         `;
+ 1231     },
+ 1232 
+ 1233     renderCreateCompanyForm() {
+ 1234         return `
+ 1235             <div class="max-w-2xl mx-auto fade-in">
+ 1236                 <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
+ 1237                     <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-6"><i class="fas fa-building mr-2 text-primary"></i> Créer une Nouvelle Entreprise</h2>
+ 1238                     
+ 1239                     <div class="space-y-4">
+ 1240                         <div>
+ 1241                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Dénomination Sociale *</label>
+ 1242                             <input type="text" id="new-company-name" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl" placeholder="Ma Nouvelle Entreprise SARL">
+ 1243                         </div>
+ 1244                         <div class="grid grid-cols-2 gap-4">
+ 1245                             <div>
+ 1246                                 <label class="block text-xs font-black uppercase text-gray-400 mb-2">Forme Juridique</label>
+ 1247                                 <select id="new-company-type" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1248                                     <option value="SARL">SARL</option>
+ 1249                                     <option value="SA">SA</option>
+ 1250                                     <option value="SAS">SAS</option>
+ 1251                                     <option value="EI">Entreprise Individuelle</option>
+ 1252                                     <option value="GIE">GIE</option>
+ 1253                                 </select>
+ 1254                             </div>
+ 1255                             <div>
+ 1256                                 <label class="block text-xs font-black uppercase text-gray-400 mb-2">Régime Fiscal</label>
+ 1257                                 <select id="new-company-regime" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1258                                     <option value="REEL_NORMAL">Réel Normal</option>
+ 1259                                     <option value="REEL_SIMPLIFIE">Réel Simplifié</option>
+ 1260                                     <option value="FORFAIT">Forfait</option>
+ 1261                                 </select>
+ 1262                             </div>
+ 1263                         </div>
+ 1264                         <div>
+ 1265                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Système Comptable SYSCOHADA</label>
+ 1266                             <select id="new-company-systeme" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1267                                 <option value="NORMAL">Système Normal (Complet)</option>
+ 1268                                 <option value="SMT">Système Minimal de Trésorerie (TPE)</option>
+ 1269                             </select>
+ 1270                         </div>
+ 1271                         
+ 1272                         <button id="btn-create-company" class="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition mt-6">
+ 1273                             <i class="fas fa-plus-circle mr-2"></i> Créer l'entreprise dans Odoo
+ 1274                         </button>
+ 1275                     </div>
+ 1276                 </div>
+ 1277             </div>
+ 1278         `;
+ 1279     },
+ 1280 
+ 1281     renderValidationView() {
+ 1282         const companyName = this.state.activeCompany?.name || 'Non définie';
+ 1283         return `
+ 1284             <div class="fade-in">
+ 1285                 <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Validation des Opérations</h2>
+ 1286                 <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
+ 1287                     <p class="text-gray-500 mb-4">Entreprise : <strong class="text-primary">${companyName}</strong></p>
+ 1288                     <div class="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
+ 1289                         <p class="text-warning font-bold"><i class="fas fa-hourglass-half mr-2"></i> 12 opérations en attente de validation</p>
+ 1290                     </div>
+ 1291                     <p class="text-sm text-gray-400 mt-4">Les opérations saisies par les caissiers apparaîtront ici pour validation par le comptable.</p>
+ 1292                 </div>
+ 1293             </div>
+ 1294         `;
+ 1295     },
+ 1296 
+ 1297     renderUserManagementView() {
+ 1298         return `
+ 1299             <div class="fade-in">
+ 1300                 <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Gestion des Utilisateurs</h2>
+ 1301                 <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
+ 1302                     <p class="text-gray-500 mb-4">Gérez les accès et les rôles des utilisateurs de votre organisation.</p>
+ 1303                     <p class="text-sm text-gray-400">Fonctionnalité en cours d'intégration avec Odoo (res.users).</p>
+ 1304                 </div>
+ 1305             </div>
+ 1306         `;
+ 1307     },
+ 1308 
+ 1309     renderSettingsView() {
+ 1310         return `
+ 1311             <div class="fade-in">
+ 1312                 <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Paramètres</h2>
+ 1313                 <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
+ 1314                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
+ 1315                         <div>
+ 1316                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Système de Reporting</label>
+ 1317                             <select id="set-systeme" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1318                                 <option value="NORMAL" ${this.state.currentSysteme === 'NORMAL' ? 'selected' : ''}>SYSTÈME NORMAL (Complet)</option>
+ 1319                                 <option value="SMT" ${this.state.currentSysteme === 'SMT' ? 'selected' : ''}>SYSTÈME MINIMAL (SMT)</option>
+ 1320                             </select>
+ 1321                         </div>
+ 1322                         <div>
+ 1323                             <label class="block text-xs font-black uppercase text-gray-400 mb-2">Date de Clôture Exercice</label>
+ 1324                             <input type="date" id="set-cloture" class="w-full p-4 bg-gray-50 dark:bg-gray-700 border-none rounded-xl">
+ 1325                         </div>
+ 1326                     </div>
+ 1327                     <button class="mt-8 bg-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:bg-primary-dark transition-all">
+ 1328                         <i class="fas fa-save mr-2"></i> SAUVEGARDER LES PARAMÈTRES
+ 1329                     </button>
+ 1330                 </div>
+ 1331             </div>
+ 1332         `;
+ 1333     },
+ 1334 
+ 1335     // -------------------------------------------------------------------------
+ 1336     // 2.9. MODULE ÉTATS FINANCIERS SYSCOHADA
+ 1337     // -------------------------------------------------------------------------
+ 1338     renderReportsView() {
+ 1339         const companyName = this.state.activeCompany?.name || 'AUCUNE ENTREPRISE SÉLECTIONNÉE';
+ 1340 
+ 1341         return `
+ 1342             <div class="fade-in">
+ 1343                 <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Générer les États Financiers SYSCOHADA</h2>
+ 1344                 
+ 1345                 <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-inner mb-6">
+ 1346                     <h3 class="text-xl font-bold mb-4 text-primary">Options de Rapport pour : ${companyName}</h3>
+ 1347 
+ 1348                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="report-controls">
+ 1349                         <div class="mb-4">
+ 1350                             <label for="systeme" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Choisir le système comptable :</label>
+ 1351                             <select id="systeme" class="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg">
+ 1352                                 <option value="NORMAL" ${this.state.currentSysteme === 'NORMAL' ? 'selected' : ''}>Système normal</option>
+ 1353                                 <option value="SMT" ${this.state.currentSysteme === 'SMT' ? 'selected' : ''}>Système minimal de trésorerie</option>
+ 1354                             </select>
+ 1355                         </div>
+ 1356                     </div>
+ 1357                     
+ 1358                     <button id="generer-rapport" class="w-full mt-4 bg-success hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md">
+ 1359                         <i class="fas fa-calculator mr-2"></i> Générer les États Financiers
+ 1360                     </button>
+ 1361                 </div>
+ 1362                 
+ 1363                 <div id="etat-financier" class="space-y-6">
+ 1364                     <div class="text-center p-8 text-gray-400">
+ 1365                         <i class="fas fa-file-invoice-dollar fa-3x mb-4 opacity-30"></i>
+ 1366                         <p>Cliquez sur "Générer" pour afficher les états financiers.</p>
+ 1367                     </div>
+ 1368                 </div>
+ 1369             </div>
+ 1370         `;
+ 1371     },
+ 1372 
+ 1373     async genererEtatsFinanciers() {
+ 1374         const zoneRapports = document.getElementById('etat-financier');
+ 1375         const btnGenerer = document.getElementById('generer-rapport');
+ 1376         const selectSysteme = document.getElementById('systeme');
+ 1377         
+ 1378         if (selectSysteme) {
+ 1379             selectSysteme.addEventListener('change', (e) => {
+ 1380                 this.state.currentSysteme = e.target.value;
+ 1381             });
+ 1382         }
+ 1383         
+ 1384         if (btnGenerer) {
+ 1385             btnGenerer.addEventListener('click', async () => {
+ 1386                 await this.executeGenerateReport(zoneRapports);
+ 1387             });
+ 1388         }
+ 1389     },
+ 1390 
+ 1391     async executeGenerateReport(zoneRapports) {
+ 1392         if (!zoneRapports) return;
+ 1393         
+ 1394         zoneRapports.innerHTML = `
+ 1395             <div class="text-center p-8">
+ 1396                 <div class="loading-spinner mx-auto mb-4"></div>
+ 1397                 <p>Chargement et calcul des écritures...</p>
+ 1398             </div>
+ 1399         `;
+ 1400 
+ 1401         try {
+ 1402             if (!this.state.activeCompany) {
+ 1403                 throw new Error('Aucune entreprise sélectionnée');
+ 1404             }
+ 1405 
+ 1406             const companyId = this.state.activeCompany.id;
+ 1407             const systeme = this.state.currentSysteme;
+ 1408             
+ 1409             let ecritures = await this.fetchCompanyEntries(companyId);
+ 1410             
+ 1411             if (ecritures.length === 0) {
+ 1412                 zoneRapports.innerHTML = `
+ 1413                     <div class="p-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
+ 1414                         <p class="text-warning font-bold"><i class="fas fa-exclamation-triangle mr-2"></i> Aucune écriture comptable trouvée pour cette entreprise.</p>
+ 1415                     </div>
+ 1416                 `;
+ 1417                 return;
+ 1418             }
+ 1419             
+ 1420             NotificationManager.show('success', 'Données Prêtes', `${ecritures.length} écritures chargées pour le calcul.`);
+ 1421 
+ 1422             let etats = {};
+ 1423             if (systeme === 'NORMAL') {
+ 1424                 etats.bilan = this.genererBilan(ecritures);
+ 1425                 etats.resultat = this.genererCompteResultat(ecritures);
+ 1426                 etats.flux = this.genererFluxTresorerie(ecritures);
+ 1427                 etats.annexes = this.genererAnnexes(ecritures);
+ 1428             } else {
+ 1429                 etats.recettesDepenses = this.genererEtatRecettesDepenses(ecritures);
+ 1430                 etats.bilanMinimal = this.genererBilanMinimal(ecritures);
+ 1431                 etats.annexes = this.genererAnnexes(ecritures);
+ 1432             }
+ 1433             
+ 1434             this.afficherEtatFinancier(etats, zoneRapports);
+ 1435             
+ 1436             const companyName = this.state.activeCompany.name;
+ 1437             const bilanHtml = `
+ 1438                 <div class="text-center"><h4 class="text-xl font-bold mb-4 text-primary">BILAN COMPTABLE PROVISOIRE</h4></div>
+ 1439                 ${etats.bilan || etats.bilanMinimal}
+ 1440                 <p class="mt-4 text-sm text-gray-500">Note: Ce bilan est basé sur des données de démonstration.</p>
+ 1441             `;
+ 1442             ModalManager.show(`Bilan SYSCOHADA - ${companyName}`, bilanHtml);
+ 1443 
+ 1444         } catch (e) {
+ 1445             console.error('[SYSCOHADA Error]', e);
+ 1446             NotificationManager.show('danger', 'Erreur Critique', e.message);
+ 1447             zoneRapports.innerHTML = `
+ 1448                 <div class="p-10 bg-red-100 dark:bg-red-900/30 rounded-lg">
+ 1449                     <p class="text-danger font-bold">Erreur: ${e.message}</p>
+ 1450                 </div>
+ 1451             `;
+ 1452         }
+ 1453     },
+ 1454 
+ 1455     afficherEtatFinancier(etats, zone) {
+ 1456         if (!zone) return;
+ 1457         zone.innerHTML = '';
+ 1458         
+ 1459         const titles = {
+ 1460             bilan: 'Bilan Comptable',
+ 1461             resultat: 'Compte de Résultat',
+ 1462             flux: 'Tableau des Flux de Trésorerie',
+ 1463             annexes: 'Notes Annexes',
+ 1464             recettesDepenses: 'État des Recettes et Dépenses',
+ 1465             bilanMinimal: 'Bilan Minimal'
+ 1466         };
+ 1467         
+ 1468         for (const [cle, contenu] of Object.entries(etats)) {
+ 1469             const title = titles[cle] || cle.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
+ 1470             const bloc = document.createElement('div');
+ 1471             bloc.className = "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg fade-in";
+ 1472             bloc.innerHTML = `
+ 1473                 <div class="flex justify-between items-center mb-4">
+ 1474                     <h3 class="text-2xl font-bold text-secondary">${title}</h3>
+ 1475                     <div class="flex gap-2">
+ 1476                         <button onclick="DoukeApp.exportToExcel('${cle}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-bold transition-all">
+ 1477                             <i class="fas fa-file-excel mr-1"></i> Excel
+ 1478                         </button>
+ 1479                         <button onclick="DoukeApp.exportToPDF('${cle}')" class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-bold transition-all">
+ 1480                             <i class="fas fa-file-pdf mr-1"></i> PDF
+ 1481                         </button>
+ 1482                     </div>
+ 1483                 </div>
+ 1484                 <div class="overflow-x-auto">${contenu}</div>
+ 1485             `;
+ 1486             zone.appendChild(bloc);
+ 1487         }
+ 1488     },
+ 1489 
+ 1490     genererBilan(ecritures) {
+ 1491         return `
+ 1492             <table class="w-full border-collapse">
+ 1493                 <thead>
+ 1494                     <tr class="bg-gray-100 dark:bg-gray-700">
+ 1495                         <th class="p-3 text-left font-bold" colspan="2">ACTIF</th>
+ 1496                         <th class="p-3 text-right font-bold">Montant</th>
+ 1497                         <th class="p-3 text-left font-bold" colspan="2">PASSIF</th>
+ 1498                         <th class="p-3 text-right font-bold">Montant</th>
+ 1499                     </tr>
+ 1500                 </thead>
+ 1501                 <tbody class="text-sm">
+ 1502                     <tr class="border-b dark:border-gray-700">
+ 1503                         <td class="p-3" colspan="2">Immobilisations</td>
+ 1504                         <td class="p-3 text-right">5 000 000</td>
+ 1505                         <td class="p-3" colspan="2">Capital Social</td>
+ 1506                         <td class="p-3 text-right">10 000 000</td>
+ 1507                     </tr>
+ 1508                     <tr class="border-b dark:border-gray-700">
+ 1509                         <td class="p-3" colspan="2">Stocks</td>
+ 1510                         <td class="p-3 text-right">3 500 000</td>
+ 1511                         <td class="p-3" colspan="2">Réserves</td>
+ 1512                         <td class="p-3 text-right">2 000 000</td>
+ 1513                     </tr>
+ 1514                     <tr class="border-b dark:border-gray-700">
+ 1515                         <td class="p-3" colspan="2">Créances Clients</td>
+ 1516                         <td class="p-3 text-right">8 200 000</td>
+ 1517                         <td class="p-3" colspan="2">Résultat</td>
+ 1518                         <td class="p-3 text-right font-bold text-success">2 800 000</td>
+ 1519                     </tr>
+ 1520                     <tr class="border-b dark:border-gray-700">
+ 1521                         <td class="p-3" colspan="2">Trésorerie</td>
+ 1522                         <td class="p-3 text-right">8 900 000</td>
+ 1523                         <td class="p-3" colspan="2">Dettes Fournisseurs</td>
+ 1524                         <td class="p-3 text-right">4 720 000</td>
+ 1525                     </tr>
+ 1526                     <tr class="bg-gray-50 dark:bg-gray-900 font-bold">
+ 1527                         <td class="p-3" colspan="2">TOTAL ACTIF</td>
+ 1528                         <td class="p-3 text-right text-primary">25 600 000</td>
+ 1529                         <td class="p-3" colspan="2">TOTAL PASSIF</td>
+ 1530                         <td class="p-3 text-right text-primary">25 600 000</td>
+ 1531                     </tr>
+ 1532                 </tbody>
+ 1533             </table>
+ 1534             <p class="text-xs text-gray-400 mt-2">* Données de démonstration basées sur ${ecritures.length} écritures</p>
+ 1535         `;
+ 1536     },
+ 1537 
+ 1538     genererCompteResultat(ecritures) {
+ 1539         return `
+ 1540             <table class="w-full border-collapse">
+ 1541                 <thead>
+ 1542                     <tr class="bg-gray-100 dark:bg-gray-700">
+ 1543                         <th class="p-3 text-left font-bold">Postes</th>
+ 1544                         <th class="p-3 text-right font-bold">Montant (XOF)</th>
+ 1545                     </tr>
+ 1546                 </thead>
+ 1547                 <tbody class="text-sm">
+ 1548                     <tr class="border-b dark:border-gray-700">
+ 1549                         <td class="p-3 font-semibold">Chiffre d'Affaires (Classe 7)</td>
+ 1550                         <td class="p-3 text-right text-success font-bold">15 200 000</td>
+ 1551                     </tr>
+ 1552                     <tr class="border-b dark:border-gray-700">
+ 1553                         <td class="p-3 pl-6">- Achats consommés (Classe 6)</td>
+ 1554                         <td class="p-3 text-right text-danger">-4 720 000</td>
+ 1555                     </tr>
+ 1556                     <tr class="border-b dark:border-gray-700">
+ 1557                         <td class="p-3 pl-6">- Charges de personnel</td>
+ 1558                         <td class="p-3 text-right text-danger">-3 000 000</td>
+ 1559                     </tr>
+ 1560                     <tr class="border-b dark:border-gray-700">
+ 1561                         <td class="p-3 pl-6">- Autres charges d'exploitation</td>
+ 1562                         <td class="p-3 text-right text-danger">-1 500 000</td>
+ 1563                     </tr>
+ 1564                     <tr class="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
+ 1565                         <td class="p-3 font-semibold">= Excédent Brut d'Exploitation (EBE)</td>
+ 1566                         <td class="p-3 text-right font-bold">5 980 000</td>
+ 1567                     </tr>
+ 1568                     <tr class="border-b dark:border-gray-700">
+ 1569                         <td class="p-3 pl-6">- Dotations aux amortissements</td>
+ 1570                         <td class="p-3 text-right text-danger">-500 000</td>
+ 1571                     </tr>
+ 1572                     <tr class="bg-green-50 dark:bg-green-900/20 font-bold">
+ 1573                         <td class="p-3">= RÉSULTAT NET</td>
+ 1574                         <td class="p-3 text-right text-success text-lg">2 800 000</td>
+ 1575                     </tr>
+ 1576                 </tbody>
+ 1577             </table>
+ 1578         `;
+ 1579     },
+ 1580 
+ 1581     genererFluxTresorerie(ecritures) {
+ 1582         return `
+ 1583             <table class="w-full border-collapse">
+ 1584                 <thead>
+ 1585                     <tr class="bg-gray-100 dark:bg-gray-700">
+ 1586                         <th class="p-3 text-left font-bold">Flux de Trésorerie</th>
+ 1587                         <th class="p-3 text-right font-bold">Montant</th>
+ 1588                     </tr>
+ 1589                 </thead>
+ 1590                 <tbody class="text-sm">
+ 1591                     <tr class="border-b dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
+ 1592                         <td class="p-3 font-semibold">Flux liés à l'activité</td>
+ 1593                         <td class="p-3 text-right font-bold text-success">+4 200 000</td>
+ 1594                     </tr>
+ 1595                     <tr class="border-b dark:border-gray-700">
+ 1596                         <td class="p-3 pl-6">Encaissements clients</td>
+ 1597                         <td class="p-3 text-right">11 800 000</td>
+ 1598                     </tr>
+ 1599                     <tr class="border-b dark:border-gray-700">
+ 1600                         <td class="p-3 pl-6">Décaissements fournisseurs</td>
+ 1601                         <td class="p-3 text-right text-danger">-4 720 000</td>
+ 1602                     </tr>
+ 1603                     <tr class="border-b dark:border-gray-700">
+ 1604                         <td class="p-3 pl-6">Charges de personnel décaissées</td>
+ 1605                         <td class="p-3 text-right text-danger">-3 000 000</td>
+ 1606                     </tr>
+ 1607                     <tr class="border-b dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
+ 1608                         <td class="p-3 font-semibold">Flux liés à l'investissement</td>
+ 1609                         <td class="p-3 text-right font-bold text-danger">-500 000</td>
+ 1610                     </tr>
+ 1611                     <tr class="border-b dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
+ 1612                         <td class="p-3 font-semibold">Flux liés au financement</td>
+ 1613                         <td class="p-3 text-right font-bold">0</td>
+ 1614                     </tr>
+ 1615                     <tr class="bg-green-50 dark:bg-green-900/20 font-bold">
+ 1616                         <td class="p-3">Variation de Trésorerie</td>
+ 1617                         <td class="p-3 text-right text-success text-lg">+3 700 000</td>
+ 1618                     </tr>
+ 1619                 </tbody>
+ 1620             </table>
+ 1621         `;
+ 1622     },
+ 1623 
+ 1624     genererEtatRecettesDepenses(ecritures) {
+ 1625         return `
+ 1626             <table class="w-full border-collapse">
+ 1627                 <thead>
+ 1628                     <tr class="bg-gray-100 dark:bg-gray-700">
+ 1629                         <th class="p-3 text-left font-bold">Nature</th>
+ 1630                         <th class="p-3 text-right font-bold">Recettes</th>
+ 1631                         <th class="p-3 text-right font-bold">Dépenses</th>
+ 1632                     </tr>
+ 1633                 </thead>
+ 1634                 <tbody class="text-sm">
+ 1635                     <tr class="border-b dark:border-gray-700">
+ 1636                         <td class="p-3">Ventes de marchandises</td>
+ 1637                         <td class="p-3 text-right text-success">10 000 000</td>
+ 1638                         <td class="p-3 text-right">-</td>
+ 1639                     </tr>
+ 1640                     <tr class="border-b dark:border-gray-700">
+ 1641                         <td class="p-3">Prestations de services</td>
+ 1642                         <td class="p-3 text-right text-success">5 200 000</td>
+ 1643                         <td class="p-3 text-right">-</td>
+ 1644                     </tr>
+ 1645                     <tr class="border-b dark:border-gray-700">
+ 1646                         <td class="p-3">Achats</td>
+ 1647                         <td class="p-3 text-right">-</td>
+ 1648                         <td class="p-3 text-right text-danger">4 720 000</td>
+ 1649                     </tr>
+ 1650                     <tr class="border-b dark:border-gray-700">
+ 1651                         <td class="p-3">Salaires</td>
+ 1652                         <td class="p-3 text-right">-</td>
+ 1653                         <td class="p-3 text-right text-danger">3 000 000</td>
+ 1654                     </tr>
+ 1655                     <tr class="border-b dark:border-gray-700">
+ 1656                         <td class="p-3">Loyers</td>
+ 1657                         <td class="p-3 text-right">-</td>
+ 1658                         <td class="p-3 text-right text-danger">1 500 000</td>
+ 1659                     </tr>
+ 1660                     <tr class="bg-gray-50 dark:bg-gray-900 font-bold">
+ 1661                         <td class="p-3">TOTAUX</td>
+ 1662                         <td class="p-3 text-right text-success">15 200 000</td>
+ 1663                         <td class="p-3 text-right text-danger">9 220 000</td>
+ 1664                     </tr>
+ 1665                     <tr class="bg-green-50 dark:bg-green-900/20 font-bold text-lg">
+ 1666                         <td class="p-3" colspan="2">SOLDE (Recettes - Dépenses)</td>
+ 1667                         <td class="p-3 text-right text-success">+5 980 000</td>
+ 1668                     </tr>
+ 1669                 </tbody>
+ 1670             </table>
+ 1671         `;
+ 1672     },
+ 1673 
+ 1674     genererBilanMinimal(ecritures) {
+ 1675         return `
+ 1676             <div class="grid grid-cols-2 gap-4">
+ 1677                 <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
+ 1678                     <h4 class="font-bold text-primary mb-3">ACTIF</h4>
+ 1679                     <ul class="space-y-2 text-sm">
+ 1680                         <li class="flex justify-between"><span>Trésorerie</span><span class="font-bold">8 900 000</span></li>
+ 1681                         <li class="flex justify-between"><span>Créances</span><span class="font-bold">3 200 000</span></li>
+ 1682                         <li class="flex justify-between border-t pt-2 font-bold text-primary"><span>Total</span><span>12 100 000</span></li>
+ 1683                     </ul>
+ 1684                 </div>
+ 1685                 <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
+ 1686                     <h4 class="font-bold text-success mb-3">PASSIF</h4>
+ 1687                     <ul class="space-y-2 text-sm">
+ 1688                         <li class="flex justify-between"><span>Capitaux Propres</span><span class="font-bold">7 380 000</span></li>
+ 1689                         <li class="flex justify-between"><span>Dettes</span><span class="font-bold">4 720 000</span></li>
+ 1690                         <li class="flex justify-between border-t pt-2 font-bold text-success"><span>Total</span><span>12 100 000</span></li>
+ 1691                     </ul>
+ 1692                 </div>
+ 1693             </div>
+ 1694         `;
+ 1695     },
+ 1696 
+ 1697     genererAnnexes(ecritures) {
+ 1698         return `
+ 1699             <div class="space-y-4 text-sm">
+ 1700                 <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
+ 1701                     <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">1. Méthodes comptables</h4>
+ 1702                     <p class="text-gray-600 dark:text-gray-400">Les états financiers sont établis conformément au référentiel SYSCOHADA Révisé applicable dans l'espace OHADA.</p>
+ 1703                 </div>
+ 1704                 <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
+ 1705                     <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">2. Immobilisations</h4>
+ 1706                     <p class="text-gray-600 dark:text-gray-400">Les immobilisations corporelles sont évaluées à leur coût d'acquisition diminué des amortissements cumulés.</p>
+ 1707                 </div>
+ 1708                 <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
+ 1709                     <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-2">3. Événements postérieurs</h4>
+ 1710                     <p class="text-gray-600 dark:text-gray-400">Aucun événement significatif n'est survenu entre la date de clôture et la date d'établissement des états financiers.</p>
+ 1711                 </div>
+ 1712             </div>
+ 1713         `;
+ 1714     },
+ 1715 
+ 1716     // -------------------------------------------------------------------------
+ 1717     // 2.10. FONCTIONS D'EXPORTATION
+ 1718     // -------------------------------------------------------------------------
+ 1719     exportToExcel(module) {
+ 1720         const companyName = this.state.activeCompany?.name || 'Export';
+ 1721         console.log(`Export Excel de ${module} pour ${companyName}`);
+ 1722         NotificationManager.show('info', 'Export Excel', `Génération du fichier Excel SYSCOHADA pour "${module}" en cours...`);
+ 1723         // TODO: Intégrer SheetJS pour l'export réel
+ 1724     },
+ 1725 
+ 1726     exportToPDF(module) {
+ 1727         const companyName = this.state.activeCompany?.name || 'Export';
+ 1728         console.log(`Export PDF de ${module} pour ${companyName}`);
+ 1729         NotificationManager.show('info', 'Export PDF', `Génération du PDF certifié pour "${module}" en cours...`);
+ 1730         // TODO: Intégrer jsPDF pour l'export réel
+ 1731     },
+ 1732 
+ 1733     // -------------------------------------------------------------------------
+ 1734     // 2.11. ÉCOUTEURS D'ÉVÉNEMENTS GLOBAUX
+ 1735     // -------------------------------------------------------------------------
+ 1736     setupEventListeners() {
+ 1737         // Formulaire de connexion
+ 1738         const loginForm = document.getElementById('login-form');
+ 1739         if (loginForm) {
+ 1740             loginForm.addEventListener('submit', async (e) => {
+ 1741                 e.preventDefault();
+ 1742                 const email = document.getElementById('email').value.trim();
+ 1743                 const password = document.getElementById('password').value;
+ 1744                 
+ 1745                 const submitBtn = loginForm.querySelector('button[type="submit"]');
+ 1746                 const originalText = submitBtn.innerHTML;
+ 1747                 submitBtn.innerHTML = '<div class="loading-spinner mx-auto" style="width:24px;height:24px;border-width:2px;"></div>';
+ 1748                 submitBtn.disabled = true;
+ 1749                 
+ 1750                 try {
+ 1751                     const userContext = await this.handleLogin(email, password);
+ 1752                     this.saveSession(userContext);
+ 1753                     await this.loadInitialData();
+ 1754                     this.renderDashboard();
+ 1755                     NotificationManager.show('success', 'Connexion réussie', `Bienvenue, ${userContext.utilisateurNom} !`);
+ 1756                 } catch (error) {
+ 1757                     this.displayAuthMessage('login', error.message, 'danger');
+ 1758                 } finally {
+ 1759                     submitBtn.innerHTML = originalText;
+ 1760                     submitBtn.disabled = false;
+ 1761                 }
+ 1762             });
+ 1763         }
+ 1764         
+ 1765         // Formulaire d'inscription
+ 1766         const registerForm = document.getElementById('register-form');
+ 1767         if (registerForm) {
+ 1768             registerForm.addEventListener('submit', async (e) => {
+ 1769                 e.preventDefault();
+ 1770                 const name = document.getElementById('reg-name').value.trim();
+ 1771                 const email = document.getElementById('reg-email').value.trim();
+ 1772                 const password = document.getElementById('reg-password').value;
+ 1773                 const companyName = document.getElementById('reg-company').value.trim();
+ 1774                 
+ 1775                 if (!name || !email || !password || !companyName) {
+ 1776                     showAlertModal('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
+ 1777                     return;
+ 1778                 }
+ 1779                 
+ 1780                 const submitBtn = registerForm.querySelector('button[type="submit"]');
+ 1781                 const originalText = submitBtn.innerHTML;
+ 1782                 submitBtn.innerHTML = '<div class="loading-spinner mx-auto" style="width:24px;height:24px;border-width:2px;"></div>';
+ 1783                 submitBtn.disabled = true;
+ 1784                 
+ 1785                 try {
+ 1786                     const userContext = await this.handleRegistration({ name, email, password, companyName });
+ 1787                     this.saveSession(userContext);
+ 1788                     await this.loadInitialData();
+ 1789                     this.renderDashboard();
+ 1790                     NotificationManager.show('success', 'Compte créé', `Bienvenue dans DOUKÈ PRO, ${userContext.utilisateurNom} !`);
+ 1791                 } catch (error) {
+ 1792                     showAlertModal('Erreur d\'inscription', error.message);
+ 1793                 } finally {
+ 1794                     submitBtn.innerHTML = originalText;
+ 1795                     submitBtn.disabled = false;
+ 1796                 }
+ 1797             });
+ 1798         }
+ 1799         
+ 1800         // Navigation entre login et register
+ 1801         const showRegisterBtn = document.getElementById('show-register-btn');
+ 1802         if (showRegisterBtn) {
+ 1803             showRegisterBtn.addEventListener('click', () => this.renderRegisterView());
+ 1804         }
+ 1805         
+ 1806         const showLoginBtn = document.getElementById('show-login-btn');
+ 1807         if (showLoginBtn) {
+ 1808             showLoginBtn.addEventListener('click', () => this.renderLoginView());
+ 1809         }
+ 1810         
+ 1811         // Bouton de déconnexion
+ 1812         const logoutBtn = document.getElementById('logout-btn');
+ 1813         if (logoutBtn) {
+ 1814             logoutBtn.addEventListener('click', () => this.logout());
+ 1815         }
+ 1816     }
+ 1817 };
+ 1818 
+ 1819 // =================================================================================
+ 1820 // 3. EXPOSITION GLOBALE ET LANCEMENT
+ 1821 // =================================================================================
+ 1822 
+ 1823 // Exposer le gestionnaire unifié pour compatibilité avec les anciens modules
+ 1824 window.unifiedManager = {
+ 1825     notificationManager: NotificationManager,
+ 1826     modalManager: ModalManager,
+ 1827     showNotification: (type, title, message, duration) => NotificationManager.show(type, title, message, duration),
+ 1828     showModal: (title, content) => ModalManager.show(title, content),
+ 1829     getSelectedCompanyName: () => DoukeApp.state.activeCompany?.name || 'Entreprise non définie'
+ 1830 };
+ 1831 
+ 1832 // Exposer l'état global pour compatibilité
+ 1833 window.app = {
+ 1834     get currentCompanyId() { return DoukeApp.state.activeCompany?.id || null; },
+ 1835     get currentCompanyName() { return DoukeApp.state.activeCompany?.name || null; },
+ 1836     get currentSysteme() { return DoukeApp.state.currentSysteme; },
+ 1837     get filteredData() { return DoukeApp.state.filteredData; }
+ 1838 };
+ 1839 
+ 1840 window.userContext = null;
+ 1841 
+ 1842 // Exposer DoukeApp globalement
+ 1843 window.DoukeApp = DoukeApp;
+ 1844 
+ 1845 // Lancement automatique au chargement du DOM
+ 1846 document.addEventListener('DOMContentLoaded', () => {
+ 1847     DoukeApp.init();
+ 1848 });
