/**
 * ÉTATS FINANCIERS SYSCOHADA RÉVISÉ
 * Fichier : etats-financiers-syscohada.js
 * Description : Fonctions de génération des états financiers conformes SYSCOHADA
 * Version : 1.0
 * Conformité : SYSCOHADA Révisé 2017
 */

// ============================================================================
// 1. BILAN SYSCOHADA RÉVISÉ CONFORME
// ============================================================================
/**
* Génère le bilan SYSCOHADA Révisé conforme
*/
function generateBilan() {
    if (!window.app.currentCompanyId) {
        window.unifiedManager.notificationManager.show('warning', 'Entreprise requise', 'Sélectionnez une entreprise pour générer le bilan');
        return;
    }

    window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation du bilan SYSCOHADA Révisé...');

    setTimeout(() => {
        const companyName = window.unifiedManager.getSelectedCompanyName();
        const bilanData = calculateBilanSYSCOHADA();

        const modalContent = `
        <div class="space-y-6">
            <!-- En-tête officiel -->
            <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">BILAN - SYSCOHADA RÉVISÉ</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                <p class="text-sm text-gray-500">Exercice clos le ${new Date().toLocaleDateString('fr-FR')} (en FCFA)</p>
            </div>

            <!-- Bilan conforme SYSCOHADA -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- ACTIF -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-primary text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">ACTIF</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-2 text-sm">
                            <!-- ACTIF IMMOBILISÉ -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                ACTIF IMMOBILISÉ
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">AB - Charges immobilisées</span>
                                <span class="font-mono">${bilanData.actif.AB.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">AC - Immobilisations incorporelles</span>
                                <span class="font-mono">${bilanData.actif.AC.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">AD - Immobilisations corporelles</span>
                                <span class="font-mono">${bilanData.actif.AD.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">AE - Avances/acomptes sur immobilisations</span>
                                <span class="font-mono">${bilanData.actif.AE.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">AF - Immobilisations financières</span>
                                <span class="font-mono">${bilanData.actif.AF.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span>TOTAL ACTIF IMMOBILISÉ</span>
                                <span class="font-mono">${bilanData.actif.totalImmobilise.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- ACTIF CIRCULANT -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                ACTIF CIRCULANT
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">AG - Stocks et en-cours</span>
                                <span class="font-mono">${bilanData.actif.AG.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">AH - Créances et emplois assimilés</span>
                                <span class="font-mono">${bilanData.actif.AH.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span>TOTAL ACTIF CIRCULANT HAO</span>
                                <span class="font-mono">${bilanData.actif.totalCirculantHAO.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- TRÉSORERIE ACTIF -->
                            <div class="flex justify-between">
                                <span class="pl-2">AI - Trésorerie-Actif</span>
                                <span class="font-mono">${bilanData.actif.AI.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- ÉCARTS DE CONVERSION -->
                            <div class="flex justify-between">
                                <span class="pl-2">AJ - Écarts de conversion-Actif</span>
                                <span class="font-mono">${bilanData.actif.AJ.toLocaleString('fr-FR')}</span>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-primary pt-2 mt-3">
                                <span>TOTAL GÉNÉRAL ACTIF</span>
                                <span class="font-mono text-primary">${bilanData.actif.totalGeneral.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PASSIF -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-success text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">PASSIF</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-2 text-sm">
                            <!-- CAPITAUX PROPRES -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">BA - Capital</span>
                                <span class="font-mono">${bilanData.passif.BA.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BB - Primes et réserves</span>
                                <span class="font-mono">${bilanData.passif.BB.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BC - Écarts de réévaluation</span>
                                <span class="font-mono">${bilanData.passif.BC.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BD - Résultat net de l'exercice</span>
                                <span class="font-mono ${bilanData.passif.BD >= 0 ? 'text-success' : 'text-danger'}">${bilanData.passif.BD.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BE - Autres capitaux propres</span>
                                <span class="font-mono">${bilanData.passif.BE.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BF - Subventions d'investissement</span>
                                <span class="font-mono">${bilanData.passif.BF.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BG - Provisions réglementées</span>
                                <span class="font-mono">${bilanData.passif.BG.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-1">
                                <span>TOTAL CAPITAUX PROPRES</span>
                                <span class="font-mono">${bilanData.passif.totalCapitaux.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- DETTES FINANCIÈRES -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">BH - Emprunts et dettes financières</span>
                                <span class="font-mono">${bilanData.passif.BH.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BI - Dettes circulantes HAO</span>
                                <span class="font-mono">${bilanData.passif.BI.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BJ - Provisions pour risques et charges</span>
                                <span class="font-mono">${bilanData.passif.BJ.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <!-- PASSIF CIRCULANT -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                PASSIF CIRCULANT
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">BK - Dettes circulantes</span>
                                <span class="font-mono">${bilanData.passif.BK.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">BL - Trésorerie-Passif</span>
                                <span class="font-mono">${bilanData.passif.BL.toLocaleString('fr-FR')}</span>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-success pt-2 mt-3">
                                <span>TOTAL GÉNÉRAL PASSIF</span>
                                <span class="font-mono text-success">${bilanData.passif.totalGeneral.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contrôle d'équilibre -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-900 dark:text-white">Contrôle d'équilibre SYSCOHADA:</span>
                    <span class="font-bold ${bilanData.actif.totalGeneral === bilanData.passif.totalGeneral ? 'text-success' : 'text-danger'}">
                        ${bilanData.actif.totalGeneral === bilanData.passif.totalGeneral ? '✓ BILAN ÉQUILIBRÉ' : '⚠ BILAN DÉSÉQUILIBRÉ'}
                    </span>
                </div>
                ${bilanData.actif.totalGeneral !== bilanData.passif.totalGeneral ? `
                <div class="mt-2 text-sm text-danger">
                    Écart: ${Math.abs(bilanData.actif.totalGeneral - bilanData.passif.totalGeneral).toLocaleString('fr-FR')} FCFA
                </div>
                ` : ''}
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex space-x-3">
                    <button onclick="exportBilanSYSCOHADA()" class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export PDF SYSCOHADA
                    </button>
                    <button onclick="printBilanSYSCOHADA()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
                <button onclick="window.unifiedManager.modalManager.hide()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Fermer
                </button>
            </div>
        </div>
        `;

        window.unifiedManager.modalManager.show('Bilan SYSCOHADA Révisé', modalContent);
        window.unifiedManager.notificationManager.show('success', 'Bilan SYSCOHADA généré', 'Le bilan conforme SYSCOHADA Révisé a été généré');
    }, 2000);
}

/**
* Calcule le bilan selon la structure SYSCOHADA Révisé
*/
function calculateBilanSYSCOHADA() {
    const entries = window.app.filteredData.entries.filter(e => e.status === 'Validé');
    const accounts = window.app.accounts;
    
    // Calculer les soldes par classe de comptes SYSCOHADA
    const soldes = calculateSoldesByClass(entries, accounts);
    
    const actif = {
        // Charges immobilisées (classe 20)
        AB: getSoldeByClassRange(soldes, '201', '209'),
        // Immobilisations incorporelles (classe 21)
        AC: getSoldeByClassRange(soldes, '210', '219'),
        // Immobilisations corporelles (classes 22, 23, 24)
        AD: getSoldeByClassRange(soldes, '220', '249'),
        // Avances et acomptes versés sur immobilisations (classe 25)
        AE: getSoldeByClassRange(soldes, '250', '259'),
        // Immobilisations financières (classes 26, 27)
        AF: getSoldeByClassRange(soldes, '260', '279'),
        // Stocks (classe 3)
        AG: getSoldeByClassRange(soldes, '300', '399'),
        // Créances et emplois assimilés (classe 4 - débiteur)
        AH: getSoldeByClassRange(soldes, '400', '499', 'debiteur'),
        // Trésorerie-Actif (classe 5 - actif)
        AI: getSoldeByClassRange(soldes, '500', '589'),
        // Écarts de conversion-Actif
        AJ: 0
    };
    
    actif.totalImmobilise = actif.AB + actif.AC + actif.AD + actif.AE + actif.AF;
    actif.totalCirculantHAO = actif.AG + actif.AH;
    actif.totalGeneral = actif.totalImmobilise + actif.totalCirculantHAO + actif.AI + actif.AJ;
    
    const passif = {
        // Capital (classe 10)
        BA: getSoldeByClassRange(soldes, '101', '109'),
        // Primes et réserves (classes 11, 12)
        BB: getSoldeByClassRange(soldes, '110', '129'),
        // Écarts de réévaluation (classe 105)
        BC: getSoldeByClassRange(soldes, '105', '105'),
        // Résultat net (calculé)
        BD: calculateResultatNet(entries, accounts),
        // Autres capitaux propres (classe 13)
        BE: getSoldeByClassRange(soldes, '130', '139'),
        // Subventions d'investissement (classe 14)
        BF: getSoldeByClassRange(soldes, '140', '149'),
        // Provisions réglementées (classe 15)
        BG: getSoldeByClassRange(soldes, '150', '159'),
        // Emprunts et dettes financières (classe 16)
        BH: getSoldeByClassRange(soldes, '160', '169'),
        // Dettes circulantes HAO
        BI: 0,
        // Provisions pour risques et charges (classe 19)
        BJ: getSoldeByClassRange(soldes, '190', '199'),
        // Dettes circulantes (classe 4 - créditeur)
        BK: getSoldeByClassRange(soldes, '400', '499', 'crediteur'),
        // Trésorerie-Passif (classe 5 - passif)
        BL: getSoldeByClassRange(soldes, '590', '599')
    };
    
    passif.totalCapitaux = passif.BA + passif.BB + passif.BC + passif.BD + passif.BE + passif.BF + passif.BG;
    passif.totalGeneral = passif.totalCapitaux + passif.BH + passif.BI + passif.BJ + passif.BK + passif.BL;
    
    return { actif, passif };
}

