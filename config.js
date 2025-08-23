// =============================================================================
// 🔧 DOUKÈ Compta Pro - Configuration Avancée v3.2
// =============================================================================

(function() {
    'use strict';

    console.log('🔧 Chargement du module Configuration...');

    // =============================================================================
    // 🌍 CONFIGURATION MULTI-ENVIRONNEMENTS
    // =============================================================================
    window.ADVANCED_CONFIG = {
        // Environnements
        environments: {
            development: {
                apiBaseUrl: 'http://localhost:3000/api/v1',
                debug: true,
                enableMocking: true,
                logLevel: 'debug'
            },
            staging: {
                apiBaseUrl: 'https://staging-api.doukecompta.com/v1',
                debug: true,
                enableMocking: false,
                logLevel: 'info'
            },
            production: {
                apiBaseUrl: 'https://api.doukecompta.com/v1',
                debug: false,
                enableMocking: false,
                logLevel: 'error'
            }
        },

        // Configuration comptable SYSCOHADA
        accounting: {
            currency: {
                primary: 'FCFA',
                symbol: 'FCFA',
                decimalPlaces: 0,
                thousandSeparator: ' ',
                decimalSeparator: ','
            },
            
            exercice: {
                startMonth: 1, // Janvier
                endMonth: 12,  // Décembre
                defaultDuration: 12 // mois
            },

            journals: {
                'AC': { name: 'Achats', color: '#ef4444', prefix: 'FC' },
                'VE': { name: 'Ventes', color: '#22c55e', prefix: 'FA' },
                'BQ': { name: 'Banque', color: '#3b82f6', prefix: 'BQ' },
                'CA': { name: 'Caisse', color: '#f59e0b', prefix: 'CA' },
                'OD': { name: 'Opérations Diverses', color: '#8b5cf6', prefix: 'OD' },
                'AN': { name: 'A-nouveaux', color: '#6b7280', prefix: 'AN' },
                'EX': { name: 'Extourne', color: '#dc2626', prefix: 'EX' }
            },

            classes: {
                1: { name: 'Ressources durables', type: 'Passif', nature: 'Credit' },
                2: { name: 'Actif immobilisé', type: 'Actif', nature: 'Debit' },
                3: { name: 'Stocks', type: 'Actif', nature: 'Debit' },
                4: { name: 'Tiers', type: 'Mixte', nature: 'Mixte' },
                5: { name: 'Trésorerie', type: 'Actif', nature: 'Debit' },
                6: { name: 'Charges', type: 'Charge', nature: 'Debit' },
                7: { name: 'Produits', type: 'Produit', nature: 'Credit' },
                8: { name: 'Résultats', type: 'Résultat', nature: 'Mixte' }
            }
        },

        // Permissions et rôles
        roles: {
            admin: {
                label: 'Administrateur',
                level: 5,
                permissions: ['ALL'],
                color: '#dc2626',
                icon: 'fas fa-crown'
            },
            collaborateur_senior: {
                label: 'Collaborateur Senior',
                level: 4,
                permissions: ['MANAGE_TEAM', 'VALIDATE_ALL', 'CREATE_REPORTS', 'MANAGE_COMPANIES'],
                color: '#7c3aed',
                icon: 'fas fa-star'
            },
            collaborateur: {
                label: 'Collaborateur',
                level: 3,
                permissions: ['VALIDATE_ENTRIES', 'CREATE_REPORTS', 'VIEW_ALL'],
                color: '#2563eb',
                icon: 'fas fa-users'
            },
            user: {
                label: 'Utilisateur',
                level: 2,
                permissions: ['CREATE_ENTRIES', 'VIEW_REPORTS', 'VIEW_OWN'],
                color: '#059669',
                icon: 'fas fa-user'
            },
            caissier: {
                label: 'Caissier',
                level: 1,
                permissions: ['CASH_OPERATIONS', 'VIEW_CASH_REPORTS'],
                color: '#ea580c',
                icon: 'fas fa-cash-register'
            }
        },

        // Limites et quotas
        limits: {
            maxEntriesPerBatch: 1000,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxUsers: 100,
            maxCompanies: 50,
            sessionTimeout: 8 * 60 * 60 * 1000, // 8 heures
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000 // 15 minutes
        },

        // Configuration UI
        ui: {
            pagination: {
                defaultPageSize: 20,
                pageSizeOptions: [10, 20, 50, 100]
            },
            
            dateFormats: {
                display: 'DD/MM/YYYY',
                input: 'YYYY-MM-DD',
                storage: 'YYYY-MM-DDTHH:mm:ssZ'
            },

            themes: {
                light: {
                    primary: '#5D5CDE',
                    secondary: '#64748b',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    info: '#3b82f6'
                },
                dark: {
                    primary: '#6366f1',
                    secondary: '#94a3b8',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#f87171',
                    info: '#60a5fa'
                }
            }
        },

        // Configuration des rapports
        reports: {
            formats: ['PDF', 'Excel', 'CSV'],
            templates: {
                bilan: 'template_bilan_syscohada.html',
                resultat: 'template_resultat_syscohada.html',
                balance: 'template_balance_generale.html',
                grand_livre: 'template_grand_livre.html'
            },
            
            exportOptions: {
                pdf: {
                    format: 'A4',
                    orientation: 'portrait',
                    margin: { top: 20, right: 20, bottom: 20, left: 20 }
                },
                excel: {
                    sheetName: 'Données',
                    includeFormulas: true,
                    autoWidth: true
                }
            }
        },

        // Configuration de sécurité
        security: {
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
                maxAge: 90 * 24 * 60 * 60 * 1000 // 90 jours
            },

            encryption: {
                algorithm: 'AES-256-GCM',
                keyLength: 32,
                ivLength: 16
            },

            audit: {
                enabled: true,
                logLevel: 'info',
                maxLogSize: 50 * 1024 * 1024, // 50MB
                retentionDays: 365
            }
        },

        // Configuration de synchronisation
        sync: {
            enabled: true,
            interval: 5 * 60 * 1000, // 5 minutes
            batchSize: 100,
            retryAttempts: 3,
            retryDelay: 2000,
            
            endpoints: {
                users: '/users/sync',
                companies: '/companies/sync',
                entries: '/entries/sync',
                accounts: '/accounts/sync',
                cashRegisters: '/cash-registers/sync'
            }
        }
    };

    // =============================================================================
    // 🛠️ GESTIONNAIRE DE CONFIGURATION
    // =============================================================================
    class ConfigurationManager {
        constructor() {
            this.currentEnv = PRODUCTION_CONFIG.environment || 'production';
            this.config = this.mergeConfigs();
            this.watchers = new Map();
        }

        mergeConfigs() {
            const envConfig = window.ADVANCED_CONFIG.environments[this.currentEnv];
            return {
                ...window.ADVANCED_CONFIG,
                ...envConfig,
                environment: this.currentEnv
            };
        }

        get(key, defaultValue = null) {
            const keys = key.split('.');
            let value = this.config;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
        }

        set(key, value) {
            const keys = key.split('.');
            let obj = this.config;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in obj) || typeof obj[keys[i]] !== 'object') {
                    obj[keys[i]] = {};
                }
                obj = obj[keys[i]];
            }
            
            obj[keys[keys.length - 1]] = value;
            this.notifyWatchers(key, value);
        }

        watch(key, callback) {
            if (!this.watchers.has(key)) {
                this.watchers.set(key, []);
            }
            this.watchers.get(key).push(callback);
        }

        notifyWatchers(key, value) {
            if (this.watchers.has(key)) {
                this.watchers.get(key).forEach(callback => {
                    try {
                        callback(value, key);
                    } catch (error) {
                        console.error('Erreur dans watcher de configuration:', error);
                    }
                });
            }
        }

        getRoleConfig(roleKey) {
            return this.get(`roles.${roleKey}`, null);
        }

        getPermissions(roleKey) {
            const role = this.getRoleConfig(roleKey);
            return role ? role.permissions : [];
        }

        hasPermission(userRole, permission) {
            const permissions = this.getPermissions(userRole);
            return permissions.includes('ALL') || permissions.includes(permission);
        }

        getJournalConfig(journalCode) {
            return this.get(`accounting.journals.${journalCode}`, null);
        }

        getClassConfig(classNumber) {
            return this.get(`accounting.classes.${classNumber}`, null);
        }

        formatCurrency(amount) {
            const currency = this.get('accounting.currency');
            return new Intl.NumberFormat('fr-FR', {
                style: 'decimal',
                minimumFractionDigits: currency.decimalPlaces,
                maximumFractionDigits: currency.decimalPlaces
            }).format(amount) + ' ' + currency.symbol;
        }

        validatePassword(password) {
            const policy = this.get('security.passwordPolicy');
            const errors = [];

            if (password.length < policy.minLength) {
                errors.push(`Le mot de passe doit contenir au moins ${policy.minLength} caractères`);
            }

            if (policy.requireUppercase && !/[A-Z]/.test(password)) {
                errors.push('Le mot de passe doit contenir au moins une majuscule');
            }

            if (policy.requireLowercase && !/[a-z]/.test(password)) {
                errors.push('Le mot de passe doit contenir au moins une minuscule');
            }

            if (policy.requireNumbers && !/\d/.test(password)) {
                errors.push('Le mot de passe doit contenir au moins un chiffre');
            }

            if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Le mot de passe doit contenir au moins un caractère spécial');
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        }

        getTheme(themeName = 'light') {
            return this.get(`ui.themes.${themeName}`, this.get('ui.themes.light'));
        }

        exportConfig() {
            return JSON.stringify(this.config, null, 2);
        }

        importConfig(configJSON) {
            try {
                const newConfig = JSON.parse(configJSON);
                this.config = { ...this.config, ...newConfig };
                return true;
            } catch (error) {
                console.error('Erreur lors de l\'import de configuration:', error);
                return false;
            }
        }
    }

    // =============================================================================
    // 🎯 INITIALISATION ET INTÉGRATION
    // =============================================================================
    
    // Créer l'instance globale
    window.configManager = new ConfigurationManager();

    // Intégrer au système unifié si disponible
    if (window.unifiedManager) {
        window.unifiedManager.configManager = window.configManager;
        console.log('✅ Configuration Manager intégré au système unifié');
    }

    // Mise à jour des configurations existantes
    if (window.PRODUCTION_CONFIG) {
        // Synchroniser avec la configuration de production
        Object.assign(window.PRODUCTION_CONFIG, {
            roles: window.ADVANCED_CONFIG.roles,
            limits: window.ADVANCED_CONFIG.limits,
            security: window.ADVANCED_CONFIG.security
        });
    }

    // Événements de configuration
    window.addEventListener('configurationChanged', (event) => {
        console.log('Configuration modifiée:', event.detail);
    });

    console.log('✅ Module Configuration chargé avec succès');

})();
