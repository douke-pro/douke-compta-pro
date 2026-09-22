#!/usr/bin/env bash
# === CONTROLE PRE-INTEGRATION SYCEBNL EXCEL ===
# Lecture seule : ne modifie rien, ne fait aucun commit, aucun push, aucune install.
set -uo pipefail

PASS=0
FAIL=0
WARN=0

ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN+1)); }

section() { echo ""; echo "== $1 =="; }

section "1. Position dans le dépôt"
if [[ -f package.json && -d services ]]; then
  ok "Racine du dépôt confirmée (package.json + services/ présents)"
else
  bad "Pas à la racine du dépôt (package.json ou services/ introuvable) — arrête-toi ici, cd vers la racine d'abord."
fi

section "2. État git"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "Dans un dépôt git valide"
  BR=$(git branch --show-current 2>/dev/null || echo '?')
  echo "     Branche actuelle : $BR"
  if git remote get-url origin >/dev/null 2>&1; then
    ok "Remote 'origin' configuré : $(git remote get-url origin)"
  else
    bad "Pas de remote 'origin' configuré — le push échouera"
  fi
  if [[ -z "$(git status --porcelain)" ]]; then
    ok "Working tree propre (aucune modification non commitée)"
  else
    warn "Modifications locales non commitées détectées — le script va les mélanger avec le fix :"
    git status --porcelain | sed 's/^/       /'
  fi
  if git show-ref --verify --quiet refs/heads/fix/sycebnl-excel-identite-tft-cache; then
    warn "La branche fix/sycebnl-excel-identite-tft-cache existe déjà localement — 'git checkout -b' échouera"
  else
    ok "La branche fix/sycebnl-excel-identite-tft-cache n'existe pas encore localement"
  fi
  if git ls-remote --exit-code --heads origin fix/sycebnl-excel-identite-tft-cache >/dev/null 2>&1; then
    warn "La branche existe déjà sur origin — le push pourrait nécessiter --force ou un autre nom"
  else
    ok "La branche n'existe pas encore sur origin"
  fi
  if [[ -n "$(git config user.email 2>/dev/null)" ]]; then
    ok "Identité git déjà configurée : $(git config user.name) <$(git config user.email)>"
  else
    warn "Aucune identité git locale — le script en définira une temporaire (dev@doukepro.local)"
  fi
else
  bad "Pas un dépôt git valide ici"
fi

section "3. Dépendance exceljs"
if [[ -f package.json ]] && grep -q '"exceljs"' package.json; then
  ok "exceljs déclaré dans package.json"
else
  bad "exceljs ABSENT de package.json — 'npm install exceljs --save' requis avant d'exécuter le fix"
fi
if [[ -d node_modules/exceljs ]]; then
  ok "exceljs présent dans node_modules/"
else
  bad "exceljs ABSENT de node_modules/ — require('exceljs') plantera à l'exécution"
fi
if command -v node >/dev/null 2>&1; then
  NODE_CHECK=$(node -e "try{require.resolve('exceljs');console.log('OK')}catch(e){console.log('MISSING')}" 2>/dev/null)
  if [[ "$NODE_CHECK" == "OK" ]]; then
    ok "Node résout bien require('exceljs')"
  else
    bad "Node NE résout PAS require('exceljs') depuis la racine du dépôt"
  fi
else
  bad "node introuvable dans le PATH"
fi

section "4. Fichier gabarit Excel"
TEMPLATE="backups/EF_SYSCEBNL_Juin (1).xlsx"
if [[ -f "$TEMPLATE" ]]; then
  ok "Gabarit trouvé exactement à : $TEMPLATE ($(du -h "$TEMPLATE" | cut -f1))"
else
  bad "Gabarit ABSENT à : $TEMPLATE"
  FOUND=$(find . -not -path "./node_modules/*" -not -path "./.git/*" -iname "*sycebnl*.xlsx" 2>/dev/null)
  if [[ -n "$FOUND" ]]; then
    warn "Mais un(des) fichier(s) au nom proche existe(nt) ailleurs :"
    echo "$FOUND" | sed 's/^/       /'
    warn "Vérifie le chemin exact (espaces, parenthèses, casse) et ajuste TEMPLATE_PATH si besoin"
  else
    warn "Aucun fichier .xlsx contenant 'sycebnl' trouvé nulle part dans le dépôt — il faudra l'y déposer"
  fi
fi

section "5. Fichiers cibles du patch"
if [[ -f services/sycebnlExcelExport.js ]]; then
  warn "services/sycebnlExcelExport.js existe DÉJÀ — le script va l'écraser intégralement (cat > sans confirmation)"
else
  ok "services/sycebnlExcelExport.js n'existe pas encore — création propre"
fi

if [[ -f services/sycebnlReportAdapter.js ]]; then
  ok "services/sycebnlReportAdapter.js trouvé"
  if grep -qF "montant_n1: etatsN1 ? (etatsN1.tft[code]" services/sycebnlReportAdapter.js; then
    warn "Le patch semble déjà appliqué (montant_n1 déjà présent dans tftLignes) — le script le détectera et ne fera rien, c'est normal"
  elif grep -qF "libelle: getLibelle('TFT', code)," services/sycebnlReportAdapter.js; then
    ok "Le bloc tftLignes attendu par le patch semble présent (correspondance probable)"
  else
    bad "Le bloc tftLignes attendu est INTROUVABLE tel quel — le patch Python s'arrêtera avec une erreur explicite (comportement voulu, mais à corriger avant de lancer)"
  fi
else
  bad "services/sycebnlReportAdapter.js INTROUVABLE — le patch échouera"
fi

section "6. Outils requis"
for tool in git node python3 npm; do
  if command -v "$tool" >/dev/null 2>&1; then
    ok "$tool disponible ($($tool --version 2>&1 | head -1))"
  else
    bad "$tool INTROUVABLE dans le PATH"
  fi
done

section "7. Accès push GitHub"
if git ls-remote origin >/dev/null 2>&1; then
  ok "Accès en lecture à origin confirmé (identifiants probablement valides)"
else
  bad "Impossible de contacter/lire origin — le push échouera (identifiants GitHub manquants ou invalides dans ce Codespace)"
fi

echo ""
echo "=========================================="
echo "RÉSUMÉ : $PASS OK / $WARN AVERTISSEMENT(S) / $FAIL ÉCHEC(S)"
echo "=========================================="
if [[ $FAIL -gt 0 ]]; then
  echo "-> NE PAS lancer integrate_and_push_sycebnl_fix.sh tant que les ❌ ci-dessus ne sont pas résolus."
  exit 1
else
  echo "-> Aucun blocage détecté. Vérifie les ⚠️ ci-dessus puis tu peux lancer le script d'intégration."
  exit 0
fi
