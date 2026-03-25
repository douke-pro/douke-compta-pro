// scriptReports.js
(function() {
    'use strict';
    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptReports] script.js doit être chargé AVANT !');
        return;
    }
    console.log('✅ [scriptReports] Module chargé avec succès');
})();