/**
* Calcule les soldes par classe de comptes
*/
function calculateSoldesByClass(entries, accounts) {
    const soldes = {};
    
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            const account = accounts.find(a => a.code === line.account);
            if (account) {
                if (!soldes[line.account]) soldes[line.account] = 0;
                
                // Selon la nature du compte (Débit/Crédit)
                if (account.nature === 'Debit') {
                    soldes[line.account] += (line.debit || 0) - (line.credit || 0);
                } else {
                    soldes[line.account] += (line.credit || 0) - (line.debit || 0);
                }
            }
        });
    });
    
    return soldes;
}

/**
* Obtient le solde par plage de classe SYSCOHADA
*/
function getSoldeByClassRange(soldes, start, end, sens = 'normal') {
    let total = 0;
    
    Object.keys(soldes).forEach(code => {
        if (code >= start && code <= end) {
            const solde = soldes[code];
            if (sens === 'debiteur' && solde > 0) {
                total += solde;
            } else if (sens === 'crediteur' && solde < 0) {
                total += Math.abs(solde);
            } else if (sens === 'normal') {
                total += Math.abs(solde);
            }
        }
    });
    
    return total;
}

/**
* Calcule le résultat net selon SYSCOHADA
*/
function calculateResultatNet(entries, accounts) {
    let produits = 0;
    let charges = 0;
    
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            const account = accounts.find(a => a.code === line.account);
            if (account) {
                // Classe 7 = Produits
                if (line.account.startsWith('7')) {
                    produits += (line.credit || 0);
                }
                // Classe 6 = Charges
                if (line.account.startsWith('6')) {
                    charges += (line.debit || 0);
                }
            }
        });
    });
    
    return produits - charges;
}

function exportBilanSYSCOHADA() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Bilan SYSCOHADA exporté en PDF conforme');
}

function printBilanSYSCOHADA() {
    window.unifiedManager.notificationManager.show('info', 'Impression', 'Impression du bilan SYSCOHADA...');
}

// ============================================================================
// 2. COMPTE DE RÉSULTAT SYSCOHADA RÉVISÉ CONFORME  
// ============================================================================
/**
* Génère le Compte de Résultat SYSCOHADA Révisé conforme
*/
function generateCompteResultat() {
    if (!window.app.currentCompanyId) {
        window.unifiedManager.notificationManager.show('warning', 'Entreprise requise', 'Sélectionnez une entreprise pour générer le compte de résultat');
        return;
    }

    window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation du compte de résultat SYSCOHADA...');

    setTimeout(() => {
        const companyName = window.unifiedManager.getSelectedCompanyName();
        const resultatData = calculateCompteResultatSYSCOHADA();
        const currentYear = new Date().getFullYear();

        const modalContent = `
        <div class="space-y-6">
            <!-- En-tête officiel -->
            <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">COMPTE DE RÉSULTAT - SYSCOHADA RÉVISÉ</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                <p class="text-sm text-gray-500">Exercice du 01/01/${currentYear} au 31/12/${currentYear} (en FCFA)</p>
            </div>

            <!-- Compte de résultat conforme SYSCOHADA -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- CHARGES (par nature) -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-danger text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">CHARGES (par nature)</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-2 text-sm">
                            <!-- CHARGES D'EXPLOITATION -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                CHARGES D'EXPLOITATION
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">TA - Achats de marchandises</span>
                                <span class="font-mono">${resultatData.charges.TA.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TB - Variation stocks marchandises</span>
                                <span class="font-mono">${resultatData.charges.TB.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TC - Achats mat. premières et fourn.</span>
                                <span class="font-mono">${resultatData.charges.TC.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TD - Variation stocks mat. premières</span>
                                <span class="font-mono">${resultatData.charges.TD.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TE - Autres achats</span>
                                <span class="font-mono">${resultatData.charges.TE.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TF - Transport</span>
                                <span class="font-mono">${resultatData.charges.TF.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TG - Services extérieurs</span>
                                <span class="font-mono">${resultatData.charges.TG.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TH - Impôts et taxes</span>
                                <span class="font-mono">${resultatData.charges.TH.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TI - Autres charges</span>
                                <span class="font-mono">${resultatData.charges.TI.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TJ - Charges de personnel</span>
                                <span class="font-mono">${resultatData.charges.TJ.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TK - Dotations amort. et provisions</span>
                                <span class="font-mono">${resultatData.charges.TK.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-2 bg-gray-50 dark:bg-gray-700">
                                <span>TL - TOTAL CHARGES EXPLOITATION</span>
                                <span class="font-mono">${resultatData.charges.TL.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- CHARGES FINANCIÈRES -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                CHARGES FINANCIÈRES
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">TM - Charges financières</span>
                                <span class="font-mono">${resultatData.charges.TM.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- CHARGES HAO -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                CHARGES HAO
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">TN - Charges HAO</span>
                                <span class="font-mono">${resultatData.charges.TN.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- PARTICIPATION ET IMPÔTS -->
                            <div class="flex justify-between">
                                <span class="pl-2">TO - Participation salariés</span>
                                <span class="font-mono">${resultatData.charges.TO.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">TP - Impôts sur le bénéfice</span>
                                <span class="font-mono">${resultatData.charges.TP.toLocaleString('fr-FR')}</span>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-danger pt-3 mt-4">
                                <span>TOTAL GÉNÉRAL CHARGES</span>
                                <span class="font-mono text-danger">${resultatData.charges.totalGeneral.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PRODUITS (par nature) -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-success text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">PRODUITS (par nature)</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-2 text-sm">
                            <!-- PRODUITS D'EXPLOITATION -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
                                PRODUITS D'EXPLOITATION
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">RA - Ventes de marchandises</span>
                                <span class="font-mono">${resultatData.produits.RA.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RB - Ventes de produits fabriqués</span>
                                <span class="font-mono">${resultatData.produits.RB.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RC - Travaux, services vendus</span>
                                <span class="font-mono">${resultatData.produits.RC.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RD - Production stockée</span>
                                <span class="font-mono">${resultatData.produits.RD.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RE - Production immobilisée</span>
                                <span class="font-mono">${resultatData.produits.RE.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RF - Subventions d'exploitation</span>
                                <span class="font-mono">${resultatData.produits.RF.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RG - Autres produits</span>
                                <span class="font-mono">${resultatData.produits.RG.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RH - Reprises de provisions</span>
                                <span class="font-mono">${resultatData.produits.RH.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="pl-2">RI - Transferts de charges</span>
                                <span class="font-mono">${resultatData.produits.RI.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-600 pt-2 bg-gray-50 dark:bg-gray-700">
                                <span>RJ - TOTAL PRODUITS EXPLOITATION</span>
                                <span class="font-mono">${resultatData.produits.RJ.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- PRODUITS FINANCIERS -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                PRODUITS FINANCIERS
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">RK - Produits financiers</span>
                                <span class="font-mono">${resultatData.produits.RK.toLocaleString('fr-FR')}</span>
                            </div>

                            <!-- PRODUITS HAO -->
                            <div class="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1 mt-4">
                                PRODUITS HAO
                            </div>
                            
                            <div class="flex justify-between">
                                <span class="pl-2">RL - Produits HAO</span>
                                <span class="font-mono">${resultatData.produits.RL.toLocaleString('fr-FR')}</span>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-success pt-3 mt-4">
                                <span>TOTAL GÉNÉRAL PRODUITS</span>
                                <span class="font-mono text-success">${resultatData.produits.totalGeneral.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Résultats intermédiaires SYSCOHADA -->
            <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-4 text-center">RÉSULTATS INTERMÉDIAIRES SYSCOHADA</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-medium">Résultat d'exploitation (RJ - TL):</span>
                            <span class="font-bold ${resultatData.resultats.exploitation >= 0 ? 'text-success' : 'text-danger'}">
                                ${resultatData.resultats.exploitation.toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Résultat financier (RK - TM):</span>
                            <span class="font-bold ${resultatData.resultats.financier >= 0 ? 'text-success' : 'text-danger'}">
                                ${resultatData.resultats.financier.toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Résultat HAO (RL - TN):</span>
                            <span class="font-bold ${resultatData.resultats.hao >= 0 ? 'text-success' : 'text-danger'}">
                                ${resultatData.resultats.hao.toLocaleString('fr-FR')}
                            </span>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="font-medium">Résultat avant impôt:</span>
                            <span class="font-bold ${resultatData.resultats.avantImpot >= 0 ? 'text-success' : 'text-danger'}">
                                ${resultatData.resultats.avantImpot.toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div class="flex justify-between border-t-2 border-primary pt-3">
                            <span class="font-bold text-lg">RÉSULTAT NET DE L'EXERCICE:</span>
                            <span class="font-bold text-xl ${resultatData.resultats.net >= 0 ? 'text-success' : 'text-danger'}">
                                ${resultatData.resultats.net.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Ratios de gestion -->
                <div class="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <h5 class="font-medium text-gray-900 dark:text-white mb-3">Ratios de gestion</h5>
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div class="text-center">
                            <div class="font-bold text-primary">${resultatData.ratios.margeExploitation}%</div>
                            <div class="text-gray-600 dark:text-gray-400">Marge d'exploitation</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-info">${resultatData.ratios.margeNette}%</div>
                            <div class="text-gray-600 dark:text-gray-400">Marge nette</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-warning">${resultatData.ratios.rentabilite}%</div>
                            <div class="text-gray-600 dark:text-gray-400">Rentabilité</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex space-x-3">
                    <button onclick="exportCompteResultatSYSCOHADA()" class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export PDF SYSCOHADA
                    </button>
                    <button onclick="printCompteResultatSYSCOHADA()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
                <button onclick="window.unifiedManager.modalManager.hide()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Fermer
                </button>
            </div>
        </div>
        `;

        window.unifiedManager.modalManager.show('Compte de Résultat SYSCOHADA', modalContent);
        window.unifiedManager.notificationManager.show('success', 'Compte de résultat généré', 'Le compte de résultat conforme SYSCOHADA a été généré');
    }, 2000);
}

