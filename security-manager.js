// =============================================================================
// DOUKÈ Compta Pro - Gestionnaire de sécurité hiérarchique v3.1
// =============================================================================

class SecurityManager {
    constructor() {
        this.profileHierarchy = {
            'admin': 5,
            'collaborateur_senior': 4,
            'collaborateur': 3,
            'user': 2,
            'caissier': 1
        };

        this.permissions = {
            'admin': {
                canManageUsers: true,
                canManageCompanies: true,
                canAccessAllCompanies: true,
                canAssignCompanies: true,
                canValidateOperations: true,
                canCreateReports: true,
                requiresCompanySelection: true,
                canViewAllPortfolios: true,
                canManageCollaborators: true,
                canAccessSystemSettings: true,
                canPerformBackup: true,
                canViewAuditLogs: true
            },
            'collaborateur_senior': {
                canManageUsers: ['collaborateur', 'user', 'caissier'],
                canManageCompanies: true,
                canAccessAllCompanies: false,
                canAssignCompanies: ['collaborateur'],
                canValidateOperations: true,
                canCreateReports: true,
                requiresCompanySelection: true,
                canManageSubordinates: true,
                canViewAssignedPortfolios: true,
                canAccessTeamSettings: true,
                canGenerateTeamReports: true
            },
            'collaborateur': {
                canManageUsers: ['user', 'caissier'],
                canManageCompanies: false,
                canAccessAllCompanies: false,
                canAssignCompanies: false,
                canValidateOperations: true,
                canCreateReports: true,
                requiresCompanySelection: true,
                canManageOwnCompanies: true,
                canViewOwnPortfolio: true
            },
            'user': {
                canManageUsers: false,
                canManageCompanies: false,
                canAccessAllCompanies: false,
                canAssignCompanies: false,
                canValidateOperations: true,
                canCreateReports: true,
                requiresCompanySelection: false,
                maxCashRegisters: 5,
                singleCompanyAccess: true,
                canManageOwnData: true
            },
            'caissier': {
                canManageUsers: false,
                canManageCompanies: false,
                canAccessAllCompanies: false,
                canAssignCompanies: false,
                canValidateOperations: false,
                canCreateReports: false,
                requiresCompanySelection: false,
                needsValidation: true,
                singleCompanyAccess: true,
                cashOnlyAccess: true
            }
        };

        console.log('🔒 SecurityManager hiérarchique initialisé');
    }

    // Vérification d'accès à une entreprise
    hasAccessToCompany(userId, companyId) {
        const user = this.getCurrentUser(userId);
        if (!user || !companyId) return false;

        const profile = user.profile;

        // Admin accède à tout
        if (profile === 'admin') return true;

        // User : seulement SON entreprise
        if (profile === 'user') {
            return user.companyId === companyId;
        }

        // Caissier : seulement l'entreprise de sa caisse
        if (profile === 'caissier') {
            return user.companyId === companyId;
        }

        // Collaborateur senior et collaborateur : entreprises assignées
        if (profile === 'collaborateur_senior' || profile === 'collaborateur') {
            return user.assignedCompanies && user.assignedCompanies.includes(companyId);
        }

        return false;
    }

    // Vérification si une sélection d'entreprise est requise
    requiresCompanySelection(profile) {
        const permissions = this.permissions[profile];
        return permissions ? permissions.requiresCompanySelection : false;
    }

