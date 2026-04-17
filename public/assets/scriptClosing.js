// =============================================================================
// FICHIER : public/assets/scriptClosing.js
// Description : Wizard de clôture fiscale SYSCOHADA — 4 étapes
// Version : V1.2 — Corrections post-audit
// Corrections V1.2 :
//   ✅ ModalManager.open() — 2 paramètres uniquement
//   ✅ generateClosingModuleHTML() exposée pour switch loadContentArea()
//   ✅ window.initClosingModule() sans paramètre — lit toujours appState
//   ✅ getCompanyId() — lit toujours appState.currentCompanyId (anti bug multi-entreprise)
//   ✅ #closing-wizard-actions supprimé — adaptClosingButtons() supprimée
//   ✅ Timeline logique corrigée — isDone/isCurrent/isPending corrects
//   ✅ Compteur caractères unlock branché sur oninput
// =============================================================================

(function () {
    'use strict';

    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptClosing] script.js doit être chargé AVANT scriptClosing.js');
        return;
    }

    // =========================================================================
    // STATE LOCAL
    // =========================================================================
    const closingState = {
    fiscalYear : parseInt(
        document.getElementById('fiscal-year-text')?.textContent?.trim()
    ) || new Date().getFullYear(),
    preChecks  : null,
    status     : null
};

    // Toujours lire depuis appState — protection multi-entreprise
    function getCompanyId() {
        return window.appState.currentCompanyId;
    }

    // =========================================================================
    // POINT D'ENTRÉE A — appelé par switch dans loadContentArea()
    // Génère le HTML du panneau principal
    // =========================================================================
    window.generateClosingModuleHTML = function () {
        const currentYear = new Date().getFullYear();
        const years       = [currentYear - 2, currentYear - 1, currentYear];

        return `
            <div class="fade-in" id="closing-main-panel">
                <h3 class="text-3xl font-black text-secondary mb-6">
                    <i class="fas fa-calendar-check mr-3"></i>Clôture de l'Exercice Fiscal
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-8">
                    Processus de clôture <strong>SYSCOHADA Révisé</strong> — écriture d'affectation
                    du résultat et verrouillage réel dans Odoo avec piste d'audit complète.
                </p>

                <!-- Sélecteur d'année -->
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-primary mb-6">
                    <h4 class="text-lg font-black text-gray-900 dark:text-white mb-4">
                        <i class="fas fa-calendar-alt mr-2 text-primary"></i>Exercice à clôturer
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label class="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                                Année fiscale
                            </label>
                            <select id="closing-year-select"
                                class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold">
                                ${years.map(yr => `
                                    <option value="${yr}" ${yr === currentYear - 1 ? 'selected' : ''}>
                                        Exercice ${yr} (01/01/${yr} — 31/12/${yr})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <button onclick="window.closingCheckStatus()"
                                class="w-full bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl font-black shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                <i class="fas fa-search mr-2"></i>Vérifier l'état
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Zone dynamique -->
                <div id="closing-status-zone"></div>
            </div>
        `;
    };

    // =========================================================================
    // POINT D'ENTRÉE B — appelé par switch après injection HTML
    // ✅ CORRECTION : sans paramètre — companyId lu via getCompanyId()
    // =========================================================================
    window.initClosingModule = async function () {
        const select = document.getElementById('closing-year-select');
        if (select) {
            closingState.fiscalYear = parseInt(select.value);
        }
        await window.closingCheckStatus();
    };

    // =========================================================================
    // VÉRIFICATION ÉTAT — injecte le résumé dans #closing-status-zone
    // =========================================================================
    window.closingCheckStatus = async function () {
        const companyId = getCompanyId();
        if (!companyId) {
            NotificationManager.show('Sélectionnez une entreprise d\'abord.', 'error');
            return;
        }

        const select = document.getElementById('closing-year-select');
        if (select) closingState.fiscalYear = parseInt(select.value);

        const zone = document.getElementById('closing-status-zone');
        if (!zone) return;

        zone.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-primary text-2xl mb-3"></i>
                <p class="text-gray-500 font-semibold">
                    Chargement de l'état de l'exercice ${closingState.fiscalYear}...
                </p>
            </div>
        `;

        try {
            const response = await apiFetch(
                `accounting/closing/status?companyId=${companyId}&year=${closingState.fiscalYear}`
            );

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Réponse invalide du serveur');
            }

            closingState.status = response.data;
            zone.innerHTML      = generateStatusDashboardHTML(response.data);

        } catch (err) {
            console.error('❌ [closingCheckStatus]', err);
            zone.innerHTML = `
                <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-danger">
                    <p class="font-bold text-danger">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Erreur : ${err.message}
                    </p>
                    <button onclick="window.closingCheckStatus()"
                        class="mt-3 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-redo mr-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    };

    // =========================================================================
    // DASHBOARD D'ÉTAT — panneau principal
    // =========================================================================
    function generateStatusDashboardHTML(data) {
        const cfg = {
            'open'          : { label: 'Exercice ouvert',               borderColor: 'border-gray-300',    badge: 'bg-gray-100 text-gray-700',      icon: 'fas fa-lock-open',      btnLabel: 'Démarrer la clôture',           btnFn: 'closingGoToStep1', btnColor: 'bg-primary' },
            'pre_check_ok'  : { label: 'Pré-vérifications validées',    borderColor: 'border-info',        badge: 'bg-blue-100 text-blue-700',      icon: 'fas fa-check-circle',   btnLabel: 'Étape 2 : Affecter le résultat',btnFn: 'closingGoToStep2', btnColor: 'bg-primary' },
            'result_posted' : { label: 'Résultat comptabilisé',         borderColor: 'border-warning',     badge: 'bg-yellow-100 text-yellow-700',  icon: 'fas fa-file-invoice',   btnLabel: 'Étape 3 : Verrouiller',         btnFn: 'closingGoToStep3', btnColor: 'bg-warning' },
            'locked'        : { label: 'Exercice verrouillé dans Odoo', borderColor: 'border-orange-400',  badge: 'bg-orange-100 text-orange-700',  icon: 'fas fa-lock',           btnLabel: 'Étape 4 : Finaliser',           btnFn: 'closingGoToStep4', btnColor: 'bg-success' },
            'closed'        : { label: 'Clôture finalisée',             borderColor: 'border-success',     badge: 'bg-green-100 text-green-700',    icon: 'fas fa-check-double',   btnLabel: null,                            btnFn: null,               btnColor: null }
        }[data.status] || { label: 'Inconnu', borderColor: 'border-gray-300', badge: 'bg-gray-100 text-gray-700', icon: 'fas fa-question', btnLabel: null, btnFn: null, btnColor: null };

        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 ${cfg.borderColor} mb-6">

                <!-- En-tête statut -->
                <div class="flex items-start justify-between mb-5">
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                            État — Exercice ${closingState.fiscalYear}
                        </p>
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${cfg.badge}">
                            <i class="${cfg.icon}"></i>${cfg.label}
                        </span>
                    </div>
                    ${data.result_amount ? `
                        <div class="text-right">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Résultat affecté</p>
                            <p class="text-2xl font-black ${data.result_type === 'profit' ? 'text-success' : 'text-danger'}">
                                ${data.result_type === 'profit' ? '+' : '−'}
                                ${parseFloat(data.result_amount).toLocaleString('fr-FR')} XOF
                            </p>
                            ${data.result_move_name ? `
                                <p class="text-xs text-gray-400 font-mono">${data.result_move_name}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- Lock Date actif -->
                ${data.lock_date ? `
                    <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-sm
                                text-orange-800 dark:text-orange-200 mb-5 flex items-center gap-2">
                        <i class="fas fa-lock text-warning"></i>
                        Lock Date Odoo actif : <strong>${data.lock_date}</strong>
                        — Aucune écriture possible sur cette période
                    </div>
                ` : ''}

                <!-- Boutons d'action -->
                <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">

                    ${cfg.btnLabel ? `
                        <button onclick="window.${cfg.btnFn}()"
                            class="${cfg.btnColor} text-white px-6 py-3 rounded-xl font-bold
                                   hover:opacity-90 transition-all shadow-md">
                            <i class="fas fa-arrow-right mr-2"></i>${cfg.btnLabel}
                        </button>
                    ` : `
                        <span class="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700
                                     dark:text-green-300 rounded-xl font-bold">
                            <i class="fas fa-check-double mr-2"></i>Clôture terminée
                        </span>
                    `}

                    ${data.status === 'locked' ? `
                        <button onclick="window.openUnlockModal()"
                            class="px-6 py-3 border-2 border-danger text-danger rounded-xl font-bold
                                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                            <i class="fas fa-lock-open mr-2"></i>Déverrouiller
                        </button>
                    ` : ''}

                    ${data.status === 'result_posted' ? `
                        <button onclick="window.openRelockModal()"
                            class="px-6 py-3 border-2 border-warning text-warning rounded-xl font-bold
                                   hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all">
                            <i class="fas fa-lock mr-2"></i>Re-verrouiller
                        </button>
                    ` : ''}

                    <button onclick="window.closingViewAuditLog()"
                        class="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-600
                               dark:text-gray-400 rounded-xl font-semibold
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        <i class="fas fa-history mr-2"></i>Piste d'audit
                    </button>
                </div>
            </div>

            <!-- Timeline -->
            ${generateStepsTimelineHTML(data.status)}
        `;
    }

    // =========================================================================
    // TIMELINE — progression visuelle
    // ✅ CORRECTION : isDone/isCurrent/isPending corrects
    // =========================================================================
    function generateStepsTimelineHTML(currentStatus) {
        const steps = [
            { label: 'Pré-vérifications',    icon: 'fas fa-search' },
            { label: 'Affectation résultat', icon: 'fas fa-file-invoice' },
            { label: 'Verrouillage Odoo',    icon: 'fas fa-lock' },
            { label: 'Finalisation',         icon: 'fas fa-flag-checkered' }
        ];

        // Ordre des statuts pour calculer la progression
        const order    = ['open', 'pre_check_ok', 'result_posted', 'locked', 'closed'];
        const progress = Math.max(order.indexOf(currentStatus), 0);
        // progress = 0 → open (rien de fait)
        // progress = 1 → pré-checks ok (étape 1 faite)
        // progress = 2 → résultat posté (étapes 1+2 faites)
        // progress = 3 → verrouillé (étapes 1+2+3 faites)
        // progress = 4 → closed (tout fait)

        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg
                        border border-gray-100 dark:border-gray-700">
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-5
                           uppercase tracking-wider">
                    Progression de la clôture
                </p>
                <div class="flex items-center">
                    ${steps.map((step, idx) => {
                        const isDone    = idx < progress;
                        const isCurrent = idx === progress && currentStatus !== 'closed';
                        const isAll     = currentStatus === 'closed';

                        const circleClass = (isDone || isAll)
                            ? 'bg-success text-white'
                            : isCurrent
                                ? 'bg-primary text-white ring-4 ring-primary/20'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500';

                        const lineClass = (isDone || isAll)
                            ? 'bg-success'
                            : 'bg-gray-200 dark:bg-gray-700';

                        const textClass = (isDone || isCurrent || isAll)
                            ? 'text-gray-700 dark:text-gray-200 font-semibold'
                            : 'text-gray-400 dark:text-gray-500';

                        return `
                            <div class="flex flex-col items-center" style="flex:0 0 auto; width:${100/steps.length}%">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center
                                            text-sm transition-all ${circleClass}">
                                    ${(isDone || isAll)
                                        ? '<i class="fas fa-check"></i>'
                                        : `<i class="${step.icon}"></i>`}
                                </div>
                                <p class="text-xs mt-2 text-center leading-tight ${textClass}">
                                    ${step.label}
                                </p>
                            </div>
                            ${idx < steps.length - 1 ? `
                                <div class="h-0.5 transition-all mb-5 ${lineClass}"
                                     style="flex:1"></div>
                            ` : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // ÉTAPE 1 — Pré-vérifications (modal)
    // =========================================================================
    window.closingGoToStep1 = async function () {
        const companyId = getCompanyId();

        ModalManager.open('🔍 Étape 1 — Pré-vérifications', `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-primary text-3xl mb-4"></i>
                <p class="text-gray-500 font-semibold">
                    Analyse de l'exercice ${closingState.fiscalYear}...
                </p>
            </div>
        `);

        try {
            const response = await apiFetch(
                `accounting/closing/pre-checks?companyId=${companyId}&year=${closingState.fiscalYear}`
            );

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Erreur lors des pré-vérifications');
            }

            closingState.preChecks = response.data;
            ModalManager.open('🔍 Étape 1 — Pré-vérifications', generateStep1HTML(response.data));

        } catch (err) {
            console.error('❌ [closingGoToStep1]', err);
            ModalManager.open('🔍 Étape 1 — Pré-vérifications', `
                <div class="p-6 text-center">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <p class="font-bold text-danger">${err.message}</p>
                    <button onclick="ModalManager.close()"
                        class="mt-4 px-6 py-2 border rounded-xl text-gray-600
                               dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Fermer
                    </button>
                </div>
            `);
        }
    };

    function generateStep1HTML(data) {
        return `
            <div class="space-y-5">

                <!-- Résultat calculé -->
                <div class="p-5 rounded-2xl border-2
                    ${data.result.type === 'profit'
                        ? 'bg-green-50 dark:bg-green-900/20 border-success'
                        : 'bg-red-50 dark:bg-red-900/20 border-danger'}">
                    <p class="text-xs font-bold uppercase tracking-wider mb-1
                        ${data.result.type === 'profit' ? 'text-success' : 'text-danger'}">
                        Résultat net calculé — Exercice ${closingState.fiscalYear}
                    </p>
                    <p class="text-3xl font-black
                        ${data.result.type === 'profit' ? 'text-success' : 'text-danger'}">
                        ${data.result.type === 'profit' ? '+' : '−'} ${data.result.display}
                    </p>
                    <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Produits (classe 7) : ${data.result.total_produits?.toLocaleString('fr-FR') || '—'} XOF</span>
                        <span>Charges (classe 6) : ${data.result.total_charges?.toLocaleString('fr-FR') || '—'} XOF</span>
                    </div>
                    <p class="text-sm font-semibold mt-2
                        ${data.result.type === 'profit' ? 'text-success' : 'text-danger'}">
                        ${data.result.type === 'profit'
                            ? '✅ Bénéfice → sera affecté au compte 130100'
                            : '⚠️ Perte → sera affectée au compte 130900'}
                    </p>
                </div>

                <!-- Bloquants -->
                ${data.blocking.length > 0 ? `
                    <div>
                        <p class="text-sm font-bold text-danger mb-3">
                            <i class="fas fa-ban mr-2"></i>
                            ${data.blocking.length} élément(s) bloquant(s) — à corriger avant de continuer
                        </p>
                        ${data.blocking.map(b => `
                            <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-danger
                                        p-3 rounded-lg mb-2">
                                <p class="text-sm font-bold text-danger">${b.label}</p>
                                ${b.details.length > 0 ? `
                                    <ul class="mt-1">
                                        ${b.details.map(d => `
                                            <li class="text-xs text-gray-600 dark:text-gray-400 ml-4">• ${d}</li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-success p-4 rounded-xl">
                        <p class="text-sm font-bold text-success">
                            <i class="fas fa-check-circle mr-2"></i>
                            Aucun élément bloquant — la clôture peut se poursuivre
                        </p>
                    </div>
                `}

                <!-- Avertissements -->
                ${data.warnings.length > 0 ? `
                    <div>
                        <p class="text-sm font-bold text-warning mb-2">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            ${data.warnings.length} avertissement(s) — non bloquants
                        </p>
                        ${data.warnings.map(w => `
                            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning
                                        p-3 rounded-lg mb-2">
                                <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                                    ${w.label}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-times mr-2"></i>Fermer
                    </button>
                    ${data.can_proceed ? `
                        <button onclick="window.closingGoToStep2()"
                            class="px-6 py-2.5 bg-primary text-white font-bold rounded-xl
                                   hover:bg-primary/90 transition-colors shadow-md">
                            <i class="fas fa-arrow-right mr-2"></i>Affecter le résultat
                        </button>
                    ` : `
                        <span class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500
                                     rounded-xl font-semibold cursor-not-allowed">
                            <i class="fas fa-ban mr-2"></i>Corriger les erreurs d'abord
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // ÉTAPE 2 — Affectation du résultat (modal)
    // =========================================================================
    window.closingGoToStep2 = async function () {
        if (!closingState.preChecks) {
            await window.closingGoToStep1();
            return;
        }
        ModalManager.open('📝 Étape 2 — Affectation du Résultat', generateStep2HTML());
    };

    function generateStep2HTML() {
        const d        = closingState.preChecks;
        const isProfit = d.result.type === 'profit';

        return `
            <div class="space-y-5">

                <div class="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl
                            border border-gray-200 dark:border-gray-600">
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                        Écriture qui sera créée et validée dans Odoo
                    </p>
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-600">
                                <th class="text-left pb-2 font-bold text-gray-700 dark:text-gray-300">Compte</th>
                                <th class="text-right pb-2 font-bold text-gray-700 dark:text-gray-300">Débit</th>
                                <th class="text-right pb-2 font-bold text-gray-700 dark:text-gray-300">Crédit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-100 dark:border-gray-700">
                                <td class="py-2.5 font-mono text-xs">
                                    ${isProfit
                                        ? '999999 — Résultat non affecté'
                                        : '130900 — Résultat perte en attente'}
                                </td>
                                <td class="text-right py-2.5 font-mono font-bold">
                                    ${d.result.display}
                                </td>
                                <td class="text-right py-2.5 text-gray-400">—</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 font-mono text-xs">
                                    ${isProfit
                                        ? '130100 — Résultat bénéfice en attente'
                                        : '999999 — Résultat non affecté'}
                                </td>
                                <td class="text-right py-2.5 text-gray-400">—</td>
                                <td class="text-right py-2.5 font-mono font-bold">
                                    ${d.result.display}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Date comptable : <strong>31/12/${closingState.fiscalYear}</strong> —
                        Journal : Opérations diverses
                    </p>
                </div>

                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning
                            p-4 rounded-xl">
                    <p class="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
                        L'écriture sera validée immédiatement dans Odoo
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Elle peut être extournée manuellement dans Odoo si une erreur est détectée.
                    </p>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep1()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingPostResult()"
                        class="px-6 py-2.5 bg-primary text-white font-bold rounded-xl
                               hover:bg-primary/90 transition-colors shadow-md">
                        <i class="fas fa-check mr-2"></i>Créer l'écriture dans Odoo
                    </button>
                </div>
            </div>
        `;
    }

    window.closingPostResult = async function () {
        const companyId = getCompanyId();
        if (!confirm(
            `Créer et valider l'écriture d'affectation du résultat ${closingState.fiscalYear} dans Odoo ?\n\n` +
            `Montant : ${closingState.preChecks.result.display}\n` +
            `Type : ${closingState.preChecks.result.type === 'profit' ? 'Bénéfice' : 'Perte'}`
        )) return;

        NotificationManager.show('Création de l\'écriture en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/post-result', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId     : companyId,
                    fiscal_year   : closingState.fiscalYear,
                    result_amount : closingState.preChecks.result.amount,
                    result_type   : closingState.preChecks.result.type
                })
            });

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Échec création écriture');
            }

            NotificationManager.show(`✅ ${response.move_name} créée et validée dans Odoo`, 'success');
            closingState.status = { status: 'result_posted' };

            // Rafraîchir le panneau principal en arrière-plan
            await window.closingCheckStatus();
            window.closingGoToStep3();

        } catch (err) {
            console.error('❌ [closingPostResult]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // ÉTAPE 3 — Verrouillage (modal)
    // =========================================================================
    window.closingGoToStep3 = function () {
        ModalManager.open(
            '🔒 Étape 3 — Verrouillage dans Odoo',
            generateStep3HTML()
        );
    };

    function generateStep3HTML() {
        return `
            <div class="space-y-5">

                <div class="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-warning
                            p-5 rounded-xl">
                    <p class="text-sm font-bold text-orange-800 dark:text-orange-200 mb-3">
                        <i class="fas fa-lock text-warning mr-2"></i>Ce que fait le verrouillage
                    </p>
                    <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check text-success mt-0.5 flex-shrink-0"></i>
                            Pose <code class="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded
                                              text-xs font-mono">fiscalyear_lock_date = 31/12/${closingState.fiscalYear}</code>
                            directement dans Odoo via l'API
                        </li>
                        <li class="flex items-start gap-2">
                            <i class="fas fa-check text-success mt-0.5 flex-shrink-0"></i>
                            Aucune écriture ne peut être créée ou modifiée sur cette période
                        </li>
                        <li class="flex items-start gap-2">
                            <i class="fas fa-shield-alt text-info mt-0.5 flex-shrink-0"></i>
                            Révocable par l'admin avec motif obligatoire et piste d'audit
                        </li>
                    </ul>
                </div>

                <div class="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl
                            border border-gray-200 dark:border-gray-600
                            flex items-center justify-between">
                    <div>
                        <p class="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Lock Date qui sera appliqué dans Odoo
                        </p>
                        <p class="text-3xl font-black text-warning mt-1">
                            31/12/${closingState.fiscalYear}
                        </p>
                    </div>
                    <i class="fas fa-calendar-times text-6xl text-warning opacity-20"></i>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep2()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingApplyLock()"
                        class="px-6 py-2.5 bg-warning text-white font-bold rounded-xl
                               hover:bg-warning/90 transition-colors shadow-md">
                        <i class="fas fa-lock mr-2"></i>
                        Verrouiller l'exercice ${closingState.fiscalYear}
                    </button>
                </div>
            </div>
        `;
    }

    window.closingApplyLock = async function () {
        const companyId = getCompanyId();
        if (!confirm(
            `Verrouiller l'exercice ${closingState.fiscalYear} dans Odoo ?\n\n` +
            `Le déverrouillage sera possible mais intégralement tracé avec motif obligatoire.`
        )) return;

        NotificationManager.show('Verrouillage en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/lock', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : companyId,
                    fiscal_year : closingState.fiscalYear
                })
            });

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Échec verrouillage');
            }

            NotificationManager.show(
                `✅ Exercice ${closingState.fiscalYear} verrouillé dans Odoo`,
                'success'
            );

            await window.closingCheckStatus();
            window.closingGoToStep4();

        } catch (err) {
            console.error('❌ [closingApplyLock]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // ÉTAPE 4 — Finalisation (modal)
    // =========================================================================
    window.closingGoToStep4 = function () {
        ModalManager.open('✅ Étape 4 — Finalisation', generateStep4HTML());
    };

    function generateStep4HTML() {
        return `
            <div class="space-y-5">

                <div class="text-center py-4">
                    <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full
                                flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-flag-checkered text-4xl text-success"></i>
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 dark:text-white">Dernière étape</h3>
                    <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        L'exercice ${closingState.fiscalYear} est verrouillé dans Odoo.
                        Cliquez sur Finaliser pour archiver la clôture définitivement.
                    </p>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 border border-success rounded-2xl p-5">
                    <p class="text-sm font-bold text-success mb-3">
                        <i class="fas fa-shield-alt mr-2"></i>
                        Résumé — Exercice ${closingState.fiscalYear}
                    </p>
                    <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
                        <li><i class="fas fa-check text-success mr-2"></i>Pré-vérifications validées</li>
                        <li><i class="fas fa-check text-success mr-2"></i>Écriture d'affectation créée et validée dans Odoo</li>
                        <li><i class="fas fa-check text-success mr-2"></i>Lock Date 31/12/${closingState.fiscalYear} actif dans Odoo</li>
                        <li><i class="fas fa-check text-success mr-2"></i>Piste d'audit complète dans Supabase</li>
                    </ul>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Notes de clôture
                        <span class="font-normal text-gray-500">(optionnel)</span>
                    </label>
                    <textarea id="closing-notes" rows="3"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600
                               dark:text-white focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Approuvée en AGO du 15/04/${closingState.fiscalYear + 1}. Commissaire : M. XYZ.">
                    </textarea>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep3()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingFinalize()"
                        class="px-6 py-2.5 bg-success text-white font-bold rounded-xl
                               hover:bg-success/90 transition-colors shadow-md">
                        <i class="fas fa-flag-checkered mr-2"></i>Finaliser la clôture
                    </button>
                </div>
            </div>
        `;
    }

    window.closingFinalize = async function () {
        const companyId = getCompanyId();
        const notes     = document.getElementById('closing-notes')?.value?.trim() || '';

        if (!confirm(
            `Finaliser la clôture de l'exercice ${closingState.fiscalYear} ?\n\n` +
            `Le statut passera à CLÔTURÉ — cette action est définitive.`
        )) return;

        NotificationManager.show('Finalisation en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/finalize', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : companyId,
                    fiscal_year : closingState.fiscalYear,
                    notes
                })
            });

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Échec finalisation');
            }

            ModalManager.open('🎉 Clôture Terminée !', generateSuccessHTML());
            NotificationManager.show(
                `✅ Exercice ${closingState.fiscalYear} officiellement clôturé`,
                'success'
            );

            // Rafraîchir le panneau en arrière-plan
            setTimeout(() => window.closingCheckStatus(), 500);

        } catch (err) {
            console.error('❌ [closingFinalize]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    function generateSuccessHTML() {
        return `
            <div class="text-center py-6 space-y-5">
                <div class="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full
                            flex items-center justify-center mx-auto">
                    <i class="fas fa-check-double text-5xl text-success"></i>
                </div>
                <div>
                    <h3 class="text-3xl font-black text-success">Clôture Finalisée !</h3>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">
                        L'exercice <strong>${closingState.fiscalYear}</strong>
                        est officiellement clôturé.
                    </p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-left text-sm space-y-2">
                    <p class="text-gray-700 dark:text-gray-300">
                        <i class="fas fa-check text-success mr-2"></i>
                        Écriture d'affectation validée dans Odoo
                    </p>
                    <p class="text-gray-700 dark:text-gray-300">
                        <i class="fas fa-check text-success mr-2"></i>
                        Lock Date 31/12/${closingState.fiscalYear} actif dans Odoo
                    </p>
                    <p class="text-gray-700 dark:text-gray-300">
                        <i class="fas fa-check text-success mr-2"></i>
                        Piste d'audit archivée dans Supabase
                    </p>
                    <p class="text-gray-700 dark:text-gray-300">
                        <i class="fas fa-check text-success mr-2"></i>
                        Exercice ${closingState.fiscalYear + 1} accessible sans restriction
                    </p>
                </div>
                <div class="flex justify-center gap-3 pt-4">
                    <button onclick="window.closingViewAuditLog()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-history mr-2"></i>Voir la piste d'audit
                    </button>
                    <button onclick="ModalManager.close()"
                        class="px-6 py-2.5 bg-success text-white font-bold rounded-xl
                               hover:bg-success/90 transition-colors">
                        <i class="fas fa-times mr-2"></i>Fermer
                    </button>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // DÉVERROUILLAGE CONTRÔLÉ (modal)
    // =========================================================================
    window.openUnlockModal = function () {
        ModalManager.open(
            '⚠️ Déverrouillage — Motif Obligatoire',
            generateUnlockHTML()
        );
    };

    function generateUnlockHTML() {
        return `
            <div class="space-y-5">

                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-danger p-4 rounded-xl">
                    <p class="text-sm font-bold text-danger mb-1">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Action intégralement tracée et auditée
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                        Votre identifiant, la date, l'heure et le motif seront enregistrés
                        définitivement dans la piste d'audit. Cette action ne peut pas être
                        dissimulée.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Exercice concerné</p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">
                        ${closingState.fiscalYear}
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Motif du déverrouillage <span class="text-danger">*</span>
                        <span class="font-normal text-gray-500">(minimum 10 caractères)</span>
                    </label>
                    <textarea id="unlock-reason" rows="4"
                        class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-danger
                               dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Ex: Erreur d'imputation sur le compte 601000 — correction avant re-clôture."
                        oninput="
                            const len = this.value.trim().length;
                            const counter = document.getElementById('unlock-reason-counter');
                            if (counter) {
                                counter.textContent = len + ' / minimum 10';
                                counter.className = 'text-xs mt-1 text-right ' + (len >= 10 ? 'text-success' : 'text-danger');
                            }
                        "></textarea>
                    <p id="unlock-reason-counter"
                       class="text-xs mt-1 text-right text-danger">
                        0 / minimum 10
                    </p>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Annuler
                    </button>
                    <button onclick="window.closingApplyUnlock()"
                        class="px-6 py-2.5 bg-danger text-white font-bold rounded-xl
                               hover:bg-danger/90 transition-colors shadow-md">
                        <i class="fas fa-lock-open mr-2"></i>
                        Déverrouiller l'exercice ${closingState.fiscalYear}
                    </button>
                </div>
            </div>
        `;
    }

    window.closingApplyUnlock = async function () {
        const companyId = getCompanyId();
        const reason    = document.getElementById('unlock-reason')?.value?.trim();

        if (!reason || reason.length < 10) {
            NotificationManager.show(
                'Le motif est obligatoire (minimum 10 caractères).',
                'error'
            );
            document.getElementById('unlock-reason')?.focus();
            return;
        }

        NotificationManager.show('Déverrouillage en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/unlock', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : companyId,
                    fiscal_year : closingState.fiscalYear,
                    reason
                })
            });

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Échec déverrouillage');
            }

            NotificationManager.show(
                `⚠️ Exercice ${closingState.fiscalYear} déverrouillé — effectuez vos corrections puis re-verrouillez`,
                'warning',
                8000
            );

            ModalManager.close();
            await window.closingCheckStatus();

        } catch (err) {
            console.error('❌ [closingApplyUnlock]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // RE-VERROUILLAGE (modal)
    // =========================================================================
    window.openRelockModal = function () {
        ModalManager.open(
            '🔒 Re-verrouillage après correction',
            generateRelockHTML()
        );
    };

    function generateRelockHTML() {
        return `
            <div class="space-y-5">

                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning
                            p-4 rounded-xl">
                    <p class="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        <i class="fas fa-lock mr-2"></i>
                        Re-pose le Lock Date 31/12/${closingState.fiscalYear} dans Odoo
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        À utiliser après avoir effectué et validé vos corrections dans Odoo.
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Note de re-verrouillage
                        <span class="font-normal text-gray-500">(optionnel)</span>
                    </label>
                    <textarea id="relock-notes" rows="3"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600
                               dark:text-white focus:ring-2 focus:ring-warning"
                        placeholder="Ex: Correction compte 601000 effectuée le 12/03/${closingState.fiscalYear + 1}.">
                    </textarea>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                               dark:text-gray-300 rounded-xl font-semibold
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Annuler
                    </button>
                    <button onclick="window.closingApplyRelock()"
                        class="px-6 py-2.5 bg-warning text-white font-bold rounded-xl
                               hover:bg-warning/90 transition-colors shadow-md">
                        <i class="fas fa-lock mr-2"></i>
                        Re-verrouiller l'exercice ${closingState.fiscalYear}
                    </button>
                </div>
            </div>
        `;
    }

    window.closingApplyRelock = async function () {
        const companyId = getCompanyId();
        const notes     = document.getElementById('relock-notes')?.value?.trim() || '';

        NotificationManager.show('Re-verrouillage en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/relock', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : companyId,
                    fiscal_year : closingState.fiscalYear,
                    notes
                })
            });

            if (!response || response.status !== 'success') {
                throw new Error(response?.error || 'Échec re-verrouillage');
            }

            NotificationManager.show(
                `✅ Exercice ${closingState.fiscalYear} re-verrouillé dans Odoo`,
                'success'
            );

            ModalManager.close();
            await window.closingCheckStatus();

        } catch (err) {
            console.error('❌ [closingApplyRelock]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // JOURNAL D'AUDIT (modal)
    // =========================================================================
    window.closingViewAuditLog = async function () {
        const companyId = getCompanyId();

        ModalManager.open('📋 Piste d\'Audit — Clôture Fiscale', `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-primary text-2xl mb-3"></i>
                <p class="text-gray-500 font-semibold">Chargement de l'audit...</p>
            </div>
        `);

        try {
            const response = await apiFetch(
                `accounting/closing/audit-log?companyId=${companyId}&year=${closingState.fiscalYear}`
            );

            if (!response || response.status !== 'success') {
                throw new Error('Erreur chargement audit');
            }

            ModalManager.open(
                '📋 Piste d\'Audit — Clôture Fiscale',
                generateAuditLogHTML(response)
            );

        } catch (err) {
            console.error('❌ [closingViewAuditLog]', err);
            NotificationManager.show(`Erreur audit : ${err.message}`, 'error');
        }
    };

    function generateAuditLogHTML(response) {
        const actionConfig = {
            'PRE_CHECK_RUN'     : { label: 'Pré-vérifications',        color: 'bg-blue-100 text-blue-700',     icon: 'fas fa-search' },
            'RESULT_POSTED'     : { label: 'Écriture créée',            color: 'bg-green-100 text-green-700',   icon: 'fas fa-file-invoice' },
            'YEAR_LOCKED'       : { label: 'Exercice verrouillé',       color: 'bg-orange-100 text-orange-700', icon: 'fas fa-lock' },
            'CLOSING_FINALIZED' : { label: 'Clôture finalisée',         color: 'bg-purple-100 text-purple-700', icon: 'fas fa-flag-checkered' },
            'UNLOCK_REQUESTED'  : { label: 'Déverrouillage demandé',    color: 'bg-red-100 text-red-700',       icon: 'fas fa-unlock' },
            'UNLOCK_APPLIED'    : { label: 'Déverrouillage effectué',   color: 'bg-red-200 text-red-800',       icon: 'fas fa-lock-open' },
            'RELOCK_APPLIED'    : { label: 'Re-verrouillage effectué',  color: 'bg-yellow-100 text-yellow-700', icon: 'fas fa-lock' }
        };

        if (response.count === 0) {
            return `
                <div class="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-history fa-3x mb-4 opacity-30"></i>
                    <p>Aucune action enregistrée pour l'exercice ${closingState.fiscalYear}</p>
                    <button onclick="ModalManager.close()"
                        class="mt-4 px-5 py-2 border rounded-xl hover:bg-gray-100
                               dark:hover:bg-gray-700 text-sm">
                        Fermer
                    </button>
                </div>
            `;
        }

        return `
            <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold sticky top-0
                           bg-white dark:bg-gray-800 py-1">
                    ${response.count} action(s) — Exercice ${closingState.fiscalYear}
                </p>
                ${response.data.map(log => {
                    const cfg = actionConfig[log.action] || {
                        label : log.action,
                        color : 'bg-gray-100 text-gray-700',
                        icon  : 'fas fa-circle'
                    };
                    return `
                        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl
                                    border border-gray-200 dark:border-gray-700">
                            <div class="flex items-start justify-between mb-2">
                                <span class="inline-flex items-center gap-2 px-3 py-1
                                             rounded-full text-xs font-bold ${cfg.color}">
                                    <i class="${cfg.icon}"></i>${cfg.label}
                                </span>
                                <span class="text-xs text-gray-400 dark:text-gray-500 ml-3 whitespace-nowrap">
                                    ${new Date(log.performed_at).toLocaleString('fr-FR')}
                                </span>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                <i class="fas fa-user text-primary mr-1.5"></i>
                                <strong>${log.performed_by}</strong>
                            </p>
                            ${log.reason ? `
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic
                                           border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                    ${log.reason}
                                </p>
                            ` : ''}
                            ${log.odoo_move_name ? `
                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    <i class="fas fa-file-invoice text-info mr-1"></i>
                                    Pièce Odoo : <span class="font-mono">${log.odoo_move_name}</span>
                                </p>
                            ` : ''}
                            ${log.ip_address && log.ip_address !== 'unknown' ? `
                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    <i class="fas fa-globe mr-1"></i>${log.ip_address}
                                </p>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-4 border-t mt-3 flex justify-end">
                <button onclick="ModalManager.close()"
                    class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700
                           dark:text-gray-300 rounded-xl font-semibold
                           hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Fermer
                </button>
            </div>
        `;
    }

    console.log('✅ [scriptClosing] Module V1.2 initialisé');

})();
