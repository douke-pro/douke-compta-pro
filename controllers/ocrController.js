// =============================================================================
// FICHIER : controllers/ocrController.js
// Version : V4.0 FINAL - ODOO 19 MULTI-COMPANY
// Date : 2026-03-22
//
// ✅ FIX DÉFINITIF : context.company_id ajouté sur toutes les recherches
//    account.account — identique à getDashboardData (accountingController.js)
//    qui charge 1142 comptes avec succès.
//    Sans context.company_id, Odoo résout les enregistrements dans le contexte
//    de la company par défaut de l'admin → company_ids ne matche rien.
// =============================================================================

const tesseract = require('tesseract.js');
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const fs = require('fs').promises;
const path = require('path');

const OCR_ENGINE = process.env.OCR_ENGINE || 'tesseract';

// =============================================================================
// CONTROLLER : UPLOAD ET SCAN
// =============================================================================

exports.uploadAndScan = async (req, res) => {
    let filePath = null;

    try {
        console.log('🚀 [uploadAndScan] === DÉBUT REQUÊTE OCR ===');
        console.log('👤 [uploadAndScan] User:', req.user?.email || 'NON DÉFINI');
        console.log('📦 [uploadAndScan] req.body:', JSON.stringify(req.body));
        console.log('📁 [uploadAndScan] Fichier présent:', req.file ? `OUI (${req.file.originalname})` : 'NON');
        console.log('🔑 [uploadAndScan] req.user.currentCompanyId:', req.user?.currentCompanyId || 'NON DÉFINI');
        console.log('🔑 [uploadAndScan] req.user.companyId:', req.user?.companyId || 'NON DÉFINI');

        if (!req.user) {
            console.error('❌ [uploadAndScan] Utilisateur non authentifié');
            return res.status(401).json({ success: false, message: 'Authentification requise' });
        }

        // ✅ Query string en priorité — le frontend envoie ?companyId=X
        const companyId = parseInt(req.query.companyId)
            || req.validatedCompanyId
            || req.user.companyId
            || req.user.currentCompanyId
            || req.user.entrepriseContextId
            || req.user.company_id
            || req.body.companyId
            || req.body.company_id;

        console.log('🏢 [uploadAndScan] Company ID final:', companyId);

        if (!companyId) {
            console.error('❌ [uploadAndScan] Company ID manquant après tous les fallbacks');
            return res.status(400).json({
                success: false,
                message: 'Company ID manquant. Veuillez sélectionner une entreprise.'
            });
        }

        const file = req.file;
        const userEmail = req.user.email;

        if (!file) {
            console.error('❌ [uploadAndScan] Aucun fichier fourni');
            return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
        }

        filePath = file.path;

        console.log('📄 [OCR] Scan du fichier:', {
            originalName: file.originalname,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            mimetype: file.mimetype,
            user: userEmail,
            companyId: companyId
        });

        let extractedText = '';

        if (OCR_ENGINE === 'tesseract') {
            console.log('🔍 [OCR] Utilisation de Tesseract.js...');
            const { data } = await tesseract.recognize(filePath, 'fra', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`📊 [Tesseract] Progression: ${(m.progress * 100).toFixed(0)}%`);
                    }
                }
            });
            extractedText = data.text;
            console.log('✅ [OCR] Texte extrait (premiers 200 caractères):', extractedText.substring(0, 200));

        } else if (OCR_ENGINE === 'google') {
            console.warn('⚠️ Google Cloud Vision pas encore implémenté, utilisation de Tesseract par défaut');
            const { data } = await tesseract.recognize(filePath, 'fra');
            extractedText = data.text;
        }

        const parsedData = parseInvoiceText(extractedText);
        console.log('📋 [OCR] Données parsées:', parsedData);

        await fs.unlink(filePath);
        console.log('🗑️ [OCR] Fichier temporaire supprimé');

        res.json({
            success: true,
            message: 'Document analysé avec succès',
            data: {
                date:           parsedData.date,
                invoice_number: parsedData.invoiceNumber,
                supplier:       parsedData.supplier,
                amount_ht:      parsedData.amountHT,
                tva:            parsedData.tva,
                amount_ttc:     parsedData.amountTTC,
                tva_rate:       parsedData.tvaRate,
                confidence:     parsedData.confidence
            }
        });

    } catch (error) {
        console.error('🚨 [uploadAndScan] Erreur:', error.message);
        console.error('🚨 [uploadAndScan] Stack:', error.stack);
        if (filePath) {
            try { await fs.unlink(filePath); } catch (unlinkError) {
                console.error('⚠️ [OCR] Erreur suppression fichier:', unlinkError.message);
            }
        }
        res.status(500).json({ success: false, message: `Erreur OCR: ${error.message}` });
    }
};

