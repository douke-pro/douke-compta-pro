// ============================================
// CONTROLLER : Rapports Financiers
// Description : Logique métier des états financiers
// Version : PRODUCTION COMPLÈTE avec getDashboardStats
// ============================================

const pool = require('../services/dbService');
const odooReportsService = require('../services/odooReportsService');
const pdfGeneratorService = require('../services/pdfGenerator');
const notificationsService = require('../services/notifications');
const path = require('path');
const fs = require('fs').promises;

// ============================================
// HELPERS
// ============================================

/**
 * Vérifier si l'utilisateur a accès à une demande
 */
const checkAccessToRequest = async (requestId, userId, userRole) => {
    const result = await pool.query(
        'SELECT * FROM financial_reports_requests WHERE id = $1',
        [requestId]
    );

    if (result.rows.length === 0) {
        throw new Error('Demande introuvable');
    }

    const request = result.rows[0];

    // ADMIN : accès total
    if (userRole === 'admin') {
        return request;
    }

    // COLLABORATEUR : accès à toutes les demandes de ses clients
    if (userRole === 'collaborateur') {
        // TODO: Vérifier que le collaborateur est assigné à l'entreprise
        return request;
    }

    // USER/CAISSIER : seulement leurs propres demandes
    if (request.requested_by !== userId) {
        throw new Error('Accès refusé à cette demande');
    }

    return request;
};

/**
 * Notifier les collaborateurs et admins d'une nouvelle demande
 */
