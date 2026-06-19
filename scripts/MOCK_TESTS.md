# Tests Mock pour `finalizeClosing`

Ce fichier décrit comment exécuter les tests mock locaux pour `finalizeClosing()`
sans toucher à Odoo ni à la base de production.

Prérequis:
- Node >= 18
- Dépendances installées (`npm install`)

Exemples d'exécution (dev/test sandbox):

```bash
# Exécute les tests automatisés (scénarios échec / succès)
DATABASE_URL="postgres://user:pass@localhost:5432/mock" \
ODOO_URL="http://localhost:8069" \
ODOO_DB="mockdb" \
npm run test:mock-finalize
```

Fichiers:
- `scripts/auto_mock_finalize_tests.js` — lance les deux scénarios et écrit `scripts/mock_finalize_tests_results.json`.
- `scripts/mock_finalize_closing.js` — test manuel interactif pour un seul run.

Notes de sécurité:
- N'utilisez PAS vos credentials de production.
- Les mocks interceptent les appels aux services, mais vérifiez toujours les variables d'environnement avant d'exécuter.
