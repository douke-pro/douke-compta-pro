// =============================================================================
// FICHIER : routes/ocr.js
// Description : Routes pour la numérisation de factures (OCR)
// Version : FINAL - Endpoints alignés + middleware correct
// Date : 2026-02-24
// =============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth'); // ✅ CORRIGÉ
const ocrController = require('../controllers/ocrController');

// =============================================================================
// CONFIGURATION MULTER (Upload de fichiers)
// =============================================================================

// Configuration du stockage temporaire
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp'); // Dossier temporaire
    },
    filename: function (req, file, cb) {
        // Format : invoice-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `invoice-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Configuration Multer avec validations
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum
    },
    fileFilter: (req, file, cb) => {
        console.log('📋 [Multer] Fichier reçu:', file.originalname, '|', file.mimetype);
        
        // ✅ TYPES MIME AUTORISÉS : IMAGES UNIQUEMENT
        const allowedTypes = [
            // 'application/pdf',  // ❌ DÉSACTIVÉ : Tesseract.js ne supporte pas les PDFs nativement
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            console.log('✅ [Multer] Type de fichier accepté');
            cb(null, true);
        } else {
            console.error('❌ [Multer] Type de fichier refusé:', file.mimetype);
            
            // Message personnalisé pour les PDFs
            if (file.mimetype === 'application/pdf') {
                cb(new Error('❌ Les fichiers PDF ne sont pas encore supportés. Veuillez utiliser une image (JPG ou PNG). Astuce : Prenez une capture d\'écran de votre facture PDF ou convertissez-la en image.'));
            } else {
                cb(new Error('❌ Type de fichier non autorisé. Formats acceptés : JPG, PNG uniquement.'));
            }
        }
    }
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route   POST /api/ocr/process
 * @desc    Upload et scan d'une facture avec OCR
 * @access  Protégé (authentification requise)
 * @body    multipart/form-data { file: File (JPG/PNG), companyId?: Number }
 * ✅ ALIGNÉ avec le frontend
 */
router.post(
    '/process',
    authenticateToken,
    upload.single('file'),
    ocrController.uploadAndScan
);

/**
 * @route   POST /api/ocr/validate-and-create
 * @desc    Valide et crée l'écriture comptable depuis les données OCR
 * @access  Protégé (authentification requise)
 * @body    JSON { 
 *            date: String, 
 *            invoiceNumber: String, 
 *            supplier: String, 
 *            amountHT: Number, 
 *            tva: Number, 
 *            amountTTC: Number, 
 *            accountDebitCode: String, 
 *            accountCreditCode: String,
 *            invoiceType: String
 *          }
 * ✅ ALIGNÉ avec le frontend
 */
router.post(
    '/validate-and-create',
    authenticateToken,
    ocrController.validateAndCreateEntry
);

/**
 * @route   GET /api/ocr/history
 * @desc    Récupère l'historique des documents scannés
 * @access  Protégé (authentification requise)
 * @query   companyId?: Number
 */
router.get(
    '/history',
    authenticateToken,
    ocrController.getHistory
);

/**
 * @route   DELETE /api/ocr/:id
 * @desc    Supprime un document scanné de l'historique
 * @access  Protégé (authentification requise)
 * @params  id: Number (ID du document)
 */
router.delete(
    '/:id',
    authenticateToken,
    ocrController.deleteDocument
);

// =============================================================================
// GESTION D'ERREURS MULTER
// =============================================================================

/**
 * Middleware de gestion des erreurs d'upload
 */
router.use((error, req, res, next) => {
    // Erreurs spécifiques Multer
    if (error instanceof multer.MulterError) {
        console.error('🚨 [Multer Error]', error.code, ':', error.message);
        
        // Limite de taille dépassée
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier ne doit pas dépasser 10 MB'
            });
        }
        
        // Trop de fichiers
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Un seul fichier autorisé à la fois'
            });
        }
        
        // Autre erreur Multer
        return res.status(400).json({
            success: false,
            message: `Erreur upload : ${error.message}`
        });
    }
    
    // Erreurs générales (type de fichier, etc.)
    if (error) {
        console.error('🚨 [Upload Error]', error.message);
        console.error('🔍 [Upload Error Stack]', error.stack);
        
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    // Pas d'erreur, continuer
    next();
});

console.log('✅ [routes/ocr] Routes chargées avec succès');

module.exports = router;
