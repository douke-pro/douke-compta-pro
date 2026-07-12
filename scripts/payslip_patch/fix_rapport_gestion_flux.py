import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/scriptEtatsFinanciers.js', 'r', encoding='utf-8') as f:
    src = f.read()

# --- 1) Ajout du calcul encaissements/decaissements/varTres apres tresNette ---
OLD_TRES = """        // Trésorerie
        const tresBanque = accounts.filter(a => a.code.startsWith('52') || a.code.startsWith('53'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresCaisse = accounts.filter(a => a.code.startsWith('57'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresNette  = tresBanque + tresCaisse;"""

NEW_TRES = """        // Trésorerie
        const tresBanque = accounts.filter(a => a.code.startsWith('52') || a.code.startsWith('53'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresCaisse = accounts.filter(a => a.code.startsWith('57'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresNette  = tresBanque + tresCaisse;

        // Flux de trésorerie sur la période (comptes 52x/53x/57x)
        const isCompteTres = a => a.code.startsWith('52') || a.code.startsWith('53') || a.code.startsWith('57');
        const encaissements = accounts.filter(isCompteTres).reduce((s, a) => s + a.debit, 0);
        const decaissements = accounts.filter(isCompteTres).reduce((s, a) => s + a.credit, 0);
        const varTres = encaissements - decaissements;"""

src = guarded_replace(src, OLD_TRES, NEW_TRES, 1, "ajout calcul flux tresorerie")

# --- 2) Integration dans le return ---
OLD_RETURN = """        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes,
                 margeBrute: margeCommerciale,
                 chargesExpl, ebitda, resExpl: resBrut, resFin, resNet,
                 tresBanque, tresCaisse, tresNette, clients, fournisseurs,
                 stocks, dettesCT, tauxMarge, tauxPersonnel, pointMort,
                 liquidite, delaiClient, delaiFourn, alertes };"""

NEW_RETURN = """        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes,
                 margeBrute: margeCommerciale,
                 chargesExpl, ebitda, resExpl: resBrut, resFin, resNet,
                 tresBanque, tresCaisse, tresNette, encaissements, decaissements, varTres,
                 clients, fournisseurs,
                 stocks, dettesCT, tauxMarge, tauxPersonnel, pointMort,
                 liquidite, delaiClient, delaiFourn, alertes };"""

src = guarded_replace(src, OLD_RETURN, NEW_RETURN, 1, "integration flux dans return")

with open('public/assets/scriptEtatsFinanciers.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("OK - encaissements/decaissements/varTres integres")
