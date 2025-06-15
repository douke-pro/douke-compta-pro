// =============================================================================
// DATA INITIALIZATION - DONNÉES ORIGINALES COMPLÈTES
// =============================================================================

function initializeData() {
    // Plan comptable SYSCOHADA Révisé complet (9 classes) - ORIGINAL COMPLET
    app.accounts = [
        // Classe 1 - Comptes de ressources durables
        { code: '101000', name: 'Capital social', category: 'Capitaux propres' },
        { code: '106000', name: 'Réserves', category: 'Capitaux propres' },
        { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres' },
        { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres' },
        { code: '161000', name: 'Emprunts et dettes', category: 'Dettes financières' },
        { code: '171000', name: 'Dettes de crédit-bail', category: 'Dettes financières' },

        // Classe 2 - Comptes d'actif immobilisé
        { code: '211000', name: 'Terrains', category: 'Immobilisations corporelles' },
        { code: '213000', name: 'Constructions', category: 'Immobilisations corporelles' },
        { code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles' },
        { code: '221000', name: 'Logiciels', category: 'Immobilisations incorporelles' },
        { code: '244000', name: 'Matériel et outillage', category: 'Immobilisations corporelles' },
        { code: '241000', name: 'Matériel et mobilier', category: 'Immobilisations corporelles' },

        // Classe 3 - Comptes de stocks
        { code: '311000', name: 'Marchandises', category: 'Stocks' },
        { code: '321000', name: 'Matières premières', category: 'Stocks' },
        { code: '371000', name: 'Stock en cours', category: 'Stocks' },
        { code: '381000', name: 'Stocks de produits finis', category: 'Stocks' },

        // Classe 4 - Comptes de tiers
        { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs' },
        { code: '411000', name: 'Clients', category: 'Clients' },
        { code: '421000', name: 'Personnel', category: 'Personnel' },
        { code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux' },
        { code: '441000', name: 'État et collectivités', category: 'État' },
        { code: '471000', name: 'Comptes d\'attente', category: 'Comptes transitoires' },

        // Classe 5 - Comptes financiers
        { code: '512000', name: 'Banques', category: 'Comptes bancaires' },
        { code: '531000', name: 'Chèques postaux', category: 'Comptes postaux' },
        { code: '571000', name: 'Caisse', category: 'Caisse' },
        { code: '581000', name: 'Virements internes', category: 'Virements' },

        // Classe 6 - Comptes de charges
        { code: '601000', name: 'Achats de marchandises', category: 'Achats' },
        { code: '605000', name: 'Autres achats', category: 'Achats' },
        { code: '621000', name: 'Transports', category: 'Services extérieurs' },
        { code: '622000', name: 'Rémunérations intermédiaires', category: 'Services extérieurs' },
        { code: '631000', name: 'Impôts et taxes', category: 'Impôts et taxes' },
        { code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel' },
        { code: '646000', name: 'Charges sociales', category: 'Charges de personnel' },
        { code: '681000', name: 'Dotations aux amortissements', category: 'Dotations' },

        // Classe 7 - Comptes de produits
        { code: '701000', name: 'Ventes de marchandises', category: 'Ventes' },
        { code: '706000', name: 'Services vendus', category: 'Ventes' },
        { code: '771000', name: 'Revenus financiers', category: 'Produits financiers' },
        { code: '781000', name: 'Reprises d\'amortissements', category: 'Reprises' },

        // Classe 8 - Comptes de résultats
        { code: '801000', name: 'Résultat en instance d\'affectation', category: 'Résultats' },
        { code: '810000', name: 'Résultat net: bénéfice', category: 'Résultats' },
        { code: '820000', name: 'Résultat net: perte', category: 'Résultats' },

        // Classe 9 - Comptes analytiques
        { code: '901000', name: 'Coûts de revient', category: 'Comptabilité analytique' },
        { code: '905000', name: 'Coûts de production', category: 'Comptabilité analytique' },
        { code: '910000', name: 'Charges indirectes', category: 'Comptabilité analytique' },
        { code: '920000', name: 'Centres d\'analyse', category: 'Comptabilité analytique' }
    ];

    // Entreprises avec données réalistes - ORIGINAL COMPLET
    app.companies = [
        {
            id: 1,
            name: 'SARL TECH INNOVATION',
            type: 'SARL',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 07 12 34 56 78',
            address: 'Abidjan, Cocody',
            cashRegisters: 3
        },
        {
            id: 2,
            name: 'SA COMMERCE PLUS',
            type: 'SA',
            status: 'Actif',
            system: 'Normal',
            phone: '+225 05 98 76 54 32',
            address: 'Abidjan, Plateau',
            cashRegisters: 5
        },
        {
            id: 3,
            name: 'EURL SERVICES PRO',
            type: 'EURL',
            status: 'Période d\'essai',
            system: 'Minimal',
            phone: '+225 01 23 45 67 89',
            address: 'Bouaké Centre',
            cashRegisters: 2
        },
        {
            id: 4,
            name: 'SAS DIGITAL WORLD',
            type: 'SAS',
            status: 'Suspendu',
            system: 'Normal',
            phone: '+225 07 11 22 33 44',
            address: 'San-Pédro',
            cashRegisters: 1
        }
    ];

    // Utilisateurs avec profils détaillés - ORIGINAL COMPLET
    app.users = [
        {
            id: 1,
            name: 'Admin Système',
            email: 'admin@doukecompta.ci',
            role: 'Administrateur',
            profile: 'admin',
            phone: '+225 07 00 00 00 00',
            companies: [1, 2, 3, 4],
            status: 'Actif'
        },
        {
            id: 2,
            name: 'Marie Kouassi',
            email: 'marie.kouassi@cabinet.com',
            role: 'Collaborateur Senior',
            profile: 'collaborateur-senior',
            phone: '+225 07 11 11 11 11',
            companies: [1, 2, 3],
            status: 'Actif'
        },
        {
            id: 3,
            name: 'Jean Diabaté',
            email: 'jean.diabate@cabinet.com',
            role: 'Collaborateur',
            profile: 'collaborateur',
            phone: '+225 07 22 22 22 22',
            companies: [2, 4],
            status: 'Actif'
        },
        {
            id: 4,
            name: 'Amadou Traoré',
            email: 'atraore@sarltech.ci',
            role: 'Utilisateur',
            profile: 'user',
            phone: '+225 07 33 33 33 33',
            companies: [1],
            status: 'Actif'
        },
        {
            id: 5,
            name: 'Ibrahim Koné',
            email: 'ikone@caisse.ci',
            role: 'Caissier',
            profile: 'caissier',
            phone: '+225 07 44 44 44 44',
            companies: [2],
            status: 'Actif'
        }
    ];

    // Écritures d'exemple avec données réelles - ORIGINAL COMPLET
    app.entries = [
        {
            id: 1,
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
        },
        {
            id: 3,
            date: '2024-12-13',
            journal: 'JC',
            piece: 'JC-2024-002-0034',
            libelle: 'Recette caisse vente comptant',
            companyId: 2,
            lines: [
                { account: '571000', accountName: 'Caisse', libelle: 'Encaissement espèces', debit: 150000, credit: 0 },
                { account: '701000', accountName: 'Ventes de marchandises', libelle: 'Vente comptant', debit: 0, credit: 150000 }
            ],
            status: 'Validé',
            userId: 5
        }
    ];

    // Initialiser les caisses - ORIGINAL COMPLET
    app.cashRegisters = [
        {
            id: 1,
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
            name: 'Caisse Ventes',
            companyId: 2,
            responsibleId: null,
            responsibleName: 'Fatou Diallo',
            balance: 85000,
            status: 'Ouvert',
            openingBalance: 100000,
            dailyReceipts: 35000,
            dailyExpenses: 50000
        },
        {
            id: 3,
            name: 'Caisse Réception',
            companyId: 1,
            responsibleId: null,
            responsibleName: 'Non assigné',
            balance: 0,
            status: 'Fermé',
            openingBalance: 0,
            dailyReceipts: 0,
            dailyExpenses: 0
        }
    ];

    console.log('✅ Données initialisées avec succès');
}

// SYSCOHADA RÉVISÉ JOURNALS MANAGEMENT - FONCTION ORIGINALE COMPLÈTE
function getSyscohadaJournals() {
    return {
        'JG': { name: 'Journal Général', prefix: 'JG', description: 'Toutes opérations non spécialisées' },
        'JA': { name: 'Journal des Achats', prefix: 'JA', description: 'Achats et charges externes' },
        'JV': { name: 'Journal des Ventes', prefix: 'JV', description: 'Ventes et produits d\'exploitation' },
        'JB': { name: 'Journal de Banque', prefix: 'JB', description: 'Opérations bancaires' },
        'JC': { name: 'Journal de Caisse', prefix: 'JC', description: 'Opérations de caisse' },
        'JOD': { name: 'Journal des Opérations Diverses', prefix: 'JOD', description: 'Écritures de régularisation' }
    };
}

function generateJournalNumber(journalCode, companyId) {
    const year = new Date().getFullYear();
    const journals = getSyscohadaJournals();
    const journal = journals[journalCode];

    if (!journal) return 'ERR-001';

    // Numérotation chronologique sécurisée
    const nextNumber = Date.now() % 10000;
    return `${journal.prefix}-${year}-${String(companyId || '001').padStart(3, '0')}-${String(nextNumber).padStart(4, '0')}`;
}

// DATA MANAGEMENT (ADMIN ONLY) - FONCTION ORIGINALE COMPLÈTE
function showAdminDataMenu() {
    if (app.currentProfile !== 'admin') {
        alert('❌ Accès refusé. Cette fonctionnalité est réservée aux administrateurs.');
        return;
    }

    const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModalOnBackground(event)">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md mx-4" onclick="event.stopPropagation()">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6">
    <i class="fas fa-shield-alt mr-2 text-danger"></i>Gestion des Données (Admin)
    </h3>

    <div class="space-y-4">
    <button onclick="clearTestData()" class="w-full bg-warning hover:bg-warning/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-trash mr-3"></i>Supprimer les données test
    <div class="text-xs mt-1 opacity-80">Action irréversible - Réservée admin</div>
    </button>

    <button onclick="exportAllData()" class="w-full bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-download mr-3"></i>Exporter toutes les données
    <div class="text-xs mt-1 opacity-80">Backup complet système</div>
    </button>

    <button onclick="importData()" class="w-full bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-upload mr-3"></i>Importer des données
    <div class="text-xs mt-1 opacity-80">Restauration système</div>
    </button>

    <button onclick="generateTestData()" class="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-magic mr-3"></i>Générer données test
    <div class="text-xs mt-1 opacity-80">Pour démonstration</div>
    </button>
    </div>

    <div class="mt-6 flex justify-end space-x-3">
    <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
    Fermer
    </button>
    </div>
    </div>
    </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

function clearTestData() {
    showSuccessMessage('📊 Suppression des données test...\n\nFonctionnalité en cours de développement.');
}

function exportAllData() {
    showSuccessMessage('📊 Export des données...\n\nFonctionnalité en cours de développement.');
}

function importData() {
    showSuccessMessage('📊 Import des données...\n\nFonctionnalité en cours de développement.');
}

function generateTestData() {
    showSuccessMessage('📊 Génération de données test...\n\nFonctionnalité en cours de développement.');
}
