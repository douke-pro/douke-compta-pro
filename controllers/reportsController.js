// ============================================
// CONTROLLER : Rapports Financiers
// Version : V3.1 PRODUCTION
// Date : 2026-03-30
//
// ✅ FIX CRASH : req.user.id → req.user.odooUid (id n'existe pas dans le token)
// ✅ FIX NOTIFICATIONS : supprimé tout appel Odoo pour les notifs
//    → emails via Resend (emailService.js) uniquement
//    → le frontend gère l'affichage des notifications visuelles
// ✅ FIX ROBUSTESSE : tous les try/catch correctement isolés
// ✅ FIX RÉPONSE : res.json() toujours appelé avant setImmediate
// ✅ FIX CHAMPS : snake_case aligné avec le frontend (company_id, accounting_system, etc.)
// ✅ NETTOYAGE : logs temporaires de diagnostic supprimés
// ============================================

const pool               = require('../services/dbService');
const odooReportsService = require('../services/odooReportsService');
const pdfGeneratorService= require('../services/pdfGenerator');
const emailService       = require('../services/emailService');
const path               = require('path');
const fs                 = require('fs').promises;
// ✅ AJOUT — service notifications internes
const notificationService = require('../services/notifications');
const syscohadaMapper     = require('../services/syscohadaMapper');
const sycebnlBalanceAdapter = require('../services/sycebnlBalanceAdapter');
const sycebnlReportAdapter  = require('../services/sycebnlReportAdapter');
const sycebnlExcelExport     = require('../services/sycebnlExcelExport');

// ============================================
// HELPER : récupérer l'email de l'admin pour les notifications
// ============================================

