import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# --- 1) savePayslip - lire les nouveaux champs et les envoyer ---
OLD_SAVE = """window.savePayslip = async function() {
    const employeeId  = document.getElementById('ps-employee')?.value;
    const periodMonth = parseInt(document.getElementById('ps-month')?.value);
    const periodYear  = parseInt(document.getElementById('ps-year')?.value);
    const grossSalary = parseFloat(document.getElementById('ps-gross')?.value || 0);
    const netSalary   = parseFloat(document.getElementById('ps-net')?.value || 0);
    const deductionsRaw = document.getElementById('ps-deductions')?.value?.trim();

    if (!employeeId || !periodMonth || !periodYear)
        return alert('Employé, mois et année sont obligatoires.');

    let deductions = null;
    if (deductionsRaw) {
        try { deductions = JSON.parse(deductionsRaw); }
        catch(e) { return alert('Format JSON des retenues invalide.'); }
    }

    try {
        await apiFetch('hr/payslips', {
            method: 'POST',
            body: JSON.stringify({
                companyId:    appState.currentCompanyId,
                employee_id:  employeeId,
                period_month: periodMonth,
                period_year:  periodYear,
                gross_salary: grossSalary,
                net_salary:   netSalary,
                deductions:   deductions
            })
        });
        ModalManager.close();
        window.loadHRPayslips();
        NotificationManager.show('Fiche de paie enregistrée avec succès', 'success');
    } catch(err) { alert('Erreur: ' + err.message); }
};"""

NEW_SAVE = """window.rapportPayslipFillBaseSalary = function() {
    const sel = document.getElementById('ps-employee');
    const opt = sel?.selectedOptions?.[0];
    const baseInput = document.getElementById('ps-base');
    if (opt && baseInput) baseInput.value = opt.getAttribute('data-base-salary') || 0;
};

window.calculatePayslipAuto = async function() {
    const employeeId = document.getElementById('ps-employee')?.value;
    const salaireBase = parseFloat(document.getElementById('ps-base')?.value || 0);
    const primes = parseFloat(document.getElementById('ps-primes')?.value || 0);

    if (!employeeId) return alert('Sélectionnez un employé.');

    try {
        const res = await apiFetch(`hr/payslips/calculate?companyId=${appState.currentCompanyId}&employeeId=${employeeId}&primes=${primes}&salaireBase=${salaireBase}`);
        const d = res.data;
        document.getElementById('ps-gross').value = d.salaire_brut;
        document.getElementById('ps-net').value = d.net_a_payer;
        document.getElementById('ps-cnss-salarie').value = d.cnss_salarie;
        document.getElementById('ps-cnss-patronal').value = d.cnss_patronal;
        document.getElementById('ps-vps').value = d.vps;
        document.getElementById('ps-its').value = d.its;
        NotificationManager.show('Calcul effectué. Vérifiez les montants avant d\\'enregistrer.', 'success');
    } catch(err) { alert('Erreur calcul: ' + err.message); }
};

window.savePayslip = async function() {
    const employeeId  = document.getElementById('ps-employee')?.value;
    const periodMonth = parseInt(document.getElementById('ps-month')?.value);
    const periodYear  = parseInt(document.getElementById('ps-year')?.value);
    const grossSalary = parseFloat(document.getElementById('ps-gross')?.value || 0);
    const netSalary   = parseFloat(document.getElementById('ps-net')?.value || 0);
    const primes        = parseFloat(document.getElementById('ps-primes')?.value || 0);
    const cnssSalarie   = parseFloat(document.getElementById('ps-cnss-salarie')?.value || 0);
    const cnssPatronal  = parseFloat(document.getElementById('ps-cnss-patronal')?.value || 0);
    const vps           = parseFloat(document.getElementById('ps-vps')?.value || 0);
    const its           = parseFloat(document.getElementById('ps-its')?.value || 0);
    const baseImposable = Math.max(0, grossSalary - cnssSalarie);
    const deductionsRaw = document.getElementById('ps-deductions')?.value?.trim();

    if (!employeeId || !periodMonth || !periodYear)
        return alert('Employé, mois et année sont obligatoires.');

    let deductions = null;
    if (deductionsRaw) {
        try { deductions = JSON.parse(deductionsRaw); }
        catch(e) { return alert('Format JSON des retenues invalide.'); }
    }

    try {
        await apiFetch('hr/payslips', {
            method: 'POST',
            body: JSON.stringify({
                companyId:    appState.currentCompanyId,
                employee_id:  employeeId,
                period_month: periodMonth,
                period_year:  periodYear,
                gross_salary: grossSalary,
                net_salary:   netSalary,
                primes:          primes,
                cnss_salarie:    cnssSalarie,
                cnss_patronal:   cnssPatronal,
                vps:             vps,
                its:             its,
                base_imposable:  baseImposable,
                deductions:   deductions
            })
        });
        ModalManager.close();
        window.loadHRPayslips();
        NotificationManager.show('Fiche de paie enregistrée avec succès', 'success');
    } catch(err) { alert('Erreur: ' + err.message); }
};"""

js = guarded_replace(js, OLD_SAVE, NEW_SAVE, 1, "savePayslip + nouvelles fonctions")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("OK - fonctions JS ajoutees/etendues")