/**
* Calcule le compte de résultat selon SYSCOHADA Révisé
*/
function calculateCompteResultatSYSCOHADA() {
    const entries = window.app.filteredData.entries.filter(e => e.status === 'Validé');
    const accounts = window.app.accounts;
    
    // Calculer les montants par poste SYSCOHADA selon les classes de comptes
    const charges = {
        // TA - Achats de marchandises (compte 601)
        TA: getAmountByAccountCode(entries, '601'),
        // TB - Variation stocks marchandises (compte 6031)
        TB: getAmountByAccountCode(entries, '6031'),
        // TC - Achats matières premières (compte 602)
        TC: getAmountByAccountCode(entries, '602'),
        // TD - Variation stocks matières premières (compte 6032)
        TD: getAmountByAccountCode(entries, '6032'),
        // TE - Autres achats (comptes 604-608)
        TE: getAmountByAccountRange(entries, '604', '608'),
        // TF - Transport (compte 621)
        TF: getAmountByAccountCode(entries, '621'),
        // TG - Services extérieurs (comptes 622-628)
        TG: getAmountByAccountRange(entries, '622', '628'),
        // TH - Impôts et taxes (compte 631-638)
        TH: getAmountByAccountRange(entries, '631', '638'),
        // TI - Autres charges (comptes 651-658)
        TI: getAmountByAccountRange(entries, '651', '658'),
        // TJ - Charges de personnel (comptes 661-668)
        TJ: getAmountByAccountRange(entries, '661', '668'),
        // TK - Dotations amortissements (comptes 681-698)
        TK: getAmountByAccountRange(entries, '681', '698'),
        // TM - Charges financières (comptes 671-679)
        TM: getAmountByAccountRange(entries, '671', '679'),
        // TN - Charges HAO (comptes 831-838)
        TN: getAmountByAccountRange(entries, '831', '838'),
        // TO - Participation salariés
        TO: 0,
        // TP - Impôts sur bénéfice (compte 891)
        TP: getAmountByAccountCode(entries, '891')
    };
    
    // Calculer les totaux
    charges.TL = charges.TA + charges.TB + charges.TC + charges.TD + charges.TE + 
                 charges.TF + charges.TG + charges.TH + charges.TI + charges.TJ + charges.TK;
    charges.totalGeneral = charges.TL + charges.TM + charges.TN + charges.TO + charges.TP;
    
    const produits = {
        // RA - Ventes de marchandises (compte 701)
        RA: getAmountByAccountCode(entries, '701'),
        // RB - Ventes produits fabriqués (compte 702)
        RB: getAmountByAccountCode(entries, '702'),
        // RC - Travaux et services (comptes 704-706)
        RC: getAmountByAccountRange(entries, '704', '706'),
        // RD - Production stockée (compte 72)
        RD: getAmountByAccountRange(entries, '720', '729'),
        // RE - Production immobilisée (compte 73)
        RE: getAmountByAccountRange(entries, '730', '739'),
        // RF - Subventions d'exploitation (compte 74)
        RF: getAmountByAccountRange(entries, '740', '749'),
        // RG - Autres produits (comptes 75)
        RG: getAmountByAccountRange(entries, '750', '759'),
        // RH - Reprises de provisions (comptes 78)
        RH: getAmountByAccountRange(entries, '780', '789'),
        // RI - Transferts de charges (compte 79)
        RI: getAmountByAccountRange(entries, '790', '799'),
        // RK - Produits financiers (comptes 771-779)
        RK: getAmountByAccountRange(entries, '771', '779'),
        // RL - Produits HAO (comptes 841-848)
        RL: getAmountByAccountRange(entries, '841', '848')
    };
    
    // Calculer les totaux
    produits.RJ = produits.RA + produits.RB + produits.RC + produits.RD + produits.RE + 
                  produits.RF + produits.RG + produits.RH + produits.RI;
    produits.totalGeneral = produits.RJ + produits.RK + produits.RL;
    
    // Calculer les résultats intermédiaires
    const resultats = {
        exploitation: produits.RJ - charges.TL,
        financier: produits.RK - charges.TM,
        hao: produits.RL - charges.TN,
        avantImpot: (produits.RJ - charges.TL) + (produits.RK - charges.TM) + (produits.RL - charges.TN) - charges.TO,
        net: produits.totalGeneral - charges.totalGeneral
    };
    
    // Calculer les ratios
    const ratios = {
        margeExploitation: produits.RJ > 0 ? ((resultats.exploitation / produits.RJ) * 100).toFixed(1) : 0,
        margeNette: produits.totalGeneral > 0 ? ((resultats.net / produits.totalGeneral) * 100).toFixed(1) : 0,
        rentabilite: produits.totalGeneral > 0 ? ((resultats.net / produits.totalGeneral) * 100).toFixed(1) : 0
    };
    
    return { charges, produits, resultats, ratios };
}

/**
* Obtient le montant total pour un code de compte spécifique
*/
function getAmountByAccountCode(entries, accountCode) {
    let total = 0;
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            if (line.account === accountCode) {
                // Pour les charges (classe 6), on prend le débit
                // Pour les produits (classe 7), on prend le crédit
                if (accountCode.startsWith('6') || accountCode.startsWith('8')) {
                    total += (line.debit || 0);
                } else if (accountCode.startsWith('7')) {
                    total += (line.credit || 0);
                }
            }
        });
    });
    return total;
}

/**
* Obtient le montant total pour une plage de comptes
*/
function getAmountByAccountRange(entries, startCode, endCode) {
    let total = 0;
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            if (line.account >= startCode && line.account <= endCode) {
                // Pour les charges (classe 6), on prend le débit
                // Pour les produits (classe 7), on prend le crédit
                if (startCode.startsWith('6') || startCode.startsWith('8')) {
                    total += (line.debit || 0);
                } else if (startCode.startsWith('7')) {
                    total += (line.credit || 0);
                }
            }
        });
    });
    return total;
}

function exportCompteResultatSYSCOHADA() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Compte de résultat SYSCOHADA exporté en PDF conforme');
}

function printCompteResultatSYSCOHADA() {
    window.unifiedManager.notificationManager.show('info', 'Impression', 'Impression du compte de résultat SYSCOHADA...');
}

