// =============================================================================
// FICHIER : controllers/companyController.js
// Version : V2 — Corrigé
//   ✅ require() en haut du fichier
//   ✅ listUserCompanies retourne les vraies entreprises de l'utilisateur
//   ✅ getCompanies filtre selon le rôle (ADMIN = tout, autres = ses entreprises)
//   ✅ allowed_company_ids présent sur tous les appels Odoo
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');

// =============================================================================
// LISTE DES ENTREPRISES DE L'UTILISATEUR CONNECTÉ
// GET /api/companies
// =============================================================================

exports.listUserCompanies = async (req, res) => {
    try {
        const { odooUid, role, allowedCompanyIds } = req.user;

        console.log(`🏢 [listUserCompanies] User: ${req.user.email} | Rôle: ${role}`);

        let domain;

        if (role === 'ADMIN') {
            // ADMIN → toutes les entreprises
            domain = [[]];
        } else {
            // COLLABORATEUR / USER / CAISSIER → uniquement ses entreprises
            if (!allowedCompanyIds || allowedCompanyIds.length === 0) {
                return res.json({
                    status:    'success',
                    companies: [],
                    message:   'Aucune entreprise assignée à cet utilisateur.',
                });
            }
            domain = [[['id', 'in', allowedCompanyIds]]];
        }

        const companies = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.company',
            method: 'search_read',
            args:   domain,
            kwargs: {
                fields: ['id', 'name', 'email', 'phone', 'currency_id'],
                order:  'name ASC',
            },
        });

        const formatted = companies.map(c => ({
            id:       c.id,
            name:     c.name,
            email:    c.email    || null,
            phone:    c.phone    || null,
            currency: c.currency_id ? c.currency_id[1] : 'XOF',
            systeme:  'NORMAL',
        }));

        console.log(`✅ [listUserCompanies] ${formatted.length} entreprise(s) retournée(s)`);

        res.json({
            status:    'success',
            companies: formatted,
        });

    } catch (error) {
        console.error('🚨 [listUserCompanies]', error.message);
        res.status(500).json({
            status: 'error',
            error:  'Erreur lors de la récupération des entreprises.',
        });
    }
};

// =============================================================================
// LISTE COMPLÈTE DES ENTREPRISES (ADMIN) OU FILTRÉE (AUTRES)
// GET /api/companies/all
// =============================================================================

exports.getCompanies = async (req, res) => {
    try {
        const { role, allowedCompanyIds } = req.user;

        console.log(`🏢 [getCompanies] Rôle: ${role}`);

        let domain;

        if (role === 'ADMIN') {
            domain = [[]];
        } else {
            if (!allowedCompanyIds || allowedCompanyIds.length === 0) {
                return res.json({ status: 'success', data: [] });
            }
            domain = [[['id', 'in', allowedCompanyIds]]];
        }

        const companies = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.company',
            method: 'search_read',
            args:   domain,
            kwargs: {
                fields: ['id', 'name', 'email', 'phone', 'currency_id'],
                order:  'name ASC',
            },
        });

        console.log(`✅ [getCompanies] ${companies.length} entreprise(s)`);

        res.json({
            status: 'success',
            data:   companies.map(c => ({
                id:       c.id,
                name:     c.name,
                email:    c.email || null,
                phone:    c.phone || null,
                currency: c.currency_id ? c.currency_id[1] : 'XOF',
            })),
        });

    } catch (error) {
        console.error('🚨 [getCompanies]', error.message);
        res.status(500).json({
            status: 'error',
            error:  'Erreur récupération entreprises.',
        });
    }
};

// =============================================================================
// CRÉER UNE ENTREPRISE (ADMIN UNIQUEMENT)
// POST /api/companies
// =============================================================================

exports.createCompanyWithIsolation = async (req, res) => {
    try {
        const { name, email, phone, currency_id } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                status: 'error',
                error:  'Nom de l\'entreprise requis (min. 2 caractères).',
            });
        }

        const newCompanyId = await odooExecuteKw({
            uid:    ADMIN_UID_INT,
            model:  'res.company',
            method: 'create',
            args:   [{
                name:        name.trim(),
                email:       email       || false,
                phone:       phone       || false,
                currency_id: currency_id || 1, // 1 = XOF par défaut
            }],
            kwargs: {},
        });

        console.log(`✅ [createCompany] Entreprise créée: ID=${newCompanyId}`);

        res.status(201).json({
            status:  'success',
            message: `Entreprise "${name}" créée avec succès.`,
            data:    { id: newCompanyId, name: name.trim() },
        });

    } catch (error) {
        console.error('🚨 [createCompany]', error.message);
        res.status(500).json({
            status: 'error',
            error:  `Erreur création entreprise: ${error.message}`,
        });
    }
};
