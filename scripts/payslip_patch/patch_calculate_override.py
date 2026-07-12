import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('controllers/hrController.js', 'r', encoding='utf-8') as f:
    ctrl = f.read()

OLD = """        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = parseInt(req.query.employeeId);
        const primes      = parseFloat(req.query.primes) || 0;

        if (!companyId || !employeeId)
            return res.status(400).json({ status: 'error', error: 'companyId et employeeId requis' });

        const empResult = await pool.queryWithRetry(
            `SELECT id, full_name, base_salary, cnss_eligible, its_eligible
             FROM employees WHERE id = $1 AND company_id = $2`,
            [employeeId, companyId]
        );

        if (empResult.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Employe introuvable' });

        const emp = empResult.rows[0];

        const result = await calculatePayslip({
            companyId,
            salaireBase: parseFloat(emp.base_salary) || 0,
            primes,
            cnssEligible: emp.cnss_eligible !== false,
            itsEligible: emp.its_eligible !== false
        });"""

NEW = """        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
        const employeeId = parseInt(req.query.employeeId);
        const primes      = parseFloat(req.query.primes) || 0;
        const salaireBaseOverride = req.query.salaireBase !== undefined ? parseFloat(req.query.salaireBase) : null;

        if (!companyId || !employeeId)
            return res.status(400).json({ status: 'error', error: 'companyId et employeeId requis' });

        const empResult = await pool.queryWithRetry(
            `SELECT id, full_name, base_salary, cnss_eligible, its_eligible
             FROM employees WHERE id = $1 AND company_id = $2`,
            [employeeId, companyId]
        );

        if (empResult.rows.length === 0)
            return res.status(404).json({ status: 'error', error: 'Employe introuvable' });

        const emp = empResult.rows[0];
        const salaireBase = (salaireBaseOverride !== null && !isNaN(salaireBaseOverride))
            ? salaireBaseOverride
            : (parseFloat(emp.base_salary) || 0);

        const result = await calculatePayslip({
            companyId,
            salaireBase,
            primes,
            cnssEligible: emp.cnss_eligible !== false,
            itsEligible: emp.its_eligible !== false
        });"""

ctrl = guarded_replace(ctrl, OLD, NEW, 1, "override salaireBase dans calculatePayslipPreview")

with open('controllers/hrController.js', 'w', encoding='utf-8') as f:
    f.write(ctrl)
print("OK - override salaireBase ajoute")
