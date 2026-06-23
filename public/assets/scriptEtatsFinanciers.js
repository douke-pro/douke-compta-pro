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
    function pct(n) { return (n || 0).toFixed(1) + ' %'; }
    function signCls(n) { return (n || 0) >= 0 ? 'text-success' : 'text-danger'; }
    function isAdminOrCollab() {
        const r = (window.appState?.user?.profile || '').toUpperCase();
        return r === 'ADMIN' || r === 'COLLABORATEUR';
    }
    function calcPrevPeriode(dateFrom, dateTo) {
        const from = new Date(dateFrom);
        const to   = new Date(dateTo);
        const diff = to - from;
        const prevTo   = new Date(from - 1);
        const prevFrom = new Date(prevTo - diff);
        return {
            date_from: prevFrom.toISOString().split('T')[0],
            date_to:   prevTo.toISOString().split('T')[0]
        };
    }

    // =========================================================================
    // CARTE RAPPORT DE GESTION
    // =========================================================================
    window.generateRapportGestionCard = function () {
        const now   = new Date();
        const year  = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        return `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                <div class="flex items-start gap-4 mb-5">
                    <div class="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-chart-bar text-success text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h5 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Rapport de Gestion</h5>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Synthèse opérationnelle — trésorerie, résultat, KPIs, comparatif N-1 et alertes.
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
                            <input type="date" id="rg-date-to" value="${year}-${month}-${lastDay}"
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
            </div>`;
    };

    // =========================================================================
    // SÉLECTEUR DE PÉRIODE
    // =========================================================================
    window.rapportGestionSetPeriode = function (type, btn) {
        document.querySelectorAll('.rg-periode-btn').forEach(b => {
            b.classList.remove('border-success', 'bg-success/10', 'text-success');
            b.classList.add('border-gray-200', 'text-gray-600');
        });
        btn.classList.add('border-success', 'bg-success/10', 'text-success');
        btn.classList.remove('border-gray-200', 'text-gray-600');
        const from = document.getElementById('rg-date-from');
        if (!from || isNaN(new Date(from.value))) return;
        const start = new Date(from.value);
        let end = new Date(start);
        if      (type === 'mensuel')     end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        else if (type === 'trimestriel') end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        else if (type === 'semestriel')  end = new Date(start.getFullYear(), start.getMonth() + 6, 0);
        const to = document.getElementById('rg-date-to');
        if (to) to.value = end.toISOString().split('T')[0];
    };

    // =========================================================================
    // CHARGEMENT RAPPORT (2 appels parallèles : N + N-1)
    // =========================================================================
    window.loadRapportGestion = async function () {
        const dateFrom  = document.getElementById('rg-date-from')?.value;
        const dateTo    = document.getElementById('rg-date-to')?.value;
        const companyId = window.appState?.currentCompanyId;
        const companyName = window.appState?.currentCompanyName || 'Entreprise';

        if (!dateFrom || !dateTo || dateFrom > dateTo) {
            NotificationManager.show('Période invalide.', 'warning');
            return;
        }

        NotificationManager.show('Génération du rapport de gestion...', 'info', 8000);

        try {
            const prev = calcPrevPeriode(dateFrom, dateTo);
            const nbJours = Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) + 1;

            const [respN, respN1] = await Promise.all([
                apiFetch(`accounting/trial-balance-syscohada?companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`, { method: 'GET' }),
                apiFetch(`accounting/trial-balance-syscohada?companyId=${companyId}&date_from=${prev.date_from}&date_to=${prev.date_to}`, { method: 'GET' })
            ]);

            if (respN.status !== 'success') throw new Error(respN.error || 'Erreur période N');

            const accountsN  = respN.data.accounts  || [];
            const accountsN1 = respN1.status === 'success' ? (respN1.data.accounts || []) : [];

            const rapportN  = computeRapportGestion(accountsN,  nbJours);
            const rapportN1 = computeRapportGestion(accountsN1, nbJours);

            const html = renderRapportGestion(rapportN, rapportN1, dateFrom, dateTo, prev, nbJours, companyName, accountsN);
            ModalManager.open('📊 Rapport de Gestion', html);
            NotificationManager.show('Rapport généré avec succès.', 'success');

        } catch (err) {
            console.error('❌ [loadRapportGestion]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    // =========================================================================
    // CALCUL
    // =========================================================================
    function computeRapportGestion(accounts, nbJours) {
        const sumNet = (prefixes, sens = 'debit') => accounts
            .filter(a => prefixes.some(p => a.code.startsWith(p)))
            .reduce((s, a) => s + (sens === 'debit' ? (a.debit - a.credit) : (a.credit - a.debit)), 0);

        const ca         = Math.max(0, sumNet(['7'], 'credit'));
        const achats     = Math.max(0, sumNet(['601','602','604','605','608'], 'debit'));
        const varStocks  = sumNet(['6031','6032','6033'], 'debit');
        const personnel  = Math.max(0, sumNet(['661','662','663','664','665','666','667','668'], 'debit'));
        const transports = Math.max(0, sumNet(['61'], 'debit'));
        const services   = Math.max(0, sumNet(['62','63'], 'debit'));
        const impots     = Math.max(0, sumNet(['64'], 'debit'));
        const autresChg  = Math.max(0, sumNet(['65'], 'debit'));
        const dotations  = Math.max(0, sumNet(['681','691'], 'debit'));
        const chargesFin = Math.max(0, sumNet(['67'], 'debit'));
        const impotRes   = Math.max(0, sumNet(['891'], 'debit'));

        const margeBrute   = ca - achats - varStocks;
        const chargesExpl  = personnel + transports + services + impots + autresChg;
        const ebitda       = margeBrute - chargesExpl;
        const resExpl      = ebitda - dotations;
        const resNet       = resExpl - chargesFin - impotRes;

        const encaissements = Math.max(0, sumNet(['5'], 'debit'));
        const decaissements = Math.max(0, sumNet(['5'], 'credit'));
        const tresBanque    = sumNet(['521','522','531','532'], 'debit');
        const tresCaisse    = sumNet(['571','572'], 'debit');
        const tresNette     = tresBanque + tresCaisse;
        const varTres       = encaissements - decaissements;

        const clients      = Math.max(0, sumNet(['411','412','416','418'], 'debit'));
        const fournisseurs = Math.max(0, sumNet(['401','402','404','405','408'], 'credit'));
        const stocks       = Math.max(0, sumNet(['31','32','33','34','35','36','37','38'], 'debit'));
        const dettesCT     = Math.max(0, sumNet(['40','43','44','45','46'], 'credit'));

        const tauxMarge     = ca > 0 ? (margeBrute / ca * 100) : 0;
        const tauxPersonnel = ca > 0 ? (personnel / ca * 100) : 0;
        const chargesFixes  = personnel + transports + services + impots + autresChg + dotations;
        const pointMort     = tauxMarge > 0 ? (chargesFixes / (tauxMarge / 100)) : 0;
        const liquidite     = dettesCT > 0 ? (tresNette / dettesCT) : null;
        const delaiClient   = ca > 0 ? (clients / ca * nbJours) : 0;
        const delaiFourn    = achats > 0 ? (fournisseurs / achats * nbJours) : 0;

        return { ca, achats, varStocks, personnel, transports, services, impots,
                 autresChg, dotations, chargesFin, impotRes, margeBrute,
                 chargesExpl, ebitda, resExpl, resNet,
                 encaissements, decaissements, tresBanque, tresCaisse, tresNette, varTres,
                 clients, fournisseurs, stocks, dettesCT,
                 tauxMarge, tauxPersonnel, pointMort, liquidite, delaiClient, delaiFourn };
    }

    // =========================================================================
    // RENDU COMPLET
    // =========================================================================
    function renderRapportGestion(r, rN1, dateFrom, dateTo, prev, nbJours, companyName, accountsN) {
        const varPct = (n, n1) => {
            if (!n1 || n1 === 0) return '—';
            const v = ((n - n1) / Math.abs(n1) * 100);
            const cls = v >= 0 ? 'text-success' : 'text-danger';
            const icon = v >= 0 ? '▲' : '▼';
            return `<span class="${cls} font-bold">${icon} ${Math.abs(v).toFixed(1)}%</span>`;
        };
        const tendance = (n, n1) => {
            if (!n1) return '→ Stable';
            const v = (n - n1) / Math.abs(n1) * 100;
            if (v > 5)  return '↑ Croissance';
            if (v < -5) return '↓ Dégradation';
            return '→ Stable';
        };

        // Alertes
        const alertes = [];
        if (r.tresNette < 0)                 alertes.push({ t: 'danger',  m: 'Trésorerie nette négative' });
        else if (r.tresNette < r.ca * 0.05)  alertes.push({ t: 'warning', m: 'Trésorerie tendue (< 5% du CA)' });
        if (r.tauxPersonnel > 50)             alertes.push({ t: 'warning', m: `Charges personnel élevées : ${pct(r.tauxPersonnel)} du CA` });
        if (r.delaiClient > 60)              alertes.push({ t: 'warning', m: `Délai recouvrement clients : ${Math.round(r.delaiClient)} jours` });
        if (r.resNet < 0)                    alertes.push({ t: 'danger',  m: 'Résultat net déficitaire' });
        if (r.resNet > 0)                    alertes.push({ t: 'success', m: 'Résultat net positif' });
        if (r.tauxMarge > 30)                alertes.push({ t: 'success', m: `Bonne marge brute : ${pct(r.tauxMarge)}` });
        if (rN1.ca > 0 && r.ca < rN1.ca * 0.9) alertes.push({ t: 'warning', m: `CA en baisse > 10% vs période précédente` });

        const alertCfg = {
            danger:  { bg: 'bg-red-50',    border: 'border-danger',  icon: 'fas fa-exclamation-triangle text-danger' },
            warning: { bg: 'bg-yellow-50', border: 'border-warning', icon: 'fas fa-exclamation-circle text-warning' },
            success: { bg: 'bg-green-50',  border: 'border-success', icon: 'fas fa-check-circle text-success' },
        };

        // Top 5 produits / charges
        const top5 = (prefixe, sens) => accountsN
            .filter(a => prefixe.some(p => a.code.startsWith(p)))
            .map(a => ({ code: a.code, name: a.name, val: sens === 'credit' ? (a.credit - a.debit) : (a.debit - a.credit) }))
            .filter(a => a.val > 0)
            .sort((a, b) => b.val - a.val)
            .slice(0, 5);

        const top5Produits = top5(['7'], 'credit');
        const top5Charges  = top5(['6'], 'debit');

        const rowTop = (items) => items.length === 0
            ? '<tr><td colspan="2" class="px-3 py-2 text-gray-400 text-xs">Aucune donnée</td></tr>'
            : items.map(i => `
                <tr class="border-b border-gray-100 dark:border-gray-700">
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">${i.code} — ${i.name}</td>
                    <td class="px-3 py-2 text-right text-xs font-mono font-bold">${fmt(i.val)}</td>
                </tr>`).join('');

        const rowResult = (label, val, bold = false, showSign = false) => {
            const cls = bold ? `font-black ${showSign ? signCls(val) : ''}` : 'text-gray-600 dark:text-gray-400';
            return `
                <tr class="border-b border-gray-100 dark:border-gray-700 ${bold ? 'bg-gray-50 dark:bg-gray-700/30' : ''}">
                    <td class="px-3 py-2 text-sm ${cls}">${label}</td>
                    <td class="px-3 py-2 text-right font-mono text-sm ${cls}">${fmt(val)}</td>
                </tr>`;
        };

        const kpi = (label, value, sub = '', cls = '') => `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">${label}</p>
                <p class="text-base font-black ${cls}">${value}</p>
                ${sub ? `<p class="text-xs text-gray-400 mt-1">${sub}</p>` : ''}
            </div>`;

        // Signal trésorerie
        let tresSig, tresSigCls;
        if (r.tresNette < 0)               { tresSig = 'CRITIQUE';  tresSigCls = 'text-danger'; }
        else if (r.tresNette < r.ca * 0.05){ tresSig = 'TENDUE';    tresSigCls = 'text-warning'; }
        else                                { tresSig = 'POSITIVE';  tresSigCls = 'text-success'; }

        return `
            <style>
                @media print {
                    body * { visibility: hidden !important; }
                    #rapport-gestion-print, #rapport-gestion-print * { visibility: visible !important; }
                    #rapport-gestion-print { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    body { font-size: 11px; }
                }
            </style>

            <div id="rapport-gestion-print">
                <!-- EN-TÊTE IMPRESSION -->
                <div class="flex items-center justify-between mb-6 pb-4 border-b-2 border-primary">
                    <div class="flex items-center gap-4">
                        <img src="assets/LOGO_DOUKE.png" alt="Cabinet DOUKE" class="h-12 object-contain">
                        <div>
                            <p class="text-xs font-bold text-gray-500 uppercase">Cabinet DOUKE — Rapport de Gestion</p>
                            <p class="text-lg font-black text-gray-900 dark:text-white">${companyName}</p>
                            <p class="text-xs text-gray-500">Période : ${dateFrom} → ${dateTo} (${nbJours} jours)</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-400">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                        <p class="text-xs text-gray-400">SYSCOHADA — Système Normal</p>
                        <button onclick="window.printRapportGestion()" 
                            class="no-print mt-2 text-xs bg-primary text-white px-3 py-1 rounded-lg font-bold hover:bg-primary-dark">
                            <i class="fas fa-print mr-1"></i> Imprimer
                        </button>
                    </div>
                </div>

                <!-- BLOC 6 : ALERTES -->
                ${alertes.length ? `
                <div class="mb-6">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-bell mr-1"></i> Alertes & Observations
                    </p>
                    <div class="grid grid-cols-1 gap-2">
                        ${alertes.map(a => `
                            <div class="${alertCfg[a.t].bg} border-l-4 ${alertCfg[a.t].border} px-4 py-2 rounded-lg flex items-center gap-2">
                                <i class="${alertCfg[a.t].icon} text-sm"></i>
                                <span class="text-sm font-semibold text-gray-800">${a.m}</span>
                            </div>`).join('')}
                    </div>
                </div>` : ''}

                <!-- BLOC 1 : TRÉSORERIE -->
                <div class="mb-6">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-wallet mr-1"></i> Bloc 1 — Synthèse de Trésorerie
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${kpi('Trésorerie Nette', fmt(r.tresNette), `Signal : <span class="${tresSigCls} font-black">${tresSig}</span>`, signCls(r.tresNette))}
                        ${kpi('Encaissements', fmt(r.encaissements), 'Flux entrants période', 'text-success')}
                        ${kpi('Décaissements', fmt(r.decaissements), 'Flux sortants période', 'text-danger')}
                        ${kpi('Variation Nette', fmt(r.varTres), 'Encaiss. − Décaiss.', signCls(r.varTres))}
                        ${kpi('Banques & CCP', fmt(r.tresBanque), 'Comptes 52x/53x')}
                        ${kpi('Caisse', fmt(r.tresCaisse), 'Comptes 57x')}
                        ${kpi('Ratio Liquidité', r.liquidite !== null ? pct(r.liquidite * 100) : 'N/A', 'Tréso / Dettes CT', r.liquidite === null ? '' : r.liquidite >= 1 ? 'text-success' : 'text-danger')}
                        ${kpi('Dettes Court Terme', fmt(r.dettesCT), 'Comptes 40x/43x/44x')}
                    </div>
                </div>

                <!-- BLOC 2 : RÉSULTAT SIMPLIFIÉ -->
                <div class="mb-6">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-chart-line mr-1"></i> Bloc 2 — Compte de Résultat Simplifié
                    </p>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <table class="w-full text-sm">
                            <tbody class="bg-white dark:bg-gray-800">
                                ${rowResult("Chiffre d'Affaires", r.ca, true)}
                                ${rowResult('Achats & Variation de stocks', -(r.achats + r.varStocks))}
                                ${rowResult('MARGE BRUTE', r.margeBrute, true, true)}
                                ${rowResult('Charges de personnel', -r.personnel)}
                                ${rowResult('Transports', -r.transports)}
                                ${rowResult('Services extérieurs', -r.services)}
                                ${rowResult('Impôts & taxes', -r.impots)}
                                ${rowResult('Autres charges exploitation', -r.autresChg)}
                                ${rowResult('EBITDA', r.ebitda, true, true)}
                                ${rowResult('Dotations amortissements', -r.dotations)}
                                ${rowResult("RÉSULTAT D'EXPLOITATION", r.resExpl, true, true)}
                                ${rowResult('Charges financières', -r.chargesFin)}
                                ${rowResult('Impôt sur le résultat', -r.impotRes)}
                                ${rowResult('RÉSULTAT NET', r.resNet, true, true)}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BLOC 3 : KPIs -->
                <div class="mb-6 page-break">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-tachometer-alt mr-1"></i> Bloc 3 — Indicateurs de Performance
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        ${kpi('Taux Marge Brute', pct(r.tauxMarge), '', r.tauxMarge > 20 ? 'text-success' : 'text-warning')}
                        ${kpi('Taux Charges Personnel', pct(r.tauxPersonnel), '', r.tauxPersonnel < 40 ? 'text-success' : 'text-warning')}
                        ${kpi('Point Mort Estimé', fmt(r.pointMort), 'CA min pour couvrir charges fixes')}
                        ${kpi('Délai Recouvrement Clients', Math.round(r.delaiClient) + ' j', 'Comptes 41x', r.delaiClient <= 30 ? 'text-success' : r.delaiClient <= 60 ? 'text-warning' : 'text-danger')}
                        ${kpi('Délai Règlement Fournisseurs', Math.round(r.delaiFourn) + ' j', 'Comptes 40x')}
                        ${kpi('Stocks', fmt(r.stocks), 'Comptes 31x–38x')}
                    </div>
                </div>

                <!-- BLOC 4 : COMPARATIF N-1 -->
                <div class="mb-6">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-exchange-alt mr-1"></i> Bloc 4 — Évolution vs Période Précédente
                        <span class="text-gray-400 font-normal ml-2">(${prev.date_from} → ${prev.date_to})</span>
                    </p>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">Indicateur</th>
                                    <th class="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">N</th>
                                    <th class="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">N-1</th>
                                    <th class="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase">Évolution</th>
                                    <th class="px-3 py-2 text-center text-xs font-bold text-gray-500 uppercase">Tendance</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-gray-800">
                                ${[
                                    ["Chiffre d'Affaires", r.ca, rN1.ca],
                                    ['Marge Brute', r.margeBrute, rN1.margeBrute],
                                    ["Résultat d'Exploitation", r.resExpl, rN1.resExpl],
                                    ['Résultat Net', r.resNet, rN1.resNet],
                                    ['Trésorerie Nette', r.tresNette, rN1.tresNette],
                                    ['Encours Clients', r.clients, rN1.clients],
                                    ['Encours Fournisseurs', r.fournisseurs, rN1.fournisseurs],
                                ].map(([label, n, n1]) => `
                                    <tr class="border-b border-gray-100 dark:border-gray-700">
                                        <td class="px-3 py-2 text-sm">${label}</td>
                                        <td class="px-3 py-2 text-right font-mono text-sm font-bold ${signCls(n)}">${fmt(n)}</td>
                                        <td class="px-3 py-2 text-right font-mono text-sm text-gray-400">${fmt(n1)}</td>
                                        <td class="px-3 py-2 text-right text-sm">${varPct(n, n1)}</td>
                                        <td class="px-3 py-2 text-center text-xs font-bold text-gray-600">${tendance(n, n1)}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BLOC 5 : POSTES CLÉS -->
                <div class="mb-6 page-break">
                    <p class="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                        <i class="fas fa-list-ol mr-1"></i> Bloc 5 — Analyse des Postes Clés
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-bold text-success mb-2">Top 5 Comptes de Produits</p>
                            <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table class="w-full"><tbody class="bg-white dark:bg-gray-800">${rowTop(top5Produits)}</tbody></table>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-danger mb-2">Top 5 Comptes de Charges</p>
                            <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table class="w-full"><tbody class="bg-white dark:bg-gray-800">${rowTop(top5Charges)}</tbody></table>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3 mt-4">
                        ${kpi('Encours Clients', fmt(r.clients), 'Comptes 411/412/416/418')}
                        ${kpi('Encours Fournisseurs', fmt(r.fournisseurs), 'Comptes 401/402/404/405')}
                        ${kpi('Stocks', fmt(r.stocks), 'Comptes 31x–38x')}
                    </div>
                </div>

                <!-- PIED DE PAGE -->
                <div class="border-t border-gray-200 pt-4 mt-6 text-center">
                    <p class="text-xs text-gray-400">
                        Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} 
                        par Cabinet DOUKE — Doukè Compta Pro • SYSCOHADA Système Normal
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                        Ce rapport est un document de gestion interne. Non substitut aux états financiers officiels.
                    </p>
                </div>
            </div>`;
    }

    // =========================================================================
    // IMPRESSION
    // =========================================================================
    window.printRapportGestion = function () {
        window.print();
    };

    // =========================================================================
    // ÉTATS FINANCIERS SYSCOHADA (ADMIN/COLLAB)
    // =========================================================================
    window.handleOpenBalanceSheet = function () {
        if (!isAdminOrCollab()) {
            window.openRequestFinancialReportsModal?.();
            return;
        }
        const now  = new Date();
        const year = now.getFullYear();
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
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de début</label>
                        <input type="date" id="ef-date-from" value="${year}-01-01"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de fin</label>
                        <input type="date" id="ef-date-to" value="${year}-12-31"
                            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">État à afficher</label>
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
                    <i class="fas fa-chart-pie mr-2"></i>Générer les États Financiers
                </button>
            </div>`;
        ModalManager.open('📊 États Financiers SYSCOHADA', html);
    };

    window.handleOpenReportModal = function () {
        window.handleOpenBalanceSheet();
    };

    window.loadEtatsFinanciers = async function () {
        const dateFrom  = document.getElementById('ef-date-from')?.value;
        const dateTo    = document.getElementById('ef-date-to')?.value;
        const type      = document.querySelector('input[name="ef-type"]:checked')?.value || 'bilan';
        const companyId = window.appState?.currentCompanyId;
        if (!dateFrom || !dateTo) { NotificationManager.show('Veuillez sélectionner une période.', 'warning'); return; }
        if (dateFrom > dateTo)    { NotificationManager.show('Date début > date fin.', 'warning'); return; }
        ModalManager.close();
        NotificationManager.show('Génération des états financiers...', 'info', 8000);
        try {
            const params   = `companyId=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
            const response = await apiFetch(`syscohada/etats-complets?${params}`, { method: 'GET' });
            if (response.status !== 'success') throw new Error(response.error || 'Erreur serveur');
            const data = response.data;
            const year = new Date(dateTo).getFullYear();
            let html = '', title = '';
            if      (type === 'bilan') { title = `📊 Bilan SYSCOHADA — ${year}`;              html = renderBilan(data.bilan, data.meta); }
            else if (type === 'cr')    { title = `📈 Compte de Résultat SYSCOHADA — ${year}`; html = renderCR(data.compte_resultat, data.meta); }
            else                       { title = `💧 TFT SYSCOHADA — ${year}`;                html = renderTFT(data.tft, data.meta); }
            ModalManager.open(title, html);
            NotificationManager.show('États financiers générés.', 'success');
        } catch (err) {
            console.error('❌ [loadEtatsFinanciers]', err);
            NotificationManager.show(`Erreur : ${err.message}`, 'error');
        }
    };

    function renderBilan(bilan, meta) {
        const eq = meta.equilibre
            ? `<span class="text-success font-bold"><i class="fas fa-check-circle mr-1"></i>Bilan équilibré</span>`
            : `<span class="text-danger font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Écart : ${fmt(meta.ecart_bilan)}</span>`;
        const rowA = l => {
            const cls = l.isTotal ? 'bg-primary/10 font-black text-primary uppercase' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `<tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                <td class="px-3 py-2 font-mono text-xs font-bold">${l.ref}</td>
                <td class="px-3 py-2 text-sm">${l.libelle}</td>
                <td class="px-3 py-2 text-right font-mono text-sm">${l.brut ? fmt(l.brut) : '—'}</td>
                <td class="px-3 py-2 text-right font-mono text-sm text-danger">${l.amort ? fmt(l.amort) : '—'}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${signCls(l.net)}">${fmt(l.net)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm text-gray-400">${fmt(l.net_n1)}</td>
            </tr>`;
        };
        const rowP = l => {
            const cls = l.isTotal ? 'bg-secondary/10 font-black text-secondary uppercase' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `<tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                <td class="px-3 py-2 font-mono text-xs font-bold">${l.ref}</td>
                <td class="px-3 py-2 text-sm">${l.libelle}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${signCls(l.net)}">${fmt(l.net)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm text-gray-400">${fmt(l.net_n1)}</td>
            </tr>`;
        };
        return `<div class="space-y-4">
            <div class="flex justify-between text-sm px-1"><span class="text-gray-500">${meta.date_from} → ${meta.date_to}</span>${eq}</div>
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Réf</th>
                            <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">ACTIF</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Brut N</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-danger uppercase">Amort</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net N</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Net N-1</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800">${(bilan.actif||[]).map(rowA).join('')}</tbody>
                    <tfoot class="bg-success/10"><tr class="font-black text-success">
                        <td class="px-3 py-3 font-mono text-xs">BZ</td>
                        <td class="px-3 py-3 uppercase">TOTAL GÉNÉRAL ACTIF</td>
                        <td colspan="2"></td>
                        <td class="px-3 py-3 text-right font-mono">${fmt(bilan.totaux?.total_actif)}</td>
                        <td></td>
                    </tr></tfoot>
                </table>
            </div>
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Réf</th>
                            <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">PASSIF</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net N</th>
                            <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Net N-1</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800">${(bilan.passif||[]).map(rowP).join('')}</tbody>
                    <tfoot class="bg-success/10"><tr class="font-black text-success">
                        <td class="px-3 py-3 font-mono text-xs">DZ</td>
                        <td class="px-3 py-3 uppercase">TOTAL GÉNÉRAL PASSIF</td>
                        <td class="px-3 py-3 text-right font-mono">${fmt(bilan.totaux?.total_passif)}</td>
                        <td></td>
                    </tr></tfoot>
                </table>
            </div>
        </div>`;
    }

    function renderCR(cr, meta) {
        const badge = cr.resultat_net >= 0
            ? `<span class="bg-success/20 text-success font-black px-3 py-1 rounded-full text-sm">Bénéfice : ${fmt(cr.resultat_net)}</span>`
            : `<span class="bg-danger/20 text-danger font-black px-3 py-1 rounded-full text-sm">Déficit : ${fmt(Math.abs(cr.resultat_net))}</span>`;
        const row = l => {
            const cls = l.isTotal ? 'bg-primary/10 font-black text-primary uppercase' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `<tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                <td class="px-3 py-2 font-mono text-xs font-bold">${l.ref}</td>
                <td class="px-3 py-2 text-xs text-center text-gray-400">${l.sens||''}</td>
                <td class="px-3 py-2 text-sm">${l.libelle}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${signCls(l.montant_n)}">${fmt(l.montant_n)}</td>
                <td class="px-3 py-2 text-right font-mono text-sm text-gray-400">${fmt(l.montant_n1)}</td>
            </tr>`;
        };
        return `<div class="space-y-4">
            <div class="flex justify-between text-sm px-1"><span class="text-gray-500">${meta.date_from} → ${meta.date_to}</span>${badge}</div>
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0"><tr>
                        <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Réf</th>
                        <th class="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Sens</th>
                        <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                        <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant N</th>
                        <th class="px-3 py-3 text-right text-xs font-bold text-gray-400 uppercase">Montant N-1</th>
                    </tr></thead>
                    <tbody class="bg-white dark:bg-gray-800">${(cr.lignes||[]).map(row).join('')}</tbody>
                </table>
            </div>
        </div>`;
    }

    function renderTFT(tft, meta) {
        const zh = tft.tresorerie_finale || 0;
        const badge = zh >= 0
            ? `<span class="bg-success/20 text-success font-black px-3 py-1 rounded-full text-sm">Trésorerie : ${fmt(zh)}</span>`
            : `<span class="bg-danger/20 text-danger font-black px-3 py-1 rounded-full text-sm">Trésorerie négative : ${fmt(zh)}</span>`;
        const row = l => {
            const cls = l.isTotal ? 'bg-info/10 font-black text-info uppercase' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
            return `<tr class="border-b border-gray-100 dark:border-gray-700 ${cls}">
                <td class="px-3 py-2 font-mono text-xs font-bold">${l.ref}</td>
                <td class="px-3 py-2 text-xs text-center text-gray-400">${l.sens||''}</td>
                <td class="px-3 py-2 text-sm">${l.libelle}</td>
                <td class="px-3 py-2 text-right font-mono text-sm font-bold ${signCls(l.montant_n)}">${fmt(l.montant_n)}</td>
            </tr>`;
        };
        return `<div class="space-y-4">
            <div class="flex justify-between text-sm px-1"><span class="text-gray-500">${meta.date_from} → ${meta.date_to}</span>${badge}</div>
            <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0"><tr>
                        <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Réf</th>
                        <th class="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase">Sens</th>
                        <th class="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase">Libellé</th>
                        <th class="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase">Montant N</th>
                    </tr></thead>
                    <tbody class="bg-white dark:bg-gray-800">${(tft.lignes||[]).map(row).join('')}</tbody>
                </table>
            </div>
        </div>`;
    }

    console.log('✅ [scriptEtatsFinanciers] Module chargé v2');
})();
