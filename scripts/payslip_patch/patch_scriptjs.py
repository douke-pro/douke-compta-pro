import sys

def guarded_replace(text, old, new, expected_count, label):
    count = text.count(old)
    if count != expected_count:
        print(f"ABORT [{label}] : attendu {expected_count} occurrence(s), trouve {count}. Aucune modification ecrite.")
        sys.exit(1)
    return text.replace(old, new)

with open('public/assets/script.js', 'r', encoding='utf-8') as f:
    js = f.read()

OLD_JS_HEADER = """<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:10px 16px;border:2px solid #1a3a5c;border-radius:6px;background:#fff">
  ${headerImgTag}
  <div style="text-align:right">
    <div style="font-size:20pt;font-weight:900;color:#1a3a5c;text-transform:uppercase;letter-spacing:2px">BULLETIN DE PAIE</div>
    <div style="display:inline-block;background:#1a3a5c;color:#fff;padding:4px 18px;border-radius:5px;font-size:11pt;font-weight:700;margin:6px 0">${periode}</div>
    <div style="font-size:8.5pt;color:#4a5568;margin-top:2px">Fich N\u00b0 ${ps.employee_code || ''}/CCIp &nbsp;|&nbsp; N\u00b0 Employeur CNSS : ${ps.cnss_number || '\u2014'}</div>
  </div>
</div>"""

NEW_JS_HEADER = """<div style="margin-bottom:10px;border-radius:6px;overflow:hidden;border:1px solid #1a3a5c">
  ${headerImgTag}
  <div style="background:#1a3a5c;color:#fff;text-align:center;padding:10px 14px;font-family:Arial,sans-serif">
    <div style="font-size:14pt;font-weight:900;text-transform:uppercase;letter-spacing:1px">BULLETIN DE PAIE</div>
    <div style="font-size:12pt;margin-top:2px">${periode}</div>
    <div style="font-size:9pt;color:#cfe0f0;margin-top:4px">Fiche N\u00b0 ${ps.employee_code || ''} &nbsp;|&nbsp; N\u00b0 Employeur CNSS : ${ps.cnss_number || '\u2014'}</div>
  </div>
</div>"""

js = guarded_replace(js, OLD_JS_HEADER, NEW_JS_HEADER, 1, "bloc entete downloadPayslip")
js = guarded_replace(js, 'width:180px;height:auto;display:block', 'width:100%;height:auto;display:block', 2, "largeur headerImgTag")

with open('public/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("OK - script.js patche")
