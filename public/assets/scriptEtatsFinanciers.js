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
        const dateFrom  = document.getElementById('rg-date-from')?.value;
        const dateTo    = document.getElementById('rg-date-to')?.value;
        const companyId = window.appState?.currentCompanyId;

        if (!dateFrom || !dateTo || dateFrom > dateTo) {
            NotificationManager.show('Période invalide.', 'warning');
            return;
        }

        NotificationManager.show('Génération du rapport de gestion...', 'info', 8000);

        try {
            const params = `companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
            const response = await apiFetch(`accounting/trial-balance-syscohada?${params}`, { method: 'GET' });
            if (response.status !== 'success') throw new Error(response.error || 'Erreur serveur');

            const accounts = response.data.accounts || [];
            const nbJours  = Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) + 1;
            const rapport  = computeRapportGestion(accounts, nbJours);
            const html     = renderRapportGestion(rapport, dateFrom, dateTo, nbJours);

            ModalManager.open('📊 Rapport de Gestion', html);
            NotificationManager.show('Rapport généré.', 'success');

        } catch (err) {
            console.error('❌ [loadRapportGestion]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
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
    function renderRapportGestion(r, dateFrom, dateTo, nbJours) {
        const f  = (n) => Math.round(n).toLocaleString('fr-FR') + ' F';
        const pct = (n) => n.toFixed(1) + ' %';
        const signCls = (n) => n >= 0 ? 'text-success' : 'text-danger';
        const signIcon = (n) => n >= 0 ? '▲' : '▼';

        const kpiCard = (label, value, sub = '', cls = '') => `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p class="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">${label}</p>
                <p class="text-lg font-black ${cls || signCls(value)}">${typeof value === 'number' ? f(value) : value}</p>
                ${sub ? `<p class="text-xs text-gray-400 mt-1">${sub}</p>` : ''}
            </div>`;

        const alertesHtml = r.alertes.map(a => {
            const cfg = {
                danger:  { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-danger',  icon: 'fas fa-exclamation-triangle text-danger' },
                warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-warning', icon: 'fas fa-exclamation-circle text-warning' },
                success: { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-success', icon: 'fas fa-check-circle text-success' },
            }[a.type];
            return `<div class="${cfg.bg} border-l-4 ${cfg.border} px-4 py-2 rounded-lg flex items-center gap-2">
                <i class="${cfg.icon} text-sm"></i>
                <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">${a.msg}</span>
            </div>`;
        }).join('');

        const row = (label, val, bold = false) => `
            <tr class="border-b border-gray-100 dark:border-gray-700">
                <td class="py-2 px-3 text-sm ${bold ? 'font-black' : 'text-gray-600 dark:text-gray-400'}">${label}</td>
                <td class="py-2 px-3 text-right font-mono text-sm ${bold ? 'font-black ' + signCls(val) : ''}">${f(val)}</td>
            </tr>`;

        return `
            <div class="space-y-6 text-sm">
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>Période : ${dateFrom} → ${dateTo} (${nbJours} jours)</span>
                    <span class="font-bold">SYSCOHADA — Rapport de Gestion</span>
                </div>

                ${r.alertes.length ? `
                <div class="space-y-2">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider">Alertes & Observations</p>
                    ${alertesHtml}
                </div>` : ''}

                <!-- BLOC 1 : TRÉSORERIE -->
                <div>
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-wallet mr-1"></i> Synthèse de Trésorerie
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        ${kpiCard('Trésorerie Nette', r.tresNette)}
                        ${kpiCard('Banques & CCP', r.tresBanque)}
                        ${kpiCard('Caisse', r.tresCaisse)}
                        ${kpiCard('Ratio Liquidité', r.liquidite !== null ? pct(r.liquidite * 100) : 'N/A', '', r.liquidite >= 1 ? 'text-success' : 'text-danger')}
                    </div>
                </div>

                <!-- BLOC 2 : COMPTE DE RÉSULTAT SIMPLIFIÉ -->
                <div>
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-chart-line mr-1"></i> Résultat Simplifié
                    </p>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <table class="w-full">
                            <tbody class="bg-white dark:bg-gray-800">
                                ${row("Chiffre d'Affaires", r.ca, true)}
                                ${row('Achats & Variation de stocks', -(r.achats + r.varStocks))}
                                ${row('Marge Brute', r.margeCommerciale, true)}
                                ${row('Charges de personnel', -r.personnel)}
                                ${row('Transports', -r.transports)}
                                ${row('Services extérieurs', -r.services)}
                                ${row('Impôts & taxes', -r.impots)}
                                ${row('Autres charges', -r.autresChg)}
                                ${row('EBITDA', r.ebitda, true)}
                                ${row('Dotations amortissements', -r.dotations)}
                                ${row('Résultat exploitation', r.resBrut, true)}
                                ${row('Charges financières', -r.chargesFin)}
                                ${row('Impôt sur le résultat', -r.impotRes)}
                                ${row('RÉSULTAT NET', r.resNet, true)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BLOC 3 : KPIs -->
                <div>
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-tachometer-alt mr-1"></i> Indicateurs de Performance
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        ${kpiCard('Taux de marge brute', pct(r.tauxMarge), '', r.tauxMarge > 20 ? 'text-success' : 'text-warning')}
                        ${kpiCard('Taux charges personnel', pct(r.tauxPersonnel), '', r.tauxPersonnel < 40 ? 'text-success' : 'text-warning')}
                        ${kpiCard('Point mort estimé', r.pointMort, 'CA nécessaire pour couvrir les charges')}
                        ${kpiCard('Délai recouvrement clients', Math.round(r.delaiClient) + ' j', '', r.delaiClient <= 30 ? 'text-success' : r.delaiClient <= 60 ? 'text-warning' : 'text-danger')}
                        ${kpiCard('Délai règlement fournisseurs', Math.round(r.delaiFourn) + ' j')}
                        ${kpiCard('Stocks', r.stocks)}
                    </div>
                </div>

                <!-- BLOC 4 : ENCOURS -->
                <div>
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-exchange-alt mr-1"></i> Postes Clés
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                        ${kpiCard('Encours Clients', r.clients, 'Comptes 411/412')}
                        ${kpiCard('Encours Fournisseurs', r.fournisseurs, 'Comptes 401/402')}
                    </div>
                </div>
            </div>`;
    }

