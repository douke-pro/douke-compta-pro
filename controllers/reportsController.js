// ============================================
// CONTROLLER : Rapports Financiers
// Version : V2.0 CORRIGÉE
// Date : 2026-03-22
//
// ✅ FIX 1 : Chemin odooService corrigé (../services/odooService)
// ✅ FIX 2 : notificationsService.send() remplacé par notifications Odoo directes
//            → plus de blocage SMTP / timeout qui ferme la session
// ✅ FIX 3 : Chaque appel notification entouré d'un try/catch isolé
// ✅ FIX 4 : getDashboardStats utilise req.user.profile (cohérent avec le reste)
// ✅ FIX 5 : setImmediate protégé — ne bloque plus la réponse HTTP
// ============================================

const pool                 = require('../services/dbService');
const odooReportsService   = require('../services/odooReportsService');
const pdfGeneratorService  = require('../services/pdfGenerator');
const path                 = require('path');
const fs                   = require('fs').promises;

// ✅ FIX 1 : Import direct depuis le bon chemin
const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

// ============================================
// HELPERS
// ============================================

const checkAccessToRequest = async (requestId, userId, userRole) => {
    const result = await pool.query(
        'SELECT * FROM financial_reports_requests WHERE id = $1',
        [requestId]
    );

    if (result.rows.length === 0) {
        throw new Error('Demande introuvable');
    }

    const request = result.rows[0];

    if (userRole === 'admin' || userRole === 'ADMIN') return request;
    if (userRole === 'collaborateur' || userRole === 'COLLABORATEUR') return request;

    if (request.requested_by !== userId) {
        throw new Error('Acces refuse a cette demande');
    }

    return request;
};

// ============================================
// ✅ FIX 2 : Notification via Odoo mail.message
// Remplace notificationsService.send() qui bloquait sur SMTP timeout
// Utilise exactement la même logique que notificationsController.js
// ============================================

const sendOdooNotification = async ({ odooUserId, title, message, link }) => {
    try {
        // Récupérer le partner_id du destinataire
        const userData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[odooUserId], ['partner_id']],
            kwargs: {}
        });

        if (!userData || !userData[0]?.partner_id) {
            console.warn(`⚠️ [sendOdooNotification] Partner introuvable pour user ${odooUserId}`);
            return false;
        }

        const partnerId = userData[0].partner_id[0];

        // Récupérer le partner_id de l'admin (expéditeur)
        const adminData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[ADMIN_UID_INT], ['partner_id']],
            kwargs: {}
        });

        const adminPartnerId = adminData[0]?.partner_id ? adminData[0].partner_id[0] : null;
        if (!adminPartnerId) {
            console.warn('⚠️ [sendOdooNotification] Partner admin introuvable');
            return false;
        }

        // Créer le message Odoo
        const messageId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'create',
            args: [{
                message_type: 'notification',
                subtype_id: 1,
                body: `<div style="font-family:Arial,sans-serif;padding:16px;">
                         <h3 style="color:#2563eb;margin:0 0 10px 0;">${title}</h3>
                         <p style="color:#374151;margin:0 0 10px 0;">${message}</p>
                         ${link ? `<a href="${link}" style="color:#2563eb;">Voir la demande →</a>` : ''}
                       </div>`,
                subject: title,
                author_id: adminPartnerId,
                needaction: true,
                partner_ids: [[6, 0, [partnerId]]]
            }],
            kwargs: {}
        });

        // Créer la notification mail.notification
        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.notification',
            method: 'create',
            args: [{
                mail_message_id: messageId,
                res_partner_id: partnerId,
                notification_type: 'inbox',
                is_read: false,
                notification_status: 'sent'
            }],
            kwargs: {}
        });

        console.log(`✅ [sendOdooNotification] Notification envoyée à user ${odooUserId} (partner ${partnerId})`);
        return true;

    } catch (error) {
        // ✅ FIX 3 : Jamais bloquant — erreur logguée mais ne remonte pas
        console.warn(`⚠️ [sendOdooNotification] Échec pour user ${odooUserId}: ${error.message}`);
        return false;
    }
};

/**
 * Notifier les collaborateurs et admins d'une nouvelle demande
 */