const notifyNewRequest = async (requestId, companyId) => {
    try {
        // Récupérer tous les collaborateurs et admins
        const usersResult = await pool.query(
            `SELECT id, role FROM users 
             WHERE role IN ('collaborateur', 'admin') 
             AND active = true`
        );

        // TODO: Filtrer les collaborateurs assignés à l'entreprise
        const recipients = usersResult.rows.map(u => u.id);

        // Envoyer les notifications
        for (const recipientId of recipients) {
            await pool.query(
                `INSERT INTO financial_reports_notifications 
                 (report_request_id, recipient_user_id, notification_type, metadata)
                 VALUES ($1, $2, 'request_created', $3)`,
                [requestId, recipientId, JSON.stringify({ company_id: companyId })]
            );

            // Envoyer notification en temps réel (websocket/email)
            await notificationsService.send({
                userId: recipientId,
                type: 'financial_report_request',
                title: 'Nouvelle demande d\'états financiers',
                message: `Une demande d'états financiers a été créée (ID: ${requestId})`,
                link: `/reports/${requestId}`
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
        // Ne pas bloquer la création de la demande si notification échoue
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

        const userId = req.user.id;

        // Validation
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

        // Vérifier que l'utilisateur a accès à l'entreprise
        // TODO: Implémenter la vérification d'accès à l'entreprise

        await client.query('BEGIN');

        // Créer la demande
        const insertResult = await client.query(
            `INSERT INTO financial_reports_requests 
             (user_id, company_id, accounting_system, period_start, period_end, 
              fiscal_year, requested_by, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
             RETURNING *`,
            [userId, company_id, accounting_system, period_start, period_end, 
             fiscal_year, userId, notes]
        );

        const newRequest = insertResult.rows[0];

        await client.query('COMMIT');

        // Notifier les collaborateurs/admins (async, ne pas bloquer)
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
 * Historique des demandes de l'utilisateur
 */
exports.getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, status } = req.query;

        let query = `
            SELECT r.*, 
                   u.username as requested_by_name,
                   p.username as processed_by_name
            FROM financial_reports_requests r
            LEFT JOIN users u ON r.requested_by = u.id
            LEFT JOIN users p ON r.processed_by = p.id
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

        // Compter le total
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
 * Détails d'une demande
 */
exports.getRequestDetails = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const request = await checkAccessToRequest(requestId, userId, userRole);

        // Récupérer les informations complémentaires
        const detailsResult = await pool.query(
            `SELECT r.*, 
                    u.username as requested_by_name, u.email as requested_by_email,
                    p.username as processed_by_name,
                    v.username as validated_by_name,
                    c.name as company_name
             FROM financial_reports_requests r
             LEFT JOIN users u ON r.requested_by = u.id
             LEFT JOIN users p ON r.processed_by = p.id
             LEFT JOIN users v ON r.validated_by = v.id
             LEFT JOIN res_company c ON r.company_id = c.id
             WHERE r.id = $1`,
            [requestId]
        );

        res.json({
            success: true,
            data: detailsResult.rows[0]
        });

    } catch (error) {
        console.error('Erreur getRequestDetails:', error);
        res.status(error.message.includes('Accès refusé') ? 403 : 500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * DELETE /api/reports/:id/cancel
 * Annuler une demande
 */
exports.cancelRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const request = await checkAccessToRequest(requestId, userId, userRole);

        // Vérifier que la demande peut être annulée
        if (!['pending', 'processing'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être annulée (déjà validée ou envoyée)'
            });
        }

        // Annuler
        await pool.query(
            `UPDATE financial_reports_requests 
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = $1`,
            [requestId]
        );

        res.json({
            success: true,
            message: 'Demande annulée avec succès'
        });

    } catch (error) {
        console.error('Erreur cancelRequest:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/reports/pending
 * Demandes en attente (COLLABORATEUR/ADMIN)
 */
exports.getPendingRequests = async (req, res) => {
    try {
        const { company_id, accounting_system, limit = 50 } = req.query;

        let query = `
            SELECT r.*, 
                   u.username as requested_by_name,
                   c.name as company_name
            FROM financial_reports_requests r
            LEFT JOIN users u ON r.requested_by = u.id
            LEFT JOIN res_company c ON r.company_id = c.id
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

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Erreur getPendingRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/reports/all
 * Toutes les demandes avec filtres (COLLABORATEUR/ADMIN)
 */
exports.getAllRequests = async (req, res) => {
    try {
        const { 
            limit = 50, 
            offset = 0, 
            status, 
            company_id, 
            accounting_system,
            start_date,
            end_date
        } = req.query;

        let query = `
            SELECT r.*, 
                   u.username as requested_by_name,
                   p.username as processed_by_name,
                   c.name as company_name
            FROM financial_reports_requests r
            LEFT JOIN users u ON r.requested_by = u.id
            LEFT JOIN users p ON r.processed_by = p.id
            LEFT JOIN res_company c ON r.company_id = c.id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            params.push(status);
            query += ` AND r.status = $${params.length}`;
        }

        if (company_id) {
            params.push(company_id);
            query += ` AND r.company_id = $${params.length}`;
        }

        if (accounting_system) {
            params.push(accounting_system);
            query += ` AND r.accounting_system = $${params.length}`;
        }

        if (start_date) {
            params.push(start_date);
            query += ` AND r.requested_at >= $${params.length}`;
        }

        if (end_date) {
            params.push(end_date);
            query += ` AND r.requested_at <= $${params.length}`;
        }

        query += ` ORDER BY r.requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Erreur getAllRequests:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * POST /api/reports/:id/generate
 * Générer les rapports depuis Odoo
 */
exports.generateReports = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const requestId = req.params.id;
        const userId = req.user.id;

        // Récupérer la demande
        const requestResult = await client.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demande introuvable'
            });
        }

        const request = requestResult.rows[0];

        // Vérifier le statut
        if (!['pending', 'error'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette demande a déjà été traitée'
            });
        }

        await client.query('BEGIN');

        // Mettre à jour le statut
        await client.query(
            `UPDATE financial_reports_requests 
             SET status = 'processing', processed_by = $1, processed_at = NOW()
             WHERE id = $2`,
            [userId, requestId]
        );

        await client.query('COMMIT');

        // Lancer la génération en arrière-plan
        setImmediate(async () => {
            try {
                // 1. Extraire les données depuis Odoo
                const odooData = await odooReportsService.extractFinancialData(
                    request.company_id,
                    request.period_start,
                    request.period_end,
                    request.accounting_system
                );

                // 2. Générer les PDFs
                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    odooData,
                    request.accounting_system,
                    requestId
                );

                // 3. Mettre à jour la demande
                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'generated', 
                         pdf_files = $1, 
                         odoo_data = $2,
                         updated_at = NOW()
                     WHERE id = $3`,
                    [JSON.stringify(pdfFiles), JSON.stringify(odooData), requestId]
                );

                // 4. Notifier
                await notificationsService.send({
                    userId: request.requested_by,
                    type: 'financial_report_generated',
                    title: 'États financiers générés',
                    message: 'Vos états financiers ont été générés et sont en attente de validation',
                    link: `/reports/${requestId}`
                });

            } catch (error) {
                console.error('Erreur génération rapports:', error);
                
                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'error', 
                         error_message = $1,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [error.message, requestId]
                );
            }
        });

        res.json({
            success: true,
            message: 'Génération des rapports en cours...',
            data: { request_id: requestId, status: 'processing' }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur generateReports:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * PATCH /api/reports/:id/validate
 * Valider les rapports générés
 */
exports.validateReports = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.id;
        const { notes } = req.body;

        // Récupérer la demande
        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demande introuvable'
            });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'generated') {
            return res.status(400).json({
                success: false,
                message: 'Les rapports doivent d\'abord être générés'
            });
        }

        // Valider
        await pool.query(
            `UPDATE financial_reports_requests 
             SET status = 'validated', 
                 validated_by = $1, 
                 validated_at = NOW(),
                 notes = COALESCE($2, notes)
             WHERE id = $3`,
            [userId, notes, requestId]
        );

        res.json({
            success: true,
            message: 'Rapports validés avec succès'
        });

    } catch (error) {
        console.error('Erreur validateReports:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * POST /api/reports/:id/send
 * Envoyer les rapports au user
 */
exports.sendReportsToUser = async (req, res) => {
    try {
        const requestId = req.params.id;

        // Récupérer la demande
        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demande introuvable'
            });
        }

        const request = requestResult.rows[0];

        if (request.status !== 'validated') {
            return res.status(400).json({
                success: false,
                message: 'Les rapports doivent d\'abord être validés'
            });
        }

        // Marquer comme envoyé
        await pool.query(
            `UPDATE financial_reports_requests 
             SET status = 'sent', sent_at = NOW()
             WHERE id = $1`,
            [requestId]
        );

        // Envoyer notification au user
        await notificationsService.send({
            userId: request.requested_by,
            type: 'financial_report_ready',
            title: 'États financiers disponibles',
            message: 'Vos états financiers sont prêts et disponibles au téléchargement',
            link: `/reports/${requestId}`
        });

        // Optionnel : Envoyer par email avec pièces jointes
        // await emailService.sendReportsEmail(request);

        res.json({
            success: true,
            message: 'Rapports envoyés avec succès'
        });

    } catch (error) {
        console.error('Erreur sendReportsToUser:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/reports/:id/preview
 * Aperçu des données avant génération PDF
 */
exports.previewReportData = async (req, res) => {
    try {
        const requestId = req.params.id;

        const requestResult = await pool.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demande introuvable'
            });
        }

        const request = requestResult.rows[0];

        // Si données déjà extraites et éventuellement éditées, les retourner
        if (request.odoo_data) {
            return res.json({
                success: true,
                data: request.odoo_data,
                cached: true
            });
        }

        // Sinon, extraire depuis Odoo
        const odooData = await odooReportsService.extractFinancialData(
            request.company_id,
            request.period_start,
            request.period_end,
            request.accounting_system
        );

        // Sauvegarder en cache dans la BDD
        await pool.query(
            `UPDATE financial_reports_requests 
             SET odoo_data = $1 
             WHERE id = $2`,
            [JSON.stringify(odooData), requestId]
        );

        res.json({
            success: true,
            data: odooData,
            cached: false
        });

    } catch (error) {
        console.error('Erreur previewReportData:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * POST /api/reports/:id/regenerate
 * Sauvegarder les modifications et régénérer les PDFs
 */
exports.regenerateReportsWithEdits = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const requestId = req.params.id;
        const { edited_data } = req.body;
        const userId = req.user.id;

        // Validation
        if (!edited_data) {
            return res.status(400).json({
                success: false,
                message: 'Données éditées manquantes'
            });
        }

        // Récupérer la demande
        const requestResult = await client.query(
            'SELECT * FROM financial_reports_requests WHERE id = $1',
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Demande introuvable'
            });
        }

        const request = requestResult.rows[0];

        // Vérifier le statut (doit être processing ou generated)
        if (!['processing', 'generated'].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être modifiée (statut actuel : ' + request.status + ')'
            });
        }

        await client.query('BEGIN');

        // Fusionner les données éditées avec les données Odoo existantes
        const odooData = request.odoo_data || {};
        
        // Mettre à jour le bilan si édité
        if (edited_data.actif) {
            Object.keys(edited_data.actif).forEach(key => {
                if (odooData.bilan && odooData.bilan.actif && odooData.bilan.actif[key]) {
                    odooData.bilan.actif[key].balance = parseFloat(edited_data.actif[key]);
                }
            });
        }
        
        if (edited_data.passif) {
            Object.keys(edited_data.passif).forEach(key => {
                if (odooData.bilan && odooData.bilan.passif && odooData.bilan.passif[key]) {
                    odooData.bilan.passif[key].balance = parseFloat(edited_data.passif[key]);
                }
            });
        }

        // Mettre à jour le compte de résultat si édité
        if (edited_data.charges) {
            Object.keys(edited_data.charges).forEach(key => {
                if (odooData.compte_resultat && odooData.compte_resultat.charges && odooData.compte_resultat.charges[key]) {
                    odooData.compte_resultat.charges[key].balance = parseFloat(edited_data.charges[key]);
                }
            });
        }
        
        if (edited_data.produits) {
            Object.keys(edited_data.produits).forEach(key => {
                if (odooData.compte_resultat && odooData.compte_resultat.produits && odooData.compte_resultat.produits[key]) {
                    odooData.compte_resultat.produits[key].balance = parseFloat(edited_data.produits[key]);
                }
            });
        }

        // Recalculer les totaux
        if (odooData.bilan) {
            odooData.bilan.totaux = {
                actif: Object.values(odooData.bilan.actif).reduce((sum, cat) => sum + Math.abs(cat.balance), 0),
                passif: Object.values(odooData.bilan.passif).reduce((sum, cat) => sum + Math.abs(cat.balance), 0)
            };
            odooData.bilan.totaux.difference = Math.abs(odooData.bilan.totaux.actif - odooData.bilan.totaux.passif);
        }

        if (odooData.compte_resultat) {
            const totalCharges = Object.values(odooData.compte_resultat.charges).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            const totalProduits = Object.values(odooData.compte_resultat.produits).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            odooData.compte_resultat.totaux = {
                charges: totalCharges,
                produits: totalProduits,
                resultat: totalProduits - totalCharges,
                resultat_label: (totalProduits - totalCharges) >= 0 ? 'Bénéfice' : 'Perte'
            };
        }

        // Sauvegarder les données modifiées
        await client.query(
            `UPDATE financial_reports_requests 
             SET odoo_data = $1, 
                 updated_at = NOW()
             WHERE id = $2`,
            [JSON.stringify(odooData), requestId]
        );

        await client.query('COMMIT');

        // Lancer la régénération des PDFs en arrière-plan
        setImmediate(async () => {
            try {
                const pdfFiles = await pdfGeneratorService.generateAllReports(
                    odooData,
                    request.accounting_system,
                    requestId
                );

                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'generated', 
                         pdf_files = $1,
                         processed_by = $2,
                         processed_at = NOW(),
                         updated_at = NOW()
                     WHERE id = $3`,
                    [JSON.stringify(pdfFiles), userId, requestId]
                );

                // Notifier
                await notificationsService.send({
                    userId: request.requested_by,
                    type: 'financial_report_regenerated',
                    title: 'États financiers mis à jour',
                    message: 'Vos états financiers modifiés ont été régénérés avec succès',
                    link: `/reports/${requestId}`
                });

            } catch (error) {
                console.error('Erreur régénération PDFs:', error);
                
                await pool.query(
                    `UPDATE financial_reports_requests 
                     SET status = 'error', 
                         error_message = $1,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [error.message, requestId]
                );
            }
        });

        res.json({
            success: true,
            message: 'Modifications sauvegardées. Régénération des PDFs en cours...',
            data: { request_id: requestId, status: 'processing' }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur regenerateReportsWithEdits:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    } finally {
        client.release();
    }
};

/**
 * GET /api/reports/:id/download/:fileType
 * Télécharger un fichier PDF
 */
exports.downloadPDF = async (req, res) => {
    try {
        const { id: requestId, fileType } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const request = await checkAccessToRequest(requestId, userId, userRole);

        if (!request.pdf_files || !request.pdf_files[fileType]) {
            return res.status(404).json({
                success: false,
                message: 'Fichier PDF introuvable'
            });
        }

        const filePath = path.join(__dirname, '../../', request.pdf_files[fileType]);

        // Vérifier que le fichier existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Fichier PDF introuvable sur le serveur'
            });
        }

        // Envoyer le fichier
        res.download(filePath);

    } catch (error) {
        console.error('Erreur downloadPDF:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// STATISTIQUES
// ============================================

/**
 * ✅ NOUVEAU : GET /api/reports/stats
 * Statistiques pour le dashboard (format frontend compatible)
 * Permissions : COLLABORATEUR, ADMIN
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role || req.user.profile || 'user';
        
        console.log('📊 [getDashboardStats] User:', req.user.email, 'Role:', userRole);
        
        // Requête optimisée avec COUNT FILTER
        const stats = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                COUNT(*) FILTER (WHERE status = 'validated') as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent') as sent_count
            FROM financial_reports_requests
            WHERE status NOT IN ('cancelled', 'error')
        `);
        
        const result = {
            pending_count: parseInt(stats.rows[0].pending_count) || 0,
            processing_count: parseInt(stats.rows[0].processing_count) || 0,
            validated_count: parseInt(stats.rows[0].validated_count) || 0,
            sent_count: parseInt(stats.rows[0].sent_count) || 0
        };
        
        console.log('✅ [getDashboardStats] Stats:', result);
        
        res.json({
            status: 'success',
            data: result
        });
        
    } catch (error) {
        console.error('❌ [getDashboardStats] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques du dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

/**
 * GET /api/reports/stats/summary
 * Statistiques globales détaillées (ADMIN)
 */
exports.getReportsStats = async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                COUNT(*) FILTER (WHERE status = 'generated') as generated_count,
                COUNT(*) FILTER (WHERE status = 'validated') as validated_count,
                COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
                COUNT(*) FILTER (WHERE status = 'error') as error_count,
                COUNT(DISTINCT company_id) as unique_companies,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_NORMAL') as syscohada_normal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYSCOHADA_MINIMAL') as syscohada_minimal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYCEBNL_NORMAL') as sycebnl_normal_count,
                COUNT(*) FILTER (WHERE accounting_system = 'SYCEBNL_ALLEGE') as sycebnl_allege_count,
                COUNT(*) FILTER (WHERE accounting_system = 'PCG_FRENCH') as pcg_french_count
            FROM financial_reports_requests
        `);

        res.json({
            success: true,
            data: stats.rows[0]
        });

    } catch (error) {
        console.error('Erreur getReportsStats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
