import re, sys

with open('controllers/hrController.js', 'r', encoding='utf-8') as f:
    full = f.read()

m = re.search(r"exports\.getPayslip = async[\s\S]*?\n\};\n", full)
if not m:
    print("ABORT : fonction getPayslip introuvable via regex. Rien ecrit.")
    sys.exit(1)

block = m.group(0)
count = block.count('FROM payslips p')
if count != 1:
    print(f"ABORT : attendu 1 occurrence de 'FROM payslips p' dans getPayslip, trouve {count}. Rien ecrit.")
    sys.exit(1)

NEW_COLS = ", p.primes, p.cnss_salarie, p.cnss_patronal, p.vps, p.its, p.base_imposable"
new_block = block.replace("FROM payslips p", NEW_COLS + "\n             FROM payslips p", 1)

full2 = full[:m.start()] + new_block + full[m.end():]

with open('controllers/hrController.js', 'w', encoding='utf-8') as f:
    f.write(full2)

print("OK - getPayslip etendu (colonnes ajoutees juste avant FROM)")
print("--- Extrait du bloc modifie ---")
print(new_block[:600])
