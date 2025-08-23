// =============================================================================
// DOUKÈ Compta Pro - Fichier de Configuration
// config.js - Constantes et paramètres système
// =============================================================================

window.DOUKE_CONFIG = {
    // Configuration générale
    APP: {
        name: 'DOUKÈ Compta Pro',
        version: '3.2.0',
        environment: 'production', // 'development' | 'staging' | 'production'
        debug: false,
        supportEmail: 'support@doukecompta.ci',
        companyWebsite: 'https://doukecompta.ci'
    },

    // Configuration API Backend
    API: {
        baseUrl: 'https://api.doukecompta.com/v1',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        endpoints: {
            auth: '/auth',
            users: '/users',
            companies: '/companies',
            entries: '/entries',
            accounts: '/accounts',
            cashRegisters: '/cash-registers',
            reports: '/reports',
            sync: '/sync',
            backup: '/backup'
        }
    },

    // Configuration de sécurité
    SECURITY: {
        sessionTimeout: 3600000, // 1 heure en ms
        passwordMinLength: 6,
        maxLoginAttempts: 5,
        lockoutDuration: 900000, // 15 minutes
        requirePasswordChange: false,
        encryptionAlgorithm: 'AES-256-GCM'
    },

    // Hiérarchie des rôles SYSCOHADA
    ROLES: {
        ADMIN: {
            level: 5,
            name: 'Administrateur',
            permissions: ['ALL'],
            canManage: ['admin', 'collaborateur_senior', 'collaborateur', 'user', 'caissier'],
            maxCompanies: -1, // illimité
            icon: 'fas fa-crown',
            color: '#DC2626'
        },
        COLLABORATEUR_SENIOR: {
            level: 4,
            name: 'Collaborateur Senior',
            permissions: ['MANAGE_TEAM', 'VALIDATE_ALL', 'CREATE_REPORTS', 'ASSIGN_COMPANIES'],
            canManage: ['collaborateur', 'user', 'caissier'],
            maxCompanies: 10,
            icon: 'fas fa-star',
            color: '#7C3AED'
        },
        COLLABORATEUR: {
            level: 3,
            name: 'Collaborateur',
            permissions: ['VALIDATE_ENTRIES', 'CREATE_REPORTS', 'MANAGE_USERS'],
            canManage: ['user', 'caissier'],
            maxCompanies: 5,
            icon: 'fas fa-users',
            color: '#2563EB'
        },
        USER: {
            level: 2,
            name: 'Utilisateur',
            permissions: ['CREATE_ENTRIES', 'VIEW_REPORTS', 'MANAGE_CASH'],
            canManage: [],
            maxCompanies: 1,
            icon: 'fas fa-user',
            color: '#059669'
        },
        CAISSIER: {
            level: 1,
            name: 'Caissier',
            permissions: ['CASH_OPERATIONS'],
            canManage: [],
            maxCompanies: 1,
            icon: 'fas fa-cash-register',
            color: '#D97706'
        }
    },

    // Types d'entreprises OHADA
    COMPANY_TYPES: {
        'SA': 'Société Anonyme',
        'SARL': 'Société à Responsabilité Limitée',
        'EURL': 'Entreprise Unipersonnelle à Responsabilité Limitée',
        'SAS': 'Société par Actions Simplifiée',
        'SASU': 'Société par Actions Simplifiée Unipersonnelle',
        'SNC': 'Société en Nom Collectif',
        'SCS': 'Société en Commandite Simple',
        'GIE': 'Groupement d\'Intérêt Économique',
        'EI': 'Entreprise Individuelle'
    },

    // Secteurs d'activité
    SECTORS: [
        'Agriculture', 'Industrie', 'BTP', 'Commerce', 'Transport',
        'Télécommunications', 'Services financiers', 'Services aux entreprises',
        'Services aux particuliers', 'Administration', 'Enseignement',
        'Santé', 'Autres services', 'Informatique', 'Consulting'
    ],

    // Configuration SYSCOHADA
    SYSCOHADA: {
        classes: {
            1: 'Comptes de ressources durables',
            2: 'Comptes d\'actif immobilisé',
            3: 'Comptes de stocks',
            4: 'Comptes de tiers',
            5: 'Comptes de trésorerie',
            6: 'Comptes de charges',
            7: 'Comptes de produits',
            8: 'Comptes de résultats'
        },
        journaux: {
            'AC': 'Achats',
            'VE': 'Ventes',
            'BQ': 'Banque',
            'CA': 'Caisse',
            'OD': 'Opérations diverses',
            'AN': 'À nouveau'
        },
        devise: 'FCFA',
        exerciceStart: '01/01',
        exerciceEnd: '31/12'
    },

    // Configuration interface
    UI: {
        theme: {
            primary: '#5D5CDE',
            secondary: '#1D4ED8',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            info: '#3B82F6'
        },
        pagination: {
            defaultPageSize: 20,
            pageSizes: [10, 20, 50, 100]
        },
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: {
            symbol: 'FCFA',
            decimals: 0,
            thousandsSeparator: ' ',
            decimalSeparator: ','
        }
    },

    // Configuration des notifications
    NOTIFICATIONS: {
        position: 'top-right',
        duration: 5000,
        maxVisible: 5,
        enableSound: true,
        enablePush: false
    },

    // Configuration cache et stockage
    STORAGE: {
        prefix: 'douke_',
        cacheTimeout: 300000, // 5 minutes
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        enableOffline: true,
        syncInterval: 300000, // 5 minutes
        autoSaveInterval: 60000 // 1 minute
    },

    // Limites système
    LIMITS: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxEntriesPerPage: 100,
        maxAccountsPerLevel: 1000,
        maxUsersPerCompany: 50,
        maxCashRegistersPerCompany: 10
    },

    // Messages système
    MESSAGES: {
        success: {
            login: 'Connexion réussie',
            logout: 'Déconnexion effectuée',
            save: 'Données sauvegardées',
            delete: 'Élément supprimé',
            update: 'Modification effectuée'
        },
        error: {
            network: 'Erreur de connexion réseau',
            unauthorized: 'Accès non autorisé',
            validation: 'Données invalides',
            server: 'Erreur serveur',
            notFound: 'Élément introuvable'
        },
        confirm: {
            delete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            logout: 'Voulez-vous vraiment vous déconnecter ?',
            unsaved: 'Des modifications non sauvegardées seront perdues'
        }
    },

    // Configuration développement
    DEV: {
        enableLogging: true,
        enableProfiler: true,
        showPerformanceMetrics: true,
        enableMockData: true,
        bypassAuth: false
    },

    // Validation des données
    VALIDATION: {
        account: {
            codeLength: 6,
            nameMaxLength: 100,
            requiredFields: ['code', 'name', 'category', 'type']
        },
        entry: {
            maxLines: 50,
            maxAmount: 999999999999,
            requiredFields: ['date', 'journal', 'libelle', 'lines']
        },
        user: {
            nameMaxLength: 100,
            emailMaxLength: 255,
            phonePattern: /^(\+225\s?)?[0-9\s-]{8,15}$/
        },
        company: {
            nameMaxLength: 100,
            rccmPattern: /^CI-[A-Z]{3}-[0-9]{4}-[A-Z]-[0-9]{5}$/,
            nifPattern: /^[0-9]{10}$/
        }
    }
};

// Fonctions utilitaires de configuration
window.DOUKE_CONFIG.getRoleConfig = function(roleKey) {
    return this.ROLES[roleKey.toUpperCase()] || null;
};

window.DOUKE_CONFIG.getApiUrl = function(endpoint) {
    return this.API.baseUrl + (this.API.endpoints[endpoint] || '');
};

window.DOUKE_CONFIG.formatCurrency = function(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: this.UI.currency.decimals,
        maximumFractionDigits: this.UI.currency.decimals
    }).format(amount) + ' ' + this.UI.currency.symbol;
};

window.DOUKE_CONFIG.formatDate = function(date) {
    return new Date(date).toLocaleDateString('fr-FR');
};

console.log('✅ Configuration DOUKÈ Compta Pro chargée');