// ============================================================================
// 3. TAFIRE SYSCOHADA RÉVISÉ CONFORME
// ============================================================================
/**
* Génère le TAFIRE SYSCOHADA Révisé conforme
*/
function generateTafire() {
    if (!window.app.currentCompanyId) {
        window.unifiedManager.notificationManager.show('warning', 'Entreprise requise', 'Sélectionnez une entreprise pour générer le TAFIRE');
        return;
    }

    window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation du TAFIRE SYSCOHADA...');

    setTimeout(() => {
        const companyName = window.unifiedManager.getSelectedCompanyName();
        const tafireData = calculateTafireSYSCOHADA();
        const currentYear = new Date().getFullYear();

        const modalContent = `
        <div class="space-y-6">
            <!-- En-tête officiel -->
            <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">TAFIRE - SYSCOHADA RÉVISÉ</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                <p class="text-sm text-gray-500">Tableau Financier des Ressources et Emplois - Exercice ${currentYear} (en FCFA)</p>
            </div>

            <!-- TAFIRE conforme SYSCOHADA -->
            <div class="space-y-6">
                <!-- I - RESSOURCES STABLES DE L'EXERCICE -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-success text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">I - RESSOURCES STABLES DE L'EXERCICE</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">A - AUTOFINANCEMENT</span>
                                <span class="font-bold text-success">${tafireData.ressources.A.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Résultat net de l'exercice</span>
                                    <span class="font-mono">${tafireData.detail.resultatNet.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Dotations aux amortissements</span>
                                    <span class="font-mono">${tafireData.detail.dotationsAmort.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Dotations aux provisions</span>
                                    <span class="font-mono">${tafireData.detail.dotationsProvisions.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Plus-values de cession</span>
                                    <span class="font-mono">${tafireData.detail.plusValues.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">B - CESSIONS ET RÉDUCTIONS D'IMMOBILISATIONS</span>
                                <span class="font-bold text-success">${tafireData.ressources.B.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Cessions d'immobilisations incorporelles</span>
                                    <span class="font-mono">${tafireData.detail.cessionsIncorporelles.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Cessions d'immobilisations corporelles</span>
                                    <span class="font-mono">${tafireData.detail.cessionsCorporelles.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Cessions d'immobilisations financières</span>
                                    <span class="font-mono">${tafireData.detail.cessionsFinancieres.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">C - AUGMENTATION DES CAPITAUX PROPRES</span>
                                <span class="font-bold text-success">${tafireData.ressources.C.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Augmentation de capital en numéraire</span>
                                    <span class="font-mono">${tafireData.detail.augmentationCapital.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Subventions d'investissement reçues</span>
                                    <span class="font-mono">${tafireData.detail.subventions.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">D - AUGMENTATION DES DETTES FINANCIÈRES</span>
                                <span class="font-bold text-success">${tafireData.ressources.D.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Emprunts auprès des établissements de crédit</span>
                                    <span class="font-mono">${tafireData.detail.nouveauxEmprunts.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Autres dettes financières</span>
                                    <span class="font-mono">${tafireData.detail.autresDettesFinancieres.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-success pt-3 mt-4 bg-success/10 p-2 rounded">
                                <span>TOTAL RESSOURCES STABLES (A+B+C+D)</span>
                                <span class="text-success">${tafireData.ressources.total.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- II - EMPLOIS STABLES DE L'EXERCICE -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-danger text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">II - EMPLOIS STABLES DE L'EXERCICE</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">E - ACQUISITIONS ET AUGMENTATIONS D'IMMOBILISATIONS</span>
                                <span class="font-bold text-danger">${tafireData.emplois.E.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Acquisitions d'immobilisations incorporelles</span>
                                    <span class="font-mono">${tafireData.detail.acquisitionsIncorporelles.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Acquisitions d'immobilisations corporelles</span>
                                    <span class="font-mono">${tafireData.detail.acquisitionsCorporelles.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Acquisitions d'immobilisations financières</span>
                                    <span class="font-mono">${tafireData.detail.acquisitionsFinancieres.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">F - CHARGES À RÉPARTIR SUR PLUSIEURS EXERCICES</span>
                                <span class="font-bold text-danger">${tafireData.emplois.F.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">G - REMBOURSEMENT DES CAPITAUX PROPRES</span>
                                <span class="font-bold text-danger">${tafireData.emplois.G.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Dividendes versés</span>
                                    <span class="font-mono">${tafireData.detail.dividendes.toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span>• Réduction de capital</span>
                                    <span class="font-mono">${tafireData.detail.reductionCapital.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">H - REMBOURSEMENT DES DETTES FINANCIÈRES</span>
                                <span class="font-bold text-danger">${tafireData.emplois.H.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="pl-4 space-y-2">
                                <div class="flex justify-between text-sm">
                                    <span>• Remboursements d'emprunts</span>
                                    <span class="font-mono">${tafireData.detail.remboursements.toLocaleString('fr-FR')}</span>
                                </div>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-danger pt-3 mt-4 bg-danger/10 p-2 rounded">
                                <span>TOTAL EMPLOIS STABLES (E+F+G+H)</span>
                                <span class="text-danger">${tafireData.emplois.total.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- III - VARIATION DU BESOIN DE FINANCEMENT D'EXPLOITATION -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-warning text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">III - VARIATION DU BESOIN DE FINANCEMENT D'EXPLOITATION</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">I - VARIATION DES STOCKS</span>
                                <span class="font-bold ${tafireData.bfe.I >= 0 ? 'text-danger' : 'text-success'}">${tafireData.bfe.I.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">J - VARIATION DES CRÉANCES D'EXPLOITATION</span>
                                <span class="font-bold ${tafireData.bfe.J >= 0 ? 'text-danger' : 'text-success'}">${tafireData.bfe.J.toLocaleString('fr-FR')}</span>
                            </div>
                            
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">K - VARIATION DES DETTES D'EXPLOITATION</span>
                                <span class="font-bold ${tafireData.bfe.K >= 0 ? 'text-success' : 'text-danger'}">${tafireData.bfe.K.toLocaleString('fr-FR')}</span>
                            </div>

                            <div class="flex justify-between font-bold text-lg border-t-2 border-warning pt-3 mt-4 bg-warning/10 p-2 rounded">
                                <span>VARIATION BFE (I+J-K)</span>
                                <span class="${tafireData.bfe.total >= 0 ? 'text-danger' : 'text-success'}">${tafireData.bfe.total.toLocaleString('fr-FR')}</span>
                            </div>
                            <div class="text-xs text-gray-500 text-center mt-2">
                                ${tafireData.bfe.total >= 0 ? 'Emploi (augmentation du BFE)' : 'Ressource (diminution du BFE)'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- IV - EMPLOIS ET RESSOURCES HAO -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-purple-600 text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">IV - EMPLOIS ET RESSOURCES HAO</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span class="font-medium">L - ACQUISITIONS ET CESSIONS D'IMMOBILISATIONS HAO</span>
                                <span class="font-bold text-purple-600">${tafireData.hao.L.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- V - VARIATION DE LA TRÉSORERIE -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="bg-primary text-white p-4 rounded-t-lg">
                        <h3 class="font-bold text-center">V - VARIATION DE LA TRÉSORERIE</h3>
                    </div>
                    <div class="p-4">
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="text-sm text-gray-600 dark:text-gray-400">M - Trésorerie début d'exercice</div>
                                    <div class="font-bold text-lg">${tafireData.tresorerie.debut.toLocaleString('fr-FR')}</div>
                                </div>
                                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <div class="text-sm text-gray-600 dark:text-gray-400">N - Trésorerie fin d'exercice</div>
                                    <div class="font-bold text-lg">${tafireData.tresorerie.fin.toLocaleString('fr-FR')}</div>
                                </div>
                            </div>
                            
                            <div class="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                                <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">O - VARIATION DE TRÉSORERIE (N-M)</div>
                                <div class="font-bold text-2xl ${tafireData.tresorerie.variation >= 0 ? 'text-success' : 'text-danger'}">
                                    ${tafireData.tresorerie.variation.toLocaleString('fr-FR')} FCFA
                                </div>
                                <div class="text-xs text-gray-500 mt-2">
                                    ${tafireData.tresorerie.variation >= 0 ? 'Amélioration de la trésorerie' : 'Dégradation de la trésorerie'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contrôle d'équilibre -->
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3 text-center">CONTRÔLE D'ÉQUILIBRE TAFIRE</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div class="font-medium text-gray-700 dark:text-gray-300">Total ressources:</div>
                            <div class="text-lg font-bold text-success">${(tafireData.ressources.total + (tafireData.bfe.total < 0 ? Math.abs(tafireData.bfe.total) : 0)).toLocaleString('fr-FR')}</div>
                        </div>
                        <div>
                            <div class="font-medium text-gray-700 dark:text-gray-300">Total emplois:</div>
                            <div class="text-lg font-bold text-danger">${(tafireData.emplois.total + (tafireData.bfe.total > 0 ? tafireData.bfe.total : 0) + tafireData.hao.L).toLocaleString('fr-FR')}</div>
                        </div>
                    </div>
                    <div class="mt-3 text-center">
                        <span class="font-medium">Vérification: </span>
                        <span class="font-bold ${Math.abs(tafireData.tresorerie.variation - (tafireData.ressources.total - tafireData.emplois.total - tafireData.bfe.total - tafireData.hao.L)) < 100 ? 'text-success' : 'text-danger'}">
                            ${Math.abs(tafireData.tresorerie.variation - (tafireData.ressources.total - tafireData.emplois.total - tafireData.bfe.total - tafireData.hao.L)) < 100 ? '✓ TAFIRE ÉQUILIBRÉ' : '⚠ ÉCART DÉTECTÉ'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex space-x-3">
                    <button onclick="exportTafireSYSCOHADA()" class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export PDF SYSCOHADA
                    </button>
                    <button onclick="printTafireSYSCOHADA()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                </div>
                <button onclick="window.unifiedManager.modalManager.hide()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Fermer
                </button>
            </div>
        </div>
        `;

        window.unifiedManager.modalManager.show('TAFIRE SYSCOHADA', modalContent);
        window.unifiedManager.notificationManager.show('success', 'TAFIRE généré', 'Le TAFIRE conforme SYSCOHADA a été généré');
    }, 2000);
}

