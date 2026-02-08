// =============================================================================
// FICHIER : routes/ocr.js
// Description : Routes pour la numérisation de factures (OCR)
// Version : V1.0 - Février 2026
// =============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, checkCompanyAccess } = require('../middleware/auth');
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
        // Format : timestamp-companyId-originalname
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
        
        // Types MIME autorisés
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.error('❌ [Multer] Type de fichier refusé:', file.mimetype);
            cb(new Error('Type de fichier non autorisé. Utilisez PDF, JPG ou PNG.'));
        }
    }
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * @route   POST /api/ocr/upload
 * @desc    Upload et scan d'une facture avec OCR
 * @access  Protégé + vérification accès entreprise
 * @body    multipart/form-data { invoice: File, companyId: Number }
 */
router.post(
    '/upload',
    protect,
    checkCompanyAccess,
    upload.single('invoice'),
    ocrController.uploadAndScan
);

/**
 * @route   POST /api/ocr/validate
 * @desc    Valide et crée l'écriture comptable depuis les données OCR
 * @access  Protégé + vérification accès entreprise
 * @body    JSON { date, invoiceNumber, supplier, amountHT, tva, amountTTC, accountDebit, accountCredit }
 */
router.post(
    '/validate',
    protect,
    checkCompanyAccess,
    ocrController.validateAndCreateEntry
);

/**
 * @route   GET /api/ocr/history
 * @desc    Récupère l'historique des documents scannés
 * @access  Protégé + vérification accès entreprise
 */
router.get(
    '/history',
    protect,
    checkCompanyAccess,
    ocrController.getHistory
);

/**
 * @route   DELETE /api/ocr/:id
 * @desc    Supprime un document scanné de l'historique
 * @access  Protégé + vérification accès entreprise
 */
router.delete(
    '/:id',
    protect,
    checkCompanyAccess,
    ocrController.deleteDocument
);

// =============================================================================
// GESTION D'ERREURS MULTER
// =============================================================================

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('🚨 [Multer Error]', error.code, error.message);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                error: 'Le fichier ne doit pas dépasser 10 MB'
            });
        }
        
        return res.status(400).json({
            status: 'error',
            error: `Erreur upload : ${error.message}`
        });
    }
    
    if (error) {
        console.error('🚨 [Upload Error]', error.message);
        return res.status(400).json({
            status: 'error',
            error: error.message
        });
    }
    
    next();
});

module.exports = router;
