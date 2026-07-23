// =============================================================================
// FICHIER : controllers/settingsController.js (VERSION CORRIGÉE V20)
// V19 : garde-fou écritures postées (409) + anti-faux-succès (422)
// V20 : garde-fou country_id absent (400), bloqué en amont avant tentative Odoo
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

// Sauvegarde complète (écritures + config) avant toute tentative réelle de changement de chart_template.
// Réutilise le même pattern que backup_accounting_system.js.
async function backupCompanyBeforeChartChange(companyId, triggeredBy) {
    const [company] = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'read', args: [[companyId], []], kwargs: {} });
    const moves = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.move', method: 'search_read', args: [[['company_id', '=', companyId]], []], kwargs: { limit: 0 } });
    const moveIds = moves.map(m => m.id);
    let moveLines = [];
    if (moveIds.length > 0) {
        moveLines = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.move.line', method: 'search_read', args: [[['move_id', 'in', moveIds]], []], kwargs: { limit: 0 } });
    }
    const accounts = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.account', method: 'search_read', args: [[['company_ids', 'in', [companyId]]], []], kwargs: { limit: 0 } });
    const journals = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.journal', method: 'search_read', args: [[['company_id', '=', companyId]], []], kwargs: { limit: 0 } });
    const taxes = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.tax', method: 'search_read', args: [[['company_id', '=', companyId]], []], kwargs: { limit: 0 } });

    const snapshot = { backup_version: '1.0', backup_date: new Date().toISOString(), company, moves, move_lines: moveLines, accounts, journals, taxes };

    const result = await pool.queryWithRetry(
        `INSERT INTO accounting_system_backups
            (company_id, company_name, chart_template_before, fiscal_country_before,
             moves_count, move_lines_count, accounts_count, journals_count, taxes_count,
             snapshot, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
            companyId, company.name, company.chart_template || null,
            company.account_fiscal_country_id ? company.account_fiscal_country_id[1] : null,
            moves.length, moveLines.length, accounts.length, journals.length, taxes.length,
            JSON.stringify(snapshot), 'completed', triggeredBy || 'updateAccountingSettings'
        ]
    );
    return result.rows[0].id;
}

const OHADA_COUNTRY_CODES = ['bf', 'bj', 'cd', 'cf', 'cg', 'ci', 'cm', 'ga', 'gn', 'gq', 'gw', 'km', 'ml', 'ne', 'sn', 'td', 'tg'];

function resolveChartTemplate(accountingSystem, countryCode) {
    const code = (countryCode || '').toLowerCase();
    const isOhadaCountry = OHADA_COUNTRY_CODES.includes(code);
    switch (accountingSystem) {
        case 'SYSCOHADA':
            return { resolved: isOhadaCountry ? code : 'syscohada', usedFallback: !isOhadaCountry };
        case 'SYCEBNL':
            return { resolved: isOhadaCountry ? `${code}_syscebnl` : 'syscebnl', usedFallback: !isOhadaCountry };
        case 'FRENCH':
            return { resolved: 'fr', usedFallback: false };
        default:
            return { resolved: accountingSystem, usedFallback: false };
    }
}

exports.getCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const companies = await odooExecuteKw({
            uid: ADMIN_UID_INT, model: 'res.company', method: 'read',
            args: [[companyId], ['name', 'email', 'phone', 'street', 'city', 'country_id', 'vat', 'company_registry', 'partner_id']],
            kwargs: {}
        });
        if (!companies || companies.length === 0) {
            return res.status(404).json({ status: 'error', error: 'Entreprise introuvable' });
        }
        const company = companies[0];
        let partnerData = {};
        if (company.partner_id) {
            const partners = await odooExecuteKw({
                uid: ADMIN_UID_INT, model: 'res.partner', method: 'read',
                args: [[company.partner_id[0]], ['name', 'phone', 'email']], kwargs: {}
            });
            partnerData = partners[0] || {};
        }
        res.json({
            status: 'success',
            data: {
                id: company.id, name: company.name, email: company.email, phone: company.phone,
                address: company.street, city: company.city,
                country_code: company.country_id ? company.country_id[0] : null,
                tax_id: company.vat, registration_number: company.company_registry,
                legal_status: 'SARL', manager_name: partnerData.name || '', manager_contact: partnerData.phone || ''
            }
        });
    } catch (error) {
        console.error('🚨 getCompanySettings Error:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.updateCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { name, email, phone, address, city, tax_id, registration_number } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.street = address;
        if (city) updateData.city = city;
        if (tax_id) updateData.vat = tax_id;
        if (registration_number) updateData.company_registry = registration_number;
        await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'write', args: [[companyId], updateData], kwargs: {} });
        res.json({ status: 'success', message: 'Paramètres mis à jour avec succès' });
    } catch (error) {
        console.error('🚨 updateCompanySettings Error:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.getAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const companies = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'read', args: [[companyId], ['name', 'chart_template']], kwargs: {} });
        const currentChartTemplate = companies[0]?.chart_template || null;
        const fiscalYears = await odooExecuteKw({
            uid: ADMIN_UID_INT, model: 'account.fiscal.year', method: 'search_read',
            args: [[['company_id', '=', companyId]]], kwargs: { fields: ['name', 'date_from', 'date_to'], limit: 1, order: 'date_to desc' }
        });
        const fiscalYear = fiscalYears[0] || {};
        let financialStatementModel = 'NORMAL';
        try {
            const prefResult = await pool.queryWithRetry('SELECT financial_statement_model FROM company_accounting_preferences WHERE company_id = $1', [companyId]);
            if (prefResult.rows.length > 0) financialStatementModel = prefResult.rows[0].financial_statement_model;
        } catch (prefError) {
            console.error('🚨 [getAccountingSettings] Erreur lecture préférences:', prefError.message);
        }
        res.json({
            status: 'success',
            data: {
                accounting_system: currentChartTemplate, syscohada_variant: 'NORMAL', financial_statement_model: financialStatementModel,
                fiscal_year_start: fiscalYear.date_from || '2026-01-01', fiscal_year_end: fiscalYear.date_to || '2026-12-31',
                allow_negative_stock: false, enable_multi_currency: false, require_analytic: false
            }
        });
    } catch (error) {
        console.error('🚨 getAccountingSettings Error:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.updateAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { accounting_system, syscohada_variant, fiscal_year_start, fiscal_year_end, financial_statement_model, force } = req.body;
        const VALID_FINANCIAL_STATEMENT_MODELS = ['NORMAL', 'SMT'];
        let savedPreference = null;

        if (financial_statement_model !== undefined) {
            if (!VALID_FINANCIAL_STATEMENT_MODELS.includes(financial_statement_model)) {
                return res.status(400).json({ status: 'error', error: `Valeur financial_statement_model "${financial_statement_model}" invalide. Valeurs valides : ${VALID_FINANCIAL_STATEMENT_MODELS.join(', ')}.` });
            }
            const upsertResult = await pool.queryWithRetry(
                `INSERT INTO company_accounting_preferences (company_id, financial_statement_model, updated_at, updated_by)
                 VALUES ($1, $2, now(), $3)
                 ON CONFLICT (company_id) DO UPDATE SET financial_statement_model = $2, updated_at = now(), updated_by = $3
                 RETURNING company_id, financial_statement_model, updated_at`,
                [companyId, financial_statement_model, req.user?.email || req.user?.name || 'unknown']
            );
            savedPreference = upsertResult.rows[0];
        }

        let chartTemplateResult = null;

        if (accounting_system !== undefined) {
            const [companyBefore] = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'read', args: [[companyId], ['name', 'chart_template', 'country_id']], kwargs: {} });
            if (!companyBefore) {
                return res.status(404).json({ status: 'error', error: 'Société Odoo introuvable' });
            }

            if (!companyBefore.country_id) {
                return res.status(400).json({
                    status: 'error',
                    error: `Impossible d'installer un plan comptable pour "${companyBefore.name}" : cette société n'a aucun pays configuré (country_id absent). Odoo ne peut pas déterminer le contexte fiscal nécessaire, même pour un plan générique, et échoue silencieusement sans pays défini. Configurez d'abord le pays de la société (res.company.country_id) avant de retenter ce changement.`,
                    company_id: companyId, company_name: companyBefore.name
                });
            }

            let countryCode = null;
            const [country] = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.country', method: 'read', args: [[companyBefore.country_id[0]], ['code']], kwargs: {} });
            countryCode = country?.code || null;

            const { resolved: resolvedChartTemplate, usedFallback } = resolveChartTemplate(accounting_system, countryCode);

            const fieldsMeta = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'fields_get', args: [['chart_template']], kwargs: { attributes: ['selection'] } });
            const validCodes = new Set((fieldsMeta.chart_template?.selection || []).map(([code]) => code));

            if (!validCodes.has(resolvedChartTemplate)) {
                return res.status(400).json({
                    status: 'error',
                    error: `"${accounting_system}" a été résolu en code chart_template "${resolvedChartTemplate}", qui n'existe pas dans Odoo.`,
                    requested_accounting_system: accounting_system, resolved_chart_template: resolvedChartTemplate, country_code: countryCode
                });
            }

            if (companyBefore.chart_template === resolvedChartTemplate) {
                chartTemplateResult = {
                    requested: accounting_system, resolved: resolvedChartTemplate, country_code: countryCode, used_generic_fallback: usedFallback,
                    before: companyBefore.chart_template, after: companyBefore.chart_template, applied: true,
                    skipped_reason: 'Valeur déjà identique — aucune action effectuée.'
                };
            } else {
                const postedCount = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'account.move', method: 'search_count', args: [[['company_id', '=', companyId], ['state', '=', 'posted']]], kwargs: {} });

                if (postedCount > 0) {
                    return res.status(409).json({
                        status: 'error',
                        error: `Cette société a ${postedCount} écriture(s) comptable(s) postée(s). Odoo ne permet pas de changer le plan comptable (actuellement "${companyBefore.chart_template}", demandé "${resolvedChartTemplate}") sur une société ayant déjà des écritures : ce champ devient readonly nativement. Il n'existe pas de contournement supporté — le paramètre "force" n'a plus d'effet ici.`,
                        posted_entries_count: postedCount, current_chart_template: companyBefore.chart_template, resolved_chart_template: resolvedChartTemplate
                    });
                }

                let preChangeBackupId = null;
                try {
                    preChangeBackupId = await backupCompanyBeforeChartChange(companyId, req.user?.email || req.user?.name || 'api');
                    console.log(`💾 [updateAccountingSettings] Backup pré-changement créé, id=${preChangeBackupId}`);
                } catch (backupError) {
                    console.error('🚨 Échec de la sauvegarde préalable, changement ANNULÉ par sécurité:', backupError.message);
                    return res.status(500).json({ status: 'error', error: `Impossible de sauvegarder les données avant le changement de plan comptable : ${backupError.message}. Changement annulé par sécurité, aucune tentative faite sur Odoo.` });
                }

                try {
                    const settingsId = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.config.settings', method: 'create', args: [{ company_id: companyId, chart_template: resolvedChartTemplate }], kwargs: {} });
                    await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.config.settings', method: 'execute', args: [[settingsId]], kwargs: {} });
                } catch (loadError) {
                    console.error('🚨 Échec installation plan comptable:', loadError.message);
                    return res.status(500).json({ status: 'error', error: `Échec de l'installation du plan comptable "${resolvedChartTemplate}" : ${loadError.message}` });
                }

                const [companyAfter] = await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.company', method: 'read', args: [[companyId], ['name', 'chart_template']], kwargs: {} });

                chartTemplateResult = {
                    requested: accounting_system, resolved: resolvedChartTemplate, country_code: countryCode, used_generic_fallback: usedFallback,
                    before: companyBefore.chart_template, after: companyAfter.chart_template, applied: companyAfter.chart_template === resolvedChartTemplate
                };

                if (!chartTemplateResult.applied) {
                    return res.status(422).json({
                        status: 'error',
                        error: `Le changement de plan comptable a été soumis à Odoo sans erreur technique, mais la valeur n'a pas changé ("${chartTemplateResult.before}" est resté "${companyAfter.chart_template}" au lieu de "${resolvedChartTemplate}").`,
                        data: { financial_statement_model: savedPreference, chart_template: chartTemplateResult }
                    });
                }
            }
        }

        const otherFieldsIgnored = syscohada_variant !== undefined || fiscal_year_start !== undefined || fiscal_year_end !== undefined;
        res.json({
            status: 'success', message: 'Paramètres comptables mis à jour',
            data: { financial_statement_model: savedPreference, accounting_system_applied: chartTemplateResult ? chartTemplateResult.applied : false, chart_template: chartTemplateResult },
            warning: otherFieldsIgnored ? "syscohada_variant / fiscal_year_* ont été reçus mais NE SONT PAS appliqués." : undefined
        });
    } catch (error) {
        console.error('🚨 updateAccountingSettings Error:', error.message);
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.getSubscriptionSettings = async (req, res) => {
    try {
        res.json({ status: 'success', data: { start_date: '2026-01-01', end_date: '2026-12-31', status: 'active', plan_name: 'STANDARD', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', updated_by: 'Admin' } });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.updateSubscriptionSettings = async (req, res) => {
    try {
        res.json({ status: 'success', message: 'Abonnement mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const { name, phone, old_password, new_password } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (Object.keys(updateData).length > 0) {
            await odooExecuteKw({ uid: ADMIN_UID_INT, model: 'res.users', method: 'write', args: [[userId], updateData], kwargs: {} });
        }
        if (old_password && new_password) console.log('⚠️ Changement de mot de passe non implémenté');
        res.json({ status: 'success', message: 'Profil mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: 'Erreur serveur', details: error.message });
    }
};
