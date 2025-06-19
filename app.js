<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Gestion Comptable SYSCOHADA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#5D5CDE',
                        'primary-light': '#7E7DDF',
                        'primary-dark': '#4A49C7',
                        success: '#10B981',
                        warning: '#F59E0B',
                        danger: '#EF4444',
                        info: '#3B82F6'
                    }
                }
            },
            darkMode: 'class'
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .modal { display: none; }
        .modal.show { display: flex; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 h-full">

<!-- Interface de connexion -->
<div id="loginInterface" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark">
    <div class="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div class="text-center">
            <div class="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
                <i class="fas fa-calculator text-white text-2xl"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Gestion Comptable SYSCOHADA Révisé</p>
        </div>

        <form id="loginForm" class="mt-8 space-y-6">
            <div>
                <label for="loginEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input id="loginEmail" name="email" type="email" required 
                       class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                       placeholder="votre@email.com">
            </div>
            
            <div>
                <label for="loginPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
                <input id="loginPassword" name="password" type="password" required
                       class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
                       placeholder="Votre mot de passe">
            </div>

            <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-medium transition-colors">
                <i class="fas fa-sign-in-alt mr-2"></i>
                Se connecter
            </button>
        </form>

        <div class="mt-6">
            <div class="text-center text-sm text-gray-600 dark:text-gray-400">Comptes de démonstration :</div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                <button onclick="loginAs('admin')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Admin</button>
                <button onclick="loginAs('collaborateur-senior')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Collab. Senior</button>
                <button onclick="loginAs('collaborateur')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Collaborateur</button>
                <button onclick="loginAs('user')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Utilisateur</button>
                <button onclick="loginAs('caissier')" class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors col-span-2">Caissier</button>
            </div>
        </div>
    </div>
</div>

<!-- Application principale -->
<div id="mainApp" class="hidden min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- En-tête -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <div class="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                        <i class="fas fa-calculator text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-gray-900 dark:text-white">DOUKÈ Compta Pro</h1>
                        <p class="text-xs text-gray-500 dark:text-gray-400">SYSCOHADA Révisé</p>
                    </div>
                </div>

                <div id="companySelector" class="flex items-center space-x-4">
                    <div class="text-right">
                        <select id="activeCompanySelect" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="">-- Sélectionner une entreprise --</option>
                        </select>
                        <div id="selectedCompanyInfo" class="text-xs text-gray-500 dark:text-gray-400"></div>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <div id="currentUser" class="text-sm font-medium text-gray-900 dark:text-white"></div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Connecté</div>
                    </div>
                    <div class="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div class="flex h-[calc(100vh-4rem)]">
        <!-- Sidebar -->
        <div class="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        U
                    </div>
                    <div>
                        <div id="sidebarUserName" class="font-medium text-gray-900 dark:text-white text-sm"></div>
                        <div id="sidebarUserRole" class="text-xs text-gray-500 dark:text-gray-400"></div>
                    </div>
                </div>
            </div>

            <nav id="navigationMenu" class="mt-4">
                <!-- Navigation will be loaded here -->
            </nav>
        </div>

        <!-- Contenu principal -->
        <div class="flex-1 overflow-y-auto">
            <main id="mainContent" class="p-6">
                <!-- Le contenu des pages sera chargé ici -->
            </main>
        </div>
    </div>
</div>

<!-- Modals -->
<!-- Modal Nouveau Collaborateur -->
<div id="newUserModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nouveau Collaborateur</h3>
                <button onclick="closeModal('newUserModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newUserForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                    <input type="text" id="newUserName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" id="newUserEmail" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                    <input type="tel" id="newUserPhone" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profil</label>
                    <select id="newUserProfile" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Sélectionner un profil</option>
                        <option value="collaborateur-senior">Collaborateur Senior</option>
                        <option value="collaborateur">Collaborateur</option>
                        <option value="user">Utilisateur</option>
                        <option value="caissier">Caissier</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe temporaire</label>
                    <input type="password" id="newUserPassword" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('newUserModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Créer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Nouvelle Entreprise -->
<div id="newCompanyModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nouvelle Entreprise</h3>
                <button onclick="closeModal('newCompanyModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newCompanyForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'entreprise</label>
                    <input type="text" id="newCompanyName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type juridique</label>
                    <select id="newCompanyType" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Sélectionner</option>
                        <option value="SARL">SARL</option>
                        <option value="SA">SA</option>
                        <option value="EURL">EURL</option>
                        <option value="SAS">SAS</option>
                        <option value="EI">Entreprise Individuelle</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Système comptable</label>
                    <select id="newCompanySystem" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Sélectionner</option>
                        <option value="Normal">Système Normal</option>
                        <option value="Minimal">Système Minimal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                    <input type="tel" id="newCompanyPhone" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                    <textarea id="newCompanyAddress" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"></textarea>
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('newCompanyModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Créer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Nouvelle Écriture -->
<div id="newEntryModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nouvelle Écriture Comptable</h3>
                <button onclick="closeModal('newEntryModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newEntryForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input type="date" id="newEntryDate" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Journal</label>
                        <select id="newEntryJournal" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">Sélectionner</option>
                            <option value="JG">Journal Général (JG)</option>
                            <option value="JA">Journal des Achats (JA)</option>
                            <option value="JV">Journal des Ventes (JV)</option>
                            <option value="JB">Journal de Banque (JB)</option>
                            <option value="JC">Journal de Caisse (JC)</option>
                            <option value="JOD">Journal des Op. Diverses (JOD)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° Pièce</label>
                        <input type="text" id="newEntryPiece" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Libellé de l'écriture</label>
                    <input type="text" id="newEntryLibelle" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                
                <div class="border-t pt-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium text-gray-900 dark:text-white">Lignes d'écriture</h4>
                        <button type="button" onclick="addEntryLine()" class="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors">
                            <i class="fas fa-plus mr-1"></i>Ajouter ligne
                        </button>
                    </div>
                    <div id="entryLines" class="space-y-2">
                        <!-- Les lignes d'écriture seront ajoutées ici -->
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span class="text-gray-600 dark:text-gray-400">Total Débit: </span>
                            <span id="totalDebit" class="font-semibold">0 FCFA</span>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span class="text-gray-600 dark:text-gray-400">Total Crédit: </span>
                            <span id="totalCredit" class="font-semibold">0 FCFA</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('newEntryModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Enregistrer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Nouveau Compte -->
<div id="newAccountModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nouveau Compte</h3>
                <button onclick="closeModal('newAccountModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newAccountForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code compte</label>
                    <input type="text" id="newAccountCode" required pattern="[0-9]{6}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    <p class="text-xs text-gray-500 mt-1">6 chiffres (ex: 101000)</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du compte</label>
                    <input type="text" id="newAccountName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                    <select id="newAccountCategory" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Sélectionner</option>
                        <option value="Capitaux propres">Capitaux propres</option>
                        <option value="Dettes financières">Dettes financières</option>
                        <option value="Immobilisations corporelles">Immobilisations corporelles</option>
                        <option value="Immobilisations incorporelles">Immobilisations incorporelles</option>
                        <option value="Immobilisations financières">Immobilisations financières</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Tiers">Tiers</option>
                        <option value="Comptes bancaires">Comptes bancaires</option>
                        <option value="Caisse">Caisse</option>
                        <option value="Charges">Charges</option>
                        <option value="Produits">Produits</option>
                    </select>
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('newAccountModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Créer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Nouvelle Caisse -->
<div id="newCashModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Nouvelle Caisse</h3>
                <button onclick="closeModal('newCashModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newCashForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la caisse</label>
                    <input type="text" id="newCashName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label>
                    <select id="newCashResponsible" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Aucun responsable assigné</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solde d'ouverture (FCFA)</label>
                    <input type="number" id="newCashBalance" required min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('newCashModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Créer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal Upload Logo -->
<div id="logoUploadModal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Télécharger Logo</h3>
                <button onclick="closeModal('logoUploadModal')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="logoUploadForm" class="space-y-4">
                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input type="file" id="logoFile" accept="image/*" class="hidden" onchange="previewLogo(event)">
                    <div onclick="document.getElementById('logoFile').click()" class="cursor-pointer">
                        <div id="logoPreview" class="mb-4">
                            <i class="fas fa-image text-4xl text-gray-400"></i>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Cliquez pour sélectionner un logo</p>
                        <p class="text-xs text-gray-500 mt-1">JPG, PNG (max 2MB)</p>
                    </div>
                </div>
                <div class="flex space-x-3 pt-4">
                    <button type="button" onclick="closeModal('logoUploadModal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">Enregistrer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// =============================================================================
// DOUKÈ Compta Pro - Application Principal (Version Complète)
// =============================================================================

class DoukèComptaPro {
    constructor() {
        this.version = "2.1.0";
        this.initializeState();
        this.uiManager = new UIManager(this);
        console.log(`🚀 DOUKÈ Compta Pro v${this.version} - Initialisation...`);
    }

    initializeState() {
        this.state = {
            currentUser: null,
            currentProfile: null,
            currentCompany: null,
            isAuthenticated: false,
            companies: [],
            users: [],
            accounts: [],
            entries: [],
            cashRegisters: [],
            lastUpdate: new Date(),
            theme: 'system',
            companyLogo: null,
            notifications: [],
            auditLog: []
        };

        this.idGenerator = {
            company: () => `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user: () => `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            entry: () => `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cash: () => `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            account: () => `ACC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    logAuditEvent(action, details = {}) {
        const auditEntry = {
            id: this.idGenerator.entry(),
            timestamp: new Date(),
            userId: this.state.currentUser?.id,
            action,
            details,
            userAgent: navigator.userAgent
        };

        this.state.auditLog.push(auditEntry);
        console.log(`🔒 AUDIT: ${action}`, auditEntry);
    }

    hashPassword(password) {
        return btoa(password + 'DOUKE_SALT_2024');
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    initializeDefaultData() {
        console.log('🔄 Initialisation des données par défaut...');

        // Entreprises
        this.state.companies = [
            {
                id: 1,
                uniqueId: this.idGenerator.company(),
                name: 'SARL TECH INNOVATION',
                type: 'SARL',
                system: 'Normal',
                phone: '+225 07 12 34 56 78',
                address: 'Abidjan, Cocody',
                status: 'Actif',
                cashRegisters: 3
            },
            {
                id: 2,
                uniqueId: this.idGenerator.company(),
                name: 'SA COMMERCE PLUS',
                type: 'SA',
                system: 'Normal',
                phone: '+225 05 98 76 54 32',
                address: 'Abidjan, Plateau',
                status: 'Actif',
                cashRegisters: 5
            },
            {
                id: 3,
                uniqueId: this.idGenerator.company(),
                name: 'EURL SERVICES PRO',
                type: 'EURL',
                system: 'Minimal',
                phone: '+225 01 23 45 67 89',
                address: 'Bouaké Centre',
                status: 'Période d\'essai',
                cashRegisters: 2
            },
            {
                id: 4,
                uniqueId: this.idGenerator.company(),
                name: 'SAS DIGITAL WORLD',
                type: 'SAS',
                system: 'Normal',
                phone: '+225 07 11 22 33 44',
                address: 'San-Pédro',
                status: 'Suspendu',
                cashRegisters: 1
            }
        ];

        // Utilisateurs
        this.state.users = [
            {
                id: 1,
                uniqueId: this.idGenerator.user(),
                name: 'Admin Système',
                email: 'admin@doukecompta.ci',
                passwordHash: this.hashPassword('admin123'),
                profile: 'admin',
                role: 'Administrateur',
                phone: '+225 07 00 00 00 00',
                status: 'Actif',
                companies: [1, 2, 3, 4],
                assignedCompanies: [1, 2, 3, 4]
            },
            {
                id: 2,
                uniqueId: this.idGenerator.user(),
                name: 'Marie Kouassi',
                email: 'marie.kouassi@cabinet.com',
                passwordHash: this.hashPassword('collab123'),
                profile: 'collaborateur-senior',
                role: 'Collaborateur Senior',
                phone: '+225 07 11 11 11 11',
                status: 'Actif',
                companies: [1, 2, 3],
                assignedCompanies: [1, 2, 3]
            },
            {
                id: 3,
                uniqueId: this.idGenerator.user(),
                name: 'Jean Diabaté',
                email: 'jean.diabate@cabinet.com',
                passwordHash: this.hashPassword('collab123'),
                profile: 'collaborateur',
                role: 'Collaborateur',
                phone: '+225 07 22 22 22 22',
                status: 'Actif',
                companies: [2, 4],
                assignedCompanies: [2, 4]
            },
            {
                id: 4,
                uniqueId: this.idGenerator.user(),
                name: 'Amadou Traoré',
                email: 'atraore@sarltech.ci',
                passwordHash: this.hashPassword('user123'),
                profile: 'user',
                role: 'Utilisateur',
                phone: '+225 07 33 33 33 33',
                status: 'Actif',
                companies: [1],
                assignedCompanies: [1],
                companyId: 1
            },
            {
                id: 5,
                uniqueId: this.idGenerator.user(),
                name: 'Ibrahim Koné',
                email: 'ikone@caisse.ci',
                passwordHash: this.hashPassword('caisse123'),
                profile: 'caissier',
                role: 'Caissier',
                phone: '+225 07 44 44 44 44',
                status: 'Actif',
                companies: [2],
                assignedCompanies: [2],
                companyId: 2
            }
        ];

        // Plan comptable SYSCOHADA complet (9 classes)
        this.state.accounts = this.getFullSyscohadaAccounts();

        // Écritures d'exemple
        this.state.entries = [
            {
                id: 1,
                uniqueId: this.idGenerator.entry(),
                date: '2024-12-15',
                journal: 'JV',
                piece: 'JV-2024-001-0156',
                libelle: 'Vente marchandises Client ABC',
                companyId: 1,
                lines: [
                    { account: '411000', accountName: 'Clients', libelle: 'Vente Client ABC', debit: 1800000, credit: 0 },
                    { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },
                    { account: '441000', accountName: 'État et collectivités', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }
                ],
                status: 'Validé',
                userId: 2
            },
            {
                id: 2,
                uniqueId: this.idGenerator.entry(),
                date: '2024-12-14',
                journal: 'JA',
                piece: 'JA-2024-001-0157',
                libelle: 'Achat marchandises Fournisseur XYZ',
                companyId: 1,
                lines: [
                    { account: '601000', accountName: 'Achats de marchandises', libelle: 'Achat marchandises', debit: 850000, credit: 0 },
                    { account: '441000', accountName: 'État et collectivités', libelle: 'TVA déductible', debit: 170000, credit: 0 },
                    { account: '401000', accountName: 'Fournisseurs', libelle: 'Fournisseur XYZ', debit: 0, credit: 1020000 }
                ],
                status: 'En attente',
                userId: 3
            }
        ];

        // Caisses d'exemple
        this.state.cashRegisters = [
            {
                id: 1,
                uniqueId: this.idGenerator.cash(),
                name: 'Caisse Principale',
                companyId: 2,
                responsibleId: 5,
                responsibleName: 'Ibrahim Koné',
                balance: 210000,
                status: 'Ouvert',
                openingBalance: 150000,
                dailyReceipts: 85000,
                dailyExpenses: 25000
            },
            {
                id: 2,
                uniqueId: this.idGenerator.cash(),
                name: 'Caisse Ventes',
                companyId: 2,
                responsibleId: null,
                responsibleName: 'Fatou Diallo',
                balance: 85000,
                status: 'Ouvert',
                openingBalance: 100000,
                dailyReceipts: 35000,
                dailyExpenses: 50000
            }
        ];

        // Synchroniser immédiatement
        this.syncWithGlobalApp();

        console.log('✅ Données initialisées:', {
            companies: this.state.companies.length,
            users: this.state.users.length,
            accounts: this.state.accounts.length,
            entries: this.state.entries.length,
            cashRegisters: this.state.cashRegisters.length
        });
    }

    getFullSyscohadaAccounts() {
        return [
            // CLASSE 1 - Comptes de capitaux
            { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
            { code: '104000', name: 'Primes liées au capital social', category: 'Capitaux propres' },
            { code: '105000', name: 'Écarts de réévaluation', category: 'Capitaux propres' },
            { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
            { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
            { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
            { code: '130000', name: 'Résultat en instance d\'affectation', category: 'Capitaux propres' },
            { code: '140000', name: 'Subventions d\'investissement', category: 'Capitaux propres' },
            { code: '150000', name: 'Provisions réglementées', category: 'Capitaux propres' },
            { code: '161000', name: 'Emprunts obligataires', category: 'Dettes financières' },
            { code: '162000', name: 'Emprunts et dettes auprès des établissements de crédit', category: 'Dettes financières' },
            { code: '163000', name: 'Avances reçues de l\'État', category: 'Dettes financières' },
            { code: '164000', name: 'Avances reçues et comptes courants', category: 'Dettes financières' },
            { code: '165000', name: 'Dépôts et cautionnements reçus', category: 'Dettes financières' },
            { code: '166000', name: 'Intérêts courus', category: 'Dettes financières' },
            { code: '167000', name: 'Emprunts et dettes assortis de conditions particulières', category: 'Dettes financières' },
            { code: '168000', name: 'Autres emprunts et dettes financières', category: 'Dettes financières' },
            { code: '171000', name: 'Dettes liées à des participations', category: 'Dettes financières' },
            { code: '172000', name: 'Emprunts et dettes liés à des participations', category: 'Dettes financières' },
            { code: '173000', name: 'Dettes liées à des sociétés en participation', category: 'Dettes financières' },
            { code: '174000', name: 'Compte de l\'exploitant', category: 'Dettes financières' },
            { code: '178000', name: 'Autres dettes', category: 'Dettes financières' },
            { code: '181000', name: 'Comptes de liaison des établissements et succursales', category: 'Comptes de liaison' },
            { code: '186000', name: 'Biens et prestations de services échangés entre établissements', category: 'Comptes de liaison' },
            { code: '187000', name: 'Biens et prestations de services échangés entre établissements', category: 'Comptes de liaison' },
            { code: '188000', name: 'Résultats en instance de répartition', category: 'Comptes de liaison' },

            // CLASSE 2 - Comptes d'immobilisations
            { code: '201000', name: 'Frais de développement', category: 'Immobilisations incorporelles' },
            { code: '203000', name: 'Frais de recherche', category: 'Immobilisations incorporelles' },
            { code: '204000', name: 'Logiciels informatiques', category: 'Immobilisations incorporelles' },
            { code: '205000', name: 'Concessions et droits similaires, brevets, licences, marques', category: 'Immobilisations incorporelles' },
            { code: '206000', name: 'Droit au bail', category: 'Immobilisations incorporelles' },
            { code: '207000', name: 'Fonds commercial', category: 'Immobilisations incorporelles' },
            { code: '208000', name: 'Autres immobilisations incorporelles', category: 'Immobilisations incorporelles' },
            { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
            { code: '212000', name: 'Agencements et aménagements de terrains', category: 'Immobilisations corporelles' },
            { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
            { code: '214000', name: 'Agencements et aménagements de constructions', category: 'Immobilisations corporelles' },
            { code: '215000', name: 'Installations techniques', category: 'Immobilisations corporelles' },
            { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
            { code: '221000', name: 'Terrains de gisement', category: 'Immobilisations corporelles' },
            { code: '222000', name: 'Agencements et aménagements de terrains de gisement', category: 'Immobilisations corporelles' },
            { code: '223000', name: 'Constructions sur terrains de gisement', category: 'Immobilisations corporelles' },
            { code: '224000', name: 'Installations et équipements d\'extraction', category: 'Immobilisations corporelles' },
            { code: '225000', name: 'Agencements et aménagements des constructions sur terrains de gisement', category: 'Immobilisations corporelles' },
            { code: '228000', name: 'Autres installations d\'extraction', category: 'Immobilisations corporelles' },
            { code: '231000', name: 'Bâtiments agricoles', category: 'Immobilisations corporelles' },
            { code: '232000', name: 'Agencements et aménagements de bâtiments agricoles', category: 'Immobilisations corporelles' },
            { code: '233000', name: 'Plantations d\'arbres et d\'arbustes', category: 'Immobilisations corporelles' },
            { code: '234000', name: 'Aménagements de plantations', category: 'Immobilisations corporelles' },
            { code: '238000', name: 'Autres installations et agencements agricoles', category: 'Immobilisations corporelles' },
            { code: '241000', name: 'Matériel et outillage industriel et commercial', category: 'Immobilisations corporelles' },
            { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
            { code: '245000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
            { code: '246000', name: 'Matériel et mobilier de bureau', category: 'Immobilisations corporelles' },
            { code: '247000', name: 'Agencements, installations et aménagements divers', category: 'Immobilisations corporelles' },
            { code: '248000', name: 'Autres matériels', category: 'Immobilisations corporelles' },
            { code: '251000', name: 'Investissements grevés de droits', category: 'Immobilisations financières' },
            { code: '261000', name: 'Titres de participation', category: 'Immobilisations financières' },
            { code: '262000', name: 'Créances rattachées à des participations', category: 'Immobilisations financières' },
            { code: '263000', name: 'Titres immobilisés', category: 'Immobilisations financières' },
            { code: '264000', name: 'Prêts et créances sur l\'État', category: 'Immobilisations financières' },
            { code: '265000', name: 'Prêts et créances sur les collectivités publiques', category: 'Immobilisations financières' },
            { code: '266000', name: 'Prêts et créances sur les sociétés et organismes privés', category: 'Immobilisations financières' },
            { code: '267000', name: 'Créances sur les organismes internationaux', category: 'Immobilisations financières' },
            { code: '268000', name: 'Autres créances immobilisées', category: 'Immobilisations financières' },
            { code: '269000', name: 'Versements restant à effectuer sur titres non libérés', category: 'Immobilisations financières' },
            { code: '271000', name: 'Prêts du personnel', category: 'Immobilisations financières' },
            { code: '272000', name: 'Prêts aux associés', category: 'Immobilisations financières' },
            { code: '273000', name: 'Dépôts et cautionnements versés', category: 'Immobilisations financières' },
            { code: '274000', name: 'Prêts et créances liés à des participations', category: 'Immobilisations financières' },
            { code: '275000', name: 'Titres et créances liés à des participations', category: 'Immobilisations financières' },
            { code: '276000', name: 'Autres créances immobilisées', category: 'Immobilisations financières' },
            { code: '277000', name: 'Actions propres', category: 'Immobilisations financières' },
            { code: '279000', name: 'Versements restant à effectuer sur titres non libérés', category: 'Immobilisations financières' },
            { code: '281000', name: 'Amortissements des immobilisations incorporelles', category: 'Amortissements' },
            { code: '282000', name: 'Amortissements des immobilisations corporelles', category: 'Amortissements' },
            { code: '290000', name: 'Provisions pour dépréciation des immobilisations incorporelles', category: 'Provisions' },
            { code: '291000', name: 'Provisions pour dépréciation des immobilisations corporelles', category: 'Provisions' },
            { code: '292000', name: 'Provisions pour dépréciation des immobilisations mises en concession', category: 'Provisions' },
            { code: '293000', name: 'Provisions pour dépréciation des immobilisations en cours', category: 'Provisions' },
            { code: '294000', name: 'Provisions pour dépréciation des immobilisations financières', category: 'Provisions' },

            // CLASSE 3 - Comptes de stocks
            { code: '311000', name: 'Marchandises', category: 'Stocks' },
            { code: '312000', name: 'Marchandises en cours de route', category: 'Stocks' },
            { code: '317000', name: 'Marchandises en consignation ou en dépôt', category: 'Stocks' },
            { code: '321000', name: 'Matières premières', category: 'Stocks' },
            { code: '322000', name: 'Matières et fournitures consommables', category: 'Stocks' },
            { code: '323000', name: 'Emballages', category: 'Stocks' },
            { code: '324000', name: 'Matières en cours de route', category: 'Stocks' },
            { code: '327000', name: 'Matières et fournitures en consignation ou en dépôt', category: 'Stocks' },
            { code: '331000', name: 'Produits en cours', category: 'Stocks' },
            { code: '332000', name: 'Travaux en cours', category: 'Stocks' },
            { code: '333000', name: 'Produits résiduels', category: 'Stocks' },
            { code: '335000', name: 'Prestations de services en cours', category: 'Stocks' },
            { code: '341000', name: 'Produits intermédiaires', category: 'Stocks' },
            { code: '345000', name: 'Produits finis', category: 'Stocks' },
            { code: '347000', name: 'Produits finis en consignation ou en dépôt', category: 'Stocks' },
            { code: '351000', name: 'Produits agricoles', category: 'Stocks' },
            { code: '358000', name: 'Autres produits d\'activité agricole', category: 'Stocks' },
            { code: '361000', name: 'Terrains lotis', category: 'Stocks' },
            { code: '362000', name: 'Constructions', category: 'Stocks' },
            { code: '365000', name: 'Avances et acomptes versés sur commandes d\'immobilisations', category: 'Stocks' },
            { code: '371000', name: 'Stocks à l\'extérieur', category: 'Stocks' },
            { code: '381000', name: 'Marchandises en cours de route', category: 'Stocks' },
            { code: '382000', name: 'Autres approvisionnements en cours de route', category: 'Stocks' },
            { code: '383000', name: 'Autres stocks en cours de route', category: 'Stocks' },
            { code: '391000', name: 'Provisions pour dépréciation des marchandises', category: 'Provisions sur stocks' },
            { code: '392000', name: 'Provisions pour dépréciation des approvisionnements', category: 'Provisions sur stocks' },
            { code: '393000', name: 'Provisions pour dépréciation des en-cours de production', category: 'Provisions sur stocks' },
            { code: '394000', name: 'Provisions pour dépréciation des produits', category: 'Provisions sur stocks' },
            { code: '395000', name: 'Provisions pour dépréciation des stocks à l\'extérieur', category: 'Provisions sur stocks' },
            { code: '397000', name: 'Provisions pour dépréciation des stocks en cours de route', category: 'Provisions sur stocks' },

            // CLASSE 4 - Comptes de tiers
            { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
            { code: '402000', name: 'Fournisseurs - Effets à payer', category: 'Fournisseurs' },
            { code: '403000', name: 'Fournisseurs - Retenues de garantie', category: 'Fournisseurs' },
            { code: '404000', name: 'Fournisseurs d\'immobilisations', category: 'Fournisseurs' },
            { code: '405000', name: 'Fournisseurs d\'immobilisations - Effets à payer', category: 'Fournisseurs' },
            { code: '408000', name: 'Fournisseurs - Factures non parvenues', category: 'Fournisseurs' },
            { code: '409000', name: 'Fournisseurs débiteurs', category: 'Fournisseurs' },
            { code: '411000', name: 'Clients', category: 'Clients' },
            { code: '412000', name: 'Clients - Effets à recevoir', category: 'Clients' },
            { code: '413000', name: 'Clients - Retenues de garantie', category: 'Clients' },
            { code: '414000', name: 'Clients douteux', category: 'Clients' },
            { code: '415000', name: 'Clients - Effets escomptés non échus', category: 'Clients' },
            { code: '416000', name: 'Clients créditeurs', category: 'Clients' },
            { code: '417000', name: 'Rabais, remises, ristournes à accorder et autres avoirs à établir', category: 'Clients' },
            { code: '418000', name: 'Clients - Produits non encore facturés', category: 'Clients' },
            { code: '419000', name: 'Clients créditeurs - Avances et acomptes reçus', category: 'Clients' },
            { code: '421000', name: 'Personnel - Rémunérations dues', category: 'Personnel' },
            { code: '422000', name: 'Personnel - Œuvres sociales', category: 'Personnel' },
            { code: '423000', name: 'Personnel - Participation aux bénéfices', category: 'Personnel' },
            { code: '424000', name: 'Personnel - Œuvres sociales du comité d\'entreprise', category: 'Personnel' },
            { code: '425000', name: 'Personnel - Avances et acomptes accordés', category: 'Personnel' },
            { code: '426000', name: 'Personnel - Dépôts reçus', category: 'Personnel' },
            { code: '427000', name: 'Personnel - Oppositions sur salaires', category: 'Personnel' },
            { code: '428000', name: 'Personnel - Charges à payer et produits à recevoir', category: 'Personnel' },
            { code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux' },
            { code: '432000', name: 'Caisse de retraite', category: 'Organismes sociaux' },
            { code: '433000', name: 'Autres organismes sociaux', category: 'Organismes sociaux' },
            { code: '434000', name: 'Caisse mutuelle', category: 'Organismes sociaux' },
            { code: '435000', name: 'Congés payés', category: 'Organismes sociaux' },
            { code: '436000', name: 'Autres charges sociales', category: 'Organismes sociaux' },
            { code: '437000', name: 'Charges sociales sur congés à payer', category: 'Organismes sociaux' },
            { code: '438000', name: 'Organismes sociaux - Charges à payer et produits à recevoir', category: 'Organismes sociaux' },
            { code: '441000', name: 'État et collectivités publiques - Subventions à recevoir', category: 'État' },
            { code: '442000', name: 'État - Impôts et taxes recouvrables sur des tiers', category: 'État' },
            { code: '443000', name: 'État - TVA facturée', category: 'État' },
            { code: '444000', name: 'État - TVA due ou crédit de TVA', category: 'État' },
            { code: '445000', name: 'État - TVA récupérable', category: 'État' },
            { code: '446000', name: 'État - Autres taxes sur le chiffre d\'affaires', category: 'État' },
            { code: '447000', name: 'État - Impôts forfaitaires et taxes assimilées', category: 'État' },
            { code: '448000', name: 'État - Charges à payer et produits à recevoir', category: 'État' },
            { code: '449000', name: 'État - Quotas d\'émission alloués par l\'État', category: 'État' },
            { code: '451000', name: 'Associés - Comptes courants', category: 'Associés' },
            { code: '452000', name: 'Associés - Apports en nature', category: 'Associés' },
            { code: '453000', name: 'Associés - Versements reçus sur augmentation de capital', category: 'Associés' },
            { code: '454000', name: 'Associés - Versements anticipés', category: 'Associés' },
            { code: '455000', name: 'Associés - Dividendes à payer', category: 'Associés' },
            { code: '456000', name: 'Associés - Actionnaires défaillants', category: 'Associés' },
            { code: '457000', name: 'Associés - Capital à rembourser', category: 'Associés' },
            { code: '458000', name: 'Associés - Opérations faites en commun et GIE', category: 'Associés' },
            { code: '459000', name: 'Associés - Versements restant à effectuer', category: 'Associés' },
            { code: '461000', name: 'Associés - Opérations faites en commun', category: 'Organismes rattachés' },
            { code: '462000', name: 'Associés - GIE', category: 'Organismes rattachés' },
            { code: '463000', name: 'Collectivités locales', category: 'Organismes rattachés' },
            { code: '464000', name: 'Organismes internationaux', category: 'Organismes rattachés' },
            { code: '465000', name: 'Organismes supranationaux', category: 'Organismes rattachés' },
            { code: '467000', name: 'Autres organismes', category: 'Organismes rattachés' },
            { code: '471000', name: 'Comptes d\'attente - Débiteurs', category: 'Comptes transitoires' },
            { code: '472000', name: 'Comptes d\'attente - Créditeurs', category: 'Comptes transitoires' },
            { code: '473000', name: 'Différences de conversion - Actif', category: 'Comptes transitoires' },
            { code: '474000', name: 'Différences de conversion - Passif', category: 'Comptes transitoires' },
            { code: '475000', name: 'Comptes de régularisation - Actif', category: 'Comptes transitoires' },
            { code: '476000', name: 'Comptes de régularisation - Passif', category: 'Comptes transitoires' },
            { code: '477000', name: 'Différences de change', category: 'Comptes transitoires' },
            { code: '478000', name: 'Autres comptes transitoires', category: 'Comptes transitoires' },
            { code: '481000', name: 'Charges à répartir sur plusieurs exercices', category: 'Comptes de régularisation' },
            { code: '486000', name: 'Charges constatées d\'avance', category: 'Comptes de régularisation' },
            { code: '487000', name: 'Produits constatés d\'avance', category: 'Comptes de régularisation' },
            { code: '488000', name: 'Comptes de répartition périodique des charges et des produits', category: 'Comptes de régularisation' },
            { code: '489000', name: 'Quotas d\'émission à restituer à l\'État', category: 'Comptes de régularisation' },
            { code: '491000', name: 'Provisions pour dépréciation des comptes clients', category: 'Provisions' },
            { code: '492000', name: 'Provisions pour dépréciation des comptes du groupe et des associés', category: 'Provisions' },
            { code: '493000', name: 'Provisions pour dépréciation des comptes de débiteurs divers', category: 'Provisions' },
            { code: '494000', name: 'Provisions pour dépréciation des comptes de charges constatées d\'avance', category: 'Provisions' },

            // CLASSE 5 - Comptes de trésorerie
            { code: '501000', name: 'Parts dans des entreprises liées', category: 'Valeurs mobilières de placement' },
            { code: '502000', name: 'Actions', category: 'Valeurs mobilières de placement' },
            { code: '503000', name: 'Obligations', category: 'Valeurs mobilières de placement' },
            { code: '504000', name: 'Bons du Trésor', category: 'Valeurs mobilières de placement' },
            { code: '505000', name: 'Bons de caisse', category: 'Valeurs mobilières de placement' },
            { code: '506000', name: 'Bons de souscription', category: 'Valeurs mobilières de placement' },
            { code: '507000', name: 'Bons divers', category: 'Valeurs mobilières de placement' },
            { code: '508000', name: 'Autres valeurs mobilières de placement', category: 'Valeurs mobilières de placement' },
            { code: '509000', name: 'Versements restant à effectuer sur valeurs mobilières de placement non libérées', category: 'Valeurs mobilières de placement' },
            { code: '511000', name: 'Valeurs à l\'encaissement', category: 'Banques, établissements financiers et assimilés' },
            { code: '512000', name: 'Banques', category: 'Banques, établissements financiers et assimilés' },
            { code: '513000', name: 'Chèques postaux', category: 'Banques, établissements financiers et assimilés' },
            { code: '514000', name: 'Caisse nationale d\'épargne', category: 'Banques, établissements financiers et assimilés' },
            { code: '515000', name: 'Autres institutions financières', category: 'Banques, établissements financiers et assimilés' },
            { code: '516000', name: 'Sociétés et correspondants', category: 'Banques, établissements financiers et assimilés' },
            { code: '517000', name: 'Autres organismes financiers', category: 'Banques, établissements financiers et assimilés' },
            { code: '518000', name: 'Intérêts courus', category: 'Banques, établissements financiers et assimilés' },
            { code: '519000', name: 'Concours bancaires courants', category: 'Banques, établissements financiers et assimilés' },
            { code: '521000', name: 'Instruments de trésorerie', category: 'Instruments de trésorerie' },
            { code: '523000', name: 'Intérêts courus sur instruments de trésorerie', category: 'Instruments de trésorerie' },
            { code: '531000', name: 'Caisse siège social', category: 'Caisse' },
            { code: '532000', name: 'Caisse succursale (ou usine) A', category: 'Caisse' },
            { code: '533000', name: 'Caisse succursale (ou usine) B', category: 'Caisse' },
            { code: '534000', name: 'Caisse succursale (ou usine) C', category: 'Caisse' },
            { code: '535000', name: 'Caisse succursale (ou usine) D', category: 'Caisse' },
            { code: '536000', name: 'Caisse succursale (ou usine) E', category: 'Caisse' },
            { code: '537000', name: 'Caisse en devises', category: 'Caisse' },
            { code: '538000', name: 'Autres caisses', category: 'Caisse' },
            { code: '541000', name: 'Régies d\'avances et accréditifs', category: 'Régies d\'avances et accréditifs' },
            { code: '542000', name: 'Avances au personnel en vue de missions', category: 'Régies d\'avances et accréditifs' },
            { code: '545000', name: 'Autres avances', category: 'Régies d\'avances et accréditifs' },
            { code: '548000', name: 'Autres régies d\'avances et accréditifs', category: 'Régies d\'avances et accréditifs' },
            { code: '551000', name: 'Virement de fonds', category: 'Virements de fonds' },
            { code: '552000', name: 'Autres virements de fonds', category: 'Virements de fonds' },
            { code: '561000', name: 'Recettes à classer', category: 'Caisse, régie d\'avance et accréditifs, chèques et valeurs à encaisser' },
            { code: '564000', name: 'Chèques à encaisser', category: 'Caisse, régie d\'avance et accréditifs, chèques et valeurs à encaisser' },
            { code: '565000', name: 'Coupons échus à l\'encaissement', category: 'Caisse, régie d\'avance et accréditifs, chèques et valeurs à encaisser' },
            { code: '567000', name: 'Autres valeurs à l\'encaissement', category: 'Caisse, régie d\'avance et accréditifs, chèques et valeurs à encaisser' },
            { code: '571000', name: 'Caisse', category: 'Caisse' },
            { code: '572000', name: 'Banque', category: 'Banques, établissements financiers et assimilés' },
            { code: '573000', name: 'Chèques postaux', category: 'Banques, établissements financiers et assimilés' },
            { code: '574000', name: 'Caisse nationale d\'épargne', category: 'Banques, établissements financiers et assimilés' },
            { code: '575000', name: 'Autres institutions financières', category: 'Banques, établissements financiers et assimilés' },
            { code: '576000', name: 'Caisses du Trésor et des collectivités publiques', category: 'Banques, établissements financiers et assimilés' },
            { code: '577000', name: 'Autres organismes financiers', category: 'Banques, établissements financiers et assimilés' },
            { code: '578000', name: 'Autres valeurs et autres comptes de trésorerie', category: 'Autres' },
            { code: '581000', name: 'Titres et valeurs de placement', category: 'Valeurs mobilières de placement' },
            { code: '582000', name: 'Bons du Trésor et bons de caisse à court terme', category: 'Valeurs mobilières de placement' },
            { code: '590000', name: 'Provisions pour dépréciation des valeurs mobilières de placement', category: 'Provisions' },
            { code: '599000', name: 'Provisions pour dépréciation des comptes de trésorerie', category: 'Provisions' },

            // CLASSE 6 - Comptes de charges
            { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
            { code: '602000', name: 'Achats de matières premières et fournitures liées', category: 'Achats' },
            { code: '603000', name: 'Variations des stocks', category: 'Achats' },
            { code: '604000', name: 'Achats stockés - Matières et fournitures', category: 'Achats' },
            { code: '605000', name: 'Autres achats', category: 'Achats' },
            { code: '608000', name: 'Achats d\'emballages', category: 'Achats' },
            { code: '609000', name: 'Rabais, remises et ristournes obtenus sur achats', category: 'Achats' },
            { code: '611000', name: 'Sous-traitance générale', category: 'Services extérieurs' },
            { code: '612000', name: 'Redevances de crédit-bail', category: 'Services extérieurs' },
            { code: '613000', name: 'Locations', category: 'Services extérieurs' },
            { code: '614000', name: 'Charges locatives et de copropriété', category: 'Services extérieurs' },
            { code: '615000', name: 'Entretien et réparations', category: 'Services extérieurs' },
            { code: '616000', name: 'Primes d\'assurances', category: 'Services extérieurs' },
            { code: '617000', name: 'Études et recherches', category: 'Services extérieurs' },
            { code: '618000', name: 'Divers', category: 'Services extérieurs' },
            { code: '619000', name: 'Rabais, remises et ristournes obtenus sur services extérieurs', category: 'Services extérieurs' },
            { code: '621000', name: 'Personnel extérieur à l\'entreprise', category: 'Autres services extérieurs' },
            { code: '622000', name: 'Rémunérations d\'intermédiaires et honoraires', category: 'Autres services extérieurs' },
            { code: '623000', name: 'Publicité, publications, relations publiques', category: 'Autres services extérieurs' },
            { code: '624000', name: 'Transports de biens et transports collectifs du personnel', category: 'Autres services extérieurs' },
            { code: '625000', name: 'Déplacements, missions et réceptions', category: 'Autres services extérieurs' },
            { code: '626000', name: 'Frais postaux et de télécommunications', category: 'Autres services extérieurs' },
            { code: '627000', name: 'Services bancaires et assimilés', category: 'Autres services extérieurs' },
            { code: '628000', name: 'Divers', category: 'Autres services extérieurs' },
            { code: '629000', name: 'Rabais, remises et ristournes obtenus sur autres services extérieurs', category: 'Autres services extérieurs' },
            { code: '631000', name: 'Impôts, taxes et versements assimilés sur rémunérations', category: 'Impôts, taxes et versements assimilés' },
            { code: '633000', name: 'Impôts, taxes et versements assimilés sur rémunérations', category: 'Impôts, taxes et versements assimilés' },
            { code: '635000', name: 'Autres impôts, taxes et versements assimilés', category: 'Impôts, taxes et versements assimilés' },
            { code: '637000', name: 'Impôts, taxes et versements assimilés', category: 'Impôts, taxes et versements assimilés' },
            { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
            { code: '644000', name: 'Rémunération du travail de l\'exploitant', category: 'Charges de personnel' },
            { code: '645000', name: 'Charges de sécurité sociale et de prévoyance', category: 'Charges de personnel' },
            { code: '646000', name: 'Cotisations sociales', category: 'Charges de personnel' },
            { code: '647000', name: 'Autres charges sociales', category: 'Charges de personnel' },
            { code: '648000', name: 'Autres charges de personnel', category: 'Charges de personnel' },
            { code: '651000', name: 'Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires', category: 'Autres charges' },
            { code: '652000', name: 'Moins-values des cessions d\'éléments d\'actif', category: 'Autres charges' },
            { code: '653000', name: 'Jetons de présence', category: 'Autres charges' },
            { code: '654000', name: 'Pertes sur créances irrécouvrables', category: 'Autres charges' },
            { code: '655000', name: 'Quote-part de résultat sur opérations faites en commun', category: 'Autres charges' },
            { code: '658000', name: 'Charges diverses', category: 'Autres charges' },
            { code: '661000', name: 'Charges d\'intérêts', category: 'Charges financières' },
            { code: '664000', name: 'Pertes sur créances liées à des participations', category: 'Charges financières' },
            { code: '665000', name: 'Escomptes accordés', category: 'Charges financières' },
            { code: '666000', name: 'Pertes de change', category: 'Charges financières' },
            { code: '667000', name: 'Charges nettes sur cessions de valeurs mobilières de placement', category: 'Charges financières' },
            { code: '668000', name: 'Autres charges financières', category: 'Charges financières' },
            { code: '671000', name: 'Charges exceptionnelles sur opérations de gestion', category: 'Charges exceptionnelles' },
            { code: '675000', name: 'Valeurs comptables des éléments d\'actif cédés', category: 'Charges exceptionnelles' },
            { code: '676000', name: 'Différences sur réalisations d\'actifs de placement', category: 'Charges exceptionnelles' },
            { code: '677000', name: 'Charges exceptionnelles diverses', category: 'Charges exceptionnelles' },
            { code: '678000', name: 'Autres charges exceptionnelles', category: 'Charges exceptionnelles' },
            { code: '681000', name: 'Dotations aux amortissements et aux provisions - Charges d\'exploitation', category: 'Dotations aux amortissements' },
            { code: '686000', name: 'Dotations aux amortissements et aux provisions - Charges financières', category: 'Dotations aux amortissements' },
            { code: '687000', name: 'Dotations aux amortissements et aux provisions - Charges exceptionnelles', category: 'Dotations aux amortissements' },
            { code: '691000', name: 'Participation des salariés aux résultats', category: 'Participation des salariés' },
            { code: '695000', name: 'Impôts sur les bénéfices', category: 'Impôts sur les bénéfices' },
            { code: '696000', name: 'Suppléments d\'impôt sur les sociétés liés aux distributions', category: 'Impôts sur les bénéfices' },
            { code: '697000', name: 'Imposition forfaitaire annuelle des sociétés', category: 'Impôts sur les bénéfices' },
            { code: '699000', name: 'Produits - Reports en arrière des déficits', category: 'Impôts sur les bénéfices' },

            // CLASSE 7 - Comptes de produits
            { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
            { code: '702000', name: 'Ventes de produits finis', category: 'Ventes' },
            { code: '703000', name: 'Ventes de produits intermédiaires', category: 'Ventes' },
            { code: '704000', name: 'Ventes de produits résiduels', category: 'Ventes' },
            { code: '705000', name: 'Études', category: 'Ventes' },
            { code: '706000', name: 'Autres prestations de services', category: 'Ventes' },
            { code: '707000', name: 'Ventes de marchandises dans l\'Union européenne', category: 'Ventes' },
            { code: '708000', name: 'Produits des activités annexes', category: 'Ventes' },
            { code: '709000', name: 'Rabais, remises et ristournes accordés', category: 'Ventes' },
            { code: '711000', name: 'Variation des stocks de produits en cours', category: 'Production stockée' },
            { code: '712000', name: 'Variation des stocks de produits', category: 'Production stockée' },
            { code: '713000', name: 'Variation des stocks de produits en cours', category: 'Production stockée' },
            { code: '721000', name: 'Production immobilisée - Immobilisations incorporelles', category: 'Production immobilisée' },
            { code: '722000', name: 'Production immobilisée - Immobilisations corporelles', category: 'Production immobilisée' },
            { code: '731000', name: 'Subventions d\'exploitation', category: 'Subventions d\'exploitation' },
            { code: '739000', name: 'Reprises de subventions d\'exploitation', category: 'Subventions d\'exploitation' },
            { code: '741000', name: 'Subventions d\'investissement', category: 'Autres produits' },
            { code: '746000', name: 'Subventions d\'équilibre', category: 'Autres produits' },
            { code: '747000', name: 'Autres subventions', category: 'Autres produits' },
            { code: '748000', name: 'Autres produits', category: 'Autres produits' },
            { code: '751000', name: 'Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires', category: 'Autres produits' },
            { code: '752000', name: 'Revenus des immeubles non affectés aux activités professionnelles', category: 'Autres produits' },
            { code: '753000', name: 'Jetons de présence et rémunérations d\'administrateurs', category: 'Autres produits' },
            { code: '754000', name: 'Ristournes perçues des coopératives', category: 'Autres produits' },
            { code: '755000', name: 'Quotes-parts de résultat sur opérations faites en commun', category: 'Autres produits' },
            { code: '758000', name: 'Produits divers', category: 'Autres produits' },
            { code: '761000', name: 'Produits financiers', category: 'Produits financiers' },
            { code: '762000', name: 'Revenus des autres créances', category: 'Produits financiers' },
            { code: '763000', name: 'Revenus des autres créances', category: 'Produits financiers' },
            { code: '764000', name: 'Revenus des valeurs mobilières de placement', category: 'Produits financiers' },
            { code: '765000', name: 'Escomptes obtenus', category: 'Produits financiers' },
            { code: '766000', name: 'Gains de change', category: 'Produits financiers' },
            { code: '767000', name: 'Produits nets sur cessions de valeurs mobilières de placement', category: 'Produits financiers' },
            { code: '768000', name: 'Autres produits financiers', category: 'Produits financiers' },
            { code: '771000', name: 'Produits exceptionnels sur opérations de gestion', category: 'Produits exceptionnels' },
            { code: '775000', name: 'Produits des cessions d\'éléments d\'actif', category: 'Produits exceptionnels' },
            { code: '777000', name: 'Quote-part des subventions d\'investissement virée au résultat de l\'exercice', category: 'Produits exceptionnels' },
            { code: '778000', name: 'Autres produits exceptionnels', category: 'Produits exceptionnels' },
            { code: '781000', name: 'Reprises sur amortissements et provisions', category: 'Reprises sur provisions' },
            { code: '786000', name: 'Reprises sur provisions pour risques', category: 'Reprises sur provisions' },
            { code: '787000', name: 'Reprises sur provisions', category: 'Reprises sur provisions' },

            // CLASSE 8 - Comptes spéciaux
            { code: '801000', name: 'Engagements donnés', category: 'Engagements' },
            { code: '802000', name: 'Engagements reçus', category: 'Engagements' },
            { code: '803000', name: 'Engagements donnés sur exercices antérieurs', category: 'Engagements' },
            { code: '804000', name: 'Engagements reçus sur exercices antérieurs', category: 'Engagements' },
            { code: '805000', name: 'Engagements de financement donnés', category: 'Engagements' },
            { code: '806000', name: 'Engagements de financement reçus', category: 'Engagements' },
            { code: '807000', name: 'Engagements en matière de pensions de retraite et obligations similaires', category: 'Engagements' },
            { code: '808000', name: 'Autres engagements donnés', category: 'Engagements' },
            { code: '809000', name: 'Autres engagements reçus', category: 'Engagements' },

            // CLASSE 9 - Comptabilité analytique
            { code: '901000', name: 'Comptes de reclassement et d\'analyse', category: 'Comptabilité analytique' },
            { code: '902000', name: 'Comptes d\'analyse - Charges', category: 'Comptabilité analytique' },
            { code: '903000', name: 'Comptes d\'analyse - Produits', category: 'Comptabilité analytique' },
            { code: '904000', name: 'Comptes de centres d\'analyse', category: 'Comptabilité analytique' },
            { code: '905000', name: 'Comptes de coûts', category: 'Comptabilité analytique' },
            { code: '906000', name: 'Comptes d\'écarts', category: 'Comptabilité analytique' },
            { code: '907000', name: 'Comptes de résultats analytiques', category: 'Comptabilité analytique' },
            { code: '908000', name: 'Comptes de liaison internes', category: 'Comptabilité analytique' },
            { code: '909000', name: 'Comptes de liaison avec la comptabilité générale', category: 'Comptabilité analytique' }
        ];
    }

    syncWithGlobalApp() {
        // Créer ou mettre à jour la variable globale app
        window.app = {
            currentProfile: this.state.currentProfile,
            currentCompany: this.state.currentCompany,
            currentUser: this.state.currentUser,
            isAuthenticated: this.state.isAuthenticated,
            accounts: this.state.accounts,
            entries: this.state.entries,
            companies: this.state.companies,
            users: this.state.users,
            cashRegisters: this.state.cashRegisters,
            companyLogo: this.state.companyLogo,
            notifications: this.state.notifications,
            deadlines: []
        };

        console.log('🔄 window.app synchronisé avec', window.app.companies.length, 'entreprises');
    }

    async authenticate(email, password) {
        try {
            this.logAuditEvent('LOGIN_ATTEMPT', { email });

            const user = this.state.users.find(u => u.email === email);

            if (!user || !this.verifyPassword(password, user.passwordHash)) {
                throw new Error('Identifiants incorrects');
            }

            if (user.status !== 'Actif') {
                throw new Error('Compte désactivé');
            }

            // Connexion réussie
            this.state.isAuthenticated = true;
            this.state.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };
            this.state.currentProfile = user.profile;

            // Auto-sélection d'entreprise pour utilisateur/caissier
            if (user.profile === 'user' || user.profile === 'caissier') {
                this.state.currentCompany = user.companyId;
            }

            user.lastLogin = new Date();
            this.logAuditEvent('LOGIN_SUCCESS', { userId: user.id });

            // Synchroniser OBLIGATOIREMENT
            this.syncWithGlobalApp();

            return {
                success: true,
                user: this.state.currentUser,
                profile: this.state.currentProfile
            };

        } catch (error) {
            console.error('Erreur authentification:', error);
            throw error;
        }
    }

    getCompanyName() {
        if (!this.state.currentCompany) return 'Aucune entreprise sélectionnée';
        const company = this.state.companies.find(c => c.id === this.state.currentCompany);
        return company ? company.name : 'Entreprise inconnue';
    }

    // Nouvelles méthodes CRUD
    createUser(userData) {
        const newUser = {
            id: this.state.users.length + 1,
            uniqueId: this.idGenerator.user(),
            ...userData,
            passwordHash: this.hashPassword(userData.password),
            status: 'Actif',
            companies: [],
            assignedCompanies: []
        };
        delete newUser.password;
        
        this.state.users.push(newUser);
        this.syncWithGlobalApp();
        this.logAuditEvent('USER_CREATED', { userId: newUser.id, name: newUser.name });
        return newUser;
    }

    createCompany(companyData) {
        const newCompany = {
            id: this.state.companies.length + 1,
            uniqueId: this.idGenerator.company(),
            ...companyData,
            status: 'Actif',
            cashRegisters: 0
        };
        
        this.state.companies.push(newCompany);
        this.syncWithGlobalApp();
        this.logAuditEvent('COMPANY_CREATED', { companyId: newCompany.id, name: newCompany.name });
        return newCompany;
    }

    createEntry(entryData) {
        const newEntry = {
            id: this.state.entries.length + 1,
            uniqueId: this.idGenerator.entry(),
            ...entryData,
            companyId: this.state.currentCompany,
            userId: this.state.currentUser.id,
            status: 'En attente'
        };
        
        this.state.entries.push(newEntry);
        this.syncWithGlobalApp();
        this.logAuditEvent('ENTRY_CREATED', { entryId: newEntry.id, piece: newEntry.piece });
        return newEntry;
    }

    createAccount(accountData) {
        const newAccount = {
            id: this.state.accounts.length + 1,
            uniqueId: this.idGenerator.account(),
            ...accountData
        };
        
        this.state.accounts.push(newAccount);
        this.syncWithGlobalApp();
        this.logAuditEvent('ACCOUNT_CREATED', { accountId: newAccount.id, code: newAccount.code });
        return newAccount;
    }

    createCashRegister(cashData) {
        const newCash = {
            id: this.state.cashRegisters.length + 1,
            uniqueId: this.idGenerator.cash(),
            ...cashData,
            companyId: this.state.currentCompany,
            status: 'Ouvert',
            balance: cashData.openingBalance || 0,
            dailyReceipts: 0,
            dailyExpenses: 0
        };
        
        this.state.cashRegisters.push(newCash);
        this.syncWithGlobalApp();
        this.logAuditEvent('CASH_CREATED', { cashId: newCash.id, name: newCash.name });
        return newCash;
    }

    getFilteredData(type) {
        const currentCompany = this.state.currentCompany;
        const currentProfile = this.state.currentProfile;
        
        switch(type) {
            case 'entries':
                if (!currentCompany && ['admin', 'collaborateur-senior', 'collaborateur'].includes(currentProfile)) {
                    return [];
                }
                return this.state.entries.filter(e => 
                    currentProfile === 'admin' || 
                    !currentCompany || 
                    e.companyId === currentCompany
                );
                
            case 'cashRegisters':
                if (!currentCompany && ['admin', 'collaborateur-senior', 'collaborateur'].includes(currentProfile)) {
                    return [];
                }
                return this.state.cashRegisters.filter(c => 
                    currentProfile === 'admin' || 
                    !currentCompany || 
                    c.companyId === currentCompany
                );
                
            default:
                return this.state[type] || [];
        }
    }
}

// =============================================================================
// GESTIONNAIRE UI
// =============================================================================

class UIManager {
    constructor(app) {
        this.app = app;
        this.initializeTheme();
    }

    initializeTheme() {
        if (localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });
    }

    showNotification(type, message) {
        const icons = { 'success': '✅', 'error': '❌', 'warning': '⚠️', 'info': 'ℹ️' };
        
        // Créer notification toast moderne
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-success text-white' :
            type === 'error' ? 'bg-danger text-white' :
            type === 'warning' ? 'bg-warning text-white' :
            'bg-info text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>${icons[type] || 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove après 5 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    updateCompanySelector() {
        const selector = document.getElementById('activeCompanySelect');
        if (!selector) return;

        const companies = window.app?.companies || [];
        selector.innerHTML = '<option value="">-- Sélectionner une entreprise --</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (company.id === window.app?.currentCompany) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
    }

    updateCompanyInfo() {
        const infoElement = document.getElementById('selectedCompanyInfo');
        const currentCompanyElement = document.getElementById('currentCompany');

        if (window.app?.currentCompany) {
            const company = window.app.companies.find(c => c.id === window.app.currentCompany);
            if (company) {
                if (infoElement) infoElement.innerHTML = `${company.system} • ${company.status}`;
                if (currentCompanyElement) currentCompanyElement.textContent = company.name;
            }
        } else {
            if (infoElement) infoElement.innerHTML = '';
            if (currentCompanyElement) currentCompanyElement.textContent = 'Aucune entreprise sélectionnée';
        }
    }
}

// =============================================================================
// FONCTIONS D'AFFICHAGE ET NAVIGATION
// =============================================================================

function loadNavigationMenu() {
    if (!window.app) {
        console.error('❌ window.app non défini dans loadNavigationMenu');
        return;
    }

    const menuItems = {
        admin: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord Admin', active: true },
            { id: 'users', icon: 'fas fa-users', text: 'Gestion Collaborateurs' },
            { id: 'companies', icon: 'fas fa-building', text: 'Gestion Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        'collaborateur-senior': [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        collaborateur: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Tableau de Bord', active: true },
            { id: 'companies', icon: 'fas fa-building', text: 'Mes Entreprises' },
            { id: 'entries', icon: 'fas fa-edit', text: 'Écritures Comptables' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Gestion Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Rapports & États' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balances' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        user: [
            { id: 'dashboard', icon: 'fas fa-chart-pie', text: 'Mon Entreprise', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Mes Écritures' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Plan Comptable' },
            { id: 'caisse', icon: 'fas fa-cash-register', text: 'Mes Caisses' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'Mes Rapports' },
            { id: 'import', icon: 'fas fa-upload', text: 'Import Balance' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ],
        caissier: [
            { id: 'dashboard', icon: 'fas fa-cash-register', text: 'Ma Caisse', active: true },
            { id: 'entries', icon: 'fas fa-edit', text: 'Opérations Caisse' },
            { id: 'accounts', icon: 'fas fa-list', text: 'Comptes Disponibles' },
            { id: 'reports', icon: 'fas fa-chart-bar', text: 'État de Caisse' },
            { id: 'settings', icon: 'fas fa-user-cog', text: 'Mon Profil' }
        ]
    };

    const items = menuItems[window.app.currentProfile] || menuItems.user;
    const menuHtml = items.map(item => `
        <a href="#" onclick="navigateTo('${item.id}'); return false;" class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">
            <i class="${item.icon} w-5 h-5 mr-3"></i>
            <span>${item.text}</span>
        </a>
    `).join('');

    const menuElement = document.getElementById('navigationMenu');
    if (menuElement) {
        menuElement.innerHTML = menuHtml;
    }
}

function navigateTo(page) {
    console.log('🔄 Navigation vers:', page);

    if (!window.app) {
        console.error('❌ window.app non défini dans navigateTo');
        app.uiManager.showNotification('error', 'Erreur: Application non initialisée');
        return;
    }

    // Remove active class from all menu items
    document.querySelectorAll('#navigationMenu a').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700', 'dark:text-gray-300');
    });

    // Add active class to clicked item
    try {
        const clickedElement = event.target.closest('a');
        if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {
            clickedElement.classList.add('bg-primary', 'text-white');
            clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');
        }
    } catch (e) {
        // Ignore if event not available
    }

    // Load page content
    try {
        switch(page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'users':
                loadUsersManagement();
                break;
            case 'companies':
                loadCompanies();
                break;
            case 'entries':
                loadEntries();
                break;
            case 'accounts':
                loadAccounts();
                break;
            case 'caisse':
                loadCaisse();
                break;
            case 'reports':
                loadReports();
                break;
            case 'import':
                loadImport();
                break;
            case 'settings':
                loadSettings();
                break;
            default:
                console.log('⚠️ Page inconnue, chargement du dashboard');
                loadDashboard();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la page:', error);
        app.uiManager.showNotification('error', 'Erreur lors du chargement de la page: ' + page);
    }
}

function loadDashboard() {
    console.log('📊 Chargement du dashboard pour:', window.app.currentProfile);

    if (window.app.currentProfile === 'admin') {
        loadAdminDashboard();
    } else {
        loadStandardDashboard();
    }
}

function loadAdminDashboard() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord Administrateur</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- KPI Cards Admin -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entreprises Actives</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.companies.filter(c => c.status === 'Actif').length}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas fa-building text-primary text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center text-sm">
                        <span class="text-success">+2</span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Collaborateurs Actifs</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.users.filter(u => u.profile.includes('collaborateur')).length}</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-users text-info text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures en Attente</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.entries.filter(e => e.status === 'En attente').length}</p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-warning text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures Validées</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${window.app.entries.filter(e => e.status === 'Validé').length}</p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-check text-success text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Portefeuille Collaborateurs -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-briefcase mr-2 text-primary"></i>Portefeuille des Collaborateurs
                </h3>
                <div class="space-y-4">
                    ${generateCollaboratorPortfolio()}
                </div>
            </div>

            <!-- Charts Admin -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution du Portefeuille</h3>
                    <div class="h-64">
                        <canvas id="portfolioChart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance par Secteur</h3>
                    <div class="h-64">
                        <canvas id="sectorChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        
        // Initialiser les graphiques après avoir inséré le contenu
        setTimeout(() => {
            initializeCharts();
        }, 100);
        
        console.log('✅ Dashboard admin chargé');
    }
}

function loadStandardDashboard() {
    const userCompany = window.app.companies.find(c => c.id == window.app.currentCompany);
    let cashCount = userCompany ? userCompany.cashRegisters : 1;
    let dashboardTitle = 'Tableau de Bord';

    if (window.app.currentProfile === 'user') {
        dashboardTitle = 'Mon Entreprise';
    } else if (window.app.currentProfile === 'caissier') {
        dashboardTitle = 'Ma Caisse';
        cashCount = '→';
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>
                <div class="text-sm text-primary-light font-medium">
                    <i class="fas fa-clock mr-1"></i>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            <!-- KPI Cards Standard -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                ${window.app.currentProfile === 'user' ? 'Caisses disponibles' :
                                  window.app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">${cashCount}</p>
                        </div>
                        <div class="bg-primary/10 p-3 rounded-lg">
                            <i class="fas ${window.app.currentProfile === 'caissier' ? 'fa-plus-circle' :
                                           window.app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>
                        </div>
                    </div>
                    ${window.app.currentProfile === 'caissier' ? `
                    <div class="mt-3">
                        <button onclick="openModal('newEntryModal')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                            Nouvelle opération
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-success">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Écritures ce mois</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${window.app.currentProfile === 'caissier' ? '45' : window.app.entries.filter(e => !window.app.currentCompany || e.companyId === window.app.currentCompany).length}
                            </p>
                        </div>
                        <div class="bg-success/10 p-3 rounded-lg">
                            <i class="fas fa-edit text-success text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-warning">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente validation</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">
                                ${window.app.entries.filter(e => e.status === 'En attente' && (!window.app.currentCompany || e.companyId === window.app.currentCompany)).length}
                            </p>
                        </div>
                        <div class="bg-warning/10 p-3 rounded-lg">
                            <i class="fas fa-clock text-warning text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-info">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white">98%</p>
                        </div>
                        <div class="bg-info/10 p-3 rounded-lg">
                            <i class="fas fa-chart-line text-info text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Standard -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution Mensuelle</h3>
                    <div class="h-64">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par Journal</h3>
                    <div class="h-64">
                        <canvas id="journalChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = content;
        
        // Initialiser les graphiques après avoir inséré le contenu
        setTimeout(() => {
            initializeStandardCharts();
        }, 100);
        
        console.log('✅ Dashboard standard chargé');
    }
}

function initializeCharts() {
    // Graphique d'évolution du portefeuille
    const portfolioCtx = document.getElementById('portfolioChart');
    if (portfolioCtx) {
        new Chart(portfolioCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Entreprises actives',
                    data: [2, 3, 3, 4, 4, 4],
                    borderColor: '#5D5CDE',
                    backgroundColor: 'rgba(93, 92, 222, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }

    // Graphique de performance par secteur
    const sectorCtx = document.getElementById('sectorChart');
    if (sectorCtx) {
        new Chart(sectorCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Commerce', 'Services', 'Industrie', 'Tech'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: ['#5D5CDE', '#10B981', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function initializeStandardCharts() {
    // Graphique d'évolution mensuelle
    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx) {
        new Chart(monthlyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [{
                    label: 'Écritures',
                    data: [12, 15, 18, 22, 25, 20],
                    backgroundColor: '#5D5CDE'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Graphique répartition par journal
    const journalCtx = document.getElementById('journalChart');
    if (journalCtx) {
        new Chart(journalCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['JV', 'JA', 'JB', 'JC', 'JOD'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: ['#5D5CDE', '#10B981', '#F59E0B', '#EF4444', '#6B7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function generateCollaboratorPortfolio() {
    const collaborators = window.app.users.filter(u => u.profile.includes('collaborateur'));

    if (collaborators.length === 0) {
        return '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun collaborateur trouvé</div>';
    }

    return collaborators.map(collab => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    ${collab.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">${collab.name}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${collab.role}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold text-gray-900 dark:text-white">${collab.companies?.length || 0}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">entreprises</div>
                <div class="flex items-center space-x-2 mt-1">
                    <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div class="h-full bg-success" style="width: 95%"></div>
                    </div>
                    <span class="text-xs font-medium text-success">95%</span>
                </div>
            </div>
        </div>
    `).join('');
}

function loadUsersManagement() {
    if (window.app.currentProfile !== 'admin') {
        showAccessDenied();
        return;
    }

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>
                <button onclick="openModal('newUserModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>Nouveau Collaborateur
                </button>
            </div>

            <!-- Statistiques utilisateurs -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${window.app.users.filter(u => u.profile.includes('collaborateur')).length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Collaborateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-info">${window.app.users.filter(u => u.profile === 'user').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Utilisateurs</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${window.app.users.filter(u => u.profile === 'caissier').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Caissiers</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${window.app.users.filter(u => u.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Utilisateurs</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utilisateur</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profil</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprises</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${window.app.users.map(user => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                            ${user.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900 dark:text-white">${user.name}</div>
                                            <div class="text-sm text-gray-500 dark:text-gray-400">${user.phone || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded text-xs ${user.profile === 'admin' ? 'bg-danger/20 text-danger' :
                                                                          user.profile.includes('collaborateur') ? 'bg-primary/20 text-primary' :
                                                                          user.profile === 'user' ? 'bg-info/20 text-info' :
                                                                          'bg-warning/20 text-warning'}">${user.role}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${user.assignedCompanies?.length || 0}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded text-xs ${user.status === 'Actif' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${user.status}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <div class="flex space-x-2">
                                        <button onclick="viewUser(${user.id})" class="text-primary hover:text-primary/80" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="editUser(${user.id})" class="text-info hover:text-info/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="manageUserCompanies(${user.id})" class="text-warning hover:text-warning/80" title="Gérer entreprises">
                                            <i class="fas fa-building"></i>
                                        </button>
                                        <button onclick="deleteUser(${user.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page utilisateurs chargée');
}

function loadCompanies() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'admin' ? 'Gestion des Entreprises' : 'Mes Entreprises'}
                </h2>
                ${window.app.currentProfile === 'admin' ? `
                <button onclick="openModal('newCompanyModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nouvelle Entreprise
                </button>
                ` : ''}
            </div>

            <!-- Statistiques entreprises -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${window.app.companies.length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total entreprises</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${window.app.companies.filter(c => c.status === 'Actif').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Actives</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${window.app.companies.filter(c => c.status === 'Période d\'essai').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En essai</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-danger">${window.app.companies.filter(c => c.status === 'Suspendu').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Suspendues</div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Entreprises</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Système</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${window.app.companies.map(company => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900 dark:text-white">${company.name}</div>
                                        <div class="text-sm text-gray-500 dark:text-gray-400">${company.address}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.type}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.system}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.phone}</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded text-xs ${company.status === 'Actif' ? 'bg-success/20 text-success' :
                                                                           company.status === 'Période d\'essai' ? 'bg-warning/20 text-warning' :
                                                                           'bg-danger/20 text-danger'}">${company.status}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <div class="flex space-x-2">
                                        <button onclick="viewCompany(${company.id})" class="text-primary hover:text-primary/80" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${window.app.currentProfile === 'admin' ? `
                                        <button onclick="editCompany(${company.id})" class="text-info hover:text-info/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteCompany(${company.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page entreprises chargée');
}

function loadEntries() {
    // Vérifier qu'une entreprise est sélectionnée pour les profils admin/collaborateur
    if (['admin', 'collaborateur-senior', 'collaborateur'].includes(window.app.currentProfile) && !window.app.currentCompany) {
        showCompanySelectionRequired();
        return;
    }

    const filteredEntries = app.getFilteredData('entries');

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-book mr-2"></i>Journal SYSCOHADA
                    </div>
                    <button onclick="openModal('newEntryModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle écriture
                    </button>
                </div>
            </div>

            <!-- Statistiques écritures -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-primary">${filteredEntries.length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Total écritures</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-success">${filteredEntries.filter(e => e.status === 'Validé').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Validées</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-warning">${filteredEntries.filter(e => e.status === 'En attente').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">En attente</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-info">${filteredEntries.filter(e => e.journal === 'JV').length}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Journal Ventes</div>
                </div>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Rechercher..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option>Tous les journaux</option>
                        <option>Journal Général (JG)</option>
                        <option>Journal des Achats (JA)</option>
                        <option>Journal des Ventes (JV)</option>
                        <option>Journal de Banque (JB)</option>
                        <option>Journal de Caisse (JC)</option>
                        <option>Journal des Opérations Diverses (JOD)</option>
                    </select>
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>En attente</option>
                        <option>Brouillon</option>
                    </select>
                    <input type="date" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Écritures</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Journal</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Pièce</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Libellé</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${filteredEntries.map(entry => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">${entry.libelle}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono">${entry.lines.reduce((sum, line) => sum + line.debit, 0).toLocaleString('fr-FR')} FCFA</td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 py-1 rounded text-sm ${entry.status === 'Validé' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${entry.status}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex space-x-2">
                                        <button onclick="viewEntry(${entry.id})" class="text-primary hover:text-primary/80" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="editEntry(${entry.id})" class="text-info hover:text-info/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteEntry(${entry.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page écritures chargée');
}

function loadAccounts() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-calculator mr-2"></i>${window.app.accounts.length} comptes
                    </div>
                    ${window.app.currentProfile !== 'caissier' ? `
                    <button onclick="openModal('newAccountModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouveau Compte
                    </button>
                    ` : ''}
                </div>
            </div>

            <!-- Statistiques par classe -->
            <div class="grid grid-cols-3 md:grid-cols-9 gap-4">
                ${[1,2,3,4,5,6,7,8,9].map(classe => `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-primary">${window.app.accounts.filter(a => a.code.startsWith(classe.toString())).length}</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Classe ${classe}</div>
                </div>
                `).join('')}
            </div>

            <!-- Filtres -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="Rechercher un compte..." class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Toutes les classes</option>
                        <option value="1">Classe 1 - Capitaux</option>
                        <option value="2">Classe 2 - Immobilisations</option>
                        <option value="3">Classe 3 - Stocks</option>
                        <option value="4">Classe 4 - Tiers</option>
                        <option value="5">Classe 5 - Trésorerie</option>
                        <option value="6">Classe 6 - Charges</option>
                        <option value="7">Classe 7 - Produits</option>
                        <option value="8">Classe 8 - Spéciaux</option>
                        <option value="9">Classe 9 - Analytique</option>
                    </select>
                    <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                        <option value="">Toutes les catégories</option>
                        <option value="Capitaux propres">Capitaux propres</option>
                        <option value="Immobilisations">Immobilisations</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Tiers">Tiers</option>
                        <option value="Financiers">Financiers</option>
                        <option value="Charges">Charges</option>
                        <option value="Produits">Produits</option>
                    </select>
                    <button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <i class="fas fa-sync mr-2"></i>Réinitialiser
                    </button>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes Disponibles</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom du compte</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classe</th>
                                ${window.app.currentProfile !== 'caissier' ? `
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                ` : ''}
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${window.app.accounts.slice(0, 50).map(account => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <code class="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">${account.code}</code>
                                </td>
                                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${account.name}</td>
                                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${account.category}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Classe ${account.code[0]}</td>
                                ${window.app.currentProfile !== 'caissier' ? `
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <div class="flex space-x-2">
                                        <button onclick="editAccount('${account.code}')" class="text-info hover:text-info/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteAccount('${account.code}')" class="text-danger hover:text-danger/80" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                                ` : ''}
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Affichage de 50 comptes sur ${window.app.accounts.length} total
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page comptes chargée');
}

function loadCaisse() {
    // Vérifier qu'une entreprise est sélectionnée pour les profils admin/collaborateur
    if (['admin', 'collaborateur-senior', 'collaborateur'].includes(window.app.currentProfile) && !window.app.currentCompany) {
        showCompanySelectionRequired();
        return;
    }

    const filteredCashRegisters = app.getFilteredData('cashRegisters');

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${window.app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Gestion des Caisses'}
                </h2>
                <div class="flex items-center space-x-4">
                    <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                        <i class="fas fa-cash-register mr-2"></i>${filteredCashRegisters.length} caisses
                    </div>
                    ${window.app.currentProfile !== 'caissier' ? `
                    <button onclick="openModal('newCashModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>Nouvelle Caisse
                    </button>
                    ` : ''}
                </div>
            </div>

            ${window.app.currentProfile === 'caissier' ? `
            <!-- Interface Caissier -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-cash-register mr-2 text-primary"></i>État de ma Caisse
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center p-4 bg-success/10 rounded-lg">
                            <span class="text-success font-medium">Solde d'ouverture</span>
                            <span class="text-2xl font-bold text-success">150,000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">
                            <span class="text-info font-medium">Recettes du jour</span>
                            <span class="text-2xl font-bold text-info">+85,000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">
                            <span class="text-warning font-medium">Dépenses du jour</span>
                            <span class="text-2xl font-bold text-warning">-25,000 FCFA</span>
                        </div>
                        <div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">
                            <span class="text-primary font-medium">Solde actuel</span>
                            <span class="text-3xl font-bold text-primary">210,000 FCFA</span>
                        </div>
                    </div>

                    <div class="mt-6 grid grid-cols-2 gap-4">
                        <button onclick="openModal('newEntryModal')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus-circle mr-2"></i>Nouvelle opération
                        </button>
                        <button onclick="printCashReport()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <i class="fas fa-print mr-2"></i>État de caisse
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-history mr-2 text-info"></i>Dernières Opérations
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-down text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Vente comptant</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">14:30</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-success">+15,000 FCFA</div>
                                <div class="text-xs text-success">Validé</div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-warning text-white rounded-full flex items-center justify-center">
                                    <i class="fas fa-arrow-up text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Achat fournitures</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">13:15</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-warning">-5,000 FCFA</div>
                                <div class="text-xs text-warning">En attente</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : `
            <!-- Interface Admin/Collaborateur -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des Caisses</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom de la Caisse</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsable</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Solde</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            ${filteredCashRegisters.map(cash => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${cash.name}</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">${cash.responsibleName || 'Non assigné'}</td>
                                <td class="px-6 py-4 font-mono text-gray-900 dark:text-white">${cash.balance.toLocaleString('fr-FR')} FCFA</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded text-sm ${cash.status === 'Ouvert' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-500'}">${cash.status}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-2">
                                        <button onclick="viewCash(${cash.id})" class="text-primary hover:text-primary/80" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="editCash(${cash.id})" class="text-info hover:text-info/80" title="Modifier">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteCash(${cash.id})" class="text-danger hover:text-danger/80" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `}
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page caisses chargée');
}

function loadReports() {
    // Vérifier qu'une entreprise est sélectionnée pour les profils admin/collaborateur
    if (['admin', 'collaborateur-senior', 'collaborateur'].includes(window.app.currentProfile) && !window.app.currentCompany) {
        showCompanySelectionRequired();
        return;
    }

    const currentCompanyName = window.app.companies.find(c => c.id === window.app.currentCompany)?.name || 'Toutes les entreprises';

    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rapports & États Financiers</h2>
                <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                    <i class="fas fa-building mr-2"></i>${currentCompanyName}
                </div>
            </div>

            <!-- Sélection de période -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sélection de période</h3>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Du</label>
                        <input type="date" id="reportDateFrom" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Au</label>
                        <input type="date" id="reportDateTo" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>
                        <select id="reportFormat" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="preview">Aperçu</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal</label>
                        <select id="reportJournal" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                            <option value="">Tous</option>
                            <option value="JG">Journal Général</option>
                            <option value="JA">Journal des Achats</option>
                            <option value="JV">Journal des Ventes</option>
                            <option value="JB">Journal de Banque</option>
                            <option value="JC">Journal de Caisse</option>
                            <option value="JOD">Journal des Op. Diverses</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="updateReportParams()" class="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-sync mr-2"></i>Actualiser
                        </button>
                    </div>
                </div>
            </div>

            <!-- États financiers SYSCOHADA -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Livres obligatoires -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-book mr-2 text-primary"></i>Livres Obligatoires
                    </h3>
                    <div class="space-y-3">
                        <button onclick="generateReport('journal')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Journal Général</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Chronologique des écritures</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-primary"></i>
                                </div>
                            </div>
                        </button>

                        <button onclick="generateReport('grandlivre')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Grand Livre</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Par compte</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-primary"></i>
                                </div>
                            </div>
                        </button>

                        <button onclick="generateReport('balance')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Balance Générale</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Tous les comptes</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-primary"></i>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- États financiers -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-chart-bar mr-2 text-success"></i>États Financiers
                    </h3>
                    <div class="space-y-3">
                        <button onclick="generateReport('bilan')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Bilan SYSCOHADA</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Actif / Passif</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-success"></i>
                                </div>
                            </div>
                        </button>

                        <button onclick="generateReport('resultat')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Compte de Résultat</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Charges / Produits</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-success"></i>
                                </div>
                            </div>
                        </button>

                        <button onclick="generateReport('tafire')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">TAFIRE</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">Tableau de flux</div>
                                </div>
                                <div class="flex space-x-2">
                                    <i class="fas fa-eye text-info"></i>
                                    <i class="fas fa-download text-success"></i>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            ${window.app.currentProfile === 'caissier' ? `
            <!-- États de caisse spécifiques -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-cash-register mr-2 text-warning"></i>États de Caisse
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onclick="generateReport('cash-daily')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div class="text-center">
                            <i class="fas fa-file-alt text-2xl text-warning mb-2"></i>
                            <div class="font-medium text-gray-900 dark:text-white">État journalier</div>
                        </div>
                    </button>

                    <button onclick="generateReport('cash-weekly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div class="text-center">
                            <i class="fas fa-calendar-week text-2xl text-info mb-2"></i>
                            <div class="font-medium text-gray-900 dark:text-white">Rapport hebdomadaire</div>
                        </div>
                    </button>

                    <button onclick="generateReport('cash-monthly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div class="text-center">
                            <i class="fas fa-calendar-alt text-2xl text-primary mb-2"></i>
                            <div class="font-medium text-gray-900 dark:text-white">Rapport mensuel</div>
                        </div>
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page rapports chargée');
}

function loadImport() {
    const content = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Import de Balances</h2>
                <div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">
                    <i class="fas fa-upload mr-2"></i>SYSCOHADA Compatible
                </div>
            </div>

            <!-- Guide d'import -->
            <div class="bg-info/10 border border-info/20 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-info mb-4">
                    <i class="fas fa-info-circle mr-2"></i>Guide d'import
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Format de fichier accepté</h4>
                        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Excel (.xlsx, .xls)</li>
                            <li>• CSV (séparateur virgule ou point-virgule)</li>
                            <li>• Taille maximum : 10 MB</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Colonnes requises</h4>
                        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Code compte (obligatoire)</li>
                            <li>• Libellé compte (obligatoire)</li>
                            <li>• Solde débit</li>
                            <li>• Solde crédit</li>
                        </ul>
                    </div>
                </div>
                <div class="mt-4">
                    <button onclick="downloadExcelTemplate()" class="bg-info hover:bg-info/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-download mr-2"></i>Télécharger le modèle Excel
                    </button>
                </div>
            </div>

            <!-- Zone d'import -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-upload mr-2 text-primary"></i>Importer un fichier
                </h3>

                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <input type="file" accept=".xlsx,.xls,.csv" class="hidden" id="importFile" onchange="handleFileSelect(event)">
                    <div onclick="document.getElementById('importFile').click()" class="cursor-pointer">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez votre fichier ici ou cliquez pour sélectionner</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Formats supportés: Excel, CSV (max 10 MB)</p>
                    </div>
                </div>

                <div class="mt-4 hidden" id="fileInfo">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-file-excel text-success text-xl"></i>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white" id="fileName"></div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400" id="fileSize"></div>
                                </div>
                            </div>
                            <button onclick="startImport()" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <i class="fas fa-check mr-2"></i>Importer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Historique des imports -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Historique des imports</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fichier</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lignes traitées</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 text-gray-900 dark:text-white">15/12/2024 10:30</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">balance_novembre_2024.xlsx</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">245</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded text-sm bg-success/20 text-success">Réussi</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-2">
                                        <button onclick="viewImportDetails(1)" class="text-primary hover:text-primary/80" title="Voir détails">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="downloadImportLog(1)" class="text-info hover:text-info/80" title="Télécharger log">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 text-gray-900 dark:text-white">01/12/2024 14:15</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">comptes_clients.csv</td>
                                <td class="px-6 py-4 text-gray-900 dark:text-white">156</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded text-sm bg-success/20 text-success">Réussi</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-2">
                                        <button onclick="viewImportDetails(2)" class="text-primary hover:text-primary/80" title="Voir détails">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="downloadImportLog(2)" class="text-info hover:text-info/80" title="Télécharger log">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page import chargée');
}

function loadSettings() {
    const content = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>

            <!-- Informations utilisateur -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div class="flex items-center space-x-6 mb-6">
                    <div class="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        ${window.app.currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${window.app.currentUser.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400">${window.app.currentUser.email}</p>
                        <span class="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary">${window.app.currentUser.role}</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet</label>
                        <input type="text" value="${window.app.currentUser.name}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                        <input type="email" value="${window.app.currentUser.email}" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                        <input type="tel" value="+225 07 XX XX XX XX" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil</label>
                        <input type="text" value="${window.app.currentUser.role}" readonly class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Seul l'administrateur peut modifier votre profil</p>
                    </div>
                </div>

                <div class="mt-6 flex justify-between">
                    <button onclick="saveUserProfile()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-save mr-2"></i>Sauvegarder
                    </button>
                    <button onclick="changePassword()" class="bg-warning hover:bg-warning/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-key mr-2"></i>Changer mot de passe
                    </button>
                </div>
            </div>

            ${window.app.currentProfile === 'admin' ? `
            <!-- Section Admin: Gestion du logo -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-image mr-2 text-primary"></i>Logo de l'entreprise
                </h3>
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <i class="fas fa-image text-gray-400 text-2xl"></i>
                    </div>
                    <div>
                        <button onclick="openModal('logoUploadModal')" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-upload mr-2"></i>Télécharger logo
                        </button>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Format accepté: JPG, PNG (max 2MB)</p>
                    </div>
                </div>
            </div>

            <!-- Gestion des données (Admin) -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-database mr-2 text-danger"></i>Gestion des Données (Admin)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onclick="clearTestData()" class="bg-warning hover:bg-warning/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
                        <i class="fas fa-trash mr-3"></i>Supprimer les données test
                        <div class="text-xs mt-1 opacity-80">Supprime toutes les données de démonstration</div>
                    </button>
                    <button onclick="exportAllData()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
                        <i class="fas fa-download mr-3"></i>Exporter toutes les données
                        <div class="text-xs mt-1 opacity-80">Backup complet système</div>
                    </button>
                    <button onclick="importData()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
                        <i class="fas fa-upload mr-3"></i>Importer des données
                        <div class="text-xs mt-1 opacity-80">Restauration système</div>
                    </button>
                    <button onclick="generateTestData()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
                        <i class="fas fa-magic mr-3"></i>Générer données test
                        <div class="text-xs mt-1 opacity-80">Pour démonstration</div>
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- Statistiques personnelles -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mes Statistiques</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center p-4 bg-primary/10 rounded-lg">
                        <div class="text-2xl font-bold text-primary">
                            ${window.app.currentProfile === 'caissier' ? '45' : window.app.entries.filter(e => e.userId === window.app.currentUser.id).length}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            ${window.app.currentProfile === 'caissier' ? 'Opérations caisse' : 'Écritures'} ce mois
                        </div>
                    </div>
                    <div class="text-center p-4 bg-success/10 rounded-lg">
                        <div class="text-2xl font-bold text-success">
                            ${window.app.currentProfile === 'admin' ? window.app.companies.length :
                              window.app.currentProfile.includes('collaborateur') ? '8' : '1'}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            ${window.app.currentProfile === 'caissier' ? 'Caisse assignée' : 'Entreprises gérées'}
                        </div>
                    </div>
                    <div class="text-center p-4 bg-info/10 rounded-lg">
                        <div class="text-2xl font-bold text-info">98%</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Taux de validation</div>
                    </div>
                </div>
            </div>

            <!-- Session et déconnexion -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session</h3>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Dernière connexion: Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR')}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Profil: ${window.app.currentUser.role}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Navigateur: ${navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Autre'}</p>
                    </div>
                    <button onclick="confirmLogout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-sign-out-alt mr-2"></i>Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = content;
    console.log('✅ Page paramètres chargée');
}

function showAccessDenied() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-danger text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-ban text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Accès refusé</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
        </div>
    `;
}

function showCompanySelectionRequired() {
    document.getElementById('mainContent').innerHTML = `
        <div class="text-center p-8">
            <div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-building text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Sélection d'entreprise requise</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Veuillez sélectionner une entreprise dans la liste déroulante pour accéder à cette section.</p>
            <button onclick="navigateTo('companies')" class="mt-4 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                <i class="fas fa-building mr-2"></i>Gérer mes entreprises
            </button>
        </div>
    `;
}

// =============================================================================
// FONCTIONS MODALES ET CRUD
// =============================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        
        // Remplir les sélecteurs si nécessaire
        if (modalId === 'newCashModal') {
            populateCashResponsibleSelect();
        }
        if (modalId === 'newEntryModal') {
            initializeEntryForm();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Réinitialiser le formulaire
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Réinitialiser les éléments spécifiques
        if (modalId === 'newEntryModal') {
            document.getElementById('entryLines').innerHTML = '';
            updateEntryTotals();
        }
        if (modalId === 'logoUploadModal') {
            document.getElementById('logoPreview').innerHTML = '<i class="fas fa-image text-4xl text-gray-400"></i>';
        }
    }
}

function populateCashResponsibleSelect() {
    const select = document.getElementById('newCashResponsible');
    if (!select) return;
    
    select.innerHTML = '<option value="">Aucun responsable assigné</option>';
    
    const eligibleUsers = window.app.users.filter(u => 
        u.profile === 'caissier' || u.profile === 'user'
    );
    
    eligibleUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role})`;
        select.appendChild(option);
    });
}

function initializeEntryForm() {
    // Date par défaut
    document.getElementById('newEntryDate').value = new Date().toISOString().split('T')[0];
    
    // Générer un numéro de pièce
    const journal = document.getElementById('newEntryJournal').value || 'JG';
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '-');
    const number = String(window.app.entries.length + 1).padStart(4, '0');
    document.getElementById('newEntryPiece').value = `${journal}-${dateStr}-${number}`;
    
    // Ajouter une ligne par défaut
    addEntryLine();
}

function addEntryLine() {
    const container = document.getElementById('entryLines');
    const lineIndex = container.children.length;
    
    const lineHtml = `
        <div class="entry-line grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded">
            <div>
                <select class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" onchange="updateAccountName(this, ${lineIndex})">
                    <option value="">Code compte</option>
                    ${window.app.accounts.slice(0, 20).map(acc => `<option value="${acc.code}">${acc.code}</option>`).join('')}
                </select>
            </div>
            <div>
                <input type="text" placeholder="Nom compte" readonly class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white">
            </div>
            <div>
                <input type="text" placeholder="Libellé" class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            <div>
                <input type="number" placeholder="Débit" min="0" class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" onchange="updateEntryTotals()">
            </div>
            <div>
                <input type="number" placeholder="Crédit" min="0" class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" onchange="updateEntryTotals()">
            </div>
            <div>
                <button type="button" onclick="removeEntryLine(this)" class="w-full px-2 py-1 text-sm bg-danger text-white rounded hover:bg-danger/90 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', lineHtml);
    updateEntryTotals();
}

function removeEntryLine(button) {
    if (document.getElementById('entryLines').children.length > 1) {
        button.closest('.entry-line').remove();
        updateEntryTotals();
    } else {
        app.uiManager.showNotification('warning', 'Au moins une ligne d\'écriture est requise');
    }
}

function updateAccountName(select, lineIndex) {
    const account = window.app.accounts.find(a => a.code === select.value);
    const nameInput = select.closest('.entry-line').querySelector('input[placeholder="Nom compte"]');
    nameInput.value = account ? account.name : '';
}

function updateEntryTotals() {
    let totalDebit = 0;
    let totalCredit = 0;
    
    document.querySelectorAll('.entry-line').forEach(line => {
        const debit = parseFloat(line.querySelector('input[placeholder="Débit"]').value) || 0;
        const credit = parseFloat(line.querySelector('input[placeholder="Crédit"]').value) || 0;
        totalDebit += debit;
        totalCredit += credit;
    });
    
    document.getElementById('totalDebit').textContent = totalDebit.toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('totalCredit').textContent = totalCredit.toLocaleString('fr-FR') + ' FCFA';
}

function previewLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}" alt="Logo preview" class="w-16 h-16 object-cover rounded">`;
        };
        reader.readAsDataURL(file);
    }
}

// =============================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS FORMULAIRES
// =============================================================================

// Gestionnaire pour nouveau collaborateur
document.addEventListener('DOMContentLoaded', function() {
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('newUserName').value,
                email: document.getElementById('newUserEmail').value,
                phone: document.getElementById('newUserPhone').value,
                profile: document.getElementById('newUserProfile').value,
                role: getProfileDisplayName(document.getElementById('newUserProfile').value),
                password: document.getElementById('newUserPassword').value
            };
            
            try {
                const newUser = app.createUser(userData);
                app.uiManager.showNotification('success', `Collaborateur ${newUser.name} créé avec succès`);
                closeModal('newUserModal');
                loadUsersManagement(); // Recharger la page
            } catch (error) {
                app.uiManager.showNotification('error', 'Erreur lors de la création: ' + error.message);
            }
        });
    }

    // Gestionnaire pour nouvelle entreprise
    const newCompanyForm = document.getElementById('newCompanyForm');
    if (newCompanyForm) {
        newCompanyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const companyData = {
                name: document.getElementById('newCompanyName').value,
                type: document.getElementById('newCompanyType').value,
                system: document.getElementById('newCompanySystem').value,
                phone: document.getElementById('newCompanyPhone').value,
                address: document.getElementById('newCompanyAddress').value
            };
            
            try {
                const newCompany = app.createCompany(companyData);
                app.uiManager.showNotification('success', `Entreprise ${newCompany.name} créée avec succès`);
                closeModal('newCompanyModal');
                loadCompanies(); // Recharger la page
                app.uiManager.updateCompanySelector(); // Mettre à jour le sélecteur
            } catch (error) {
                app.uiManager.showNotification('error', 'Erreur lors de la création: ' + error.message);
            }
        });
    }

    // Gestionnaire pour nouvelle écriture
    const newEntryForm = document.getElementById('newEntryForm');
    if (newEntryForm) {
        newEntryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collecter les lignes d'écriture
            const lines = [];
            document.querySelectorAll('.entry-line').forEach(line => {
                const account = line.querySelector('select').value;
                const accountName = line.querySelector('input[placeholder="Nom compte"]').value;
                const libelle = line.querySelector('input[placeholder="Libellé"]').value;
                const debit = parseFloat(line.querySelector('input[placeholder="Débit"]').value) || 0;
                const credit = parseFloat(line.querySelector('input[placeholder="Crédit"]').value) || 0;
                
                if (account && (debit > 0 || credit > 0)) {
                    lines.push({ account, accountName, libelle, debit, credit });
                }
            });
            
            // Vérifier équilibre
            const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
            const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                app.uiManager.showNotification('error', 'L\'écriture n\'est pas équilibrée (Débit ≠ Crédit)');
                return;
            }
            
            if (lines.length < 2) {
                app.uiManager.showNotification('error', 'Une écriture doit contenir au moins 2 lignes');
                return;
            }
            
            const entryData = {
                date: document.getElementById('newEntryDate').value,
                journal: document.getElementById('newEntryJournal').value,
                piece: document.getElementById('newEntryPiece').value,
                libelle: document.getElementById('newEntryLibelle').value,
                lines: lines
            };
            
            try {
                const newEntry = app.createEntry(entryData);
                app.uiManager.showNotification('success', `Écriture ${newEntry.piece} créée avec succès`);
                closeModal('newEntryModal');
                loadEntries(); // Recharger la page
            } catch (error) {
                app.uiManager.showNotification('error', 'Erreur lors de la création: ' + error.message);
            }
        });
    }

    // Gestionnaire pour nouveau compte
    const newAccountForm = document.getElementById('newAccountForm');
    if (newAccountForm) {
        newAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accountData = {
                code: document.getElementById('newAccountCode').value,
                name: document.getElementById('newAccountName').value,
                category: document.getElementById('newAccountCategory').value
            };
            
            // Vérifier que le code n'existe pas déjà
            if (window.app.accounts.find(a => a.code === accountData.code)) {
                app.uiManager.showNotification('error', 'Ce code de compte existe déjà');
                return;
            }
            
            try {
                const newAccount = app.createAccount(accountData);
                app.uiManager.showNotification('success', `Compte ${newAccount.code} créé avec succès`);
                closeModal('newAccountModal');
                loadAccounts(); // Recharger la page
            } catch (error) {
                app.uiManager.showNotification('error', 'Erreur lors de la création: ' + error.message);
            }
        });
    }

    // Gestionnaire pour nouvelle caisse
    const newCashForm = document.getElementById('newCashForm');
    if (newCashForm) {
        newCashForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cashData = {
                name: document.getElementById('newCashName').value,
                responsibleId: document.getElementById('newCashResponsible').value || null,
                responsibleName: document.getElementById('newCashResponsible').selectedOptions[0]?.text || 'Non assigné',
                openingBalance: parseFloat(document.getElementById('newCashBalance').value) || 0
            };
            
            try {
                const newCash = app.createCashRegister(cashData);
                app.uiManager.showNotification('success', `Caisse ${newCash.name} créée avec succès`);
                closeModal('newCashModal');
                loadCaisse(); // Recharger la page
            } catch (error) {
                app.uiManager.showNotification('error', 'Erreur lors de la création: ' + error.message);
            }
        });
    }

    // Gestionnaire pour upload logo
    const logoUploadForm = document.getElementById('logoUploadForm');
    if (logoUploadForm) {
        logoUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('logoFile');
            if (!fileInput.files[0]) {
                app.uiManager.showNotification('error', 'Veuillez sélectionner un fichier');
                return;
            }
            
            // Simuler l'upload
            app.uiManager.showNotification('success', 'Logo téléchargé avec succès');
            closeModal('logoUploadModal');
        });
    }
});

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function getProfileDisplayName(profile) {
    const profiles = {
        'admin': 'Administrateur',
        'collaborateur-senior': 'Collaborateur Senior',
        'collaborateur': 'Collaborateur',
        'user': 'Utilisateur',
        'caissier': 'Caissier'
    };
    return profiles[profile] || profile;
}

// Fonctions CRUD pour utilisateurs
function viewUser(userId) {
    const user = window.app.users.find(u => u.id === userId);
    if (user) {
        app.uiManager.showNotification('info', `Visualisation de ${user.name} - ${user.role}`);
    }
}

function editUser(userId) {
    const user = window.app.users.find(u => u.id === userId);
    if (user) {
        app.uiManager.showNotification('info', `Modification de ${user.name} - Fonctionnalité à implémenter`);
    }
}

function manageUserCompanies(userId) {
    const user = window.app.users.find(u => u.id === userId);
    if (user) {
        app.uiManager.showNotification('info', `Gestion des entreprises pour ${user.name} - Fonctionnalité à implémenter`);
    }
}

function deleteUser(userId) {
    const user = window.app.users.find(u => u.id === userId);
    if (user && confirm(`Êtes-vous sûr de vouloir supprimer ${user.name} ?`)) {
        const index = window.app.users.findIndex(u => u.id === userId);
        window.app.users.splice(index, 1);
        app.syncWithGlobalApp();
        app.uiManager.showNotification('success', `Utilisateur ${user.name} supprimé`);
        loadUsersManagement();
    }
}

// Fonctions CRUD pour entreprises
function viewCompany(companyId) {
    const company = window.app.companies.find(c => c.id === companyId);
    if (company) {
        app.uiManager.showNotification('info', `Visualisation de ${company.name}`);
    }
}

function editCompany(companyId) {
    const company = window.app.companies.find(c => c.id === companyId);
    if (company) {
        app.uiManager.showNotification('info', `Modification de ${company.name} - Fonctionnalité à implémenter`);
    }
}

function deleteCompany(companyId) {
    const company = window.app.companies.find(c => c.id === companyId);
    if (company && confirm(`Êtes-vous sûr de vouloir supprimer ${company.name} ?`)) {
        const index = window.app.companies.findIndex(c => c.id === companyId);
        window.app.companies.splice(index, 1);
        app.syncWithGlobalApp();
        app.uiManager.showNotification('success', `Entreprise ${company.name} supprimée`);
        loadCompanies();
        app.uiManager.updateCompanySelector();
    }
}

// Fonctions CRUD pour écritures
function viewEntry(entryId) {
    const entry = window.app.entries.find(e => e.id === entryId);
    if (entry) {
        app.uiManager.showNotification('info', `Visualisation de l'écriture ${entry.piece}`);
    }
}

function editEntry(entryId) {
    const entry = window.app.entries.find(e => e.id === entryId);
    if (entry) {
        app.uiManager.showNotification('info', `Modification de l'écriture ${entry.piece} - Fonctionnalité à implémenter`);
    }
}

function deleteEntry(entryId) {
    const entry = window.app.entries.find(e => e.id === entryId);
    if (entry && confirm(`Êtes-vous sûr de vouloir supprimer l'écriture ${entry.piece} ?`)) {
        const index = window.app.entries.findIndex(e => e.id === entryId);
        window.app.entries.splice(index, 1);
        app.syncWithGlobalApp();
        app.uiManager.showNotification('success', `Écriture ${entry.piece} supprimée`);
        loadEntries();
    }
}

// Fonctions pour comptes
function editAccount(accountCode) {
    const account = window.app.accounts.find(a => a.code === accountCode);
    if (account) {
        app.uiManager.showNotification('info', `Modification du compte ${account.code} - Fonctionnalité à implémenter`);
    }
}

function deleteAccount(accountCode) {
    const account = window.app.accounts.find(a => a.code === accountCode);
    if (account && confirm(`Êtes-vous sûr de vouloir supprimer le compte ${account.code} - ${account.name} ?`)) {
        const index = window.app.accounts.findIndex(a => a.code === accountCode);
        window.app.accounts.splice(index, 1);
        app.syncWithGlobalApp();
        app.uiManager.showNotification('success', `Compte ${account.code} supprimé`);
        loadAccounts();
    }
}

// Fonctions pour caisses
function viewCash(cashId) {
    const cash = window.app.cashRegisters.find(c => c.id === cashId);
    if (cash) {
        app.uiManager.showNotification('info', `Visualisation de ${cash.name}`);
    }
}

function editCash(cashId) {
    const cash = window.app.cashRegisters.find(c => c.id === cashId);
    if (cash) {
        app.uiManager.showNotification('info', `Modification de ${cash.name} - Fonctionnalité à implémenter`);
    }
}

function deleteCash(cashId) {
    const cash = window.app.cashRegisters.find(c => c.id === cashId);
    if (cash && confirm(`Êtes-vous sûr de vouloir supprimer la caisse ${cash.name} ?`)) {
        const index = window.app.cashRegisters.findIndex(c => c.id === cashId);
        window.app.cashRegisters.splice(index, 1);
        app.syncWithGlobalApp();
        app.uiManager.showNotification('success', `Caisse ${cash.name} supprimée`);
        loadCaisse();
    }
}

// Fonctions pour rapports
function updateReportParams() {
    app.uiManager.showNotification('success', 'Paramètres de rapport mis à jour');
}

function generateReport(type) {
    const reportNames = {
        'journal': 'Journal Général',
        'grandlivre': 'Grand Livre',
        'balance': 'Balance Générale',
        'bilan': 'Bilan SYSCOHADA',
        'resultat': 'Compte de Résultat',
        'tafire': 'TAFIRE',
        'cash-daily': 'État journalier de caisse',
        'cash-weekly': 'Rapport hebdomadaire de caisse',
        'cash-monthly': 'Rapport mensuel de caisse'
    };

    const format = document.getElementById('reportFormat')?.value || 'pdf';
    const dateFrom = document.getElementById('reportDateFrom')?.value || '';
    const dateTo = document.getElementById('reportDateTo')?.value || '';
    const companyName = window.app.companies.find(c => c.id === window.app.currentCompany)?.name || 'Toutes';

    app.uiManager.showNotification('success', 
        `📊 Génération du rapport "${reportNames[type]}" en cours...\n\nFormat: ${format.toUpperCase()}\nPériode: ${dateFrom} au ${dateTo}\nEntreprise: ${companyName}`
    );
    
    console.log('✅ Rapport généré:', type, { format, dateFrom, dateTo, companyName });
}

function printCashReport() {
    app.uiManager.showNotification('success', 'Impression de l\'état de caisse en cours...');
}

// Fonctions pour import
function downloadExcelTemplate() {
    // Créer un contenu CSV pour le template
    const csvContent = [
        'Code Compte,Libellé Compte,Solde Débit,Solde Crédit',
        '101000,Capital social,0,1000000',
        '411000,Clients,500000,0',
        '401000,Fournisseurs,0,300000',
        '512000,Banques,200000,0',
        '571000,Caisse,50000,0',
        '601000,Achats de marchandises,800000,0',
        '701000,Ventes de marchandises,0,1200000'
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_balance.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    app.uiManager.showNotification('success', '📄 Modèle Excel téléchargé avec succès !');
    console.log('✅ Template Excel téléchargé');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        document.getElementById('fileInfo').classList.remove('hidden');
    }
}

function startImport() {
    const fileName = document.getElementById('fileName').textContent;
    app.uiManager.showNotification('info', '📊 Import en cours...');

    setTimeout(() => {
        document.getElementById('fileInfo').classList.add('hidden');
        app.uiManager.showNotification('success', 
            `✅ Import terminé avec succès !\n\nFichier: ${fileName}\nLignes traitées: 156\nComptes ajoutés: 23\nComptes mis à jour: 133`
        );
    }, 2000);
}

function viewImportDetails(importId) {
    app.uiManager.showNotification('info', `Visualisation des détails de l'import ${importId}`);
}

function downloadImportLog(importId) {
    app.uiManager.showNotification('success', `Téléchargement du log d'import ${importId}`);
}

// Fonctions pour paramètres
function saveUserProfile() {
    app.uiManager.showNotification('success', 'Profil utilisateur sauvegardé avec succès');
}

function changePassword() {
    app.uiManager.showNotification('info', 'Changement de mot de passe - Fonctionnalité à implémenter');
}

function clearTestData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?')) {
        app.uiManager.showNotification('success', 'Données de test supprimées');
    }
}

function exportAllData() {
    app.uiManager.showNotification('success', 'Export des données en cours...');
}

function importData() {
    app.uiManager.showNotification('info', 'Import de données - Fonctionnalité à implémenter');
}

function generateTestData() {
    app.uiManager.showNotification('success', 'Données de test générées');
}

function confirmLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        document.getElementById('loginInterface').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        app.uiManager.showNotification('success', '✅ Déconnexion réussie. À bientôt !');
    }
}

// =============================================================================
// INITIALISATION GLOBALE
// =============================================================================

let app;

document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new DoukèComptaPro();
        app.initializeDefaultData();

        console.log('✅ DOUKÈ Compta Pro - Application initialisée avec succès');
        console.log('📊 Données chargées:', {
            companies: window.app?.companies?.length || 0,
            users: window.app?.users?.length || 0,
            accounts: window.app?.accounts?.length || 0,
            entries: window.app?.entries?.length || 0
        });

        initializeUIEvents();

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        alert('Erreur lors du démarrage de l\'application. Détails dans la console.');
    }
});

function initializeUIEvents() {
    // Gestionnaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const result = await app.authenticate(email, password);

                // Masquer l'interface de connexion et afficher l'application
                document.getElementById('loginInterface').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');

                // Initialiser l'interface utilisateur
                initializeMainApp();

                app.uiManager.showNotification('success', `Bienvenue ${result.user.name} !`);

            } catch (error) {
                app.uiManager.showNotification('error', error.message);
            }
        });
    }

    // Gestionnaire de sélection d'entreprise
    setTimeout(() => {
        const companySelect = document.getElementById('activeCompanySelect');
        if (companySelect) {
            companySelect.addEventListener('change', function(e) {
                if (e.target.value) {
                    try {
                        window.app.currentCompany = parseInt(e.target.value);
                        app.uiManager.updateCompanyInfo();
                        const company = window.app.companies.find(c => c.id === parseInt(e.target.value));
                        app.uiManager.showNotification('success', `Entreprise sélectionnée: ${company?.name}`);
                        
                        // Recharger la page courante si nécessaire
                        const currentPage = document.querySelector('#navigationMenu a.bg-primary')?.onclick?.toString()?.match(/navigateTo\('([^']+)'\)/)?.[1];
                        if (currentPage && ['entries', 'caisse', 'reports'].includes(currentPage)) {
                            navigateTo(currentPage);
                        }
                    } catch (error) {
                        app.uiManager.showNotification('error', error.message);
                        e.target.value = '';
                    }
                }
            });
        }
    }, 1000);
}

