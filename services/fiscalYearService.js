// =============================================================================
// FICHIER : services/fiscalYearService.js
// Description : Snapshot des soldes de clôture + calcul des à-nouveaux N+1
// Version     : V1.0
// Dépendances : odooService.js, dbService.js (pg pool)
// Appelé par  : closingController.js → finalizeClosing()
// =============================================================================

'use strict';

const { odooExecuteKw, ADMIN_UID_INT } = require('./odooService');
const pool = require('./dbService');

// =============================================================================
// CONSTANTES
// =============================================================================

// Classes de comptes de BILAN → solde reporté en à-nouveau N+1
const BILAN_CLASSES = [1, 2, 3, 4, 5];

// Classes de comptes de GESTION → remis à zéro en N+1
const GESTION_CLASSES = [6, 7];

// =============================================================================
// HELPER : Extraire la classe d'un code compte
// Ex: '601000' → 6  |  '101100' → 1  |  '52' → 5
// =============================================================================
function extractAccountClass(code) {
    if (!code || typeof code !== 'string') return null;
    const firstChar = parseInt(code.charAt(0), 10);
    return isNaN(firstChar) ? null : firstChar;
}

// =============================================================================
// HELPER : Récupérer tous les soldes depuis Odoo pour un exercice
// Utilise la même logique que getSyscohadaTrialBalance (accountingController.js)
// =============================================================================
async function fetchOdooBalances(companyId, fiscalYear) {
    const yearStart = `${fiscalYear}-01-01`;
    const yearEnd   = `${fiscalYear}-12-31`;

    console.log(`📊 [fiscalYearService] Récupération soldes Odoo — Company ${companyId} — ${fiscalYear}`);

    // ── 1. Liste de tous les comptes de l'entreprise ──────────────────────────
    const accounts = await odooExecuteKw({
        uid    : ADMIN_UID_INT,
        model  : 'account.account',
        method : 'search_read',
        args   : [[['company_ids', 'in', [companyId]]]],
        kwargs : {
            fields  : ['id', 'code', 'name', 'account_type'],
            context : { allowed_company_ids: [companyId] }
        }
    });

    if (!accounts || accounts.length === 0) {
        throw new Error(`Aucun compte trouvé pour la company ${companyId} dans Odoo.`);
    }

    console.log(`   ✅ ${accounts.length} comptes récupérés`);

    // ── 2. Lignes d'ouverture (avant le 01/01/N) ─────────────────────────────
    const openingLines = await odooExecuteKw({
        uid    : ADMIN_UID_INT,
        model  : 'account.move.line',
        method : 'search_read',
        args   : [[
            ['company_id',   '=', companyId],
            ['parent_state', '=', 'posted'],
            ['date',         '<', yearStart]
        ]],
        kwargs : {
            fields  : ['account_id', 'debit', 'credit'],
            context : { allowed_company_ids: [companyId] }
        }
    });

    console.log(`   ✅ ${openingLines.length} lignes d'ouverture`);

    // ── 3. Lignes de la période (01/01/N → 31/12/N) ──────────────────────────
    const periodLines = await odooExecuteKw({
        uid    : ADMIN_UID_INT,
        model  : 'account.move.line',
        method : 'search_read',
        args   : [[
            ['company_id',   '=', companyId],
            ['parent_state', '=', 'posted'],
            ['date', '>=', yearStart],
            ['date', '<=', yearEnd]
        ]],
        kwargs : {
            fields  : ['account_id', 'debit', 'credit'],
            context : { allowed_company_ids: [companyId] }
        }
    });

    console.log(`   ✅ ${periodLines.length} lignes de période`);

    // ── 4. Consolidation par compte ───────────────────────────────────────────
    const consolidated = {};

    // Initialisation avec tous les comptes
    accounts.forEach(acc => {
        consolidated[acc.id] = {
            account_code   : acc.code,
            account_name   : acc.name,
            account_type   : acc.account_type || '',
            account_class  : extractAccountClass(acc.code),
            opening_debit  : 0,
            opening_credit : 0,
            period_debit   : 0,
            period_credit  : 0,
        };
    });

    // Cumul ouverture
    openingLines.forEach(line => {
        const id = line.account_id?.[0];
        if (!id || !consolidated[id]) return;
        consolidated[id].opening_debit  += line.debit  || 0;
        consolidated[id].opening_credit += line.credit || 0;
    });

    // Cumul période
    periodLines.forEach(line => {
        const id = line.account_id?.[0];
        if (!id || !consolidated[id]) return;
        consolidated[id].period_debit  += line.debit  || 0;
        consolidated[id].period_credit += line.credit || 0;
    });

    // ── 5. Calcul des soldes de clôture ───────────────────────────────────────
    const balances = Object.values(consolidated)
        .filter(acc => acc.account_class !== null)
        .map(acc => {
            const closing_debit  = acc.opening_debit  + acc.period_debit;
            const closing_credit = acc.opening_credit + acc.period_credit;
            const net_balance    = closing_debit - closing_credit;

            return {
                ...acc,
                closing_debit,
                closing_credit,
                net_balance
            };
        })
        // Ne conserver que les comptes ayant eu du mouvement
        .filter(acc =>
            acc.opening_debit  > 0 || acc.opening_credit > 0 ||
            acc.period_debit   > 0 || acc.period_credit  > 0
        )
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    console.log(`   ✅ ${balances.length} comptes avec solde non nul`);

    return balances;
}

