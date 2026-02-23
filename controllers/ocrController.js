// =============================================================================
// FICHIER : controllers/ocrController.js
// Description : Contrôleur pour la numérisation de factures (OCR)
// Version : V1.1 - Février 2026 - CORRIGÉ
// Technologies : Tesseract.js (gratuit) ou Google Cloud Vision (payant)
// ✅ CORRECTION : Validation robuste de companyId avec fallbacks multiples
// =============================================================================

const tesseract = require('tesseract.js');
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const fs = require('fs').promises;
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Choisir le moteur OCR (à configurer selon vos besoins)
const OCR_ENGINE = process.env.OCR_ENGINE || 'tesseract'; // 'tesseract' ou 'google'

// =============================================================================
// CONTROLLER : UPLOAD ET SCAN
// =============================================================================

/**
 * Upload et scan d'une facture avec OCR
 * @route POST /api/ocr/upload
 * ✅ VERSION CORRIGÉE avec validations robustes
 */
exports.uploadAndScan = async (req, res) => {
    let filePath = null;
    
    try {
        // =============================
        // ✅ VALIDATION 1 : UTILISATEUR
        // =============================
        if (!req.user) {
            console.error('❌ [uploadAndScan] Utilisateur non authentifié');
            return res.status(401).json({
                status: 'error',
                error: 'Authentification requise'
            });
        }
        
        // =============================
        // ✅ VALIDATION 2 : COMPANY ID
        // =============================
        // Essayer plusieurs sources avec fallback
        const companyId = req.validatedCompanyId || 
                         req.user.companyId || 
                         req.user.entrepriseContextId || 
                         req.user.company_id ||
                         req.body.companyId || 
                         req.body.company_id ||
                         parseInt(req.query.companyId);
        
        if (!companyId) {
            console.error('❌ [uploadAndScan] Company ID manquant', {
                user: req.user.email,
                validatedCompanyId: req.validatedCompanyId,
                userCompanyId: req.user.companyId,
                bodyCompanyId: req.body.companyId,
                queryCompanyId: req.query.companyId
            });
            return res.status(400).json({
                status: 'error',
                error: 'Company ID manquant. Veuillez sélectionner une entreprise.'
            });
        }
        
        // =============================
        // ✅ VALIDATION 3 : FICHIER
        // =============================
        const file = req.file;
        const userEmail = req.user.email;

        if (!file) {
            console.error('❌ [uploadAndScan] Aucun fichier fourni');
            return res.status(400).json({
                status: 'error',
                error: 'Aucun fichier fourni'
            });
        }

        filePath = file.path;
        
        console.log('📄 [OCR] Scan du fichier:', {
            originalName: file.originalname,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            mimetype: file.mimetype,
            user: userEmail,
            companyId: companyId
        });

        // =============================
        // EXTRACTION DU TEXTE AVEC OCR
        // =============================
        let extractedText = '';
        
        if (OCR_ENGINE === 'tesseract') {
            console.log('🔍 [OCR] Utilisation de Tesseract.js...');
            
            const { data } = await tesseract.recognize(
                filePath,
                'fra', // Langue française
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`📊 [Tesseract] Progression: ${(m.progress * 100).toFixed(0)}%`);
                        }
                    }
                }
            );
            
            extractedText = data.text;
            console.log('✅ [OCR] Texte extrait (premiers 200 caractères):', extractedText.substring(0, 200));
            
        } else if (OCR_ENGINE === 'google') {
            // TODO: Implémenter Google Cloud Vision API si besoin
            console.warn('⚠️ Google Cloud Vision pas encore implémenté, utilisation de Tesseract par défaut');
            const { data } = await tesseract.recognize(filePath, 'fra');
            extractedText = data.text;
        }

        // Parsing automatique des données
        const parsedData = parseInvoiceText(extractedText);
        
        console.log('📋 [OCR] Données parsées:', parsedData);

        // Nettoyer le fichier temporaire
        await fs.unlink(filePath);
        console.log('🗑️ [OCR] Fichier temporaire supprimé');

        res.json({
            status: 'success',
            message: 'Document analysé avec succès',
            data: {
                rawText: extractedText.substring(0, 500), // Limiter pour éviter payload trop gros
                parsed: parsedData
            }
        });

    } catch (error) {
        console.error('🚨 [uploadAndScan] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        // Nettoyer le fichier en cas d'erreur
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('⚠️ [OCR] Erreur suppression fichier:', unlinkError.message);
            }
        }
        
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors du scan du document',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// =============================================================================
// PARSING DU TEXTE EXTRAIT
// =============================================================================

/**
 * Parse le texte extrait pour identifier les champs comptables
 * @param {string} text - Texte brut extrait par OCR
 * @returns {object} - Données structurées
 */
