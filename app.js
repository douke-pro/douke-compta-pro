// =============================================================================

// DOUKÈ Compta Pro - Application Principal (Version Complète Améliorée)

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

auditLog: [],

editingItems: {

user: null,

company: null,

entry: null,

account: null,

cash: null

}

};

this.idGenerator = {

company: () => `COMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

user: () => `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

entry: () => `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

cash: () => `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

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

// Plan comptable SYSCOHADA complet

this.state.accounts = [

// CLASSE 1 - COMPTES DE CAPITAUX

{ code: '101000', name: 'Capital social', category: 'Capitaux propres', class: 1 },

{ code: '106000', name: 'Réserves', category: 'Capitaux propres', class: 1 },

{ code: '110000', name: 'Report à nouveau', category: 'Capitaux propres', class: 1 },

{ code: '120000', name: 'Résultat de l\'exercice', category: 'Capitaux propres', class: 1 },

{ code: '131000', name: 'Subventions d\'investissement', category: 'Capitaux propres', class: 1 },

{ code: '141000', name: 'Provisions réglementées', category: 'Capitaux propres', class: 1 },

{ code: '151000', name: 'Provisions pour risques et charges', category: 'Provisions', class: 1 },

{ code: '161000', name: 'Emprunts obligataires', category: 'Dettes financières', class: 1 },

{ code: '162000', name: 'Emprunts et dettes auprès des établissements de crédit', category: 'Dettes financières', class: 1 },

{ code: '163000', name: 'Emprunts et dettes financières diverses', category: 'Dettes financières', class: 1 },

{ code: '171000', name: 'Dettes de crédit-bail et contrats assimilés', category: 'Dettes financières', class: 1 },

{ code: '181000', name: 'Comptes de liaison des établissements et succursales', category: 'Liaison', class: 1 },


// CLASSE 2 - COMPTES D'IMMOBILISATIONS

{ code: '201000', name: 'Frais d\'établissement', category: 'Immobilisations incorporelles', class: 2 },

{ code: '205000', name: 'Concessions et droits similaires', category: 'Immobilisations incorporelles', class: 2 },

{ code: '207000', name: 'Fonds commercial', category: 'Immobilisations incorporelles', class: 2 },

{ code: '208000', name: 'Autres immobilisations incorporelles', category: 'Immobilisations incorporelles', class: 2 },

{ code: '211000', name: 'Terrains', category: 'Immobilisations corporelles', class: 2 },

{ code: '212000', name: 'Agencements et aménagements de terrains', category: 'Immobilisations corporelles', class: 2 },

{ code: '213000', name: 'Constructions', category: 'Immobilisations corporelles', class: 2 },

{ code: '215000', name: 'Installations techniques', category: 'Immobilisations corporelles', class: 2 },

{ code: '218000', name: 'Matériel de transport', category: 'Immobilisations corporelles', class: 2 },

{ code: '221000', name: 'Terrains de gisement', category: 'Immobilisations corporelles', class: 2 },

{ code: '231000', name: 'Immobilisations corporelles en cours', category: 'Immobilisations corporelles', class: 2 },

{ code: '241000', name: 'Titres de participation', category: 'Immobilisations financières', class: 2 },

{ code: '244000', name: 'Prêts et créances sur participations', category: 'Immobilisations financières', class: 2 },

{ code: '245000', name: 'Titres immobilisés', category: 'Immobilisations financières', class: 2 },

{ code: '248000', name: 'Autres créances immobilisées', category: 'Immobilisations financières', class: 2 },

{ code: '251000', name: 'Titres mis en équivalence', category: 'Immobilisations financières', class: 2 },

{ code: '261000', name: 'Titres de filiales', category: 'Immobilisations financières', class: 2 },

{ code: '271000', name: 'Prêts du groupe et des associés', category: 'Immobilisations financières', class: 2 },

{ code: '281000', name: 'Amortissements des immobilisations incorporelles', category: 'Amortissements', class: 2 },

{ code: '282000', name: 'Amortissements des immobilisations corporelles', category: 'Amortissements', class: 2 },

{ code: '291000', name: 'Provisions pour dépréciation des immobilisations incorporelles', category: 'Provisions', class: 2 },

{ code: '292000', name: 'Provisions pour dépréciation des immobilisations corporelles', category: 'Provisions', class: 2 },


// CLASSE 3 - COMPTES DE STOCKS

{ code: '311000', name: 'Marchandises', category: 'Stocks', class: 3 },

{ code: '321000', name: 'Matières premières', category: 'Stocks', class: 3 },

{ code: '322000', name: 'Matières et fournitures consommables', category: 'Stocks', class: 3 },

{ code: '326000', name: 'Emballages', category: 'Stocks', class: 3 },

{ code: '331000', name: 'Produits en cours', category: 'Stocks', class: 3 },

{ code: '335000', name: 'Produits finis', category: 'Stocks', class: 3 },

{ code: '338000', name: 'Produits résiduels', category: 'Stocks', class: 3 },

{ code: '371000', name: 'Stocks en cours de route', category: 'Stocks', class: 3 },

{ code: '381000', name: 'Stocks à l\'extérieur', category: 'Stocks', class: 3 },

{ code: '391000', name: 'Provisions pour dépréciation des stocks de marchandises', category: 'Provisions', class: 3 },

{ code: '392000', name: 'Provisions pour dépréciation des stocks de matières premières', category: 'Provisions', class: 3 },

{ code: '393000', name: 'Provisions pour dépréciation des en-cours de production', category: 'Provisions', class: 3 },

{ code: '395000', name: 'Provisions pour dépréciation des stocks de produits', category: 'Provisions', class: 3 },


// CLASSE 4 - COMPTES DE TIERS

{ code: '401000', name: 'Fournisseurs', category: 'Fournisseurs', class: 4 },

{ code: '402000', name: 'Fournisseurs - Effets à payer', category: 'Fournisseurs', class: 4 },

{ code: '403000', name: 'Fournisseurs - Retenues de garantie', category: 'Fournisseurs', class: 4 },

{ code: '408000', name: 'Fournisseurs - Factures non parvenues', category: 'Fournisseurs', class: 4 },

{ code: '409000', name: 'Fournisseurs débiteurs', category: 'Fournisseurs', class: 4 },

{ code: '411000', name: 'Clients', category: 'Clients', class: 4 },

{ code: '412000', name: 'Clients - Effets à recevoir', category: 'Clients', class: 4 },

{ code: '413000', name: 'Clients - Retenues de garantie', category: 'Clients', class: 4 },

{ code: '418000', name: 'Clients - Produits non encore facturés', category: 'Clients', class: 4 },

{ code: '419000', name: 'Clients créditeurs', category: 'Clients', class: 4 },

{ code: '421000', name: 'Personnel - Rémunérations dues', category: 'Personnel', class: 4 },

{ code: '422000', name: 'Personnel - Œuvres sociales', category: 'Personnel', class: 4 },

{ code: '423000', name: 'Personnel - Participation', category: 'Personnel', class: 4 },

{ code: '424000', name: 'Personnel - Avances et acomptes', category: 'Personnel', class: 4 },

{ code: '428000', name: 'Personnel - Charges à payer et produits à recevoir', category: 'Personnel', class: 4 },

{ code: '431000', name: 'Sécurité sociale', category: 'Organismes sociaux', class: 4 },

{ code: '433000', name: 'Autres organismes sociaux', category: 'Organismes sociaux', class: 4 },

{ code: '441000', name: 'État - Subventions à recevoir', category: 'État', class: 4 },

{ code: '442000', name: 'État - Impôts et taxes recouvrables sur tiers', category: 'État', class: 4 },

{ code: '443000', name: 'État - TVA facturée', category: 'État', class: 4 },

{ code: '444000', name: 'État - TVA due intracommunautaire', category: 'État', class: 4 },

{ code: '445000', name: 'État - TVA déductible', category: 'État', class: 4 },

{ code: '446000', name: 'État - TVA déductible d\'investissement', category: 'État', class: 4 },

{ code: '447000', name: 'État - Autres impôts, taxes et versements assimilés', category: 'État', class: 4 },

{ code: '448000', name: 'État - Charges à payer et produits à recevoir', category: 'État', class: 4 },

{ code: '449000', name: 'État - Quotas d\'émission à restituer', category: 'État', class: 4 },

{ code: '451000', name: 'Groupe et associés', category: 'Groupe et associés', class: 4 },

{ code: '455000', name: 'Associés - Comptes courants', category: 'Groupe et associés', class: 4 },

{ code: '456000', name: 'Associés - Opérations sur le capital', category: 'Groupe et associés', class: 4 },

{ code: '458000', name: 'Groupe - Opérations faites en commun', category: 'Groupe et associés', class: 4 },

{ code: '462000', name: 'Créances douteuses', category: 'Débiteurs divers', class: 4 },

{ code: '464000', name: 'Débiteurs divers', category: 'Débiteurs divers', class: 4 },

{ code: '467000', name: 'Autres comptes débiteurs', category: 'Débiteurs divers', class: 4 },

{ code: '471000', name: 'Comptes d\'attente', category: 'Comptes transitoires', class: 4 },

{ code: '472000', name: 'Compte de régularisation', category: 'Comptes transitoires', class: 4 },

{ code: '481000', name: 'Charges à répartir sur plusieurs exercices', category: 'Comptes de régularisation', class: 4 },

{ code: '486000', name: 'Charges constatées d\'avance', category: 'Comptes de régularisation', class: 4 },

{ code: '487000', name: 'Produits constatés d\'avance', category: 'Comptes de régularisation', class: 4 },

{ code: '491000', name: 'Provisions pour dépréciation des comptes de clients', category: 'Provisions pour dépréciation', class: 4 },

{ code: '496000', name: 'Provisions pour dépréciation des comptes de débiteurs divers', category: 'Provisions pour dépréciation', class: 4 },


// CLASSE 5 - COMPTES FINANCIERS

{ code: '501000', name: 'Parts dans des entreprises liées', category: 'Valeurs mobilières de placement', class: 5 },

{ code: '502000', name: 'Actions', category: 'Valeurs mobilières de placement', class: 5 },

{ code: '503000', name: 'Obligations', category: 'Valeurs mobilières de placement', class: 5 },

{ code: '504000', name: 'Bons du Trésor et bons de caisse à court terme', category: 'Valeurs mobilières de placement', class: 5 },

{ code: '508000', name: 'Autres valeurs mobilières de placement', category: 'Valeurs mobilières de placement', class: 5 },

{ code: '511000', name: 'Valeurs à l\'encaissement', category: 'Valeurs à l\'encaissement', class: 5 },

{ code: '512000', name: 'Banques', category: 'Comptes bancaires', class: 5 },

{ code: '514000', name: 'Chèques postaux', category: 'Comptes bancaires', class: 5 },

{ code: '515000', name: 'Caisses nationales de crédit agricole', category: 'Comptes bancaires', class: 5 },

{ code: '516000', name: 'Autres organismes financiers', category: 'Comptes bancaires', class: 5 },

{ code: '517000', name: 'Instruments de trésorerie', category: 'Comptes bancaires', class: 5 },

{ code: '518000', name: 'Intérêts courus', category: 'Comptes bancaires', class: 5 },

{ code: '519000', name: 'Concours bancaires courants', category: 'Concours bancaires courants', class: 5 },

{ code: '521000', name: 'Instruments de trésorerie', category: 'Instruments de trésorerie', class: 5 },

{ code: '531000', name: 'Caisse siège social', category: 'Caisse', class: 5 },

{ code: '532000', name: 'Caisse succursale (ou usine) A', category: 'Caisse', class: 5 },

{ code: '533000', name: 'Caisse succursale (ou usine) B', category: 'Caisse', class: 5 },

{ code: '541000', name: 'Régies d\'avances', category: 'Régies d\'avances', class: 5 },

{ code: '571000', name: 'Caisse', category: 'Caisse', class: 5 },

{ code: '580000', name: 'Virements internes', category: 'Virements internes', class: 5 },

{ code: '590000', name: 'Provisions pour dépréciation des valeurs mobilières de placement', category: 'Provisions pour dépréciation', class: 5 },


// CLASSE 6 - COMPTES DE CHARGES

{ code: '601000', name: 'Achats de marchandises', category: 'Achats', class: 6 },

{ code: '602000', name: 'Achats de matières premières et fournitures', category: 'Achats', class: 6 },

{ code: '603000', name: 'Variations des stocks', category: 'Achats', class: 6 },

{ code: '604000', name: 'Achats stockés - Matières premières', category: 'Achats', class: 6 },

{ code: '605000', name: 'Autres achats', category: 'Achats', class: 6 },

{ code: '608000', name: 'Frais accessoires d\'achats', category: 'Achats', class: 6 },

{ code: '609000', name: 'Rabais, remises et ristournes obtenus sur achats', category: 'Achats', class: 6 },

{ code: '611000', name: 'Sous-traitance générale', category: 'Services extérieurs', class: 6 },

{ code: '612000', name: 'Redevances de crédit-bail', category: 'Services extérieurs', class: 6 },

{ code: '613000', name: 'Locations', category: 'Services extérieurs', class: 6 },

{ code: '614000', name: 'Charges locatives et de copropriété', category: 'Services extérieurs', class: 6 },

{ code: '615000', name: 'Entretien et réparations', category: 'Services extérieurs', class: 6 },

{ code: '616000', name: 'Primes d\'assurances', category: 'Services extérieurs', class: 6 },

{ code: '617000', name: 'Études et recherches', category: 'Services extérieurs', class: 6 },

{ code: '618000', name: 'Divers', category: 'Services extérieurs', class: 6 },

{ code: '619000', name: 'Rabais, remises et ristournes obtenus sur services extérieurs', category: 'Services extérieurs', class: 6 },

{ code: '621000', name: 'Personnel extérieur à l\'entreprise', category: 'Autres services extérieurs', class: 6 },

{ code: '622000', name: 'Rémunérations d\'intermédiaires et honoraires', category: 'Autres services extérieurs', class: 6 },

{ code: '623000', name: 'Publicité, publications, relations publiques', category: 'Autres services extérieurs', class: 6 },

{ code: '624000', name: 'Transports de biens et transport collectif du personnel', category: 'Autres services extérieurs', class: 6 },

{ code: '625000', name: 'Déplacements, missions et réceptions', category: 'Autres services extérieurs', class: 6 },

{ code: '626000', name: 'Frais postaux et de télécommunications', category: 'Autres services extérieurs', class: 6 },

{ code: '627000', name: 'Services bancaires et assimilés', category: 'Autres services extérieurs', class: 6 },

{ code: '628000', name: 'Divers', category: 'Autres services extérieurs', class: 6 },

{ code: '629000', name: 'Rabais, remises et ristournes obtenus sur autres services extérieurs', category: 'Autres services extérieurs', class: 6 },

{ code: '631000', name: 'Impôts, taxes et versements assimilés sur rémunérations', category: 'Impôts, taxes et versements assimilés', class: 6 },

{ code: '633000', name: 'Impôts, taxes et versements assimilés sur rémunérations (administration des impôts)', category: 'Impôts, taxes et versements assimilés', class: 6 },

{ code: '635000', name: 'Autres impôts, taxes et versements assimilés', category: 'Impôts, taxes et versements assimilés', class: 6 },

{ code: '637000', name: 'Taxes sur le chiffre d\'affaires et assimilées', category: 'Impôts, taxes et versements assimilés', class: 6 },

{ code: '641000', name: 'Rémunérations du personnel', category: 'Charges de personnel', class: 6 },

{ code: '644000', name: 'Rémunération du travail de l\'exploitant', category: 'Charges de personnel', class: 6 },

{ code: '645000', name: 'Charges de sécurité sociale et de prévoyance', category: 'Charges de personnel', class: 6 },

{ code: '646000', name: 'Cotisations sociales personnelles de l\'exploitant', category: 'Charges de personnel', class: 6 },

{ code: '647000', name: 'Autres charges sociales', category: 'Charges de personnel', class: 6 },

{ code: '648000', name: 'Autres charges de personnel', category: 'Charges de personnel', class: 6 },

{ code: '651000', name: 'Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires', category: 'Autres charges d\'exploitation', class: 6 },

{ code: '653000', name: 'Jetons de présence', category: 'Autres charges d\'exploitation', class: 6 },

{ code: '654000', name: 'Pertes sur créances irrécouvrables', category: 'Autres charges d\'exploitation', class: 6 },

{ code: '655000', name: 'Quote-part de résultat sur opérations faites en commun', category: 'Autres charges d\'exploitation', class: 6 },

{ code: '658000', name: 'Charges diverses', category: 'Autres charges d\'exploitation', class: 6 },

{ code: '661000', name: 'Charges d\'intérêts', category: 'Charges financières', class: 6 },

{ code: '664000', name: 'Pertes sur créances liées à des participations', category: 'Charges financières', class: 6 },

{ code: '665000', name: 'Escomptes accordés', category: 'Charges financières', class: 6 },

{ code: '666000', name: 'Pertes de change', category: 'Charges financières', class: 6 },

{ code: '667000', name: 'Charges nettes sur cessions de valeurs mobilières de placement', category: 'Charges financières', class: 6 },

{ code: '668000', name: 'Autres charges financières', category: 'Charges financières', class: 6 },

{ code: '671000', name: 'Charges exceptionnelles sur opérations de gestion', category: 'Charges exceptionnelles', class: 6 },

{ code: '675000', name: 'Valeurs comptables des éléments d\'actif cédés', category: 'Charges exceptionnelles', class: 6 },

{ code: '678000', name: 'Autres charges exceptionnelles', category: 'Charges exceptionnelles', class: 6 },

{ code: '681000', name: 'Dotations aux amortissements et aux provisions - Charges d\'exploitation', category: 'Dotations aux amortissements et aux provisions', class: 6 },

{ code: '686000', name: 'Dotations aux amortissements et aux provisions - Charges financières', category: 'Dotations aux amortissements et aux provisions', class: 6 },

{ code: '687000', name: 'Dotations aux amortissements et aux provisions - Charges exceptionnelles', category: 'Dotations aux amortissements et aux provisions', class: 6 },

{ code: '691000', name: 'Participation des salariés aux fruits de l\'expansion', category: 'Participation des salariés', class: 6 },

{ code: '695000', name: 'Impôts sur les bénéfices', category: 'Impôts sur les bénéfices', class: 6 },

{ code: '696000', name: 'Suppléments d\'impôt sur les sociétés liés aux distributions', category: 'Impôts sur les bénéfices', class: 6 },

{ code: '697000', name: 'Imposition forfaitaire annuelle des sociétés', category: 'Impôts sur les bénéfices', class: 6 },

{ code: '698000', name: 'Intégration fiscale', category: 'Impôts sur les bénéfices', class: 6 },

{ code: '699000', name: 'Produits - Reports en arrière des déficits', category: 'Impôts sur les bénéfices', class: 6 },


// CLASSE 7 - COMPTES DE PRODUITS

{ code: '701000', name: 'Ventes de produits finis', category: 'Ventes', class: 7 },

{ code: '702000', name: 'Ventes de produits intermédiaires', category: 'Ventes', class: 7 },

{ code: '703000', name: 'Ventes de produits résiduels', category: 'Ventes', class: 7 },

{ code: '704000', name: 'Travaux', category: 'Ventes', class: 7 },

{ code: '705000', name: 'Études', category: 'Ventes', class: 7 },

{ code: '706000', name: 'Prestations de services', category: 'Ventes', class: 7 },

{ code: '707000', name: 'Ventes de marchandises', category: 'Ventes', class: 7 },

{ code: '708000', name: 'Produits des activités annexes', category: 'Ventes', class: 7 },

{ code: '709000', name: 'Rabais, remises et ristournes accordés par l\'entreprise', category: 'Ventes', class: 7 },

{ code: '713000', name: 'Variation des stocks (en-cours de production, produits)', category: 'Production stockée', class: 7 },

{ code: '721000', name: 'Production immobilisée - Immobilisations incorporelles', category: 'Production immobilisée', class: 7 },

{ code: '722000', name: 'Production immobilisée - Immobilisations corporelles', category: 'Production immobilisée', class: 7 },

{ code: '731000', name: 'Subventions d\'exploitation', category: 'Subventions d\'exploitation', class: 7 },

{ code: '741000', name: 'Subventions d\'investissement', category: 'Autres produits d\'exploitation', class: 7 },

{ code: '746000', name: 'Différences positives de change', category: 'Autres produits d\'exploitation', class: 7 },

{ code: '747000', name: 'Produits nets sur cessions d\'éléments d\'actif', category: 'Autres produits d\'exploitation', class: 7 },

{ code: '748000', name: 'Autres produits d\'exploitation', category: 'Autres produits d\'exploitation', class: 7 },

{ code: '751000', name: 'Produits des participations', category: 'Produits financiers', class: 7 },

{ code: '752000', name: 'Revenus des autres immobilisations financières', category: 'Produits financiers', class: 7 },

{ code: '753000', name: 'Revenus des autres créances', category: 'Produits financiers', class: 7 },

{ code: '754000', name: 'Revenus des valeurs mobilières de placement', category: 'Produits financiers', class: 7 },

{ code: '755000', name: 'Escomptes obtenus', category: 'Produits financiers', class: 7 },

{ code: '756000', name: 'Gains de change', category: 'Produits financiers', class: 7 },

{ code: '757000', name: 'Produits nets sur cessions de valeurs mobilières de placement', category: 'Produits financiers', class: 7 },

{ code: '758000', name: 'Produits divers de gestion financière', category: 'Produits financiers', class: 7 },

{ code: '771000', name: 'Produits exceptionnels sur opérations de gestion', category: 'Produits exceptionnels', class: 7 },

{ code: '775000', name: 'Produits des cessions d\'éléments d\'actif', category: 'Produits exceptionnels', class: 7 },

{ code: '777000', name: 'Quote-part des subventions d\'investissement virée au résultat de l\'exercice', category: 'Produits exceptionnels', class: 7 },

{ code: '778000', name: 'Autres produits exceptionnels', category: 'Produits exceptionnels', class: 7 },

{ code: '781000', name: 'Reprises sur amortissements et provisions (à inscrire dans les produits d\'exploitation)', category: 'Reprises sur amortissements et provisions', class: 7 },

{ code: '786000', name: 'Reprises sur provisions pour risques (à inscrire dans les produits financiers)', category: 'Reprises sur amortissements et provisions', class: 7 },

{ code: '787000', name: 'Reprises sur provisions (à inscrire dans les produits exceptionnels)', category: 'Reprises sur amortissements et provisions', class: 7 },


// CLASSE 8 - COMPTES SPÉCIAUX

{ code: '801000', name: 'Engagements donnés', category: 'Engagements hors bilan', class: 8 },

{ code: '802000', name: 'Engagements reçus', category: 'Engagements hors bilan', class: 8 },

{ code: '803000', name: 'Engagements donnés sur commandes', category: 'Engagements hors bilan', class: 8 },

{ code: '804000', name: 'Engagements reçus sur commandes', category: 'Engagements hors bilan', class: 8 },

{ code: '805000', name: 'Engagements de crédit-bail donnés', category: 'Engagements hors bilan', class: 8 },

{ code: '806000', name: 'Engagements de crédit-bail reçus', category: 'Engagements hors bilan', class: 8 },

{ code: '807000', name: 'Engagements en matière de pensions de retraite et obligations similaires', category: 'Engagements hors bilan', class: 8 },

{ code: '808000', name: 'Autres engagements donnés', category: 'Engagements hors bilan', class: 8 },

{ code: '809000', name: 'Autres engagements reçus', category: 'Engagements hors bilan', class: 8 },


// CLASSE 9 - COMPTABILITÉ ANALYTIQUE

{ code: '901000', name: 'Comptes de reclassement', category: 'Comptes de reclassement', class: 9 },

{ code: '902000', name: 'Comptes réfléchis', category: 'Comptes réfléchis', class: 9 },

{ code: '903000', name: 'Comptes d\'analyse', category: 'Analyse et répartition', class: 9 },

{ code: '904000', name: 'Comptes de coûts', category: 'Analyse et répartition', class: 9 },

{ code: '905000', name: 'Coûts d\'achat', category: 'Coûts', class: 9 },

{ code: '906000', name: 'Coûts de production', category: 'Coûts', class: 9 },

{ code: '907000', name: 'Coûts de distribution', category: 'Coûts', class: 9 },

{ code: '908000', name: 'Coûts de revient', category: 'Coûts', class: 9 },

{ code: '909000', name: 'Différences d\'incorporation', category: 'Écarts et différences', class: 9 },

{ code: '921000', name: 'Centres auxiliaires', category: 'Centres d\'analyse', class: 9 },

{ code: '922000', name: 'Centres principaux', category: 'Centres d\'analyse', class: 9 },

{ code: '931000', name: 'Matières premières', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '932000', name: 'Autres approvisionnements', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '933000', name: 'En-cours de production de biens', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '934000', name: 'En-cours de production de services', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '935000', name: 'Stocks de produits', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '937000', name: 'Stocks de marchandises', category: 'Stocks en comptabilité analytique', class: 9 },

{ code: '951000', name: 'Résultats sur coûts préétablis', category: 'Résultats de la comptabilité analytique', class: 9 },

{ code: '952000', name: 'Résultats sur coûts d\'achat', category: 'Résultats de la comptabilité analytique', class: 9 },

{ code: '953000', name: 'Résultats sur coûts de production', category: 'Résultats de la comptabilité analytique', class: 9 },

{ code: '954000', name: 'Résultats sur coûts de distribution', category: 'Résultats de la comptabilité analytique', class: 9 },

{ code: '955000', name: 'Résultats sur coûts de revient', category: 'Résultats de la comptabilité analytique', class: 9 },

{ code: '958000', name: 'Résultats de la comptabilité analytique', category: 'Résultats de la comptabilité analytique', class: 9 }

];

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

{ account: '707000', accountName: 'Ventes de marchandises', libelle: 'Vente marchandises', debit: 0, credit: 1500000 },

{ account: '443000', accountName: 'État - TVA facturée', libelle: 'TVA sur ventes', debit: 0, credit: 300000 }

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

{ account: '445000', accountName: 'État - TVA déductible', libelle: 'TVA déductible', debit: 170000, credit: 0 },

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

console.log('✅ Données initialisées :', {

companies: this.state.companies.length,

users: this.state.users.length,

accounts: this.state.accounts.length,

entries: this.state.entries.length,

cashRegisters: this.state.cashRegisters.length

});

console.log('🔄 window.app synchronisé avec', window.app.companies.length, 'entreprises');

}

