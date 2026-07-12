import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count}, trouve {count}. Rien ecrit.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

OLD_CALC = """        // Calculs
        const salBase  = Number(ps.gross_salary) || 0;
        const hs25     = Number(ps.deductions?.['HS 25%'] || 0);
        const hs50     = Number(ps.deductions?.['HS 50%'] || 0);
        const salBrut  = salBase + hs25 + hs50;
        const netPayer = Number(ps.net_salary) || salBrut;
        const fmt = v => Number(v).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2});
        const heuresBase = 191.25;
        const txBase = salBase / heuresBase;
        const companyName = appState.user?.companiesList?.find(c => c.id === appState.currentCompanyId)?.name || '';"""

NEW_CALC = """        // Calculs (valeurs reelles stockees lors de l'enregistrement de la fiche)
        const primes         = Number(ps.primes) || 0;
        const salBrut         = Number(ps.gross_salary) || 0;
        const salBase          = salBrut - primes;
        const cnssSal          = Number(ps.cnss_salarie) || 0;
        const cnssPat          = Number(ps.cnss_patronal) || 0;
        const vpsMontant       = Number(ps.vps) || 0;
        const itsMontant       = Number(ps.its) || 0;
        const baseImposable    = Number(ps.base_imposable) || 0;
        const netPayer         = Number(ps.net_salary) || salBrut;
        const fmt = v => Number(v).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2});
        const heuresBase = 191.25;
        const txBase = salBase / heuresBase;
        const companyName = appState.user?.companiesList?.find(c => c.id === appState.currentCompanyId)?.name || '';"""

js = guarded_replace(js, OLD_CALC, NEW_CALC, 1, "bloc calculs downloadPayslip")

OLD_TABLES = """<div class="stitle">RÉMUNÉRATION</div>
<table class="sal">
  <thead><tr>
    <th style="width:32%;text-align:left;padding-left:6px">Libellé</th>
    <th>Heures</th><th>Taux Horaire</th><th>Montant brut</th><th></th><th>À payer</th>
  </tr></thead>
  <tbody>
    <tr><td>Salaire de base</td><td>${heuresBase.toFixed(2)}</td><td>${fmt(txBase)}</td><td>${fmt(salBase)}</td><td></td><td>${fmt(salBase)}</td></tr>
    <tr><td>HS à 25%</td><td>0,0</td><td>${fmt(txBase*1.25)}</td><td>0</td><td></td><td>0</td></tr>
    <tr><td>HS à 50%</td><td>0,0</td><td>${fmt(txBase*1.50)}</td><td>0</td><td></td><td>0</td></tr>
    <tr style="font-weight:bold;background:#f5f7fa">
      <td colspan="3" style="text-align:right;padding-right:8px">SALAIRE BRUT</td>
      <td>${fmt(salBrut)}</td><td></td><td>0</td>
    </tr>
  </tbody>
</table>

<div class="stitle">COTISATIONS</div>
<table class="cot">
  <thead>
    <tr>
      <th rowspan="2" style="width:30%;text-align:left;padding-left:6px">Libellé</th>
      <th colspan="3">Part Patronale</th>
      <th colspan="3">Part Salariale</th>
    </tr>
    <tr><th>Base</th><th>Taux</th><th>Montant</th><th>Base</th><th>Taux</th><th>Montant</th></tr>
  </thead>
  <tbody>
    <tr><td>CSG non déductible</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td></tr>
    <tr><td>CRDS non déductible</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td></td><td></td><td></td></tr>
    <tr><td>CSG déductible</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td></td><td></td><td></td></tr>
    <tr class="sec"><td colspan="7">Sécurité sociale</td></tr>
    <tr><td>&nbsp;&nbsp;Assurance maladie</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td></td><td></td><td>0</td></tr>
    <tr><td>&nbsp;&nbsp;Cotisation familiale</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td></tr>
    <tr><td>&nbsp;&nbsp;Risque professionnel</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td><td></td><td></td><td>0</td></tr>
    <tr class="sec"><td colspan="7">Assurance vieillesse</td></tr>
    <tr><td>&nbsp;&nbsp;Part Patronale</td><td>${fmt(salBrut)}</td><td>0,0</td><td></td><td>0,0</td><td>0,0</td><td>0</td></tr>
    <tr><td>&nbsp;&nbsp;Part ouvrière</td><td>0,0</td><td>0,0</td><td>0</td><td>${fmt(salBrut)}</td><td>0,0</td><td>0</td></tr>
    <tr class="sec"><td colspan="7">Aide au logement</td></tr>
    <tr><td>&nbsp;&nbsp;AL déplafonnée</td><td></td><td></td><td></td><td></td><td></td><td>0</td></tr>
    <tr><td>&nbsp;&nbsp;AL plafonnée</td><td></td><td></td><td></td><td></td><td></td><td>0</td></tr>
    <tr class="sec"><td colspan="7">ASSEDIC</td></tr>
    <tr class="sec"><td colspan="7">Caisse de retraite (non cadre)</td></tr>
    <tr><td>&nbsp;&nbsp;Retraite complémentaire et AGFF tranche 1</td><td></td><td>0,038</td><td>0</td><td></td><td>0,057</td><td>0</td></tr>
    <tr><td>&nbsp;&nbsp;Retraite complémentaire et AGFF tranche 2</td><td></td><td>0,069</td><td>0</td><td></td><td>0,103</td><td>0</td></tr>
    <tr class="tot"><td>TOTAL des cotisations</td><td></td><td></td><td>0</td><td></td><td></td><td>0</td></tr>
  </tbody>
</table>

<div class="net-box">
  <div><div class="net-lbl">Net à payer</div><div class="net-val">${fmt(netPayer)} FCFA</div></div>
  <div><div class="net-lbl">Salaire net imposable</div><div class="net-val">${fmt(netPayer)} FCFA</div></div>
</div>"""

