// =============================================================================
// DOUKÈ Compta Pro - Données d'exemple v3.1
// =============================================================================

// Génération de données d'exemple pour l'application
const SAMPLE_DATA = {
    // Entreprises d'exemple
    companies: [
        {
            id: 1,
            name: "DOUKÈ SARL",
            type: "SARL",
            sector: "Informatique",
            rccm: "CI-ABJ-2023-B-12345",
            nif: "0123456789A",
            address: "Cocody, Angré 8ème Tranche, Abidjan",
            phone: "+225 27 22 48 50 60",
            email: "contact@douke.ci",
            status: "Actif",
            cashRegisters: 2,
            createdAt: "2023-01-15T08:00:00.000Z"
        },
        {
            id: 2,
            name: "COMMERCE PLUS CI",
            type: "SA",
            sector: "Commerce",
            rccm: "CI-ABJ-2022-B-67890",
            nif: "9876543210B",
            address: "Treichville, Boulevard de la République, Abidjan",
            phone: "+225 27 21 24 68 90",
            email: "info@commerceplus.ci",
            status: "Actif",
            cashRegisters: 5,
            createdAt: "2022-03-20T09:30:00.000Z"
        },
        {
            id: 3,
            name: "SERVICES DIGITAUX AFRIQUE",
            type: "SAS",
            sector: "Digital",
            rccm: "CI-ABJ-2023-B-11111",
            nif: "1111111111C",
            address: "Plateau, Avenue Chardy, Abidjan",
            phone: "+225 27 20 31 45 67",
            email: "contact@sda.ci",
            status: "Période d'essai",
            cashRegisters: 1,
            createdAt: "2023-06-10T14:15:00.000Z"
        }
    ],

    // Utilisateurs d'exemple
    users: [
        {
            id: 1,
            name: "Administrateur Principal",
            email: "admin@douke.ci",
            passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // "password"
            profile: "admin",
            role: "Administrateur Système",
            status: "Actif",
            phone: "+225 07 08 09 10 11",
            assignedCompanies: [1, 2, 3],
            companies: [1, 2, 3],
            permissions: ["read", "write", "delete", "admin", "validate", "export"],
            lastLogin: new Date().toISOString(),
            createdAt: "2023-01-01T00:00:00.000Z"
        },
        {
            id: 2,
            name: "Marie KOUAME",
            email: "marie.kouame@douke.ci",
            passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            profile: "collaborateur_senior",
            role: "Responsable Comptable",
            status: "Actif",
            phone: "+225 05 06 07 08 09",
            assignedCompanies: [1, 2],
            companies: [1, 2],
            permissions: ["read", "write", "validate", "export"],
            lastLogin: "2024-01-15T08:30:00.000Z",
            createdAt: "2023-02-15T10:00:00.000Z"
        },
        {
            id: 3,
            name: "Jean-Baptiste TRAORE",
            email: "jb.traore@douke.ci",
            passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            profile: "collaborateur",
            role: "Assistant Comptable",
            status: "Actif",
            phone: "+225 01 02 03 04 05",
            assignedCompanies: [1],
            companies: [1],
            permissions: ["read", "write"],
            lastLogin: "2024-01-14T16:45:00.000Z",
            createdAt: "2023-03-01T09:15:00.000Z"
        },
        {
            id: 4,
            name: "Aminata SANGARE",
            email: "aminata.sangare@commerceplus.ci",
            passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            profile: "user",
            role: "Gestionnaire",
            status: "Actif",
            phone: "+225 02 03 04 05 06",
            companyId: 2,
            assignedCompanies: [2],
            companies: [2],
            permissions: ["read", "write"],
            lastLogin: "2024-01-14T14:20:00.000Z",
            createdAt: "2023-05-10T11:30:00.000Z"
        },
        {
            id: 5,
            name: "Koffi ASSI",
            email: "koffi.assi@commerceplus.ci",
            passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            profile: "caissier",
            role: "Caissier Principal",
            status: "Actif",
            phone: "+225 03 04 05 06 07",
            companyId: 2,
            assignedCompanies: [2],
            companies: [2],
            permissions: ["read"],
            lastLogin: "2024-01-15T07:00:00.000Z",
            createdAt: "2023-07-20T08:45:00.000Z"
        }
    ],

    // Caisses d'exemple
    cashRegisters: [
        {
            id: 1,
            name: "Caisse Principale",
            companyId: 1,
            responsibleId: null,
            responsibleName: null,
            balance: 250000,
            status: "Ouvert",
            openingBalance: 200000,
            dailyReceipts: 75000,
            dailyExpenses: 25000,
            lastOperation: "2024-01-15T14:30:00.000Z",
            currency: "FCFA",
            maxLimit: 500000,
            description: "Caisse principale pour les opérations courantes",
            autoValidation: false,
            createdAt: "2023-01-15T08:00:00.000Z",
            createdBy: 1
        },
        {
            id: 2,
            name: "Caisse Ventes",
            companyId: 2,
            responsibleId: 5,
            responsibleName: "Koffi ASSI",
            balance: 180000,
            status: "Ouvert",
            openingBalance: 150000,
            dailyReceipts: 95000,
            dailyExpenses: 65000,
            lastOperation: "2024-01-15T16:45:00.000Z",
            currency: "FCFA",
            maxLimit: 300000,
            description: "Caisse dédiée aux ventes au comptant",
            autoValidation: true,
            createdAt: "2022-03-20T09:30:00.000Z",
            createdBy: 1
        },
        {
            id: 3,
            name: "Caisse Secondaire",
            companyId: 2,
            responsibleId: null,
            responsibleName: null,
            balance: 50000,
            status: "Fermé",
            openingBalance: 50000,
            dailyReceipts: 0,
            dailyExpenses: 0,
            lastOperation: "2024-01-12T18:00:00.000Z",
            currency: "FCFA",
            maxLimit: 200000,
            description: "Caisse de secours",
            autoValidation: false,
            createdAt: "2022-06-15T10:00:00.000Z",
            createdBy: 1
        }
    ],

    // Écritures d'exemple
    entries: [
        {
            id: 1,
            companyId: 1,
            date: "2024-01-15",
            journal: "JV",
            piece: "VT240001",
            libelle: "Vente de services informatiques - Client ABC",
            status: "Validé",
            lines: [
                { account: "411000", libelle: "Client ABC", debit: 118000, credit: 0 },
                { account: "701000", libelle: "Vente de services", debit: 0, credit: 100000 },
                { account: "443000", libelle: "TVA collectée 18%", debit: 0, credit: 18000 }
            ],
            createdBy: 2,
            validatedBy: 2,
            validatedAt: "2024-01-15T09:30:00.000Z",
            createdAt: "2024-01-15T09:00:00.000Z"
        },
        {
            id: 2,
            companyId: 1,
            date: "2024-01-15",
            journal: "JA",
            piece: "AC240001",
            libelle: "Achat équipements informatiques",
            status: "Validé",
            lines: [
                { account: "601000", libelle: "Achat équipements", debit: 500000, credit: 0 },
                { account: "445000", libelle: "TVA récupérable 18%", debit: 90000, credit: 0 },
                { account: "401000", libelle: "Fournisseur XYZ", debit: 0, credit: 590000 }
            ],
            createdBy: 3,
            validatedBy: 2,
            validatedAt: "2024-01-15T10:15:00.000Z",
            createdAt: "2024-01-15T09:45:00.000Z"
        },
        {
            id: 3,
            companyId: 1,
            date: "2024-01-15",
            journal: "JC",
            piece: "CA240001",
            libelle: "Encaissement client ABC",
            status: "Validé",
            lines: [
                { account: "531000", libelle: "Caisse principale", debit: 118000, credit: 0 },
                { account: "411000", libelle: "Client ABC", debit: 0, credit: 118000 }
            ],
            createdBy: 2,
            validatedBy: 2,
            validatedAt: "2024-01-15T14:30:00.000Z",
            createdAt: "2024-01-15T14:25:00.000Z"
        },
        {
            id: 4,
            companyId: 2,
            date: "2024-01-14",
            journal: "JV",
            piece: "VT240002",
            libelle: "Vente marchandises diverses",
            status: "En attente",
            lines: [
                { account: "411000", libelle: "Client DIVERS", debit: 59000, credit: 0 },
                { account: "701000", libelle: "Vente marchandises", debit: 0, credit: 50000 },
                { account: "443000", libelle: "TVA collectée 18%", debit: 0, credit: 9000 }
            ],
            createdBy: 4,
            validatedBy: null,
            validatedAt: null,
            createdAt: "2024-01-14T15:20:00.000Z"
        },
        {
            id: 5,
            companyId: 2,
            date: "2024-01-14",
            journal: "JC",
            piece: "CA240002",
            libelle: "Décaissement frais divers",
            status: "Validé",
            lines: [
                { account: "628000", libelle: "Frais divers", debit: 15000, credit: 0 },
                { account: "532000", libelle: "Caisse ventes", debit: 0, credit: 15000 }
            ],
            createdBy: 5,
            validatedBy: 4,
            validatedAt: "2024-01-14T16:00:00.000Z",
            createdAt: "2024-01-14T15:55:00.000Z"
        },
        {
            id: 6,
            companyId: 1,
            date: "2024-01-12",
            journal: "JB",
            piece: "BQ240001",
            libelle: "Virement bancaire fournisseur",
            status: "Validé",
            lines: [
                { account: "401000", libelle: "Fournisseur XYZ", debit: 590000, credit: 0 },
                { account: "521000", libelle: "Banque BCI", debit: 0, credit: 590000 }
            ],
            createdBy: 2,
            validatedBy: 2,
            validatedAt: "2024-01-12T11:30:00.000Z",
            createdAt: "2024-01-12T11:25:00.000Z"
        }
    ],

    // Génération automatique de comptes pour chaque entreprise
    accounts: SYSCOHADA_ACCOUNTS.map(account => ({
        ...account,
        companyId: null // Les comptes SYSCOHADA sont disponibles pour toutes les entreprises
    }))
};

