// =============================================================================
// DOUKÈ Compta Pro - Générateur de Rapports
// reports.js - Génération des rapports comptables SYSCOHADA
// =============================================================================

class ReportGenerator {
    constructor() {
        this.companyData = null;
        this.reportDate = null;
    }

    // =============================================================================
    // RAPPORT: BILAN COMPTABLE
    // =============================================================================

    generateBalanceSheet(companyId, date = new Date()) {
        this.companyData = this.getCompanyData(companyId);
        this.reportDate = date;

        const accounts = this.getAccountsAtDate(date);
        const balances = this.calculateBalances(accounts);

        const actif = this.buildActif(balances);
        const passif = this.buildPassif(balances);

        return {
            type: 'bilan',
            company: this.companyData,
            date: date,
            actif: actif,
            passif: passif,
            totalActif: this.sumBalances(actif),
            totalPassif: this.sumBalances(passif),
            balanced: Math.abs(this.sumBalances(actif) - this.sumBalances(passif)) < 0.01
        };
    }

    buildActif(balances) {
        return {
            immobilisations: {
                incorporelles: this.getBalancesByCategory(balances, 'Immobilisations incorporelles'),
                corporelles: this.getBalancesByCategory(balances, 'Immobilisations corporelles'),
                financieres: this.getBalancesByCategory(balances, 'Immobilisations financières'),
                subtotal: 0
            },
            actifCirculant: {
                stocks: this.getBalancesByCategory(balances, 'Stocks'),
                creances: this.getBalancesByCategory(balances, 'Clients'),
                tresorerie: this.getBalancesByCategory(balances, ['Banques', 'Caisse']),
                subtotal: 0
            },
            total: 0
        };
    }

    buildPassif(balances) {
        return {
            capitauxPropres: {
                capital: this.getBalancesByCategory(balances, 'Capitaux propres'),
                reserves: this.getBalancesByCategory(balances, 'Réserves'),
                resultat: this.getBalancesByCategory(balances, 'Résultat'),
                subtotal: 0
            },
            dettes: {
                financieres: this.getBalancesByCategory(balances, 'Dettes financières'),
                fournisseurs: this.getBalancesByCategory(balances, 'Fournisseurs'),
                fiscales: this.getBalancesByCategory(balances, 'État'),
                sociales: this.getBalancesByCategory(balances, 'Organismes sociaux'),
                subtotal: 0
            },
            total: 0
        };
    }

    // =============================================================================
    // RAPPORT: COMPTE DE RÉSULTAT
    // =============================================================================

    generateIncomeStatement(companyId, startDate, endDate) {
        this.companyData = this.getCompanyData(companyId);
        const entries = this.getEntriesInPeriod(companyId, startDate, endDate);
        const balances = this.calculatePeriodBalances(entries);

        const charges = this.buildCharges(balances);
        const produits = this.buildProduits(balances);

        return {
            type: 'compte_resultat',
            company: this.companyData,
            period: { start: startDate, end: endDate },
            charges: charges,
            produits: produits,
            totalCharges: this.sumBalances(charges),
            totalProduits: this.sumBalances(produits),
            resultat: this.sumBalances(produits) - this.sumBalances(charges)
        };
    }

    buildCharges(balances) {
        return {
            exploitation: {
                achats: this.getAccountsByClass(balances, '60'),
                servicesExterieurs: this.getAccountsByClass(balances, '62'),
                autresCharges: this.getAccountsByClass(balances, '63'),
                personnel: this.getAccountsByClass(balances, '64'),
                subtotal: 0
            },
            financieres: {
                interets: this.getAccountsByClass(balances, '66'),
                perteChange: this.getAccountsByClass(balances, '67'),
                subtotal: 0
            },
            exceptionnelles: {
                surOperations: this.getAccountsByClass(balances, '68'),
                subtotal: 0
            },
            total: 0
        };
    }

    buildProduits(balances) {
        return {
            exploitation: {
                ventes: this.getAccountsByClass(balances, '70'),
                production: this.getAccountsByClass(balances, '71'),
                autresProduits: this.getAccountsByClass(balances, '75'),
                subtotal: 0
            },
            financiers: {
                interets: this.getAccountsByClass(balances, '77'),
                gainChange: this.getAccountsByClass(balances, '76'),
                subtotal: 0
            },
            exceptionnels: {
                surOperations: this.getAccountsByClass(balances, '78'),
                subtotal: 0
            },
            total: 0
        };
    }

    // =============================================================================
    // RAPPORT: BALANCE GÉNÉRALE
    // =============================================================================

    generateTrialBalance(companyId, date = new Date()) {
        const entries = this.getEntriesUpToDate(companyId, date);
        const accounts = window.app.accounts;
        const balances = this.calculateAccountBalances(entries, accounts);

        return {
            type: 'balance_generale',
            company: this.getCompanyData(companyId),
            date: date,
            accounts: balances.map(balance => ({
                code: balance.code,
                name: balance.name,
                debitMouvement: balance.debitMouvement,
                creditMouvement: balance.creditMouvement,
                debitSolde: balance.debitSolde,
                creditSolde: balance.creditSolde
            })),
            totaux: {
                debitMouvement: balances.reduce((sum, b) => sum + b.debitMouvement, 0),
                creditMouvement: balances.reduce((sum, b) => sum + b.creditMouvement, 0),
                debitSolde: balances.reduce((sum, b) => sum + b.debitSolde, 0),
                creditSolde: balances.reduce((sum, b) => sum + b.creditSolde, 0)
            }
        };
    }

