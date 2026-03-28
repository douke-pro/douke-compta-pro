// scriptReports.js
(function() {
    'use strict';

    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptReports] script.js doit être chargé AVANT !');
        return;
    }

    console.log('✅ [scriptReports] Module chargé avec succès');

    // Enregistrement dans onAppReady
    window.onAppReady = window.onAppReady || [];
    window.onAppReady.push(function() {
        const userRole = appState.user?.role;
        if (userRole === 'admin' || userRole === 'collaborateur') {
            window.loadPendingFinancialReportsPreview?.();
        }
        window.loadMyFinancialReportsPreview?.();
    });

    console.log('✅ [scriptReports] Module initialisé avec succès');

})();