syncWithGlobalApp() {

window.app = {

currentUser: this.state.currentUser,

currentProfile: this.state.currentProfile,

currentCompany: this.state.currentCompany,

isAuthenticated: this.state.isAuthenticated,

companies: this.state.companies,

users: this.state.users,

accounts: this.state.accounts,

entries: this.state.entries,

cashRegisters: this.state.cashRegisters

};

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

console.log('✅ Authentification réussie, window.app synchronisé:', {

currentUser: this.state.currentUser,

currentProfile: this.state.currentProfile,

currentCompany: this.state.currentCompany

});

return {

success: true,

user: this.state.currentUser,

profile: this.state.currentProfile

};

} catch (error) {

console.error('❌ Erreur authentification:', error);

throw error;

}

}

getCompanyName() {

if (!this.state.currentCompany) return 'Aucune entreprise sélectionnée';

const company = this.state.companies.find(c => c.id === this.state.currentCompany);

return company ? company.name : 'Entreprise inconnue';

}

// CRUD Users

createUser(userData) {

const newUser = {

id: Math.max(...this.state.users.map(u => u.id)) + 1,

uniqueId: this.idGenerator.user(),

...userData,

passwordHash: this.hashPassword('temp123'), // Mot de passe temporaire

status: 'Actif'

};

this.state.users.push(newUser);

this.syncWithGlobalApp();

this.logAuditEvent('USER_CREATED', { userId: newUser.id, name: newUser.name });

return newUser;

}

