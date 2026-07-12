import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

# ============================================================
# 1) hrController.js — destructuring (identique dans create + update)
# ============================================================
with open('controllers/hrController.js', 'r', encoding='utf-8') as f:
    ctrl = f.read()

OLD_DESTRUCT = """        const {
            full_name, job_title, hire_date, contract_type,
            base_salary, status, email, phone, address,
            id_number, id_type, cnss_number, notes,
            ifu_number, date_naissance, nationalite,
            situation_matrimoniale, contact_urgence,
            date_debut_contrat, periode_essai,
            heures_travail_mensuelles, jour_paiement, missions
        } = req.body;"""

NEW_DESTRUCT = """        const {
            full_name, job_title, hire_date, contract_type,
            base_salary, status, email, phone, address,
            id_number, id_type, cnss_number, notes,
            ifu_number, date_naissance, nationalite,
            situation_matrimoniale, contact_urgence,
            date_debut_contrat, periode_essai,
            heures_travail_mensuelles, jour_paiement, missions,
            cnss_eligible, its_eligible
        } = req.body;"""

ctrl = guarded_replace(ctrl, OLD_DESTRUCT, NEW_DESTRUCT, 2, "destructuring create+update")

# ============================================================
# 2) INSERT (createEmployee) — ajout colonnes + valeurs
# ============================================================
OLD_INSERT = """            `INSERT INTO employees
                (company_id, employee_code, full_name, job_title, hire_date,
                 contract_type, base_salary, status, email, phone, address,
                 id_number, id_type, cnss_number, notes,
                 ifu_number, date_naissance, nationalite,
                 situation_matrimoniale, contact_urgence, created_by,
                 date_debut_contrat, periode_essai,
                 heures_travail_mensuelles, jour_paiement, missions)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
             RETURNING *`,
            [companyId, employee_code, full_name, job_title || null,
             hire_date || null, contract_type || 'CDI',
             parseFloat(base_salary) || 0, status || 'actif',
             email || null, phone || null, address || null,
             id_number || null, id_type || null, cnss_number || null,
             notes || null, ifu_number || null,
             date_naissance || null, nationalite || null,
             situation_matrimoniale || null, contact_urgence || null,
             parseInt(req.user.odooUid) || null,
             date_debut_contrat || null, periode_essai || null,
             heures_travail_mensuelles || null, jour_paiement || null,
             JSON.stringify(Array.isArray(missions) ? missions : [])]
        );"""

NEW_INSERT = """            `INSERT INTO employees
                (company_id, employee_code, full_name, job_title, hire_date,
                 contract_type, base_salary, status, email, phone, address,
                 id_number, id_type, cnss_number, notes,
                 ifu_number, date_naissance, nationalite,
                 situation_matrimoniale, contact_urgence, created_by,
                 date_debut_contrat, periode_essai,
                 heures_travail_mensuelles, jour_paiement, missions,
                 cnss_eligible, its_eligible)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
             RETURNING *`,
            [companyId, employee_code, full_name, job_title || null,
             hire_date || null, contract_type || 'CDI',
             parseFloat(base_salary) || 0, status || 'actif',
             email || null, phone || null, address || null,
             id_number || null, id_type || null, cnss_number || null,
             notes || null, ifu_number || null,
             date_naissance || null, nationalite || null,
             situation_matrimoniale || null, contact_urgence || null,
             parseInt(req.user.odooUid) || null,
             date_debut_contrat || null, periode_essai || null,
             heures_travail_mensuelles || null, jour_paiement || null,
             JSON.stringify(Array.isArray(missions) ? missions : []),
             cnss_eligible !== undefined ? !!cnss_eligible : true,
             its_eligible  !== undefined ? !!its_eligible  : true]
        );"""

ctrl = guarded_replace(ctrl, OLD_INSERT, NEW_INSERT, 1, "INSERT createEmployee")

# ============================================================
# 3) UPDATE (updateEmployee) — ajout COALESCE + valeurs
# ============================================================
OLD_UPDATE = """            `UPDATE employees SET
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
                ifu_number              = COALESCE($16, ifu_number),
                date_naissance          = COALESCE($17, date_naissance),
                nationalite             = COALESCE($18, nationalite),
                situation_matrimoniale  = COALESCE($19, situation_matrimoniale),
                contact_urgence         = COALESCE($20, contact_urgence),
                date_debut_contrat        = COALESCE($21, date_debut_contrat),
                periode_essai              = COALESCE($22, periode_essai),
                heures_travail_mensuelles  = COALESCE($23, heures_travail_mensuelles),
                jour_paiement              = COALESCE($24, jour_paiement),
                missions                   = COALESCE($25, missions),
                updated_at    = NOW()
             WHERE id = $14 AND company_id = $15
             RETURNING *`,
            [full_name, job_title, hire_date, contract_type,
             base_salary ? parseFloat(base_salary) : null,
             status, email, phone, address,
             id_number, id_type, cnss_number, notes,
             employeeId, companyId,
             ifu_number, date_naissance, nationalite,
             situation_matrimoniale, contact_urgence,
             date_debut_contrat || null, periode_essai || null,
             heures_travail_mensuelles || null, jour_paiement || null,
             missions !== undefined ? JSON.stringify(Array.isArray(missions) ? missions : []) : null]
        );"""

