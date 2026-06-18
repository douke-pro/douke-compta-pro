// =============================================================================
// FICHIER : controllers/closingController.js
// Description : Clôture fiscale réelle — Odoo 19 SaaS + Supabase
// Version : V1.3 — Snapshot des soldes de clôture + invalidation sur unlock
// Corrections V1.2 :
//   ✅ Domaine Odoo '|' corrigé — deux appels séparés classes 6 et 7
//   ✅ Appel inutile sur 999999 supprimé
//   ✅ Comparaison lock date normalisée (substring 10)
//   ✅ Vérification suppression lock robuste
// Nouveautés V1.3 :
//   ✅ Import fiscalYearService
//   ✅ finalizeClosing() → snapshot automatique après UPDATE 'closed'
//   ✅ unlockFiscalYear() → invalidation snapshot avant audit UNLOCK_APPLIED
//   ✅ retrySnapshot() → endpoint de relance manuelle du snapshot
//   ✅ getOpeningBalances() → à-nouveaux N+1 calculés depuis snapshot N
// =============================================================================

'use strict';

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

// ✅ V1.3 — Import du service de snapshot fiscal
const {
    snapshotFiscalYearBalances,
    invalidateSnapshot
} = require('../services/fiscalYearService');

// =============================================================================
// COMPTES SYSCOHADA — codes réels de la base doukepro.odoo.com
// =============================================================================
const ACCOUNTS = {
    RESULT_UNAFFECTED : '999999', // Profits/pertes non distribués (pivot Odoo)
    RESULT_PROFIT     : '130100', // Résultat en attente d'affectation : Bénéfice
    RESULT_LOSS       : '130900', // Résultat en attente d'affectation : Perte
    REPORT_A_NOUVEAU  : '121000', // Créancier reporté
    PERTE_A_REPORTER  : '129100', // Perte nette à reporter
    RESERVE_LEGALE    : '111000', // Réserve légale
};