// =============================================================================
// FONCTION PRINCIPALE : Snapshot de clôture
// Appelée par finalizeClosing() dans closingController.js
// =============================================================================
async function snapshotFiscalYearBalances(companyId, fiscalYear, performedBy) {
    console.log('='.repeat(70));
    console.log(`📸 [snapshotFiscalYearBalances] DÉBUT — Company ${companyId} — Exercice ${fiscalYear}`);
    console.log('='.repeat(70));

    const snapshotDate = `${fiscalYear}-12-31`;
    const client       = await pool.connect();

    try {
        // ── 1. Récupération des soldes depuis Odoo ────────────────────────────
        const balances = await fetchOdooBalances(companyId, fiscalYear);

        if (balances.length === 0) {
            console.warn(`⚠️ [snapshotFiscalYearBalances] Aucun solde à snapshoter pour ${fiscalYear}`);
            return { success: true, count: 0, warning: 'Aucun solde trouvé' };
        }

        // ── 2. Transaction atomique ───────────────────────────────────────────
        await client.query('BEGIN');

        // Invalider les snapshots précédents éventuels (cas de re-finalisation)
        await client.query(
            `UPDATE fiscal_year_balances
             SET is_valid       = FALSE,
                 invalidated_at = NOW(),
                 invalidated_by = $1
             WHERE company_id  = $2
               AND fiscal_year = $3
               AND is_valid    = TRUE`,
            [performedBy, companyId, fiscalYear]
        );

        // ── 3. Insertion en masse (UPSERT) ────────────────────────────────────
        // Utilisation de VALUES multiples pour performance (évite N requêtes)
        const values  = [];
        const params  = [];
        let   counter = 1;

        balances.forEach(acc => {
            values.push(`(
                $${counter++}, $${counter++}, $${counter++}, $${counter++},
                $${counter++}, $${counter++}, $${counter++}, $${counter++},
                $${counter++}, $${counter++}, $${counter++}, $${counter++},
                $${counter++}, $${counter++}
            )`);

            params.push(
                companyId,
                fiscalYear,
                acc.account_code,
                acc.account_name,
                acc.account_class,
                acc.account_type,
                acc.opening_debit,
                acc.opening_credit,
                acc.period_debit,
                acc.period_credit,
                acc.closing_debit,
                acc.closing_credit,
                acc.net_balance,
                snapshotDate
            );
        });

        const insertSQL = `
            INSERT INTO fiscal_year_balances
                (company_id, fiscal_year, account_code, account_name,
                 account_class, account_type,
                 opening_debit, opening_credit,
                 period_debit, period_credit,
                 closing_debit, closing_credit,
                 net_balance, snapshot_date)
            VALUES ${values.join(', ')}
            ON CONFLICT (company_id, fiscal_year, account_code)
            DO UPDATE SET
                account_name   = EXCLUDED.account_name,
                account_class  = EXCLUDED.account_class,
                account_type   = EXCLUDED.account_type,
                opening_debit  = EXCLUDED.opening_debit,
                opening_credit = EXCLUDED.opening_credit,
                period_debit   = EXCLUDED.period_debit,
                period_credit  = EXCLUDED.period_credit,
                closing_debit  = EXCLUDED.closing_debit,
                closing_credit = EXCLUDED.closing_credit,
                net_balance    = EXCLUDED.net_balance,
                snapshot_date  = EXCLUDED.snapshot_date,
                snapshotted_by = $${counter++},
                snapshotted_at = NOW(),
                is_valid       = TRUE,
                invalidated_at = NULL,
                invalidated_by = NULL
        `;

        params.push(performedBy);

        await client.query(insertSQL, params);
        await client.query('COMMIT');

        console.log(`✅ [snapshotFiscalYearBalances] ${balances.length} comptes sauvegardés`);
        console.log('='.repeat(70));

        return {
            success      : true,
            count        : balances.length,
            fiscal_year  : fiscalYear,
            snapshot_date: snapshotDate
        };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('🚨 [snapshotFiscalYearBalances] ERREUR:', err.message);
        console.error('   Stack:', err.stack);
        console.log('='.repeat(70));

        // On throw pour que finalizeClosing() soit informé
        throw new Error(`Échec snapshot soldes de clôture : ${err.message}`);

    } finally {
        client.release();
    }
}

