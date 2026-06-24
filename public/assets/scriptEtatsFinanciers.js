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
        ModalManager.open('📊 États Financiers SYSCOHADA', html);
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
        const companyId = window.appState?.currentCompanyId;

        if (!dateFrom || !dateTo) {
            NotificationManager?.show('Veuillez sélectionner une période.', 'warning');
            return;
        }
        if (dateFrom > dateTo) {
            NotificationManager?.show('La date de début doit être antérieure à la date de fin.', 'warning');
            return;
        }

        ModalManager.close();
        NotificationManager?.show('Génération des états financiers...', 'info', 8000);

        try {
            const params = `companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
            const response = await apiFetch(`syscohada/etats-complets?${params}`, { method: 'GET' });

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

            ModalManager.open(title, html);
            NotificationManager?.show('États financiers générés avec succès.', 'success');

        } catch (err) {
            console.error('❌ [loadEtatsFinanciers]', err);
            NotificationManager?.show(`Erreur : ${err.message}`, 'error');
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

    // =========================================================================
    // CARTE RAPPORT DE GESTION (USER + ADMIN/COLLAB)
    // =========================================================================
    window.generateRapportGestionCard = function () {
        const now  = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                <div class="flex items-start gap-4 mb-5">
                    <div class="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-chart-bar text-success text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Rapport de Gestion</h5>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Synthèse opérationnelle — trésorerie, résultat, KPIs et alertes automatiques.
                        </p>
                    </div>
                </div>

                <div class="space-y-3 mb-5">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Période</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.rapportGestionSetPeriode('mensuel', this)"
                                class="rg-periode-btn text-xs py-2 px-3 rounded-lg border-2 border-success bg-success/10 text-success font-bold transition-all">
                                Mensuel
                            </button>
                            <button onclick="window.rapportGestionSetPeriode('trimestriel', this)"
                                class="rg-periode-btn text-xs py-2 px-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold transition-all">
                                Trimestriel
                            </button>
                            <button onclick="window.rapportGestionSetPeriode('semestriel', this)"
                                class="rg-periode-btn text-xs py-2 px-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold transition-all">
                                Semestriel
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Date début</label>
                            <input type="date" id="rg-date-from" value="${year}-${month}-01"
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-success">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Date fin</label>
                            <input type="date" id="rg-date-to" value="${year}-${month}-${new Date(year, now.getMonth()+1, 0).getDate()}"
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-xs
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-success">
                        </div>
                    </div>
                </div>

                <button onclick="window.loadRapportGestion()"
                    class="w-full py-3 bg-success text-white font-black rounded-xl hover:bg-success/90 transition-colors flex items-center justify-center gap-2">
                    <i class="fas fa-play-circle"></i>
                    Générer le Rapport
                </button>
            </div>
        `;
    };

    // =========================================================================
    // GESTION DE LA PÉRIODE
    // =========================================================================
    window.rapportGestionSetPeriode = function (type, btn) {
        // Mise à jour visuelle des boutons
        document.querySelectorAll('.rg-periode-btn').forEach(b => {
            b.classList.remove('border-success', 'bg-success/10', 'text-success');
            b.classList.add('border-gray-200', 'dark:border-gray-600', 'text-gray-600', 'dark:text-gray-400');
        });
        btn.classList.add('border-success', 'bg-success/10', 'text-success');
        btn.classList.remove('border-gray-200', 'text-gray-600');

        const from = document.getElementById('rg-date-from');
        if (!from) return;
        const start = new Date(from.value);
        if (isNaN(start)) return;

        let end = new Date(start);
        if      (type === 'mensuel')     end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        else if (type === 'trimestriel') end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        else if (type === 'semestriel')  end = new Date(start.getFullYear(), start.getMonth() + 6, 0);

        const to = document.getElementById('rg-date-to');
        if (to) to.value = end.toISOString().split('T')[0];
    };

    // =========================================================================
    // CHARGEMENT DU RAPPORT
    // =========================================================================
        window.loadRapportGestion = async function () {
        const dateFrom    = document.getElementById('rg-date-from')?.value;
        const dateTo      = document.getElementById('rg-date-to')?.value;
        const companyId   = window.appState?.currentCompanyId;
        const companyName = window.appState?.currentCompanyName || 'Entreprise';
        if (!dateFrom || !dateTo || dateFrom > dateTo) {
            NotificationManager.show('Période invalide.', 'warning'); return;
        }
        NotificationManager.show('Génération du rapport...', 'info', 8000);
        try {
            const from  = new Date(dateFrom);
            const to    = new Date(dateTo);
            const diff  = to - from;
            const nbJours = Math.round(diff / 86400000) + 1;
            const prevTo   = new Date(from - 1);
            const prevFrom = new Date(prevTo - diff);
            const prev = {
                date_from: prevFrom.toISOString().split('T')[0],
                date_to:   prevTo.toISOString().split('T')[0]
            };
            const [respN, respN1] = await Promise.all([
                apiFetch('accounting/trial-balance-syscohada?companyId=' + companyId + '&date_from=' + dateFrom + '&date_to=' + dateTo, { method: 'GET' }),
                apiFetch('accounting/trial-balance-syscohada?companyId=' + companyId + '&date_from=' + prev.date_from + '&date_to=' + prev.date_to, { method: 'GET' })
            ]);
            if (respN.status !== 'success') throw new Error(respN.error || 'Erreur période N');
            const accountsN  = respN.data.accounts  || [];
            const accountsN1 = respN1.status === 'success' ? (respN1.data.accounts || []) : [];
            const rN  = computeRapportGestion(accountsN,  nbJours);
            const rN1 = computeRapportGestion(accountsN1, nbJours);
            const html = renderRapportGestion(rN, rN1, dateFrom, dateTo, prev, nbJours, companyName, accountsN);
            ModalManager.open('Rapport de Gestion', html);
            NotificationManager.show('Rapport généré.', 'success');
        } catch (err) {
            console.error('[loadRapportGestion]', err);
            NotificationManager.show('Erreur : ' + err.message, 'error');
        }
        // FIN — on stoppe ici, ancienne implémentation supprimée
        return;
        // ANCIEN CODE CI-DESSOUS IGNORÉ
        void 0;
    };

    // =========================================================================
    // CALCUL DU RAPPORT
    // =========================================================================
    function computeRapportGestion(accounts, nbJours) {
        const sum = (prefixes) => accounts
            .filter(a => prefixes.some(p => a.code.startsWith(p)))
            .reduce((s, a) => s + (a.debit - a.credit), 0);

        const sumAbs = (prefixes) => Math.abs(sum(prefixes));

        // Produits (crédit net)
        const ca = accounts
            .filter(a => a.code.startsWith('7'))
            .reduce((s, a) => s + (a.credit - a.debit), 0);

        // Charges
        const achats      = sumAbs(['601','602','604','605','608']);
        const varStocks   = sum(['6031','6032','6033']);
        const personnel   = sumAbs(['661','662','663','664','665','666','667','668']);
        const transports  = sumAbs(['61']);
        const services    = sumAbs(['62','63']);
        const impots      = sumAbs(['64']);
        const autresChg   = sumAbs(['65']);
        const dotations   = sumAbs(['681','691']);
        const chargesFin  = sumAbs(['67']);
        const impotRes    = sumAbs(['891']);

        const margeCommerciale = ca - achats - varStocks;
        const chargesExpl      = personnel + transports + services + impots + autresChg;
        const ebitda           = margeCommerciale - chargesExpl;
        const resBrut          = ebitda - dotations;
        const resFin           = -chargesFin;
        const resNet           = resBrut + resFin - impotRes;

        // Trésorerie
        const tresBanque = accounts.filter(a => a.code.startsWith('52') || a.code.startsWith('53'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresCaisse = accounts.filter(a => a.code.startsWith('57'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const tresNette  = tresBanque + tresCaisse;

        // Encours
        const clients      = accounts.filter(a => a.code.startsWith('411') || a.code.startsWith('412'))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const fournisseurs = accounts.filter(a => a.code.startsWith('401') || a.code.startsWith('402'))
            .reduce((s, a) => s + (a.credit - a.debit), 0);
        const stocks       = accounts.filter(a => /^3[1-8]/.test(a.code))
            .reduce((s, a) => s + (a.debit - a.credit), 0);
        const dettesCT     = accounts.filter(a => a.code.startsWith('4'))
            .reduce((s, a) => s + Math.max(0, a.credit - a.debit), 0);

        // KPIs
        const tauxMarge     = ca > 0 ? (margeCommerciale / ca * 100) : 0;
        const tauxPersonnel = ca > 0 ? (personnel / ca * 100) : 0;
        const pointMort     = tauxMarge > 0 ? (chargesExpl / (tauxMarge / 100)) : 0;
        const liquidite     = dettesCT > 0 ? (tresNette / dettesCT) : null;
        const delaiClient   = ca > 0 ? (clients / ca * nbJours) : 0;
        const delaiFourn    = achats > 0 ? (fournisseurs / achats * nbJours) : 0;

        // Alertes
        const alertes = [];
        if (tresNette < 0)                          alertes.push({ type: 'danger',  msg: 'Trésorerie nette négative' });
        else if (tresNette < ca * 0.05)             alertes.push({ type: 'warning', msg: 'Trésorerie tendue (< 5% du CA)' });
        if (tauxPersonnel > 50)                     alertes.push({ type: 'warning', msg: `Charges personnel élevées (${tauxPersonnel.toFixed(1)}% du CA)` });
        if (delaiClient > 60)                       alertes.push({ type: 'warning', msg: `Délai recouvrement clients > 60 jours (${Math.round(delaiClient)}j)` });
        if (resNet < 0)                             alertes.push({ type: 'danger',  msg: 'Résultat net déficitaire' });
        if (resNet > 0 && tauxMarge > 0)            alertes.push({ type: 'success', msg: 'Résultat net positif' });
        if (tauxMarge > 30)                         alertes.push({ type: 'success', msg: `Bonne marge brute (${tauxMarge.toFixed(1)}%)` });

        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes, margeCommerciale,
                 chargesExpl, ebitda, resBrut, resFin, resNet,
                 tresBanque, tresCaisse, tresNette, clients, fournisseurs,
                 stocks, dettesCT, tauxMarge, tauxPersonnel, pointMort,
                 liquidite, delaiClient, delaiFourn, alertes };
    }

    // =========================================================================
    // RENDU DU RAPPORT
    // =========================================================================
    function renderRapportGestion(r, rN1, dateFrom, dateTo, prev, nbJours, companyName, accountsN) {
        var f   = function(n) { if (n === null || n === undefined || isNaN(n)) return '—'; return Math.round(n).toLocaleString('fr-FR') + ' F'; };
        var pct = function(n) { return (n || 0).toFixed(1) + ' %'; };
        var sc  = function(n) { return (n || 0) >= 0 ? 'text-success' : 'text-danger'; };

        var kpi = function(label, value, sub, cls) {
            var s = sub || ''; var c = cls || '';
            return '<div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">'
                + '<p class="text-xs text-gray-500 uppercase font-bold mb-1">' + label + '</p>'
                + '<p class="text-base font-black ' + c + '">' + value + '</p>'
                + (s ? '<p class="text-xs text-gray-400 mt-1">' + s + '</p>' : '')
                + '</div>';
        };

        var rowRes = function(label, val, bold, showSign) {
            var b = bold || false; var s = showSign || false;
            var cls = b ? ('font-black' + (s ? ' ' + sc(val) : '')) : 'text-gray-600 dark:text-gray-400';
            var bg  = b ? 'bg-gray-50 dark:bg-gray-700/30' : '';
            return '<tr class="border-b border-gray-100 dark:border-gray-700 ' + bg + '">'
                + '<td class="px-3 py-2 text-sm ' + cls + '">' + label + '</td>'
                + '<td class="px-3 py-2 text-right font-mono text-sm ' + (b ? 'font-black ' + (s ? sc(val) : '') : '') + '">' + f(val) + '</td>'
                + '</tr>';
        };

        var rowN1 = function(label, n, n1) {
            var v = (n1 && n1 !== 0) ? ((n - n1) / Math.abs(n1) * 100) : null;
            var evol = v === null ? '<span class="text-gray-400">—</span>'
                : '<span class="' + (v >= 0 ? 'text-success' : 'text-danger') + ' font-bold">'
                  + (v >= 0 ? '▲' : '▼') + ' ' + Math.abs(v).toFixed(1) + '%</span>';
            var tend = v === null ? '→' : v > 5 ? '↑ Croissance' : v < -5 ? '↓ Dégradation' : '→ Stable';
            return '<tr class="border-b border-gray-100 dark:border-gray-700">'
                + '<td class="px-3 py-2 text-sm">' + label + '</td>'
                + '<td class="px-3 py-2 text-right font-mono text-sm font-bold ' + sc(n) + '">' + f(n) + '</td>'
                + '<td class="px-3 py-2 text-right font-mono text-sm text-gray-400">' + f(n1) + '</td>'
                + '<td class="px-3 py-2 text-right text-sm">' + evol + '</td>'
                + '<td class="px-3 py-2 text-center text-xs font-bold text-gray-500">' + tend + '</td>'
                + '</tr>';
        };

        var top5 = function(prefixes, sens) {
            return (accountsN || [])
                .filter(function(a) { return prefixes.some(function(p) { return a.code.startsWith(p); }); })
                .map(function(a) { return { code: a.code, name: a.name, val: sens === 'credit' ? (a.credit - a.debit) : (a.debit - a.credit) }; })
                .filter(function(a) { return a.val > 0; })
                .sort(function(a, b) { return b.val - a.val; })
                .slice(0, 5);
        };

        var rowTop = function(items) {
            if (!items.length) return '<tr><td colspan="2" class="px-3 py-2 text-gray-400 text-xs">Aucune donnée</td></tr>';
            return items.map(function(i) {
                return '<tr class="border-b border-gray-100 dark:border-gray-700">'
                    + '<td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">' + i.code + ' — ' + i.name + '</td>'
                    + '<td class="px-3 py-2 text-right text-xs font-mono font-bold">' + f(i.val) + '</td>'
                    + '</tr>';
            }).join('');
        };

        // Alertes
        var alertes = [];
        if (r.tresNette < 0)                     alertes.push({ t: 'danger',  m: 'Trésorerie nette négative' });
        else if (r.tresNette < r.ca * 0.05)      alertes.push({ t: 'warning', m: 'Trésorerie tendue (< 5% du CA)' });
        if (r.tauxPersonnel > 50)                 alertes.push({ t: 'warning', m: 'Charges personnel > 50% du CA : ' + pct(r.tauxPersonnel) });
        if (r.delaiClient > 60)                   alertes.push({ t: 'warning', m: 'Délai recouvrement clients : ' + Math.round(r.delaiClient) + ' jours' });
        if (r.resNet < 0)                         alertes.push({ t: 'danger',  m: 'Résultat net déficitaire' });
        if (r.resNet > 0)                         alertes.push({ t: 'success', m: 'Résultat net positif' });
        if (r.tauxMarge > 30)                     alertes.push({ t: 'success', m: 'Bonne marge brute : ' + pct(r.tauxMarge) });
        if (rN1.ca > 0 && r.ca < rN1.ca * 0.9)  alertes.push({ t: 'warning', m: 'CA en baisse > 10% vs période précédente' });

        var alertCfg = {
            danger:  { bg: 'bg-red-50',    border: 'border-danger',  icon: 'fas fa-exclamation-triangle text-danger' },
            warning: { bg: 'bg-yellow-50', border: 'border-warning', icon: 'fas fa-exclamation-circle text-warning' },
            success: { bg: 'bg-green-50',  border: 'border-success', icon: 'fas fa-check-circle text-success' }
        };

        var alertesHtml = alertes.map(function(a) {
            var c = alertCfg[a.t];
            return '<div class="' + c.bg + ' border-l-4 ' + c.border + ' px-4 py-2 rounded-lg flex items-center gap-2">'
                + '<i class="' + c.icon + ' text-sm flex-shrink-0"></i>'
                + '<span class="text-sm font-semibold text-gray-800">' + a.m + '</span>'
                + '</div>';
        }).join('');

        var tresSig = r.tresNette < 0 ? 'CRITIQUE' : r.tresNette < r.ca * 0.05 ? 'TENDUE' : 'POSITIVE';
        var tresCls = r.tresNette < 0 ? 'text-danger' : r.tresNette < r.ca * 0.05 ? 'text-warning' : 'text-success';

        var html = '<div id="rapport-gestion-print" class="space-y-6 text-sm">';

        // EN-TÊTE
        html += '<div class="flex items-center justify-between pb-4 border-b-2 border-primary">'
            + '<div class="flex items-center gap-4">'
            + '<img src="assets/LOGO_DOUKE.png" alt="Cabinet DOUKE" class="h-10 object-contain">'
            + '<div>'
            + '<p class="text-xs font-bold text-gray-500 uppercase">Cabinet DOUKE — Rapport de Gestion Périodique</p>'
            + '<p class="text-lg font-black text-gray-900 dark:text-white">' + companyName + '</p>'
            + '<p class="text-xs text-gray-500">Période : ' + dateFrom + ' → ' + dateTo + ' (' + nbJours + ' jours) • SYSCOHADA</p>'
            + '</div></div>'
            + '<div class="text-right no-print">'
            + '<button onclick="window.printRapportGestion()" class="text-xs bg-primary text-white px-4 py-2 rounded-lg font-bold">'
            + '<i class="fas fa-print mr-1"></i> Imprimer / PDF</button>'
            + '</div></div>';

        // BLOC 6 : ALERTES
        if (alertes.length) {
            html += '<div class="mb-4">'
                + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-bell mr-1"></i> Alertes & Observations</p>'
                + '<div class="space-y-2">' + alertesHtml + '</div>'
                + '</div>';
        }

        // BLOC 1 : TRÉSORERIE
        html += '<div class="mb-4">'
            + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-wallet mr-1"></i> Bloc 1 — Synthèse de Trésorerie</p>'
            + '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">'
            + kpi('Trésorerie Nette', f(r.tresNette), 'Signal : <span class="' + tresCls + ' font-black">' + tresSig + '</span>', sc(r.tresNette))
            + kpi('Variation Nette', f(r.varTres), 'Encaiss. − Décaiss.', sc(r.varTres))
            + kpi('Encaissements', f(r.encaissements), 'Flux entrants', 'text-success')
            + kpi('Décaissements', f(r.decaissements), 'Flux sortants', 'text-danger')
            + kpi('Banques & CCP', f(r.tresBanque), 'Comptes 52x/53x')
            + kpi('Caisse', f(r.tresCaisse), 'Comptes 57x')
            + kpi('Dettes Court Terme', f(r.dettesCT), 'Comptes 40x/43x/44x')
            + kpi('Ratio Liquidité', r.liquidite !== null ? pct(r.liquidite * 100) : 'N/A', 'Tréso / Dettes CT', r.liquidite === null ? '' : r.liquidite >= 1 ? 'text-success' : 'text-danger')
            + '</div></div>';

        // BLOC 2 : RÉSULTAT SIMPLIFIÉ
        html += '<div class="mb-4">'
            + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-chart-line mr-1"></i> Bloc 2 — Compte de Résultat Simplifié</p>'
            + '<div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">'
            + '<table class="w-full text-sm"><tbody class="bg-white dark:bg-gray-800">'
            + rowRes("Chiffre d'Affaires", r.ca, true)
            + rowRes('Achats & Variation de stocks', -(r.achats + r.varStocks))
            + rowRes('MARGE BRUTE', r.margeBrute, true, true)
            + rowRes('Charges de personnel', -r.personnel)
            + rowRes('Transports', -r.transports)
            + rowRes('Services extérieurs', -r.services)
            + rowRes('Impôts & taxes', -r.impots)
            + rowRes('Autres charges', -r.autresChg)
            + rowRes('EBITDA', r.ebitda, true, true)
            + rowRes('Dotations amortissements', -r.dotations)
            + rowRes("RÉSULTAT D'EXPLOITATION", r.resExpl, true, true)
            + rowRes('Charges financières', -r.chargesFin)
            + rowRes('Impôt sur le résultat', -r.impotRes)
            + rowRes('RÉSULTAT NET', r.resNet, true, true)
            + '</tbody></table></div></div>';

        // BLOC 3 : KPIs
        html += '<div class="mb-4">'
            + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-tachometer-alt mr-1"></i> Bloc 3 — Indicateurs de Performance</p>'
            + '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">'
            + kpi('Taux Marge Brute', pct(r.tauxMarge), 'Marge / CA', r.tauxMarge > 20 ? 'text-success' : 'text-warning')
            + kpi('Taux Charges Personnel', pct(r.tauxPersonnel), 'Personnel / CA', r.tauxPersonnel < 40 ? 'text-success' : 'text-warning')
            + kpi('Point Mort Estimé', f(r.pointMort), 'CA min pour couvrir charges fixes')
            + kpi('Délai Recouvrement Clients', Math.round(r.delaiClient) + ' j', 'Comptes 41x', r.delaiClient <= 30 ? 'text-success' : r.delaiClient <= 60 ? 'text-warning' : 'text-danger')
            + kpi('Délai Règlement Fournisseurs', Math.round(r.delaiFourn) + ' j', 'Comptes 40x')
            + kpi('Stocks', f(r.stocks), 'Comptes 31x–38x')
            + '</div></div>';

        // BLOC 4 : COMPARATIF N-1
        html += '<div class="mb-4">'
            + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-exchange-alt mr-1"></i> Bloc 4 — Évolution vs Période Précédente <span class="text-gray-400 font-normal">(' + prev.date_from + ' → ' + prev.date_to + ')</span></p>'
            + '<div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">'
            + '<table class="w-full text-sm">'
            + '<thead class="bg-gray-50 dark:bg-gray-700"><tr>'
            + '<th class="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">Indicateur</th>'
            + '<th class="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Période N</th>'
            + '<th class="px-3 py-2 text-right text-xs font-bold text-gray-400 uppercase">Période N-1</th>'
            + '<th class="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Évolution</th>'
            + '<th class="px-3 py-2 text-center text-xs font-bold text-gray-500 uppercase">Tendance</th>'
            + '</tr></thead>'
            + '<tbody class="bg-white dark:bg-gray-800">'
            + rowN1("Chiffre d'Affaires", r.ca, rN1.ca)
            + rowN1('Marge Brute', r.margeBrute, rN1.margeBrute)
            + rowN1("Résultat d'Exploitation", r.resExpl, rN1.resExpl)
            + rowN1('Résultat Net', r.resNet, rN1.resNet)
            + rowN1('Trésorerie Nette', r.tresNette, rN1.tresNette)
            + rowN1('Encours Clients', r.clients, rN1.clients)
            + rowN1('Encours Fournisseurs', r.fournisseurs, rN1.fournisseurs)
            + '</tbody></table></div></div>';

        // BLOC 5 : POSTES CLÉS
        html += '<div class="mb-4">'
            + '<p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3"><i class="fas fa-list-ol mr-1"></i> Bloc 5 — Analyse des Postes Clés</p>'
            + '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">'
            + '<div><p class="text-xs font-bold text-success mb-2">Top 5 Comptes de Produits</p>'
            + '<div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"><table class="w-full"><tbody class="bg-white dark:bg-gray-800">'
            + rowTop(top5(['7'], 'credit'))
            + '</tbody></table></div></div>'
            + '<div><p class="text-xs font-bold text-danger mb-2">Top 5 Comptes de Charges</p>'
            + '<div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"><table class="w-full"><tbody class="bg-white dark:bg-gray-800">'
            + rowTop(top5(['6'], 'debit'))
            + '</tbody></table></div></div></div>'
            + '<div class="grid grid-cols-3 gap-3">'
            + kpi('Encours Clients', f(r.clients), 'Comptes 411/412/416/418')
            + kpi('Encours Fournisseurs', f(r.fournisseurs), 'Comptes 401/402/404/405')
            + kpi('Stocks', f(r.stocks), 'Comptes 31x–38x')
            + '</div></div>';

        // PIED DE PAGE
        html += '<div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 text-center">'
            + '<p class="text-xs text-gray-400">Généré le ' + new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR') + ' par Cabinet DOUKE — Doukè Compta Pro</p>'
            + '<p class="text-xs text-gray-400 mt-1">Document de gestion interne — Non substitut aux états financiers officiels certifiés.</p>'
            + '</div>';

        html += '</div>';
        return html;
    }

    window.printRapportGestion = function() {
        var el = document.getElementById('rapport-gestion-print')
               || document.getElementById('modal-body')
               || document.querySelector('.modal-content');
        if (!el) { alert('Contenu du rapport introuvable. Veuillez g\u00e9n\u00e9rer le rapport avant d\'imprimer.'); return; }
        var origin = window.location.origin;
        var body = el.innerHTML
            .replace(/class="[^"]*no-print[^"]*"/g, 'style="display:none"')
            .replace(/onclick="[^"]*"/g, '')
            .replace(/src="assets\//g, 'src="' + origin + '/assets/');
        var css = '@page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }'
            + '* { box-sizing: border-box; margin: 0; padding: 0; }'
            + 'body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; width: 210mm; max-width: 210mm; }'
            + 'table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }'
            + 'th { background: #e8f0fe; font-size: 8pt; font-weight: 700; text-transform: uppercase; padding: 5px 7px; text-align: left; border: 1px solid #c5cae9; color: #1a237e; }'
            + 'td { padding: 4px 7px; border-bottom: 1px solid #e8e8e8; font-size: 9pt; vertical-align: top; }'
            + 'tr:nth-child(even) td { background: #f8f9fa; }'
            + '.text-success { color: #1e8e3e !important; } .text-danger { color: #d93025 !important; } .text-warning { color: #f29900 !important; }'
            + '.font-black { font-weight: 900 !important; } .font-bold { font-weight: 700 !important; }'
            + '.text-right { text-align: right !important; } .text-center { text-align: center !important; }'
            + '.grid { display: grid; gap: 8px; }'
            + '.grid-cols-2 { grid-template-columns: repeat(2,1fr); }'
            + '.grid-cols-3 { grid-template-columns: repeat(3,1fr); }'
            + '.grid-cols-4 { grid-template-columns: repeat(4,1fr); }'
            + '.border { border: 1px solid #e0e0e0; } .rounded-xl { border-radius: 4px; }'
            + '.overflow-hidden { overflow: hidden; } .w-full { width: 100%; }'
            + '.bg-gray-50 { background: #f8f9fa !important; } .p-4 { padding: 8px; } .p-3 { padding: 6px; }'
            + '.mb-6 { margin-bottom: 14px; } .mb-4 { margin-bottom: 10px; } .mb-3 { margin-bottom: 7px; } .mb-2 { margin-bottom: 5px; }'
            + '.mt-4 { margin-top: 10px; } .mt-2 { margin-top: 5px; } .mt-1 { margin-top: 3px; }'
            + '.space-y-2 > * + * { margin-top: 5px; } .space-y-4 > * + * { margin-top: 10px; } .space-y-6 > * + * { margin-top: 14px; }'
            + '.flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }'
            + '.gap-2 { gap: 6px; } .gap-3 { gap: 8px; } .gap-4 { gap: 12px; }'
            + '.border-l-4 { border-left-width: 4px; border-left-style: solid; }'
            + '.px-4 { padding-left: 10px; padding-right: 10px; } .py-2 { padding-top: 4px; padding-bottom: 4px; }'
            + '.border-danger { border-color: #d93025 !important; } .bg-red-50 { background: #fef2f2 !important; }'
            + '.border-warning { border-color: #f29900 !important; } .bg-yellow-50 { background: #fffbeb !important; }'
            + '.border-success { border-color: #1e8e3e !important; } .bg-green-50 { background: #f0fdf4 !important; }'
            + '.bg-blue-50 { background: #eff6ff !important; } .border-blue-400 { border-color: #60a5fa !important; }'
            + '.text-xs { font-size: 7.5pt; } .text-sm { font-size: 8.5pt; } .text-base { font-size: 10pt; } .text-lg { font-size: 12pt; } .text-xl { font-size: 14pt; } .text-2xl { font-size: 16pt; }'
            + '.uppercase { text-transform: uppercase; } .tracking-wider { letter-spacing: 0.04em; }'
            + '.font-mono { font-family: monospace; }'
            + '.border-b-2 { border-bottom: 2px solid #1a73e8; } .pb-4 { padding-bottom: 10px; } .pt-4 { padding-top: 10px; }'
            + '.border-t { border-top: 1px solid #e0e0e0; }'
            + '.shadow-lg, .shadow-md, .shadow { box-shadow: none !important; }'
            + '.rounded-2xl { border-radius: 4px; } .rounded-lg { border-radius: 4px; }'
            + 'img { max-height: 50px; object-fit: contain; }'
            + 'button { display: none !important; }'
            + '.md\\:grid-cols-4 { grid-template-columns: repeat(4,1fr); }'
            + '.md\\:grid-cols-3 { grid-template-columns: repeat(3,1fr); }'
            + '.md\\:grid-cols-2 { grid-template-columns: repeat(2,1fr); }'
            + '@media print {'
            + '  @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }'
            + '  body { width: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }'
            + '  thead { display: table-header-group; }'
            + '  tfoot { display: table-footer-group; }'
            + '  tr { page-break-inside: avoid; }'
            + '  table { page-break-inside: auto; }'
            + '  .page-break { page-break-before: always; }'
            + '  .no-break { page-break-inside: avoid; }'
            + '}';
        var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport de Gestion</title><style>' + css + '</style></head><body>' + body + '</body></html>';
        var w = window.open('', '_blank', 'width=1000,height=800');
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        setTimeout(function() { w.print(); }, 1000);
    };
