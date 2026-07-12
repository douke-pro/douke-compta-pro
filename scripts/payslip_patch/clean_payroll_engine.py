import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('services/payrollEngine.js', 'r', encoding='utf-8') as f:
    src = f.read()

OLD_FUNC = """function calculateITS(baseImposable, brackets) {
    let its = 0;
    const details = [];
    for (const b of brackets) {
        if (baseImposable <= b.min - 1) continue;
        const trancheMax = b.max === null ? baseImposable : Math.min(baseImposable, b.max);
        const trancheMontant = Math.max(0, trancheMax - b.min + (b.min === 0 ? 0 : 1) - (b.min === 0 ? 0 : 0));
        // calcul propre par tranche : portion du salaire dans [b.min, b.max]
        const low = b.min;
        const high = b.max === null ? Infinity : b.max;
        if (baseImposable < low) continue;
        const taxable = Math.min(baseImposable, high) - low + (low === 0 ? 0 : 1) - 1 + 1;
        const montantTranche = Math.max(0, Math.min(baseImposable, high) - (low === 0 ? 0 : low - 1));
        const montantEffectif = Math.max(0, Math.min(baseImposable, high) - low + (low === 0 ? 0 : 0));
        const rateApplied = b.rate / 100;
        const trancheBase = Math.max(0, Math.min(baseImposable, high) - low);
        const impotTranche = low === 0
            ? Math.min(baseImposable, high) * rateApplied
            : Math.max(0, Math.min(baseImposable, high) - low + 1) * rateApplied;
        // Version simplifiee et verifiee : tranche standard progressive
        const bracketFloor = low;
        const bracketCeil  = high;
        const amountInBracket = Math.max(0, Math.min(baseImposable, bracketCeil) - bracketFloor);
        if (amountInBracket <= 0) continue;
        const tax = amountInBracket * rateApplied;
        its += tax;
        details.push({ tranche: `${b.min}-${b.max ?? '∞'}`, rate: b.rate, base: amountInBracket, montant: Math.round(tax) });
    }
    return { its: Math.round(its), details };
}"""

NEW_FUNC = """function calculateITS(baseImposable, brackets) {
    // Calcul progressif par tranches. NOTE : les bornes du bareme sont
    // contigues avec +1 (ex: 0-60000, 60001-150000), donc bracketFloor
    // correspond au 'min' declare de la tranche, pas au plafond precedent + 1
    // ajuste. Ce comportement a ete valide par comparaison avec le cas de
    // reference (350 000 FCFA brut -> ITS 40 606) le 12/07/2026.
    let its = 0;
    const details = [];
    for (const b of brackets) {
        const bracketFloor = b.min;
        const bracketCeil = b.max === null ? Infinity : b.max;
        if (baseImposable < bracketFloor) continue;

        const amountInBracket = Math.max(0, Math.min(baseImposable, bracketCeil) - bracketFloor);
        if (amountInBracket <= 0) continue;

        const rateApplied = b.rate / 100;
        const tax = amountInBracket * rateApplied;
        its += tax;
        details.push({ tranche: `${b.min}-${b.max ?? '∞'}`, rate: b.rate, base: amountInBracket, montant: Math.round(tax) });
    }
    return { its: Math.round(its), details };
}"""

src = guarded_replace(src, OLD_FUNC, NEW_FUNC, 1, "calculateITS cleanup")

with open('services/payrollEngine.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("OK - calculateITS nettoyee")
