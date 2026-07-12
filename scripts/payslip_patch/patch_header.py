import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"❌ ABORT [{label}] : attendu {expected_count} occurrence(s), trouvé {count}. Aucune modification écrite.")
        sys.exit(1)
    return text.replace(old, new)

# ============================================================
# 1) PATCH DU TEMPLATE DB (fiche_paie, company_id=0)
# ============================================================
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

tpl = guarded_replace(tpl, OLD_CSS_ANCHOR, NEW_CSS_ANCHOR, 1, "DB template - insertion CSS")
tpl = guarded_replace(tpl, OLD_HEADER_HTML, NEW_HEADER_HTML, 1, "DB template - remplacement HTML entete")

with open('scripts/payslip_patch/patched.html', 'w', encoding='utf-8') as f:
    f.write(tpl)
print("✅ Template DB patch\u00e9 -> scripts/payslip_patch/patched.html")

# ============================================================
# 2) PATCH DE public/assets/script.js (downloadPayslip)
# ============================================================
with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

OLD_JS_HEADER = """  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:10px 16px;border:2px solid #1a3a5c;border-radius:6px;background:#fff">
  ${headerImgTag}
  <div style="text-align:right">
    <div style="font-size:20pt;font-weight:900;color:#1a3a5c;text-transform:uppercase;letter-spacing:2px">BULLETIN DE PAIE</div>
    <div style="display:inline-block;background:#1a3a5c;color:#fff;padding:4px 18px;border-radius:5px;font-size:11pt;font-weight:700;margin:6px 0">${periode}</div>
    <div style="font-size:8.5pt;color:#4a5568;margin-top:2px">Fich N\u00b0 ${ps.employee_code || ''}/CCIp &nbsp;|&nbsp; N\u00b0 Employeur CNSS : ${ps.cnss_number || '\u2014'}</div>
  </div>
</div>"""

NEW_JS_HEADER = """  <div style="margin-bottom:10px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c">
  ${headerImgTag}
  <div style="background:#1a3a5c;color:#fff;text-align:center;padding:10px 14px;font-family:Arial,sans-serif">
    <div style="font-size:14pt;font-weight:900;text-transform:uppercase;letter-spacing:1px">BULLETIN DE PAIE</div>
    <div style="font-size:12pt;margin-top:2px">${periode}</div>
    <div style="font-size:9pt;color:#cfe0f0;margin-top:4px">Fiche N\u00b0 ${ps.employee_code || ''} &nbsp;|&nbsp; N\u00b0 Employeur CNSS : ${ps.cnss_number || '\u2014'}</div>
  </div>
</div>"""

js = guarded_replace(js, OLD_JS_HEADER, NEW_JS_HEADER, 1, "script.js - remplacement bloc entete downloadPayslip")
js = guarded_replace(js, 'width:180px;height:auto;display:block', 'width:100%;height:auto;display:block', 2, "script.js - largeur headerImgTag (x2)")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("✅ public/assets/script.js patch\u00e9 en place (backup git disponible via le tag existant)")
