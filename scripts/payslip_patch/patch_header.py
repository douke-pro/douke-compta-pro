import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count} occurrence(s), trouve {count}. Aucune modification ecrite.")
        sys.exit(1)
    return text.replace(old, new)

with open('scripts/payslip_patch/current.html', 'r', encoding='utf-8') as f:
    tpl = f.read()

OLD_CSS_ANCHOR = """.legal-ref{font-size:8pt;color:#aaa;text-align:center;margin-top:18px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>"""

NEW_CSS_ANCHOR = """.legal-ref{font-size:8pt;color:#aaa;text-align:center;margin-top:18px;border-top:1px solid #eee;padding-top:8px}
.header-banner{margin-bottom:18px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c}
.header-title{background:#1a3a5c;color:#fff;text-align:center;padding:10px 14px}
.header-title h1{font-size:14pt;margin:0;letter-spacing:1px;text-transform:uppercase}
.header-title h2{font-size:12pt;margin:2px 0 0 0;font-weight:normal}
.header-title p{font-size:9pt;margin:4px 0 0 0;color:#cfe0f0}
</style></head><body>"""

OLD_HEADER_HTML = """<div class="header">
<div class="header-left"><h1>{{nom_entreprise}}</h1><p>{{adresse_entreprise}}</p><p>RCCM : {{rccm}} | IFU : {{ifu}}</p><p>N\u00b0 Employeur CNSS : {{numero_employeur_cnss}}</p></div>
<div class="header-right"><h2>Bulletin de Paie</h2><div class="periode-badge">{{periode}}</div><p>Date de paiement : <strong>{{date_paiement}}</strong></p></div>
</div>"""

NEW_HEADER_HTML = """<div class="header-banner">
<img src="{{header_image_url}}" alt="{{nom_entreprise}}" style="width:100%;display:block"/>
<div class="header-title"><h1>Bulletin de Paie</h1><h2>{{periode}}</h2><p>RCCM : {{rccm}} | IFU : {{ifu}} &nbsp;|&nbsp; N\u00b0 Employeur CNSS : {{numero_employeur_cnss}} &nbsp;|&nbsp; Date de paiement : {{date_paiement}}</p></div>
</div>"""

tpl = guarded_replace(tpl, OLD_CSS_ANCHOR, NEW_CSS_ANCHOR, 1, "CSS")
tpl = guarded_replace(tpl, OLD_HEADER_HTML, NEW_HEADER_HTML, 1, "HTML entete")

with open('scripts/payslip_patch/patched.html', 'w', encoding='utf-8') as f:
    f.write(tpl)
print("OK - patched.html genere")
