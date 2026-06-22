'use strict';

(function () {
    if (typeof window.appState === 'undefined') {
        console.error('❌ [scriptEtatsFinanciers] script.js doit être chargé AVANT !');
        return;
    }

    // =========================================================================
    // UTILITAIRES
    // =========================================================================
    function fmt(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        return Math.round(n).toLocaleString('fr-FR') + ' F';
    }

    function fmtClass(n) {
        if (!n || n === 0) return 'text-gray-400';
        return n > 0 ? 'text-gray-900 dark:text-white' : 'text-danger';
    }

    function getCompanyId() { return window.appState.currentCompanyId; }
    function getRole()      { return window.appState.user?.profile; }
    function isAdminOrCollab() {
        const r = getRole();
        return r === 'ADMIN' || r === 'COLLABORATEUR';
    }

    // =========================================================================
    // MODAL SÉLECTEUR DE PÉRIODE
    // =========================================================================
    window.handleOpenBalanceSheet = function () {
        if (!isAdminOrCollab()) {
            window.openRequestFinancialReportsModal?.();
            return;
        }
        const now   = new Date();
        const year  = now.getFullYear();
        const defFrom = `${year}-01-01`;
        const defTo   = `${year}-12-31`;

        const html = `
            <div class="space-y-6 p-2">
                <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-info p-4 rounded-lg">
                    <p class="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                        <i class="fas fa-info-circle mr-2"></i>
                        États financiers SYSCOHADA — Système Normal avec comparatif N/N-1
                    </p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Date de début
                        </label>
                        <input type="date" id="ef-date-from" value="${defFrom}"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Date de fin
                        </label>
                        <input type="date" id="ef-date-to" value="${defTo}"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        État à afficher
                    </label>
                    <div class="grid grid-cols-3 gap-3">
                        <label class="flex items-center gap-2 p-3 border-2 border-primary bg-primary/10 rounded-xl cursor-pointer">
                            <input type="radio" name="ef-type" value="bilan" checked class="text-primary">
                            <span class="text-sm font-bold text-primary">Bilan</span>
                        </label>
                        <label class="flex items-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary">
                            <input type="radio" name="ef-type" value="cr" class="text-primary">
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Compte de Résultat</span>
                        </label>
                        <label class="flex items-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary">
                            <input type="radio" name="ef-type" value="tft" class="text-primary">
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">TFT</span>
                        </label>
                    </div>
                </div>
                <button onclick="window.loadEtatsFinanciers()"
                    class="w-full py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-colors">
                    <i class="fas fa-chart-pie mr-2"></i>
                    Générer les États Financiers
                </button>
            </div>
        `;
        window.ModalManager.open('📊 États Financiers SYSCOHADA', html);
    };

    // Brancher aussi les deux autres cartes sur la même modal
    window.handleOpenReportModal = function (reportId, title) {
        if (!isAdminOrCollab()) {
            window.openRequestFinancialReportsModal?.();
            return;
        }
        window.handleOpenBalanceSheet();
    };

    // =========================================================================
    // CHARGEMENT ET DISPATCH
    // =========================================================================
    window.loadEtatsFinanciers = async function () {
        const dateFrom = document.getElementById('ef-date-from')?.value;
        const dateTo   = document.getElementById('ef-date-to')?.value;
        const type     = document.querySelector('input[name="ef-type"]:checked')?.value || 'bilan';
        const companyId = getCompanyId();

        if (!dateFrom || !dateTo) {
            window.NotificationManager?.show('Veuillez sélectionner une période.', 'warning');
            return;
        }
        if (dateFrom > dateTo) {
            window.NotificationManager?.show('La date de début doit être antérieure à la date de fin.', 'warning');
            return;
        }

        window.ModalManager.close();
        window.NotificationManager?.show('Génération des états financiers...', 'info', 8000);

        try {
            const params = `companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
            const response = await window.apiFetch(`syscohada/etats-complets?${params}`, { method: 'GET' });

            if (response.status !== 'success') throw new Error(response.error || 'Erreur serveur');

            const data = response.data;
            const year = new Date(dateTo).getFullYear();
            let html = '', title = '';

            if (type === 'bilan') {
                title = `📊 Bilan SYSCOHADA — Exercice ${year}`;
                html  = renderBilan(data.bilan, data.meta);
            } else if (type === 'cr') {
                title = `📈 Compte de Résultat SYSCOHADA — Exercice ${year}`;
                html  = renderCR(data.compte_resultat, data.meta);
            } else {
                title = `💧 Tableau des Flux de Trésorerie — Exercice ${year}`;
                html  = renderTFT(data.tft, data.meta);
            }

            window.ModalManager.open(title, html);
            window.NotificationManager?.show('États financiers générés avec succès.', 'success');

        } catch (err) {
            console.error('❌ [loadEtatsFinanciers]', err);
            window.NotificationManager?.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // RENDERER — BILAN
    // =========================================================================
    function renderBilan(bilan, meta) {
        const equilibreHtml = meta.equilibre
            ? `<span class="text-success font-bold"><i class="fas fa-check-circle mr-1"></i>Bilan équilibré</span>`
            : `<span class="text-danger font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Écart : ${fmt(meta.ecart_bilan)}</span>`;

        const rowActif = (l) => {
            const cls = l.isTotal
                ? 'bg-primary/10 font-black text-primary uppercase'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `
                <tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                    <td class="px-3 py-2 font-mono text-xs font-bold w-10">${l.ref}</td>
                    <td class="px-3 py-2 text-sm ${l.isTotal ? 'font-black' : ''}">${l.libelle}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono ${l.isTotal ? 'font-black' : ''}">${l.brut ? fmt(l.brut) : '—'}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono text-danger">${l.amort ? fmt(l.amort) : '—'}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono font-bold ${fmtClass(l.net)}">${fmt(l.net)}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono text-gray-400">${fmt(l.net_n1)}</td>
                </tr>`;
        };

        const rowPassif = (l) => {
            const cls = l.isTotal
                ? 'bg-secondary/10 font-black text-secondary uppercase'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `
                <tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                    <td class="px-3 py-2 font-mono text-xs font-bold w-10">${l.ref}</td>
                    <td class="px-3 py-2 text-sm ${l.isTotal ? 'font-black' : ''}">${l.libelle}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono font-bold ${fmtClass(l.net)}">${fmt(l.net)}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono text-gray-400">${fmt(l.net_n1)}</td>
                </tr>`;
        };

        const theadActif = `
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                    <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">Réf</th>
                    <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">ACTIF</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Brut N</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-danger uppercase">Amort/Dép</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net N</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Net N-1</th>
                </tr>
            </thead>`;

        const theadPassif = `
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                    <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">Réf</th>
                    <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">PASSIF</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net N</th>
                    <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Net N-1</th>
                </tr>
            </thead>`;

        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between text-sm px-1">
                    <span class="text-gray-500">Période : ${meta.date_from} → ${meta.date_to}</span>
                    ${equilibreHtml}
                </div>

                <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table class="min-w-full text-sm">
                        ${theadActif}
                        <tbody class="bg-white dark:bg-gray-800">
                            ${(bilan.actif || []).map(rowActif).join('')}
                        </tbody>
                        <tfoot class="bg-success/10">
                            <tr class="font-black text-success">
                                <td class="px-3 py-3 font-mono text-xs">BZ</td>
                                <td class="px-3 py-3 uppercase">TOTAL GÉNÉRAL ACTIF</td>
                                <td colspan="2"></td>
                                <td class="px-3 py-3 text-right font-mono">${fmt(bilan.totaux?.total_actif)}</td>
                                <td class="px-3 py-3 text-right font-mono text-gray-400"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table class="min-w-full text-sm">
                        ${theadPassif}
                        <tbody class="bg-white dark:bg-gray-800">
                            ${(bilan.passif || []).map(rowPassif).join('')}
                        </tbody>
                        <tfoot class="bg-success/10">
                            <tr class="font-black text-success">
                                <td class="px-3 py-3 font-mono text-xs">DZ</td>
                                <td class="px-3 py-3 uppercase">TOTAL GÉNÉRAL PASSIF</td>
                                <td class="px-3 py-3 text-right font-mono">${fmt(bilan.totaux?.total_passif)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
    }

    // =========================================================================
    // RENDERER — COMPTE DE RÉSULTAT
    // =========================================================================
    function renderCR(cr, meta) {
        const resultatNet = cr.resultat_net || 0;
        const badge = resultatNet >= 0
            ? `<span class="bg-success/20 text-success font-black px-3 py-1 rounded-full text-sm">Bénéfice : ${fmt(resultatNet)}</span>`
            : `<span class="bg-danger/20 text-danger font-black px-3 py-1 rounded-full text-sm">Déficit : ${fmt(Math.abs(resultatNet))}</span>`;

        const row = (l) => {
            const cls = l.isTotal
                ? 'bg-primary/10 font-black text-primary uppercase'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `
                <tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                    <td class="px-3 py-2 font-mono text-xs font-bold w-10">${l.ref}</td>
                    <td class="px-3 py-2 text-xs text-center w-8 text-gray-400">${l.sens || ''}</td>
                    <td class="px-3 py-2 text-sm ${l.isTotal ? 'font-black' : ''}">${l.libelle}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono font-bold ${fmtClass(l.montant_n)}">${fmt(l.montant_n)}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono text-gray-400">${fmt(l.montant_n1)}</td>
                </tr>`;
        };

        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between text-sm px-1">
                    <span class="text-gray-500">Période : ${meta.date_from} → ${meta.date_to}</span>
                    ${badge}
                </div>
                <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">Réf</th>
                                <th class="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase w-8">Sens</th>
                                <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant N</th>
                                <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Montant N-1</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800">
                            ${(cr.lignes || []).map(row).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    // =========================================================================
    // RENDERER — TFT
    // =========================================================================
    function renderTFT(tft, meta) {
        const tresFin = tft.tresorerie_finale || 0;
        const badge = tresFin >= 0
            ? `<span class="bg-success/20 text-success font-black px-3 py-1 rounded-full text-sm">Trésorerie finale : ${fmt(tresFin)}</span>`
            : `<span class="bg-danger/20 text-danger font-black px-3 py-1 rounded-full text-sm">Trésorerie négative : ${fmt(tresFin)}</span>`;

        const row = (l) => {
            const cls = l.isTotal
                ? 'bg-info/10 font-black text-info uppercase'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `
                <tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                    <td class="px-3 py-2 font-mono text-xs font-bold w-10">${l.ref}</td>
                    <td class="px-3 py-2 text-xs text-center w-8 text-gray-400">${l.sens || ''}</td>
                    <td class="px-3 py-2 text-sm ${l.isTotal ? 'font-black' : ''}">${l.libelle}</td>
                    <td class="px-3 py-2 text-right text-sm font-mono font-bold ${fmtClass(l.montant_n)}">${fmt(l.montant_n)}</td>
                </tr>`;
        };

        return `
            <div class="space-y-4">
                <div class="flex items-center justify-between text-sm px-1">
                    <span class="text-gray-500">Période : ${meta.date_from} → ${meta.date_to}</span>
                    ${badge}
                </div>
                <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">Réf</th>
                                <th class="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase w-8">Sens</th>
                                <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                                <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant N</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800">
                            ${(tft.lignes || []).map(row).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    console.log('✅ [scriptEtatsFinanciers] Module chargé');
})();