// Fonction pour initialiser les données d'exemple
function initializeSampleData() {
    // Initialiser les données globales de l'application
    window.app = window.app || {};
    
    // Copier les données d'exemple
    window.app.companies = [...SAMPLE_DATA.companies];
    window.app.users = [...SAMPLE_DATA.users];
    window.app.cashRegisters = [...SAMPLE_DATA.cashRegisters];
    window.app.entries = [...SAMPLE_DATA.entries];
    window.app.accounts = [...SAMPLE_DATA.accounts];
    
    // Initialiser les états de l'application
    window.app.currentUser = null;
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.isAuthenticated = false;
    
    console.log('📦 Données d\'exemple initialisées:');
    console.log('  - Entreprises:', window.app.companies.length);
    console.log('  - Utilisateurs:', window.app.users.length);
    console.log('  - Caisses:', window.app.cashRegisters.length);
    console.log('  - Écritures:', window.app.entries.length);
    console.log('  - Comptes SYSCOHADA:', window.app.accounts.length);
    
    return true;
}

// Fonction pour réinitialiser les données
function resetToSampleData() {
    initializeSampleData();
    
    // Réinitialiser l'état de l'application
    window.app.currentUser = null;
    window.app.currentProfile = null;
    window.app.currentCompanyId = null;
    window.app.isAuthenticated = false;
    
    console.log('🔄 Données réinitialisées aux valeurs d\'exemple');
    return true;
}

