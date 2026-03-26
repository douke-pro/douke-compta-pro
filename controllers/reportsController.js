// ============================================
// CONTROLLER : Rapports Financiers
// Version : V3.0 FINALE
// Date : 2026-03-23
//
// ✅ FIX CRASH : req.user.id → req.user.odooUid (id n'existe pas dans le token)
// ✅ FIX NOTIFICATIONS : supprimé tout appel Odoo pour les notifs
//    → emails via Resend (emailService.js) uniquement
//    → le frontend gère l'affichage des notifications visuelles
// ✅ FIX ROBUSTESSE : tous les try/catch correctement isolés
// ✅ FIX RÉPONSE : res.json() toujours appelé avant setImmediate
// ============================================

const pool               = require('../services/dbService');
const odooReportsService = require('../services/odooReportsService');
const pdfGeneratorService= require('../services/pdfGenerator');
const emailService       = require('../services/emailService');
const path               = require('path');
const fs                 = require('fs').promises;

// ============================================
// HELPER : récupérer l'email de l'admin pour les notifications
// ============================================

const getAdminEmail = async () => {
    try {
        // Cherche le premier admin dans la base PostgreSQL
        const result = await pool.query(
            `SELECT email, name FROM users WHERE role = 'ADMIN' OR profile = 'ADMIN' LIMIT 1`
        );
        if (result.rows.length > 0) return result.rows[0];
    } catch (e) {
        // Fallback sur variable d'environnement
    }
    return {
        email: process.env.ADMIN_EMAIL || process.env.SMTP_USER || null,
        name:  'Administrateur'
    };
};

// ============================================
// HELPER : vérification accès
// ============================================

const checkAccessToRequest = async (requestId, userId, userRole) => {
    const result = await pool.query(
        'SELECT * FROM financial_reports_requests WHERE id = $1',
        [requestId]
    );
    if (result.rows.length === 0) throw new Error('Demande introuvable');

    const request = result.rows[0];
    const role    = (userRole || '').toUpperCase();

    if (role === 'ADMIN' || role === 'COLLABORATEUR') return request;
    if (String(request.requested_by) !== String(userId)) throw new Error('Acces refuse a cette demande');
    return request;
};

// ============================================
// POST /api/reports/request — Créer une demande
// ============================================