    // =============================================================================
    // RAPPORT: TABLEAU DE FLUX DE TRÉSORERIE
    // =============================================================================

    generateCashFlow(companyId, startDate, endDate) {
        const entries = this.getEntriesInPeriod(companyId, startDate, endDate);
        const cashAccounts = ['512000', '521000', '531000', '571000']; // Comptes de trésorerie

        const fluxExploitation = this.calculateOperatingCashFlow(entries);
        const fluxInvestissement = this.calculateInvestingCashFlow(entries);
        const fluxFinancement = this.calculateFinancingCashFlow(entries);

        return {
            type: 'flux_tresorerie',
            company: this.getCompanyData(companyId),
            period: { start: startDate, end: endDate },
            exploitation: fluxExploitation,
            investissement: fluxInvestissement,
            financement: fluxFinancement,
            variationTresorerie: fluxExploitation.net + fluxInvestissement.net + fluxFinancement.net
        };
    }

    // =============================================================================
    // RAPPORT: ÉTAT DE CAISSE
    // =============================================================================

    generateCashReport(cashRegisterId, date = new Date()) {
        const cashRegister = window.app.cashRegisters.find(c => c.id === cashRegisterId);
        if (!cashRegister) throw new Error('Caisse introuvable');

        const operations = this.getCashOperations(cashRegisterId, date);
        
        return {
            type: 'etat_caisse',
            cashRegister: cashRegister,
            date: date,
            soldeOuverture: cashRegister.openingBalance,
            operations: operations,
            totalEntrees: operations.filter(op => op.type === 'entree').reduce((sum, op) => sum + op.amount, 0),
            totalSorties: operations.filter(op => op.type === 'sortie').reduce((sum, op) => sum + op.amount, 0),
            soldeFermeture: cashRegister.balance,
            ecart: 0 // À calculer selon recomptage physique
        };
    }

    // =============================================================================
    // MÉTHODES UTILITAIRES
    // =============================================================================

    getCompanyData(companyId) {
        return window.app.companies.find(c => c.id === companyId);
    }

    getEntriesInPeriod(companyId, startDate, endDate) {
        return window.app.entries.filter(entry => 
            entry.companyId === companyId &&
            entry.date >= startDate &&
            entry.date <= endDate &&
            entry.status === 'Validé'
        );
    }

    getEntriesUpToDate(companyId, date) {
        return window.app.entries.filter(entry => 
            entry.companyId === companyId &&
            entry.date <= date &&
            entry.status === 'Validé'
        );
    }

    calculateAccountBalances(entries, accounts) {
        const balances = accounts.map(account => ({
            code: account.code,
            name: account.name,
            nature: account.nature,
            debitMouvement: 0,
            creditMouvement: 0,
            debitSolde: 0,
            creditSolde: 0
        }));

        entries.forEach(entry => {
            entry.lines.forEach(line => {
                const balance = balances.find(b => b.code === line.account);
                if (balance) {
                    balance.debitMouvement += line.debit || 0;
                    balance.creditMouvement += line.credit || 0;
                }
            });
        });

        // Calculer les soldes
        balances.forEach(balance => {
            const difference = balance.debitMouvement - balance.creditMouvement;
            if (balance.nature === 'Debit') {
                if (difference >= 0) {
                    balance.debitSolde = difference;
                } else {
                    balance.creditSolde = Math.abs(difference);
                }
            } else {
                if (difference <= 0) {
                    balance.creditSolde = Math.abs(difference);
                } else {
                    balance.debitSolde = difference;
                }
            }
        });

        return balances.filter(b => b.debitMouvement > 0 || b.creditMouvement > 0);
    }

    getAccountsByClass(balances, classPrefix) {
        return balances.filter(balance => balance.code.startsWith(classPrefix));
    }

    getBalancesByCategory(balances, categories) {
        if (typeof categories === 'string') {
            categories = [categories];
        }
        return balances.filter(balance => 
            categories.some(cat => balance.category === cat)
        );
    }

    sumBalances(balances) {
        if (Array.isArray(balances)) {
            return balances.reduce((sum, balance) => sum + (balance.amount || balance.debitSolde || balance.creditSolde || 0), 0);
        }
        return Object.values(balances).reduce((sum, section) => {
            if (typeof section === 'object' && section.subtotal !== undefined) {
                return sum + section.subtotal;
            }
            return sum;
        }, 0);
    }

    calculateOperatingCashFlow(entries) {
        // Logique pour flux d'exploitation
        return { entrees: 0, sorties: 0, net: 0 };
    }

