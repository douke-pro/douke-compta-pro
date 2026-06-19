'use strict';

const pool = require('../services/dbService');

// =============================================================================
// 1. GET /api/hr/documents?companyId=X&employeeId=Y&doc_type=Z
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.listDocuments = async (req, res) => {
    try {
        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = req.query.employeeId ? parseInt(req.query.employeeId) : null;
        const doc_type   = req.query.doc_type || null;

        let query = `SELECT d.id, d.doc_type, d.doc_name, d.file_size_kb,
                            d.employee_id, e.full_name as employee_name,
                            d.uploaded_by, d.created_at
                     FROM company_documents d
                     LEFT JOIN employees e ON e.id = d.employee_id
                     WHERE d.company_id = $1`;
        const params = [companyId];

        if (employeeId) { query += ` AND d.employee_id = $${params.length+1}`; params.push(employeeId); }
        if (doc_type)   { query += ` AND d.doc_type = $${params.length+1}`;    params.push(doc_type); }

        query += ` ORDER BY d.created_at DESC`;

        const result = await pool.queryWithRetry(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (error) {
        console.error('🚨 [listDocuments]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 2. POST /api/hr/documents/upload
// Body : { companyId, employee_id?, doc_type, doc_name, file_base64, file_mime }
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.uploadDocument = async (req, res) => {
    try {
        const companyId = parseInt(req.body.companyId || req.validatedCompanyId);
        const { employee_id, doc_type, doc_name, file_base64, file_mime } = req.body;

        if (!companyId || !doc_type || !doc_name || !file_base64)
            return res.status(400).json({ status: 'error', error: 'companyId, doc_type, doc_name, file_base64 requis' });

        // Taille approximative en KB
        const file_size_kb = Math.round((file_base64.length * 3) / 4 / 1024);

        // Limite 10MB
        if (file_size_kb > 10240)
            return res.status(400).json({ status: 'error', error: 'Fichier trop volumineux (max 10MB)' });

        const result = await pool.queryWithRetry(
            `INSERT INTO company_documents
                (company_id, employee_id, doc_type, doc_name,
                 file_base64, file_mime, file_size_kb, uploaded_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id, doc_type, doc_name, file_size_kb, created_at`,
            [companyId, employee_id || null, doc_type, doc_name,
             file_base64, file_mime || 'application/pdf',
             file_size_kb, req.user.odooUid]
        );

        console.log(`✅ [uploadDocument] ${doc_name} (${file_size_kb}KB) — Company ${companyId}`);
        res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [uploadDocument]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 3. GET /api/hr/documents/:id/download?companyId=X
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.downloadDocument = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const docId     = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `SELECT doc_name, file_base64, file_mime
             FROM company_documents
             WHERE id = $1 AND company_id = $2`,
            [docId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Document introuvable' });

        const { doc_name, file_base64, file_mime } = result.rows[0];
        const buffer = Buffer.from(file_base64, 'base64');

        res.setHeader('Content-Type', file_mime || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc_name}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('🚨 [downloadDocument]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 4. DELETE /api/hr/documents/:id?companyId=X
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.deleteDocument = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const docId     = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `DELETE FROM company_documents
             WHERE id = $1 AND company_id = $2
             RETURNING id, doc_name`,
            [docId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Document introuvable' });

        console.log(`✅ [deleteDocument] Supprimé: ${result.rows[0].doc_name}`);
        res.json({ status: 'success', message: 'Document supprimé', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [deleteDocument]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 5. GET /api/hr/documents/:id/preview?companyId=X
// Retourne le base64 + mime pour affichage inline
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.previewDocument = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const docId     = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `SELECT id, doc_name, file_base64, file_mime, doc_type, created_at
             FROM company_documents
             WHERE id = $1 AND company_id = $2`,
            [docId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Document introuvable' });

        res.json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [previewDocument]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};
