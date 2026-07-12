import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# --- 1) empOptions doit inclure base_salary en data-attribute pour auto-remplissage ---
OLD_OPTIONS = """        const empOptions = employees.map(e =>
            `<option value="${e.id}">${e.full_name} — ${e.employee_code}</option>`
        ).join('');"""

NEW_OPTIONS = """        const empOptions = employees.map(e =>
            `<option value="${e.id}" data-base-salary="${e.base_salary || 0}">${e.full_name} — ${e.employee_code}</option>`
        ).join('');"""

js = guarded_replace(js, OLD_OPTIONS, NEW_OPTIONS, 1, "empOptions avec data-base-salary")

# --- 2) select employe : ajout onchange pour auto-remplir le salaire de base ---
OLD_SELECT = """                <select id="ps-employee" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                    ${empOptions}
                </select>"""

NEW_SELECT = """                <select id="ps-employee" onchange="window.rapportPayslipFillBaseSalary()" class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                    ${empOptions}
                </select>"""

js = guarded_replace(js, OLD_SELECT, NEW_SELECT, 1, "select employe onchange")

# --- 3) remplacement des champs Salaire Brut/Net + Retenues JSON par rubriques distinctes ---
OLD_FIELDS = """            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire Brut (FCFA)</label>
                    <input type="number" id="ps-gross" placeholder="ex: 250000" min="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire Net (FCFA)</label>
                    <input type="number" id="ps-net" placeholder="ex: 200000" min="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Retenues (JSON optionnel)</label>
                <textarea id="ps-deductions" rows="2" placeholder='{"CNSS": 5000, "ITS": 3000}'
                    class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary font-mono"></textarea>
            </div>
            <button onclick="window.savePayslip()"
                class="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition">
                <i class="fas fa-save mr-2"></i>Enregistrer la Fiche de Paie
            </button>"""

NEW_FIELDS = """            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire de Base (FCFA)</label>
                    <input type="number" id="ps-base" placeholder="ex: 150000" min="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Primes (FCFA)</label>
                    <input type="number" id="ps-primes" placeholder="ex: 10000" min="0" value="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
            </div>
            <button type="button" onclick="window.calculatePayslipAuto()"
                class="w-full py-2 bg-success/10 text-success border-2 border-success rounded-xl text-sm font-bold hover:bg-success/20 transition flex items-center justify-center gap-2">
                <i class="fas fa-calculator"></i> Calculer automatiquement (CNSS / ITS / VPS)
            </button>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire Brut (FCFA)</label>
                    <input type="number" id="ps-gross" placeholder="calcule ou saisi" min="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire Net (FCFA)</label>
                    <input type="number" id="ps-net" placeholder="calcule ou saisi" min="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">CNSS Salarié (FCFA)</label>
                    <input type="number" id="ps-cnss-salarie" placeholder="0" min="0" value="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ITS (FCFA)</label>
                    <input type="number" id="ps-its" placeholder="0" min="0" value="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">CNSS Patronal (FCFA, informatif)</label>
                    <input type="number" id="ps-cnss-patronal" placeholder="0" min="0" value="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">VPS (FCFA, informatif)</label>
                    <input type="number" id="ps-vps" placeholder="0" min="0" value="0"
                        class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary">
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Retenues additionnelles (JSON optionnel)</label>
                <textarea id="ps-deductions" rows="2" placeholder='{"Avance sur salaire": 5000}'
                    class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary font-mono"></textarea>
            </div>
            <button onclick="window.savePayslip()"
                class="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition">
                <i class="fas fa-save mr-2"></i>Enregistrer la Fiche de Paie
            </button>"""

js = guarded_replace(js, OLD_FIELDS, NEW_FIELDS, 1, "formulaire payslip - rubriques distinctes")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("OK - formulaire patche")
