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
const { authenticateToken } = require('../middleware/auth');
const ocrController = require('../controllers/ocrController');

// Configuration Multer
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
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        console.log('📋 [Multer] Fichier reçu:', file.originalname, '|', file.mimetype);
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        
        if (allowedTypes.includes(file.mimetype)) {
            console.log('✅ [Multer] Type de fichier accepté');
            cb(null, true);
        } else {
            console.error('❌ [Multer] Type de fichier refusé:', file.mimetype);
            
            if (file.mimetype === 'application/pdf') {
                cb(new Error('❌ Les fichiers PDF ne sont pas encore supportés. Veuillez utiliser une image (JPG ou PNG).'));
            } else {
                cb(new Error('❌ Type de fichier non autorisé. Formats acceptés : JPG, PNG uniquement.'));
            }
        }
    }
});

// ✅ ROUTES OCR (PAS de route /accounts ici)
router.post('/process', authenticateToken, upload.single('file'), ocrController.uploadAndScan);
router.post('/validate-and-create', authenticateToken, ocrController.validateAndCreateEntry);
router.get('/history', authenticateToken, ocrController.getHistory);
router.delete('/:id', authenticateToken, ocrController.deleteDocument);

// Gestion erreurs Multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('🚨 [Multer Error]', error.code, ':', error.message);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier ne doit pas dépasser 10 MB'
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Un seul fichier autorisé à la fois'
            });
        }
        
        return res.status(400).json({
            success: false,
            message: `Erreur upload : ${error.message}`
        });
    }
    
    if (error) {
        console.error('🚨 [Upload Error]', error.message);
        console.error('🔍 [Upload Error Stack]', error.stack);
        
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next();
});

console.log('✅ [routes/ocr] Routes chargées avec succès');

module.exports = router;
