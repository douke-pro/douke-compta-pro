'use strict';

const pool = require('../services/dbService');

// =============================================================================
// HELPER — Générer un code employé lié au plan comptable
// Format : 661XXX (charges de personnel)
// =============================================================================
async function generateEmployeeCode(companyId) {
    const result = await pool.queryWithRetry(
        `SELECT COUNT(*) as total FROM employees WHERE company_id = $1`,
        [companyId]
    );
    const seq = parseInt(result.rows[0].total) + 1;
    return `661${String(companyId).padStart(2,'0')}${String(seq).padStart(3,'0')}`;
}

// =============================================================================
// 1. GET /api/hr/employees?companyId=X
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.listEmployees = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        if (!companyId) return res.status(400).json({ status: 'error', error: 'companyId requis' });

        const result = await pool.queryWithRetry(
            `SELECT id, employee_code, full_name, job_title, hire_date,
                    contract_type, base_salary, status, created_at
             FROM employees
             WHERE company_id = $1
             ORDER BY full_name ASC`,
            [companyId]
        );

        res.json({ status: 'success', data: result.rows });
    } catch (error) {
        console.error('🚨 [listEmployees]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 2. GET /api/hr/employees/:id?companyId=X
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.getEmployee = async (req, res) => {
    try {
        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `SELECT * FROM employees WHERE id = $1 AND company_id = $2`,
            [employeeId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Employé introuvable' });

        res.json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [getEmployee]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 3. POST /api/hr/employees
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.createEmployee = async (req, res) => {
    try {
        const companyId = parseInt(req.body.companyId || req.validatedCompanyId);
        const {
            full_name, job_title, hire_date, contract_type,
            base_salary, status, email, phone, address,
            id_number, id_type, cnss_number, notes
        } = req.body;

        if (!companyId || !full_name)
            return res.status(400).json({ status: 'error', error: 'companyId et full_name requis' });

        const employee_code = await generateEmployeeCode(companyId);

        const result = await pool.queryWithRetry(
            `INSERT INTO employees
                (company_id, employee_code, full_name, job_title, hire_date,
                 contract_type, base_salary, status, email, phone, address,
                 id_number, id_type, cnss_number, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             RETURNING *`,
            [companyId, employee_code, full_name, job_title || null,
             hire_date || null, contract_type || 'CDI',
             parseFloat(base_salary) || 0, status || 'actif',
             email || null, phone || null, address || null,
             id_number || null, id_type || null, cnss_number || null,
             notes || null, req.user.odooUid]
        );

        console.log(`✅ [createEmployee] ${full_name} (${employee_code}) — Company ${companyId}`);
        res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [createEmployee]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 4. PUT /api/hr/employees/:id
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.updateEmployee = async (req, res) => {
    try {
        const companyId  = parseInt(req.body.companyId || req.validatedCompanyId);
        const employeeId = parseInt(req.params.id);
        const {
            full_name, job_title, hire_date, contract_type,
            base_salary, status, email, phone, address,
            id_number, id_type, cnss_number, notes
        } = req.body;

        const existing = await pool.queryWithRetry(
            `SELECT id FROM employees WHERE id = $1 AND company_id = $2`,
            [employeeId, companyId]
        );
        if (existing.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Employé introuvable' });

        const result = await pool.queryWithRetry(
            `UPDATE employees SET
                full_name     = COALESCE($1, full_name),
                job_title     = COALESCE($2, job_title),
                hire_date     = COALESCE($3, hire_date),
                contract_type = COALESCE($4, contract_type),
                base_salary   = COALESCE($5, base_salary),
                status        = COALESCE($6, status),
                email         = COALESCE($7, email),
                phone         = COALESCE($8, phone),
                address       = COALESCE($9, address),
                id_number     = COALESCE($10, id_number),
                id_type       = COALESCE($11, id_type),
                cnss_number   = COALESCE($12, cnss_number),
                notes         = COALESCE($13, notes),
                updated_at    = NOW()
             WHERE id = $14 AND company_id = $15
             RETURNING *`,
            [full_name, job_title, hire_date, contract_type,
             base_salary ? parseFloat(base_salary) : null,
             status, email, phone, address,
             id_number, id_type, cnss_number, notes,
             employeeId, companyId]
        );

        res.json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [updateEmployee]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 5. DELETE /api/hr/employees/:id
// Permissions : ADMIN uniquement
// =============================================================================
exports.deleteEmployee = async (req, res) => {
    try {
        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `UPDATE employees SET status = 'archive', updated_at = NOW()
             WHERE id = $1 AND company_id = $2 RETURNING id, full_name`,
            [employeeId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Employé introuvable' });

        console.log(`✅ [deleteEmployee] Archivé: ${result.rows[0].full_name}`);
        res.json({ status: 'success', message: 'Employé archivé avec succès', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [deleteEmployee]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 6. GET /api/hr/payslips?companyId=X&employeeId=Y
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.listPayslips = async (req, res) => {
    try {
        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = req.query.employeeId ? parseInt(req.query.employeeId) : null;

        let query = `SELECT p.id, p.employee_id, e.full_name, e.employee_code,
                            p.period_month, p.period_year, p.gross_salary,
                            p.net_salary, p.status, p.generated_at
                     FROM payslips p
                     JOIN employees e ON e.id = p.employee_id
                     WHERE p.company_id = $1`;
        const params = [companyId];

        if (employeeId) { query += ` AND p.employee_id = $2`; params.push(employeeId); }
        query += ` ORDER BY p.period_year DESC, p.period_month DESC`;

        const result = await pool.queryWithRetry(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (error) {
        console.error('🚨 [listPayslips]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 7. GET /api/hr/payslips/:id?companyId=X
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.getPayslip = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const payslipId = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `SELECT p.*, e.full_name, e.employee_code, e.job_title, e.cnss_number
             FROM payslips p
             JOIN employees e ON e.id = p.employee_id
             WHERE p.id = $1 AND p.company_id = $2`,
            [payslipId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Fiche de paie introuvable' });

        res.json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [getPayslip]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 8. POST /api/hr/payslips
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.createPayslip = async (req, res) => {
    try {
        const companyId = parseInt(req.body.companyId || req.validatedCompanyId);
        const {
            employee_id, period_month, period_year,
            gross_salary, deductions, net_salary, pdf_base64
        } = req.body;

        if (!companyId || !employee_id || !period_month || !period_year)
            return res.status(400).json({ status: 'error', error: 'companyId, employee_id, period_month, period_year requis' });

        // Vérifier doublon
        const existing = await pool.queryWithRetry(
            `SELECT id FROM payslips WHERE employee_id = $1 AND period_month = $2 AND period_year = $3 AND company_id = $4`,
            [employee_id, period_month, period_year, companyId]
        );
        if (existing.rows.length > 0)
            return res.status(409).json({ status: 'error', error: 'Fiche de paie déjà existante pour cette période' });

        const result = await pool.queryWithRetry(
            `INSERT INTO payslips
                (employee_id, company_id, period_month, period_year,
                 gross_salary, deductions, net_salary, status, pdf_base64, generated_at, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'genere',$8,NOW(),$9)
             RETURNING id, employee_id, period_month, period_year, gross_salary, net_salary, status`,
            [employee_id, companyId, period_month, period_year,
             parseFloat(gross_salary) || 0,
             deductions ? JSON.stringify(deductions) : null,
             parseFloat(net_salary) || 0,
             pdf_base64 || null,
             req.user.odooUid]
        );

        res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [createPayslip]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 9. GET /api/hr/payslips/:id/download
// Retourne le PDF base64
// Permissions : ADMIN, COLLABORATEUR, USER
// =============================================================================
exports.downloadPayslip = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const payslipId = parseInt(req.params.id);

        const result = await pool.queryWithRetry(
            `SELECT p.pdf_base64, p.period_month, p.period_year, e.full_name
             FROM payslips p
             JOIN employees e ON e.id = p.employee_id
             WHERE p.id = $1 AND p.company_id = $2`,
            [payslipId, companyId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Fiche de paie introuvable' });

        const { pdf_base64, period_month, period_year, full_name } = result.rows[0];

        if (!pdf_base64)
            return res.status(404).json({ status: 'error', error: 'PDF non encore généré' });

        const buffer = Buffer.from(pdf_base64, 'base64');
        const filename = `fiche_paie_${full_name.replace(/\s/g,'_')}_${period_year}_${String(period_month).padStart(2,'0')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('🚨 [downloadPayslip]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 10. GET /api/hr/templates?companyId=X&type=contrat|fiche_paie
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.listTemplates = async (req, res) => {
    try {
        const companyId = parseInt(req.query.companyId || req.validatedCompanyId);
        const type      = req.query.type || null;

        // Option A : modèle spécifique entreprise en priorité, sinon modèle global (company_id = 0)
        let query = `
            SELECT DISTINCT ON (template_type)
                id, template_type, template_name, template_html, created_at, company_id
            FROM document_templates
            WHERE company_id = $1 OR company_id = 0
        `;
        const params = [companyId];
        if (type) { query += ` AND template_type = $2`; params.push(type); }
        query += ` ORDER BY template_type, company_id DESC`;

        const result = await pool.queryWithRetry(query, params);
        res.json({ status: 'success', data: result.rows });
    } catch (error) {
        console.error('🚨 [listTemplates]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 11. POST /api/hr/templates
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.saveTemplate = async (req, res) => {
    try {
        const companyId = parseInt(req.body.companyId || req.validatedCompanyId);
        const { template_type, template_name, template_html } = req.body;

        if (!companyId || !template_type || !template_html)
            return res.status(400).json({ status: 'error', error: 'companyId, template_type, template_html requis' });

        const result = await pool.queryWithRetry(
            `INSERT INTO document_templates (company_id, template_type, template_name, template_html, created_by)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (company_id, template_type)
             DO UPDATE SET template_html = EXCLUDED.template_html,
                           template_name = EXCLUDED.template_name,
                           updated_at    = NOW()
             RETURNING id, template_type, template_name, created_at`,
            [companyId, template_type, template_name || template_type, template_html, req.user.odooUid]
        );

        res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (error) {
        console.error('🚨 [saveTemplate]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};
