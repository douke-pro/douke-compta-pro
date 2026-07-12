import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('controllers/hrController.js', 'r', encoding='utf-8') as f:
    ctrl = f.read()

OLD = """        const companyId = parseInt(req.validatedCompanyId || req.body?.companyId);
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
             parseInt(req.user.odooUid) || null]
        );

        res.status(201).json({ status: 'success', data: result.rows[0] });"""

NEW = """        const companyId = parseInt(req.validatedCompanyId || req.body?.companyId);
        const {
            employee_id, period_month, period_year,
            gross_salary, deductions, net_salary, pdf_base64,
            primes, cnss_salarie, cnss_patronal, vps, its, base_imposable
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
                 gross_salary, deductions, net_salary, status, pdf_base64, generated_at, created_by,
                 primes, cnss_salarie, cnss_patronal, vps, its, base_imposable)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'genere',$8,NOW(),$9,$10,$11,$12,$13,$14,$15)
             RETURNING id, employee_id, period_month, period_year, gross_salary, net_salary, status,
                       primes, cnss_salarie, cnss_patronal, vps, its, base_imposable`,
            [employee_id, companyId, period_month, period_year,
             parseFloat(gross_salary) || 0,
             deductions ? JSON.stringify(deductions) : null,
             parseFloat(net_salary) || 0,
             pdf_base64 || null,
             parseInt(req.user.odooUid) || null,
             parseFloat(primes) || 0,
             parseFloat(cnss_salarie) || 0,
             parseFloat(cnss_patronal) || 0,
             parseFloat(vps) || 0,
             parseFloat(its) || 0,
             parseFloat(base_imposable) || 0]
        );

        res.status(201).json({ status: 'success', data: result.rows[0] });"""

ctrl = guarded_replace(ctrl, OLD, NEW, 1, "createPayslip - nouvelles colonnes")

with open('controllers/hrController.js', 'w', encoding='utf-8') as f:
    f.write(ctrl)
print("OK - createPayslip etendu")