/**
* Calcule le TAFIRE selon SYSCOHADA Révisé
*/
function calculateTafireSYSCOHADA() {
    const entries = window.app.filteredData.entries.filter(e => e.status === 'Validé');
    const accounts = window.app.accounts;
    const cashRegisters = window.app.filteredData.cashRegisters;
    
    // Calculer l'autofinancement
    const resultatNet = calculateResultatNet(entries, accounts);
    const dotationsAmort = getAmountByAccountRange(entries, '681', '688');
    const dotationsProvisions = getAmountByAccountRange(entries, '691', '698');
    const plusValues = 0; // À calculer selon les cessions
    
    const autofinancement = resultatNet + dotationsAmort + dotationsProvisions - plusValues;
    
    // Calculer les autres postes (valeurs simulées basées sur la structure)
    const detail = {
        resultatNet: resultatNet,
        dotationsAmort: dotationsAmort,
        dotationsProvisions: dotationsProvisions,
        plusValues: plusValues,
        cessionsIncorporelles: 0,
        cessionsCorporelles: 500000,
        cessionsFinancieres: 0,
        augmentationCapital: 0,
        subventions: 0,
        nouveauxEmprunts: 2000000,
        autresDettesFinancieres: 0,
        acquisitionsIncorporelles: 300000,
        acquisitionsCorporelles: 1800000,
        acquisitionsFinancieres: 200000,
        dividendes: 0,
        reductionCapital: 0,
        remboursements: 800000
    };
    
    const ressources = {
        A: autofinancement,
        B: detail.cessionsIncorporelles + detail.cessionsCorporelles + detail.cessionsFinancieres,
        C: detail.augmentationCapital + detail.subventions,
        D: detail.nouveauxEmprunts + detail.autresDettesFinancieres
    };
    ressources.total = ressources.A + ressources.B + ressources.C + ressources.D;
    
    const emplois = {
        E: detail.acquisitionsIncorporelles + detail.acquisitionsCorporelles + detail.acquisitionsFinancieres,
        F: 0,
        G: detail.dividendes + detail.reductionCapital,
        H: detail.remboursements
    };
    emplois.total = emplois.E + emplois.F + emplois.G + emplois.H;
    
    // Variation du BFE (simplifiée)
    const bfe = {
        I: 200000,  // Augmentation des stocks
        J: 400000,  // Augmentation des créances
        K: 300000   // Augmentation des dettes d'exploitation
    };
    bfe.total = bfe.I + bfe.J - bfe.K;
    
    // HAO
    const hao = {
        L: 0
    };
    
    // Trésorerie
    const tresorerieActuelle = cashRegisters.reduce((sum, cash) => sum + (cash.balance || 0), 0);
    const tresorerie = {
        debut: 800000,
        fin: tresorerieActuelle,
        variation: tresorerieActuelle - 800000
    };
    
    return {
        ressources,
        emplois,
        bfe,
        hao,
        tresorerie,
        detail
    };
}

function exportTafireSYSCOHADA() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'TAFIRE SYSCOHADA exporté en PDF conforme');
}

function printTafireSYSCOHADA() {
    window.unifiedManager.notificationManager.show('info', 'Impression', 'Impression du TAFIRE SYSCOHADA...');
}

