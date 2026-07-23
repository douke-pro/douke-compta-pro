// =============================================================================
// FICHIER : controllers/settingsController.js (VERSION CORRIGÉE V17)
// Description : Gestion des paramètres de l'entreprise
// V17 : implémentation réelle du changement de accounting_system (chart_template)
//       via res.config.settings (create + execute), avec garde-fou anti-écritures
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

/**
 * Récupère les paramètres de l'entreprise
 * @route GET /api/settings/company/:companyId
 */
exports.getCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

        console.log(`📋 [getCompanySettings] Company ID: ${companyId}`);

        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], [
                'name', 'email', 'phone', 'street', 'city', 'country_id',
                'vat', 'company_registry', 'partner_id'
            ]],
            kwargs: {}
        });

        if (!companies || companies.length === 0) {
            return res.status(404).json({ 
                status: 'error',
                error: 'Entreprise introuvable' 
            });
        }

        const company = companies[0];

        let partnerData = {};
        if (company.partner_id) {
            const partners = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.partner',
                method: 'read',
                args: [[company.partner_id[0]], ['name', 'phone', 'email']],
                kwargs: {}
            });
            partnerData = partners[0] || {};
        }

        console.log(`✅ Paramètres entreprise ${company.name} récupérés`);

        res.json({
            status: 'success',
            data: {
                id: company.id,
                name: company.name,
                email: company.email,
                phone: company.phone,
                address: company.street,
                city: company.city,
                country_code: company.country_id ? company.country_id[0] : null,
                tax_id: company.vat,
                registration_number: company.company_registry,
                legal_status: 'SARL',
                manager_name: partnerData.name || '',
                manager_contact: partnerData.phone || ''
            }
        });

    } catch (error) {
        console.error('🚨 getCompanySettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Met à jour les paramètres de l'entreprise
 * @route PUT /api/settings/company/:companyId
 */
exports.updateCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { name, email, phone, address, city, country_code, tax_id, registration_number } = req.body;

        console.log(`✏️ [updateCompanySettings] Company ID: ${companyId}`);

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.street = address;
        if (city) updateData.city = city;
        if (tax_id) updateData.vat = tax_id;
        if (registration_number) updateData.company_registry = registration_number;

        await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'write',
            args: [[companyId], updateData],
            kwargs: {}
        });
        console.log(`✅ [updateCompanySettings] Entreprise ${companyId} mise à jour via Odoo`);

        res.json({
            status: 'success',
            message: 'Paramètres mis à jour avec succès'
        });

    } catch (error) {
        console.error('🚨 updateCompanySettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Récupère les paramètres comptables
 * @route GET /api/settings/accounting/:companyId
 */
exports.getAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

        console.log(`📊 [getAccountingSettings] Company ID: ${companyId}`);

        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.company',
            method: 'read',
            args: [[companyId], ['name', 'chart_template']],
            kwargs: {}
        });
        const currentChartTemplate = companies[0]?.chart_template || null;

        const fiscalYears = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'account.fiscal.year',
            method: 'search_read',
            args: [[['company_id', '=', companyId]]],
            kwargs: {
                fields: ['name', 'date_from', 'date_to'],
                limit: 1,
                order: 'date_to desc'
            }
        });

        const fiscalYear = fiscalYears[0] || {};

        let financialStatementModel = 'NORMAL';
        try {
            const prefResult = await pool.query(
                'SELECT financial_statement_model FROM company_accounting_preferences WHERE company_id = $1',
                [companyId]
            );
            if (prefResult.rows.length > 0) {
                financialStatementModel = prefResult.rows[0].financial_statement_model;
            }
        } catch (prefError) {
            console.error('🚨 [getAccountingSettings] Erreur lecture company_accounting_preferences:', prefError.message);
        }

        console.log(`✅ Paramètres comptables récupérés`);

        res.json({
            status: 'success',
            data: {
                accounting_system: currentChartTemplate,
                syscohada_variant: 'NORMAL',
                financial_statement_model: financialStatementModel,
                fiscal_year_start: fiscalYear.date_from || '2026-01-01',
                fiscal_year_end: fiscalYear.date_to || '2026-12-31',
                allow_negative_stock: false,
                enable_multi_currency: false,
                require_analytic: false
            }
        });

    } catch (error) {
        console.error('🚨 getAccountingSettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Met à jour les paramètres comptables, y compris le changement réel de plan
 * comptable (accounting_system → chart_template Odoo) via res.config.settings.
 * @route PUT /api/settings/accounting/:companyId
 * Body optionnel : { force: true } pour autoriser le changement malgré des
 * écritures déjà existantes (après backup manuel préalable recommandé).
 */
exports.updateAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const {
            accounting_system,
            syscohada_variant,
            fiscal_year_start,
            fiscal_year_end,
            financial_statement_model,
            force
        } = req.body;

        console.log(`✏️ [updateAccountingSettings] Company ID: ${companyId} — accounting_system demandé: ${accounting_system}, force=${!!force}`);

        const VALID_FINANCIAL_STATEMENT_MODELS = ['NORMAL', 'SMT'];
        let savedPreference = null;

        // --- financial_statement_model (Postgres, axe indépendant) ---
        if (financial_statement_model !== undefined) {
            if (!VALID_FINANCIAL_STATEMENT_MODELS.includes(financial_statement_model)) {
                return res.status(400).json({
                    status: 'error',
                    error: `Valeur financial_statement_model "${financial_statement_model}" invalide. Valeurs valides : ${VALID_FINANCIAL_STATEMENT_MODELS.join(', ')}.`
                });
            }

            const upsertResult = await pool.query(
                `INSERT INTO company_accounting_preferences (company_id, financial_statement_model, updated_at, updated_by)
                 VALUES ($1, $2, now(), $3)
                 ON CONFLICT (company_id)
                 DO UPDATE SET financial_statement_model = $2, updated_at = now(), updated_by = $3
                 RETURNING company_id, financial_statement_model, updated_at`,
                [companyId, financial_statement_model, req.user?.email || req.user?.name || 'unknown']
            );
            savedPreference = upsertResult.rows[0];
            console.log(`✅ [updateAccountingSettings] Préférence enregistrée en base : ${JSON.stringify(savedPreference)}`);
        }

        // --- accounting_system → chart_template Odoo (changement réel) ---
        let chartTemplateResult = null;

        if (accounting_system !== undefined) {
            // 1. Valider le code contre la vraie liste Odoo
            const fieldsMeta = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.company',
                method: 'fields_get',
                args: [['chart_template']],
                kwargs: { attributes: ['selection'] }
            });
            const validCodes = new Set((fieldsMeta.chart_template?.selection || []).map(([code]) => code));

            if (!validCodes.has(accounting_system)) {
                return res.status(400).json({
                    status: 'error',
                    error: `Code chart_template "${accounting_system}" invalide selon Odoo. Utilisez un code de la liste (ex: "bj", "syscohada", "bj_syscebnl", etc.).`
                });
            }

            // 2. État avant modification
            const [companyBefore] = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.company',
                method: 'read',
                args: [[companyId], ['name', 'chart_template']],
                kwargs: {}
            });

            if (!companyBefore) {
                return res.status(404).json({ status: 'error', error: 'Société Odoo introuvable' });
            }

            if (companyBefore.chart_template === accounting_system) {
                chartTemplateResult = {
                    before: companyBefore.chart_template,
                    after: companyBefore.chart_template,
                    applied: true,
                    skipped_reason: 'Valeur déjà identique — aucune action effectuée.'
                };
                console.log(`ℹ️ [updateAccountingSettings] chart_template déjà à "${accounting_system}", aucun changement nécessaire.`);
            } else {
                // 3. Garde-fou : refuser si écritures postées existent, sauf force=true
                const postedCount = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'account.move',
                    method: 'search_count',
                    args: [[['company_id', '=', companyId], ['state', '=', 'posted']]],
                    kwargs: {}
                });

                if (postedCount > 0 && !force) {
                    return res.status(409).json({
                        status: 'error',
                        error: `Cette société a ${postedCount} écriture(s) comptable(s) postée(s). Changer le plan comptable (actuellement "${companyBefore.chart_template}") régénère les comptes et peut créer des incohérences avec les écritures existantes. Effectuez d'abord un backup ("node backup_accounting_system.js ${companyId}"), puis relancez la requête avec { "force": true }.`,
                        posted_entries_count: postedCount,
                        current_chart_template: companyBefore.chart_template
                    });
                }

                // 4. Changement réel via le wizard res.config.settings (create + execute)
                //    Mécanisme validé : régénère effectivement comptes/journaux/taxes.
                try {
                    const settingsId = await odooExecuteKw({
                        uid: ADMIN_UID_INT,
                        model: 'res.config.settings',
                        method: 'create',
                        args: [{ company_id: companyId, chart_template: accounting_system }],
                        kwargs: {}
                    });

                    await odooExecuteKw({
                        uid: ADMIN_UID_INT,
                        model: 'res.config.settings',
                        method: 'execute',
                        args: [[settingsId]],
                        kwargs: {}
                    });
                } catch (loadError) {
                    console.error('🚨 [updateAccountingSettings] Échec du changement de plan comptable:', loadError.message);
                    return res.status(500).json({
                        status: 'error',
                        error: `Échec de l'installation du plan comptable "${accounting_system}" : ${loadError.message}`
                    });
                }

                // 5. Relecture pour confirmer réellement (pas de succès optimiste)
                const [companyAfter] = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'res.company',
                    method: 'read',
                    args: [[companyId], ['name', 'chart_template']],
                    kwargs: {}
                });

                chartTemplateResult = {
                    before: companyBefore.chart_template,
                    after: companyAfter.chart_template,
                    applied: companyAfter.chart_template === accounting_system
                };

                if (!chartTemplateResult.applied) {
                    console.warn(`⚠️ [updateAccountingSettings] chart_template après execute() ("${companyAfter.chart_template}") ≠ demandé ("${accounting_system}")`);
                }
                console.log(`✅ [updateAccountingSettings] chart_template ${companyId}: ${chartTemplateResult.before} → ${chartTemplateResult.after}`);
            }
        }

        const otherFieldsIgnored = syscohada_variant !== undefined || fiscal_year_start !== undefined || fiscal_year_end !== undefined;

        res.json({
            status: 'success',
            message: 'Paramètres comptables mis à jour',
            data: {
                financial_statement_model: savedPreference,
                accounting_system_applied: chartTemplateResult ? chartTemplateResult.applied : false,
                chart_template: chartTemplateResult
            },
            warning: otherFieldsIgnored
                ? "syscohada_variant / fiscal_year_* ont été reçus mais NE SONT PAS appliqués (non réimplémenté côté serveur)."
                : undefined
        });

    } catch (error) {
        console.error('🚨 updateAccountingSettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Récupère les informations d'abonnement
 * @route GET /api/settings/subscription/:companyId
 */
exports.getSubscriptionSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

        console.log(`💳 [getSubscriptionSettings] Company ID: ${companyId}`);

        res.json({
            status: 'success',
            data: {
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                status: 'active',
                plan_name: 'STANDARD',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                updated_by: 'Admin'
            }
        });

    } catch (error) {
        console.error('🚨 getSubscriptionSettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Met à jour l'abonnement
 * @route PUT /api/settings/subscription/:companyId
 */
exports.updateSubscriptionSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { start_date, end_date, status, plan_name } = req.body;

        console.log(`✏️ [updateSubscriptionSettings] Company ID: ${companyId}`);

        res.json({
            status: 'success',
            message: 'Abonnement mis à jour avec succès'
        });

    } catch (error) {
        console.error('🚨 updateSubscriptionSettings Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};

/**
 * Met à jour le profil utilisateur
 * @route PUT /api/settings/user
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const { name, phone, function: userFunction, old_password, new_password } = req.body;

        console.log(`👤 [updateUserProfile] User ID: ${userId}`);

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        if (Object.keys(updateData).length > 0) {
            await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'write',
                args: [[userId], updateData],
                kwargs: {}
            });
        }

        if (old_password && new_password) {
            console.log('⚠️ Changement de mot de passe non implémenté');
        }

        console.log(`✅ Profil utilisateur ${userId} mis à jour`);

        res.json({
            status: 'success',
            message: 'Profil mis à jour avec succès'
        });

    } catch (error) {
        console.error('🚨 updateUserProfile Error:', error.message);
        res.status(500).json({ 
            status: 'error',
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
};
