const { body, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            error: 'Paramètres invalides',
            details: errors.array().map(e => ({
                field: e.param,
                message: e.msg
            }))
        });
    }
    next();
};

const validateClosingStatus = [
    query('companyId')
        .isInt({ min: 1 })
        .withMessage('companyId doit être un entier positif'),
    query('year')
        .isInt({ min: 2000, max: 2100 })
        .withMessage('year doit être une année valide'),
    handleValidationErrors
];

const validatePreChecks = validateClosingStatus; // Même validation

const validatePostResult = [
    body('companyId').isInt({ min: 1 }),
    body('fiscal_year').isInt({ min: 2000, max: 2100 }),
    body('result_amount').isFloat(),
    body('result_type').isIn(['profit', 'loss']),
    handleValidationErrors
];

const validateLock = [
    body('companyId').isInt({ min: 1 }),
    body('fiscal_year').isInt({ min: 2000, max: 2100 }),
    body('notes').optional().isString().isLength({ max: 500 }),
    handleValidationErrors
];

const validateUnlock = [
    body('companyId').isInt({ min: 1 }),
    body('fiscal_year').isInt({ min: 2000, max: 2100 }),
    body('reason')
        .isString()
        .isLength({ min: 10, max: 500 })
        .withMessage('Le motif doit contenir entre 10 et 500 caractères'),
    handleValidationErrors
];

const validateFinalize = [
    body('companyId').isInt({ min: 1 }),
    body('fiscal_year').isInt({ min: 2000, max: 2100 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    handleValidationErrors
];

const validateAuditLog = validateClosingStatus; // Même validation

module.exports = {
    validateClosingStatus,
    validatePreChecks,
    validatePostResult,
    validateLock,
    validateUnlock,
    validateFinalize,
    validateAuditLog
};