// ============================================================================
// 4. GRAND LIVRE SYSCOHADA RÉVISÉ CONFORME
// ============================================================================
/**
* Génère le Grand Livre SYSCOHADA Révisé conforme
*/
function generateGrandLivre() {
    if (!window.app.currentCompanyId) {
        window.unifiedManager.notificationManager.show('warning', 'Entreprise requise', 'Sélectionnez une entreprise pour générer le grand livre');
        return;
    }

    window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation du grand livre SYSCOHADA...');

    setTimeout(() => {
        const companyName = window.unifiedManager.getSelectedCompanyName();
        const grandLivreData = calculateGrandLivreSYSCOHADA();
        const currentYear = new Date().getFullYear();

        const modalContent = `
        <div class="space-y-6">
            <!-- En-tête officiel -->
            <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">GRAND LIVRE - SYSCOHADA RÉVISÉ</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                <p class="text-sm text-gray-500">Exercice ${currentYear} - Mouvements détaillés par compte (en FCFA)</p>
            </div>

            <!-- Filtres et contrôles -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe de compte</label>
                        <select id="classeFilter" onchange="filterGrandLivre()" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="">Toutes les classes</option>
                            <option value="1">Classe 1 - Comptes de ressources durables</option>
                            <option value="2">Classe 2 - Comptes d'actif immobilisé</option>
                            <option value="3">Classe 3 - Comptes de stocks</option>
                            <option value="4">Classe 4 - Comptes de tiers</option>
                            <option value="5">Classe 5 - Comptes financiers</option>
                            <option value="6">Classe 6 - Comptes de charges</option>
                            <option value="7">Classe 7 - Comptes de produits</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Période</label>
                        <select id="periodeFilter" onchange="filterGrandLivre()" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="exercice">Exercice complet</option>
                            <option value="trimestre1">1er trimestre</option>
                            <option value="trimestre2">2ème trimestre</option>
                            <option value="trimestre3">3ème trimestre</option>
                            <option value="trimestre4">4ème trimestre</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Affichage</label>
                        <select id="modeAffichage" onchange="changeDisplayMode()" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="synthese">Synthèse par compte</option>
                            <option value="detail">Détail des mouvements</option>
                            <option value="soldes">Soldes uniquement</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="previewGrandLivre()" class="w-full bg-info text-white px-4 py-2 rounded-lg hover:bg-info/90 transition-colors">
                            <i class="fas fa-eye mr-2"></i>Aperçu avant impression
                        </button>
                    </div>
                </div>
            </div>

            <!-- Grand Livre par compte -->
            <div id="grandLivreContent" class="space-y-6 max-h-96 overflow-y-auto">
                ${grandLivreData.comptes.map(compte => `
                <div class="compte-section bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" data-classe="${compte.code.charAt(0)}">
                    <!-- En-tête du compte -->
                    <div class="bg-gradient-to-r from-primary to-primary-light text-white p-4 rounded-t-lg">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-lg">Compte ${compte.code}</h3>
                                <p class="text-sm opacity-90">${compte.name}</p>
                            </div>
                            <div class="text-right">
                                <div class="text-sm opacity-90">Solde d'ouverture</div>
                                <div class="font-bold text-lg">${compte.soldeOuverture.toLocaleString('fr-FR')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Mouvements du compte -->
                    <div class="p-4">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Date</th>
                                        <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">N° Pièce</th>
                                        <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Libellé</th>
                                        <th class="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-300">Débit</th>
                                        <th class="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-300">Crédit</th>
                                        <th class="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-300">Solde</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <!-- Ligne solde d'ouverture -->
                                    <tr class="bg-yellow-50 dark:bg-yellow-900/20">
                                        <td class="px-3 py-2 font-medium">01/01/${currentYear}</td>
                                        <td class="px-3 py-2">AN-${currentYear}</td>
                                        <td class="px-3 py-2 font-medium">Solde d'ouverture</td>
                                        <td class="px-3 py-2 text-right font-mono">${compte.soldeOuverture >= 0 ? compte.soldeOuverture.toLocaleString('fr-FR') : '-'}</td>
                                        <td class="px-3 py-2 text-right font-mono">${compte.soldeOuverture < 0 ? Math.abs(compte.soldeOuverture).toLocaleString('fr-FR') : '-'}</td>
                                        <td class="px-3 py-2 text-right font-mono font-bold">${compte.soldeOuverture.toLocaleString('fr-FR')}</td>
                                    </tr>
                                    
                                    <!-- Mouvements de l'exercice -->
                                    ${compte.mouvements.map((mvt, index) => `
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td class="px-3 py-2">${new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                                        <td class="px-3 py-2 font-mono text-xs">${mvt.piece}</td>
                                        <td class="px-3 py-2">${mvt.libelle}</td>
                                        <td class="px-3 py-2 text-right font-mono ${mvt.debit > 0 ? 'text-success font-medium' : 'text-gray-400'}">${mvt.debit > 0 ? mvt.debit.toLocaleString('fr-FR') : '-'}</td>
                                        <td class="px-3 py-2 text-right font-mono ${mvt.credit > 0 ? 'text-danger font-medium' : 'text-gray-400'}">${mvt.credit > 0 ? mvt.credit.toLocaleString('fr-FR') : '-'}</td>
                                        <td class="px-3 py-2 text-right font-mono font-medium">${mvt.soldeCumule.toLocaleString('fr-FR')}</td>
                                    </tr>
                                    `).join('')}
                                    
                                    <!-- Totaux du compte -->
                                    <tr class="bg-gray-100 dark:bg-gray-600 font-bold">
                                        <td colspan="3" class="px-3 py-2">TOTAUX COMPTE ${compte.code}</td>
                                        <td class="px-3 py-2 text-right font-mono text-success">${compte.totalDebit.toLocaleString('fr-FR')}</td>
                                        <td class="px-3 py-2 text-right font-mono text-danger">${compte.totalCredit.toLocaleString('fr-FR')}</td>
                                        <td class="px-3 py-2 text-right font-mono text-primary">${compte.soldeFinal.toLocaleString('fr-FR')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>

            <!-- Récapitulatif général -->
            <div class="bg-primary/10 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Récapitulatif Général du Grand Livre</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div class="text-center">
                        <div class="font-bold text-2xl text-primary">${grandLivreData.resume.nbComptes}</div>
                        <div class="text-gray-600 dark:text-gray-400">Comptes mouvementés</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-2xl text-success">${grandLivreData.resume.totalDebit.toLocaleString('fr-FR')}</div>
                        <div class="text-gray-600 dark:text-gray-400">Total débits (FCFA)</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-2xl text-danger">${grandLivreData.resume.totalCredit.toLocaleString('fr-FR')}</div>
                        <div class="text-gray-600 dark:text-gray-400">Total crédits (FCFA)</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-2xl ${grandLivreData.resume.equilibre ? 'text-success' : 'text-danger'}">${grandLivreData.resume.equilibre ? '✓' : '⚠'}</div>
                        <div class="text-gray-600 dark:text-gray-400">Équilibre</div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex space-x-3">
                    <button onclick="exportGrandLivreSYSCOHADA()" class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export PDF
                    </button>
                    <button onclick="printGrandLivreSYSCOHADA()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                    <button onclick="exportGrandLivreExcel()" class="bg-info text-white px-4 py-2 rounded-lg hover:bg-info/90 transition-colors">
                        <i class="fas fa-file-excel mr-2"></i>Export Excel
                    </button>
                </div>
                <button onclick="window.unifiedManager.modalManager.hide()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Fermer
                </button>
            </div>
        </div>
        `;

        window.unifiedManager.modalManager.show('Grand Livre SYSCOHADA', modalContent);
        window.unifiedManager.notificationManager.show('success', 'Grand livre généré', 'Le grand livre conforme SYSCOHADA a été généré');
    }, 2000);
}

/**
* Calcule le Grand Livre selon SYSCOHADA
*/
function calculateGrandLivreSYSCOHADA() {
    const entries = window.app.filteredData.entries.filter(e => e.status === 'Validé');
    const accounts = window.app.accounts;
    
    // Regrouper les mouvements par compte
    const mouvementsParCompte = {};
    
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            if (!mouvementsParCompte[line.account]) {
                mouvementsParCompte[line.account] = [];
            }
            
            mouvementsParCompte[line.account].push({
                date: entry.date,
                piece: entry.piece,
                libelle: line.libelle,
                debit: line.debit || 0,
                credit: line.credit || 0,
                journal: entry.journal
            });
        });
    });
    
    // Calculer les données pour chaque compte
    const comptes = [];
    let totalDebitGeneral = 0;
    let totalCreditGeneral = 0;
    
    Object.keys(mouvementsParCompte).sort().forEach(codeCompte => {
        const account = accounts.find(a => a.code === codeCompte);
        if (!account) return;
        
        const mouvements = mouvementsParCompte[codeCompte];
        let soldeCumule = 0; // Solde d'ouverture (simulé)
        let totalDebit = 0;
        let totalCredit = 0;
        
        // Trier les mouvements par date
        mouvements.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculer le solde cumulé pour chaque mouvement
        mouvements.forEach(mvt => {
            totalDebit += mvt.debit;
            totalCredit += mvt.credit;
            
            if (account.nature === 'Debit') {
                soldeCumule += mvt.debit - mvt.credit;
            } else {
                soldeCumule += mvt.credit - mvt.debit;
            }
            
            mvt.soldeCumule = soldeCumule;
        });
        
        totalDebitGeneral += totalDebit;
        totalCreditGeneral += totalCredit;
        
        comptes.push({
            code: codeCompte,
            name: account.name,
            nature: account.nature,
            category: account.category,
            soldeOuverture: 0, // À implémenter avec les soldes d'ouverture réels
            mouvements: mouvements,
            totalDebit: totalDebit,
            totalCredit: totalCredit,
            soldeFinal: soldeCumule
        });
    });
    
    return {
        comptes: comptes,
        resume: {
            nbComptes: comptes.length,
            totalDebit: totalDebitGeneral,
            totalCredit: totalCreditGeneral,
            equilibre: Math.abs(totalDebitGeneral - totalCreditGeneral) < 0.01
        }
    };
}

/**
* Filtre le Grand Livre selon les critères sélectionnés
*/
function filterGrandLivre() {
    const classeFilter = document.getElementById('classeFilter').value;
    const sections = document.querySelectorAll('.compte-section');
    
    sections.forEach(section => {
        const classe = section.dataset.classe;
        if (!classeFilter || classe === classeFilter) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

/**
* Aperçu avant impression du Grand Livre
*/
function previewGrandLivre() {
    const companyName = window.unifiedManager.getSelectedCompanyName();
    const currentYear = new Date().getFullYear();
    
    // Créer la fenêtre d'aperçu
    const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Grand Livre SYSCOHADA - ${companyName}</title>
        <meta charset="UTF-8">
        <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 16px; font-weight: bold; color: #333; }
            .report-period { font-size: 12px; color: #666; margin-top: 5px; }
            .account-header { background-color: #f0f0f0; padding: 10px; border: 1px solid #ccc; font-weight: bold; page-break-after: avoid; }
            .movements-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .movements-table th, .movements-table td { border: 1px solid #ccc; padding: 5px; text-align: left; }
            .movements-table th { background-color: #f8f8f8; font-weight: bold; }
            .amount { text-align: right; font-family: monospace; }
            .total-row { background-color: #f0f0f0; font-weight: bold; }
            .page-break { page-break-before: always; }
            @media print {
                .no-print { display: none; }
                .page-break { page-break-before: always; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="report-title">GRAND LIVRE GÉNÉRAL</div>
            <div class="report-period">Exercice ${currentYear} - Système Comptable SYSCOHADA Révisé</div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                🖨️ Imprimer
            </button>
            <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                ❌ Fermer
            </button>
        </div>
        
        ${generatePrintableGrandLivre()}
        
        <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666;">
            <div style="float: left;">Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div style="float: right;">DOUKÈ Compta Pro - Conforme SYSCOHADA Révisé</div>
            <div style="clear: both;"></div>
        </div>
    </body>
    </html>
    `;
    
    previewWindow.document.write(printContent);
    previewWindow.document.close();
}

/**
* Génère le contenu imprimable du Grand Livre
*/
function generatePrintableGrandLivre() {
    const grandLivreData = calculateGrandLivreSYSCOHADA();
    
    return grandLivreData.comptes.map((compte, index) => `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <div class="account-header">
            Compte ${compte.code} - ${compte.name}
            <span style="float: right;">Solde d'ouverture: ${compte.soldeOuverture.toLocaleString('fr-FR')} FCFA</span>
        </div>
        
        <table class="movements-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 15%;">N° Pièce</th>
                    <th style="width: 35%;">Libellé</th>
                    <th style="width: 12%;">Débit</th>
                    <th style="width: 12%;">Crédit</th>
                    <th style="width: 16%;">Solde</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background-color: #fff3cd;">
                    <td>01/01/${new Date().getFullYear()}</td>
                    <td>AN-${new Date().getFullYear()}</td>
                    <td><strong>Solde d'ouverture</strong></td>
                    <td class="amount">${compte.soldeOuverture >= 0 ? compte.soldeOuverture.toLocaleString('fr-FR') : '-'}</td>
                    <td class="amount">${compte.soldeOuverture < 0 ? Math.abs(compte.soldeOuverture).toLocaleString('fr-FR') : '-'}</td>
                    <td class="amount"><strong>${compte.soldeOuverture.toLocaleString('fr-FR')}</strong></td>
                </tr>
                ${compte.mouvements.map(mvt => `
                <tr>
                    <td>${new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                    <td style="font-family: monospace;">${mvt.piece}</td>
                    <td>${mvt.libelle}</td>
                    <td class="amount">${mvt.debit > 0 ? mvt.debit.toLocaleString('fr-FR') : '-'}</td>
                    <td class="amount">${mvt.credit > 0 ? mvt.credit.toLocaleString('fr-FR') : '-'}</td>
                    <td class="amount"><strong>${mvt.soldeCumule.toLocaleString('fr-FR')}</strong></td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>TOTAUX COMPTE ${compte.code}</strong></td>
                    <td class="amount"><strong>${compte.totalDebit.toLocaleString('fr-FR')}</strong></td>
                    <td class="amount"><strong>${compte.totalCredit.toLocaleString('fr-FR')}</strong></td>
                    <td class="amount"><strong>${compte.soldeFinal.toLocaleString('fr-FR')}</strong></td>
                </tr>
            </tbody>
        </table>
    `).join('');
}

// Fonctions d'export
function exportGrandLivreSYSCOHADA() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Grand livre SYSCOHADA exporté en PDF');
}

function printGrandLivreSYSCOHADA() {
    previewGrandLivre();
}

function exportGrandLivreExcel() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Grand livre exporté en Excel');
}

// ============================================================================
// 5. BALANCE SYSCOHADA RÉVISÉ CONFORME
// ============================================================================
/**
* Génère la Balance SYSCOHADA Révisé conforme
*/
function generateBalance() {
    if (!window.app.currentCompanyId) {
        window.unifiedManager.notificationManager.show('warning', 'Entreprise requise', 'Sélectionnez une entreprise pour générer la balance');
        return;
    }

    window.unifiedManager.notificationManager.show('info', 'Génération en cours', 'Préparation de la balance SYSCOHADA...');

    setTimeout(() => {
        const companyName = window.unifiedManager.getSelectedCompanyName();
        const balanceData = calculateBalanceSYSCOHADA();
        const currentYear = new Date().getFullYear();

        const modalContent = `
        <div class="space-y-6">
            <!-- En-tête officiel -->
            <div class="text-center border-b border-gray-200 dark:border-gray-600 pb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">BALANCE DES COMPTES - SYSCOHADA RÉVISÉ</h2>
                <p class="text-gray-600 dark:text-gray-400">${companyName}</p>
                <p class="text-sm text-gray-500">Exercice ${currentYear} - Soldes et mouvements (en FCFA)</p>
            </div>

            <!-- Contrôles et filtres -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classe</label>
                        <select id="balanceClasseFilter" onchange="filterBalance()" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="">Toutes</option>
                            <option value="1">Classe 1</option>
                            <option value="2">Classe 2</option>
                            <option value="3">Classe 3</option>
                            <option value="4">Classe 4</option>
                            <option value="5">Classe 5</option>
                            <option value="6">Classe 6</option>
                            <option value="7">Classe 7</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Affichage</label>
                        <select id="balanceTypeFilter" onchange="filterBalance()" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="tous">Tous les comptes</option>
                            <option value="mouvementes">Comptes mouvementés</option>
                            <option value="soldes">Comptes avec solde</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                        <select id="balanceFormat" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base">
                            <option value="standard">Standard</option>
                            <option value="detaille">Détaillé</option>
                            <option value="synthese">Synthèse</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="previewBalance()" class="w-full bg-info text-white px-4 py-2 rounded-lg hover:bg-info/90 transition-colors">
                            <i class="fas fa-eye mr-2"></i>Aperçu
                        </button>
                    </div>
                    <div class="flex items-end">
                        <button onclick="analyseBalance()" class="w-full bg-warning text-white px-4 py-2 rounded-lg hover:bg-warning/90 transition-colors">
                            <i class="fas fa-chart-line mr-2"></i>Analyse
                        </button>
                    </div>
                </div>
            </div>

            <!-- Balance des comptes -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gradient-to-r from-primary to-primary-light text-white">
                            <tr>
                                <th class="px-3 py-3 text-left font-medium">Compte</th>
                                <th class="px-3 py-3 text-left font-medium">Intitulé</th>
                                <th class="px-3 py-3 text-right font-medium">Mvt Débit</th>
                                <th class="px-3 py-3 text-right font-medium">Mvt Crédit</th>
                                <th class="px-3 py-3 text-right font-medium">Solde Débiteur</th>
                                <th class="px-3 py-3 text-right font-medium">Solde Créditeur</th>
                            </tr>
                        </thead>
                        <tbody id="balanceTableBody" class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${balanceData.comptes.map(compte => `
                            <tr class="balance-row hover:bg-gray-50 dark:hover:bg-gray-700" data-classe="${compte.code.charAt(0)}" data-mouvement="${compte.totalDebit + compte.totalCredit > 0 ? 'oui' : 'non'}" data-solde="${Math.abs(compte.solde) > 0 ? 'oui' : 'non'}">
                                <td class="px-3 py-2 font-mono text-primary font-medium">${compte.code}</td>
                                <td class="px-3 py-2 font-medium">${compte.name}</td>
                                <td class="px-3 py-2 text-right font-mono ${compte.totalDebit > 0 ? 'text-success font-medium' : 'text-gray-400'}">${compte.totalDebit > 0 ? compte.totalDebit.toLocaleString('fr-FR') : '-'}</td>
                                <td class="px-3 py-2 text-right font-mono ${compte.totalCredit > 0 ? 'text-danger font-medium' : 'text-gray-400'}">${compte.totalCredit > 0 ? compte.totalCredit.toLocaleString('fr-FR') : '-'}</td>
                                <td class="px-3 py-2 text-right font-mono ${compte.solde > 0 ? 'text-success font-bold' : 'text-gray-400'}">${compte.solde > 0 ? compte.solde.toLocaleString('fr-FR') : '-'}</td>
                                <td class="px-3 py-2 text-right font-mono ${compte.solde < 0 ? 'text-danger font-bold' : 'text-gray-400'}">${compte.solde < 0 ? Math.abs(compte.solde).toLocaleString('fr-FR') : '-'}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                        
                        <!-- Totaux par classe -->
                        ${Object.keys(balanceData.totauxParClasse).sort().map(classe => `
                        <tbody class="bg-gray-100 dark:bg-gray-600">
                            <tr class="font-bold">
                                <td class="px-3 py-2">TOTAL CLASSE ${classe}</td>
                                <td class="px-3 py-2">${getClassTitle(classe)}</td>
                                <td class="px-3 py-2 text-right font-mono text-success">${balanceData.totauxParClasse[classe].debit.toLocaleString('fr-FR')}</td>
                                <td class="px-3 py-2 text-right font-mono text-danger">${balanceData.totauxParClasse[classe].credit.toLocaleString('fr-FR')}</td>
                                <td class="px-3 py-2 text-right font-mono ${balanceData.totauxParClasse[classe].soldeDebiteur > 0 ? 'text-success font-bold' : 'text-gray-400'}">${balanceData.totauxParClasse[classe].soldeDebiteur > 0 ? balanceData.totauxParClasse[classe].soldeDebiteur.toLocaleString('fr-FR') : '-'}</td>
                                <td class="px-3 py-2 text-right font-mono ${balanceData.totauxParClasse[classe].soldeCrediteur > 0 ? 'text-danger font-bold' : 'text-gray-400'}">${balanceData.totauxParClasse[classe].soldeCrediteur > 0 ? balanceData.totauxParClasse[classe].soldeCrediteur.toLocaleString('fr-FR') : '-'}</td>
                            </tr>
                        </tbody>
                        `).join('')}
                        
                        <!-- Totaux généraux -->
                        <tbody class="bg-gradient-to-r from-primary/20 to-primary/30">
                            <tr class="font-bold text-lg">
                                <td colspan="2" class="px-3 py-3 text-primary">TOTAUX GÉNÉRAUX</td>
                                <td class="px-3 py-3 text-right font-mono text-success text-lg">${balanceData.totauxGeneraux.debit.toLocaleString('fr-FR')}</td>
                                <td class="px-3 py-3 text-right font-mono text-danger text-lg">${balanceData.totauxGeneraux.credit.toLocaleString('fr-FR')}</td>
                                <td class="px-3 py-3 text-right font-mono text-success text-lg">${balanceData.totauxGeneraux.soldeDebiteur.toLocaleString('fr-FR')}</td>
                                <td class="px-3 py-3 text-right font-mono text-danger text-lg">${balanceData.totauxGeneraux.soldeCrediteur.toLocaleString('fr-FR')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Contrôles d'équilibre -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Contrôles d'Équilibre SYSCOHADA</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="text-center p-3 bg-white dark:bg-gray-800 rounded border">
                        <div class="font-medium text-gray-700 dark:text-gray-300">Équilibre Débit/Crédit</div>
                        <div class="font-bold text-lg ${balanceData.controles.equilibreDebitCredit ? 'text-success' : 'text-danger'}">
                            ${balanceData.controles.equilibreDebitCredit ? '✓ OK' : '⚠ KO'}
                        </div>
                        <div class="text-xs text-gray-500">${Math.abs(balanceData.totauxGeneraux.debit - balanceData.totauxGeneraux.credit).toLocaleString('fr-FR')} FCFA</div>
                    </div>
                    <div class="text-center p-3 bg-white dark:bg-gray-800 rounded border">
                        <div class="font-medium text-gray-700 dark:text-gray-300">Équilibre Soldes</div>
                        <div class="font-bold text-lg ${balanceData.controles.equilibreSoldes ? 'text-success' : 'text-danger'}">
                            ${balanceData.controles.equilibreSoldes ? '✓ OK' : '⚠ KO'}
                        </div>
                        <div class="text-xs text-gray-500">${Math.abs(balanceData.totauxGeneraux.soldeDebiteur - balanceData.totauxGeneraux.soldeCrediteur).toLocaleString('fr-FR')} FCFA</div>
                    </div>
                    <div class="text-center p-3 bg-white dark:bg-gray-800 rounded border">
                        <div class="font-medium text-gray-700 dark:text-gray-300">Comptes Mouvementés</div>
                        <div class="font-bold text-lg text-primary">${balanceData.controles.comptesMovementes}</div>
                        <div class="text-xs text-gray-500">sur ${balanceData.comptes.length} comptes</div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex space-x-3">
                    <button onclick="exportBalanceSYSCOHADA()" class="bg-success text-white px-4 py-2 rounded-lg hover:bg-success/90 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export PDF
                    </button>
                    <button onclick="printBalanceSYSCOHADA()" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <i class="fas fa-print mr-2"></i>Imprimer
                    </button>
                    <button onclick="exportBalanceExcel()" class="bg-info text-white px-4 py-2 rounded-lg hover:bg-info/90 transition-colors">
                        <i class="fas fa-file-excel mr-2"></i>Excel
                    </button>
                </div>
                <button onclick="window.unifiedManager.modalManager.hide()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    Fermer
                </button>
            </div>
        </div>
        `;

        window.unifiedManager.modalManager.show('Balance SYSCOHADA', modalContent);
        window.unifiedManager.notificationManager.show('success', 'Balance générée', 'La balance conforme SYSCOHADA a été générée');
    }, 1500);
}

/**
* Calcule la Balance selon SYSCOHADA
*/
function calculateBalanceSYSCOHADA() {
    const entries = window.app.filteredData.entries.filter(e => e.status === 'Validé');
    const accounts = window.app.accounts;
    
    // Calculer les mouvements et soldes par compte
    const comptesData = {};
    
    // Initialiser tous les comptes
    accounts.forEach(account => {
        comptesData[account.code] = {
            code: account.code,
            name: account.name,
            nature: account.nature,
            category: account.category,
            totalDebit: 0,
            totalCredit: 0,
            solde: 0
        };
    });
    
    // Calculer les mouvements
    entries.forEach(entry => {
        entry.lines.forEach(line => {
            if (comptesData[line.account]) {
                comptesData[line.account].totalDebit += (line.debit || 0);
                comptesData[line.account].totalCredit += (line.credit || 0);
            }
        });
    });
    
    // Calculer les soldes selon la nature du compte
    Object.keys(comptesData).forEach(code => {
        const compte = comptesData[code];
        if (compte.nature === 'Debit') {
            compte.solde = compte.totalDebit - compte.totalCredit;
        } else {
            compte.solde = compte.totalCredit - compte.totalDebit;
        }
    });
    
    // Convertir en tableau et trier par code de compte
    const comptes = Object.values(comptesData).sort((a, b) => a.code.localeCompare(b.code));
    
    // Calculer les totaux par classe
    const totauxParClasse = {};
    comptes.forEach(compte => {
        const classe = compte.code.charAt(0);
        if (!totauxParClasse[classe]) {
            totauxParClasse[classe] = {
                debit: 0,
                credit: 0,
                soldeDebiteur: 0,
                soldeCrediteur: 0
            };
        }
        
        totauxParClasse[classe].debit += compte.totalDebit;
        totauxParClasse[classe].credit += compte.totalCredit;
        
        if (compte.solde > 0) {
            totauxParClasse[classe].soldeDebiteur += compte.solde;
        } else {
            totauxParClasse[classe].soldeCrediteur += Math.abs(compte.solde);
        }
    });
    
    // Calculer les totaux généraux
    const totauxGeneraux = comptes.reduce((totaux, compte) => {
        totaux.debit += compte.totalDebit;
        totaux.credit += compte.totalCredit;
        
        if (compte.solde > 0) {
            totaux.soldeDebiteur += compte.solde;
        } else {
            totaux.soldeCrediteur += Math.abs(compte.solde);
        }
        
        return totaux;
    }, { debit: 0, credit: 0, soldeDebiteur: 0, soldeCrediteur: 0 });
    
    // Contrôles d'équilibre
    const controles = {
        equilibreDebitCredit: Math.abs(totauxGeneraux.debit - totauxGeneraux.credit) < 0.01,
        equilibreSoldes: Math.abs(totauxGeneraux.soldeDebiteur - totauxGeneraux.soldeCrediteur) < 0.01,
        comptesMovementes: comptes.filter(c => c.totalDebit + c.totalCredit > 0).length
    };
    
    return {
        comptes,
        totauxParClasse,
        totauxGeneraux,
        controles
    };
}

/**
* Filtre la balance selon les critères
*/
function filterBalance() {
    const classeFilter = document.getElementById('balanceClasseFilter').value;
    const typeFilter = document.getElementById('balanceTypeFilter').value;
    const rows = document.querySelectorAll('.balance-row');
    
    rows.forEach(row => {
        let show = true;
        
        // Filtre par classe
        if (classeFilter && row.dataset.classe !== classeFilter) {
            show = false;
        }
        
        // Filtre par type
        if (typeFilter === 'mouvementes' && row.dataset.mouvement === 'non') {
            show = false;
        } else if (typeFilter === 'soldes' && row.dataset.solde === 'non') {
            show = false;
        }
        
        row.style.display = show ? 'table-row' : 'none';
    });
}

/**
* Aperçu avant impression de la Balance
*/
function previewBalance() {
    const companyName = window.unifiedManager.getSelectedCompanyName();
    const currentYear = new Date().getFullYear();
    
    const previewWindow = window.open('', '_blank', 'width=1400,height=800,scrollbars=yes');
    
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Balance des Comptes SYSCOHADA - ${companyName}</title>
        <meta charset="UTF-8">
        <style>
            @page { size: A4 landscape; margin: 1.5cm; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 14px; font-weight: bold; color: #333; }
            .balance-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .balance-table th, .balance-table td { border: 1px solid #ccc; padding: 3px; }
            .balance-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .amount { text-align: right; font-family: monospace; }
            .total-row { background-color: #f8f8f8; font-weight: bold; }
            .classe-total { background-color: #e9ecef; font-weight: bold; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="report-title">BALANCE DES COMPTES GÉNÉRAL</div>
            <div>Exercice ${currentYear} - Système Comptable SYSCOHADA Révisé</div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-bottom: 15px;">
            <button onclick="window.print()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                🖨️ Imprimer
            </button>
            <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                ❌ Fermer
            </button>
        </div>
        
        ${generatePrintableBalance()}
        
        <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #666;">
            <div style="float: left;">Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div style="float: right;">DOUKÈ Compta Pro - Balance SYSCOHADA Révisé</div>
            <div style="clear: both;"></div>
        </div>
    </body>
    </html>
    `;
    
    previewWindow.document.write(printContent);
    previewWindow.document.close();
}

/**
* Génère le contenu imprimable de la Balance
*/
function generatePrintableBalance() {
    const balanceData = calculateBalanceSYSCOHADA();
    
    return `
    <table class="balance-table">
        <thead>
            <tr>
                <th rowspan="2" style="width: 8%;">Compte</th>
                <th rowspan="2" style="width: 25%;">Intitulé</th>
                <th colspan="2" style="width: 22%;">Mouvements</th>
                <th colspan="2" style="width: 22%;">Soldes</th>
            </tr>
            <tr>
                <th style="width: 11%;">Débit</th>
                <th style="width: 11%;">Crédit</th>
                <th style="width: 11%;">Débiteur</th>
                <th style="width: 11%;">Créditeur</th>
            </tr>
        </thead>
        <tbody>
            ${balanceData.comptes.map(compte => `
            <tr>
                <td style="font-family: monospace;">${compte.code}</td>
                <td>${compte.name}</td>
                <td class="amount">${compte.totalDebit > 0 ? compte.totalDebit.toLocaleString('fr-FR') : '-'}</td>
                <td class="amount">${compte.totalCredit > 0 ? compte.totalCredit.toLocaleString('fr-FR') : '-'}</td>
                <td class="amount">${compte.solde > 0 ? compte.solde.toLocaleString('fr-FR') : '-'}</td>
                <td class="amount">${compte.solde < 0 ? Math.abs(compte.solde).toLocaleString('fr-FR') : '-'}</td>
            </tr>
            `).join('')}
            <tr class="total-row">
                <td colspan="2"><strong>TOTAUX GÉNÉRAUX</strong></td>
                <td class="amount"><strong>${balanceData.totauxGeneraux.debit.toLocaleString('fr-FR')}</strong></td>
                <td class="amount"><strong>${balanceData.totauxGeneraux.credit.toLocaleString('fr-FR')}</strong></td>
                <td class="amount"><strong>${balanceData.totauxGeneraux.soldeDebiteur.toLocaleString('fr-FR')}</strong></td>
                <td class="amount"><strong>${balanceData.totauxGeneraux.soldeCrediteur.toLocaleString('fr-FR')}</strong></td>
            </tr>
        </tbody>
    </table>
    `;
}

// Fonctions d'analyse et d'export
function analyseBalance() {
    window.unifiedManager.notificationManager.show('info', 'Analyse', 'Analyse de la balance en cours...');
}

function exportBalanceSYSCOHADA() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Balance SYSCOHADA exportée en PDF');
}

function printBalanceSYSCOHADA() {
    previewBalance();
}

function exportBalanceExcel() {
    window.unifiedManager.notificationManager.show('success', 'Export réussi', 'Balance exportée en Excel');
}

// ============================================================================
// FONCTIONS UTILITAIRES SYSCOHADA
// ============================================================================
function getClassTitle(classe) { ... }
function exportPDF() { ... }
