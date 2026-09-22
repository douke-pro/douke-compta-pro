#!/usr/bin/env bash
# === VERIFICATION AVANT ECRASEMENT DE services/sycebnlExcelExport.js ===
# Lecture seule : n'écrase rien, ne modifie rien.
set -uo pipefail

FILE="services/sycebnlExcelExport.js"

if [[ ! -f "$FILE" ]]; then
  echo "❌ $FILE introuvable — rien à vérifier, l'écrasement créera un fichier neuf sans risque."
  exit 0
fi

echo "== Statistiques du fichier existant =="
echo "  Lignes       : $(wc -l < "$FILE")"
echo "  Taille       : $(du -h "$FILE" | cut -f1)"
echo "  Dernière modif : $(stat -c '%y' "$FILE" 2>/dev/null || stat -f '%Sm' "$FILE")"
echo "  SHA256       : $(sha256sum "$FILE" | cut -d' ' -f1)"

echo ""
echo "== Historique git de ce fichier (5 derniers commits) =="
git log -5 --oneline -- "$FILE" 2>/dev/null || echo "  (aucun historique / fichier non suivi)"

echo ""
echo "== Présence des correctifs attendus dans la version ACTUELLE =="
check_marker() {
  if grep -qF "$1" "$FILE"; then
    echo "  ✅ Présent : $2"
  else
    echo "  ❌ Absent  : $2"
  fi
}
check_marker "setIdentityCell"        "écriture directe des cellules d'identité (setIdentityCell)"
check_marker "isFormulaCell"          "détection des cellules à formule (isFormulaCell)"
check_marker "cell.value = { formula" "cache figé du résultat sur cellule à formule"
check_marker "montant_n1"             "usage de montant_n1 (colonne N-1)"
check_marker "TEMPLATE_PATH"          "constante TEMPLATE_PATH"
check_marker "'PAGE DE GARDE'"        "référence à la feuille PAGE DE GARDE"

echo ""
echo "== Contenu intégral actuel (à comparer visuellement avec la version du patch) =="
echo "-------------------------------------------------------------------------------"
cat -n "$FILE"
echo "-------------------------------------------------------------------------------"

echo ""
echo "== Sauvegarde de sécurité proposée (n'est PAS exécutée automatiquement) =="
echo "  Si tu veux une copie de secours avant d'écraser, lance :"
echo "  cp \"$FILE\" \"${FILE}.backup-\$(date +%Y%m%d-%H%M%S)\""