// =============================================================================
// HELPER : Écrire dans le journal d'audit Supabase
// =============================================================================
async function writeAuditLog({
    companyId, fiscalYear, action, performedBy,
    reason = null, odooMoveId = null, odooMoveName = null,
    details = null, ipAddress = null
}) {
    try {
        await pool.queryWithRetry(
            `INSERT INTO closing_audit_log
                (company_id, fiscal_year, action, performed_by, reason,
                 odoo_move_id, odoo_move_name, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                companyId, fiscalYear, action, performedBy, reason,
                odooMoveId, odooMoveName,
                details ? JSON.stringify(details) : null,
                ipAddress
            ]
        );
    } catch (auditErr) {
        // Ne jamais faire échouer l'opération principale à cause de l'audit
        console.error('⚠️ [AUDIT] Échec écriture log:', auditErr.message);
    }
}

// =============================================================================
// HELPER : Récupérer l'ID d'un compte par son code
// =============================================================================
async function getAccountId(accountCode, companyId) {
    const results = await odooExecuteKw({
        uid    : ADMIN_UID_INT,
        model  : 'account.account',
        method : 'search_read',
        args   : [[
            ['code', '=', accountCode],
            ['company_ids', 'in', [companyId]]
        ]],
        kwargs : {
            fields  : ['id', 'name'],
            limit   : 1,
            context : { allowed_company_ids: [companyId] }
        }
    });

    if (!results || results.length === 0) {
        throw new Error(`Compte ${accountCode} introuvable dans le plan comptable.`);
    }
    return results[0].id;
}

// =============================================================================
// HELPER : Récupérer le journal des opérations diverses
// =============================================================================
async function getMiscJournalId(companyId) {
    const results = await odooExecuteKw({
        uid    : ADMIN_UID_INT,
        model  : 'account.journal',
        method : 'search_read',
        args   : [[
            ['type', '=', 'general'],
            ['company_id', '=', companyId]
        ]],
        kwargs : {
            fields  : ['id', 'name', 'code'],
            limit   : 1,
            context : { allowed_company_ids: [companyId] }
        }
    });

    if (!results || results.length === 0) {
        throw new Error('Journal des opérations diverses (type general) introuvable.');
    }
    return results[0].id;
}

// =============================================================================
// HELPER : Extraire l'IP du client
// =============================================================================
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

// =============================================================================
// HELPER : Normaliser une date retournée par Odoo
// Odoo peut retourner '2024-12-31', false, null, ou ''
// =============================================================================
function normalizeLockDate(value) {
    if (!value || value === false || value === '' || value === null) return null;
    return String(value).substring(0, 10);
}

// =============================================================================
// 1. GET /api/closing/status?companyId=X&year=Y
// =============================================================================
exports.getClosingStatus = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.query.companyId);
        const fiscalYear = parseInt(req.query.year) || new Date().getFullYear();

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const result = await pool.queryWithRetry(
            `SELECT * FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2
             LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (result.rows.length === 0) {
            return res.json({
                status : 'success',
                data   : {
                    company_id  : companyId,
                    fiscal_year : fiscalYear,
                    status      : 'open',
                    exists      : false
                }
            });
        }

        res.json({
            status : 'success',
            data   : { ...result.rows[0], exists: true }
        });

    } catch (err) {
        console.error('🚨 [getClosingStatus]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 2. GET /api/closing/pre-checks?companyId=X&year=Y
// ✅ CORRECTION V1.2 : deux appels séparés pour classes 6 et 7
// ✅ CORRECTION V1.2 : appel inutile sur 999999 supprimé
// =============================================================================
exports.runPreChecks = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.query.companyId);
        const fiscalYear = parseInt(req.query.year) || new Date().getFullYear();
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const yearStart = `${fiscalYear}-01-01`;
        const yearEnd   = `${fiscalYear}-12-31`;
        const blocking  = [];
        const warnings  = [];

        const baseFilter = [
            ['company_id',   '=', companyId],
            ['parent_state', '=', 'posted'],
            ['date', '>=', yearStart],
            ['date', '<=', yearEnd]
        ];

        // ── CHECK 1 : Écritures en brouillon ─────────────────────────────────
        const draftMoves = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move',
            method : 'search_read',
            args   : [[
                ['company_id', '=', companyId],
                ['state', '=', 'draft'],
                ['date', '>=', yearStart],
                ['date', '<=', yearEnd]
            ]],
            kwargs : {
                fields  : ['id', 'name', 'date', 'ref'],
                context : { allowed_company_ids: [companyId] }
            }
        });

        if (draftMoves.length > 0) {
            blocking.push({
                code    : 'DRAFT_MOVES',
                label   : `${draftMoves.length} écriture(s) en brouillon sur l'exercice ${fiscalYear}`,
                details : draftMoves.map(m => `${m.name || 'Sans nom'} — ${m.date}`).slice(0, 5),
                count   : draftMoves.length
            });
        }

        // ── CHECK 2a : Produits — comptes classe 7 ────────────────────────────
        const incomeLines = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move.line',
            method : 'search_read',
            args   : [[
                ...baseFilter,
                ['account_id.code', 'like', '7%']
            ]],
            kwargs : {
                fields  : ['debit', 'credit'],
                context : { allowed_company_ids: [companyId] }
            }
        });

        // ── CHECK 2b : Charges — comptes classe 6 ─────────────────────────────
        const expenseLines = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move.line',
            method : 'search_read',
            args   : [[
                ...baseFilter,
                ['account_id.code', 'like', '6%']
            ]],
            kwargs : {
                fields  : ['debit', 'credit'],
                context : { allowed_company_ids: [companyId] }
            }
        });

        let totalProduits = 0;
        let totalCharges  = 0;

        incomeLines.forEach(line => {
            totalProduits += (line.credit || 0) - (line.debit || 0);
        });

        expenseLines.forEach(line => {
            totalCharges += (line.debit || 0) - (line.credit || 0);
        });

        const netResult  = totalProduits - totalCharges;
        const resultType = netResult >= 0 ? 'profit' : 'loss';

        console.log(`📊 [runPreChecks] Produits: ${totalProduits.toFixed(2)} | Charges: ${totalCharges.toFixed(2)} | Résultat: ${netResult.toFixed(2)} XOF`);

        if (netResult === 0) {
            warnings.push({
                code    : 'ZERO_RESULT',
                label   : 'Le résultat calculé est zéro — vérifiez vos saisies avant de clôturer',
                details : [],
                count   : 0
            });
        }

        // ── CHECK 3 : Lignes de trésorerie non réconciliées ───────────────────
        const unreconciledBank = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move.line',
            method : 'search_read',
            args   : [[
                ['company_id',   '=', companyId],
                ['parent_state', '=', 'posted'],
                ['account_id.account_type', 'in', ['asset_cash', 'liability_credit_card']],
                ['reconciled', '=', false],
                ['date', '<=', yearEnd]
            ]],
            kwargs : {
                fields  : ['id', 'account_id', 'date', 'debit', 'credit'],
                limit   : 10,
                context : { allowed_company_ids: [companyId] }
            }
        });

        if (unreconciledBank.length > 0) {
            warnings.push({
                code    : 'UNRECONCILED_BANK',
                label   : `${unreconciledBank.length} ligne(s) de trésorerie non réconciliées`,
                details : [],
                count   : unreconciledBank.length
            });
        }

        // ── CHECK 4 : Comptes d'affectation présents dans le plan comptable ───
        try {
            const accountToCheck = resultType === 'profit'
                ? ACCOUNTS.RESULT_PROFIT
                : ACCOUNTS.RESULT_LOSS;
            await getAccountId(accountToCheck, companyId);
            await getAccountId(ACCOUNTS.RESULT_UNAFFECTED, companyId);
        } catch (accountErr) {
            blocking.push({
                code    : 'MISSING_ACCOUNT',
                label   : `Compte d'affectation manquant : ${accountErr.message}`,
                details : [],
                count   : 1
            });
        }

        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'PRE_CHECK_RUN',
            performedBy : emetteur,
            details     : {
                blocking_count  : blocking.length,
                warning_count   : warnings.length,
                total_produits  : totalProduits,
                total_charges   : totalCharges,
                net_result      : netResult,
                result_type     : resultType
            },
            ipAddress : getClientIp(req)
        });

        console.log(`✅ [runPreChecks] ${fiscalYear} — Résultat: ${netResult.toFixed(2)} XOF (${resultType}) | Bloquants: ${blocking.length} | Warnings: ${warnings.length}`);

        res.json({
            status : 'success',
            data   : {
                fiscal_year : fiscalYear,
                company_id  : companyId,
                blocking    : blocking,
                warnings    : warnings,
                can_proceed : blocking.length === 0,
                result      : {
                    amount         : Math.abs(netResult),
                    raw            : netResult,
                    type           : resultType,
                    display        : `${Math.abs(netResult).toLocaleString('fr-FR')} XOF`,
                    total_produits : totalProduits,
                    total_charges  : totalCharges
                }
            }
        });

    } catch (err) {
        console.error('🚨 [runPreChecks]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 3. POST /api/closing/post-result
// ✅ V1.3 — Validation stricte, gestion d'erreur robuste, transaction sécurisée
// =============================================================================
exports.postResultEntry = async (req, res) => {
    const client = await pool.connect();

    try {
        // ── Validation des entrées ────────────────────────────────────────────
        const companyId    = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear   = parseInt(req.body.fiscal_year);
        const resultAmount = parseFloat(req.body.result_amount);
        const resultType   = String(req.body.result_type || '').toLowerCase().trim();
        const emetteur     = req.user?.name || req.user?.email || 'Admin';

        if (!companyId || isNaN(companyId) || companyId <= 0) {
            return res.status(400).json({
                status : 'error',
                error  : 'companyId invalide (entier positif requis)',
                field  : 'companyId',
                value  : req.body.companyId || req.body.company_id
            });
        }

        if (!fiscalYear || isNaN(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
            return res.status(400).json({
                status : 'error',
                error  : 'fiscal_year invalide (année entre 2000 et 2100 requise)',
                field  : 'fiscal_year',
                value  : req.body.fiscal_year
            });
        }

        if (isNaN(resultAmount) || resultAmount <= 0) {
            return res.status(400).json({
                status : 'error',
                error  : 'result_amount invalide (nombre strictement positif requis)',
                field  : 'result_amount',
                value  : req.body.result_amount
            });
        }

        if (!['profit', 'loss'].includes(resultType)) {
            return res.status(400).json({
                status : 'error',
                error  : `result_type invalide : "${req.body.result_type}" (valeurs acceptées : "profit" ou "loss")`,
                field  : 'result_type',
                value  : req.body.result_type
            });
        }

        // ── Vérification état de clôture avec lock transactionnel ─────────────
        await client.query('BEGIN');

        const existing = await client.query(
            `SELECT status, result_move_name, result_move_id
             FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2
             FOR UPDATE`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length > 0) {
            const currentStatus = existing.rows[0].status;
            if (['result_posted', 'locked', 'closed'].includes(currentStatus)) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    status  : 'error',
                    error   : `L'écriture de résultat pour l'exercice ${fiscalYear} existe déjà.`,
                    details : {
                        current_status : currentStatus,
                        existing_move  : existing.rows[0].result_move_name,
                        move_id        : existing.rows[0].result_move_id
                    }
                });
            }
        }

        // ── Récupération journal Odoo ─────────────────────────────────────────
        const yearEnd = `${fiscalYear}-12-31`;

        let journalId;
        try {
            journalId = await Promise.race([
                getMiscJournalId(companyId),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout récupération journal (15s)')), 15000)
                )
            ]);
        } catch (journalErr) {
            await client.query('ROLLBACK');
            console.error('🚨 [postResultEntry] Échec récupération journal:', journalErr.message);
            return res.status(500).json({
                status : 'error',
                error  : `Impossible de récupérer le journal des opérations diverses : ${journalErr.message}`,
                hint   : 'Vérifiez qu\'un journal de type "general" existe dans Odoo pour cette entreprise.'
            });
        }

        // ── Détermination des comptes selon profit/loss ───────────────────────
        let debitAccountCode, creditAccountCode;
        if (resultType === 'profit') {
            debitAccountCode  = ACCOUNTS.RESULT_UNAFFECTED;
            creditAccountCode = ACCOUNTS.RESULT_PROFIT;
        } else {
            debitAccountCode  = ACCOUNTS.RESULT_LOSS;
            creditAccountCode = ACCOUNTS.RESULT_UNAFFECTED;
        }

        let debitAccountId, creditAccountId;
        try {
            [debitAccountId, creditAccountId] = await Promise.all([
                Promise.race([
                    getAccountId(debitAccountCode, companyId),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout compte ${debitAccountCode}`)), 10000)
                    )
                ]),
                Promise.race([
                    getAccountId(creditAccountCode, companyId),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout compte ${creditAccountCode}`)), 10000)
                    )
                ])
            ]);
        } catch (accountErr) {
            await client.query('ROLLBACK');
            console.error('🚨 [postResultEntry] Échec récupération comptes:', accountErr.message);
            return res.status(500).json({
                status : 'error',
                error  : `Compte comptable manquant : ${accountErr.message}`,
                hint   : `Vérifiez que les comptes ${debitAccountCode} et ${creditAccountCode} existent dans le plan comptable Odoo.`
            });
        }

        // ── Création de l'écriture dans Odoo ─────────────────────────────────
        const libelle  = `Affectation résultat ${fiscalYear} — ${resultType === 'profit' ? 'Bénéfice' : 'Perte'}`;
        const moveData = {
            company_id : companyId,
            journal_id : journalId,
            date       : yearEnd,
            ref        : `${libelle} | Par : ${emetteur}`,
            narration  : `Clôture exercice ${fiscalYear} — ${resultType === 'profit' ? 'Bénéfice' : 'Perte'} de ${resultAmount.toLocaleString('fr-FR')} XOF — Saisie par : ${emetteur}`,
            move_type  : 'entry',
            line_ids   : [
                [0, 0, {
                    account_id : debitAccountId,
                    name       : libelle,
                    debit      : resultAmount,
                    credit     : 0
                }],
                [0, 0, {
                    account_id : creditAccountId,
                    name       : libelle,
                    debit      : 0,
                    credit     : resultAmount
                }]
            ]
        };

        let moveId;
        try {
            moveId = await Promise.race([
                odooExecuteKw({
                    uid    : ADMIN_UID_INT,
                    model  : 'account.move',
                    method : 'create',
                    args   : [moveData],
                    kwargs : { context: { allowed_company_ids: [companyId] } }
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout création écriture (20s)')), 20000)
                )
            ]);
        } catch (createErr) {
            await client.query('ROLLBACK');
            console.error('🚨 [postResultEntry] Échec création écriture:', createErr.message);
            return res.status(500).json({
                status : 'error',
                error  : `Échec création de l'écriture dans Odoo : ${createErr.message}`
            });
        }

        // ── Validation de l'écriture ──────────────────────────────────────────
        try {
            await Promise.race([
                odooExecuteKw({
                    uid    : ADMIN_UID_INT,
                    model  : 'account.move',
                    method : 'action_post',
                    args   : [[moveId]],
                    kwargs : { context: { allowed_company_ids: [companyId] } }
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout validation écriture (15s)')), 15000)
                )
            ]);
        } catch (postErr) {
            console.error('🚨 [postResultEntry] Échec validation:', postErr.message);
            try {
                await odooExecuteKw({
                    uid    : ADMIN_UID_INT,
                    model  : 'account.move',
                    method : 'unlink',
                    args   : [[moveId]],
                    kwargs : {}
                });
                console.log(`🗑️  [postResultEntry] Écriture ${moveId} supprimée (validation échouée)`);
            } catch (unlinkErr) {
                console.error('🚨 [postResultEntry] Impossible de supprimer l\'écriture en brouillon:', unlinkErr.message);
            }
            await client.query('ROLLBACK');
            return res.status(500).json({
                status  : 'error',
                error   : `L'écriture a été créée mais sa validation a échoué : ${postErr.message}`,
                hint    : 'Vérifiez l\'écriture manuellement dans Odoo (peut être en brouillon).',
                move_id : moveId
            });
        }

        // ── Lecture du nom de l'écriture ──────────────────────────────────────
        let moveName;
        try {
            const moveRecord = await Promise.race([
                odooExecuteKw({
                    uid    : ADMIN_UID_INT,
                    model  : 'account.move',
                    method : 'read',
                    args   : [[moveId], ['name']],
                    kwargs : {}
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout lecture nom écriture')), 10000)
                )
            ]);
            moveName = moveRecord?.[0]?.name || `MISC/${fiscalYear}/${moveId}`;
        } catch (readErr) {
            console.warn('⚠️ [postResultEntry] Impossible de lire le nom:', readErr.message);
            moveName = `MISC/${fiscalYear}/${moveId}`;
        }

        // ── Sauvegarde dans Supabase ──────────────────────────────────────────
        if (existing.rows.length === 0) {
            await client.query(
                `INSERT INTO fiscal_year_closings
                    (company_id, fiscal_year, status, result_amount, result_type,
                     result_move_id, result_move_name, debit_account, credit_account,
                     initiated_by, initiated_at)
                 VALUES ($1, $2, 'result_posted', $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [
                    companyId, fiscalYear, resultAmount, resultType,
                    moveId, moveName, debitAccountCode, creditAccountCode,
                    emetteur
                ]
            );
        } else {
            await client.query(
                `UPDATE fiscal_year_closings
                 SET status           = 'result_posted',
                     result_amount    = $1,
                     result_type      = $2,
                     result_move_id   = $3,
                     result_move_name = $4,
                     debit_account    = $5,
                     credit_account   = $6,
                     initiated_by     = $7,
                     initiated_at     = NOW()
                 WHERE company_id = $8 AND fiscal_year = $9`,
                [
                    resultAmount, resultType, moveId, moveName,
                    debitAccountCode, creditAccountCode, emetteur,
                    companyId, fiscalYear
                ]
            );
        }

        await client.query('COMMIT');

        const auditResult = await writeAuditLog({
            companyId,
            fiscalYear,
            action       : 'RESULT_POSTED',
            performedBy  : emetteur,
            odooMoveId   : moveId,
            odooMoveName : moveName,
            details      : {
                result_amount : resultAmount,
                result_type   : resultType,
                debit         : debitAccountCode,
                credit        : creditAccountCode
            },
            ipAddress : getClientIp(req)
        });

        if (!auditResult?.success) {
            console.warn('⚠️ [postResultEntry] Audit échoué mais opération effectuée:', auditResult?.error);
        }

        console.log(`✅ [postResultEntry] ${moveName} validée — Exercice ${fiscalYear} — ${emetteur}`);

        res.status(201).json({
            status      : 'success',
            move_id     : moveId,
            move_name   : moveName,
            fiscal_year : fiscalYear,
            result_type : resultType,
            amount      : resultAmount,
            debit       : debitAccountCode,
            credit      : creditAccountCode,
            message     : `Écriture ${moveName} créée et validée par ${emetteur}.`,
            audit       : auditResult?.success ? 'ok' : 'partial'
        });

    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('🚨 [postResultEntry] Échec ROLLBACK:', rollbackErr.message);
        }
        console.error('🚨 [postResultEntry] Erreur critique:', err.message, err.stack);
        res.status(500).json({
            status : 'error',
            error  : `Échec affectation résultat : ${err.message}`,
            type   : err.name,
            hint   : 'Consultez les logs serveur pour plus de détails.'
        });
    } finally {
        client.release();
    }
};

// =============================================================================
// 4. POST /api/closing/lock
// ✅ CORRECTION V1.2 : comparaison lock date normalisée
// =============================================================================
exports.lockFiscalYear = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const existing = await pool.queryWithRetry(
            `SELECT status, result_move_name FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2 LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length === 0 || existing.rows[0].status === 'open') {
            return res.status(400).json({
                status : 'error',
                error  : 'Impossible de verrouiller : passez d\'abord l\'écriture de résultat (étape 2).'
            });
        }

        if (['locked', 'closed'].includes(existing.rows[0].status)) {
            return res.status(409).json({
                status : 'error',
                error  : `L'exercice ${fiscalYear} est déjà verrouillé.`
            });
        }

        const lockDate = `${fiscalYear}-12-31`;

        await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'write',
            args   : [[companyId], { fiscalyear_lock_date: lockDate }],
            kwargs : {}
        });

        const companyCheck = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'read',
            args   : [[companyId], ['fiscalyear_lock_date']],
            kwargs : {}
        });

        const appliedLock = normalizeLockDate(companyCheck?.[0]?.fiscalyear_lock_date);

        if (appliedLock !== lockDate) {
            throw new Error(
                `Vérification échouée — Odoo retourne : "${companyCheck?.[0]?.fiscalyear_lock_date}" au lieu de "${lockDate}"`
            );
        }

        await pool.queryWithRetry(
            `UPDATE fiscal_year_closings
             SET status = 'locked', lock_date = $1, lock_applied_at = NOW()
             WHERE company_id = $2 AND fiscal_year = $3`,
            [lockDate, companyId, fiscalYear]
        );

        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'YEAR_LOCKED',
            performedBy : emetteur,
            details     : { lock_date: lockDate, odoo_verified: true },
            ipAddress   : getClientIp(req)
        });

        console.log(`✅ [lockFiscalYear] Exercice ${fiscalYear} verrouillé dans Odoo — ${emetteur}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            lock_date   : lockDate,
            verified    : true,
            message     : `Exercice ${fiscalYear} verrouillé dans Odoo jusqu'au ${lockDate} par ${emetteur}.`
        });

    } catch (err) {
        console.error('🚨 [lockFiscalYear]', err.message);
        res.status(500).json({
            status : 'error',
            error  : `Échec verrouillage : ${err.message}`
        });
    }
};