NEW_UPDATE = """            `UPDATE employees SET
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
                ifu_number              = COALESCE($16, ifu_number),
                date_naissance          = COALESCE($17, date_naissance),
                nationalite             = COALESCE($18, nationalite),
                situation_matrimoniale  = COALESCE($19, situation_matrimoniale),
                contact_urgence         = COALESCE($20, contact_urgence),
                date_debut_contrat        = COALESCE($21, date_debut_contrat),
                periode_essai              = COALESCE($22, periode_essai),
                heures_travail_mensuelles  = COALESCE($23, heures_travail_mensuelles),
                jour_paiement              = COALESCE($24, jour_paiement),
                missions                   = COALESCE($25, missions),
                cnss_eligible              = COALESCE($26, cnss_eligible),
                its_eligible               = COALESCE($27, its_eligible),
                updated_at    = NOW()
             WHERE id = $14 AND company_id = $15
             RETURNING *`,
            [full_name, job_title, hire_date, contract_type,
             base_salary ? parseFloat(base_salary) : null,
             status, email, phone, address,
             id_number, id_type, cnss_number, notes,
             employeeId, companyId,
             ifu_number, date_naissance, nationalite,
             situation_matrimoniale, contact_urgence,
             date_debut_contrat || null, periode_essai || null,
             heures_travail_mensuelles || null, jour_paiement || null,
             missions !== undefined ? JSON.stringify(Array.isArray(missions) ? missions : []) : null,
             cnss_eligible !== undefined ? !!cnss_eligible : null,
             its_eligible  !== undefined ? !!its_eligible  : null]
        );"""

ctrl = guarded_replace(ctrl, OLD_UPDATE, NEW_UPDATE, 1, "UPDATE updateEmployee")

with open('controllers/hrController.js', 'w', encoding='utf-8') as f:
    f.write(ctrl)
print("OK - hrController.js patche")

# ============================================================
# 4) FORMULAIRE — 2 cases a cocher apres "Type de Contrat"
# ============================================================
with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

OLD_FORM = """                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Type de Contrat</label>
                    <select id="emp-contract-type"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="CDI" ${employee.contract_type === 'CDI' ? 'selected' : ''}>CDI</option>
                        <option value="CDD" ${employee.contract_type === 'CDD' ? 'selected' : ''}>CDD</option>
                        <option value="Stage" ${employee.contract_type === 'Stage' ? 'selected' : ''}>Stage</option>
                        <option value="Consultant" ${employee.contract_type === 'Consultant' ? 'selected' : ''}>Consultant</option>
                    </select>
                </div>"""

NEW_FORM = """                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Type de Contrat</label>
                    <select id="emp-contract-type"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="CDI" ${employee.contract_type === 'CDI' ? 'selected' : ''}>CDI</option>
                        <option value="CDD" ${employee.contract_type === 'CDD' ? 'selected' : ''}>CDD</option>
                        <option value="Stage" ${employee.contract_type === 'Stage' ? 'selected' : ''}>Stage</option>
                        <option value="Consultant" ${employee.contract_type === 'Consultant' ? 'selected' : ''}>Consultant</option>
                    </select>
                </div>
                <div class="flex items-center gap-6 md:col-span-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-3">
                    <label class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input id="emp-cnss-eligible" type="checkbox" ${employee.cnss_eligible === false ? '' : 'checked'} class="w-4 h-4 rounded accent-primary">
                        Eligible CNSS
                    </label>
                    <label class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input id="emp-its-eligible" type="checkbox" ${employee.its_eligible === false ? '' : 'checked'} class="w-4 h-4 rounded accent-primary">
                        Eligible ITS
                    </label>
                </div>"""

js = guarded_replace(js, OLD_FORM, NEW_FORM, 1, "formulaire checkboxes CNSS/ITS")

# ============================================================
# 5) saveHREmployee — ajout au payload
# ============================================================
OLD_PAYLOAD = """        missions:                  Array.from(document.querySelectorAll('.emp-mission-input')).map(el => el.value.trim()).filter(v => v !== ''),
    };"""

NEW_PAYLOAD = """        missions:                  Array.from(document.querySelectorAll('.emp-mission-input')).map(el => el.value.trim()).filter(v => v !== ''),
        cnss_eligible:             document.getElementById('emp-cnss-eligible')?.checked,
        its_eligible:              document.getElementById('emp-its-eligible')?.checked,
    };"""

js = guarded_replace(js, OLD_PAYLOAD, NEW_PAYLOAD, 1, "payload saveHREmployee")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("OK - script.js (formulaire + payload) patche")
