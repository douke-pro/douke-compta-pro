// =============================================================================
// FICHIER : assets/scriptClosing.js
// Description : Wizard de clôture fiscale — 4 étapes
// Version : V1.0 PRODUCTION
// Intégration : Chargé après script.js dans index.html
// =============================================================================

(function() {
    'use strict';

    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptClosing] script.js doit être chargé AVANT !');
        return;
    }

    console.log('✅ [scriptClosing] Module chargé avec succès');

    // =========================================================================
    // STATE LOCAL
    // =========================================================================
    const closingState = {
        companyId   : null,
        fiscalYear  : null,
        preChecks   : null,
        status      : null,
        auditLog    : []
    };

    // =========================================================================
    // POINT D'ENTRÉE — appelé depuis generateReportsMenuHTML
    // =========================================================================
    window.openClosingWizard = async function() {
        closingState.companyId  = appState.currentCompanyId;
        closingState.fiscalYear = new Date().getFullYear() - 1; // exercice précédent par défaut

        if (!closingState.companyId) {
            NotificationManager.show('Sélectionnez une entreprise d\'abord.', 'error');
            return;
        }

        ModalManager.open('🔒 Clôture de l\'Exercice Fiscal', generateClosingStep0HTML(), 'max-w-3xl');
    };

    // =========================================================================
    // ÉTAPE 0 — Sélection de l'année et état actuel
    // =========================================================================
    function generateClosingStep0HTML() {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 2, currentYear - 1, currentYear];

        return `
            <div class="space-y-6">
                <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-info p-4 rounded-xl">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-info text-xl mt-1"></i>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                Processus de clôture en 4 étapes
                            </p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">
                                1. Pré-vérifications → 2. Affectation du résultat → 3. Verrouillage → 4. Finalisation
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Exercice fiscal à clôturer <span class="text-danger">*</span>
                    </label>
                    <select id="closing-year-select"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white font-bold">
                        ${years.map(y => `
                            <option value="${y}" ${y === closingState.fiscalYear ? 'selected' : ''}>
                                Exercice ${y} (du 01/01/${y} au 31/12/${y})
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div id="closing-status-display" class="hidden"></div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-times mr-2"></i>Annuler
                    </button>
                    <button onclick="window.closingLoadStatus()"
                        class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
                        <i class="fas fa-search mr-2"></i>Vérifier l'état
                    </button>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // Charger l'état de clôture depuis l'API
    // =========================================================================
    window.closingLoadStatus = async function() {
        const select = document.getElementById('closing-year-select');
        if (select) closingState.fiscalYear = parseInt(select.value);

        const display = document.getElementById('closing-status-display');
        if (display) {
            display.classList.remove('hidden');
            display.innerHTML = `<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-primary text-2xl"></i></div>`;
        }

        try {
            const response = await apiFetch(
                `accounting/closing/status?companyId=${closingState.companyId}&year=${closingState.fiscalYear}`,
                { method: 'GET' }
            );

            if (!response || response.status !== 'success') throw new Error('Erreur chargement statut');

            closingState.status = response.data;

            if (display) display.innerHTML = generateStatusBadgeHTML(response.data);

            // Adapter les boutons selon le statut
            adaptClosingButtons(response.data.status);

        } catch (error) {
            console.error('❌ [closingLoadStatus]', error);
            if (display) display.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm text-danger font-semibold">
                    <i class="fas fa-exclamation-circle mr-2"></i>Erreur : ${error.message}
                </div>
            `;
        }
    };

    function generateStatusBadgeHTML(data) {
        const statusMap = {
            'open':          { label: 'Ouvert',                color: 'bg-gray-100 text-gray-700',     icon: 'fas fa-lock-open' },
            'pre_check_ok':  { label: 'Pré-checks OK',         color: 'bg-blue-100 text-blue-700',     icon: 'fas fa-check-circle' },
            'result_posted': { label: 'Résultat comptabilisé', color: 'bg-yellow-100 text-yellow-700', icon: 'fas fa-file-invoice' },
            'locked':        { label: 'Verrouillé',            color: 'bg-orange-100 text-orange-700', icon: 'fas fa-lock' },
            'closed':        { label: 'Clôturé définitivement',color: 'bg-green-100 text-green-700',   icon: 'fas fa-check-double' }
        };

        const s = statusMap[data.status] || statusMap['open'];

        return `
            <div class="p-4 rounded-xl border ${data.status === 'closed' ? 'border-success' : 'border-gray-200 dark:border-gray-600'}">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">État actuel — Exercice ${closingState.fiscalYear}</p>
                        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${s.color}">
                            <i class="${s.icon}"></i>${s.label}
                        </span>
                    </div>
                    ${data.result_amount ? `
                        <div class="text-right">
                            <p class="text-xs text-gray-500 dark:text-gray-400">Résultat ${closingState.fiscalYear}</p>
                            <p class="text-lg font-black ${data.result_type === 'profit' ? 'text-success' : 'text-danger'}">
                                ${data.result_type === 'profit' ? '+' : '-'}${parseFloat(data.result_amount).toLocaleString('fr-FR')} XOF
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function adaptClosingButtons(status) {
        const btnContainer = document.querySelector('#closing-wizard-actions');
        if (!btnContainer) return;

        const actions = {
            'open':          `<button onclick="window.closingGoToStep1()" class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"><i class="fas fa-play mr-2"></i>Démarrer la clôture</button>`,
            'pre_check_ok':  `<button onclick="window.closingGoToStep2()" class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"><i class="fas fa-arrow-right mr-2"></i>Étape 2 : Résultat</button>`,
            'result_posted': `<button onclick="window.closingGoToStep3()" class="px-6 py-3 bg-warning text-white font-bold rounded-xl hover:bg-warning/90 transition-colors"><i class="fas fa-lock mr-2"></i>Étape 3 : Verrouiller</button>`,
            'locked':        `<button onclick="window.closingGoToStep4()" class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/90 transition-colors"><i class="fas fa-flag-checkered mr-2"></i>Étape 4 : Finaliser</button>`,
            'closed':        `<span class="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold"><i class="fas fa-check-double mr-2"></i>Exercice clôturé</span>`
        };

        btnContainer.innerHTML = (actions[status] || '') + `
            <button onclick="window.closingViewAuditLog()"
                class="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <i class="fas fa-history mr-2"></i>Audit
            </button>
        `;
    }

    // =========================================================================
    // ÉTAPE 1 — Pré-vérifications
    // =========================================================================
    window.closingGoToStep1 = async function() {
        ModalManager.open('🔍 Étape 1 — Pré-vérifications', `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-primary text-3xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 font-semibold">Analyse de l'exercice ${closingState.fiscalYear} en cours...</p>
            </div>
        `, 'max-w-3xl');

        try {
            const response = await apiFetch(
                `accounting/closing/pre-checks?companyId=${closingState.companyId}&year=${closingState.fiscalYear}`,
                { method: 'GET' }
            );

            if (!response || response.status !== 'success') throw new Error('Erreur pré-vérifications');

            closingState.preChecks = response.data;
            ModalManager.open('🔍 Étape 1 — Pré-vérifications', generateStep1HTML(response.data), 'max-w-3xl');

        } catch (error) {
            console.error('❌ [closingGoToStep1]', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    function generateStep1HTML(data) {
        const canProceed = data.can_proceed;

        return `
            <div class="space-y-6">

                <!-- Résultat calculé -->
                <div class="p-5 rounded-2xl ${data.result.type === 'profit' ? 'bg-green-50 dark:bg-green-900/20 border border-success' : 'bg-red-50 dark:bg-red-900/20 border border-danger'}">
                    <p class="text-xs font-bold uppercase tracking-wider ${data.result.type === 'profit' ? 'text-success' : 'text-danger'} mb-1">
                        Résultat net calculé — Exercice ${closingState.fiscalYear}
                    </p>
                    <p class="text-3xl font-black ${data.result.type === 'profit' ? 'text-success' : 'text-danger'}">
                        ${data.result.type === 'profit' ? '+' : '−'} ${data.result.display}
                    </p>
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">
                        ${data.result.type === 'profit' ? '✅ Bénéfice' : '⚠️ Perte'} — à affecter au compte ${data.result.type === 'profit' ? '130100' : '130900'}
                    </p>
                </div>

                <!-- Éléments bloquants -->
                ${data.blocking.length > 0 ? `
                    <div>
                        <p class="text-sm font-bold text-danger mb-3">
                            <i class="fas fa-ban mr-2"></i>${data.blocking.length} élément(s) bloquant(s) — à corriger avant de continuer
                        </p>
                        <div class="space-y-2">
                            ${data.blocking.map(b => `
                                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-danger p-3 rounded-lg">
                                    <p class="text-sm font-bold text-danger">${b.label}</p>
                                    ${b.details.length > 0 ? `
                                        <ul class="mt-1 space-y-0.5">
                                            ${b.details.map(d => `<li class="text-xs text-gray-600 dark:text-gray-400 ml-4">• ${d}</li>`).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-success p-4 rounded-xl">
                        <p class="text-sm font-bold text-success">
                            <i class="fas fa-check-circle mr-2"></i>Aucun élément bloquant — vous pouvez procéder à la clôture
                        </p>
                    </div>
                `}

                <!-- Avertissements -->
                ${data.warnings.length > 0 ? `
                    <div>
                        <p class="text-sm font-bold text-warning mb-3">
                            <i class="fas fa-exclamation-triangle mr-2"></i>${data.warnings.length} avertissement(s) — non bloquants
                        </p>
                        <div class="space-y-2">
                            ${data.warnings.map(w => `
                                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning p-3 rounded-lg">
                                    <p class="text-sm font-semibold text-yellow-800 dark:text-yellow-200">${w.label}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.openClosingWizard()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    ${canProceed ? `
                        <button onclick="window.closingGoToStep2()"
                            class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
                            <i class="fas fa-arrow-right mr-2"></i>Étape 2 : Affecter le résultat
                        </button>
                    ` : `
                        <span class="px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed">
                            <i class="fas fa-ban mr-2"></i>Corriger les erreurs d'abord
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // ÉTAPE 2 — Affectation du résultat
    // =========================================================================
    window.closingGoToStep2 = async function() {
        if (!closingState.preChecks) {
            await window.closingGoToStep1();
            return;
        }

        ModalManager.open('📝 Étape 2 — Affectation du Résultat', generateStep2HTML(), 'max-w-3xl');
    };

    function generateStep2HTML() {
        const d = closingState.preChecks;
        const isProfit = d.result.type === 'profit';

        return `
            <div class="space-y-6">

                <div class="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-600">
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Écriture qui sera créée dans Odoo</p>
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
                                <td class="py-2">${isProfit ? '999999 — Résultat non affecté' : '130900 — Résultat perte'}</td>
                                <td class="text-right py-2 font-mono">${d.result.display}</td>
                                <td class="text-right py-2 font-mono text-gray-400">—</td>
                            </tr>
                            <tr>
                                <td class="py-2">${isProfit ? '130100 — Résultat bénéfice' : '999999 — Résultat non affecté'}</td>
                                <td class="text-right py-2 font-mono text-gray-400">—</td>
                                <td class="text-right py-2 font-mono">${d.result.display}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Date : 31/12/${closingState.fiscalYear} — Journal : Opérations diverses
                    </p>
                </div>

                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-warning p-4 rounded-xl">
                    <p class="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                        <i class="fas fa-exclamation-triangle text-warning mr-2"></i>
                        Action irréversible dans Odoo
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        L'écriture sera validée immédiatement. Elle peut être annulée manuellement dans Odoo si nécessaire.
                    </p>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep1()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingPostResult()"
                        class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors">
                        <i class="fas fa-check mr-2"></i>Créer l'écriture dans Odoo
                    </button>
                </div>
            </div>
        `;
    }

    window.closingPostResult = async function() {
        if (!confirm(`Confirmer la création de l'écriture d'affectation du résultat ${closingState.fiscalYear} dans Odoo ?`)) return;

        NotificationManager.show('Création de l\'écriture en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/post-result', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId     : closingState.companyId,
                    fiscal_year   : closingState.fiscalYear,
                    result_amount : closingState.preChecks.result.amount,
                    result_type   : closingState.preChecks.result.type
                })
            });

            if (!response || response.status !== 'success') throw new Error(response?.error || 'Échec');

            NotificationManager.show(`✅ ${response.move_name} créée avec succès`, 'success');
            closingState.status = { status: 'result_posted' };
            window.closingGoToStep3();

        } catch (error) {
            console.error('❌ [closingPostResult]', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    // =========================================================================
    // ÉTAPE 3 — Verrouillage
    // =========================================================================
    window.closingGoToStep3 = function() {
        ModalManager.open('🔒 Étape 3 — Verrouillage de l\'Exercice', generateStep3HTML(), 'max-w-3xl');
    };

    function generateStep3HTML() {
        return `
            <div class="space-y-6">

                <div class="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-warning p-5 rounded-xl">
                    <p class="text-sm font-bold text-orange-800 dark:text-orange-200 mb-2">
                        <i class="fas fa-lock text-warning mr-2"></i>
                        Ce que fait le verrouillage
                    </p>
                    <ul class="text-xs text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                        <li>• Pose <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">fiscalyear_lock_date = 31/12/${closingState.fiscalYear}</code> sur Odoo</li>
                        <li>• Aucune écriture ne peut être créée ou modifiée sur cette période</li>
                        <li>• <strong>Révocable</strong> par l'admin avec motif obligatoire et piste d'audit</li>
                    </ul>
                </div>

                <div class="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">Lock Date qui sera appliqué</p>
                            <p class="text-2xl font-black text-warning mt-1">31/12/${closingState.fiscalYear}</p>
                        </div>
                        <i class="fas fa-calendar-times text-5xl text-warning opacity-30"></i>
                    </div>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep2()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingApplyLock()"
                        class="px-6 py-3 bg-warning text-white font-bold rounded-xl hover:bg-warning/90 transition-colors">
                        <i class="fas fa-lock mr-2"></i>Verrouiller l'exercice ${closingState.fiscalYear}
                    </button>
                </div>
            </div>
        `;
    }

    window.closingApplyLock = async function() {
        if (!confirm(`Verrouiller définitivement l'exercice ${closingState.fiscalYear} dans Odoo ?\n\nLe déverrouillage restera possible mais sera tracé.`)) return;

        NotificationManager.show('Verrouillage en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/lock', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : closingState.companyId,
                    fiscal_year : closingState.fiscalYear
                })
            });

            if (!response || response.status !== 'success') throw new Error(response?.error || 'Échec');

            NotificationManager.show(`✅ Exercice ${closingState.fiscalYear} verrouillé dans Odoo`, 'success');
            window.closingGoToStep4();

        } catch (error) {
            console.error('❌ [closingApplyLock]', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    // =========================================================================
    // ÉTAPE 4 — Finalisation
    // =========================================================================
    window.closingGoToStep4 = function() {
        ModalManager.open('✅ Étape 4 — Finalisation', generateStep4HTML(), 'max-w-3xl');
    };

    function generateStep4HTML() {
        return `
            <div class="space-y-6">

                <div class="text-center py-4">
                    <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-flag-checkered text-4xl text-success"></i>
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 dark:text-white">Presque terminé !</h3>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">
                        L'exercice ${closingState.fiscalYear} est verrouillé dans Odoo.
                        Cliquez sur "Finaliser" pour archiver la clôture.
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Notes de clôture (optionnel)
                    </label>
                    <textarea id="closing-notes" rows="3"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Clôture approuvée en AGO du 15/04/${closingState.fiscalYear + 1}. Commissaire aux comptes : M. XYZ."></textarea>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-success p-4 rounded-xl">
                    <p class="text-sm font-bold text-success">
                        <i class="fas fa-shield-alt mr-2"></i>Résumé de la clôture
                    </p>
                    <ul class="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                        <li>• Exercice fiscal : ${closingState.fiscalYear}</li>
                        <li>• Écriture d'affectation : créée et validée dans Odoo ✅</li>
                        <li>• Lock Date Odoo : 31/12/${closingState.fiscalYear} ✅</li>
                        <li>• Piste d'audit : complète dans Supabase ✅</li>
                    </ul>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="window.closingGoToStep3()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                    <button onclick="window.closingFinalize()"
                        class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/90 transition-colors">
                        <i class="fas fa-flag-checkered mr-2"></i>Finaliser la clôture
                    </button>
                </div>
            </div>
        `;
    }

    window.closingFinalize = async function() {
        const notes = document.getElementById('closing-notes')?.value || '';

        if (!confirm(`Finaliser la clôture de l'exercice ${closingState.fiscalYear} ?\n\nCette action est définitive.`)) return;

        NotificationManager.show('Finalisation en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/finalize', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : closingState.companyId,
                    fiscal_year : closingState.fiscalYear,
                    notes
                })
            });

            if (!response || response.status !== 'success') throw new Error(response?.error || 'Échec');

            ModalManager.open('🎉 Clôture Terminée', generateClosingSuccessHTML(), 'max-w-2xl');
            NotificationManager.show(`✅ Exercice ${closingState.fiscalYear} clôturé avec succès`, 'success');

        } catch (error) {
            console.error('❌ [closingFinalize]', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    function generateClosingSuccessHTML() {
        return `
            <div class="text-center py-8 space-y-6">
                <div class="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                    <i class="fas fa-check-double text-5xl text-success"></i>
                </div>
                <div>
                    <h3 class="text-3xl font-black text-success">Clôture Finalisée !</h3>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">
                        L'exercice <strong>${closingState.fiscalYear}</strong> est officiellement clôturé.
                    </p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-left text-sm space-y-2">
                    <p class="text-gray-600 dark:text-gray-400"><i class="fas fa-check text-success mr-2"></i>Écriture d'affectation validée dans Odoo</p>
                    <p class="text-gray-600 dark:text-gray-400"><i class="fas fa-check text-success mr-2"></i>Lock Date 31/12/${closingState.fiscalYear} actif dans Odoo</p>
                    <p class="text-gray-600 dark:text-gray-400"><i class="fas fa-check text-success mr-2"></i>Piste d'audit complète archivée</p>
                    <p class="text-gray-600 dark:text-gray-400"><i class="fas fa-check text-success mr-2"></i>Statut : CLÔTURÉ dans le système</p>
                </div>
                <div class="flex justify-center gap-4 pt-4">
                    <button onclick="window.closingViewAuditLog()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i class="fas fa-history mr-2"></i>Voir la piste d'audit
                    </button>
                    <button onclick="ModalManager.close()"
                        class="px-6 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/90 transition-colors">
                        <i class="fas fa-times mr-2"></i>Fermer
                    </button>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // DÉVERROUILLAGE — avec motif obligatoire
    // =========================================================================
    window.openUnlockModal = function() {
        ModalManager.open('⚠️ Déverrouillage Exercice', generateUnlockHTML(), 'max-w-xl');
    };

    function generateUnlockHTML() {
        return `
            <div class="space-y-6">
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-danger p-4 rounded-xl">
                    <p class="text-sm font-bold text-danger mb-1">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Action tracée et auditée
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                        Le déverrouillage sera enregistré avec votre identifiant, la date, l'heure et le motif.
                        Cette action ne peut pas être dissimulée.
                    </p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Motif du déverrouillage <span class="text-danger">*</span>
                        <span class="font-normal text-gray-500">(minimum 10 caractères)</span>
                    </label>
                    <textarea id="unlock-reason" rows="4"
                        class="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Ex: Erreur d'imputation sur le compte 601000 — correction nécessaire avant re-clôture."></textarea>
                </div>

                <div class="flex justify-between pt-4 border-t">
                    <button onclick="ModalManager.close()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Annuler
                    </button>
                    <button onclick="window.closingApplyUnlock()"
                        class="px-6 py-3 bg-danger text-white font-bold rounded-xl hover:bg-danger/90 transition-colors">
                        <i class="fas fa-lock-open mr-2"></i>Déverrouiller
                    </button>
                </div>
            </div>
        `;
    }

    window.closingApplyUnlock = async function() {
        const reason = document.getElementById('unlock-reason')?.value?.trim();

        if (!reason || reason.length < 10) {
            NotificationManager.show('Le motif est obligatoire (minimum 10 caractères).', 'error');
            return;
        }

        NotificationManager.show('Déverrouillage en cours...', 'info');

        try {
            const response = await apiFetch('accounting/closing/unlock', {
                method : 'POST',
                body   : JSON.stringify({
                    companyId   : closingState.companyId,
                    fiscal_year : closingState.fiscalYear,
                    reason
                })
            });

            if (!response || response.status !== 'success') throw new Error(response?.error || 'Échec');

            NotificationManager.show(`⚠️ Exercice ${closingState.fiscalYear} déverrouillé — effectuez vos corrections`, 'warning');
            ModalManager.close();

        } catch (error) {
            console.error('❌ [closingApplyUnlock]', error);
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    // =========================================================================
    // JOURNAL D'AUDIT
    // =========================================================================
    window.closingViewAuditLog = async function() {
        ModalManager.open('📋 Piste d\'Audit — Clôture Fiscale', `
            <div class="text-center py-6">
                <i class="fas fa-spinner fa-spin text-primary text-2xl"></i>
            </div>
        `, 'max-w-4xl');

        try {
            const response = await apiFetch(
                `accounting/closing/audit-log?companyId=${closingState.companyId}&year=${closingState.fiscalYear}`,
                { method: 'GET' }
            );

            if (!response || response.status !== 'success') throw new Error('Erreur chargement audit');

            ModalManager.open('📋 Piste d\'Audit — Clôture Fiscale', generateAuditLogHTML(response), 'max-w-4xl');

        } catch (error) {
            NotificationManager.show(`Erreur : ${error.message}`, 'error');
        }
    };

    function generateAuditLogHTML(response) {
        if (response.count === 0) {
            return `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-history fa-3x mb-4 opacity-30"></i>
                    <p>Aucune action enregistrée pour l'exercice ${closingState.fiscalYear}</p>
                </div>
            `;
        }

        const actionLabels = {
            'PRE_CHECK_RUN'     : { label: 'Pré-vérifications',       color: 'bg-blue-100 text-blue-700',    icon: 'fas fa-search' },
            'RESULT_POSTED'     : { label: 'Écriture créée',           color: 'bg-green-100 text-green-700',  icon: 'fas fa-file-invoice' },
            'YEAR_LOCKED'       : { label: 'Exercice verrouillé',      color: 'bg-orange-100 text-orange-700',icon: 'fas fa-lock' },
            'CLOSING_FINALIZED' : { label: 'Clôture finalisée',        color: 'bg-purple-100 text-purple-700',icon: 'fas fa-flag-checkered' },
            'UNLOCK_REQUESTED'  : { label: 'Déverrouillage demandé',   color: 'bg-red-100 text-red-700',      icon: 'fas fa-unlock' },
            'UNLOCK_APPLIED'    : { label: 'Déverrouillage effectué',  color: 'bg-red-200 text-red-800',      icon: 'fas fa-lock-open' },
            'RELOCK_APPLIED'    : { label: 'Re-verrouillage effectué', color: 'bg-yellow-100 text-yellow-700',icon: 'fas fa-lock' }
        };

        return `
            <div class="space-y-4 max-h-[500px] overflow-y-auto">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ${response.count} action(s) enregistrée(s) pour l'exercice ${closingState.fiscalYear}
                </p>
                ${response.data.map(log => {
                    const a = actionLabels[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700', icon: 'fas fa-circle' };
                    return `
                        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div class="flex items-start justify-between mb-2">
                                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${a.color}">
                                    <i class="${a.icon}"></i>${a.label}
                                </span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    ${new Date(log.performed_at).toLocaleString('fr-FR')}
                                </span>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300">
                                <i class="fas fa-user text-primary mr-1"></i>
                                <strong>${log.performed_by}</strong>
                            </p>
                            ${log.reason ? `
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                    <i class="fas fa-quote-left mr-1"></i>${log.reason}
                                </p>
                            ` : ''}
                            ${log.odoo_move_name ? `
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <i class="fas fa-file-invoice text-info mr-1"></i>Pièce Odoo : ${log.odoo_move_name}
                                </p>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="pt-4 border-t mt-4 flex justify-end">
                <button onclick="ModalManager.close()"
                    class="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Fermer
                </button>
            </div>
        `;
    }

    console.log('✅ [scriptClosing] Module initialisé avec succès');

})();