// Fonction pour ajouter des données supplémentaires
function generateAdditionalSampleData() {
    // Ajouter plus d'écritures d'exemple
    const additionalEntries = [];
    const journals = ['JG', 'JA', 'JV', 'JB', 'JC', 'JOD'];
    const currentDate = new Date();
    
    for (let i = 0; i < 20; i++) {
        const entryDate = new Date(currentDate);
        entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 30));
        
        const journal = journals[Math.floor(Math.random() * journals.length)];
        const companyId = Math.random() > 0.5 ? 1 : 2;
        
        additionalEntries.push({
            id: window.app.entries.length + i + 1,
            companyId: companyId,
            date: entryDate.toISOString().split('T')[0],
            journal: journal,
            piece: `${journal}24${String(i + 10).padStart(4, '0')}`,
            libelle: `Écriture d'exemple ${i + 1} - ${journal}`,
            status: Math.random() > 0.8 ? 'En attente' : 'Validé',
            lines: [
                { 
                    account: "411000", 
                    libelle: `Opération ${i + 1} - Débit`, 
                    debit: Math.floor(Math.random() * 100000) + 10000, 
                    credit: 0 
                },
                { 
                    account: "701000", 
                    libelle: `Opération ${i + 1} - Crédit`, 
                    debit: 0, 
                    credit: Math.floor(Math.random() * 100000) + 10000 
                }
            ],
            createdBy: Math.floor(Math.random() * 3) + 2,
            validatedBy: Math.random() > 0.8 ? null : 2,
            validatedAt: Math.random() > 0.8 ? null : entryDate.toISOString(),
            createdAt: entryDate.toISOString()
        });
    }
    
    window.app.entries.push(...additionalEntries);
    console.log('📈 Données supplémentaires générées:', additionalEntries.length, 'écritures');
}

// Export des fonctions utilitaires
window.initializeSampleData = initializeSampleData;
window.resetToSampleData = resetToSampleData;
window.generateAdditionalSampleData = generateAdditionalSampleData;
window.SAMPLE_DATA = SAMPLE_DATA;

console.log('📦 Module de données d\'exemple chargé');