    calculateInvestingCashFlow(entries) {
        // Logique pour flux d'investissement
        return { entrees: 0, sorties: 0, net: 0 };
    }

    calculateFinancingCashFlow(entries) {
        // Logique pour flux de financement
        return { entrees: 0, sorties: 0, net: 0 };
    }

    getCashOperations(cashRegisterId, date) {
        // Récupérer les opérations de caisse pour la date
        return [];
    }
}

// =============================================================================
// SERVICE D'EXPORT
// =============================================================================

class ExportService {
    static async exportToPDF(reportData) {
        try {
            const blob = await window.apiService.exportReport(
                reportData.type,
                reportData.company.id,
                reportData,
                'pdf'
            );
            this.downloadBlob(blob, `${reportData.type}_${reportData.company.name}.pdf`);
        } catch (error) {
            console.error('Erreur export PDF:', error);
            throw error;
        }
    }

    static async exportToExcel(reportData) {
        try {
            const blob = await window.apiService.exportReport(
                reportData.type,
                reportData.company.id,
                reportData,
                'xlsx'
            );
            this.downloadBlob(blob, `${reportData.type}_${reportData.company.name}.xlsx`);
        } catch (error) {
            console.error('Erreur export Excel:', error);
            throw error;
        }
    }

    static downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    static printReport(reportData) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(this.generatePrintHTML(reportData));
        printWindow.document.close();
        printWindow.print();
    }

    static generatePrintHTML(reportData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportData.type} - ${reportData.company.name}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .company-name { font-size: 18px; font-weight: bold; }
                .report-title { font-size: 16px; margin: 10px 0; }
                .report-date { font-size: 14px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .number { text-align: right; }
                .total { font-weight: bold; background-color: #e0e0e0; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${reportData.company.name}</div>
                <div class="report-title">${this.getReportTitle(reportData.type)}</div>
                <div class="report-date">${this.formatDate(reportData.date || reportData.period?.end)}</div>
            </div>
            ${this.generateReportContent(reportData)}
        </body>
        </html>
        `;
    }

    static getReportTitle(type) {
        const titles = {
            'bilan': 'Bilan Comptable',
            'compte_resultat': 'Compte de Résultat',
            'balance_generale': 'Balance Générale',
            'flux_tresorerie': 'Tableau des Flux de Trésorerie',
            'etat_caisse': 'État de Caisse'
        };
        return titles[type] || 'Rapport';
    }

    static generateReportContent(reportData) {
        switch (reportData.type) {
            case 'bilan':
                return this.generateBilanHTML(reportData);
            case 'compte_resultat':
                return this.generateCompteResultatHTML(reportData);
            case 'balance_generale':
                return this.generateBalanceHTML(reportData);
            default:
                return '<p>Format de rapport non supporté</p>';
        }
    }

    static generateBilanHTML(data) {
        return `
        <table>
            <thead>
                <tr>
                    <th colspan="2">ACTIF</th>
                    <th>PASSIF</th>
                    <th>MONTANT</th>
                </tr>
            </thead>
            <tbody>
                <!-- Contenu du bilan à implémenter -->
            </tbody>
        </table>
        `;
    }

    static generateCompteResultatHTML(data) {
        return `
        <table>
            <thead>
                <tr>
                    <th>CHARGES</th>
                    <th>MONTANT</th>
                    <th>PRODUITS</th>
                    <th>MONTANT</th>
                </tr>
            </thead>
            <tbody>
                <!-- Contenu compte de résultat à implémenter -->
            </tbody>
        </table>
        `;
    }

    static generateBalanceHTML(data) {
        return `
        <table>
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Intitulé</th>
                    <th>Mouvement Débit</th>
                    <th>Mouvement Crédit</th>
                    <th>Solde Débit</th>
                    <th>Solde Crédit</th>
                </tr>
            </thead>
            <tbody>
                ${data.accounts.map(account => `
                <tr>
                    <td>${account.code}</td>
                    <td>${account.name}</td>
                    <td class="number">${window.formatService.formatCurrency(account.debitMouvement)}</td>
                    <td class="number">${window.formatService.formatCurrency(account.creditMouvement)}</td>
                    <td class="number">${window.formatService.formatCurrency(account.debitSolde)}</td>
                    <td class="number">${window.formatService.formatCurrency(account.creditSolde)}</td>
                </tr>
                `).join('')}
                <tr class="total">
                    <td colspan="2">TOTAUX</td>
                    <td class="number">${window.formatService.formatCurrency(data.totaux.debitMouvement)}</td>
                    <td class="number">${window.formatService.formatCurrency(data.totaux.creditMouvement)}</td>
                    <td class="number">${window.formatService.formatCurrency(data.totaux.debitSolde)}</td>
                    <td class="number">${window.formatService.formatCurrency(data.totaux.creditSolde)}</td>
                </tr>
            </tbody>
        </table>
        `;
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR');
    }
}

// Instances globales
window.reportGenerator = new ReportGenerator();
window.exportService = ExportService;

console.log('✅ Générateur de rapports SYSCOHADA chargé');
