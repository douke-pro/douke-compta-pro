// ============================================
// SERVICE : Génération PDF des États Financiers
// Description : Création de PDFs conformes SYSCOHADA, SYCEBNL, PCG
// Librairie : PDFKit
// ============================================

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * ============================================
 * CONFIGURATION GLOBALE
 * ============================================
 */
const PDF_CONFIG = {
    outputDir: path.join(__dirname, '../../public/reports/pdf'),
    fonts: {
        regular: path.join(__dirname, '../../assets/fonts/Arial.ttf'),
        bold: path.join(__dirname, '../../assets/fonts/Arial-Bold.ttf')
    },
    margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
    },
    colors: {
        primary: '#1a73e8',
        secondary: '#5f6368',
        success: '#1e8e3e',
        danger: '#d93025',
        tableHeader: '#f1f3f4',
        tableBorder: '#dadce0'
    }
};

/**
 * ============================================
 * CLASSE PRINCIPALE
 * ============================================
 */
class PDFGeneratorService {
    
    /**
     * Générer tous les rapports pour une demande
     */
    async generateAllReports(odooData, accountingSystem, requestId) {
        try {
            console.log(`[PDFGenerator] Génération des rapports pour request ${requestId}`);
            
            // Créer le dossier de sortie si nécessaire
            await this.ensureOutputDirectory();
            
            const pdfFiles = {};
            
            // 1. Générer le BILAN
            console.log('[PDFGenerator] Génération du Bilan...');
            pdfFiles.bilan = await this.generateBilan(odooData, accountingSystem, requestId);
            
            // 2. Générer le COMPTE DE RÉSULTAT
            console.log('[PDFGenerator] Génération du Compte de Résultat...');
            pdfFiles.compte_resultat = await this.generateCompteResultat(odooData, accountingSystem, requestId);
            
            // 3. Générer le TABLEAU DES FLUX DE TRÉSORERIE
            console.log('[PDFGenerator] Génération du TFT...');
            pdfFiles.tft = await this.generateTableauFluxTresorerie(odooData, accountingSystem, requestId);
            
            // 4. Générer les ANNEXES (si système normal)
            if (accountingSystem.includes('NORMAL')) {
                console.log('[PDFGenerator] Génération des Annexes...');
                pdfFiles.annexes = await this.generateAnnexes(odooData, accountingSystem, requestId);
            }
            
            console.log('[PDFGenerator] ✅ Tous les rapports générés avec succès');
            return pdfFiles;
            
        } catch (error) {
            console.error('[PDFGenerator] Erreur génération rapports:', error);
            throw new Error(`Erreur génération PDF: ${error.message}`);
        }
    }
    
    /**
     * S'assurer que le dossier de sortie existe
     */
    async ensureOutputDirectory() {
        if (!fs.existsSync(PDF_CONFIG.outputDir)) {
            fs.mkdirSync(PDF_CONFIG.outputDir, { recursive: true });
        }
    }
    
    /**
     * ============================================
     * GÉNÉRATION DU BILAN
     * ============================================
     */
    async generateBilan(odooData, accountingSystem, requestId) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `${requestId}_bilan.pdf`;
                const filepath = path.join(PDF_CONFIG.outputDir, filename);
                