// =============================================================================
// INVALIDATION DU SNAPSHOT : Appelée lors d'un unlock
// Marque le snapshot comme invalide — force un re-snapshot à la re-finalisation
// =============================================================================
async function invalidateSnapshot(companyId, fiscalYear, performedBy) {
    try {
        const result = await pool.queryWithRetry(
            `UPDATE fiscal_year_balances
             SET is_valid       = FALSE,
                 invalidated_at = NOW(),
                 invalidated_by = $1
             WHERE company_id  = $2
               AND fiscal_year = $3
               AND is_valid    = TRUE
             RETURNING id`,
            [performedBy, companyId, fiscalYear]
        );

        const count = result.rows.length;
        console.log(`⚠️ [invalidateSnapshot] ${count} soldes invalidés — Exercice ${fiscalYear} — ${performedBy}`);

        return { success: true, invalidated: count };

    } catch (err) {
        console.error('🚨 [invalidateSnapshot] Erreur:', err.message);
        return { success: false, error: err.message };
    }
}

// =============================================================================
// LECTURE DES SOLDES N-1 : Pour les états financiers comparatifs
// Retourne les soldes valides de l'exercice précédent
// =============================================================================
async function getPreviousYearBalances(companyId, fiscalYear) {
    const previousYear = fiscalYear - 1;

    try {
        const result = await pool.queryWithRetry(
            `SELECT
                account_code,
                account_name,
                account_class,
                account_type,
                opening_debit,
                opening_credit,
                period_debit,
                period_credit,
                closing_debit,
                closing_credit,
                net_balance,
                snapshot_date
             FROM fiscal_year_balances
             WHERE company_id  = $1
               AND fiscal_year = $2
               AND is_valid    = TRUE
             ORDER BY account_code`,
            [companyId, previousYear]
        );

        console.log(`📖 [getPreviousYearBalances] ${result.rows.length} comptes N-1 (${previousYear}) pour company ${companyId}`);

        return {
            success     : true,
            fiscal_year : previousYear,
            count       : result.rows.length,
            data        : result.rows,
            // Indique si le snapshot N-1 existe et est valide
            has_snapshot: result.rows.length > 0
        };

    } catch (err) {
        console.error('🚨 [getPreviousYearBalances] Erreur:', err.message);
        return {
            success     : false,
            fiscal_year : previousYear,
            count       : 0,
            data        : [],
            has_snapshot: false,
            error       : err.message
        };
    }
}

