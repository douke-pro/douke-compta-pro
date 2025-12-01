// NOTE: Cette structure suppose que vous utilisez un 'bundler' (comme Webpack)
// pour que 'syscohadaExports' soit accessible, ou que vous avez rendu sa fonction 
// 'genererEtatsFinanciers' globale pour le test PoC.

// --------------------------------------------------------------------------
// SIMULATION DE DONNÉES COMPTABLES (En production, ces données viendraient d'une API sécurisée)
// --------------------------------------------------------------------------
const DATA_COMPTABLE_TEST = {
    // Classes 1 à 8, avec des montants pour tester le calcul
    cpt10: 5000000,   // Capital
    cpt13: 2000000,   // Subventions
    cpt21: 15000000,  // Immobilisations corporelles
    cpt40: 3000000,   // Fournisseurs
    cpt52: 1000000,   // Banques
    cpt70: 50000000,  // Ventes
    cpt60: 20000000,  // Achats
    // ... toutes les autres lignes nécessaires pour un Bilan et un CR complets
};
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const genererBtn = document.getElementById('genererBtn');
    const systemeSelect = document.getElementById('systeme');
    const outputMessage = document.getElementById('outputMessage');
    const bilanDetail = document.getElementById('bilanDetail');

    genererBtn.addEventListener('click', async () => {
        const systeme = systemeSelect.value;
        outputMessage.innerHTML = `**Déclenchement du calcul...** Système sélectionné : **${systeme}**`;
        
        // Simuler une latence pour l'effet professionnel
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // ATTENTION: La fonction 'genererEtatsFinanciers' doit être globalement accessible.
            // Si vous n'utilisez pas de 'bundler', vous devrez l'exposer explicitement depuis votre code JS.
            if (typeof genererEtatsFinanciers !== 'function') {
                 throw new Error("Le module d'export (syscohadaExports) n'est pas chargé ou accessible.");
            }
            
            // Appel de l'orchestrateur (point d'entrée unique de la logique métier)
            const resultats = genererEtatsFinanciers(DATA_COMPTABLE_TEST, systeme);

            // Mise à jour du message
            outputMessage.innerHTML = `✅ **Succès !** Les états financiers ont été générés pour le système **${systeme}**.`;
            outputMessage.classList.add('success-border'); // Un peu de style pour la réussite

            // Affichage des résultats structurés (ici, le Bilan)
            bilanDetail.textContent = JSON.stringify(resultats.bilan, null, 2);

        } catch (error) {
            outputMessage.innerHTML = `❌ **Erreur Critique :** ${error.message}`;
            bilanDetail.textContent = "Impossible d'afficher les résultats en raison de l'erreur ci-dessus.";
        }
    });
});
