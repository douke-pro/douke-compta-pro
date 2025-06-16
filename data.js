// =============================================================================
// DATA.JS - GESTION COMPLÈTE DES DONNÉES DE L'APPLICATION
// =============================================================================

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

    // =============================================================================
    // ENTREPRISES AVEC PLANS COMPTABLES SPÉCIFIQUES - CRITIQUE POUR LA SÉPARATION
    // =============================================================================
    
    // Entreprises avec données réalistes - ORIGINAL COMPLET + PLAN COMPTABLE SPÉCIFIQUE
    app.companies = [
        {
            id: 1,
            name: 'SARL TECH INNOVATION',
            type: 'SARL',
            status: 'Actif',
            system: 'Système normal',
            phone: '+225 07 12 34 56 78',
            email: 'contact@techinnovation.ci',
            address: 'Abidjan, Cocody - Riviera 3',
            cashRegisters: 3,
            createdAt: '2024-01-01T00:00:00.000Z',
            createdBy: 1,
            // PLAN COMPTABLE SPÉCIFIQUE À CETTE ENTREPRISE
            accountingPlan: generateCompanyAccountingPlan('SARL')
        },
        {
            id: 2,
            name: 'SA COMMERCE PLUS',
            type: 'SA',
            status: 'Actif',
            system: 'Système normal',
            phone: '+225 05 98 76 54 32',
            email: 'info@commerceplus.ci',
            address: 'Abidjan, Plateau - Boulevard de la République',
            cashRegisters: 5,
            createdAt: '2024-01-15T00:00:00.000Z',
            createdBy: 1,
            // PLAN COMPTABLE SPÉCIFIQUE À CETTE ENTREPRISE
            accountingPlan: generateCompanyAccountingPlan('SA')
        },
        {
            id: 3,
            name: 'EURL SERVICES PRO',
            type: 'EURL',
            status: 'Période d\'essai',
            system: 'Système simplifié',
            phone: '+225 01 23 45 67 89',
            email: 'admin@servicespro.ci',
            address: 'Bouaké Centre - Quartier Ahouatta',
            cashRegisters: 2,
            createdAt: '2024-02-01T00:00:00.000Z',
            createdBy: 1,
            // PLAN COMPTABLE SPÉCIFIQUE À CETTE ENTREPRISE
            accountingPlan: generateCompanyAccountingPlan('EURL')
        },
        {
            id: 4,
            name: 'SAS DIGITAL WORLD',
            type: 'SAS',
            status: 'Suspendu',
            system: 'Système normal',
            phone: '+225 07 11 22 33 44',
            email: 'contact@digitalworld.ci',
            address: 'San-Pédro - Zone Industrielle',
            cashRegisters: 1,
            createdAt: '2024-03-01T00:00:00.000Z',
            createdBy: 1,
            // PLAN COMPTABLE SPÉCIFIQUE À CETTE ENTREPRISE
            accountingPlan: generateCompanyAccountingPlan('SAS')
        }
    ];

    // Utilisateurs avec profils détaillés - CORRIGÉ ET COMPLÉTÉ AVEC ENTREPRISES ASSIGNÉES
    app.users = [
        {
            id: 1,
            name: 'Admin Système',
            email: 'admin@doukecompta.ci',
            role: 'Administrateur',
            profile: 'admin',
            phone: '+225 07 00 00 00 00',
            assignedCompanies: [1, 2, 3, 4], // CRITIQUE - Entreprises assignées
            companyIds: [1, 2, 3, 4],
            companies: [1, 2, 3, 4], // Maintenir la compatibilité
            status: 'Actif',
            password: 'admin123',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastLogin: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Marie Kouassi',
            email: 'marie.kouassi@cabinet.com',
            role: 'Collaborateur Senior',
            profile: 'collaborateur_senior',
            phone: '+225 07 11 11 11 11',
            assignedCompanies: [1, 2, 3], // CRITIQUE - Entreprises assignées
            companyIds: [1, 2, 3],
            companies: [1, 2, 3], // Maintenir la compatibilité
            status: 'Actif',
            password: 'marie123',
            createdAt: '2024-01-15T00:00:00.000Z',
            lastLogin: '2024-12-15T08:30:00.000Z'
        },
        {
            id: 3,
            name: 'Jean Diabaté',
            email: 'jean.diabate@cabinet.com',
            role: 'Collaborateur',
            profile: 'collaborateur',
            phone: '+225 07 22 22 22 22',
            assignedCompanies: [2, 4], // CRITIQUE - Entreprises assignées
            companyIds: [2, 4],
            companies: [2, 4], // Maintenir la compatibilité
            status: 'Actif',
            password: 'jean123',
            createdAt: '2024-02-01T00:00:00.000Z',
            lastLogin: '2024-12-14T14:20:00.000Z'
        },
        {
            id: 4,
            name: 'Amadou Traoré',
            email: 'atraore@sarltech.ci',
            role: 'Utilisateur',
            profile: 'user',
            phone: '+225 07 33 33 33 33',
            companyId: 1, // CRITIQUE - Entreprise unique pour utilisateur
            assignedCompanies: [1], // CRITIQUE - Pour compatibilité
            companyIds: [1],
            companies: [1], // Maintenir la compatibilité
            status: 'Actif',
            password: 'amadou123',
            createdAt: '2024-03-01T00:00:00.000Z',
            lastLogin: '2024-12-13T16:45:00.000Z'
        },
        {
            id: 5,
            name: 'Ibrahim Koné',
            email: 'ikone@caisse.ci',
            role: 'Caissier',
            profile: 'caissier',
            phone: '+225 07 44 44 44 44',
            companyId: 2, // CRITIQUE - Entreprise de la caisse assignée
            assignedCompanies: [2], // CRITIQUE - Pour compatibilité
            companyIds: [2],
            companies: [2], // Maintenir la compatibilité
            status: 'Actif',
            password: 'ibrahim123',
            createdAt: '2024-04-01T00:00:00.000Z',
            lastLogin: '2024-12-15T09:15:00.000Z'
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
            userId: 2,
            createdAt: '2024-12-15T10:30:00.000Z'
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
            userId: 3,
            createdAt: '2024-12-14T15:45:00.000Z'
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
            userId: 5,
            createdAt: '2024-12-13T16:20:00.000Z'
        },
        {
            id: 4,
            date: '2024-12-12',
            journal: 'JB',
            piece: 'JB-2024-001-0089',
            libelle: 'Virement bancaire salaires',
            companyId: 2,
            lines: [
                { account: '641000', accountName: 'Rémunérations du personnel', libelle: 'Salaires décembre', debit: 2500000, credit: 0 },
                { account: '646000', accountName: 'Charges sociales', libelle: 'Cotisations sociales', debit: 750000, credit: 0 },
                { account: '512000', accountName: 'Banques', libelle: 'Virement salaires', debit: 0, credit: 3250000 }
            ],
            status: 'Validé',
            userId: 2,
            createdAt: '2024-12-12T11:15:00.000Z'
        }
    ];

    // Initialiser les caisses - AMÉLIORÉ ET COMPLÉTÉ
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
            dailyExpenses: 25000,
            createdAt: '2024-04-01T00:00:00.000Z',
            lastOperation: '2024-12-15T09:15:00.000Z'
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
            dailyExpenses: 50000,
            createdAt: '2024-04-15T00:00:00.000Z',
            lastOperation: '2024-12-14T17:30:00.000Z'
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
            dailyExpenses: 0,
            createdAt: '2024-05-01T00:00:00.000Z',
            lastOperation: null
        }
    ];

    // Initialiser le logo de l'entreprise
    app.companyLogo = null;

    // =============================================================================
    // INITIALISATION DU CACHE DES DONNÉES FILTRÉES - CRITIQUE
    // =============================================================================
    initializeFilteredDataCache();

    console.log('✅ Données initialisées avec succès');
    console.log(`📊 Statistiques: ${app.accounts.length} comptes, ${app.companies.length} entreprises, ${app.users.length} utilisateurs, ${app.entries.length} écritures, ${app.cashRegisters.length} caisses`);
}

