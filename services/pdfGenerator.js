// ============================================
// SERVICE : Génération PDF des États Financiers
// Version : V3.0 — Format SYSCOHADA normalisé (réf/brut/amort/net/N-1)
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
        tableBorder: '#dadce0',
        totalBg:     '#e8f0fe'
    }
};

class PDFGeneratorService {

    async generateAllReports(reportData, accountingSystem, requestId) {
        console.log(`[PDFGenerator] Génération en mémoire pour request ${requestId}`);
        const pdfFiles = {};

        pdfFiles.bilan = await this.generateBilan(reportData, accountingSystem);
        console.log('[PDFGenerator] ✅ Bilan généré');

        pdfFiles.compte_resultat = await this.generateCompteResultat(reportData, accountingSystem);
        console.log('[PDFGenerator] ✅ Compte de Résultat généré');

        pdfFiles.tft = await this.generateTableauFluxTresorerie(reportData, accountingSystem);
        console.log('[PDFGenerator] ✅ TFT généré');

        if (accountingSystem.includes('NORMAL') && reportData.annexes) {
            pdfFiles.annexes = await this.generateAnnexes(reportData, accountingSystem);
            console.log('[PDFGenerator] ✅ Annexes générées');
        }

        console.log('[PDFGenerator] ✅ Tous les rapports générés avec succès');
        return pdfFiles;
    }

    _generatePDFToBase64(buildFn) {
        return new Promise((resolve, reject) => {
            const doc    = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
            const chunks = [];
            doc.on('data',  chunk => chunks.push(chunk));
            doc.on('end',   ()    => resolve(Buffer.concat(chunks).toString('base64')));
            doc.on('error', err   => reject(err));
            try { buildFn(doc); doc.end(); } catch (err) { reject(err); }
        });
    }

    async generateBilan(reportData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, reportData, 'BILAN COMPTABLE', accountingSystem);
            doc.moveDown(1.5);

            const equilibre = reportData.bilan?.totaux?.equilibre;
            doc.fontSize(9).fillColor(equilibre === false ? PDF_CONFIG.colors.danger : PDF_CONFIG.colors.success);
            doc.text(equilibre === false ? '⚠ Bilan non équilibré' : '✓ Bilan équilibré', { align: 'right' });
            doc.moveDown(0.5);

            doc.fontSize(13).fillColor('#000').text('ACTIF', { underline: true });
            doc.moveDown(0.3);
            this.drawBilanActifTable(doc, reportData.bilan.actif);

            doc.moveDown(1);

            doc.fontSize(13).fillColor('#000').text('PASSIF', { underline: true });
            doc.moveDown(0.3);
            this.drawBilanPassifTable(doc, reportData.bilan.passif);