const notifyNewRequest = async (requestId, companyId) => {
    try {
        // ✅ FIX 1 : odooExecuteKw déjà importé en haut du fichier
        const odooUsers = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'search_read',
            args: [[
                ['active', '=', true],
                ['share', '=', false]
            ]],
            kwargs: {
                fields: ['id', 'name', 'email'],
                context: { lang: 'fr_FR', tz: 'Africa/Porto-Novo' }
            }
        });

        console.log(`[notifyNewRequest] ${odooUsers.length} users Odoo trouvés`);

        for (const recipient of odooUsers) {
            // Sauvegarder en base PostgreSQL
            try {
                await pool.query(
                    `INSERT INTO financial_reports_notifications 
                     (report_request_id, recipient_user_id, notification_type, metadata)
                     VALUES ($1, $2, 'request_created', $3)`,
                    [
                        requestId,
                        recipient.id,
                        JSON.stringify({
                            company_id: companyId,
                            recipient_name: recipient.name,
                            recipient_email: recipient.email
                        })
                    ]
                );
            } catch (dbError) {
                console.warn(`⚠️ [notifyNewRequest] Erreur DB pour user ${recipient.id}: ${dbError.message}`);
            }

            // ✅ FIX 2 : Notification Odoo sans SMTP
            await sendOdooNotification({
                odooUserId: recipient.id,
                title: 'Nouvelle demande d\'états financiers',
                message: `Une demande d'états financiers a été créée (ID: ${requestId})`,
                link: `/reports/${requestId}`
            });
        }

        console.log(`[notifyNewRequest] ${odooUsers.length} destinataires notifiés pour demande ${requestId}`);

    } catch (error) {
        // ✅ FIX 3 : Ne bloque jamais la création de la demande
        console.error('[notifyNewRequest] Erreur:', error.message);
    }
};

// ============================================
// ROUTES HANDLERS
// ============================================

/**
 * POST /api/reports/request
 * Créer une demande d'états financiers
 */
exports.createRequest = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            company_id,
            accounting_system,
            period_start,
            period_end,
            fiscal_year,
            notes
        } = req.body;

        const userId   = req.user.odooUid;
        const userEmail = req.user.email || '';
        const userName  = req.user.name || req.user.username || userEmail;

        const validSystems = [
            'SYSCOHADA_NORMAL',
            'SYSCOHADA_MINIMAL',
            'SYCEBNL_NORMAL',
            'SYCEBNL_ALLEGE',
            'PCG_FRENCH'
        ];

        if (!validSystems.includes(accounting_system)) {
            return res.status(400).json({
                success: false,
                message: 'Système comptable invalide',
                valid_systems: validSystems
            });
        }

        if (!period_start || !period_end) {
            return res.status(400).json({
                success: false,
                message: 'Les dates de début et fin sont obligatoires'
            });
        }

        if (new Date(period_start) > new Date(period_end)) {
            return res.status(400).json({
                success: false,
                message: 'La date de début doit être antérieure à la date de fin'
            });
        }

        await client.query('BEGIN');

        const insertResult = await client.query(
            `INSERT INTO financial_reports_requests 
             (user_id, company_id, accounting_system, period_start, period_end, 
              fiscal_year, requested_by, requested_by_name, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
             RETURNING *`,
            [userId, company_id, accounting_system, period_start, period_end,
             fiscal_year, userId, userName, notes]
        );

        const newRequest = insertResult.rows[0];

        await client.query('COMMIT');

        // ✅ FIX 5 : setImmediate — ne bloque pas la réponse HTTP
        // La réponse est envoyée immédiatement, les notifications se font en arrière-plan
        setImmediate(() => notifyNewRequest(newRequest.id, company_id));

        res.status(201).json({
            success: true,
            message: 'Demande d\'états financiers créée avec succès',
            data: newRequest
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur createRequest:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la demande',
            error: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * GET /api/reports/my-requests
 */
exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const { limit = 50, offset = 0, status } = req.query;

        let query = `
            SELECT r.*
            FROM financial_reports_requests r
            WHERE r.requested_by = $1
        `;

        const params = [userId];

        if (status) {
            params.push(status);
            query += ` AND r.status = $${params.length}`;
        }

        query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM financial_reports_requests WHERE requested_by = $1',
            [userId]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Erreur getMyRequests:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes',
            error: error.message
        });
    }
};

/**
 * GET /api/reports/:id
 */