                // Créer le document PDF
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: PDF_CONFIG.margins,
                    info: {
                        Title: 'Bilan Comptable',
                        Author: 'Doukè Compta Pro',
                        Subject: `Bilan ${odooData.company.name}`,
                        Keywords: 'bilan, comptabilité, SYSCOHADA'
                    }
                });
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);
                
                // EN-TÊTE
                this.addHeader(doc, odooData, 'BILAN COMPTABLE', accountingSystem);
                
                doc.moveDown(2);
                
                // ACTIF
                doc.fontSize(14).fillColor('#000').text('ACTIF', { underline: true });
                doc.moveDown(0.5);
                
                this.drawBilanTable(doc, odooData.bilan.actif, 'ACTIF');
                
                doc.moveDown(1);
                
                // PASSIF
                doc.fontSize(14).fillColor('#000').text('PASSIF', { underline: true });
                doc.moveDown(0.5);
                
                this.drawBilanTable(doc, odooData.bilan.passif, 'PASSIF');
                
                // TOTAUX
                doc.moveDown(2);
                doc.fontSize(12).fillColor('#000');
                doc.text(`Total Actif : ${this.formatAmount(odooData.bilan.totaux.actif)}`, { align: 'right', bold: true });
                doc.text(`Total Passif : ${this.formatAmount(odooData.bilan.totaux.passif)}`, { align: 'right', bold: true });
                
                // PIED DE PAGE
                this.addFooter(doc, odooData);
                
                // Finaliser
                doc.end();
                
                stream.on('finish', () => {
                    console.log(`[PDFGenerator] Bilan généré : ${filename}`);
                    resolve(`/reports/pdf/${filename}`);
                });
                
                stream.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Dessiner un tableau de bilan (Actif ou Passif)
     */
    drawBilanTable(doc, data, type) {
        const startX = 50;
        let startY = doc.y;
        const colWidth = [250, 100, 100];
        const rowHeight = 25;
        
        // En-têtes
        doc.fontSize(10).fillColor('#fff');
        doc.rect(startX, startY, colWidth[0], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0] + colWidth[1], startY, colWidth[2], rowHeight).fill(PDF_CONFIG.colors.primary);
        
        doc.fillColor('#fff').text('Poste', startX + 5, startY + 8);
        doc.text('Brut', startX + colWidth[0] + 5, startY + 8);
        doc.text('Net', startX + colWidth[0] + colWidth[1] + 5, startY + 8);
        
        startY += rowHeight;
        
        // Lignes de données
        doc.fontSize(9).fillColor('#000');
        
        for (const [key, category] of Object.entries(data)) {
            // Ligne de catégorie
            doc.rect(startX, startY, colWidth[0], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0] + colWidth[1], startY, colWidth[2], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            
            doc.text(category.label, startX + 5, startY + 8, { width: colWidth[0] - 10 });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + 5, startY + 8, { width: colWidth[1] - 10, align: 'right' });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + colWidth[1] + 5, startY + 8, { width: colWidth[2] - 10, align: 'right' });
            
            startY += rowHeight;
            
            // Vérifier si on doit changer de page
            if (startY > 700) {
                doc.addPage();
                startY = 50;
            }
        }
        
        doc.y = startY;
    }
    
    /**
     * ============================================
     * GÉNÉRATION DU COMPTE DE RÉSULTAT
     * ============================================
     */
    async generateCompteResultat(odooData, accountingSystem, requestId) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `${requestId}_compte_resultat.pdf`;
                const filepath = path.join(PDF_CONFIG.outputDir, filename);
                
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: PDF_CONFIG.margins
                });
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);
                
                // EN-TÊTE
                this.addHeader(doc, odooData, 'COMPTE DE RÉSULTAT', accountingSystem);
                
                doc.moveDown(2);
                
                // Déterminer les labels selon le système (EBNL ou normal)
                const isEBNL = accountingSystem.startsWith('SYCEBNL');
                const chargesLabel = isEBNL ? 'EMPLOIS' : 'CHARGES';
                const produitsLabel = isEBNL ? 'RESSOURCES' : 'PRODUITS';
                
                // CHARGES/EMPLOIS
                doc.fontSize(14).fillColor('#000').text(chargesLabel, { underline: true });
                doc.moveDown(0.5);
                
                this.drawCompteResultatTable(doc, odooData.compte_resultat.charges, chargesLabel);
                
                doc.moveDown(1);
                
                // PRODUITS/RESSOURCES
                doc.fontSize(14).fillColor('#000').text(produitsLabel, { underline: true });
                doc.moveDown(0.5);
                
                this.drawCompteResultatTable(doc, odooData.compte_resultat.produits, produitsLabel);
                
                // RÉSULTAT
                doc.moveDown(2);
                const resultat = odooData.compte_resultat.totaux.resultat;
                const resultatColor = resultat >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
                
                doc.fontSize(14).fillColor(resultatColor);
                doc.text(`RÉSULTAT NET : ${this.formatAmount(Math.abs(resultat))}`, { align: 'center', bold: true });
                doc.fontSize(12).fillColor('#000');
                doc.text(`(${odooData.compte_resultat.totaux.resultat_label})`, { align: 'center' });
                
                // PIED DE PAGE
                this.addFooter(doc, odooData);
                
                doc.end();
                
                stream.on('finish', () => {
                    console.log(`[PDFGenerator] Compte de résultat généré : ${filename}`);
                    resolve(`/reports/pdf/${filename}`);
                });
                
                stream.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Dessiner un tableau de compte de résultat
     */
    drawCompteResultatTable(doc, data, type) {
        const startX = 50;
        let startY = doc.y;
        const colWidth = [350, 150];
        const rowHeight = 25;
        
        // En-têtes
        doc.fontSize(10).fillColor('#fff');
        doc.rect(startX, startY, colWidth[0], rowHeight).fill(PDF_CONFIG.colors.primary);
        doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).fill(PDF_CONFIG.colors.primary);
        
        doc.fillColor('#fff').text('Poste', startX + 5, startY + 8);
        doc.text('Montant', startX + colWidth[0] + 5, startY + 8);
        
        startY += rowHeight;
        
        // Lignes de données
        doc.fontSize(9).fillColor('#000');
        
        for (const [key, category] of Object.entries(data)) {
            doc.rect(startX, startY, colWidth[0], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            doc.rect(startX + colWidth[0], startY, colWidth[1], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
            
            doc.text(category.label, startX + 5, startY + 8, { width: colWidth[0] - 10 });
            doc.text(this.formatAmount(Math.abs(category.balance)), startX + colWidth[0] + 5, startY + 8, { width: colWidth[1] - 10, align: 'right' });
            
            startY += rowHeight;
            
            if (startY > 700) {
                doc.addPage();
                startY = 50;
            }
        }
        
        doc.y = startY;
    }
    
    /**
     * ============================================
     * GÉNÉRATION DU TABLEAU DES FLUX DE TRÉSORERIE
     * ============================================
     */
    async generateTableauFluxTresorerie(odooData, accountingSystem, requestId) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `${requestId}_tft.pdf`;
                const filepath = path.join(PDF_CONFIG.outputDir, filename);
                
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: PDF_CONFIG.margins
                });
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);
                
                // EN-TÊTE
                this.addHeader(doc, odooData, 'TABLEAU DES FLUX DE TRÉSORERIE', accountingSystem);
                
                doc.moveDown(2);
                
                const tft = odooData.tableau_flux_tresorerie;
                
                // Tableau TFT
                const startX = 50;
                let startY = doc.y;
                const colWidth = [350, 150];
                const rowHeight = 30;
                
                const rows = [
                    { label: 'Flux de trésorerie liés aux activités opérationnelles', value: tft.flux_operationnels, bold: true },
                    { label: 'Flux de trésorerie liés aux activités d\'investissement', value: tft.flux_investissement, bold: true },
                    { label: 'Flux de trésorerie liés aux activités de financement', value: tft.flux_financement, bold: true },
                    { label: '', value: null }, // Ligne vide
                    { label: 'VARIATION NETTE DE TRÉSORERIE', value: tft.variation_nette, bold: true, highlight: true },
                    { label: '', value: null }, // Ligne vide
                    { label: 'Trésorerie au début de l\'exercice', value: tft.tresorerie_initiale },
                    { label: 'Trésorerie à la fin de l\'exercice', value: tft.tresorerie_finale },
                ];
                
                for (const row of rows) {
                    if (!row.label) {
                        startY += 10;
                        continue;
                    }
                    
                    if (row.highlight) {
                        doc.rect(startX, startY, colWidth[0] + colWidth[1], rowHeight).fill(PDF_CONFIG.colors.tableHeader);
                    }
                    
                    doc.fontSize(row.bold ? 11 : 10).fillColor('#000');
                    doc.text(row.label, startX + 5, startY + 10, { width: colWidth[0] - 10 });
                    
                    if (row.value !== null) {
                        const valueColor = row.value >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger;
                        doc.fillColor(valueColor);
                        doc.text(this.formatAmount(row.value), startX + colWidth[0] + 5, startY + 10, { width: colWidth[1] - 10, align: 'right' });
                    }
                    
                    doc.rect(startX, startY, colWidth[0] + colWidth[1], rowHeight).stroke(PDF_CONFIG.colors.tableBorder);
                    
                    startY += rowHeight;
                }
                
                // PIED DE PAGE
                this.addFooter(doc, odooData);
                
                doc.end();
                
                stream.on('finish', () => {
                    console.log(`[PDFGenerator] TFT généré : ${filename}`);
                    resolve(`/reports/pdf/${filename}`);
                });
                
                stream.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * ============================================
     * GÉNÉRATION DES ANNEXES
     * ============================================
     */
    async generateAnnexes(odooData, accountingSystem, requestId) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `${requestId}_annexes.pdf`;
                const filepath = path.join(PDF_CONFIG.outputDir, filename);
                
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: PDF_CONFIG.margins
                });
                
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);
                
                // EN-TÊTE
                this.addHeader(doc, odooData, 'NOTES ANNEXES', accountingSystem);
                
                doc.moveDown(2);
                
                // NOTE 1 : Principes comptables
                this.addAnnexeSection(doc, '1. PRINCIPES ET MÉTHODES COMPTABLES', [
                    `Système comptable : ${odooData.annexes.principes_comptables.systeme}`,
                    `Exercice : ${odooData.annexes.principes_comptables.exercice}`,
                    `Devise : ${odooData.annexes.principes_comptables.devise}`,
                    `Méthode d'amortissement : ${odooData.annexes.principes_comptables.methode_amortissement}`,
                    `Évaluation des stocks : ${odooData.annexes.principes_comptables.methode_evaluation_stocks}`
                ]);
                
                // NOTE 2 : État des immobilisations
                doc.addPage();
                this.addAnnexeSection(doc, '2. ÉTAT DES IMMOBILISATIONS', null);
                this.drawImmobilisationsTable(doc, odooData.annexes.immobilisations);
                
                // NOTE 3 : Amortissements
                doc.addPage();
                this.addAnnexeSection(doc, '3. ÉTAT DES AMORTISSEMENTS', [
                    `Dotations de l'exercice : ${this.formatAmount(odooData.annexes.amortissements.dotations_exercice)}`,
                    `Cumul des amortissements : ${this.formatAmount(odooData.annexes.amortissements.cumul)}`
                ]);
                
                // NOTE 4 : Provisions
                this.addAnnexeSection(doc, '4. ÉTAT DES PROVISIONS', [
                    `Dotations : ${this.formatAmount(odooData.annexes.provisions.dotations)}`,
                    `Reprises : ${this.formatAmount(odooData.annexes.provisions.reprises)}`,
                    `Solde : ${this.formatAmount(odooData.annexes.provisions.solde)}`
                ]);
                
                // NOTE 5 : Créances et dettes
                this.addAnnexeSection(doc, '5. ÉTAT DES CRÉANCES ET DETTES', [
                    'CRÉANCES :',
                    `  - À moins d'un an : ${this.formatAmount(odooData.annexes.creances_dettes.creances.moins_1_an)}`,
                    `  - À plus d'un an : ${this.formatAmount(odooData.annexes.creances_dettes.creances.plus_1_an)}`,
                    'DETTES :',
                    `  - À moins d'un an : ${this.formatAmount(odooData.annexes.creances_dettes.dettes.moins_1_an)}`,
                    `  - À plus d'un an : ${this.formatAmount(odooData.annexes.creances_dettes.dettes.plus_1_an)}`
                ]);
                
                // PIED DE PAGE
                this.addFooter(doc, odooData);
                
                doc.end();
                
                stream.on('finish', () => {
                    console.log(`[PDFGenerator] Annexes générées : ${filename}`);
                    resolve(`/reports/pdf/${filename}`);
                });
                
                stream.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Ajouter une section d'annexe
     */
    addAnnexeSection(doc, title, items) {
        doc.fontSize(12).fillColor('#000').text(title, { underline: true });
        doc.moveDown(0.5);
        
        if (items && items.length > 0) {
            doc.fontSize(10);
            items.forEach(item => {
                doc.text(item);
                doc.moveDown(0.3);
            });
        }
        
        doc.moveDown(1);
    }
    
    /**
     * Dessiner le tableau des immobilisations
     */
    drawImmobilisationsTable(doc, immobilisations) {
        const startX = 50;
        let startY = doc.y;
        const colWidth = [200, 100, 100, 100];
        const rowHeight = 25;
        
        // En-têtes
        doc.fontSize(9).fillColor('#fff');
        ['Catégorie', 'Valeur brute', 'Acquisitions', 'Cessions'].forEach((header, i) => {
            doc.rect(startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0), startY, colWidth[i], rowHeight)
               .fill(PDF_CONFIG.colors.primary);
            doc.fillColor('#fff').text(header, startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 8);
        });
        
        startY += rowHeight;
        
        // Données
        doc.fontSize(9).fillColor('#000');
        immobilisations.forEach(immo => {
            [immo.code, 
             this.formatAmount(immo.valeur_brute), 
             this.formatAmount(immo.acquisitions), 
             this.formatAmount(immo.cessions)
            ].forEach((value, i) => {
                doc.rect(startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0), startY, colWidth[i], rowHeight)
                   .stroke(PDF_CONFIG.colors.tableBorder);
                doc.text(value, startX + colWidth.slice(0, i).reduce((a, b) => a + b, 0) + 5, startY + 8, { 
                    width: colWidth[i] - 10, 
                    align: i > 0 ? 'right' : 'left' 
                });
            });
            startY += rowHeight;
        });
        
        doc.y = startY;
    }
    
    /**
     * ============================================
     * FONCTIONS UTILITAIRES
     * ============================================
     */
    
    /**
     * Ajouter l'en-tête du document
     */
    addHeader(doc, odooData, title, accountingSystem) {
        // Logo (si disponible)
        // doc.image('path/to/logo.png', 50, 50, { width: 100 });
        
        // Informations entreprise
        doc.fontSize(16).fillColor(PDF_CONFIG.colors.primary).text(odooData.company.name, { align: 'center' });
        doc.fontSize(10).fillColor('#000').text(odooData.company.street || '', { align: 'center' });
        doc.text(`${odooData.company.city || ''} ${odooData.company.zip || ''}`, { align: 'center' });
        
        doc.moveDown(1);
        
        // Titre du document
        doc.fontSize(18).fillColor('#000').text(title, { align: 'center', underline: true });
        
        doc.moveDown(0.5);
        
        // Période et système
        doc.fontSize(11).text(`Exercice du ${odooData.period.start} au ${odooData.period.end}`, { align: 'center' });
        doc.fontSize(9).fillColor(PDF_CONFIG.colors.secondary).text(`Système : ${accountingSystem}`, { align: 'center' });
        
        // Ligne de séparation
        doc.moveDown(1);
        doc.strokeColor(PDF_CONFIG.colors.tableBorder).lineWidth(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    }
    
    /**
     * Ajouter le pied de page
     */
    addFooter(doc, odooData) {
        const bottomY = 750;
        
        doc.fontSize(8).fillColor(PDF_CONFIG.colors.secondary);
        doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, bottomY, { align: 'left' });
        doc.text('Doukè Compta Pro', 50, bottomY, { align: 'right' });
    }
    
    /**
     * Formater un montant
     */
    formatAmount(amount) {
        if (amount === null || amount === undefined) return '0,00';
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Export du service
module.exports = new PDFGeneratorService();