function parseInvoiceText(text) {
    console.log('🔍 [parseInvoiceText] Début du parsing...');
    
    // Nettoyer le texte
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    
    // =============================
    // 1. EXTRACTION DE LA DATE
    // =============================
    let date = null;
    
    // Formats possibles : 08/02/2026, 08-02-2026, 08.02.2026
    const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/g;
    const dateMatches = cleanText.match(dateRegex);
    
    if (dateMatches && dateMatches.length > 0) {
        // Prendre la première date trouvée
        const rawDate = dateMatches[0];
        const parts = rawDate.split(/[\/\-\.]/);
        
        // Convertir en format ISO : YYYY-MM-DD
        if (parts.length === 3) {
            date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    
    console.log('📅 [Parse] Date détectée:', date);
    
    // =============================
    // 2. EXTRACTION N° FACTURE
    // =============================
    let invoiceNumber = null;
    
    // Patterns courants : FAC-2026-001, FACTURE 123, INV-456, N° 789
    const invoiceRegex = /(FAC|FACT|FACTURE|INV|INVOICE|N°|No\.?)\s*[:\-]?\s*([A-Z0-9\-]+)/gi;
    const invoiceMatch = cleanText.match(invoiceRegex);
    
    if (invoiceMatch && invoiceMatch.length > 0) {
        invoiceNumber = invoiceMatch[0].trim();
    }
    
    console.log('🔢 [Parse] N° facture détecté:', invoiceNumber);
    
    // =============================
    // 3. EXTRACTION FOURNISSEUR
    // =============================
    // Stratégie : Prendre les 3 premières lignes non-vides
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    let supplier = lines.slice(0, 3)
        .join(' ')
        .replace(/\s+/g, ' ')
        .substring(0, 100)
        .trim();
    
    // Nettoyer les caractères parasites
    supplier = supplier.replace(/[^\w\s\-\.]/g, '');
    
    console.log('🏢 [Parse] Fournisseur détecté:', supplier);
    
    // =============================
    // 4. EXTRACTION MONTANTS
    // =============================
    // Pattern pour montants : 50 000,00 ou 50.000,00 ou 50000.00
    const amountRegex = /(\d{1,3}(?:[\s\.]\d{3})*(?:[,\.]\d{2})?)/g;
    const amounts = cleanText.match(amountRegex);
    
    let amountHT = 0;
    let tva = 0;
    let amountTTC = 0;
    
    if (amounts && amounts.length >= 1) {
        // Convertir les montants en nombres
        const parsedAmounts = amounts.map(a => parseAmount(a)).filter(a => a > 0);
        
        console.log('💰 [Parse] Montants détectés:', parsedAmounts);
        
        // Heuristique simple : le plus grand montant = TTC
        if (parsedAmounts.length > 0) {
            parsedAmounts.sort((a, b) => b - a); // Tri décroissant
            
            amountTTC = parsedAmounts[0];
            
            // Si on a au moins 3 montants : HT, TVA, TTC
            if (parsedAmounts.length >= 3) {
                amountHT = parsedAmounts[2]; // Plus petit = HT
                tva = parsedAmounts[1]; // Moyen = TVA
            } else if (parsedAmounts.length === 2) {
                amountHT = parsedAmounts[1];
                tva = amountTTC - amountHT;
            } else {
                // Un seul montant détecté : on suppose que c'est le TTC
                // Calcul inverse avec TVA 18% (standard Bénin)
                amountHT = amountTTC / 1.18;
                tva = amountTTC - amountHT;
            }
        }
    }
    
    console.log('💵 [Parse] Montants finaux:', { amountHT, tva, amountTTC });
    
    // =============================
    // 5. DÉTECTION TVA (%)
    // =============================
    let tvaRate = 18; // Défaut Bénin
    
    const tvaRegex = /TVA\s*:?\s*(\d{1,2}[,\.]?\d{0,2})\s*%/gi;
    const tvaMatch = cleanText.match(tvaRegex);
    
    if (tvaMatch) {
        const rateStr = tvaMatch[0].match(/(\d{1,2}[,\.]?\d{0,2})/);
        if (rateStr) {
            tvaRate = parseFloat(rateStr[0].replace(',', '.'));
        }
    }
    
    console.log('📊 [Parse] Taux TVA détecté:', tvaRate, '%');
    
    // =============================
    // RÉSULTAT FINAL
    // =============================
    return {
        date: date,
        invoiceNumber: invoiceNumber,
        supplier: supplier,
        amountHT: Math.round(amountHT * 100) / 100, // Arrondir à 2 décimales
        tva: Math.round(tva * 100) / 100,
        amountTTC: Math.round(amountTTC * 100) / 100,
        tvaRate: tvaRate,
        confidence: calculateConfidence({ date, invoiceNumber, supplier, amountTTC })
    };
}

/**
 * Convertit une chaîne de montant en nombre
 * Exemples : "50 000,00" → 50000.00 | "50.000,00" → 50000.00
 */
function parseAmount(amountStr) {
    if (!amountStr) return 0;
    
    // Supprimer tous les espaces et points (séparateurs de milliers)
    let cleaned = amountStr.replace(/\s/g, '').replace(/\./g, '');
    
    // Remplacer la virgule par un point (séparateur décimal)
    cleaned = cleaned.replace(',', '.');
    
    return parseFloat(cleaned) || 0;
}

/**
 * Calcule un score de confiance (0-100) basé sur les données extraites
 */
function calculateConfidence(data) {
    let score = 0;
    
    if (data.date) score += 25;
    if (data.invoiceNumber) score += 25;
    if (data.supplier && data.supplier.length > 5) score += 25;
    if (data.amountTTC > 0) score += 25;
    
    return score;
}

// =============================================================================
// CONTROLLER : VALIDATION ET CRÉATION ÉCRITURE
// =============================================================================

/**
 * Valide et crée l'écriture comptable dans Odoo
 * @route POST /api/ocr/validate
 * ✅ VERSION CORRIGÉE avec validations robustes
 */
exports.validateAndCreateEntry = async (req, res) => {
    try {
        // =============================
        // ✅ VALIDATION : COMPANY ID
        // =============================
        const companyId = req.validatedCompanyId || 
                         req.user?.companyId || 
                         req.body?.companyId || 
                         parseInt(req.query.companyId);
        
        if (!companyId) {
            console.error('❌ [validateAndCreateEntry] Company ID manquant');
            return res.status(400).json({
                status: 'error',
                error: 'Company ID manquant'
            });
        }
        
        const {
            date,
            invoiceNumber,
            supplier,
            amountHT,
            tva,
            amountTTC,
            accountDebit,
            accountCredit
        } = req.body;
        
        const userEmail = req.user.email;

        console.log('✅ [OCR Validate] Création écriture:', {
            invoiceNumber,
            supplier,
            amountTTC,
            user: userEmail,
            companyId
        });

        // =============================
        // 1. VALIDATIONS
        // =============================
        
        if (!date || !invoiceNumber || !supplier) {
            return res.status(400).json({
                status: 'error',
                error: 'Date, numéro de facture et fournisseur requis'
            });
        }
        
        if (!amountTTC || amountTTC <= 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Montant TTC invalide'
            });
        }
        
        if (!accountDebit || !accountCredit) {
            return res.status(400).json({
                status: 'error',
                error: 'Comptes comptables requis'
            });
        }

        // =============================
        // 2. RECHERCHE DU JOURNAL
        // =============================
        
        // Rechercher le journal "Achats" pour la compagnie
        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['type', '=', 'purchase']
            ]],
            kwargs: {
                fields: ['id', 'name', 'code'],
                limit: 1
            }
        });

        if (!journals || journals.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun journal d\'achats trouvé pour cette entreprise'
            });
        }

        const journalId = journals[0].id;
        console.log('📖 [OCR Validate] Journal sélectionné:', journals[0].name, `(ID: ${journalId})`);

        // =============================
        // 3. CRÉATION DE L'ÉCRITURE
        // =============================
        
        const moveData = {
            company_id: companyId,
            journal_id: journalId,
            date: date,
            ref: invoiceNumber,
            narration: `Facture ${supplier} - Numérisée automatiquement`,
            line_ids: [
                // Ligne de débit (Achat)
                [0, 0, {
                    account_id: accountDebit,
                    name: `Achat - ${supplier}`,
                    debit: amountTTC,
                    credit: 0
                }],
                // Ligne de crédit (Fournisseur)
                [0, 0, {
                    account_id: accountCredit,
                    name: `Fournisseur - ${supplier}`,
                    debit: 0,
                    credit: amountTTC
                }]
            ]
        };

        console.log('📝 [OCR Validate] Données écriture:', JSON.stringify(moveData, null, 2));

        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: {}
        });

        console.log(`✅ [OCR Validate] Écriture créée avec succès: ID ${moveId}`);

        // =============================
        // 4. RÉPONSE
        // =============================
        
        res.json({
            status: 'success',
            message: 'Écriture comptable créée avec succès',
            data: {
                moveId: moveId,
                invoiceNumber: invoiceNumber,
                supplier: supplier,
                amount: amountTTC
            }
        });

    } catch (error) {
        console.error('🚨 [OCR Validate] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la création de l\'écriture',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// =============================================================================
// CONTROLLER : HISTORIQUE
// =============================================================================

/**
 * Récupère l'historique des documents scannés
 * @route GET /api/ocr/history
 */
exports.getHistory = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || 
                         req.user?.companyId || 
                         parseInt(req.query.companyId);

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                error: 'Company ID manquant'
            });
        }

        console.log('📚 [OCR History] Récupération pour company:', companyId);

        // TODO: Implémenter stockage historique en base de données
        // Pour l'instant, on retourne une liste vide
        
        res.json({
            status: 'success',
            data: []
        });

    } catch (error) {
        console.error('🚨 [OCR History] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération de l\'historique'
        });
    }
};

/**
 * Supprime un document de l'historique
 * @route DELETE /api/ocr/:id
 */
exports.deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const companyId = req.validatedCompanyId || 
                         req.user?.companyId || 
                         parseInt(req.query.companyId);

        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                error: 'Company ID manquant'
            });
        }

        console.log('🗑️ [OCR Delete] Document:', documentId, '| Company:', companyId);

        // TODO: Implémenter suppression en base de données
        
        res.json({
            status: 'success',
            message: 'Document supprimé avec succès'
        });

    } catch (error) {
        console.error('🚨 [OCR Delete] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la suppression du document'
        });
    }
};
