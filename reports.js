// =============================================================================
// 📊 DOUKÈ Compta Pro - Gestion des Rapports v3.2
// =============================================================================

(function() {
    'use strict';

    console.log('📊 Chargement du module Rapports...');

    // =============================================================================
    // 📋 GÉNÉRATEUR DE RAPPORTS SYSCOHADA
    // =============================================================================
    class ReportGenerator {
        constructor() {
            this.templates = new Map();
            this.formatters = new Map();
            this.exporters = new Map();
            
            this.initializeTemplates();
            this.initializeFormatters();
            this.initializeExporters();
        }

        initializeTemplates() {
            // Template Bilan SYSCOHADA
            this.templates.set('bilan', {
                name: 'Bilan SYSCOHADA',
                structure: {
                    actif: {
                        immobilise: ['2'],
                        circulant: ['3', '4', '5'],
                        tresorerie: ['5']
                    },
                    passif: {
                        capitaux: ['1'],
                        dettes: ['4', '16', '17'],
                        tresorerie: ['5']
                    }
                }
            });

            // Template Compte de Résultat
            this.templates.set('resultat', {
                name: 'Compte de Résultat SYSCOHADA',
                structure: {
                    charges: ['6'],
                    produits: ['7']
                }
            });

            // Template Balance Générale
            this.templates.set('balance', {
                name: 'Balance Générale',
                columns: ['code', 'libelle', 'debit', 'credit', 'soldeDebit', 'soldeCredit']
            });

            // Template Grand Livre
            this.templates.set('grandLivre', {
                name: 'Grand Livre',
                groupBy: 'compte',
                sortBy: 'date'
            });
        }

        initializeFormatters() {
            this.formatters.set('currency', (amount) => {
                return window.configManager?.formatCurrency(amount) || 
                       new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
            });

            this.formatters.set('date', (date) => {
                return new Date(date).toLocaleDateString('fr-FR');
            });

            this.formatters.set('percentage', (value) => {
                return (value * 100).toFixed(2) + '%';
            });
        }

        initializeExporters() {
            this.exporters.set('PDF', new PDFExporter());
            this.exporters.set('Excel', new ExcelExporter());
            this.exporters.set('CSV', new CSVExporter());
        }

        async generateBilan(companyId, startDate, endDate) {
            try {
                console.log('📊 Génération du bilan...');
                
                const accounts = this.getAccountsData(companyId);
                const entries = this.getEntriesData(companyId, startDate, endDate);
                
                const bilanData = this.calculateBilan(accounts, entries);
                
                return {
                    success: true,
                    data: bilanData,
                    metadata: {
                        companyId,
                        startDate,
                        endDate,
                        generatedAt: new Date().toISOString(),
                        type: 'bilan'
                    }
                };
            } catch (error) {
                console.error('Erreur génération bilan:', error);
                return { success: false, error: error.message };
            }
        }

        calculateBilan(accounts, entries) {
            const bilan = {
                actif: {
                    immobilisationsIncorporelles: 0,
                    immobilisationsCorporelles: 0,
                    immobilisationsFinancieres: 0,
                    stocks: 0,
                    creances: 0,
                    tresorerieActif: 0,
                    totalActif: 0
                },
                passif: {
                    capitalSocial: 0,
                    reserves: 0,
                    resultat: 0,
                    dettesFinancieres: 0,
                    dettesExploitation: 0,
                    tresoreriePassif: 0,
                    totalPassif: 0
                }
            };

            // Calculer les soldes par compte
            const soldes = this.calculateAccountBalances(accounts, entries);

            // Répartir dans les postes du bilan
            Object.entries(soldes).forEach(([accountCode, balance]) => {
                const classe = accountCode.charAt(0);
                const account = accounts.find(a => a.code === accountCode);
                
                if (!account) return;

                switch (classe) {
                    case '2': // Immobilisations
                        if (accountCode.startsWith('20')) {
                            bilan.actif.immobilisationsIncorporelles += balance;
                        } else if (accountCode.startsWith('21') || accountCode.startsWith('22')) {
                            bilan.actif.immobilisationsCorporelles += balance;
                        } else if (accountCode.startsWith('24')) {
                            bilan.actif.immobilisationsFinancieres += balance;
                        }
                        break;
                        
                    case '3': // Stocks
                        bilan.actif.stocks += balance;
                        break;
                        
                    case '4': // Tiers
                        if (account.nature === 'Debit' || balance > 0) {
                            bilan.actif.creances += balance;
                        } else {
                            bilan.passif.dettesExploitation += Math.abs(balance);
                        }
                        break;
                        
                    case '5': // Trésorerie
                        if (balance > 0) {
                            bilan.actif.tresorerieActif += balance;
                        } else {
                            bilan.passif.tresoreriePassif += Math.abs(balance);
                        }
                        break;
                        
                    case '1': // Capitaux propres
                        if (accountCode.startsWith('101')) {
                            bilan.passif.capitalSocial += balance;
                        } else if (accountCode.startsWith('106') || accountCode.startsWith('110')) {
                            bilan.passif.reserves += balance;
                        } else if (accountCode.startsWith('12')) {
                            bilan.passif.resultat += balance;
                        }
                        break;
                        
                    case '16': // Dettes financières
                    case '17':
                        bilan.passif.dettesFinancieres += balance;
                        break;
                }
            });

            // Calculer les totaux
            bilan.actif.totalActif = Object.values(bilan.actif).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0);
            
            bilan.passif.totalPassif = Object.values(bilan.passif).reduce((sum, val) => 
                typeof val === 'number' ? sum + val : sum, 0);

            return bilan;
        }

        async generateCompteResultat(companyId, startDate, endDate) {
            try {
                console.log('📊 Génération du compte de résultat...');
                
                const accounts = this.getAccountsData(companyId);
                const entries = this.getEntriesData(companyId, startDate, endDate);
                
                const resultatData = this.calculateCompteResultat(accounts, entries);
                
                return {
                    success: true,
                    data: resultatData,
                    metadata: {
                        companyId,
                        startDate,
                        endDate,
                        generatedAt: new Date().toISOString(),
                        type: 'resultat'
                    }
                };
            } catch (error) {
                console.error('Erreur génération compte de résultat:', error);
                return { success: false, error: error.message };
            }
        }

        calculateCompteResultat(accounts, entries) {
            const resultat = {
                charges: {
                    exploitation: 0,
                    financieres: 0,
                    exceptionnelles: 0,
                    totalCharges: 0
                },
                produits: {
                    exploitation: 0,
                    financiers: 0,
                    exceptionnels: 0,
                    totalProduits: 0
                },
                resultats: {
                    exploitation: 0,
                    financier: 0,
                    exceptionnel: 0,
                    net: 0
                }
            };

            const soldes = this.calculateAccountBalances(accounts, entries);

            Object.entries(soldes).forEach(([accountCode, balance]) => {
                const classe = accountCode.charAt(0);
                const sousClasse = accountCode.substring(0, 2);

                if (classe === '6') { // Charges
                    if (sousClasse <= '65') {
                        resultat.charges.exploitation += balance;
                    } else if (sousClasse <= '67') {
                        resultat.charges.financieres += balance;
                    } else {
                        resultat.charges.exceptionnelles += balance;
                    }
                } else if (classe === '7') { // Produits
                    if (sousClasse <= '75') {
                        resultat.produits.exploitation += balance;
                    } else if (sousClasse <= '77') {
                        resultat.produits.financiers += balance;
                    } else {
                        resultat.produits.exceptionnels += balance;
                    }
                }
            });

            // Calculer les totaux et résultats
            resultat.charges.totalCharges = resultat.charges.exploitation + 
                                          resultat.charges.financieres + 
                                          resultat.charges.exceptionnelles;

            resultat.produits.totalProduits = resultat.produits.exploitation + 
                                             resultat.produits.financiers + 
                                             resultat.produits.exceptionnels;

            resultat.resultats.exploitation = resultat.produits.exploitation - resultat.charges.exploitation;
            resultat.resultats.financier = resultat.produits.financiers - resultat.charges.financieres;
            resultat.resultats.exceptionnel = resultat.produits.exceptionnels - resultat.charges.exceptionnelles;
            resultat.resultats.net = resultat.produits.totalProduits - resultat.charges.totalCharges;

            return resultat;
        }

        async generateBalanceGenerale(companyId, startDate, endDate) {
            try {
                console.log('📊 Génération de la balance générale...');
                
                const accounts = this.getAccountsData(companyId);
                const entries = this.getEntriesData(companyId, startDate, endDate);
                
                const balanceData = this.calculateBalanceGenerale(accounts, entries);
                
                return {
                    success: true,
                    data: balanceData,
                    metadata: {
                        companyId,
                        startDate,
                        endDate,
                        generatedAt: new Date().toISOString(),
                        type: 'balance'
                    }
                };
            } catch (error) {
                console.error('Erreur génération balance générale:', error);
                return { success: false, error: error.message };
            }
        }

        calculateBalanceGenerale(accounts, entries) {
            const balance = [];
            const mouvements = this.calculateAccountMovements(accounts, entries);

            accounts.forEach(account => {
                const movement = mouvements[account.code] || { debit: 0, credit: 0 };
                const soldeDebit = movement.debit > movement.credit ? movement.debit - movement.credit : 0;
                const soldeCredit = movement.credit > movement.debit ? movement.credit - movement.debit : 0;

                balance.push({
                    code: account.code,
                    libelle: account.name,
                    debit: movement.debit,
                    credit: movement.credit,
                    soldeDebit: soldeDebit,
                    soldeCredit: soldeCredit
                });
            });

            // Trier par code de compte
            balance.sort((a, b) => a.code.localeCompare(b.code));

            // Calculer les totaux
            const totaux = balance.reduce((acc, line) => ({
                debit: acc.debit + line.debit,
                credit: acc.credit + line.credit,
                soldeDebit: acc.soldeDebit + line.soldeDebit,
                soldeCredit: acc.soldeCredit + line.soldeCredit
            }), { debit: 0, credit: 0, soldeDebit: 0, soldeCredit: 0 });

            return { lines: balance, totaux };
        }

        async generateGrandLivre(companyId, accountCode = null, startDate, endDate) {
            try {
                console.log('📊 Génération du grand livre...');
                
                const accounts = this.getAccountsData(companyId);
                const entries = this.getEntriesData(companyId, startDate, endDate);
                
                const grandLivreData = this.calculateGrandLivre(accounts, entries, accountCode);
                
                return {
                    success: true,
                    data: grandLivreData,
                    metadata: {
                        companyId,
                        accountCode,
                        startDate,
                        endDate,
                        generatedAt: new Date().toISOString(),
                        type: 'grandLivre'
                    }
                };
            } catch (error) {
                console.error('Erreur génération grand livre:', error);
                return { success: false, error: error.message };
            }
        }

        calculateGrandLivre(accounts, entries, filterAccountCode = null) {
            const grandLivre = {};

            // Filtrer les comptes si nécessaire
            const targetAccounts = filterAccountCode ? 
                accounts.filter(a => a.code === filterAccountCode) : 
                accounts;

            targetAccounts.forEach(account => {
                const accountEntries = [];
                let solde = account.balance || 0;

                entries.forEach(entry => {
                    entry.lines.forEach(line => {
                        if (line.account === account.code) {
                            accountEntries.push({
                                date: entry.date,
                                piece: entry.piece,
                                libelle: line.libelle,
                                debit: line.debit || 0,
                                credit: line.credit || 0,
                                solde: solde
                            });

                            // Calculer le nouveau solde
                            if (account.nature === 'Debit') {
                                solde += (line.debit || 0) - (line.credit || 0);
                            } else {
                                solde += (line.credit || 0) - (line.debit || 0);
                            }
                        }
                    });
                });

                // Trier par date
                accountEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

                if (accountEntries.length > 0 || account.balance !== 0) {
                    grandLivre[account.code] = {
                        account: account,
                        entries: accountEntries,
                        soldeInitial: account.balance || 0,
                        soldeFinal: solde
                    };
                }
            });

            return grandLivre;
        }

        // Méthodes utilitaires
        getAccountsData(companyId) {
            return window.app?.accounts || [];
        }

        getEntriesData(companyId, startDate, endDate) {
            const entries = window.app?.entries || [];
            return entries.filter(entry => {
                const entryDate = new Date(entry.date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                return entry.companyId === companyId && 
                       entryDate >= start && 
                       entryDate <= end &&
                       entry.status === 'Validé';
            });
        }

        calculateAccountBalances(accounts, entries) {
            const balances = {};

            // Initialiser avec les soldes d'ouverture
            accounts.forEach(account => {
                balances[account.code] = account.balance || 0;
            });

            // Ajouter les mouvements
            entries.forEach(entry => {
                entry.lines.forEach(line => {
                    const account = accounts.find(a => a.code === line.account);
                    if (account) {
                        if (account.nature === 'Debit') {
                            balances[line.account] += (line.debit || 0) - (line.credit || 0);
                        } else {
                            balances[line.account] += (line.credit || 0) - (line.debit || 0);
                        }
                    }
                });
            });

            return balances;
        }

        calculateAccountMovements(accounts, entries) {
            const movements = {};

            accounts.forEach(account => {
                movements[account.code] = { debit: 0, credit: 0 };
            });

            entries.forEach(entry => {
                entry.lines.forEach(line => {
                    if (movements[line.account]) {
                        movements[line.account].debit += line.debit || 0;
                        movements[line.account].credit += line.credit || 0;
                    }
                });
            });

            return movements;
        }

        async exportReport(reportData, format, filename) {
            try {
                const exporter = this.exporters.get(format);
                if (!exporter) {
                    throw new Error(`Format d'export non supporté: ${format}`);
                }

                const result = await exporter.export(reportData, filename);
                return { success: true, result };
            } catch (error) {
                console.error('Erreur export rapport:', error);
                return { success: false, error: error.message };
            }
        }
    }

    // =============================================================================
    // 📄 EXPORTEURS DE RAPPORTS
    // =============================================================================
    class PDFExporter {
        async export(reportData, filename) {
            // Simulation d'export PDF
            console.log('📄 Export PDF:', filename);
            
            const content = this.generatePDFContent(reportData);
            const blob = new Blob([content], { type: 'application/pdf' });
            
            return this.downloadFile(blob, filename + '.pdf');
        }

        generatePDFContent(reportData) {
            // Ici, on utiliserait une bibliothèque comme jsPDF
            return `PDF Content for ${reportData.metadata?.type || 'rapport'}`;
        }

        downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, filename };
        }
    }

    class ExcelExporter {
        async export(reportData, filename) {
            console.log('📊 Export Excel:', filename);
            
            const csvContent = this.generateCSVContent(reportData);
            const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
            
            return this.downloadFile(blob, filename + '.xlsx');
        }

        generateCSVContent(reportData) {
            if (reportData.data.lines) {
                // Pour balance générale
                let csv = 'Code;Libellé;Débit;Crédit;Solde Débit;Solde Crédit\n';
                reportData.data.lines.forEach(line => {
                    csv += `${line.code};${line.libelle};${line.debit};${line.credit};${line.soldeDebit};${line.soldeCredit}\n`;
                });
                return csv;
            }
            
            return 'Données du rapport';
        }

        downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, filename };
        }
    }

    class CSVExporter {
        async export(reportData, filename) {
            console.log('📋 Export CSV:', filename);
            
            const csvContent = this.generateCSVContent(reportData);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            
            return this.downloadFile(blob, filename + '.csv');
        }

        generateCSVContent(reportData) {
            if (reportData.data.lines) {
                let csv = 'Code,Libellé,Débit,Crédit,Solde Débit,Solde Crédit\n';
                reportData.data.lines.forEach(line => {
                    csv += `"${line.code}","${line.libelle}",${line.debit},${line.credit},${line.soldeDebit},${line.soldeCredit}\n`;
                });
                return csv;
            }
            
            return 'Données du rapport';
        }

        downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, filename };
        }
    }

    // =============================================================================
    // 📈 GESTIONNAIRE DE TABLEAUX DE BORD
    // =============================================================================
    class DashboardManager {
        constructor() {
            this.widgets = new Map();
            this.layouts = new Map();
        }

        async generateDashboardData(companyId, period = 'month') {
            try {
                const endDate = new Date();
                const startDate = this.getStartDate(endDate, period);
                
                const [bilanResult, resultatResult] = await Promise.all([
                    window.reportGenerator.generateBilan(companyId, startDate, endDate),
                    window.reportGenerator.generateCompteResultat(companyId, startDate, endDate)
                ]);

                const dashboardData = {
                    period: period,
                    dateRange: { startDate, endDate },
                    kpis: this.calculateKPIs(bilanResult.data, resultatResult.data),
                    charts: this.generateChartData(bilanResult.data, resultatResult.data),
                    trends: this.calculateTrends(companyId, period),
                    alerts: this.generateAlerts(bilanResult.data, resultatResult.data)
                };

                return { success: true, data: dashboardData };
            } catch (error) {
                console.error('Erreur génération dashboard:', error);
                return { success: false, error: error.message };
            }
        }

        getStartDate(endDate, period) {
            const start = new Date(endDate);
            
            switch (period) {
                case 'week':
                    start.setDate(start.getDate() - 7);
                    break;
                case 'month':
                    start.setMonth(start.getMonth() - 1);
                    break;
                case 'quarter':
                    start.setMonth(start.getMonth() - 3);
                    break;
                case 'year':
                    start.setFullYear(start.getFullYear() - 1);
                    break;
                default:
                    start.setMonth(start.getMonth() - 1);
            }
            
            return start;
        }

        calculateKPIs(bilanData, resultatData) {
            return {
                chiffreAffaires: resultatData.produits.exploitation,
                resultatNet: resultatData.resultats.net,
                totalActif: bilanData.actif.totalActif,
                capitauxPropres: bilanData.passif.capitalSocial + bilanData.passif.reserves,
                tresorerie: bilanData.actif.tresorerieActif - bilanData.passif.tresoreriePassif,
                ratios: {
                    liquidite: bilanData.actif.tresorerieActif / bilanData.passif.dettesExploitation,
                    autonomie: (bilanData.passif.capitalSocial + bilanData.passif.reserves) / bilanData.passif.totalPassif,
                    rentabilite: resultatData.resultats.net / resultatData.produits.totalProduits
                }
            };
        }

        generateChartData(bilanData, resultatData) {
            return {
                repartitionActif: {
                    labels: ['Immobilisations', 'Stocks', 'Créances', 'Trésorerie'],
                    data: [
                        bilanData.actif.immobilisationsCorporelles + bilanData.actif.immobilisationsIncorporelles,
                        bilanData.actif.stocks,
                        bilanData.actif.creances,
                        bilanData.actif.tresorerieActif
                    ]
                },
                repartitionPassif: {
                    labels: ['Capitaux propres', 'Dettes financières', 'Dettes d\'exploitation'],
                    data: [
                        bilanData.passif.capitalSocial + bilanData.passif.reserves,
                        bilanData.passif.dettesFinancieres,
                        bilanData.passif.dettesExploitation
                    ]
                },
                evolutionResultat: {
                    labels: ['Produits d\'exploitation', 'Charges d\'exploitation', 'Résultat'],
                    data: [
                        resultatData.produits.exploitation,
                        resultatData.charges.exploitation,
                        resultatData.resultats.exploitation
                    ]
                }
            };
        }

        calculateTrends(companyId, period) {
            // Simulation du calcul des tendances
            return {
                chiffreAffaires: { trend: 'up', percentage: 5.2 },
                charges: { trend: 'up', percentage: 2.1 },
                resultat: { trend: 'up', percentage: 8.7 },
                tresorerie: { trend: 'down', percentage: -1.5 }
            };
        }

        generateAlerts(bilanData, resultatData) {
            const alerts = [];
            
            // Vérifier la trésorerie
            const tresorerie = bilanData.actif.tresorerieActif - bilanData.passif.tresoreriePassif;
            if (tresorerie < 0) {
                alerts.push({
                    type: 'warning',
                    title: 'Trésorerie négative',
                    message: 'La trésorerie de l\'entreprise est négative'
                });
            }
            
            // Vérifier le résultat
            if (resultatData.resultats.net < 0) {
                alerts.push({
                    type: 'danger',
                    title: 'Résultat déficitaire',
                    message: 'L\'entreprise présente un résultat négatif'
                });
            }
            
            return alerts;
        }
    }

    // =============================================================================
    // 🎯 INITIALISATION ET INTÉGRATION
    // =============================================================================
    
    // Créer les instances
    window.reportGenerator = new ReportGenerator();
    window.dashboardManager = new DashboardManager();

    // Intégrer au système unifié si disponible
    if (window.unifiedManager) {
        window.unifiedManager.reportGenerator = window.reportGenerator;
        window.unifiedManager.dashboardManager = window.dashboardManager;
        
        console.log('✅ Générateurs de rapports intégrés au système unifié');
    }

    // Fonctions globales pour les rapports
    window.generateBalanceSheet = async function() {
        const companyId = window.app?.currentCompanyId || 1;
        const startDate = '2024-01-01';
        const endDate = new Date().toISOString().split('T')[0];
        
        const result = await window.reportGenerator.generateBilan(companyId, startDate, endDate);
        
        if (result.success) {
            console.log('📊 Bilan généré:', result.data);
            if (window.unifiedManager?.notificationManager) {
                window.unifiedManager.notificationManager.show('success', 'Bilan généré', 'Le bilan a été généré avec succès');
            }
        }
    };

    window.generateIncomeStatement = async function() {
        const companyId = window.app?.currentCompanyId || 1;
        const startDate = '2024-01-01';
        const endDate = new Date().toISOString().split('T')[0];
        
        const result = await window.reportGenerator.generateCompteResultat(companyId, startDate, endDate);
        
        if (result.success) {
            console.log('📊 Compte de résultat généré:', result.data);
            if (window.unifiedManager?.notificationManager) {
                window.unifiedManager.notificationManager.show('success', 'Compte de résultat généré', 'Le compte de résultat a été généré avec succès');
            }
        }
    };

    window.generateTrialBalance = async function() {
        const companyId = window.app?.currentCompanyId || 1;
        const startDate = '2024-01-01';
        const endDate = new Date().toISOString().split('T')[0];
        
        const result = await window.reportGenerator.generateBalanceGenerale(companyId, startDate, endDate);
        
        if (result.success) {
            console.log('📊 Balance générale générée:', result.data);
            if (window.unifiedManager?.notificationManager) {
                window.unifiedManager.notificationManager.show('success', 'Balance générale générée', 'La balance générale a été générée avec succès');
            }
        }
    };

    console.log('✅ Module Rapports chargé avec succès');

})();
