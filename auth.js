/**
 * DOUKÈ Compta Pro - Authentication Module CORRIGÉ
 * Version: 2.1.1
 * Résolution des conflits de navigation
 */

const auth = (function() {
    'use strict';
    // ... tout le code du module auth jusqu'à...
})();

// Auto-extend session on user activity
document.addEventListener('click', auth.extendSession);
document.addEventListener('keypress', auth.extendSession);

// Export for global access
window.auth = auth;
