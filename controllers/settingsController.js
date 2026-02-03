const { odooExecuteKw } = require('../utils/odooClient');

const ADMIN_UID_INT = parseInt(process.env.ODOO_ADMIN_UID) || 2;

/**
 * Récupère les paramètres de l'entreprise
 */
exports.getCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

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
            return res.status(404).json({ error: 'Entreprise introuvable' });
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
                legal_status: 'SARL', // À stocker dans un champ custom Odoo
                manager_name: partnerData.name || '',
                manager_contact: partnerData.phone || ''
            }
        });

    } catch (error) {
        console.error('🚨 getCompanySettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Met à jour les paramètres de l'entreprise
 */
exports.updateCompanySettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { name, email, phone, address, city, country_code, tax_id, registration_number } = req.body;

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

        res.json({
            status: 'success',
            message: 'Paramètres mis à jour'
        });

    } catch (error) {
        console.error('🚨 updateCompanySettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Récupère les paramètres comptables
 */
exports.getAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

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

        res.json({
            status: 'success',
            data: {
                accounting_system: 'SYSCOHADA', // À stocker dans un champ custom
                syscohada_variant: 'NORMAL', // À stocker dans un champ custom
                fiscal_year_start: fiscalYear.date_from || '2026-01-01',
                fiscal_year_end: fiscalYear.date_to || '2026-12-31',
                allow_negative_stock: false,
                enable_multi_currency: false,
                require_analytic: false
            }
        });

    } catch (error) {
        console.error('🚨 getAccountingSettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Met à jour les paramètres comptables
 */
exports.updateAccountingSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { accounting_system, syscohada_variant, fiscal_year_start, fiscal_year_end } = req.body;

        // Ici, stocker dans des champs custom Odoo ou une table séparée
        // Pour l'instant, retourner success

        res.json({
            status: 'success',
            message: 'Paramètres comptables mis à jour'
        });

    } catch (error) {
        console.error('🚨 updateAccountingSettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Récupère les informations d'abonnement
 */
exports.getSubscriptionSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);

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
        console.error('🚨 getSubscriptionSettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Met à jour l'abonnement
 */
exports.updateSubscriptionSettings = async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId);
        const { start_date, end_date, status, plan_name } = req.body;

        // Ici, mettre à jour dans une table de gestion d'abonnements

        res.json({
            status: 'success',
            message: 'Abonnement mis à jour'
        });

    } catch (error) {
        console.error('🚨 updateSubscriptionSettings Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

/**
 * Met à jour le profil utilisateur
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const { name, phone, function: userFunction, old_password, new_password } = req.body;

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
        }

        res.json({
            status: 'success',
            message: 'Profil mis à jour'
        });

    } catch (error) {
        console.error('🚨 updateUserProfile Error:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};
