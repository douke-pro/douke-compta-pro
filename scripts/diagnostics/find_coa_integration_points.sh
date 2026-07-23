#!/bin/bash
echo "🔍 RECONNAISSANCE — points d'intégration système comptable (chart_template)"
echo "============================================================"

echo -e "\n1/5 — Recherche 'chart_template' dans tout le repo (hors node_modules)..."
grep -rn "chart_template" --include="*.js" --exclude-dir=node_modules . 2>/dev/null

echo -e "\n2/5 — Recherche 'chart' ou 'plan comptable' côté script.js..."
grep -n -i "chart\|plan.comptable\|système.comptable\|systeme.comptable" script.js 2>/dev/null || echo "   (script.js non trouvé à la racine, ou aucun résultat)"

echo -e "\n3/5 — Recherche de routes existantes liées aux settings/company..."
grep -rln "res.config.settings\|company.*settings\|/api/.*settings\|/api/.*company" --include="*.js" --exclude-dir=node_modules . 2>/dev/null

echo -e "\n4/5 — Recherche du schéma Supabase (fichiers SQL ou migrations)..."
find . -iname "*.sql" -not -path "*/node_modules/*" 2>/dev/null
grep -rln "chart_template\|accounting_system\|systeme_comptable" --include="*.sql" . 2>/dev/null

echo -e "\n5/5 — Recherche de la table 'companies' côté Supabase dans le code..."
grep -rn "from('companies')\|\.table('companies')\|companies\`" --include="*.js" --exclude-dir=node_modules . 2>/dev/null

echo -e "\n============================================================"
echo "✅ Reconnaissance terminée."
echo "============================================================"
