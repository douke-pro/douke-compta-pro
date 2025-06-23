/**
 * DOUKÈ Compta Pro - Fonctions utilitaires
 * Helpers génériques pour l'application
 */

// ========== FORMATAGE MONÉTAIRE ==========
const Helpers = {
    // Formatage en francs CFA
    formatCurrency(amount, showSymbol = true) {
        if (amount === null || amount === undefined || isNaN(amount)) return '0';
        
        const formatted = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
        
        const symbol = showSymbol ? ' FCFA' : '';
        return `${amount < 0 ? '-' : ''}${formatted}${symbol}`;
    },

    // Formatage de pourcentage
    formatPercentage(value, decimals = 2) {
        if (value === null || value === undefined || isNaN(value)) return '0%';
        return `${value.toFixed(decimals)}%`;
    },

    // ========== VALIDATION ==========
    // Validation email
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validation numéro de compte SYSCOHADA
    isValidAccountNumber(accountNumber) {
        return /^[1-8]\d{0,6}$/.test(accountNumber);
    },

    // Validation montant
    isValidAmount(amount) {
        return !isNaN(amount) && parseFloat(amount) >= 0;
    },

    // ========== MANIPULATION DE DATES ==========
    // Formatage de date
    formatDate(date, format = 'dd/mm/yyyy') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'long':
                return d.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            default:
                return `${day}/${month}/${year}`;
        }
    },

    // Date actuelle
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },

    // Calcul de différence en jours
    daysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // ========== UTILITAIRES DOM ==========
    // Génération d'ID unique
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Débounce pour les recherches
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Copie dans le presse-papiers
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erreur de copie:', err);
            return false;
        }
    },

    // ========== MANIPULATION DE DONNÉES ==========
    // Nettoyage de chaîne
    cleanString(str) {
        if (!str) return '';
        return str.trim().replace(/\s+/g, ' ');
    },

    // Capitalisation
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Génération de mot de passe
    generatePassword(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // ========== EXPORT/IMPORT ==========
    // Export en CSV
    exportToCSV(data, filename = 'export.csv') {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Échapper les guillemets et virgules
                    return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
    },

    // Téléchargement de fichier
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // ========== CALCULS COMPTABLES ==========
    // Calcul de total
    calculateTotal(items, field) {
        return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    },

    // Vérification équilibre débit/crédit
    isBalanced(entries) {
        const debit = this.calculateTotal(entries.filter(e => e.type === 'debit'), 'amount');
        const credit = this.calculateTotal(entries.filter(e => e.type === 'credit'), 'amount');
        return Math.abs(debit - credit) < 0.01; // Tolérance de 1 centime
    },

    // ========== GESTION D'ERREURS ==========
    // Gestion sécurisée d'erreurs
    safeExecute(fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            console.error('Erreur dans safeExecute:', error);
            return fallback;
        }
    },

    // Logging avec contexte
    log(message, data = null, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        console[level](logEntry);
        
        // Stockage local des logs si nécessaire
        if (level === 'error') {
            this.storeErrorLog(logEntry);
        }
    },

    // Stockage des erreurs
    storeErrorLog(errorLog) {
        try {
            const logs = JSON.parse(localStorage.getItem('douke_error_logs') || '[]');
            logs.push(errorLog);
            // Garder seulement les 50 dernières erreurs
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }
            localStorage.setItem('douke_error_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('Impossible de stocker les logs d\'erreur:', e);
        }
    }
};

// Export global
window.Helpers = Helpers;
