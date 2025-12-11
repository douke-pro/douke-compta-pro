+   1 // =================================================================================
+   2 // FICHIER : assets/script.js
+   3 // Description : Logique complète de l'application Doukè Compta Pro
+   4 // VERSION : OPTIMALE 4.2 - Détection automatique local/Codespaces/Render
+   5 // =================================================================================
+   6 
+   7 // =================================================================================
+   8 // 1. CONFIGURATION GLOBALE - DÉTECTION AUTOMATIQUE DE L'ENVIRONNEMENT
+   9 // =================================================================================
+  10 
+  11 // =================================================================================
+  12 // DÉFINITION ROBUSTE DE L'URL DE L'API (CORRECTION CRITIQUE DES CONFLITS LOCAL/CODESPACES)
+  13 // =================================================================================
+  14 let API_BASE_URL;
+  15 
+  16 // On utilise window.location.host pour s'adapter à localhost ou à l'URL Codespaces (HTTPS)
+  17 if (window.location.host.includes('codespaces.github.dev') || window.location.host.endsWith('-3000.app.github.dev')) {
+  18     // Si Codespaces est détecté, on utilise l'hôte et le protocole actuels (HTTPS)
+  19     const protocol = window.location.protocol;
+  20     const host = window.location.host;
+  21     API_BASE_URL = protocol + '//' + host + '/api';
+  22     console.log(`[ENV DEBUG] Codespaces/URL dynamique détecté. API_BASE_URL: ${API_BASE_URL}`);
+  23 
+  24 } else {
+  25     // Si local, on utilise l'adresse standard HTTP
+  26     API_BASE_URL = 'http://localhost:3000/api';
+  27     console.log(`[ENV DEBUG] Local détecté. API_BASE_URL: ${API_BASE_URL}`);
+  28 }
+  29 
+  30 window.userContext = null;
+  31 
+  32 const ROLES = {
+  33     ADMIN: 'ADMIN',
+  34     COLLABORATEUR: 'COLLABORATEUR',
+  35     USER: 'USER',
+  36     CAISSIER: 'CAISSIER',
+  37 };
+  38 
+  39 // =================================================================================
+  40 // 2. AUTHENTIFICATION ET CONTEXTE (ALIGNÉ SERVEUR)
+  41 // =================================================================================
+  42 
+  43 /**
+  44  * Connexion utilisateur via l'API serveur.
+  45  * Endpoint: POST /api/auth/login
+  46  */
+  47 async function handleLogin(email, password) {
+  48     const endpoint = `${API_BASE_URL}/auth/login`;
+  49 
+  50     console.log('🔐 Tentative de connexion sur:', endpoint);
+  51 
+  52     try {
+  53         const response = await fetch(endpoint, {
+  54             method: 'POST',
+  55             headers: { 'Content-Type': 'application/json' },
+  56             body: JSON.stringify({ email, password })
+  57         });
+  58 
+  59         const data = await response.json();
+  60 
+  61         if (response.ok) {
+  62             console.log('✅ Connexion réussie:', data.utilisateurRole);
+  63             return {
+  64                 utilisateurRole: data.utilisateurRole,
+  65                 utilisateurId: data.utilisateurId,
+  66                 utilisateurNom: data.utilisateurNom,
+  67                 token: data.token,
+  68                 entrepriseContextId: data.entrepriseContextId || null,
+  69                 entrepriseContextName: data.entrepriseContextName || 'Aucune sélectionnée',
+  70                 multiEntreprise: data.multiEntreprise || false
+  71             };
+  72         } else {
+  73             throw new Error(data.error || 'Erreur de connexion inconnue');
+  74         }
+  75 
+  76     } catch (error) {
+  77         if (error.message === 'Failed to fetch') {
+  78             throw new Error('Serveur injoignable. Vérifiez que le serveur est démarré.');
+  79         }
+  80         throw error;
+  81     }
+  82 }
+  83 
+  84 /**
+  85  * Inscription (MOCK côté client - endpoint serveur à créer)
+  86  */
+  87 async function handleRegistration(payload) {
+  88     console.warn('⚠️ INSCRIPTION EN MODE MOCK - Créez POST /api/auth/register sur le serveur');
+  89 
+  90     await new Promise(resolve => setTimeout(resolve, 1000));
+  91 
+  92     const mockContext = {
+  93         utilisateurRole: 'USER',
+  94         utilisateurId: 'USR_NEW_' + Math.random().toString(36).substring(7),
+  95         utilisateurNom: payload.username,
+  96         token: 'jwt.mock.new.user',
+  97         entrepriseContextId: 'ENT_NEW_' + Math.random().toString(36).substring(7),
+  98         entrepriseContextName: payload.companyName,
+  99         multiEntreprise: false
+ 100     };
+ 101 
+ 102     return mockContext;
+ 103 }
+ 104 
+ 105 /**
+ 106  * Récupère les entreprises accessibles à l'utilisateur.
+ 107  * Endpoint: GET /api/companies/:userId
+ 108  */
+ 109 async function fetchUserCompanies(context) {
+ 110     if (!context || !context.utilisateurId) {
+ 111         console.error('❌ Impossible de récupérer les entreprises sans utilisateurId');
+ 112         return [];
+ 113     }
+ 114 
+ 115     const endpoint = `${API_BASE_URL}/companies/${context.utilisateurId}`;
+ 116 
+ 117     console.log('📊 Récupération des entreprises:', endpoint);
+ 118 
+ 119     try {
+ 120         const response = await fetch(endpoint, {
+ 121             method: 'GET',
+ 122             headers: { 'Content-Type': 'application/json' }
+ 123         });
+ 124 
+ 125         const data = await response.json();
+ 126 
+ 127         if (response.ok && Array.isArray(data)) {
+ 128             console.log('✅ Entreprises récupérées:', data.length);
+ 129             return data;
+ 130         } else {
+ 131             console.error('❌ Erreur récupération entreprises:', data.error || 'Erreur inconnue');
+ 132             return [];
+ 133         }
+ 134 
+ 135     } catch (error) {
+ 136         console.error('❌ Erreur réseau:', error);
+ 137         return [];
+ 138     }
+ 139 }
+ 140 
+ 141 /**
+ 142  * Simule les statistiques globales admin (MOCK - à implémenter côté serveur)
+ 143  */
+ 144 async function fetchGlobalAdminStats() {
+ 145     await new Promise(resolve => setTimeout(resolve, 300));
+ 146     return {
+ 147         totalCompanies: 4,
+ 148         activeCompanies: 3,
+ 149         collaborators: 6,
+ 150         totalFiles: 120,
+ 151         pendingRequests: 5,
+ 152         pendingValidations: 8,
+ 153     };
+ 154 }
+ 155 
+ 156 /**
+ 157  * Change le contexte entreprise pour utilisateurs multi-entreprises
+ 158  */
+ 159 async function changeCompanyContext(newId, newName) {
+ 160     if (window.userContext && window.userContext.multiEntreprise) {
+ 161         window.userContext.entrepriseContextId = newId;
+ 162         window.userContext.entrepriseContextName = newName;
+ 163         await loadView('dashboard');
+ 164         updateHeaderContext(window.userContext);
+ 165     }
+ 166 }
+ 167 
+ 168 // =================================================================================
+ 169 // 3. GESTION DES VUES ET DU CONTEXTE
+ 170 // =================================================================================
+ 171 
+ 172 /**
+ 173  * Initialise le dashboard après connexion réussie
+ 174  */
+ 175 function initDashboard(context) {
+ 176     window.userContext = context;
+ 177 
+ 178     document.getElementById('auth-view').classList.add('hidden');
+ 179     const registerView = document.getElementById('register-view');
+ 180     if (registerView) {
+ 181         registerView.classList.add('hidden');
+ 182     }
+ 183     document.getElementById('dashboard-view').classList.remove('hidden');
+ 184 
+ 185     updateHeaderContext(context);
+ 186     updateNavigationMenu(context.utilisateurRole);
+ 187     loadView('dashboard');
+ 188 }
+ 189 
+ 190 /**
+ 191  * Met à jour le header avec les informations contextuelles
+ 192  */
+ 193 function updateHeaderContext(context) {
+ 194     const firstName = context.utilisateurNom.split(' ')[0];
+ 195     document.getElementById('welcome-message').textContent = `Bienvenue, ${firstName}`;
+ 196     document.getElementById('current-role').textContent = context.utilisateurRole;
+ 197     document.getElementById('current-company-name').textContent = context.entrepriseContextName || '-- Global --';
+ 198 
+ 199     const contextMessage = document.getElementById('context-message');
+ 200     if (context.multiEntreprise && !context.entrepriseContextId) {
+ 201         contextMessage.textContent = '⚠️ CONTEXTE NON SÉLECTIONNÉ. Veuillez choisir une entreprise pour effectuer des opérations.';
+ 202     } else {
+ 203         contextMessage.textContent = `Contexte de travail actuel: ${context.entrepriseContextName || 'Aucune sélectionnée'}.`;
+ 204     }
+ 205 }
+ 206 
+ 207 /**
+ 208  * Construit le menu de navigation selon le rôle
+ 209  */
+ 210 function updateNavigationMenu(role) {
+ 211     const navMenu = document.getElementById('role-navigation-menu');
+ 212     navMenu.innerHTML = '';
+ 213 
+ 214     let menuItems = [
+ 215         { name: 'Tableau de Bord', icon: 'fas fa-chart-line', view: 'dashboard' }
+ 216     ];
+ 217 
+ 218     if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
+ 219         menuItems.push({ name: 'Créer une Entreprise', icon: 'fas fa-building-circle-check', view: 'create-company' });
+ 220     }
+ 221 
+ 222     if (window.userContext && window.userContext.entrepriseContextId) {
+ 223         menuItems.push({ name: 'Saisie des Flux', icon: 'fas fa-cash-register', view: 'saisie' });
+ 224         if (role !== ROLES.CAISSIER) {
+ 225             menuItems.push({ name: 'Saisie Écriture Journal', icon: 'fas fa-table', view: 'journal-entry' });
+ 226             menuItems.push({ name: 'Générer États Financiers', icon: 'fas fa-file-invoice-dollar', view: 'reports' });
+ 227             menuItems.push({ name: 'Validation Opérations', icon: 'fas fa-check-double', view: 'validation' });
+ 228         }
+ 229     }
+ 230 
+ 231     if (role === ROLES.ADMIN) {
+ 232         menuItems.push({ name: 'Gestion Utilisateurs', icon: 'fas fa-users-cog', view: 'user-management' });
+ 233     }
+ 234 
+ 235     if (role === ROLES.ADMIN || role === ROLES.COLLABORATEUR) {
+ 236         menuItems.push({ name: 'Changer d\'Entreprise', icon: 'fas fa-sync-alt', view: 'selector' });
+ 237     }
+ 238 
+ 239     menuItems.forEach(item => {
+ 240         const link = document.createElement('a');
+ 241         link.href = '#';
+ 242         link.className = 'flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-lg transition duration-200';
+ 243         link.innerHTML = `<i class="${item.icon} mr-3"></i> ${item.name}`;
+ 244 
+ 245         link.addEventListener('click', (e) => {
+ 246             e.preventDefault();
+ 247             if (item.view === 'selector') {
+ 248                 renderEnterpriseSelectorView();
+ 249             } else {
+ 250                 loadView(item.view);
+ 251             }
+ 252         });
+ 253 
+ 254         navMenu.appendChild(link);
+ 255     });
+ 256 }
+ 257 
+ 258 /**
+ 259  * Routage des vues selon le nom
+ 260  */
+ 261 async function loadView(viewName) {
+ 262     const contentArea = document.getElementById('dashboard-content-area');
+ 263     contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary mb-4"></i><p class="text-lg">Chargement...</p></div>';
+ 264 
+ 265     const requiresContext = ['saisie', 'journal-entry', 'validation', 'reports'];
+ 266 
+ 267     if (requiresContext.includes(viewName) && !window.userContext.entrepriseContextId && window.userContext.multiEntreprise) {
+ 268         alert('🚨 Opération Bloquée. Veuillez sélectionner une entreprise.');
+ 269         return renderEnterpriseSelectorView(viewName);
+ 270     }
+ 271 
+ 272     switch (viewName) {
+ 273         case 'dashboard':
+ 274             contentArea.innerHTML = await renderDashboard(window.userContext);
+ 275             break;
+ 276         case 'saisie':
+ 277             contentArea.innerHTML = renderSaisieFormCaissier();
+ 278             break;
+ 279         case 'journal-entry':
+ 280             contentArea.innerHTML = renderJournalEntryForm();
+ 281             break;
+ 282         case 'validation':
+ 283             contentArea.innerHTML = generateValidationTable();
+ 284             break;
+ 285         case 'reports':
+ 286             contentArea.innerHTML = renderReportsView();
+ 287             break;
+ 288         case 'create-company':
+ 289             contentArea.innerHTML = renderCreateCompanyForm();
+ 290             break;
+ 291         case 'user-management':
+ 292             if (window.userContext.utilisateurRole === ROLES.ADMIN) {
+ 293                 contentArea.innerHTML = renderUserManagementView();
+ 294             } else {
+ 295                 contentArea.innerHTML = renderAccessDenied();
+ 296             }
+ 297             break;
+ 298         default:
+ 299             contentArea.innerHTML = renderNotFound();
+ 300     }
+ 301 }
+ 302 
+ 303 /**
+ 304  * Affiche le sélecteur d'entreprise pour les rôles multi-entreprises
+ 305  */
+ 306 async function renderEnterpriseSelectorView(blockedViewName = null) {
+ 307     const contentArea = document.getElementById('dashboard-content-area');
+ 308     contentArea.innerHTML = '<div class="text-center p-8"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p>Chargement des entreprises...</p></div>';
+ 309 
+ 310     try {
+ 311         const companies = await fetchUserCompanies(window.userContext);
+ 312 
+ 313         let companyListHTML = '';
+ 314         if (companies.length === 0) {
+ 315             companyListHTML = '<div class="p-6 text-center bg-warning bg-opacity-10 rounded-xl"><i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i><p class="text-warning font-semibold">Aucune entreprise trouvée.</p></div>';
+ 316         } else {
+ 317             companyListHTML = companies.map(company => `
+ 318                 <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 border-primary hover:border-secondary"
+ 319                      data-company-id="${company.id}" data-company-name="${company.name}">
+ 320                     <h4 class="text-xl font-bold text-primary mb-2">${company.name}</h4>
+ 321                     <p class="text-sm text-gray-600 dark:text-gray-400">ID: ${company.id}</p>
+ 322                     <div class="mt-4 flex justify-between text-sm">
+ 323                         <span class="text-success"><i class="fas fa-chart-bar"></i> ${company.stats.transactions} transactions</span>
+ 324                     </div>
+ 325                 </div>
+ 326             `).join('');
+ 327         }
+ 328 
+ 329         contentArea.innerHTML = `
+ 330             <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
+ 331                 <h2 class="text-3xl font-extrabold text-danger mb-2">Sélectionner un Contexte d'Entreprise</h2>
+ 332                 <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
+ 333                     ${blockedViewName ? `<strong class="text-danger">Action Bloquée:</strong> Sélectionnez une entreprise pour "${blockedViewName}"` : 'Choisissez l\'entreprise sur laquelle vous souhaitez travailler.'}
+ 334                 </p>
+ 335                 <div id="company-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
+ 336                     ${companyListHTML}
+ 337                 </div>
+ 338             </div>
+ 339         `;
+ 340 
+ 341         contentArea.querySelectorAll('[data-company-id]').forEach(element => {
+ 342             element.addEventListener('click', function() {
+ 343                 const companyId = this.getAttribute('data-company-id');
+ 344                 const companyName = this.getAttribute('data-company-name');
+ 345 
+ 346                 window.userContext.entrepriseContextId = companyId;
+ 347                 window.userContext.entrepriseContextName = companyName;
+ 348                 document.getElementById('current-company-name').textContent = companyName;
+ 349 
+ 350                 updateNavigationMenu(window.userContext.utilisateurRole);
+ 351                 loadView('dashboard');
+ 352             });
+ 353         });
+ 354 
+ 355     } catch (error) {
+ 356         contentArea.innerHTML = `
+ 357             <div class="max-w-4xl mx-auto p-8 bg-danger bg-opacity-10 border-4 border-danger rounded-xl text-center">
+ 358                 <i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i>
+ 359                 <h2 class="text-2xl font-extrabold text-danger">Erreur de Chargement</h2>
+ 360                 <p class="text-lg">${error.message}</p>
+ 361             </div>
+ 362         `;
+ 363     }
+ 364 
+ 365     updateHeaderContext(window.userContext);
+ 366 }
+ 367 
+ 368 // =================================================================================
+ 369 // 4. RENDUS DES DASHBOARDS SPÉCIFIQUES
+ 370 // =================================================================================
+ 371 
+ 372 async function renderDashboard(context) {
+ 373     if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && !context.entrepriseContextId) {
+ 374         return context.utilisateurRole === ROLES.ADMIN ?
+ 375             await renderAdminGlobalDashboard(context) :
+ 376             await renderCollaborateurGlobalDashboard(context);
+ 377     }
+ 378 
+ 379     if ((context.utilisateurRole === ROLES.ADMIN || context.utilisateurRole === ROLES.COLLABORATEUR) && context.entrepriseContextId) {
+ 380         return await renderCompanySpecificDashboard(context);
+ 381     }
+ 382 
+ 383     if (context.utilisateurRole === ROLES.USER) {
+ 384         return await renderUserDashboard(context);
+ 385     }
+ 386     if (context.utilisateurRole === ROLES.CAISSIER) {
+ 387         return await renderCaissierDashboard(context);
+ 388     }
+ 389 
+ 390     return renderNotFound();
+ 391 }
+ 392 
+ 393 async function renderAdminGlobalDashboard(context) {
+ 394     const stats = await fetchGlobalAdminStats();
+ 395     const companies = await fetchUserCompanies(context);
+ 396 
+ 397     const statCards = `
+ 398         <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
+ 399             ${generateStatCard('fas fa-building', 'Total Entreprises', stats.totalCompanies, 'bg-primary')}
+ 400             ${generateStatCard('fas fa-check-circle', 'Entreprises Actives', stats.activeCompanies, 'bg-success')}
+ 401             ${generateStatCard('fas fa-users', 'Collaborateurs', stats.collaborators, 'bg-info')}
+ 402             ${generateStatCard('fas fa-envelope-open-text', 'Demandes en Cours', stats.pendingRequests, 'bg-warning')}
+ 403         </div>
+ 404     `;
+ 405 
+ 406     const companyOptions = companies.map(c =>
+ 407         `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
+ 408     ).join('');
+ 409 
+ 410     return `
+ 411         <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Administrateur Système (Global)</h2>
+ 412         ${statCards}
+ 413 
+ 414         <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6">
+ 415             <h3 class="text-xl font-bold text-info mb-4">Sélectionnez une Entreprise pour Travailler</h3>
+ 416             <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
+ 417                 <option value="">-- Choisir une entreprise --</option>
+ 418                 ${companyOptions}
+ 419             </select>
+ 420         </div>
+ 421 
+ 422         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
+ 423             ${renderActivityFeed()}
+ 424             ${renderAccountingReports()}
+ 425         </div>
+ 426 
+ 427         <script>
+ 428             document.getElementById('company-selector').addEventListener('change', function() {
+ 429                 const selectedOption = this.options[this.selectedIndex];
+ 430                 const newId = selectedOption.value || null;
+ 431                 const newName = selectedOption.dataset.name || '-- Global --';
+ 432 
+ 433                 if (newId) {
+ 434                     changeCompanyContext(newId, newName);
+ 435                 } else {
+ 436                     window.userContext.entrepriseContextId = null;
+ 437                     window.userContext.entrepriseContextName = '-- Global --';
+ 438                     updateHeaderContext(window.userContext);
+ 439                     loadView('dashboard');
+ 440                 }
+ 441             });
+ 442         </script>
+ 443     `;
+ 444 }
+ 445 
+ 446 async function renderCollaborateurGlobalDashboard(context) {
+ 447     const companies = await fetchUserCompanies(context);
+ 448     const companyOptions = companies.map(c =>
+ 449         `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`
+ 450     ).join('');
+ 451 
+ 452     return `
+ 453         <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Collaborateur (Sélection Entreprise)</h2>
+ 454 
+ 455         <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 border-info mb-6">
+ 456             <h3 class="text-xl font-bold text-info mb-4">Sélectionnez l'Entreprise sur laquelle travailler</h3>
+ 457             <p class="text-gray-600 dark:text-gray-300 mb-4">Les options de saisie apparaîtront après sélection.</p>
+ 458             <select id="company-selector" class="mt-1 block w-96 px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white">
+ 459                 <option value="">-- Choisir une entreprise --</option>
+ 460                 ${companyOptions}
+ 461             </select>
+ 462         </div>
+ 463 
+ 464         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
+ 465             ${renderActivityFeed()}
+ 466         </div>
+ 467 
+ 468         <script>
+ 469             document.getElementById('company-selector').addEventListener('change', function() {
+ 470                 const selectedOption = this.options[this.selectedIndex];
+ 471                 const newId = selectedOption.value || null;
+ 472                 const newName = selectedOption.dataset.name || '-- Global --';
+ 473 
+ 474                 if (newId) {
+ 475                     changeCompanyContext(newId, newName);
+ 476                 }
+ 477             });
+ 478         </script>
+ 479     `;
+ 480 }
+ 481 
+ 482 async function renderCompanySpecificDashboard(context) {
+ 483     const userCompanies = await fetchUserCompanies(context) || [];
+ 484     const currentCompany = userCompanies.find(c => c.id === context.entrepriseContextId);
+ 485 
+ 486     if (!currentCompany) {
+ 487         return '<div class="text-center p-8 text-danger">Entreprise introuvable.</div>';
+ 488     }
+ 489 
+ 490     const stats = currentCompany.stats;
+ 491     const statCards = `
+ 492         <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
+ 493             ${generateStatCard('fas fa-chart-bar', 'Résultat Provisoire', (stats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')}
+ 494             ${generateStatCard('fas fa-hand-holding-usd', 'Total Transactions', stats.transactions || 0, 'bg-primary')}
+ 495             ${generateStatCard('fas fa-history', 'Opérations en Attente', stats.pending || 0, 'bg-warning')}
+ 496             ${generateStatCard('fas fa-money-check-alt', 'Solde Caisse/Banque', (stats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
+ 497         </div>
+ 498     `;
+ 499 
+ 500     return `
+ 501         <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord Comptable de ${context.entrepriseContextName}</h2>
+ 502         <div class="p-4 bg-warning bg-opacity-10 border-l-4 border-warning rounded-xl mb-6 flex justify-between items-center">
+ 503             <p class="text-sm">Contexte actuel: <strong>${context.entrepriseContextName}</strong>
+ 504                 <a href="#" onclick="changeCompanyContext(null, '-- Global --'); loadView('dashboard'); return false;" class="text-danger hover:underline font-bold ml-2">
+ 505                     <i class="fas fa-undo"></i> Changer
+ 506                 </a>
+ 507             </p>
+ 508             <button onclick="loadView('journal-entry')" class="py-1 px-4 bg-secondary text-white rounded-lg text-sm">
+ 509                 <i class="fas fa-plus mr-1"></i> Saisie Rapide
+ 510             </button>
+ 511         </div>
+ 512         ${statCards}
+ 513         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
+ 514             ${renderActivityFeed()}
+ 515             ${renderAccountingReports()}
+ 516         </div>
+ 517     `;
+ 518 }
+ 519 
+ 520 async function renderUserDashboard(context) {
+ 521     const userCompanies = await fetchUserCompanies(context) || [];
+ 522     const companyStats = userCompanies.length > 0 ? userCompanies[0].stats : {};
+ 523 
+ 524     if (userCompanies.length === 0) {
+ 525         return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Entreprise Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
+ 526     }
+ 527 
+ 528     const statCards = `
+ 529         <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
+ 530             ${generateStatCard('fas fa-hand-holding-usd', 'Résultat Net', (companyStats.result || 0).toLocaleString('fr-FR') + ' XOF', 'bg-success')}
+ 531             ${generateStatCard('fas fa-wallet', 'Transactions', companyStats.transactions || 0, 'bg-primary')}
+ 532             ${generateStatCard('fas fa-hourglass-half', 'En Attente', companyStats.pending || 0, 'bg-warning')}
+ 533             ${generateStatCard('fas fa-chart-area', 'Trésorerie', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
+ 534         </div>
+ 535     `;
+ 536 
+ 537     return `
+ 538         <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de ${context.entrepriseContextName}</h2>
+ 539         ${statCards}
+ 540         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
+ 541             ${renderActivityFeed()}
+ 542             ${renderAccountingReports()}
+ 543         </div>
+ 544     `;
+ 545 }
+ 546 
+ 547 async function renderCaissierDashboard(context) {
+ 548     const userCompanies = await fetchUserCompanies(context) || [];
+ 549 
+ 550     if (userCompanies.length === 0) {
+ 551         return '<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl"><i class="fas fa-exclamation-circle fa-3x text-danger mb-4"></i><h3 class="text-2xl font-extrabold text-danger">ERREUR: Caisse Introuvable</h3><p>Contactez l\'administrateur système.</p></div>';
+ 552     }
+ 553 
+ 554     const companyStats = userCompanies[0].stats;
+ 555 
+ 556     const statCards = `
+ 557         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
+ 558             ${generateStatCard('fas fa-wallet', 'Solde de Ma Caisse', (companyStats.cash || 0).toLocaleString('fr-FR') + ' XOF', 'bg-info')}
+ 559             ${generateStatCard('fas fa-receipt', 'Transactions du Jour', companyStats.transactions || 0, 'bg-primary')}
+ 560             ${generateStatCard('fas fa-clock', 'Opérations en Attente', companyStats.pending || 0, 'bg-warning')}
+ 561         </div>
+ 562     `;
+ 563 
+ 564     return `
+ 565         <h2 class="text-3xl font-extrabold text-primary mb-6">Tableau de Bord de Caisse de ${context.entrepriseContextName}</h2>
+ 566         <div class="p-6 bg-secondary bg-opacity-10 border border-secondary rounded-xl text-center mb-6">
+ 567             <h3 class="text-xl font-bold text-secondary">Interface de Caisse Rapide</h3>
+ 568             <p class="text-gray-700 dark:text-gray-300">Utilisez "Saisie des Flux" pour enregistrer les entrées/sorties.</p>
+ 569         </div>
+ 570         ${statCards}
+ 571         <div class="grid grid-cols-1 gap-6">
+ 572             ${renderActivityFeed()}
+ 573         </div>
+ 574     `;
+ 575 }
+ 576 
+ 577 // =================================================================================
+ 578 // 5. HELPERS DE RENDU
+ 579 // =================================================================================
+ 580 
+ 581 function generateStatCard(icon, title, value, bgColor) {
+ 582     return `
+ 583         <div class="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-between transform transition hover:scale-105">
+ 584             <div>
+ 585                 <p class="text-sm font-medium text-gray-500 dark:text-gray-400">${title}</p>
+ 586                 <p class="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">${value}</p>
+ 587             </div>
+ 588             <div class="p-3 rounded-full ${bgColor} bg-opacity-10">
+ 589                 <i class="${icon} text-2xl ${bgColor.replace('bg-', 'text-')}"></i>
+ 590             </div>
+ 591         </div>
+ 592     `;
+ 593 }
+ 594 
+ 595 function renderActivityFeed() {
+ 596     return `
+ 597         <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
+ 598             <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Fil d'Activité Récent</h3>
+ 599             <ul class="space-y-3 text-sm">
+ 600                 <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-success">[14:30]</span> Validation de la dépense CRB-005.</li>
+ 601                 <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-primary">[10:00]</span> Connexion utilisateur CAI_004.</li>
+ 602                 <li class="p-2 border-b dark:border-gray-700"><span class="font-bold text-danger">[08:15]</span> Écriture Journal AC-001 rejetée.</li>
+ 603                 <li class="p-2"><span class="font-bold text-info">[Hier]</span> Nouvel utilisateur ajouté.</li>
+ 604             </ul>
+ 605         </div>
+ 606     `;
+ 607 }
+ 608 
+ 609 function renderAccountingReports() {
+ 610     return `
+ 611         <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
+ 612             <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rapports SYSCOHADA</h3>
+ 613             <ul class="space-y-3 text-sm">
+ 614                 <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
+ 615                     <span>Bilan Provisoire (N)</span>
+ 616                     <button class="text-info hover:text-primary" onclick="alert('Génération Bilan...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
+ 617                 </li>
+ 618                 <li class="flex justify-between items-center p-2 border-b dark:border-gray-700">
+ 619                     <span>Tableau de Formation des Résultats (TFR)</span>
+ 620                     <button class="text-info hover:text-primary" onclick="alert('Génération TFR...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
+ 621                 </li>
+ 622                 <li class="flex justify-between items-center p-2">
+ 623                     <span>Grand Livre</span>
+ 624                     <button class="text-info hover:text-primary" onclick="alert('Génération Grand Livre...')"><i class="fas fa-download mr-1"></i> Télécharger</button>
+ 625                 </li>
+ 626             </ul>
+ 627         </div>
+ 628     `;
+ 629 }
+ 630 
+ 631 function renderNotFound() {
+ 632     return '<div class="text-center p-8 text-danger"><i class="fas fa-exclamation-circle mr-2"></i> Vue non trouvée.</div>';
+ 633 }
+ 634 
+ 635 function renderAccessDenied() {
+ 636     return `<div class="max-w-xl mx-auto p-8 text-center bg-danger bg-opacity-10 border-2 border-danger rounded-xl">
+ 637         <i class="fas fa-lock fa-3x text-danger mb-4"></i>
+ 638         <h3 class="text-2xl font-extrabold text-danger">Accès Refusé</h3>
+ 639         <p>Vous n'avez pas l'autorisation d'accéder à cette fonctionnalité.</p>
+ 640     </div>`;
+ 641 }
+ 642 
+ 643 function renderReportsView() {
+ 644     return `
+ 645         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl text-center">
+ 646             <i class="fas fa-cogs fa-4x text-info mb-6"></i>
+ 647             <h2 class="text-3xl font-extrabold text-info mb-4">Génération de Rapports SYSCOHADA</h2>
+ 648             <p class="text-gray-700 dark:text-gray-300 mb-6">Configuration de la période comptable et génération des états financiers officiels (Bilan, TFR, etc.).</p>
+ 649             <button onclick="loadView('dashboard')" class="py-2 px-6 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition">
+ 650                 Retour au Tableau de Bord
+ 651             </button>
+ 652         </div>
+ 653     `;
+ 654 }
+ 655 
+ 656 function renderCreateCompanyForm() {
+ 657     return `
+ 658         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
+ 659             <h2 class="text-3xl font-extrabold text-secondary mb-6">Création de Nouvelle Entreprise</h2>
+ 660             <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Fonctionnalité en cours de développement (endpoint serveur à créer).</p>
+ 661             <form id="new-company-form" class="space-y-4">
+ 662                 <div>
+ 663                     <label class="block text-sm font-medium">Nom de l'Entreprise <span class="text-danger">*</span></label>
+ 664                     <input type="text" id="new-company-name" required class="mt-1 block w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" placeholder="Ex: Sarl Nouvelle Vision">
+ 665                 </div>
+ 666                 <p id="company-creation-message" class="text-center text-sm hidden"></p>
+ 667                 <button type="submit" class="w-full py-3 bg-secondary hover:bg-green-700 text-white font-bold rounded-lg transition">
+ 668                     <i class="fas fa-plus-circle mr-2"></i> Créer l'Entreprise (MOCK)
+ 669                 </button>
+ 670             </form>
+ 671         </div>
+ 672         <script>
+ 673             document.getElementById('new-company-form').addEventListener('submit', async function(e) {
+ 674                 e.preventDefault();
+ 675                 const msgElement = document.getElementById('company-creation-message');
+ 676                 const companyName = document.getElementById('new-company-name').value;
+ 677 
+ 678                 msgElement.classList.remove('hidden', 'text-danger', 'text-success');
+ 679                 msgElement.textContent = "Création en cours...";
+ 680 
+ 681                 await new Promise(resolve => setTimeout(resolve, 1500));
+ 682 
+ 683                 msgElement.textContent = \`✅ Entreprise "\${companyName}" créée (MOCK). Endpoint serveur à implémenter.\`;
+ 684                 msgElement.classList.add('text-success');
+ 685 
+ 686                 setTimeout(() => {
+ 687                     document.getElementById('new-company-form').reset();
+ 688                     msgElement.classList.add('hidden');
+ 689                 }, 3000);
+ 690             });
+ 691         </script>
+ 692     `;
+ 693 }
+ 694 
+ 695 function renderSaisieFormCaissier() {
+ 696     return `
+ 697         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
+ 698             <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie des Flux (Simple)</h2>
+ 699             <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie pour ${window.userContext.entrepriseContextName}.</p>
+ 700             <p class="text-sm text-warning">⚠️ Formulaire à implémenter - Endpoint: POST /api/saisie/flux</p>
+ 701         </div>
+ 702     `;
+ 703 }
+ 704 
+ 705 function renderJournalEntryForm() {
+ 706     return `
+ 707         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
+ 708             <h2 class="text-3xl font-extrabold text-primary mb-6">Saisie d'Écriture Journal</h2>
+ 709             <p class="text-gray-600 dark:text-gray-400 mb-4">Formulaire de saisie à double-entrée pour ${window.userContext.entrepriseContextName}.</p>
+ 710             <p class="text-sm text-warning">⚠️ Formulaire à implémenter - Endpoint: POST /api/saisie/journal</p>
+ 711         </div>
+ 712     `;
+ 713 }
+ 714 
+ 715 function generateValidationTable() {
+ 716     return `
+ 717         <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
+ 718             <h3 class="text-xl font-semibold mb-4">Opérations en Attente de Validation</h3>
+ 719             <p class="text-sm text-gray-600 dark:text-gray-400">Tableau de validation pour ${window.userContext.entrepriseContextName}.</p>
+ 720             <p class="text-sm text-warning mt-4">⚠️ Tableau à implémenter - Endpoint GET à créer</p>
+ 721         </div>
+ 722     `;
+ 723 }
+ 724 
+ 725 function renderUserManagementView() {
+ 726     return `
+ 727         <div class="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
+ 728             <h2 class="text-3xl font-extrabold text-primary mb-6">Gestion des Utilisateurs</h2>
+ 729             <p class="text-gray-600 dark:text-gray-400">Interface de gestion des rôles et des accès.</p>
+ 730             <p class="text-sm text-warning mt-4">⚠️ Interface à implémenter - Endpoints GET/POST/PUT/DELETE à créer</p>
+ 731         </div>
+ 732     `;
+ 733 }
+ 734 
+ 735 // =================================================================================
+ 736 // 7. INITIALISATION ET GESTION DES ÉVÉNEMENTS
+ 737 // =================================================================================
+ 738 
+ 739 function renderLoginView() {
+ 740     document.getElementById('auth-view').classList.remove('hidden');
+ 741     const registerView = document.getElementById('register-view');
+ 742     if (registerView) {
+ 743         registerView.classList.add('hidden');
+ 744     }
+ 745 }
+ 746 
+ 747 function renderRegisterView() {
+ 748     document.getElementById('auth-view').classList.add('hidden');
+ 749     const registerView = document.getElementById('register-view');
+ 750     if (registerView) {
+ 751         registerView.classList.remove('hidden');
+ 752     }
+ 753 }
+ 754 
+ 755 document.addEventListener('DOMContentLoaded', function() {
+ 756     const loginForm = document.getElementById('login-form');
+ 757     if (loginForm) {
+ 758         loginForm.addEventListener('submit', async function(e) {
+ 759             e.preventDefault();
+ 760 
+ 761             const email = document.getElementById('username').value;
+ 762             const password = document.getElementById('password').value;
+ 763             const msgElement = document.getElementById('auth-error-message');
+ 764 
+ 765             msgElement.textContent = 'Connexion en cours...';
+ 766             msgElement.classList.remove('hidden', 'text-danger', 'text-success');
+ 767 
+ 768             try {
+ 769                 const context = await handleLogin(email, password);
+ 770 
+ 771                 if (context) {
+ 772                     msgElement.classList.add('hidden');
+ 773                     initDashboard(context);
+ 774                 } else {
+ 775                     msgElement.textContent = 'Échec de la connexion.';
+ 776                     msgElement.classList.add('text-danger');
+ 777                 }
+ 778             } catch (error) {
+ 779                 msgElement.textContent = error.message;
+ 780                 msgElement.classList.remove('hidden');
+ 781                 msgElement.classList.add('text-danger');
+ 782             }
+ 783         });
+ 784     }
+ 785 
+ 786     const registerForm = document.getElementById('register-form');
+ 787     if (registerForm) {
+ 788         registerForm.addEventListener('submit', async function(e) {
+ 789             e.preventDefault();
+ 790 
+ 791             const password = document.getElementById('reg-password').value;
+ 792             const passwordConfirm = document.getElementById('reg-password-confirm').value;
+ 793             const msgElement = document.getElementById('register-error-message');
+ 794 
+ 795             if (password !== passwordConfirm) {
+ 796                 msgElement.textContent = '❌ Les mots de passe ne correspondent pas.';
+ 797                 msgElement.classList.remove('hidden');
+ 798                 msgElement.classList.add('text-danger');
+ 799                 return;
+ 800             }
+ 801 
+ 802             const payload = {
+ 803                 username: document.getElementById('reg-username').value,
+ 804                 email: document.getElementById('reg-email').value,
+ 805                 password: password,
+ 806                 companyName: document.getElementById('reg-company-name').value,
+ 807                 companyNif: document.getElementById('reg-company-nif').value,
+ 808                 companyStatus: document.getElementById('reg-company-status').value,
+ 809             };
+ 810 
+ 811             msgElement.textContent = 'Inscription en cours...';
+ 812             msgElement.classList.remove('hidden', 'text-danger');
+ 813 
+ 814             try {
+ 815                 const context = await handleRegistration(payload);
+ 816 
+ 817                 msgElement.classList.add('hidden');
+ 818                 initDashboard(context);
+ 819 
+ 820                 alert(`✅ Inscription Réussie !\nBienvenue chez Doukè Compta Pro.\nVotre entreprise "${context.entrepriseContextName}" a été créée.`);
+ 821 
+ 822             } catch (error) {
+ 823                 msgElement.textContent = error.message;
+ 824                 msgElement.classList.remove('hidden');
+ 825                 msgElement.classList.add('text-danger');
+ 826             }
+ 827         });
+ 828     }
+ 829 
+ 830     const logoutButton = document.getElementById('logout-button');
+ 831     if (logoutButton) {
+ 832         logoutButton.addEventListener('click', function() {
+ 833             window.userContext = null;
+ 834             document.getElementById('dashboard-view').classList.add('hidden');
+ 835             renderLoginView();
+ 836             document.getElementById('username').value = '';
+ 837             document.getElementById('password').value = '';
+ 838             document.getElementById('auth-error-message').classList.add('hidden');
+ 839         });
+ 840     }
+ 841 });
+ 842 
+ 843 function toggleTheme() {
+ 844     document.documentElement.classList.toggle('dark');
+ 845 }