NEW_TABLES = """<div class="stitle">RÉMUNÉRATION</div>
<table class="sal">
  <thead><tr>
    <th style="width:32%;text-align:left;padding-left:6px">Libellé</th>
    <th>Heures</th><th>Taux Horaire</th><th>Montant</th>
  </tr></thead>
  <tbody>
    <tr><td>Salaire de base</td><td>${heuresBase.toFixed(2)}</td><td>${fmt(txBase)}</td><td>${fmt(salBase)}</td></tr>
    <tr><td>Primes</td><td></td><td></td><td>${fmt(primes)}</td></tr>
    <tr style="font-weight:bold;background:#f5f7fa">
      <td colspan="3" style="text-align:right;padding-right:8px">SALAIRE BRUT</td>
      <td>${fmt(salBrut)}</td>
    </tr>
  </tbody>
</table>

<div class="stitle">COTISATIONS &amp; RETENUES (SYSTÈME BÉNINOIS)</div>
<table class="cot">
  <thead>
    <tr>
      <th style="width:34%;text-align:left;padding-left:6px">Libellé</th>
      <th>Base</th><th>Taux</th><th>Montant</th>
    </tr>
  </thead>
  <tbody>
    <tr class="sec"><td colspan="4">Retenues sur salaire (part salariale)</td></tr>
    <tr><td>&nbsp;&nbsp;CNSS Salarié</td><td>${fmt(salBrut)}</td><td>3,60 %</td><td>${fmt(cnssSal)}</td></tr>
    <tr><td>&nbsp;&nbsp;Base Imposable ITS</td><td colspan="2" style="text-align:right;padding-right:8px">(Brut − CNSS Salarié)</td><td>${fmt(baseImposable)}</td></tr>
    <tr><td>&nbsp;&nbsp;ITS (Impôt sur Traitements et Salaires)</td><td>${fmt(baseImposable)}</td><td>Progressif</td><td>${fmt(itsMontant)}</td></tr>
    <tr class="tot"><td>TOTAL RETENUES SALARIÉ</td><td></td><td></td><td>${fmt(cnssSal + itsMontant)}</td></tr>
    <tr class="sec"><td colspan="4">Charges patronales (informatif — non déduites du salarié)</td></tr>
    <tr><td>&nbsp;&nbsp;CNSS Patronal</td><td>${fmt(salBrut)}</td><td>15,40 %</td><td>${fmt(cnssPat)}</td></tr>
    <tr><td>&nbsp;&nbsp;VPS (Versement Patronal de Sécurité)</td><td>${fmt(salBrut)}</td><td>4,00 %</td><td>${fmt(vpsMontant)}</td></tr>
  </tbody>
</table>

<div class="net-box">
  <div><div class="net-lbl">Net à payer</div><div class="net-val">${fmt(netPayer)} FCFA</div></div>
  <div><div class="net-lbl">Salaire net imposable</div><div class="net-val">${fmt(baseImposable)} FCFA</div></div>
</div>"""

js = guarded_replace(js, OLD_TABLES, NEW_TABLES, 1, "tables remuneration/cotisations downloadPayslip")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("OK - PDF/HTML bulletin patche avec vraies rubriques beninoises")