exports.createRequest = async (req, res) => {
    const client = await pool.connect();

    try {
        console.log('📋 [createRequest] DÉBUT');
        console.log('📋 [createRequest] User:', req.user?.email, '| odooUid:', req.user?.odooUid);

        const {
            company_id,
            accounting_system,
            period_start,
            period_end,
            fiscal_year,
            notes
        } = req.body;

        // ✅ FIX CRASH : odooUid et non id
        const userId    = req.user.odooUid;
        const userEmail = req.user.email || '';
        const userName  = req.user.name || userEmail;

        console.log('📋 [createRequest] userId (odooUid):', userId);

        const validSystems = ['SYSCOHADA_NORMAL','SYSCOHADA_MINIMAL','SYCEBNL_NORMAL','SYCEBNL_ALLEGE','PCG_FRENCH'];

        if (!validSystems.includes(accounting_system)) {
            return res.status(400).json({ success: false, message: 'Système comptable invalide', valid_systems: validSystems });
        }
        if (!period_start || !period_end) {
            return res.status(400).json({ success: false, message: 'Les dates de début et fin sont obligatoires' });
        }
        if (new Date(period_start) > new Date(period_end)) {
            return res.status(400).json({ success: false, message: 'La date de début doit être antérieure à la date de fin' });
        }
        if (!company_id) {
            return res.status(400).json({ success: false, message: 'company_id requis' });
        }

        await client.query('BEGIN');

        const insertResult = await client.query(
            `INSERT INTO financial_reports_requests 
             (user_id, company_id, accounting_system, period_start, period_end,
              fiscal_year, requested_by, requested_by_name, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
             RETURNING *`,
            [userId, company_id, accounting_system, period_start, period_end,
             fiscal_year || null, userId, userName, notes || null]
        );

        const newRequest = insertResult.rows[0];
        await client.query('COMMIT');

        console.log('✅ [createRequest] Demande créée ID:', newRequest.id);

        // ✅ Réponse HTTP immédiate — le client ne attend plus
        res.status(201).json({
            success: true,
            message: "Demande d'états financiers créée avec succès",
            data:    newRequest
        });

        console.log('📋 [createRequest] Body reçu:', {
    company_id,
    accounting_system,
    period_start,
    period_end,
    fiscal_year,
    notes: notes ? 'présent' : 'absent'
});
        // ✅ Notification email en arrière-plan — ne bloque JAMAIS la réponse
        setImmediate(async () => {
            try {
                const admin = await getAdminEmail();
                if (admin.email) {
                    await emailService.sendNewReportRequestEmail({
                        adminEmail:       admin.email,
                        adminName:        admin.name,
                        requesterName:    userName,
                        requesterEmail:   userEmail,
                        requestId:        newRequest.id,
                        companyId:        company_id,
                        accountingSystem: accounting_system,
                        periodStart:      period_start,
                        periodEnd:        period_end
                    });
                }
            } catch (emailErr) {
                console.warn('⚠️ [createRequest] Email admin échoué (non bloquant):', emailErr.message);
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [createRequest] Erreur:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la demande', error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// GET /api/reports/my-requests
// ============================================

exports.getMyRequests = async (req, res) => {
    try {
        const userId           = req.user.odooUid;
        const { limit = 50, offset = 0, status } = req.query;

        let query  = `SELECT r.* FROM financial_reports_requests r WHERE r.requested_by = $1`;
        const params = [userId];

        if (status) { params.push(status); query += ` AND r.status = $${params.length}`; }

        query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result      = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM financial_reports_requests WHERE requested_by = $1', [userId]);

        res.json({
            success: true,
            data:    result.rows,
            pagination: { total: parseInt(countResult.rows[0].count), limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        console.error('Erreur getMyRequests:', error.message);
        res.status(500).json({ success: false, message: 'Erreur récupération des demandes', error: error.message });
    }
};

// ============================================
// GET /api/reports/:id
// ============================================

exports.getRequestDetails = async (req, res) => {
    try {
        const userId   = req.user.odooUid;
        const userRole = req.user.profile || req.user.role || 'USER';
        await checkAccessToRequest(req.params.id, userId, userRole);

        const result = await pool.query('SELECT * FROM financial_reports_requests WHERE id = $1', [req.params.id]);
        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Erreur getRequestDetails:', error.message);
        res.status(error.message.includes('Acces refuse') ? 403 : 500).json({ success: false, message: error.message });
    }
};

// ============================================
// DELETE /api/reports/:id/cancel
// ============================================

exports.cancelRequest = async (req, res) => {
    try {
        const userId   = req.user.odooUid;
        const userRole = req.user.profile || req.user.role || 'USER';
        const request  = await checkAccessToRequest(req.params.id, userId, userRole);

        if (!['pending', 'processing'].includes(request.status)) {
            return res.status(400).json({ success: false, message: 'Cette demande ne peut plus être annulée' });
        }

        await pool.query(`UPDATE financial_reports_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [req.params.id]);
        res.json({ success: true, message: 'Demande annulée avec succès' });

    } catch (error) {
        console.error('Erreur cancelRequest:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET /api/reports/pending
// ============================================

exports.getPendingRequests = async (req, res) => {
    try {
        const { company_id, accounting_system, limit = 50 } = req.query;
        let query  = `SELECT * FROM financial_reports_requests WHERE status IN ('pending','processing')`;
        const params = [];

        if (company_id)        { params.push(company_id);        query += ` AND company_id = $${params.length}`; }
        if (accounting_system) { params.push(accounting_system); query += ` AND accounting_system = $${params.length}`; }

        query += ` ORDER BY requested_at ASC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Erreur getPendingRequests:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET /api/reports/all
// ============================================

exports.getAllRequests = async (req, res) => {
    try {
        const { limit = 50, offset = 0, status, company_id, accounting_system, start_date, end_date } = req.query;
        let query  = `SELECT * FROM financial_reports_requests WHERE 1=1`;
        const params = [];

        if (status)            { params.push(status);            query += ` AND status = $${params.length}`; }
        if (company_id)        { params.push(company_id);        query += ` AND company_id = $${params.length}`; }
        if (accounting_system) { params.push(accounting_system); query += ` AND accounting_system = $${params.length}`; }
        if (start_date)        { params.push(start_date);        query += ` AND requested_at >= $${params.length}`; }
        if (end_date)          { params.push(end_date);          query += ` AND requested_at <= $${params.length}`; }

        query += ` ORDER BY requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows, pagination: { limit: parseInt(limit), offset: parseInt(offset) } });

    } catch (error) {
        console.error('Erreur getAllRequests:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// POST /api/reports/:id/generate
// ============================================

exports.generateReports = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId    = req.user.odooUid;
        const requestId = req.params.id;

        const requestResult = await client.query('SELECT * FROM financial_reports_requests WHERE id = $1', [requestId]);
        if (requestResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });

        const request = requestResult.rows[0];
        if (!['pending', 'error'].includes(request.status)) {
            return res.status(400).json({ success: false, message: 'Cette demande a déjà été traitée' });
        }

        await client.query('BEGIN');
        await client.query(
            `UPDATE financial_reports_requests SET status = 'processing', processed_by = $1, processed_at = NOW() WHERE id = $2`,
            [userId, requestId]
        );
        await client.query('COMMIT');

        // ✅ Réponse immédiate
        res.json({ success: true, message: 'Génération en cours...', data: { request_id: requestId, status: 'processing' } });

        // Génération en arrière-plan
        setImmediate(async () => {
            try {
                const odooData = await odooReportsService.extractFinancialData(
                    request.company_id, request.period_start, request.period_end, request.accounting_system
                );
                const pdfFiles = await pdfGeneratorService.generateAllReports(odooData, request.accounting_system, requestId);

                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'generated', pdf_files = $1, odoo_data = $2, updated_at = NOW() WHERE id = $3`,
                    [JSON.stringify(pdfFiles), JSON.stringify(odooData), requestId]
                );

                // Email au demandeur
                await emailService.sendReportReadyEmail({
                    userEmail: request.requested_by_email || req.user.email,
                    userName:  request.requested_by_name  || 'Utilisateur',
                    requestId, status: 'generated'
                }).catch(e => console.warn('⚠️ Email générés échoué:', e.message));

            } catch (err) {
                console.error('❌ Erreur génération:', err.message);
                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
                    [err.message, requestId]
                );
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur generateReports:', error.message);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// PATCH /api/reports/:id/validate
// ============================================

exports.validateReports = async (req, res) => {
    try {
        const userId    = req.user.odooUid;
        const { notes } = req.body;

        const result = await pool.query('SELECT * FROM financial_reports_requests WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });
        if (result.rows[0].status !== 'generated') return res.status(400).json({ success: false, message: 'Les rapports doivent d\'abord être générés' });

        await pool.query(
            `UPDATE financial_reports_requests SET status = 'validated', validated_by = $1, validated_at = NOW(), notes = COALESCE($2, notes) WHERE id = $3`,
            [userId, notes || null, req.params.id]
        );

        res.json({ success: true, message: 'Rapports validés avec succès' });

    } catch (error) {
        console.error('Erreur validateReports:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// POST /api/reports/:id/send
// ============================================

exports.sendReportsToUser = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financial_reports_requests WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });

        const request = result.rows[0];
        if (request.status !== 'validated') return res.status(400).json({ success: false, message: 'Les rapports doivent être validés d\'abord' });

        await pool.query(`UPDATE financial_reports_requests SET status = 'sent', sent_at = NOW() WHERE id = $1`, [req.params.id]);

        res.json({ success: true, message: 'Rapports envoyés avec succès' });

        setImmediate(async () => {
            await emailService.sendReportReadyEmail({
                userEmail: request.requested_by_email || '',
                userName:  request.requested_by_name  || 'Utilisateur',
                requestId: req.params.id,
                status: 'sent'
            }).catch(e => console.warn('⚠️ Email sent échoué:', e.message));
        });

    } catch (error) {
        console.error('Erreur sendReportsToUser:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET /api/reports/:id/preview
// ============================================

exports.previewReportData = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM financial_reports_requests WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });

        const request = result.rows[0];
        if (request.odoo_data) return res.json({ success: true, data: request.odoo_data, cached: true });

        const odooData = await odooReportsService.extractFinancialData(
            request.company_id, request.period_start, request.period_end, request.accounting_system
        );
        await pool.query(`UPDATE financial_reports_requests SET odoo_data = $1 WHERE id = $2`, [JSON.stringify(odooData), req.params.id]);

        res.json({ success: true, data: odooData, cached: false });

    } catch (error) {
        console.error('Erreur previewReportData:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// POST /api/reports/:id/regenerate
// ============================================

exports.regenerateReportsWithEdits = async (req, res) => {
    const client = await pool.connect();
    try {
        const { edited_data } = req.body;
        const userId          = req.user.odooUid;

        if (!edited_data) return res.status(400).json({ success: false, message: 'Données éditées manquantes' });

        const requestResult = await client.query('SELECT * FROM financial_reports_requests WHERE id = $1', [req.params.id]);
        if (requestResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Demande introuvable' });

        const request = requestResult.rows[0];
        if (!['processing','generated'].includes(request.status)) {
            return res.status(400).json({ success: false, message: 'Cette demande ne peut plus être modifiée' });
        }

        await client.query('BEGIN');
        const odooData = request.odoo_data || {};

        const applyEdits = (target, edits) => {
            if (!edits || !target) return;
            Object.keys(edits).forEach(k => { if (target[k]) target[k].balance = parseFloat(edits[k]); });
        };

        applyEdits(odooData.bilan?.actif,                edited_data.actif);
        applyEdits(odooData.bilan?.passif,               edited_data.passif);
        applyEdits(odooData.compte_resultat?.charges,    edited_data.charges);
        applyEdits(odooData.compte_resultat?.produits,   edited_data.produits);

        if (odooData.bilan) {
            const a = Object.values(odooData.bilan.actif  || {}).reduce((s,c) => s + Math.abs(c.balance||0), 0);
            const p = Object.values(odooData.bilan.passif || {}).reduce((s,c) => s + Math.abs(c.balance||0), 0);
            odooData.bilan.totaux = { actif: a, passif: p, difference: Math.abs(a - p) };
        }
        if (odooData.compte_resultat) {
            const tc = Object.values(odooData.compte_resultat.charges  || {}).reduce((s,c) => s + Math.abs(c.balance||0), 0);
            const tp = Object.values(odooData.compte_resultat.produits || {}).reduce((s,c) => s + Math.abs(c.balance||0), 0);
            odooData.compte_resultat.totaux = { charges: tc, produits: tp, resultat: tp - tc, resultat_label: (tp-tc) >= 0 ? 'Bénéfice' : 'Perte' };
        }

        await client.query(`UPDATE financial_reports_requests SET odoo_data = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(odooData), req.params.id]);
        await client.query('COMMIT');

        // ✅ Réponse immédiate
        res.json({ success: true, message: 'Modifications sauvegardées. Régénération en cours...', data: { request_id: req.params.id, status: 'processing' } });

        setImmediate(async () => {
            try {
                const pdfFiles = await pdfGeneratorService.generateAllReports(odooData, request.accounting_system, req.params.id);
                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'generated', pdf_files = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $3`,
                    [JSON.stringify(pdfFiles), userId, req.params.id]
                );
            } catch (err) {
                console.error('❌ Erreur régénération PDFs:', err.message);
                await pool.query(`UPDATE financial_reports_requests SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`, [err.message, req.params.id]);
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur regenerateReportsWithEdits:', error.message);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// GET /api/reports/:id/download/:fileType
// ============================================

exports.downloadPDF = async (req, res) => {
    try {
        const userId   = req.user.odooUid;
        const userRole = req.user.profile || req.user.role || 'USER';
        const request  = await checkAccessToRequest(req.params.id, userId, userRole);

        if (!request.pdf_files?.[req.params.fileType]) {
            return res.status(404).json({ success: false, message: 'Fichier PDF introuvable' });
        }

        const filePath = path.join(__dirname, '../../', request.pdf_files[req.params.fileType]);
        try { await fs.access(filePath); } catch { return res.status(404).json({ success: false, message: 'Fichier introuvable sur le serveur' }); }

        res.download(filePath);

    } catch (error) {
        console.error('Erreur downloadPDF:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// GET /api/reports/stats
// ============================================

exports.getDashboardStats = async (req, res) => {
    try {
        const userRole = req.user.profile || req.user.role || 'USER';
        console.log('[getDashboardStats] User:', req.user.email, 'Role:', userRole);

        const stats = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending')    as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                COUNT(*) FILTER (WHERE status = 'validated')  as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent')       as sent_count
            FROM financial_reports_requests
            WHERE status NOT IN ('cancelled','error')
        `);

        res.json({
            status: 'success',
            data: {
                pending_count:    parseInt(stats.rows[0].pending_count)    || 0,
                processing_count: parseInt(stats.rows[0].processing_count) || 0,
                validated_count:  parseInt(stats.rows[0].validated_count)  || 0,
                sent_count:       parseInt(stats.rows[0].sent_count)       || 0
            }
        });

    } catch (error) {
        console.error('[getDashboardStats] Erreur:', error.message);
        res.status(500).json({ status: 'error', message: 'Erreur statistiques', error: error.message });
    }
};

// ============================================
// GET /api/reports/stats/summary
// ============================================

exports.getReportsStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                COUNT(*)                                                         as total_requests,
                COUNT(*) FILTER (WHERE status = 'pending')                       as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing')                    as processing_count,
                COUNT(*) FILTER (WHERE status = 'generated')                     as generated_count,
                COUNT(*) FILTER (WHERE status = 'validated')                     as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent')                          as sent_count,
                COUNT(*) FILTER (WHERE status = 'cancelled')                     as cancelled_count,
                COUNT(*) FILTER (WHERE status = 'error')                         as error_count,
                COUNT(DISTINCT company_id)                                       as unique_companies,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_NORMAL')  as syscohada_normal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_MINIMAL') as syscohada_minimal_count
            FROM financial_reports_requests
        `);
        res.json({ success: true, data: stats.rows[0] });

    } catch (error) {
        console.error('Erreur getReportsStats:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
