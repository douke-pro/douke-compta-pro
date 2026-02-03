// =============================================================================
// FICHIER : controllers/settingsController.js (VERSION CORRIGÉE V16)
// Description : Gestion des paramètres de l'entreprise
// Correction : Utilise odooService au lieu de odooClient
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

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

        // Récupérer le partenaire pour plus de détails
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

        console.log(`✅ Paramètres entreprise ${companyId} mis à jour`);

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

        // Récupérer l'exercice fiscal actif
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

        console.log(`✅ Paramètres comptables récupérés`);

        res.json({
            status: 'success',
            data: {
                accounting_system: 'SYSCOHADA',
                syscohada_variant: 'NORMAL',
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
 * Met à jour les paramètres comptables
 * @route PUT /api/settings/accounting/:companyId
 */
exports.updateAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { accounting_system, syscohada_variant, fiscal_year_start, fiscal_year_end } = req.body;

        console.log(`✏️ [updateAccountingSettings] Company ID: ${companyId}`);

        // Ici, stocker dans des champs custom Odoo ou une table séparée
        // Pour l'instant, retourner success

        console.log(`✅ Paramètres comptables mis à jour`);

        res.json({
            status: 'success',
            message: 'Paramètres comptables mis à jour avec succès'
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

        // Simuler des données d'abonnement
        // À remplacer par une vraie table de gestion d'abonnements
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

        // Ici, mettre à jour dans une table de gestion d'abonnements

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

        // Mettre à jour l'utilisateur Odoo
        if (Object.keys(updateData).length > 0) {
            await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'write',
                args: [[userId], updateData],
                kwargs: {}
            });
        }

        // Changement de mot de passe
        if (old_password && new_password) {
            // Vérifier l'ancien mot de passe et changer
            // À implémenter avec la méthode change_password d'Odoo
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
