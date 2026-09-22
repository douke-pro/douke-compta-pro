#!/usr/bin/env bash
set -Eeuo pipefail

REMOTE="${DEPLOY_REMOTE:-origin}"
BRANCH="${DEPLOY_BRANCH:-main}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-https://douke-compta-pro.onrender.com/api/health}"
WAIT_FOR_HEALTH="${WAIT_FOR_HEALTH:-false}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-10}"

log() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERREUR: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "git est requis."
command -v node >/dev/null 2>&1 || fail "Node.js est requis."
command -v npm >/dev/null 2>&1 || fail "npm est requis."

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"
CURRENT_BRANCH="$(git branch --show-current)"
[[ "$CURRENT_BRANCH" == "$BRANCH" ]] || fail "Branche active '$CURRENT_BRANCH'; attendu '$BRANCH'."

log "Verification du code local"
git diff --check
if [[ -n "$(git status --porcelain)" ]]; then
    git status --short
    fail "Le worktree n'est pas propre. Commitez ou rangez les changements avant le deploiement."
fi

log "Verification des dependances et des tests"
npm ci --ignore-scripts
npm test --if-present

log "Publication de $BRANCH vers $REMOTE"
git fetch "$REMOTE" "$BRANCH"
LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "$REMOTE/$BRANCH")"
if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
    git push "$REMOTE" "$BRANCH:$BRANCH"
fi
printf 'Commit deploye: %s\n' "$(git rev-parse --short HEAD)"

if [[ "$WAIT_FOR_HEALTH" == "true" ]]; then
    command -v curl >/dev/null 2>&1 || fail "curl est requis pour attendre le healthcheck."
    log "Attente du healthcheck Render"
    for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
        if response="$(curl --fail --silent --show-error --max-time 15 "$HEALTH_URL")"; then
            printf '%s\n' "$response"
            printf 'Production joignable: %s\n' "$HEALTH_URL"
            exit 0
        fi
        printf 'Tentative %d/%d echouee; nouvelle verification dans %ss.\n' \
            "$attempt" "$HEALTH_ATTEMPTS" "$HEALTH_DELAY"
        sleep "$HEALTH_DELAY"
    done
    fail "Le healthcheck n'est pas disponible apres $HEALTH_ATTEMPTS tentatives."
fi

printf '\nPush termine. Render doit maintenant deployer le commit %s.\n' "$(git rev-parse --short HEAD)"
printf 'Pour attendre la mise en ligne : WAIT_FOR_HEALTH=true %s\n' "$0"