updateUser(userId, userData) {

const userIndex = this.state.users.findIndex(u => u.id === userId);

if (userIndex !== -1) {

this.state.users[userIndex] = { ...this.state.users[userIndex], ...userData };

this.syncWithGlobalApp();

this.logAuditEvent('USER_UPDATED', { userId, changes: userData });

return this.state.users[userIndex];

}

return null;

}

deleteUser(userId) {

const userIndex = this.state.users.findIndex(u => u.id === userId);

if (userIndex !== -1) {

const deletedUser = this.state.users.splice(userIndex, 1)[0];

this.syncWithGlobalApp();

this.logAuditEvent('USER_DELETED', { userId, name: deletedUser.name });

return deletedUser;

}

return null;

}

// CRUD Companies

createCompany(companyData) {

const newCompany = {

id: Math.max(...this.state.companies.map(c => c.id)) + 1,

uniqueId: this.idGenerator.company(),

...companyData

};

this.state.companies.push(newCompany);

this.syncWithGlobalApp();

this.logAuditEvent('COMPANY_CREATED', { companyId: newCompany.id, name: newCompany.name });

return newCompany;

}

updateCompany(companyId, companyData) {

const companyIndex = this.state.companies.findIndex(c => c.id === companyId);

if (companyIndex !== -1) {

this.state.companies[companyIndex] = { ...this.state.companies[companyIndex], ...companyData };

this.syncWithGlobalApp();

this.logAuditEvent('COMPANY_UPDATED', { companyId, changes: companyData });

return this.state.companies[companyIndex];

}

return null;

}

deleteCompany(companyId) {

const companyIndex = this.state.companies.findIndex(c => c.id === companyId);

if (companyIndex !== -1) {

const deletedCompany = this.state.companies.splice(companyIndex, 1)[0];

this.syncWithGlobalApp();

this.logAuditEvent('COMPANY_DELETED', { companyId, name: deletedCompany.name });

return deletedCompany;

}

return null;

}

// CRUD Entries

createEntry(entryData) {

const newEntry = {

id: Math.max(...this.state.entries.map(e => e.id)) + 1,

uniqueId: this.idGenerator.entry(),

...entryData,

status: 'En attente',

userId: this.state.currentUser.id

};

this.state.entries.push(newEntry);

this.syncWithGlobalApp();

this.logAuditEvent('ENTRY_CREATED', { entryId: newEntry.id, piece: newEntry.piece });

return newEntry;

}

updateEntry(entryId, entryData) {

const entryIndex = this.state.entries.findIndex(e => e.id === entryId);

if (entryIndex !== -1) {

this.state.entries[entryIndex] = { ...this.state.entries[entryIndex], ...entryData };

this.syncWithGlobalApp();

this.logAuditEvent('ENTRY_UPDATED', { entryId, changes: entryData });

return this.state.entries[entryIndex];

}

return null;

}

deleteEntry(entryId) {

const entryIndex = this.state.entries.findIndex(e => e.id === entryId);

if (entryIndex !== -1) {

const deletedEntry = this.state.entries.splice(entryIndex, 1)[0];

this.syncWithGlobalApp();

this.logAuditEvent('ENTRY_DELETED', { entryId, piece: deletedEntry.piece });

return deletedEntry;

}

return null;

}

// CRUD Accounts

createAccount(accountData) {

const newAccount = {

...accountData

};

this.state.accounts.push(newAccount);

this.syncWithGlobalApp();

this.logAuditEvent('ACCOUNT_CREATED', { code: newAccount.code, name: newAccount.name });

return newAccount;

}

updateAccount(accountCode, accountData) {

const accountIndex = this.state.accounts.findIndex(a => a.code === accountCode);

if (accountIndex !== -1) {

this.state.accounts[accountIndex] = { ...this.state.accounts[accountIndex], ...accountData };

this.syncWithGlobalApp();

this.logAuditEvent('ACCOUNT_UPDATED', { code: accountCode, changes: accountData });

return this.state.accounts[accountIndex];

}

return null;

}

deleteAccount(accountCode) {

const accountIndex = this.state.accounts.findIndex(a => a.code === accountCode);

if (accountIndex !== -1) {

const deletedAccount = this.state.accounts.splice(accountIndex, 1)[0];

this.syncWithGlobalApp();

this.logAuditEvent('ACCOUNT_DELETED', { code: accountCode, name: deletedAccount.name });

return deletedAccount;

}

return null;

}

// CRUD Cash Registers

createCashRegister(cashData) {

const newCash = {

id: Math.max(...this.state.cashRegisters.map(c => c.id)) + 1,

uniqueId: this.idGenerator.cash(),

...cashData,

openingBalance: cashData.balance,

dailyReceipts: 0,

dailyExpenses: 0

};

this.state.cashRegisters.push(newCash);

this.syncWithGlobalApp();

this.logAuditEvent('CASH_CREATED', { cashId: newCash.id, name: newCash.name });

return newCash;

}

updateCashRegister(cashId, cashData) {

const cashIndex = this.state.cashRegisters.findIndex(c => c.id === cashId);

if (cashIndex !== -1) {

this.state.cashRegisters[cashIndex] = { ...this.state.cashRegisters[cashIndex], ...cashData };

this.syncWithGlobalApp();

this.logAuditEvent('CASH_UPDATED', { cashId, changes: cashData });

return this.state.cashRegisters[cashIndex];

}

return null;

}

deleteCashRegister(cashId) {

const cashIndex = this.state.cashRegisters.findIndex(c => c.id === cashId);

if (cashIndex !== -1) {

const deletedCash = this.state.cashRegisters.splice(cashIndex, 1)[0];

this.syncWithGlobalApp();

this.logAuditEvent('CASH_DELETED', { cashId, name: deletedCash.name });

return deletedCash;

}

return null;

}

}

// ==================================================================================

// GESTIONNAIRE UI

// ==================================================================================

