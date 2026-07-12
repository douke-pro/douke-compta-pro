import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('controllers/hrController.js', 'r', encoding='utf-8') as f:
    ctrl = f.read()

# Garde anti-double-application : si l'import existe deja, on ne touche a rien
if "require('../services/payrollEngine')" in ctrl:
    print("ABORT [import payrollEngine] : deja present. Rien ecrit (evite duplication).")
    sys.exit(1)

OLD_IMPORT = "const pool = require('../services/dbService');"
NEW_IMPORT = """const pool = require('../services/dbService');
const { calculatePayslip } = require('../services/payrollEngine');"""

ctrl = guarded_replace(ctrl, OLD_IMPORT, NEW_IMPORT, 1, "import payrollEngine")

OLD_ANCHOR = """// 8. POST /api/hr/payslips
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.createPayslip = async (req, res) => {"""

NEW_ANCHOR = """// 7bis. GET /api/hr/payslips/calculate?companyId=X&employeeId=Y&primes=N
// Calcule un apercu de fiche de paie (CNSS/ITS/VPS) sans rien enregistrer.
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.calculatePayslipPreview = async (req, res) => {
    try {
        const companyId  = parseInt(req.query.companyId || req.validatedCompanyId);
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
        });

        res.json({ status: 'success', data: { employee_id: emp.id, full_name: emp.full_name, primes, ...result } });
    } catch (error) {
        console.error('🚨 [calculatePayslipPreview]', error.message);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

// =============================================================================
// 8. POST /api/hr/payslips
// Permissions : ADMIN, COLLABORATEUR
// =============================================================================
exports.createPayslip = async (req, res) => {"""

ctrl = guarded_replace(ctrl, OLD_ANCHOR, NEW_ANCHOR, 1, "insertion calculatePayslipPreview")

with open('controllers/hrController.js', 'w', encoding='utf-8') as f:
    f.write(ctrl)

print("OK - hrController.js patche (une seule fois, verifie)")
