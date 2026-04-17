// =============================================================================
// FICHIER : controllers/closingController.js
// Description : Clôture fiscale réelle — Odoo 19 SaaS + Supabase
// Version : V1.2 — Corrections post-audit
// Corrections V1.2 :
//   ✅ Domaine Odoo '|' corrigé — deux appels séparés classes 6 et 7
//   ✅ Appel inutile sur 999999 supprimé
//   ✅ Comparaison lock date normalisée (substring 10)
//   ✅ Vérification suppression lock robuste
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../services/dbService');

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

        // ── Filtre de base commun à plusieurs requêtes ────────────────────────
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
        // ✅ CORRECTION : appel séparé au lieu du domaine '|' mal formé
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
        // ✅ CORRECTION : appel séparé au lieu du domaine '|' mal formé
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

        // Calcul du résultat net
        // Produits = crédits classe 7 - débits classe 7
        // Charges  = débits classe 6 - crédits classe 6
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

        // ── Audit ─────────────────────────────────────────────────────────────
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
                    amount          : Math.abs(netResult),
                    raw             : netResult,
                    type            : resultType,
                    display         : `${Math.abs(netResult).toLocaleString('fr-FR')} XOF`,
                    total_produits  : totalProduits,
                    total_charges   : totalCharges
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
// =============================================================================
exports.postResultEntry = async (req, res) => {
    try {
        const companyId    = req.validatedCompanyId || parseInt(req.body.companyId || req.body.company_id);
        const fiscalYear   = parseInt(req.body.fiscal_year) || new Date().getFullYear();
        const resultAmount = parseFloat(req.body.result_amount);
        const resultType   = req.body.result_type;
        const emetteur     = req.user?.name || req.user?.email || 'Admin';

        if (!companyId || isNaN(resultAmount) || !resultType) {
            return res.status(400).json({
                status : 'error',
                error  : 'Données incomplètes : companyId, result_amount, result_type requis.'
            });
        }

        if (!['profit', 'loss'].includes(resultType)) {
            return res.status(400).json({
                status : 'error',
                error  : 'result_type invalide — valeurs acceptées : profit | loss'
            });
        }

        if (resultAmount <= 0) {
            return res.status(400).json({
                status : 'error',
                error  : 'result_amount doit être positif.'
            });
        }

        // Vérifier qu'une clôture n'existe pas déjà à ce stade
        const existing = await pool.queryWithRetry(
            `SELECT status FROM fiscal_year_closings
             WHERE company_id = $1 AND fiscal_year = $2 LIMIT 1`,
            [companyId, fiscalYear]
        );

        if (existing.rows.length > 0 &&
            ['result_posted', 'locked', 'closed'].includes(existing.rows[0].status)) {
            return res.status(409).json({
                status : 'error',
                error  : `L'écriture de résultat pour ${fiscalYear} existe déjà (statut: ${existing.rows[0].status}).`
            });
        }

        const yearEnd   = `${fiscalYear}-12-31`;
        const journalId = await getMiscJournalId(companyId);

        // Comptes selon bénéfice ou perte
        let debitAccountCode, creditAccountCode;
        if (resultType === 'profit') {
            // Bénéfice : Débit 999999 (solde le pivot) / Crédit 130100
            debitAccountCode  = ACCOUNTS.RESULT_UNAFFECTED;
            creditAccountCode = ACCOUNTS.RESULT_PROFIT;
        } else {
            // Perte : Débit 130900 / Crédit 999999 (solde le pivot)
            debitAccountCode  = ACCOUNTS.RESULT_LOSS;
            creditAccountCode = ACCOUNTS.RESULT_UNAFFECTED;
        }

        const debitAccountId  = await getAccountId(debitAccountCode,  companyId);
        const creditAccountId = await getAccountId(creditAccountCode, companyId);

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

        const moveId = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move',
            method : 'create',
            args   : [moveData],
            kwargs : { context: { allowed_company_ids: [companyId] } }
        });

        await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move',
            method : 'action_post',
            args   : [[moveId]],
            kwargs : { context: { allowed_company_ids: [companyId] } }
        });

        const moveRecord = await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'account.move',
            method : 'read',
            args   : [[moveId], ['name']],
            kwargs : {}
        });
        const moveName = moveRecord?.[0]?.name || `MISC-${moveId}`;

        // Sauvegarder dans Supabase
        await pool.queryWithRetry(
            `INSERT INTO fiscal_year_closings
                (company_id, fiscal_year, status, result_amount, result_type,
                 result_move_id, result_move_name, debit_account, credit_account,
                 initiated_by, initiated_at)
             VALUES ($1, $2, 'result_posted', $3, $4, $5, $6, $7, $8, $9, NOW())
             ON CONFLICT (company_id, fiscal_year)
             DO UPDATE SET
                status           = 'result_posted',
                result_amount    = $3,
                result_type      = $4,
                result_move_id   = $5,
                result_move_name = $6,
                debit_account    = $7,
                credit_account   = $8,
                initiated_by     = $9`,
            [
                companyId, fiscalYear, resultAmount, resultType,
                moveId, moveName, debitAccountCode, creditAccountCode,
                emetteur
            ]
        );

        await writeAuditLog({
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
            message     : `Écriture ${moveName} créée et validée par ${emetteur}.`
        });

    } catch (err) {
        console.error('🚨 [postResultEntry]', err.message);
        res.status(500).json({
            status : 'error',
            error  : `Échec affectation résultat : ${err.message}`
        });
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

        // ✅ CORRECTION : normalisation avant comparaison
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

        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'CLOSING_FINALIZED',
            performedBy : emetteur,
            details     : { notes },
            ipAddress   : getClientIp(req)
        });

        console.log(`✅ [finalizeClosing] Exercice ${fiscalYear} finalisé — ${emetteur}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            message     : `Clôture de l'exercice ${fiscalYear} finalisée et archivée.`
        });

    } catch (err) {
        console.error('🚨 [finalizeClosing]', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
};

// =============================================================================
// 6. POST /api/closing/unlock
// ✅ CORRECTION V1.2 : vérification suppression lock robuste
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

        // Audit AVANT l'action
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

        // Retirer le lock dans Odoo
        await odooExecuteKw({
            uid    : ADMIN_UID_INT,
            model  : 'res.company',
            method : 'write',
            args   : [[companyId], { fiscalyear_lock_date: false }],
            kwargs : {}
        });

        // ✅ CORRECTION : vérification robuste de la suppression du lock
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

        await pool.queryWithRetry(
            `UPDATE fiscal_year_closings
             SET status = 'result_posted',
                 lock_date = NULL,
                 lock_applied_at = NULL
             WHERE company_id = $1 AND fiscal_year = $2`,
            [companyId, fiscalYear]
        );

        // Audit APRÈS l'action
        await writeAuditLog({
            companyId,
            fiscalYear,
            action      : 'UNLOCK_APPLIED',
            performedBy : emetteur,
            reason      : reason,
            details     : { odoo_lock_removed: true, odoo_verified: true },
            ipAddress   : getClientIp(req)
        });

        console.log(`⚠️ [unlockFiscalYear] Exercice ${fiscalYear} DÉVERROUILLÉ par ${emetteur} — Motif: ${reason}`);

        res.json({
            status      : 'success',
            fiscal_year : fiscalYear,
            unlocked_by : emetteur,
            reason      : reason,
            message     : `Exercice ${fiscalYear} déverrouillé. Effectuez vos corrections puis re-verrouillez.`,
            warning     : 'Les écritures sur cette période sont à nouveau modifiables dans Odoo.'
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

        // ✅ CORRECTION : normalisation avant comparaison
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