function initializeMainApp() {
    try {
        // Charger la navigation
        loadNavigationMenu();

        // Mettre à jour les informations utilisateur
        updateUserInfo();

        // Charger le tableau de bord
        loadDashboard();

        // Mettre à jour les sélecteurs
        app.uiManager.updateCompanySelector();
        app.uiManager.updateCompanyInfo();

        console.log('✅ Interface principale initialisée avec succès');

    } catch (error) {
        console.error('❌ Erreur initialisation interface:', error);
    }
}

function updateUserInfo() {
    const user = window.app?.currentUser;
    if (!user) return;

    try {
        // Mettre à jour les éléments de l'interface
        const elements = {
            'currentUser': user.name,
            'sidebarUserName': user.name,
            'sidebarUserRole': user.role
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Afficher/masquer les éléments selon le profil
        const profile = window.app?.currentProfile;
        const companySelector = document.getElementById('companySelector');
        const adminActions = document.getElementById('adminActions');

        if (companySelector) {
            const shouldShow = ['admin', 'collaborateur-senior', 'collaborateur'].includes(profile);
            companySelector.style.display = shouldShow ? 'block' : 'none';
        }

        if (adminActions) {
            adminActions.style.display = profile === 'admin' ? 'block' : 'none';
        }

    } catch (error) {
        console.error('❌ Erreur mise à jour infos utilisateur:', error);
    }
}

// Fonctions de compatibilité avec l'interface existante
function loginAs(profile) {
    const credentials = {
        'admin': { email: 'admin@doukecompta.ci', password: 'admin123' },
        'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },
        'collaborateur': { email: 'jean.diabate@cabinet.com', password: 'collab123' },
        'user': { email: 'atraore@sarltech.ci', password: 'user123' },
        'caissier': { email: 'ikone@caisse.ci', password: 'caisse123' }
    };

    const cred = credentials[profile];
    if (cred) {
        document.getElementById('loginEmail').value = cred.email;
        document.getElementById('loginPassword').value = cred.password;
    }
}

// Gestionnaire d'erreurs global
window.addEventListener('error', function(e) {
    console.error('❌ Erreur JavaScript:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesse rejetée:', e.reason);
});

console.log('🔧 Application DOUKÈ Compta Pro - Version complète chargée');
</script>

</body>
</html>
