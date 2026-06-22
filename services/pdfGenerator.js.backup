// ============================================
// SERVICE : Génération PDF des États Financiers
// Version : V2.0 — Buffer mémoire (Render Free compatible)
// Description : PDFs générés en mémoire → base64 → stockés en DB
// Librairie : PDFKit
// ============================================

const PDFDocument = require('pdfkit');

const PDF_CONFIG = {
    colors: {
        primary:     '#1a73e8',
        secondary:   '#5f6368',
        success:     '#1e8e3e',
        danger:      '#d93025',
        tableHeader: '#f1f3f4',
        tableBorder: '#dadce0'
    }
};

class PDFGeneratorService {

    // ─────────────────────────────────────────
    // GÉNÉRATION DE TOUS LES RAPPORTS
    // ─────────────────────────────────────────
    async generateAllReports(odooData, accountingSystem, requestId) {
        console.log(`[PDFGenerator] Génération en mémoire pour request ${requestId}`);

        const pdfFiles = {};

        pdfFiles.bilan = await this.generateBilan(odooData, accountingSystem);
        console.log('[PDFGenerator] ✅ Bilan généré');

        pdfFiles.compte_resultat = await this.generateCompteResultat(odooData, accountingSystem);
        console.log('[PDFGenerator] ✅ Compte de Résultat généré');

        pdfFiles.tft = await this.generateTableauFluxTresorerie(odooData, accountingSystem);
        console.log('[PDFGenerator] ✅ TFT généré');

        if (accountingSystem.includes('NORMAL')) {
            pdfFiles.annexes = await this.generateAnnexes(odooData, accountingSystem);
            console.log('[PDFGenerator] ✅ Annexes générées');
        }

        console.log('[PDFGenerator] ✅ Tous les rapports générés avec succès');
        return pdfFiles;
    }