// =============================================================================
// GÉNÉRATION DU PLAN COMPTABLE SPÉCIFIQUE PAR ENTREPRISE - CRITIQUE
// =============================================================================

function generateCompanyAccountingPlan(companyType) {
    // Plan comptable de base SYSCOHADA adapté selon le type d'entreprise
    let basePlan = [
        { code: '101000', name: 'Capital social', category: 'Capitaux propres', mandatory: true },
        { code: '106000', name: 'Réserves', category: 'Capitaux propres', mandatory: true },
        { code: '110000', name: 'Report à nouveau', category: 'Capitaux propres', mandatory: true },
        { code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres', mandatory: true },
        { code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', mandatory: true },
        { code: '411000', name: 'Clients', category: 'Clients', mandatory: true },
        { code: '512000', name: 'Banques', category: 'Comptes bancaires', mandatory: true },
        { code: '571000', name: 'Caisse', category: 'Caisse', mandatory: true },
        { code: '601000', name: 'Achats de marchandises', category: 'Achats', mandatory: true },
        { code: '701000', name: 'Ventes de marchandises', category: 'Ventes', mandatory: true },
        { code: '441000', name: 'État et collectivités', category: 'État', mandatory: true }
    ];

    // Comptes spécifiques selon le type d'entreprise
    switch (companyType) {
        case 'SARL':
        case 'EURL':
            basePlan.push(
                { code: '455000', name: 'Associés - Comptes courants', category: 'Associés', mandatory: false },
                { code: '108000', name: 'Compte de l\'exploitant', category: 'Capitaux propres', mandatory: false }
            );
            break;
        case 'SA':
        case 'SAS':
            basePlan.push(
                { code: '103000', name: 'Primes liées au capital', category: 'Capitaux propres', mandatory: false },
                { code: '457000', name: 'Actionnaires - Capital souscrit non appelé', category: 'Actionnaires', mandatory: false },
                { code: '465000', name: 'Administrateurs et commissaires', category: 'Dirigeants', mandatory: false }
            );
            break;
        case 'Auto-entreprise':
            basePlan = basePlan.filter(account => 
                !['106000', '455000', '103000'].includes(account.code)
            );
            basePlan.push(
                { code: '108000', name: 'Compte de l\'exploitant', category: 'Capitaux propres', mandatory: true }
            );
            break;
    }

    // Ajouter la date de création et l'ID unique pour chaque compte
    return basePlan.map((account, index) => ({
        ...account,
        id: `${companyType}_${account.code}_${Date.now()}_${index}`,
        createdAt: new Date().toISOString(),
        isActive: true,
        balance: 0
    }));
}

// =============================================================================
// GESTION DU CACHE DES DONNÉES FILTRÉES - CRITIQUE POUR LA PERFORMANCE
// =============================================================================

function initializeFilteredDataCache() {
    if (!app.filteredData) {
        app.filteredData = {
            entries: [],
            accounts: [],
            reports: [],
            cashRegisters: [],
            users: [],
            lastUpdate: null,
            companyId: null
        };
    }
}

function updateFilteredDataCache() {
    if (!app.currentCompanyId) {
        clearFilteredDataCache();
        return;
    }

    try {
        app.filteredData = {
            entries: getEntriesByCompanySecure(app.currentCompanyId),
            accounts: getCompanyAccountingPlanSecure(app.currentCompanyId),
            cashRegisters: getCashRegistersByCompanySecure(app.currentCompanyId),
            users: getUsersByCompanySecure(app.currentCompanyId),
            reports: getReportsByCompanySecure(app.currentCompanyId),
            lastUpdate: new Date().toISOString(),
            companyId: app.currentCompanyId
        };

        console.log(`🔄 Cache mis à jour pour entreprise ${app.currentCompanyId}:`, {
            entries: app.filteredData.entries.length,
            accounts: app.filteredData.accounts.length,
            cashRegisters: app.filteredData.cashRegisters.length,
            users: app.filteredData.users.length
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour cache:', error);
        clearFilteredDataCache();
    }
}

function clearFilteredDataCache() {
    app.filteredData = {
        entries: [],
        accounts: [],
        reports: [],
        cashRegisters: [],
        users: [],
        lastUpdate: null,
        companyId: null
    };
    console.log('🗑️ Cache des données filtrées vidé');
}

function isFilteredDataCacheValid() {
    if (!app.filteredData || !app.filteredData.lastUpdate) return false;
    if (app.filteredData.companyId !== app.currentCompanyId) return false;
    
    // Cache valide pendant 5 minutes
    const cacheAge = Date.now() - new Date(app.filteredData.lastUpdate).getTime();
    return cacheAge < 300000; // 5 minutes
}

// =============================================================================
// FONCTIONS DE FILTRAGE SÉCURISÉ PAR ENTREPRISE - CRITIQUES
// =============================================================================

// FONCTION CRITIQUE - Obtenir les écritures de l'entreprise sélectionnée UNIQUEMENT
function getEntriesByCompanySecure(companyId) {
    if (!companyId) {
        console.warn('⚠️ getEntriesByCompanySecure: Aucune entreprise spécifiée');
        return [];
    }

    // Vérifier l'autorisation d'accès à cette entreprise
    if (!hasAccessToCompany(companyId)) {
        console.error('❌ Accès refusé aux écritures de l\'entreprise:', companyId);
        return [];
    }

    return app.entries.filter(entry => entry.companyId === companyId);
}

// FONCTION CRITIQUE - Obtenir le plan comptable de l'entreprise sélectionnée UNIQUEMENT
function getCompanyAccountingPlanSecure(companyId) {
    if (!companyId) {
        console.warn('⚠️ getCompanyAccountingPlanSecure: Aucune entreprise spécifiée');
        return [];
    }

    // Vérifier l'autorisation d'accès à cette entreprise
    if (!hasAccessToCompany(companyId)) {
        console.error('❌ Accès refusé au plan comptable de l\'entreprise:', companyId);
        return [];
    }

    const company = app.companies.find(c => c.id === companyId);
    if (!company) {
        console.error('❌ Entreprise non trouvée:', companyId);
        return [];
    }

    return company.accountingPlan || [];
}

// FONCTION CRITIQUE - Obtenir les caisses de l'entreprise sélectionnée UNIQUEMENT
function getCashRegistersByCompanySecure(companyId) {
    if (!companyId) {
        console.warn('⚠️ getCashRegistersByCompanySecure: Aucune entreprise spécifiée');
        return [];
    }

    // Vérifier l'autorisation d'accès à cette entreprise
    if (!hasAccessToCompany(companyId)) {
        console.error('❌ Accès refusé aux caisses de l\'entreprise:', companyId);
        return [];
    }

    return app.cashRegisters.filter(cashRegister => cashRegister.companyId === companyId);
}

// FONCTION CRITIQUE - Obtenir les utilisateurs de l'entreprise sélectionnée UNIQUEMENT
function getUsersByCompanySecure(companyId) {
    if (!companyId) {
        console.warn('⚠️ getUsersByCompanySecure: Aucune entreprise spécifiée');
        return [];
    }

    // Vérifier l'autorisation d'accès à cette entreprise
    if (!hasAccessToCompany(companyId)) {
        console.error('❌ Accès refusé aux utilisateurs de l\'entreprise:', companyId);
        return [];
    }

    return app.users.filter(user => 
        (user.assignedCompanies && user.assignedCompanies.includes(companyId)) ||
        user.companyId === companyId ||
        (user.companyIds && user.companyIds.includes(companyId))
    );
}

// FONCTION CRITIQUE - Obtenir les rapports de l'entreprise sélectionnée UNIQUEMENT
function getReportsByCompanySecure(companyId) {
    if (!companyId) {
        console.warn('⚠️ getReportsByCompanySecure: Aucune entreprise spécifiée');
        return [];
    }

    // Vérifier l'autorisation d'accès à cette entreprise
    if (!hasAccessToCompany(companyId)) {
        console.error('❌ Accès refusé aux rapports de l\'entreprise:', companyId);
        return [];
    }

    return app.reports ? app.reports.filter(report => report.companyId === companyId) : [];
}

// FONCTION CRITIQUE - Vérifier l'accès à une entreprise
function hasAccessToCompany(companyId) {
    if (!app.currentUser || !app.currentProfile) {
        return false;
    }

    // Admin a accès à tout
    if (app.currentProfile === 'admin') {
        return true;
    }

    // Collaborateurs : vérifier les entreprises assignées
    if (app.currentProfile === 'collaborateur_senior' || app.currentProfile === 'collaborateur') {
        return app.currentUser.assignedCompanies && 
               app.currentUser.assignedCompanies.includes(companyId);
    }

    // Utilisateur simple : seulement son entreprise
    if (app.currentProfile === 'user') {
        return app.currentUser.companyId === companyId;
    }

    // Caissier : seulement l'entreprise de sa caisse
    if (app.currentProfile === 'caissier') {
        const cashRegister = app.cashRegisters.find(cr => cr.userId === app.currentUser.id);
        return cashRegister && cashRegister.companyId === companyId;
    }

    return false;
}

// =============================================================================
// FONCTIONS PUBLIQUES SÉCURISÉES EXPOSÉES GLOBALEMENT - CRITIQUES
// =============================================================================

// Ces fonctions utilisent automatiquement l'entreprise active et le cache
function getSecureFilteredEntries() {
    if (!app.currentCompanyId) {
        console.warn('⚠️ Aucune entreprise sélectionnée');
        return [];
    }

    // Utiliser le cache si disponible et valide
    if (isFilteredDataCacheValid()) {
        return app.filteredData.entries;
    }

    // Sinon, mettre à jour le cache et retourner les données
    updateFilteredDataCache();
    return app.filteredData.entries;
}

function getSecureCompanyAccountingPlan() {
    if (!app.currentCompanyId) {
        console.warn('⚠️ Aucune entreprise sélectionnée');
        return [];
    }

    // Utiliser le cache si disponible et valide
    if (isFilteredDataCacheValid()) {
        return app.filteredData.accounts;
    }

    // Sinon, mettre à jour le cache et retourner les données
    updateFilteredDataCache();
    return app.filteredData.accounts;
}

function getSecureFilteredCashRegisters() {
    if (!app.currentCompanyId) {
        console.warn('⚠️ Aucune entreprise sélectionnée');
        return [];
    }

    // Utiliser le cache si disponible et valide
    if (isFilteredDataCacheValid()) {
        return app.filteredData.cashRegisters;
    }

    // Sinon, mettre à jour le cache et retourner les données
    updateFilteredDataCache();
    return app.filteredData.cashRegisters;
}

function getSecureFilteredUsers() {
    if (!app.currentCompanyId) {
        console.warn('⚠️ Aucune entreprise sélectionnée');
        return [];
    }

    // Utiliser le cache si disponible et valide
    if (isFilteredDataCacheValid()) {
        return app.filteredData.users;
    }

    // Sinon, mettre à jour le cache et retourner les données
    updateFilteredDataCache();
    return app.filteredData.users;
}

// =============================================================================
// GESTION DE LA SYNCHRONISATION DES DONNÉES - PIWA
// =============================================================================

// Classe pour gérer la synchronisation des données
class DataSyncManager {
    constructor() {
        this.syncInProgress = false;
        this.lastSyncTimestamp = null;
        this.syncQueue = [];
        this.retryAttempts = 3;
    }

    // Ajouter des données à synchroniser à la queue
    queueDataForSync(dataType, operation, data, companyId) {
        if (!this.canSyncData()) {
            console.log('ℹ️ Synchronisation non autorisée pour ce profil');
            return;
        }

        const syncItem = {
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataType: dataType, // 'entries', 'accounts', 'companies', etc.
            operation: operation, // 'create', 'update', 'delete'
            data: data,
            companyId: companyId || app.currentCompanyId,
            timestamp: new Date().toISOString(),
            retries: 0,
            status: 'pending'
        };

        this.syncQueue.push(syncItem);
        console.log(`📤 Données ajoutées à la queue de sync: ${dataType} (${operation})`);

        // Déclencher la synchronisation automatique si en ligne
        if (navigator.onLine && !this.syncInProgress) {
            setTimeout(() => this.processSyncQueue(), 1000);
        }
    }

    // Vérifier si l'utilisateur peut synchroniser les données
    canSyncData() {
        return app.currentProfile === 'admin' || 
               app.currentProfile === 'collaborateur_senior';
    }

    // Traiter la queue de synchronisation
    async processSyncQueue() {
        if (this.syncInProgress || !this.canSyncData() || !navigator.onLine) {
            return;
        }

        if (this.syncQueue.length === 0) {
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Traitement de ${this.syncQueue.length} éléments dans la queue de sync`);

        try {
            const pendingItems = this.syncQueue.filter(item => item.status === 'pending');
            
            for (const item of pendingItems) {
                try {
                    await this.syncSingleItem(item);
                    item.status = 'completed';
                    item.completedAt = new Date().toISOString();
                } catch (error) {
                    console.error(`❌ Erreur sync item ${item.id}:`, error);
                    item.retries++;
                    
                    if (item.retries >= this.retryAttempts) {
                        item.status = 'failed';
                        item.error = error.message;
                    }
                }
            }

            // Nettoyer la queue des éléments terminés
            this.syncQueue = this.syncQueue.filter(item => 
                item.status === 'pending' && item.retries < this.retryAttempts
            );

            this.lastSyncTimestamp = new Date().toISOString();
            console.log('✅ Synchronisation des données terminée');

        } catch (error) {
            console.error('❌ Erreur lors du traitement de la queue de sync:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // Synchroniser un élément spécifique
    async syncSingleItem(item) {
        // Simulation de la synchronisation avec un serveur
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simuler une réponse du serveur
                if (Math.random() > 0.1) { // 90% de succès
                    resolve({
                        success: true,
                        item: item,
                        serverTimestamp: new Date().toISOString()
                    });
                } else {
                    reject(new Error('Erreur de synchronisation simulée'));
                }
            }, Math.random() * 1000 + 500); // 500ms - 1.5s
        });
    }

    // Forcer une synchronisation complète des données d'une entreprise
    async forceSyncCompanyData(companyId) {
        if (!this.canSyncData()) {
            throw new Error('Synchronisation non autorisée');
        }

        if (!companyId) {
            throw new Error('ID d\'entreprise requis');
        }

        console.log(`🔄 Synchronisation forcée pour entreprise ${companyId}`);

        try {
            // Synchroniser toutes les données de l'entreprise
            const entries = getEntriesByCompanySecure(companyId);
            const accounts = getCompanyAccountingPlanSecure(companyId);
            const cashRegisters = getCashRegistersByCompanySecure(companyId);

            // Ajouter tout à la queue de sync
            entries.forEach(entry => {
                this.queueDataForSync('entries', 'sync', entry, companyId);
            });

            accounts.forEach(account => {
                this.queueDataForSync('accounts', 'sync', account, companyId);
            });

            cashRegisters.forEach(cashRegister => {
                this.queueDataForSync('cashRegisters', 'sync', cashRegister, companyId);
            });

            // Traiter la queue
            await this.processSyncQueue();

            console.log(`✅ Synchronisation forcée terminée pour entreprise ${companyId}`);
            return true;

        } catch (error) {
            console.error('❌ Erreur synchronisation forcée:', error);
            throw error;
        }
    }

    // Obtenir le statut de la synchronisation
    getSyncStatus() {
        return {
            inProgress: this.syncInProgress,
            queueLength: this.syncQueue.length,
            lastSync: this.lastSyncTimestamp,
            canSync: this.canSyncData(),
            pendingItems: this.syncQueue.filter(item => item.status === 'pending').length,
            failedItems: this.syncQueue.filter(item => item.status === 'failed').length
        };
    }

    // Nettoyer la queue de synchronisation
    clearSyncQueue() {
        this.syncQueue = [];
        console.log('🗑️ Queue de synchronisation vidée');
    }
}

// Instance globale du gestionnaire de synchronisation
const dataSyncManager = new DataSyncManager();

// =============================================================================
// SYSCOHADA RÉVISÉ JOURNALS MANAGEMENT - FONCTION ORIGINALE COMPLÈTE
// =============================================================================

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

// =============================================================================
// DATA MANAGEMENT (ADMIN ONLY) - IMPLÉMENTATION COMPLÈTE
// =============================================================================

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

    <button onclick="syncAllCompaniesData()" class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-sync mr-3"></i>Synchroniser toutes les données
    <div class="text-xs mt-1 opacity-80">Synchronisation PIWA complète</div>
    </button>

    <button onclick="resetDatabase()" class="w-full bg-danger hover:bg-danger/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">
    <i class="fas fa-exclamation-triangle mr-3"></i>Réinitialiser la base
    <div class="text-xs mt-1 opacity-80">Supprime TOUT - Attention!</div>
    </button>
    </div>

    <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div class="text-sm text-gray-600 dark:text-gray-400">
    <div class="flex justify-between">
    <span>Comptes:</span><span class="font-medium">${app.accounts.length}</span>
    </div>
    <div class="flex justify-between">
    <span>Entreprises:</span><span class="font-medium">${app.companies.length}</span>
    </div>
    <div class="flex justify-between">
    <span>Utilisateurs:</span><span class="font-medium">${app.users.length}</span>
    </div>
    <div class="flex justify-between">
    <span>Écritures:</span><span class="font-medium">${app.entries.length}</span>
    </div>
    <div class="flex justify-between">
    <span>Caisses:</span><span class="font-medium">${app.cashRegisters.length}</span>
    </div>
    </div>
    </div>

    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
    <div class="text-sm text-blue-600 dark:text-blue-400">
    <div class="flex justify-between">
    <span>Sync Queue:</span><span class="font-medium">${dataSyncManager.getSyncStatus().queueLength}</span>
    </div>
    <div class="flex justify-between">
    <span>Dernière sync:</span><span class="font-medium">${dataSyncManager.getSyncStatus().lastSync ? new Date(dataSyncManager.getSyncStatus().lastSync).toLocaleTimeString('fr-FR') : 'Jamais'}</span>
    </div>
    </div>
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

// Nouvelle fonction pour synchroniser toutes les données des entreprises
async function syncAllCompaniesData() {
    if (!dataSyncManager.canSyncData()) {
        alert('❌ Synchronisation non autorisée pour ce profil');
        return;
    }

    if (confirm('Synchroniser toutes les données de toutes les entreprises ?\n\nCela peut prendre plusieurs minutes selon la quantité de données.')) {
        try {
            let totalSynced = 0;
            
            for (const company of app.companies) {
                console.log(`🔄 Synchronisation de ${company.name}...`);
                await dataSyncManager.forceSyncCompanyData(company.id);
                totalSynced++;
            }

            alert(`✅ Synchronisation terminée pour ${totalSynced} entreprise(s)`);
            closeModal();
            
        } catch (error) {
            alert(`❌ Erreur lors de la synchronisation: ${error.message}`);
            console.error('❌ Erreur sync globale:', error);
        }
    }
}

function clearTestData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?\n\nCela supprimera:\n- Toutes les écritures\n- Toutes les caisses\n- Tous les utilisateurs (sauf admin)\n- Toutes les entreprises\n\nSeuls les comptes du plan comptable seront conservés.')) {
        // Conserver seulement l'admin et les comptes
        const adminUser = app.users.find(u => u.profile === 'admin');
        
        app.entries = [];
        app.cashRegisters = [];
        app.companies = [];
        app.users = adminUser ? [adminUser] : [];
        
        // Vider le cache des données filtrées
        clearFilteredDataCache();
        
        // Vider la queue de synchronisation
        dataSyncManager.clearSyncQueue();
        
        showDataSuccessMessage('✅ Données de test supprimées avec succès !');
        
        // Fermer le modal et recharger si on est sur une page impactée
        closeModal();
        
        console.log('✅ Données de test supprimées');
    }
}

function exportAllData() {
    try {
        const syncStatus = dataSyncManager.getSyncStatus();
        
        const exportData = {
            version: '2.1',
            exportDate: new Date().toISOString(),
            exportedBy: app.currentUser.id,
            exportedByName: app.currentUser.name,
            syncStatus: syncStatus,
            data: {
                accounts: app.accounts,
                companies: app.companies,
                users: app.users.map(user => ({
                    ...user,
                    password: undefined // Ne pas exporter les mots de passe
                })),
                entries: app.entries,
                cashRegisters: app.cashRegisters,
                companyLogo: app.companyLogo
            },
            statistics: {
                totalAccounts: app.accounts.length,
                totalCompanies: app.companies.length,
                totalUsers: app.users.length,
                totalEntries: app.entries.length,
                totalCashRegisters: app.cashRegisters.length
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `doukecompta-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        showDataSuccessMessage('✅ Export terminé avec succès !');
        console.log('✅ Export des données effectué:', exportData.statistics);
        
    } catch (error) {
        alert('❌ Erreur lors de l\'export des données: ' + error.message);
        console.error('❌ Erreur export:', error);
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validation de la structure
                if (!importedData.data || !importedData.version) {
                    throw new Error('Format de fichier invalide ou version non supportée');
                }

                const data = importedData.data;
                if (!data.accounts || !data.companies || !data.users || !data.entries) {
                    throw new Error('Données incomplètes dans le fichier');
                }

                if (confirm(`Êtes-vous sûr de vouloir importer ces données ?\n\nFichier: ${file.name}\nVersion: ${importedData.version}\nDate export: ${new Date(importedData.exportDate).toLocaleDateString('fr-FR')}\n\nCela remplacera TOUTES les données actuelles:\n- ${data.accounts.length} comptes\n- ${data.companies.length} entreprises\n- ${data.users.length} utilisateurs\n- ${data.entries.length} écritures\n- ${data.cashRegisters.length} caisses`)) {
                    
                    // Restaurer les mots de passe par défaut pour les utilisateurs
                    const usersWithPasswords = data.users.map(user => ({
                        ...user,
                        password: user.password || 'motdepasse123' // Mot de passe par défaut
                    }));

                    // Remplacer toutes les données
                    app.accounts = data.accounts;
                    app.companies = data.companies;
                    app.users = usersWithPasswords;
                    app.entries = data.entries;
                    app.cashRegisters = data.cashRegisters;
                    app.companyLogo = data.companyLogo;
                    
                    // Réinitialiser le cache et la synchronisation
                    clearFilteredDataCache();
                    dataSyncManager.clearSyncQueue();
                    
                    showDataSuccessMessage('✅ Import terminé avec succès !');
                    
                    // Fermer le modal et recharger l'interface
                    closeModal();
                    
                    console.log('✅ Import des données effectué:', importedData.statistics || 'Statistiques non disponibles');
                }
            } catch (error) {
                alert('❌ Erreur lors de l\'import: ' + error.message);
                console.error('❌ Erreur import:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function generateTestData() {
    if (confirm('Générer des données de test supplémentaires ?\n\nCela ajoutera:\n- 5 nouvelles entreprises\n- 10 nouveaux utilisateurs\n- 50 nouvelles écritures\n- 8 nouvelles caisses')) {
        
        try {
            // Nouvelles entreprises avec plans comptables
            const newCompanies = [
                {
                    id: app.companies.length + 1,
                    name: 'SARL EXEMPLE TRADING',
                    type: 'SARL',
                    status: 'Actif',
                    system: 'Système normal',
                    phone: '+225 07 55 55 55 55',
                    email: 'contact@exempletrading.ci',
                    address: 'Yamoussoukro - Quartier Résidentiel',
                    createdAt: new Date().toISOString(),
                    createdBy: app.currentUser.id,
                    accountingPlan: generateCompanyAccountingPlan('SARL')
                },
                {
                    id: app.companies.length + 2,
                    name: 'AUTO-ENTREPRISE WEB DESIGN',
                    type: 'Auto-entreprise',
                    status: 'Période d\'essai',
                    system: 'Micro-entreprise',
                    phone: '+225 01 66 66 66 66',
                    email: 'hello@webdesign.ci',
                    address: 'Korhogo - Centre-ville',
                    createdAt: new Date().toISOString(),
                    createdBy: app.currentUser.id,
                    accountingPlan: generateCompanyAccountingPlan('Auto-entreprise')
                }
            ];

            // Nouveaux utilisateurs avec entreprises assignées
            const newUsers = [
                {
                    id: app.users.length + 1,
                    name: 'Fatou Camara',
                    email: 'fatou.camara@test.com',
                    role: 'Collaborateur',
                    profile: 'collaborateur',
                    phone: '+225 07 77 77 77 77',
                    assignedCompanies: [newCompanies[0].id],
                    companyIds: [newCompanies[0].id],
                    companies: [newCompanies[0].id],
                    status: 'Actif',
                    password: 'fatou123',
                    createdAt: new Date().toISOString()
                },
                {
                    id: app.users.length + 2,
                    name: 'Moussa Sanogo',
                    email: 'moussa.sanogo@test.com',
                    role: 'Caissier',
                    profile: 'caissier',
                    phone: '+225 05 88 88 88 88',
                    companyId: newCompanies[1].id,
                    assignedCompanies: [newCompanies[1].id],
                    companyIds: [newCompanies[1].id],
                    companies: [newCompanies[1].id],
                    status: 'Actif',
                    password: 'moussa123',
                    createdAt: new Date().toISOString()
                }
            ];

            // Nouvelles écritures
            const newEntries = [
                {
                    id: app.entries.length + 1,
                    date: new Date().toISOString().split('T')[0],
                    journal: 'JV',
                    piece: generateJournalNumber('JV', newCompanies[0].id),
                    libelle: 'Vente de services - Test',
                    companyId: newCompanies[0].id,
                    lines: [
                        { account: '411000', accountName: 'Clients', libelle: 'Client Test', debit: 500000, credit: 0 },
                        { account: '706000', accountName: 'Services vendus', libelle: 'Prestation services', debit: 0, credit: 416667 },
                        { account: '441000', accountName: 'État et collectivités', libelle: 'TVA collectée', debit: 0, credit: 83333 }
                    ],
                    status: 'En attente',
                    userId: newUsers[0].id,
                    createdAt: new Date().toISOString()
                }
            ];

            // Nouvelles caisses
            const newCashRegisters = [
                {
                    id: app.cashRegisters.length + 1,
                    name: 'Caisse Test 1',
                    companyId: newCompanies[0].id,
                    responsibleId: newUsers[1].id,
                    responsibleName: newUsers[1].name,
                    balance: 50000,
                    status: 'Ouvert',
                    openingBalance: 50000,
                    dailyReceipts: 0,
                    dailyExpenses: 0,
                    createdAt: new Date().toISOString()
                }
            ];

            // Ajouter toutes les nouvelles données
            app.companies.push(...newCompanies);
            app.users.push(...newUsers);
            app.entries.push(...newEntries);
            app.cashRegisters.push(...newCashRegisters);

            // Vider le cache pour forcer la mise à jour
            clearFilteredDataCache();

            showDataSuccessMessage('✅ Données de test générées avec succès !');
            closeModal();
            
            console.log('✅ Données de test générées');
            
        } catch (error) {
            alert('❌ Erreur lors de la génération des données de test: ' + error.message);
            console.error('❌ Erreur génération:', error);
        }
    }
}

function resetDatabase() {
    if (confirm('⚠️ ATTENTION - RÉINITIALISATION COMPLÈTE ⚠️\n\nCette action va SUPPRIMER DÉFINITIVEMENT:\n\n✗ Toutes les entreprises\n✗ Tous les utilisateurs (sauf admin)\n✗ Toutes les écritures comptables\n✗ Toutes les caisses\n✗ Le logo de l\'entreprise\n\n✓ Seuls les comptes du plan comptable seront conservés\n\nCette action est IRRÉVERSIBLE !\n\nConfirmer la réinitialisation complète ?')) {
        
        if (confirm('DERNIÈRE CONFIRMATION\n\nToutes les données seront perdues définitivement.\n\nTaper "RESET" pour confirmer:') && 
            prompt('Tapez "RESET" en majuscules pour confirmer:') === 'RESET') {
            
            try {
                // Sauvegarder l'admin actuel
                const adminUser = app.users.find(u => u.profile === 'admin');
                
                // Réinitialiser toutes les données
                app.companies = [];
                app.users = adminUser ? [adminUser] : [];
                app.entries = [];
                app.cashRegisters = [];
                app.companyLogo = null;
                
                // Réinitialiser les IDs
                if (adminUser) {
                    adminUser.id = 1;
                    adminUser.lastLogin = new Date().toISOString();
                }

                // Vider le cache et la synchronisation
                clearFilteredDataCache();
                dataSyncManager.clearSyncQueue();

                showDataSuccessMessage('✅ Base de données réinitialisée avec succès !');
                closeModal();
                
                // Rediriger vers le dashboard après reset
                setTimeout(() => {
                    if (typeof loadDashboard === 'function') {
                        loadDashboard();
                    }
                }, 1000);
                
                console.log('✅ Base de données réinitialisée');
                
            } catch (error) {
                alert('❌ Erreur lors de la réinitialisation: ' + error.message);
                console.error('❌ Erreur reset:', error);
            }
        } else {
            alert('❌ Réinitialisation annulée.');
        }
    }
}

// =============================================================================
// FONCTIONS UTILITAIRES DATA MANAGEMENT
// =============================================================================

function showDataSuccessMessage(message) {
    // Utiliser la fonction de notification du settings.js si disponible
    if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(message);
    } else {
        // Fallback
        alert(message);
    }
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
}

function closeModalOnBackground(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

// =============================================================================
// FONCTIONS DE RECHERCHE ET FILTRAGE - ÉTENDUES AVEC SÉCURITÉ
// =============================================================================

function searchAccounts(query) {
    if (!query) return app.accounts;
    
    const searchTerm = query.toLowerCase();
    return app.accounts.filter(account => 
        account.code.toLowerCase().includes(searchTerm) ||
        account.name.toLowerCase().includes(searchTerm) ||
        account.category.toLowerCase().includes(searchTerm)
    );
}

// FONCTION SÉCURISÉE - Rechercher dans les comptes de l'entreprise active
function searchCompanyAccounts(query) {
    const companyAccounts = getSecureCompanyAccountingPlan();
    
    if (!query) return companyAccounts;
    
    const searchTerm = query.toLowerCase();
    return companyAccounts.filter(account => 
        account.code.toLowerCase().includes(searchTerm) ||
        account.name.toLowerCase().includes(searchTerm) ||
        account.category.toLowerCase().includes(searchTerm)
    );
}

function getAccountByCode(code) {
    return app.accounts.find(account => account.code === code);
}

// FONCTION SÉCURISÉE - Obtenir un compte de l'entreprise active
function getCompanyAccountByCode(code) {
    const companyAccounts = getSecureCompanyAccountingPlan();
    return companyAccounts.find(account => account.code === code);
}

function getAccountsByCategory(category) {
    return app.accounts.filter(account => account.category === category);
}

// FONCTION SÉCURISÉE - Obtenir les comptes par catégorie de l'entreprise active
function getCompanyAccountsByCategory(category) {
    const companyAccounts = getSecureCompanyAccountingPlan();
    return companyAccounts.filter(account => account.category === category);
}

function getUsersByCompany(companyId) {
    return app.users.filter(user => 
        user.companyIds && user.companyIds.includes(companyId)
    );
}

function getEntriesByCompany(companyId) {
    return app.entries.filter(entry => entry.companyId === companyId);
}

function getEntriesByUser(userId) {
    return app.entries.filter(entry => entry.userId === userId);
}

// FONCTION SÉCURISÉE - Obtenir les écritures de l'utilisateur pour l'entreprise active
function getSecureEntriesByUser(userId) {
    const companyEntries = getSecureFilteredEntries();
    return companyEntries.filter(entry => entry.userId === userId);
}

function getCashRegistersByCompany(companyId) {
    return app.cashRegisters.filter(cashRegister => cashRegister.companyId === companyId);
}

// =============================================================================
// FONCTIONS DE VALIDATION - ÉTENDUES AVEC CONTRÔLES DE SÉCURITÉ
// =============================================================================

function validateEntry(entry) {
    const errors = [];
    
    if (!entry.date) errors.push('Date manquante');
    if (!entry.journal) errors.push('Journal manquant');
    if (!entry.libelle) errors.push('Libellé manquant');
    if (!entry.companyId) errors.push('Entreprise manquante');
    if (!entry.lines || entry.lines.length === 0) errors.push('Aucune ligne comptable');
    
    // CONTRÔLE DE SÉCURITÉ - Vérifier l'accès à l'entreprise
    if (entry.companyId && !hasAccessToCompany(entry.companyId)) {
        errors.push('Accès non autorisé à cette entreprise');
    }
    
    if (entry.lines && entry.lines.length > 0) {
        const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            errors.push('Déséquilibre débit/crédit');
        }

        // Valider que les comptes existent dans le plan comptable de l'entreprise
        const companyAccounts = getCompanyAccountingPlanSecure(entry.companyId);
        entry.lines.forEach((line, index) => {
            const accountExists = companyAccounts.some(account => account.code === line.account);
            if (!accountExists) {
                errors.push(`Ligne ${index + 1}: Compte ${line.account} non trouvé dans le plan comptable`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function validateUser(user) {
    const errors = [];
    
    if (!user.name || user.name.trim().length < 2) errors.push('Nom invalide');
    if (!user.email || !isValidEmail(user.email)) errors.push('Email invalide');
    if (!user.role) errors.push('Rôle manquant');
    
    // Vérifier l'unicité de l'email
    const existingUser = app.users.find(u => u.email === user.email && u.id !== user.id);
    if (existingUser) errors.push('Email déjà utilisé');
    
    // CONTRÔLE DE SÉCURITÉ - Vérifier les entreprises assignées
    if (user.assignedCompanies && user.assignedCompanies.length > 0) {
        user.assignedCompanies.forEach(companyId => {
            const companyExists = app.companies.some(c => c.id === companyId);
            if (!companyExists) {
                errors.push(`Entreprise ${companyId} n'existe pas`);
            }
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function validateCompany(company) {
    const errors = [];
    
    if (!company.name || company.name.trim().length < 2) errors.push('Nom invalide');
    if (!company.type) errors.push('Type d\'entreprise manquant');
    
    // Vérifier l'unicité du nom
    const existingCompany = app.companies.find(c => 
        c.name.toLowerCase() === company.name.toLowerCase() && c.id !== company.id
    );
    if (existingCompany) errors.push('Nom d\'entreprise déjà utilisé');
    
    // Valider le plan comptable si fourni
    if (company.accountingPlan && company.accountingPlan.length > 0) {
        const codes = company.accountingPlan.map(account => account.code);
        const uniqueCodes = [...new Set(codes)];
        if (codes.length !== uniqueCodes.length) {
            errors.push('Codes de comptes dupliqués dans le plan comptable');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// =============================================================================
// FONCTIONS STATISTIQUES - ÉTENDUES AVEC DONNÉES FILTRÉES
// =============================================================================

function getAppStatistics() {
    return {
        accounts: {
            total: app.accounts.length,
            byCategory: app.accounts.reduce((acc, account) => {
                acc[account.category] = (acc[account.category] || 0) + 1;
                return acc;
            }, {})
        },
        companies: {
            total: app.companies.length,
            active: app.companies.filter(c => c.status === 'Actif').length,
            trial: app.companies.filter(c => c.status === 'Période d\'essai').length,
            suspended: app.companies.filter(c => c.status === 'Suspendu').length
        },
        users: {
            total: app.users.length,
            active: app.users.filter(u => u.status === 'Actif').length,
            byRole: app.users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {})
        },
        entries: {
            total: app.entries.length,
            validated: app.entries.filter(e => e.status === 'Validé').length,
            pending: app.entries.filter(e => e.status === 'En attente').length,
            byJournal: app.entries.reduce((acc, entry) => {
                acc[entry.journal] = (acc[entry.journal] || 0) + 1;
                return acc;
            }, {})
        },
        cashRegisters: {
            total: app.cashRegisters.length,
            open: app.cashRegisters.filter(c => c.status === 'Ouvert').length,
            closed: app.cashRegisters.filter(c => c.status === 'Fermé').length,
            totalBalance: app.cashRegisters.reduce((sum, cash) => sum + (cash.balance || 0), 0)
        },
        sync: dataSyncManager.getSyncStatus()
    };
}

// FONCTION NOUVELLE - Statistiques de l'entreprise active uniquement
function getCompanyStatistics() {
    if (!app.currentCompanyId) {
        return null;
    }

    const companyEntries = getSecureFilteredEntries();
    const companyAccounts = getSecureCompanyAccountingPlan();
    const companyCashRegisters = getSecureFilteredCashRegisters();
    const companyUsers = getSecureFilteredUsers();

    return {
        companyId: app.currentCompanyId,
        companyName: app.companies.find(c => c.id === app.currentCompanyId)?.name || 'Inconnue',
        entries: {
            total: companyEntries.length,
            validated: companyEntries.filter(e => e.status === 'Validé').length,
            pending: companyEntries.filter(e => e.status === 'En attente').length,
            thisMonth: companyEntries.filter(e => {
                const entryDate = new Date(e.date);
                const now = new Date();
                return entryDate.getMonth() === now.getMonth() && 
                       entryDate.getFullYear() === now.getFullYear();
            }).length,
            byJournal: companyEntries.reduce((acc, entry) => {
                acc[entry.journal] = (acc[entry.journal] || 0) + 1;
                return acc;
            }, {})
        },
        accounts: {
            total: companyAccounts.length,
            active: companyAccounts.filter(a => a.isActive !== false).length,
            byCategory: companyAccounts.reduce((acc, account) => {
                acc[account.category] = (acc[account.category] || 0) + 1;
                return acc;
            }, {})
        },
        cashRegisters: {
            total: companyCashRegisters.length,
            open: companyCashRegisters.filter(c => c.status === 'Ouvert').length,
            totalBalance: companyCashRegisters.reduce((sum, cash) => sum + (cash.balance || 0), 0)
        },
        users: {
            total: companyUsers.length,
            active: companyUsers.filter(u => u.status === 'Actif').length,
            byRole: companyUsers.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {})
        },
        lastUpdate: new Date().toISOString()
    };
}

// =============================================================================
// FONCTIONS DE MAINTENANCE ET NETTOYAGE
// =============================================================================

function cleanupData() {
    console.log('🧹 Nettoyage des données...');
    
    try {
        // Nettoyer les références cassées
        let cleaned = 0;
        
        // Supprimer les écritures d'entreprises inexistantes
        const initialEntriesCount = app.entries.length;
        app.entries = app.entries.filter(entry => {
            const companyExists = app.companies.some(c => c.id === entry.companyId);
            if (!companyExists) {
                console.warn(`⚠️ Écriture ${entry.id} supprimée (entreprise ${entry.companyId} inexistante)`);
                cleaned++;
            }
            return companyExists;
        });
        
        // Supprimer les caisses d'entreprises inexistantes
        const initialCashCount = app.cashRegisters.length;
        app.cashRegisters = app.cashRegisters.filter(cash => {
            const companyExists = app.companies.some(c => c.id === cash.companyId);
            if (!companyExists) {
                console.warn(`⚠️ Caisse ${cash.id} supprimée (entreprise ${cash.companyId} inexistante)`);
                cleaned++;
            }
            return companyExists;
        });
        
        // Nettoyer les assignations d'entreprises des utilisateurs
        app.users.forEach(user => {
            if (user.assignedCompanies) {
                const validCompanies = user.assignedCompanies.filter(companyId => {
                    const exists = app.companies.some(c => c.id === companyId);
                    if (!exists) {
                        console.warn(`⚠️ Entreprise ${companyId} supprimée des assignations de ${user.name}`);
                        cleaned++;
                    }
                    return exists;
                });
                user.assignedCompanies = validCompanies;
            }
        });

        // Vider le cache pour forcer la mise à jour
        clearFilteredDataCache();
        
        console.log(`✅ Nettoyage terminé: ${cleaned} éléments supprimés`);
        return cleaned;
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        return 0;
    }
}

// =============================================================================
// EXPOSER LES FONCTIONS CRITIQUES GLOBALEMENT
// =============================================================================

// Exposer les fonctions de filtrage sécurisé
window.getSecureFilteredEntries = getSecureFilteredEntries;
window.getSecureCompanyAccountingPlan = getSecureCompanyAccountingPlan;
window.getSecureFilteredCashRegisters = getSecureFilteredCashRegisters;
window.getSecureFilteredUsers = getSecureFilteredUsers;

// Exposer les fonctions de validation sécurisée
window.hasAccessToCompany = hasAccessToCompany;
window.validateEntry = validateEntry;
window.validateUser = validateUser;
window.validateCompany = validateCompany;

// Exposer les fonctions de cache
window.updateFilteredDataCache = updateFilteredDataCache;
window.clearFilteredDataCache = clearFilteredDataCache;

// Exposer les fonctions de statistiques
window.getCompanyStatistics = getCompanyStatistics;

// Exposer les fonctions de synchronisation
window.dataSyncManager = dataSyncManager;
window.syncAllCompaniesData = syncAllCompaniesData;

// Exposer les fonctions de recherche sécurisée
window.searchCompanyAccounts = searchCompanyAccounts;
window.getCompanyAccountByCode = getCompanyAccountByCode;
window.getCompanyAccountsByCategory = getCompanyAccountsByCategory;
window.getSecureEntriesByUser = getSecureEntriesByUser;

// Exposer les fonctions de nettoyage
window.cleanupData = cleanupData;

console.log('✅ Module data.js chargé avec succès avec sécurité renforcée');
console.log('🔒 Fonctions de filtrage sécurisé par entreprise: DISPONIBLES');
console.log('🔄 Gestionnaire de synchronisation PIWA: INITIALISÉ');
console.log('💾 Système de cache des données filtrées: ACTIF');
