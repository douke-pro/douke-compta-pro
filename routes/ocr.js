// =============================================================================
// FICHIER : routes/ocr.js
// Description : Routes pour la numérisation de factures (OCR)
// Version : V2.0 - CORRIGÉE - Endpoints alignés avec le frontend
// Date : 2026-02-22
// =============================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const ocrController = require('../controllers/ocrController');

// =============================================================================
// CONFIGURATION MULTER (Upload de fichiers)
// =============================================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `invoice-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: (req, file, cb) => {
        console.log('📋 [Multer] Fichier:', file.originalname, '|', file.mimetype);
        
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf'  // ✅ Réactivé (avec conversion en image)
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            console.log('✅ [Multer] Type accepté');
            cb(null, true);
        } else {
            console.error('❌ [Multer] Type refusé:', file.mimetype);
            cb(new Error('Type de fichier non autorisé. Formats acceptés : JPG, PNG, PDF'));
        }
    }
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/ocr/process
 * Upload et analyse OCR d'une facture
 * Body: FormData { file: File, companyId: Number }
 */
router.post(
    '/process',  // ✅ ALIGNÉ AVEC LE FRONTEND
    authenticateToken,
    upload.single('file'),  // ✅ Champ 'file' (pas 'invoice')
    ocrController.processInvoice
);

/**
 * POST /api/ocr/validate-and-create
 * Valider et créer l'écriture comptable
 * Body: JSON { date, invoiceNumber, supplier, amountTTC, accountDebitCode, accountCreditCode, ... }
 */
router.post(
    '/validate-and-create',  // ✅ ALIGNÉ AVEC LE FRONTEND
    authenticateToken,
    ocrController.validateAndCreateEntry
);

/**
 * GET /api/ocr/history
 * Historique des documents scannés
 */
router.get(
    '/history',
    authenticateToken,
    ocrController.getHistory
);

/**
 * DELETE /api/ocr/:id
 * Supprimer un document de l'historique
 */
router.delete(
    '/:id',
    authenticateToken,
    ocrController.deleteDocument
);

// =============================================================================
// GESTION D'ERREURS MULTER
// =============================================================================

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('🚨 [Multer Error]', error.code);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier ne doit pas dépasser 10 MB'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: `Erreur upload : ${error.message}`
        });
    }
    
    if (error) {
        console.error('🚨 [Upload Error]', error.message);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next();
});

module.exports = router;