class UIManager {

constructor(app) {

this.app = app;

this.initializeTheme();

}

initializeTheme() {

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {

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

const icons = {

'success': '✅',

'error': '❌',

'warning': '⚠️',

'info': 'ℹ️'

};

alert(`${icons[type] || 'ℹ️'} ${message}`);

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

// FONCTIONS D'AFFICHAGE

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

<a href="#" onclick="navigateTo('${item.id}'); return false;"

class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors ${item.active ? 'bg-primary text-white' : ''}">

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

alert('❌ Erreur : Application non initialisée');

return;

}

// Supprimer la classe active de tous les éléments de menu

document.querySelectorAll('#navigationMenu a').forEach(item => {

item.classList.remove('bg-primary', 'text-white');

item.classList.add('text-gray-700', 'dark:text-gray-300');

});

// Ajouter la classe active à l'élément cliqué

try {

const clickedElement = event.target.closest('a');

if (clickedElement && clickedElement.parentElement.id === 'navigationMenu') {

clickedElement.classList.add('bg-primary', 'text-white');

clickedElement.classList.remove('text-gray-700', 'dark:text-gray-300');

}

} catch (e) {

// Ignorer si l'événement n'est pas disponible

}

// Charger le contenu de la page

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

console.log('⚠️ Page inconnue, chargement du tableau de bord');

loadDashboard();

}

} catch (error) {

console.error('❌ Erreur lors du chargement de la page :', error);

alert('Erreur lors du chargement de la page : ' + page + '\nDétails : ' + error.message);

}

}

function loadDashboard() {

console.log('📊 Chargement du tableau de bord pour:', window.app.currentProfile);


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

<i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}

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


// Initialiser les graphiques

setTimeout(() => {

initPortfolioChart();

initSectorChart();

}, 100);


console.log('✅ Tableau de bord admin chargé');

}

}

function loadStandardDashboard() {

const userCompany = window.app.companies.find(c => c.id == window.app.currentCompany);

let dashboardTitle = 'Tableau de Bord';

if (window.app.currentProfile === 'user') {

dashboardTitle = 'Mon Entreprise';

} else if (window.app.currentProfile === 'caissier') {

dashboardTitle = 'Ma Caisse';

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">${dashboardTitle}</h2>

<div class="text-sm text-primary-light font-medium">

<i class="fas fa-clock mr-1"></i>Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}

</div>

</div>

${!window.app.currentCompany && window.app.currentProfile !== 'caissier' ? `

<div class="bg-warning/10 border border-warning/20 rounded-xl p-6 text-center">

<i class="fas fa-exclamation-triangle text-warning text-2xl mb-3"></i>

<h3 class="text-lg font-semibold text-warning mb-2">Aucune entreprise sélectionnée</h3>

<p class="text-gray-600 dark:text-gray-400 mb-4">Veuillez sélectionner une entreprise pour voir le tableau de bord.</p>

<button onclick="showCompanySelector()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

Sélectionner une entreprise

</button>

</div>

` : ''}

<!-- Cartes KPI Standard -->

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-primary">

<div class="flex items-center justify-between">

<div>

<p class="text-sm font-medium text-gray-600 dark:text-gray-400">

${window.app.currentProfile === 'user' ? 'Caisses disponibles' :

window.app.currentProfile === 'caissier' ? 'Accès rapide écritures' : 'Entreprises'}

</p>

<p class="text-3xl font-bold text-gray-900 dark:text-white">

${window.app.currentProfile === 'caissier' ? '→' :

userCompany ? userCompany.cashRegisters : window.app.companies.length}

</p>

</div>

<div class="bg-primary/10 p-3 rounded-lg">

<i class="fas ${window.app.currentProfile === 'caissier' ? 'fa-plus-circle' :

window.app.currentProfile === 'user' ? 'fa-cash-register' : 'fa-building'} text-primary text-xl"></i>

</div>

</div>

${window.app.currentProfile === 'caissier' ? `

<div class="mt-3">

<button onclick="navigateTo('entries')" class="w-full bg-primary text-white py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">

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

${window.app.currentProfile === 'caissier' ? '45' : getCompanyEntries().length}

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

<p class="text-sm font-medium text-gray-600 dark:text-gray-400">En attente de validation</p>

<p class="text-3xl font-bold text-gray-900 dark:text-white">

${getCompanyEntries().filter(e => e.status === 'En attente').length}

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

<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Performances</p>

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


// Initialiser les graphiques

setTimeout(() => {

initMonthlyChart();

initJournalChart();

}, 100);


console.log('✅ Dashboard standard chargé');

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

function getCompanyEntries() {

if (!window.app.currentCompany) return [];

return window.app.entries.filter(e => e.companyId === window.app.currentCompany);

}

function initPortfolioChart() {

const ctx = document.getElementById('portfolioChart');

if (ctx && typeof Chart !== 'undefined') {

new Chart(ctx, {

type: 'line',

data: {

labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],

datasets: [{

label: 'Nombre d\'entreprises',

data: [2, 3, 3, 4, 4, 4],

borderColor: '#5D5CDE',

backgroundColor: 'rgba(93, 92, 222, 0.1)',

tension: 0.4,

fill: true

}]

},

options: {

responsive: true,

maintainAspectRatio: false,

plugins: {

legend: {

display: false

}

},

scales: {

y: {

beginAtZero: true,

grid: {

color: 'rgba(156, 163, 175, 0.3)'

}

},

x: {

grid: {

color: 'rgba(156, 163, 175, 0.3)'

}

}

}

}

});

}

}

function initSectorChart() {

const ctx = document.getElementById('sectorChart');

if (ctx && typeof Chart !== 'undefined') {

new Chart(ctx, {

type: 'doughnut',

data: {

labels: ['Commerce', 'Services', 'Industrie', 'BTP'],

datasets: [{

data: [45, 30, 15, 10],

backgroundColor: [

'#5D5CDE',

'#3B82F6',

'#10B981',

'#F59E0B'

]

}]

},

options: {

responsive: true,

maintainAspectRatio: false,

plugins: {

legend: {

position: 'bottom'

}

}

}

});

}

}

function initMonthlyChart() {

const ctx = document.getElementById('monthlyChart');

if (ctx && typeof Chart !== 'undefined') {

const entries = getCompanyEntries();

new Chart(ctx, {

type: 'bar',

data: {

labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],

datasets: [{

label: 'Écritures',

data: [12, 19, 8, 15, 22, entries.length],

backgroundColor: 'rgba(93, 92, 222, 0.8)',

borderColor: '#5D5CDE',

borderWidth: 1

}]

},

options: {

responsive: true,

maintainAspectRatio: false,

plugins: {

legend: {

display: false

}

},

scales: {

y: {

beginAtZero: true,

grid: {

color: 'rgba(156, 163, 175, 0.3)'

}

},

x: {

grid: {

color: 'rgba(156, 163, 175, 0.3)'

}

}

}

}

});

}

}

function initJournalChart() {

const ctx = document.getElementById('journalChart');

if (ctx && typeof Chart !== 'undefined') {

const entries = getCompanyEntries();

const journalCounts = {

'JV': entries.filter(e => e.journal === 'JV').length,

'JA': entries.filter(e => e.journal === 'JA').length,

'JB': entries.filter(e => e.journal === 'JB').length,

'JC': entries.filter(e => e.journal === 'JC').length

};


new Chart(ctx, {

type: 'pie',

data: {

labels: ['Journal Ventes', 'Journal Achats', 'Journal Banque', 'Journal Caisse'],

datasets: [{

data: [journalCounts.JV, journalCounts.JA, journalCounts.JB, journalCounts.JC],

backgroundColor: [

'#10B981',

'#F59E0B',

'#3B82F6',

'#8B5CF6'

]

}]

},

options: {

responsive: true,

maintainAspectRatio: false,

plugins: {

legend: {

position: 'bottom'

}

}

}

});

}

}

function showCompanySelector() {

const selector = document.getElementById('activeCompanySelect');

if (selector) {

selector.focus();

selector.click();

}

}

// Autres fonctions de page

function loadUsersManagement() {

if (window.app.currentProfile !== 'admin') {

showAccessDenied();

return;

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Collaborateurs</h2>

<button onclick="openUserModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

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

<div class="space-y-4">

${window.app.users.map(user => `

<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">

<div class="flex items-center space-x-4">

<div class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">

${user.name.split(' ').map(n => n[0]).join('')}

</div>

<div>

<div class="font-medium text-gray-900 dark:text-white">${user.name}</div>

<div class="text-sm text-gray-500 dark:text-gray-400">${user.email} • ${user.role}</div>

<div class="text-xs text-gray-500 dark:text-gray-400">${user.assignedCompanies?.length || 0} entreprise(s) assignée(s)</div>

</div>

</div>

<div class="flex space-x-2">

<button onclick="viewUser(${user.id})" class="text-primary hover:text-primary/80 p-2" title="Voir">

<i class="fas fa-eye"></i>

</button>

<button onclick="editUser(${user.id})" class="text-info hover:text-info/80 p-2" title="Modifier">

<i class="fas fa-edit"></i>

</button>

<button onclick="manageUserCompanies(${user.id})" class="text-warning hover:text-warning/80 p-2" title="Gérer entreprises">

<i class="fas fa-building"></i>

</button>

<button onclick="deleteUser(${user.id})" class="text-danger hover:text-danger/80 p-2" title="Supprimer">

<i class="fas fa-trash"></i>

</button>

</div>

</div>

`).join('')}

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

<button onclick="openCompanyModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

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

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des entreprises</h3>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

${window.app.companies.map(company => `

<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">

<div class="flex justify-between items-start mb-3">

<div>

<div class="font-medium text-gray-900 dark:text-white">${company.name}</div>

<div class="text-sm text-gray-500 dark:text-gray-400 mt-1">${company.type} • ${company.system}</div>

<div class="text-sm text-gray-500 dark:text-gray-400">${company.phone}</div>

<div class="text-sm text-gray-500 dark:text-gray-400">${company.address}</div>

</div>

${window.app.currentProfile === 'admin' ? `

<div class="flex space-x-1">

<button onclick="viewCompany(${company.id})" class="text-primary hover:text-primary/80 p-1" title="Voir">

<i class="fas fa-eye text-sm"></i>

</button>

<button onclick="editCompany(${company.id})" class="text-info hover:text-info/80 p-1" title="Modifier">

<i class="fas fa-edit text-sm"></i>

</button>

<button onclick="deleteCompany(${company.id})" class="text-danger hover:text-danger/80 p-1" title="Supprimer">

<i class="fas fa-trash text-sm"></i>

</button>

</div>

` : ''}

</div>

<div class="flex justify-between items-center">

<span class="px-2 py-1 rounded text-xs ${company.status === 'Actif' ? 'bg-success/20 text-success' :

company.status === 'Période d\'essai' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}">${company.status}</span>

<span class="text-xs text-gray-500 dark:text-gray-400">${company.cashRegisters} caisse(s)</span>

</div>

</div>

`).join('')}

</div>

</div>

</div>

`;

document.getElementById('mainContent').innerHTML = content;

console.log('✅ Page entreprises chargée');

}