const getAdminEmail = async () => {
    try {
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

        res.status(201).json({
            success: true,
            message: "Demande d'états financiers créée avec succès",
            data:    newRequest
        });

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

        let query    = `SELECT r.* FROM financial_reports_requests r WHERE r.requested_by = $1`;
        const params = [userId];

        if (status) { params.push(status); query += ` AND r.status = $${params.length}`; }

        query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result      = await pool.query(query, params);
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM financial_reports_requests WHERE requested_by = $1',
            [userId]
        );

        // 🔒 Masquer pdf_files si statut != 'sent'
        const sanitized = result.rows.map(row => {
            if (row.status !== 'sent') {
                const { pdf_files, odoo_data, ...safe } = row;
                return safe;
            }
            return row;
        });

        res.json({
            success: true,
            data:    sanitized,
            pagination: {
                total:  parseInt(countResult.rows[0].count),
                limit:  parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Erreur getMyRequests:', error.message);
        res.status(500).json({ success: false, message: 'Erreur récupération des demandes', error: error.message });
    }
};

// ============================================
// GET /api/reports/:id
// ============================================

// ============================================
// GET /api/reports/:id
// ============================================

exports.getRequestDetails = async (req, res) => {
    try {
        const userId   = req.user.odooUid;
        const userRole = req.user.profile || req.user.role || 'USER';
        await checkAccessToRequest(req.params.id, userId, userRole);

        const result = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = result.rows[0];

        // 🔒 Masquer pdf_files si user non staff et statut != 'sent'
        const roleCheck = (userRole || '').toUpperCase();
        const isStaff   = roleCheck === 'ADMIN' || roleCheck === 'COLLABORATEUR';
        if (!isStaff && request.status !== 'sent') {
            request.pdf_files = null;
        }

        // ✅ Enrichissement avec le nom réel de l'entreprise depuis Odoo
        try {
            const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
            const companyData = await odooExecuteKw({
                uid:    ADMIN_UID_INT,
                model:  'res.company',
                method: 'read',
                args:   [[request.company_id], ['name']],
                kwargs: {}
            });
            request.company_name = companyData?.[0]?.name || null;
        } catch (odooErr) {
            console.warn('⚠️ [getRequestDetails] Enrichissement Odoo échoué:', odooErr.message);
            request.company_name = null;
        }

        res.json({ success: true, data: request });

    } catch (error) {
        console.error('Erreur getRequestDetails:', error.message);
        res.status(error.message.includes('Acces refuse') ? 403 : 500).json({
            success: false,
            message: error.message
        });
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

        await pool.query(
            `UPDATE financial_reports_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
            [req.params.id]
        );
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
        let query    = `SELECT * FROM financial_reports_requests WHERE status IN ('pending','processing')`;
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
        let query    = `SELECT * FROM financial_reports_requests WHERE 1=1`;
        const params = [];

        if (status)            { params.push(status);            query += ` AND status = $${params.length}`; }
        if (company_id)        { params.push(company_id);        query += ` AND company_id = $${params.length}`; }
        if (accounting_system) { params.push(accounting_system); query += ` AND accounting_system = $${params.length}`; }
        if (start_date)        { params.push(start_date);        query += ` AND requested_at >= $${params.length}`; }
        if (end_date)          { params.push(end_date);          query += ` AND requested_at <= $${params.length}`; }

        query += ` ORDER BY requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data:    result.rows,
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

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
            `UPDATE financial_reports_requests SET status = 'processing', processed_by = $1, processed_at = NOW() WHERE id = $2`,
            [userId, requestId]
        );
        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Génération en cours...',
            data: { request_id: requestId, status: 'processing' }
        });

        setImmediate(async () => {
            try {
                const odooData = await odooReportsService.extractFinancialData(
                    request.company_id, request.period_start, request.period_end, request.accounting_system
                );

                const isSycebnl = (request.accounting_system || '').startsWith('SYCEBNL');
                let reportData;

                if (isSycebnl) {
                    // Chemin SYCEBNL (associations/ONG) — sycebnlMapper + sycebnlReportAdapter
                    const balanceN  = sycebnlBalanceAdapter.toBalanceSycebnl(odooData.raw_data.move_lines      || []);
                    const balanceN1 = sycebnlBalanceAdapter.toBalanceSycebnl(odooData.raw_data.prev_year_lines || []);
                    reportData = sycebnlReportAdapter.buildReportData(balanceN, balanceN1, {
                        company: odooData.company,
                        period:  odooData.period,
                    });
                } else {
                // Adaptateur enrichedLines → format attendu par syscohadaMapper
                function toBalanceAccounts(lines) {
                    const map = {};
                    for (const line of (lines || [])) {
                        const code = line.account_code;
                        if (!code || code === 'UNKNOWN') continue;
                        if (!map[code]) map[code] = { code, opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
                        map[code].debit  += line.debit  || 0;
                        map[code].credit += line.credit || 0;
                    }
                    return Object.values(map);
                }

                const balanceAccounts  = toBalanceAccounts(odooData.raw_data.move_lines      || []);
                const prevYearAccounts = toBalanceAccounts(odooData.raw_data.prev_year_lines || []);

                // Calculs SYSCOHADA normalisés
                const lignesResultat = syscohadaMapper.computeResultat(balanceAccounts, prevYearAccounts);
                const resultatNet    = lignesResultat.find(l => l.ref === 'XI')?.montant_n || 0;

                const actif  = syscohadaMapper.computeActif(balanceAccounts, prevYearAccounts);
                const passif = syscohadaMapper.computePassif(balanceAccounts, prevYearAccounts, resultatNet);

                const totalActif  = actif.find(l  => l.ref === 'BZ')?.net || 0;
                const totalPassif = passif.find(l => l.ref === 'DZ')?.net || 0;

                const bilanN = { actif, passif, resultat: lignesResultat };
                const tft    = syscohadaMapper.computeTFT(balanceAccounts, bilanN, {});
                const tresFin = tft.find(l => l.ref === 'ZH')?.montant_n || 0;

                reportData = {
                    company: odooData.company,
                    period:  odooData.period,
                    bilan: {
                        actif,
                        passif,
                        totaux: {
                            total_actif:  totalActif,
                            total_passif: totalPassif,
                            equilibre:    Math.abs(totalActif - totalPassif) < 1
                        }
                    },
                    compte_resultat: {
                        lignes:       lignesResultat,
                        resultat_net: resultatNet
                    },
                    tft: {
                        lignes:            tft,
                        tresorerie_finale: tresFin
                    },
                    annexes: odooData.annexes || null
                };
                }

                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    reportData, request.accounting_system, requestId
                );
                if (isSycebnl) {
                    const excelBuffer = await sycebnlExcelExport.buildSycebnlExcel(reportData);
                    pdfFiles.excel = Buffer.from(excelBuffer).toString('base64');
                }

                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'generated', pdf_files = $1, odoo_data = $2, updated_at = NOW() WHERE id = $3`,
                    [JSON.stringify(pdfFiles), JSON.stringify(odooData), requestId]
                );

                await notificationService.send({
                    userId:    request.requested_by,
                    companyId: request.company_id,
                    type:      'financial_report_generated',
                    title:   'Vos états financiers ont été générés',
                    message: `Votre demande #${String(requestId).padStart(5,'0')} a été traitée. Les rapports sont en cours de validation.`,
                    link:    `/reports/${requestId}`
                    }).catch(e => console.warn('⚠️ Notification interne générée échouée (non bloquant):', e.message));
                
                await emailService.sendReportReadyEmail({
                    userEmail: request.requested_by_email || req.user.email,
                    userName:  request.requested_by_name  || 'Utilisateur',
                    requestId,
                    status: 'generated'
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

        const result = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }
        if (result.rows[0].status !== 'generated') {
            return res.status(400).json({ success: false, message: 'Les rapports doivent d\'abord être générés' });
        }

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
        const result = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = result.rows[0];
        if (request.status !== 'validated') {
            return res.status(400).json({ success: false, message: 'Les rapports doivent être validés d\'abord' });
        }

        await pool.query(
            `UPDATE financial_reports_requests SET status = 'sent', sent_at = NOW() WHERE id = $1`,
            [req.params.id]
        );

        // ✅ APRÈS — ajoutez ces lignes immédiatement après
       await notificationService.send({
           userId:    request.requested_by,
           companyId: request.company_id,
           type:      'financial_report_ready',
           title:   '✅ Vos états financiers sont disponibles',
           message: `Votre demande #${String(req.params.id).padStart(5,'0')} est validée. Connectez-vous pour télécharger vos documents.`,
           link:    `/reports/${req.params.id}`
           }).catch(e => console.warn('⚠️ Notification interne envoi échouée (non bloquant):', e.message));

        
        res.json({ success: true, message: 'Rapports envoyés avec succès' });

        setImmediate(async () => {
            await emailService.sendReportReadyEmail({
                userEmail: request.requested_by_email || '',
                userName:  request.requested_by_name  || 'Utilisateur',
                requestId: req.params.id,
                status:    'sent'
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

// AJOUT (24/09/2026) — reconnexion du "Mode Édition" SYSCOHADA (régression du
// 22/06/2026, commit 2d079bc). Affichage uniquement : ne modifie ni ne persiste
// request.odoo_data. SYCEBNL volontairement non couvert (hors périmètre).
function buildEditableBilanEtResultat(odooData) {
    const rawLines  = odooData.raw_data?.move_lines      || [];
    const prevLines = odooData.raw_data?.prev_year_lines || [];

    const toBalanceAccounts = (lines) => {
        const map = {};
        for (const line of lines) {
            const code = line.account_code;
            if (!code || code === 'UNKNOWN') continue;
            if (!map[code]) map[code] = { code, opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
            map[code].debit  += line.debit  || 0;
            map[code].credit += line.credit || 0;
        }
        return Object.values(map);
    };

    const balanceAccounts  = toBalanceAccounts(rawLines);
    const prevYearAccounts = toBalanceAccounts(prevLines);

    const lignesResultat = syscohadaMapper.computeResultat(balanceAccounts, prevYearAccounts);
    const resultatNet    = lignesResultat.find(l => l.ref === 'XI')?.montant_n || 0;
    const actif          = syscohadaMapper.computeActif(balanceAccounts, prevYearAccounts);
    const passif         = syscohadaMapper.computePassif(balanceAccounts, prevYearAccounts, resultatNet);

    // Refs réellement éditables : celles qui participent à un refs_sum et ne
    // sont pas elles-mêmes un total. CJ exclu côté Passif : c'est un miroir
    // de XI (Compte de Résultat), non éditable indépendamment (cf. validation
    // du 24/09/2026 — évite une divergence Bilan/Compte de Résultat).
    const actifEditableRefs    = syscohadaMapper.getEditableRefs(syscohadaMapper.ACTIF_MAPPING, 'isGrandTotal');
    const passifEditableRefs   = syscohadaMapper.getEditableRefs(syscohadaMapper.PASSIF_MAPPING, 'isGrandTotal', ['CJ']);
    const resultatEditableRefs = syscohadaMapper.getEditableRefs(syscohadaMapper.RESULTAT_MAPPING, 'isTotal');

    const toEditableMap = (lignes, refsAutorisees, valueField) => {
        const out = {};
        for (const l of lignes) {
            if (!refsAutorisees.includes(l.ref)) continue;
            // Valeur affichée en magnitude positive (cf. frontend generateEditableSection,
            // qui fait Math.abs(category.balance) et renvoie toujours un positif à la saisie).
            out[l.ref] = { label: l.libelle, balance: Math.abs(l[valueField] || 0) };
        }
        return out;
    };

    const actifEditable  = toEditableMap(actif,  actifEditableRefs,  'net');
    const passifEditable = toEditableMap(passif, passifEditableRefs, 'net');

    const resultatMapByRef = new Map(syscohadaMapper.RESULTAT_MAPPING.map(m => [m.ref, m]));
    const charges = {}, produits = {};
    for (const l of lignesResultat) {
        if (!resultatEditableRefs.includes(l.ref)) continue;
        const m = resultatMapByRef.get(l.ref);
        const entry = { label: l.libelle, balance: Math.abs(l.montant_n) };
        if (m.type === 'charge') charges[l.ref] = entry;
        else if (m.type === 'produit') produits[l.ref] = entry;
    }

    const totalActif  = actif.find(l  => l.ref === 'BZ')?.net || 0;
    const totalPassif = passif.find(l => l.ref === 'DZ')?.net || 0;

    return {
        bilan: {
            actif: actifEditable,
            passif: passifEditable,
            totaux: { actif: totalActif, passif: totalPassif }
        },
        compte_resultat: {
            charges, produits,
            totaux: { resultat: resultatNet }
        }
    };
}

exports.previewReportData = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = result.rows[0];
        const isSycebnl = (request.accounting_system || '').startsWith('SYCEBNL');

        const attachEditable = (data) => {
            if (isSycebnl) return data; // hors périmètre
            try {
                return { ...data, ...buildEditableBilanEtResultat(data) };
            } catch (e) {
                console.error('Erreur calcul bilan/compte_resultat editables:', e.message);
                return data; // en cas d'erreur, on ne casse pas l'aperçu existant
            }
        };

        if (request.odoo_data) {
            return res.json({ success: true, data: attachEditable(request.odoo_data), cached: true });
        }

        const odooData = await odooReportsService.extractFinancialData(
            request.company_id, request.period_start, request.period_end, request.accounting_system
        );
        await pool.query(
            `UPDATE financial_reports_requests SET odoo_data = $1 WHERE id = $2`,
            [JSON.stringify(odooData), req.params.id]
        );

        res.json({ success: true, data: attachEditable(odooData), cached: false });

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

        if (!edited_data) {
            return res.status(400).json({ success: false, message: 'Données éditées manquantes' });
        }

        const requestResult = await client.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [req.params.id]
        );
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Demande introuvable' });
        }

        const request = requestResult.rows[0];
        if (!['processing','generated'].includes(request.status)) {
            return res.status(400).json({ success: false, message: 'Cette demande ne peut plus être modifiée' });
        }

        const odooData  = request.odoo_data || {};
        const isSycebnl = (request.accounting_system || '').startsWith('SYCEBNL');

        // ---------------------------------------------------------------
        // AJOUT (24/09/2026) — reconnexion réelle des éditions SYSCOHADA.
        // L'ancien code appelait applyEdits() sur odooData.bilan?.actif,
        // qui n'existe jamais dans odoo_data (régression du 22/06/2026,
        // commit 2d079bc) : les éditions n'étaient jamais appliquées, et
        // même si elles l'avaient été, le setImmediate plus bas recalculait
        // ensuite tout depuis raw_data en les ignorant silencieusement.
        // Cette section ne touche pas à la branche SYCEBNL (inchangée).
        // ---------------------------------------------------------------
        let actifRecalcule = null, passifRecalcule = null, resultatRecalcule = null;

        if (!isSycebnl) {
            try {
                const rawLines  = odooData.raw_data?.move_lines      || [];
                const prevLines = odooData.raw_data?.prev_year_lines || [];

                const toBalanceAccounts = (lines) => {
                    const map = {};
                    for (const line of (lines || [])) {
                        const code = line.account_code;
                        if (!code || code === 'UNKNOWN') continue;
                        if (!map[code]) map[code] = { code, opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
                        map[code].debit  += line.debit  || 0;
                        map[code].credit += line.credit || 0;
                    }
                    return Object.values(map);
                };

                const balanceAccounts  = toBalanceAccounts(rawLines);
                const prevYearAccounts = toBalanceAccounts(prevLines);

                const lignesResultatBase = syscohadaMapper.computeResultat(balanceAccounts, prevYearAccounts);
                const resultatNetBase    = lignesResultatBase.find(l => l.ref === 'XI')?.montant_n || 0;
                const actifBase          = syscohadaMapper.computeActif(balanceAccounts, prevYearAccounts);
                const passifBase         = syscohadaMapper.computePassif(balanceAccounts, prevYearAccounts, resultatNetBase);

                const chargesProduitsEdits = { ...(edited_data.charges || {}), ...(edited_data.produits || {}) };
                resultatRecalcule = syscohadaMapper.recomputeResultatWithEdits(lignesResultatBase, chargesProduitsEdits);
                const resultatNetRecalcule = resultatRecalcule.find(l => l.ref === 'XI')?.montant_n || 0;

                actifRecalcule = syscohadaMapper.recomputeActifWithEdits(actifBase, edited_data.actif || {});

                // CJ (résultat net côté Passif) suit TOUJOURS le résultat net recalculé du Compte
                // de Résultat, jamais une saisie indépendante (cf. validation du 24/09/2026 — CJ
                // exclu des refs éditables pour éviter une divergence Bilan / Compte de Résultat).
                let passifIntermediaire = syscohadaMapper.recomputePassifWithEdits(passifBase, edited_data.passif || {});
                passifIntermediaire = passifIntermediaire.map(l => l.ref === 'CJ' ? { ...l, net: Math.round(resultatNetRecalcule) } : l);
                // Deuxième passe pour propager CJ dans les totaux qui en dépendent (CP, DF, DZ).
                passifRecalcule = syscohadaMapper.recomputePassifWithEdits(passifIntermediaire, {});
            } catch (e) {
                console.error('Erreur recalcul édition SYSCOHADA (non bloquant, edited_data ignoré):', e.message);
                actifRecalcule = null; passifRecalcule = null; resultatRecalcule = null;
            }
        }

        await client.query('BEGIN');
        await client.query(
            `UPDATE financial_reports_requests SET updated_at = NOW() WHERE id = $1`,
            [req.params.id]
        );
        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Modifications sauvegardées. Régénération en cours...',
            data: { request_id: req.params.id, status: 'processing' }
        });

        setImmediate(async () => {
            try {
                const rawLines  = odooData.raw_data?.move_lines      || [];
                const prevLines = odooData.raw_data?.prev_year_lines || [];

                let reportData;

                if (isSycebnl) {
                    const balanceN  = sycebnlBalanceAdapter.toBalanceSycebnl(rawLines);
                    const balanceN1 = sycebnlBalanceAdapter.toBalanceSycebnl(prevLines);
                    reportData = sycebnlReportAdapter.buildReportData(balanceN, balanceN1, {
                        company: odooData.company,
                        period:  odooData.period,
                    });
                } else if (actifRecalcule && passifRecalcule && resultatRecalcule) {
                    const totalActif  = actifRecalcule.find(l  => l.ref === 'BZ')?.net || 0;
                    const totalPassif = passifRecalcule.find(l => l.ref === 'DZ')?.net || 0;
                    const resultatNet = resultatRecalcule.find(l => l.ref === 'XI')?.montant_n || 0;

                    function toBalanceAccounts(lines) {
                        const map = {};
                        for (const line of (lines || [])) {
                            const code = line.account_code;
                            if (!code || code === 'UNKNOWN') continue;
                            if (!map[code]) map[code] = { code, opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
                            map[code].debit  += line.debit  || 0;
                            map[code].credit += line.credit || 0;
                        }
                        return Object.values(map);
                    }
                    const balanceAccounts = toBalanceAccounts(rawLines);
                    const bilanN = { actif: actifRecalcule, passif: passifRecalcule, resultat: resultatRecalcule };
                    const tft     = syscohadaMapper.computeTFT(balanceAccounts, bilanN, {});
                    const tresFin = tft.find(l => l.ref === 'ZH')?.montant_n || 0;

                    reportData = {
                        company: odooData.company,
                        period:  odooData.period,
                        bilan: {
                            actif: actifRecalcule,
                            passif: passifRecalcule,
                            totaux: { total_actif: totalActif, total_passif: totalPassif, equilibre: Math.abs(totalActif - totalPassif) < 1 }
                        },
                        compte_resultat: { lignes: resultatRecalcule, resultat_net: resultatNet },
                        tft:             { lignes: tft, tresorerie_finale: tresFin },
                        annexes:         odooData.annexes || null
                    };
                } else {
                    function toBalanceAccounts(lines) {
                        const map = {};
                        for (const line of (lines || [])) {
                            const code = line.account_code;
                            if (!code || code === 'UNKNOWN') continue;
                            if (!map[code]) map[code] = { code, opening_debit: 0, opening_credit: 0, debit: 0, credit: 0 };
                            map[code].debit  += line.debit  || 0;
                            map[code].credit += line.credit || 0;
                        }
                        return Object.values(map);
                    }

                    const balanceAccounts  = toBalanceAccounts(rawLines);
                    const prevYearAccounts = toBalanceAccounts(prevLines);

                    const lignesResultat = syscohadaMapper.computeResultat(balanceAccounts, prevYearAccounts);
                    const resultatNet    = lignesResultat.find(l => l.ref === 'XI')?.montant_n || 0;
                    const actif          = syscohadaMapper.computeActif(balanceAccounts, prevYearAccounts);
                    const passif         = syscohadaMapper.computePassif(balanceAccounts, prevYearAccounts, resultatNet);
                    const totalActif     = actif.find(l  => l.ref === 'BZ')?.net || 0;
                    const totalPassif    = passif.find(l => l.ref === 'DZ')?.net || 0;
                    const bilanN         = { actif, passif, resultat: lignesResultat };
                    const tft            = syscohadaMapper.computeTFT(balanceAccounts, bilanN, {});
                    const tresFin        = tft.find(l => l.ref === 'ZH')?.montant_n || 0;

                    reportData = {
                        company: odooData.company,
                        period:  odooData.period,
                        bilan: {
                            actif, passif,
                            totaux: { total_actif: totalActif, total_passif: totalPassif, equilibre: Math.abs(totalActif - totalPassif) < 1 }
                        },
                        compte_resultat: { lignes: lignesResultat, resultat_net: resultatNet },
                        tft:             { lignes: tft, tresorerie_finale: tresFin },
                        annexes:         odooData.annexes || null
                    };
                }

                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    reportData, request.accounting_system, req.params.id
                );
                if (isSycebnl) {
                    const excelBuffer = await sycebnlExcelExport.buildSycebnlExcel(reportData);
                    pdfFiles.excel = Buffer.from(excelBuffer).toString('base64');
                }
                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'generated', pdf_files = $1, processed_by = $2, processed_at = NOW(), updated_at = NOW() WHERE id = $3`,
                    [JSON.stringify(pdfFiles), userId, req.params.id]
                );
            } catch (err) {
                console.error('❌ Erreur régénération PDFs:', err.message);
                await pool.query(
                    `UPDATE financial_reports_requests SET status = 'error', error_message = $1, updated_at = NOW() WHERE id = $2`,
                    [err.message, req.params.id]
                );
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

        const role    = (req.user.profile || req.user.role || '').toUpperCase();
        const isStaff = role === 'ADMIN' || role === 'COLLABORATEUR';
        if (!isStaff && request.status !== 'sent') {
            return res.status(403).json({
                success : false,
                message : 'Documents non encore disponibles. En attente de validation par votre conseiller.'
            });
        }
        const base64 = request.pdf_files?.[req.params.fileType];

        if (!base64) {
            return res.status(404).json({ success: false, message: 'PDF introuvable ou non encore généré' });
        }

        const buffer = Buffer.from(base64, 'base64');
        const isExcel = req.params.fileType === 'excel';
        res.setHeader('Content-Type', isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}_${req.params.fileType}.${isExcel ? 'xlsx' : 'pdf'}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

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