// =============================================================================
// 5. POST /api/closing/finalize
// ✅ V1.3 : Snapshot automatique des soldes après finalisation
// =============================================================================
exports.finalizeClosing = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const notes      = req.body.notes?.trim() || '';
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        // ── Mise à jour statut Supabase (identique V1.2) ─────────────────────
        const result = await pool.queryWithRetry(
            `UPDATE fiscal_year_closings
             SET status = 'closed', closed_at = NOW(), notes = $1
             WHERE company_id = $2 AND fiscal_year = $3
               AND status = 'locked'
             RETURNING *`,
            [notes, companyId, fiscalYear]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                status : 'error',
                error  : `Impossible de finaliser : l'exercice ${fiscalYear} n'est pas dans l'état 'locked'.`
            });
        }

        // ── ✅ V1.3 : Snapshot des soldes de clôture ─────────────────────────
        // Photographie tous les soldes au 31/12/N dans fiscal_year_balances.
        // Non bloquant : si le snapshot échoue, la clôture reste effective.
        // L'admin peut relancer via POST /api/closing/snapshot si nécessaire.
        let snapshotResult = null;
        try {
            snapshotResult = await snapshotFiscalYearBalances(companyId, fiscalYear, emetteur);
            console.log(`✅ [finalizeClosing] Snapshot : ${snapshotResult.count} comptes sauvegardés`);
        } catch (snapshotErr) {
            console.error('⚠️ [finalizeClosing] Snapshot échoué (non bloquant):', snapshotErr.message);
            snapshotResult = { success: false, error: snapshotErr.message, count: 0 };
        }

        // ── Audit (enrichi avec info snapshot) ───────────────────────────────
        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'CLOSING_FINALIZED',
            performedBy : emetteur,
            details     : {
                notes,
                snapshot_count   : snapshotResult?.count   || 0,
                snapshot_success : snapshotResult?.success || false,
                snapshot_error   : snapshotResult?.error   || null
            },
            ipAddress : getClientIp(req)
        });

        console.log(`✅ [finalizeClosing] Exercice ${fiscalYear} finalisé — ${emetteur}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            snapshot    : {
                success : snapshotResult?.success || false,
                count   : snapshotResult?.count   || 0,
                warning : snapshotResult?.success
                    ? null
                    : 'Snapshot des soldes incomplet — relancez via POST /api/closing/snapshot si nécessaire.'
            },
            message : `Clôture de l'exercice ${fiscalYear} finalisée et archivée.`
        });

    } catch (err) {
        console.error('🚨 [finalizeClosing]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 6. POST /api/closing/unlock
// ✅ CORRECTION V1.2 : vérification suppression lock robuste
// ✅ V1.3 : Invalidation du snapshot lors du déverrouillage
// =============================================================================
exports.unlockFiscalYear = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const reason     = req.body.reason?.trim();
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        if (!reason || reason.length < 10) {
            return res.status(400).json({
                status : 'error',
                error  : 'Le motif de déverrouillage est obligatoire (minimum 10 caractères).'
            });
        }

        const existing = await pool.queryWithRetry(
            `SELECT status, lock_date FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2 LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                status : 'error',
                error  : `Aucune clôture trouvée pour l'exercice ${fiscalYear}.`
            });
        }

        const currentStatus = existing.rows[0].status;

        if (currentStatus === 'closed') {
            return res.status(403).json({
                status : 'error',
                error  : `L'exercice ${fiscalYear} est finalisé — déverrouillage impossible.`
            });
        }

        if (currentStatus !== 'locked') {
            return res.status(400).json({
                status : 'error',
                error  : `L'exercice ${fiscalYear} n'est pas verrouillé (statut actuel: ${currentStatus}).`
            });
        }

        // ── Audit AVANT l'action ──────────────────────────────────────────────
        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'UNLOCK_REQUESTED',
            performedBy : emetteur,
            reason      : reason,
            details     : {
                previous_status : currentStatus,
                previous_lock   : existing.rows[0].lock_date
            },
            ipAddress : getClientIp(req)
        });

        // ── Retrait du lock dans Odoo ─────────────────────────────────────────
        await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'write',
            args   : [[companyId], { fiscalyear_lock_date: false }],
            kwargs : {}
        });

        const companyCheck = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'read',
            args   : [[companyId], ['fiscalyear_lock_date']],
            kwargs : {}
        });

        const lockAfterNormalized = normalizeLockDate(companyCheck?.[0]?.fiscalyear_lock_date);

        if (lockAfterNormalized !== null) {
            throw new Error(
                `Déverrouillage échoué — Odoo retourne encore : "${companyCheck?.[0]?.fiscalyear_lock_date}"`
            );
        }

        // ── Mise à jour Supabase ──────────────────────────────────────────────
        await pool.queryWithRetry(
            `UPDATE fiscal_year_closings
             SET status          = 'result_posted',
                 lock_date       = NULL,
                 lock_applied_at = NULL
             WHERE company_id = $1 AND fiscal_year = $2`,
            [companyId, fiscalYear]
        );

        // ── ✅ V1.3 : Invalidation du snapshot ───────────────────────────────
        // Les écritures vont changer → le snapshot N n'est plus fiable.
        // Il sera refait automatiquement à la prochaine finalisation.
        await invalidateSnapshot(companyId, fiscalYear, emetteur);

        // ── Audit APRÈS l'action ──────────────────────────────────────────────
        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'UNLOCK_APPLIED',
            performedBy : emetteur,
            reason      : reason,
            details     : {
                odoo_lock_removed  : true,
                odoo_verified      : true,
                snapshot_invalidated: true
            },
            ipAddress : getClientIp(req)
        });

        console.log(`⚠️ [unlockFiscalYear] Exercice ${fiscalYear} DÉVERROUILLÉ par ${emetteur} — Motif: ${reason}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            unlocked_by : emetteur,
            reason      : reason,
            message     : `Exercice ${fiscalYear} déverrouillé. Effectuez vos corrections puis re-verrouillez.`,
            warning     : 'Les écritures sur cette période sont à nouveau modifiables dans Odoo. Le snapshot des soldes a été invalidé.'
        });

    } catch (err) {
        console.error('🚨 [unlockFiscalYear]', err.message);
        res.status(500).json({
            status : 'error',
            error  : `Échec déverrouillage : ${err.message}`
        });
    }
};

// =============================================================================
// 7. POST /api/closing/relock
// ✅ CORRECTION V1.2 : comparaison lock date normalisée
// =============================================================================
exports.relockFiscalYear = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const notes      = req.body.notes?.trim() || '';
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const existing = await pool.queryWithRetry(
            `SELECT status FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2 LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length === 0 || existing.rows[0].status !== 'result_posted') {
            return res.status(400).json({
                status : 'error',
                error  : `Re-verrouillage impossible — statut actuel: ${existing.rows[0]?.status || 'inconnu'}. L'exercice doit être dans l'état 'result_posted'.`
            });
        }

        const lockDate = `${fiscalYear}-12-31`;

        await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'write',
            args   : [[companyId], { fiscalyear_lock_date: lockDate }],
            kwargs : {}
        });

        const companyCheck = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'read',
            args   : [[companyId], ['fiscalyear_lock_date']],
            kwargs : {}
        });

        const appliedLock = normalizeLockDate(companyCheck?.[0]?.fiscalyear_lock_date);

        if (appliedLock !== lockDate) {
            throw new Error(
                `Re-verrouillage échoué — Odoo retourne : "${companyCheck?.[0]?.fiscalyear_lock_date}"`
            );
        }

        await pool.queryWithRetry(
            `UPDATE fiscal_year_closings
             SET status          = 'locked',
                 lock_date       = $1,
                 lock_applied_at = NOW(),
                 notes           = CASE
                     WHEN notes IS NULL OR notes = '' THEN $2
                     ELSE notes || ' | ' || $2
                 END
             WHERE company_id = $3 AND fiscal_year = $4`,
            [
                lockDate,
                notes ? `Re-lock: ${notes}` : `Re-lock après correction par ${emetteur}`,
                companyId,
                fiscalYear
            ]
        );

        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'RELOCK_APPLIED',
            performedBy : emetteur,
            details     : { lock_date: lockDate, notes, odoo_verified: true },
            ipAddress   : getClientIp(req)
        });

        console.log(`✅ [relockFiscalYear] Exercice ${fiscalYear} RE-VERROUILLÉ par ${emetteur}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            lock_date   : lockDate,
            message     : `Exercice ${fiscalYear} re-verrouillé après correction par ${emetteur}.`
        });

    } catch (err) {
        console.error('🚨 [relockFiscalYear]', err.message);
        res.status(500).json({
            status : 'error',
            error  : `Échec re-verrouillage : ${err.message}`
        });
    }
};

// =============================================================================
// 8. GET /api/closing/audit-log?companyId=X&year=Y
// =============================================================================
exports.getAuditLog = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.query.companyId);
        const fiscalYear = parseInt(req.query.year) || new Date().getFullYear();

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const result = await pool.queryWithRetry(
            `SELECT
                id, action, performed_by, performed_at,
                reason, odoo_move_id, odoo_move_name,
                details, ip_address
             FROM closing_audit_log
             WHERE company_id = $1 AND fiscal_year = $2
             ORDER BY performed_at DESC`,
            [companyId, fiscalYear]
        );

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            company_id  : companyId,
            count       : result.rows.length,
            data        : result.rows
        });

    } catch (err) {
        console.error('🚨 [getAuditLog]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 9. GET /api/closing/available-years?companyId=X
// =============================================================================
exports.getAvailableYears = async (req, res) => {
    try {
        const companyId = req.validatedCompanyId || parseInt(req.query.companyId);

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        const existing = await pool.queryWithRetry(
            `SELECT fiscal_year, status, result_type, result_amount,
                    result_move_name, lock_date, closed_at
             FROM fiscal_year_closings
             WHERE company_id = $1
             ORDER BY fiscal_year DESC`,
            [companyId]
        );

        const currentYear   = new Date().getFullYear();
        const prevYear      = currentYear - 1;
        const existingYears = existing.rows.map(r => r.fiscal_year);
        const years         = [...existing.rows];

        if (!existingYears.includes(currentYear)) {
            years.unshift({
                fiscal_year: currentYear, status: 'open',
                result_type: null, result_amount: null,
                result_move_name: null, lock_date: null, closed_at: null
            });
        }

        if (!existingYears.includes(prevYear)) {
            years.push({
                fiscal_year: prevYear, status: 'open',
                result_type: null, result_amount: null,
                result_move_name: null, lock_date: null, closed_at: null
            });
        }

        console.log(`✅ [getAvailableYears] ${years.length} exercice(s) pour company ${companyId}`);

        res.json({
            status     : 'success',
            company_id : companyId,
            count      : years.length,
            data       : years
        });

    } catch (err) {
        console.error('🚨 [getAvailableYears]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 10. POST /api/closing/snapshot  ← NOUVEAU V1.3
// Relance manuelle du snapshot si la finalisation l'avait raté
// Accès : ADMIN uniquement
// =============================================================================
exports.retrySnapshot = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const emetteur   = req.user?.name || req.user?.email || 'Admin';

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        if (!fiscalYear || isNaN(fiscalYear)) {
            return res.status(400).json({ status: 'error', error: 'fiscal_year requis.' });
        }

        // Vérifier que l'exercice est bien clôturé
        const existing = await pool.queryWithRetry(
            `SELECT status FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2 LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length === 0 || existing.rows[0].status !== 'closed') {
            return res.status(400).json({
                status  : 'error',
                error   : `L'exercice ${fiscalYear} doit être clôturé (statut 'closed') pour lancer un snapshot.`,
                current : existing.rows[0]?.status || 'inexistant'
            });
        }

        const result = await snapshotFiscalYearBalances(companyId, fiscalYear, emetteur);

        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'SNAPSHOT_RETRY',
            performedBy : emetteur,
            details     : { count: result.count },
            ipAddress   : getClientIp(req)
        });

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            count       : result.count,
            message     : `Snapshot relancé avec succès — ${result.count} comptes sauvegardés.`
        });

    } catch (err) {
        console.error('🚨 [retrySnapshot]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 11. GET /api/closing/opening-balances?companyId=X&year=Y  ← NOUVEAU V1.3
// Retourne les à-nouveaux N+1 calculés depuis le snapshot N
// year = exercice CLÔTURÉ (ex: 2024 → retourne les ouvertures 2025)
// Accès : ADMIN, COLLABORATEUR
// =============================================================================
exports.getOpeningBalances = async (req, res) => {
    try {
        const companyId  = req.validatedCompanyId || parseInt(req.query.companyId);
        const fiscalYear = parseInt(req.query.year) || new Date().getFullYear() - 1;

        if (!companyId) {
            return res.status(400).json({ status: 'error', error: 'companyId requis.' });
        }

        if (!fiscalYear || isNaN(fiscalYear)) {
            return res.status(400).json({ status: 'error', error: 'year requis (exercice clôturé).' });
        }

        const { computeOpeningBalances } = require('../services/fiscalYearService');
        const result = await computeOpeningBalances(companyId, fiscalYear);

        if (!result.success) {
            return res.status(404).json({ status: 'error', error: result.error });
        }

        res.json({ status: 'success', data: result });

    } catch (err) {
        console.error('🚨 [getOpeningBalances]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};