// =============================================================================
// CALCUL DES À-NOUVEAUX N+1 : Pour l'affichage et les rapports
// Ne crée PAS d'écriture dans Odoo (Option A — Supabase uniquement)
// Retourne les soldes d'ouverture de N+1 calculés depuis le snapshot N
// =============================================================================
async function computeOpeningBalances(companyId, fiscalYear) {
    const nextYear = fiscalYear + 1;

    try {
        // Lecture du snapshot de clôture N
        const result = await pool.queryWithRetry(
            `SELECT
                account_code,
                account_name,
                account_class,
                account_type,
                closing_debit,
                closing_credit,
                net_balance
             FROM fiscal_year_balances
             WHERE company_id  = $1
               AND fiscal_year = $2
               AND is_valid    = TRUE
             ORDER BY account_code`,
            [companyId, fiscalYear]
        );

        if (result.rows.length === 0) {
            return {
                success      : false,
                error        : `Aucun snapshot valide trouvé pour l'exercice ${fiscalYear}. Clôturez d'abord l'exercice ${fiscalYear}.`,
                fiscal_year  : fiscalYear,
                opening_year : nextYear,
                bilan        : [],
                gestion      : []
            };
        }

        const bilanAccounts   = [];
        const gestionAccounts = [];

        result.rows.forEach(acc => {
            const cls = acc.account_class;

            if (BILAN_CLASSES.includes(cls)) {
                // Comptes de bilan : le solde de clôture N devient l'ouverture N+1
                bilanAccounts.push({
                    account_code    : acc.account_code,
                    account_name    : acc.account_name,
                    account_class   : cls,
                    opening_debit   : acc.closing_debit,
                    opening_credit  : acc.closing_credit,
                    net_balance     : acc.net_balance,
                    type            : 'report_a_nouveau'
                });
            } else if (GESTION_CLASSES.includes(cls)) {
                // Comptes de gestion : remis à zéro
                gestionAccounts.push({
                    account_code    : acc.account_code,
                    account_name    : acc.account_name,
                    account_class   : cls,
                    opening_debit   : 0,
                    opening_credit  : 0,
                    net_balance     : 0,
                    previous_balance: acc.net_balance,
                    type            : 'remise_a_zero'
                });
            }
        });

        // Totaux pour vérification d'équilibre
        const totalBilanDebit  = bilanAccounts.reduce((s, a) => s + parseFloat(a.opening_debit),  0);
        const totalBilanCredit = bilanAccounts.reduce((s, a) => s + parseFloat(a.opening_credit), 0);

        console.log(`📊 [computeOpeningBalances] Exercice ${nextYear}`);
        console.log(`   Comptes bilan   : ${bilanAccounts.length} (D: ${totalBilanDebit.toFixed(2)} / C: ${totalBilanCredit.toFixed(2)})`);
        console.log(`   Comptes gestion : ${gestionAccounts.length} → remis à zéro`);

        return {
            success        : true,
            fiscal_year    : fiscalYear,
            opening_year   : nextYear,
            bilan          : bilanAccounts,
            gestion        : gestionAccounts,
            totals         : {
                bilan_debit   : totalBilanDebit,
                bilan_credit  : totalBilanCredit,
                equilibre     : Math.abs(totalBilanDebit - totalBilanCredit) < 0.01
            }
        };

    } catch (err) {
        console.error('🚨 [computeOpeningBalances] Erreur:', err.message);
        return {
            success     : false,
            error       : err.message,
            fiscal_year : fiscalYear,
            opening_year: nextYear,
            bilan       : [],
            gestion     : []
        };
    }
}

// =============================================================================
// VÉRIFICATION : Le snapshot est-il valide pour un exercice donné ?
// =============================================================================
async function hasValidSnapshot(companyId, fiscalYear) {
    try {
        const result = await pool.queryWithRetry(
            `SELECT COUNT(*) as count
             FROM fiscal_year_balances
             WHERE company_id  = $1
               AND fiscal_year = $2
               AND is_valid    = TRUE`,
            [companyId, fiscalYear]
        );
        return parseInt(result.rows[0].count, 10) > 0;
    } catch (err) {
        return false;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
    snapshotFiscalYearBalances,
    invalidateSnapshot,
    getPreviousYearBalances,
    computeOpeningBalances,
    hasValidSnapshot
};