    // Obtenir les entreprises accessibles pour un utilisateur
    getAccessibleCompanies(userId) {
        const user = this.getCurrentUser(userId);
        if (!user) return [];

        if (user.profile === 'admin') {
            return window.app.companies || [];
        }

        if (user.profile === 'user' || user.profile === 'caissier') {
            return window.app.companies.filter(c => c.id === user.companyId);
        }

        if (user.profile === 'collaborateur_senior' || user.profile === 'collaborateur') {
            return window.app.companies.filter(c =>
                user.assignedCompanies && user.assignedCompanies.includes(c.id)
            );
        }

        return [];
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser(userId) {
        if (!userId && window.app && window.app.currentUser) {
            return window.app.currentUser;
        }
        if (!window.app || !window.app.users) return null;
        return window.app.users.find(u => u.id === userId);
    }

    // Vérifier si un utilisateur peut gérer un autre utilisateur
    canManageUser(targetUser, currentUser = null) {
        const manager = currentUser || window.app.currentUser;
        if (!manager || !targetUser) return false;

        const managerLevel = this.profileHierarchy[manager.profile];
        const targetLevel = this.profileHierarchy[targetUser.profile];

        // On ne peut gérer que les niveaux inférieurs
        return managerLevel > targetLevel;
    }

    // Vérifier une permission spécifique
    hasPermission(permission, profile = null) {
        const userProfile = profile || (window.app.currentUser ? window.app.currentUser.profile : null);
        if (!userProfile) return false;

        const permissions = this.permissions[userProfile];
        if (!permissions) return false;

        return !!permissions[permission];
    }

    // Obtenir le tableau de bord approprié pour un profil
    getDashboardForProfile(profile) {
        const dashboards = {
            'admin': 'admin-dashboard',
            'collaborateur_senior': 'senior-dashboard',
            'collaborateur': 'collaborator-dashboard',
            'user': 'user-dashboard',
            'caissier': 'cashier-dashboard'
        };
        return dashboards[profile] || 'user-dashboard';
    }

    // Validation de sécurité pour les opérations sensibles
    validateSecureOperation(operation, context = {}) {
        const user = window.app.currentUser;
        if (!user) {
            throw new SecurityError('Utilisateur non authentifié');
        }

        const validations = {
            'delete_user': () => this.hasPermission('canManageUsers'),
            'delete_company': () => this.hasPermission('canManageCompanies'),
            'validate_entry': () => this.hasPermission('canValidateOperations'),
            'access_audit': () => this.hasPermission('canViewAuditLogs'),
            'backup_data': () => this.hasPermission('canPerformBackup'),
            'modify_permissions': () => user.profile === 'admin'
        };

        const validator = validations[operation];
        if (!validator) {
            throw new SecurityError(`Opération non reconnue: ${operation}`);
        }

        if (!validator(context)) {
            throw new SecurityError(`Accès refusé pour l'opération: ${operation}`);
        }

        return true;
    }

    // Audit de sécurité
    performSecurityAudit() {
        const audit = {
            timestamp: new Date().toISOString(),
            currentUser: window.app.currentUser ? window.app.currentUser.email : 'Anonymous',
            users: {
                total: window.app.users.length,
                active: window.app.users.filter(u => u.status === 'Actif').length,
                byProfile: {}
            },
            companies: {
                total: window.app.companies.length,
                accessible: this.getAccessibleCompanies().length
            },
            permissions: this.getCurrentUserPermissions(),
            lastLogin: window.app.currentUser ? window.app.currentUser.lastLogin : null,
            securityLevel: this.getSecurityLevel()
        };

        // Compter par profil
        window.app.users.forEach(user => {
            audit.users.byProfile[user.profile] = (audit.users.byProfile[user.profile] || 0) + 1;
        });

        return audit;
    }

    // Obtenir les permissions de l'utilisateur actuel
    getCurrentUserPermissions() {
        const user = window.app.currentUser;
        if (!user) return {};

        return this.permissions[user.profile] || {};
    }

    // Obtenir le niveau de sécurité actuel
    getSecurityLevel() {
        const user = window.app.currentUser;
        if (!user) return 0;

        return this.profileHierarchy[user.profile] || 0;
    }

    // Journalisation des événements de sécurité
    logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            user: window.app.currentUser ? window.app.currentUser.email : 'Anonymous',
            userId: window.app.currentUser ? window.app.currentUser.id : null,
            details,
            userAgent: navigator.userAgent,
            ip: 'N/A' // Serait obtenu côté serveur
        };

        // Stocker dans le localStorage pour la démo
        const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        securityLogs.push(logEntry);
        
        // Garder seulement les 100 derniers logs
        if (securityLogs.length > 100) {
            securityLogs.splice(0, securityLogs.length - 100);
        }
        
        localStorage.setItem('securityLogs', JSON.stringify(securityLogs));

        console.log('🔒 Événement de sécurité:', event, details);
    }

    // Obtenir les logs de sécurité
    getSecurityLogs(limit = 50) {
        const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        return logs.slice(-limit);
    }

    // Nettoyer les logs de sécurité
    clearSecurityLogs() {
        localStorage.removeItem('securityLogs');
        this.logSecurityEvent('security_logs_cleared');
    }
}

// Classe d'erreur personnalisée pour la sécurité
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}

// Export des classes
window.SecurityManager = SecurityManager;
window.SecurityError = SecurityError;

console.log('📦 Module SecurityManager chargé');
