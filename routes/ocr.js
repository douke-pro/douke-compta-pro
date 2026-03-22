// =============================================================================
// FICHIER : routes/ocr.js
// Version : V3.0 - ODOO 19 MULTI-COMPANY
// Date : 2026-03-22
// ✅ FIX : Ajout route GET /accounts pour charger le plan comptable par company
// ✅ FIX : Support PDF ajouté dans Multer (converti en image côté controller)
// ✅ Conservation : gestion erreurs Multer complète
// =============================================================================

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { authenticateToken } = require('../middleware/auth');
const ocrController         = require('../controllers/ocrController');
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

// =============================================================================
// CONFIGURATION MULTER
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
        fileSize: 10 * 1024 * 1024,   // 10 MB max
    },
    fileFilter: (req, file, cb) => {
        console.log('📋 [Multer] Fichier reçu:', file.originalname, '|', file.mimetype);

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf'   // ✅ PDF accepté
        ];

        if (allowedTypes.includes(file.mimetype)) {
            console.log('✅ [Multer] Type de fichier accepté:', file.mimetype);
            cb(null, true);
        } else {
            console.error('❌ [Multer] Type de fichier refusé:', file.mimetype);
            cb(new Error('❌ Type de fichier non autorisé. Formats acceptés : JPG, PNG, PDF.'));
        }
    }
});

// =============================================================================
// ✅ NOUVELLE ROUTE : GET /accounts
// Charge le plan comptable de la company depuis Odoo
// Utilisée par le frontend pour afficher les comptes dans les sélecteurs
// =============================================================================

router.get('/accounts', authenticateToken, async (req, res) => {
    try {
        const companyId = req.validatedCompanyId ||
            req.user?.companyId ||
            req.user?.currentCompanyId ||
            parseInt(req.query.companyId);

        console.log('📒 [GET /accounts] Company ID:', companyId);

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID manquant. Impossible de charger le plan comptable.'
            });
        }

        // ✅ Filtre company_ids pour isoler les comptes de la bonne entreprise
        const accounts = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.account',
            method: 'search_read',
            args: [[
                ['company_ids', 'in', [companyId]],   // ✅ Filtre réel multi-company
                ['active', '=', true]             
            ]],
            kwargs: {
                fields: ['id', 'code', 'name', 'account_type'],
                order:  'code asc',
                context: {
                    allowed_company_ids: [companyId]
                }
            }
        });

        console.log(`✅ [GET /accounts] ${accounts?.length || 0} comptes chargés pour company ${companyId}`);

        res.json({
            success: true,
            data: accounts || []
        });

    } catch (error) {
        console.error('🚨 [GET /accounts] Erreur:', error.message);
        res.status(500).json({
            success: false,
            message: `Erreur chargement plan comptable : ${error.message}`
        });
    }
});

// =============================================================================
// ROUTES OCR
// =============================================================================

// Upload et scan du document
router.post('/process', authenticateToken, upload.single('file'), ocrController.uploadAndScan);

// Validation et création de l'écriture dans Odoo
router.post('/validate-and-create', authenticateToken, ocrController.validateAndCreateEntry);

// Historique des documents numérisés
router.get('/history', authenticateToken, ocrController.getHistory);

// Suppression d'un document
router.delete('/:id', authenticateToken, ocrController.deleteDocument);

// =============================================================================
// GESTION ERREURS MULTER
// =============================================================================

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
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next();
});

console.log('✅ [routes/ocr] Routes V3.0 chargées avec succès');

module.exports = router;