function loadEntries() {

// Vérifier si une entreprise est sélectionnée (sauf pour admin qui peut voir toutes les écritures)

if (!window.app.currentCompany && window.app.currentProfile !== 'admin' && window.app.currentProfile !== 'caissier') {

document.getElementById('mainContent').innerHTML = `

<div class="text-center p-8">

<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">

<i class="fas fa-exclamation-triangle text-2xl"></i>

</div>

<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Entreprise requise</h3>

<p class="text-gray-600 dark:text-gray-400 mt-2">Veuillez sélectionner une entreprise pour voir les écritures comptables.</p>

<button onclick="showCompanySelector()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

Sélectionner une entreprise

</button>

</div>

`;

return;

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">

${window.app.currentProfile === 'caissier' ? 'Opérations Caisse' : 'Écritures Comptables'}

${window.app.currentCompany ? ` - ${app.getCompanyName()}` : ''}

</h2>

<div class="flex items-center space-x-4">

<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">

<i class="fas fa-book mr-2"></i>Journal SYSCOHADA

</div>

<button onclick="openEntryModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-plus mr-2"></i>Nouvelle écriture

</button>

</div>

</div>

<!-- Filtres et recherche -->

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">

<input type="text" placeholder="Rechercher..."

class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<option>Tous les journaux</option>

<option>Journal Général (JG)</option>

<option>Journal des Achats (JA)</option>

<option>Journal des Ventes (JV)</option>

<option>Journal de Banque (JB)</option>

<option>Journal de Caisse (JC)</option>

<option>Journal des Opérations Diverses (JOD)</option>

</select>

<select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<option>Tous les statuts</option>

<option>Validé</option>

<option>En attente</option>

<option>Brouillon</option>

</select>

<input type="date" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

</div>

</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liste des écritures</h3>

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

${getFilteredEntries().map(entry => `

<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">

<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${new Date(entry.date).toLocaleDateString('fr-FR')}</td>

<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.journal}</td>

<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-mono text-sm">${entry.piece}</td>

<td class="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">${entry.libelle}</td>

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

function getFilteredEntries() {

let entries = window.app.entries;


if (window.app.currentProfile === 'admin') {

// Admin voit toutes les écritures

return entries;

} else if (window.app.currentProfile === 'caissier') {

// Caissier voit les écritures de sa caisse (simulation)

return entries.filter(e => e.journal === 'JC');

} else {

// Autres profils voient les écritures de l'entreprise sélectionnée

return entries.filter(e => e.companyId === window.app.currentCompany);

}

}

function loadAccounts() {

// Vérifier si une entreprise est sélectionnée (sauf pour admin et caissier)

if (!window.app.currentCompany && window.app.currentProfile !== 'admin' && window.app.currentProfile !== 'caissier') {

document.getElementById('mainContent').innerHTML = `

<div class="text-center p-8">

<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">

<i class="fas fa-exclamation-triangle text-2xl"></i>

</div>

<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Entreprise requise</h3>

<p class="text-gray-600 dark:text-gray-400 mt-2">Veuillez sélectionner une entreprise pour voir le plan comptable.</p>

<button onclick="showCompanySelector()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

Sélectionner une entreprise

</button>

</div>

`;

return;

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Comptable SYSCOHADA Révisé</h2>

<div class="flex items-center space-x-4">

<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">

<i class="fas fa-calculator mr-2"></i>${window.app.accounts.length} comptes

</div>

${window.app.currentProfile !== 'caissier' ? `

<button onclick="openAccountModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-plus mr-2"></i>Nouveau Compte

</button>

` : ''}

</div>

</div>

<!-- Filtres -->

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">

<input type="text" placeholder="Rechercher un compte..." id="accountSearch"

class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<select id="categoryFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<option value="">Toutes les catégories</option>

<option value="Capitaux propres">Capitaux propres</option>

<option value="Immobilisations">Immobilisations</option>

<option value="Stocks">Stocks</option>

<option value="Tiers">Tiers</option>

<option value="Financiers">Financiers</option>

<option value="Charges">Charges</option>

<option value="Produits">Produits</option>

</select>

<select id="classFilter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<option value="">Toutes les classes</option>

<option value="1">Classe 1 - Capitaux</option>

<option value="2">Classe 2 - Immobilisations</option>

<option value="3">Classe 3 - Stocks</option>

<option value="4">Classe 4 - Tiers</option>

<option value="5">Classe 5 - Financiers</option>

<option value="6">Classe 6 - Charges</option>

<option value="7">Classe 7 - Produits</option>

<option value="8">Classe 8 - Spéciaux</option>

<option value="9">Classe 9 - Analytique</option>

</select>

<button onclick="filterAccounts()" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

<i class="fas fa-search mr-2"></i>Filtrer

</button>

</div>

</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comptes disponibles</h3>

<div id="accountsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">

${window.app.accounts.map(account => `

<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">

<div class="font-mono text-sm text-primary font-semibold">${account.code}</div>

<div class="font-medium text-gray-900 dark:text-white text-sm mt-1">${account.name}</div>

<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${account.category}</div>

<div class="text-xs text-gray-500 dark:text-gray-400">Classe ${account.class || 'N/A'}</div>

${window.app.currentProfile !== 'caissier' ? `

<div class="mt-2 flex space-x-2">

<button onclick="editAccount('${account.code}')" class="text-primary hover:text-primary/80 text-xs" title="Modifier">

<i class="fas fa-edit"></i>

</button>

<button onclick="deleteAccount('${account.code}')" class="text-danger hover:text-danger/80 text-xs" title="Supprimer">

<i class="fas fa-trash"></i>

</button>

</div>

` : ''}

</div>

`).join('')}

</div>

</div>

</div>

`;

document.getElementById('mainContent').innerHTML = content;

console.log('✅ Page comptes chargée');

}

function loadCaisse() {

// Vérifier si une entreprise est sélectionnée (sauf pour caissier)

if (!window.app.currentCompany && window.app.currentProfile !== 'caissier') {

document.getElementById('mainContent').innerHTML = `

<div class="text-center p-8">

<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">

<i class="fas fa-exclamation-triangle text-2xl"></i>

</div>

<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Entreprise requise</h3>

<p class="text-gray-600 dark:text-gray-400 mt-2">Veuillez sélectionner une entreprise pour voir la gestion des caisses.</p>

<button onclick="showCompanySelector()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

Sélectionner une entreprise

</button>

</div>

`;

return;

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">

${window.app.currentProfile === 'caissier' ? 'Ma Caisse' : 'Gestion des Caisses'}

${window.app.currentCompany ? ` - ${app.getCompanyName()}` : ''}

</h2>

<div class="flex items-center space-x-4">

<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">

<i class="fas fa-cash-register mr-2"></i>${getCompanyCashRegisters().length} caisses

</div>

${window.app.currentProfile !== 'caissier' ? `

<button onclick="openCashModal()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

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

<span class="text-2xl font-bold text-success">150 000 FCFA</span>

</div>

<div class="flex justify-between items-center p-4 bg-info/10 rounded-lg">

<span class="text-info font-medium">Recettes du jour</span>

<span class="text-2xl font-bold text-info">+85 000 FCFA</span>

</div>

<div class="flex justify-between items-center p-4 bg-warning/10 rounded-lg">

<span class="text-warning font-medium">Dépenses du jour</span>

<span class="text-2xl font-bold text-warning">-25 000 FCFA</span>

</div>

<div class="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-t-2 border-primary">

<span class="text-primary font-medium">Solde actuel</span>

<span class="text-3xl font-bold text-primary">210 000 FCFA</span>

</div>

</div>

<div class="mt-6 grid grid-cols-2 gap-4">

<button onclick="navigateTo('entries')" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">

<i class="fas fa-plus-circle mr-2"></i>Nouvelle opération

</button>

<button onclick="printCashReport()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors">

<i class="fas fa-print mr-2"></i>État de caisse

</button>

</div>

</div>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">

<i class="fas fa-history mr-2 text-info"></i>Dernières opérations

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

<div class="font-bold text-warning">-5 000 FCFA</div>

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

${getCompanyCashRegisters().map(cash => `

<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">

<td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${cash.name}</td>

<td class="px-6 py-4 text-gray-900 dark:text-white">${cash.responsibleName}</td>

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

function getCompanyCashRegisters() {

if (window.app.currentProfile === 'caissier') {

return window.app.cashRegisters.filter(c => c.companyId === window.app.currentCompany);

} else if (window.app.currentCompany) {

return window.app.cashRegisters.filter(c => c.companyId === window.app.currentCompany);

}

return window.app.cashRegisters;

}

function loadReports() {

// Vérifier si une entreprise est sélectionnée (sauf pour caissier et admin global)

if (!window.app.currentCompany && window.app.currentProfile !== 'caissier' && window.app.currentProfile !== 'admin') {

document.getElementById('mainContent').innerHTML = `

<div class="text-center p-8">

<div class="w-16 h-16 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4">

<i class="fas fa-exclamation-triangle text-2xl"></i>

</div>

<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Entreprise requise</h3>

<p class="text-gray-600 dark:text-gray-400 mt-2">Veuillez sélectionner une entreprise pour voir les rapports.</p>

<button onclick="showCompanySelector()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

Sélectionner une entreprise

</button>

</div>

`;

return;

}

const content = `

<div class="space-y-6">

<div class="flex justify-between items-center">

<h2 class="text-2xl font-bold text-gray-900 dark:text-white">

Rapports et États Financiers

${window.app.currentCompany ? ` - ${app.getCompanyName()}` : ''}

</h2>

<div class="text-sm font-medium text-primary-light bg-primary/10 px-3 py-1 rounded-lg">

<i class="fas fa-building mr-2"></i>SYSCOHADA Révisé

</div>

</div>

<!-- Sélection de période -->

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sélection de période</h3>

<div class="grid grid-cols-1 md:grid-cols-5 gap-4">

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Du</label>

<input type="date" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"

value="${new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}">

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Au</label>

<input type="date" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"

value="${new Date().toISOString().split('T')[0]}">

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Format</label>

<select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

<option value="pdf">PDF</option>

<option value="excel">Excel</option>

<option value="preview">Aperçu</option>

</select>

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Journal</label>

<select class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

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

<button class="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

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

<button onclick="viewReport('journal')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('grandlivre')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('balance')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('bilan')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('resultat')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('tafire')" class="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<button onclick="viewReport('cash-daily')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

<div class="text-center">

<i class="fas fa-file-alt text-2xl text-warning mb-2"></i>

<div class="font-medium text-gray-900 dark:text-white">État journalier</div>

</div>

</button>

<button onclick="viewReport('cash-weekly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

<div class="text-center">

<i class="fas fa-calendar-week text-2xl text-info mb-2"></i>

<div class="font-medium text-gray-900 dark:text-white">Rapport hebdomadaire</div>

</div>

</button>

<button onclick="viewReport('cash-monthly')" class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

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

<i class="fas fa-upload mr-2"></i>Compatible SYSCOHADA

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

<li>• Taille maximale : 10 Mo</li>

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

<p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Glissez votre fichier ici ou cliquez pour le sélectionner</p>

<p class="text-sm text-gray-500 dark:text-gray-400">Formats pris en charge : Excel, CSV (max. 10 Mo)</p>

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

<!-- Historique des importations -->

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">

<div class="p-6 border-b border-gray-200 dark:border-gray-700">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Historique des importations</h3>

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

<button onclick="viewImportDetails(1)" class="text-primary hover:text-primary/80" title="Voir les détails">

<i class="fas fa-eye"></i>

</button>

<button onclick="downloadImportLog(1)" class="text-info hover:text-info/80" title="Télécharger le journal">

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

<button onclick="viewImportDetails(2)" class="text-primary hover:text-primary/80" title="Voir les détails">

<i class="fas fa-eye"></i>

</button>

<button onclick="downloadImportLog(2)" class="text-info hover:text-info/80" title="Télécharger le journal">

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

<input type="text" value="${window.app.currentUser.name}"

class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>

<input type="email" value="${window.app.currentUser.email}"

class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>

<input type="tel" value="+225 07 XX XX XX XX"

class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base">

</div>

<div>

<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profil</label>

<input type="text" value="${window.app.currentUser.role}" readonly

class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg

bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-base">

<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Seul l'administrateur peut modifier votre profil</p>

</div>

</div>

<div class="mt-6 flex justify-between">

<button onclick="saveProfile()" class="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-save mr-2"></i>Sauvegarder

</button>

<button onclick="changePassword()" class="bg-warning hover:bg-warning/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-key mr-2"></i>Changer le mot de passe

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

<div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center" id="logoPreview">

<i class="fas fa-image text-gray-400 text-2xl"></i>

</div>

<div>

<input type="file" id="logoFile" accept="image/*" class="hidden" onchange="handleLogoUpload(event)">

<button onclick="document.getElementById('logoFile').click()" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-upload mr-2"></i>Télécharger le logo

</button>

<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Format accepté : JPG, PNG (max 2 Mo)</p>

</div>

<button onclick="saveLogo()" class="bg-success hover:bg-success/90 text-white px-4 py-2 rounded-lg font-medium transition-colors hidden" id="saveLogoBtn">

<i class="fas fa-save mr-2"></i>Enregistrer

</button>

</div>

</div>

<!-- Gestion des données (Admin) -->

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">

<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">

<i class="fas fa-database mr-2 text-danger"></i>Gestion des Données (Admin)

</h3>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

<button onclick="clearTestData()" class="bg-warning hover:bg-warning/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">

<i class="fas fa-trash mr-3"></i>Supprimer les données de test

<div class="text-xs mt-1 opacity-80">Attention : action irréversible</div>

</button>

<button onclick="exportAllData()" class="bg-success hover:bg-success/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">

<i class="fas fa-download mr-3"></i>Exporter toutes les données

<div class="text-xs mt-1 opacity-80">Sauvegarde complète du système</div>

</button>

<button onclick="importData()" class="bg-info hover:bg-info/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">

<i class="fas fa-upload mr-3"></i>Importer des données

<div class="text-xs mt-1 opacity-80">Restauration système</div>

</button>

<button onclick="generateTestData()" class="bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left">

<i class="fas fa-magic mr-3"></i>Générer des données de test

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

<p class="text-sm text-gray-600 dark:text-gray-400">Dernière connexion : Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR')}</p>

<p class="text-sm text-gray-600 dark:text-gray-400">Profil : ${window.app.currentUser.role}</p>

<p class="text-sm text-gray-600 dark:text-gray-400">Navigateur : ${navigator.userAgent.includes('Chrome') ? 'Google Chrome' : 'Autre'}</p>

</div>

<button onclick="logout()" class="bg-danger hover:bg-danger/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">

<i class="fas fa-sign-out-alt mr-2"></i>Déconnexion

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

<p class="text-gray-600 dark:text-gray-400 mt-2">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>

</div>

`;

}

// =============================================================================

// FONCTIONS DE GESTION DES MODALES

// =============================================================================

function openModal(modalId) {

const modal = document.getElementById(modalId);

if (modal) {

modal.classList.add('active');

document.body.style.overflow = 'hidden';

}

}

function closeModal(modalId) {

const modal = document.getElementById(modalId);

if (modal) {

modal.classList.remove('active');

document.body.style.overflow = 'auto';


// Réinitialiser les formulaires

const form = modal.querySelector('form');

if (form) {

form.reset();

}


// Réinitialiser l'état d'édition

app.state.editingItems = {

user: null,

company: null,

entry: null,

account: null,

cash: null

};

}

}

// Gestion des utilisateurs

function openUserModal(userId = null) {

if (userId) {

// Mode édition

const user = window.app.users.find(u => u.id === userId);

if (user) {

app.state.editingItems.user = user;

document.getElementById('userModalTitle').textContent = 'Modifier Collaborateur';

document.getElementById('userFormSubmitText').textContent = 'Modifier';

document.getElementById('userName').value = user.name;

document.getElementById('userEmail').value = user.email;

document.getElementById('userPhone').value = user.phone || '';

document.getElementById('userProfile').value = user.profile;

}

} else {

// Mode création

document.getElementById('userModalTitle').textContent = 'Nouveau Collaborateur';

document.getElementById('userFormSubmitText').textContent = 'Créer';

}


// Charger les entreprises disponibles

loadCompaniesCheckboxes();

openModal('userModal');

}

function loadCompaniesCheckboxes() {

const container = document.getElementById('companiesCheckboxes');

const currentUser = app.state.editingItems.user;


container.innerHTML = window.app.companies.map(company => `

<label class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">

<input type="checkbox" value="${company.id}"

class="text-primary focus:ring-primary"

${currentUser && currentUser.assignedCompanies?.includes(company.id) ? 'checked' : ''}>

<span class="text-sm text-gray-700 dark:text-gray-300">${company.name}</span>

</label>

`).join('');

}

// Gestion des entreprises

function openCompanyModal(companyId = null) {

if (companyId) {

// Mode édition

const company = window.app.companies.find(c => c.id === companyId);

if (company) {

app.state.editingItems.company = company;

document.getElementById('companyModalTitle').textContent = 'Modifier Entreprise';

document.getElementById('companyFormSubmitText').textContent = 'Modifier';

document.getElementById('companyName').value = company.name;

document.getElementById('companyType').value = company.type;

document.getElementById('companySystem').value = company.system;

document.getElementById('companyPhone').value = company.phone;

document.getElementById('companyAddress').value = company.address;

document.getElementById('companyCashRegisters').value = company.cashRegisters;

document.getElementById('companyStatus').value = company.status;

}

} else {

// Mode création

document.getElementById('companyModalTitle').textContent = 'Nouvelle Entreprise';

document.getElementById('companyFormSubmitText').textContent = 'Créer';

}


openModal('companyModal');

}

// Gestion des écritures

function openEntryModal(entryId = null) {

if (entryId) {

// Mode édition

const entry = window.app.entries.find(e => e.id === entryId);

if (entry) {

app.state.editingItems.entry = entry;

document.getElementById('entryModalTitle').textContent = 'Modifier Écriture';

document.getElementById('entryFormSubmitText').textContent = 'Modifier';

document.getElementById('entryDate').value = entry.date;

document.getElementById('entryJournal').value = entry.journal;

document.getElementById('entryPiece').value = entry.piece;

document.getElementById('entryLibelle').value = entry.libelle;


// Charger les lignes d'écriture

loadEntryLines(entry.lines);

}

} else {

// Mode création

document.getElementById('entryModalTitle').textContent = 'Nouvelle Écriture';

document.getElementById('entryFormSubmitText').textContent = 'Enregistrer';

document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];


// Générer le numéro de pièce automatique

generatePieceNumber();


// Ajouter deux lignes par défaut

addEntryLine();

addEntryLine();

}


openModal('entryModal');

}

function generatePieceNumber() {

const journal = document.getElementById('entryJournal').value || 'JG';

const date = new Date();

const year = date.getFullYear();

const month = (date.getMonth() + 1).toString().padStart(2, '0');

const sequence = (window.app.entries.length + 1).toString().padStart(4, '0');


document.getElementById('entryPiece').value = `${journal}-${year}-${month}-${sequence}`;

}

function addEntryLine() {

const container = document.getElementById('entryLines');

const lineIndex = container.children.length;


const lineHtml = `

<div class="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">

<div>

<select class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm

bg-white dark:bg-gray-700 text-gray-900 dark:text-white"

onchange="updateAccountName(this, ${lineIndex})">

<option value="">Compte</option>

${window.app.accounts.map(acc => `<option value="${acc.code}">${acc.code} - ${acc.name}</option>`).join('')}

</select>

</div>

<div>

<input type="text" placeholder="Libellé"

class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm

bg-white dark:bg-gray-700 text-gray-900 dark:text-white">

</div>

<div>

<input type="number" placeholder="Débit" min="0" step="1"

class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm

bg-white dark:bg-gray-700 text-gray-900 dark:text-white"

onchange="updateTotals()">

</div>

<div>

<input type="number" placeholder="Crédit" min="0" step="1"

class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm

bg-white dark:bg-gray-700 text-gray-900 dark:text-white"

onchange="updateTotals()">

</div>

<div class="flex justify-center">

<button type="button" onclick="removeEntryLine(this)"

class="text-danger hover:text-danger/80 p-1" title="Supprimer">

<i class="fas fa-trash text-sm"></i>

</button>

</div>

</div>

`;


container.insertAdjacentHTML('beforeend', lineHtml);

updateTotals();

}

function removeEntryLine(button) {

const line = button.closest('.grid');

if (line && document.getElementById('entryLines').children.length > 1) {

line.remove();

updateTotals();

}

}

function updateAccountName(select, lineIndex) {

const account = window.app.accounts.find(acc => acc.code === select.value);

if (account) {

// Optionnellement remplir automatiquement le libellé

const libellleInput = select.closest('.grid').querySelector('input[placeholder="Libellé"]');

if (libellleInput && !libellleInput.value) {

libellleInput.value = account.name;

}

}

}

function updateTotals() {

const lines = document.querySelectorAll('#entryLines .grid');

let totalDebit = 0;

let totalCredit = 0;


lines.forEach(line => {

const debitInput = line.querySelector('input[placeholder="Débit"]');

const creditInput = line.querySelector('input[placeholder="Crédit"]');


totalDebit += parseFloat(debitInput.value) || 0;

totalCredit += parseFloat(creditInput.value) || 0;

});


document.getElementById('totalDebit').textContent = totalDebit.toLocaleString('fr-FR');

document.getElementById('totalCredit').textContent = totalCredit.toLocaleString('fr-FR');


const difference = totalDebit - totalCredit;

const diffElement = document.getElementById('totalDifference');

diffElement.textContent = Math.abs(difference).toLocaleString('fr-FR');

diffElement.className = difference === 0 ? 'text-success' : 'text-danger';

}

function loadEntryLines(lines) {

const container = document.getElementById('entryLines');

container.innerHTML = '';


lines.forEach(line => {

addEntryLine();

const lastLine = container.lastElementChild;

const inputs = lastLine.querySelectorAll('select, input');


inputs[0].value = line.account; // Compte

inputs[1].value = line.libelle; // Libellé

inputs[2].value = line.debit; // Débit

inputs[3].value = line.credit; // Crédit

});


updateTotals();

}

// Gestion des comptes

function openAccountModal(accountCode = null) {

if (accountCode) {

// Mode édition

const account = window.app.accounts.find(a => a.code === accountCode);

if (account) {

app.state.editingItems.account = account;

document.getElementById('accountModalTitle').textContent = 'Modifier Compte';

document.getElementById('accountFormSubmitText').textContent = 'Modifier';

document.getElementById('accountCode').value = account.code;

document.getElementById('accountName').value = account.name;

document.getElementById('accountCategory').value = account.category;

document.getElementById('accountClass').value = account.class;

document.getElementById('accountCode').readOnly = true;

}

} else {

// Mode création

document.getElementById('accountModalTitle').textContent = 'Nouveau Compte';

document.getElementById('accountFormSubmitText').textContent = 'Créer';

document.getElementById('accountCode').readOnly = false;

}


openModal('accountModal');

}

// Gestion des caisses

function openCashModal(cashId = null) {

if (cashId) {

// Mode édition

const cash = window.app.cashRegisters.find(c => c.id === cashId);

if (cash) {

app.state.editingItems.cash = cash;

document.getElementById('cashModalTitle').textContent = 'Modifier Caisse';

document.getElementById('cashFormSubmitText').textContent = 'Modifier';

document.getElementById('cashName').value = cash.name;

document.getElementById('cashResponsible').value = cash.responsibleId;

document.getElementById('cashBalance').value = cash.balance;

document.getElementById('cashStatus').value = cash.status;

}

} else {

// Mode création

document.getElementById('cashModalTitle').textContent = 'Nouvelle Caisse';

document.getElementById('cashFormSubmitText').textContent = 'Créer';

}


// Charger les responsables disponibles

loadCashResponsibles();

openModal('cashModal');

}

function loadCashResponsibles() {

const select = document.getElementById('cashResponsible');

const users = window.app.users.filter(u =>

u.profile === 'caissier' || u.profile === 'user' || u.profile.includes('collaborateur')

);


select.innerHTML = '<option value="">Sélectionner un responsable</option>' +

users.map(user => `<option value="${user.id}">${user.name} (${user.role})</option>`).join('');

}

// =============================================================================

// FONCTIONS DE SOUMISSION DES FORMULAIRES

// =============================================================================

// Gestionnaires d'événements pour les formulaires

document.addEventListener('DOMContentLoaded', function() {

// Formulaire utilisateur

document.getElementById('userForm')?.addEventListener('submit', function(e) {

e.preventDefault();

handleUserSubmit();

});


// Formulaire entreprise

document.getElementById('companyForm')?.addEventListener('submit', function(e) {

e.preventDefault();

handleCompanySubmit();

});


// Formulaire écriture

document.getElementById('entryForm')?.addEventListener('submit', function(e) {

e.preventDefault();

handleEntrySubmit();

});


// Formulaire compte

document.getElementById('accountForm')?.addEventListener('submit', function(e) {

e.preventDefault();

handleAccountSubmit();

});


// Formulaire caisse

document.getElementById('cashForm')?.addEventListener('submit', function(e) {

e.preventDefault();

handleCashSubmit();

});


// Journal select change

document.getElementById('entryJournal')?.addEventListener('change', function() {

generatePieceNumber();

});

});

function handleUserSubmit() {

const formData = {

name: document.getElementById('userName').value,

email: document.getElementById('userEmail').value,

phone: document.getElementById('userPhone').value,

profile: document.getElementById('userProfile').value,

role: getRoleFromProfile(document.getElementById('userProfile').value),

assignedCompanies: Array.from(document.querySelectorAll('#companiesCheckboxes input:checked')).map(cb => parseInt(cb.value)),

companies: Array.from(document.querySelectorAll('#companiesCheckboxes input:checked')).map(cb => parseInt(cb.value))

};


try {

if (app.state.editingItems.user) {

// Modification

app.updateUser(app.state.editingItems.user.id, formData);

app.uiManager.showNotification('success', 'Utilisateur modifié avec succès');

} else {

// Création

app.createUser(formData);

app.uiManager.showNotification('success', 'Utilisateur créé avec succès');

}


closeModal('userModal');

loadUsersManagement(); // Recharger la page

} catch (error) {

app.uiManager.showNotification('error', 'Erreur : ' + error.message);

}

}

function handleCompanySubmit() {

const formData = {

name: document.getElementById('companyName').value,

type: document.getElementById('companyType').value,

system: document.getElementById('companySystem').value,

phone: document.getElementById('companyPhone').value,

address: document.getElementById('companyAddress').value,

cashRegisters: parseInt(document.getElementById('companyCashRegisters').value),

status: document.getElementById('companyStatus').value

};


try {

if (app.state.editingItems.company) {

// Modification

app.updateCompany(app.state.editingItems.company.id, formData);

app.uiManager.showNotification('success', 'Entreprise modifiée avec succès');

} else {

// Création

app.createCompany(formData);

app.uiManager.showNotification('success', 'Entreprise créée avec succès');

}


closeModal('companyModal');

loadCompanies(); // Recharger la page

app.uiManager.updateCompanySelector(); // Mettre à jour le sélecteur

} catch (error) {

app.uiManager.showNotification('error', 'Erreur : ' + error.message);

}

}

function handleEntrySubmit() {

// Vérifier l'équilibre

const lines = document.querySelectorAll('#entryLines .grid');

let totalDebit = 0;

let totalCredit = 0;

const entryLines = [];


lines.forEach(line => {

const select = line.querySelector('select');

const inputs = line.querySelectorAll('input');


if (select.value && (inputs[1].value || inputs[2].value)) {

const account = window.app.accounts.find(acc => acc.code === select.value);

const debit = parseFloat(inputs[1].value) || 0;

const credit = parseFloat(inputs[2].value) || 0;


entryLines.push({

account: select.value,

accountName: account ? account.name : '',

libelle: inputs[0].value,

debit: debit,

credit: credit

});


totalDebit += debit;

totalCredit += credit;

}

});


if (Math.abs(totalDebit - totalCredit) > 0.01) {

app.uiManager.showNotification('error', 'L\'écriture n\'est pas équilibrée. Débit et crédit doivent être égaux.');

return;

}


if (entryLines.length < 2) {

app.uiManager.showNotification('error', 'Une écriture doit avoir au minimum 2 lignes.');

return;

}


const formData = {

date: document.getElementById('entryDate').value,

journal: document.getElementById('entryJournal').value,

piece: document.getElementById('entryPiece').value,

libelle: document.getElementById('entryLibelle').value,

companyId: window.app.currentCompany,

lines: entryLines

};


try {

if (app.state.editingItems.entry) {

// Modification

app.updateEntry(app.state.editingItems.entry.id, formData);

app.uiManager.showNotification('success', 'Écriture modifiée avec succès');

} else {

// Création

app.createEntry(formData);

app.uiManager.showNotification('success', 'Écriture créée avec succès');

}


closeModal('entryModal');

loadEntries(); // Recharger la page

} catch (error) {

app.uiManager.showNotification('error', 'Erreur : ' + error.message);

}

}

function handleAccountSubmit() {

const formData = {

code: document.getElementById('accountCode').value,

name: document.getElementById('accountName').value,

category: document.getElementById('accountCategory').value,

class: parseInt(document.getElementById('accountClass').value)

};


try {

if (app.state.editingItems.account) {

// Modification

app.updateAccount(app.state.editingItems.account.code, formData);

app.uiManager.showNotification('success', 'Compte modifié avec succès');

} else {

// Vérifier si le code existe déjà

if (window.app.accounts.find(acc => acc.code === formData.code)) {

app.uiManager.showNotification('error', 'Ce code de compte existe déjà');

return;

}


// Création

app.createAccount(formData);

app.uiManager.showNotification('success', 'Compte créé avec succès');

}


closeModal('accountModal');

loadAccounts(); // Recharger la page

} catch (error) {

app.uiManager.showNotification('error', 'Erreur : ' + error.message);

}

}

function handleCashSubmit() {

const responsibleId = parseInt(document.getElementById('cashResponsible').value);

const responsible = window.app.users.find(u => u.id === responsibleId);


const formData = {

name: document.getElementById('cashName').value,

companyId: window.app.currentCompany,

responsibleId: responsibleId || null,

responsibleName: responsible ? responsible.name : '',

balance: parseFloat(document.getElementById('cashBalance').value),

status: document.getElementById('cashStatus').value

};


try {

if (app.state.editingItems.cash) {

// Modification

app.updateCashRegister(app.state.editingItems.cash.id, formData);

app.uiManager.showNotification('success', 'Caisse modifiée avec succès');

} else {

// Création

app.createCashRegister(formData);

app.uiManager.showNotification('success', 'Caisse créée avec succès');

}


closeModal('cashModal');

loadCaisse(); // Recharger la page

} catch (error) {

app.uiManager.showNotification('error', 'Erreur : ' + error.message);

}

}

function getRoleFromProfile(profile) {

const roles = {

'admin': 'Administrateur',

'collaborateur-senior': 'Collaborateur Senior',

'collaborateur': 'Collaborateur',

'user': 'Utilisateur',

'caissier': 'Caissier'

};

return roles[profile] || 'Utilisateur';

}

// =============================================================================

// FONCTIONS D'ACTIONS CRUD

// =============================================================================

// Actions utilisateurs

function viewUser(userId) {

const user = window.app.users.find(u => u.id === userId);

if (user) {

alert(`Détails utilisateur:\n\nNom: ${user.name}\nEmail: ${user.email}\nRôle: ${user.role}\nStatut: ${user.status}\nEntreprises: ${user.assignedCompanies?.length || 0}`);

}

}

function editUser(userId) {

openUserModal(userId);

}

function deleteUser(userId) {

const user = window.app.users.find(u => u.id === userId);

if (user && confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?\n\nCette action est irréversible.`)) {

try {

app.deleteUser(userId);

app.uiManager.showNotification('success', 'Utilisateur supprimé avec succès');

loadUsersManagement();

} catch (error) {

app.uiManager.showNotification('error', 'Erreur lors de la suppression : ' + error.message);

}

}

}

function manageUserCompanies(userId) {

const user = window.app.users.find(u => u.id === userId);

if (user) {

openUserModal(userId); // Réutiliser le modal d'édition qui contient la gestion des entreprises

}

}

// Actions entreprises

function viewCompany(companyId) {

const company = window.app.companies.find(c => c.id === companyId);

if (company) {

alert(`Détails entreprise:\n\nNom: ${company.name}\nType: ${company.type}\nSystème: ${company.system}\nTéléphone: ${company.phone}\nAdresse: ${company.address}\nStatut: ${company.status}\nCaisses: ${company.cashRegisters}`);

}

}

function editCompany(companyId) {

openCompanyModal(companyId);

}

function deleteCompany(companyId) {

const company = window.app.companies.find(c => c.id === companyId);

if (company && confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ?\n\nCette action supprimera aussi toutes les données liées (écritures, caisses, etc.).\nCette action est irréversible.`)) {

try {

app.deleteCompany(companyId);

app.uiManager.showNotification('success', 'Entreprise supprimée avec succès');

loadCompanies();

app.uiManager.updateCompanySelector();

} catch (error) {

app.uiManager.showNotification('error', 'Erreur lors de la suppression : ' + error.message);

}

}

}

// Actions écritures

function viewEntry(entryId) {

const entry = window.app.entries.find(e => e.id === entryId);

if (entry) {

const details = entry.lines.map(line =>

`${line.account} - ${line.accountName}: ${line.libelle} | Débit: ${line.debit.toLocaleString('fr-FR')} | Crédit: ${line.credit.toLocaleString('fr-FR')}`

).join('\n');


alert(`Détails écriture:\n\nDate: ${new Date(entry.date).toLocaleDateString('fr-FR')}\nJournal: ${entry.journal}\nPièce: ${entry.piece}\nLibellé: ${entry.libelle}\nStatut: ${entry.status}\n\nLignes:\n${details}`);

}

}

function editEntry(entryId) {

openEntryModal(entryId);

}

function deleteEntry(entryId) {

const entry = window.app.entries.find(e => e.id === entryId);

if (entry && confirm(`Êtes-vous sûr de vouloir supprimer l'écriture "${entry.piece}" ?\n\nCette action est irréversible.`)) {

try {

app.deleteEntry(entryId);

app.uiManager.showNotification('success', 'Écriture supprimée avec succès');

loadEntries();

} catch (error) {

app.uiManager.showNotification('error', 'Erreur lors de la suppression : ' + error.message);

}

}

}

// Actions comptes

function editAccount(accountCode) {

openAccountModal(accountCode);

}

function deleteAccount(accountCode) {

const account = window.app.accounts.find(a => a.code === accountCode);

if (account && confirm(`Êtes-vous sûr de vouloir supprimer le compte "${accountCode} - ${account.name}" ?\n\nCette action est irréversible.`)) {

try {

app.deleteAccount(accountCode);

app.uiManager.showNotification('success', 'Compte supprimé avec succès');

loadAccounts();

} catch (error) {

app.uiManager.showNotification('error', 'Erreur lors de la suppression : ' + error.message);

}

}

}

// Actions caisses

function viewCash(cashId) {

const cash = window.app.cashRegisters.find(c => c.id === cashId);

if (cash) {

alert(`Détails caisse:\n\nNom: ${cash.name}\nResponsable: ${cash.responsibleName}\nSolde: ${cash.balance.toLocaleString('fr-FR')} FCFA\nStatut: ${cash.status}\nSolde ouverture: ${cash.openingBalance.toLocaleString('fr-FR')} FCFA\nRecettes du jour: ${cash.dailyReceipts.toLocaleString('fr-FR')} FCFA\nDépenses du jour: ${cash.dailyExpenses.toLocaleString('fr-FR')} FCFA`);

}

}

function editCash(cashId) {

openCashModal(cashId);

}

function deleteCash(cashId) {

const cash = window.app.cashRegisters.find(c => c.id === cashId);

if (cash && confirm(`Êtes-vous sûr de vouloir supprimer la caisse "${cash.name}" ?\n\nCette action est irréversible.`)) {

try {

app.deleteCashRegister(cashId);

app.uiManager.showNotification('success', 'Caisse supprimée avec succès');

loadCaisse();

} catch (error) {

app.uiManager.showNotification('error', 'Erreur lors de la suppression : ' + error.message);

}

}

}

// =============================================================================

// FONCTIONS UTILITAIRES

// =============================================================================

function updateUserInfo() {

if (!window.app?.currentUser) return;

const elements = {

currentUserName: window.app.currentUser.name,

currentUserRole: window.app.currentUser.role,

sidebarUserName: window.app.currentUser.name,

sidebarUserProfile: window.app.currentUser.role,

userInitials: window.app.currentUser.name.split(' ').map(n => n[0]).join('')

};

Object.entries(elements).forEach(([id, value]) => {

const element = document.getElementById(id);

if (element) element.textContent = value;

});

}

function selectCompany(companyId) {

if (!window.app) return;

const id = parseInt(companyId);

if (id && window.app.companies.find(c => c.id === id)) {

window.app.currentCompany = id;

app.state.currentCompany = id;


// Synchroniser et mettre à jour l'interface

app.syncWithGlobalApp();

app.uiManager.updateCompanyInfo();


// Recharger le dashboard avec la nouvelle entreprise

loadDashboard();


console.log('✅ Entreprise sélectionnée:', app.getCompanyName());

}

}

function logout() {

if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {

// Réinitialiser l'état

app.state.currentUser = null;

app.state.currentProfile = null;

app.state.currentCompany = null;

app.state.isAuthenticated = false;


window.app = null;


// Afficher la page de connexion

document.getElementById('mainApp').classList.add('hidden');

document.getElementById('loginPage').classList.remove('hidden');


// Réinitialiser le formulaire

document.getElementById('loginForm').reset();


console.log('✅ Déconnexion réussie');

}

}

// Actions rapports

function viewReport(type) {

app.uiManager.showNotification('info', `Génération du rapport "${type}" en cours...`);

console.log('📊 Génération du rapport:', type);


// Simulation d'ouverture du rapport

setTimeout(() => {

const reportUrl = `data:text/html,<html><head><title>Rapport ${type}</title></head><body><h1>Rapport ${type}</h1><p>Contenu du rapport pour l'entreprise: ${app.getCompanyName()}</p></body></html>`;

window.open(reportUrl, '_blank');

}, 1000);

}

function downloadReport(type) {

app.uiManager.showNotification('info', `Téléchargement du rapport "${type}" en cours...`);

console.log('📥 Téléchargement du rapport:', type);

}

function printCashReport() {

app.uiManager.showNotification('info', 'Impression de l\'état de caisse...');

window.print();

}

// Actions import

function downloadExcelTemplate() {

app.uiManager.showNotification('info', 'Téléchargement du modèle Excel...');

console.log('📥 Téléchargement du modèle Excel');

}

function handleFileSelect(event) {

const file = event.target.files[0];

if (file) {

document.getElementById('fileName').textContent = file.name;

document.getElementById('fileSize').textContent = `${(file.size / 1024 / 1024).toFixed(2)} Mo`;

document.getElementById('fileInfo').classList.remove('hidden');

}

}

function startImport() {

app.uiManager.showNotification('info', 'Import en cours...');

console.log('📤 Démarrage de l\'import');

}

function viewImportDetails(importId) {

app.uiManager.showNotification('info', `Affichage des détails de l'import ${importId}...`);

}

function downloadImportLog(importId) {

app.uiManager.showNotification('info', `Téléchargement du journal d'import ${importId}...`);

}

// Actions filtrage

function filterAccounts() {

const searchTerm = document.getElementById('accountSearch').value.toLowerCase();

const categoryFilter = document.getElementById('categoryFilter').value;

const classFilter = document.getElementById('classFilter').value;


let filteredAccounts = window.app.accounts;


if (searchTerm) {

filteredAccounts = filteredAccounts.filter(acc =>

acc.code.toLowerCase().includes(searchTerm) ||

acc.name.toLowerCase().includes(searchTerm)

);

}


if (categoryFilter) {

filteredAccounts = filteredAccounts.filter(acc => acc.category === categoryFilter);

}


if (classFilter) {

filteredAccounts = filteredAccounts.filter(acc => acc.class == classFilter);

}


// Mettre à jour l'affichage

const container = document.getElementById('accountsList');

container.innerHTML = filteredAccounts.map(account => `

<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">

<div class="font-mono text-sm text-primary font-semibold">${account.code}</div>

<div class="font-medium text-gray-900 dark:text-white text-sm mt-1">${account.name}</div>

<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${account.category}</div>

<div class="text-xs text-gray-500 dark:text-gray-400">Classe ${account.class || 'N/A'}</div>

${window.app.currentProfile !== 'caissier' ? `

<div class="mt-2 flex space-x-2">

<button onclick="editAccount('${account.code}')" class="text-primary hover:text-primary/80 text-xs" title="Modifier">

<i class="fas fa-edit"></i>

</button>

<button onclick="deleteAccount('${account.code}')" class="text-danger hover:text-danger/80 text-xs" title="Supprimer">

<i class="fas fa-trash"></i>

</button>

</div>

` : ''}

</div>

`).join('');


app.uiManager.showNotification('info', `${filteredAccounts.length} compte(s) trouvé(s)`);

}

// Actions paramètres

function saveProfile() {

app.uiManager.showNotification('success', 'Profil sauvegardé avec succès');

}

function changePassword() {

const newPassword = prompt('Entrez votre nouveau mot de passe:');

if (newPassword && newPassword.length >= 6) {

app.uiManager.showNotification('success', 'Mot de passe modifié avec succès');

} else if (newPassword) {

app.uiManager.showNotification('error', 'Le mot de passe doit contenir au moins 6 caractères');

}

}

function handleLogoUpload(event) {

const file = event.target.files[0];

if (file) {

if (file.size > 2 * 1024 * 1024) {

app.uiManager.showNotification('error', 'Le fichier doit faire moins de 2 Mo');

return;

}


const reader = new FileReader();

reader.onload = function(e) {

const preview = document.getElementById('logoPreview');

preview.innerHTML = `<img src="${e.target.result}" alt="Logo" class="w-full h-full object-cover rounded-lg">`;

document.getElementById('saveLogoBtn').classList.remove('hidden');

};

reader.readAsDataURL(file);

}

}

function saveLogo() {

app.uiManager.showNotification('success', 'Logo sauvegardé avec succès');

document.getElementById('saveLogoBtn').classList.add('hidden');

}

function clearTestData() {

if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?\n\nCette action est irréversible.')) {

app.uiManager.showNotification('warning', 'Suppression des données de test...');

}

}

function exportAllData() {

app.uiManager.showNotification('info', 'Export des données en cours...');

}

function importData() {

app.uiManager.showNotification('info', 'Fonction d\'import à implémenter...');

}

function generateTestData() {

app.uiManager.showNotification('info', 'Génération de données de test...');

}

// =============================================================================

// INITIALISATION ET ÉVÉNEMENTS

// =============================================================================

// Variables globales

let app;

// Initialisation de l'application

document.addEventListener('DOMContentLoaded', function() {

console.log('🔄 Initialisation de DOUKÈ Compta Pro...');


app = new DoukèComptaPro();

app.initializeDefaultData();


// Gestionnaire de connexion

document.getElementById('loginForm').addEventListener('submit', async function(e) {

e.preventDefault();


const email = document.getElementById('loginEmail').value;

const password = document.getElementById('loginPassword').value;


try {

const result = await app.authenticate(email, password);


if (result.success) {

// Masquer la page de connexion

document.getElementById('loginPage').classList.add('hidden');

document.getElementById('mainApp').classList.remove('hidden');


// Initialiser l'interface principale

initializeMainApp();


app.uiManager.showNotification('success', `Bienvenue ${result.user.name} !`);

console.log('✅ Connexion réussie pour:', result.user.name);

}

} catch (error) {

app.uiManager.showNotification('error', error.message);

console.error('❌ Erreur de connexion:', error);

}

});

});

function initializeMainApp() {

try {

console.log('🔄 Initialisation de l\'interface principale...');

console.log('📊 État de window.app:', {

currentUser: window.app?.currentUser,

currentProfile: window.app?.currentProfile,

currentCompany: window.app?.currentCompany,

isAuthenticated: window.app?.isAuthenticated

});

// Vérifier que window.app est bien défini

if (!window.app || !window.app.currentUser || !window.app.currentProfile) {

console.error('❌ window.app non défini ou incomplet');

app.uiManager.showNotification('error', 'Erreur: Données d\'authentification manquantes');

return;

}

// Charger la navigation

loadNavigationMenu();

// Mettre à jour les informations utilisateur

updateUserInfo();

// Mettre à jour les sélecteurs d'abord

app.uiManager.updateCompanySelector();

app.uiManager.updateCompanyInfo();

// Charger le tableau de bord avec un petit délai pour s'assurer que tout est prêt

setTimeout(() => {

console.log('🔄 Chargement du dashboard...');

loadDashboard();

}, 100);

console.log('✅ Interface principale initialisée avec succès');

} catch (error) {

console.error('❌ Erreur initialisation interface:', error);

app.uiManager.showNotification('error', 'Erreur lors de l\'initialisation: ' + error.message);

}

}

// Fonction pour pré-remplir les identifiants

function fillCredentials(profile) {

const credentials = {

admin: { email: 'admin@doukecompta.ci', password: 'admin123' },

'collaborateur-senior': { email: 'marie.kouassi@cabinet.com', password: 'collab123' },

collaborateur: { email: 'jean.diabate@cabinet.com', password: 'collab123' },

user: { email: 'atraore@sarltech.ci', password: 'user123' },

caissier: { email: 'ikone@caisse.ci', password: 'caisse123' }

};

const cred = credentials[profile];

if (cred) {

document.getElementById('loginEmail').value = cred.email;

document.getElementById('loginPassword').value = cred.password;

console.log('✅ Identifiants pré-remplis pour le profil:', profile);

}

}

// Gestionnaire d'erreurs global

window.addEventListener('error', function(e) {

console.error('❌ Erreur JavaScript:', e.error);

});

window.addEventListener('unhandledrejection', function(e) {

console.error('❌ Promesse rejetée:', e.reason);

});

console.log('🔧 Application DOUKÈ Compta Pro - Version complète améliorée chargée');

</script>

</body>

</html>