    // ─────────────────────────────────────────
    // UTILITAIRE : PDF → base64 en mémoire
    // ─────────────────────────────────────────
    _generatePDFToBase64(buildFn) {
        return new Promise((resolve, reject) => {
            const doc    = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
            const chunks = [];

            doc.on('data',  chunk => chunks.push(chunk));
            doc.on('end',   ()    => resolve(Buffer.concat(chunks).toString('base64')));
            doc.on('error', err   => reject(err));

            try {
                buildFn(doc);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // ─────────────────────────────────────────
    // BILAN
    // ─────────────────────────────────────────
    async generateBilan(odooData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, odooData, 'BILAN COMPTABLE', accountingSystem);
            doc.moveDown(2);

            doc.fontSize(14).fillColor('#000').text('ACTIF', { underline: true });
            doc.moveDown(0.5);
            this.drawBilanTable(doc, odooData.bilan.actif);

            doc.moveDown(1);

            doc.fontSize(14).fillColor('#000').text('PASSIF', { underline: true });
            doc.moveDown(0.5);
            this.drawBilanTable(doc, odooData.bilan.passif);

            doc.moveDown(2);
            doc.fontSize(12).fillColor('#000');
            doc.text(`Total Actif  : ${this.formatAmount(odooData.bilan.totaux.actif)}`,  { align: 'right' });
            doc.text(`Total Passif : ${this.formatAmount(odooData.bilan.totaux.passif)}`, { align: 'right' });

            this.addFooter(doc, odooData);
        });
    }

    // ─────────────────────────────────────────
    // COMPTE DE RÉSULTAT
    // ─────────────────────────────────────────
    async generateCompteResultat(odooData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, odooData, 'COMPTE DE RÉSULTAT', accountingSystem);
            doc.moveDown(2);

            const isEBNL      = accountingSystem.startsWith('SYCEBNL');
            const chargesLabel = isEBNL ? 'EMPLOIS'    : 'CHARGES';
            const produitsLabel= isEBNL ? 'RESSOURCES' : 'PRODUITS';

            doc.fontSize(14).fillColor('#000').text(chargesLabel, { underline: true });
            doc.moveDown(0.5);
            this.drawCompteResultatTable(doc, odooData.compte_resultat.charges);

            doc.moveDown(1);

            doc.fontSize(14).fillColor('#000').text(produitsLabel, { underline: true });
            doc.moveDown(0.5);
            this.drawCompteResultatTable(doc, odooData.compte_resultat.produits);

            doc.moveDown(2);
            const resultat      = odooData.compte_resultat.totaux.resultat;
            const resultatColor = resultat >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;

            doc.fontSize(14).fillColor(resultatColor);
            doc.text(`RÉSULTAT NET : ${this.formatAmount(Math.abs(resultat))}`, { align: 'center' });
            doc.fontSize(12).fillColor('#000');
            doc.text(`(${odooData.compte_resultat.totaux.resultat_label})`, { align: 'center' });

            this.addFooter(doc, odooData);
        });
    }

    // ─────────────────────────────────────────
    // TABLEAU DES FLUX DE TRÉSORERIE
    // ─────────────────────────────────────────
    async generateTableauFluxTresorerie(odooData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, odooData, 'TABLEAU DES FLUX DE TRÉSORERIE', accountingSystem);
            doc.moveDown(2);

            const tft      = odooData.tableau_flux_tresorerie;
            const startX   = 50;
            let   startY   = doc.y;
            const colWidth = [350, 150];
            const rowHeight= 30;

            const rows = [
                { label: 'Flux liés aux activités opérationnelles', value: tft.flux_operationnels,  bold: true },
                { label: 'Flux liés aux activités d\'investissement', value: tft.flux_investissement, bold: true },
                { label: 'Flux liés aux activités de financement',   value: tft.flux_financement,    bold: true },
                { label: '', value: null },
                { label: 'VARIATION NETTE DE TRÉSORERIE', value: tft.variation_nette, bold: true, highlight: true },
                { label: '', value: null },
                { label: 'Trésorerie au début de l\'exercice', value: tft.tresorerie_initiale },
                { label: 'Trésorerie à la fin de l\'exercice',  value: tft.tresorerie_finale }
            ];

            for (const row of rows) {
                if (!row.label) { startY += 10; continue; }

                if (row.highlight) {
                    doc.rect(startX, startY, colWidth[0] + colWidth[1], rowHeight)
                       .fill(PDF_CONFIG.colors.tableHeader);
                }

                doc.fontSize(row.bold ? 11 : 10).fillColor('#000');
                doc.text(row.label, startX + 5, startY + 10, { width: colWidth[0] - 10 });

                if (row.value !== null && row.value !== undefined) {
                    const c = row.value >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
                    doc.fillColor(c);
                    doc.text(this.formatAmount(row.value), startX + colWidth[0] + 5, startY + 10, { width: colWidth[1] - 10, align: 'right' });
                }

                doc.rect(startX, startY, colWidth[0] + colWidth[1], rowHeight)
                   .stroke(PDF_CONFIG.colors.tableBorder);

                startY += rowHeight;
            }

            this.addFooter(doc, odooData);
        });
    }

    // ─────────────────────────────────────────
    // ANNEXES
    // ─────────────────────────────────────────
    async generateAnnexes(odooData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, odooData, 'NOTES ANNEXES', accountingSystem);
            doc.moveDown(2);

            const a = odooData.annexes;

            this.addAnnexeSection(doc, '1. PRINCIPES ET MÉTHODES COMPTABLES', [
                `Système : ${a.principes_comptables.systeme}`,
                `Exercice : ${a.principes_comptables.exercice}`,
                `Devise : ${a.principes_comptables.devise}`,
                `Amortissement : ${a.principes_comptables.methode_amortissement}`,
                `Stocks : ${a.principes_comptables.methode_evaluation_stocks}`
            ]);

            doc.addPage();
            this.addAnnexeSection(doc, '2. ÉTAT DES IMMOBILISATIONS', null);
            this.drawImmobilisationsTable(doc, a.immobilisations);

            doc.addPage();
            this.addAnnexeSection(doc, '3. ÉTAT DES AMORTISSEMENTS', [
                `Dotations exercice : ${this.formatAmount(a.amortissements.dotations_exercice)}`,
                `Cumul : ${this.formatAmount(a.amortissements.cumul)}`
            ]);

            this.addAnnexeSection(doc, '4. ÉTAT DES PROVISIONS', [
                `Dotations : ${this.formatAmount(a.provisions.dotations)}`,
                `Reprises : ${this.formatAmount(a.provisions.reprises)}`,
                `Solde : ${this.formatAmount(a.provisions.solde)}`
            ]);

            this.addAnnexeSection(doc, '5. CRÉANCES ET DETTES', [
                'CRÉANCES :',
                `  - Moins d\'un an : ${this.formatAmount(a.creances_dettes.creances.moins_1_an)}`,
                `  - Plus d\'un an  : ${this.formatAmount(a.creances_dettes.creances.plus_1_an)}`,
                'DETTES :',
                `  - Moins d\'un an : ${this.formatAmount(a.creances_dettes.dettes.moins_1_an)}`,
                `  - Plus d\'un an  : ${this.formatAmount(a.creances_dettes.dettes.plus_1_an)}`
            ]);

            this.addFooter(doc, odooData);
        });
    }

    // ─────────────────────────────────────────
    // UTILITAIRES DE RENDU
    // ─────────────────────────────────────────
    drawBilanTable(doc, data) {
        const startX   = 50;
        let   startY   = doc.y;
        const colWidth = [250, 100, 100];
        const rowHeight= 25;

        // En-têtes
        doc.fontSize(10).fillColor('#fff');
        doc.rect(startX,                         startY, colWidth[0], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0],           startY, colWidth[1], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0] + colWidth[1], startY, colWidth[2], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.fillColor('#fff')
           .text('Poste', startX + 5, startY + 8)
           .text('Brut',  startX + colWidth[0] + 5, startY + 8)
           .text('Net',   startX + colWidth[0] + colWidth[1] + 5, startY + 8);

        startY += rowHeight;

        doc.fontSize(9).fillColor('#000');
        for (const [, category] of Object.entries(data)) {
            doc.rect(startX,                         startY, colWidth[0], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0],           startY, colWidth[1], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0] + colWidth[1], startY, colWidth[2], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);

            doc.text(category.label,                         startX + 5,                          startY + 8, { width: colWidth[0] - 10 });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + 5,     startY + 8, { width: colWidth[1] - 10, align: 'right' });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + colWidth[1] + 5, startY + 8, { width: colWidth[2] - 10, align: 'right' });

            startY += rowHeight;
            if (startY > 700) { doc.addPage(); startY = 50; }
        }
        doc.y = startY;
    }

    drawCompteResultatTable(doc, data) {
        const startX   = 50;
        let   startY   = doc.y;
        const colWidth = [350, 150];
        const rowHeight= 25;

        doc.fontSize(10).fillColor('#fff');
        doc.rect(startX,           startY, colWidth[0], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.fillColor('#fff')
           .text('Poste',   startX + 5,           startY + 8)
           .text('Montant', startX + colWidth[0] + 5, startY + 8);

        startY += rowHeight;

        doc.fontSize(9).fillColor('#000');
        for (const [, category] of Object.entries(data)) {
            doc.rect(startX,           startY, colWidth[0], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);

            doc.text(category.label,                               startX + 5,           startY + 8, { width: colWidth[0] - 10 });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + 5, startY + 8, { width: colWidth[1] - 10, align: 'right' });

            startY += rowHeight;
            if (startY > 700) { doc.addPage(); startY = 50; }
        }
        doc.y = startY;
    }

    drawImmobilisationsTable(doc, immobilisations) {
        if (!immobilisations || immobilisations.length === 0) {
            doc.fontSize(10).text('Aucune immobilisation sur la période.');
            return;
        }

        const startX   = 50;
        let   startY   = doc.y;
        const colWidth = [200, 100, 100, 100];
        const rowHeight= 25;

        ['Catégorie', 'Valeur brute', 'Acquisitions', 'Cessions'].forEach((header, i) => {
            const x = startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0);
            doc.rect(x, startY, colWidth[i], rowHeight).fill(PDF_CONFIG.colors.primary);
            doc.fillColor('#fff').fontSize(9).text(header, x + 5, startY + 8);
        });

        startY += rowHeight;

        doc.fontSize(9).fillColor('#000');
        immobilisations.forEach(immo => {
            [immo.code, this.formatAmount(immo.valeur_brute), '0,00', '0,00'].forEach((value, i) => {
                const x = startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0);
                doc.rect(x, startY, colWidth[i], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
                doc.text(value, x + 5, startY + 8, { width: colWidth[i] - 10, align: i > 0 ? 'right' : 'left' });
            });
            startY += rowHeight;
        });

        doc.y = startY;
    }

    addAnnexeSection(doc, title, items) {
        doc.fontSize(12).fillColor('#000').text(title, { underline: true });
        doc.moveDown(0.5);
        if (items && items.length > 0) {
            doc.fontSize(10);
            items.forEach(item => { doc.text(item); doc.moveDown(0.3); });
        }
        doc.moveDown(1);
    }

    addHeader(doc, odooData, title, accountingSystem) {
        doc.fontSize(16).fillColor(PDF_CONFIG.colors.primary).text(odooData.company.name, { align: 'center' });
        doc.fontSize(10).fillColor('#000').text(odooData.company.street || '', { align: 'center' });
        doc.text(`${odooData.company.city || ''} ${odooData.company.zip || ''}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(18).fillColor('#000').text(title, { align: 'center', underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Exercice du ${odooData.period.start} au ${odooData.period.end}`, { align: 'center' });
        doc.fontSize(9).fillColor(PDF_CONFIG.colors.secondary).text(`Système : ${accountingSystem}`, { align: 'center' });
        doc.moveDown(1);
        doc.strokeColor(PDF_CONFIG.colors.tableBorder).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    }

    addFooter(doc, odooData) {
        doc.fontSize(8).fillColor(PDF_CONFIG.colors.secondary);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 750, { align: 'left' });
        doc.text('Doukè Compta Pro', 50, 750, { align: 'right' });
    }

    formatAmount(amount) {
        if (amount === null || amount === undefined) return '0,00';
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    }
}

module.exports = new PDFGeneratorService();