exports.getRequestDetails = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId    = req.user.odooUid;
        const userRole  = req.user.profile || req.user.role || 'USER';

        const request = await checkAccessToRequest(requestId, userId, userRole);

        const detailsResult = await pool.query(
            'SELECT r.* FROM financial_reports_requests r WHERE r.id = $1',
            [requestId]
        );

        res.json({
            success: true,
            data: detailsResult.rows[0]
        });

    } catch (error) {
        console.error('Erreur getRequestDetails:', error);
        res.status(error.message.includes('Acces refuse') ? 403 : 500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * DELETE /api/reports/:id/cancel
 */
exports.cancelRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId    = req.user.odooUid;
        const userRole  = req.user.profile || req.user.role || 'USER';

        const request = await checkAccessToRequest(requestId, userId, userRole);

        if (!['pending', 'processing'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être annulée (déjà validée ou envoyée)'
            });
        }

        await pool.query(
            `UPDATE financial_reports_requests 
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = $1`,
            [requestId]
        );

        res.json({ success: true, message: 'Demande annulée avec succès' });

    } catch (error) {
        console.error('Erreur cancelRequest:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/reports/pending
 */
exports.getPendingRequests = async (req, res) => {
    try {
        const { company_id, accounting_system, limit = 50 } = req.query;

        let query = `
            SELECT r.*
            FROM financial_reports_requests r
            WHERE r.status IN ('pending', 'processing')
        `;

        const params = [];

        if (company_id) {
            params.push(company_id);
            query += ` AND r.company_id = $${params.length}`;
        }

        if (accounting_system) {
            params.push(accounting_system);
            query += ` AND r.accounting_system = $${params.length}`;
        }

        query += ` ORDER BY r.requested_at ASC`;

        if (limit) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Erreur getPendingRequests:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/reports/all
 */
exports.getAllRequests = async (req, res) => {
    try {
        const {
            limit = 50, offset = 0,
            status, company_id, accounting_system,
            start_date, end_date
        } = req.query;

        let query  = `SELECT r.* FROM financial_reports_requests r WHERE 1=1`;
        const params = [];

        if (status)            { params.push(status);            query += ` AND r.status = $${params.length}`; }
        if (company_id)        { params.push(company_id);        query += ` AND r.company_id = $${params.length}`; }
        if (accounting_system) { params.push(accounting_system); query += ` AND r.accounting_system = $${params.length}`; }
        if (start_date)        { params.push(start_date);        query += ` AND r.requested_at >= $${params.length}`; }
        if (end_date)          { params.push(end_date);          query += ` AND r.requested_at <= $${params.length}`; }

        query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows, pagination: { limit: parseInt(limit), offset: parseInt(offset) } });

    } catch (error) {
        console.error('Erreur getAllRequests:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/reports/:id/generate
 */
exports.generateReports = async (req, res) => {
    const client = await pool.connect();

    try {
        const requestId = req.params.id;
        const userId    = req.user.odooUid;

        const requestResult = await client.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = requestResult.rows[0];

        if (!['pending', 'error'].includes(request.status)) {
            return res.status(400).json({ success: false, message: 'Cette demande a déjà été traitée' });
        }

        await client.query('BEGIN');
        await client.query(
            `UPDATE financial_reports_requests 
             SET status = 'processing', processed_by = $1, processed_at = NOW()
             WHERE id = $2`,
            [userId, requestId]
        );
        await client.query('COMMIT');

        // ✅ FIX 5 : Réponse immédiate — génération en arrière-plan
        res.json({
            success: true,
            message: 'Génération des rapports en cours...',
            data: { request_id: requestId, status: 'processing' }
        });

        // ✅ FIX 3 : Tout le bloc async est protégé par try/catch
        setImmediate(async () => {
            try {
                const odooData = await odooReportsService.extractFinancialData(
                    request.company_id,
                    request.period_start,
                    request.period_end,
                    request.accounting_system
                );

                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    odooData,
                    request.accounting_system,
                    requestId
                );

                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'generated', pdf_files = $1, odoo_data = $2, updated_at = NOW()
                     WHERE id = $3`,
                    [JSON.stringify(pdfFiles), JSON.stringify(odooData), requestId]
                );

                // ✅ FIX 2 : Notification Odoo — pas d'email SMTP
                await sendOdooNotification({
                    odooUserId: request.requested_by,
                    title: 'États financiers générés',
                    message: 'Vos états financiers ont été générés et sont en attente de validation.',
                    link: `/reports/${requestId}`
                });

            } catch (error) {
                console.error('Erreur génération rapports:', error);
                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'error', error_message = $1, updated_at = NOW()
                     WHERE id = $2`,
                    [error.message, requestId]
                );
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur generateReports:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * PATCH /api/reports/:id/validate
 */
exports.validateReports = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId    = req.user.odooUid;
        const { notes } = req.body;

        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        if (requestResult.rows[0].status !== 'generated') {
            return res.status(400).json({ success: false, message: 'Les rapports doivent d\'abord être générés' });
        }

        await pool.query(
            `UPDATE financial_reports_requests 
             SET status = 'validated', validated_by = $1, validated_at = NOW(), notes = COALESCE($2, notes)
             WHERE id = $3`,
            [userId, notes, requestId]
        );

        res.json({ success: true, message: 'Rapports validés avec succès' });

    } catch (error) {
        console.error('Erreur validateReports:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/reports/:id/send
 */
exports.sendReportsToUser = async (req, res) => {
    try {
        const requestId = req.params.id;

        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'validated') {
            return res.status(400).json({ success: false, message: 'Les rapports doivent d\'abord être validés' });
        }

        await pool.query(
            `UPDATE financial_reports_requests SET status = 'sent', sent_at = NOW() WHERE id = $1`,
            [requestId]
        );

        // ✅ FIX 2 : Notification Odoo — pas d'email SMTP
        setImmediate(async () => {
            await sendOdooNotification({
                odooUserId: request.requested_by,
                title: 'États financiers disponibles',
                message: 'Vos états financiers sont prêts et disponibles au téléchargement.',
                link: `/reports/${requestId}`
            });
        });

        res.json({ success: true, message: 'Rapports envoyés avec succès' });

    } catch (error) {
        console.error('Erreur sendReportsToUser:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/reports/:id/preview
 */
exports.previewReportData = async (req, res) => {
    try {
        const requestId = req.params.id;

        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = requestResult.rows[0];

        if (request.odoo_data) {
            return res.json({ success: true, data: request.odoo_data, cached: true });
        }

        const odooData = await odooReportsService.extractFinancialData(
            request.company_id,
            request.period_start,
            request.period_end,
            request.accounting_system
        );

        await pool.query(
            `UPDATE financial_reports_requests SET odoo_data = $1 WHERE id = $2`,
            [JSON.stringify(odooData), requestId]
        );

        res.json({ success: true, data: odooData, cached: false });

    } catch (error) {
        console.error('Erreur previewReportData:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/reports/:id/regenerate
 */
exports.regenerateReportsWithEdits = async (req, res) => {
    const client = await pool.connect();

    try {
        const requestId    = req.params.id;
        const { edited_data } = req.body;
        const userId       = req.user.odooUid;

        if (!edited_data) {
            return res.status(400).json({ success: false, message: 'Données éditées manquantes' });
        }

        const requestResult = await client.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = requestResult.rows[0];

        if (!['processing', 'generated'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être modifiée (statut actuel : ' + request.status + ')'
            });
        }

        await client.query('BEGIN');

        const odooData = request.odoo_data || {};

        if (edited_data.actif && odooData.bilan?.actif) {
            Object.keys(edited_data.actif).forEach(key => {
                if (odooData.bilan.actif[key]) odooData.bilan.actif[key].balance = parseFloat(edited_data.actif[key]);
            });
        }
        if (edited_data.passif && odooData.bilan?.passif) {
            Object.keys(edited_data.passif).forEach(key => {
                if (odooData.bilan.passif[key]) odooData.bilan.passif[key].balance = parseFloat(edited_data.passif[key]);
            });
        }
        if (edited_data.charges && odooData.compte_resultat?.charges) {
            Object.keys(edited_data.charges).forEach(key => {
                if (odooData.compte_resultat.charges[key]) odooData.compte_resultat.charges[key].balance = parseFloat(edited_data.charges[key]);
            });
        }
        if (edited_data.produits && odooData.compte_resultat?.produits) {
            Object.keys(edited_data.produits).forEach(key => {
                if (odooData.compte_resultat.produits[key]) odooData.compte_resultat.produits[key].balance = parseFloat(edited_data.produits[key]);
            });
        }

        if (odooData.bilan) {
            odooData.bilan.totaux = {
                actif:  Object.values(odooData.bilan.actif).reduce((s, c) => s + Math.abs(c.balance), 0),
                passif: Object.values(odooData.bilan.passif).reduce((s, c) => s + Math.abs(c.balance), 0)
            };
            odooData.bilan.totaux.difference = Math.abs(odooData.bilan.totaux.actif - odooData.bilan.totaux.passif);
        }

        if (odooData.compte_resultat) {
            const totalCharges  = Object.values(odooData.compte_resultat.charges).reduce((s, c) => s + Math.abs(c.balance), 0);
            const totalProduits = Object.values(odooData.compte_resultat.produits).reduce((s, c) => s + Math.abs(c.balance), 0);
            odooData.compte_resultat.totaux = {
                charges: totalCharges,
                produits: totalProduits,
                resultat: totalProduits - totalCharges,
                resultat_label: (totalProduits - totalCharges) >= 0 ? 'Bénéfice' : 'Perte'
            };
        }

        await client.query(
            `UPDATE financial_reports_requests SET odoo_data = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(odooData), requestId]
        );

        await client.query('COMMIT');

        // ✅ FIX 5 : Réponse immédiate
        res.json({
            success: true,
            message: 'Modifications sauvegardées. Régénération des PDFs en cours...',
            data: { request_id: requestId, status: 'processing' }
        });

        // ✅ FIX 3 : Génération en arrière-plan protégée
        setImmediate(async () => {
            try {
                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    odooData,
                    request.accounting_system,
                    requestId
                );

                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'generated', pdf_files = $1, processed_by = $2,
                         processed_at = NOW(), updated_at = NOW()
                     WHERE id = $3`,
                    [JSON.stringify(pdfFiles), userId, requestId]
                );

                // ✅ FIX 2 : Notification Odoo
                await sendOdooNotification({
                    odooUserId: request.requested_by,
                    title: 'États financiers mis à jour',
                    message: 'Vos états financiers modifiés ont été régénérés avec succès.',
                    link: `/reports/${requestId}`
                });

            } catch (error) {
                console.error('Erreur régénération PDFs:', error);
                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
                    [error.message, requestId]
                );
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur regenerateReportsWithEdits:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

/**
 * GET /api/reports/:id/download/:fileType
 */
exports.downloadPDF = async (req, res) => {
    try {
        const { id: requestId, fileType } = req.params;
        const userId   = req.user.odooUid;
        const userRole = req.user.profile || req.user.role || 'USER';

        const request = await checkAccessToRequest(requestId, userId, userRole);

        if (!request.pdf_files || !request.pdf_files[fileType]) {
            return res.status(404).json({ success: false, message: 'Fichier PDF introuvable' });
        }

        const filePath = path.join(__dirname, '../../', request.pdf_files[fileType]);

        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ success: false, message: 'Fichier PDF introuvable sur le serveur' });
        }

        res.download(filePath);

    } catch (error) {
        console.error('Erreur downloadPDF:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// ✅ FIX 4 : STATISTIQUES — req.user.profile cohérent avec le reste du projet
// ============================================

/**
 * GET /api/reports/stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // ✅ FIX 4 : profile en priorité (cohérent avec protect middleware)
        const userRole = req.user.profile || req.user.role || 'USER';

        console.log('[getDashboardStats] User:', req.user.email, 'Role:', userRole);

        const stats = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending')    as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                COUNT(*) FILTER (WHERE status = 'validated')  as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent')       as sent_count
            FROM financial_reports_requests
            WHERE status NOT IN ('cancelled', 'error')
        `);

        const result = {
            pending_count:    parseInt(stats.rows[0].pending_count)    || 0,
            processing_count: parseInt(stats.rows[0].processing_count) || 0,
            validated_count:  parseInt(stats.rows[0].validated_count)  || 0,
            sent_count:       parseInt(stats.rows[0].sent_count)       || 0
        };

        console.log('[getDashboardStats] Stats:', result);

        res.json({ status: 'success', data: result });

    } catch (error) {
        console.error('[getDashboardStats] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

/**
 * GET /api/reports/stats/summary
 */
exports.getReportsStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*)                                                          as total_requests,
                COUNT(*) FILTER (WHERE status = 'pending')                        as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing')                     as processing_count,
                COUNT(*) FILTER (WHERE status = 'generated')                      as generated_count,
                COUNT(*) FILTER (WHERE status = 'validated')                      as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent')                           as sent_count,
                COUNT(*) FILTER (WHERE status = 'cancelled')                      as cancelled_count,
                COUNT(*) FILTER (WHERE status = 'error')                          as error_count,
                COUNT(DISTINCT company_id)                                        as unique_companies,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_NORMAL')   as syscohada_normal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_MINIMAL')  as syscohada_minimal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYCEBNL_NORMAL')     as sycebnl_normal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYCEBNL_ALLEGE')     as sycebnl_allege_count,
                COUNT(*) FILTER (WHERE accounting_system = 'PCG_FRENCH')         as pcg_french_count
            FROM financial_reports_requests
        `);

        res.json({ success: true, data: stats.rows[0] });

    } catch (error) {
        console.error('Erreur getReportsStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