            this.addFooter(doc, reportData);
        });
    }

    drawBilanActifTable(doc, lignes) {
        const startX   = 50;
        let   startY   = doc.y;
        const colWidth = [28, 160, 24, 72, 72, 72, 72];
        const headers  = ['Réf', 'Poste', 'Note', 'Brut', 'Amort.', 'Net N', 'N-1'];
        const aligns   = ['left', 'left', 'left', 'right', 'right', 'right', 'right'];

        startY = this._drawTableHeader(doc, startX, startY, colWidth, headers, aligns);

        doc.fontSize(8).fillColor('#000');
        for (const l of (lignes || [])) {
            startY = this._drawRow(doc, startX, startY, colWidth, [
                l.ref, l.libelle, l.note || '',
                l.isTotal ? '' : this.formatAmount(l.brut),
                l.isTotal ? '' : this.formatAmount(l.amort),
                this.formatAmount(l.net),
                this.formatAmount(l.net_n1)
            ], aligns, l.isTotal);
            if (startY > 700) { doc.addPage(); startY = 50; }
        }
        doc.y = startY;
    }

    drawBilanPassifTable(doc, lignes) {
        const startX   = 50;
        let   startY   = doc.y;
        const colWidth = [28, 254, 24, 97, 97];
        const headers  = ['Réf', 'Poste', 'Note', 'Net N', 'Net N-1'];
        const aligns   = ['left', 'left', 'left', 'right', 'right'];

        startY = this._drawTableHeader(doc, startX, startY, colWidth, headers, aligns);

        doc.fontSize(8).fillColor('#000');
        for (const l of (lignes || [])) {
            startY = this._drawRow(doc, startX, startY, colWidth, [
                l.ref, l.libelle, l.note || '',
                this.formatAmount(l.net),
                this.formatAmount(l.net_n1)
            ], aligns, l.isTotal);
            if (startY > 700) { doc.addPage(); startY = 50; }
        }
        doc.y = startY;
    }

    async generateCompteResultat(reportData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, reportData, 'COMPTE DE RÉSULTAT', accountingSystem);
            doc.moveDown(1.5);

            const startX   = 50;
            let   startY   = doc.y;
            const colWidth = [32, 20, 260, 28, 80, 80];
            const headers  = ['Réf', 'S.', 'Poste', 'Note', 'Montant N', 'Montant N-1'];
            const aligns   = ['left', 'center', 'left', 'left', 'right', 'right'];

            startY = this._drawTableHeader(doc, startX, startY, colWidth, headers, aligns);

            doc.fontSize(8).fillColor('#000');
            for (const l of (reportData.compte_resultat.lignes || [])) {
                startY = this._drawRow(doc, startX, startY, colWidth, [
                    l.ref, l.sens || '', l.libelle, l.note || '',
                    this.formatAmount(l.montant_n),
                    this.formatAmount(l.montant_n1)
                ], aligns, l.isTotal);
                if (startY > 700) { doc.addPage(); startY = 50; }
            }
            doc.y = startY;

            doc.moveDown(2);
            const resultat      = reportData.compte_resultat.resultat_net || 0;
            const resultatColor = resultat >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
            doc.fontSize(13).fillColor(resultatColor);
            doc.text(`RÉSULTAT NET : ${this.formatAmount(Math.abs(resultat))} (${resultat >= 0 ? 'Bénéfice' : 'Perte'})`, { align: 'center' });

            this.addFooter(doc, reportData);
        });
    }

    async generateTableauFluxTresorerie(reportData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, reportData, 'TABLEAU DES FLUX DE TRÉSORERIE', accountingSystem);
            doc.moveDown(1.5);

            const startX   = 50;
            let   startY   = doc.y;
            const colWidth = [32, 25, 333, 110];
            const headers  = ['Réf', 'S.', 'Poste', 'Montant N'];
            const aligns   = ['left', 'center', 'left', 'right'];

            startY = this._drawTableHeader(doc, startX, startY, colWidth, headers, aligns);

            doc.fontSize(8).fillColor('#000');
            for (const l of (reportData.tft.lignes || [])) {
                startY = this._drawRow(doc, startX, startY, colWidth, [
                    l.ref, l.sens || '', l.libelle, this.formatAmount(l.montant_n)
                ], aligns, l.isTotal);
                if (startY > 700) { doc.addPage(); startY = 50; }
            }
            doc.y = startY;

            doc.moveDown(2);
            const tresFin = reportData.tft.tresorerie_finale || 0;
            const c       = tresFin >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
            doc.fontSize(13).fillColor(c);
            doc.text(`TRÉSORERIE FINALE : ${this.formatAmount(tresFin)}`, { align: 'center' });

            this.addFooter(doc, reportData);
        });
    }

    async generateAnnexes(reportData, accountingSystem) {
        return this._generatePDFToBase64(doc => {
            this.addHeader(doc, reportData, 'NOTES ANNEXES', accountingSystem);
            doc.moveDown(2);

            const a = reportData.annexes;
            if (!a) { doc.fontSize(10).text('Aucune annexe disponible.'); this.addFooter(doc, reportData); return; }

            this.addAnnexeSection(doc, '1. PRINCIPES ET MÉTHODES COMPTABLES', [
                `Système : ${a.principes_comptables?.systeme || ''}`,
                `Exercice : ${a.principes_comptables?.exercice || ''}`,
                `Devise : ${a.principes_comptables?.devise || ''}`,
                `Amortissement : ${a.principes_comptables?.methode_amortissement || ''}`,
                `Stocks : ${a.principes_comptables?.methode_evaluation_stocks || ''}`
            ]);

            doc.addPage();
            this.addAnnexeSection(doc, '2. ÉTAT DES IMMOBILISATIONS', null);
            this.drawImmobilisationsTable(doc, a.immobilisations);

            doc.addPage();
            this.addAnnexeSection(doc, '3. ÉTAT DES AMORTISSEMENTS', [
                `Dotations exercice : ${this.formatAmount(a.amortissements?.dotations_exercice)}`,
                `Cumul : ${this.formatAmount(a.amortissements?.cumul)}`
            ]);

            this.addAnnexeSection(doc, '4. ÉTAT DES PROVISIONS', [
                `Dotations : ${this.formatAmount(a.provisions?.dotations)}`,
                `Reprises : ${this.formatAmount(a.provisions?.reprises)}`,
                `Solde : ${this.formatAmount(a.provisions?.solde)}`
            ]);

            this.addAnnexeSection(doc, '5. CRÉANCES ET DETTES', [
                'CRÉANCES :',
                `  - Moins d'un an : ${this.formatAmount(a.creances_dettes?.creances?.moins_1_an)}`,
                `  - Plus d'un an  : ${this.formatAmount(a.creances_dettes?.creances?.plus_1_an)}`,
                'DETTES :',
                `  - Moins d'un an : ${this.formatAmount(a.creances_dettes?.dettes?.moins_1_an)}`,
                `  - Plus d'un an  : ${this.formatAmount(a.creances_dettes?.dettes?.plus_1_an)}`
            ]);

            this.addFooter(doc, reportData);
        });
    }

    _drawTableHeader(doc, startX, startY, colWidth, headers, aligns) {
        const rowHeight = 22;
        let x = startX;
        headers.forEach((h, i) => {
            doc.rect(x, startY, colWidth[i], rowHeight).fill(PDF_CONFIG.colors.primary);
            doc.fillColor('#fff').fontSize(8).text(h, x + 3, startY + 7, { width: colWidth[i] - 6, align: aligns[i] });
            x += colWidth[i];
        });
        return startY + rowHeight;
    }

    _drawRow(doc, startX, startY, colWidth, values, aligns, isTotal = false) {
        const rowHeight = isTotal ? 20 : 17;
        let x = startX;

        if (isTotal) {
            doc.rect(startX, startY, colWidth.reduce((a, b) => a + b, 0), rowHeight).fill(PDF_CONFIG.colors.totalBg);
        }

        doc.fontSize(isTotal ? 8.5 : 8).fillColor('#000');
        values.forEach((v, i) => {
            doc.rect(x, startY, colWidth[i], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
               .text(String(v ?? ''), x + 3, startY + (isTotal ? 6 : 4.5), { width: colWidth[i] - 6, align: aligns[i] });
            x += colWidth[i];
        });
        doc.font('Helvetica');
        return startY + rowHeight;
    }

    drawImmobilisationsTable(doc, immobilisations) {
        if (!immobilisations || immobilisations.length === 0) {
            doc.fontSize(10).text('Aucune immobilisation sur la période.');
            return;
        }
        const startX    = 50;
        let   startY    = doc.y;
        const colWidth  = [200, 100, 100, 100];
        const rowHeight = 25;

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

    addHeader(doc, reportData, title, accountingSystem) {
        const company = reportData.company || {};
        const period  = reportData.period  || {};
        doc.fontSize(16).fillColor(PDF_CONFIG.colors.primary).text(company.name || '', { align: 'center' });
        doc.fontSize(10).fillColor('#000').text(company.street || '', { align: 'center' });
        doc.text(`${company.city || ''} ${company.zip || ''}`, { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(18).fillColor('#000').text(title, { align: 'center', underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Exercice du ${period.start || ''} au ${period.end || ''}`, { align: 'center' });
        doc.fontSize(9).fillColor(PDF_CONFIG.colors.secondary).text(`Système : ${accountingSystem}`, { align: 'center' });
        doc.moveDown(1);
        doc.strokeColor(PDF_CONFIG.colors.tableBorder).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    }

    addFooter(doc, reportData) {
        doc.fontSize(8).fillColor(PDF_CONFIG.colors.secondary);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 750, { align: 'left' });
        doc.text('Doukè Compta Pro', 50, 750, { align: 'right' });
    }

    formatAmount(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return '0,00';
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    }
}

module.exports = new PDFGeneratorService();