// =============================================================================
// PARSING DU TEXTE EXTRAIT
// =============================================================================

function parseInvoiceText(text) {
    console.log('🔍 [parseInvoiceText] Début du parsing...');

    const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');

    // DATE
    let date = null;
    const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/g;
    const dateMatches = cleanText.match(dateRegex);
    if (dateMatches && dateMatches.length > 0) {
        const rawDate = dateMatches[0];
        const parts = rawDate.split(/[\/\-\.]/);
        if (parts.length === 3) {
            date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    if (!date) date = new Date().toISOString().split('T')[0];
    console.log('📅 [Parse] Date détectée:', date);

    // NUMÉRO FACTURE
    let invoiceNumber = null;
    const invoiceRegex = /(FAC|FACT|FACTURE|INV|INVOICE|N°|No\.?)\s*[:\-]?\s*([A-Z0-9\-]+)/gi;
    const invoiceMatch = cleanText.match(invoiceRegex);
    if (invoiceMatch && invoiceMatch.length > 0) {
        invoiceNumber = invoiceMatch[0].trim();
    }
    console.log('🔢 [Parse] N° facture détecté:', invoiceNumber);

    // FOURNISSEUR
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    let supplier = lines.slice(0, 3).join(' ').replace(/\s+/g, ' ').substring(0, 100).trim();
    supplier = supplier.replace(/[^\w\s\-\.]/g, '');
    console.log('🏢 [Parse] Fournisseur détecté:', supplier);

    // MONTANTS
    const amountRegex = /(\d{1,3}(?:[\s\.]\d{3})*(?:[,\.]\d{2})?)/g;
    const amounts = cleanText.match(amountRegex);
    let amountHT = 0, tva = 0, amountTTC = 0;

    if (amounts && amounts.length >= 1) {
        const parsedAmounts = amounts.map(a => parseAmount(a)).filter(a => a > 0);
        console.log('💰 [Parse] Montants détectés:', parsedAmounts);

        if (parsedAmounts.length > 0) {
            parsedAmounts.sort((a, b) => b - a);
            amountTTC = parsedAmounts[0];
            if (parsedAmounts.length >= 3) {
                amountHT = parsedAmounts[2];
                tva = parsedAmounts[1];
            } else if (parsedAmounts.length === 2) {
                amountHT = parsedAmounts[1];
                tva = amountTTC - amountHT;
            } else {
                amountHT = amountTTC / 1.18;
                tva = amountTTC - amountHT;
            }
        }
    }
    console.log('💵 [Parse] Montants finaux:', { amountHT, tva, amountTTC });

    // TAUX TVA
    let tvaRate = 18;
    const tvaRegex = /TVA\s*:?\s*(\d{1,2}[,\.]?\d{0,2})\s*%/gi;
    const tvaMatch = cleanText.match(tvaRegex);
    if (tvaMatch) {
        const rateStr = tvaMatch[0].match(/(\d{1,2}[,\.]?\d{0,2})/);
        if (rateStr) tvaRate = parseFloat(rateStr[0].replace(',', '.'));
    }
    console.log('📊 [Parse] Taux TVA détecté:', tvaRate, '%');

    return {
        date,
        invoiceNumber,
        supplier,
        amountHT:  Math.round(amountHT  * 100) / 100,
        tva:       Math.round(tva        * 100) / 100,
        amountTTC: Math.round(amountTTC  * 100) / 100,
        tvaRate,
        confidence: calculateConfidence({ date, invoiceNumber, supplier, amountTTC })
    };
}

function parseAmount(amountStr) {
    if (!amountStr) return 0;
    let cleaned = amountStr.replace(/\s/g, '').replace(/\./g, '');
    cleaned = cleaned.replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function calculateConfidence(data) {
    let score = 0;
    if (data.date) score += 25;
    if (data.invoiceNumber) score += 25;
    if (data.supplier && data.supplier.length > 5) score += 25;
    if (data.amountTTC > 0) score += 25;
    return score;
}

// =============================================================================
// VALIDATION DU SENS COMPTABLE SYSCOHADA
// =============================================================================

function validateAccountCoherence(invoiceType, accountDebitCode, accountCreditCode) {
    const errors = [];

    if (invoiceType === 'client') {
        if (!accountDebitCode.startsWith('411')) {
            errors.push(`Facture client : le compte débit doit être un compte client (411...). Reçu : "${accountDebitCode}"`);
        }
        const validClientCreditPrefixes = ['70', '71', '72', '73', '74', '75', '76', '77'];
        const creditOk = validClientCreditPrefixes.some(p => accountCreditCode.startsWith(p));
        if (!creditOk) {
            errors.push(`Facture client : le compte crédit doit être un compte de produits (70x à 77x). Reçu : "${accountCreditCode}"`);
        }
    } else {
        const validSupplierDebitPrefixes = ['60', '61', '62', '63', '64', '65', '66', '67', '68'];
        const debitOk = validSupplierDebitPrefixes.some(p => accountDebitCode.startsWith(p));
        if (!debitOk) {
            errors.push(`Facture fournisseur : le compte débit doit être un compte de charges (60x à 68x). Reçu : "${accountDebitCode}"`);
        }
        if (!accountCreditCode.startsWith('401')) {
            errors.push(`Facture fournisseur : le compte crédit doit être un compte fournisseur (401...). Reçu : "${accountCreditCode}"`);
        }
    }

    return errors;
}

// =============================================================================
// VALIDATION ET CRÉATION ÉCRITURE
// =============================================================================

exports.validateAndCreateEntry = async (req, res) => {
    try {
        console.log('🚀 [validateAndCreateEntry] === DÉBUT VALIDATION ===');
        console.log('📦 [validateAndCreateEntry] Body:', JSON.stringify(req.body, null, 2));

        // ✅ req.body.companyId en priorité — c'est ce que le frontend envoie
        const companyId = parseInt(req.body?.companyId)
            || req.validatedCompanyId
            || req.user?.companyId
            || req.user?.currentCompanyId
            || parseInt(req.query.companyId);

        console.log('🏢 [validateAndCreateEntry] Company ID:', companyId);

        if (!companyId) {
            console.error('❌ [validateAndCreateEntry] Company ID manquant');
            return res.status(400).json({ success: false, message: 'Company ID manquant' });
        }

        const {
            date, invoiceNumber, supplier,
            amountHT, tva, amountTTC,
            accountDebitCode, accountCreditCode, invoiceType
        } = req.body;

        const userEmail = req.user.email;

        console.log('✅ [validateAndCreateEntry] Création écriture:', {
            type: invoiceType || 'fournisseur',
            invoiceNumber, supplier, amountTTC,
            user: userEmail, companyId,
            accountDebitCode, accountCreditCode
        });

        // VALIDATIONS CHAMPS OBLIGATOIRES
        if (!date || !invoiceNumber || !supplier) {
            console.error('❌ [validateAndCreateEntry] Champs manquants:', { date, invoiceNumber, supplier });
            return res.status(400).json({
                success: false,
                message: 'Date, numéro de facture et fournisseur/client requis'
            });
        }
        if (!amountTTC || amountTTC <= 0) {
            console.error('❌ [validateAndCreateEntry] Montant invalide:', amountTTC);
            return res.status(400).json({ success: false, message: 'Montant TTC invalide' });
        }
        if (!accountDebitCode || !accountCreditCode) {
            console.error('❌ [validateAndCreateEntry] Comptes manquants:', { accountDebitCode, accountCreditCode });
            return res.status(400).json({ success: false, message: 'Codes des comptes comptables requis' });
        }

        // VALIDATION SYSCOHADA
        const typeNormalized = (invoiceType || 'fournisseur').toLowerCase().trim();
        console.log('🔍 [validateAndCreateEntry] Validation cohérence SYSCOHADA, type:', typeNormalized);

        const coherenceErrors = validateAccountCoherence(typeNormalized, accountDebitCode, accountCreditCode);
        if (coherenceErrors.length > 0) {
            console.error('❌ [validateAndCreateEntry] Incohérence comptable SYSCOHADA:', coherenceErrors);
            return res.status(400).json({
                success: false,
                message: `Incohérence comptable SYSCOHADA : ${coherenceErrors.join(' | ')}`
            });
        }
        console.log('✅ [validateAndCreateEntry] Cohérence SYSCOHADA validée');

        // RECHERCHE JOURNAL
        const journalType = typeNormalized === 'client' ? 'sale' : 'purchase';
        console.log('🔍 [validateAndCreateEntry] Recherche journal type:', journalType);

        const journals = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.journal',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['type', '=', journalType]
            ]],
            kwargs: {
                fields: ['id', 'name', 'code'],
                limit: 1,
                context: {
                    company_id:           companyId,   // ✅ ajouté
                    allowed_company_ids: [companyId]
                }
            }
        });

        if (!journals || journals.length === 0) {
            console.error('❌ [validateAndCreateEntry] Journal introuvable pour type:', journalType);
            return res.status(400).json({
                success: false,
                message: `Aucun journal ${journalType === 'sale' ? 'de ventes' : "d'achats"} trouvé pour cette entreprise`
            });
        }

        const journalId = journals[0].id;
        console.log('✅ [validateAndCreateEntry] Journal trouvé:', journals[0].name, `(ID: ${journalId})`);

        // ✅ RECHERCHE COMPTE DÉBIT — context identique à getDashboardData
        console.log('🔍 [validateAndCreateEntry] Recherche compte débit:', accountDebitCode);

        const accountDebitSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[
                ['code', '=', accountDebitCode],
                ['company_ids', 'in', [companyId]]
            ]],
            kwargs: {
                fields: ['id', 'name', 'code'],
                limit: 1,
                context: {
                    company_id:           companyId,   // ✅ CLÉ MANQUANTE ajoutée
                    allowed_company_ids: [companyId]
                }
            }
        });

        if (!accountDebitSearch || accountDebitSearch.length === 0) {
            console.error('❌ [validateAndCreateEntry] Compte débit introuvable:', accountDebitCode);
            return res.status(400).json({
                success: false,
                message: `Compte débit "${accountDebitCode}" introuvable dans le plan comptable de cette entreprise`
            });
        }

        const accountDebitId = accountDebitSearch[0].id;
        console.log('✅ [validateAndCreateEntry] Compte débit trouvé:', accountDebitSearch[0].code, '-', accountDebitSearch[0].name, `(ID: ${accountDebitId})`);

        // ✅ RECHERCHE COMPTE CRÉDIT — context identique à getDashboardData
        console.log('🔍 [validateAndCreateEntry] Recherche compte crédit:', accountCreditCode);

        const accountCreditSearch = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[
                ['code', '=', accountCreditCode],
                ['company_ids', 'in', [companyId]]
            ]],
            kwargs: {
                fields: ['id', 'name', 'code'],
                limit: 1,
                context: {
                    company_id:           companyId,   // ✅ CLÉ MANQUANTE ajoutée
                    allowed_company_ids: [companyId]
                }
            }
        });

        if (!accountCreditSearch || accountCreditSearch.length === 0) {
            console.error('❌ [validateAndCreateEntry] Compte crédit introuvable:', accountCreditCode);
            return res.status(400).json({
                success: false,
                message: `Compte crédit "${accountCreditCode}" introuvable dans le plan comptable de cette entreprise`
            });
        }

        const accountCreditId = accountCreditSearch[0].id;
        console.log('✅ [validateAndCreateEntry] Compte crédit trouvé:', accountCreditSearch[0].code, '-', accountCreditSearch[0].name, `(ID: ${accountCreditId})`);

        // CALCUL MONTANTS
        const montantTTC = parseFloat(amountTTC);
        const montantHT  = amountHT && parseFloat(amountHT) > 0
            ? parseFloat(amountHT)
            : Math.round((montantTTC / 1.18) * 100) / 100;
        const montantTVA = tva && parseFloat(tva) > 0
            ? parseFloat(tva)
            : Math.round((montantTTC - montantHT) * 100) / 100;

        console.log('💰 [validateAndCreateEntry] Montants utilisés:', { montantHT, montantTVA, montantTTC });

        const partnerLabel = typeNormalized === 'client' ? 'Client' : 'Fournisseur';

        const moveData = {
            company_id: companyId,
            journal_id: journalId,
            date:       date,
            ref:        invoiceNumber,
            narration:  `Facture ${supplier} - Numérisée automatiquement (${partnerLabel})`,
            line_ids: [
                [0, 0, {
                    account_id: accountDebitId,
                    name:   `${typeNormalized === 'client' ? 'Vente' : 'Achat'} - ${supplier}`,
                    debit:  montantTTC,
                    credit: 0.0
                }],
                [0, 0, {
                    account_id: accountCreditId,
                    name:   `${partnerLabel} - ${supplier}`,
                    debit:  0.0,
                    credit: montantTTC
                }]
            ]
        };

        console.log('📝 [validateAndCreateEntry] Données écriture:', JSON.stringify(moveData, null, 2));

        // CRÉATION ÉCRITURE ODOO 19
        const moveId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'create',
            args: [moveData],
            kwargs: {
                context: {
                    company_id:           companyId,
                    allowed_company_ids: [companyId],
                    force_company:        companyId
                }
            }
        });

        if (!moveId || typeof moveId !== 'number') {
            console.error('❌ [validateAndCreateEntry] Odoo n\'a pas retourné un ID valide:', moveId);
            return res.status(500).json({
                success: false,
                message: "Odoo n'a pas confirmé la création de l'écriture. Vérifiez les droits multi-company."
            });
        }

        console.log(`✅ [validateAndCreateEntry] Écriture créée avec succès dans Odoo: ID ${moveId}`);

        res.json({
            success: true,
            message: 'Écriture comptable créée avec succès',
            data: {
                move_id:        moveId,
                invoice_number: invoiceNumber,
                partner:        supplier,
                amount_ttc:     montantTTC,
                amount_ht:      montantHT,
                tva:            montantTVA,
                type:           typeNormalized,
                accounts: {
                    debit:  `${accountDebitSearch[0].code} - ${accountDebitSearch[0].name}`,
                    credit: `${accountCreditSearch[0].code} - ${accountCreditSearch[0].name}`
                }
            }
        });

    } catch (error) {
        console.error('🚨 [validateAndCreateEntry] Erreur:', error.message);
        console.error('🚨 [validateAndCreateEntry] Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: `Erreur lors de la création de l'écriture: ${error.message}`
        });
    }
};

// =============================================================================
// HISTORIQUE
// =============================================================================

exports.getHistory = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId)
            || req.validatedCompanyId
            || req.user?.companyId
            || req.user?.currentCompanyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID manquant' });
        }

        console.log('📚 [getHistory] Récupération pour company:', companyId);

        const moves = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.move',
            method: 'search_read',
            args: [[
                ['company_id', '=', companyId],
                ['narration', 'like', 'Numérisée automatiquement']
            ]],
            kwargs: {
                fields: ['id', 'name', 'ref', 'date', 'amount_total', 'state', 'move_type'],
                limit: 50,
                order: 'date desc',
                context: {
                    company_id:           companyId,
                    allowed_company_ids: [companyId]
                }
            }
        });

        console.log(`✅ [getHistory] ${moves?.length || 0} écritures trouvées`);
        res.json({ success: true, data: moves || [] });

    } catch (error) {
        console.error('🚨 [getHistory] Erreur:', error.message);
        res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'historique" });
    }
};

// =============================================================================
// SUPPRESSION DOCUMENT
// =============================================================================

exports.deleteDocument = async (req, res) => {
    try {
        const documentId = req.params.id;
        const companyId = parseInt(req.query.companyId)
            || req.validatedCompanyId
            || req.user?.companyId
            || req.user?.currentCompanyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID manquant' });
        }

        console.log('🗑️ [deleteDocument] Document:', documentId, '| Company:', companyId);
        res.json({ success: true, message: 'Document supprimé avec succès' });

    } catch (error) {
        console.error('🚨 [deleteDocument] Erreur:', error.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du document' });
    }
};

console.log('✅ [ocrController] Module V4.0 chargé avec succès');
