import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/scriptEtatsFinanciers.js', 'r', encoding='utf-8') as f:
    src = f.read()

# --- Correction 1 : renommer margeCommerciale -> margeBrute dans le return ---
OLD_RETURN = """        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes, margeCommerciale,
                 chargesExpl, ebitda, resBrut, resFin, resNet,
                 tresBanque, tresCaisse, tresNette, clients, fournisseurs,
                 stocks, dettesCT, tauxMarge, tauxPersonnel, pointMort,
                 liquidite, delaiClient, delaiFourn, alertes };"""

NEW_RETURN = """        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes,
                 margeBrute: margeCommerciale,
                 chargesExpl, ebitda, resExpl: resBrut, resFin, resNet,
                 tresBanque, tresCaisse, tresNette, clients, fournisseurs,
                 stocks, dettesCT, tauxMarge, tauxPersonnel, pointMort,
                 liquidite, delaiClient, delaiFourn, alertes };"""

src = guarded_replace(src, OLD_RETURN, NEW_RETURN, 1, "return computeRapportGestion (renommage)")

with open('public/assets/scriptEtatsFinanciers.js', 'w', encoding='utf-8') as f:
    f.write(src)

print("OK - renommage margeBrute/resExpl applique")
